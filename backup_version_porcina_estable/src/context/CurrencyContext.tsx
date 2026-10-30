/**
 * @file CurrencyContext.tsx
 * @description Contexto global para la gestión de presentación monetaria ARS / USD
 * Requerimiento 1: Conversión global únicamente de presentación sin alterar asientos de base.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { currencyService, CotizacionBNAInfo, CotizacionHistoricaItem, TipoCotizacionBNA } from '../lib/currencyService';

export type CurrencyMode = 'ARS' | 'USD';
export type CriterioConversionHistorica = 'ACTUAL' | 'FECHA_OPERACION';

interface CurrencyContextType {
  currency: CurrencyMode;
  setCurrency: (c: CurrencyMode) => void;
  toggleCurrency: () => void;
  quoteInfo: CotizacionBNAInfo;
  historico: CotizacionHistoricaItem[];
  tipoCotizacion: TipoCotizacionBNA;
  setTipoCotizacion: (tipo: TipoCotizacionBNA) => void;
  criterioHistorico: CriterioConversionHistorica;
  setCriterioHistorico: (c: CriterioConversionHistorica) => void;
  refreshQuote: () => Promise<void>;
  
  // Helpers de conversión y formateo
  convert: (amountInArs: number, fechaOperacion?: string) => number;
  formatMoney: (
    amountInArs: number | null | undefined, 
    fechaOperacion?: string, 
    options?: { 
      forceCurrency?: CurrencyMode; 
      hideSymbol?: boolean; 
      forceDecimals?: boolean;
      compact?: boolean;
    }
  ) => string;
  symbol: string;
  cotizacionAplicadaLabel: string;
}

const STORAGE_KEY_MODE = 'pozo_del_carril_currency_mode_v2';
const STORAGE_KEY_CRITERIO = 'pozo_del_carril_criterio_historico_v2';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODE);
      return (saved === 'USD' || saved === 'ARS') ? saved : 'ARS';
    } catch {
      return 'ARS';
    }
  });

  const [criterioHistorico, setCriterioHistoricoState] = useState<CriterioConversionHistorica>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CRITERIO);
      return (saved === 'FECHA_OPERACION' || saved === 'ACTUAL') ? saved : 'ACTUAL';
    } catch {
      return 'ACTUAL';
    }
  });

  const [quoteInfo, setQuoteInfo] = useState<CotizacionBNAInfo>(currencyService.getQuote());
  const [historico, setHistorico] = useState<CotizacionHistoricaItem[]>(currencyService.getHistorico());
  const [tipoCotizacion, setTipoCotizacionState] = useState<TipoCotizacionBNA>(currencyService.getTipo());

  useEffect(() => {
    const unsubscribe = currencyService.subscribe(() => {
      setQuoteInfo(currencyService.getQuote());
      setHistorico(currencyService.getHistorico());
      setTipoCotizacionState(currencyService.getTipo());
    });
    return () => unsubscribe();
  }, []);

  const setCurrency = (mode: CurrencyMode) => {
    setCurrencyState(mode);
    try {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch (e) {
      console.warn('Error guardando moneda en localStorage', e);
    }
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'ARS' ? 'USD' : 'ARS');
  };

  const setCriterioHistorico = (criterio: CriterioConversionHistorica) => {
    setCriterioHistoricoState(criterio);
    try {
      localStorage.setItem(STORAGE_KEY_CRITERIO, criterio);
    } catch (e) {
      console.warn('Error guardando criterio histórico', e);
    }
  };

  const setTipoCotizacion = (tipo: TipoCotizacionBNA) => {
    currencyService.setTipo(tipo);
  };

  const refreshQuote = async () => {
    await currencyService.fetchQuote();
  };

  /**
   * Convierte un monto en ARS a la moneda activa (o forzada),
   * aplicando cotización actual o vigente a la fecha de la operación según configuración.
   */
  const convert = (amountInArs: number, fechaOperacion?: string): number => {
    if (isNaN(amountInArs)) return 0;
    if (currency === 'ARS') return amountInArs;

    let tasa = quoteInfo.valor;
    if (criterioHistorico === 'FECHA_OPERACION' && fechaOperacion) {
      const hist = currencyService.getCotizacionAFecha(fechaOperacion);
      if (hist && hist.valorAplicado > 0) {
        tasa = hist.valorAplicado;
      }
    }

    if (tasa <= 0) return amountInArs;
    return amountInArs / tasa;
  };

  /**
   * Formatea un importe monetario numérico de manera segura.
   * Porcentajes y cantidades físicas NO deben pasar por este formateador.
   */
  const formatMoney = (
    amountInArs: number | null | undefined, 
    fechaOperacion?: string, 
    options?: { 
      forceCurrency?: CurrencyMode; 
      hideSymbol?: boolean; 
      forceDecimals?: boolean;
      compact?: boolean;
    }
  ): string => {
    if (amountInArs === null || amountInArs === undefined || isNaN(amountInArs)) {
      return 'Datos insuficientes';
    }

    const targetCurrency = options?.forceCurrency || currency;

    if (targetCurrency === 'ARS') {
      const numFormatted = amountInArs.toLocaleString('es-AR', {
        minimumFractionDigits: options?.forceDecimals ? 2 : (amountInArs % 1 !== 0 ? 2 : 0),
        maximumFractionDigits: 2
      });
      return options?.hideSymbol ? numFormatted : `$ ${numFormatted}`;
    }

    // Modo USD
    let tasa = quoteInfo.valor;
    let fechaTasaUsada = quoteInfo.fechaHoraPublicacion;

    if (criterioHistorico === 'FECHA_OPERACION' && fechaOperacion) {
      const hist = currencyService.getCotizacionAFecha(fechaOperacion);
      if (hist && hist.valorAplicado > 0) {
        tasa = hist.valorAplicado;
        fechaTasaUsada = `${hist.fecha} (${hist.tipo})`;
      } else {
        // "Cuando falte una referencia histórica válida, informar que no se puede convertir sin inventarla"
        return 'Sin cotiz. hist.';
      }
    }

    if (tasa <= 0) return 'Cotización inválida';
    const amountUsd = amountInArs / tasa;

    const numFormatted = amountUsd.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return options?.hideSymbol ? numFormatted : `US$ ${numFormatted}`;
  };

  const symbol = currency === 'ARS' ? '$' : 'US$';
  const cotizacionAplicadaLabel = useMemo(() => {
    return `${currencyService.getTipo() === 'BILLETE_COMPRADOR' ? 'Compra' : 'Venta'}: $ ${quoteInfo.valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  }, [quoteInfo]);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        quoteInfo,
        historico,
        tipoCotizacion,
        setTipoCotizacion,
        criterioHistorico,
        setCriterioHistorico,
        refreshQuote,
        convert,
        formatMoney,
        symbol,
        cotizacionAplicadaLabel
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency debe utilizarse dentro de un CurrencyProvider');
  }
  return context;
};
