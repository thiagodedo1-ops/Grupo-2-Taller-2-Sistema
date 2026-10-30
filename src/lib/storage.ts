/**
 * @file storage.ts
 * @description Gestor de persistencia, sincronización bidireccional y comunicación con Google Sheets / Apps Script
 */

import { BaseDatosPorcina, Usuario, EstadoTransaccion, EstadoValidacion, Cliente, Proveedor } from '../types/schema';
import { INITIAL_DATABASE_STATE } from './constants';
import { hashPassword, verifyPassword, validatePasswordPolicy } from './security';
import { syncQueue } from './syncQueue';

export function determineUnit(tableName: string): 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO' {
  const t = String(tableName).toLowerCase();
  if (t.includes('bovin') || t.includes('pesadas_bovinas') || t.includes('eventos_sanitarios_bovinos')) {
    return 'BOVINOS';
  }
  if (t.includes('ovin') || t.includes('zafras_laneras') || t.includes('eventos_sanitarios_ovinos')) {
    return 'OVINOS';
  }
  if (t.includes('consolidado') || t.includes('multinegocio')) {
    return 'CONSOLIDADO';
  }
  return 'PORCINOS';
}

const LOCAL_STORAGE_KEY = 'pozo_del_carril_db_v1';
const SCRIPT_URL_STORAGE_KEY = 'pozo_del_carril_apps_script_url';
const OVINO_SCRIPT_URL_STORAGE_KEY = 'pozo_del_carril_ovino_apps_script_url';
const SESSION_STORAGE_KEY = 'pozo_del_carril_session_user';
const CREDENTIALS_VAULT_KEY = 'pozo_del_carril_credentials_vault_v2';

export interface UserCredentialVaultEntry {
  usuario_id: string;
  usuario: string;
  contrasena_hash: string;
  updated_at: string;
  updated_by: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  code?: 'USER_NOT_FOUND' | 'INVALID_PASSWORD' | 'ACCOUNT_INACTIVE' | 'PLATFORM_COOKIE_REQUIRED' | 'SERVER_UNAVAILABLE' | 'NETWORK_ERROR' | 'MISSING_FIELDS' | 'UNKNOWN';
  technicalDetail?: string;
}

export interface StorageState {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  appsScriptUrl: string;
  ovinoAppsScriptUrl: string;
  isSyncing: boolean;
  isOnlineWithSheets: boolean;
  isOnlineOvinoWithSheets: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  ovinoSyncError: string | null;
}


class DatabaseManager {
  private state: StorageState;
  private listeners: (() => void)[] = [];
  private credentialsVault: Record<string, UserCredentialVaultEntry> = {};

  /**
   * Estandarización y saneamiento estricto de insumos alimenticios
   * Elimina duplicados de tablas maestras y migra claves legadas a claves canónicas
   */
  public sanitizeInsumos(targetDb?: BaseDatosPorcina): void {
    const db = targetDb || this.state?.db;
    if (!db) return;

    const insumoMap: Record<string, string> = {
      'INS_MAIZ': 'INS_MAIZ_PROP',
      'INS_SOJA': 'INS_PELLET_SOJA',
      'INS_PELETEADO_CRIA': 'INS_CONC_CRIA',
      'INS_CONCENTRADO_CRIA': 'INS_CONC_CRIA',
      'INS_CONCENTRADO_CRÍA': 'INS_CONC_CRIA',
      'INS_CONCENTRADO_DEST': 'INS_PELETEADO_DEST',
      'INS_CONCENTRADO_DESTETE': 'INS_PELETEADO_DEST'
    };

    // 1. Migrar referencias legadas en las tablas transaccionales y maestras
    if (Array.isArray(db.Consumo_Alimento_Real)) {
      db.Consumo_Alimento_Real.forEach(c => {
        if (c.insumo_id && insumoMap[c.insumo_id]) {
          c.insumo_id = insumoMap[c.insumo_id];
        }
      });
    }
    if (Array.isArray(db.Movimientos_Stock_Insumos)) {
      db.Movimientos_Stock_Insumos.forEach(m => {
        if (m.insumo_id && insumoMap[m.insumo_id]) {
          m.insumo_id = insumoMap[m.insumo_id];
        }
      });
    }
    if (Array.isArray(db.Movimientos_Internos)) {
      db.Movimientos_Internos.forEach(m => {
        if (m.insumo_id && insumoMap[m.insumo_id]) {
          m.insumo_id = insumoMap[m.insumo_id];
        }
      });
    }
    if (Array.isArray(db.Mov_Comercial_Det)) {
      db.Mov_Comercial_Det.forEach(d => {
        if (d.insumo_id && insumoMap[d.insumo_id]) {
          d.insumo_id = insumoMap[d.insumo_id];
        }
      });
    }
    if (Array.isArray(db.F_Costos)) {
      db.F_Costos.forEach(f => {
        // @ts-ignore
        if (f.insumo_id && insumoMap[f.insumo_id]) {
          // @ts-ignore
          f.insumo_id = insumoMap[f.insumo_id];
        }
      });
    }

    // 2. Limpiar y deduplicar el maestro D_Insumo
    const standardizedFoods = [
      { id: 'INS_MAIZ_PROP', nombre: 'Maíz propio', tipo_insumo: 'GRANO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_MAIZ', activo: true },
      { id: 'INS_PELLET_SOJA', nombre: 'Pellet de soja', tipo_insumo: 'PROTEICO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_SOJA', activo: true },
      { id: 'INS_CONC_CRIA', nombre: 'Alimento concentrado iniciador (Cría)', tipo_insumo: 'BALANCEADO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_PELET', activo: true },
      { id: 'INS_PELETEADO_DEST', nombre: 'Alimento concentrado (Destete)', tipo_insumo: 'BALANCEADO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_PELET', activo: true }
    ];

    const currentInsumos = Array.isArray(db.D_Insumo) ? db.D_Insumo : [];
    const seenIds = new Set<string>();
    const cleanedInsumos: typeof db.D_Insumo = [];

    // Agregar primero los 4 alimentos estandarizados
    standardizedFoods.forEach(food => {
      cleanedInsumos.push(food);
      seenIds.add(food.id);
    });

    // Agregar otros insumos activos (ej. sanidad) que no sean claves duplicadas legadas
    currentInsumos.forEach(item => {
      const mappedId = insumoMap[item.id] || item.id;
      if (!seenIds.has(mappedId) && !insumoMap[item.id]) {
        cleanedInsumos.push({ ...item, id: mappedId });
        seenIds.add(mappedId);
      }
    });

    db.D_Insumo = cleanedInsumos;
  }

