/**
 * @file ComprasBovinoView.tsx
 * @description Sub-módulo: Compras & Proveedores Bovinos
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Ubicado en GESTIÓN COMERCIAL.
 * Registro y consulta de compras de insumos ganaderos (rollos, silos, concentrados,
 * vacunas oficiales SENASA, caravanas RFID) y gestión de Transferencias Internas de Maíz Propio UNRC.
 */

import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Check, 
  X, 
  FileText, 
  DollarSign, 
  Search, 
  Filter, 
  Wheat, 
  ShieldCheck, 
  Boxes,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { 
  BaseDatosPorcina, 
  MovComercialEnc, 
  MovComercialDet, 
  TransferenciaInternaGrano, 
  Usuario 
} from '../../types/schema';
import { getRolePermissions } from '../../lib/permissions';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const ComprasBovinoView: React.FC<Props> = ({
  db,
  currentUser,
  onSaveRecord
}) => {
  const { theme } = useTheme();
  const { formatMoney, currency } = useCurrency();
  const permissions = getRolePermissions(currentUser);
  const [showModal, setShowModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Proveedores
  const proveedores = db.Proveedores || [];
  
  // Lista de comprobantes de compras bovinas (compras con unidad_neg_id === 'UN_BOVINOS' o subunidad bovina)
  const comprasBovinas = useMemo(() => {
    return (db.Mov_Comercial_Enc || []).filter(m => 
      m.tipo_operacion === 'COMPRA' && (m.unidad_neg_id === 'UN_BOVINOS' || m.subunidad_id?.startsWith('BOV_'))
    );
  }, [db.Mov_Comercial_Enc]);

  // Transferencias internas de maíz de la UN Agrícola
  const transferenciasMaiz = useMemo(() => {
    return (db.Transferencias_Granos || []).filter(t => t.unidad_destino_id === 'UN_BOVINOS');
  }, [db.Transferencias_Granos]);

  // Formulario de Compra / Transferencia
  const [esTransferenciaInterna, setEsTransferenciaInterna] = useState(false);
  const [formCompra, setFormCompra] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo_comprobante_id: 'TC_FAC_A',
    punto_venta: '0002',
    numero_comprobante: '',
    proveedor_id: proveedores[0]?.id || 'PROV_VET_RIO4',
    subunidad_id: 'BOV_ENGORDE',
    insumo_nombre: 'Rollo Alfalfa 1ra Calidad',
    insumo_categoria: 'Forraje' as 'Forraje' | 'Concentrado' | 'Sanidad' | 'Dispositivo',
    cantidad: 25,
    unidad_medida: 'Rollos',
    precio_unitario: 42000,
    alicuota_iva: 10.5,
    percepciones: 0,
    condicion_pago: 'Cuenta Corriente 30 días',
    vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    observaciones: 'Compra de reserva forrajera para suplementación invernal'
  });

  // Cálculos de la compra
  const totalNeto = formCompra.cantidad * formCompra.precio_unitario;
  const totalIva = esTransferenciaInterna ? 0 : totalNeto * (formCompra.alicuota_iva / 100);
  const totalFinal = totalNeto + totalIva + Number(formCompra.percepciones);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCompra.numero_comprobante.trim()) {
      alert('Debe ingresar el número de comprobante o remito');
      return;
    }

    if (esTransferenciaInterna) {
      // Registrar como transferencia interna de grano propio UNRC
      const nuevaTransferencia: TransferenciaInternaGrano = {
        id: `TRF_BOV_${Date.now()}`,
        fecha: formCompra.fecha,
        grano: 'Maíz',
        kg_transferidos: Number(formCompra.cantidad),
        unidad_origen_id: 'UN_AGRICULTURA',
        unidad_destino_id: 'UN_BOVINOS',
        precio_fas_teorico_por_kg: Number(formCompra.precio_unitario),
        valor_total_transferencia: totalNeto,
        remito_interno_nro: formCompra.numero_comprobante,
        estado: 'Confirmado',
        observaciones: `Transferencia interna para ${formCompra.subunidad_id}. Sin salida financiera a terceros.`
      };

      await onSaveRecord('Transferencias_Granos', nuevaTransferencia);
      setShowModal(false);
      setFeedbackMsg(`Transferencia interna de Maíz Propio registrada (${nuevaTransferencia.remito_interno_nro}) por ${nuevaTransferencia.kg_transferidos} kg.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }

    // Registrar como compra externa formal
    const nuevoEnc: Partial<MovComercialEnc> = {
      id: `MOV_BOV_${Date.now()}`,
      tipo_comprobante_id: formCompra.tipo_comprobante_id,
      punto_venta: formCompra.punto_venta,
      numero_comprobante: formCompra.numero_comprobante,
      fecha: formCompra.fecha,
      proveedor_id: formCompra.proveedor_id,
      tipo_operacion: 'COMPRA',
      unidad_neg_id: 'UN_BOVINOS',
      subunidad_id: formCompra.subunidad_id,
      total_neto: totalNeto,
      total_iva: totalIva,
      total_percepciones: Number(formCompra.percepciones),
      total_retenciones: 0,
      total_final: totalFinal,
      estado: 'Confirmado',
      origen_dato: 'REAL'
    };

    const resEnc = await onSaveRecord('Mov_Comercial_Enc', nuevoEnc);
    if (resEnc.success) {
      // Guardar detalle
      const nuevoDet: Partial<MovComercialDet> = {
        id: `DET_BOV_${Date.now()}`,
        mov_comercial_id: resEnc.record?.id || nuevoEnc.id,
        numero_linea: 1,
        insumo_id: formCompra.insumo_nombre,
        kg: formCompra.cantidad,
        precio_unitario_real: formCompra.precio_unitario,
        importe_neto: totalNeto,
        alicuota_iva: formCompra.alicuota_iva,
        importe_iva: totalIva,
        destino_productivo_id: formCompra.subunidad_id
      };
      await onSaveRecord('Mov_Comercial_Det', nuevoDet);
      setShowModal(false);
      setFeedbackMsg(`Factura de compra ${nuevoEnc.numero_comprobante} guardada exitosamente (${formatMoney(totalFinal)}).`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  // Totales
  const totalCompradoBovinos = comprasBovinas.reduce((acc, c) => acc + (c.total_final || 0), 0);
  const totalMaizTransferidoValuado = transferenciasMaiz.reduce((acc, t) => acc + (t.valor_total_transferencia || 0), 0);
  const totalKgMaizTransferido = transferenciasMaiz.reduce((acc, t) => acc + (t.kg_transferidos || 0), 0);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#14281d] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-[#2b583f] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#78c293]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`p-1.5 ${theme.iconBg} rounded-lg`}>
              <ShoppingCart className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526b5c]">
              Gestión Comercial Bovina · Pozo del Carril (UNRC)
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#14281d] tracking-tight">
            Compras de Insumos & Transferencias de Grano Propio
          </h1>
          <p className="text-xs text-[#526b5c] mt-0.5">
            Comprobantes de compra a proveedores externos ganaderos y remitos de maíz propio desde la Unidad Agrícola
          </p>
        </div>

        <button
          onClick={() => {
            setEsTransferenciaInterna(false);
            setShowModal(true);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${theme.primary} rounded-lg shadow-xs transition-colors cursor-pointer shrink-0`}
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Compra / Transferencia</span>
        </button>
      </div>

      {/* Tira de Resumen de Compras y Transferencias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Compras a Proveedores</div>
          <div className="text-2xl font-bold text-[#14281d] font-mono tabular-nums mt-1">
            {formatMoney(totalCompradoBovinos)}
          </div>
          <div className="text-[11px] text-[#526b5c] mt-0.5">{comprasBovinas.length} facturas comerciales</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Maíz Propio Transferido</div>
          <div className="text-2xl font-bold text-[#1c4b31] font-mono tabular-nums mt-1">
            {totalKgMaizTransferido.toLocaleString('es-AR')} <span className="text-xs font-normal text-[#526b5c]">kg</span>
          </div>
          <div className="text-[11px] text-[#1c4b31] font-semibold mt-0.5">Cosecha propia UNRC</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Valuación Transferencias</div>
          <div className="text-2xl font-bold text-[#14281d] font-mono tabular-nums mt-1">
            {formatMoney(totalMaizTransferidoValuado)}
          </div>
          <div className="text-[11px] text-[#526b5c] mt-0.5">Sin salida bancaria a terceros</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Subunidades Imputadas</div>
          <div className="text-2xl font-bold text-[#14281d] font-mono tabular-nums mt-1">
            5 <span className="text-xs font-normal text-[#526b5c]">centros</span>
          </div>
          <div className="text-[11px] text-[#526b5c] mt-0.5">Cría, Recría, Corral, Cabaña</div>
        </div>
      </div>

      {/* Tabla 1: Compras a Proveedores Externos */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5efe7] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#14281d]">Facturas de Proveedores Externos (Hacienda Bovina)</h2>
            <p className="text-xs text-[#526b5c]">Alimentos balanceados, rollos, vacunas oficiales SENASA y dispositivos RFID</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#78a587] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por comprobante o proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8faf7] border border-[#c8d9cc] rounded-lg text-[#14281d] placeholder-[#8ba895] focus:outline-none focus:border-[#1c4b31]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5efe7] text-[#617e6c] font-semibold bg-[#f8faf7]">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Comprobante</th>
                <th className="py-2.5 px-3">Proveedor</th>
                <th className="py-2.5 px-3">Subunidad Destino</th>
                <th className="py-2.5 px-3 text-right">Neto Gravado</th>
                <th className="py-2.5 px-3 text-right">IVA</th>
                <th className="py-2.5 px-3 text-right">Total Facturado</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ee]">
              {comprasBovinas.map((c) => (
                <tr key={c.id} className="hover:bg-[#f8faf7] transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[#526b5c]">{c.fecha}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#14281d]">
                    {c.tipo_comprobante_id?.replace('TC_', '')} {c.punto_venta}-{c.numero_comprobante}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#14281d]">
                    {proveedores.find(p => p.id === c.proveedor_id)?.razon_social || c.proveedor_id}
                  </td>
                  <td className="py-2.5 px-3 text-[#526b5c]">
                    {c.subunidad_id || 'Bovinos General'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#526b5c]">
                    {formatMoney(c.total_neto)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#526b5c]">
                    {formatMoney(c.total_iva)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                    {formatMoney(c.total_final)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[11px] font-semibold text-[#1c4b31] bg-[#eaf4ec] px-2 py-0.5 rounded">
                      {c.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla 2: Transferencias Internas de Maíz Propio */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#e5efe7] mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-[#eaf4ec] text-[#1c4b31] rounded">
              <Wheat className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#14281d]">Transferencias Internas de Maíz Propio (UN Agrícola)</h2>
              <p className="text-xs text-[#526b5c]">
                Remitos internos de traslado de grano propio · Imputa costo zootécnico sin egreso financiero bancario
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEsTransferenciaInterna(true);
              setShowModal(true);
            }}
            className="text-xs font-semibold text-[#1c4b31] hover:underline cursor-pointer"
          >
            + Registrar Remito Interno
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5efe7] text-[#617e6c] font-semibold bg-[#f8faf7]">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Remito Interno</th>
                <th className="py-2.5 px-3">Grano</th>
                <th className="py-2.5 px-3">Origen</th>
                <th className="py-2.5 px-3 text-right">Kg Transferidos</th>
                <th className="py-2.5 px-3 text-right">Precio FAS Teórico</th>
                <th className="py-2.5 px-3 text-right">Valuación Total</th>
                <th className="py-2.5 px-3">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ee]">
              {transferenciasMaiz.map((t) => (
                <tr key={t.id} className="hover:bg-[#f8faf7] transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[#526b5c]">{t.fecha}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#1c4b31]">{t.remito_interno_nro}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#14281d]">{t.grano}</td>
                  <td className="py-2.5 px-3 text-[#526b5c]">{t.unidad_origen_id}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                    {t.kg_transferidos.toLocaleString('es-AR')} kg
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#526b5c]">
                    {formatMoney(t.precio_fas_teorico_por_kg)} /kg
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                    {formatMoney(t.valor_total_transferencia)}
                  </td>
                  <td className="py-2.5 px-3 text-[#526b5c] max-w-xs truncate">{t.observaciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Compra / Remito Interno */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5efe7]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#78350f] block">
                  Unidad Productiva: Bovinos · Gestión Comercial
                </span>
                <h3 className="text-base font-bold text-[#14281d]">
                  {esTransferenciaInterna ? 'BOVINOS · TRANSFERENCIA INTERNA DE MAÍZ' : 'BOVINOS · REGISTRO DE COMPRA DE INSUMOS'}
                </h3>
                <span className="text-[11px] text-[#526b5c]">
                  {esTransferenciaInterna ? 'Imputa costo a Bovinos sin generar pasivo externo' : 'Factura comercial a proveedor ganadero'}
                </span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#526b5c] hover:text-[#14281d]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 p-1 bg-[#edf3ee] rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEsTransferenciaInterna(false)}
                className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                  !esTransferenciaInterna ? 'bg-white text-[#14281d] shadow-2xs' : 'text-[#526b5c]'
                }`}
              >
                Compra Externa
              </button>
              <button
                type="button"
                onClick={() => setEsTransferenciaInterna(true)}
                className={`flex-1 py-1.5 rounded-md transition-colors cursor-pointer ${
                  esTransferenciaInterna ? 'bg-white text-[#14281d] shadow-2xs' : 'text-[#526b5c]'
                }`}
              >
                Maíz Propio UNRC (Remito)
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formCompra.fecha}
                    onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">
                    {esTransferenciaInterna ? 'Nº de Remito Interno' : 'Nº de Factura'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={esTransferenciaInterna ? 'REM-INT-004' : '0001-00045210'}
                    value={formCompra.numero_comprobante}
                    onChange={(e) => setFormCompra({ ...formCompra, numero_comprobante: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] font-mono"
                  />
                </div>
              </div>

              {!esTransferenciaInterna && (
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">Proveedor (Maestro)</label>
                  <select
                    value={formCompra.proveedor_id}
                    onChange={(e) => setFormCompra({ ...formCompra, proveedor_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] bg-white font-semibold"
                  >
                    <option value="" disabled>Seleccione un proveedor...</option>
                    {(db.Proveedores || [])
                      .filter(p => p.activo !== false || p.id === formCompra.proveedor_id)
                      .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.razon_social} (CUIT: {p.cuit}){!p.activo ? ' - [Inactivo]' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[#526b5c] font-semibold mb-1">Subunidad Ganadera Imputada</label>
                <select
                  value={formCompra.subunidad_id}
                  onChange={(e) => setFormCompra({ ...formCompra, subunidad_id: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                >
                  <option value="BOV_CRIA">Cría Bovina (Vientres y Toros)</option>
                  <option value="BOV_RECRIA">Recría Pastoril</option>
                  <option value="BOV_ADAPTACION">Adaptación a Corral</option>
                  <option value="BOV_ENGORDE">Terminación Feedlot</option>
                  <option value="BOV_CABANA">Cabaña Angus (Pedigrí)</option>
                  <option value="BOV_ESTRUCTURA">Costos de Estructura Bovinos</option>
                </select>
              </div>

              <div>
                <label className="block text-[#526b5c] font-semibold mb-1">
                  {esTransferenciaInterna ? 'Grano Transferido' : 'Insumo Adquirido'}
                </label>
                <input
                  type="text"
                  required
                  value={esTransferenciaInterna ? 'Grano de Maíz Cosecha Propia UNRC' : formCompra.insumo_nombre}
                  onChange={(e) => setFormCompra({ ...formCompra, insumo_nombre: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  disabled={esTransferenciaInterna}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">
                    {esTransferenciaInterna ? 'Cantidad (kg)' : 'Cantidad'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formCompra.cantidad}
                    onChange={(e) => setFormCompra({ ...formCompra, cantidad: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">
                    {esTransferenciaInterna ? 'Precio FAS Teórico ($/kg)' : 'Precio Unitario ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formCompra.precio_unitario}
                    onChange={(e) => setFormCompra({ ...formCompra, precio_unitario: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
              </div>

              {!esTransferenciaInterna && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#526b5c] font-semibold mb-1">Alícuota IVA (%)</label>
                    <select
                      value={formCompra.alicuota_iva}
                      onChange={(e) => setFormCompra({ ...formCompra, alicuota_iva: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                    >
                      <option value="10.5">10.5% (Granos / Hacienda)</option>
                      <option value="21">21.0% (Medicamentos / Servicios)</option>
                      <option value="0">0.0% (Exento)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#526b5c] font-semibold mb-1">Percepciones ($)</label>
                    <input
                      type="number"
                      value={formCompra.percepciones}
                      onChange={(e) => setFormCompra({ ...formCompra, percepciones: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                    />
                  </div>
                </div>
              )}

              {/* Resumen Total del Comprobante */}
              <div className="p-3 bg-[#f8faf7] border border-[#e2ece4] rounded-lg flex items-center justify-between text-xs">
                <span className="text-[#526b5c]">Importe Total Liquidado:</span>
                <span className="text-base font-bold font-mono text-[#14281d]">{formatMoney(totalFinal)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5efe7]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-[#526b5c] hover:bg-[#edf3ee] rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs"
                >
                  Confirmar {esTransferenciaInterna ? 'Transferencia' : 'Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
