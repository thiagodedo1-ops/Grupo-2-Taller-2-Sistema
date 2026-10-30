/**
 * @file SimulacionVentaPorcinoView.tsx
 * @description Módulo de Simulación de Venta Porcina (Capones, Cachorros, Lechones, Cerdas y Padrillos)
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Ubicación: Gestión Comercial → Simulación de Venta
 * 
 * IMPORTANTE: Módulo de análisis y planificación comercial estrictamente HIPOTÉTICO y AISLADO.
 * No genera comprobantes contables, liquidaciones ni altera las existencias físicas de piara.
 */

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Scale, 
  Sliders, 
  Layers,
  ArrowRight,
  Info,
  RotateCcw,
  Percent,
  Truck,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { BaseDatosPorcina, Usuario } from '../types/schema';

interface Props {
  db: BaseDatosPorcina;
  currentUser?: Usuario | null;
}

type CategoriaPorcina = 'CAPON' | 'CACHORRO' | 'LECHON' | 'CERDA_DESCARTE' | 'PADRILLO_DESCARTE';
type ModalidadPrecio = 'KG' | 'CABEZA';

interface CategoriaConfig {
  id: CategoriaPorcina;
  nombre: string;
  subtitulo: string;
  pesoMin: number;
  pesoMax: number;
  pesoDefault: number;
  precioDefaultKg: number;
  precioDefaultCab: number;
  modalidadDefault: ModalidadPrecio;
  cabezasDefault: number;
  costoAlimDefaultCab: number;
  descripcion: string;
}

const CATEGORIAS_PORCINAS: Record<CategoriaPorcina, CategoriaConfig> = {
  CAPON: {
    id: 'CAPON',
    nombre: 'Capones Terminados',
    subtitulo: 'Salida de Engorde / Frigorífico',
    pesoMin: 90,
    pesoMax: 130,
    pesoDefault: 112,
    precioDefaultKg: 1980,
    precioDefaultCab: 221760,
    modalidadDefault: 'KG',
    cabezasDefault: 40,
    costoAlimDefaultCab: 125000,
    descripcion: 'Macho castrado o hembra sin servicio en peso óptimo de faena comercial (105-118 kg).'
  },
  CACHORRO: {
    id: 'CACHORRO',
    nombre: 'Cachorros / Cachorras',
    subtitulo: 'Recría / Venta Invernada',
    pesoMin: 45,
    pesoMax: 85,
    pesoDefault: 68,
    precioDefaultKg: 2150,
    precioDefaultCab: 146200,
    modalidadDefault: 'KG',
    cabezasDefault: 30,
    costoAlimDefaultCab: 78000,
    descripcion: 'Animales en fase intermedia de recría comercial para terminación en otros establecimientos.'
  },
  LECHON: {
    id: 'LECHON',
    nombre: 'Lechones de Consumo / Fiestas',
    subtitulo: 'Salida Destete / Venta Directa',
    pesoMin: 8,
    pesoMax: 20,
    pesoDefault: 12,
    precioDefaultKg: 2850,
    precioDefaultCab: 36000,
    modalidadDefault: 'CABEZA',
    cabezasDefault: 25,
    costoAlimDefaultCab: 16500,
    descripcion: 'Lechones livianos para consumo faena lechonera o festiva. Frecuente cotización por cabeza.'
  },
  CERDA_DESCARTE: {
    id: 'CERDA_DESCARTE',
    nombre: 'Cerdas de Descarte / Refugo',
    subtitulo: 'Plantel Reproductor Baja',
    pesoMin: 160,
    pesoMax: 260,
    pesoDefault: 205,
    precioDefaultKg: 1380,
    precioDefaultCab: 282900,
    modalidadDefault: 'KG',
    cabezasDefault: 6,
    costoAlimDefaultCab: 180000,
    descripcion: 'Madres que cumplieron su ciclo reproductivo o con fallas de fertilidad/aplomos.'
  },
  PADRILLO_DESCARTE: {
    id: 'PADRILLO_DESCARTE',
    nombre: 'Padrillos / Verracos de Descarte',
    subtitulo: 'Baja Reproductores Machos',
    pesoMin: 200,
    pesoMax: 320,
    pesoDefault: 255,
    precioDefaultKg: 1220,
    precioDefaultCab: 311100,
    modalidadDefault: 'KG',
    cabezasDefault: 2,
    costoAlimDefaultCab: 210000,
    descripcion: 'Reproductores machos reemplazados por recambio genético o descarte zootécnico.'
  }
};

