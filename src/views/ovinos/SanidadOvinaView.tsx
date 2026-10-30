import React, { useState } from 'react';
import { BaseDatosPorcina, EventoSanitarioOvino, Usuario } from '../../types/schema';
import { ShieldCheck, Plus, CheckCircle2, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const SanidadOvinaView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const { formatMoney } = useCurrency();
  const sanidad = db.Eventos_Sanitarios_Ovinos || [];
  const [showModal, setShowModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo_evento: 'Desparasitación' as EventoSanitarioOvino['tipo_evento'],
    cabezas_tratadas: 100,
    producto_aplicado: 'Ivermectina 1% / Closantel',
    responsable: currentUser?.nombre || 'Dr. Veterinario',
    observaciones: '',
    costo_total: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.cabezas_tratadas) <= 0) {
      alert('Ingrese una cantidad válida de cabezas tratadas');
      return;
    }

    const now = new Date().toISOString();
    const eventoId = `SAN_OVI_${Date.now()}`;
    const nuevoEvento: EventoSanitarioOvino = {
      id: eventoId,
      fecha: form.fecha,
      tipo_evento: form.tipo_evento,
      cabezas_tratadas: Number(form.cabezas_tratadas),
      producto_aplicado: form.producto_aplicado,
      responsable: form.responsable,
      observaciones: form.observaciones
    };

    const res = await onSaveRecord('Eventos_Sanitarios_Ovinos', nuevoEvento);
    if (res && res.success === false) {
      alert('Error al guardar evento sanitario: ' + res.error);
      return;
    }

    // Imputar costo si es mayor a 0
    if (Number(form.costo_total) > 0) {
      await onSaveRecord('F_Costos', {
        id: `CST_OVI_SAN_${Date.now()}`,
        fecha: form.fecha,
        cuenta_id: 'CTA_SANIDAD_OVINA',
        unidad_neg_id: 'UN_OVINOS',
        subunidad_id: 'OVI_GENERAL',
        origen_costo: 'CONSUMO',
        comprobante_id: eventoId,
        importe_neto: Number(form.costo_total),
        estado: 'Confirmado',
        origen_dato: 'REAL',
        estado_validacion: 'OK'
      });
    }

    setShowModal(false);
    setFeedbackMsg(`Evento sanitario (${form.tipo_evento}) registrado e imputado con éxito (${formatMoney(form.costo_total)}).`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6 relative">
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#14281d] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-emerald-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#14281d]">Manejo Sanitario & Señalada Ovina</h2>
            <p className="text-xs text-[#526b5c] mt-1">Control de tratamientos sanitarios, vacunación clostridial, baños y señalada de corderos.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold ${theme.primary} text-white rounded-lg shadow-xs transition-colors cursor-pointer`}
          >
            <Plus className="w-4 h-4" />
            Registrar Evento Sanitario
          </button>
        </div>
      </div>

      <div className={`bg-white border ${theme.border} rounded-xl overflow-hidden shadow-xs`}>
        <div className={`p-4 border-b ${theme.border} ${theme.secondaryBg} flex justify-between items-center`}>
          <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">Historial de Eventos Sanitarios Ovinos</span>
          <span className="text-xs text-[#526b5c]">{sanidad.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#14281d]">
            <thead className={`bg-[#f0f4ef] text-[#526b5c] font-semibold border-b ${theme.border}`}>
              <tr>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Tipo Evento</th>
                <th className="py-2.5 px-4 text-right">Cabezas Tratadas</th>
                <th className="py-2.5 px-4">Producto Aplicado</th>
                <th className="py-2.5 px-4 text-right">Costo ($)</th>
                <th className="py-2.5 px-4">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ee]">
              {sanidad.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#526b5c]">
                    No hay eventos sanitarios ovinos registrados. Haga clic en <strong>Registrar Evento Sanitario</strong>.
                  </td>
                </tr>
              ) : (
                sanidad.map((san) => (
                  <tr key={san.id} className="hover:bg-[#f9fbf8]">
                    <td className="py-3 px-4 font-mono">{san.fecha}</td>
                    <td className="py-3 px-4 font-bold text-[#14281d]">{san.tipo_evento}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{Number(san.cabezas_tratadas).toLocaleString('es-AR')} cab.</td>
                    <td className="py-3 px-4">{san.producto_aplicado}</td>
                    <td className="py-3 px-4 text-right">{/* Costo would need to be fetched/linked */} -</td>
                    <td className="py-3 px-4 text-[#526b5c]">{san.responsable}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Registrar Evento Sanitario Ovino</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm({ ...form, fecha: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Evento</label>
                  <select
                    value={form.tipo_evento}
                    onChange={e => setForm({ ...form, tipo_evento: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Desparasitación">Desparasitación</option>
                    <option value="Vacunación Clostridial / Enterotoxemia">Vacunación Clostridial / Enterotoxemia</option>
                    <option value="Baño de Sarna">Baño de Sarna</option>
                    <option value="Revisación Pre-Servicio">Revisación Pre-Servicio</option>
                    <option value="Señalada">Señalada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cabezas Tratadas</label>
                  <input
                    type="number"
                    value={form.cabezas_tratadas}
                    onChange={e => setForm({ ...form, cabezas_tratadas: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Total ($)</label>
                  <input
                    type="number"
                    value={form.costo_total}
                    onChange={e => setForm({ ...form, costo_total: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Producto Aplicado</label>
                <input
                  type="text"
                  value={form.producto_aplicado}
                  onChange={e => setForm({ ...form, producto_aplicado: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Responsable</label>
                <input
                  type="text"
                  value={form.responsable}
                  onChange={e => setForm({ ...form, responsable: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  rows={2}
                  placeholder="Detalles adicionales del tratamiento..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 ${theme.primary} text-white font-semibold rounded-lg shadow-xs hover:opacity-95`}
                >
                  Guardar Evento y Costo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
