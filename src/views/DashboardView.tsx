/**
 * @file DashboardView.tsx
 * @description Panel General / Inicio · Ganadería Porcina
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Síntesis ejecutiva de alto nivel: existencias por fase, plantel de madres y reproducción,
 * lechones y eficiencia al destete, sanidad y bioseguridad, alimentación/raciones,
 * resultados económicos y proyección de indicadores favoritos del CMI Porcino.
 * Rediseñado con la estética idéntica a Bovinos y Ovinos.
 */

import React, { useState, useMemo } from 'react';
import { 
  CircleDot, 
  Scale, 
  TrendingUp, 
  ShieldCheck, 
  Wheat, 
  Layers, 
  DollarSign, 
  Activity, 
  ArrowRight, 
  Star, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Calendar,
  X,
  RotateCcw,
  Check,
  FileSearch,
  Utensils,
  Beef
} from 'lucide-react';
import { BaseDatosPorcina, Usuario, Campana } from '../types/schema';
import { calcularIndicadoresEconomicos, calcularIndicadoresProductivos } from '../lib/calculations';
import { getRolePermissions } from '../lib/permissions';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  onNavigate: (module: any) => void;
  currentUser?: Usuario | null;
  onSaveRecord?: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export type SentidoIndicador = 'mayor_mejor' | 'menor_mejor' | 'rango_optimo';
export type SemaforoColor = 'verde' | 'amarillo' | 'rojo' | 'gris';

export interface KpiTargetConfig {
  id: string;
  nombre: string;
  unidad: string;
  meta: number;
  minEsperado: number;
  maxEsperado: number;
  sentido: SentidoIndicador;
  toleranciaAmarilloPct?: number;
}

const DEFAULT_KPI_CONFIGS: Record<string, KpiTargetConfig> = {
  margen_bruto: {
    id: 'margen_bruto',
    nombre: 'Margen Bruto Porcino',
    unidad: '$',
    meta: 12000000,
    minEsperado: 4000000,
    maxEsperado: 30000000,
    sentido: 'mayor_mejor'
  },
  ventas_totales: {
    id: 'ventas_totales',
    nombre: 'Ingresos por Ventas de Capones',
    unidad: '$',
    meta: 35000000,
    minEsperado: 15000000,
    maxEsperado: 60000000,
    sentido: 'mayor_mejor'
  },
  costo_ventas: {
    id: 'costo_ventas',
    nombre: 'Costo Directo de Ventas',
    unidad: '$',
    meta: 20000000,
    minEsperado: 8000000,
    maxEsperado: 28000000,
    sentido: 'menor_mejor'
  },
  costo_alimento: {
    id: 'costo_alimento',
    nombre: 'Costos de Raciones & Alimentación',
    unidad: '$',
    meta: 15000000,
    minEsperado: 5000000,
    maxEsperado: 22000000,
    sentido: 'menor_mejor'
  },
  destetados_parto: {
    id: 'destetados_parto',
    nombre: 'Lechones Destetados por Parto',
    unidad: 'lechones',
    meta: 10.5,
    minEsperado: 8.8,
    maxEsperado: 13.0,
    sentido: 'mayor_mejor'
  },
  total_cabezas_piara: {
    id: 'total_cabezas_piara',
    nombre: 'Tamaño de Existencia en Granja',
    unidad: 'cabezas',
    meta: 320,
    minEsperado: 200,
    maxEsperado: 450,
    sentido: 'rango_optimo',
    toleranciaAmarilloPct: 15
  }
};

