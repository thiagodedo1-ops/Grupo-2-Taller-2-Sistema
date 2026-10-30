/**
 * @file SimulacionVentaOvinoView.tsx
 * @description Módulo de Simulación de Venta Ovina de Carne (Corderos, Corderos Pesados, Capones y Refugo)
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Ubicación: Ovinos → Gestión Comercial → Simulación de Venta
 * 
 * IMPORTANTE: Módulo de análisis y planificación comercial estrictamente HIPOTÉTICO y AISLADO.
 * No genera comprobantes contables, liquidaciones ni altera las existencias físicas de majada.
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
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser?: Usuario | null;
}

type CategoriaOvina = 'CORDERO_LIVIANO' | 'CORDERO_PESADO' | 'CAPON_BORREGO' | 'OVEJA_DESCARTE' | 'CARNERO_DESCARTE';
type ModalidadPrecio = 'KG' | 'CABEZA';

interface CategoriaOvinaConfig {
  id: CategoriaOvina;
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

const CATEGORIAS_OVINAS: Record<CategoriaOvina, CategoriaConfig> = {
  CORDERO_LIVIANO: {
    id: 'CORDERO_LIVIANO',
    nombre: 'Cordero Liviano / Consumo',
    subtitulo: 'Pascua / Fiestas / Abasto Local',
    pesoMin: 18,
    pesoMax: 32,
    pesoDefault: 26,
    precioDefaultKg: 3850,
    precioDefaultCab: 100100,
    modalidadDefault: 'KG',
    cabezasDefault: 35,
    costoAlimDefaultCab: 28000,
    descripcion: 'Cordero de lactancia o destete temprano criado a pastura natural con alta terneza (22-28 kg).'
  },
  CORDERO_PESADO: {
    id: 'CORDERO_PESADO',
    nombre: 'Cordero Pesado de Terminación',
    subtitulo: 'Consignación Frigorífico / Desposte',
    pesoMin: 32,
    pesoMax: 46,
    pesoDefault: 38,
    precioDefaultKg: 3450,
    precioDefaultCab: 131100,
    modalidadDefault: 'KG',
    cabezasDefault: 40,
    costoAlimDefaultCab: 42000,
    descripcion: 'Cordero suplementado a corral o verdeos con tipificación de res comercial (34-42 kg).'
  },
  CAPON_BORREGO: {
    id: 'CAPON_BORREGO',
    nombre: 'Borregos / Capones de Carne',
    subtitulo: 'Invernada / Consumo Industrial',
    pesoMin: 42,
    pesoMax: 62,
    pesoDefault: 50,
    precioDefaultKg: 2900,
    precioDefaultCab: 145000,
    modalidadDefault: 'KG',
    cabezasDefault: 20,
    costoAlimDefaultCab: 55000,
    descripcion: 'Machos castrados con más de 2 dientes destinados a faena de carcasa pesada.'
  },
  OVEJA_DESCARTE: {
    id: 'OVEJA_DESCARTE',
    nombre: 'Ovejas de Descarte / Refugo',
    subtitulo: 'Baja Reproductiva Majada',
    pesoMin: 45,
    pesoMax: 70,
    pesoDefault: 56,
    precioDefaultKg: 1850,
    precioDefaultCab: 103600,
    modalidadDefault: 'KG',
    cabezasDefault: 15,
    costoAlimDefaultCab: 48000,
    descripcion: 'Vientres que finalizaron su vida útil reproductiva o con problemas dentarios/ubres.'
  },
  CARNERO_DESCARTE: {
    id: 'CARNERO_DESCARTE',
    nombre: 'Carneros de Descarte',
    subtitulo: 'Recambio Genético Majada',
    pesoMin: 70,
    pesoMax: 110,
    pesoDefault: 85,
    precioDefaultKg: 1600,
    precioDefaultCab: 136000,
    modalidadDefault: 'KG',
    cabezasDefault: 3,
    costoAlimDefaultCab: 65000,
    descripcion: 'Reproductores machos dados de baja por consanguinidad, edad o defectos seminales.'
  }
};

type CategoriaConfig = CategoriaOvinaConfig;

export const SimulacionVentaOvinoView: React.FC<Props> = ({ db }) => {
  const { formatMoney, currency } = useCurrency();
  // 1. Selección de Categoría
  const [categoria, setCategoria] = useState<CategoriaOvina>('CORDERO_PESADO');
  const catConfig = CATEGORIAS_OVINAS[categoria];

  // 2. Parámetros de la Tropa Ovina
  const [modalidad, setModalidad] = useState<ModalidadPrecio>(catConfig.modalidadDefault);
  const [cabezas, setCabezas] = useState<number>(catConfig.cabezasDefault);
  const [pesoPromedio, setPesoPromedio] = useState<number>(catConfig.pesoDefault);
  const [precioUnitario, setPrecioUnitario] = useState<number>(
    catConfig.modalidadDefault === 'KG' ? catConfig.precioDefaultKg : catConfig.precioDefaultCab
  );

  // 3. Gastos de Comercialización y Flete
  const [comisionPorc, setComisionPorc] = useState<number>(2.0); // % Consignatario / Feria
  const [fletePorCab, setFletePorCab] = useState<number>(2200); // $/cab flete jaula ovina
  const [guiaSenasaPorCab, setGuiaSenasaPorCab] = useState<number>(450); // $/cab DTE ovino

  // 4. Consideración de Costos de Suplementación y Pastura
  const [computarCostos, setComputarCostos] = useState<boolean>(true);
  const [costoUnitarioCab, setCostoUnitarioCab] = useState<number>(catConfig.costoAlimDefaultCab);

  const handleCambiarCategoria = (nuevaCat: CategoriaOvina) => {
    setCategoria(nuevaCat);
    const cfg = CATEGORIAS_OVINAS[nuevaCat];
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

    // Ingreso Neto Comercial
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

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in font-sans">
      {/* Banner de Aislamiento Estricto */}
      <div className="bg-[#eff6ff] border border-[#bfdbfe] p-4 rounded-xl flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-[#1e40af] shrink-0 mt-0.5" />
        <div className="text-xs text-[#1e3a8a] space-y-0.5">
          <strong className="font-bold text-[#172554] block text-sm">
            Simulador de Decisión Comercial Ovina (Carne y Corderos) · Pozo del Carril
          </strong>
          <p>
            Modelo analítico orientado a la producción de carne ovina (cordero liviano, pesado y capones).
            Es un entorno <strong>estrictamente hipotético</strong>: <strong>no genera comprobantes contables ni altera las existencias físicas de majada</strong>.
          </p>
        </div>
      </div>

      {/* Encabezado Principal */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#1e40af]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#eff6ff] text-[#1e40af] rounded-lg">
              <Calculator className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3b82f6]">
              Gestión Comercial Ovina · Simulación de Venta
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">
            Simulador Comercial de Carne Ovina & Corderos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Proyección de Ingreso Bruto, Gastos de Despacho e Ingreso Neto Comercial de Majada
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRestablecerValores}
            className="px-3 py-1.5 bg-[#f8fafc] hover:bg-[#eff6ff] text-[#1e40af] border border-[#cbd5e1] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restablecer valores zootécnicos por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Parámetros</span>
          </button>
          <div className="px-3 py-1.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg text-xs font-mono">
            <span className="text-[#1e40af]">Ref. Cordero Pesado: </span>
            <strong className="text-[#172554]">{formatMoney(catConfig.precioDefaultKg)}/kg</strong>
          </div>
        </div>
      </div>

      {/* Selector de Categoría Comercial Ovina */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-4 shadow-xs space-y-2">
        <label className="text-xs font-bold text-[#0f172a] uppercase tracking-wider block">
          Seleccionar Categoría Ovina Comercial:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {(Object.keys(CATEGORIAS_OVINAS) as CategoriaOvina[]).map((catKey) => {
            const item = CATEGORIAS_OVINAS[catKey];
            const isSelected = categoria === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCambiarCategoria(catKey)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-xs'
                    : 'bg-[#f8fafc] text-slate-700 border-[#cbd5e1] hover:bg-[#f1f5f9]'
                }`}
              >
                <span className="text-xs font-bold block truncate">{item.nombre}</span>
                <span className={`text-[10px] block truncate ${isSelected ? 'opacity-85' : 'text-slate-500'}`}>
                  {item.subtitulo}
                </span>
                <span className={`text-[10px] font-mono block mt-1 ${isSelected ? 'text-[#93c5fd]' : 'text-[#1e40af] font-semibold'}`}>
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
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#1e40af]" />
              <span>Variables de la Tropa y Mercado</span>
            </h2>
            <span className="text-[10px] font-mono text-[#1e40af] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe]">
              {catConfig.nombre}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Modalidad de Cotización */}
            <div>
              <label className="font-semibold text-[#0f172a] block mb-1.5">Modalidad de Cotización:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalidad('KG');
                    setPrecioUnitario(catConfig.precioDefaultKg);
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalidad === 'KG'
                      ? 'bg-[#1e40af] text-white border-[#1e40af]'
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
                      ? 'bg-[#1e40af] text-white border-[#1e40af]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Por Cabeza ($/cab)</span>
                </button>
              </div>
            </div>

            {/* Cabezas a Simular */}
            <div>
              <div className="flex justify-between font-semibold text-[#0f172a] mb-1">
                <label>Cabezas a Comercializar:</label>
                <span className="font-mono text-[#1e40af] font-bold">{cabezas} cab</span>
              </div>
              <input
                type="number"
                min="1"
                max="500"
                value={cabezas}
                onChange={(e) => setCabezas(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-[#0f172a] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
              />
            </div>

            {/* Peso Vivo Promedio */}
            <div>
              <div className="flex justify-between font-semibold text-[#0f172a] mb-1">
                <label>Peso Vivo Promedio Estimado:</label>
                <span className="font-mono text-[#1e40af] font-bold">{pesoPromedio} kg/cab</span>
              </div>
              <input
                type="range"
                min={catConfig.pesoMin}
                max={catConfig.pesoMax}
                step="1"
                value={pesoPromedio}
                onChange={(e) => setPesoPromedio(Number(e.target.value))}
                className="w-full accent-[#1e40af]"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Mín: {catConfig.pesoMin} kg</span>
                <span className="font-semibold text-slate-700">Típico: {catConfig.pesoDefault} kg</span>
                <span>Máx: {catConfig.pesoMax} kg</span>
              </div>
            </div>

            {/* Kilos Totales Calculados */}
            <div className="p-2.5 bg-[#f8fafc] border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Peso Total Proyectado:</span>
                <span className="text-sm font-bold font-mono text-[#0f172a]">{resultado.kgTotales.toLocaleString('es-AR')} kg</span>
              </div>
              <span className="text-[11px] text-slate-500">({cabezas} cab × {pesoPromedio} kg)</span>
            </div>

            {/* Precio Unitario */}
            <div>
              <div className="flex justify-between font-semibold text-[#0f172a] mb-1">
                <label>Precio de Venta {modalidad === 'KG' ? '($/kg vivo):' : '($/cabeza):'}</label>
                <span className="font-mono text-[#1e40af] font-bold">
                  {formatMoney(precioUnitario)} {modalidad === 'KG' ? '/kg' : '/cab'}
                </span>
              </div>
              <input
                type="number"
                step={modalidad === 'KG' ? '10' : '500'}
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-[#0f172a] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
              />
            </div>

            {/* Gastos Comerciales y Despacho */}
            <div className="pt-2 border-t border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                Gastos de Despacho & Comercialización
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
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-[#0f172a] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 block">
                    Flete Estimado ({currency === 'USD' ? 'USD/cab' : '$/cab'}):
                    {currency === 'USD' && <span className="text-emerald-700 font-semibold font-mono ml-1">≈ {formatMoney(fletePorCab)}</span>}
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={fletePorCab}
                    onChange={(e) => setFletePorCab(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-[#0f172a] font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 block">
                  Guía DTE SENASA + Despacho ({currency === 'USD' ? 'USD/cab' : '$/cab'}):
                  {currency === 'USD' && <span className="text-emerald-700 font-semibold font-mono ml-1">≈ {formatMoney(guiaSenasaPorCab)}</span>}
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={guiaSenasaPorCab}
                  onChange={(e) => setGuiaSenasaPorCab(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-[#0f172a] font-mono text-xs"
                />
              </div>
            </div>

            {/* Imputación de Costos Productivos Ovinos */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={computarCostos}
                    onChange={(e) => setComputarCostos(e.target.checked)}
                    className="w-4 h-4 text-[#1e40af] rounded"
                  />
                  <span>Imputar Costos Productivos Ovinos</span>
                </label>
                <span className="text-[10px] text-slate-500">{computarCostos ? 'Margen Activado' : 'Solo Ingreso Neto'}</span>
              </div>

              {computarCostos ? (
                <div>
                  <label className="text-[10px] text-slate-600 block mb-0.5">
                    Costo Integral de Alimentación + Sanidad ({currency === 'USD' ? 'USD/cab' : '$/cab'}):
                    {currency === 'USD' && <span className="text-emerald-700 font-semibold font-mono ml-1">≈ {formatMoney(costoUnitarioCab)}</span>}
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={costoUnitarioCab}
                    onChange={(e) => setCostoUnitarioCab(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-[#0f172a] font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Costo promedio estimado de pastura, suplementación y plan sanitario.
                  </span>
                </div>
              ) : (
                <div className="p-2 bg-amber-50 rounded text-[11px] text-amber-800 border border-amber-200">
                  Al desactivar los costos, se presenta exclusivamente el <strong>Ingreso Neto Comercial</strong> para evitar distorsiones.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Resultados y Proyección Financiera (7 columnas) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tarjeta de Veredicto / Resumen Principal */}
          <div className="bg-[#eff6ff] border border-[#bfdbfe] text-[#1e3a8a] p-5 rounded-xl shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#dbeafe] mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-[#1e40af]" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb] block">
                    Proyección Comercial Ovina · {catConfig.nombre} ({cabezas} cab)
                  </span>
                  <h3 className="text-base font-bold text-[#0f172a]">
                    Ingreso Neto Comercial: {formatMoney(resultado.ingresoNetoComercial)}
                  </h3>
                </div>
              </div>
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-white text-[#1e40af] border border-[#bfdbfe] font-mono">
                {modalidad === 'KG' ? `${formatMoney(resultado.ingresoNetoPorKg)}/kg neto` : `${formatMoney(resultado.ingresoNetoPorCab)}/cab`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block">Ingreso Bruto Total:</span>
                <span className="text-lg font-bold font-mono text-[#0f172a]">
                  {formatMoney(resultado.ingresoBruto)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Gastos de Comercialización:</span>
                <span className="text-lg font-bold font-mono text-rose-700">
                  -{formatMoney(resultado.totalGastosComerciales)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">
                  {computarCostos ? 'Margen Económico:' : 'Kilos Proyectados:'}
                </span>
                <span className={`text-lg font-bold font-mono ${
                  computarCostos 
                    ? (resultado.esMargenPositivo ? 'text-[#1e40af]' : 'text-rose-700')
                    : 'text-[#0f172a]'
                }`}>
                  {computarCostos 
                    ? `${resultado.margenEconomicoTotal > 0 ? '+' : ''}${formatMoney(resultado.margenEconomicoTotal)}`
                    : `${resultado.kgTotales.toLocaleString('es-AR')} kg`
                  }
                </span>
              </div>
            </div>

            {computarCostos && (
              <div className="mt-3 pt-2.5 border-t border-[#dbeafe] flex items-center justify-between text-xs">
                <span>Resultado por Cabeza: <strong>{formatMoney(resultado.margenPorCab)} /cab</strong></span>
                <span>Rentabilidad s/ Costo: <strong>{resultado.rentabilidadSobreCosto}%</strong></span>
              </div>
            )}
          </div>

          {/* Desglose Económico Paso a Paso */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#0f172a] pb-2 border-b border-slate-200 flex items-center justify-between">
              <span>Desglose Analítico del Despacho Ovino</span>
              <span className="text-[11px] font-normal text-slate-500">Unidad: Ovinos (Pozo del Carril)</span>
            </h3>

            <div className="space-y-2.5 text-xs text-[#1e293b]">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">1. Volumen total simulado ({cabezas} cabezas @ {pesoPromedio} kg/cab):</span>
                <strong className="font-mono text-[#0f172a]">{resultado.kgTotales.toLocaleString('es-AR')} kg</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">
                  2. Ingreso Bruto ({modalidad === 'KG' ? `${resultado.kgTotales} kg × ${formatMoney(precioUnitario)}/kg` : `${cabezas} cab × ${formatMoney(precioUnitario)}/cab`}):
                </span>
                <strong className="font-mono text-[#0f172a]">{formatMoney(resultado.ingresoBruto)}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">3. Comisión de consignatario / feria ({comisionPorc}%):</span>
                <span className="font-mono text-rose-600">-{formatMoney(resultado.gastoComision)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">4. Flete jaula ovina ({cabezas} cab @ {formatMoney(fletePorCab)}/cab):</span>
                <span className="font-mono text-rose-600">-{formatMoney(resultado.gastoFleteTotal)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">5. Guía SENASA y tasas ({cabezas} cab @ {formatMoney(guiaSenasaPorCab)}/cab):</span>
                <span className="font-mono text-rose-600">-{formatMoney(resultado.gastoGuiaTotal)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 bg-[#f0f9ff] px-2 rounded font-semibold border border-[#e0f2fe]">
                <span className="text-[#0369a1]">6. INGRESO NETO COMERCIAL (Bolsillo):</span>
                <strong className="font-mono text-sm text-[#0c4a6e]">{formatMoney(resultado.ingresoNetoComercial)}</strong>
              </div>

              {computarCostos && (
                <>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">7. Costo productivo asignado ({cabezas} cab @ {formatMoney(costoUnitarioCab)}/cab):</span>
                    <span className="font-mono text-rose-600">-{formatMoney(resultado.costoTotalProduccion)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 font-bold text-sm">
                    <span className="text-[#0f172a]">MARGEN ECONÓMICO PROYECTADO:</span>
                    <span className={`font-mono text-base ${resultado.esMargenPositivo ? 'text-[#1e40af]' : 'text-rose-600'}`}>
                      {resultado.margenEconomicoTotal > 0 ? '+' : ''}{formatMoney(resultado.margenEconomicoTotal)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Matriz de Sensibilidad de Precios */}
          <div className="bg-white border border-[#d6e3d8] rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-2.5">
              Sensibilidad ante Variaciones de Precio de Mercado Ovino
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-[10px] text-rose-800 font-bold block">Escenario Adverso (-10%)</span>
                <span className="font-mono font-bold text-slate-800 block mt-1">
                  {formatMoney(Math.round(resultado.ingresoNetoComercial * 0.9))}
                </span>
                <span className="text-[10px] text-slate-500 block">Ingreso Neto</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#eff6ff] border border-[#bfdbfe]">
                <span className="text-[10px] text-[#1e40af] font-bold block">Escenario Base (0%)</span>
                <span className="font-mono font-bold text-[#1e40af] block mt-1">
                  {formatMoney(resultado.ingresoNetoComercial)}
                </span>
                <span className="text-[10px] text-slate-500 block">Ingreso Neto</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block">Escenario Favorable (+10%)</span>
                <span className="font-mono font-bold text-slate-800 block mt-1">
                  {formatMoney(Math.round(resultado.ingresoNetoComercial * 1.1))}
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
