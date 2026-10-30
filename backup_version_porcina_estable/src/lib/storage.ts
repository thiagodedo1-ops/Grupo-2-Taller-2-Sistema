/**
 * @file storage.ts
 * @description Gestor de persistencia, sincronización bidireccional y comunicación con Google Sheets / Apps Script
 */

import { BaseDatosPorcina, Usuario, EstadoTransaccion, EstadoValidacion, Cliente, Proveedor } from '../types/schema';
import { INITIAL_DATABASE_STATE } from './constants';
import { hashPassword, verifyPassword } from './security';

const LOCAL_STORAGE_KEY = 'pozo_del_carril_db_v1';
const SCRIPT_URL_STORAGE_KEY = 'pozo_del_carril_apps_script_url';
const SESSION_STORAGE_KEY = 'pozo_del_carril_session_user';

export interface StorageState {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  appsScriptUrl: string;
  isSyncing: boolean;
  isOnlineWithSheets: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
}

class DatabaseManager {
  private state: StorageState;
  private listeners: (() => void)[] = [];

  constructor() {
    const savedUrl = localStorage.getItem(SCRIPT_URL_STORAGE_KEY) || '';
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
        // Asegurar que los perfiles base (admin, encargado, operario, auditor) siempre existan
        INITIAL_DATABASE_STATE.Usuarios.forEach(defaultUser => {
          if (!initialDb.Usuarios.some(u => u.usuario.toLowerCase() === defaultUser.usuario.toLowerCase())) {
            initialDb.Usuarios.push(defaultUser);
          }
        });

        // 4. Estandarización obligatoria del catálogo maestro de alimentos
        const standardizedFoods = [
          { id: 'INS_MAIZ_PROP', nombre: 'Maíz propio.', tipo_insumo: 'GRANO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_MAIZ', activo: true },
          { id: 'INS_PELLET_SOJA', nombre: 'Pellet de soja.', tipo_insumo: 'PROTEICO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_SOJA', activo: true },
          { id: 'INS_CONC_CRIA', nombre: 'Alimento concentrado iniciador (Cría).', tipo_insumo: 'BALANCEADO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_PELET', activo: true },
          { id: 'INS_PELETEADO_DEST', nombre: 'Alimento concentrado (Destete).', tipo_insumo: 'BALANCEADO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_PELET', activo: true }
        ];

        const existingInsumos = Array.isArray(initialDb.D_Insumo) ? [...initialDb.D_Insumo] : [];
        const nonFoodInsumos = existingInsumos.filter(i => !i.es_alimento && !standardizedFoods.some(sf => sf.id === i.id));
        const otherFoodInsumos = existingInsumos.filter(i => 
          i.es_alimento && 
          !standardizedFoods.some(sf => sf.id === i.id) &&
          !['maiz', 'maíz', 'soja', 'pelet', 'concentrado'].some(k => i.nombre.toLowerCase().includes(k))
        );

        initialDb.D_Insumo = [
          ...standardizedFoods,
          ...nonFoodInsumos,
          ...otherFoodInsumos
        ];

        // Mapear movimientos históricos que referencien denominaciones anteriores equivalentes verificadas
        const insumoMap: Record<string, string> = {
          'INS_MAIZ': 'INS_MAIZ_PROP',
          'INS_SOJA': 'INS_PELLET_SOJA',
          'INS_PELETEADO_CRIA': 'INS_CONC_CRIA',
          'INS_CONCENTRADO_CRIA': 'INS_CONC_CRIA',
          'INS_CONCENTRADO_DESTETE': 'INS_PELETEADO_DEST'
        };

        if (initialDb.Consumo_Alimento_Real) {
          initialDb.Consumo_Alimento_Real.forEach(c => {
            if (c.insumo_id && insumoMap[c.insumo_id]) {
              c.insumo_id = insumoMap[c.insumo_id];
            }
          });
        }
        if (initialDb.Movimientos_Stock_Insumos) {
          initialDb.Movimientos_Stock_Insumos.forEach(m => {
            if (m.insumo_id && insumoMap[m.insumo_id]) {
              m.insumo_id = insumoMap[m.insumo_id];
            }
          });
        }
        if (initialDb.Movimientos_Internos) {
          initialDb.Movimientos_Internos.forEach(m => {
            if (m.insumo_id && insumoMap[m.insumo_id]) {
              m.insumo_id = insumoMap[m.insumo_id];
            }
          });
        }
        if (initialDb.Mov_Comercial_Det) {
          initialDb.Mov_Comercial_Det.forEach(d => {
            if (d.insumo_id && insumoMap[d.insumo_id]) {
              d.insumo_id = insumoMap[d.insumo_id];
            }
          });
        }
      } catch (e) {
        console.warn('Error reading saved local DB, using initial state', e);
      }
    }

    this.state = {
      db: initialDb,
      currentUser: initialUser,
      appsScriptUrl: savedUrl,
      isSyncing: false,
      isOnlineWithSheets: false,
      lastSyncTime: null,
      syncError: null
    };

    if (savedUrl) {
      // Intentar sincronización inicial en background si hay URL
      this.syncFromSheets();
    }
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

  public setAppsScriptUrl(url: string) {
    this.state.appsScriptUrl = url.trim();
    localStorage.setItem(SCRIPT_URL_STORAGE_KEY, this.state.appsScriptUrl);
    this.notify();
    if (url.trim()) {
      return this.syncFromSheets();
    }
  }

  /**
   * Autenticación con backend (Google Sheets o validación local estricta)
   */
  public async login(usuarioInput: string, passwordInput: string): Promise<{ success: boolean; message?: string }> {
    const trimmedUser = usuarioInput.trim().toLowerCase();
    
    // Si hay URL de Apps Script configurada, validar con el backend
    if (this.state.appsScriptUrl) {
      try {
        const response = await fetch(this.state.appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'login',
            usuario: usuarioInput,
            contrasena: passwordInput
          })
        });

        const result = await response.json();
        if (result.status === 'success' && result.user) {
          this.state.currentUser = {
            usuario_id: result.user.id || result.user.usuario_id,
            usuario: result.user.usuario,
            nombre: result.user.nombre,
            rol_id: result.user.rol_id,
            activo: true,
            ultimo_acceso: new Date().toISOString()
          };
          this.state.isOnlineWithSheets = true;
          this.notify();
          await this.syncFromSheets();
          return { success: true };
        } else {
          return { success: false, message: result.message || 'Error al autenticar' };
        }
      } catch (err: any) {
        console.warn('Apps Script login unreachable, testing against loaded database table...', err);
      }
    }

    // Validación contra la tabla Usuarios en la base de datos cargada
    const userFound = this.state.db.Usuarios.find(
      u => u.usuario.trim().toLowerCase() === trimmedUser
    );

    if (!userFound) {
      return { success: false, message: 'El usuario no existe' };
    }

    if (!userFound.activo) {
      return { success: false, message: 'El usuario está inactivo. Contacte al administrador.' };
    }

    // Verificación segura de credenciales con hash criptográfico
    const isPasswordValid = await verifyPassword(passwordInput, userFound.contrasena_hash);
    if (!isPasswordValid) {
      return { success: false, message: 'La contraseña es incorrecta' };
    }

    // Si la contraseña estaba en texto plano legacy, migrar automáticamente a hash seguro
    let currentHash = userFound.contrasena_hash;
    if (currentHash && !currentHash.startsWith('sha256:')) {
      currentHash = await hashPassword(passwordInput);
    }

    // Login exitoso
    const updatedUser: Usuario = {
      ...userFound,
      contrasena_hash: currentHash,
      ultimo_acceso: new Date().toISOString()
    };

    // Actualizar usuario en tabla
    this.state.db.Usuarios = this.state.db.Usuarios.map(u => 
      u.usuario_id === updatedUser.usuario_id ? updatedUser : u
    );

    // Registrar en auditoría
    this.addAuditLog('Usuarios', updatedUser.usuario_id, 'LOGIN', 'Ingreso exitoso al sistema', updatedUser.usuario);

    this.state.currentUser = updatedUser;
    this.notify();
    return { success: true };
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
        // Merge seguro con la base de datos manteniendo integridad
        const sheetsData = json.data;
        const newDb = { ...this.state.db };

        Object.keys(sheetsData).forEach((tableKey) => {
          if (Array.isArray(sheetsData[tableKey]) && sheetsData[tableKey].length > 0) {
            // @ts-ignore
            newDb[tableKey] = sheetsData[tableKey];
          }
        });

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
    record: T
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

    if (!record.id) {
      // Alta nueva
      record.id = this.generateId(tableName as string);
      // @ts-ignore
      record.creado_por = usuario;
      // @ts-ignore
      record.fecha_creacion = now;
      if (!record.estado) record.estado = 'Borrador';
      // @ts-ignore
      if (!record.origen_dato) record.origen_dato = 'REAL';

      // Agregar a la tabla local
      // @ts-ignore
      this.state.db[tableName] = [...(this.state.db[tableName] || []), record];
      this.addAuditLog(tableName as string, record.id, 'ALTA', `Alta de registro (${record.estado})`, usuario);

    } else {
      // Modificación
      // @ts-ignore
      record.modificado_por = usuario;
      // @ts-ignore
      record.fecha_modificacion = now;

      // @ts-ignore
      const tableList = (this.state.db[tableName] as any[]) || [];
      const index = tableList.findIndex(item => item.id === record.id);
      if (index !== -1) {
        tableList[index] = { ...tableList[index], ...record };
        // @ts-ignore
        this.state.db[tableName] = [...tableList];
        this.addAuditLog(tableName as string, record.id, 'MODIFICACION', 'Actualización de registro', usuario);
      }
    }

    this.notify();

    // Si está conectado a Apps Script, propagar inmediatamente
    if (this.state.appsScriptUrl) {
      try {
        fetch(this.state.appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveRecord',
            table: tableName,
            record: record,
            usuario: usuario
          })
        }).catch(e => console.warn('Background sync failed:', e));
      } catch (e) {}
    }

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
      rol_id: string;
      activo: boolean;
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

      if (!initialPassword || initialPassword.length < 6) {
        return { success: false, error: 'La contraseña inicial debe tener como mínimo 6 caracteres.' };
      }

      const passwordHash = await hashPassword(initialPassword);
      const newUserId = this.generateId('USR');

      const newUser: Usuario = {
        usuario_id: newUserId,
        usuario: trimmedUser,
        nombre: userData.nombre.trim(),
        rol_id: userData.rol_id || 'ROL_OPERARIO',
        activo: userData.activo !== false,
        contrasena_hash: passwordHash,
        requiere_cambio_clave: true,
        fecha_creacion: now,
        ultimo_acceso: ''
      };

      this.state.db.Usuarios.push(newUser);
      this.addAuditLog('Usuarios', newUserId, 'ALTA', `Creación de usuario ${trimmedUser} (${userData.rol_id})`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Usuarios', {
        usuario_id: newUser.usuario_id,
        usuario: newUser.usuario,
        nombre: newUser.nombre,
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
      if (initialPassword && initialPassword.trim().length >= 6) {
        newHash = await hashPassword(initialPassword.trim());
      }

      const updatedUser: Usuario = {
        ...existing,
        usuario: trimmedUser,
        nombre: userData.nombre.trim(),
        rol_id: userData.rol_id,
        activo: userData.activo,
        contrasena_hash: newHash,
        fecha_modificacion: now
      };

      this.state.db.Usuarios[index] = updatedUser;
      this.addAuditLog('Usuarios', updatedUser.usuario_id, 'MODIFICACION', `Modificación de usuario ${trimmedUser} (Rol: ${userData.rol_id}, Activo: ${userData.activo})`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Usuarios', {
        usuario_id: updatedUser.usuario_id,
        usuario: updatedUser.usuario,
        nombre: updatedUser.nombre,
        rol_id: updatedUser.rol_id,
        activo: updatedUser.activo,
        ultimo_acceso: updatedUser.ultimo_acceso || '',
        fecha_modificacion: updatedUser.fecha_modificacion
      });

      return { success: true, user: updatedUser };
    }
  }

  public async resetUserPassword(usuarioId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const currentAdmin = this.state.currentUser;
    if (!currentAdmin || currentAdmin.rol_id !== 'ROL_ADMIN') {
      return { success: false, error: 'Acceso denegado: Operación reservada exclusivamente para Administradores.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    const index = this.state.db.Usuarios.findIndex(u => u.usuario_id === usuarioId);
    if (index === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const hashed = await hashPassword(newPassword);
    const user = this.state.db.Usuarios[index];
    user.contrasena_hash = hashed;
    user.requiere_cambio_clave = true;
    user.fecha_modificacion = new Date().toISOString();

    this.addAuditLog('Usuarios', usuarioId, 'SEGURIDAD', `Restablecimiento de contraseña para usuario ${user.usuario}`, currentAdmin.usuario);
    this.notify();

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
    this.addAuditLog('Usuarios', usuarioId, 'ESTADO', `${activo ? 'Activación' : 'Desactivación'} de usuario ${this.state.db.Usuarios[index].usuario}`, currentAdmin.usuario);
    this.notify();

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
    const currentAdmin = this.state.currentUser;
    if (!currentAdmin || currentAdmin.rol_id !== 'ROL_ADMIN') {
      return { success: false, error: 'Acceso denegado: Operación reservada exclusivamente para Administradores.' };
    }

    if (!clienteData.razon_social?.trim()) {
      return { success: false, error: 'Debe ingresar la Razón Social o Nombre del cliente.' };
    }

    const now = new Date().toISOString();
    const isNew = !clienteData.id;

    if (isNew) {
      if (clienteData.cuit?.trim() && clienteData.cuit.trim() !== 'Sin CUIT') {
        const existeCuit = this.state.db.Clientes.some(c => c.cuit?.trim() === clienteData.cuit?.trim());
        if (existeCuit) {
          return { success: false, error: `Ya existe un cliente registrado con el CUIT ${clienteData.cuit}.` };
        }
      }

      const newId = this.generateId('CLI');
      const newCliente: Cliente = {
        id: newId,
        razon_social: clienteData.razon_social.trim(),
        cuit: clienteData.cuit?.trim() || 'Sin CUIT',
        condicion_iva: clienteData.condicion_iva || 'Responsable Inscripto',
        direccion: clienteData.direccion?.trim() || '',
        localidad: clienteData.localidad?.trim() || '',
        provincia: clienteData.provincia?.trim() || '',
        telefono: clienteData.telefono?.trim() || '',
        email: clienteData.email?.trim() || '',
        condiciones_pago: clienteData.condiciones_pago?.trim() || 'Contado',
        observaciones: clienteData.observaciones?.trim() || '',
        activo: clienteData.activo !== false,
        fecha_creacion: now
      };

      this.state.db.Clientes.push(newCliente);
      this.addAuditLog('Clientes', newId, 'ALTA', `Alta de cliente ${newCliente.razon_social} (CUIT: ${newCliente.cuit})`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Clientes', newCliente);
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
        razon_social: clienteData.razon_social.trim(),
        fecha_modificacion: now
      };

      this.state.db.Clientes[index] = updated;
      this.addAuditLog('Clientes', updated.id, 'MODIFICACION', `Modificación de cliente ${updated.razon_social}`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Clientes', updated);
      return { success: true, cliente: updated };
    }
  }

  /**
   * =========================================================================
   * ADMINISTRACIÓN CENTRALIZADA: PROVEEDORES
   * =========================================================================
   */
  public async saveProveedor(proveedorData: Partial<Proveedor>): Promise<{ success: boolean; proveedor?: Proveedor; error?: string }> {
    const currentAdmin = this.state.currentUser;
    if (!currentAdmin || currentAdmin.rol_id !== 'ROL_ADMIN') {
      return { success: false, error: 'Acceso denegado: Operación reservada exclusivamente para Administradores.' };
    }

    if (!proveedorData.razon_social?.trim()) {
      return { success: false, error: 'Debe ingresar la Razón Social o Nombre del proveedor.' };
    }

    const now = new Date().toISOString();
    const isNew = !proveedorData.id;

    if (isNew) {
      if (proveedorData.cuit?.trim() && proveedorData.cuit.trim() !== 'Sin CUIT') {
        const existeCuit = this.state.db.Proveedores.some(p => p.cuit?.trim() === proveedorData.cuit?.trim());
        if (existeCuit) {
          return { success: false, error: `Ya existe un proveedor registrado con el CUIT ${proveedorData.cuit}.` };
        }
      }

      const newId = this.generateId('PROV');
      const newProveedor: Proveedor = {
        id: newId,
        razon_social: proveedorData.razon_social.trim(),
        cuit: proveedorData.cuit?.trim() || 'Sin CUIT',
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
        fecha_creacion: now
      };

      this.state.db.Proveedores.push(newProveedor);
      this.addAuditLog('Proveedores', newId, 'ALTA', `Alta de proveedor ${newProveedor.razon_social} (CUIT: ${newProveedor.cuit})`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Proveedores', newProveedor);
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
        razon_social: proveedorData.razon_social.trim(),
        fecha_modificacion: now
      };

      this.state.db.Proveedores[index] = updated;
      this.addAuditLog('Proveedores', updated.id, 'MODIFICACION', `Modificación de proveedor ${updated.razon_social}`, currentAdmin.usuario);
      this.notify();

      this.syncAdminRecordToSheets('Proveedores', updated);
      return { success: true, proveedor: updated };
    }
  }

  /**
   * Helper para propagar cambios de catálogos maestros directamente a Google Sheets via Apps Script
   */
  private syncAdminRecordToSheets(table: string, record: any) {
    if (!this.state.appsScriptUrl) return;
    try {
      fetch(this.state.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveRecord',
          table: table,
          record: record,
          usuario: this.state.currentUser?.usuario || 'admin'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'success') {
          this.state.isOnlineWithSheets = true;
          this.state.lastSyncTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this.notify();
        }
      })
      .catch(e => {
        console.warn(`[Sheets Sync] Fallback local activo para tabla ${table}:`, e);
      });
    } catch (e) {}
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

  private addAuditLog(tabla: string, registroId: string, operacion: any, detalle: string, usuario: string) {
    this.state.db.Auditoria_Cambios.unshift({
      id: this.generateId('AUD'),
      tabla,
      registro_id: registroId,
      operacion,
      detalle,
      usuario,
      fecha_hora: new Date().toISOString()
    });
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
