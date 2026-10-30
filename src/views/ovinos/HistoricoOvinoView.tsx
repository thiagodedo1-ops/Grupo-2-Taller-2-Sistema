/**
 * @file HistoricoOvinoView.tsx
 * @description Sub-módulo: Registro Histórico de Información Económica Ovina
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Ubicado en GESTIÓN ECONÓMICA OVINA.
 * Unificación visual y estructural basada en HistoricoEconomicoView.tsx (Porcinos)
 * Presenta 6 solapas con paleta institucional Ovina (Azul #1e40af / #172554):
 * 1. Evolución & Gráficos
 * 2. Histórico Ventas
 * 3. Histórico Costos
 * 4. Cotizaciones (BNA / Referencias Mercado Ovino / Granos)
 * 5. Valuaciones de Existencias
 * 6. Comparativa (Márgenes y Ratios entre Campañas)
 */

import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Scale, 
  Wheat, 
  ShieldCheck,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  PieChart,
  BarChart3,
  ArrowUpDown,
  RefreshCw,
  Award,
  ArrowRight
} from 'lucide-react';
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { getRolePermissions } from '../../lib/permissions';
import { useCurrency } from '../../context/CurrencyContext';
import { currencyService } from '../../lib/currencyService';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onExportCsv?: (tableName: any) => void;
}

type TabType = 'resumen' | 'ventas' | 'costos' | 'precios_cotizaciones' | 'valuaciones' | 'comparativa';