export const SimulacionVentaPorcinoView: React.FC<Props> = ({ db }) => {
  // 1. Estado de Selección de Categoría
  const [categoria, setCategoria] = useState<CategoriaPorcina>('CAPON');
  const catConfig = CATEGORIAS_PORCINAS[categoria];

  // 2. Parámetros de la Tropa/Lote Porcino
  const [modalidad, setModalidad] = useState<ModalidadPrecio>(catConfig.modalidadDefault);
  const [cabezas, setCabezas] = useState<number>(catConfig.cabezasDefault);
  const [pesoPromedio, setPesoPromedio] = useState<number>(catConfig.pesoDefault);
  const [precioUnitario, setPrecioUnitario] = useState<number>(
    catConfig.modalidadDefault === 'KG' ? catConfig.precioDefaultKg : catConfig.precioDefaultCab
  );

  // 3. Gastos Comerciales y Logística
  const [comisionPorc, setComisionPorc] = useState<number>(2.5); // % Consignatario / Intermediación
  const [fletePorCab, setFletePorCab] = useState<number>(2800); // $ / cab
  const [guiaSenasaPorCab, setGuiaSenasaPorCab] = useState<number>(650); // $ / cab DTE y tasas
  const [plazoCobroDias, setPlazoCobroDias] = useState<number>(15); // días de plazo

  // 4. Consideración de Costos de Producción
  const [computarCostos, setComputarCostos] = useState<boolean>(true);
  const [costoUnitarioCab, setCostoUnitarioCab] = useState<number>(catConfig.costoAlimDefaultCab);

  // Al cambiar categoría, restablecer valores por defecto representativos
  const handleCambiarCategoria = (nuevaCat: CategoriaPorcina) => {
    setCategoria(nuevaCat);
    const cfg = CATEGORIAS_PORCINAS[nuevaCat];
    setModalidad(cfg.modalidadDefault);
    setCabezas(cfg.cabezasDefault);
    setPesoPromedio(cfg.pesoDefault);
    setPrecioUnitario(cfg.modalidadDefault === 'KG' ? cfg.precioDefaultKg : cfg.precioDefaultCab);
    setCostoUnitarioCab(cfg.costoAlimDefaultCab);
  };

  const handleRestablecerValores = () => {
    handleCambiarCategoria(categoria);
  };

  // 5. Cálculos Proyectados en Tiempo Real
  const resultado = useMemo(() => {
    const kgTotales = cabezas * pesoPromedio;
    
    // Ingreso Bruto según modalidad de cotización
    const ingresoBruto = modalidad === 'KG'
      ? kgTotales * precioUnitario
      : cabezas * precioUnitario;

    const ingresoBrutoPorCab = cabezas > 0 ? ingresoBruto / cabezas : 0;
    const ingresoBrutoPorKg = kgTotales > 0 ? ingresoBruto / kgTotales : 0;

    // Gastos Comerciales
    const gastoComision = ingresoBruto * (comisionPorc / 100);
    const gastoFleteTotal = fletePorCab * cabezas;
    const gastoGuiaTotal = guiaSenasaPorCab * cabezas;
    const totalGastosComerciales = gastoComision + gastoFleteTotal + gastoGuiaTotal;
    const gastosPorCab = cabezas > 0 ? totalGastosComerciales / cabezas : 0;

    // Ingreso Neto Comercial (descontando comercialización directa)
    const ingresoNetoComercial = ingresoBruto - totalGastosComerciales;
    const ingresoNetoPorCab = cabezas > 0 ? ingresoNetoComercial / cabezas : 0;
    const ingresoNetoPorKg = kgTotales > 0 ? ingresoNetoComercial / kgTotales : 0;

    // Costos Productivos Considerados
    const costoTotalProduccion = computarCostos ? costoUnitarioCab * cabezas : 0;
    const costoPorKgProducido = (computarCostos && kgTotales > 0) ? costoTotalProduccion / kgTotales : 0;

    // Margen Económico Proyectado
    const margenEconomicoTotal = computarCostos ? ingresoNetoComercial - costoTotalProduccion : 0;
    const margenPorCab = (computarCostos && cabezas > 0) ? margenEconomicoTotal / cabezas : 0;
    const margenPorKg = (computarCostos && kgTotales > 0) ? margenEconomicoTotal / kgTotales : 0;
    const rentabilidadSobreCosto = (computarCostos && costoTotalProduccion > 0)
      ? (margenEconomicoTotal / costoTotalProduccion) * 100
      : 0;

    const esMargenPositivo = margenEconomicoTotal >= 0;

    return {
      kgTotales: Math.round(kgTotales),
      ingresoBruto: Math.round(ingresoBruto),
      ingresoBrutoPorCab: Math.round(ingresoBrutoPorCab),
      ingresoBrutoPorKg: Math.round(ingresoBrutoPorKg),
      gastoComision: Math.round(gastoComision),
      gastoFleteTotal: Math.round(gastoFleteTotal),
      gastoGuiaTotal: Math.round(gastoGuiaTotal),
      totalGastosComerciales: Math.round(totalGastosComerciales),
      gastosPorCab: Math.round(gastosPorCab),
      ingresoNetoComercial: Math.round(ingresoNetoComercial),
      ingresoNetoPorCab: Math.round(ingresoNetoPorCab),
      ingresoNetoPorKg: Math.round(ingresoNetoPorKg),
      costoTotalProduccion: Math.round(costoTotalProduccion),
      costoPorKgProducido: Math.round(costoPorKgProducido),
      margenEconomicoTotal: Math.round(margenEconomicoTotal),
      margenPorCab: Math.round(margenPorCab),
      margenPorKg: Math.round(margenPorKg),
      rentabilidadSobreCosto: Number(rentabilidadSobreCosto.toFixed(1)),
      esMargenPositivo
    };
  }, [modalidad, cabezas, pesoPromedio, precioUnitario, comisionPorc, fletePorCab, guiaSenasaPorCab, computarCostos, costoUnitarioCab]);

  // Histórico de referencia para mostrar si hay datos en la base
  const ventasHistoricasPorcinas = useMemo(() => {
    return (db.Mov_Comercial_Enc || [])
      .filter(m => m.tipo_operacion === 'VENTA' && m.estado === 'Confirmado')
      .slice(0, 3);
  }, [db.Mov_Comercial_Enc]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in font-sans">
      {/* Banner de Aislamiento Estricto */}
      <div className="bg-[#edf7f0] border border-[#bbf7d0] p-4 rounded-xl flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
        <div className="text-xs text-[#14532d] space-y-0.5">
          <strong className="font-bold text-[#143422] block text-sm">
            Simulador de Decisión Comercial Porcina · Pozo del Carril
          </strong>
          <p>
            Herramienta analítica de proyección y planificación comercial para lotes de capones, cachorros y lechones.
            Es un modelo <strong>estrictamente hipotético</strong>: <strong>no genera comprobantes contables, liquidaciones ni altera las existencias físicas de piara</strong>.
          </p>
        </div>
      </div>

      {/* Encabezado Principal */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#edf7f0] text-[#1c4b31] rounded-lg">
              <Calculator className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526b5c]">
              Gestión Comercial Porcina · Simulación de Venta
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#14281d] tracking-tight">
            Simulador Comercial de Hacienda Porcina
          </h1>
          <p className="text-xs text-[#526b5c] mt-0.5">
            Proyección en tiempo real de Ingreso Bruto, Gastos de Comercialización e Ingreso Neto Comercial
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRestablecerValores}
            className="px-3 py-1.5 bg-[#f8faf7] hover:bg-[#edf7f0] text-[#1c4b31] border border-[#c8d9cc] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restablecer valores zootécnicos por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Parámetros</span>
          </button>
          <div className="px-3 py-1.5 bg-[#edf7f0] border border-[#bbf7d0] rounded-lg text-xs font-mono">
            <span className="text-[#166534]">Ref. Pormag/Rosporc: </span>
            <strong className="text-[#143422]">${catConfig.precioDefaultKg}/kg</strong>
          </div>
        </div>
      </div>

      {/* Selector Rápido de Categoría Comercial */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-4 shadow-xs space-y-2">
        <label className="text-xs font-bold text-[#14281d] uppercase tracking-wider block">
          Seleccionar Categoría Comercial Porcina:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {(Object.keys(CATEGORIAS_PORCINAS) as CategoriaPorcina[]).map((catKey) => {
            const item = CATEGORIAS_PORCINAS[catKey];
            const isSelected = categoria === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCambiarCategoria(catKey)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1c4b31] text-white border-[#1c4b31] shadow-xs'
                    : 'bg-[#fcfdfc] text-[#2c4033] border-[#d8e2d7] hover:bg-[#f0f6f1]'
                }`}
              >
                <span className="text-xs font-bold block truncate">{item.nombre}</span>
                <span className={`text-[10px] block truncate ${isSelected ? 'opacity-85' : 'text-[#5c7767]'}`}>
                  {item.subtitulo}
                </span>
                <span className={`text-[10px] font-mono block mt-1 ${isSelected ? 'text-[#a7f3d0]' : 'text-[#1c4b31] font-semibold'}`}>
                  Ref: {item.pesoDefault} kg
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cuadrícula Principal: Entradas vs. Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel de Parámetros Configurables (5 columnas) */}
        <div className="lg:col-span-5 bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e5efe7]">
            <h2 className="text-sm font-bold text-[#14281d] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#1c4b31]" />
              <span>Variables del Lote y Comercialización</span>
            </h2>
            <span className="text-[10px] font-mono text-[#1c4b31] bg-[#edf7f0] px-2 py-0.5 rounded border border-[#bbf7d0]">
              {catConfig.nombre}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Modalidad de Precio */}
            <div>
              <label className="font-semibold text-[#14281d] block mb-1.5">Modalidad de Cotización:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalidad('KG');
                    setPrecioUnitario(catConfig.precioDefaultKg);
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalidad === 'KG'
                      ? 'bg-[#1c4b31] text-white border-[#1c4b31]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Por Kilogramo ($/kg vivo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalidad('CABEZA');
                    setPrecioUnitario(catConfig.precioDefaultCab);
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalidad === 'CABEZA'
                      ? 'bg-[#1c4b31] text-white border-[#1c4b31]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Por Cabeza ($/cab)</span>
                </button>
              </div>
            </div>

            {/* Cantidad de Animales */}
            <div>
              <div className="flex justify-between font-semibold text-[#14281d] mb-1">
                <label>Cantidad de Animales a Simular:</label>
                <span className="font-mono text-[#1c4b31] font-bold">{cabezas} cab</span>
              </div>
              <input
                type="number"
                min="1"
                max="500"
                value={cabezas}
                onChange={(e) => setCabezas(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1c4b31]"
              />
            </div>

            {/* Peso Promedio por Animal */}
            <div>
              <div className="flex justify-between font-semibold text-[#14281d] mb-1">
                <label>Peso Promedio Estimado:</label>
                <span className="font-mono text-[#1c4b31] font-bold">{pesoPromedio} kg/cab</span>
              </div>
              <input
                type="range"
                min={catConfig.pesoMin}
                max={catConfig.pesoMax}
                step="1"
                value={pesoPromedio}
                onChange={(e) => setPesoPromedio(Number(e.target.value))}
                className="w-full accent-[#1c4b31]"
              />
              <div className="flex justify-between text-[10px] text-[#526b5c]">
                <span>Mín: {catConfig.pesoMin} kg</span>
                <span className="font-semibold">Típico: {catConfig.pesoDefault} kg</span>
                <span>Máx: {catConfig.pesoMax} kg</span>
              </div>
            </div>

            {/* Kilogramos Totales Calculados */}
            <div className="p-2.5 bg-[#f8faf8] border border-[#dce6dc] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Kilogramos Totales Proyectados:</span>
                <span className="text-sm font-bold font-mono text-[#143422]">{resultado.kgTotales.toLocaleString('es-AR')} kg</span>
              </div>
              <span className="text-[11px] text-[#526b5c]">({cabezas} cab × {pesoPromedio} kg)</span>
            </div>

            {/* Precio Unitario */}
            <div>
              <div className="flex justify-between font-semibold text-[#14281d] mb-1">
                <label>Precio de Venta {modalidad === 'KG' ? '($/kg vivo):' : '($/cabeza):'}</label>
                <span className="font-mono text-[#1c4b31] font-bold">
                  ${precioUnitario.toLocaleString('es-AR')} {modalidad === 'KG' ? '/kg' : '/cab'}
                </span>
              </div>
              <input
                type="number"
                step={modalidad === 'KG' ? '10' : '500'}
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1c4b31]"
              />
            </div>

            {/* Gastos Comerciales y Logística */}
            <div className="pt-2 border-t border-[#edf3ee] space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                Gastos Comerciales & Flete
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-600 block">Comisión Consignatario (%):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="15"
                    value={comisionPorc}
                    onChange={(e) => setComisionPorc(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block">Flete Estimado ($/cab):</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={fletePorCab}
                    onChange={(e) => setFletePorCab(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 block">Guía de Traslado SENASA + Tasas ($/cab):</label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={guiaSenasaPorCab}
                  onChange={(e) => setGuiaSenasaPorCab(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] font-mono text-xs"
                />
              </div>
            </div>

            {/* Switch de Costos Productivos */}
            <div className="pt-2 border-t border-[#edf3ee] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#14281d] flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={computarCostos}
                    onChange={(e) => setComputarCostos(e.target.checked)}
                    className="w-4 h-4 text-[#1c4b31] rounded"
                  />
                  <span>Imputar Costos Productivos Estimados</span>
                </label>
                <span className="text-[10px] text-slate-500">{computarCostos ? 'Margen Activado' : 'Solo Ingreso Neto'}</span>
              </div>

              {computarCostos ? (
                <div>
                  <label className="text-[10px] text-slate-600 block mb-0.5">
                    Costo Integral de Alimentación + Estructura ($/cab):
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={costoUnitarioCab}
                    onChange={(e) => setCostoUnitarioCab(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Costo estimado de raciones y sanidad para esta categoría.
                  </span>
                </div>
              ) : (
                <div className="p-2 bg-amber-50 rounded text-[11px] text-amber-800 border border-amber-200">
                  Al desactivar los costos, se presenta exclusivamente el <strong>Ingreso Neto Comercial</strong> para evitar distorsiones de rentabilidad.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Resultados y Proyección Financiera (7 columnas) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tarjeta de Veredicto / Resumen Principal */}
          <div className="bg-[#f0f9f2] border border-[#a5d8b0] text-[#133c1f] p-5 rounded-xl shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#c2e7ca] mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-[#1c4b31]" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] block">
                    Proyección Comercial · {catConfig.nombre} ({cabezas} cab)
                  </span>
                  <h3 className="text-base font-bold text-[#14281d]">
                    Ingreso Neto Comercial: ${resultado.ingresoNetoComercial.toLocaleString('es-AR')}
                  </h3>
                </div>
              </div>
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-white text-[#1c4b31] border border-[#a5d8b0] font-mono">
                {modalidad === 'KG' ? `$${resultado.ingresoNetoPorKg}/kg neto` : `$${resultado.ingresoNetoPorCab.toLocaleString('es-AR')}/cab`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-[#4d6657] block">Ingreso Bruto Total:</span>
                <span className="text-lg font-bold font-mono text-[#14281d]">
                  ${resultado.ingresoBruto.toLocaleString('es-AR')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#4d6657] block">Gastos Comerciales:</span>
                <span className="text-lg font-bold font-mono text-rose-700">
                  -${resultado.totalGastosComerciales.toLocaleString('es-AR')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#4d6657] block">
                  {computarCostos ? 'Margen Económico:' : 'Kilos Proyectados:'}
                </span>
                <span className={`text-lg font-bold font-mono ${
                  computarCostos 
                    ? (resultado.esMargenPositivo ? 'text-[#1c4b31]' : 'text-rose-700')
                    : 'text-[#14281d]'
                }`}>
                  {computarCostos 
                    ? `${resultado.margenEconomicoTotal > 0 ? '+' : ''}$${resultado.margenEconomicoTotal.toLocaleString('es-AR')}`
                    : `${resultado.kgTotales.toLocaleString('es-AR')} kg`
                  }
                </span>
              </div>
            </div>

            {computarCostos && (
              <div className="mt-3 pt-2.5 border-t border-[#c2e7ca] flex items-center justify-between text-xs">
                <span>Resultado por Cabeza: <strong>${resultado.margenPorCab.toLocaleString('es-AR')} /cab</strong></span>
                <span>Rentabilidad s/ Costo: <strong>{resultado.rentabilidadSobreCosto}%</strong></span>
              </div>
            )}
          </div>

          {/* Desglose Económico Paso a Paso */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#14281d] pb-2 border-b border-[#e5efe7] flex items-center justify-between">
              <span>Desglose Analítico de la Operación</span>
              <span className="text-[11px] font-normal text-slate-500">Unidad: Porcinos (Pozo del Carril)</span>
            </h3>

            <div className="space-y-2.5 text-xs text-[#2c4033]">
              <div className="flex justify-between items-center py-1 border-b border-[#edf3ee]">
                <span className="text-[#526b5c]">1. Volumen total simulado ({cabezas} cabezas @ {pesoPromedio} kg/cab):</span>
                <strong className="font-mono text-[#14281d]">{resultado.kgTotales.toLocaleString('es-AR')} kg</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#edf3ee]">
                <span className="text-[#526b5c]">
                  2. Ingreso Bruto ({modalidad === 'KG' ? `${resultado.kgTotales} kg × $${precioUnitario}/kg` : `${cabezas} cab × $${precioUnitario}/cab`}):
                </span>
                <strong className="font-mono text-[#14281d]">${resultado.ingresoBruto.toLocaleString('es-AR')}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#edf3ee]">
                <span className="text-[#526b5c]">3. Comisión de comercialización ({comisionPorc}%):</span>
                <span className="font-mono text-rose-600">-${resultado.gastoComision.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#edf3ee]">
                <span className="text-[#526b5c]">4. Flete a destino ({cabezas} cab @ ${fletePorCab}/cab):</span>
                <span className="font-mono text-rose-600">-${resultado.gastoFleteTotal.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-[#edf3ee]">
                <span className="text-[#526b5c]">5. Guía SENASA y tasas ({cabezas} cab @ ${guiaSenasaPorCab}/cab):</span>
                <span className="font-mono text-rose-600">-${resultado.gastoGuiaTotal.toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 bg-[#f8faf8] px-2 rounded font-semibold">
                <span className="text-[#166534]">6. INGRESO NETO COMERCIAL (Bolsillo):</span>
                <strong className="font-mono text-sm text-[#143422]">${resultado.ingresoNetoComercial.toLocaleString('es-AR')}</strong>
              </div>

              {computarCostos && (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-[#edf3ee]">
                    <span className="text-[#526b5c]">7. Costo productivo imputado ({cabezas} cab @ ${costoUnitarioCab}/cab):</span>
                    <span className="font-mono text-rose-600">-${resultado.costoTotalProduccion.toLocaleString('es-AR')}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 font-bold text-sm">
                    <span className="text-[#14281d]">MARGEN ECONÓMICO PROYECTADO:</span>
                    <span className={`font-mono text-base ${resultado.esMargenPositivo ? 'text-[#1c4b31]' : 'text-rose-600'}`}>
                      {resultado.margenEconomicoTotal > 0 ? '+' : ''}${resultado.margenEconomicoTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Matriz de Sensibilidad de Escenarios */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-[#14281d] uppercase tracking-wider mb-2.5">
              Sensibilidad ante Variaciones de Precio de Mercado
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-[10px] text-rose-800 font-bold block">Escenario Adverso (-10%)</span>
                <span className="font-mono font-bold text-slate-800 block mt-1">
                  ${Math.round(resultado.ingresoNetoComercial * 0.9).toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-slate-500 block">Ingreso Neto</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#edf7f0] border border-[#bbf7d0]">
                <span className="text-[10px] text-[#166534] font-bold block">Escenario Base (0%)</span>
                <span className="font-mono font-bold text-[#1c4b31] block mt-1">
                  ${resultado.ingresoNetoComercial.toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-slate-500 block">Ingreso Neto</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block">Escenario Favorable (+10%)</span>
                <span className="font-mono font-bold text-slate-800 block mt-1">
                  ${Math.round(resultado.ingresoNetoComercial * 1.1).toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-slate-500 block">Ingreso Neto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
