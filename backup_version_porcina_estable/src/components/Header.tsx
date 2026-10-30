/**
 * @file Header.tsx
 * @description Barra superior con selector deslizante ARS / USD, cotización oficial BNA,
 * estado de actualización, sincronización y perfil operativo.
 * Requerimiento 1: Conversor global ARS / USD de presentación con fuente BNA.
 */

import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';
import { Usuario } from '../types/schema';
import { getRolePermissions } from '../lib/permissions';
import { useCurrency } from '../context/CurrencyContext';
import { TipoCotizacionBNA } from '../lib/currencyService';
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
  onNavigate
}) => {
  const permissions = getRolePermissions(currentUser);
  const {
    currency,
    setCurrency,
    quoteInfo,
    tipoCotizacion,
    setTipoCotizacion,
    criterioHistorico,
    setCriterioHistorico,
    refreshQuote
  } = useCurrency();

  const [showBnaMenu, setShowBnaMenu] = useState(false);
  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);

  const handleManualQuoteRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshingQuote(true);
    await refreshQuote();
    setIsRefreshingQuote(false);
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-[#dce4da] flex items-center justify-between shrink-0 z-20 shadow-2xs font-sans">
      {/* Zona 1: Brand Wordmark Porcino */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1c4b31] border border-[#2b714b] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
          PC
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-[#183123] tracking-tight whitespace-nowrap">
              Pozo del Carril · La Aguada
            </span>
            <span className="hidden xl:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#edf5ef] text-[#2c613e] border border-[#cce3d2]">
              FCE UNRC
            </span>
          </div>
          <span className="text-[11px] text-[#556e5f] font-medium truncate max-w-[220px] sm:max-w-none">
            Sistema de Gestión Porcina · Unidad C
          </span>
        </div>
      </div>

      {/* Zona 2: Breadcrumb central */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-[#556e5f] font-medium">
        <span className="text-[#7c9284]">Módulo</span>
        <span className="text-[#a5b9ac]">/</span>
        <span className="text-[#183123] font-semibold bg-[#edf5ef] px-2.5 py-1 rounded-md border border-[#cbe3d2]">
          {activeModuleTitle}
        </span>
      </div>

      {/* Zona 3: Conversor Global ARS/USD + Sincronización + Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* ===================================================================
            SELECTOR DESLIZANTE ARS / USD (Requerimiento 1)
        =================================================================== */}
        <div className="relative">
          <div className="flex items-center bg-[#edf3ee] border border-[#c8d8ca] rounded-xl p-0.5 shadow-2xs">
            {/* Botón ARS */}
            <button
              type="button"
              onClick={() => setCurrency('ARS')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                currency === 'ARS'
                  ? 'bg-[#1c4b31] text-white shadow-xs'
                  : 'text-[#415e4d] hover:text-[#183123]'
              }`}
              title="Mostrar todos los importes en Pesos Argentinos (moneda original de registro)"
            >
              ARS
            </button>

            {/* Botón USD */}
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                currency === 'USD'
                  ? 'bg-[#1c4b31] text-white shadow-xs'
                  : 'text-[#415e4d] hover:text-[#183123]'
              }`}
              title="Convertir la presentación visual a Dólares Estadounidenses (Cotización Oficial BNA)"
            >
              <span>USD</span>
              <span className={`w-1.5 h-1.5 rounded-full ${quoteInfo.estado === 'ONLINE' ? 'bg-[#4ade80]' : 'bg-[#fbbf24]'}`} />
            </button>

            {/* Desplegable de Configuración de Cotización BNA */}
            <button
              type="button"
              onClick={() => setShowBnaMenu(!showBnaMenu)}
              className="p-1 text-[#556e5f] hover:text-[#183123] hover:bg-[#dfeade] rounded-lg transition-colors ml-0.5 cursor-pointer"
              title="Detalles y configuración de la cotización oficial BNA"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBnaMenu ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Menú flotante de detalles y configuración BNA */}
          {showBnaMenu && (
            <div 
              className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-[#c8d8ca] rounded-xl shadow-xl p-3.5 z-50 text-xs text-[#183123] space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#e2ece2] pb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#1c4b31]" />
                  <span className="font-bold text-[#143522]">Cotización Oficial BNA</span>
                </div>
                <button
                  onClick={handleManualQuoteRefresh}
                  disabled={isRefreshingQuote}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#1c4b31] hover:text-[#11301f] cursor-pointer"
                  title="Consultar actualización ahora"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingQuote ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>

              {/* Datos de la cotización aplicada */}
              <div className="bg-[#f5f8f5] p-2.5 rounded-lg border border-[#dce7dc] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#556e5f]">Cotización Aplicada:</span>
                  <span className="font-mono font-bold text-sm text-[#183123]">
                    $ {quoteInfo.valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#556e5f]">Tipo seleccionado:</span>
                  <span className="font-semibold text-[#1c4b31]">
                    {quoteInfo.tipoEtiqueta}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#556e5f]">Valores BNA:</span>
                  <span className="font-mono text-[11px] text-[#334d3d]">
                    C: ${quoteInfo.compra} · V: ${quoteInfo.venta}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#6b8273] pt-1 border-t border-[#e2ebe2]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#7d9686]" />
                    <span>Publ: {quoteInfo.fechaHoraPublicacion}</span>
                  </span>
                  <span className={`font-semibold px-1.5 py-0.2 rounded border text-[9px] ${
                    quoteInfo.estado === 'ONLINE'
                      ? 'bg-[#eaf5ed] text-[#1e5a32] border-[#b8dfc4]'
                      : 'bg-[#fef9ee] text-[#855110] border-[#f5dcba]'
                  }`}>
                    {quoteInfo.estado === 'ONLINE' ? 'En línea' : 'Caché oficial'}
                  </span>
                </div>
              </div>

              {/* Advertencia si está en modo fallback */}
              {quoteInfo.advertencia && (
                <div className="flex items-start gap-1.5 p-2 bg-[#fef8ee] border border-[#f5dcba] rounded-lg text-[10px] text-[#855110]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#b47118] mt-0.5" />
                  <span>{quoteInfo.advertencia}</span>
                </div>
              )}

              {/* Configuración de Tipo de Cotización BNA */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#2a4534] block">
                  Configurar Tipo de Cotización BNA:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTipoCotizacion('BILLETE_VENDEDOR')}
                    className={`px-2 py-1.5 rounded-lg border text-left text-[11px] font-medium transition-colors cursor-pointer ${
                      tipoCotizacion === 'BILLETE_VENDEDOR'
                        ? 'bg-[#1c4b31] text-white border-[#1c4b31]'
                        : 'bg-white text-[#2a4534] border-[#c8d8ca] hover:bg-[#edf5ef]'
                    }`}
                  >
                    Billete Vendedor (Defecto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCotizacion('BILLETE_COMPRADOR')}
                    className={`px-2 py-1.5 rounded-lg border text-left text-[11px] font-medium transition-colors cursor-pointer ${
                      tipoCotizacion === 'BILLETE_COMPRADOR'
                        ? 'bg-[#1c4b31] text-white border-[#1c4b31]'
                        : 'bg-white text-[#2a4534] border-[#c8d8ca] hover:bg-[#edf5ef]'
                    }`}
                  >
                    Billete Comprador
                  </button>
                </div>
              </div>

              {/* Criterio para Informes Históricos */}
              <div className="space-y-1 pt-1 border-t border-[#e2ece2]">
                <label className="text-[11px] font-bold text-[#2a4534] block">
                  Conversión en Informes Históricos:
                </label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <input
                      type="radio"
                      name="criterioHistorico"
                      checked={criterioHistorico === 'ACTUAL'}
                      onChange={() => setCriterioHistorico('ACTUAL')}
                      className="accent-[#1c4b31]"
                    />
                    <span>Cotización BNA actual ({quoteInfo.valor})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                    <input
                      type="radio"
                      name="criterioHistorico"
                      checked={criterioHistorico === 'FECHA_OPERACION'}
                      onChange={() => setCriterioHistorico('FECHA_OPERACION')}
                      className="accent-[#1c4b31]"
                    />
                    <span>Cotización oficial a la fecha de cada operación</span>
                  </label>
                </div>
              </div>

              <div className="text-[10px] text-[#718a7a] italic pt-1 border-t border-[#e2ece2]">
                Fuente oficial: Banco de la Nación Argentina (bna.com.ar). Consulta automática cada 60s. El cambio de moneda es de estricta presentación y no altera los registros de base.
              </div>
            </div>
          )}
        </div>

        {/* Botón de Sincronización */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#183123] bg-white hover:bg-[#edf5ef] border border-[#dce4da] rounded-xl transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 shadow-2xs"
          title={isOnlineWithSheets ? 'Sincronizado con Google Sheets' : 'Operando con base local. Clic para sincronizar.'}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#3a684b] ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Actualizar'}</span>
          {lastSyncTime && (
            <span className="text-[10px] text-[#728a7a] font-mono hidden xl:inline">
              ({lastSyncTime})
            </span>
          )}
        </button>

        {/* Indicador de conexión con Sheets */}
        {permissions.canManageConfig ? (
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#183123] bg-white hover:bg-[#edf5ef] border border-[#dce4da] rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            title="Ver configuración de conexión con Google Sheets y Apps Script"
          >
            {isOnlineWithSheets ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1b7a3d]" />
                <span className="text-[11px] text-[#1b7a3d] font-semibold hidden md:inline">Sheets Conectado</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-[#b47118]" />
                <span className="text-[11px] text-[#855110] font-semibold hidden md:inline">Base Local</span>
              </>
            )}
          </button>
        ) : (
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#466151] bg-[#edf5ef] border border-[#dce4da] rounded-xl whitespace-nowrap"
            title="Conexión gestionada centralmente"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1b7a3d]" />
            <span className="text-[11px] font-semibold hidden md:inline">Pozo del Carril</span>
          </div>
        )}

        {/* Campana y Almacén de Notificaciones */}
        <NotificationCenter 
          currentUser={currentUser} 
          onNavigate={onNavigate} 
        />

        {/* Perfil de Usuario y Rango */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#dce4da]">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-semibold text-[#183123] leading-tight">
              {currentUser.nombre || currentUser.usuario}
            </span>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${permissions.badgeStyle.bg} ${permissions.badgeStyle.text} ${permissions.badgeStyle.border}`}>
                {permissions.badgeLabel}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 text-[#728a7a] hover:text-[#b91c1c] hover:bg-[#fef2f2] rounded-lg transition-colors cursor-pointer"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
