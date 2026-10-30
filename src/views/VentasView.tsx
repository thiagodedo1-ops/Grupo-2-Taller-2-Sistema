/**
 * @file VentasView.tsx
 * @description Módulo de Ventas de Hacienda con Flete Específico, ROSPORC Histórico Semanal y Descuento Comercial
 * Requerimiento 6:
 * 6.1 Costo de flete ($) imputado a la venta específica y costos de comercialización.
 * 6.2 ROSPORC histórico por semana de la venta: comparación porcentual en UI (verde/rojo/neutral) o 'Referencia no disponible'.
 * 6.3 Descuento comercial con porcentaje editable, importe automático y motivo opcional.
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Check, 
  X, 
  DollarSign, 
  FileText, 
  Download, 
  ArrowRight,
  Truck,
  Building2,
  Scale,
  Sparkles,
  Percent,
  Info,
  Calendar,
  XCircle
} from 'lucide-react';
import { BaseDatosPorcina, MovComercialEnc, MovComercialDet, DespachoTransporte, Usuario } from '../types/schema';
import { DataTable, Column } from '../components/DataTable';
import { StatusTag } from '../components/StatusTag';
import { getRolePermissions } from '../lib/permissions';
import { useCurrency } from '../context/CurrencyContext';
import { rosporcService } from '../lib/rosporcService';
import { RowActions } from '../components/RowActions';
import { RecordDetailModal } from '../components/RecordDetailModal';

interface Props {
  db: BaseDatosPorcina;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  onConfirmRecord: (table: keyof BaseDatosPorcina, id: string) => Promise<any>;
  onCancelRecord: (table: keyof BaseDatosPorcina, id: string, motivo: string) => Promise<any>;
  onExportCsv: (table: keyof BaseDatosPorcina) => void;
  currentUser?: Usuario | null;
}

export const VentasView: React.FC<Props> = ({
  db,
  onSaveRecord,
  onConfirmRecord,
  onCancelRecord,
  onExportCsv,
  currentUser = null
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney, symbol } = useCurrency();

  const refRosporcVigente = rosporcService.getReferenciaVigente('Capón General');

  const [editingVentaId, setEditingVentaId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<{ record: any; tableName: string; unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS'; title: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [formEnc, setFormEnc] = useState({
    tipo_comprobante_id: 'TC_LIQ_SENASA',
    punto_venta: '0001',
    numero_comprobante: '',
    fecha: new Date().toISOString().split('T')[0],
    cliente_id: db.Clientes[0]?.id || '',
    subunidad_id: 'SUB_ENGORDE_TERM',
    categoria_senasa_id: 'CAT_CAPON',
    campana_id: db.D_Campana.find(c => c.estado === 'Abierto')?.id || 'CAMP_2024_2025',
    cantidad_animales: 70,
    kg: 7000,
    precio_unitario_real: refRosporcVigente.precio_kg_vivo,
    alicuota_iva: 10.5,
    // 6.1 Flete específico de la venta
    costo_flete: 0,
    // 6.3 Descuento comercial
    descuento_comercial_pct: 0,
    descuento_comercial_motivo: '',
    total_percepciones: 0,
    total_retenciones: 0,
    // C2: Despacho y Transporte a frigorífico
    cabezas_muertas_transporte: 0,
    transportista: 'Transporte Don Pedro · Jaula Doble Piso',
    vehiculo_patente: 'AF 342 KL'
  });

  const handleEditarVenta = (v: MovComercialEnc) => {
    setEditingVentaId(v.id);
    const det = (db.Mov_Comercial_Det || []).find(d => d.mov_comercial_id === v.id);
    setFormEnc({
      tipo_comprobante_id: v.tipo_comprobante_id || 'TC_LIQ_SENASA',
      punto_venta: v.punto_venta || '0001',
      numero_comprobante: v.numero_comprobante || '',
      fecha: v.fecha || new Date().toISOString().split('T')[0],
      cliente_id: v.cliente_id || db.Clientes[0]?.id || '',
      subunidad_id: v.subunidad_id || 'SUB_ENGORDE_TERM',
      categoria_senasa_id: det?.categoria_senasa_id || 'CAT_CAPON',
      campana_id: db.D_Campana.find(c => c.estado === 'Abierto')?.id || 'CAMP_2024_2025',
      cantidad_animales: Number(det?.cantidad_animales) || 70,
      kg: Number(det?.kg) || 7000,
      precio_unitario_real: Number(det?.precio_unitario_real) || refRosporcVigente.precio_kg_vivo,
      alicuota_iva: Number(det?.alicuota_iva) || 10.5,
      costo_flete: Number(v.costo_flete) || 0,
      descuento_comercial_pct: Number(v.descuento_comercial_pct) || 0,
      descuento_comercial_motivo: v.descuento_comercial_motivo || '',
      total_percepciones: Number(v.total_percepciones) || 0,
      total_retenciones: Number(v.total_retenciones) || 0,
      cabezas_muertas_transporte: Number(det?.cabezas_muertas_transporte) || 0,
      transportista: 'Transporte Don Pedro · Jaula Doble Piso',
      vehiculo_patente: 'AF 342 KL'
    });
    setShowModal(true);
  };

  // Cotización histórica de ROSPORC correspondiente a la semana de la fecha de la venta en el formulario
  const refRosporcAFechaForm = useMemo(() => {
    return rosporcService.getReferenciaAFecha(formEnc.fecha, 'Capón General');
  }, [formEnc.fecha]);

  // Cálculos comerciales automáticos
  const baseBruta = (Number(formEnc.kg) || 0) * (Number(formEnc.precio_unitario_real) || 0);
  const pctDescuento = Math.min(100, Math.max(0, Number(formEnc.descuento_comercial_pct) || 0));
  const importeDescuento = (baseBruta * pctDescuento) / 100;
  const ingresoNetoComercial = Math.max(0, baseBruta - importeDescuento);
  const totalIva = ingresoNetoComercial * ((Number(formEnc.alicuota_iva) || 0) / 100);
  const fleteVenta = Math.max(0, Number(formEnc.costo_flete) || 0);
  
  // Total a liquidar / percibir por la granja (neto + IVA + percepciones - retenciones - flete si está a cargo)
  const totalFinal = ingresoNetoComercial + totalIva + Number(formEnc.total_percepciones || 0) - Number(formEnc.total_retenciones || 0);

  // Cálculo del desvío en tiempo real respecto a ROSPORC de la semana
  const desvioRosporcSemanal = useMemo(() => {
    if (!refRosporcAFechaForm) return null;
    return rosporcService.calcularDesvio(
      Number(formEnc.precio_unitario_real) || 0,
      refRosporcAFechaForm.precio_kg_vivo
    );
  }, [formEnc.precio_unitario_real, refRosporcAFechaForm]);

  const handleAplicarPrecioRosporc = () => {
    if (refRosporcAFechaForm) {
      setFormEnc(prev => ({
        ...prev,
        precio_unitario_real: refRosporcAFechaForm.precio_kg_vivo
      }));
    } else {
      setFormEnc(prev => ({
        ...prev,
        precio_unitario_real: refRosporcVigente.precio_kg_vivo
      }));
    }
  };

  const handleGuardarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEnc.numero_comprobante.trim()) {
      alert('Debe ingresar el número de comprobante o DTe');
      return;
    }

    if (!formEnc.cliente_id) {
      alert('Debe seleccionar el cliente / frigorífico');
      return;
    }

    if (pctDescuento < 0 || pctDescuento > 100) {
      alert('El porcentaje de descuento comercial debe estar entre 0% y 100%');
      return;
    }

    if (fleteVenta < 0) {
      alert('El costo de flete no puede ser negativo');
      return;
    }

    // Guardar referencia histórica exacta de la semana de la venta para trazabilidad
    const precioRosporcHistorico = refRosporcAFechaForm?.precio_kg_vivo || null;
    const semanaRosporcVigencia = refRosporcAFechaForm?.semana || null;
    const fuenteRosporc = refRosporcAFechaForm?.fuente || 'https://rosporc.bcr.com.ar/';
    const desvioPctCalculado = precioRosporcHistorico 
      ? Number((((Number(formEnc.precio_unitario_real) - precioRosporcHistorico) / precioRosporcHistorico) * 100).toFixed(2))
      : undefined;

    // 1. Guardar encabezado comercial (Mov_Comercial_Enc)
    const nuevoEnc: Partial<MovComercialEnc> = {
      ...(editingVentaId ? { id: editingVentaId } : {}),
      tipo_comprobante_id: formEnc.tipo_comprobante_id,
      punto_venta: formEnc.punto_venta,
      numero_comprobante: formEnc.numero_comprobante,
      fecha: formEnc.fecha,
      cliente_id: formEnc.cliente_id,
      tipo_operacion: 'VENTA',
      unidad_neg_id: 'UN_PORCINA',
      subunidad_id: formEnc.subunidad_id,
      campana_id: formEnc.campana_id,
      costo_flete: fleteVenta,
      descuento_comercial_pct: pctDescuento,
      descuento_comercial_importe: importeDescuento,
      descuento_comercial_motivo: formEnc.descuento_comercial_motivo.trim() || undefined,
      rosporc_precio_historico: precioRosporcHistorico || undefined,
      rosporc_semana_vigencia: semanaRosporcVigencia || undefined,
      rosporc_fuente: fuenteRosporc,
      rosporc_desvio_pct: desvioPctCalculado,
      total_neto: ingresoNetoComercial,
      total_iva: totalIva,
      total_percepciones: Number(formEnc.total_percepciones) || 0,
      total_retenciones: Number(formEnc.total_retenciones) || 0,
      total_final: totalFinal,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      creado_por: currentUser?.usuario || 'usuario',
      fecha_creacion: new Date().toISOString().split('T')[0],
      fecha_confirmacion: new Date().toISOString().split('T')[0]
    };

    const resEnc = await onSaveRecord('Mov_Comercial_Enc', nuevoEnc);
    if (!resEnc.success) {
      alert('Error al guardar venta: ' + resEnc.error);
      return;
    }

    const encId = resEnc.record.id;

    // 2. Guardar detalle con ROSPORC histórico, flete y descuento (Mov_Comercial_Det)
    const nuevoDet: Partial<MovComercialDet> = {
      mov_comercial_id: encId,
      numero_linea: 1,
      producto_id: formEnc.categoria_senasa_id === 'CAT_CAPON' ? 'PROD_CAPON_TERM' : 'PROD_LECHON_VIVO',
      categoria_senasa_id: formEnc.categoria_senasa_id,
      cantidad_animales: Number(formEnc.cantidad_animales),
      kg: Number(formEnc.kg),
      precio_unitario_real: Number(formEnc.precio_unitario_real),
      precio_sugerido_rosporc: precioRosporcHistorico || undefined,
      desvio_precio_rosporc: desvioPctCalculado,
      costo_flete: fleteVenta,
      descuento_comercial_pct: pctDescuento,
      descuento_comercial_importe: importeDescuento,
      cabezas_muertas_transporte: Number(formEnc.cabezas_muertas_transporte) || 0,
      importe_neto: ingresoNetoComercial,
      alicuota_iva: Number(formEnc.alicuota_iva),
      importe_iva: totalIva,
      destino_productivo_id: formEnc.subunidad_id
    };
    await onSaveRecord('Mov_Comercial_Det', nuevoDet);

    // 3. Registrar costo de flete en F_Costos si existe
    if (fleteVenta > 0) {
      await onSaveRecord('F_Costos', {
        id: `CST_FLETE_${Date.now()}`,
        fecha: formEnc.fecha,
        cuenta_id: 'CTA_ESTRUCTURA_GRAL',
        unidad_neg_id: 'UN_PORCINA',
        subunidad_id: formEnc.subunidad_id,
        comprobante_id: encId,
        origen_costo: 'CONSUMO',
        importe_neto: fleteVenta,
        estado: 'Confirmado',
        origen_dato: 'REAL',
        estado_validacion: 'OK',
        observacion_validacion: `Flete de comercialización venta ${formEnc.numero_comprobante} (${formEnc.transportista})`
      });
    }

    // 4. Registrar despacho de transporte a frigorífico (Indicador C2)
    const clienteNombre = db.Clientes.find(c => c.id === formEnc.cliente_id)?.razon_social || 'Frigorífico';
    const nuevoDespacho: DespachoTransporte = {
      id: `DESP_${Date.now()}`,
      mov_comercial_id: encId,
      fecha: formEnc.fecha,
      cabezas_despachadas: Number(formEnc.cantidad_animales),
      cabezas_muertas_llegada: Number(formEnc.cabezas_muertas_transporte) || 0,
      frigorifico: clienteNombre,
      transportista: formEnc.transportista,
      vehiculo_patente: formEnc.vehiculo_patente,
      origen_dato: 'REAL',
      estado: 'Confirmado',
      observaciones: `Despacho vinculado a liq. ${formEnc.numero_comprobante}. Flete: $${fleteVenta.toLocaleString('es-AR')}`
    };

    if (!db.Despachos_Transporte) {
      db.Despachos_Transporte = [];
    }
    await onSaveRecord('Despachos_Transporte' as any, nuevoDespacho);

    setShowModal(false);
  };

  const ventas = db.Mov_Comercial_Enc.filter(m => m.tipo_operacion === 'VENTA');

  const columns: Column<MovComercialEnc>[] = [
    { key: 'fecha', header: 'Fecha' },
    { 
      key: 'comprobante', 
      header: 'Comprobante / DTe',
      render: (v) => `${v.tipo_comprobante_id.replace('TC_', '')} ${v.punto_venta}-${v.numero_comprobante}`
    },
    { 
      key: 'cliente_id', 
      header: 'Cliente / Frigorífico',
      render: (v) => {
        const cli = db.Clientes.find(c => c.id === v.cliente_id);
        return <span className="font-semibold text-[#183123]">{cli ? cli.razon_social : v.cliente_id}</span>;
      }
    },
    {
      key: 'volumen',
      header: 'Kilos / Cabezas',
      align: 'right',
      render: (v) => {
        const det = db.Mov_Comercial_Det.find(d => d.mov_comercial_id === v.id);
        return (
          <span className="font-mono text-xs">
            {det ? `${det.kg?.toLocaleString('es-AR')} kg (${det.cantidad_animales} cab.)` : '-'}
          </span>
        );
      }
    },
    {
      key: 'precio_efectivo',
      header: 'Precio $/kg',
      align: 'right',
      render: (v) => {
        const det = db.Mov_Comercial_Det.find(d => d.mov_comercial_id === v.id);
        return (
          <span className="font-mono font-bold text-xs text-[#183123]">
            {det?.precio_unitario_real ? `$ ${det.precio_unitario_real.toFixed(2)}` : '—'}
          </span>
        );
      }
    },
    // =========================================================================
    // 6.2 ROSPORC HISTÓRICO ESPECÍFICO DE LA SEMANA DE LA VENTA
    // Mostrar SOLO el resultado porcentual en UI (verde/rojo/neutral)
    // O 'Referencia no disponible' si no existe publicación histórica para esa fecha.
    // =========================================================================
    {
      key: 'precio_vs_rosporc',
      header: '$/kg vs ROSPORC',
      align: 'right',
      render: (v) => {
        const det = db.Mov_Comercial_Det.find(d => d.mov_comercial_id === v.id);
        if (!det || !det.precio_unitario_real) return <span className="text-[#849a8d]">—</span>;

        // Buscar cotización ROSPORC oficial de la semana en que ocurrió ESA venta
        const refHistorica = v.rosporc_precio_historico 
          ? { precio_kg_vivo: v.rosporc_precio_historico, semana: v.rosporc_semana_vigencia || 'Semana histórica', fuente: v.rosporc_fuente }
          : rosporcService.getReferenciaAFecha(v.fecha, 'Capón General');

        if (!refHistorica || !refHistorica.precio_kg_vivo) {
          return (
            <span className="text-[11px] font-medium text-[#7d9385] italic" title="No existe cotización semanal registrada en la fecha de la venta">
              Referencia no disponible
            </span>
          );
        }

        const precioReal = det.precio_unitario_real;
        const precioRosporcHistorico = refHistorica.precio_kg_vivo;
        // Fórmula interna: (precio efectivo por kg - precio ROSPORC aplicable por kg) / precio ROSPORC aplicable por kg * 100
        const difPct = ((precioReal - precioRosporcHistorico) / precioRosporcHistorico) * 100;
        const difAbs = precioReal - precioRosporcHistorico;

        let badgeClass = 'text-[#5a7465] bg-[#edf2ee] border-[#d4ded6]'; // Neutral
        let signo = '';
        if (difPct > 0.001) {
          badgeClass = 'text-[#166534] bg-[#edf8f1] border-[#bbf0cb]'; // Verde (favorable)
          signo = '+';
        } else if (difPct < -0.001) {
          badgeClass = 'text-[#991b1b] bg-[#fef2f2] border-[#fecaca]'; // Rojo (desfavorable)
        }

        return (
          <div className="flex flex-col items-end">
            <span 
              className={`font-mono font-bold text-xs px-2 py-0.5 rounded border inline-flex items-center gap-1 ${badgeClass}`}
              title={`Precio real: $${precioReal.toFixed(2)}/kg vs ROSPORC histórico semana: $${precioRosporcHistorico.toFixed(2)}/kg (${signo}$${difAbs.toFixed(2)}/kg). Fuente: ${refHistorica.fuente || 'https://rosporc.bcr.com.ar/'}`}
            >
              <span>{signo}{difPct.toFixed(2)}%</span>
            </span>
            <span className="text-[9px] text-[#789182] font-mono mt-0.5" title={`Semana histórica: ${refHistorica.semana}`}>
              ROSPORC {refHistorica.semana.split('·')[0].trim()}
            </span>
          </div>
        );
      }
    },
    // =========================================================================
    // 6.3 DESCUENTO COMERCIAL Y FLETE ESPECÍFICO DE LA VENTA
    // =========================================================================
    {
      key: 'descuento_comercial',
      header: 'Desc. Comercial',
      align: 'right',
      render: (v) => {
        const pct = v.descuento_comercial_pct ?? 0;
        const imp = v.descuento_comercial_importe ?? 0;
        if (pct === 0 && imp === 0) return <span className="text-[#8ca293]">—</span>;
        return (
          <div className="flex flex-col items-end text-xs">
            <span className="font-mono text-[#a23d18] font-bold">
              -{pct}% (${imp.toLocaleString('es-AR')})
            </span>
            {v.descuento_comercial_motivo && (
              <span className="text-[9px] text-[#86593a] truncate max-w-[120px]" title={v.descuento_comercial_motivo}>
                {v.descuento_comercial_motivo}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'costo_flete',
      header: 'Flete Específico',
      align: 'right',
      render: (v) => {
        const flete = v.costo_flete ?? 0;
        if (flete === 0) return <span className="text-[#8ca293]">—</span>;
        return (
          <span className="font-mono text-xs font-semibold text-[#1e442d]">
            ${flete.toLocaleString('es-AR')}
          </span>
        );
      }
    },
    { 
      key: 'total_neto', 
      header: 'Neto Comercial', 
      align: 'right',
      render: (v) => <span className="font-mono text-xs">{formatMoney(v.total_neto, v.fecha)}</span>
    },
    { 
      key: 'total_final', 
      header: 'Total Liquidado', 
      align: 'right',
      render: (v) => <strong className="text-[#1c4b31] font-mono text-xs">{formatMoney(v.total_final, v.fecha)}</strong>
    },
    { key: 'estado', header: 'Estado', render: (v) => <StatusTag estado={v.estado} motivo={v.motivo_anulacion} /> },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      render: (v) => (
        <RowActions
          unit="PORCINOS"
          canEdit={permissions.canEdit('ventas')}
          onViewDetail={() => setDetailRecord({ record: v, tableName: 'Mov_Comercial_Enc', unit: 'PORCINOS', title: `LIQUIDACIÓN DE VENTA (${v.numero_comprobante || v.id})` })}
          onEdit={() => handleEditarVenta(v)}
          onCancel={v.estado !== 'Anulado' ? () => {
            const motivo = prompt('Motivo formal de anulación de la venta:');
            if (motivo) onCancelRecord('Mov_Comercial_Enc', v.id, motivo);
          } : undefined}
        />
      )
    }
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* Banner de Modo Solo Lectura para Auditor */}
      {permissions.isReadOnly && (
        <div className="bg-[#edf3f8] border border-[#c4d6e5] text-[#1e4260] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
          <span><strong>Rango Auditor Porcino:</strong> Modo de solo lectura activo. Consulta de liquidaciones y ventas de hacienda.</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#c5dcf0] text-[#1b3d59] border border-[#b2d0ea]">Solo Lectura</span>
        </div>
      )}

      {/* Encabezado con Botón Nueva Venta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#143422] tracking-tight">
              Módulo de Ventas de Hacienda & Despachos
            </h2>
            <span className="text-[10px] font-mono text-[#255e39] bg-[#edf6f0] px-2 py-0.2 rounded border border-[#cbe3d2]">
              Comercialización Porcina
            </span>
          </div>
          <p className="text-xs text-[#5c7767] mt-0.5">
            Liquidaciones DTe, flete específico por operación, descuento comercial e imputación histórica ROSPORC.
          </p>
        </div>

        {!permissions.isReadOnly && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1d4c32] hover:bg-[#153e27] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto cursor-pointer border border-[#163c26]"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Venta de Hacienda</span>
          </button>
        )}
      </div>

      {/* Cotización ROSPORC Oficial Vigente de Referencia */}
      <div className="bg-gradient-to-r from-[#eef7f1] to-white p-4 rounded-xl border border-[#c3decb] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1c4b31] flex items-center justify-center text-white shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5 text-[#86efac]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#143522] uppercase tracking-wider">
                Referencia Oficial ROSPORC · Bolsa de Comercio de Rosario
              </span>
              <span className="text-[10px] font-mono font-bold text-[#15803d] bg-white px-2 py-0.5 rounded border border-[#b8dfc4]">
                {refRosporcVigente.semana}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-[#143522]">
                $ {refRosporcVigente.precio_kg_vivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[#557361] font-semibold">/ kg vivo ({refRosporcVigente.categoria})</span>
              {refRosporcVigente.variacion_semanal_pct !== undefined && (
                <span className="text-xs font-bold text-[#15803d]">
                  (+{refRosporcVigente.variacion_semanal_pct}%)
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#5c7767] mt-0.5">
              Fuente oficial: <a href="https://rosporc.bcr.com.ar" target="_blank" rel="noopener noreferrer" className="underline font-medium text-[#1c4b31]">https://rosporc.bcr.com.ar</a> · Actualizado: {refRosporcVigente.fecha_actualizacion}
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-[#486653] border-t md:border-t-0 md:border-l border-[#c8e2ce] pt-2 md:pt-0 md:pl-4">
          <span className="block font-semibold text-[#183123]">Criterio Zootécnico & Comercial:</span>
          <span>ROSPORC propone el precio sugerido según la semana de la venta. El precio real confirmado siempre prevalece.</span>
        </div>
      </div>

      {/* Tabla de Liquidaciones Registradas */}
      <DataTable
        data={ventas}
        columns={columns}
        title="Libro de Liquidaciones Comerciales y DTe SENASA"
        subtitle="Movimientos de venta con flete discriminado, descuento comercial y porcentaje vs ROSPORC histórico de la semana"
        onExportCsv={() => onExportCsv('Mov_Comercial_Enc')}
      />

      {/* ======================================================================= */}
      {/* MODAL: REGISTRAR NUEVA VENTA (FLETE, ROSPORC HISTÓRICO Y DESCUENTO)     */}
      {/* ======================================================================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#d8e2d7] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e5ede5] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1c4b31]" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                    Unidad Productiva: Porcinos · Gestión Comercial
                  </div>
                  <h3 className="text-base font-bold text-[#153422]">
                    PORCINOS · REGISTRO DE VENTA DE HACIENDA
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-[#6b8273] hover:text-[#183123] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Referencia ROSPORC Semanal a la Fecha de la Venta */}
            <div className="p-3.5 bg-[#edf7f0] border border-[#b8dfc4] rounded-xl flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-[#153422] block">
                  {refRosporcAFechaForm ? (
                    <>Precio oficial ROSPORC semana: $ {refRosporcAFechaForm.precio_kg_vivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })} / kg vivo</>
                  ) : (
                    <>Referencia no disponible para la fecha seleccionada</>
                  )}
                </span>
                <span className="text-[11px] text-[#5c7767]">
                  {refRosporcAFechaForm 
                    ? `${refRosporcAFechaForm.semana} (${refRosporcAFechaForm.fecha}) · Fuente: https://rosporc.bcr.com.ar`
                    : 'Sin publicación ROSPORC anterior a esta fecha en el histórico.'}
                </span>
              </div>
              {refRosporcAFechaForm && (
                <button
                  type="button"
                  onClick={handleAplicarPrecioRosporc}
                  className="px-3 py-1.5 bg-[#1c4b31] hover:bg-[#123823] text-white font-bold rounded-lg text-xs whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  Aplicar sugerido
                </button>
              )}
            </div>

            <form onSubmit={handleGuardarVenta} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Comprobante (*)</label>
                  <select
                    value={formEnc.tipo_comprobante_id}
                    onChange={e => setFormEnc({ ...formEnc, tipo_comprobante_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-white font-semibold"
                  >
                    <option value="TC_LIQ_SENASA">Liq. SENASA / DTe</option>
                    <option value="TC_FAC_A">Factura A</option>
                    <option value="TC_FAC_B">Factura B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Pto Venta (*)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formEnc.punto_venta}
                    onChange={e => setFormEnc({ ...formEnc, punto_venta: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Número DTe / Liq (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="00010992"
                    value={formEnc.numero_comprobante}
                    onChange={e => setFormEnc({ ...formEnc, numero_comprobante: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Fecha de la Operación (*)</label>
                  <input
                    type="date"
                    required
                    value={formEnc.fecha}
                    onChange={e => setFormEnc({ ...formEnc, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-[#63806f] mt-0.5 block">
                    Determina la semana ROSPORC aplicable.
                  </span>
                </div>

                <div>
                  <label className="block text-[#234230] font-semibold mb-1">Cliente / Frigorífico (*)</label>
                  <select
                    required
                    value={formEnc.cliente_id}
                    onChange={e => setFormEnc({ ...formEnc, cliente_id: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-white font-semibold focus:ring-1 focus:ring-[#1f5936]"
                  >
                    <option value="" disabled>Seleccione un cliente...</option>
                    {db.Clientes
                      .filter(c => c.activo !== false || c.id === formEnc.cliente_id)
                      .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.razon_social} (CUIT: {c.cuit}){!c.activo ? ' - [Inactivo]' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-[#edf2ec]">
                <span className="text-[11px] font-bold text-[#183123] uppercase tracking-wider block mb-2">
                  Detalle de Hacienda y Pesaje
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Categoría SENASA (*)</label>
                    <select
                      value={formEnc.categoria_senasa_id}
                      onChange={e => setFormEnc({ ...formEnc, categoria_senasa_id: e.target.value })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-white font-semibold"
                    >
                      {db.Categorias_SENASA.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Campaña Imputable (*)</label>
                    <select
                      value={formEnc.campana_id}
                      onChange={e => setFormEnc({ ...formEnc, campana_id: e.target.value })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs bg-white font-semibold"
                    >
                      {db.D_Campana.map(camp => (
                        <option key={camp.id} value={camp.id}>{camp.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Cabezas Despachadas (*)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formEnc.cantidad_animales}
                      onChange={e => setFormEnc({ ...formEnc, cantidad_animales: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Kilos Balanza (*)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formEnc.kg}
                      onChange={e => setFormEnc({ ...formEnc, kg: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Precio Real $/kg (*)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formEnc.precio_unitario_real}
                      onChange={e => setFormEnc({ ...formEnc, precio_unitario_real: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono font-bold text-[#143522]"
                    />
                  </div>
                </div>

                {/* Diferencia vs ROSPORC de la semana */}
                <div className="mt-2 text-[11px] flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#f9fbf9] border border-[#dce7dc]">
                  <span className="text-[#557361]">Diferencia vs ROSPORC histórico de la semana:</span>
                  {desvioRosporcSemanal ? (
                    <span className={`font-mono font-bold ${desvioRosporcSemanal.esFavorable ? 'text-[#15803d]' : 'text-[#b45309]'}`}>
                      {desvioRosporcSemanal.etiqueta}
                    </span>
                  ) : (
                    <span className="text-[#7d9385] italic">Referencia no disponible</span>
                  )}
                </div>
              </div>

              {/* =============================================================== */}
              {/* 6.3 DESCUENTO COMERCIAL DE LA VENTA                            */}
              {/* =============================================================== */}
              <div className="pt-2 border-t border-[#edf2ec] space-y-2">
                <span className="text-[11px] font-bold text-[#183123] uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#a23d18]" />
                  <span>Descuento Comercial de la Venta</span>
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Porcentaje Descuento (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formEnc.descuento_comercial_pct}
                      onChange={e => setFormEnc({ ...formEnc, descuento_comercial_pct: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono font-bold text-[#a23d18]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Importe Calculado ($)</label>
                    <div className="w-full px-3 py-2 border border-[#dce7dc] rounded-xl text-xs font-mono font-bold text-[#a23d18] bg-[#fdf8f5]">
                      ${importeDescuento.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Motivo / Justificación</label>
                    <input
                      type="text"
                      placeholder="ej. Bonificación por volumen o pronto pago"
                      value={formEnc.descuento_comercial_motivo}
                      onChange={e => setFormEnc({ ...formEnc, descuento_comercial_motivo: e.target.value })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-[#63806f] block">
                  El descuento comercial disminuye el ingreso bruto comercial de la operación una única vez (no se duplica como gasto).
                </span>
              </div>

              {/* =============================================================== */}
              {/* 6.1 FLETE ESPECÍFICO DE LA VENTA Y CONTROL C2                    */}
              {/* =============================================================== */}
              <div className="pt-2 border-t border-[#edf2ec] space-y-2">
                <span className="text-[11px] font-bold text-[#183123] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#1c4b31]" />
                  <span>Flete Específico de la Venta & Transporte (Indicador C2)</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">
                      Costo de Flete ($) *:
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      required
                      placeholder="0"
                      value={formEnc.costo_flete}
                      onChange={e => setFormEnc({ ...formEnc, costo_flete: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono font-bold text-[#143522]"
                    />
                    <span className="text-[10px] text-[#63806f] mt-0.5 block">
                      Imputado a los costos de comercialización de esta venta.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Muertos a la llegada (C2)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formEnc.cabezas_muertas_transporte}
                      onChange={e => setFormEnc({ ...formEnc, cabezas_muertas_transporte: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-bold text-[#b91c1c]"
                    />
                    <span className="text-[10px] text-[#718a7a]">Meta oficial C2: 0%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Empresa Transportista</label>
                    <input
                      type="text"
                      value={formEnc.transportista}
                      onChange={e => setFormEnc({ ...formEnc, transportista: e.target.value })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[#234230] font-semibold mb-1">Patente Jaula</label>
                    <input
                      type="text"
                      value={formEnc.vehiculo_patente}
                      onChange={e => setFormEnc({ ...formEnc, vehiculo_patente: e.target.value })}
                      className="w-full px-3 py-2 border border-[#c8d8ca] rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen de Totales antes de guardar */}
              <div className="p-3.5 bg-[#f5f8f5] border border-[#dce7dc] rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-[#557361]">
                  <span>Valor Bruto Hacienda ({formEnc.kg} kg × ${formEnc.precio_unitario_real}):</span>
                  <span className="font-mono font-semibold">${baseBruta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                {importeDescuento > 0 && (
                  <div className="flex justify-between text-[#a23d18]">
                    <span>Menos Descuento Comercial ({pctDescuento}%):</span>
                    <span className="font-mono font-bold">-${importeDescuento.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#183123] font-semibold border-t border-[#dce7dc] pt-1">
                  <span>Ingreso Neto Comercial:</span>
                  <span className="font-mono font-bold">${ingresoNetoComercial.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[#557361]">
                  <span>IVA Débito Fiscal ({formEnc.alicuota_iva}%):</span>
                  <span className="font-mono font-medium">${totalIva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                {fleteVenta > 0 && (
                  <div className="flex justify-between text-[#245236]">
                    <span>Flete Específico Imputable:</span>
                    <span className="font-mono font-semibold">${fleteVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#143522] border-t border-[#dce7dc] pt-1.5 text-sm">
                  <span>Total Liquidado Final:</span>
                  <span className="font-mono text-[#1c4b31]">${totalFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf2ec]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#557361] hover:bg-[#edf5ef] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#123823] rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Venta & Asentar Despacho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RecordDetailModal
        isOpen={!!detailRecord}
        record={detailRecord?.record}
        tableName={detailRecord?.tableName || ''}
        unit={detailRecord?.unit || 'PORCINOS'}
        title={detailRecord?.title || ''}
        db={db}
        onClose={() => setDetailRecord(null)}
      />
    </div>
  );
};
