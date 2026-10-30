/**
 * @file ComprasView.tsx
 * @description Módulo de Compras y Costos
 * Facturas y comprobantes de compra con encabezado y detalle, componentes fiscales por separado (IVA, retenciones, percepciones),
 * control de duplicados, generación automática de F_PrecioIns y stock de insumos.
 */

import React, { useState } from 'react';
import { Plus, ShoppingCart, Check, X, ShieldAlert, FileText, DollarSign } from 'lucide-react';
import { BaseDatosPorcina, MovComercialEnc, MovComercialDet, Usuario } from '../types/schema';
import { DataTable, Column } from '../components/DataTable';
import { StatusTag } from '../components/StatusTag';
import { BadgeOrigin } from '../components/BadgeOrigin';
import { getRolePermissions } from '../lib/permissions';

interface Props {
  db: BaseDatosPorcina;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  onConfirmRecord: (table: keyof BaseDatosPorcina, id: string) => Promise<any>;
  onCancelRecord: (table: keyof BaseDatosPorcina, id: string, motivo: string) => Promise<any>;
  onExportCsv: (table: keyof BaseDatosPorcina) => void;
  currentUser?: Usuario | null;
}

export const ComprasView: React.FC<Props> = ({
  db,
  onSaveRecord,
  onConfirmRecord,
  onCancelRecord,
  onExportCsv,
  currentUser = null
}) => {
  const permissions = getRolePermissions(currentUser);
  const [showModal, setShowModal] = useState(false);

  // Formulario de Compra
  const [formEnc, setFormEnc] = useState<{
    tipo_comprobante_id: string;
    punto_venta: string;
    numero_comprobante: string;
    fecha: string;
    proveedor_id: string;
    subunidad_id: string;
    // Detalle
    insumo_id: string;
    kg: number;
    precio_unitario_real: number;
    alicuota_iva: number;
    total_percepciones: number;
    total_retenciones: number;
  }>({
    tipo_comprobante_id: 'TC_FAC_A',
    punto_venta: '0001',
    numero_comprobante: '',
    fecha: new Date().toISOString().split('T')[0],
    proveedor_id: 'PROV_AGR_INTERNA',
    subunidad_id: 'SUB_DESTETE_REC',
    insumo_id: 'INS_PELLET_SOJA',
    kg: 1000,
    precio_unitario_real: 350,
    alicuota_iva: 21,
    total_percepciones: 0,
    total_retenciones: 0
  });

  const totalNeto = formEnc.kg * formEnc.precio_unitario_real;
  const totalIva = totalNeto * (formEnc.alicuota_iva / 100);
  const totalFinal = totalNeto + totalIva + Number(formEnc.total_percepciones) - Number(formEnc.total_retenciones);

  const handleGuardarCompra = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formEnc.numero_comprobante.trim()) {
      alert('Debe ingresar el número de comprobante');
      return;
    }

    if (!formEnc.proveedor_id) {
      alert('Debe seleccionar un proveedor del maestro');
      return;
    }

    // Guardar encabezado
    const nuevoEnc: Partial<MovComercialEnc> = {
      tipo_comprobante_id: formEnc.tipo_comprobante_id,
      punto_venta: formEnc.punto_venta,
      numero_comprobante: formEnc.numero_comprobante,
      fecha: formEnc.fecha,
      proveedor_id: formEnc.proveedor_id,
      tipo_operacion: 'COMPRA',
      unidad_neg_id: 'UN_PORCINA',
      subunidad_id: formEnc.subunidad_id,
      total_neto: totalNeto,
      total_iva: totalIva,
      total_percepciones: Number(formEnc.total_percepciones),
      total_retenciones: Number(formEnc.total_retenciones),
      total_final: totalFinal,
      estado: 'Confirmado',
      origen_dato: 'REAL'
    };

    const resEnc = await onSaveRecord('Mov_Comercial_Enc', nuevoEnc);
    if (!resEnc.success) {
      alert('Error al guardar: ' + resEnc.error);
      return;
    }

    const encId = resEnc.record.id;

    // Guardar detalle
    const nuevoDet: Partial<MovComercialDet> = {
      mov_comercial_id: encId,
      numero_linea: 1,
      insumo_id: formEnc.insumo_id,
      kg: Number(formEnc.kg),
      precio_unitario_real: Number(formEnc.precio_unitario_real),
      importe_neto: totalNeto,
      alicuota_iva: Number(formEnc.alicuota_iva),
      importe_iva: totalIva,
      destino_productivo_id: formEnc.subunidad_id
    };
    await onSaveRecord('Mov_Comercial_Det', nuevoDet);

    setShowModal(false);
  };

  // Solo compras
  const compras = db.Mov_Comercial_Enc.filter(m => m.tipo_operacion === 'COMPRA');

  const columns: Column<MovComercialEnc>[] = [
    { key: 'fecha', header: 'Fecha' },
    { 
      key: 'comprobante', 
      header: 'Comprobante',
      render: (c) => `${c.tipo_comprobante_id.replace('TC_', '')} ${c.punto_venta}-${c.numero_comprobante}`
    },
    { 
      key: 'proveedor_id', 
      header: 'Proveedor',
      render: (c) => {
        const prov = db.Proveedores.find(p => p.id === c.proveedor_id);
        return <span className="font-medium text-slate-900">{prov ? prov.razon_social : c.proveedor_id}</span>;
      }
    },
    { 
      key: 'subunidad_id', 
      header: 'Subunidad Imputada',
      render: (c) => {
        const sub = db.D_Subunidad.find(s => s.id === c.subunidad_id);
        return <span>{sub ? sub.nombre : c.subunidad_id}</span>;
      }
    },
    { 
      key: 'total_neto', 
      header: 'Neto Gravado', 
      align: 'right',
      render: (c) => `$${Number(c.total_neto).toLocaleString('es-AR')}`
    },
    { 
      key: 'total_iva', 
      header: 'IVA', 
      align: 'right',
      render: (c) => `$${Number(c.total_iva).toLocaleString('es-AR')}`
    },
    { 
      key: 'total_final', 
      header: 'Total Facturado', 
      align: 'right',
      render: (c) => <strong className="text-slate-900 font-mono">${Number(c.total_final).toLocaleString('es-AR')}</strong>
    },
    { key: 'estado', header: 'Estado', render: (c) => <StatusTag estado={c.estado} motivo={c.motivo_anulacion} /> },
    { key: 'origen_dato', header: 'Calidad', render: (c) => <BadgeOrigin origen={c.origen_dato} /> },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      render: (c) => {
        if (permissions.isReadOnly) {
          return <span className="text-[11px] text-slate-400">Solo lectura</span>;
        }
        return (
          <div className="flex items-center justify-center gap-1">
            {c.estado !== 'Anulado' && permissions.canCancel('compras') && (
              <button
                onClick={() => {
                  const motivo = prompt('Motivo formal de anulación del comprobante:');
                  if (motivo) onCancelRecord('Mov_Comercial_Enc', c.id, motivo);
                }}
                className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                title="Anular comprobante"
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
          <span><strong>Rango Auditor de Hacienda:</strong> Modo de solo lectura activo. Control de facturas y costos directos de insumos.</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#c5dcf0] text-[#1b3d59] border border-[#b2d0ea]">Solo Lectura</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#143422] tracking-tight">
              Módulo de Compras & Costos Directos
            </h2>
            <span className="text-[10px] font-mono text-[#255e39] bg-[#edf6f0] px-2 py-0.2 rounded border border-[#cbe3d2]">
              Insumos & Nutrición
            </span>
          </div>
          <p className="text-xs text-[#5c7767] mt-0.5">
            Comprobantes de compras con detalle de insumos, desglose fiscal e impacto automático en stock
          </p>
        </div>

        {!permissions.isReadOnly && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1d4c32] hover:bg-[#153e27] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto cursor-pointer border border-[#163c26]"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Factura de Compra</span>
          </button>
        )}
      </div>

      {/* Regla de negocio 11 & Control de duplicados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-[#edf5f0] border border-[#c5e1cf] rounded-lg flex items-start gap-2 shadow-2xs text-[#16432a]">
          <FileText className="w-4 h-4 text-[#1b6b3e] shrink-0 mt-0.5" />
          <div>
            <strong>Regla 11 (Componentes Fiscales):</strong> El IVA, retenciones y percepciones se registran en columnas separadas; no se tratan contablemente como mayor costo del insumo.
          </div>
        </div>

        <div className="p-3 bg-[#fef8ee] border border-[#f6d99f] rounded-lg flex items-start gap-2 shadow-2xs text-[#78460b]">
          <ShieldAlert className="w-4 h-4 text-[#9c6314] shrink-0 mt-0.5" />
          <div>
            <strong>Regla 4 (Control de Duplicados):</strong> El sistema bloquea el ingreso de comprobantes duplicados con la misma combinación (Tipo + Pto Venta + Número + Proveedor).
          </div>
        </div>
      </div>

      {/* Tabla de Compras */}
      <DataTable
        columns={columns}
        data={compras}
        title="Comprobantes de Compra Registrados"
        subtitle="Registro formal de facturas y remitos de proveedores"
        onExportCsv={() => onExportCsv('Mov_Comercial_Enc')}
        emptyMessage="No se han registrado compras. Haga clic en 'Registrar Factura de Compra'."
      />

      {/* MODAL: REGISTRAR COMPRA */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Registrar Comprobante de Compra
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarCompra} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipo Comprobante (*)</label>
                  <select
                    value={formEnc.tipo_comprobante_id}
                    onChange={e => setFormEnc({ ...formEnc, tipo_comprobante_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="TC_FAC_A">Factura A</option>
                    <option value="TC_FAC_B">Factura B</option>
                    <option value="TC_REMITO">Remito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Punto de Venta (*)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formEnc.punto_venta}
                    onChange={e => setFormEnc({ ...formEnc, punto_venta: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Número (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="00012345"
                    value={formEnc.numero_comprobante}
                    onChange={e => setFormEnc({ ...formEnc, numero_comprobante: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fecha Emisión (*)</label>
                  <input
                    type="date"
                    required
                    value={formEnc.fecha}
                    onChange={e => setFormEnc({ ...formEnc, fecha: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Proveedor (*)</label>
                  <select
                    required
                    value={formEnc.proveedor_id}
                    onChange={e => setFormEnc({ ...formEnc, proveedor_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-slate-500 font-semibold"
                  >
                    <option value="" disabled>Seleccione un proveedor...</option>
                    {db.Proveedores
                      .filter(p => p.activo !== false || p.id === formEnc.proveedor_id)
                      .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.razon_social} (CUIT: {p.cuit}){!p.activo ? ' - [Inactivo]' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Detalle del Insumo Comprado
                </span>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Insumo (*)</label>
                    <select
                      value={formEnc.insumo_id}
                      onChange={e => setFormEnc({ ...formEnc, insumo_id: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      {db.D_Insumo.map(ins => (
                        <option key={ins.id} value={ins.id}>{ins.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Subunidad Destino (*)</label>
                    <select
                      value={formEnc.subunidad_id}
                      onChange={e => setFormEnc({ ...formEnc, subunidad_id: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      {db.D_Subunidad.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Cantidad (Kg) (*)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formEnc.kg}
                      onChange={e => setFormEnc({ ...formEnc, kg: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Precio Unitario Real (*)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formEnc.precio_unitario_real}
                      onChange={e => setFormEnc({ ...formEnc, precio_unitario_real: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Alícuota IVA (%)</label>
                    <select
                      value={formEnc.alicuota_iva}
                      onChange={e => setFormEnc({ ...formEnc, alicuota_iva: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    >
                      <option value="21">21 %</option>
                      <option value="10.5">10.5 %</option>
                      <option value="0">Exento (0%)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Totales calculados */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Neto Gravado:</span>
                  <span className="font-mono font-medium">${totalNeto.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA ({formEnc.alicuota_iva}%):</span>
                  <span className="font-mono font-medium">${totalIva.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Total Factura:</span>
                  <span className="font-mono text-sm">${totalFinal.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs"
                >
                  Confirmar Factura & Aumentar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
