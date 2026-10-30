/**
 * @file ConfiguracionView.tsx
 * @description Módulo de Configuración, ABM de Maestros, Conexión Google Sheets,
 * Diccionario de Datos, Lista de Faltantes y Guía Técnica de Despliegue.
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  BookOpen, 
  HelpCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw,
  Plus,
  Table,
  CheckCircle2,
  FileCode2,
  SlidersHorizontal,
  Clock,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { BaseDatosPorcina, Usuario } from '../types/schema';
import { DataTable, Column } from '../components/DataTable';
import { StatusTag } from '../components/StatusTag';
import { getRolePermissions } from '../lib/permissions';
import { syncQueue } from '../lib/syncQueue';

interface Props {
  db: BaseDatosPorcina;
  appsScriptUrl: string;
  ovinoAppsScriptUrl: string;
  isOnlineWithSheets: boolean;
  isOnlineOvinoWithSheets: boolean;
  onSetAppsScriptUrl: (url: string) => void;
  onSetOvinoAppsScriptUrl: (url: string) => void;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  onExportCsv: (table: keyof BaseDatosPorcina) => void;
  currentUser?: Usuario | null;
  onOpenReorderTabs?: () => void;
}

export const ConfiguracionView: React.FC<Props> = ({
  db,
  appsScriptUrl,
  ovinoAppsScriptUrl,
  isOnlineWithSheets,
  isOnlineOvinoWithSheets,
  onSetAppsScriptUrl,
  onSetOvinoAppsScriptUrl,
  onSaveRecord,
  onExportCsv,
  currentUser = null,
  onOpenReorderTabs
}) => {
  const permissions = getRolePermissions(currentUser);
  const [activeTab, setActiveTab] = useState<'conexion' | 'maestros' | 'diccionario' | 'pendientes' | 'riesgos'>('conexion');
  const [inputUrl, setInputUrl] = useState(appsScriptUrl);
  const [inputOvinoUrl, setInputOvinoUrl] = useState(ovinoAppsScriptUrl);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testResult, setTestResult] = useState<{message: string; success: boolean} | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResultOvino, setTestResultOvino] = useState<{message: string; success: boolean} | null>(null);
  const [isTestingOvino, setIsTestingOvino] = useState(false);

  // Mantener sincronizado el input cuando la URL se recupera asíncronamente del servidor
  React.useEffect(() => {
    if (appsScriptUrl && !inputUrl) {
      setInputUrl(appsScriptUrl);
    }
  }, [appsScriptUrl]);

  React.useEffect(() => {
    if (ovinoAppsScriptUrl && !inputOvinoUrl) {
      setInputOvinoUrl(ovinoAppsScriptUrl);
    }
  }, [ovinoAppsScriptUrl]);

  if (!permissions.canManageConfig) {
    return (
      <div className="bg-white rounded-2xl border border-[#d8e2d7] p-8 text-center max-w-lg mx-auto my-12 shadow-2xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#fef8ee] text-[#a16207] flex items-center justify-center mx-auto border border-[#f5dcba]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#143422]">Acceso Restringido al Módulo de Configuración</h2>
          <p className="text-xs text-[#526a5c] mt-1 leading-relaxed">
            Su rango actual (<strong>{permissions.roleName}</strong>) no posee permisos de administrador general para modificar parámetros de sistema, endpoints de Google Apps Script o estructuras maestras.
          </p>
        </div>
        <div className="text-[11px] text-[#71887b] bg-[#f8faf8] p-3 rounded-lg border border-[#e2eae2]">
          Para solicitar cambios de configuración, contacte a un usuario con rango de Administrador.
        </div>
      </div>
    );
  }

  // Selector de maestro a visualizar/editar
  const [selectedMaestro, setSelectedMaestro] = useState<keyof BaseDatosPorcina>('D_Subunidad');

  const handleGuardarUrl = () => {
    if (!inputUrl.trim()) {
      setTestResult({ message: 'Debe ingresar una URL de Google Apps Script', success: false });
      return;
    }
    onSetAppsScriptUrl(inputUrl.trim());
    setTestResult({ message: 'URL guardada correctamente', success: true });
  };

  const handleGuardarOvinoUrl = () => {
    if (!inputOvinoUrl.trim()) {
      setTestResultOvino({ message: 'Debe ingresar una URL de Google Apps Script', success: false });
      return;
    }
    onSetOvinoAppsScriptUrl(inputOvinoUrl.trim());
    setTestResultOvino({ message: 'URL guardada correctamente', success: true });
  };

  const handleProbarConexion = async () => {
    if (!inputUrl.trim()) {
      setTestResult({ message: 'Debe ingresar una URL de Google Apps Script', success: false });
      return;
    }
    onSetAppsScriptUrl(inputUrl.trim());

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${inputUrl.trim()}?action=ping`);
      const data = await res.json();
      if (data.status === 'success') {
        setTestResult({ message: `Conexión exitosa: ${data.message}`, success: true });
      } else {
        setTestResult({ message: `Respuesta inesperada: ${JSON.stringify(data)}`, success: false });
      }
    } catch (e: any) {
      setTestResult({ message: `Error de conexión: ${e.message}`, success: false });
    } finally {
      setIsTesting(false);
    }
  };

  const handleProbarConexionOvino = async () => {
    if (!inputOvinoUrl.trim()) {
      setTestResultOvino({ message: 'Debe ingresar una URL de Google Apps Script', success: false });
      return;
    }
    onSetOvinoAppsScriptUrl(inputOvinoUrl.trim());

    setIsTestingOvino(true);
    setTestResultOvino(null);

    try {
      const res = await fetch(`${inputOvinoUrl.trim()}?action=ping`);
      const data = await res.json();
      if (data.status === 'success') {
        setTestResultOvino({ message: `Conexión exitosa: ${data.message}`, success: true });
      } else {
        setTestResultOvino({ message: `Respuesta inesperada: ${JSON.stringify(data)}`, success: false });
      }
    } catch (e: any) {
      setTestResultOvino({ message: `Error de conexión: ${e.message}`, success: false });
    } finally {
      setIsTestingOvino(false);
    }
  };

  // --- CONTROL DE CONCURRENCIA & MIGRACIÓN B2 ---
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isCheckingMigration, setIsCheckingMigration] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [outboxStats, setOutboxStats] = useState(() => ({
    total: syncQueue.getAll().length,
    pending: syncQueue.getPending().length
  }));

  React.useEffect(() => {
    const unsub = syncQueue.subscribe(() => {
      setOutboxStats({
        total: syncQueue.getAll().length,
        pending: syncQueue.getPending().length
      });
    });
    return () => unsub();
  }, []);

  const handleCheckMigration = async () => {
    if (!inputUrl.trim()) return;
    setIsCheckingMigration(true);
    try {
      const res = await fetch(`${inputUrl.trim()}?action=checkMigrationStatus`);
      const json = await res.json();
      setMigrationStatus(json);
    } catch (err: any) {
      setMigrationStatus({ status: 'error', message: err.message });
    } finally {
      setIsCheckingMigration(false);
    }
  };

  const handleRunMigration = async () => {
    if (!inputUrl.trim()) return;
    const ok = confirm('¿Desea ejecutar la migración no destructiva B2 en Google Sheets? Esto añadirá las columnas "version" y "updated_at" a las tablas y configurará la hoja de idempotencia sin borrar ningún dato existente.');
    if (!ok) return;

    setIsMigrating(true);
    try {
      const res = await fetch(`${inputUrl.trim()}?action=runMigrationB2`);
      const json = await res.json();
      setMigrationStatus(json);
      alert('Migración ejecutada con éxito: ' + (json.message || 'Tablas actualizadas.'));
    } catch (err: any) {
      alert('Error ejecutando migración remota: ' + err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleProcessOutbox = async () => {
    if (!inputUrl.trim()) {
      alert('Debe tener configurada la URL de Apps Script para procesar la cola.');
      return;
    }
    const token = (currentUser as any)?.token;
    const res = await syncQueue.processPendingQueue(inputUrl.trim(), token);
    alert(`Cola procesada: ${res.succeeded} sincronizados, ${res.conflicts} en conflicto, ${res.errors} con error.`);
  };

  const handleCopiarCodigo = () => {
    // Código de Code.gs embebido para copiar en 1 clic
    const codeGs = `// Código completo disponible en el archivo /apps-script/Code.gs del repositorio
// Contiene la función handleInstallInitialData() y todos los endpoints doGet() y doPost().`;
    navigator.clipboard.writeText(codeGs);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Encabezado y Selector de Sub-Módulos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#143422] tracking-tight">
              Configuración & Conectividad del Sistema Ganadero
            </h2>
            <span className="text-[10px] font-mono text-[#255e39] bg-[#edf6f0] px-2 py-0.2 rounded border border-[#cbe3d2]">
              Administración
            </span>
          </div>
          <p className="text-xs text-[#5c7767] mt-0.5">
            Integración Google Sheets, ABM de tablas maestras, diccionario de datos y control de pendientes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenReorderTabs && (
            <button
              onClick={onOpenReorderTabs}
              className="px-3 py-1.5 rounded-lg border border-[#c8d8ca] bg-[#edf6f0] text-[#1c4b31] font-bold text-xs hover:bg-[#dcf3e4] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Personalizar el orden de las pestañas"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Personalizar Pestañas</span>
            </button>
          )}

          <div className="flex flex-wrap items-center p-1 bg-[#ebf0ea] border border-[#d2ded1] rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('conexion')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'conexion' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
            }`}
          >
            Google Sheets & Apps Script
          </button>
          <button
            onClick={() => setActiveTab('maestros')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'maestros' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
            }`}
          >
            Tablas Maestras (ABM)
          </button>
          <button
            onClick={() => setActiveTab('diccionario')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'diccionario' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
            }`}
          >
            Diccionario de Datos
          </button>
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'pendientes' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
            }`}
          >
            Datos Pendientes
          </button>
          <button
            onClick={() => setActiveTab('riesgos')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'riesgos' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
            }`}
          >
            Riesgos & Límites
          </button>
        </div>
        </div>
      </div>

      {/* 1. PESTAÑA: CONEXIÓN CON GOOGLE SHEETS */}
      {activeTab === 'conexion' && (
        <div className="space-y-5">
          {/* Panel de Configuración de la URL */}
          <div className="bg-white p-5 rounded-xl border border-[#d8e2d7] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5eee4] pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#1b6b3e]" />
                <h3 className="text-sm font-bold text-[#143422]">
                  Enlace con Google Sheets (Backend Apps Script)
                </h3>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded font-semibold ${isOnlineWithSheets ? 'bg-[#edf7f0] text-[#1b5c34] border border-[#cbe5d3]' : 'bg-[#f4f7f4] text-[#4d6657] border border-[#d8e3d8]'}`}>
                {isOnlineWithSheets ? 'Conexión Activa con Sheets' : 'Modo Almacén Local Integrado'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#1e3c29]">
                URL de la Aplicación Web de Google Apps Script:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-[#cbd8cb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#225a38] font-mono text-[#153422] bg-[#fbfdfb]"
                />
                <button
                  type="button"
                  onClick={handleGuardarUrl}
                  className="px-3 py-2 bg-[#edf6f0] hover:bg-[#dcf3e4] text-[#1c4b31] border border-[#bbf7d0] text-xs font-bold rounded-lg transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                  title="Guardar URL en navegador y servidor de forma permanente"
                >
                  Guardar URL
                </button>
                <button
                  type="button"
                  onClick={handleProbarConexion}
                  disabled={isTesting}
                  className="px-4 py-2 bg-[#1d4c32] hover:bg-[#153e27] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer border border-[#163c26]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Probando...' : 'Guardar y Probar'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                El sistema lee y escribe de forma bidireccional contra su hoja de cálculo mediante esta API REST segura.
              </p>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg text-xs border ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                {testResult.message}
              </div>
            )}
          </div>



          {/* Guía Paso a Paso de Conexión (Sección 2 y 13) */}
          <div className="bg-white p-5 rounded-xl border border-[#d8e2d7] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5eee4] pb-3">
              <h3 className="text-sm font-bold text-[#143422]">
                Guía Paso a Paso: Cómo Conectar Google Sheets con el Sistema
              </h3>
              <span className="text-[11px] text-[#5c7767] font-medium">Procedimiento oficial Grupo 2</span>
            </div>

            <div className="space-y-4 text-xs text-[#2b4436]">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e8f3ec] text-[#1b6b3e] font-bold flex items-center justify-center shrink-0 border border-[#cbe1d3]">1</div>
                <div>
                  <h4 className="font-bold text-[#143422]">Crear la Planilla en Google Drive</h4>
                  <p className="text-[#4e6859] mt-0.5">
                    Cree una nueva hoja de cálculo en su Google Drive con el nombre <strong>"Sistema de Gestión - Pozo del Carril"</strong>. No es necesario crear pestañas a mano; el script las creará automáticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e8f3ec] text-[#1b6b3e] font-bold flex items-center justify-center shrink-0 border border-[#cbe1d3]">2</div>
                <div>
                  <h4 className="font-bold text-[#143422]">Abrir el Editor de Google Apps Script</h4>
                  <p className="text-[#4e6859] mt-0.5">
                    En la barra superior de Google Sheets, vaya al menú <strong>Extensiones &gt; Apps Script</strong>. Se abrirá una pestaña con el editor de código.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e8f3ec] text-[#1b6b3e] font-bold flex items-center justify-center shrink-0 border border-[#cbe1d3]">3</div>
                <div>
                  <h4 className="font-bold text-[#143422]">Copiar el Código del Backend (Code.gs)</h4>
                  <p className="text-[#4e6859] mt-0.5">
                    Copie todo el contenido del archivo <code>apps-script/Code.gs</code> provisto en este sistema y péguelo en el editor de Apps Script reemplazando el código por defecto. Luego presione <strong>Guardar (Ctrl+S)</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e8f3ec] text-[#1b6b3e] font-bold flex items-center justify-center shrink-0 border border-[#cbe1d3]">4</div>
                <div>
                  <h4 className="font-bold text-[#143422]">Ejecutar la Instalación Inicial de Tablas</h4>
                  <p className="text-[#4e6859] mt-0.5">
                    En la barra superior de Apps Script, seleccione la función <strong>handleInstallInitialData</strong> y haga clic en <strong>Ejecutar</strong>. Google solicitará otorgar permisos por primera vez; autorice el acceso a la hoja. Esto creará las más de 25 pestañas con sus columnas y los datos reales confirmados (sin borrar datos si se vuelve a correr).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e8f3ec] text-[#1b6b3e] font-bold flex items-center justify-center shrink-0 border border-[#cbe1d3]">5</div>
                <div>
                  <h4 className="font-bold text-[#143422]">Implementar como Aplicación Web (Configuración Crítica de Permisos)</h4>
                  <p className="text-[#4e6859] mt-0.5">
                    Haga clic en el botón azul <strong>Implementar &gt; Nueva implementación</strong>. Seleccione el tipo <strong>Aplicación web</strong>:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[#4e6859]">
                    <li>Descripción: <em>API Pozo del Carril v1</em></li>
                    <li>Ejecutar como: <strong>Yo (su cuenta de Google)</strong></li>
                    <li>Quién tiene acceso: <strong>Cualquier persona (Anyone)</strong>. <em>Esto es obligatorio para evitar bloqueos de CORS en el navegador. La autenticación la realiza el script internamente.</em></li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#e8f3ec] text-[#1b6b3e] font-bold flex items-center justify-center shrink-0 border border-[#cbe1d3]">6</div>
                <div>
                  <h4 className="font-bold text-[#143422]">Pegar la URL en la Configuración</h4>
                  <p className="text-[#4e6859] mt-0.5">
                    Copie la URL que finaliza en <code>/exec</code> y péguela en el casillero de arriba. Haga clic en <strong>Guardar y Probar Conexión</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#ebf0ea] text-[#2e4738] font-bold flex items-center justify-center shrink-0 border border-[#d2ded1]">7</div>
                <div>
                  <h4 className="font-bold text-[#143422]">Cómo Actualizar la Implementación si Cambia el Código</h4>
                  <p className="text-[#4e6859] mt-0.5">
                    Si modifica el código en Apps Script, debe ir a <strong>Implementar &gt; Gestionar implementaciones &gt; Editar (ícono de lápiz) &gt; Versión: Nueva versión &gt; Implementar</strong>. Si no crea una nueva versión, Google seguirá ejecutando el código anterior.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PESTAÑA: ABM DE TABLAS MAESTRAS */}
      {activeTab === 'maestros' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#143422]">
                Mantenimiento de Tablas Maestras (Dimensiones)
              </h3>
              <p className="text-xs text-[#5c7767]">
                Agregar o modificar maestros sin tocar el código. Se aplica baja lógica (activo: false).
              </p>
            </div>

            <select
              value={selectedMaestro}
              onChange={e => setSelectedMaestro(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold bg-[#f8faf8] border border-[#cbd8cb] rounded-lg text-[#143422] focus:ring-2 focus:ring-[#225a38]"
            >
              <option value="D_Subunidad">D_Subunidad (Subunidades)</option>
              <option value="D_UnidadNeg">D_UnidadNeg (Unidades de Negocio)</option>
              <option value="Fases_Proceso">Fases_Proceso (Fases)</option>
              <option value="Categorias_SENASA">Categorias_SENASA (Categorías)</option>
              <option value="D_Insumo">D_Insumo (Alimentos y Sanidad)</option>
              <option value="D_Producto">D_Producto (Productos)</option>
              <option value="D_Cuenta">D_Cuenta (Plan de Cuentas)</option>
              <option value="Proveedores">Proveedores</option>
              <option value="Clientes">Clientes</option>
              <option value="Usuarios">Usuarios del Sistema</option>
              <option value="Roles">Roles y Permisos</option>
            </select>
          </div>

          {/* Renderizado de la tabla seleccionada */}
          <DataTable<any>
            columns={[
              { key: 'id', header: 'ID / Código', render: (r: any) => r.id || r.usuario_id || r.rol_id || r.parametro },
              { key: 'nombre', header: 'Nombre / Denominación', render: (r: any) => r.nombre || r.razon_social || r.usuario || r.codigo || r.descripcion || r.id },
              { 
                key: 'activo', 
                header: 'Estado', 
                render: (r: any) => (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${r.activo !== false ? 'bg-[#edf7f0] text-[#1b5c34] border-[#cbe5d3]' : 'bg-[#fdf2f2] text-[#8f2828] border-[#f8c8c8]'}`}>
                    {r.activo !== false ? 'Activo' : 'Baja Lógica'}
                  </span>
                )
              }
            ]}
            data={(db[selectedMaestro] as any[]) || []}
            title={`Maestro: ${selectedMaestro}`}
            subtitle="Registros parametrizados en la base de datos"
            onExportCsv={() => onExportCsv(selectedMaestro)}
          />
        </div>
      )}

      {/* 3. PESTAÑA: DICCIONARIO DE DATOS COMPLETO */}
      {activeTab === 'diccionario' && (
        <div className="bg-white p-5 rounded-xl border border-[#d8e2d7] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5eee4] pb-3">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-[#1b6b3e]" />
              <h3 className="text-sm font-bold text-[#143422]">
                Diccionario de Datos: Estructura de Tablas en Google Sheets
              </h3>
            </div>
            <span className="text-xs text-[#5c7767] font-mono bg-[#edf6f0] px-2.5 py-1 rounded border border-[#cbe3d2]">
              25+ Hojas Relacionales en 3FN
            </span>
          </div>

          <p className="text-xs text-[#4e6859]">
            Cada tabla ocupa una hoja distinta en el archivo de Google Sheets. La fila 1 contiene los encabezados en <code>snake_case</code>. Toda clave foránea referencia al ID único de la tabla dimensional correspondiente.
          </p>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#f8faf8] rounded-lg border border-[#dbe4db]">
              <h4 className="font-bold text-[#143422] mb-1">A. Seguridad y Configuración</h4>
              <ul className="space-y-1 text-[#4e6859]">
                <li>• <strong>Usuarios:</strong> <code>usuario_id (PK), usuario, contrasena_hash, nombre, rol_id (FK), activo, ultimo_acceso</code></li>
                <li>• <strong>Roles:</strong> <code>rol_id (PK), nombre, permisos_acciones, activo</code></li>
                <li>• <strong>Config_Sistema:</strong> <code>parametro (PK), valor, descripcion, fecha_modificacion</code></li>
                <li>• <strong>Referencias_Relevadas:</strong> <code>id (PK), indicador, valor, periodo, fuente, origen_dato, notas</code></li>
              </ul>
            </div>

            <div className="p-3 bg-[#f8faf8] rounded-lg border border-[#dbe4db]">
              <h4 className="font-bold text-[#143422] mb-1">B. Tablas Maestras (Dimensionales)</h4>
              <ul className="space-y-1 text-[#4e6859]">
                <li>• <strong>D_UnidadNeg:</strong> <code>id (PK), nombre, tipo_actividad, activo</code></li>
                <li>• <strong>D_Subunidad:</strong> <code>id (PK), unidad_neg_id (FK), nombre, tipo (PRODUCTIVA/DE_APOYO), activo</code></li>
                <li>• <strong>Fases_Proceso:</strong> <code>id (PK), nombre, orden, peso_min, peso_max, duracion_referencia_dias, subunidad_id (FK), activo</code></li>
                <li>• <strong>Categorias_SENASA:</strong> <code>id (PK), nombre, peso_min, peso_max, sexo_aplica, activo</code> (Independiente de Fases)</li>
                <li>• <strong>D_Insumo:</strong> <code>id (PK), nombre, tipo_insumo, es_alimento, um_id (FK), cuenta_id (FK), activo</code></li>
                <li>• <strong>D_Producto:</strong> <code>id (PK), nombre, categoria_senasa_id (FK), um_id (FK), activo</code></li>
                <li>• <strong>D_Cuenta:</strong> <code>id (PK), codigo, nombre, rubro, tipo_cuenta, imputable, activo</code></li>
                <li>• <strong>D_Campana:</strong> <code>id (PK), nombre, fecha_desde, fecha_hasta, estado, activo</code></li>
                <li>• <strong>Lotes_Animales:</strong> <code>id (PK), codigo_lote, fecha_formacion, origen, fase_actual_id (FK), subunidad_id (FK), sector_fisico_id, cabezas_actuales, kg_actuales, estado</code></li>
                <li>• <strong>Madres_Padrillos:</strong> <code>id (PK), identificacion_caravana, tipo_animal, linea_genetica, fecha_ingreso, estado, fecha_baja, motivo_baja</code></li>
              </ul>
            </div>

            <div className="p-3 bg-[#f8faf8] rounded-lg border border-[#dbe4db]">
              <h4 className="font-bold text-[#143422] mb-1">C. Parámetros Técnicos</h4>
              <ul className="space-y-1 text-[#4e6859]">
                <li>• <strong>F_EstandarRinde:</strong> <code>id (PK), campana_id (FK), subunidad_id (FK), indicador_rendimiento, valor_esperado, um_id, origen_dato</code> (UNIQUE campana_id + subunidad_id)</li>
                <li>• <strong>F_Dosis:</strong> <code>id (PK), fase_id (FK), subunidad_id (FK), insumo_id (FK), cantidad_animal_dia, cantidad_kg_ganancia, um_id, vigencia_desde, vigencia_hasta, origen_dato</code></li>
              </ul>
            </div>

            <div className="p-3 bg-[#f8faf8] rounded-lg border border-[#dbe4db]">
              <h4 className="font-bold text-[#143422] mb-1">D. Hechos y Movimientos (Transaccionales)</h4>
              <ul className="space-y-1 text-[#4e6859]">
                <li>• <strong>Mov_Comercial_Enc:</strong> <code>id (PK), tipo_comprobante_id, punto_venta, numero_comprobante, fecha, proveedor_id, cliente_id, tipo_operacion, unidad_neg_id, subunidad_id, total_neto, total_iva, total_percepciones, total_retenciones, total_final, estado, origen_dato, estado_validacion, observacion_validacion, creado_por, fecha_creacion...</code></li>
                <li>• <strong>Mov_Comercial_Det:</strong> <code>id (PK), mov_comercial_id (FK), numero_linea, insumo_id, producto_id, categoria_senasa_id, cantidad_animales, kg, precio_unitario_real, importe_neto, alicuota_iva, importe_iva, destino_productivo_id</code></li>
                <li>• <strong>F_PrecioIns / F_PrecioProd:</strong> <code>id (PK), insumo_id/producto_id, mov_comercial_id (FK), fecha, precio_unitario_real, um_id, proveedor_id/cliente_id, origen_dato</code></li>
                <li>• <strong>F_Costos / F_Ingresos:</strong> <code>id (PK), fecha, cuenta_id, unidad_neg_id, subunidad_id, fase_id, lote_id, importe_neto, estado, origen_dato, estado_validacion</code></li>
                <li>• <strong>Movimientos_Fisicos:</strong> <code>id (PK), fecha, tipo_evento, lote_id, madre_id, cantidad_cabezas, kg_totales, fase_origen_id, fase_destino_id, categoria_senasa_id, motivo, estado, origen_dato, estado_validacion</code></li>
                <li>• <strong>Partos:</strong> <code>id (PK), madre_id, padrillo_id, fecha_parto, nacidos_vivos, nacidos_muertos, fecha_destete, destetados, lote_generado_id, estado, origen_dato</code></li>
                <li>• <strong>Movimientos_Stock_Insumos:</strong> <code>id (PK), fecha, tipo_movimiento, insumo_id, cantidad, um_id, origen_movimiento_id, observaciones</code></li>
                <li>• <strong>Consumo_Alimento_Real:</strong> <code>id (PK), fecha, insumo_id, kg_consumidos, fase_id, subunidad_id, lote_id, costo_unitario_imputado, costo_total_imputado, estado, origen_dato</code></li>
                <li>• <strong>Movimientos_Internos:</strong> <code>id (PK), fecha, unidad_origen_id, unidad_destino_id, insumo_id, cantidad, um_id, criterio_valorizacion, valor_unitario, valor_total, estado</code></li>
                <li>• <strong>Cierres_Periodo:</strong> <code>id (PK), campana_id, fecha_cierre, cerrado_por, estado, observaciones, fecha_creacion</code></li>
                <li>• <strong>Auditoria_Cambios:</strong> <code>id (PK), tabla, registro_id, operacion, detalle, usuario, fecha_hora</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. PESTAÑA: DATOS PENDIENTES DE CONFIRMAR */}
      {activeTab === 'pendientes' && (
        <div className="bg-white p-5 rounded-xl border border-[#d8e2d7] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5eee4] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#b45309]" />
              <h3 className="text-sm font-bold text-[#143422]">
                Lista de Datos Faltantes a Confirmar con el Establecimiento
              </h3>
            </div>
            <span className="text-xs text-[#855110] bg-[#fef8ee] px-2 py-0.5 rounded font-semibold border border-[#f6dfba]">
              No inventados en el código
            </span>
          </div>

          <p className="text-xs text-[#4e6859]">
            Conforme a la consigna estricta, ningún dato fue inventado. Los siguientes parámetros se mantienen vacíos o con valores provisionales hasta su validación con el encargado de <strong>Pozo del Carril</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#f8faf8] border border-[#dbe4db] rounded-lg space-y-1">
              <h4 className="font-bold text-[#143422]">1. Rangos de Peso SENASA</h4>
              <p className="text-[#4e6859]">
                Confirmar los valores exactos de <code>peso_min</code> y <code>peso_max</code> para las 6 categorías SENASA (Lechón, Cachorro, Capón, MEJ, Cerda descarte, Padrillo descarte) según la balanza del establecimiento.
              </p>
            </div>

            <div className="p-3 bg-[#f8faf8] border border-[#dbe4db] rounded-lg space-y-1">
              <h4 className="font-bold text-[#143422]">2. Consumo Real en Destete (Reemplazo ICA 1.75)</h4>
              <p className="text-[#4e6859]">
                El ICA de 1.75 es un <strong>SUPUESTO</strong> estimado provisoriamente por el Grupo 2. Debe ser sustituido por el pesaje de raciones de alimento peleteado fases 1 y 2 cuando se releve.
              </p>
            </div>

            <div className="p-3 bg-[#f8faf8] border border-[#dbe4db] rounded-lg space-y-1">
              <h4 className="font-bold text-[#143422]">3. Identificación Individual del Plantel</h4>
              <p className="text-[#4e6859]">
                Carga de las caravanas y fecha de alta individual de las 34 madres (Landrace × Yorkshire) y los padrillos terminales en la hoja <code>Madres_Padrillos</code>.
              </p>
            </div>

            <div className="p-3 bg-[#f8faf8] border border-[#dbe4db] rounded-lg space-y-1">
              <h4 className="font-bold text-[#143422]">4. Criterio de Valorización del Maíz Propio</h4>
              <p className="text-[#4e6859]">
                Definir formalmente si el maíz transferido desde la Unidad Agrícola se valoriza a <em>Costo de Producción</em>, a <em>Precio de Mercado / FAS Teórico</em> o a <em>VNR</em>.
              </p>
            </div>

            <div className="p-3 bg-[#f8faf8] border border-[#dbe4db] rounded-lg space-y-1">
              <h4 className="font-bold text-[#143422]">5. Dosis Técnicas Diarias (F_Dosis)</h4>
              <p className="text-[#4e6859]">
                Pauta de racionamiento diario por animal/día en gestación, lactancia y recría para permitir el cálculo del consumo esperado por curva teórica.
              </p>
            </div>

            <div className="p-3 bg-[#f8faf8] border border-[#dbe4db] rounded-lg space-y-1">
              <h4 className="font-bold text-[#143422]">6. Plan de Cuentas Contable Definitivo</h4>
              <p className="text-[#4e6859]">
                Validar la codificación contable definitiva de las cuentas de costo directo e indirecto con la administración del establecimiento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. PESTAÑA: RIESGOS Y LIMITACIONES */}
      {activeTab === 'riesgos' && (
        <div className="bg-white p-5 rounded-xl border border-[#d8e2d7] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5eee4] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#9e2a2b]" />
              <h3 className="text-sm font-bold text-[#143422]">
                Análisis de Riesgos & Limitaciones Técnicas de Google Sheets / Apps Script
              </h3>
            </div>
            <span className="text-xs text-[#5c7767] font-medium">Evaluación de Arquitectura</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#fdf2f2] border border-[#f8c8c8] rounded-lg space-y-1">
              <h4 className="font-bold text-[#8a1c1c]">1. Límite de Tamaño de Google Sheets (10 millones de celdas)</h4>
              <p className="text-[#6b1414]">
                Google Sheets tiene un límite máximo de 10.000.000 de celdas por libro. Aunque es holgado para una unidad porcina de 34 madres, con miles de pesadas y consumos diarios a lo largo de los años se requerirá archivar campañas históricas en libros satélites.
              </p>
            </div>

            <div className="p-3 bg-[#fef8ee] border border-[#f6dfba] rounded-lg space-y-1">
              <h4 className="font-bold text-[#855110]">2. Límite de Ejecución de Google Apps Script (6 minutos por llamada)</h4>
              <p className="text-[#6d410b]">
                Toda ejecución de Apps Script se cancela automáticamente si supera los 360 segundos (6 minutos). Procesos masivos de recálculo contable anual deben ejecutarse por lotes pequeños (batching).
              </p>
            </div>

            <div className="p-3 bg-[#fef8ee] border border-[#f6dfba] rounded-lg space-y-1">
              <h4 className="font-bold text-[#855110]">3. Concurrencia y Bloqueos de Escritura (LockService)</h4>
              <p className="text-[#6d410b]">
                Google Apps Script no es un motor de base de datos relacional con ACID nativo. Para evitar colisiones cuando dos usuarios graban simultáneamente, el script implementa <code>LockService.getScriptLock()</code> con timeout de 30 segundos, lo que puede provocar demoras si la concurrencia es alta.
              </p>
            </div>

            <div className="p-3 bg-[#f8faf8] border border-[#dbe4db] rounded-lg space-y-1">
              <h4 className="font-bold text-[#143422]">4. Cuotas Diarias de Google (Triggers y URL Fetch)</h4>
              <p className="text-[#4e6859]">
                Las cuentas gratuitas de Google (@gmail.com) tienen cuotas estrictas de 20.000 llamadas/día a Web Apps y 90 minutos/día de tiempo de cómputo total. Para uso intensivo en campo, se recomienda cuenta corporativa de Google Workspace.
              </p>
            </div>

            <div className="p-3 bg-[#f8faf8] border border-[#dbe4db] rounded-lg space-y-1">
              <h4 className="font-bold text-[#143422]">5. Latencia de Red en Campo y Modo Desconectado</h4>
              <p className="text-[#4e6859]">
                En zonas rurales como La Aguada, la conexión a internet puede ser intermitente. Google Apps Script requiere conexión continua para guardar en Sheets; por ello el frontend incorpora este almacén local sincronizado para amortiguar cortes temporales sin perder datos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