export const HistoricoOvinoView: React.FC<Props> = ({
  db,
  currentUser,
  onExportCsv
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney, symbol, currency } = useCurrency();

  // Solapa activa
  const [activeTab, setActiveTab] = useState<TabType>('resumen');

  // Filtros principales
  const [fechaDesde, setFechaDesde] = useState<string>('2024-07-01');
  const [fechaHasta, setFechaHasta] = useState<string>('2026-12-31');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  // Comparativa de campañas
  const [campanaAId, setCampanaAId] = useState<string>('CAMP_2023_2024');
  const [campanaBId, setCampanaBId] = useState<string>('CAMP_2024_2025');

  // Datos base ovinos (Ventas Ovinas / Compras / Sanidad)
  const ventasOvinas = (db.Ventas_Ovinas || [
    { id: 'VTA_OV_01', fecha: '2025-04-10', dte_numero: 'DTE-SENASA-OV-001', comprador: 'Frigorífico Regional Río Cuarto', categoria: 'Corderos Pesados (28-32 kg)', cabezas: 45, kg_totales: 1350, precio_kg: 2800, gastos_comerciales: 56000, importe_neto: 3724000 },
    { id: 'VTA_OV_02', fecha: '2025-03-15', dte_numero: 'DTE-SENASA-OV-002', comprador: 'Carnicería La Aguada', categoria: 'Borregos Terminados', cabezas: 20, kg_totales: 880, precio_kg: 2650, gastos_comerciales: 32000, importe_neto: 2300000 },
    { id: 'VTA_OV_03', fecha: '2025-02-01', dte_numero: 'DTE-SENASA-OV-003', comprador: 'Productor Local', categoria: 'Ovejas Descarte', cabezas: 15, kg_totales: 750, precio_kg: 1800, gastos_comerciales: 20000, importe_neto: 1330000 }
  ]);

  const costosOvinos = useMemo(() => {
    const list: Array<{ id: string; fecha: string; concepto: string; categoria: string; proveedor: string; importe: number }> = [
      { id: 'CST_OV_01', fecha: '2024-09-10', concepto: 'Biológicos y Vacunas (Clostridiosis + Triple)', categoria: 'Sanidad Majada', proveedor: 'Veterinaria Río Cuarto', importe: 450000 },
      { id: 'CST_OV_02', fecha: '2024-10-05', concepto: 'Maíz y Núcleo Proteico Pre-Parto Borregas', categoria: 'Alimentación Majada', proveedor: 'Molino Río Cuarto', importe: 1250000 },
      { id: 'CST_OV_03', fecha: '2024-11-20', concepto: 'Esquila Táctica Pre-Parto (Comparsa PROLANA)', categoria: 'Esquila y Manejo', proveedor: 'Comparsa Esquila Río Cuarto', importe: 380000 },
      { id: 'CST_OV_04', fecha: '2024-12-15', concepto: 'Carneros Reproductores Puros (Genética Dorper / Texel)', categoria: 'Genética y Reposición', proveedor: 'Cabaña Don Carlos', importe: 890000 },
      { id: 'CST_OV_05', fecha: '2025-01-10', concepto: 'Mantenimiento Boyeros Eléctricos & Aguadas Ovinas', categoria: 'Mantenimiento e Infraestructura', proveedor: 'Agroinsumos del Sur', importe: 220000 },
      { id: 'CST_OV_06', fecha: '2025-02-18', concepto: 'Guías de Tránsito DTE SENASA & Flete Hacienda Ovina', categoria: 'Comercialización y Fletes', proveedor: 'Transporte Don Pedro', importe: 180000 },
      { id: 'CST_OV_07', fecha: '2025-03-01', concepto: 'Suplementación Pre-parto Concentrado Proteico & Sal Mineral', categoria: 'Alimentación Majada', proveedor: 'Insumos Ganaderos S.A.', importe: 650000 },
      { id: 'CST_OV_08', fecha: '2025-04-05', concepto: 'Vacunación Clostridial y Desparasitador Majada Post-Parto', categoria: 'Sanidad Majada', proveedor: 'Veterinaria Sur', importe: 380000 }
    ];

    // Integrar compras comerciales del sistema si existen
    const comprasComerciales = (db.Mov_Comercial_Enc || []).filter(
      m => m.tipo_operacion === 'COMPRA' && (m.unidad_neg_id === 'UN_OVINOS' || (m.observacion_validacion && m.observacion_validacion.toLowerCase().includes('ovino')))
    );
    comprasComerciales.forEach(c => {
      list.push({
        id: c.id,
        fecha: c.fecha,
        concepto: c.observacion_validacion || 'Compra Comercial Ovina',
        categoria: 'Insumos y Suplementos Majada',
        proveedor: c.proveedor_id || 'Proveedor Directo',
        importe: Number(c.total_final) || 0
      });
    });

    const costosDirectosOvi = (db.F_Costos || []).filter(c => 
      c.estado !== 'Anulado' && (c.unidad_neg_id === 'UN_OVINOS' || (c.subunidad_id && c.subunidad_id.startsWith('OVI_')))
    );
    costosDirectosOvi.forEach(c => {
      if (!list.some(item => item.id === c.id)) {
        list.push({
          id: c.id,
          fecha: c.fecha,
          concepto: `Costo Directo Ovino (${c.cuenta_id || 'Costos'})`,
          categoria: 'Insumos y Suplementos Majada',
          proveedor: 'Imputación Directa',
          importe: Number(c.importe_neto) || 0
        });
      }
    });

    return list.filter(c => {
      if (fechaDesde && c.fecha < fechaDesde) return false;
      if (fechaHasta && c.fecha > fechaHasta) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return c.concepto.toLowerCase().includes(q) || c.categoria.toLowerCase().includes(q);
      }
      return true;
    });
  }, [db.Mov_Comercial_Enc, fechaDesde, fechaHasta, searchTerm]);

  // 1. Ventas Ovinas Filtradas
  const ventasFiltradas = useMemo(() => {
    return ventasOvinas.filter(v => {
      if (fechaDesde && v.fecha < fechaDesde) return false;
      if (fechaHasta && v.fecha > fechaHasta) return false;
      if (selectedCategoria !== 'TODAS' && !v.categoria.toLowerCase().includes(selectedCategoria.toLowerCase())) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          v.comprador.toLowerCase().includes(query) ||
          v.dte_numero.toLowerCase().includes(query) ||
          v.categoria.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [ventasOvinas, fechaDesde, fechaHasta, selectedCategoria, searchTerm]);

  // Totales Calculados
  const metricas = useMemo(() => {
    const totalIngresos = ventasFiltradas.reduce((acc, v) => acc + (v.importe_neto || 0), 0);
    const totalKg = ventasFiltradas.reduce((acc, v) => acc + (v.kg_totales || 0), 0);
    const totalCabezas = ventasFiltradas.reduce((acc, v) => acc + (v.cabezas || 0), 0);
    const precioMedioKg = totalKg > 0 ? totalIngresos / totalKg : 0;

    const totalCostos = costosOvinos.reduce((acc, c) => acc + c.importe, 0);
    const margenBruto = totalIngresos - totalCostos;
    const costoPorKg = totalKg > 0 ? totalCostos / totalKg : 0;

    return {
      totalIngresos,
      totalKg,
      totalCabezas,
      precioMedioKg,
      totalCostos,
      margenBruto,
      costoPorKg
    };
  }, [ventasFiltradas, costosOvinos]);

  // 4. Agrupación temporal para gráficos de evolución económica Ovina
  const seriesEvolucion = useMemo(() => {
    const agrupado: Record<string, { periodo: string; ingresos: number; costos: number; kg: number; margen: number; cabezas: number }> = {};

    // Meses de la campaña ovina
    const mesesBase = ['2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03', '2025-04'];
    mesesBase.forEach(m => {
      agrupado[m] = { periodo: m, ingresos: 0, costos: 0, kg: 0, margen: 0, cabezas: 0 };
    });

    ventasFiltradas.forEach(v => {
      const periodoKey = (v.fecha || '2025-01').substring(0, 7);
      if (!agrupado[periodoKey]) {
        agrupado[periodoKey] = { periodo: periodoKey, ingresos: 0, costos: 0, kg: 0, margen: 0, cabezas: 0 };
      }
      agrupado[periodoKey].ingresos += Number(v.importe_neto) || 0;
      agrupado[periodoKey].kg += Number(v.kg_totales) || 0;
      agrupado[periodoKey].cabezas += Number(v.cabezas) || 0;
    });

    costosOvinos.forEach(c => {
      const periodoKey = (c.fecha || '2025-01').substring(0, 7);
      if (!agrupado[periodoKey]) {
        agrupado[periodoKey] = { periodo: periodoKey, ingresos: 0, costos: 0, kg: 0, margen: 0, cabezas: 0 };
      }
      agrupado[periodoKey].costos += Number(c.importe) || 0;
    });

    return Object.values(agrupado)
      .filter(item => {
        if (fechaDesde && item.periodo < fechaDesde.substring(0, 7)) return false;
        if (fechaHasta && item.periodo > fechaHasta.substring(0, 7)) return false;
        return item.ingresos > 0 || item.costos > 0;
      })
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map(item => ({
        ...item,
        margen: item.ingresos - item.costos,
        costoPorKg: item.kg > 0 ? item.costos / item.kg : (metricas.costoPorKg || 0),
        precioPorKg: item.kg > 0 ? item.ingresos / item.kg : (metricas.precioMedioKg || 0)
      }));
  }, [ventasFiltradas, costosOvinos, fechaDesde, fechaHasta, metricas]);

  // 5. Desglose de Costos por Rubro Productivo Ovino
  const desgloseCostosOvinos = useMemo(() => {
    const total = metricas.totalCostos > 0 ? metricas.totalCostos : 1;

    let alimentacion = 0;
    let sanidad = 0;
    let esquila = 0;
    let genetica = 0;
    let pastoreoManoObra = 0;
    let mantenimiento = 0;
    let fletesComercial = 0;

    costosOvinos.forEach(c => {
      const cat = (c.categoria + ' ' + c.concepto).toLowerCase();
      if (cat.includes('alimento') || cat.includes('maíz') || cat.includes('suplement') || cat.includes('grano') || cat.includes('mineral')) {
        alimentacion += c.importe;
      } else if (cat.includes('sanidad') || cat.includes('veterinaria') || cat.includes('vacuna') || cat.includes('clostrid') || cat.includes('desparasit')) {
        sanidad += c.importe;
      } else if (cat.includes('esquila') || cat.includes('prolana') || cat.includes('desojado')) {
        esquila += c.importe;
      } else if (cat.includes('genética') || cat.includes('reproductor') || cat.includes('carnero') || cat.includes('texel') || cat.includes('dorper')) {
        genetica += c.importe;
      } else if (cat.includes('mantenimiento') || cat.includes('boyero') || cat.includes('alambrado') || cat.includes('aguada') || cat.includes('infraestructura')) {
        mantenimiento += c.importe;
      } else if (cat.includes('flete') || cat.includes('guía') || cat.includes('dte') || cat.includes('comercial')) {
        fletesComercial += c.importe;
      } else {
        pastoreoManoObra += c.importe;
      }
    });

    const hayCostosReales = costosOvinos.length > 0 && metricas.totalCostos > 0;

    return [
      {
        rubro: 'Alimentación & Suplementación Majada (Pre-parto & Creep Feeding)',
        pct: hayCostosReales ? (alimentacion / total) * 100 : 38.0,
        importe: hayCostosReales ? alimentacion : total * 0.38,
        color: 'bg-[#1e40af]'
      },
      {
        rubro: 'Sanidad Ovina & Biológicos (Clostridiosis, Desparasitación y Pietín)',
        pct: hayCostosReales ? (sanidad / total) * 100 : 16.5,
        importe: hayCostosReales ? sanidad : total * 0.165,
        color: 'bg-[#0284c7]'
      },
      {
        rubro: 'Esquila Táctica & Manejo PROLANA (Comparsa de Esquila)',
        pct: hayCostosReales ? (esquila / total) * 100 : 11.5,
        importe: hayCostosReales ? esquila : total * 0.115,
        color: 'bg-[#0d9488]'
      },
      {
        rubro: 'Genética & Cabaña Ovina (Carneros Reproductores Dorper/Texel)',
        pct: hayCostosReales ? (genetica / total) * 100 : 14.0,
        importe: hayCostosReales ? genetica : total * 0.14,
        color: 'bg-[#6366f1]'
      },
      {
        rubro: 'Mano de Obra & Pastoreo Ovinero (Atención de Parición)',
        pct: hayCostosReales ? (pastoreoManoObra / total) * 100 : 10.0,
        importe: hayCostosReales ? pastoreoManoObra : total * 0.10,
        color: 'bg-[#d97706]'
      },
      {
        rubro: 'Mantenimiento de Corrales, Boyeros Eléctricos & Aguadas',
        pct: hayCostosReales ? (mantenimiento / total) * 100 : 6.0,
        importe: hayCostosReales ? mantenimiento : total * 0.06,
        color: 'bg-[#64748b]'
      },
      {
        rubro: 'Fletes, Guías DTE SENASA & Comercialización Majada',
        pct: hayCostosReales ? (fletesComercial / total) * 100 : 4.0,
        importe: hayCostosReales ? fletesComercial : total * 0.04,
        color: 'bg-[#8b5cf6]'
      }
    ];
  }, [costosOvinos, metricas]);

  // Cotizaciones BNA
  const cotizacionesBna = useMemo(() => currencyService.getHistorico(), []);

  // Valuación de Existencias Ovinas
  const valuacionMajada = useMemo(() => {
    return [
      { categoria: 'Ovejas Vientre Dorper / Texel', cabezas: 220, pesoProm: 65, precioKg: 2100, totalImporte: 30030000 },
      { categoria: 'Borregas Recría', cabezas: 85, pesoProm: 45, precioKg: 2400, totalImporte: 9180000 },
      { categoria: 'Corderos Pesados Terminación', cabezas: 110, pesoProm: 30, precioKg: 2800, totalImporte: 9240000 },
      { categoria: 'Carneros Reproductores Cabaña', cabezas: 8, pesoProm: 95, precioKg: 3500, totalImporte: 2660000 }
    ];
  }, []);

  const valorTotalExistencias = useMemo(() => {
    return valuacionMajada.reduce((acc, r) => acc + r.totalImporte, 0);
  }, [valuacionMajada]);

  return (
    <div className="space-y-6 font-sans max-w-[1440px] mx-auto pb-12 animate-fade-in">
      {/* Encabezado Principal Ovino */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#c7d2fe] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e40af] text-white flex items-center justify-center font-bold shadow-xs">
            <History className="w-5 h-5 text-[#bfdbfe]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#f0f4ff] text-[#1e40af] border border-[#c7d2fe] rounded-md">
                Unidad Productiva: Ovinos
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#172554] tracking-tight mt-0.5">
              Registro Histórico de Información Económica Ovina
            </h1>
            <p className="text-xs text-[#3b82f6] mt-0.5">
              Evolución de costos, ventas de carne ovina, márgenes brutos y valuación de la majada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onExportCsv && (
            <button
              onClick={() => onExportCsv('Ventas_Ovinas')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white text-[#1e40af] border border-[#c7d2fe] hover:bg-[#f0f4ff] transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Ventas CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros Multidimensionales */}
      <div className="bg-white p-5 rounded-2xl border border-[#c7d2fe] shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#e0e7ff] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1e40af] uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#1e40af]" />
            <span>Filtros Históricos Ovinos</span>
          </div>
          <span className="text-[11px] text-[#3b82f6]">
            Establecimiento Pozo del Carril · La Aguada (UNRC)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#1e40af] mb-1">Fecha Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#93c5fd] bg-white text-[#172554]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#1e40af] mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#93c5fd] bg-white text-[#172554]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#1e40af] mb-1">Categoría Ovina</label>
            <select
              value={selectedCategoria}
              onChange={e => setSelectedCategoria(e.target.value)}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#93c5fd] bg-white text-[#172554]"
            >
              <option value="TODAS">Todas las Categorías</option>
              <option value="Cordero">Corderos Pesados</option>
              <option value="Borrego">Borregos</option>
              <option value="Oveja">Ovejas Descarte</option>
              <option value="Carnero">Carneros</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#1e40af] mb-1">Búsqueda Rápida</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#60a5fa] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por DTE, comprador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-[#93c5fd] bg-white text-[#172554]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de Solapas (6 Tabbed Layout) */}
      <div className="flex items-center gap-1.5 border-b border-[#c7d2fe] overflow-x-auto pb-1">
        {[
          { id: 'resumen', label: 'Evolución & Gráficos', icon: TrendingUp },
          { id: 'ventas', label: 'Histórico Ventas Carne', icon: DollarSign },
          { id: 'costos', label: 'Histórico Costos', icon: Layers },
          { id: 'precios_cotizaciones', label: 'Cotizaciones BNA & Mercado', icon: Scale },
          { id: 'valuaciones', label: 'Valuación Existencias', icon: PieChart },
          { id: 'comparativa', label: 'Comparativa Campañas', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#1e40af] text-white shadow-xs'
                  : 'bg-white text-[#1e40af] hover:bg-[#f0f4ff] border border-transparent border-b-[#c7d2fe]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EVOLUCIÓN & GRÁFICOS */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Tarjetas Superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#c7d2fe] shadow-2xs">
              <span className="text-[11px] font-bold text-[#1e40af] uppercase">Facturación Ventas Carne</span>
              <div className="text-2xl font-bold text-[#172554] font-mono mt-1">
                {formatMoney(metricas.totalIngresos)}
              </div>
              <div className="text-[11px] text-[#3b82f6] mt-0.5">{metricas.totalCabezas} ovinos comercializados</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#c7d2fe] shadow-2xs">
              <span className="text-[11px] font-bold text-[#1e40af] uppercase">Kg Vivos Vendidos</span>
              <div className="text-2xl font-bold text-[#172554] font-mono mt-1">
                {metricas.totalKg.toLocaleString('es-AR')} <span className="text-xs font-normal">kg</span>
              </div>
              <div className="text-[11px] text-[#3b82f6] mt-0.5">Precio prom: {formatMoney(metricas.precioMedioKg)}/kg</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#c7d2fe] shadow-2xs">
              <span className="text-[11px] font-bold text-[#1e40af] uppercase">Costos Directos Majada</span>
              <div className="text-2xl font-bold text-[#b91c1c] font-mono mt-1">
                {formatMoney(metricas.totalCostos)}
              </div>
              <div className="text-[11px] text-[#3b82f6] mt-0.5">Sanidad, esquila, genética y raciones</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#c7d2fe] shadow-2xs">
              <span className="text-[11px] font-bold text-[#1e40af] uppercase">Margen Bruto Ovino</span>
              <div className={`text-2xl font-bold font-mono mt-1 ${metricas.margenBruto >= 0 ? 'text-[#1c4b31]' : 'text-[#b91c1c]'}`}>
                {formatMoney(metricas.margenBruto)}
              </div>
              <div className="text-[11px] text-[#3b82f6] mt-0.5">
                {metricas.totalIngresos > 0 ? `${((metricas.margenBruto / metricas.totalIngresos) * 100).toFixed(1)}% sobre ventas` : '0%'}
              </div>
            </div>
          </div>

          {/* Gráfico 1: Evolución Temporal de Ingresos vs Costos y Margen Bruto Ovino */}
          <div className="bg-white p-6 rounded-2xl border border-[#c7d2fe] shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#172554]">
                  Evolución Temporal de Ingresos vs Costos y Margen Bruto Ovino
                </h3>
                <p className="text-xs text-[#3b82f6]">
                  Comparativa de flujo económico mensual de la majada ovina (en {currency})
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[#15803d]">
                  <span className="w-3 h-3 rounded bg-[#15803d]" /> Ingresos
                </span>
                <span className="flex items-center gap-1.5 text-[#b91c1c]">
                  <span className="w-3 h-3 rounded bg-[#b91c1c]" /> Costos
                </span>
                <span className="flex items-center gap-1.5 text-[#1e40af]">
                  <span className="w-3 h-3 rounded bg-[#1e40af]" /> Margen
                </span>
              </div>
            </div>

            {seriesEvolucion.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#3b82f6] bg-[#f0f4ff] rounded-xl border border-[#c7d2fe]">
                No hay operaciones comerciales ni costos registrados en el período seleccionado.
              </div>
            ) : (
              <div className="space-y-4">
                {seriesEvolucion.map(item => {
                  const maxVal = Math.max(...seriesEvolucion.map(s => Math.max(s.ingresos, s.costos, 1)));
                  const pctIngresos = Math.min(100, (item.ingresos / maxVal) * 100);
                  const pctCostos = Math.min(100, (item.costos / maxVal) * 100);

                  return (
                    <div key={item.periodo} className="p-3.5 bg-[#f8faff] rounded-xl border border-[#e0e7ff] space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-[#172554] gap-1">
                        <span className="font-mono text-sm text-[#1e40af]">{item.periodo}</span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-[#15803d]">Ingreso: {formatMoney(item.ingresos)}</span>
                          <span className="text-[#b91c1c]">Costo: {formatMoney(item.costos)}</span>
                          <span className={item.margen >= 0 ? 'text-[#1c4b31]' : 'text-[#b91c1c]'}>
                            Margen: {formatMoney(item.margen)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {/* Barra Ingresos */}
                        <div className="w-full bg-[#e8efe8] rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-[#15803d] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pctIngresos}%` }} 
                          />
                        </div>
                        {/* Barra Costos */}
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

          {/* Gráfico 2 & Desglose de Costos por Rubro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta 1: Evolución de Costos por kg Vivo */}
            <div className="bg-white p-6 rounded-2xl border border-[#c7d2fe] shadow-2xs">
              <h3 className="text-sm font-bold text-[#172554] mb-1">
                Evolución de Costos por kg Vivo ($/kg)
              </h3>
              <p className="text-xs text-[#3b82f6] mb-4">
                Costo directo atribuible mensual por kilogramo en pie ovino
              </p>
              <div className="space-y-3">
                {seriesEvolucion.map(item => (
                  <div key={item.periodo} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#f8faff] border border-[#e0e7ff]">
                    <span className="font-mono font-semibold text-[#1e40af]">{item.periodo}</span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#172554] block">
                        {formatMoney(item.costoPorKg)}/kg
                      </span>
                      {item.kg > 0 && (
                        <span className="text-[10px] text-[#3b82f6]">
                          {item.kg.toLocaleString('es-AR')} kg comercializados
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta 2: Desglose de Costos por Rubro Productivo Ovino */}
            <div className="bg-white p-6 rounded-2xl border border-[#c7d2fe] shadow-2xs">
              <h3 className="text-sm font-bold text-[#172554] mb-1">
                Desglose de Costos por Rubro Productivo Ovino
              </h3>
              <p className="text-xs text-[#3b82f6] mb-4">
                Participación porcentual e importe por actividad de la majada
              </p>
              <div className="space-y-3">
                {desgloseCostosOvinos.map(r => (
                  <div key={r.rubro} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold text-[#172554]">
                      <span className="truncate pr-2">{r.rubro}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold">{r.pct.toFixed(1)}%</span>
                        <span className="text-[10px] text-[#3b82f6] font-mono">({formatMoney(r.importe)})</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#f0f4ff] rounded-full h-2 overflow-hidden border border-[#c7d2fe]">
                      <div 
                        className={`${r.color} h-full rounded-full transition-all duration-500`} 
                        style={{ width: `${Math.max(0, Math.min(100, r.pct))}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de Resumen por Categoría */}
          <div className="bg-white p-5 rounded-2xl border border-[#c7d2fe] shadow-2xs">
            <h3 className="text-sm font-bold text-[#172554] mb-3">Resumen de Ventas de Carne por Categoría Ovina</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f0f4ff] text-[#1e40af] border-b border-[#c7d2fe] font-semibold">
                    <th className="p-2.5">Categoría Ovina</th>
                    <th className="p-2.5 text-right">Cabezas</th>
                    <th className="p-2.5 text-right">Kg Totales</th>
                    <th className="p-2.5 text-right">Precio $/kg</th>
                    <th className="p-2.5 text-right">Importe Neto ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e7ff]">
                  {ventasFiltradas.map(v => (
                    <tr key={v.id} className="hover:bg-[#f0f4ff]">
                      <td className="p-2.5 font-bold text-[#172554]">{v.categoria}</td>
                      <td className="p-2.5 text-right font-mono">{v.cabezas}</td>
                      <td className="p-2.5 text-right font-mono">{v.kg_totales.toLocaleString('es-AR')} kg</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-[#1e40af]">${v.precio_kg}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#172554]">${v.importe_neto.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTÓRICO VENTAS */}
      {activeTab === 'ventas' && (
        <div className="bg-white p-5 rounded-2xl border border-[#c7d2fe] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c7d2fe]">
            <div>
              <h3 className="text-sm font-bold text-[#172554]">Histórico de Ventas de Hacienda Ovina</h3>
              <p className="text-xs text-[#3b82f6]">Liquidaciones de venta de corderos, borregos y ovejas con DTE SENASA</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f0f4ff] text-[#1e40af] border-b border-[#c7d2fe] font-semibold">
                  <th className="p-2.5">Fecha</th>
                  <th className="p-2.5">DTE SENASA</th>
                  <th className="p-2.5">Comprador</th>
                  <th className="p-2.5">Categoría</th>
                  <th className="p-2.5 text-right">Cabezas</th>
                  <th className="p-2.5 text-right">Kg Vivos</th>
                  <th className="p-2.5 text-right">Precio $/kg</th>
                  <th className="p-2.5 text-right">Neto Liquidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e7ff]">
                {ventasFiltradas.map(v => (
                  <tr key={v.id} className="hover:bg-[#f0f4ff]">
                    <td className="p-2.5 font-mono text-[#3b82f6]">{v.fecha}</td>
                    <td className="p-2.5 font-mono text-[#1e40af] font-bold">{v.dte_numero}</td>
                    <td className="p-2.5 font-semibold text-[#172554]">{v.comprador}</td>
                    <td className="p-2.5 text-[#3b82f6]">{v.categoria}</td>
                    <td className="p-2.5 text-right font-mono font-bold">{v.cabezas}</td>
                    <td className="p-2.5 text-right font-mono">{v.kg_totales.toLocaleString('es-AR')} kg</td>
                    <td className="p-2.5 text-right font-mono text-[#1e40af] font-semibold">${v.precio_kg}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#172554]">${v.importe_neto.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HISTÓRICO COSTOS */}
      {activeTab === 'costos' && (
        <div className="bg-white p-5 rounded-2xl border border-[#c7d2fe] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c7d2fe]">
            <div>
              <h3 className="text-sm font-bold text-[#172554]">Histórico de Costos Directos de la Majada</h3>
              <p className="text-xs text-[#3b82f6]">Gastos en sanidad, suplementos pre-parto y servicio de esquila táctica</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f0f4ff] text-[#1e40af] border-b border-[#c7d2fe] font-semibold">
                  <th className="p-2.5">Fecha</th>
                  <th className="p-2.5">Concepto / Servicio</th>
                  <th className="p-2.5">Rubro de Costo</th>
                  <th className="p-2.5">Proveedor / Responsable</th>
                  <th className="p-2.5 text-right">Importe Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e7ff]">
                {costosOvinos.map(c => (
                  <tr key={c.id} className="hover:bg-[#f0f4ff]">
                    <td className="p-2.5 font-mono text-[#3b82f6]">{c.fecha}</td>
                    <td className="p-2.5 font-semibold text-[#172554]">{c.concepto}</td>
                    <td className="p-2.5 text-[#3b82f6]">{c.categoria}</td>
                    <td className="p-2.5 text-[#3b82f6]">{c.proveedor}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#b91c1c]">${c.importe.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COTIZACIONES BNA & MERCADO OVINO */}
      {activeTab === 'precios_cotizaciones' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-[#c7d2fe] shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#172554] border-b border-[#c7d2fe] pb-2">Precios de Referencia Ovino Carne (Mercado Liniers / Consumo)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#f0f4ff] border border-[#c7d2fe] rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-[#1e40af]">Cordero Pesado (28-32 kg)</div>
                <div className="text-xl font-bold text-[#172554] font-mono">$2.800 <span className="text-xs font-normal text-[#3b82f6]">/kg vivo</span></div>
                <div className="text-[10px] text-[#3b82f6]">Ref: Consumo Interno Río Cuarto</div>
              </div>
              <div className="p-3 bg-[#f0f4ff] border border-[#c7d2fe] rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-[#1e40af]">Borrego Invernada</div>
                <div className="text-xl font-bold text-[#172554] font-mono">$2.650 <span className="text-xs font-normal text-[#3b82f6]">/kg vivo</span></div>
                <div className="text-[10px] text-[#3b82f6]">Ref: Remates Feria Córdoba</div>
              </div>
              <div className="p-3 bg-[#f0f4ff] border border-[#c7d2fe] rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-[#1e40af]">Oveja Refuga / Descarte</div>
                <div className="text-xl font-bold text-[#172554] font-mono">$1.800 <span className="text-xs font-normal text-[#3b82f6]">/kg vivo</span></div>
                <div className="text-[10px] text-[#3b82f6]">Ref: Destino Faena Manufactura</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c7d2fe] shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-[#172554] border-b border-[#c7d2fe] pb-2">Cotizaciones Dólar BNA</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f0f4ff] text-[#1e40af] border-b border-[#c7d2fe] font-semibold">
                    <th className="p-2.5">Fecha</th>
                    <th className="p-2.5 font-mono text-xs">Tipo Cotización</th>
                    <th className="p-2.5 text-right">Precio Comprador ($)</th>
                    <th className="p-2.5 text-right">Precio Vendedor ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e7ff]">
                  {cotizacionesBna.slice(0, 5).map((c, idx) => (
                    <tr key={idx} className="hover:bg-[#f0f4ff]">
                      <td className="p-2.5 font-mono text-[#3b82f6]">{c.fecha}</td>
                      <td className="p-2.5 font-mono text-xs text-[#1e40af]">{c.tipo}</td>
                      <td className="p-2.5 text-right font-mono">${c.compra}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#1e40af]">${c.venta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VALUACIONES DE EXISTENCIAS */}
      {activeTab === 'valuaciones' && (
        <div className="bg-white p-5 rounded-2xl border border-[#c7d2fe] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c7d2fe]">
            <div>
              <h3 className="text-sm font-bold text-[#172554]">Valuación de Existencias de la Majada Ovina</h3>
              <p className="text-xs text-[#3b82f6]">Inventario ovino valorizado a precio de plaza según categorías</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-[#3b82f6]">VALUACIÓN TOTAL MAJADA</span>
              <div className="text-lg font-bold text-[#1e40af] font-mono">${valorTotalExistencias.toLocaleString('es-AR')}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f0f4ff] text-[#1e40af] border-b border-[#c7d2fe] font-semibold">
                  <th className="p-2.5">Categoría Majada</th>
                  <th className="p-2.5 text-right">Cabezas</th>
                  <th className="p-2.5 text-right">Peso Prom. (kg)</th>
                  <th className="p-2.5 text-right">Precio Mercado ($/kg)</th>
                  <th className="p-2.5 text-right">Valuación Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e7ff]">
                {valuacionMajada.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#f0f4ff]">
                    <td className="p-2.5 font-bold text-[#172554]">{row.categoria}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#1e40af]">{row.cabezas} cab</td>
                    <td className="p-2.5 text-right font-mono text-[#3b82f6]">{row.pesoProm} kg</td>
                    <td className="p-2.5 text-right font-mono font-semibold">${row.precioKg}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#172554]">${row.totalImporte.toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: COMPARATIVA DE CAMPAÑAS */}
      {activeTab === 'comparativa' && (
        <div className="bg-white p-5 rounded-2xl border border-[#c7d2fe] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#c7d2fe]">
            <div>
              <h3 className="text-sm font-bold text-[#172554]">Comparativa Interanual de Campañas Ovinas</h3>
              <p className="text-xs text-[#3b82f6]">Evolución del margen bruto y kilos de carne producidos por hectárea</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#f0f4ff] border border-[#c7d2fe] rounded-xl space-y-3">
              <span className="text-xs font-bold text-[#1e40af] block border-b border-[#c7d2fe] pb-1">
                CAMPAÑA 2023 / 2024
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#3b82f6]">Facturación Neta Carne:</span>
                  <span className="font-mono font-bold text-[#172554]">$5.200.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3b82f6]">Costos Directos Majada:</span>
                  <span className="font-mono text-[#b91c1c]">$1.100.000</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#c7d2fe]">
                  <span className="font-bold text-[#1e40af]">Margen Bruto:</span>
                  <span className="font-mono font-bold text-[#1c4b31]">$4.100.000</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f0f4ff] border border-[#c7d2fe] rounded-xl space-y-3">
              <span className="text-xs font-bold text-[#1e40af] block border-b border-[#c7d2fe] pb-1">
                CAMPAÑA 2024 / 2025 (ACTUAL)
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#3b82f6]">Facturación Neta Carne:</span>
                  <span className="font-mono font-bold text-[#172554]">${metricas.totalIngresos.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3b82f6]">Costos Directos Majada:</span>
                  <span className="font-mono text-[#b91c1c]">${metricas.totalCostos.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#c7d2fe]">
                  <span className="font-bold text-[#1e40af]">Margen Bruto:</span>
                  <span className="font-mono font-bold text-[#1c4b31]">${metricas.margenBruto.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
