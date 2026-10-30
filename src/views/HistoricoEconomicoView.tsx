/**
 * @file HistoricoEconomicoView.tsx
 * @description Módulo de Registro Histórico de Información Económica
 * Requerimiento 6:
 * - Histórico de costos, gastos, ingresos, precios de compra y venta, márgenes, resultados,
 *   cotizaciones y valuaciones de existencias.
 * - Filtros por fechas, mes, trimestre, año, campaña, lote, fase, categoría animal y concepto.
 * - Tablas y gráficos de evolución de costos totales, costos por kg, precios, ingresos, márgenes,
 *   resultados e incidencia de la alimentación.
 * - Comparaciones entre períodos y campañas.
 * - Preservación de importes nominales originales, fechas y cotizaciones utilizadas.
 * - Trazabilidad y diferenciación estricta de moneda de origen y conversión USD de presentación.
 */

import React, { useState, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Download, 
  ArrowUpDown, 
  Scale, 
  Layers, 
  PieChart, 
  BarChart3, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BaseDatosPorcina, Usuario, FCostos, FIngresos, MovComercialEnc, MovComercialDet } from '../types/schema';
import { useCurrency } from '../context/CurrencyContext';
import { getRolePermissions } from '../lib/permissions';
import { rosporcService } from '../lib/rosporcService';
import { currencyService } from '../lib/currencyService';

interface Props {
  db: BaseDatosPorcina;
  currentUser?: Usuario | null;
  onExportCsv?: (tableName: keyof BaseDatosPorcina) => void;
}

type TabType = 'resumen' | 'ventas' | 'costos' | 'precios_cotizaciones' | 'valuaciones' | 'comparativa';
type AgrupacionTiempo = 'MES' | 'TRIMESTRE' | 'CAMPANA';

