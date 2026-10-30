/**
 * @file StockView.tsx
 * @description Módulo de Stock de Insumos y Transferencias Internas
 * Control de stock físico de alimento (maíz, soja, peleteado), conciliación de existencias
 * y registro de transferencias internas desde Agricultura u otras unidades sin duplicar costos.
 */

import React, { useState } from 'react';
import { Plus, Boxes, ArrowRightLeft, Check, X, ShieldAlert, Scale, RefreshCw } from 'lucide-react';
import { BaseDatosPorcina, MovimientoInterno, MovimientoStockInsumos, Usuario } from '../types/schema';
import { DataTable, Column } from '../components/DataTable';
import { StatusTag } from '../components/StatusTag';
import { BadgeOrigin } from '../components/BadgeOrigin';
import { conciliarAlimento } from '../lib/calculations';
import { getRolePermissions } from '../lib/permissions';
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

export const StockView: React.FC<Props> = ({
  db,
  onSaveRecord,
  onConfirmRecord,
  onCancelRecord,
  onExportCsv,
  currentUser = null
}) => {
  const permissions = getRolePermissions(currentUser);
  const [activeTab, setActiveTab] = useState<'saldos' | 'transferencias' | 'movimientos'>('saldos');
  const [showTransfModal, setShowTransfModal] = useState(false);

  const [editingTransfId, setEditingTransfId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<{ record: any; tableName: string; unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS'; title: string } | null>(null);

  // Formulario de Transferencia Interna (ej: Maíz de Agricultura a Porcinos)
  const [formTransf, setFormTransf] = useState<{
    fecha: string;
    unidad_origen_id: string;
    unidad_destino_id: string;
    insumo_id: string;
    cantidad: number;
    criterio_valorizacion: 'COSTO_PRODUCCION' | 'PRECIO_MERCADO' | 'VNR' | 'VALOR_ACORDADO';
    valor_unitario: number;
    observaciones: string;
  }>({
    fecha: new Date().toISOString().split('T')[0],
    unidad_origen_id: 'UN_AGRICULTURA',
    unidad_destino_id: 'UN_PORCINA',
    insumo_id: 'INS_MAIZ_PROP',
    cantidad: 5000,
    criterio_valorizacion: 'COSTO_PRODUCCION',
    valor_unitario: 180,
    observaciones: 'Transferencia de cosecha propia de maíz para ración'
  });

  const handleEditarTransf = (t: MovimientoInterno) => {
    setEditingTransfId(t.id);
    setFormTransf({
      fecha: t.fecha || new Date().toISOString().split('T')[0],
      unidad_origen_id: t.unidad_origen_id || 'UN_AGRICULTURA',
      unidad_destino_id: t.unidad_destino_id || 'UN_PORCINA',
      insumo_id: t.insumo_id || 'INS_MAIZ_PROP',
      cantidad: Number(t.cantidad) || 5000,
      criterio_valorizacion: t.criterio_valorizacion || 'COSTO_PRODUCCION',
      valor_unitario: Number(t.valor_unitario) || 180,
      observaciones: t.observaciones || ''
    });
    setShowTransfModal(true);
  };

  const handleGuardarTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorTotal = Number(formTransf.cantidad) * Number(formTransf.valor_unitario);

    // 1. Guardar en Movimientos_Internos
    const nuevaTransf: Partial<MovimientoInterno> = {
      ...(editingTransfId ? { id: editingTransfId } : {}),
      fecha: formTransf.fecha,
      unidad_origen_id: formTransf.unidad_origen_id,
      unidad_destino_id: formTransf.unidad_destino_id,
      insumo_id: formTransf.insumo_id,
      cantidad: Number(formTransf.cantidad),
      um_id: 'UM_KG',
      criterio_valorizacion: formTransf.criterio_valorizacion,
      valor_unitario: Number(formTransf.valor_unitario),
      valor_total: valorTotal,
      estado: permissions.rolId === 'ROL_OPERARIO' ? 'Borrador' : 'Confirmado',
      observaciones: formTransf.observaciones
    };
    await onSaveRecord('Movimientos_Internos', nuevaTransf);

    if (!editingTransfId) {
      // 2. Incrementar stock de insumos en Porcinos
      await onSaveRecord('Movimientos_Stock_Insumos', {
        fecha: formTransf.fecha,
        tipo_movimiento: 'TRANSFERENCIA_RECIBIDA',
        insumo_id: formTransf.insumo_id,
        cantidad: Number(formTransf.cantidad),
        um_id: 'UM_KG',
        observaciones: `Ingreso interno desde ${formTransf.unidad_origen_id} (${formTransf.criterio_valorizacion})`
      });
    }

    setEditingTransfId(null);
    setShowTransfModal(false);
  };

  // Cálculo de saldos consolidados por insumo
  const saldosInsumos = db.D_Insumo.map(ins => {
    const conciliacion = conciliarAlimento(db, ins.id);
    return {
      insumo: ins,
      conciliacion
    };
  });

  // Columnas para Saldos de Insumos
  const columnsSaldos: Column<any>[] = [
    { 
      key: 'insumo', 
      header: 'Insumo',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-900">{r.insumo.nombre}</div>
          <div className="text-[11px] text-slate-400 font-mono">{r.insumo.tipo_insumo}</div>
        </div>
      )
    },
    { key: 'stock_inicial', header: 'Stock Inicial', align: 'right', render: (r) => `${r.conciliacion.stockInicialKg.toLocaleString('es-AR')} kg` },
    { key: 'compras', header: 'Compras', align: 'right', render: (r) => `+${r.conciliacion.comprasKg.toLocaleString('es-AR')} kg` },
    { key: 'transferencias', header: 'Transf. Recibidas', align: 'right', render: (r) => `+${r.conciliacion.transferenciasRecibidasKg.toLocaleString('es-AR')} kg` },
    { key: 'consumos', header: 'Consumos Reales', align: 'right', render: (r) => `-${r.conciliacion.consumosKg.toLocaleString('es-AR')} kg` },
    { 
      key: 'saldo_final', 
      header: 'Saldo Físico Actual', 
      align: 'right',
      render: (r) => (
        <span className={`font-mono font-bold text-xs ${r.conciliacion.stockActualKg >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
          {r.conciliacion.stockActualKg.toLocaleString('es-AR')} kg
        </span>
      )
    },
    {
      key: 'estado_conciliacion',
      header: 'Conciliación',
      align: 'center',
      render: (r) => r.conciliacion.conciliado ? (
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
          Conciliado (0 dif)
        </span>
      ) : (
        <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
          Desvío: {r.conciliacion.diferenciaKg.toFixed(1)} kg
        </span>
      )
    }
  ];

  // Columnas para Transferencias Internas
  const columnsTransf: Column<MovimientoInterno>[] = [
    { key: 'fecha', header: 'Fecha' },
    { 
      key: 'origen_destino', 
      header: 'Origen → Destino',
      render: (t) => `${t.unidad_origen_id.replace('UN_', '')} → ${t.unidad_destino_id.replace('UN_', '')}`
    },
    { 
      key: 'insumo_id', 
      header: 'Insumo',
      render: (t) => {
        const ins = db.D_Insumo.find(i => i.id === t.insumo_id);
        return <span>{ins ? ins.nombre : t.insumo_id}</span>;
      }
    },
    { key: 'cantidad', header: 'Cantidad', align: 'right', render: (t) => `${Number(t.cantidad).toLocaleString('es-AR')} kg` },
    { key: 'criterio_valorizacion', header: 'Criterio Valuación' },
    { key: 'valor_unitario', header: 'Valor $/kg', align: 'right', render: (t) => `$${t.valor_unitario}` },
    { key: 'valor_total', header: 'Valor Total', align: 'right', render: (t) => <strong className="font-mono">${Number(t.valor_total).toLocaleString('es-AR')}</strong> },
    { key: 'estado', header: 'Estado', render: (t) => <StatusTag estado={t.estado} /> },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      render: (t) => (
        <RowActions
          unit="PORCINOS"
          canEdit={permissions.canEdit('stock')}
          onViewDetail={() => setDetailRecord({ record: t, tableName: 'Movimientos_Internos', unit: 'PORCINOS', title: `TRANSFERENCIA INTERNA (${t.id})` })}
          onEdit={() => handleEditarTransf(t)}
          onCancel={t.estado !== 'Anulado' ? () => {
            const motivo = prompt('Motivo formal de anulación de transferencia:');
            if (motivo) onCancelRecord('Movimientos_Internos', t.id, motivo);
          } : undefined}
        />
      )
    }
  ];

  return (
    <div className="space-y-5">
      {/* Banner de Modo Solo Lectura para Auditor */}
      {permissions.isReadOnly && (
        <div className="bg-[#edf3f8] border border-[#c4d6e5] text-[#1e4260] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
          <span><strong>Rango Auditor de Hacienda:</strong> Modo de solo lectura activo. Control físico y conciliación de saldos de insumos.</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#c5dcf0] text-[#1b3d59] border border-[#b2d0ea]">Solo Lectura</span>
        </div>
      )}

      {/* Banner de Modo Operario */}
      {permissions.rolId === 'ROL_OPERARIO' && (
        <div className="bg-[#fef9ee] border border-[#f7e0af] text-[#7a4e14] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
          <span><strong>Rango Operario de Campo:</strong> Las transferencias registradas se guardan en <strong>Borrador</strong> para posterior confirmación del Encargado.</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#fce49d] text-[#734509] border border-[#ebd083]">Carga en Borrador</span>
        </div>
      )}

      {/* Encabezado y Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#143422] tracking-tight">
              Módulo de Stock de Insumos & Transferencias Internas
            </h2>
            <span className="text-[10px] font-mono text-[#255e39] bg-[#edf6f0] px-2 py-0.2 rounded border border-[#cbe3d2]">
              Silo & Depósito
            </span>
          </div>
          <p className="text-xs text-[#5c7767] mt-0.5">
            Saldos físicos de raciones, conciliación de inventario y transferencias con la Unidad Agrícola
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-[#ebf0ea] border border-[#d2ded1] rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('saldos')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'saldos' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
              }`}
            >
              Saldos & Conciliación
            </button>
            <button
              onClick={() => setActiveTab('transferencias')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'transferencias' ? 'bg-white text-[#153a24] font-bold shadow-xs' : 'text-[#4c6657] hover:text-[#173a25]'
              }`}
            >
              Transferencias Internas ({db.Movimientos_Internos.length})
            </button>
          </div>

          {!permissions.isReadOnly && (
            <button
              onClick={() => setShowTransfModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1d4c32] hover:bg-[#153e27] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs whitespace-nowrap cursor-pointer border border-[#163c26]"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>+ Transferencia Interna</span>
            </button>
          )}
        </div>
      </div>

      {/* Regla de negocio 10 */}
      <div className="bg-[#edf5f0] border border-[#c5e1cf] rounded-lg p-3 text-xs text-[#16432a] flex items-start gap-2 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-[#1b6b3e] shrink-0 mt-0.5" />
        <div>
          <strong>Regla 10 (Consolidación sin Duplicación):</strong> Las transferencias internas entre unidades del establecimiento (ej. maíz de Agricultura a Porcinos) se registran una única vez en <em>Movimientos_Internos</em> y no generan doble cómputo de costos ni ingresos en la consolidación del establecimiento.
        </div>
      </div>

      {/* Tabla según pestaña */}
      {activeTab === 'saldos' && (
        <DataTable
          columns={columnsSaldos}
          data={saldosInsumos}
          title="Existencias Físicas y Conciliación de Insumos"
          subtitle="Stock inicial + Compras + Transferencias recibidas − Consumos reales = Saldo actual"
          onExportCsv={() => onExportCsv('D_Insumo')}
        />
      )}

      {activeTab === 'transferencias' && (
        <DataTable
          columns={columnsTransf}
          data={db.Movimientos_Internos}
          title="Transferencias Internas entre Unidades"
          subtitle="Envíos y recepciones valorizadas con Agricultura o Ganadería Bovina/Ovina"
          onExportCsv={() => onExportCsv('Movimientos_Internos')}
          emptyMessage="No se han registrado transferencias internas. Haga clic en '+ Transferencia Interna'."
        />
      )}

      {/* MODAL: TRANSFERENCIA INTERNA */}
      {showTransfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Registrar Transferencia Interna de Insumo
              </h3>
              <button onClick={() => setShowTransfModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarTransferencia} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fecha (*)</label>
                  <input
                    type="date"
                    required
                    value={formTransf.fecha}
                    onChange={e => setFormTransf({ ...formTransf, fecha: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Insumo / Ración (*)</label>
                  <select
                    value={formTransf.insumo_id}
                    onChange={e => setFormTransf({ ...formTransf, insumo_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {db.D_Insumo.map(ins => (
                      <option key={ins.id} value={ins.id}>{ins.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unidad Origen (*)</label>
                  <select
                    value={formTransf.unidad_origen_id}
                    onChange={e => setFormTransf({ ...formTransf, unidad_origen_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {db.D_UnidadNeg.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unidad Destino (*)</label>
                  <select
                    value={formTransf.unidad_destino_id}
                    onChange={e => setFormTransf({ ...formTransf, unidad_destino_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    {db.D_UnidadNeg.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cantidad (Kg) (*)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formTransf.cantidad}
                    onChange={e => setFormTransf({ ...formTransf, cantidad: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Criterio Valuación (*)</label>
                  <select
                    value={formTransf.criterio_valorizacion}
                    onChange={e => setFormTransf({ ...formTransf, criterio_valorizacion: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="COSTO_PRODUCCION">Costo de Producción</option>
                    <option value="PRECIO_MERCADO">Precio de Mercado</option>
                    <option value="VNR">Valor Neto Realiz. (VNR)</option>
                    <option value="VALOR_ACORDADO">Valor Acordado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Valor Unitario ($/kg) (*)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formTransf.valor_unitario}
                    onChange={e => setFormTransf({ ...formTransf, valor_unitario: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-600">Importe Valorizado:</span>
                <span className="font-mono font-bold text-slate-900">
                  ${(formTransf.cantidad * formTransf.valor_unitario).toLocaleString('es-AR')}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Observaciones</label>
                <input
                  type="text"
                  placeholder="Lote de cosecha, silo origen..."
                  value={formTransf.observaciones}
                  onChange={e => setFormTransf({ ...formTransf, observaciones: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransfModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs"
                >
                  Confirmar Transferencia & Actualizar Stock
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
