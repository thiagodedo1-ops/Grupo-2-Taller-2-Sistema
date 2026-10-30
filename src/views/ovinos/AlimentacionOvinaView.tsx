import React, { useState, useMemo } from 'react';
import { BaseDatosPorcina, ConsumoAlimentoReal, Usuario } from '../../types/schema';
import { Utensils, Plus, CheckCircle2, X, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const AlimentacionOvinaView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const { formatMoney } = useCurrency();
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const insumos = db.D_Insumo || [];
  const consumosOvinos = useMemo(() => {
    return (db.Consumo_Alimento_Real || []).filter(c => c.unidad_neg_id === 'UN_OVINOS' || c.subunidad_id?.startsWith('OVI'));
  }, [db.Consumo_Alimento_Real]);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    insumo_id: insumos[0]?.id || 'INS_MAIZ_PROP',
    kg_consumidos: 100,
    fase_id: 'FASE_FLUSHING',
    subunidad_id: 'OVI_FLUSHING',
    costo_unitario_imputado: 220
  });

  const handleSubmitConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.kg_consumidos) <= 0) {
      alert('Ingrese una cantidad de kilos mayor a 0');
      return;
    }

    const costoTotal = Number(formData.kg_consumidos) * Number(formData.costo_unitario_imputado);
    const consumoId = `CON_OVI_${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Guardar Consumo Real
    const nuevoConsumo: ConsumoAlimentoReal = {
      id: consumoId,
      fecha: formData.fecha,
      insumo_id: formData.insumo_id,
      unidad_neg_id: 'UN_OVINOS',
      kg_consumidos: Number(formData.kg_consumidos),
      fase_id: formData.fase_id,
      subunidad_id: formData.subunidad_id,
      costo_unitario_imputado: Number(formData.costo_unitario_imputado),
      costo_total_imputado: costoTotal,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      creado_por: currentUser?.usuario || 'admin',
      fecha_creacion: now
    };

    await onSaveRecord('Consumo_Alimento_Real', nuevoConsumo);

    // 2. Descontar stock de insumos
    await onSaveRecord('Movimientos_Stock_Insumos', {
      id: `MS_OVI_${Date.now()}`,
      fecha: formData.fecha,
      tipo_movimiento: 'CONSUMO',
      insumo_id: formData.insumo_id,
      cantidad: -Number(formData.kg_consumidos),
      um_id: 'UM_KG',
      origen_movimiento_id: consumoId,
      observaciones: `Consumo ovino en subunidad ${formData.subunidad_id}`
    });

    // 3. Imputar a costos directos (F_Costos) -> Costo de ventas / Producción
    await onSaveRecord('F_Costos', {
      id: `CST_OVI_${Date.now()}`,
      fecha: formData.fecha,
      cuenta_id: 'CTA_ALIM_MAIZ',
      unidad_neg_id: 'UN_OVINOS',
      subunidad_id: formData.subunidad_id,
      origen_costo: 'CONSUMO',
      comprobante_id: consumoId,
      importe_neto: costoTotal,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      creado_por: currentUser?.usuario || 'admin',
      fecha_creacion: now
    });

    setShowModal(false);
    setShowMenu(false);
    setFeedbackMsg(`Consumo ovino de ${Number(formData.kg_consumidos).toLocaleString()} kg registrado e imputado a costos (${formatMoney(costoTotal)}).`);
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

      {/* Encabezado con Botón Menú Desplegable */}
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <h2 className="text-xl font-bold text-[#14281d]">Alimentación, Pasturas & Suplementación Ovina</h2>
          <p className="text-xs text-[#526b5c] mt-1">Control de flushing pre-servicio, pasturas consociadas y suplementación invernal.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`px-3 py-1.5 text-xs font-semibold ${theme.badgeBg} ${theme.badgeText} rounded-lg border ${theme.badgeBorder}`}>
            Flushing Activo
          </span>

          {/* Menú Desplegable de Acciones de Alimentación */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold ${theme.primary} text-white rounded-lg shadow-xs transition-colors cursor-pointer`}
            >
              <Utensils className="w-4 h-4" />
              <span>Acciones Alimentación</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 text-xs">
                <button
                  onClick={() => { setShowModal(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>Registrar Consumo Real</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Consumos Ovinos */}
      <div className={`bg-white border ${theme.border} rounded-xl overflow-hidden shadow-xs`}>
        <div className={`p-4 border-b ${theme.border} ${theme.secondaryBg} flex justify-between items-center`}>
          <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">Historial de Consumos Reales (Ovinos)</span>
          <span className="text-xs text-[#526b5c]">{consumosOvinos.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#14281d]">
            <thead className={`bg-[#f0f4ef] text-[#526b5c] font-semibold border-b ${theme.border}`}>
              <tr>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Insumo / Ración</th>
                <th className="py-2.5 px-3">Subunidad / Destino</th>
                <th className="py-2.5 px-3 text-right">Kg Consumidos</th>
                <th className="py-2.5 px-3 text-right">Costo Imputado ($)</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ee]">
              {consumosOvinos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#526b5c]">
                    No hay consumos ovinos registrados. Haga clic en <strong>Acciones Alimentación &gt; Registrar Consumo Real</strong>.
                  </td>
                </tr>
              ) : (
                consumosOvinos.map(c => {
                  const ins = insumos.find(i => i.id === c.insumo_id);
                  return (
                    <tr key={c.id} className="hover:bg-[#f9fbf8]">
                      <td className="py-3 px-3 font-mono">{c.fecha}</td>
                      <td className="py-3 px-3 font-bold">{ins ? ins.nombre : c.insumo_id}</td>
                      <td className="py-3 px-3 text-[#526b5c]">{c.subunidad_id}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{Number(c.kg_consumidos).toLocaleString('es-AR')} kg</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">{formatMoney(c.costo_total_imputado || 0)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{c.estado}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`bg-white border ${theme.border} rounded-xl overflow-hidden shadow-xs`}>
        <div className={`p-4 border-b ${theme.border} ${theme.secondaryBg} flex justify-between items-center`}>
          <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">Plan Alimentario y Raciones Majada</span>
          <span className="text-xs text-[#526b5c]">Maíz propio UNRC & Pellet de Soja</span>
        </div>
        <div className="p-6 text-center text-xs text-[#526b5c]">
          <p className="font-semibold text-[#14281d] mb-1">Dieta Balanceada Ovina (Sistema Intensivo / Pastoreo)</p>
          <p>Consumo diario estimado: 0.8 kg materia seca / cabeza / día + Pastura alfalfa / cebadilla.</p>
        </div>
      </div>

      {/* MODAL: REGISTRAR CONSUMO REAL OVINO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className={`p-4 ${theme.primary} text-white flex justify-between items-center`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                  Unidad Productiva: Ovinos · Alimentación
                </span>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  OVINOS · REGISTRAR CONSUMO DE ALIMENTO REAL
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitConsumo} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha de Consumo *:</label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Insumo / Ración *:</label>
                <select
                  value={formData.insumo_id}
                  onChange={e => setFormData({ ...formData, insumo_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                >
                  {insumos.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre} ({i.tipo_insumo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subunidad / Destino Ovino *:</label>
                <select
                  value={formData.subunidad_id}
                  onChange={e => setFormData({ ...formData, subunidad_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                >
                  <option value="OVI_CRIA">OVI_CRIA (Cría / Majada General)</option>
                  <option value="OVI_FLUSHING">OVI_FLUSHING (Flushing Pre-servicio)</option>
                  <option value="OVI_ENGORDE">OVI_ENGORDE (Engorde Corderos)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kilos Consumidos *:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.kg_consumidos}
                    onChange={e => setFormData({ ...formData, kg_consumidos: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Unitario ($/kg) *:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costo_unitario_imputado}
                    onChange={e => setFormData({ ...formData, costo_unitario_imputado: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span>Costo Total Imputado:</span>
                <strong className="text-emerald-800 font-bold text-sm">${(Number(formData.kg_consumidos) * Number(formData.costo_unitario_imputado)).toLocaleString('es-AR')}</strong>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 ${theme.primary} text-white font-semibold rounded-lg shadow-xs cursor-pointer`}
                >
                  Guardar e Imputar Costo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
