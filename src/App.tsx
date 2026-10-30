/**
 * @file App.tsx
 * @description Componente Principal del Sistema Integral de Gestión Ganadera
 * Establecimiento Pozo del Carril – La Aguada | UNRC (Porcinos, Bovinos, Ovinos, Consolidado)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { dbManager, StorageState } from './lib/storage';
import { BaseDatosPorcina } from './types/schema';
import { Header } from './components/Header';
import { Sidebar, ModuleKey } from './components/Sidebar';
import { GeminiAssistant } from './components/GeminiAssistant';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ProduccionView } from './views/ProduccionView';
import { AlimentacionView } from './views/AlimentacionView';
import { ComprasView } from './views/ComprasView';
import { VentasView } from './views/VentasView';
import { StockView } from './views/StockView';
import { ExistenciasView } from './views/ExistenciasView';
import { PresupuestosView } from './views/PresupuestosView';
import { HistoricoEconomicoView } from './views/HistoricoEconomicoView';
import { IndicadoresView } from './views/IndicadoresView';
import { AuditoriaView } from './views/AuditoriaView';
import { ConfiguracionView } from './views/ConfiguracionView';
import { ManualView } from './views/ManualView';
import { UsuariosView } from './views/UsuariosView';
import { GanaderiaBovinaView } from './views/GanaderiaBovinaView';
import { GanaderiaOvinaView } from './views/GanaderiaOvinaView';
import { MajadaOvinaView } from './views/ovinos/MajadaOvinaView';
import { ZafraOvinaView } from './views/ovinos/ZafraOvinaView';
import { SanidadOvinaView } from './views/ovinos/SanidadOvinaView';
import { AlimentacionOvinaView } from './views/ovinos/AlimentacionOvinaView';
import { StockOvinoView } from './views/ovinos/StockOvinoView';
import { ExistenciasOvinaView } from './views/ovinos/ExistenciasOvinaView';
import { ComprasOvinoView } from './views/ovinos/ComprasOvinoView';
import { VentasOvinasView } from './views/ovinos/VentasOvinasView';
import { PresupuestoOvinoView } from './views/ovinos/PresupuestoOvinoView';
import { HistoricoOvinoView } from './views/ovinos/HistoricoOvinoView';
import { IndicadoresOvinoView } from './views/ovinos/IndicadoresOvinoView';
import { ConsolidadoMultiNegocioView } from './views/ConsolidadoMultiNegocioView';
import { DashboardBovinoView } from './views/bovinos/DashboardBovinoView';
import { RodeoBovinoView } from './views/bovinos/RodeoBovinoView';
import { MangaPesadasBovinoView } from './views/bovinos/MangaPesadasBovinoView';
import { AlimentacionPotrerosBovinoView } from './views/bovinos/AlimentacionPotrerosBovinoView';
import { SanidadBovinoView } from './views/bovinos/SanidadBovinoView';
import { SimulacionVentaBovinoView } from './views/bovinos/SimulacionVentaBovinoView';
import { SimulacionVentaPorcinoView } from './views/SimulacionVentaPorcinoView';
import { SimulacionVentaOvinoView } from './views/ovinos/SimulacionVentaOvinoView';
import { VentasBovinoView } from './views/bovinos/VentasBovinoView';
import { ComprasBovinoView } from './views/bovinos/ComprasBovinoView';
import { StockBovinoView } from './views/bovinos/StockBovinoView';
import { ExistenciasBovinoView } from './views/bovinos/ExistenciasBovinoView';
import { PresupuestoBovinoView } from './views/bovinos/PresupuestoBovinoView';
import { HistoricoBovinoView } from './views/bovinos/HistoricoBovinoView';
import { IndicadoresBovinoView } from './views/bovinos/IndicadoresBovinoView';
import { ReorderTabsModal } from './components/ReorderTabsModal';
import { InteractiveTour } from './components/InteractiveTour';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { syncQueue } from './lib/syncQueue';
import { FieldChangeDiff } from './types/sync';
import { ThemeProvider } from './context/ThemeContext';
import { getRolePermissions } from './lib/permissions';
import { 
  BookOpen, 
  LayoutDashboard, 
  Layers, 
  Utensils, 
  Boxes, 
  ShoppingCart, 
  TrendingUp, 
  Compass, 
  Calculator, 
  History, 
  LineChart, 
  ShieldAlert, 
  Settings,
  Users 
} from 'lucide-react';

const DEFAULT_TABS_ORDER: ModuleKey[] = [
  'inicio',
  'produccion',
  'alimentacion',
  'stock',
  'compras',
  'ventas',
  'existencias',
  'presupuesto',
  'historico',
  'indicadores',
  'usuarios',
  'auditoria',
  'configuracion'
];

export default function App() {
  const [state, setState] = useState<StorageState>(dbManager.getState());
  const [activeModule, setActiveModule] = useState<ModuleKey>('inicio');
  const [activeBusinessUnit, setActiveBusinessUnit] = useState<'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO'>('PORCINOS');
  const [consolidadoTab, setConsolidadoTab] = useState<'panel' | 'economico' | 'productivo' | 'auditoria' | 'cmi'>('panel');
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Detección de primer ingreso para la Guía Interactiva
  useEffect(() => {
    if (state.currentUser) {
      try {
        const uId = state.currentUser.usuario_id || 'default';
        const tourStatus = localStorage.getItem(`pozo_del_carril_tour_status_${uId}`);
        if (!tourStatus) {
          setShowTour(true);
        }
      } catch {}
    }
  }, [state.currentUser]);

  // Orden de pestañas configurable a gusto propio persistente
  const [tabsOrder, setTabsOrder] = useState<ModuleKey[]>(() => {
    try {
      const userKey = `pozo_del_carril_nav_order_${dbManager.getState().currentUser?.usuario_id || 'default'}`;
      const saved = localStorage.getItem(userKey) || localStorage.getItem('pozo_del_carril_nav_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TABS_ORDER;
  });

  const handleSaveOrder = (newOrder: ModuleKey[]) => {
    setTabsOrder(newOrder);
    try {
      const userKey = `pozo_del_carril_nav_order_${state.currentUser?.usuario_id || 'default'}`;
      localStorage.setItem(userKey, JSON.stringify(newOrder));
      localStorage.setItem('pozo_del_carril_nav_order', JSON.stringify(newOrder));
    } catch (err) {
      console.error(err);
    }
  };

  const permissions = useMemo(() => getRolePermissions(state.currentUser), [state.currentUser?.rol_id, state.currentUser?.usuario_id]);

  const [conflictState, setConflictState] = useState<{
    isOpen: boolean;
    tableName: string;
    recordId: string;
    unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
    clientData: any;
    remoteData: any;
    clientVersion: number;
    remoteVersion: number;
    diffs: FieldChangeDiff[];
    operationId: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = dbManager.subscribe(() => {
      setState({ ...dbManager.getState() });
    });

    const unsubscribeConflict = syncQueue.onConflictDetected(({ item, remoteRecord }) => {
      const diffs = item.cambios || syncQueue.calculateDiff(remoteRecord, item.payload);
      setConflictState({
        isOpen: true,
        tableName: item.table_name,
        recordId: item.record_id,
        unit: item.unit,
        clientData: item.payload,
        remoteData: remoteRecord,
        clientVersion: item.expected_version,
        remoteVersion: remoteRecord?.version || (item.expected_version + 1),
        diffs: diffs,
        operationId: item.operation_id
      });
    });

    return () => {
      unsubscribe();
      unsubscribeConflict();
    };
  }, []);

  // Asegurar que el módulo activo pertenezca a los módulos permitidos para el rol
  useEffect(() => {
    if (state.currentUser && !permissions.allowedModules.includes(activeModule)) {
      setActiveModule('inicio');
    }
  }, [state.currentUser?.rol_id, activeModule, permissions]);

  // Manejo de autenticación
  const handleLogin = async (usuario: string, contrasena: string) => {
    const res = await dbManager.login(usuario, contrasena);
    if (res.success) {
      setActiveModule('inicio');
      setActiveBusinessUnit('PORCINOS');
      setShowTour(true);
    }
    return res;
  };

  const handleLogout = () => {
    dbManager.logout();
    setActiveModule('inicio');
    setActiveBusinessUnit('PORCINOS');
  };

  const handleSync = async () => {
    await dbManager.syncFromSheets();
  };

  // Guardado / Confirmación / Anulación genérica
  const handleSaveRecord = async (table: keyof BaseDatosPorcina, record: any) => {
    return dbManager.saveRecord(table, record);
  };

  const handleConfirmRecord = async (table: keyof BaseDatosPorcina, id: string) => {
    return dbManager.confirmRecord(table, id);
  };

  const handleCancelRecord = async (table: keyof BaseDatosPorcina, id: string, motivo: string) => {
    return dbManager.cancelRecord(table, id, motivo);
  };

  const handleClosePeriod = async (campanaId: string, obs: string) => {
    return Promise.resolve(dbManager.closePeriod(campanaId, obs));
  };

  const handleReopenPeriod = async (campanaId: string, motivo: string) => {
    return Promise.resolve(dbManager.reopenPeriod(campanaId, motivo));
  };

  const handleSetAppsScriptUrl = (url: string) => {
    dbManager.setAppsScriptUrl(url);
  };

  const handleSetOvinoAppsScriptUrl = (url: string) => {
    dbManager.setOvinoAppsScriptUrl(url);
  };

  // Descarga de CSV
  const handleExportCsv = (tableName: keyof BaseDatosPorcina) => {
    const csvContent = dbManager.exportTableToCsv(tableName);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${String(tableName)}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Si no está autenticado, renderizar Login
  if (!state.currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Conteo de registros observados
  const observedCount = [
    ...state.db.Mov_Comercial_Enc.filter(r => r.estado_validacion === 'Observado'),
    ...state.db.Consumo_Alimento_Real.filter(r => r.estado_validacion === 'Observado'),
    ...state.db.Movimientos_Fisicos.filter(r => r.estado_validacion === 'Observado')
  ].length;

  // Título del módulo activo
  const moduleTitles: Record<ModuleKey, string> = {
    inicio: activeBusinessUnit === 'BOVINOS' ? 'Inicio · Ganadería Bovina' : activeBusinessUnit === 'OVINOS' ? 'Inicio · Ganadería Ovina' : activeBusinessUnit === 'CONSOLIDADO' ? 'Tablero Consolidado Multi-Negocio' : 'Panel General · Producción Porcina',
    produccion: activeBusinessUnit === 'BOVINOS' ? 'Rodeo, Cría & Cabaña Angus' : activeBusinessUnit === 'OVINOS' ? 'Gestión Ovina · Dorper' : 'Producción Porcina',
    bov_rodeo: 'Rodeo, Cría & Cabaña Angus',
    bov_manga: 'Manga & Pesadas (ADPV)',
    bov_alimentacion: 'Alimentación, Potreros & Carga',
    bov_sanidad: 'Sanidad Oficial SENASA',
    bov_simulacion: 'Simulación de Venta Bovina (MAG)',
    alimentacion: activeBusinessUnit === 'BOVINOS' ? 'Alimentación, Potreros & Carga' : 'Alimentación & Raciones',
    compras: activeBusinessUnit === 'BOVINOS' ? 'Compras & Proveedores Bovinos' : 'Compras & Costos Directos',
    ventas: activeBusinessUnit === 'BOVINOS' ? 'Ventas de Hacienda / Liquidaciones' : 'Ventas de Hacienda',
    stock: activeBusinessUnit === 'BOVINOS' ? 'Stock de Insumos Bovinos' : 'Stock Insumos & Transferencias',
    existencias: 'Existencias & Cierres',
    presupuesto: activeBusinessUnit === 'BOVINOS' ? 'Presupuestos & Desvíos Bovinos' : 'Presupuesto y Desvíos',
    historico: activeBusinessUnit === 'BOVINOS' ? 'Histórico Económico Bovino' : 'Histórico Económico',
    indicadores: activeBusinessUnit === 'BOVINOS' ? 'Indicadores & CMI Bovino' : 'Indicadores de Gestión',
    usuarios: 'Gestión de Usuarios & Maestros',
    manual: 'Manual de Uso del Sistema',
    auditoria: 'Auditoría & Trazabilidad',
    configuracion: 'Configuración & Google Sheets',
    tour: 'Guía Interactiva del Sistema',
    gemini: 'Asistente IA de Pozo del Carril',
    ovi_majada: 'Majada y Categorías Ovinas',
    ovi_zafra: 'Zafras Laneras',
    ovi_sanidad: 'Sanidad Ovina',
    porc_simulacion: 'Simulación de Venta Porcina',
    ovi_simulacion: 'Simulación de Venta Ovina (Carne)',
    panel: 'Tablero Consolidado Multi-Negocio',
    economico: 'Estado de Resultados y Conciliación Multi-Negocio',
    productivo: 'Situación Productiva por Especie',
    cmi: 'Cuadro de Mando Integral Consolidado'
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f6f2] font-sans text-[#183123] selection:bg-[#205735] selection:text-white">
      {/* Barra Lateral Izquierda */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        observedCount={observedCount}
        currentUser={state.currentUser}
        activeBusinessUnit={activeBusinessUnit}
        onOpenManual={() => setActiveModule('manual')}
        onOpenGemini={() => setShowGeminiModal(true)}
        onOpenReorderTabs={() => setShowReorderModal(true)}
        customOrder={tabsOrder}
        onStartTour={() => setShowTour(true)}
        consolidadoTab={consolidadoTab}
        onSelectConsolidadoTab={setConsolidadoTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra Superior */}
        <Header
          currentUser={state.currentUser}
          activeModuleTitle={moduleTitles[activeModule]}
          isSyncing={state.isSyncing}
          isOnlineWithSheets={state.isOnlineWithSheets}
          lastSyncTime={state.lastSyncTime}
          onSync={handleSync}
          onLogout={handleLogout}
          onOpenConfig={() => setActiveModule('configuracion')}
          onNavigate={(mod) => setActiveModule(mod)}
          activeBusinessUnit={activeBusinessUnit}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onSelectBusinessUnit={(unit) => {
            setActiveBusinessUnit(unit);
            if (unit === 'CONSOLIDADO') {
              if (!['usuarios', 'configuracion', 'auditoria', 'manual'].includes(activeModule)) {
                setActiveModule('inicio');
              }
              return;
            }

            const commonModules = [
              'compras', 'ventas', 'stock', 'existencias', 'presupuesto',
              'historico', 'indicadores', 'usuarios', 'manual', 'auditoria', 'configuracion'
            ];

            if (unit === 'PORCINOS') {
              if (['bov_rodeo', 'bov_manga', 'ovi_majada', 'ovi_zafra'].includes(activeModule)) {
                setActiveModule('produccion');
              } else if (['bov_alimentacion', 'bov_sanidad', 'ovi_sanidad'].includes(activeModule)) {
                setActiveModule('alimentacion');
              } else if (activeModule === 'bov_simulacion' || activeModule === 'ovi_simulacion') {
                setActiveModule('porc_simulacion');
              } else if (commonModules.includes(activeModule) || activeModule === 'produccion' || activeModule === 'alimentacion' || activeModule === 'porc_simulacion') {
                // Compatible, keep it
              } else {
                setActiveModule('inicio');
              }
            } else if (unit === 'BOVINOS') {
              if (['produccion', 'ovi_majada'].includes(activeModule)) {
                setActiveModule('bov_rodeo');
              } else if (activeModule === 'alimentacion') {
                setActiveModule('bov_alimentacion');
              } else if (activeModule === 'porc_simulacion' || activeModule === 'ovi_simulacion') {
                setActiveModule('bov_simulacion');
              } else if (['bov_rodeo', 'bov_manga', 'bov_alimentacion', 'bov_sanidad', 'bov_simulacion'].includes(activeModule) || commonModules.includes(activeModule)) {
                // Compatible, keep it
              } else {
                setActiveModule('inicio');
              }
            } else if (unit === 'OVINOS') {
              if (['produccion', 'bov_rodeo', 'bov_manga'].includes(activeModule)) {
                setActiveModule('ovi_majada');
              } else if (activeModule === 'bov_sanidad') {
                setActiveModule('ovi_sanidad');
              } else if (activeModule === 'bov_alimentacion') {
                setActiveModule('alimentacion');
              } else if (activeModule === 'porc_simulacion' || activeModule === 'bov_simulacion') {
                setActiveModule('ovi_simulacion');
              } else if (['ovi_majada', 'ovi_zafra', 'ovi_sanidad', 'ovi_simulacion'].includes(activeModule) || commonModules.includes(activeModule) || activeModule === 'alimentacion') {
                // Compatible, keep it
              } else {
                setActiveModule('inicio');
              }
            }
          }}
        />

        {/* Viewport de Contenido con Scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <ThemeProvider activeBusinessUnit={activeBusinessUnit}>
            {activeBusinessUnit === 'CONSOLIDADO' && !['usuarios', 'configuracion', 'auditoria', 'manual'].includes(activeModule) ? (
              <ConsolidadoMultiNegocioView
                db={state.db}
                currentUser={state.currentUser}
                onNavigate={(mod) => setActiveModule(mod)}
                activeTab={consolidadoTab}
                onTabChange={setConsolidadoTab}
              />
            ) : activeBusinessUnit === 'BOVINOS' && !['usuarios', 'configuracion', 'auditoria', 'manual'].includes(activeModule) ? (
              <>
                {activeModule === 'inicio' && (
                  <DashboardBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onNavigate={(mod) => setActiveModule(mod)}
                  />
                )}
                {(activeModule === 'bov_rodeo' || activeModule === 'produccion') && (
                  <RodeoBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'bov_manga' && (
                  <MangaPesadasBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {(activeModule === 'bov_alimentacion' || activeModule === 'alimentacion') && (
                  <AlimentacionPotrerosBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'bov_sanidad' && (
                  <SanidadBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'compras' && (
                  <ComprasBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'stock' && (
                  <StockBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'ventas' && (
                  <VentasBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'bov_simulacion' && (
                  <SimulacionVentaBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                  />
                )}
                {activeModule === 'presupuesto' && (
                  <PresupuestoBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'historico' && (
                  <HistoricoBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onExportCsv={handleExportCsv}
                  />
                )}
                {activeModule === 'indicadores' && (
                  <IndicadoresBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'existencias' && (
                  <ExistenciasBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {/* Fallback para evitar pantalla en blanco en Bovinos */}
                {![
                  'inicio', 'bov_rodeo', 'produccion', 'bov_manga', 'bov_alimentacion',
                  'alimentacion', 'bov_sanidad', 'compras', 'stock', 'ventas',
                  'bov_simulacion', 'presupuesto', 'historico', 'indicadores', 'existencias'
                ].includes(activeModule) && (
                  <DashboardBovinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onNavigate={(mod) => setActiveModule(mod)}
                  />
                )}
              </>
            ) : activeBusinessUnit === 'OVINOS' && !['usuarios', 'configuracion', 'auditoria', 'manual'].includes(activeModule) ? (
              <>
                {activeModule === 'inicio' && (
                  <GanaderiaOvinaView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {(activeModule === 'ovi_majada' || activeModule === 'produccion') && (
                  <MajadaOvinaView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'ovi_zafra' && (
                  <ZafraOvinaView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'ovi_sanidad' && (
                  <SanidadOvinaView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'alimentacion' && (
                  <AlimentacionOvinaView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'stock' && (
                  <StockOvinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'existencias' && (
                  <ExistenciasOvinaView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'compras' && (
                  <ComprasOvinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'ventas' && (
                  <VentasOvinasView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'ovi_simulacion' && (
                  <SimulacionVentaOvinoView
                    db={state.db}
                    currentUser={state.currentUser}
                  />
                )}
                {activeModule === 'presupuesto' && (
                  <PresupuestoOvinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {activeModule === 'historico' && (
                  <HistoricoOvinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onExportCsv={handleExportCsv}
                  />
                )}
                {activeModule === 'indicadores' && (
                  <IndicadoresOvinoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
                {/* Fallback para evitar pantalla en blanco en Ovinos */}
                {![
                  'inicio', 'ovi_majada', 'produccion', 'ovi_zafra', 'ovi_sanidad', 'alimentacion',
                  'stock', 'existencias', 'compras', 'ventas', 'ovi_simulacion', 'presupuesto', 'historico', 'indicadores'
                ].includes(activeModule) && (
                  <GanaderiaOvinaView
                    db={state.db}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
              </>
            ) : (
              <>
                {activeModule === 'inicio' && (
                  <DashboardView
                    db={state.db}
                    onNavigate={(mod) => setActiveModule(mod)}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}

                {activeModule === 'produccion' && (
                  <ProduccionView
                    db={state.db}
                    onSaveRecord={handleSaveRecord}
                    onConfirmRecord={handleConfirmRecord}
                    onCancelRecord={handleCancelRecord}
                    onExportCsv={handleExportCsv}
                    currentUser={state.currentUser}
                  />
                )}

                {activeModule === 'alimentacion' && (
                  <AlimentacionView
                    db={state.db}
                    onSaveRecord={handleSaveRecord}
                    onConfirmRecord={handleConfirmRecord}
                    onCancelRecord={handleCancelRecord}
                    onExportCsv={handleExportCsv}
                    currentUser={state.currentUser}
                  />
                )}

                {activeModule === 'compras' && (
                  <ComprasView
                    db={state.db}
                    onSaveRecord={handleSaveRecord}
                    onConfirmRecord={handleConfirmRecord}
                    onCancelRecord={handleCancelRecord}
                    onExportCsv={handleExportCsv}
                    currentUser={state.currentUser}
                  />
                )}

                {activeModule === 'ventas' && (
                  <VentasView
                    db={state.db}
                    onSaveRecord={handleSaveRecord}
                    onConfirmRecord={handleConfirmRecord}
                    onCancelRecord={handleCancelRecord}
                    onExportCsv={handleExportCsv}
                    currentUser={state.currentUser}
                  />
                )}

                {activeModule === 'porc_simulacion' && (
                  <SimulacionVentaPorcinoView
                    db={state.db}
                    currentUser={state.currentUser}
                  />
                )}

                {activeModule === 'stock' && (
                  <StockView
                    db={state.db}
                    onSaveRecord={handleSaveRecord}
                    onConfirmRecord={handleConfirmRecord}
                    onCancelRecord={handleCancelRecord}
                    onExportCsv={handleExportCsv}
                    currentUser={state.currentUser}
                  />
                )}

                {activeModule === 'existencias' && (
                  <ExistenciasView
                    db={state.db}
                    onSaveRecord={handleSaveRecord}
                    onClosePeriod={handleClosePeriod}
                    onReopenPeriod={handleReopenPeriod}
                    onExportCsv={handleExportCsv}
                    currentUser={state.currentUser}
                  />
                )}

                {activeModule === 'presupuesto' && (
                  <PresupuestosView
                    db={state.db}
                    onSaveRecord={handleSaveRecord}
                    currentUser={state.currentUser}
                  />
                )}

                {activeModule === 'historico' && (
                  <HistoricoEconomicoView
                    db={state.db}
                    currentUser={state.currentUser}
                    onExportCsv={handleExportCsv}
                  />
                )}

                {activeModule === 'indicadores' && (
                  <IndicadoresView 
                    db={state.db} 
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}

                {activeModule === 'auditoria' && (
                  <AuditoriaView
                    db={state.db}
                    onSaveRecord={handleSaveRecord}
                    onExportCsv={handleExportCsv}
                    currentUser={state.currentUser}
                    onNavigate={(mod) => setActiveModule(mod)}
                  />
                )}

                {activeModule === 'manual' && (
                  <ManualView
                    currentUser={state.currentUser}
                    onOpenGemini={() => setShowGeminiModal(true)}
                    onOpenReorderTabs={() => setShowReorderModal(true)}
                    onStartTour={() => setShowTour(true)}
                  />
                )}

                {activeModule === 'usuarios' && (
                  <UsuariosView
                    db={state.db}
                    currentUser={state.currentUser}
                    isOnlineWithSheets={state.isOnlineWithSheets}
                    onSync={async () => {
                      await handleSync();
                      return dbManager.getState().isOnlineWithSheets;
                    }}
                  />
                )}

                {activeModule === 'configuracion' && (
                  <ConfiguracionView
                    db={state.db}
                    appsScriptUrl={state.appsScriptUrl}
                    ovinoAppsScriptUrl={state.ovinoAppsScriptUrl}
                    isOnlineWithSheets={state.isOnlineWithSheets}
                    isOnlineOvinoWithSheets={state.isOnlineOvinoWithSheets}
                    onSetAppsScriptUrl={handleSetAppsScriptUrl}
                    onSetOvinoAppsScriptUrl={handleSetOvinoAppsScriptUrl}
                    onSaveRecord={handleSaveRecord}
                    onExportCsv={handleExportCsv}
                    currentUser={state.currentUser}
                    onOpenReorderTabs={() => setShowReorderModal(true)}
                  />
                )}

                {/* Fallback para evitar pantalla en blanco en Porcinos */}
                {![
                  'inicio', 'produccion', 'alimentacion', 'compras', 'ventas', 'porc_simulacion', 'stock',
                  'existencias', 'presupuesto', 'historico', 'indicadores', 'auditoria',
                  'manual', 'usuarios', 'configuracion'
                ].includes(activeModule) && (
                  <DashboardView
                    db={state.db}
                    onNavigate={(mod) => setActiveModule(mod)}
                    currentUser={state.currentUser}
                    onSaveRecord={handleSaveRecord}
                  />
                )}
              </>
            )}
          </ThemeProvider>
        </main>
      </div>

      {/* Modal para Personalizar Orden de Pestañas */}
      <ReorderTabsModal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        currentOrder={tabsOrder}
        onSaveOrder={handleSaveOrder}
        defaultOrder={DEFAULT_TABS_ORDER}
        allModules={[
          { key: 'inicio', label: 'Panel General', icon: LayoutDashboard },
          { key: 'produccion', label: 'Producción', icon: Layers },
          { key: 'alimentacion', label: 'Alimentación', icon: Utensils },
          { key: 'stock', label: 'Stock', icon: Boxes },
          { key: 'compras', label: 'Compras', icon: ShoppingCart },
          { key: 'ventas', label: 'Ventas', icon: TrendingUp },
          { key: 'existencias', label: 'Existencias', icon: Compass },
          { key: 'presupuesto', label: 'Presupuesto y Desvíos', icon: Calculator },
          { key: 'historico', label: 'Histórico Económico', icon: History },
          { key: 'indicadores', label: 'Indicadores de Gestión', icon: LineChart },
          { key: 'usuarios', label: 'Usuarios', icon: Users },
          { key: 'auditoria', label: 'Auditoría', icon: ShieldAlert },
          { key: 'configuracion', label: 'Configuración', icon: Settings }
        ]}
      />

      {/* Modal del Asistente IA */}
      {showGeminiModal && (
        <GeminiAssistant 
          onClose={() => setShowGeminiModal(false)}
          activeUnit={activeBusinessUnit}
          activeModule={activeModule}
          selectedCampana="CAMP_2024_2025"
        />
      )}

      {/* Guía Interactiva */}
      <InteractiveTour
        isOpen={showTour}
        currentUser={state.currentUser}
        onClose={() => setShowTour(false)}
        onNavigate={(mod) => setActiveModule(mod)}
      />

      {/* Modal de Resolución de Conflictos Concurrencia (OCC) - Paso B2 */}
      {conflictState && (
        <ConflictResolutionModal
          isOpen={conflictState.isOpen}
          onClose={() => setConflictState(null)}
          recordTitle={`${conflictState.unit} · ${conflictState.tableName} (${conflictState.recordId})`}
          expectedVersion={conflictState.clientVersion}
          remoteVersion={conflictState.remoteVersion}
          remoteModifiedBy={conflictState.remoteData?.modificado_por || 'Usuario Remoto'}
          remoteModifiedAt={conflictState.remoteData?.updated_at || conflictState.remoteData?.fecha_modificacion}
          diffs={conflictState.diffs}
          onReloadLatest={async () => {
            if (conflictState.operationId) {
              syncQueue.removeOperation(conflictState.operationId);
            }
            await dbManager.syncFromSheets();
            setConflictState(null);
          }}
          onApplyChangesOnLatest={() => {
            if (conflictState.operationId) {
              syncQueue.removeOperation(conflictState.operationId);
            }
            if (conflictState.remoteData) {
              // @ts-ignore
              const list = (dbManager.getState().db[conflictState.tableName] as any[]) || [];
              const idx = list.findIndex(r => r.id === conflictState.recordId);
              if (idx !== -1) {
                list[idx] = conflictState.remoteData;
                // @ts-ignore
                dbManager.getState().db[conflictState.tableName] = [...list];
              }
            }
            setConflictState(null);
          }}
        />
      )}
    </div>
  );
}