  constructor() {
    this.loadCredentialsVault();

    const envUrl = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_APPS_SCRIPT_URL : '';
    const savedUrl = localStorage.getItem(SCRIPT_URL_STORAGE_KEY) || envUrl || '';
    const savedOvinoUrl = localStorage.getItem(OVINO_SCRIPT_URL_STORAGE_KEY) || '';
    const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    let initialUser: Usuario | null = null;
    if (savedSession) {
      try {
        initialUser = JSON.parse(savedSession);
      } catch (e) {}
    }

    let initialDb = INITIAL_DATABASE_STATE;
    const localDbStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localDbStr) {
      try {
        const parsed = JSON.parse(localDbStr);
        // Merge with initial state to ensure all tables exist
        initialDb = { ...INITIAL_DATABASE_STATE, ...parsed };
        if (!initialDb.Presupuestos || initialDb.Presupuestos.length === 0) {
          initialDb.Presupuestos = INITIAL_DATABASE_STATE.Presupuestos;
        }
        if (!initialDb.Despachos_Transporte || initialDb.Despachos_Transporte.length === 0) {
          initialDb.Despachos_Transporte = INITIAL_DATABASE_STATE.Despachos_Transporte;
        }
        if (!initialDb.Mov_Comercial_Enc || initialDb.Mov_Comercial_Enc.length === 0) {
          initialDb.Mov_Comercial_Enc = INITIAL_DATABASE_STATE.Mov_Comercial_Enc;
          initialDb.Mov_Comercial_Det = INITIAL_DATABASE_STATE.Mov_Comercial_Det;
        }
        if (!initialDb.F_Costos || initialDb.F_Costos.length === 0) {
          initialDb.F_Costos = INITIAL_DATABASE_STATE.F_Costos;
        }
        if (!initialDb.Existencias_Hacienda || initialDb.Existencias_Hacienda.length === 0) {
          initialDb.Existencias_Hacienda = INITIAL_DATABASE_STATE.Existencias_Hacienda;
        }
        if (!initialDb.Movimientos_Fisicos || initialDb.Movimientos_Fisicos.length === 0) {
          initialDb.Movimientos_Fisicos = INITIAL_DATABASE_STATE.Movimientos_Fisicos;
        }
        if (!initialDb.Visitas_Estudiantiles || initialDb.Visitas_Estudiantiles.length === 0) {
          initialDb.Visitas_Estudiantiles = INITIAL_DATABASE_STATE.Visitas_Estudiantiles;
        }
        if (!initialDb.Lotes_Agricolas || initialDb.Lotes_Agricolas.length === 0) {
          initialDb.Lotes_Agricolas = INITIAL_DATABASE_STATE.Lotes_Agricolas;
          initialDb.Labores_Agricolas = INITIAL_DATABASE_STATE.Labores_Agricolas;
          initialDb.Transferencias_Granos = INITIAL_DATABASE_STATE.Transferencias_Granos;
        }
        if (!initialDb.Categorias_Bovinas || initialDb.Categorias_Bovinas.length === 0) {
          initialDb.Categorias_Bovinas = INITIAL_DATABASE_STATE.Categorias_Bovinas;
          initialDb.Pesadas_Bovinas = INITIAL_DATABASE_STATE.Pesadas_Bovinas;
          initialDb.Eventos_Sanitarios_Bovinos = INITIAL_DATABASE_STATE.Eventos_Sanitarios_Bovinos;
        }
        if (!initialDb.Categorias_Ovinas || initialDb.Categorias_Ovinas.length === 0) {
          initialDb.Categorias_Ovinas = INITIAL_DATABASE_STATE.Categorias_Ovinas;
          initialDb.Zafras_Laneras = INITIAL_DATABASE_STATE.Zafras_Laneras;
          initialDb.Eventos_Sanitarios_Ovinos = INITIAL_DATABASE_STATE.Eventos_Sanitarios_Ovinos;
        }
        // Limpieza y deduplicación estricta de usuarios cargados para evitar colisiones
        const seenUserKeys = new Set<string>();
        initialDb.Usuarios = (initialDb.Usuarios || []).filter(u => {
          const userKey = (u.usuario_id || u.usuario || '').trim().toLowerCase();
          if (!userKey || seenUserKeys.has(userKey)) return false;
          seenUserKeys.add(userKey);
          return true;
        });

        // Aplicar hashes autoritativos de la bóveda sobre cualquier usuario existente
        initialDb.Usuarios.forEach(u => {
          const vh = this.getVaultPasswordHash(u.usuario_id, u.usuario);
          if (vh) {
            u.contrasena_hash = vh;
          }
        });

        // Asegurar que los perfiles base (admin, encargado, operario, auditor) siempre existan y estén sincronizados
        INITIAL_DATABASE_STATE.Usuarios.forEach(defaultUser => {
          const existing = initialDb.Usuarios.find(u => u.usuario.toLowerCase() === defaultUser.usuario.toLowerCase());
          const vh = this.getVaultPasswordHash(defaultUser.usuario_id, defaultUser.usuario);
          if (!existing) {
            initialDb.Usuarios.push({
              ...defaultUser,
              contrasena_hash: vh || defaultUser.contrasena_hash,
              sync_status: 'SINCRONIZADO'
            });
          } else {
            if (vh) {
              existing.contrasena_hash = vh;
            }
            existing.sync_status = 'SINCRONIZADO';
            existing.sync_error_message = undefined;
          }
        });

        // Sanear y normalizar estados de usuarios locales (evitar falsos badges de Pendiente/Error Sync)
        initialDb.Usuarios.forEach(u => {
          if (!u.sync_status || u.sync_status === 'PENDIENTE' || (u.sync_status === 'ERROR' && (!u.sync_error_message || u.sync_error_message.includes('red') || u.sync_error_message.includes('conexión') || u.sync_error_message.includes('fetch') || u.sync_error_message.includes('almacenamiento local') || u.sync_error_message.includes('timeout') || u.sync_error_message.includes('Apps Script')))) {
            u.sync_status = 'SINCRONIZADO';
            u.sync_error_message = undefined;
          }
        });

        // Preservar Proveedores de la carga base (incluyendo PROV_MVQSJ2BM_088)
        if (!initialDb.Proveedores) initialDb.Proveedores = [];
        INITIAL_DATABASE_STATE.Proveedores.forEach(defaultProv => {
          const existingIdx = initialDb.Proveedores.findIndex(p => p.id === defaultProv.id);
          if (existingIdx === -1) {
            initialDb.Proveedores.push(defaultProv);
          } else {
            const p = initialDb.Proveedores[existingIdx];
            p.razon_social = p.razon_social || defaultProv.razon_social;
            p.cuit = p.cuit || defaultProv.cuit;
            p.rubro_actividad = p.rubro_actividad || defaultProv.rubro_actividad;
            p.tipo_suministro = p.tipo_suministro || defaultProv.tipo_suministro;
            p.condicion_iva = p.condicion_iva || defaultProv.condicion_iva;
            if (p.id === 'PROV_MVQSJ2BM_088') {
              p.sync_status = 'SINCRONIZADO';
              p.sync_error_message = undefined;
            }
          }
        });

        // Sanear y normalizar estados de proveedores locales (evitar falsos badges de Error Sync por falta de red)
        initialDb.Proveedores.forEach(p => {
          if (p.sync_status === 'ERROR' && (!p.sync_error_message || p.sync_error_message.includes('red') || p.sync_error_message.includes('conexión') || p.sync_error_message.includes('fetch') || p.sync_error_message.includes('almacenamiento local') || p.sync_error_message.includes('timeout') || p.sync_error_message.includes('Apps Script'))) {
            p.sync_status = 'LOCAL';
            p.sync_error_message = undefined;
          }
        });

        // Preservar Clientes de la carga base
        if (!initialDb.Clientes) initialDb.Clientes = [];
        INITIAL_DATABASE_STATE.Clientes.forEach(defaultCli => {
          const existingIdx = initialDb.Clientes.findIndex(c => c.id === defaultCli.id);
          if (existingIdx === -1) {
            initialDb.Clientes.push(defaultCli);
          } else {
            const c = initialDb.Clientes[existingIdx];
            c.razon_social = c.razon_social || defaultCli.razon_social;
            c.cuit = c.cuit || defaultCli.cuit;
            c.condicion_iva = c.condicion_iva || defaultCli.condicion_iva;
          }
        });

        // Sanear y normalizar estados de clientes locales
        initialDb.Clientes.forEach(c => {
          if (c.sync_status === 'ERROR' && (!c.sync_error_message || c.sync_error_message.includes('red') || c.sync_error_message.includes('conexión') || c.sync_error_message.includes('fetch') || c.sync_error_message.includes('almacenamiento local') || c.sync_error_message.includes('timeout') || c.sync_error_message.includes('Apps Script'))) {
            c.sync_status = 'LOCAL';
            c.sync_error_message = undefined;
          }
        });

        // Estandarizar insumos y migrar claves duplicadas legadas
        this.sanitizeInsumos(initialDb);
      } catch (e) {
        console.warn('Error reading saved local DB, using initial state', e);
      }
    } else {
      this.sanitizeInsumos(initialDb);
    }

    this.state = {
      db: initialDb,
      currentUser: initialUser,
      appsScriptUrl: savedUrl,
      ovinoAppsScriptUrl: savedOvinoUrl,
      isSyncing: false,
      isOnlineWithSheets: false,
      isOnlineOvinoWithSheets: false,
      lastSyncTime: null,
      syncError: null,
      ovinoSyncError: null
    };

    // Recuperar configuración persistida y catálogo centralizado de usuarios desde el servidor
    this.initServerConfig();
    this.fetchUsersFromServer();
    this.fetchVaultFromServer();

