/**
 * @file AlimentacionView.tsx
 * @description Módulo de Alimentación Porcina y Configuración de ICA
 * Requerimientos:
 * - Tres campos de ICA de referencia alineados: Cría, Destete/Recría y Engorde/Terminación.
 * - Edición manual persistente con fecha de vigencia por usuarios autorizados.
 * - Diferenciación entre ICA de referencia configurado e ICA real calculado.
 * - En Cría/Lactancia: mostrar 'Datos insuficientes' / referencia para lechones (alimentación materna).
 * - Eliminación de la aclaración visual arriba a la derecha ('Dato real / Estimación...').
 * - Catálogo estandarizado de 4 alimentos en selector de consumos.
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Utensils, 
  Check, 
  X, 
  Scale, 
  AlertCircle, 
  Info, 
  Sliders, 
  History, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { BaseDatosPorcina, ConsumoAlimentoReal, Usuario } from '../types/schema';
import { DataTable, Column } from '../components/DataTable';
import { StatusTag } from '../components/StatusTag';
import { getRolePermissions } from '../lib/permissions';

interface Props {
  db: BaseDatosPorcina;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  onConfirmRecord: (table: keyof BaseDatosPorcina, id: string) => Promise<any>;
  onCancelRecord: (table: keyof BaseDatosPorcina, id: string, motivo: string) => Promise<any>;
  onExportCsv: (table: keyof BaseDatosPorcina) => void;
  currentUser?: Usuario | null;
}

interface ICAReferenciasState {
  cria: { valor: number; fechaVigencia: string; observaciones: string };
  destete: { valor: number; fechaVigencia: string; observaciones: string };
  engorde: { valor: number; fechaVigencia: string; observaciones: string };
}

const STORAGE_ICA_REF_KEY = 'pozo_del_carril_ica_referencias_config_v1';

const ICA_REFS_DEFAULT: ICAReferenciasState = {
  cria: {
    valor: 1.15,
    fechaVigencia: '2024-07-01',
    observaciones: 'Referencia técnica creep-feeding en lactancia (0–9 kg)'
  },
  destete: {
    valor: 1.75,
    fechaVigencia: '2024-07-01',
    observaciones: 'Referencia técnica de recría en comederos tolva (9–35 kg)'
  },
  engorde: {
    valor: 3.00,
    fechaVigencia: '2024-07-01',
    observaciones: 'Meta zootécnica de terminación a campo (35–105 kg)'
  }
};

export const AlimentacionView: React.FC<Props> = ({
  db,
  onSaveRecord,
  onConfirmRecord,
  onCancelRecord,
  onExportCsv,
  currentUser = null
}) => {
  const permissions = getRolePermissions(currentUser);
  const [showModal, setShowModal] = useState(false);
  const [showConfigIcaModal, setShowConfigIcaModal] = useState(false);
  const [faseAEditarIca, setFaseAEditarIca] = useState<'cria' | 'destete' | 'engorde'>('engorde');

  // Estado persistente de ICAs de referencia
  const [icaRefs, setIcaRefs] = useState<ICAReferenciasState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ICA_REF_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cria && parsed.destete && parsed.engorde) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo ICA referencias guardadas', e);
    }
    return ICA_REFS_DEFAULT;
  });

  // Formulario temporal de edición de ICA
  const [formIcaEdit, setFormIcaEdit] = useState({
    valor: 3.00,
    fechaVigencia: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  // Catálogo estandarizado de 4 alimentos obligatorios con denominaciones exactas
  const alimentosEstandar = useMemo(() => {
    const catalogoRequerido = [
      { id: 'INS_MAIZ_PROP', nombre: 'Maíz propio.' },
      { id: 'INS_PELLET_SOJA', nombre: 'Pellet de soja.' },
      { id: 'INS_CONC_CRIA', nombre: 'Alimento concentrado iniciador (Cría).' },
      { id: 'INS_PELETEADO_DEST', nombre: 'Alimento concentrado (Destete).' }
    ];

    return catalogoRequerido.map(item => {
      const ins = (db.D_Insumo || []).find(i => i.id === item.id);
      return {
        id: item.id,
        nombre: item.nombre,
        tipo_insumo: ins?.tipo_insumo || 'BALANCEADO',
        es_alimento: true,
        um_id: ins?.um_id || 'UM_KG',
        cuenta_id: ins?.cuenta_id || (item.id === 'INS_MAIZ_PROP' ? 'CTA_ALIM_MAIZ' : item.id === 'INS_PELLET_SOJA' ? 'CTA_ALIM_SOJA' : 'CTA_ALIM_PELET'),
        activo: true
      };
    });
  }, [db.D_Insumo]);

  // Formulario de Consumo Real
  const [formData, setFormData] = useState<{
    fecha: string;
    insumo_id: string;
    kg_consumidos: number;
    fase_id: string;
    subunidad_id: string;
    lote_id: string;
    costo_unitario_imputado: number;
  }>({
    fecha: new Date().toISOString().split('T')[0],
    insumo_id: 'INS_MAIZ_PROP',
    kg_consumidos: 100,
    fase_id: 'FASE_ENGORDE_TERM',
    subunidad_id: 'SUB_ENGORDE_TERM',
    lote_id: '',
    costo_unitario_imputado: 210
  });

  // Cálculos reales de ICA por fase (kg consumidos reales / kg ganados reales)
  const calculosIcaReal = useMemo(() => {
    const consumos = db.Consumo_Alimento_Real?.filter(c => c.estado === 'Confirmado') || [];
    const movs = db.Movimientos_Fisicos?.filter(m => m.estado === 'Confirmado') || [];

    // 1. Engorde
    const kgAlimEngorde = consumos
      .filter(c => c.fase_id === 'FASE_ENGORDE_TERM')
      .reduce((acc, c) => acc + (Number(c.kg_consumidos) || 0), 0);
    
    // Kg ganados en engorde a partir de pases y ventas
    const evIniEngorde = movs.filter(m => m.fase_destino_id === 'FASE_ENGORDE_TERM' && m.tipo_evento === 'PASE_FASE');
    const evFinEngorde = movs.filter(m => m.fase_origen_id === 'FASE_ENGORDE_TERM' && (m.tipo_evento === 'VENTA' || m.tipo_evento === 'PASE_FASE'));
    
    let kgGanadosEngorde = 0;
    if (evFinEngorde.length > 0) {
      const kgTotEgr = evFinEngorde.reduce((acc, m) => acc + (Number(m.kg_totales) || 0), 0);
      const kgTotIng = evIniEngorde.reduce((acc, m) => acc + (Number(m.kg_totales) || 0), 0);
      kgGanadosEngorde = Math.max(0, kgTotEgr - kgTotIng);
    }

    let icaRealEngorde: number | null = null;
    if (kgAlimEngorde > 0 && kgGanadosEngorde > 0) {
      icaRealEngorde = Number((kgAlimEngorde / kgGanadosEngorde).toFixed(2));
    }

    // 2. Destete / Recría
    const kgAlimRecria = consumos
      .filter(c => c.fase_id === 'FASE_DESTETE_REC')
      .reduce((acc, c) => acc + (Number(c.kg_consumidos) || 0), 0);
    
    const evIniRecria = movs.filter(m => m.fase_destino_id === 'FASE_DESTETE_REC');
    const evFinRecria = movs.filter(m => m.fase_origen_id === 'FASE_DESTETE_REC' && m.fase_destino_id === 'FASE_ENGORDE_TERM');
    
    let kgGanadosRecria = 0;
    if (evFinRecria.length > 0) {
      const kgTotEgr = evFinRecria.reduce((acc, m) => acc + (Number(m.kg_totales) || 0), 0);
      const kgTotIng = evIniRecria.reduce((acc, m) => acc + (Number(m.kg_totales) || 0), 0);
      kgGanadosRecria = Math.max(0, kgTotEgr - kgTotIng);
    }

    let icaRealRecria: number | null = null;
    if (kgAlimRecria > 0 && kgGanadosRecria > 0) {
      icaRealRecria = Number((kgAlimRecria / kgGanadosRecria).toFixed(2));
    }

    return {
      engorde: {
        kgAlimento: kgAlimEngorde,
        kgGanados: kgGanadosEngorde,
        icaReal: icaRealEngorde
      },
      destete: {
        kgAlimento: kgAlimRecria,
        kgGanados: kgGanadosRecria,
        icaReal: icaRealRecria
      }
    };
  }, [db.Consumo_Alimento_Real, db.Movimientos_Fisicos]);

  const handleOpenEditIca = (fase: 'cria' | 'destete' | 'engorde') => {
    setFaseAEditarIca(fase);
    setFormIcaEdit({
      valor: icaRefs[fase].valor,
      fechaVigencia: icaRefs[fase].fechaVigencia,
      observaciones: icaRefs[fase].observaciones
    });
    setShowConfigIcaModal(true);
  };

  const handleGuardarIcaRef = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ICAReferenciasState = {
      ...icaRefs,
      [faseAEditarIca]: {
        valor: Number(formIcaEdit.valor),
        fechaVigencia: formIcaEdit.fechaVigencia,
        observaciones: formIcaEdit.observaciones.trim()
      }
    };
    setIcaRefs(updated);
    try {
      localStorage.setItem(STORAGE_ICA_REF_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error guardando ICA referencias en localStorage', err);
    }
    setShowConfigIcaModal(false);
  };

  const handleGuardarConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.insumo_id || formData.kg_consumidos <= 0) {
      alert('Debe seleccionar un insumo y especificar los kilos consumidos');
      return;
    }

    const costoTotal = Number(formData.kg_consumidos) * Number(formData.costo_unitario_imputado);
    const isOperario = permissions.rolId === 'ROL_OPERARIO';

    const nuevoConsumo: Partial<ConsumoAlimentoReal> = {
      id: `CON_${Date.now()}`,
      fecha: formData.fecha,
      insumo_id: formData.insumo_id,
      kg_consumidos: Number(formData.kg_consumidos),
      fase_id: formData.fase_id,
      subunidad_id: formData.subunidad_id,
      lote_id: formData.lote_id || undefined,
      costo_unitario_imputado: Number(formData.costo_unitario_imputado),
      costo_total_imputado: costoTotal,
      estado: isOperario ? 'Borrador' : 'Confirmado',
      origen_dato: 'REAL'
    };

    await onSaveRecord('Consumo_Alimento_Real', nuevoConsumo);

    await onSaveRecord('Movimientos_Stock_Insumos', {
      id: `MS_${Date.now()}`,
      fecha: formData.fecha,
      tipo_movimiento: 'CONSUMO',
      insumo_id: formData.insumo_id,
      cantidad: -Number(formData.kg_consumidos),
      um_id: 'UM_KG',
      observaciones: `Consumo en fase ${formData.fase_id}`
    });

    const insumoSel = db.D_Insumo.find(i => i.id === formData.insumo_id);
    const cuentaId = insumoSel?.cuenta_id || (
      formData.insumo_id === 'INS_MAIZ_PROP' ? 'CTA_ALIM_MAIZ' :
      formData.insumo_id === 'INS_PELLET_SOJA' ? 'CTA_ALIM_SOJA' : 'CTA_ALIM_PELET'
    );

    await onSaveRecord('F_Costos', {
      id: `CST_ALIM_${Date.now()}`,
      fecha: formData.fecha,
      cuenta_id: cuentaId,
      unidad_neg_id: 'UN_PORCINA',
      subunidad_id: formData.subunidad_id,
      fase_id: formData.fase_id,
      lote_id: formData.lote_id || undefined,
      origen_costo: 'CONSUMO',
      importe_neto: costoTotal,
      estado: isOperario ? 'Borrador' : 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK'
    });

    setShowModal(false);
  };

  const columns: Column<ConsumoAlimentoReal>[] = [
    { key: 'fecha', header: 'Fecha' },
    { 
      key: 'insumo_id', 
      header: 'Insumo / Alimento', 
      render: (r) => {
        const ins = db.D_Insumo.find(i => i.id === r.insumo_id);
        return <span className="font-semibold text-[#183123]">{ins ? ins.nombre : r.insumo_id}</span>;
      }
    },
    { 
      key: 'fase_id', 
      header: 'Fase Destino', 
      render: (r) => {
        const fase = db.Fases_Proceso.find(f => f.id === r.fase_id);
        return <span className="text-xs">{fase ? fase.nombre : r.fase_id}</span>;
      }
    },
    { key: 'lote_id', header: 'Lote', render: (r) => r.lote_id || '—' },
    { key: 'kg_consumidos', header: 'Kg Consumidos', align: 'right' },
    { 
      key: 'costo_total_imputado', 
      header: 'Costo Imputado', 
      align: 'right',
      render: (r) => {
        if (!permissions.canViewFinancials) {
          return <span className="text-[11px] text-slate-400 italic">No visible</span>;
        }
        const costo = Number(r.costo_total_imputado) || 0;
        return <span className="font-mono font-medium">${costo.toLocaleString('es-AR')}</span>;
      }
    },
    { key: 'estado', header: 'Estado', render: (r) => <StatusTag estado={r.estado} /> },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      render: (r) => {
        if (permissions.isReadOnly) {
          return <span className="text-[11px] text-slate-400">Solo lectura</span>;
        }
        return (
          <div className="flex items-center justify-center gap-1">
            {r.estado === 'Borrador' && permissions.canConfirm('alimentacion') && (
              <button
                onClick={() => onConfirmRecord('Consumo_Alimento_Real', r.id)}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                title="Confirmar consumo"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            {r.estado !== 'Anulado' && permissions.canCancel('alimentacion') && (
              <button
                onClick={() => {
                  const motivo = prompt('Motivo formal de anulación:');
                  if (motivo) onCancelRecord('Consumo_Alimento_Real', r.id, motivo);
                }}
                className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                title="Anular"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-5">
      {/* Banner de Modo Solo Lectura para Auditor */}
      {permissions.isReadOnly && (
        <div className="bg-[#edf3f8] border border-[#c4d6e5] text-[#1e4260] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
          <span><strong>Rango Auditor:</strong> Modo de solo lectura activo. Verificación técnica de raciones y desvíos de conversión.</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#c5dcf0] text-[#1b3d59]">Solo Lectura</span>
        </div>
      )}

      {/* Banner de Modo Operario */}
      {permissions.rolId === 'ROL_OPERARIO' && (
        <div className="bg-[#fef9ee] border border-[#f7e0af] text-[#7a4e14] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
          <span><strong>Rango Operario:</strong> Las raciones consumidas registradas se guardarán como <strong>Borrador</strong> para posterior confirmación del Encargado.</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#fce49d] text-[#734509]">Carga en Borrador</span>
        </div>
      )}

      {/* Encabezado y Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#143422] tracking-tight">
              Módulo de Alimentación, Raciones & ICA
            </h2>
            <span className="text-[10px] font-mono text-[#255e39] bg-[#edf6f0] px-2 py-0.2 rounded border border-[#cbe3d2]">
              Nutrición Porcina
            </span>
          </div>
          <p className="text-xs text-[#5c7767] mt-0.5">
            Registro de consumos reales por fase/lote, comparación contra ICA de referencia y costeo directo.
          </p>
        </div>

        {!permissions.isReadOnly && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1d4c32] hover:bg-[#153e27] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto cursor-pointer border border-[#163c26]"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Consumo Real</span>
          </button>
        )}
      </div>

      {/* ======================================================================= */}
      {/* TRES CAMPOS DE ICA DE REFERENCIA ALINEADOS (CRÍA, DESTETE, ENGORDE)    */}
      {/* Requerimiento 3: Eliminada la aclaración arriba a la derecha.          */}
      {/* Diferenciación estricta entre ICA de referencia e ICA real calculado. */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. ICA Cría / Lactancia */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d8e2d7] shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#1e482f] text-sm">ICA Cría / Lactancia</span>
              {!permissions.isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleOpenEditIca('cria')}
                  className="text-[11px] font-bold text-[#1a5b34] hover:underline cursor-pointer flex items-center gap-1"
                  title="Configurar ICA de referencia para Cría"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#153422] tabular-nums">
              {icaRefs.cria.valor.toFixed(2)} : 1
            </div>
            <span className="text-[10px] text-[#6b8273] block mt-0.5">
              Ref. configurada · Vigencia: {icaRefs.cria.fechaVigencia}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#f6f9f6] border border-[#dce9dd] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#597363] font-medium">ICA Real Calculado:</span>
              <span className="font-mono font-bold text-[#718579] italic text-[11px]">
                Datos insuficientes
              </span>
            </div>
            <p className="text-[10px] text-[#557161] leading-relaxed">
              En lactancia hay alimentación materna. No es metodológicamente comparable un ICA convencional de lechón sin pesaje de leche de cerda.
            </p>
          </div>
        </div>

        {/* 2. ICA Destete / Recría */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d8e2d7] shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#805016] text-sm">ICA Destete / Recría</span>
              {!permissions.isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleOpenEditIca('destete')}
                  className="text-[11px] font-bold text-[#8a5518] hover:underline cursor-pointer flex items-center gap-1"
                  title="Configurar ICA de referencia para Destete/Recría"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#8a5518] tabular-nums">
              {icaRefs.destete.valor.toFixed(2)} : 1
            </div>
            <span className="text-[10px] text-[#8a6840] block mt-0.5">
              Ref. configurada · Vigencia: {icaRefs.destete.fechaVigencia}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#fcf8f2] border border-[#eddcc4] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#785324] font-medium">ICA Real Calculado:</span>
              <span className="font-mono font-bold text-[#8a5518]">
                {calculosIcaReal.destete.icaReal !== null ? `${calculosIcaReal.destete.icaReal.toFixed(2)} : 1` : 'Datos insuficientes'}
              </span>
            </div>
            <p className="text-[10px] text-[#7d5e38] leading-relaxed">
              {calculosIcaReal.destete.icaReal !== null
                ? `Consumo: ${calculosIcaReal.destete.kgAlimento.toLocaleString()} kg / Ganancia: ${calculosIcaReal.destete.kgGanados.toLocaleString()} kg.`
                : 'Pendiente de pesajes de egreso de recría y balance de comederos.'}
            </p>
          </div>
        </div>

        {/* 3. ICA Engorde / Terminación */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#d8e2d7] shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#1e482f] text-sm">ICA Engorde / Terminación</span>
              {!permissions.isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleOpenEditIca('engorde')}
                  className="text-[11px] font-bold text-[#1a5b34] hover:underline cursor-pointer flex items-center gap-1"
                  title="Configurar ICA de referencia para Engorde/Terminación"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#153422] tabular-nums">
              {icaRefs.engorde.valor.toFixed(2)} : 1
            </div>
            <span className="text-[10px] text-[#6b8273] block mt-0.5">
              Ref. configurada · Vigencia: {icaRefs.engorde.fechaVigencia}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#f6f9f6] border border-[#dce9dd] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#597363] font-medium">ICA Real Calculado:</span>
              <span className="font-mono font-bold text-[#143422]">
                {calculosIcaReal.engorde.icaReal !== null ? `${calculosIcaReal.engorde.icaReal.toFixed(2)} : 1` : 'Datos insuficientes'}
              </span>
            </div>
            <p className="text-[10px] text-[#557161] leading-relaxed">
              {calculosIcaReal.engorde.icaReal !== null
                ? `Consumo: ${calculosIcaReal.engorde.kgAlimento.toLocaleString()} kg / Ganancia: ${calculosIcaReal.engorde.kgGanados.toLocaleString()} kg.`
                : 'Pesada de tolvas y ventas de capón terminados en campo.'}
            </p>
          </div>
        </div>
      </div>

      {/* Regla de negocio ganadera */}
      <div className="bg-[#edf5f0] border border-[#c5e1cf] rounded-lg p-3 text-xs text-[#16432a] flex items-start gap-2 shadow-2xs">
        <Info className="w-4 h-4 text-[#1b6b3e] shrink-0 mt-0.5" />
        <div>
          <strong>Regla de Integridad de Alimentación:</strong> La compra de alimento y el consumo son hechos distintos. La compra incrementa el stock de insumos en silo/galpón; el consumo real reduce el stock e imputa el costo directo a la fase, subunidad o lote correspondiente sin alterar las referencias técnicas configuradas.
        </div>
      </div>

      {/* Tabla de Consumos Reales */}
      <DataTable
        columns={columns}
        data={db.Consumo_Alimento_Real}
        title="Consumos Reales de Alimento Registrados"
        subtitle="Imputación de kilos por fase y cálculo de costo absorbido con catálogo estándar"
        onExportCsv={() => onExportCsv('Consumo_Alimento_Real')}
        emptyMessage="No se han registrado consumos de alimento. Haga clic en 'Registrar Consumo Real'."
      />

      {/* MODAL: CONFIGURAR ICA DE REFERENCIA */}
      {showConfigIcaModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#d8e2d7] max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#1b5e37]" />
                <h3 className="text-sm font-bold text-[#143422]">
                  Configurar ICA de Referencia · {faseAEditarIca === 'cria' ? 'Cría/Lactancia' : faseAEditarIca === 'destete' ? 'Destete/Recría' : 'Engorde/Terminación'}
                </h3>
              </div>
              <button onClick={() => setShowConfigIcaModal(false)} className="text-[#648070] hover:text-[#183123]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarIcaRef} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#234230] font-semibold mb-1">
                  Valor de Referencia (kg ración / kg aumento) *:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="10"
                  required
                  value={formIcaEdit.valor}
                  onChange={e => setFormIcaEdit({ ...formIcaEdit, valor: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl font-mono font-bold text-sm text-[#143422] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#234230] font-semibold mb-1">
                  Fecha de Vigencia de la Referencia *:
                </label>
                <input
                  type="date"
                  required
                  value={formIcaEdit.fechaVigencia}
                  onChange={e => setFormIcaEdit({ ...formIcaEdit, fechaVigencia: e.target.value })}
                  className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl font-mono text-xs text-[#143422] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#234230] font-semibold mb-1">
                  Observaciones / Fundamento Técnico:
                </label>
                <textarea
                  rows={2}
                  value={formIcaEdit.observaciones}
                  onChange={e => setFormIcaEdit({ ...formIcaEdit, observaciones: e.target.value })}
                  placeholder="Justificación del parámetro zootécnico..."
                  className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs text-[#143422] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#edf2ec]">
                <button
                  type="button"
                  onClick={() => setShowConfigIcaModal(false)}
                  className="px-3.5 py-1.5 border border-[#cbd8cb] text-[#557160] hover:bg-[#f3f7f3] rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-[#1b5e37] hover:bg-[#14472a] rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Referencia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CONSUMO REAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#d8e2d7] max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#edf2ec] pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#1b5e37]" />
                <h3 className="text-sm font-bold text-[#143422]">
                  Registrar Consumo Real de Alimento
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#648070] hover:text-[#183123]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarConsumo} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Fecha de Consumo (*)</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Insumo / Alimento (*)</label>
                  <select
                    required
                    value={formData.insumo_id}
                    onChange={e => setFormData({ ...formData, insumo_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-white font-semibold outline-none"
                  >
                    {/* Catálogo estándar de 4 denominaciones exactas */}
                    {alimentosEstandar.map(ins => (
                      <option key={ins.id} value={ins.id}>{ins.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Fase Destino (*)</label>
                  <select
                    required
                    value={formData.fase_id}
                    onChange={e => {
                      const fase = db.Fases_Proceso.find(f => f.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        fase_id: e.target.value,
                        subunidad_id: fase?.subunidad_id || 'SUB_ENGORDE_TERM'
                      });
                    }}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-white font-semibold outline-none"
                  >
                    {db.Fases_Proceso.map(f => (
                      <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Lote Específico (Opcional)</label>
                  <select
                    value={formData.lote_id}
                    onChange={e => setFormData({ ...formData, lote_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-white font-mono outline-none"
                  >
                    <option value="">Consolidado de la fase</option>
                    {db.Lotes_Animales.filter(l => l.estado === 'Activo').map(l => (
                      <option key={l.id || l.codigo_lote} value={l.codigo_lote}>{l.codigo_lote}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Kilos Reales Consumidos (*)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.kg_consumidos}
                    onChange={e => setFormData({ ...formData, kg_consumidos: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Costo Unitario Imputado ($/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costo_unitario_imputado}
                    onChange={e => setFormData({ ...formData, costo_unitario_imputado: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#f6faf7] border border-[#dce8de] rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#557161]">Costo Total a Imputar:</span>
                <span className="font-mono font-bold text-[#143422] text-sm">
                  ${(formData.kg_consumidos * formData.costo_unitario_imputado).toLocaleString('es-AR')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#edf2ec]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 border border-[#cbd8cb] text-[#557160] hover:bg-[#f3f7f3] rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-[#1b5e37] hover:bg-[#14472a] rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Consumo & Actualizar Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
