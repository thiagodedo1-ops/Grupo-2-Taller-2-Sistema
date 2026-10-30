/**
 * @file SimulacionVentaBovinoView.tsx
 * @description Sub-módulo: Simulación de Venta Bovina (MAG Cañuelas)
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Ubicado en GESTIÓN COMERCIAL.
 * IMPORTANTE: Módulo de decisión comercial estrictamente HIPOTÉTICO y AISLADO.
 * No genera comprobantes contables ni altera las existencias físicas de hacienda.
 */

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Scale, 
  Calendar, 
  Sliders, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
}

export const SimulacionVentaBovinoView: React.FC<Props> = ({ db }) => {
  const { formatMoney } = useCurrency();
  // Parámetros de Simulación (Valores por defecto zootécnicos realistas de Pozo del Carril)
  const [pesoActual, setPesoActual] = useState<number>(340);
  const [precioActual, setPrecioActual] = useState<number>(2220); // $/kg vivo hoy en MAG Cañuelas
  const [adpvEsperado, setAdpvEsperado] = useState<number>(0.95); // kg/día en corral/pastura con maíz
  const [diasRetencion, setDiasRetencion] = useState<number>(45); // días
  const [costoDiarioCab, setCostoDiarioCab] = useState<number>(1650); // $/cab/día ración + estructura
  const [precioTermino, setPrecioTermino] = useState<number>(2280); // $/kg proyectado
  const [cabezasTropa, setCabezasTropa] = useState<number>(30); // cabezas en tropa

  // Cálculos del Modelo Incremental
  const resultado = useMemo(() => {
    const aumentoKg = adpvEsperado * diasRetencion;
    const pesoFinal = pesoActual + aumentoKg;
    const ingresoHoyPorCab = pesoActual * precioActual;
    const ingresoTerminoPorCab = pesoFinal * precioTermino;
    const ingresoBrutoAdicionalCab = ingresoTerminoPorCab - ingresoHoyPorCab;
    const costoAlimentacionPorCab = costoDiarioCab * diasRetencion;
    const margenIncrementalPorCab = ingresoBrutoAdicionalCab - costoAlimentacionPorCab;
    const margenIncrementalTropa = margenIncrementalPorCab * cabezasTropa;
    const costoPorKgProducido = aumentoKg > 0 ? costoAlimentacionPorCab / aumentoKg : 0;
    const esConveniente = margenIncrementalPorCab > 0;

    return {
      aumentoKg: Math.round(aumentoKg),
      pesoFinal: Math.round(pesoFinal),
      ingresoHoyPorCab: Math.round(ingresoHoyPorCab),
      ingresoTerminoPorCab: Math.round(ingresoTerminoPorCab),
      ingresoBrutoAdicionalCab: Math.round(ingresoBrutoAdicionalCab),
      costoAlimentacionPorCab: Math.round(costoAlimentacionPorCab),
      margenIncrementalPorCab: Math.round(margenIncrementalPorCab),
      margenIncrementalTropa: Math.round(margenIncrementalTropa),
      costoPorKgProducido: Math.round(costoPorKgProducido),
      esConveniente
    };
  }, [pesoActual, precioActual, adpvEsperado, diasRetencion, costoDiarioCab, precioTermino, cabezasTropa]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in">
      {/* Banner de Aislamiento Estricto */}
      <div className="bg-[#eef5fa] border border-[#bcd6ea] p-4 rounded-xl flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-[#1b4d75] shrink-0 mt-0.5" />
        <div className="text-xs text-[#1e415f] space-y-0.5">
          <strong className="font-bold text-[#10324e] block text-sm">
            Simulador de Decisión de Venta Bovina (Modelo Prospectivo MAG)
          </strong>
          <p>
            Esta herramienta es un modelo de cálculo analítico para evaluar la conveniencia financiera de
            <strong> retener hacienda en recría/engorde vs. venta inmediata</strong>.
            Es un entorno estrictamente hipotético: <strong>no genera liquidaciones contables, facturas ni altera el stock de hacienda</strong>.
          </p>
        </div>
      </div>

      {/* Encabezado */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#fbf4ee] text-[#78350f] border border-[#e7d4c4] rounded-lg">
              <Calculator className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c674e]">
              Gestión Comercial Bovina · Decisión de Venta
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#2c1d11] tracking-tight">
            Simulador de Margen Incremental de Retención vs. Venta Inmediata
          </h1>
          <p className="text-xs text-[#5c3a21] mt-0.5">
            Compara el ingreso presente a precio MAG Cañuelas contra el ingreso proyectado descontando costos de alimentación
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-xs font-mono">
            <span className="text-[#8c674e]">Ref. MAG Hoy: </span>
            <strong className="text-[#2c1d11]">{formatMoney(precioActual)}/kg</strong>
          </div>
        </div>
      </div>

      {/* Cuadrícula Principal: Entradas vs. Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel de Parámetros (5 columnas) */}
        <div className="lg:col-span-5 bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de]">
            <h2 className="text-sm font-bold text-[#2c1d11] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#78350f]" />
              Parámetros de la Tropa y Mercado
            </h2>
            <span className="text-[11px] text-[#8c674e]">Ajuste en tiempo real</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Peso Actual */}
            <div>
              <div className="flex justify-between font-semibold text-[#2c1d11] mb-1">
                <label>Peso Actual Promedio:</label>
                <span className="font-mono text-[#78350f]">{pesoActual} kg/cab</span>
              </div>
              <input
                type="range"
                min="200"
                max="480"
                step="5"
                value={pesoActual}
                onChange={(e) => setPesoActual(Number(e.target.value))}
                className="w-full accent-[#78350f]"
              />
              <div className="flex justify-between text-[10px] text-[#8c674e]">
                <span>200 kg (Destete)</span>
                <span>340 kg (Invernada)</span>
                <span>480 kg (Pesado)</span>
              </div>
            </div>

            {/* Precio Hoy MAG */}
            <div>
              <div className="flex justify-between font-semibold text-[#2c1d11] mb-1">
                <label>Precio Hoy en Mercado (MAG):</label>
                <span className="font-mono text-[#78350f]">{formatMoney(precioActual)} /kg</span>
              </div>
              <input
                type="number"
                step="10"
                value={precioActual}
                onChange={(e) => setPrecioActual(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono bg-[#fbf4ee]"
              />
            </div>

            {/* Días de Retención */}
            <div>
              <div className="flex justify-between font-semibold text-[#2c1d11] mb-1">
                <label>Período de Retención Previsto:</label>
                <span className="font-mono text-[#78350f]">{diasRetencion} días</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={diasRetencion}
                onChange={(e) => setDiasRetencion(Number(e.target.value))}
                className="w-full accent-[#78350f]"
              />
              <div className="flex justify-between text-[10px] text-[#8c674e]">
                <span>15 días</span>
                <span>45 días</span>
                <span>120 días</span>
              </div>
            </div>

            {/* ADPV Esperado */}
            <div>
              <div className="flex justify-between font-semibold text-[#2c1d11] mb-1">
                <label>ADPV Estimado (kg/cab/día):</label>
                <span className="font-mono text-[#78350f]">+{adpvEsperado.toFixed(2)} kg/día</span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0.4"
                max="1.6"
                value={adpvEsperado}
                onChange={(e) => setAdpvEsperado(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono bg-[#fbf4ee]"
              />
            </div>

            {/* Costo Alimentación */}
            <div>
              <div className="flex justify-between font-semibold text-[#2c1d11] mb-1">
                <label>Costo Alimentación + Estructura:</label>
                <span className="font-mono text-[#78350f]">{formatMoney(costoDiarioCab)} /cab/día</span>
              </div>
              <input
                type="number"
                step="50"
                value={costoDiarioCab}
                onChange={(e) => setCostoDiarioCab(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono bg-[#fbf4ee]"
              />
            </div>

            {/* Precio Proyectado a Término */}
            <div>
              <div className="flex justify-between font-semibold text-[#2c1d11] mb-1">
                <label>Precio Proyectado a Término:</label>
                <span className="font-mono text-[#78350f]">{formatMoney(precioTermino)} /kg</span>
              </div>
              <input
                type="number"
                step="10"
                value={precioTermino}
                onChange={(e) => setPrecioTermino(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono bg-[#fbf4ee]"
              />
            </div>

            {/* Cabezas de la Tropa */}
            <div>
              <div className="flex justify-between font-semibold text-[#2c1d11] mb-1">
                <label>Cabezas de la Tropa Evaluada:</label>
                <span className="font-mono text-[#78350f]">{cabezasTropa} cab</span>
              </div>
              <input
                type="number"
                min="1"
                value={cabezasTropa}
                onChange={(e) => setCabezasTropa(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#e7d4c4] rounded-lg text-[#2c1d11] font-mono bg-[#fbf4ee]"
              />
            </div>
          </div>
        </div>

        {/* Panel de Resultados y Veredicto Financiero (7 columnas) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tarjeta de Veredicto Principal */}
          <div className={`p-5 rounded-xl border shadow-xs transition-all ${
            resultado.esConveniente 
              ? 'bg-[#fbf4ee] border-[#e7d4c4] text-[#2c1d11]' 
              : 'bg-[#fff5f5] border-[#fecaca] text-[#7f1d1d]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-current/15 mb-3">
              <div className="flex items-center gap-2">
                {resultado.esConveniente ? (
                  <CheckCircle2 className="w-6 h-6 text-[#78350f]" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                )}
                <div>
                  <h3 className="text-base font-bold tracking-tight">
                    {resultado.esConveniente ? 'CONVIENE RETENER Y TERMINAR LA TROPA' : 'CONVIENE VENDER HOY EN ESTADO ACTUAL'}
                  </h3>
                  <p className="text-xs opacity-85">
                    {resultado.esConveniente 
                      ? 'El aumento de peso y el precio proyectado cubren holgadamente el costo del encierre'
                      : 'El costo diario de la ración supera el valor agregado del kg ganado a término'}
                  </p>
                </div>
              </div>
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/80 border border-current font-mono">
                {resultado.esConveniente ? 'Margen Positivo' : 'Margen Negativo'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <span className="text-[11px] opacity-80 block">Margen Incremental / Cab:</span>
                <span className="text-xl font-bold font-mono">
                  {resultado.margenIncrementalPorCab > 0 ? '+' : ''}{formatMoney(resultado.margenIncrementalPorCab)}
                </span>
              </div>
              <div>
                <span className="text-[11px] opacity-80 block">Margen Total Tropa ({cabezasTropa} cab):</span>
                <span className="text-xl font-bold font-mono">
                  {resultado.margenIncrementalTropa > 0 ? '+' : ''}{formatMoney(resultado.margenIncrementalTropa)}
                </span>
              </div>
              <div>
                <span className="text-[11px] opacity-80 block">Costo del Kg Adicional:</span>
                <span className="text-xl font-bold font-mono">
                  {formatMoney(resultado.costoPorKgProducido)} /kg
                </span>
              </div>
            </div>
          </div>

          {/* Desglose Económico Paso a Paso */}
          <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#2c1d11] pb-2 border-b border-[#f2e6de]">
              Desglose Comparativo por Cabeza (Hoy vs. Término)
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#f5ece5]">
                <span className="text-[#8c674e]">1. Valor de venta hoy ({pesoActual} kg @ {formatMoney(precioActual)}/kg):</span>
                <strong className="font-mono text-[#2c1d11]">{formatMoney(resultado.ingresoHoyPorCab)}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#f5ece5]">
                <span className="text-[#8c674e]">2. Ganancia de peso en {diasRetencion} días (+{resultado.aumentoKg} kg):</span>
                <strong className="font-mono text-[#78350f]">Peso final: {resultado.pesoFinal} kg</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#f5ece5]">
                <span className="text-[#8c674e]">3. Valor proyectado a término ({resultado.pesoFinal} kg @ {formatMoney(precioTermino)}/kg):</span>
                <strong className="font-mono text-[#2c1d11]">{formatMoney(resultado.ingresoTerminoPorCab)}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#f5ece5]">
                <span className="text-[#8c674e]">4. Ingreso bruto adicional obtenido:</span>
                <strong className="font-mono text-[#78350f]">+{formatMoney(resultado.ingresoBrutoAdicionalCab)}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#f5ece5]">
                <span className="text-[#8c674e]">5. Costo total de alimentación y estructura ({diasRetencion} días @ {formatMoney(costoDiarioCab)}/día):</span>
                <strong className="font-mono text-rose-600">-{formatMoney(resultado.costoAlimentacionPorCab)}</strong>
              </div>

              <div className="flex justify-between items-center pt-2 font-bold text-sm">
                <span className="text-[#2c1d11]">Resultado Incremental Neto por Cabeza:</span>
                <span className={`font-mono ${resultado.esConveniente ? 'text-[#78350f]' : 'text-rose-600'}`}>
                  {resultado.margenIncrementalPorCab > 0 ? '+' : ''}{formatMoney(resultado.margenIncrementalPorCab)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