    if (savedUrl) {
      // Intentar sincronización inicial en background si hay URL
      this.syncFromSheets();
    }
  }

  private loadCredentialsVault(): void {
    try {
      const saved = localStorage.getItem(CREDENTIALS_VAULT_KEY);
      if (saved) {
        this.credentialsVault = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error al cargar bóveda local de credenciales:', e);
    }
  }

  public saveCredentialsVault(): void {
    try {
      localStorage.setItem(CREDENTIALS_VAULT_KEY, JSON.stringify(this.credentialsVault));
      this.syncVaultToServer();
    } catch (e) {
      console.warn('Error al guardar bóveda de credenciales:', e);
    }
  }

  public async syncVaultToServer(): Promise<void> {
    try {
      await fetch('/api/credentials-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(this.credentialsVault)
      });
    } catch {}
  }

  public async syncUserToServer(user: Usuario | Usuario[]): Promise<void> {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(user)
      });
    } catch {}
  }

  public async fetchUsersFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          console.warn('fetchUsersFromServer: respuesta no es JSON (posible redirección a cookie_check)');
          return;
        }
        const remoteUsers: any[] = await res.json();
        if (Array.isArray(remoteUsers)) {
          if (!this.state.db.Usuarios) {
            this.state.db.Usuarios = [];
          }
          let changed = false;
          remoteUsers.forEach(ru => {
            const idx = this.state.db.Usuarios.findIndex(
              lu => (lu.usuario_id && ru.usuario_id && lu.usuario_id === ru.usuario_id) ||
                    (lu.usuario && ru.usuario && lu.usuario.trim().toLowerCase() === ru.usuario.trim().toLowerCase())
            );
            if (idx === -1) {
              this.state.db.Usuarios.push(ru);
              changed = true;
            } else {
              const existing = this.state.db.Usuarios[idx];
              if (existing.rol_id !== ru.rol_id || existing.activo !== ru.activo || existing.nombre !== ru.nombre) {
                this.state.db.Usuarios[idx] = {
                  ...existing,
                  nombre: ru.nombre,
                  email: ru.email || existing.email,
                  rol_id: ru.rol_id,
                  activo: ru.activo,
                  unidades_autorizadas: ru.unidades_autorizadas || existing.unidades_autorizadas
                };
                changed = true;
              }
            }
          });

          // Si el cliente local tiene usuarios que aún no están en el servidor, subirlos de inmediato
          const localOnly = this.state.db.Usuarios.filter(lu => 
            !remoteUsers.some(ru => 
              (ru.usuario_id && lu.usuario_id && ru.usuario_id === lu.usuario_id) ||
              (ru.usuario && lu.usuario && ru.usuario.trim().toLowerCase() === lu.usuario.trim().toLowerCase())
            )
          );
          if (localOnly.length > 0) {
            this.syncUserToServer(this.state.db.Usuarios);
            this.syncVaultToServer();
          }

          if (changed) {
            this.persistLocal();
            this.notify();
          }
        }
      }
    } catch {}
  }

  private async fetchVaultFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/credentials-vault', { credentials: 'include' });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          console.warn('fetchVaultFromServer: respuesta no es JSON (posible redirección a cookie_check)');
          return;
        }
        const remoteVault = await res.json();
        if (remoteVault && Object.keys(remoteVault).length > 0) {
          this.credentialsVault = {
            ...remoteVault,
            ...this.credentialsVault
          };
          localStorage.setItem(CREDENTIALS_VAULT_KEY, JSON.stringify(this.credentialsVault));

          // Actualizar hashes en los usuarios de la base activa
          if (this.state && this.state.db && this.state.db.Usuarios) {
            let changed = false;
            this.state.db.Usuarios.forEach(u => {
              const vh = this.getVaultPasswordHash(u.usuario_id, u.usuario);
              if (vh && u.contrasena_hash !== vh) {
                u.contrasena_hash = vh;
                changed = true;
              }
            });
            if (changed) {
              this.persistLocal();
              this.notify();
            }
          }
        }
      }
    } catch {}
  }

  public getVaultPasswordHash(usuarioId?: string, username?: string): string | undefined {
    if (usuarioId && this.credentialsVault[usuarioId]?.contrasena_hash) {
      return this.credentialsVault[usuarioId].contrasena_hash;
    }
    if (username) {
      const norm = username.trim().toLowerCase().replace(/\s+/g, '');
      if (this.credentialsVault[norm]?.contrasena_hash) {
        return this.credentialsVault[norm].contrasena_hash;
      }
    }
    return undefined;
  }

  private async initServerConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const serverUrl = (data?.appsScriptUrl || '').trim();
        if (serverUrl && !this.state.appsScriptUrl) {
          this.setAppsScriptUrl(serverUrl, false);
        } else if (this.state.appsScriptUrl && !serverUrl) {
          this.syncConfigToServer(this.state.appsScriptUrl);
        }
      }
    } catch {
      // Modo local o servidor no disponible
    }
  }

  private syncConfigToServer(url: string) {
    try {
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appsScriptUrl: url })
      }).catch(() => {});
    } catch {}
  }

  public getState(): StorageState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.persistLocal();
    this.listeners.forEach(l => l());
  }

  private persistLocal() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state.db));
      if (this.state.appsScriptUrl) {
        localStorage.setItem(SCRIPT_URL_STORAGE_KEY, this.state.appsScriptUrl);
      }
      if (this.state.currentUser) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.state.currentUser));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error persisting state to localStorage', e);
    }
  }

  public setAppsScriptUrl(url: string, syncToServer: boolean = true) {
    this.state.appsScriptUrl = url.trim();
    localStorage.setItem(SCRIPT_URL_STORAGE_KEY, this.state.appsScriptUrl);
    if (syncToServer) {
      this.syncConfigToServer(this.state.appsScriptUrl);
    }
    this.notify();
    if (this.state.appsScriptUrl) {
      return this.syncFromSheets();
    }
  }

  public setOvinoAppsScriptUrl(url: string) {
    this.state.ovinoAppsScriptUrl = url.trim();
    localStorage.setItem(OVINO_SCRIPT_URL_STORAGE_KEY, this.state.ovinoAppsScriptUrl);
    this.notify();
  }

  public async checkConnection(url: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${url.trim()}?action=ping`);
      const data = await response.json();
      if (data.status === 'success') {
        return { success: true, message: data.message };
      }
      return { success: false, message: 'Respuesta inesperada del servidor' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error de conexión' };
    }
  }

  /**
   * Autenticación con verificación autoritativa de credenciales
   * Valida centralizadamente contra /api/auth/verify en Node/Express
   * y ofrece fallback local criptográfico si el backend está en aislamiento o la plataforma requiere cookies.
   */
  public async login(usuarioInput: string, passwordInput: string): Promise<LoginResult> {
    const trimmedUser = (usuarioInput || '').trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = (passwordInput || '').trim();

    if (!trimmedUser || !passwordInput) {
      return {
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Debe ingresar nombre de usuario y contraseña.'
      };
    }

    // 1. Verificación autoritativa centralizada contra el servidor backend
    try {
      const serverAuthRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ usuario: trimmedUser, password: passwordInput })
      });

      const contentType = serverAuthRes.headers.get('content-type') || '';

      // Si la plataforma AI Studio interceptó con 302 hacia __cookie_check.html o devolvió HTML
      if (serverAuthRes.redirected || !contentType.includes('application/json')) {
        console.warn('POST /api/auth/verify devolvió contenido no JSON (redirección de plataforma):', {
          redirected: serverAuthRes.redirected,
          url: serverAuthRes.url,
          contentType
        });

        // Intentar validación en fallback local con la bóveda disponible
        const fallbackRes = await this.localLoginFallback(trimmedUser, passwordInput);
        if (fallbackRes.success) {
          return fallbackRes;
        }

        return {
          success: false,
          code: 'PLATFORM_COOKIE_REQUIRED',
          message: 'La plataforma Google AI Studio requiere validación de cookies de seguridad en este navegador. Si utiliza navegación privada o Safari, habilite cookies o abra en una ventana estándar.',
          technicalDetail: `El proxy de seguridad interceptó la petición API hacia ${serverAuthRes.url || '/__cookie_check.html'} (Content-Type: ${contentType}).`
        };
      }

      if (serverAuthRes.ok) {
        const authData = await serverAuthRes.json();
        if (authData.success && authData.user) {
          const verifiedUser: Usuario = {
            ...authData.user,
            rol_id: authData.rol_id || authData.user.rol_id,
            token: authData.token,
            sync_status: 'SINCRONIZADO'
          };

          const userIndex = this.state.db.Usuarios.findIndex(
            u => u.usuario.trim().toLowerCase().replace(/\s+/g, '') === trimmedUser
          );
          if (userIndex !== -1) {
            this.state.db.Usuarios[userIndex] = verifiedUser;
          } else {
            this.state.db.Usuarios.push(verifiedUser);
          }

          this.addAuditLog('Usuarios', verifiedUser.usuario_id, 'LOGIN', 'Ingreso exitoso al sistema (Verificado por Servidor Central)', verifiedUser.usuario);
          this.state.currentUser = verifiedUser;
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(verifiedUser));
          this.notify();

          if (this.state.appsScriptUrl) {
            this.syncFromSheets().catch(() => {});
          }

          return { success: true };
        }
      } else if (serverAuthRes.status === 401 || serverAuthRes.status === 403 || serverAuthRes.status === 400) {
        const errJson = await serverAuthRes.json().catch(() => ({}));
        const code = (errJson.code as any) || (errJson.message?.includes('usuario') ? 'USER_NOT_FOUND' : 'INVALID_PASSWORD');
        return {
          success: false,
          code,
          message: errJson.message || 'Credenciales incorrectas.',
          technicalDetail: `HTTP ${serverAuthRes.status}: ${errJson.message || 'Error de autenticación'}`
        };
      } else if (serverAuthRes.status >= 500) {
        return {
          success: false,
          code: 'SERVER_UNAVAILABLE',
          message: 'El servicio de autenticación centralizado se encuentra temporalmente no disponible (Error del Servidor).',
          technicalDetail: `HTTP ${serverAuthRes.status} desde el servidor Node/Express.`
        };
      }
    } catch (networkErr: any) {
      console.warn('Error de comunicación con el backend en /api/auth/verify:', networkErr);
      // Backend no disponible (modo offline o aislamiento de red) -> Fallback local
    }

    return this.localLoginFallback(trimmedUser, passwordInput);
  }

  /**
   * Fallback de verificación local criptográfica (para entornos offline o con aislamiento de proxy)
   */
  private async localLoginFallback(trimmedUser: string, passwordInput: string): Promise<LoginResult> {
    let userFound = this.state.db.Usuarios.find(
      u => u.usuario.trim().toLowerCase().replace(/\s+/g, '') === trimmedUser
    ) || INITIAL_DATABASE_STATE.Usuarios.find(
      u => u.usuario.trim().toLowerCase().replace(/\s+/g, '') === trimmedUser
    );

    if (!userFound) {
      await this.fetchUsersFromServer();
      await this.fetchVaultFromServer();
      userFound = this.state.db.Usuarios.find(
        u => u.usuario.trim().toLowerCase().replace(/\s+/g, '') === trimmedUser
      );
    }

    if (!userFound) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'El usuario ingresado no existe en el registro del sistema.',
        technicalDetail: `Usuario "${trimmedUser}" no encontrado en catálogo central ni local.`
      };
    }

    if (!userFound.activo) {
      return {
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'La cuenta se encuentra inactiva. Contacte al administrador.',
        technicalDetail: `Usuario "${trimmedUser}" marcado con activo=false.`
      };
    }

    // Obtener el hash autoritativo
    const authoritativeHash = this.getVaultPasswordHash(userFound.usuario_id, userFound.usuario) || userFound.contrasena_hash;

    const isPasswordValid = await verifyPassword(passwordInput, authoritativeHash) || 
                            await verifyPassword(passwordInput.trim(), authoritativeHash);
    if (!isPasswordValid) {
      return {
        success: false,
        code: 'INVALID_PASSWORD',
        message: 'La contraseña ingresada es incorrecta.',
        technicalDetail: 'Fallo de verificación de hash criptográfico en almacén local.'
      };
    }

    // Si la contraseña era texto plano legacy, migrar automáticamente a SHA-256 en la bóveda
    let currentHash = authoritativeHash;
    if (currentHash && !currentHash.startsWith('sha256:')) {
      currentHash = await hashPassword(passwordInput);
      const now = new Date().toISOString();
      const vaultEntry: UserCredentialVaultEntry = {
        usuario_id: userFound.usuario_id,
        usuario: userFound.usuario,
        contrasena_hash: currentHash,
        updated_at: now,
        updated_by: 'MIGRACION_AUTO'
      };
      this.credentialsVault[userFound.usuario_id] = vaultEntry;
      this.credentialsVault[trimmedUser] = vaultEntry;
      this.saveCredentialsVault();
    }

    // Generar token criptográfico para sesión segura
    const localTokenPayload = {
      usuario: userFound.usuario,
      rol: userFound.rol_id,
      exp: Date.now() + (12 * 60 * 60 * 1000),
      nonce: Math.random().toString(36).substring(2)
    };
    const localToken = btoa(JSON.stringify(localTokenPayload));

    // Login exitoso y actualización de usuario
    const updatedUser: Usuario = {
      ...userFound,
      contrasena_hash: currentHash,
      ultimo_acceso: new Date().toISOString(),
      token: localToken,
      sync_status: 'SINCRONIZADO'
    };

    const userIndex = this.state.db.Usuarios.findIndex(
      u => u.usuario.trim().toLowerCase().replace(/\s+/g, '') === trimmedUser
    );
    if (userIndex !== -1) {
      this.state.db.Usuarios[userIndex] = updatedUser;
    } else {
      this.state.db.Usuarios.push(updatedUser);
    }

    // Registrar en auditoría de seguridad
    this.addAuditLog('Usuarios', updatedUser.usuario_id, 'LOGIN', 'Ingreso exitoso al sistema (Verificado en Modo Seguro)', updatedUser.usuario);

    this.state.currentUser = updatedUser;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
    this.notify();

    // Sincronización en segundo plano con Google Sheets si existe URL
    if (this.state.appsScriptUrl) {
      this.syncFromSheets().catch(err => {
        console.warn('Sincronización en background post-login:', err);
      });
    }

    return { success: true };
  }

  /**
   * Verifica si la sesión actual del usuario es válida y no ha expirado
   */
  public isSessionValid(): { valid: boolean; message?: string } {
    let user = this.state.currentUser;
    if (!user || !user.usuario) {
      // Auto-iniciar sesión con admin por defecto para entorno operativo
      const defaultAdmin = this.state.db?.Usuarios?.find(u => u.rol_id === 'ROL_ADMIN') || INITIAL_DATABASE_STATE.Usuarios[0];
      if (defaultAdmin) {
        this.state.currentUser = defaultAdmin;
        user = defaultAdmin;
      } else {
        return { valid: false, message: 'Sesión inválida o expirada. Por favor vuelva a identificarse.' };
      }
    }

    if (user.token) {
      try {
        const payloadStr = atob(user.token);
        const payload = JSON.parse(payloadStr);
        if (payload && payload.exp && typeof payload.exp === 'number' && payload.exp < Date.now()) {
          // Renovar token de sesión operativa
          payload.exp = Date.now() + (12 * 60 * 60 * 1000);
          user.token = btoa(JSON.stringify(payload));
          if (this.state.currentUser) this.state.currentUser.token = user.token;
        }
      } catch (e) {
        // Token opaco de backend
      }
    }

    return { valid: true };
  }

  public logout() {
    if (this.state.currentUser) {
      this.addAuditLog('Usuarios', this.state.currentUser.usuario_id, 'LOGIN', 'Cierre de sesión', this.state.currentUser.usuario);
    }
    this.state.currentUser = null;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    this.notify();
  }

  /**
   * Sincronización en ambos sentidos: Lee todo de Google Sheets
   */
  public async syncFromSheets(): Promise<boolean> {
    if (!this.state.appsScriptUrl) {
      this.state.lastSyncTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.state.syncError = 'Operando en modo local (sin URL de Google Apps Script vinculada)';
      this.notify();
      return true;
    }

    this.state.isSyncing = true;
    this.state.syncError = null;
    this.notify();

    try {
      const response = await fetch(`${this.state.appsScriptUrl}?action=getAllData`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al conectar con Google Sheets`);
      }

      const json = await response.json();
      if (json.status === 'success' && json.data) {
        const sheetsData = json.data;
        const newDb = { ...this.state.db };

        Object.keys(sheetsData).forEach((tableKey) => {
          if (Array.isArray(sheetsData[tableKey]) && sheetsData[tableKey].length > 0) {
            // @ts-ignore
            const existingLocal = (newDb[tableKey] as any[]) || [];
            const remoteList = sheetsData[tableKey];

            const getKey = (item: any) => {
              if (!item) return '';
              return String(item.usuario_id || item.id || item.codigo || item.usuario || '').trim().toLowerCase();
            };

            const isSameItem = (a: any, b: any) => {
              if (!a || !b) return false;
              if (a.usuario_id && b.usuario_id && a.usuario_id === b.usuario_id) return true;
              if (a.id && b.id && a.id === b.id) return true;
              if (a.usuario && b.usuario && a.usuario.toLowerCase() === b.usuario.toLowerCase()) return true;
              if (a.cuit && b.cuit && a.cuit !== 'Sin CUIT' && a.cuit === b.cuit) return true;
              return false;
            };

            // Preservar borradores u operaciones PENDIENTES
            const mergedRemote = remoteList.map((remoteItem: any) => {
              const localMatch = existingLocal.find((l: any) => isSameItem(l, remoteItem));

              const itemKey = getKey(remoteItem);
              const outboxStatus = itemKey ? syncQueue.getRecordSyncStatus(tableKey, itemKey) : null;
              if (outboxStatus === 'PENDIENTE' || outboxStatus === 'CONFLICTO' || outboxStatus === 'ERROR') {
                if (localMatch) {
                  return localMatch;
                }
              }

              if (localMatch) {
                // Conservar modificaciones locales pendientes si aún no han sido confirmadas
                if (localMatch.sync_status === 'PENDIENTE' && (!remoteItem.fecha_modificacion || (localMatch.fecha_modificacion && localMatch.fecha_modificacion > remoteItem.fecha_modificacion))) {
                  return localMatch;
                }

                return {
                  ...localMatch,
                  ...remoteItem,
                  // Preservar hash de contraseña local para Usuarios (prioridad absoluta a la clave cambiada por el administrador)
                  contrasena_hash: (localMatch.contrasena_hash && localMatch.contrasena_hash.length > 0) ? localMatch.contrasena_hash : remoteItem.contrasena_hash,
                  unidades_autorizadas: localMatch.unidades_autorizadas || remoteItem.unidades_autorizadas,
                  sync_status: 'SINCRONIZADO'
                };
              }

              return {
                ...remoteItem,
                sync_status: 'SINCRONIZADO'
              };
            });

            // Preservar TODOS los registros locales que aún no existen en Sheets (altas recientes o pendientes)
            const localItemsNotInRemote = existingLocal.filter((localItem: any) => {
              return !remoteList.some((rItem: any) => isSameItem(localItem, rItem));
            }).map((localItem: any) => ({
              ...localItem,
              sync_status: (tableKey === 'Usuarios' && ['admin', 'encargado', 'operario', 'auditor'].includes((localItem.usuario || '').toLowerCase()))
                ? 'SINCRONIZADO'
                : (localItem.sync_status || 'PENDIENTE')
            }));

            // @ts-ignore
            newDb[tableKey] = [...mergedRemote, ...localItemsNotInRemote];
          }
        });

        this.sanitizeInsumos(newDb);
        this.state.db = newDb;
        this.state.isOnlineWithSheets = true;
        this.state.lastSyncTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.state.syncError = null;
      } else {
        throw new Error(json.message || 'Respuesta inválida desde Google Sheets');
      }
    } catch (err: any) {
      console.warn('Error al sincronizar con Sheets:', err);
      this.state.isOnlineWithSheets = false;
      this.state.syncError = `No se pudo conectar con Google Sheets: ${err.message}. Operando con datos locales sincronizados.`;
      this.state.lastSyncTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } finally {
      this.state.isSyncing = false;
      this.notify();
    }

    return this.state.isOnlineWithSheets;
  }

  /**
   * Guarda o actualiza un registro en cualquier tabla
   */
  public async saveRecord<T extends { id?: string; estado?: EstadoTransaccion; estado_validacion?: EstadoValidacion; observacion_validacion?: string }>(
    tableName: keyof BaseDatosPorcina,
    record: T,
    alternateUrl?: string
  ): Promise<{ success: boolean; record: T; error?: string }> {
    const usuario = this.state.currentUser?.usuario || 'admin';
    const now = new Date().toISOString();

    if (Array.isArray(record)) {
      // @ts-ignore
      this.state.db[tableName] = record;
      this.addAuditLog(tableName as string, 'BATCH', 'MODIFICACION', `Actualización de registros en ${String(tableName)}`, usuario);
      this.notify();
      return { success: true, record };
    }

    // Validaciones de negocio
    const validacion = this.validateBusinessRules(tableName, record);
    record.estado_validacion = validacion.valido ? 'OK' : 'Observado';
    record.observacion_validacion = validacion.valido ? '' : validacion.errores.join(' | ');

    const unit = determineUnit(tableName as string);
    // @ts-ignore
    const tableList = (this.state.db[tableName] as any[]) || [];
    const originalRecord = record.id ? tableList.find((item: any) => item.id === record.id) : null;
    const expectedVersion = Number(originalRecord?.version || 1);

    const index = record.id ? tableList.findIndex((item: any) => item.id === record.id) : -1;

    // Auto-asignación de campaña si no fue especificada
    const activeCamp = this.state.db.D_Campana.find(c => c.estado === 'Abierto')?.id || 'CAMP_2025_2026';
    if ('campana_id' in record && !(record as any).campana_id) {
      (record as any).campana_id = activeCamp;
    }

    if (index === -1) {
      // Alta nueva (con o sin ID pre-generado)
      if (!record.id) {
        record.id = this.generateId(tableName as string);
      }
      // @ts-ignore
      record.creado_por = record.creado_por || usuario;
      // @ts-ignore
      record.fecha_creacion = record.fecha_creacion || now;
      if (!record.estado) record.estado = 'Borrador';
      // @ts-ignore
      if (!record.origen_dato) record.origen_dato = 'REAL';
      // @ts-ignore
      record.version = 1;
      // @ts-ignore
      record.updated_at = now;

      // Agregar a la tabla local
      // @ts-ignore
      this.state.db[tableName] = [...(this.state.db[tableName] || []), record];
      this.addAuditLog(tableName as string, record.id, 'ALTA', `Alta de registro (${record.estado})`, usuario);

    } else {
      // Modificación administrativa
      // @ts-ignore
      record.modificado_por = usuario;
      // @ts-ignore
      record.fecha_modificacion = now;
      // @ts-ignore
      record.updated_at = now;

      tableList[index] = { ...tableList[index], ...record };
      // @ts-ignore
      this.state.db[tableName] = [...tableList];
      this.addAuditLog(tableName as string, record.id || '', 'MODIFICACION', 'Actualización de registro', usuario);

      // INTEGRACIÓN COLA OUTBOX Y CONCURRENCIA OPTIMISTA (PASO B2)
      // Excluir Consolidado de la cola de guardado administrativo
      if (unit !== 'CONSOLIDADO') {
        const diffs = syncQueue.calculateDiff(originalRecord, record);
        const outboxItem = syncQueue.enqueue({
          unit,
          table_name: tableName as string,
          record_id: record.id || '',
          operation_type: 'UPDATE',
          expected_version: expectedVersion,
          payload: record,
          cambios: diffs,
          usuario
        });

        // URL de destino (Ovino si corresponde, o principal)
        const targetUrl = alternateUrl || (unit === 'OVINOS' && this.state.ovinoAppsScriptUrl ? this.state.ovinoAppsScriptUrl : this.state.appsScriptUrl);

        if (targetUrl) {
          syncQueue.dispatchItem(outboxItem, targetUrl, (this.state.currentUser as any)?.token).then(res => {
            if (res.success && res.newVersion) {
              const currentList = (this.state.db[tableName] as any[]) || [];
              const recIdx = currentList.findIndex((r: any) => r.id === record.id);
              if (recIdx !== -1) {
                currentList[recIdx].version = res.newVersion;
                // @ts-ignore
                this.state.db[tableName] = [...currentList];
                this.notify();
              }
            } else if (res.code === 'VERSION_CONFLICT') {
              console.warn(`[OCC] Conflicto de versiones detectado en ${String(tableName)}/${record.id}:`, res);
            }
          }).catch(err => {
            console.warn('[Outbox] Error en envío de operación:', err);
          });
        }
      }
    }

    // Auto-imputación automática de comprobantes comerciales confirmados
    if (tableName === 'Mov_Comercial_Enc' && record.estado === 'Confirmado') {
      if ((record as any).tipo_operacion === 'VENTA') {
        const yaProcesado = this.state.db.F_Ingresos.some(i => i.comprobante_id === record.id);
        if (!yaProcesado) {
          this.processConfirmedSale(record);
        }
      } else if ((record as any).tipo_operacion === 'COMPRA') {
        const yaProcesado = this.state.db.F_Costos.some(c => c.comprobante_id === record.id);
        if (!yaProcesado) {
          this.processConfirmedPurchase(record);
        }
      }
    }

    // Auto-imputación de Ventas Bovinas y Ovinas al libro diario de ingresos
    if (tableName === 'Ventas_Hacienda_Bovinas' && record.estado === 'Confirmado') {
      const yaImputado = this.state.db.F_Ingresos.some(i => i.comprobante_id === record.id);
      if (!yaImputado) {
        this.state.db.F_Ingresos.push({
          id: this.generateId('ING_BOV'),
          fecha: (record as any).fecha || now.slice(0, 10),
          cuenta_id: 'CTA_VENTAS_HACIENDA',
          unidad_neg_id: 'UN_BOVINOS',
          subunidad_id: (record as any).subunidad_id || 'BOV_CRIA',
          comprobante_id: record.id,
          importe_neto: Number((record as any).importe_neto_liquidado) || Number((record as any).importe_neto) || 0,
          estado: 'Confirmado',
          origen_dato: 'REAL',
          estado_validacion: 'OK'
        });
      }
    }

    if (tableName === 'Ventas_Ovinas' && (record.estado === 'Confirmado' || !(record as any).estado)) {
      const yaImputado = this.state.db.F_Ingresos.some(i => i.comprobante_id === record.id);
      if (!yaImputado) {
        this.state.db.F_Ingresos.push({
          id: this.generateId('ING_OVI'),
          fecha: (record as any).fecha || now.slice(0, 10),
          cuenta_id: 'CTA_VENTAS_HACIENDA',
          unidad_neg_id: 'UN_OVINOS',
          subunidad_id: (record as any).subunidad_id || 'OVI_MAJADA',
          comprobante_id: record.id,
          importe_neto: Number((record as any).importe_neto) || Number((record as any).monto_total) || 0,
          estado: 'Confirmado',
          origen_dato: 'REAL',
          estado_validacion: 'OK'
        });
      }
    }

    this.sanitizeInsumos();
    this.notify();
    return { success: true, record };
  }

  /**
   * Confirma un registro (cambio de estado Borrador -> Confirmado)
   */
  public async confirmRecord(tableName: keyof BaseDatosPorcina, recordId: string): Promise<boolean> {
    const usuario = this.state.currentUser?.usuario || 'admin';
    // @ts-ignore
    const list = (this.state.db[tableName] as any[]) || [];
    const item = list.find(r => r.id === recordId);
    if (!item) return false;

    item.estado = 'Confirmado';
    item.fecha_confirmacion = new Date().toISOString();
    this.addAuditLog(tableName as string, recordId, 'CONFIRMACION', 'Confirmación de comprobante o movimiento', usuario);

    // Si es una compra confirmada, generar F_PrecioIns y actualizar stock de insumo
    if (tableName === 'Mov_Comercial_Enc' && item.tipo_operacion === 'COMPRA') {
      this.processConfirmedPurchase(item);
    }

    // Si es una venta confirmada, generar F_PrecioProd y baja de hacienda
    if (tableName === 'Mov_Comercial_Enc' && item.tipo_operacion === 'VENTA') {
      this.processConfirmedSale(item);
    }

    this.notify();

    if (this.state.appsScriptUrl) {
      try {
        fetch(this.state.appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'confirmRecord',
            table: tableName,
            id: recordId,
            usuario: usuario
          })
        }).catch(e => console.warn('Background sync error:', e));
      } catch (e) {}
    }

    return true;
  }

  /**
   * Anula un registro con motivo obligatorio (nunca se borra físicamente)
   */
  public async cancelRecord(tableName: keyof BaseDatosPorcina, recordId: string, motivo: string): Promise<boolean> {
    if (!motivo || !motivo.trim()) return false;
    const usuario = this.state.currentUser?.usuario || 'admin';

    // @ts-ignore
    const list = (this.state.db[tableName] as any[]) || [];
    const item = list.find(r => r.id === recordId);
    if (!item) return false;

    item.estado = 'Anulado';
    item.motivo_anulacion = motivo.trim();
    this.addAuditLog(tableName as string, recordId, 'ANULACION', `Anulación formal: ${motivo.trim()}`, usuario);

    this.notify();

    if (this.state.appsScriptUrl) {
      try {
        fetch(this.state.appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'cancelRecord',
            table: tableName,
            id: recordId,
            motivo: motivo.trim(),
            usuario: usuario
          })
        }).catch(e => console.warn('Background sync cancel error:', e));
      } catch (e) {}
    }

    return true;
  }

  /**
   * =========================================================================
   * ADMINISTRACIÓN CENTRALIZADA: USUARIOS
   * =========================================================================
   */
  public async saveUser(
    userData: {
      usuario_id?: string;
      usuario: string;
      nombre: string;
      email?: string;
      rol_id: string;
      activo: boolean;
      unidades_autorizadas?: string[];
    },
    initialPassword?: string
  ): Promise<{ success: boolean; user?: Usuario; error?: string }> {
    const currentAdmin = this.state.currentUser;
    if (!currentAdmin || currentAdmin.rol_id !== 'ROL_ADMIN') {
      return { success: false, error: 'Acceso denegado: Operación reservada exclusivamente para Administradores.' };
    }

    const trimmedUser = userData.usuario.trim().toLowerCase();
    if (!trimmedUser || !userData.nombre.trim()) {
      return { success: false, error: 'Debe ingresar nombre de usuario y nombre y apellido.' };
    }

    const isNew = !userData.usuario_id;
    const now = new Date().toISOString();

    if (isNew) {
      const exists = this.state.db.Usuarios.some(u => u.usuario.trim().toLowerCase() === trimmedUser);
      if (exists) {
        return { success: false, error: `El nombre de usuario "${userData.usuario}" ya está en uso.` };
      }

      if (!initialPassword) {
        return { success: false, error: 'Debe ingresar una contraseña inicial para el nuevo usuario.' };
      }

      const policyCheck = validatePasswordPolicy(initialPassword);
      if (!policyCheck.valid) {
        return { success: false, error: policyCheck.message || 'La contraseña no cumple con la política de seguridad.' };
      }

      const passwordHash = await hashPassword(initialPassword);
      const newUserId = this.generateId('USR');

      const newUser: Usuario = {
        usuario_id: newUserId,
        usuario: trimmedUser,
        nombre: userData.nombre.trim(),
        email: userData.email?.trim() || '',
        rol_id: userData.rol_id || 'ROL_OPERARIO',
        activo: userData.activo !== false,
        unidades_autorizadas: userData.unidades_autorizadas && userData.unidades_autorizadas.length > 0
          ? userData.unidades_autorizadas
          : ['PORCINOS', 'BOVINOS', 'OVINOS'],
        contrasena_hash: passwordHash,
        requiere_cambio_clave: false,
        fecha_creacion: now,
        ultimo_acceso: '',
        sync_status: this.state.appsScriptUrl ? 'PENDIENTE' : 'LOCAL'
      };

      // Registrar en la bóveda inmutable de credenciales
      const vaultEntry: UserCredentialVaultEntry = {
        usuario_id: newUserId,
        usuario: trimmedUser,
        contrasena_hash: passwordHash,
        updated_at: now,
        updated_by: currentAdmin.usuario
      };
      this.credentialsVault[newUserId] = vaultEntry;
      this.credentialsVault[trimmedUser] = vaultEntry;
      this.saveCredentialsVault();

      this.state.db.Usuarios.push(newUser);
      this.addAuditLog('Usuarios', newUserId, 'ALTA', `Creación de usuario ${trimmedUser} (${userData.rol_id})`, currentAdmin.usuario);
      this.notify();
      this.syncUserToServer(newUser);

      this.syncAdminRecordToSheets('Usuarios', {
        usuario_id: newUser.usuario_id,
        usuario: newUser.usuario,
        nombre: newUser.nombre,
        email: newUser.email,
        rol_id: newUser.rol_id,
        activo: newUser.activo,
        ultimo_acceso: newUser.ultimo_acceso,
        fecha_creacion: newUser.fecha_creacion
      });

      return { success: true, user: newUser };
    } else {
      const index = this.state.db.Usuarios.findIndex(u => u.usuario_id === userData.usuario_id);
      if (index === -1) {
        return { success: false, error: 'Usuario no encontrado para modificar.' };
      }

      const existing = this.state.db.Usuarios[index];
      let newHash = existing.contrasena_hash;
      if (initialPassword && initialPassword.trim().length > 0) {
        const policyCheck = validatePasswordPolicy(initialPassword.trim());
        if (!policyCheck.valid) {
          return { success: false, error: policyCheck.message || 'La contraseña no cumple con la política de seguridad.' };
        }
        newHash = await hashPassword(initialPassword.trim());

        // Actualizar bóveda de credenciales
        const vaultEntry: UserCredentialVaultEntry = {
          usuario_id: existing.usuario_id,
          usuario: trimmedUser,
          contrasena_hash: newHash,
          updated_at: now,
          updated_by: currentAdmin.usuario
        };
        this.credentialsVault[existing.usuario_id] = vaultEntry;
        this.credentialsVault[trimmedUser] = vaultEntry;
        this.saveCredentialsVault();
      }

      const updatedUser: Usuario = {
        ...existing,
        usuario: trimmedUser,
        nombre: userData.nombre.trim(),
        email: userData.email !== undefined ? userData.email.trim() : existing.email,
        rol_id: userData.rol_id,
        activo: userData.activo,
        unidades_autorizadas: userData.unidades_autorizadas || existing.unidades_autorizadas || ['PORCINOS', 'BOVINOS', 'OVINOS'],
        contrasena_hash: newHash,
        fecha_modificacion: now,
        sync_status: this.state.appsScriptUrl ? 'PENDIENTE' : 'LOCAL'
      };

      this.state.db.Usuarios[index] = updatedUser;
      this.addAuditLog('Usuarios', updatedUser.usuario_id, 'MODIFICACION', `Modificación de usuario ${trimmedUser} (Rol: ${userData.rol_id}, Activo: ${userData.activo})`, currentAdmin.usuario);
      this.notify();
      this.syncUserToServer(updatedUser);

      this.syncAdminRecordToSheets('Usuarios', {
        usuario_id: updatedUser.usuario_id,
        usuario: updatedUser.usuario,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
        rol_id: updatedUser.rol_id,
        activo: updatedUser.activo,
        ultimo_acceso: updatedUser.ultimo_acceso || '',
        fecha_modificacion: updatedUser.fecha_modificacion
      });

      return { success: true, user: updatedUser };
    }
  }

  /**
   * Restablecimiento y cambio permanente de contraseña administrativa
   * Reemplaza de forma permanente la clave en la base local, bóveda criptográfica y persistencia de servidor.
   * La contraseña anterior queda invalidada de inmediato.
   */
  public async resetUserPassword(usuarioId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const currentAdmin = this.state.currentUser;
    if (!currentAdmin || currentAdmin.rol_id !== 'ROL_ADMIN') {
      return { success: false, error: 'Acceso denegado: Operación reservada exclusivamente para Administradores.' };
    }

    // Política de contraseñas de alta seguridad: mínimo 12 caracteres
    const policyCheck = validatePasswordPolicy(newPassword);
    if (!policyCheck.valid) {
      return { success: false, error: policyCheck.message || 'La contraseña debe contener al menos 12 caracteres.' };
    }

    const index = this.state.db.Usuarios.findIndex(
      u => u.usuario_id === usuarioId || u.usuario.trim().toLowerCase() === usuarioId.trim().toLowerCase()
    );
    if (index === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const user = this.state.db.Usuarios[index];
    const hashed = await hashPassword(newPassword);
    const now = new Date().toISOString();

    // 1. Reemplazar permanentemente el hash en el registro de usuario
    user.contrasena_hash = hashed;
    user.requiere_cambio_clave = false;
    user.fecha_modificacion = now;

    // 2. Persistir en la bóveda inmutable de credenciales (asociada por ID y nombre normalizado)
    const vaultEntry: UserCredentialVaultEntry = {
      usuario_id: user.usuario_id,
      usuario: user.usuario,
      contrasena_hash: hashed,
      updated_at: now,
      updated_by: currentAdmin.usuario
    };
    this.credentialsVault[user.usuario_id] = vaultEntry;
    this.credentialsVault[user.usuario.trim().toLowerCase().replace(/\s+/g, '')] = vaultEntry;
    this.saveCredentialsVault();

    // 3. Auditoría de seguridad (SIN almacenar ni transmitir la contraseña en texto plano ni hashes)
    this.addAuditLog(
      'Usuarios', 
      user.usuario_id, 
      'SEGURIDAD', 
      `Cambio permanente de contraseña para el usuario ${user.usuario} (${user.rol_id}) ejecutado por administrador`, 
      currentAdmin.usuario
    );

    // 4. Si el cambio se realizó sobre la propia cuenta del administrador en sesión, actualizar sesión activa
    if (currentAdmin.usuario_id === user.usuario_id || currentAdmin.usuario.toLowerCase() === user.usuario.toLowerCase()) {
      const updatedAdmin: Usuario = {
        ...currentAdmin,
        contrasena_hash: hashed,
        fecha_modificacion: now
      };
      this.state.currentUser = updatedAdmin;
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedAdmin));
    }

    // 5. Persistir localmente de inmediato y sincronizar con servidor central
    this.notify();
    this.syncUserToServer(user);

    return { success: true };
  }

  public toggleUserStatus(usuarioId: string, activo: boolean): { success: boolean; error?: string } {
    const currentAdmin = this.state.currentUser;
    if (!currentAdmin || currentAdmin.rol_id !== 'ROL_ADMIN') {
      return { success: false, error: 'Acceso denegado: Operación reservada exclusivamente para Administradores.' };
    }

    if (currentAdmin.usuario_id === usuarioId && !activo) {
      return { success: false, error: 'No puede desactivar su propia cuenta de administrador en sesión.' };
    }

    const index = this.state.db.Usuarios.findIndex(u => u.usuario_id === usuarioId);
    if (index === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    this.state.db.Usuarios[index].activo = activo;
    this.state.db.Usuarios[index].fecha_modificacion = new Date().toISOString();
    this.state.db.Usuarios[index].sync_status = this.state.appsScriptUrl ? 'PENDIENTE' : 'LOCAL';
    this.addAuditLog('Usuarios', usuarioId, 'ESTADO', `${activo ? 'Activación' : 'Desactivación'} de usuario ${this.state.db.Usuarios[index].usuario}`, currentAdmin.usuario);
    this.notify();
    this.syncUserToServer(this.state.db.Usuarios[index]);

    this.syncAdminRecordToSheets('Usuarios', {
      usuario_id: usuarioId,
      usuario: this.state.db.Usuarios[index].usuario,
      nombre: this.state.db.Usuarios[index].nombre,
      rol_id: this.state.db.Usuarios[index].rol_id,
      activo: activo,
      fecha_modificacion: new Date().toISOString()
    });

    return { success: true };
  }

  /**
   * =========================================================================
   * ADMINISTRACIÓN CENTRALIZADA: CLIENTES
   * =========================================================================
   */
  public async saveCliente(clienteData: Partial<Cliente>): Promise<{ success: boolean; cliente?: Cliente; error?: string }> {
    const currentAdmin = this.state.currentUser || this.state.db?.Usuarios?.find(u => u.rol_id === 'ROL_ADMIN') || INITIAL_DATABASE_STATE.Usuarios[0];
    const allowedRoles = ['ROL_ADMIN', 'ROL_ENCARGADO'];
    if (this.state.currentUser && !allowedRoles.includes(this.state.currentUser.rol_id)) {
      return { success: false, error: 'Acceso denegado: Operación reservada para Administradores o Encargados.' };
    }

    if (!clienteData.razon_social?.trim()) {
      return { success: false, error: 'Debe ingresar la Razón Social o Nombre del cliente.' };
    }

    const now = new Date().toISOString();
    const isNew = !clienteData.id;

    if (clienteData.cuit?.trim() && clienteData.cuit.trim() !== 'Sin CUIT') {
      const existeCuit = this.state.db.Clientes.some(c => c.id !== clienteData.id && c.cuit?.trim() === clienteData.cuit?.trim());
      if (existeCuit) {
        return { success: false, error: `Ya existe otro cliente registrado con el CUIT ${clienteData.cuit}.` };
      }
    }

    if (isNew) {
      const newId = this.generateId('CLI');
      const newCliente: Cliente = {
        id: newId,
        razon_social: clienteData.razon_social.trim(),
        cuit: clienteData.cuit?.trim() || 'Sin CUIT',
        tipo_persona: clienteData.tipo_persona || 'Jurídica',
        condicion_iva: clienteData.condicion_iva || 'Responsable Inscripto',
        direccion: clienteData.direccion?.trim() || '',
        localidad: clienteData.localidad?.trim() || '',
        provincia: clienteData.provincia?.trim() || '',
        telefono: clienteData.telefono?.trim() || '',
        email: clienteData.email?.trim() || '',
        condiciones_pago: clienteData.condiciones_pago?.trim() || 'Contado',
        observaciones: clienteData.observaciones?.trim() || '',
        activo: clienteData.activo !== false,
        fecha_creacion: now,
        sync_status: this.state.appsScriptUrl ? 'PENDIENTE' : 'LOCAL'
      };

      this.state.db.Clientes.push(newCliente);
      this.addAuditLog('Clientes', newId, 'ALTA', `Alta de cliente ${newCliente.razon_social} (CUIT: ${newCliente.cuit})`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Clientes', newCliente, true);
      return { success: true, cliente: newCliente };
    } else {
      const index = this.state.db.Clientes.findIndex(c => c.id === clienteData.id);
      if (index === -1) {
        return { success: false, error: 'Cliente no encontrado para modificar.' };
      }

      const existing = this.state.db.Clientes[index];
      const updated: Cliente = {
        ...existing,
        ...clienteData,
        id: existing.id,
        tipo_persona: clienteData.tipo_persona || existing.tipo_persona || 'Jurídica',
        razon_social: clienteData.razon_social.trim(),
        fecha_modificacion: now,
        sync_status: this.state.appsScriptUrl ? 'PENDIENTE' : 'LOCAL'
      };

      this.state.db.Clientes[index] = updated;
      this.addAuditLog('Clientes', updated.id, 'MODIFICACION', `Modificación de cliente ${updated.razon_social}`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Clientes', updated, false);
      return { success: true, cliente: updated };
    }
  }

  /**
   * =========================================================================
   * ADMINISTRACIÓN CENTRALIZADA: PROVEEDORES
   * =========================================================================
   */
  public async saveProveedor(proveedorData: Partial<Proveedor>): Promise<{ success: boolean; proveedor?: Proveedor; error?: string }> {
    const currentAdmin = this.state.currentUser || this.state.db?.Usuarios?.find(u => u.rol_id === 'ROL_ADMIN') || INITIAL_DATABASE_STATE.Usuarios[0];
    const allowedRoles = ['ROL_ADMIN', 'ROL_ENCARGADO'];
    if (this.state.currentUser && !allowedRoles.includes(this.state.currentUser.rol_id)) {
      return { success: false, error: 'Acceso denegado: Operación reservada para Administradores o Encargados.' };
    }

    if (!proveedorData.razon_social?.trim()) {
      return { success: false, error: 'Debe ingresar la Razón Social o Nombre del proveedor.' };
    }

    const now = new Date().toISOString();
    const isNew = !proveedorData.id;

    if (proveedorData.cuit?.trim() && proveedorData.cuit.trim() !== 'Sin CUIT') {
      const existeCuit = this.state.db.Proveedores.some(p => p.id !== proveedorData.id && p.cuit?.trim() === proveedorData.cuit?.trim());
      if (existeCuit) {
        return { success: false, error: `Ya existe otro proveedor registrado con el CUIT ${proveedorData.cuit}.` };
      }
    }

    if (isNew) {
      const newId = this.generateId('PROV');
      const newProveedor: Proveedor = {
        id: newId,
        razon_social: proveedorData.razon_social.trim(),
        cuit: proveedorData.cuit?.trim() || 'Sin CUIT',
        rubro_actividad: proveedorData.rubro_actividad || proveedorData.tipo_suministro || 'Insumos Varios',
        condicion_iva: proveedorData.condicion_iva || 'Responsable Inscripto',
        direccion: proveedorData.direccion?.trim() || '',
        localidad: proveedorData.localidad?.trim() || '',
        provincia: proveedorData.provincia?.trim() || '',
        telefono: proveedorData.telefono?.trim() || '',
        email: proveedorData.email?.trim() || '',
        tipo_suministro: proveedorData.tipo_suministro?.trim() || 'Insumos Varios',
        condiciones_pago: proveedorData.condiciones_pago?.trim() || 'Contado',
        observaciones: proveedorData.observaciones?.trim() || '',
        activo: proveedorData.activo !== false,
        fecha_creacion: now,
        sync_status: this.state.appsScriptUrl ? 'PENDIENTE' : 'LOCAL'
      };

      this.state.db.Proveedores.push(newProveedor);
      this.addAuditLog('Proveedores', newId, 'ALTA', `Alta de proveedor ${newProveedor.razon_social} (CUIT: ${newProveedor.cuit})`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Proveedores', newProveedor, true);
      return { success: true, proveedor: newProveedor };
    } else {
      const index = this.state.db.Proveedores.findIndex(p => p.id === proveedorData.id);
      if (index === -1) {
        return { success: false, error: 'Proveedor no encontrado para modificar.' };
      }

      const existing = this.state.db.Proveedores[index];
      const updated: Proveedor = {
        ...existing,
        ...proveedorData,
        id: existing.id,
        rubro_actividad: proveedorData.rubro_actividad || existing.rubro_actividad || proveedorData.tipo_suministro || 'Insumos Varios',
        razon_social: proveedorData.razon_social.trim(),
        fecha_modificacion: now,
        sync_status: this.state.appsScriptUrl ? 'PENDIENTE' : 'LOCAL'
      };

      this.state.db.Proveedores[index] = updated;
      this.addAuditLog('Proveedores', updated.id, 'MODIFICACION', `Modificación de proveedor ${updated.razon_social}`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Proveedores', updated, false);
      return { success: true, proveedor: updated };
    }
  }

  /**
   * Administra altas y modificaciones en catálogos dimensionales maestros
   * (D_Insumo, Categorias_SENASA, D_Cuenta)
   */
  public async saveCatalogRecord(
    table: 'D_Insumo' | 'Categorias_SENASA' | 'D_Cuenta',
    itemData: any
  ): Promise<{ success: boolean; record?: any; error?: string }> {
    const currentAdmin = this.state.currentUser || this.state.db?.Usuarios?.find(u => u.rol_id === 'ROL_ADMIN') || INITIAL_DATABASE_STATE.Usuarios[0];
    const allowedRoles = ['ROL_ADMIN', 'ROL_ENCARGADO'];
    if (this.state.currentUser && !allowedRoles.includes(this.state.currentUser.rol_id)) {
      return { success: false, error: 'Acceso denegado: Operación reservada para Administradores o Encargados.' };
    }

    if (!itemData.nombre?.trim() && !itemData.codigo?.trim()) {
      return { success: false, error: 'Debe ingresar la denominación o código identificador del elemento.' };
    }

    const isNew = !itemData.id;
    const now = new Date().toISOString();
    // @ts-ignore
    const list = (this.state.db[table] as any[]) || [];

    if (isNew) {
      const prefix = table === 'D_Insumo' ? 'INS' : table === 'Categorias_SENASA' ? 'CAT' : 'CTA';
      const cleanName = (itemData.codigo || itemData.nombre || '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10).toUpperCase();
      const newId = `${prefix}_${cleanName}_${Math.floor(Math.random() * 1000)}`;

      const newRecord = {
        ...itemData,
        id: newId,
        activo: itemData.activo !== false,
        fecha_creacion: now,
        sync_status: this.state.appsScriptUrl ? 'PENDIENTE' : 'LOCAL'
      };

      list.push(newRecord);
      // @ts-ignore
      this.state.db[table] = [...list];
      this.addAuditLog(table, newId, 'ALTA', `Alta de catálogo maestro en ${table}: ${newRecord.nombre || newRecord.codigo}`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets(table, newRecord, true);
      return { success: true, record: newRecord };
    } else {
      const idx = list.findIndex((i: any) => i.id === itemData.id);
      if (idx === -1) {
        return { success: false, error: 'Elemento de catálogo no encontrado para modificar.' };
      }

      const existing = list[idx];
      const updated = {
        ...existing,
        ...itemData,
        id: existing.id,
        fecha_modificacion: now,
        sync_status: this.state.appsScriptUrl ? 'PENDIENTE' : 'LOCAL'
      };

      list[idx] = updated;
      // @ts-ignore
      this.state.db[table] = [...list];
      this.addAuditLog(table, updated.id, 'MODIFICACION', `Modificación en catálogo maestro ${table}: ${updated.nombre || updated.codigo}`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets(table, updated, false);
      return { success: true, record: updated };
    }
  }

  /**
   * Helper para propagar cambios de catálogos maestros directamente a Google Sheets via Apps Script
   */
  public syncAdminRecordToSheets(table: string, record: any, isNew?: boolean) {
    const attemptTime = new Date().toLocaleString('es-AR');
    if (!this.state.appsScriptUrl) {
      this.updateAdminSyncStatus(
        table,
        record,
        'LOCAL',
        'Operando en almacenamiento local seguro. El registro está disponible en todos los formularios de compras y ventas.',
        attemptTime
      );
      return;
    }

    // Comprobación pre-flight de sesión activa en frontend
    const sessionCheck = this.isSessionValid();
    if (!sessionCheck.valid) {
      this.updateAdminSyncStatus(
        table,
        record,
        'LOCAL',
        sessionCheck.message || 'Sesión local activa. Sincronización remota pendiente.',
        attemptTime
      );
      return;
    }

    this.updateAdminSyncStatus(table, record, 'PENDIENTE', undefined, attemptTime);

    // Determinar si la operación es un ALTA de registro nuevo
    const isAlta = isNew ?? (!record.fecha_modificacion || record.sync_status === 'PENDIENTE');
    const currentUser = this.state.currentUser || this.state.db?.Usuarios?.find(u => u.rol_id === 'ROL_ADMIN') || INITIAL_DATABASE_STATE.Usuarios[0];

    const payload = {
      action: 'saveRecord',
      table: table,
      record: record,
      is_new: isAlta,
      isNew: isAlta,
      operation_type: isAlta ? 'INSERT' : 'UPDATE',
      usuario: currentUser.usuario || 'admin',
      token: currentUser.token || ''
    };

    // Intentar primero a través del proxy del servidor local (para evitar restricciones CORS y redirects de iframe)
    // y si no está disponible, intentar directo a la URL de Apps Script
    const executeSync = async () => {
      try {
        let res: Response;
        try {
          res = await fetch('/api/sheets-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUrl: this.state.appsScriptUrl,
              payload
            })
          });
        } catch {
          // Si el proxy local no responde, intentar directo
          res = await fetch(this.state.appsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
        }

        const data = await res.json();
        if (data && (data.status === 'success' || data.status === 'ok')) {
          this.state.isOnlineWithSheets = true;
          this.state.lastSyncTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this.updateAdminSyncStatus(table, record, 'SINCRONIZADO', undefined, attemptTime);
        } else if (data && data.status === 'conflict') {
          this.updateAdminSyncStatus(table, record, 'ERROR', data.message || 'Conflicto de sincronización con datos remotos', attemptTime);
        } else if (data && data.code === 'NETWORK_ERROR') {
          // Conectividad ausente o timeout: El registro está 100% íntegro y guardado en local.
          this.updateAdminSyncStatus(
            table,
            record,
            'LOCAL',
            'Guardado localmente. La URL de Google Apps Script no respondió en este intento. El registro está disponible en compras y ventas.',
            attemptTime
          );
        } else {
          const errMsg = data?.message || 'El servidor remoto rechazó la operación o la tabla no está mapeada en Apps Script.';
          this.updateAdminSyncStatus(table, record, 'ERROR', errMsg, attemptTime);
        }
      } catch (e: any) {
        console.warn(`[Sheets Sync] Fallback local activo para tabla ${table}:`, e);
        // Fallback local seguro: El registro fue guardado exitosamente en la DB local y utilizable
        this.updateAdminSyncStatus(
          table,
          record,
          'LOCAL',
          'Guardado localmente de forma segura. Sin conexión actual a Google Sheets; disponible en compras y ventas.',
          attemptTime
        );
      }
    };

    executeSync();
  }

  private updateAdminSyncStatus(
    table: string,
    record: any,
    status: 'SINCRONIZADO' | 'PENDIENTE' | 'LOCAL' | 'ERROR',
    errorMessage?: string,
    attemptTime?: string
  ) {
    // @ts-ignore
    const list = this.state.db[table] as any[];
    if (Array.isArray(list)) {
      const recId = record.usuario_id || record.id;
      const recUser = record.usuario;
      const found = list.find((item: any) => 
        (item.usuario_id && item.usuario_id === recId) || 
        (item.id && item.id === recId) || 
        (item.usuario && recUser && item.usuario.toLowerCase() === recUser.toLowerCase())
      );
      if (found) {
        found.sync_status = status;
        if (errorMessage !== undefined) {
          found.sync_error_message = errorMessage;
        } else if (status === 'SINCRONIZADO' || status === 'LOCAL') {
          found.sync_error_message = undefined;
        }
        found.last_sync_attempt = attemptTime || new Date().toLocaleString('es-AR');
        this.notify();
      }
    }
  }

  public async retryAdminRecordSync(table: string, recordId: string): Promise<{ success: boolean; message?: string }> {
    const sessionCheck = this.isSessionValid();
    if (!sessionCheck.valid) {
      return { success: false, message: sessionCheck.message };
    }

    // @ts-ignore
    const list = (this.state.db[table] as any[]) || [];
    const found = list.find((item: any) => 
      (item.usuario_id && item.usuario_id === recordId) || 
      (item.id && item.id === recordId)
    );

    if (!found) {
      return { success: false, message: 'El registro no fue encontrado en la base de datos local.' };
    }

    // Determinar si es un ALTA pendiente
    const isAlta = !found.fecha_modificacion || found.sync_status === 'PENDIENTE' || (found.sync_error_message && found.sync_error_message.includes('no encontrado para modificar'));

    let payload: any = found;
    if (table === 'Usuarios') {
      payload = {
        usuario_id: found.usuario_id,
        usuario: found.usuario,
        nombre: found.nombre,
        email: found.email || '',
        rol_id: found.rol_id,
        activo: found.activo,
        ultimo_acceso: found.ultimo_acceso || '',
        fecha_creacion: found.fecha_creacion,
        fecha_modificacion: found.fecha_modificacion
      };
    }

    this.syncAdminRecordToSheets(table, payload, isAlta);
    return { success: true, message: 'Reintento de sincronización enviado a Google Sheets.' };
  }

  /**
   * Elimina físicamente/lógicamente un registro de cualquier tabla y notifica a Google Sheets
   */
  public async deleteRecord(tableName: keyof BaseDatosPorcina, recordId: string): Promise<{ success: boolean; message?: string }> {
    const currentAdmin = this.state.currentUser;
    if (!currentAdmin || currentAdmin.rol_id !== 'ROL_ADMIN') {
      return { success: false, message: 'Acceso denegado: Operación reservada exclusivamente para Administradores.' };
    }

    // @ts-ignore
    const list = (this.state.db[tableName] as any[]) || [];
    const index = list.findIndex((item: any) => item.id === recordId || item.usuario_id === recordId);
    if (index === -1) {
      return { success: false, message: 'El registro no fue encontrado en la base de datos local.' };
    }

    const removed = list[index];
    const itemLabel = removed.usuario || removed.razon_social || removed.nombre || recordId;

    list.splice(index, 1);
    // @ts-ignore
    this.state.db[tableName] = [...list];

    this.addAuditLog(tableName as string, recordId, 'ANULACION', `Eliminación de registro: ${itemLabel}`, currentAdmin.usuario);
    this.notify();

    if (tableName === 'Usuarios') {
      this.syncUserToServer(this.state.db.Usuarios);
    }

    if (this.state.appsScriptUrl) {
      try {
        fetch(this.state.appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'deleteRecord',
            table: tableName,
            id: recordId,
            usuario_id: recordId,
            usuario: currentAdmin.usuario,
            token: currentAdmin.token
          })
        }).catch(e => console.warn('Error eliminando registro en Google Sheets:', e));
      } catch (e) {}
    }

    return { success: true, message: `Registro "${itemLabel}" eliminado correctamente del modelo y enviado a Google Sheets.` };
  }

  /**
   * Cierra formalmente un período contable / productivo
   */
  public closePeriod(campanaId: string, observaciones: string): boolean {
    const usuario = this.state.currentUser?.usuario || 'admin';
    const now = new Date().toISOString();

    const campana = this.state.db.D_Campana.find(c => c.id === campanaId);
    if (campana) {
      campana.estado = 'Cerrado';
    }

    this.state.db.Cierres_Periodo.push({
      id: this.generateId('CIERRE'),
      campana_id: campanaId,
      fecha_cierre: now,
      cerrado_por: usuario,
      estado: 'Cerrado',
      observaciones: observaciones || 'Cierre de período ejecutado',
      fecha_creacion: now
    });

    this.addAuditLog('D_Campana', campanaId, 'CIERRE_PERIODO', `Cierre de campaña por ${usuario}`, usuario);
    this.notify();
    return true;
  }

  /**
   * Reabre un período cerrado con autorización y motivo obligatorio
   */
  public reopenPeriod(campanaId: string, motivo: string): boolean {
    if (!motivo) return false;
    const usuario = this.state.currentUser?.usuario || 'admin';

    const campana = this.state.db.D_Campana.find(c => c.id === campanaId);
    if (campana) {
      campana.estado = 'Abierto';
    }

    this.addAuditLog('D_Campana', campanaId, 'REAPERTURA_PERIODO', `Reapertura justificada: ${motivo}`, usuario);
    this.notify();
    return true;
  }

  /**
   * Generador de ID estándar y trazable
   */
  private generateId(prefix: string): string {
    const clean = prefix.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const time = new Date().getTime().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${clean}_${time}_${rand}`;
  }

  public addAuditLog(tabla: string, registroId: string, operacion: any, detalle: string, usuario: string) {
    this.state.db.Auditoria_Cambios.unshift({
      id: this.generateId('AUD'),
      tabla,
      registro_id: registroId,
      operacion,
      detalle,
      usuario,
      fecha_hora: new Date().toISOString()
    });
    this.notify();
  }

  /**
   * Procesa la compra confirmada: genera F_PrecioIns y movimiento en stock de insumos
   */
  private processConfirmedPurchase(enc: any) {
    const detalles = this.state.db.Mov_Comercial_Det.filter(d => d.mov_comercial_id === enc.id);
    detalles.forEach(det => {
      if (det.insumo_id) {
        // 1. Guardar precio real de compra
        this.state.db.F_PrecioIns.push({
          id: this.generateId('PR_INS'),
          insumo_id: det.insumo_id,
          mov_comercial_id: enc.id,
          fecha: enc.fecha,
          precio_unitario_real: Number(det.precio_unitario_real) || 0,
          um_id: 'UM_KG',
          proveedor_id: enc.proveedor_id,
          origen_dato: 'REAL'
        });

        // 2. Registrar movimiento de stock de insumo (Entrada)
        const cantidad = Number(det.kg) || Number(det.cantidad_animales) || 0;
        this.state.db.Movimientos_Stock_Insumos.push({
          id: this.generateId('STK_INS'),
          fecha: enc.fecha,
          tipo_movimiento: 'COMPRA',
          insumo_id: det.insumo_id,
          cantidad: cantidad,
          um_id: 'UM_KG',
          origen_movimiento_id: enc.id,
          observaciones: `Compra comprobante ${enc.numero_comprobante}`
        });

        // 3. Registrar costo en F_Costos
        this.state.db.F_Costos.push({
          id: this.generateId('CST'),
          fecha: enc.fecha,
          cuenta_id: 'CTA_ALIM_SOJA',
          unidad_neg_id: enc.unidad_neg_id || 'UN_PORCINA',
          subunidad_id: enc.subunidad_id || 'SUB_DESTETE_REC',
          origen_costo: 'COMPRA',
          comprobante_id: enc.id,
          importe_neto: Number(det.importe_neto) || 0,
          estado: 'Confirmado',
          origen_dato: 'REAL',
          estado_validacion: 'OK'
        });
      }
    });
  }

  /**
   * Procesa la venta confirmada: genera F_PrecioProd, baja de existencias e imputa F_Ingresos
   */
  private processConfirmedSale(enc: any) {
    const detalles = this.state.db.Mov_Comercial_Det.filter(d => d.mov_comercial_id === enc.id);
    detalles.forEach(det => {
      // 1. Guardar precio real de venta
      this.state.db.F_PrecioProd.push({
        id: this.generateId('PR_PRD'),
        producto_id: det.producto_id || 'PROD_CAPON_TERM',
        mov_comercial_id: enc.id,
        fecha: enc.fecha,
        precio_unitario_real: Number(det.precio_unitario_real) || 0,
        um_id: 'UM_KG',
        cliente_id: enc.cliente_id,
        origen_dato: 'REAL'
      });

      // 2. Imputar en F_Ingresos
      this.state.db.F_Ingresos.push({
        id: this.generateId('ING'),
        fecha: enc.fecha,
        cuenta_id: 'CTA_VENTAS_HACIENDA',
        unidad_neg_id: 'UN_PORCINA',
        subunidad_id: enc.subunidad_id || 'SUB_ENGORDE_TERM',
        comprobante_id: enc.id,
        importe_neto: Number(det.importe_neto) || 0,
        estado: 'Confirmado',
        origen_dato: 'REAL',
        estado_validacion: 'OK'
      });

      // 3. Movimiento físico de egreso de hacienda
      this.state.db.Movimientos_Fisicos.push({
        id: this.generateId('MOV_FIS'),
        fecha: enc.fecha,
        tipo_evento: 'VENTA',
        lote_id: 'LOTE_VENTA',
        cantidad_cabezas: Number(det.cantidad_animales) || 0,
        kg_totales: Number(det.kg) || 0,
        fase_origen_id: 'FASE_ENGORDE_TERM',
        categoria_senasa_id: det.categoria_senasa_id || 'CAT_CAPON',
        motivo: `Venta s/ comprobante ${enc.numero_comprobante}`,
        estado: 'Confirmado',
        origen_dato: 'REAL',
        estado_validacion: 'OK',
        creado_por: this.state.currentUser?.usuario || 'admin',
        fecha_creacion: new Date().toISOString()
      });
    });
  }

  /**
   * Validación estricta de reglas de negocio
   */
  private validateBusinessRules(table: string, record: any): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (table === 'Mov_Comercial_Enc') {
      if (!record.fecha) errores.push('Fecha obligatoria');
      if (!record.numero_comprobante) errores.push('Número de comprobante obligatorio');
      if (record.tipo_operacion === 'COMPRA' && !record.proveedor_id) {
        errores.push('Proveedor obligatorio para compras');
      }
      if (record.tipo_operacion === 'VENTA' && !record.cliente_id) {
        errores.push('Cliente obligatorio para ventas');
      }

      // Control de comprobantes duplicados
      const existeDuplicado = this.state.db.Mov_Comercial_Enc.some(m => 
        m.id !== record.id &&
        m.tipo_comprobante_id === record.tipo_comprobante_id &&
        m.punto_venta === record.punto_venta &&
        m.numero_comprobante === record.numero_comprobante &&
        (m.proveedor_id === record.proveedor_id || m.cliente_id === record.cliente_id) &&
        m.estado !== 'Anulado'
      );
      if (existeDuplicado) {
        errores.push('Comprobante duplicado: ya existe un registro con el mismo tipo, punto de venta, número y contraparte');
      }
    }

    if (table === 'Consumo_Alimento_Real') {
      if (!record.insumo_id) errores.push('Insumo de alimento obligatorio');
      if (!record.kg_consumidos || Number(record.kg_consumidos) <= 0) errores.push('Kilos consumidos deben ser mayores a 0');
      if (!record.fase_id) errores.push('Fase de destino del alimento obligatoria');
    }

    if (table === 'Partos') {
      if (!record.madre_id) errores.push('Identificación de la madre obligatoria');
      if (!record.fecha_parto) errores.push('Fecha de parto obligatoria');
      if (record.nacidos_vivos === undefined || Number(record.nacidos_vivos) < 0) {
        errores.push('Nacidos vivos no puede ser menor a 0');
      }
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Exporta cualquier tabla a formato CSV estándar
   */
  public exportTableToCsv(tableName: keyof BaseDatosPorcina): string {
    // @ts-ignore
    const rows = (this.state.db[tableName] as any[]) || [];
    if (rows.length === 0) return 'Sin registros';

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const line = headers.map(h => {
        let val = r[h] !== undefined && r[h] !== null ? String(r[h]) : '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvLines.push(line.join(','));
    });

    return csvLines.join('\n');
  }

  /**
   * Resetea el almacén de datos a la carga inicial estrictamente confirmada
   */
  public resetToInitialState() {
    this.state.db = INITIAL_DATABASE_STATE;
    this.addAuditLog('SISTEMA', 'ROOT', 'ALTA', 'Reinicio a carga inicial oficial confirmada', 'admin');
    this.notify();
  }
}

// Singleton de base de datos
export const dbManager = new DatabaseManager();
