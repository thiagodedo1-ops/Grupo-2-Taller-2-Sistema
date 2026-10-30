import React, { useState } from 'react';
import { BaseDatosPorcina, MovComercialEnc, MovComercialDet, Usuario } from '../../types/schema';
import { TrendingUp, Plus, CheckCircle2, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const VentasOvinasView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const { formatMoney } = useCurrency();
  const [showModal, setShowModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const clientes = db.Clientes || [];
  const categorias = db.Categorias_Ovinas || [];
  const ventas = db.Mov_Comercial_Enc.filter(m => m.tipo_operacion === 'VENTA' && (m.unidad_neg_id === 'UN_OVINOS' || m.subunidad_id?.startsWith('OVI')));

  const [form, setForm] = useState({
    numero_comprobante: '',
    fecha: new Date().toISOString().split('T')[0],
    cliente_id: clientes[0]?.id || 'CLI_FRIGORIFICO',
    categoria_id: categorias[0]?.id || 'CAT_OVI_CORDERO',
    cabezas: 25,
    kg_promedio: 38,
    precio_unitario_kg: 3200,
    costo_flete: 0,
    descuento_comercial_pct: 0,
    descuento_comercial_motivo: '',
    cabezas_muertas_transporte: 0,
    subunidad_id: 'OVI_ENGORDE'
  });

  const totalKg = Number(form.cabezas) * Number(form.kg_promedio);
  const importeBruto = totalKg * Number(form.precio_unitario_kg);
  const descPct = Math.min(100, Math.max(0, Number(form.descuento_comercial_pct) || 0));
  const descImporte = (importeBruto * descPct) / 100;
  const costoFlete = Number(form.costo_flete) || 0;
  const totalNeto = importeBruto - descImporte - costoFlete;
  const totalFinal = totalNeto;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero_comprobante.trim()) {
      alert('Ingrese el número de comprobante o DTE');
      return;
    }

    const encId = `MOV_VENTA_OVI_${Date.now()}`;
    const nuevoEnc: Partial<MovComercialEnc> = {
      id: encId,
      tipo_comprobante_id: 'TC_FAC_A',
      punto_venta: '0002',
      numero_comprobante: form.numero_comprobante,
      fecha: form.fecha,
      cliente_id: form.cliente_id,
      tipo_operacion: 'VENTA',
      unidad_neg_id: 'UN_OVINOS',
      subunidad_id: form.subunidad_id,
      total_neto: totalNeto,
      total_iva: 0,
      total_percepciones: 0,
      total_retenciones: 0,
      total_final: totalFinal,
      costo_flete: costoFlete,
      descuento_comercial_pct: descPct,
      descuento_comercial_importe: descImporte,
      descuento_comercial_motivo: form.descuento_comercial_motivo,
      cabezas_muertas_transporte: Number(form.cabezas_muertas_transporte) || 0,
      estado: 'Confirmado',
      origen_dato: 'REAL'
    };

    const resEnc = await onSaveRecord('Mov_Comercial_Enc', nuevoEnc);
    if (resEnc.success === false) {
      alert('Error al guardar venta: ' + resEnc.error);
      return;
    }

    const nuevoDet: Partial<MovComercialDet> = {
      id: `MOV_VENTA_DET_OVI_${Date.now()}`,
      mov_comercial_id: encId,
      numero_linea: 1,
      kg: totalKg,
      precio_unitario_real: Number(form.precio_unitario_kg),
      importe_neto: totalNeto,
      alicuota_iva: 0,
      importe_iva: 0,
      destino_productivo_id: form.subunidad_id
    };
    await onSaveRecord('Mov_Comercial_Det', nuevoDet);

    setShowModal(false);
    setFeedbackMsg(`Venta ovina de ${form.cabezas} cabezas registrada con éxito ($${totalFinal.toLocaleString()}).`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#14281d]">Venta de Corderos, Carne & Lana</h2>
            <p className="text-xs text-[#526b5c] mt-1">Comercialización de cordero pesado, capones y zafra lanera con emisión de DTE, descuento comercial, fletes y mortandad.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold ${theme.primary} text-white rounded-lg shadow-xs transition-colors cursor-pointer`}
          >
            <Plus className="w-4 h-4" />
            Nueva Venta Ovina
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
          <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">Historial de Ventas Ovinas</span>
          <span className="text-xs text-[#526b5c]">{ventas.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#14281d]">
            <thead className={`bg-[#f0f4ef] text-[#526b5c] font-semibold border-b ${theme.border}`}>
              <tr>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Comprobante</th>
                <th className="py-2.5 px-3">Cliente / Consignatario</th>
                <th className="py-2.5 px-3">Subunidad</th>
                <th className="py-2.5 px-3 text-right">Flete ($)</th>
                <th className="py-2.5 px-3 text-right">Descuento (%)</th>
                <th className="py-2.5 px-3 text-right">Muertes Flete</th>
                <th className="py-2.5 px-3 text-right">Importe Neto ($)</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ee]">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-[#526b5c]">No hay ventas ovinas registradas. Haga clic en "Nueva Venta Ovina" para registrar una.</td>
                </tr>
              ) : (
                ventas.map((v) => {
                  const cli = clientes.find(c => c.id === v.cliente_id);
                  return (
                    <tr key={v.id} className="hover:bg-[#f9fbf8]">
                      <td className="py-3 px-3">{v.fecha}</td>
                      <td className="py-3 px-3 font-mono">{v.numero_comprobante}</td>
                      <td className="py-3 px-3 font-semibold">{cli ? cli.razon_social : v.cliente_id}</td>
                      <td className="py-3 px-3 text-[#526b5c]">{v.subunidad_id}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatMoney(v.costo_flete || 0)}</td>
                      <td className="py-3 px-3 text-right font-mono">{v.descuento_comercial_pct || 0}%</td>
                      <td className="py-3 px-3 text-right font-mono">{v.cabezas_muertas_transporte || 0} cab</td>
                      <td className="py-3 px-3 text-right font-bold font-mono text-emerald-800">{formatMoney(v.total_final)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{v.estado}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Venta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className={`p-4 ${theme.primary} text-white flex justify-between items-center`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                  Unidad Productiva: Ovinos · Gestión Comercial
                </span>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  OVINOS · REGISTRO DE VENTA DE HACIENDA / CORDERO PESADO
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº Comprobante / DTE</label>
                  <input
                    type="text"
                    placeholder="Ej. DTE-00214587"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cliente / Frigorífico</label>
                  <select
                    value={form.cliente_id}
                    onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.razon_social}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría Ovina</label>
                  <select
                    value={form.categoria_id}
                    onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.categoria} ({cat.cabezas} cab)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cabezas</label>
                  <input
                    type="number"
                    min="1"
                    value={form.cabezas}
                    onChange={(e) => setForm({ ...form, cabezas: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peso Prom. (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.kg_promedio}
                    onChange={(e) => setForm({ ...form, kg_promedio: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Precio ($/kg vivo)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio_unitario_kg}
                    onChange={(e) => setForm({ ...form, precio_unitario_kg: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Flete ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.costo_flete}
                    onChange={(e) => setForm({ ...form, costo_flete: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Muertes en Flete (Cabezas)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.cabezas_muertas_transporte}
                    onChange={(e) => setForm({ ...form, cabezas_muertas_transporte: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.descuento_comercial_pct}
                    onChange={(e) => setForm({ ...form, descuento_comercial_pct: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Motivo Descuento / Bonificación</label>
                  <input
                    type="text"
                    placeholder="Ej. Bonificación por lote"
                    value={form.descuento_comercial_motivo}
                    onChange={(e) => setForm({ ...form, descuento_comercial_motivo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span>Kilos Totales: <b>{totalKg.toLocaleString()} kg</b></span>
                <span className="text-emerald-800 font-bold text-sm">Importe Neto: ${totalFinal.toLocaleString()}</span>
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
                  className={`px-4 py-2 ${theme.primary} text-white font-semibold rounded-lg shadow-xs cursor-pointer`}
                >
                  Confirmar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
