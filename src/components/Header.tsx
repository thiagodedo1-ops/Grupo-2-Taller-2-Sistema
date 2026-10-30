/**
 * @file Header.tsx
 * @description Barra superior con selector de Unidad de Negocio (Porcinos, Bovinos, Ovinos, Consolidado),
 * conversor ARS/USD con cotización BNA desplegable, campana de notificaciones,
 * estado de sincronización y perfil operativo.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  DollarSign, 
  Settings2, 
  ChevronDown, 
  Info,
  Clock,
  TrendingUp,
  Layers,
  Building2,
  PiggyBank,
  Beef,
  CircleDot,
  BarChart3,
  ExternalLink,
  Calendar,
  PanelLeftOpen,
  PanelLeftClose
} from 'lucide-react';
import { Usuario } from '../types/schema';
import { getRolePermissions } from '../lib/permissions';
import { useCurrency } from '../context/CurrencyContext';
import { NotificationCenter } from './NotificationCenter';
import { ModuleKey } from './Sidebar';

interface Props {
  currentUser: Usuario;
  activeModuleTitle: string;
  isSyncing: boolean;
  isOnlineWithSheets: boolean;
  lastSyncTime: string | null;
  onSync: () => void;
  onLogout: () => void;
  onOpenConfig: () => void;
  onNavigate?: (module: ModuleKey) => void;
  activeBusinessUnit: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
  onSelectBusinessUnit: (unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO') => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<Props> = ({
  currentUser,
  activeModuleTitle,
  isSyncing,
  isOnlineWithSheets,
  lastSyncTime,
  onSync,
  onLogout,
  onOpenConfig,
  onNavigate,
  activeBusinessUnit,
  onSelectBusinessUnit,
  isSidebarCollapsed = false,
  onToggleSidebar
}) => {
  const permissions = getRolePermissions(currentUser);
  const {
    currency,
    setCurrency,
    quoteInfo,
    refreshQuote,
    tipoCotizacion,
    setTipoCotizacion,
    criterioHistorico,
    setCriterioHistorico
  } = useCurrency();

  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);
  const [showBnaDetails, setShowBnaDetails] = useState(false);
  const bnaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bnaRef.current && !bnaRef.current.contains(e.target as Node)) {
        setShowBnaDetails(false);
      }
    };
    if (showBnaDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBnaDetails]);

  const handleManualQuoteRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshingQuote(true);
    await refreshQuote();
    setIsRefreshingQuote(false);
  };

  const unitTheme = {
    PORCINOS: {
      logoBg: 'bg-[#1c4b31] border-[#2b714b]',
      tagBg: 'bg-[#edf5ef] text-[#2c613e] border-[#cce3d2]',
      activeBtn: 'bg-[#1c4b31] text-white shadow-xs'
    },
    BOVINOS: {
      logoBg: 'bg-[#78350f] border-[#92400e]',
      tagBg: 'bg-[#fbf4ee] text-[#78350f] border-[#e7d4c4]',
      activeBtn: 'bg-[#78350f] text-white shadow-xs'
    },
    OVINOS: {
      logoBg: 'bg-[#1e40af] border-[#2563eb]',
      tagBg: 'bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]',
      activeBtn: 'bg-[#1e40af] text-white shadow-xs'
    },
    CONSOLIDADO: {
      logoBg: 'bg-[#581c87] border-[#7e22ce]',
      tagBg: 'bg-[#faf5ff] text-[#581c87] border-[#e9d5ff]',
      activeBtn: 'bg-[#581c87] text-white shadow-xs'
    }
  }[activeBusinessUnit] || {
    logoBg: 'bg-[#1c4b31] border-[#2b714b]',
    tagBg: 'bg-[#edf5ef] text-[#2c613e] border-[#cce3d2]',
    activeBtn: 'bg-[#1c4b31] text-white shadow-xs'
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-[#dce4da] flex items-center justify-between shrink-0 z-20 shadow-2xs font-sans">
      {/* Zona 1: Toggle Sidebar, Brand Wordmark & Selector de Unidad */}
      <div className="flex items-center gap-2.5">
        {onToggleSidebar && isSidebarCollapsed && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-[#edf6f0] hover:bg-[#dcf3e4] text-[#1c4b31] border border-[#bbf7d0] transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-bold shadow-2xs"
            title="Mostrar menú lateral"
          >
            <PanelLeftOpen className="w-4 h-4 text-[#1c4b31]" />
            <span className="hidden sm:inline">Menú</span>
          </button>
        )}
        <div className={`w-8 h-8 rounded-lg ${unitTheme.logoBg} border flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0`}>
          PC
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#183123] tracking-tight whitespace-nowrap">
              Pozo del Carril – La Aguada
            </span>
            <span className={`hidden xl:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${unitTheme.tagBg} border`}>
              UNRC · {activeBusinessUnit}
            </span>
          </div>

          {/* SELECTOR DE UNIDAD DE NEGOCIO */}
          <div className="flex items-center gap-1.5 mt-0.5" id="tour-business-unit-selector">
            <span className="text-[10px] uppercase font-bold text-[#688274]">Unidad:</span>
            <div className="inline-flex items-center bg-[#f0f4f1] border border-[#cce0d2] rounded-lg p-0.5">
              {(['PORCINOS', 'BOVINOS', 'OVINOS', 'CONSOLIDADO'] as const).map((unit) => {
                const isActive = activeBusinessUnit === unit;
                const label = unit === 'PORCINOS' ? 'Porcinos' : unit === 'BOVINOS' ? 'Bovinos' : unit === 'OVINOS' ? 'Ovinos' : 'Consolidado';
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => onSelectBusinessUnit(unit)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      isActive
                        ? unitTheme.activeBtn
                        : 'text-[#4d6856] hover:text-[#183123]'
                    }`}
                    title={`Cambiar a unidad ${label}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Zona 2: Breadcrumb central */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-[#556e5f] font-medium">
        <span className="text-[#7c9284]">Actividad</span>
        <span className="text-[#a5b9ac]">/</span>
        <span className="text-[#183123] font-semibold bg-[#edf5ef] px-2.5 py-1 rounded-md border border-[#cbe3d2] uppercase">
          {activeBusinessUnit}
        </span>
        <span className="text-[#a5b9ac]">/</span>
        <span className="text-[#556e5f]">{activeModuleTitle}</span>
      </div>

      {/* Zona 3: Conversor Global ARS/USD con BNA + Campanita + Sincronización + Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* ===================================================================
            SELECTOR ARS / USD + DESPLEGABLE CON INFORMACIÓN BNA OFICIAL
        =================================================================== */}
        <div className="relative" ref={bnaRef} id="tour-currency-selector">
          <div className="flex items-center bg-[#edf3ee] border border-[#c8d8ca] rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setCurrency('ARS');
                setShowBnaDetails(false);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                currency === 'ARS'
                  ? unitTheme.activeBtn
                  : 'text-[#415e4d] hover:text-[#183123]'
              }`}
              title="Mostrar importes en Pesos Argentinos (ARS)"
            >
              ARS
            </button>
            
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setCurrency('USD');
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  currency === 'USD'
                    ? unitTheme.activeBtn
                    : 'text-[#415e4d] hover:text-[#183123]'
                }`}
                title="Convertir a Dólares Estadounidenses (Cotización Oficial BNA)"
              >
                <span>USD</span>
                <span className={`w-1.5 h-1.5 rounded-full ${quoteInfo.estado === 'ONLINE' ? 'bg-[#4ade80]' : 'bg-[#fbbf24]'}`} />
              </button>

              {currency === 'USD' && (
                <button
                  type="button"
                  onClick={() => setShowBnaDetails(!showBnaDetails)}
                  className="p-1 text-white hover:text-amber-200 transition-colors cursor-pointer ml-0.5"
                  title="Ver detalles de cotización BNA y opciones de conversión"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBnaDetails ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* DESPLEGABLE DE DETALLES COTIZACIÓN BNA OFICIAL */}
          {currency === 'USD' && showBnaDetails && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#c8d8ca] rounded-2xl shadow-2xl z-50 p-4 space-y-3 font-sans text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-[#e2eae2] pb-2">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-[#143422] text-xs">
                    <Building2 className="w-4 h-4 text-[#1c4b31]" />
                    <span>Banco de la Nación Argentina (BNA)</span>
                  </div>
                  <a 
                    href="https://www.bna.com.ar/Personas" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#1c4b31] hover:underline flex items-center gap-0.5 mt-0.5"
                  >
                    <span>Fuente oficial BNA</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleManualQuoteRefresh}
                  disabled={isRefreshingQuote}
                  className="p-1.5 rounded-lg bg-[#edf5ef] hover:bg-[#dcebdd] text-[#1c4b31] border border-[#b8d4bf] transition-colors cursor-pointer"
                  title="Actualizar cotización desde BNA"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuote ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Muestra Comprador y Vendedor */}
              <div className="grid grid-cols-2 gap-2 bg-[#f6f9f6] p-2.5 rounded-xl border border-[#d8e5db] text-center">
                <div className="border-r border-[#d8e5db] pr-1">
                  <div className="text-[10px] uppercase font-bold text-[#557361]">Dólar Compra</div>
                  <div className="text-sm font-bold font-mono text-[#143422] mt-0.5">
                    $ {quoteInfo.compra.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="pl-1">
                  <div className="text-[10px] uppercase font-bold text-[#557361]">Dólar Venta</div>
                  <div className="text-sm font-bold font-mono text-[#1c4b31] mt-0.5">
                    $ {quoteInfo.venta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Selector de Tipo de Cotización BNA */}
              <div>
                <label className="block text-[10px] font-bold text-[#446050] uppercase tracking-wider mb-1">
                  Tipo de Cotización BNA:
                </label>
                <select
                  value={tipoCotizacion}
                  onChange={(e) => setTipoCotizacion(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#c8d8ca] rounded-xl text-xs font-semibold text-[#183123] focus:outline-none focus:ring-1 focus:ring-[#1c4b31]"
                >
                  <option value="BILLETE_VENDEDOR">Billetes - Tipo Vendedor ($ {quoteInfo.venta.toFixed(2)})</option>
                  <option value="BILLETE_COMPRADOR">Billetes - Tipo Comprador ($ {quoteInfo.compra.toFixed(2)})</option>
                  <option value="DIVISA_VENDEDOR">Divisa / Mayorista - Vendedor</option>
                  <option value="DIVISA_COMPRADOR">Divisa / Mayorista - Comprador</option>
                </select>
              </div>

              {/* Selector de Modalidad de Conversión */}
              <div>
                <label className="block text-[10px] font-bold text-[#446050] uppercase tracking-wider mb-1">
                  Modalidad de Conversión USD:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 p-2 rounded-xl border border-[#d8e5db] hover:bg-[#f6f9f6] cursor-pointer">
                    <input
                      type="radio"
                      name="criterio_conversion"
                      checked={criterioHistorico === 'ACTUAL'}
                      onChange={() => setCriterioHistorico('ACTUAL')}
                      className="mt-0.5 text-[#1c4b31] focus:ring-[#1c4b31]"
                    />
                    <div>
                      <div className="font-bold text-[#143422] text-[11px]">Opción 1: Cotización actual disponible</div>
                      <div className="text-[10px] text-[#557361]">Aplica el tipo de cambio vigente más reciente ($ {quoteInfo.valor.toFixed(2)}).</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 rounded-xl border border-[#d8e5db] hover:bg-[#f6f9f6] cursor-pointer">
                    <input
                      type="radio"
                      name="criterio_conversion"
                      checked={criterioHistorico === 'FECHA_OPERACION'}
                      onChange={() => setCriterioHistorico('FECHA_OPERACION')}
                      className="mt-0.5 text-[#1c4b31] focus:ring-[#1c4b31]"
                    />
                    <div>
                      <div className="font-bold text-[#143422] text-[11px]">Opción 2: Cotización según fecha de registro</div>
                      <div className="text-[10px] text-[#557361]">Utiliza el tipo de cambio histórico BNA aplicable a la fecha de cada operación.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Pie con Estado y Fecha/Hora */}
              <div className="pt-2 border-t border-[#e2eae2] flex items-center justify-between text-[10px] text-[#557361]">
                <span className="flex items-center gap-1 font-semibold">
                  <span className={`w-2 h-2 rounded-full ${quoteInfo.estado === 'ONLINE' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`} />
                  <span>{quoteInfo.estado === 'ONLINE' ? 'Conexión BNA Activa' : 'Caché Oficial Registrado'}</span>
                </span>
                <span className="font-mono">{quoteInfo.fechaHoraPublicacion}</span>
              </div>
            </div>
          )}
        </div>

        {/* CAMPANITA DE NOTIFICACIONES */}
        <NotificationCenter currentUser={currentUser} onNavigate={onNavigate} />

        {/* Botón de Sincronización con Google Sheets */}
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
            isOnlineWithSheets 
              ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534] hover:bg-[#dcfce7]' 
              : 'bg-[#fdf8f6] border-[#fde68a] text-[#b45309] hover:bg-[#fef3c7]'
          }`}
          title={isOnlineWithSheets ? 'Conectado a Google Sheets bidireccional' : 'Modo local (Google Sheets no vinculado)'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isSyncing ? 'Sincronizando...' : isOnlineWithSheets ? 'Sheets Online' : 'Modo Local'}
          </span>
        </button>

        {/* Perfil Operativo y Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#dce4da]">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-[#183123] truncate max-w-[120px]">
              {currentUser.nombre}
            </span>
            <span className="text-[10px] text-[#556e5f] font-medium">
              {permissions.roleShortName}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl bg-[#f6f8f6] hover:bg-[#fee2e2] text-[#556e5f] hover:text-[#991b1b] border border-[#dce4da] hover:border-[#fca5a5] transition-colors cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
