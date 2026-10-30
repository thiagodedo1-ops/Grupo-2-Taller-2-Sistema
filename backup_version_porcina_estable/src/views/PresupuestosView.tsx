/**
 * @file PresupuestosView.tsx
 * @description Módulo operativo de Presupuesto y Desvíos
 * Requerimiento 7: Formulación de presupuestos por campaña, comparativa Presupuestado vs Real,
 * desvío absoluto y %, semáforo económico (costo mayor = desfavorable), versiones independientes
 * y vinculación automática con el indicador F5 del CMI.
 */

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  Plus, 
  Download, 
  Check, 
  RotateCcw, 
  Info, 
  FileText, 
  X, 
  Filter,
  DollarSign,
  Scale
} from 'lucide-react';
import { BaseDatosPorcina, PresupuestoVersion, PresupuestoItem, Usuario } from '../types/schema';
import { useCurrency } from '../context/CurrencyContext';
import { getRolePermissions } from '../lib/permissions';

interface Props {
  db: BaseDatosPorcina;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  currentUser?: Usuario | null;
}

export const PresupuestosView: React.FC<Props> = ({
  db,
  onSaveRecord,
  currentUser = null
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney, symbol } = useCurrency();

  // Campaña seleccionada
  const [selectedCampanaId, setSelectedCampanaId] = useState<string>(
    db.D_Campana.find(c => c.estado === 'Abierto')?.id || 'CAMP_2024_2025'
  );

  // Lista de presupuestos en la base
  const presupuestosCampana = useMemo(() => {
    const list = db.Presupuestos || [];
    return list.filter(p => p.campana_id === selectedCampanaId);
  }, [db.Presupuestos, selectedCampanaId]);

  // Versión seleccionada actualmente
  const versionBase = useMemo(() => {
    return presupuestosCampana.find(p => p.es_base_comparacion) || presupuestosCampana[0] || null;
  }, [presupuestosCampana]);

  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versionBase?.id || presupuestosCampana[0]?.id || ''
  );

  const versionActiva = useMemo(() => {
    return presupuestosCampana.find(p => p.id === selectedVersionId) || versionBase || null;
  }, [presupuestosCampana, selectedVersionId, versionBase]);

  // Modal nueva versión
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVersionNombre, setNewVersionNombre] = useState('');
  const [newVersionTipo, setNewVersionTipo] = useState<'ORIGINAL' | 'REVISADA' | 'APROBADA'>('REVISADA');
  const [newVersionCriterio, setNewVersionCriterio] = useState('Hipótesis presupuestaria');
  const [newVersionObs, setNewVersionObs] = useState('');
  const [copiarDesdeVersionActual, setCopiarDesdeVersionActual] = useState(true);

  // Modal nuevo ítem
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemConcepto, setItemConcepto] = useState('');
  const [itemTipo, setItemTipo] = useState<'COSTO' | 'INGRESO'>('COSTO');
  const [itemRubro, setItemRubro] = useState('Alimentación - Maíz');
  const [itemCantidad, setItemCantidad] = useState<number>(1000);
  const [itemUm, setItemUm] = useState('kg');
  const [itemPrecio, setItemPrecio] = useState<number>(280);

  // Filtro de rubro en la matriz
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'COSTO' | 'INGRESO'>('TODOS');

  // Cálculos reales de la campaña para comparar
  const realesCampana = useMemo(() => {
    const campana = db.D_Campana.find(c => c.id === selectedCampanaId);
    const fDesde = campana?.fecha_desde || '2024-07-01';
    const fHasta = campana?.fecha_hasta || '2025-06-30';

    // 1. Ingresos reales por ventas
    const ventas = db.Mov_Comercial_Enc.filter(m => 
      m.tipo_operacion === 'VENTA' && 
      m.estado === 'Confirmado' &&
      m.estado_validacion !== 'Observado' &&
      (m.campana_id === selectedCampanaId || (m.fecha >= fDesde && m.fecha <= fHasta))
    );
    const ingresosReales = ventas.reduce((acc, v) => acc + (Number(v.total_neto) || 0), 0);

    // Kilos y cabezas reales vendidos
    let kgRealesVendidos = 0;
    let cabezasRealesVendidas = 0;
    ventas.forEach(v => {
      const dets = db.Mov_Comercial_Det.filter(d => d.mov_comercial_id === v.id);
      dets.forEach(d => {
        kgRealesVendidos += (Number(d.kg) || 0);
        cabezasRealesVendidas += (Number(d.cantidad_animales) || 0);
      });
    });

    // 2. Costos reales por rubro
    const costos = db.F_Costos.filter(c => 
      c.estado === 'Confirmado' &&
      c.estado_validacion !== 'Observado' &&
      (c.fecha >= fDesde && c.fecha <= fHasta)
    );

    // Consumo real de alimento
    const consumosAlimento = db.Consumo_Alimento_Real.filter(c => 
      c.estado === 'Confirmado' &&
      c.estado_validacion !== 'Observado' &&
      (c.fecha >= fDesde && c.fecha <= fHasta)
    );

    const costoMaizReal = consumosAlimento
      .filter(c => c.insumo_id === 'INS_MAIZ_PROP')
      .reduce((acc, c) => acc + (Number(c.costo_total_imputado) || 0), 0) +
      costos.filter(c => c.cuenta_id === 'CTA_ALIM_MAIZ').reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

    const costoPelletReal = consumosAlimento
      .filter(c => c.insumo_id === 'INS_PELLET_SOJA')
      .reduce((acc, c) => acc + (Number(c.costo_total_imputado) || 0), 0) +
      costos.filter(c => c.cuenta_id === 'CTA_ALIM_SOJA').reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

    const costoPeleteadoReal = consumosAlimento
      .filter(c => c.insumo_id === 'INS_PELETEADO_DEST' || c.insumo_id === 'INS_CONC_CRIA')
      .reduce((acc, c) => acc + (Number(c.costo_total_imputado) || 0), 0) +
      costos.filter(c => c.cuenta_id === 'CTA_ALIM_PELET').reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

    const costoSanidadReal = costos
      .filter(c => c.cuenta_id === 'CTA_SANIDAD')
      .reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

    const costoManoObraReal = costos
      .filter(c => c.cuenta_id === 'CTA_MANO_OBRA_DIR')
      .reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

    const costoIndirectosReal = db.Costos_Indirectos
      .filter(c => c.campana_id === selectedCampanaId && c.estado === 'Confirmado')
      .reduce((acc, c) => acc + (Number(c.importe_prorrateado) || Number(c.importe_total) || 0), 0) +
      costos.filter(c => c.cuenta_id === 'CTA_ESTRUCTURA_GRAL').reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

    const costosTotalesReales = costoMaizReal + costoPelletReal + costoPeleteadoReal + costoSanidadReal + costoManoObraReal + costoIndirectosReal;

    return {
      ingresosReales,
      kgRealesVendidos,
      cabezasRealesVendidas,
      costosTotalesReales,
      porRubro: {
        'Alimentación - Maíz': costoMaizReal,
        'Alimentación - Pellets': costoPelletReal,
        'Alimentación - Peleteado': costoPeleteadoReal,
        'Sanidad': costoSanidadReal,
        'Mano de Obra': costoManoObraReal,
        'Energía y Agua': 0,
        'Comercialización': 0,
        'Mantenimiento': costoIndirectosReal,
        'Ventas Capones': ingresosReales
      } as Record<string, number>
    };
  }, [db, selectedCampanaId]);

  // Comparativa item por item
  const comparativaMatriz = useMemo(() => {
    if (!versionActiva || !versionActiva.items) return [];

    return versionActiva.items.map((item) => {
      const presupuestado = item.importe_presupuestado;
      let real = 0;

      if (item.tipo === 'INGRESO') {
        real = realesCampana.ingresosReales;
      } else {
        real = realesCampana.porRubro[item.rubro] !== undefined 
          ? realesCampana.porRubro[item.rubro] 
          : 0;
      }

      // Desvío absoluto = Real - Presupuestado
      const desvioAbsoluto = real - presupuestado;

      // Desvío % = (Real - Presupuestado) / Presupuestado * 100
      let desvioPct: number | null = null;
      let desvioPctStr = 'No calculable';
      if (presupuestado > 0) {
        desvioPct = (desvioAbsoluto / presupuestado) * 100;
        desvioPctStr = `${desvioPct > 0 ? '+' : ''}${desvioPct.toFixed(1)}%`;
      }

      // Evaluación Favorable / Desfavorable según regla económica
      let esFavorable = false;
      let textoEvaluacion = 'Dentro de meta';
      let claseColor = 'text-[#15803d] bg-[#eaf5ed] border-[#b8dfc4]';

      if (item.tipo === 'COSTO') {
        // En costos: Real <= Presupuestado es FAVORABLE. Mayor costo es DESFAVORABLE.
        if (real <= presupuestado) {
          esFavorable = true;
          textoEvaluacion = 'Ahorro / Favorable';
          claseColor = 'text-[#15803d] bg-[#eaf5ed] border-[#b8dfc4]';
        } else {
          esFavorable = false;
          textoEvaluacion = 'Sobrecosto (Desfavorable)';
          claseColor = 'text-[#b91c1c] bg-[#fdf2f2] border-[#f8c8c8]';
        }
      } else {
        // En ingresos: Real >= Presupuestado es FAVORABLE.
        if (real >= presupuestado) {
          esFavorable = true;
          textoEvaluacion = 'Superávit (Favorable)';
          claseColor = 'text-[#15803d] bg-[#eaf5ed] border-[#b8dfc4]';
        } else {
          esFavorable = false;
          textoEvaluacion = 'Menor ingreso (Desfavorable)';
          claseColor = 'text-[#b91c1c] bg-[#fdf2f2] border-[#f8c8c8]';
        }
      }

      return {
        item,
        presupuestado,
        real,
        desvioAbsoluto,
        desvioPct,
        desvioPctStr,
        esFavorable,
        textoEvaluacion,
        claseColor
      };
    });
  }, [versionActiva, realesCampana]);

  // Totales consolidados de la versión
  const totales = useMemo(() => {
    let ingPre = 0;
    let cosPre = 0;

    versionActiva?.items?.forEach(it => {
      if (it.tipo === 'INGRESO') ingPre += (Number(it.importe_presupuestado) || 0);
      else cosPre += (Number(it.importe_presupuestado) || 0);
    });

    const ingReal = realesCampana.ingresosReales;
    const cosReal = realesCampana.costosTotalesReales;

    const margenPre = ingPre - cosPre;
    const margenReal = ingReal - cosReal;

    const desvioCostosAbs = cosReal - cosPre;
    const desvioCostosPct = cosPre > 0 ? (desvioCostosAbs / cosPre) * 100 : null;

    return {
      ingPre,
      ingReal,
      cosPre,
      cosReal,
      margenPre,
      margenReal,
      desvioCostosAbs,
      desvioCostosPct
    };
  }, [versionActiva, realesCampana]);

  // Fijar como base de comparación
  const handleSetBaseComparacion = async (versionId: string) => {
    if (!db.Presupuestos) return;
    const updated = db.Presupuestos.map(p => ({
      ...p,
      es_base_comparacion: p.id === versionId
    }));
    db.Presupuestos = updated;
    await onSaveRecord('Presupuestos' as any, updated);
  };

  // Crear nueva versión de presupuesto
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionNombre.trim()) return;

    let itemsIniciales: PresupuestoItem[] = [];
    if (copiarDesdeVersionActual && versionActiva?.items) {
      itemsIniciales = versionActiva.items.map(it => ({
        ...it,
        id: `IT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        presupuesto_id: `PRE_${Date.now()}`
      }));
    }

    const nuevaVersion: PresupuestoVersion = {
      id: `PRE_${Date.now()}`,
      campana_id: selectedCampanaId,
      nombre: newVersionNombre.trim(),
      version: newVersionTipo,
      es_base_comparacion: false,
      fecha_creacion: new Date().toISOString().split('T')[0],
      creado_por: currentUser?.usuario || 'usuario',
      criterio_utilizado: newVersionCriterio,
      observaciones: newVersionObs.trim(),
      cabezas_previstas: versionActiva?.cabezas_previstas || 150,
      kg_venta_previstos: versionActiva?.kg_venta_previstos || 15000,
      items: itemsIniciales
    };

    if (!db.Presupuestos) db.Presupuestos = [];
    db.Presupuestos.push(nuevaVersion);
    await onSaveRecord('Presupuestos' as any, db.Presupuestos);

    setSelectedVersionId(nuevaVersion.id);
    setShowNewVersionModal(false);
    setNewVersionNombre('');
    setNewVersionObs('');
  };

  // Agregar ítem presupuestario
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionActiva || !itemConcepto.trim()) return;

    const importe = itemCantidad * itemPrecio;
    const nuevoItem: PresupuestoItem = {
      id: `IT_${Date.now()}`,
      presupuesto_id: versionActiva.id,
      concepto: itemConcepto.trim(),
      tipo: itemTipo,
      rubro: itemRubro,
      cantidad_prevista: itemCantidad,
      um: itemUm,
      precio_unitario_previsto: itemPrecio,
      importe_presupuestado: importe
    };

    if (!versionActiva.items) versionActiva.items = [];
    versionActiva.items.push(nuevoItem);

    await onSaveRecord('Presupuestos' as any, db.Presupuestos);
    setShowItemModal(false);
    setItemConcepto('');
  };

  // Cargar base con referencias históricas reales de Pozo del Carril
  const handleCargarReferenciasReales = async () => {
    if (!confirm('¿Desea formular los rubros de costo alimenticio y de granja a partir de los registros históricos reales de Pozo del Carril?')) {
      return;
    }
    if (!versionActiva) return;

    // Basado en ICA 3:1 real, 34 cerdas base y 70 partos confirmados
    const itemsReales: PresupuestoItem[] = [
      {
        id: `IT_REAL_01_${Date.now()}`,
        presupuesto_id: versionActiva.id,
        concepto: 'Ventas de Capones terminados (150 cabezas x 100 kg vivo)',
        tipo: 'INGRESO',
        rubro: 'Ventas Capones',
        cantidad_prevista: 15000,
        um: 'kg',
        precio_unitario_previsto: 1720,
        importe_presupuestado: 25800000
      },
      {
        id: `IT_REAL_02_${Date.now()}`,
        presupuesto_id: versionActiva.id,
        concepto: 'Maíz propio de agricultura (Consumo ICA 3:1)',
        tipo: 'COSTO',
        rubro: 'Alimentación - Maíz',
        cantidad_prevista: 36000,
        um: 'kg',
        precio_unitario_previsto: 288.88,
        importe_presupuestado: 10400000
      },
      {
        id: `IT_REAL_03_${Date.now()}`,
        presupuesto_id: versionActiva.id,
        concepto: 'Concentrado proteico / Pellet de soja (40% PB)',
        tipo: 'COSTO',
        rubro: 'Alimentación - Pellets',
        cantidad_prevista: 9000,
        um: 'kg',
        precio_unitario_previsto: 540,
        importe_presupuestado: 4860000
      },
      {
        id: `IT_REAL_04_${Date.now()}`,
        presupuesto_id: versionActiva.id,
        concepto: 'Alimento Peleteado Iniciador Fases 1 y 2 Destete',
        tipo: 'COSTO',
        rubro: 'Alimentación - Peleteado',
        cantidad_prevista: 2600,
        um: 'kg',
        precio_unitario_previsto: 780,
        importe_presupuestado: 2028000
      },
      {
        id: `IT_REAL_05_${Date.now()}`,
        presupuesto_id: versionActiva.id,
        concepto: 'Plan Sanitario y Vacunas Porcinas',
        tipo: 'COSTO',
        rubro: 'Sanidad',
        cantidad_prevista: 150,
        um: 'cab',
        precio_unitario_previsto: 3200,
        importe_presupuestado: 480000
      },
      {
        id: `IT_REAL_06_${Date.now()}`,
        presupuesto_id: versionActiva.id,
        concepto: 'Mano de Obra Directa de Granja (Asignación ciclo)',
        tipo: 'COSTO',
        rubro: 'Mano de Obra',
        cantidad_prevista: 6,
        um: 'meses',
        precio_unitario_previsto: 600000,
        importe_presupuestado: 3600000
      }
    ];

    versionActiva.items = itemsReales;
    versionActiva.criterio_utilizado = 'Referencias históricas reales (FCE UNRC - Grupo 2)';
    await onSaveRecord('Presupuestos' as any, db.Presupuestos);
  };

  // Filtrar matriz
  const itemsFiltrados = useMemo(() => {
    return comparativaMatriz.filter(m => {
      if (filtroTipo !== 'TODOS' && m.item.tipo !== filtroTipo) return false;
      return true;
    });
  }, [comparativaMatriz, filtroTipo]);

  return (
    <div className="space-y-6 font-sans">
      {/* =====================================================================
          ENCABEZADO DE PRESUPUESTO Y DESVÍOS (Requerimiento 7)
      ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#143422] tracking-tight">
              PRESUPUESTO Y DESVÍOS
            </h2>
            <span className="text-xs font-semibold text-[#1b5c34] bg-[#edf7f0] px-2.5 py-0.5 rounded-full border border-[#cbe5d3]">
              Planificación Operativa & Control de Gestión
            </span>
            <span className="text-[10px] font-mono font-bold text-[#8c5717] bg-[#fdf5eb] px-2 py-0.5 rounded border border-[#f4dfb6]">
              Vinculado a Indicador F5
            </span>
          </div>
          <p className="text-xs text-[#5c7767] mt-0.5">
            Formulación por campaña y lote, matriz comparativa Presupuestado vs. Real, control de desvíos y gestión de versiones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Selector de Campaña */}
          <div className="flex items-center gap-1.5 bg-[#f4f8f4] border border-[#c9dacc] px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#1c4b31]" />
            <select
              value={selectedCampanaId}
              onChange={(e) => setSelectedCampanaId(e.target.value)}
              className="bg-transparent border-none font-bold text-[#153422] outline-none cursor-pointer"
            >
              {db.D_Campana.map(camp => (
                <option key={camp.id} value={camp.id}>
                  {camp.nombre}
                </option>
              ))}
            </select>
          </div>

          {!permissions.isReadOnly && (
            <button
              onClick={() => setShowNewVersionModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1c4b31] hover:bg-[#123823] text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer border border-[#163c26]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Versión</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Versión y Base de Comparación */}
      <div className="bg-white p-4.5 rounded-2xl border border-[#d8e2d7] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5ede5] pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#143422]">Versión Activa:</span>
            <div className="flex items-center gap-1.5">
              {presupuestosCampana.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedVersionId(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    versionActiva?.id === p.id
                      ? 'bg-[#1c4b31] text-white shadow-xs'
                      : 'bg-[#f4f7f4] text-[#4d6b58] hover:bg-[#eaf2eb] border border-[#d2dfd4]'
                  }`}
                >
                  <span>{p.nombre} ({p.version})</span>
                  {p.es_base_comparacion && (
                    <span className="w-2 h-2 rounded-full bg-[#34d399]" title="Base de comparación actual" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {versionActiva && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {versionActiva.es_base_comparacion ? (
                <span className="text-[11px] font-bold text-[#15803d] bg-[#eaf5ed] border border-[#b8dfc4] px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Base Oficial de Comparación (Alimenta F5)</span>
                </span>
              ) : (
                permissions.canConfirm('presupuesto') && (
                  <button
                    onClick={() => handleSetBaseComparacion(versionActiva.id)}
                    className="text-xs font-bold text-[#8c5717] bg-[#fdf5eb] hover:bg-[#faecd7] border border-[#f4dfb6] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Fijar como Base de Comparación
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Metadatos de la Versión Activa */}
        {versionActiva && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#557361] pt-1">
            <div>
              <span className="text-[#7c9686] block">Criterio Utilizado:</span>
              <strong className="text-[#143422]">{versionActiva.criterio_utilizado}</strong>
            </div>
            <div>
              <span className="text-[#7c9686] block">Fecha Creación / Aprobación:</span>
              <strong className="text-[#143422]">{versionActiva.fecha_creacion} (por {versionActiva.creado_por})</strong>
            </div>
            <div>
              <span className="text-[#7c9686] block">Observaciones:</span>
              <span className="text-[#143422] italic">{versionActiva.observaciones || 'Sin notas adicionales.'}</span>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          TARJETAS KPI RESUMEN: PRESUPUESTADO VS REAL
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ingresos */}
        <div className="bg-white p-4.5 rounded-xl border border-[#d8e2d7] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#557361]">
            <span className="font-semibold">Ingresos Totales</span>
            <DollarSign className="w-4 h-4 text-[#1c4b31]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-[#143422]">
              {formatMoney(totales.ingReal)} <span className="text-xs text-[#6b8273] font-normal">Real</span>
            </div>
            <div className="text-xs text-[#557361] mt-1 font-mono">
              Presupuestado: <strong>{formatMoney(totales.ingPre)}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-[#edf2ec] text-[11px] flex justify-between">
            <span className="text-[#557361]">Desvío Ventas:</span>
            <span className={`font-mono font-bold ${totales.ingReal >= totales.ingPre ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
              {totales.ingReal >= totales.ingPre ? '+' : ''}{formatMoney(totales.ingReal - totales.ingPre)}
            </span>
          </div>
        </div>

        {/* 2. Costos Totales */}
        <div className="bg-white p-4.5 rounded-xl border border-[#d8e2d7] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#557361]">
            <span className="font-semibold">Costos Totales</span>
            <Scale className="w-4 h-4 text-[#8c5717]" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-[#143422]">
              {formatMoney(totales.cosReal)} <span className="text-xs text-[#6b8273] font-normal">Real</span>
            </div>
            <div className="text-xs text-[#557361] mt-1 font-mono">
              Presupuestado: <strong>{formatMoney(totales.cosPre)}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-[#edf2ec] text-[11px] flex justify-between">
            <span className="text-[#557361]">Desvío Costos:</span>
            <span className={`font-mono font-bold ${totales.cosReal <= totales.cosPre ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
              {totales.cosReal <= totales.cosPre ? 'Ahorro ' : 'Sobrecosto '}{formatMoney(Math.abs(totales.desvioCostosAbs))}
            </span>
          </div>
        </div>

        {/* 3. Margen Bruto */}
        <div className="bg-white p-4.5 rounded-xl border border-[#d8e2d7] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#557361]">
            <span className="font-semibold">Margen Bruto</span>
            <TrendingUp className="w-4 h-4 text-[#1c4b31]" />
          </div>
          <div>
            <div className={`text-xl font-bold font-mono ${totales.margenReal >= 0 ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
              {formatMoney(totales.margenReal)} <span className="text-xs text-[#6b8273] font-normal">Real</span>
            </div>
            <div className="text-xs text-[#557361] mt-1 font-mono">
              Presupuestado: <strong>{formatMoney(totales.margenPre)}</strong>
            </div>
          </div>
          <div className="pt-2 border-t border-[#edf2ec] text-[11px] flex justify-between">
            <span className="text-[#557361]">Diferencia Margen:</span>
            <span className={`font-mono font-bold ${totales.margenReal >= totales.margenPre ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
              {formatMoney(totales.margenReal - totales.margenPre)}
            </span>
          </div>
        </div>

        {/* 4. Desvío Presupuestario Global (Indicador F5) */}
        <div className="bg-white p-4.5 rounded-xl border border-[#d8e2d7] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#557361]">
            <span className="font-semibold">Indicador F5 (Desvío %)</span>
            <span className="text-[10px] font-mono font-bold text-[#1c4b31] bg-[#edf7f0] px-1.5 py-0.5 rounded border border-[#cbe5d3]">
              [-5%, +5%]
            </span>
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${
              totales.desvioCostosPct !== null && Math.abs(totales.desvioCostosPct) <= 5 
                ? 'text-[#15803d]' 
                : 'text-[#b91c1c]'
            }`}>
              {totales.desvioCostosPct !== null ? `${totales.desvioCostosPct > 0 ? '+' : ''}${totales.desvioCostosPct.toFixed(1)}%` : 'No calculable'}
            </div>
            <div className="text-[11px] text-[#557361] mt-1">
              {totales.desvioCostosPct !== null && Math.abs(totales.desvioCostosPct) <= 5 
                ? 'Dentro de tolerancia presupuestaria' 
                : 'Desvío fuera de rango'}
            </div>
          </div>
          <div className="pt-2 border-t border-[#edf2ec] text-[10px] text-[#718a7a]">
            Semáforo automático vinculado al CMI
          </div>
        </div>
      </div>

      {/* =====================================================================
          TABLA COMPARATIVA DETALLADA POR CONCEPTO (Requerimiento 7)
      ===================================================================== */}
      <div className="bg-white rounded-2xl border border-[#d8e2d7] shadow-2xs overflow-hidden">
        <div className="p-4.5 border-b border-[#e5ede5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#143422] tracking-tight">
              Matriz Comparativa por Concepto & Rubro
            </h3>
            <p className="text-xs text-[#5c7767]">
              Fórmulas: Desvío absoluto = Real − Presupuestado | Desvío % = (Real − Presupuestado) / Presupuestado × 100
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtros Tipo */}
            <div className="flex items-center bg-[#f4f7f4] border border-[#d2dfd4] rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setFiltroTipo('TODOS')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filtroTipo === 'TODOS' ? 'bg-[#1c4b31] text-white shadow-xs' : 'text-[#486653]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroTipo('COSTO')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filtroTipo === 'COSTO' ? 'bg-[#1c4b31] text-white shadow-xs' : 'text-[#486653]'
                }`}
              >
                Costos
              </button>
              <button
                onClick={() => setFiltroTipo('INGRESO')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filtroTipo === 'INGRESO' ? 'bg-[#1c4b31] text-white shadow-xs' : 'text-[#486653]'
                }`}
              >
                Ingresos
              </button>
            </div>

            {!permissions.isReadOnly && (
              <>
                <button
                  onClick={() => setShowItemModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eaf4ec] hover:bg-[#dfeee2] text-[#1c4b31] border border-[#b8dfc4] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Concepto</span>
                </button>

                <button
                  onClick={handleCargarReferenciasReales}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fdf6ec] hover:bg-[#faecd7] text-[#8c5717] border border-[#f5dcba] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  title="Cargar referencias históricas reales como base presupuestaria"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cargar Ref. Históricas Reales</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabla Responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f7faf7] text-[#4d6b58] font-bold uppercase tracking-wider text-[10px] border-b border-[#e2ece2]">
              <tr>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Rubro</th>
                <th className="px-4 py-3 text-right">Presupuestado</th>
                <th className="px-4 py-3 text-right">Real Ejecutado</th>
                <th className="px-4 py-3 text-right">Desvío Absoluto</th>
                <th className="px-4 py-3 text-right">Desvío %</th>
                <th className="px-4 py-3 text-center">Evaluación Económica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ed]">
              {itemsFiltrados.length > 0 ? (
                itemsFiltrados.map(({ item, presupuestado, real, desvioAbsoluto, desvioPctStr, esFavorable, textoEvaluacion, claseColor }) => (
                  <tr key={item.id} className="hover:bg-[#fbfdfb] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#143422]">
                      {item.concepto}
                      {item.cantidad_prevista && (
                        <span className="block text-[10px] text-[#718a7a] font-normal font-mono">
                          Previsto: {item.cantidad_prevista.toLocaleString('es-AR')} {item.um} a ${item.precio_unitario_previsto}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-[#f0f5f1] text-[#2c553d] font-medium border border-[#d2dfd4] text-[11px]">
                        {item.rubro}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#143422]">
                      {formatMoney(presupuestado)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#143422]">
                      {formatMoney(real)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      <span className={item.tipo === 'COSTO' 
                        ? (desvioAbsoluto <= 0 ? 'text-[#15803d]' : 'text-[#b91c1c]')
                        : (desvioAbsoluto >= 0 ? 'text-[#15803d]' : 'text-[#b91c1c]')
                      }>
                        {desvioAbsoluto > 0 ? '+' : ''}{formatMoney(desvioAbsoluto)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      <span className={item.tipo === 'COSTO' 
                        ? (desvioAbsoluto <= 0 ? 'text-[#15803d]' : 'text-[#b91c1c]')
                        : (desvioAbsoluto >= 0 ? 'text-[#15803d]' : 'text-[#b91c1c]')
                      }>
                        {desvioPctStr}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${claseColor}`}>
                        {esFavorable ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{textoEvaluacion}</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#6b8273]">
                    No se han registrado conceptos presupuestarios en esta versión.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVA VERSIÓN DE PRESUPUESTO */}
      {showNewVersionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#d8e2d7] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#1c4b31]" />
                <h3 className="text-base font-bold text-[#153422]">
                  Nueva Versión de Presupuesto
                </h3>
              </div>
              <button
                onClick={() => setShowNewVersionModal(false)}
                className="p-1 text-[#6b8273] hover:text-[#183123] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#234230] mb-1">Nombre de la Versión:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Presupuesto Revisado Q3 - Campaña 2024/2025"
                  value={newVersionNombre}
                  onChange={e => setNewVersionNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#234230] mb-1">Tipo de Versión:</label>
                <select
                  value={newVersionTipo}
                  onChange={(e: any) => setNewVersionTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] outline-none"
                >
                  <option value="REVISADA">Revisada (Ajuste operativo durante el ciclo)</option>
                  <option value="APROBADA">Aprobada (Versión confirmada de directorio/gestión)</option>
                  <option value="ORIGINAL">Original (Línea de base inicial)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#234230] mb-1">Criterio de Formulación:</label>
                <select
                  value={newVersionCriterio}
                  onChange={e => setNewVersionCriterio(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] outline-none"
                >
                  <option value="Hipótesis presupuestaria">Hipótesis presupuestaria técnica</option>
                  <option value="Referencias históricas reales (FCE UNRC - Grupo 2)">Referencias históricas reales verificadas</option>
                  <option value="Ajuste por precios relativos">Ajuste por precios relativos e insumos</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="copiarItems"
                  checked={copiarDesdeVersionActual}
                  onChange={e => setCopiarDesdeVersionActual(e.target.checked)}
                  className="accent-[#1c4b31]"
                />
                <label htmlFor="copiarItems" className="text-xs text-[#2c4c37] cursor-pointer">
                  Copiar conceptos y rubros de la versión activa ({versionActiva?.nombre})
                </label>
              </div>

              <div>
                <label className="block font-semibold text-[#234230] mb-1">Observaciones / Notas:</label>
                <textarea
                  rows={2}
                  value={newVersionObs}
                  onChange={e => setNewVersionObs(e.target.value)}
                  placeholder="Justificación de la nueva versión..."
                  className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e5ede5]">
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#557361] hover:bg-[#edf5ef] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#123823] rounded-xl shadow-2xs cursor-pointer"
                >
                  Guardar Versión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR CONCEPTO PRESUPUESTARIO */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#d8e2d7] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <h3 className="text-base font-bold text-[#153422]">
                Agregar Concepto al Presupuesto
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1 text-[#6b8273] hover:text-[#183123] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#234230] mb-1">Concepto / Partida:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Concentrado proteico etapa engorde"
                  value={itemConcepto}
                  onChange={e => setItemConcepto(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">Tipo:</label>
                  <select
                    value={itemTipo}
                    onChange={(e: any) => setItemTipo(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] outline-none"
                  >
                    <option value="COSTO">Costo Operativo / Directo</option>
                    <option value="INGRESO">Ingreso por Ventas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">Rubro Imputable:</label>
                  <select
                    value={itemRubro}
                    onChange={e => setItemRubro(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] outline-none"
                  >
                    <option value="Alimentación - Maíz">Alimentación - Maíz</option>
                    <option value="Alimentación - Pellets">Alimentación - Pellets</option>
                    <option value="Alimentación - Peleteado">Alimentación - Peleteado</option>
                    <option value="Sanidad">Sanidad e Inseminación</option>
                    <option value="Mano de Obra">Mano de Obra</option>
                    <option value="Energía y Agua">Energía y Agua</option>
                    <option value="Comercialización">Comercialización y Fletes</option>
                    <option value="Mantenimiento">Mantenimiento y Estructura</option>
                    <option value="Ventas Capones">Ventas Capones</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#234230] mb-1">Cantidad Prevista:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemCantidad}
                    onChange={e => setItemCantidad(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">Unidad Medida:</label>
                  <input
                    type="text"
                    required
                    value={itemUm}
                    onChange={e => setItemUm(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#234230] mb-1">Precio Unitario ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={itemPrecio}
                    onChange={e => setItemPrecio(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-[#f9fbf9] font-mono outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#f5f8f5] rounded-xl border border-[#dce7dc] flex justify-between text-xs">
                <span className="font-semibold text-[#557361]">Importe Total Presupuestado:</span>
                <span className="font-mono font-bold text-[#143422]">${(itemCantidad * itemPrecio).toLocaleString('es-AR')}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e5ede5]">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#557361] hover:bg-[#edf5ef] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#123823] rounded-xl shadow-2xs cursor-pointer"
                >
                  Agregar Concepto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