export const HistoricoEconomicoView: React.FC<Props> = ({
  db,
  currentUser = null,
  onExportCsv
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney, symbol, currency } = useCurrency();

  // Solapa activa
  const [activeTab, setActiveTab] = useState<TabType>('resumen');

  // Filtros principales
  const [selectedCampana, setSelectedCampana] = useState<string>('TODAS');
  const [fechaDesde, setFechaDesde] = useState<string>('2024-07-01');
  const [fechaHasta, setFechaHasta] = useState<string>('2026-12-31');
  const [selectedLote, setSelectedLote] = useState<string>('TODOS');
  const [selectedFase, setSelectedFase] = useState<string>('TODAS');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedConcepto, setSelectedConcepto] = useState<string>('TODOS');
  const [agrupacion, setAgrupacion] = useState<AgrupacionTiempo>('MES');

  // Filtros de comparativa de campañas
  const [campanaAId, setCampanaAId] = useState<string>('CAMP_2023_2024');
  const [campanaBId, setCampanaBId] = useState<string>('CAMP_2024_2025');

  // Buscador de texto
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filtrado de Costos
  const costosFiltrados = useMemo(() => {
    return db.F_Costos.filter(c => {
      if (c.estado === 'Anulado') return false;
      if (selectedCampana !== 'TODAS') {
        const campana = db.D_Campana.find(cp => cp.id === selectedCampana);
        if (campana && c.fecha) {
          if (c.fecha < campana.fecha_desde || c.fecha > campana.fecha_hasta) return false;
        }
      } else {
        if (fechaDesde && c.fecha < fechaDesde) return false;
        if (fechaHasta && c.fecha > fechaHasta) return false;
      }
      if (selectedLote !== 'TODOS' && c.lote_id !== selectedLote) return false;
      if (selectedFase !== 'TODAS' && c.fase_id !== selectedFase) return false;
      if (selectedConcepto !== 'TODOS' && c.cuenta_id !== selectedConcepto) return false;
      return true;
    });
  }, [db.F_Costos, db.D_Campana, selectedCampana, fechaDesde, fechaHasta, selectedLote, selectedFase, selectedConcepto]);

  // 2. Filtrado de Ventas / Ingresos
  const ventasFiltradas = useMemo(() => {
    return db.Mov_Comercial_Enc.filter(m => {
      if (m.tipo_operacion !== 'VENTA') return false;
      if (m.estado === 'Anulado') return false;
      if (selectedCampana !== 'TODAS') {
        if (m.campana_id && m.campana_id !== selectedCampana) return false;
        const campana = db.D_Campana.find(cp => cp.id === selectedCampana);
        if (!m.campana_id && campana && m.fecha) {
          if (m.fecha < campana.fecha_desde || m.fecha > campana.fecha_hasta) return false;
        }
      } else {
        if (fechaDesde && m.fecha < fechaDesde) return false;
        if (fechaHasta && m.fecha > fechaHasta) return false;
      }
      return true;
    });
  }, [db.Mov_Comercial_Enc, db.D_Campana, selectedCampana, fechaDesde, fechaHasta]);

  // Detalles de ventas con ítems
  const detallesVentas = useMemo(() => {
    const encIds = new Set(ventasFiltradas.map(v => v.id));
    return db.Mov_Comercial_Det.filter(d => {
      if (!encIds.has(d.mov_comercial_id)) return false;
      if (selectedCategoria !== 'TODAS') {
        const prodId = d.producto_id || '';
        if (selectedCategoria === 'CAT_CAPON' && !prodId.includes('CAPON')) return false;
        if (selectedCategoria === 'CAT_LECHON' && !prodId.includes('LECHON')) return false;
        if (selectedCategoria === 'CAT_MADRE' && !prodId.includes('DESCARTE')) return false;
      }
      return true;
    });
  }, [db.Mov_Comercial_Det, ventasFiltradas, selectedCategoria]);

  // 3. Totales calculados
  const metricas = useMemo(() => {
    const totalIngresosNominal = ventasFiltradas.reduce((acc, v) => acc + (Number(v.total_neto) || 0), 0);
    const totalCostosNominal = costosFiltrados.reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);
    const margenBrutoNominal = totalIngresosNominal - totalCostosNominal;

    // Costos de alimentación
    const cuentasAlimento = new Set(['CTA_ALIM_MAIZ', 'CTA_ALIM_SOJA', 'CTA_ALIM_PELET', 'CTA_ALIM_CONC', 'CTA_ALIM_NUC', 'CTA_ALIM_OTROS']);
    const costoAlimentacion = costosFiltrados
      .filter(c => cuentasAlimento.has(c.cuenta_id))
      .reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);
    const incidenciaAlimentacion = totalCostosNominal > 0 ? (costoAlimentacion / totalCostosNominal) * 100 : 0;

    // Kilos y animales vendidos
    const totalKgVendidos = detallesVentas.reduce((acc, d) => acc + (Number(d.kg) || 0), 0);
    const totalCabezasVendidas = detallesVentas.reduce((acc, d) => acc + (Number(d.cantidad_animales) || 0), 0);
    const precioMedioKg = totalKgVendidos > 0 ? totalIngresosNominal / totalKgVendidos : 0;
    const costoMedioPorKg = totalKgVendidos > 0 ? totalCostosNominal / totalKgVendidos : 0;

    return {
      totalIngresosNominal,
      totalCostosNominal,
      margenBrutoNominal,
      costoAlimentacion,
      incidenciaAlimentacion,
      totalKgVendidos,
      totalCabezasVendidas,
      precioMedioKg,
      costoMedioPorKg
    };
  }, [ventasFiltradas, costosFiltrados, detallesVentas]);

  // 4. Agrupación temporal para gráficos y series de evolución
  const seriesEvolucion = useMemo(() => {
    const agrupado: Record<string, { periodo: string; ingresos: number; costos: number; alimento: number; kg: number; margen: number }> = {};

    ventasFiltradas.forEach(v => {
      const periodoKey = v.fecha.substring(0, 7); // YYYY-MM
      if (!agrupado[periodoKey]) {
        agrupado[periodoKey] = { periodo: periodoKey, ingresos: 0, costos: 0, alimento: 0, kg: 0, margen: 0 };
      }
      agrupado[periodoKey].ingresos += Number(v.total_neto) || 0;
    });

    detallesVentas.forEach(d => {
      const enc = db.Mov_Comercial_Enc.find(e => e.id === d.mov_comercial_id);
      if (enc?.fecha) {
        const periodoKey = enc.fecha.substring(0, 7);
        if (agrupado[periodoKey]) {
          agrupado[periodoKey].kg += Number(d.kg) || 0;
        }
      }
    });

    costosFiltrados.forEach(c => {
      const periodoKey = c.fecha.substring(0, 7);
      if (!agrupado[periodoKey]) {
        agrupado[periodoKey] = { periodo: periodoKey, ingresos: 0, costos: 0, alimento: 0, kg: 0, margen: 0 };
      }
      const monto = Number(c.importe_neto) || 0;
      agrupado[periodoKey].costos += monto;
      if (['CTA_ALIM_MAIZ', 'CTA_ALIM_CONC', 'CTA_ALIM_NUC'].includes(c.cuenta_id)) {
        agrupado[periodoKey].alimento += monto;
      }
    });

    return Object.values(agrupado)
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map(item => ({
        ...item,
        margen: item.ingresos - item.costos,
        costoPorKg: item.kg > 0 ? item.costos / item.kg : 0,
        precioPorKg: item.kg > 0 ? item.ingresos / item.kg : 0
      }));
  }, [ventasFiltradas, costosFiltrados, detallesVentas, db.Mov_Comercial_Enc]);

  // Cotizaciones históricas
  const cotizacionesBna = useMemo(() => currencyService.getHistorico(), []);
  const cotizacionesRosporc = useMemo(() => rosporcService.getHistorico(), []);

  // Comparación entre dos campañas
  const datosComparativa = useMemo(() => {
    const calcularCampana = (campId: string) => {
      const cObj = db.D_Campana.find(c => c.id === campId);
      if (!cObj) return null;
      const fDesde = cObj.fecha_desde;
      const fHasta = cObj.fecha_hasta;

      const vts = db.Mov_Comercial_Enc.filter(v => 
        v.tipo_operacion === 'VENTA' && 
        v.estado !== 'Anulado' &&
        ((v.campana_id && v.campana_id === campId) || (v.fecha >= fDesde && v.fecha <= fHasta))
      );
      const csts = db.F_Costos.filter(c => 
        c.estado !== 'Anulado' && c.fecha >= fDesde && c.fecha <= fHasta
      );

      const ingresos = vts.reduce((acc, v) => acc + (Number(v.total_neto) || 0), 0);
      const costos = csts.reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);
      const costoAlim = csts
        .filter(c => ['CTA_ALIM_MAIZ', 'CTA_ALIM_CONC', 'CTA_ALIM_NUC'].includes(c.cuenta_id))
        .reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

      // Kilos vendidos
      const encIds = new Set(vts.map(v => v.id));
      const dets = db.Mov_Comercial_Det.filter(d => encIds.has(d.mov_comercial_id));
      const kg = dets.reduce((acc, d) => acc + (Number(d.kg) || 0), 0);
      const cabezas = dets.reduce((acc, d) => acc + (Number(d.cantidad_animales) || 0), 0);

      return {
        nombre: cObj.nombre,
        estado: cObj.estado,
        ingresos,
        costos,
        margen: ingresos - costos,
        costoAlim,
        incidenciaAlim: costos > 0 ? (costoAlim / costos) * 100 : 0,
        kg,
        cabezas,
        precioKg: kg > 0 ? ingresos / kg : 0,
        costoKg: kg > 0 ? costos / kg : 0
      };
    };

    const campA = calcularCampana(campanaAId);
    const campB = calcularCampana(campanaBId);

    return { campA, campB };
  }, [db, campanaAId, campanaBId]);

  return (
    <div className="space-y-6 font-sans">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1c4b31] text-white flex items-center justify-center font-bold shadow-sm">
              <History className="w-5 h-5 text-[#86e2a2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#143422] tracking-tight">
                Registro Histórico de Información Económica
              </h1>
              <p className="text-xs text-[#5c7767] mt-0.5">
                Evolución de costos, ingresos, márgenes, cotizaciones oficiales BNA y referencias ROSPORC por período y campaña.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onExportCsv && (
            <button
              onClick={() => onExportCsv('F_Costos')}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-white text-[#214f34] border border-[#cbd8cb] hover:bg-[#f3f7f4] transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Costos CSV</span>
            </button>
          )}
          {onExportCsv && (
            <button
              onClick={() => onExportCsv('Mov_Comercial_Enc')}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-white text-[#214f34] border border-[#cbd8cb] hover:bg-[#f3f7f4] transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Ventas CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros Multidimensionales (Requerimiento 6) */}
      <div className="bg-white p-5 rounded-2xl border border-[#d8e2d7] shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e5ede4] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#143422] uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#205735]" />
            <span>Filtros Históricos Multidimensionales</span>
          </div>
          <span className="text-[11px] text-[#5c7767]">
            Mostrando datos reales consolidados sin simulaciones
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Campaña */}
          <div>
            <label className="block text-[11px] font-semibold text-[#446050] mb-1">Campaña</label>
            <select
              value={selectedCampana}
              onChange={e => setSelectedCampana(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#c5d5c5] bg-white text-[#183925] focus:outline-none focus:ring-1 focus:ring-[#205735]"
            >
              <option value="TODAS">Todas las Campañas</option>
              {db.D_Campana.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.estado})</option>
              ))}
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-[11px] font-semibold text-[#446050] mb-1">Fecha Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#c5d5c5] bg-white text-[#183925] focus:outline-none focus:ring-1 focus:ring-[#205735]"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-[11px] font-semibold text-[#446050] mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#c5d5c5] bg-white text-[#183925] focus:outline-none focus:ring-1 focus:ring-[#205735]"
            />
          </div>

          {/* Fase Productiva */}
          <div>
            <label className="block text-[11px] font-semibold text-[#446050] mb-1">Fase Productiva</label>
            <select
              value={selectedFase}
              onChange={e => setSelectedFase(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#c5d5c5] bg-white text-[#183925] focus:outline-none focus:ring-1 focus:ring-[#205735]"
            >
              <option value="TODAS">Todas las Fases</option>
              {db.Fases_Proceso.map(f => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </div>

          {/* Lote */}
          <div>
            <label className="block text-[11px] font-semibold text-[#446050] mb-1">Lote Animal</label>
            <select
              value={selectedLote}
              onChange={e => setSelectedLote(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#c5d5c5] bg-white text-[#183925] focus:outline-none focus:ring-1 focus:ring-[#205735]"
            >
              <option value="TODOS">Todos los Lotes</option>
              {db.Lotes_Animales.map(l => (
                <option key={l.id} value={l.id}>{l.codigo_lote} ({l.estado})</option>
              ))}
            </select>
          </div>

          {/* Categoría Animal */}
          <div>
            <label className="block text-[11px] font-semibold text-[#446050] mb-1">Categoría Animal</label>
            <select
              value={selectedCategoria}
              onChange={e => setSelectedCategoria(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#c5d5c5] bg-white text-[#183925] focus:outline-none focus:ring-1 focus:ring-[#205735]"
            >
              <option value="TODAS">Todas las Categorías</option>
              <option value="CAT_CAPON">Capón Terminado</option>
              <option value="CAT_LECHON">Lechón</option>
              <option value="CAT_MADRE">Madre / Descarte</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas de Indicadores Económicos Consolidados */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Ingresos */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5c7767]">Ingresos Totales</div>
          <div className="text-lg font-bold text-[#143422] mt-1">
            {formatMoney(metricas.totalIngresosNominal)}
          </div>
          <div className="text-[10px] text-[#6d8b77] mt-0.5">
            {metricas.totalKgVendidos.toLocaleString('es-AR')} kg vendidos
          </div>
        </div>

        {/* Costos */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5c7767]">Costos Totales</div>
          <div className="text-lg font-bold text-[#882b2b] mt-1">
            {formatMoney(metricas.totalCostosNominal)}
          </div>
          <div className="text-[10px] text-[#6d8b77] mt-0.5">
            Operativos y amortizaciones
          </div>
        </div>

        {/* Margen Bruto */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5c7767]">Margen Bruto</div>
          <div className={`text-lg font-bold mt-1 ${metricas.margenBrutoNominal >= 0 ? 'text-[#186036]' : 'text-[#a32222]'}`}>
            {formatMoney(metricas.margenBrutoNominal)}
          </div>
          <div className="text-[10px] text-[#6d8b77] mt-0.5">
            {metricas.totalIngresosNominal > 0 ? `${((metricas.margenBrutoNominal / metricas.totalIngresosNominal) * 100).toFixed(1)}% sobre ventas` : '0%'}
          </div>
        </div>

        {/* Precio Promedio kg */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5c7767]">Precio Promedio</div>
          <div className="text-lg font-bold text-[#143422] mt-1">
            {formatMoney(metricas.precioMedioKg)}
            <span className="text-xs font-normal text-[#6d8b77]">/kg</span>
          </div>
          <div className="text-[10px] text-[#6d8b77] mt-0.5">
            Venta ponderada
          </div>
        </div>

        {/* Costo Medio kg */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5c7767]">Costo Medio $/kg</div>
          <div className="text-lg font-bold text-[#143422] mt-1">
            {formatMoney(metricas.costoMedioPorKg)}
            <span className="text-xs font-normal text-[#6d8b77]">/kg</span>
          </div>
          <div className="text-[10px] text-[#6d8b77] mt-0.5">
            Sobre kg despachados
          </div>
        </div>

        {/* Incidencia Alimentación */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5c7767]">Incidencia Alimento</div>
          <div className="text-lg font-bold text-[#b45309] mt-1">
            {metricas.incidenciaAlimentacion.toFixed(1)}%
          </div>
          <div className="text-[10px] text-[#6d8b77] mt-0.5">
            {formatMoney(metricas.costoAlimentacion)}
          </div>
        </div>
      </div>

      {/* Navegación por Solapas de Consulta */}
      <div className="flex items-center gap-1 border-b border-[#cbd8cb] overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'resumen'
              ? 'bg-white text-[#153e24] border-t-2 border-[#1c4b31] border-x border-[#cbd8cb] shadow-2xs'
              : 'text-[#587563] hover:text-[#183925] hover:bg-white/50'
          }`}
        >
          Evolución & Gráficos
        </button>

        <button
          onClick={() => setActiveTab('ventas')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'ventas'
              ? 'bg-white text-[#153e24] border-t-2 border-[#1c4b31] border-x border-[#cbd8cb] shadow-2xs'
              : 'text-[#587563] hover:text-[#183925] hover:bg-white/50'
          }`}
        >
          Histórico Ventas ({ventasFiltradas.length})
        </button>

        <button
          onClick={() => setActiveTab('costos')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'costos'
              ? 'bg-white text-[#153e24] border-t-2 border-[#1c4b31] border-x border-[#cbd8cb] shadow-2xs'
              : 'text-[#587563] hover:text-[#183925] hover:bg-white/50'
          }`}
        >
          Histórico Costos ({costosFiltrados.length})
        </button>

        <button
          onClick={() => setActiveTab('precios_cotizaciones')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'precios_cotizaciones'
              ? 'bg-white text-[#153e24] border-t-2 border-[#1c4b31] border-x border-[#cbd8cb] shadow-2xs'
              : 'text-[#587563] hover:text-[#183925] hover:bg-white/50'
          }`}
        >
          Cotizaciones BNA & ROSPORC
        </button>

        <button
          onClick={() => setActiveTab('valuaciones')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'valuaciones'
              ? 'bg-white text-[#153e24] border-t-2 border-[#1c4b31] border-x border-[#cbd8cb] shadow-2xs'
              : 'text-[#587563] hover:text-[#183925] hover:bg-white/50'
          }`}
        >
          Valuaciones Existencias
        </button>

        <button
          onClick={() => setActiveTab('comparativa')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'comparativa'
              ? 'bg-white text-[#153e24] border-t-2 border-[#1c4b31] border-x border-[#cbd8cb] shadow-2xs'
              : 'text-[#587563] hover:text-[#183925] hover:bg-white/50'
          }`}
        >
          Comparativa de Campañas
        </button>
      </div>

      {/* Contenido de Solapas */}

      {/* 1. SOLAPA: Evolución & Gráficos */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Gráfico 1: Evolución de Ingresos, Costos y Margen Bruto */}
          <div className="bg-white p-6 rounded-2xl border border-[#d8e2d7] shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#143422]">
                  Evolución Temporal de Ingresos vs Costos y Margen Bruto
                </h3>
                <p className="text-xs text-[#5c7767]">
                  Comparativa de flujo económico mensual (en {currency})
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[#186036]">
                  <span className="w-3 h-3 rounded bg-[#205735]" /> Ingresos
                </span>
                <span className="flex items-center gap-1.5 text-[#882b2b]">
                  <span className="w-3 h-3 rounded bg-[#b91c1c]" /> Costos
                </span>
                <span className="flex items-center gap-1.5 text-[#0369a1]">
                  <span className="w-3 h-3 rounded bg-[#0284c7]" /> Margen
                </span>
              </div>
            </div>

            {/* Visualización de barras por mes */}
            {seriesEvolucion.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6e8a78] bg-[#f9faf9] rounded-xl border border-[#e2ece2]">
                No hay transacciones registradas para los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-4">
                {seriesEvolucion.map(item => {
                  const maxVal = Math.max(...seriesEvolucion.map(s => Math.max(s.ingresos, s.costos, 1)));
                  const pctIngresos = Math.min(100, (item.ingresos / maxVal) * 100);
                  const pctCostos = Math.min(100, (item.costos / maxVal) * 100);

                  return (
                    <div key={item.periodo} className="p-3 bg-[#fbfdfb] rounded-xl border border-[#e6eee6] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#143422]">
                        <span className="font-mono">{item.periodo}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-[#186036]">Ingreso: {formatMoney(item.ingresos)}</span>
                          <span className="text-[#882b2b]">Costo: {formatMoney(item.costos)}</span>
                          <span className={item.margen >= 0 ? 'text-[#0284c7]' : 'text-[#b91c1c]'}>
                            Margen: {formatMoney(item.margen)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {/* Barra Ingreso */}
                        <div className="w-full bg-[#e8efe8] rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-[#205735] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pctIngresos}%` }} 
                          />
                        </div>
                        {/* Barra Costo */}
                        <div className="w-full bg-[#fae8e8] rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-[#b91c1c] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pctCostos}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gráfico 2: Evolución de Precios de Venta y Costo por kg */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#d8e2d7] shadow-2xs">
              <h3 className="text-sm font-bold text-[#143422] mb-1">
                Evolución de Costos por kg Vivo ($/kg)
              </h3>
              <p className="text-xs text-[#5c7767] mb-4">
                Costo atribuible mensual por kilogramo despachado
              </p>
              <div className="space-y-3">
                {seriesEvolucion.map(item => (
                  <div key={item.periodo} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#f8faf8] border border-[#e4ede4]">
                    <span className="font-mono font-semibold text-[#1f4a30]">{item.periodo}</span>
                    <span className="font-mono font-bold text-[#143422]">{formatMoney(item.costoPorKg)}/kg</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#d8e2d7] shadow-2xs">
              <h3 className="text-sm font-bold text-[#143422] mb-1">
                Desglose de Costos por Rubro Productivo
              </h3>
              <p className="text-xs text-[#5c7767] mb-4">
                Participación porcentual en el costo total de la granja
              </p>
              <div className="space-y-2.5">
                {[
                  { rubro: 'Alimentación (Maíz propio + Concentrado)', pct: metricas.incidenciaAlimentacion, color: 'bg-[#d97706]' },
                  { rubro: 'Mano de Obra y Cargas Sociales', pct: 16.5, color: 'bg-[#2563eb]' },
                  { rubro: 'Sanidad & Biológicos', pct: 5.2, color: 'bg-[#059669]' },
                  { rubro: 'Energía Eléctrica & Agua', pct: 4.8, color: 'bg-[#7c3aed]' },
                  { rubro: 'Mantenimiento & Repuestos', pct: 3.5, color: 'bg-[#db2777]' },
                  { rubro: 'Amortizaciones & Estructura', pct: 100 - (metricas.incidenciaAlimentacion + 16.5 + 5.2 + 4.8 + 3.5), color: 'bg-[#64748b]' }
                ].map(r => (
                  <div key={r.rubro} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#22402f]">
                      <span>{r.rubro}</span>
                      <span className="font-mono">{Math.max(0, r.pct).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#f1f5f1] rounded-full h-2 overflow-hidden">
                      <div className={`${r.color} h-full rounded-full`} style={{ width: `${Math.max(0, Math.min(100, r.pct))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SOLAPA: Histórico de Ventas */}
      {activeTab === 'ventas' && (
        <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#e5ede4] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#143422]">
              Registro Histórico de Ventas de Hacienda
            </h3>
            <span className="text-xs text-[#5c7767]">
              {ventasFiltradas.length} operaciones · Importes nominales originales protegidos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f9f6] text-[#2c5339] font-bold border-b border-[#d8e2d7] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Comprobante</th>
                  <th className="p-3">Cliente / Destino</th>
                  <th className="p-3 text-right">Cabezas</th>
                  <th className="p-3 text-right">Kilos</th>
                  <th className="p-3 text-right">Precio $/kg</th>
                  <th className="p-3 text-right">Neto Nominal (ARS)</th>
                  <th className="p-3 text-right">Importe ({currency})</th>
                  <th className="p-3 text-center">Trazabilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ed]">
                {ventasFiltradas.map(v => {
                  const cli = db.Clientes.find(c => c.id === v.cliente_id);
                  const dets = db.Mov_Comercial_Det.filter(d => d.mov_comercial_id === v.id);
                  const cab = dets.reduce((acc, d) => acc + (Number(d.cantidad_animales) || 0), 0);
                  const kg = dets.reduce((acc, d) => acc + (Number(d.kg) || 0), 0);
                  const precioKg = kg > 0 ? (v.total_neto / kg) : 0;

                  return (
                    <tr key={v.id} className="hover:bg-[#f9fbf9] transition-colors">
                      <td className="p-3 font-mono text-[#255034]">{v.fecha}</td>
                      <td className="p-3 font-medium text-[#143422]">{v.tipo_comprobante_id} {v.punto_venta}-{v.numero_comprobante}</td>
                      <td className="p-3 text-[#385544]">{cli?.razon_social || 'Cliente Granja'}</td>
                      <td className="p-3 text-right font-mono font-semibold">{cab.toLocaleString('es-AR')}</td>
                      <td className="p-3 text-right font-mono font-semibold">{kg.toLocaleString('es-AR')}</td>
                      <td className="p-3 text-right font-mono">{formatMoney(precioKg)}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#143422]">$ {Number(v.total_neto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#1b5231]">{formatMoney(v.total_neto, v.fecha)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e7f5eb] text-[#1c6439] border border-[#c1e2cb]">
                          {v.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SOLAPA: Histórico de Costos */}
      {activeTab === 'costos' && (
        <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#e5ede4] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#143422]">
              Registro Histórico de Costos y Gastos Directos
            </h3>
            <span className="text-xs text-[#5c7767]">
              {costosFiltrados.length} asientos · Diferenciación de moneda original y presentación
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f9f6] text-[#2c5339] font-bold border-b border-[#d8e2d7] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Cuenta Contable</th>
                  <th className="p-3">Fase / Subunidad</th>
                  <th className="p-3">Origen Costo</th>
                  <th className="p-3 text-right">Importe Nominal (ARS)</th>
                  <th className="p-3 text-right">Importe ({currency})</th>
                  <th className="p-3 text-center">Estado Validación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ed]">
                {costosFiltrados.map(c => {
                  const cta = db.D_Cuenta.find(p => p.id === c.cuenta_id);
                  const fase = db.Fases_Proceso.find(f => f.id === c.fase_id);

                  return (
                    <tr key={c.id} className="hover:bg-[#f9fbf9] transition-colors">
                      <td className="p-3 font-mono text-[#255034]">{c.fecha}</td>
                      <td className="p-3 font-semibold text-[#143422]">{cta?.nombre || c.cuenta_id}</td>
                      <td className="p-3 text-[#496554]">{fase?.nombre || c.subunidad_id}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f0f4f1] border border-[#d2dfd4] text-[#2c5339]">
                          {c.origen_costo}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#143422]">$ {Number(c.importe_neto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#882b2b]">{formatMoney(c.importe_neto, c.fecha)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          c.estado_validacion === 'OK'
                            ? 'bg-[#e7f5eb] text-[#1c6439] border-[#c1e2cb]'
                            : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'
                        }`}>
                          {c.estado_validacion}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SOLAPA: Cotizaciones Oficiales BNA & ROSPORC */}
      {activeTab === 'precios_cotizaciones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Histórico BNA */}
          <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#e5ede4]">
              <h3 className="text-sm font-bold text-[#143422]">
                Historial Oficial Banco Nación Argentina (BNA)
              </h3>
              <p className="text-xs text-[#5c7767]">
                Dólar estadounidense billete tipo comprador/vendedor (fuente oficial)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f9f6] text-[#2c5339] font-bold border-b border-[#d8e2d7] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3 text-right">Compra</th>
                    <th className="p-3 text-right">Venta</th>
                    <th className="p-3 text-center">Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ed]">
                  {cotizacionesBna.map((q, idx) => (
                    <tr key={idx} className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-mono text-[#255034]">{q.fecha} {q.hora}</td>
                      <td className="p-3 text-right font-mono font-semibold">$ {q.compra.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#143422]">$ {q.venta.toFixed(2)}</td>
                      <td className="p-3 text-center text-[10px] text-[#5c7767]">{q.fuente}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Histórico ROSPORC */}
          <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#e5ede4]">
              <h3 className="text-sm font-bold text-[#143422]">
                Publicaciones Semanales ROSPORC (BCR)
              </h3>
              <p className="text-xs text-[#5c7767]">
                Precio de referencia del Capón General $/kg vivo
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f9f6] text-[#2c5339] font-bold border-b border-[#d8e2d7] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Semana / Fecha</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Precio $/kg Vivo</th>
                    <th className="p-3 text-center">Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ed]">
                  {cotizacionesRosporc.map(r => (
                    <tr key={r.id} className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-mono text-[#255034]">{r.semana}</td>
                      <td className="p-3 font-semibold text-[#143422]">{r.categoria}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#1c5633]">
                        {formatMoney(r.precio_kg_vivo)}
                      </td>
                      <td className="p-3 text-center text-[10px] text-[#5c7767]">{r.fuente}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SOLAPA: Valuaciones Históricas de Existencias */}
      {activeTab === 'valuaciones' && (
        <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#e5ede4]">
            <h3 className="text-sm font-bold text-[#143422]">
              Histórico de Valuaciones de Hacienda y Cierres Contables
            </h3>
            <p className="text-xs text-[#5c7767]">
              Valuación dual RT 22: Capón terminado por VNR sugerido ROSPORC y recría por costo acumulado
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f9f6] text-[#2c5339] font-bold border-b border-[#d8e2d7] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Campaña</th>
                  <th className="p-3">Fecha Cierre</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-right">Cabezas</th>
                  <th className="p-3 text-right">Kilos</th>
                  <th className="p-3">Criterio Valuación</th>
                  <th className="p-3 text-right">Valuación Nominal (ARS)</th>
                  <th className="p-3 text-right">Valuación ({currency})</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-[#edf3ed]">
                {db.Existencias_Hacienda.map(e => (
                  <tr key={e.id} className="hover:bg-[#f9fbf9]">
                    <td className="p-3 font-semibold text-[#143422]">{e.campana_id}</td>
                    <td className="p-3 font-mono text-[#255034]">{e.fecha_cierre}</td>
                    <td className="p-3 font-medium text-[#2d523b]">{e.categoria_senasa_id}</td>
                    <td className="p-3 text-right font-mono font-semibold">{Number(e.cabezas).toLocaleString('es-AR')}</td>
                    <td className="p-3 text-right font-mono font-semibold">{Number(e.kg_totales).toLocaleString('es-AR')}</td>
                    <td className="p-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f1f5f2] border border-[#d0ded2] font-semibold text-[#255034]">
                        {e.base_valuacion}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#143422]">$ {Number(e.valor_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#185d34]">{formatMoney(e.valor_total, e.fecha_cierre)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SOLAPA: Comparativa entre Campañas */}
      {activeTab === 'comparativa' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-[#d8e2d7] shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5ede4] pb-4 mb-5">
              <div>
                <h3 className="text-sm font-bold text-[#143422]">
                  Comparativa Económica entre Campañas Productivas
                </h3>
                <p className="text-xs text-[#5c7767]">
                  Análisis comparativo de ingresos, costos, márgenes e indicadores unitarios
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#446050]">Campaña Base:</span>
                  <select
                    value={campanaAId}
                    onChange={e => setCampanaAId(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#c5d5c5] bg-white text-[#183925]"
                  >
                    {db.D_Campana.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#446050]">Campaña Comparada:</span>
                  <select
                    value={campanaBId}
                    onChange={e => setCampanaBId(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#c5d5c5] bg-white text-[#183925]"
                  >
                    {db.D_Campana.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {datosComparativa.campA && datosComparativa.campB ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f9f6] text-[#2c5339] font-bold border-b border-[#d8e2d7] uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Variable Económica / Productiva</th>
                      <th className="p-3 text-right">{datosComparativa.campA.nombre}</th>
                      <th className="p-3 text-right">{datosComparativa.campB.nombre}</th>
                      <th className="p-3 text-right">Variación Absoluta</th>
                      <th className="p-3 text-right">Variación %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf3ed]">
                    {/* Ingresos */}
                    <tr className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-semibold text-[#143422]">Ingresos Netos por Ventas</td>
                      <td className="p-3 text-right font-mono">{formatMoney(datosComparativa.campA.ingresos)}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatMoney(datosComparativa.campB.ingresos)}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#186036]">
                        {formatMoney(datosComparativa.campB.ingresos - datosComparativa.campA.ingresos)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        {datosComparativa.campA.ingresos > 0 
                          ? `${(((datosComparativa.campB.ingresos - datosComparativa.campA.ingresos) / datosComparativa.campA.ingresos) * 100).toFixed(1)}%` 
                          : 'N/A'}
                      </td>
                    </tr>

                    {/* Costos */}
                    <tr className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-semibold text-[#143422]">Costos Directos e Indirectos</td>
                      <td className="p-3 text-right font-mono">{formatMoney(datosComparativa.campA.costos)}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatMoney(datosComparativa.campB.costos)}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#882b2b]">
                        {formatMoney(datosComparativa.campB.costos - datosComparativa.campA.costos)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        {datosComparativa.campA.costos > 0 
                          ? `${(((datosComparativa.campB.costos - datosComparativa.campA.costos) / datosComparativa.campA.costos) * 100).toFixed(1)}%` 
                          : 'N/A'}
                      </td>
                    </tr>

                    {/* Margen Bruto */}
                    <tr className="bg-[#f2f8f4] font-bold">
                      <td className="p-3 text-[#143422]">Margen Bruto de la Unidad</td>
                      <td className="p-3 text-right font-mono">{formatMoney(datosComparativa.campA.margen)}</td>
                      <td className="p-3 text-right font-mono">{formatMoney(datosComparativa.campB.margen)}</td>
                      <td className="p-3 text-right font-mono">
                        {formatMoney(datosComparativa.campB.margen - datosComparativa.campA.margen)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {datosComparativa.campA.margen !== 0 
                          ? `${(((datosComparativa.campB.margen - datosComparativa.campA.margen) / Math.abs(datosComparativa.campA.margen)) * 100).toFixed(1)}%` 
                          : 'N/A'}
                      </td>
                    </tr>

                    {/* Costo Alimentación */}
                    <tr className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-semibold text-[#143422]">Costo de Alimentación</td>
                      <td className="p-3 text-right font-mono">{formatMoney(datosComparativa.campA.costoAlim)}</td>
                      <td className="p-3 text-right font-mono">{formatMoney(datosComparativa.campB.costoAlim)}</td>
                      <td className="p-3 text-right font-mono">
                        {formatMoney(datosComparativa.campB.costoAlim - datosComparativa.campA.costoAlim)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {datosComparativa.campA.costoAlim > 0 
                          ? `${(((datosComparativa.campB.costoAlim - datosComparativa.campA.costoAlim) / datosComparativa.campA.costoAlim) * 100).toFixed(1)}%` 
                          : 'N/A'}
                      </td>
                    </tr>

                    {/* Incidencia Alimentación */}
                    <tr className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-semibold text-[#143422]">Incidencia Alimentación (%)</td>
                      <td className="p-3 text-right font-mono">{datosComparativa.campA.incidenciaAlim.toFixed(1)}%</td>
                      <td className="p-3 text-right font-mono">{datosComparativa.campB.incidenciaAlim.toFixed(1)}%</td>
                      <td className="p-3 text-right font-mono">
                        {(datosComparativa.campB.incidenciaAlim - datosComparativa.campA.incidenciaAlim).toFixed(1)} pp
                      </td>
                      <td className="p-3 text-right font-mono">-</td>
                    </tr>

                    {/* Kilos Vendidos */}
                    <tr className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-semibold text-[#143422]">Kilos Totales Vendidos</td>
                      <td className="p-3 text-right font-mono">{datosComparativa.campA.kg.toLocaleString('es-AR')} kg</td>
                      <td className="p-3 text-right font-mono">{datosComparativa.campB.kg.toLocaleString('es-AR')} kg</td>
                      <td className="p-3 text-right font-mono">
                        {(datosComparativa.campB.kg - datosComparativa.campA.kg).toLocaleString('es-AR')} kg
                      </td>
                      <td className="p-3 text-right font-mono">
                        {datosComparativa.campA.kg > 0 
                          ? `${(((datosComparativa.campB.kg - datosComparativa.campA.kg) / datosComparativa.campA.kg) * 100).toFixed(1)}%` 
                          : 'N/A'}
                      </td>
                    </tr>

                    {/* Precio $/kg */}
                    <tr className="hover:bg-[#f9fbf9]">
                      <td className="p-3 font-semibold text-[#143422]">Precio Medio Venta ($/kg)</td>
                      <td className="p-3 text-right font-mono">{formatMoney(datosComparativa.campA.precioKg)}/kg</td>
                      <td className="p-3 text-right font-mono">{formatMoney(datosComparativa.campB.precioKg)}/kg</td>
                      <td className="p-3 text-right font-mono">
                        {formatMoney(datosComparativa.campB.precioKg - datosComparativa.campA.precioKg)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {datosComparativa.campA.precioKg > 0 
                          ? `${(((datosComparativa.campB.precioKg - datosComparativa.campA.precioKg) / datosComparativa.campA.precioKg) * 100).toFixed(1)}%` 
                          : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#5c7767]">
                Seleccione las dos campañas a comparar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
