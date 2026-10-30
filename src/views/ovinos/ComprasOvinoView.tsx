import React, { useState } from 'react';
import { BaseDatosPorcina, MovComercialEnc, MovComercialDet, Usuario } from '../../types/schema';
import { ShoppingCart, Plus, CheckCircle2, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const ComprasOvinoView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const { formatMoney } = useCurrency();
  const [showModal, setShowModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const proveedores = db.Proveedores || [];
  const insumos = db.D_Insumo || [];
  const compras = db.Mov_Comercial_Enc.filter(m => m.tipo_operacion === 'COMPRA' && (m.unidad_neg_id === 'UN_OVINOS' || m.subunidad_id?.startsWith('OVI')));

  const [form, setForm] = useState({
    numero_comprobante: '',
    fecha: new Date().toISOString().split('T')[0],
    proveedor_id: proveedores[0]?.id || 'PROV_AGR_INTERNA',
    insumo_id: insumos[0]?.id || 'INS_MAIZ_PROP',
    kg: 1000,
    precio_unitario_real: 280,
    alicuota_iva: 21,
    subunidad_id: 'OVI_CRIA'
  });

  const totalNeto = Number(form.kg) * Number(form.precio_unitario_real);
  const totalIva = totalNeto * (Number(form.alicuota_iva) / 100);
  const totalFinal = totalNeto + totalIva;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero_comprobante.trim()) {
      alert('Ingrese el número de comprobante');
      return;
    }

    const encId = `MOV_COM_OVI_${Date.now()}`;
    const nuevoEnc: Partial<MovComercialEnc> = {
      id: encId,
      tipo_comprobante_id: 'TC_FAC_A',
      punto_venta: '0002',
      numero_comprobante: form.numero_comprobante,
      fecha: form.fecha,
      proveedor_id: form.proveedor_id,
      tipo_operacion: 'COMPRA',
      unidad_neg_id: 'UN_OVINOS',
      subunidad_id: form.subunidad_id,
      total_neto: totalNeto,
      total_iva: totalIva,
      total_percepciones: 0,
      total_retenciones: 0,
      total_final: totalFinal,
      estado: 'Confirmado',
      origen_dato: 'REAL'
    };

    const resEnc = await onSaveRecord('Mov_Comercial_Enc', nuevoEnc);
    if (resEnc.success === false) {
      alert('Error al guardar compra: ' + resEnc.error);
      return;
    }

    const nuevoDet: Partial<MovComercialDet> = {
      id: `MOV_DET_OVI_${Date.now()}`,
      mov_comercial_id: encId,
      numero_linea: 1,
      insumo_id: form.insumo_id,
      kg: Number(form.kg),
      precio_unitario_real: Number(form.precio_unitario_real),
      importe_neto: totalNeto,
      alicuota_iva: Number(form.alicuota_iva),
      importe_iva: totalIva,
      destino_productivo_id: form.subunidad_id
    };
    await onSaveRecord('Mov_Comercial_Det', nuevoDet);

    setShowModal(false);
    setFeedbackMsg(`Compra ovina #${form.numero_comprobante} registrada con éxito ($${totalFinal.toLocaleString()}).`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#14281d]">Compras & Proveedores Ovinos</h2>
            <p className="text-xs text-[#526b5c] mt-1">Adquisición de insumos sanitarios, alimentos concentrados y reposición de reproductores.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold ${theme.primary} text-white rounded-lg shadow-xs transition-colors cursor-pointer`}
          >
            <Plus className="w-4 h-4" />
            Nueva Compra Ovina
          </button>
        </div>

        {feedbackMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      <div className={`bg-white border ${theme.border} rounded-xl overflow-hidden shadow-xs`}>
        <div className={`p-4 border-b ${theme.border} ${theme.secondaryBg} flex justify-between items-center`}>
          <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">Historial de Compras Insumos & Reproductores Ovinos</span>
          <span className="text-xs text-[#526b5c]">{compras.length} registros</span>
        </div>
        <table className="w-full text-left text-xs text-[#14281d]">
          <thead className={`bg-[#f0f4ef] text-[#526b5c] font-semibold border-b ${theme.border}`}>
            <tr>
              <th className="py-2.5 px-4">Fecha</th>
              <th className="py-2.5 px-4">Comprobante</th>
              <th className="py-2.5 px-4">Proveedor</th>
              <th className="py-2.5 px-4">Subunidad</th>
              <th className="py-2.5 px-4 text-right">Total Final ($)</th>
              <th className="py-2.5 px-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf3ee]">
            {compras.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[#526b5c]">No hay compras ovinas registradas. Haga clic en "Nueva Compra Ovina" para registrar una.</td>
              </tr>
            ) : (
              compras.map((c) => {
                const prov = proveedores.find(p => p.id === c.proveedor_id);
                return (
                  <tr key={c.id} className="hover:bg-[#f9fbf8]">
                    <td className="py-3 px-4">{c.fecha}</td>
                    <td className="py-3 px-4 font-mono">{c.numero_comprobante}</td>
                    <td className="py-3 px-4 font-semibold">{prov ? prov.razon_social : c.proveedor_id}</td>
                    <td className="py-3 px-4 text-[#526b5c]">{c.subunidad_id}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono">{formatMoney(c.total_final)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{c.estado}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nueva Compra */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className={`p-4 ${theme.primary} text-white flex justify-between items-center`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                  Unidad Productiva: Ovinos · Gestión Comercial
                </span>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  OVINOS · REGISTRO DE COMPRA DE INSUMOS Y REPRODUCTORES
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº Comprobante / Factura</label>
                  <input
                    type="text"
                    placeholder="Ej. 0001-00004512"
                    value={form.numero_comprobante}
                    onChange={(e) => setForm({ ...form, numero_comprobante: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Proveedor</label>
                  <select
                    value={form.proveedor_id}
                    onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.razon_social}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Insumo / Ítem</label>
                  <select
                    value={form.insumo_id}
                    onChange={(e) => setForm({ ...form, insumo_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {insumos.map(i => (
                      <option key={i.id} value={i.id}>{i.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cantidad / kg</label>
                  <input
                    type="number"
                    min="1"
                    value={form.kg}
                    onChange={(e) => setForm({ ...form, kg: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Precio Unitario ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio_unitario_real}
                    onChange={(e) => setForm({ ...form, precio_unitario_real: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subunidad Imputada</label>
                  <select
                    value={form.subunidad_id}
                    onChange={(e) => setForm({ ...form, subunidad_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="OVI_CRIA">Cría Ovina</option>
                    <option value="OVI_RECRIA">Recría Borregos/as</option>
                    <option value="OVI_ENGORDE">Engorde Cordero Pesado</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span>Subtotal Neto: <b>${totalNeto.toLocaleString()}</b></span>
                <span>IVA (21%): <b>${totalIva.toLocaleString()}</b></span>
                <span className="text-emerald-800 font-bold">Total Final: ${totalFinal.toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 ${theme.primary} text-white font-semibold rounded-lg shadow-xs`}
                >
                  Confirmar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

