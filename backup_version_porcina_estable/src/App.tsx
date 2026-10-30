/**
 * @file App.tsx
 * @description Componente Principal del Sistema de Gestión - Unidad Porcina Pozo del Carril
 * Taller de Práctica II - FCE UNRC - Grupo 2
 */

import React, { useState, useEffect } from 'react';
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
import { ReorderTabsModal } from './components/ReorderTabsModal';
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
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);

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

  const permissions = getRolePermissions(state.currentUser);

  useEffect(() => {
    const unsubscribe = dbManager.subscribe(() => {
      setState({ ...dbManager.getState() });
    });
    return () => unsubscribe();
  }, []);

  // Asegurar que el módulo activo pertenezca a los módulos permitidos para el rol
  useEffect(() => {
    if (state.currentUser && !permissions.allowedModules.includes(activeModule)) {
      setActiveModule('inicio');
    }
  }, [state.currentUser, activeModule, permissions.allowedModules]);

  // Manejo de autenticación
  const handleLogin = async (usuario: string, contrasena: string) => {
    const res = await dbManager.login(usuario, contrasena);
    if (res.success) {
      setActiveModule('inicio');
    }
    return res;
  };

  const handleLogout = () => {
    dbManager.logout();
    setActiveModule('inicio');
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
    inicio: 'Inicio · Panel de Control',
    produccion: 'Producción Porcina',
    alimentacion: 'Alimentación & Raciones',
    compras: 'Compras & Costos Directos',
    ventas: 'Ventas de Hacienda',
    stock: 'Stock Insumos & Transferencias',
    existencias: 'Existencias & Cierres',
    presupuesto: 'Presupuesto y Desvíos',
    historico: 'Histórico Económico',
    indicadores: 'Indicadores de Gestión',
    usuarios: 'Gestión de Usuarios & Maestros',
    manual: 'Manual de Uso del Sistema',
    auditoria: 'Auditoría & Trazabilidad',
    configuracion: 'Configuración & Google Sheets'
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f6f2] font-sans text-[#183123] selection:bg-[#205735] selection:text-white">
      {/* Barra Lateral Izquierda con filtro de módulos según Rango y orden configurable */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        observedCount={observedCount}
        currentUser={state.currentUser}
        onOpenManual={() => setActiveModule('manual')}
        onOpenGemini={() => setShowGeminiModal(true)}
        onOpenReorderTabs={() => setShowReorderModal(true)}
        customOrder={tabsOrder}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra Superior con Rango */}
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
        />

        {/* Viewport de Contenido con Scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
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
            />
          )}

          {activeModule === 'manual' && (
            <ManualView
              currentUser={state.currentUser}
              onOpenGemini={() => setShowGeminiModal(true)}
              onOpenReorderTabs={() => setShowReorderModal(true)}
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
              isOnlineWithSheets={state.isOnlineWithSheets}
              onSetAppsScriptUrl={handleSetAppsScriptUrl}
              onSaveRecord={handleSaveRecord}
              onExportCsv={handleExportCsv}
              currentUser={state.currentUser}
              onOpenReorderTabs={() => setShowReorderModal(true)}
            />
          )}
        </main>
      </div>

      {/* Modal para Personalizar Orden de Pestañas / Hojas a gusto propio */}
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
        <GeminiAssistant onClose={() => setShowGeminiModal(false)} />
      )}
    </div>
  );
}
