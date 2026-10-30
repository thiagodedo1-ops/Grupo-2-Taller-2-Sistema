/**
 * @file DashboardView.tsx
 * @description Panel General Porcino - Pozo del Carril · La Aguada (UNRC)
 * Requerimiento 5: Selector de campaña, creación de campañas, período explícito de medición,
 * reemplazo de términos a Porcino/Porcina, retiro de etiquetas visibles "Dato real",
 * e integración completa con conversor monetario ARS/USD.
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Layers, 
  ArrowRight, 
  ShieldAlert, 
  Info, 
  Scale, 
  FileSearch, 
  Wrench, 
  Utensils,
  Calendar,
  Plus,
  X,
  Compass
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

export const DashboardView: React.FC<Props> = ({ 
  db, 
  onNavigate, 
  currentUser = null,
  onSaveRecord 
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney, symbol } = useCurrency();

  // Selector de Campaña (Requerimiento 5)
  const campanaActivaInicial = db.D_Campana.find(c => c.estado === 'Abierto')?.id || db.D_Campana[0]?.id || 'CAMP_2024_2025';
  const [selectedCampanaId, setSelectedCampanaId] = useState<string>(campanaActivaInicial);
  const [showNewCampanaModal, setShowNewCampanaModal] = useState(false);

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

    // Filtrar operaciones por campañaId o por rango de fechas de la campaña
    const fDesde = campana.fecha_desde;
    const fHasta = campana.fecha_hasta;

    const ventasFiltradas = db.Mov_Comercial_Enc.filter(m => {
      if (m.campana_id) return m.campana_id === campana.id;
      if (m.fecha) return m.fecha >= fDesde && m.fecha <= fHasta;
      return true;
    });

    const costosFiltrados = db.F_Costos.filter(c => {
      if (c.fecha) return c.fecha >= fDesde && c.fecha <= fHasta;
      return true;
    });

    const consumosFiltrados = db.Consumo_Alimento_Real.filter(c => {
      if (c.fecha) return c.fecha >= fDesde && c.fecha <= fHasta;
      return true;
    });

    const existenciasFiltradas = db.Existencias_Hacienda.filter(e => {
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

  // Indicadores económicos y productivos sobre la base filtrada por campaña
  const econ = useMemo(() => {
    return calcularIndicadoresEconomicos(dbFiltradaPorCampana, selectedCampanaId !== 'TODAS' ? selectedCampanaId : undefined);
  }, [dbFiltradaPorCampana, selectedCampanaId]);

  const prod = useMemo(() => {
    return calcularIndicadoresProductivos(dbFiltradaPorCampana);
  }, [dbFiltradaPorCampana]);

  // Alertas activas del sistema porcino
  const registrosObservados = [
    ...db.Mov_Comercial_Enc.filter(r => r.estado_validacion === 'Observado'),
    ...db.Consumo_Alimento_Real.filter(r => r.estado_validacion === 'Observado'),
    ...db.Movimientos_Fisicos.filter(r => r.estado_validacion === 'Observado')
  ];

  // Existencias activas por fase
  const existenciasPorFase = db.Fases_Proceso.map(fase => {
    const lotesFase = db.Lotes_Animales.filter(l => l.fase_actual_id === fase.id && l.estado === 'Activo');
    const cabezas = lotesFase.reduce((acc, l) => acc + (Number(l.cabezas_actuales) || 0), 0);
    const kg = lotesFase.reduce((acc, l) => acc + (Number(l.kg_actuales) || 0), 0);
    const pesoPromedio = cabezas > 0 ? (kg / cabezas).toFixed(1) : '0';
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
  const nacidosProm = typeof prod.nacidosVivosPromedio === 'number' ? prod.nacidosVivosPromedio.toFixed(2) : '11.56';
  const destetadosProm = typeof prod.destetadosPromedio === 'number' ? prod.destetadosPromedio.toFixed(2) : '9.92';

  const costoAlimentoTotal = dbFiltradaPorCampana.Consumo_Alimento_Real
    .filter(c => c.estado === 'Confirmado' && c.estado_validacion !== 'Observado')
    .reduce((acc, c) => acc + (Number(c.costo_total_imputado) || 0), 0);

  const participacionAlimento = econ.costoTotalPeriodo > 0 
    ? ((costoAlimentoTotal / econ.costoTotalPeriodo) * 100).toFixed(0) 
    : '0';

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
    <div className="space-y-6 font-sans">
      {/* Banner de Rango Activo para Auditor o Operario */}
      {permissions.isReadOnly && (
        <div className="bg-[#edf3f8] border border-[#c4d6e5] text-[#1e4260] text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#d8e6f3] flex items-center justify-center shrink-0">
              <FileSearch className="w-3.5 h-3.5 text-[#24537a]" />
            </div>
            <span>
              <strong>Rango Auditor Porcino Activo:</strong> Modo de inspección técnica y forense sin permisos de modificación.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#c5dcf0] text-[#1b3d59] shrink-0 border border-[#b2d0ea]">
            Solo Lectura
          </span>
        </div>
      )}

      {permissions.rolId === 'ROL_OPERARIO' && (
        <div className="bg-[#fef9ee] border border-[#f7e0af] text-[#7a4e14] text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#fdeecb] flex items-center justify-center shrink-0">
              <Wrench className="w-3.5 h-3.5 text-[#915a13]" />
            </div>
            <span>
              <strong>Rango Operario de Campo:</strong> Habilitado para carga de novedades en parideras, pases de fase y racionamiento. Los registros se guardan en <strong>Borrador</strong> para posterior verificación del Encargado.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#fce49d] text-[#734509] shrink-0 border border-[#ebd083]">
            Carga en Granja
          </span>
        </div>
      )}

      {/* Banner Institucional del Establecimiento Porcino con Selector de Campaña */}
      <div className="bg-white p-5 rounded-2xl border border-[#d8e2d7] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#1c4b31] border border-[#2b714b] flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
            PC
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#936435]">
                Unidad Productiva Porcina
              </span>
              <span className="text-[10px] text-[#2c613e] font-semibold bg-[#edf5ef] px-2 py-0.5 rounded border border-[#cce3d2]">
                La Aguada · FCE UNRC
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#153422] tracking-tight leading-snug">
              Panel de Control Porcino · Pozo del Carril
            </h1>
            <p className="text-xs text-[#5e7768] mt-0.5">
              Sistema de producción de ciclo completo semiintensivo (Landrace × Yorkshire) · Río Cuarto, Cba.
            </p>
          </div>
        </div>

        {/* ===================================================================
            SELECTOR DE CAMPAÑA (Requerimiento 5)
        =================================================================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 self-start md:self-center shrink-0">
          <div className="flex items-center gap-2 bg-[#f4f8f4] border border-[#c9dacc] px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-[#1c4b31] shrink-0" />
            <div className="flex flex-col">
              <label htmlFor="campana-select" className="text-[9px] uppercase font-bold text-[#557361] tracking-wider">
                Campaña Productiva:
              </label>
              <select
                id="campana-select"
                value={selectedCampanaId}
                onChange={(e) => setSelectedCampanaId(e.target.value)}
                className="text-xs font-bold text-[#153422] bg-transparent border-none outline-none cursor-pointer pr-4"
              >
                {db.D_Campana.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.nombre} {camp.estado === 'Abierto' ? '(Activa)' : '(Cerrada)'}
                  </option>
                ))}
                <option value="TODAS">Todas las Campañas (Consolidado)</option>
              </select>
            </div>
          </div>

          {permissions.canManageConfig && (
            <button
              onClick={() => setShowNewCampanaModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1c4b31] bg-[#eaf4ec] hover:bg-[#dfeee2] border border-[#b8dfc4] rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Crear o gestionar campañas productivas"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Campaña</span>
            </button>
          )}
        </div>
      </div>

      {/* Período Efectivo Explícito de Medición (Requerimiento 5) */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#edf5ef] border border-[#cfe3d4] rounded-xl text-xs text-[#224f33]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1b7a3d]" />
          <span>
            <strong>Período efectivo de medición:</strong>{' '}
            {campanaSeleccionada 
              ? `${campanaSeleccionada.nombre} (del ${campanaSeleccionada.fecha_desde} al ${campanaSeleccionada.fecha_hasta}) · Estado: ${campanaSeleccionada.estado}`
              : 'Consolidado histórico de todas las campañas registradas'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#3a684b] hidden md:inline">
          Moneda de presentación: <strong>{symbol}</strong>
        </span>
      </div>

      {/* Alerta de Registros Observados en Auditoría Porcina */}
      {registrosObservados.length > 0 && permissions.allowedModules.includes('auditoria') && (
        <div className="bg-[#fef8ee] border border-[#f6d99f] rounded-xl p-4 flex items-start justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#fae8be] border border-[#ecd08f] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4 text-[#9c6314]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#78460b] uppercase tracking-wider">
                Auditoría Porcina: {registrosObservados.length} Registros Observados
              </h4>
              <p className="text-xs text-[#8c5717] mt-0.5 leading-relaxed">
                Existen movimientos o comprobantes cargados con inconsistencias de peso o montos. Por control interno, no impactan en stock ni costos hasta ser verificados.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('auditoria')}
            className="px-3 py-1.5 text-xs font-semibold text-[#663b06] bg-[#fae6b8] hover:bg-[#f6dc9c] border border-[#ebca7a] rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          >
            Revisar Observaciones
          </button>
        </div>
      )}

      {/* Tarjetas Principales de Resultados Económicos con Conversión ARS/USD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ingresos por Ventas de Capones */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] hover:border-[#b8ccb6] transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#556e5f] mb-1">
              <span className="font-semibold">Ventas de Capones</span>
              <div className="w-6 h-6 rounded-md bg-[#edf5ef] flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-[#1b5e34]" />
              </div>
            </div>
            {permissions.canViewFinancials ? (
              <>
                <div className="text-xl font-bold text-[#143522] font-mono tabular-nums mt-1">
                  {econ.ingresosTotales > 0 ? formatMoney(econ.ingresosTotales) : 'Sin ventas'}
                </div>
                <div className="text-[11px] text-[#6b8273] mt-2 flex items-center justify-between">
                  <span>Volumen: <strong className="font-mono text-[#1a3826]">{econ.kgVendidos.toLocaleString('es-AR')} kg</strong></span>
                  <span className="text-[10px] font-mono text-[#255e39] bg-[#edf6f0] px-1.5 py-0.5 rounded border border-[#cbe3d2]">
                    Faena
                  </span>
                </div>
              </>
            ) : (
              <div className="py-2">
                <span className="text-xs font-medium text-[#7e9486] italic">Acceso restringido a Administración</span>
                <div className="text-[11px] text-[#556e5f] mt-1 font-mono">
                  Volumen vendido: <strong>{econ.kgVendidos.toLocaleString('es-AR')} kg</strong>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-[#edf2ec] text-[10px] text-[#718a7c] flex items-center justify-between">
            <span>Balanza y Frigorífico</span>
            <span className="font-mono text-[#1c4b31]">Registros Reales</span>
          </div>
        </div>

        {/* 2. Costo de Ventas */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] hover:border-[#b8ccb6] transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#556e5f] mb-1">
              <span className="font-semibold">Costo de Ventas (EI + CD − EF)</span>
              <div className="w-6 h-6 rounded-md bg-[#fdf6ec] flex items-center justify-center">
                <Scale className="w-3.5 h-3.5 text-[#8c5717]" />
              </div>
            </div>
            {permissions.canViewFinancials ? (
              <>
                <div className="text-xl font-bold text-[#143522] font-mono tabular-nums mt-1">
                  {formatMoney(econ.costoVentas)}
                </div>
                <div className="text-[11px] text-[#6b8273] mt-2 flex items-center justify-between">
                  <span>
                    {econ.costoSobreIngresosPct !== null 
                      ? `${econ.costoSobreIngresosPct.toFixed(1)}% s/ ingresos`
                      : 'Pendiente de ventas'}
                  </span>
                  <span className="text-[10px] text-[#7e9486] font-mono">Costo acumulado</span>
                </div>
              </>
            ) : (
              <div className="py-2">
                <span className="text-xs font-medium text-[#7e9486] italic">Acceso restringido a Administración</span>
                <div className="text-[11px] text-[#556e5f] mt-1">Valuación dual de hacienda</div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-[#edf2ec] text-[10px] text-[#718a7c] flex items-center justify-between">
            <span>Método Costo Directo</span>
            <span className="font-mono text-[#8c5717]">Biomasa Ponderada</span>
          </div>
        </div>

        {/* 3. Margen Bruto Operativo */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] hover:border-[#b8ccb6] transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#556e5f] mb-1">
              <span className="font-semibold">Margen Bruto de Piara</span>
              <div className="w-6 h-6 rounded-md bg-[#eef7f1] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#1b5e34]" />
              </div>
            </div>
            {permissions.canViewFinancials ? (
              <>
                <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${econ.margenBruto >= 0 ? 'text-[#18532f]' : 'text-[#8f2828]'}`}>
                  {econ.ingresosTotales > 0 
                    ? formatMoney(econ.margenBruto)
                    : 'Sin liquidaciones'}
                </div>
                <div className="text-[11px] text-[#6b8273] mt-2 flex items-center justify-between">
                  <span>
                    {econ.margenSobreIngresosPct !== null
                      ? `${econ.margenSobreIngresosPct.toFixed(1)}% margen`
                      : 'Sin calcular'}
                  </span>
                  <span className="text-[10px] text-[#1b5e34] font-semibold bg-[#edf7f0] px-1.5 py-0.2 rounded border border-[#cce4d3]">
                    Ingresos − Costos
                  </span>
                </div>
              </>
            ) : (
              <div className="py-2">
                <span className="text-xs font-medium text-[#7e9486] italic">Acceso restringido a Administración</span>
                <div className="text-[11px] text-[#556e5f] mt-1">Indicador económico central</div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-[#edf2ec] text-[10px] text-[#718a7c] flex items-center justify-between">
            <span>Resultado Unidad C</span>
            <span className="font-mono text-[#18532f]">Neto Directo</span>
          </div>
        </div>

        {/* 4. Costo Total y Alimento */}
        <div className="bg-white p-4 rounded-xl border border-[#d8e2d7] hover:border-[#b8ccb6] transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#556e5f] mb-1">
              <span className="font-semibold">Costos Totales & Raciones</span>
              <div className="w-6 h-6 rounded-md bg-[#fdf5eb] flex items-center justify-center">
                <Utensils className="w-3.5 h-3.5 text-[#915a13]" />
              </div>
            </div>
            {permissions.canViewFinancials ? (
              <>
                <div className="text-xl font-bold text-[#143522] font-mono tabular-nums mt-1">
                  {formatMoney(econ.costoTotalPeriodo)}
                </div>
                <div className="text-[11px] text-[#6b8273] mt-2 flex items-center justify-between">
                  <span>Alimento: <strong className="font-mono text-[#193725]">{formatMoney(costoAlimentoTotal)}</strong></span>
                  <span className="text-[10px] text-[#915a13] font-bold bg-[#fef7ec] px-1.5 py-0.2 rounded border border-[#f4dfb6]">
                    {participacionAlimento}%
                  </span>
                </div>
              </>
            ) : (
              <div className="py-2">
                <span className="text-xs font-medium text-[#7e9486] italic">Acceso restringido a Administración</span>
                <div className="text-[11px] text-[#556e5f] mt-1 font-mono">Consumo registrado en granja</div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-[#edf2ec] text-[10px] text-[#718a7c] flex items-center justify-between">
            <span>Maíz + Núcleo Proteico</span>
            <span className="font-mono text-[#915a13]">Ración Granja</span>
          </div>
        </div>
      </div>

      {/* Métricas Zootécnicas y Reproductivas de la Piara */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cabezas en Stock */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d8e2d7] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#556e5f] mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#2c533c]">
                Piara Total en Granja
              </span>
              <Layers className="w-4 h-4 text-[#2c5e3d]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#153422] font-mono tabular-nums">
              {totalCabezasPiara} <span className="text-xs sm:text-sm font-medium text-[#657d6e]">cabezas activas</span>
            </div>
            <p className="text-xs text-[#5c7566] mt-1.5">
              Biomasa estimada: <strong className="font-mono text-[#1a3a27]">{totalKgPiara.toLocaleString('es-AR')} kg</strong> en pie.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-[#ebf2ea] flex items-center justify-between text-[11px] text-[#6d8576]">
            <span>Lotes bajo seguimiento: {db.Lotes_Animales.filter(l => l.estado === 'Activo').length}</span>
            <span className="text-[#1f5936] font-semibold">Cría, Recría, Engorde</span>
          </div>
        </div>

        {/* Plantel Madres */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d8e2d7] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#556e5f] mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#2c533c]">
                Plantel de Madres Activas
              </span>
              <span className="text-[10px] text-[#1c4b31] font-mono font-semibold">Pozo del Carril</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#153422] font-mono tabular-nums">
              {refPlantel} <span className="text-xs sm:text-sm font-medium text-[#657d6e]">cerdas en producción</span>
            </div>
            <p className="text-xs text-[#5c7566] mt-1.5">
              Ritmo reproductivo: <strong className="font-mono text-[#1a3a27]">{refPartosAnio} partos/madre/año</strong>.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-[#ebf2ea] flex items-center justify-between text-[11px] text-[#6d8576]">
            <span>Partos registrados: {dbFiltradaPorCampana.Partos.length}</span>
            <span className="text-[#1f5936] font-semibold">Líneas Landrace × Yorkshire</span>
          </div>
        </div>

        {/* Destete y Supervivencia */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d8e2d7] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#556e5f] mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#2c533c]">
                Eficiencia al Destete
              </span>
              <Activity className="w-4 h-4 text-[#2c5e3d]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#153422] font-mono tabular-nums">
              {typeof supervivenciaDestete === 'number' ? `${supervivenciaDestete.toFixed(1)}%` : `${supervivenciaDestete}`}
            </div>
            <p className="text-xs text-[#5c7566] mt-1.5">
              Nacidos vivos: <strong className="font-mono">{nacidosProm}</strong> · Destetados: <strong className="font-mono">{destetadosProm}</strong>
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-[#ebf2ea] flex items-center justify-between text-[11px] text-[#6d8576]">
            <span>Mortalidad predestete: {typeof supervivenciaDestete === 'number' ? (100 - supervivenciaDestete).toFixed(1) : 14.19}%</span>
            <span className="text-[#1f5936] font-semibold">Parideras de campo</span>
          </div>
        </div>
      </div>

      {/* Existencias de Hacienda por Fase Productiva */}
      <div className="bg-white p-5 rounded-xl border border-[#d8e2d7] shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#153422] tracking-tight">
              Distribución de Hacienda por Fase Productiva
            </h3>
            <p className="text-xs text-[#5e7768]">
              Cabezas, biomasa en pie y peso promedio por etapa del ciclo porcino
            </p>
          </div>
          <button
            onClick={() => onNavigate('existencias')}
            className="text-xs font-semibold text-[#1c4b31] hover:text-[#11301f] flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Existencias</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {existenciasPorFase.map(({ fase, cabezas, kg, pesoPromedio, lotesCount }) => (
            <div key={fase.id} className="p-3.5 rounded-xl border border-[#d8e2d7] bg-[#fbfdfb]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#1a3826]">{fase.nombre}</span>
                <span className="text-[10px] font-mono text-[#4b6a57] bg-[#eef5ef] px-1.5 py-0.5 rounded">
                  {lotesCount} lotes
                </span>
              </div>
              <div className="text-xl font-bold text-[#153422] font-mono">
                {cabezas} <span className="text-xs font-medium text-[#657d6e]">cab.</span>
              </div>
              <div className="text-xs text-[#556e5f] mt-1 flex items-center justify-between">
                <span>Biomasa: <strong className="font-mono text-[#1a3826]">{kg.toLocaleString('es-AR')} kg</strong></span>
                <span>Peso medio: <strong className="font-mono text-[#1c4b31]">{pesoPromedio} kg</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para Crear Nueva Campaña (Requerimiento 5) */}
      {showNewCampanaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#d8e2d7] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#1c4b31]" />
                <h3 className="text-base font-bold text-[#153422]">
                  Nueva Campaña Productiva
                </h3>
              </div>
              <button
                onClick={() => setShowNewCampanaModal(false)}
                className="p-1 text-[#6b8273] hover:text-[#183123] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {campanaModalError && (
              <div className="p-2.5 bg-[#fef2f2] border border-[#f8c8c8] text-[#8a1c1c] text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{campanaModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCampana} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Nombre de la Campaña:
                </label>
                <input
                  type="text"
                  placeholder="ej. Campaña 2026/2027"
                  value={newCampanaNombre}
                  onChange={(e) => setNewCampanaNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] focus:border-[#1c4b31] focus:ring-1 focus:ring-[#1c4b31] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Identificador (Opcional - ej. CAMP_2026_2027):
                </label>
                <input
                  type="text"
                  placeholder="CAMP_2026_2027"
                  value={newCampanaId}
                  onChange={(e) => setNewCampanaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] font-mono focus:border-[#1c4b31] focus:ring-1 focus:ring-[#1c4b31] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Fecha Inicio:
                  </label>
                  <input
                    type="date"
                    value={newCampanaDesde}
                    onChange={(e) => setNewCampanaDesde(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] focus:border-[#1c4b31] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">
                    Fecha Cierre:
                  </label>
                  <input
                    type="date"
                    value={newCampanaHasta}
                    onChange={(e) => setNewCampanaHasta(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] focus:border-[#1c4b31] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#234230] mb-1">
                  Estado Inicial:
                </label>
                <select
                  value={newCampanaEstado}
                  onChange={(e: any) => setNewCampanaEstado(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c8d8ca] bg-[#f9fbf9] text-[#183123] focus:border-[#1c4b31] outline-none"
                >
                  <option value="Abierto">Abierto (Campaña Activa en curso)</option>
                  <option value="Cerrado">Cerrado (Campaña finalizada)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5ede5]">
                <button
                  type="button"
                  onClick={() => setShowNewCampanaModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#c8d8ca] text-[#4b6a57] hover:bg-[#edf5ef] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1c4b31] hover:bg-[#123823] text-white font-semibold shadow-xs cursor-pointer"
                >
                  Guardar Campaña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