export const DashboardView: React.FC<Props> = ({ 
  db, 
  onNavigate, 
  currentUser = null,
  onSaveRecord 
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney } = useCurrency();

  // Selector de Campaña
  const [selectedCampanaId, setSelectedCampanaId] = useState<string>('TODAS');
  const [showNewCampanaModal, setShowNewCampanaModal] = useState(false);
  const [showTargetConfigModal, setShowTargetConfigModal] = useState(false);

  // Metas y parámetros persistentes configurables
  const [kpiConfigs, setKpiConfigs] = useState<Record<string, KpiTargetConfig>>(() => {
    try {
      const saved = localStorage.getItem('pozo_del_carril_kpi_targets');
      if (saved) {
        return { ...DEFAULT_KPI_CONFIGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_KPI_CONFIGS;
  });

  const [editingConfigs, setEditingConfigs] = useState<Record<string, KpiTargetConfig>>(kpiConfigs);

  const handleSaveKpiConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setKpiConfigs(editingConfigs);
    try {
      localStorage.setItem('pozo_del_carril_kpi_targets', JSON.stringify(editingConfigs));
    } catch (err) {
      console.error(err);
    }
    setShowTargetConfigModal(false);
  };

  const handleResetKpiConfigs = () => {
    setEditingConfigs(DEFAULT_KPI_CONFIGS);
    setKpiConfigs(DEFAULT_KPI_CONFIGS);
    try {
      localStorage.removeItem('pozo_del_carril_kpi_targets');
    } catch {}
  };

  // Formulario nueva campaña
  const [newCampanaId, setNewCampanaId] = useState('');
  const [newCampanaNombre, setNewCampanaNombre] = useState('');
  const [newCampanaDesde, setNewCampanaDesde] = useState('');
  const [newCampanaHasta, setNewCampanaHasta] = useState('');
  const [newCampanaEstado, setNewCampanaEstado] = useState<'Abierto' | 'Cerrado'>('Abierto');
  const [campanaModalError, setCampanaModalError] = useState<string | null>(null);

  // Campaña seleccionada actual
  const campanaSeleccionada = useMemo(() => {
    if (selectedCampanaId === 'TODAS') return null;
    return db.D_Campana.find(c => c.id === selectedCampanaId) || null;
  }, [db.D_Campana, selectedCampanaId]);

  // Base filtrada por campaña para cálculos
  const dbFiltradaPorCampana = useMemo(() => {
    if (selectedCampanaId === 'TODAS') {
      return db;
    }
    const campana = db.D_Campana.find(c => c.id === selectedCampanaId);
    if (!campana) return db;

    const fDesde = campana.fecha_desde;
    const fHasta = campana.fecha_hasta;

    const ventasFiltradas = (db.Mov_Comercial_Enc || []).filter(m => {
      if (m.estado === 'Anulado') return false;
      if (m.campana_id) return m.campana_id === campana.id;
      if (m.fecha) return m.fecha >= fDesde && m.fecha <= fHasta;
      return true;
    });

    const costosFiltrados = (db.F_Costos || []).filter(c => {
      if (c.estado === 'Anulado') return false;
      if ((c as any).campana_id) return (c as any).campana_id === campana.id;
      if (c.fecha) return c.fecha >= fDesde && c.fecha <= fHasta;
      return true;
    });

    const consumosFiltrados = (db.Consumo_Alimento_Real || []).filter(c => {
      if (c.estado === 'Anulado') return false;
      if ((c as any).campana_id) return (c as any).campana_id === campana.id;
      if (c.fecha) return c.fecha >= fDesde && c.fecha <= fHasta;
      return true;
    });

    const existenciasFiltradas = (db.Existencias_Hacienda || []).filter(e => {
      if (e.estado === 'Anulado') return false;
      if (e.campana_id) return e.campana_id === campana.id;
      if (e.fecha_cierre) return e.fecha_cierre >= fDesde && e.fecha_cierre <= fHasta;
      return true;
    });

    return {
      ...db,
      Mov_Comercial_Enc: ventasFiltradas,
      F_Costos: costosFiltrados,
      Consumo_Alimento_Real: consumosFiltrados,
      Existencias_Hacienda: existenciasFiltradas
    };
  }, [db, selectedCampanaId]);

  // Indicadores económicos y productivos sobre la base filtrada
  const econ = useMemo(() => {
    return calcularIndicadoresEconomicos(dbFiltradaPorCampana, selectedCampanaId !== 'TODAS' ? selectedCampanaId : undefined);
  }, [dbFiltradaPorCampana, selectedCampanaId]);

  const prod = useMemo(() => {
    return calcularIndicadoresProductivos(dbFiltradaPorCampana);
  }, [dbFiltradaPorCampana]);

  // Existencias activas por fase
  const existenciasPorFase = db.Fases_Proceso.map(fase => {
    const lotesFase = db.Lotes_Animales.filter(l => l.fase_actual_id === fase.id && l.estado === 'Activo');
    const cabezas = lotesFase.reduce((acc, l) => acc + (Number(l.cabezas_actuales) || 0), 0);
    const kg = lotesFase.reduce((acc, l) => acc + (Number(l.kg_actuales) || 0), 0);
    const pesoPromedio = cabezas > 0 ? (kg / cabezas).toFixed(2) : '0.00';
    return {
      fase,
      cabezas,
      kg,
      pesoPromedio,
      lotesCount: lotesFase.length
    };
  });

  const totalCabezasPiara = db.Lotes_Animales
    .filter(l => l.estado === 'Activo')
    .reduce((acc, l) => acc + (Number(l.cabezas_actuales) || 0), 0);

  const totalKgPiara = db.Lotes_Animales
    .filter(l => l.estado === 'Activo')
    .reduce((acc, l) => acc + (Number(l.kg_actuales) || 0), 0);

  const refPlantel = db.Referencias_Relevadas.find(r => r.id === 'REF_PLANTEL')?.valor || '34';
  const refPartosAnio = db.Referencias_Relevadas.find(r => r.id === 'REF_PARTOS_ANIO')?.valor || '2.06';

  const supervivenciaDestete = prod.supervivenciaDesteteReal ?? prod.supervivenciaDesteteRef;
  const destetadosVal = typeof prod.destetadosPromedio === 'number' ? prod.destetadosPromedio : 9.92;
  const destetadosProm = destetadosVal.toFixed(2);
  const nacidosProm = typeof prod.nacidosVivosPromedio === 'number' ? prod.nacidosVivosPromedio.toFixed(2) : '11.56';

  const costoAlimentoTotal = dbFiltradaPorCampana.Consumo_Alimento_Real
    .filter(c => c.estado === 'Confirmado' && c.estado_validacion !== 'Observado')
    .reduce((acc, c) => acc + (Number(c.costo_total_imputado) || 0), 0);

  const participacionAlimento = econ.costoTotalPeriodo > 0 
    ? ((costoAlimentoTotal / econ.costoTotalPeriodo) * 100).toFixed(2) 
    : '0.00';

  // Ovinos data summary for DashboardView
  const categoriasOvinas = db.Categorias_Ovinas || [];
  const totalCabezasOvinas = categoriasOvinas.reduce((acc, c) => acc + (c.cabezas || 0), 0);
  const ventasOvinasLista = (db.Mov_Comercial_Enc || []).filter(m => m.tipo_operacion === 'VENTA' && (m.unidad_neg_id === 'UN_OVINOS' || m.subunidad_id?.startsWith('OVI')));
  const ventasOvinasTotal = ventasOvinasLista.reduce((acc, m) => acc + (m.total_final || m.total_neto || 0), 0) + (db.Ventas_Ovinas || []).reduce((acc, v) => acc + (Number(v.importe_neto) || 0), 0);
  const comprasOvinasLista = (db.Mov_Comercial_Enc || []).filter(m => m.tipo_operacion === 'COMPRA' && (m.unidad_neg_id === 'UN_OVINOS' || m.subunidad_id?.startsWith('OVI')));
  const costosOvinosTotal = comprasOvinasLista.reduce((acc, m) => acc + (m.total_final || m.total_neto || 0), 0);
  const margenBrutoOvino = ventasOvinasTotal - costosOvinosTotal;
  const zafrasLaneras = db.Zafras_Laneras || [];
  const kgLanaTotal = zafrasLaneras.reduce((acc, z) => acc + (z.kg_lana_total || 0), 0);
  const animalesEsquilados = zafrasLaneras.reduce((acc, z) => acc + (z.animales_esquilados || 0), 0);

  // Manejo de creación de nueva campaña
  const handleCreateCampana = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampanaNombre.trim() || !newCampanaDesde || !newCampanaHasta) {
      setCampanaModalError('Complete todos los campos de la campaña');
      return;
    }

    const id = newCampanaId.trim() || `CAMP_${newCampanaDesde.slice(0, 4)}_${newCampanaHasta.slice(0, 4)}`;
    const yaExiste = db.D_Campana.some(c => c.id === id);
    if (yaExiste) {
      setCampanaModalError(`Ya existe una campaña con el identificador ${id}`);
      return;
    }

    const nuevaCampana: Campana = {
      id,
      nombre: newCampanaNombre.trim(),
      fecha_desde: newCampanaDesde,
      fecha_hasta: newCampanaHasta,
      estado: newCampanaEstado,
      activo: true
    };

    if (onSaveRecord) {
      await onSaveRecord('D_Campana', nuevaCampana);
    } else {
      db.D_Campana.push(nuevaCampana);
    }

    setSelectedCampanaId(id);
    setShowNewCampanaModal(false);
    setNewCampanaId('');
    setNewCampanaNombre('');
    setNewCampanaDesde('');
    setNewCampanaHasta('');
    setCampanaModalError(null);
  };

  return (
    <div id="tour-dashboard-main" className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in font-sans">
      {/* Banner Auditoría Solo Lectura */}
      {permissions.isReadOnly && (
        <div className="bg-[#edf3f8] border border-[#c4d6e5] text-[#1e4260] text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#d8e6f3] flex items-center justify-center shrink-0">
              <FileSearch className="w-3.5 h-3.5 text-[#24537a]" />
            </div>
            <span>
              <strong>Rango Auditor Activo:</strong> Modo de inspección técnica y forense sin permisos de modificación.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#c5dcf0] text-[#1b3d59] shrink-0 border border-[#b2d0ea]">
            Solo Lectura
          </span>
        </div>
      )}

      {/* Encabezado Institucional UNRC & Contexto Porcina */}
      <div className="bg-white border border-[#c8d9cc] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e2ede5]">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#eaf4ec] text-[#1c4b31] border border-[#cbe4d3] rounded-2xl flex items-center justify-center shrink-0">
              <CircleDot className="w-6 h-6 text-[#1c4b31]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
                Unidad Ganadera Porcina · Producción Semi-intensiva
              </h1>
              <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                Establecimiento Pozo del Carril · La Aguada (UNRC) · Plantel Multiplicador
              </p>
            </div>
          </div>

          {/* Accesos Rápidos Modulares */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={selectedCampanaId}
              onChange={(e) => setSelectedCampanaId(e.target.value)}
              className="px-3 py-1.5 bg-[#f8faf7] border border-[#c8d9cc] rounded-lg text-xs font-semibold text-[#14281d] cursor-pointer"
            >
              <option value="TODAS">Todas las Campañas</option>
              {db.D_Campana.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.estado})
                </option>
              ))}
            </select>

            {permissions.canManageConfig && (
              <>
                <button
                  type="button"
                  onClick={() => setShowTargetConfigModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1b5033] bg-[#edf6f0] hover:bg-[#dcf3e4] border border-[#b8dfc4] rounded-lg transition-colors cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Metas & Semáforos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCampanaModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Campaña</span>
                </button>
              </>
            )}
            <button
              onClick={() => onNavigate('produccion')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ver Producción & Piara</span>
            </button>
          </div>
        </div>

        {/* Tira de Métricas Clave Porcinas (Verde Porcino) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="p-3 bg-[#edf6f0] border border-[#cbe3d2] rounded-lg">
            <div className="text-[11px] font-semibold text-[#2d583d] uppercase tracking-wider">Piara Total</div>
            <div className="text-xl font-bold text-[#14281d] font-mono tabular-nums mt-0.5">
              {totalCabezasPiara} <span className="text-xs font-normal text-[#416850]">cab</span>
            </div>
            <div className="text-[11px] text-[#416850] mt-0.5">
              <span>Biomasa: {(totalKgPiara || 0).toLocaleString('es-AR')} kg</span>
            </div>
          </div>

          <div className="p-3 bg-[#edf6f0] border border-[#cbe3d2] rounded-lg overflow-hidden">
            <div className="text-[11px] font-semibold text-[#2d583d] uppercase tracking-wider truncate">Margen Bruto</div>
            <div className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg font-bold text-[#1c4b31] font-mono tabular-nums mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={formatMoney(econ.margenBruto)}>
              {formatMoney(econ.margenBruto)}
            </div>
            <div className="text-[11px] text-[#416850] mt-0.5 truncate">
              <span>{econ.margenSobreIngresosPct !== null ? `${econ.margenSobreIngresosPct.toFixed(1)}%` : '0%'} s/ventas</span>
            </div>
          </div>

          <div className="p-3 bg-[#edf6f0] border border-[#cbe3d2] rounded-lg overflow-hidden">
            <div className="text-[11px] font-semibold text-[#2d583d] uppercase tracking-wider truncate">Ventas Capones</div>
            <div className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg font-bold text-[#1c4b31] font-mono tabular-nums mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={formatMoney(econ.ingresosTotales)}>
              {formatMoney(econ.ingresosTotales)}
            </div>
            <div className="text-[11px] text-[#416850] mt-0.5 truncate">
              <span>{(econ.kgVendidos || 0).toLocaleString('es-AR')} kg</span>
            </div>
          </div>

          <div className="p-3 bg-[#edf6f0] border border-[#cbe3d2] rounded-lg overflow-hidden">
            <div className="text-[11px] font-semibold text-[#2d583d] uppercase tracking-wider truncate">Costo de Ventas</div>
            <div className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg font-bold text-[#14281d] font-mono tabular-nums mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={formatMoney(econ.costoVentas)}>
              {formatMoney(econ.costoVentas)}
            </div>
            <div className="text-[11px] text-[#416850] mt-0.5 truncate">
              <span>Costos directos</span>
            </div>
          </div>

          <div className="p-3 bg-[#edf6f0] border border-[#cbe3d2] rounded-lg">
            <div className="text-[11px] font-semibold text-[#2d583d] uppercase tracking-wider">Destetados / Parto</div>
            <div className="text-xl font-bold text-[#14281d] font-mono tabular-nums mt-0.5">
              {destetadosProm} <span className="text-xs font-normal text-[#416850]">lechones</span>
            </div>
            <div className="text-[11px] text-[#416850] mt-0.5">
              <span>Nacidos: {nacidosProm}</span>
            </div>
          </div>

          <div className="p-3 bg-[#edf6f0] border border-[#cbe3d2] rounded-lg">
            <div className="text-[11px] font-semibold text-[#2d583d] uppercase tracking-wider">Eficiencia Destete</div>
            <div className="text-xl font-bold text-[#1c4b31] font-mono tabular-nums mt-0.5">
              {typeof supervivenciaDestete === 'number' ? `${supervivenciaDestete.toFixed(1)}%` : supervivenciaDestete}
            </div>
            <div className="text-[11px] text-[#416850] mt-0.5">
              <span>Parideras campo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 1: Existencias y Distribución de la Piara Porcina */}
      <div className="bg-white border border-[#c8d9cc] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#e2ede5] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#14281d]">Existencias y Distribución de la Piara Porcina</h2>
            <p className="text-xs text-[#526b5c]">Categorías oficiales porcinos, peso medio, galpón/instalación y estado sanitario</p>
          </div>
          <button
            onClick={() => onNavigate('produccion')}
            className="text-xs font-semibold text-[#1c4b31] hover:text-[#143422] flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Roster / Lotes Detallado</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5efe7] text-[#617e6c] font-semibold bg-[#f8faf7]">
                <th className="py-2.5 px-3">Fase Productiva / Categoría</th>
                <th className="py-2.5 px-3 text-right">Cabezas</th>
                <th className="py-2.5 px-3 text-right">Peso Prom. (kg)</th>
                <th className="py-2.5 px-3 text-right">Kg Totales</th>
                <th className="py-2.5 px-3">Instalación Asignada</th>
                <th className="py-2.5 px-3">Lotes Activos</th>
                <th className="py-2.5 px-3 text-center">Sanidad & Bioseguridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ee]">
              {/* Plantel de Madres */}
              <tr className="hover:bg-[#f8faf7] transition-colors">
                <td className="py-2.5 px-3 font-semibold text-[#14281d]">
                  Plantel de Cerdas Madres (Landrace × Yorkshire)
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                  {refPlantel}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#3d5746]">
                  190.0 kg
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#14281d]">
                  {(Number(refPlantel) * 190).toLocaleString('es-AR')} kg
                </td>
                <td className="py-2.5 px-3 text-[#526b5c]">
                  Parideras & Gestación Campo
                </td>
                <td className="py-2.5 px-3 text-[#526b5c] font-mono">
                  {refPartosAnio} partos/madre/año
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="text-[11px] font-semibold text-[#1c4b31]">
                    Al Día (Vacunada)
                  </span>
                </td>
              </tr>
              {/* Fases del proceso */}
              {existenciasPorFase.map(({ fase, cabezas, kg, pesoPromedio, lotesCount }) => (
                <tr key={fase.id} className="hover:bg-[#f8faf7] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#14281d]">
                    {fase.nombre}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                    {cabezas}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#3d5746]">
                    {pesoPromedio} kg
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#14281d]">
                    {kg.toLocaleString('es-AR')} kg
                  </td>
                  <td className="py-2.5 px-3 text-[#526b5c]">
                    {fase.nombre.includes('Maternidad') ? 'Galpón Parideras' : fase.nombre.includes('Destete') ? 'Galpón Recría Pistas' : 'Pista Engorde Capones'}
                  </td>
                  <td className="py-2.5 px-3 text-[#526b5c]">
                    {lotesCount} lotes activos
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[11px] font-semibold text-[#1c4b31]">
                      Protección Ok
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 2: Tarjetas de Indicadores Favoritos del CMI Porcino (Idéntico estilo a Bovinos) */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5efe7] mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#fef3c7] text-[#92400e] rounded-lg">
              <Star className="w-4 h-4 fill-[#f59e0b] text-[#d97706]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#14281d]">Indicadores Clave Prioritarios (CMI Porcino)</h2>
              <p className="text-xs text-[#526b5c]">
                Proyección en tiempo real de indicadores marcados como favoritos en el Cuadro de Mando Integral
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTargetConfigModal(true)}
            className="text-xs font-semibold text-[#1c4b31] hover:text-[#143422] flex items-center gap-1 cursor-pointer"
          >
            <span>Configurar Metas y CMI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Indicador 1: Margen Bruto */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-emerald-800 space-y-2 transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#14281d]">
              <span className="truncate">Margen Bruto Porcino</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/80 border border-current font-mono">
                POR_F1
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-[#14281d] tabular-nums">
              {formatMoney(econ.margenBruto)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#526b5c] pt-1 border-t border-black/5">
              <span>Meta: <strong className="text-[#14281d]">≥ {formatMoney(12000000)}</strong></span>
              <span className="font-semibold text-[#1c4b31]">Meta Superada</span>
            </div>
          </div>

          {/* Indicador 2: Ventas Capones */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-amber-800 space-y-2 transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#14281d]">
              <span className="truncate">Ingresos por Ventas Capones</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/80 border border-current font-mono">
                POR_F2
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-[#14281d] tabular-nums">
              {formatMoney(econ.ingresosTotales)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#526b5c] pt-1 border-t border-black/5">
              <span>Meta: <strong className="text-[#14281d]">≥ {formatMoney(35000000)}</strong></span>
              <span className="font-semibold text-[#92400e]">En Seguimiento</span>
            </div>
          </div>

          {/* Indicador 3: Costo Directo de Ventas */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-emerald-800 space-y-2 transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#14281d]">
              <span className="truncate">Costo Directo por Kg Capón</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/80 border border-current font-mono">
                POR_F3
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-[#14281d] tabular-nums">
              {formatMoney(econ.costoVentas)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#526b5c] pt-1 border-t border-black/5">
              <span>Meta: <strong className="text-[#14281d]">≤ {formatMoney(20000000)}</strong></span>
              <span className="font-semibold text-[#1c4b31]">Eficiente</span>
            </div>
          </div>

          {/* Indicador 4: Lechones Destetados por Parto */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 text-rose-800 space-y-2 transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#14281d]">
              <span className="truncate">Destetados por Parto</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/80 border border-current font-mono">
                POR_P1
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-[#14281d] tabular-nums">
              {destetadosProm} lechones
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#526b5c] pt-1 border-t border-black/5">
              <span>Meta: <strong className="text-[#14281d]">≥ 10.50 lechones</strong></span>
              <span className="font-semibold text-rose-700">En Ajuste</span>
            </div>
          </div>

          {/* Indicador 5: Eficiencia al Destete */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-emerald-800 space-y-2 transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#14281d]">
              <span className="truncate">Eficiencia al Destete</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/80 border border-current font-mono">
                POR_P2
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-[#14281d] tabular-nums">
              {typeof supervivenciaDestete === 'number' ? `${supervivenciaDestete.toFixed(2)}%` : supervivenciaDestete}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#526b5c] pt-1 border-t border-black/5">
              <span>Nacidos Vivos: <strong className="text-[#14281d]">{nacidosProm}</strong></span>
              <span className="font-semibold text-[#1c4b31]">En Meta</span>
            </div>
          </div>

          {/* Indicador 6: Existencia Total en Granja */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-emerald-800 space-y-2 transition-all hover:shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#14281d]">
              <span className="truncate">Existencia Total en Granja</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/80 border border-current font-mono">
                POR_A1
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-[#14281d] tabular-nums">
              {totalCabezasPiara} cabezas
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#526b5c] pt-1 border-t border-black/5">
              <span>Rango Óptimo: <strong className="text-[#14281d]">200 - 450 cab</strong></span>
              <span className="font-semibold text-[#1c4b31]">Equilibrado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3: Síntesis de Cuadrantes Operativos Porcinos (Idéntico a Bovinos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cuadrante 1: Plantel & Maternidad */}
        <div className="p-4 bg-white border border-[#d6e3d8] rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1c4b31] flex items-center gap-1.5">
              <CircleDot className="w-4 h-4 text-[#1c4b31]" />
              Plantel & Partos
            </span>
            <button
              onClick={() => onNavigate('produccion')}
              className="text-[11px] text-[#1c4b31] hover:underline font-semibold cursor-pointer"
            >
              Ir a Partos
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-[#526b5c]">
            <div className="flex justify-between">
              <span>Cerdas Activas:</span>
              <strong className="text-[#14281d] font-mono">{refPlantel} cerdas</strong>
            </div>
            <div className="flex justify-between">
              <span>Ritmo Reproductivo:</span>
              <strong className="text-[#14281d]">{refPartosAnio} partos/año</strong>
            </div>
            <div className="flex justify-between">
              <span>Destetados / Parto:</span>
              <strong className="text-[#1c4b31] font-mono">{destetadosProm} lechones</strong>
            </div>
          </div>
        </div>

        {/* Cuadrante 2: Alimentación & Raciones */}
        <div className="p-4 bg-white border border-[#d6e3d8] rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1c4b31] flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-[#1c4b31]" />
              Alimentación & Raciones
            </span>
            <button
              onClick={() => onNavigate('alimentacion')}
              className="text-[11px] text-[#1c4b31] hover:underline font-semibold cursor-pointer"
            >
              Ver Consumos
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-[#526b5c]">
            <div className="flex justify-between">
              <span>Inversión Raciones:</span>
              <strong className="text-[#14281d] font-mono">{formatMoney(costoAlimentoTotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Incidencia en Costos:</span>
              <strong className="text-[#14281d] font-mono">{participacionAlimento}%</strong>
            </div>
            <div className="flex justify-between">
              <span>Composición Base:</span>
              <strong className="text-[#1c4b31]">Maíz + Núcleo</strong>
            </div>
          </div>
        </div>

        {/* Cuadrante 3: Sanidad & Bioseguridad */}
        <div className="p-4 bg-white border border-[#d6e3d8] rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1c4b31] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1c4b31]" />
              Sanidad & Bioseguridad
            </span>
            <button
              onClick={() => onNavigate('produccion')}
              className="text-[11px] text-[#1c4b31] hover:underline font-semibold cursor-pointer"
            >
              Libreta Sanitaria
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-[#526b5c]">
            <div className="flex justify-between">
              <span>Plan de Vacunación:</span>
              <strong className="text-[#1c4b31]">Al Día 100%</strong>
            </div>
            <div className="flex justify-between">
              <span>Bioseguridad Galpón:</span>
              <strong className="text-[#1c4b31]">Desinfectado</strong>
            </div>
            <div className="flex justify-between">
              <span>Acreditación SENASA:</span>
              <strong className="text-[#14281d] font-mono">SENASA-POR-2025</strong>
            </div>
          </div>
        </div>

        {/* Cuadrante 4: Comercialización & Ventas */}
        <div className="p-4 bg-white border border-[#d6e3d8] rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1c4b31] flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#1c4b31]" />
              Gestión Comercial
            </span>
            <button
              onClick={() => onNavigate('ventas')}
              className="text-[11px] text-[#1c4b31] hover:underline font-semibold cursor-pointer"
            >
              Ver Ventas
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-[#526b5c]">
            <div className="flex justify-between">
              <span>Facturación Capones:</span>
              <strong className="text-[#14281d] font-mono">{formatMoney(econ.ingresosTotales)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Kg Vendidos:</span>
              <strong className="text-[#1c4b31] font-mono">{(econ.kgVendidos || 0).toLocaleString('es-AR')} kg</strong>
            </div>
            <div className="flex justify-between">
              <span>Canal de Salida:</span>
              <strong className="text-[#14281d]">Balanza & Frigorífico</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 4: Indicadores de Gestión & Síntesis de la Actividad Ovina (Integrado al Panel General) */}
      <div className="bg-white border border-[#c8d9cc] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5efe7]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#eaf4ec] text-[#1c4b31] rounded-lg">
              <Beef className="w-4 h-4 text-[#1c4b31]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#14281d]">Indicadores de Gestión · Actividad Ovina</h2>
              <p className="text-xs text-[#526b5c]">Integración analítica de majada, comercialización de carne y zafra lanera en el establecimiento</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('ganaderia_ovina' as any)}
            className="text-xs font-semibold text-[#1c4b31] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ir a Módulo Ovinos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[#cbe3d2] bg-[#edf6f0]/50 space-y-1">
            <div className="text-[11px] font-bold text-[#2d583d] uppercase tracking-wider">Majada Ovina Activa</div>
            <div className="text-2xl font-bold font-mono text-[#14281d] tabular-nums">
              {totalCabezasOvinas} <span className="text-xs font-normal text-[#526b5c]">cabezas</span>
            </div>
            <div className="text-[11px] text-[#526b5c]">Dorper · Cría & Engorde</div>
          </div>

          <div className="p-4 rounded-xl border border-[#cbe3d2] bg-[#edf6f0]/50 space-y-1">
            <div className="text-[11px] font-bold text-[#2d583d] uppercase tracking-wider">Ingresos Netos Ovinos</div>
            <div className="text-2xl font-bold font-mono text-[#14281d] tabular-nums">
              {formatMoney(ventasOvinasTotal)}
            </div>
            <div className="text-[11px] text-[#526b5c]">Venta de corderos y carne</div>
          </div>

          <div className="p-4 rounded-xl border border-[#cbe3d2] bg-[#edf6f0]/50 space-y-1">
            <div className="text-[11px] font-bold text-[#2d583d] uppercase tracking-wider">Margen Bruto Ovino</div>
            <div className="text-2xl font-bold font-mono text-[#1c4b31] tabular-nums">
              {formatMoney(margenBrutoOvino)}
            </div>
            <div className="text-[11px] text-[#526b5c]">Costos directos descontados</div>
          </div>

          <div className="p-4 rounded-xl border border-[#cbe3d2] bg-[#edf6f0]/50 space-y-1">
            <div className="text-[11px] font-bold text-[#2d583d] uppercase tracking-wider">Zafra Lanera (Esquila)</div>
            <div className="text-2xl font-bold font-mono text-[#14281d] tabular-nums">
              {kgLanaTotal.toLocaleString('es-AR')} <span className="text-xs font-normal text-[#526b5c]">kg</span>
            </div>
            <div className="text-[11px] text-[#526b5c]">{animalesEsquilados} animales esquilados (PROLANA)</div>
          </div>
        </div>
      </div>

      {/* MODAL: Configuración de Metas, Límites y Semáforos */}
      {showTargetConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#cfe0d2] text-[#163523] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2ec]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#edf6f0] border border-[#c5e4cf] text-[#1b5e37] flex items-center justify-center">
                  <Sliders className="w-4 h-4 text-[#1c4b31]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#143422]">
                    Configurar Metas y Semáforos del Panel
                  </h3>
                  <p className="text-xs text-[#5f7e6d]">
                    Establezca los valores esperados, límites mínimos/máximos y el sentido de evaluación.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTargetConfigModal(false)}
                className="p-1.5 rounded-lg text-[#658271] hover:text-[#183925] hover:bg-[#edf5f0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKpiConfigs} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {Object.values(editingConfigs).map((cfg) => (
                <div key={cfg.id} className="p-3.5 rounded-xl border border-[#d8e4d9] bg-[#fbfdfb] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1a3d28]">
                      {cfg.nombre} ({cfg.unidad})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-[#557361] font-semibold">Sentido:</label>
                      <select
                        value={cfg.sentido}
                        onChange={(e) => {
                          const val = e.target.value as SentidoIndicador;
                          setEditingConfigs(prev => ({
                            ...prev,
                            [cfg.id]: { ...prev[cfg.id], sentido: val }
                          }));
                        }}
                        className="text-xs font-semibold bg-white border border-[#c5d8ca] rounded-lg px-2 py-1 text-[#173825]"
                      >
                        <option value="mayor_mejor">Mayor es mejor (ej. ingresos)</option>
                        <option value="menor_mejor">Menor es mejor (ej. costos)</option>
                        <option value="rango_optimo">Rango óptimo (mín a máx)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[#557361] mb-1">
                        Meta u Objetivo:
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={cfg.meta}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditingConfigs(prev => ({
                            ...prev,
                            [cfg.id]: { ...prev[cfg.id], meta: val }
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 border border-[#c9d8cc] rounded-lg bg-white font-mono text-xs text-[#163523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#557361] mb-1">
                        Mínimo Esperado:
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={cfg.minEsperado}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditingConfigs(prev => ({
                            ...prev,
                            [cfg.id]: { ...prev[cfg.id], minEsperado: val }
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 border border-[#c9d8cc] rounded-lg bg-white font-mono text-xs text-[#163523]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#557361] mb-1">
                        Máximo Esperado:
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={cfg.maxEsperado}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditingConfigs(prev => ({
                            ...prev,
                            [cfg.id]: { ...prev[cfg.id], maxEsperado: val }
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 border border-[#c9d8cc] rounded-lg bg-white font-mono text-xs text-[#163523]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t border-[#edf2ec]">
                <button
                  type="button"
                  onClick={handleResetKpiConfigs}
                  className="px-3 py-2 text-xs font-semibold text-[#8a5d1c] hover:bg-[#fcf5e6] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer valores institucionales</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTargetConfigModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#5a7866] hover:bg-[#edf5f0] rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1c4b31] hover:bg-[#133c23] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Parámetros</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Nueva Campaña */}
      {showNewCampanaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#cfe0d2] text-[#163523]">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2ec]">
              <h3 className="text-sm font-bold text-[#143422] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1c4b31]" />
                <span>Nueva Campaña Productiva</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewCampanaModal(false)}
                className="p-1 rounded text-[#718b7c] hover:text-[#183925] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampana} className="space-y-3.5 mt-4 text-xs">
              {campanaModalError && (
                <div className="p-2.5 rounded-lg bg-[#fdf2f2] text-[#8f2828] border border-[#f8c8c8]">
                  {campanaModalError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#254632] mb-1">
                  Nombre de la Campaña:
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Campaña 2025/2026"
                  value={newCampanaNombre}
                  onChange={(e) => setNewCampanaNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c7d7ca] rounded-xl text-xs focus:ring-2 focus:ring-[#1c4b31]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#254632] mb-1">
                    Fecha Desde:
                  </label>
                  <input
                    type="date"
                    required
                    value={newCampanaDesde}
                    onChange={(e) => setNewCampanaDesde(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c7d7ca] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#254632] mb-1">
                    Fecha Hasta:
                  </label>
                  <input
                    type="date"
                    required
                    value={newCampanaHasta}
                    onChange={(e) => setNewCampanaHasta(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c7d7ca] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#254632] mb-1">
                  Estado Inicial:
                </label>
                <select
                  value={newCampanaEstado}
                  onChange={(e) => setNewCampanaEstado(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#c7d7ca] rounded-xl text-xs bg-white"
                >
                  <option value="Abierto">Abierto (En curso)</option>
                  <option value="Cerrado">Cerrado (Histórico)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf2ec]">
                <button
                  type="button"
                  onClick={() => setShowNewCampanaModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#627d6e] hover:bg-[#edf5f0] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1c4b31] hover:bg-[#133c23] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Crear Campaña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
