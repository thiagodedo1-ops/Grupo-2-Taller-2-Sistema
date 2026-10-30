/**
 * @file MangaPesadasBovinoView.tsx
 * @description Sub-módulo: Manga & Pesadas (ADPV)
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Control zootécnico del aumento diario de peso vivo (ADPV), sesiones de manga por animal o tropa,
 * condición corporal (1 a 9) y evolución periódica de invernada.
 */

import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  X, 
  Search,
  Filter,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { BaseDatosPorcina, PesadaBovina, Usuario } from '../../types/schema';
import { getRolePermissions } from '../../lib/permissions';
import { useTheme } from '../../context/ThemeContext';
import { RowActions } from '../../components/RowActions';
import { RecordDetailModal } from '../../components/RecordDetailModal';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const MangaPesadasBovinoView: React.FC<Props> = ({
  db,
  currentUser,
  onSaveRecord
}) => {
  const { theme } = useTheme();
  const permissions = getRolePermissions(currentUser);
  const pesadas = db.Pesadas_Bovinas || [];
  const categorias = db.Categorias_Bovinas || [];

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showPesadaModal, setShowPesadaModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [editingPesadaId, setEditingPesadaId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<{ record: any; tableName: string; unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS'; title: string } | null>(null);

  // Formulario de Pesada
  const [pesadaForm, setPesadaForm] = useState({
    categoria_id: 'BOV_NOV',
    lote_o_caravana: 'Tropa Novillitos 2024',
    fecha: new Date().toISOString().split('T')[0],
    peso_kg: 410,
    peso_anterior_kg: 372,
    dias_periodo: 42,
    condicion_corporal: 6.5,
    observaciones: 'Pesada de control de manga previa a cambio de potrero'
  });

  const handleEditarPesada = (p: PesadaBovina) => {
    setEditingPesadaId(p.id);
    setPesadaForm({
      categoria_id: p.categoria_id || 'BOV_NOV',
      lote_o_caravana: p.lote_o_caravana || '',
      fecha: p.fecha || new Date().toISOString().split('T')[0],
      peso_kg: Number(p.peso_kg) || 410,
      peso_anterior_kg: Number(p.peso_anterior_kg) || 372,
      dias_periodo: Number(p.dias_periodo) || 42,
      condicion_corporal: Number(p.condicion_corporal) || 6.5,
      observaciones: p.observaciones || ''
    });
    setShowPesadaModal(true);
  };

  // Cálculo en vivo de ADPV
  const adpvCalculado = useMemo(() => {
    if (pesadaForm.dias_periodo > 0 && pesadaForm.peso_kg > pesadaForm.peso_anterior_kg) {
      return Number(((pesadaForm.peso_kg - pesadaForm.peso_anterior_kg) / pesadaForm.dias_periodo).toFixed(3));
    }
    return 0.85;
  }, [pesadaForm.peso_kg, pesadaForm.peso_anterior_kg, pesadaForm.dias_periodo]);

  const handleGuardarPesada = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevaPesada: PesadaBovina = {
      id: editingPesadaId || `PES_BOV_${Date.now()}`,
      ...pesadaForm,
      peso_kg: Number(pesadaForm.peso_kg),
      peso_anterior_kg: Number(pesadaForm.peso_anterior_kg),
      dias_periodo: Number(pesadaForm.dias_periodo),
      adpv_calculado: adpvCalculado,
      condicion_corporal: Number(pesadaForm.condicion_corporal)
    };
    await onSaveRecord('Pesadas_Bovinas', nuevaPesada);
    setEditingPesadaId(null);
    setShowPesadaModal(false);
    setFeedbackMsg(`Pesada ${editingPesadaId ? 'actualizada' : 'registrada'} para ${nuevaPesada.lote_o_caravana}. ADPV calculado: +${nuevaPesada.adpv_calculado} kg/día.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const pesadasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return pesadas;
    return pesadas.filter(p => 
      p.lote_o_caravana.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.fecha.includes(busqueda)
    );
  }, [pesadas, busqueda]);

  // Métricas de Manga
  const adpvPromedio = useMemo(() => {
    if (pesadas.length === 0) return 0.84;
    const sum = pesadas.reduce((acc, p) => acc + (p.adpv_calculado || 0), 0);
    return Number((sum / pesadas.length).toFixed(2));
  }, [pesadas]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#2c1d11] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-[#8c674e] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#e7d4c4]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`p-1.5 ${theme.iconBg} rounded-lg`}>
              <Scale className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5c3a21]">
              Producción Bovina · Pozo del Carril (UNRC)
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#2c1d11] tracking-tight">
            Manga & Pesadas (Aumento Diario de Peso Vivo · ADPV)
          </h1>
          <p className="text-xs text-[#5c3a21] mt-0.5">
            Registro dinámico de pesadas en balanza, cálculo de ganancia diaria individual/tropa y condición corporal (1 a 9)
          </p>
        </div>

        <button
          onClick={() => setShowPesadaModal(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${theme.primary} rounded-lg shadow-xs transition-colors cursor-pointer shrink-0`}
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Pesada en Manga</span>
        </button>
      </div>

      {/* Resumen Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#e7d4c4] shadow-xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase">ADPV Promedio Rodeo</div>
          <div className="text-2xl font-bold text-[#78350f] font-mono tabular-nums mt-1">
            +{adpvPromedio} <span className="text-xs font-normal text-[#5c3a21]">kg/cab/día</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">Meta zootécnica: &gt;0.85 kg/día</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e7d4c4] shadow-xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase">Sesiones Registradas</div>
          <div className="text-2xl font-bold text-[#2c1d11] font-mono tabular-nums mt-1">
            {pesadas.length} <span className="text-xs font-normal text-[#5c3a21]">eventos</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">Historial acumulado en manga</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e7d4c4] shadow-xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase">Última Tropa Pesada</div>
          <div className="text-lg font-bold text-[#2c1d11] truncate mt-1">
            {pesadas[0]?.lote_o_caravana || 'Tropa Novillitos'}
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">Fecha: {pesadas[0]?.fecha || 'Reciente'}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e7d4c4] shadow-xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase">Condición Corporal Media</div>
          <div className="text-2xl font-bold text-[#2c1d11] font-mono tabular-nums mt-1">
            6.2 <span className="text-xs font-normal text-[#5c3a21]">/ 9</span>
          </div>
          <div className="text-[11px] text-[#78350f] font-semibold mt-0.5">Estado Nutricional Bueno</div>
        </div>
      </div>

      {/* Tabla de Sesiones de Pesada */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2e6de] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#2c1d11]">Historial de Sesiones de Pesaje en Balanza</h2>
            <p className="text-xs text-[#5c3a21]">Evolución ponderal, cálculo de ADPV entre fechas y condición corporal</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#8c674e] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por lote o fecha..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-[#2c1d11] placeholder-[#8c674e] focus:outline-none focus:border-[#78350f]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e7d4c4] text-[#8c674e] font-semibold bg-[#fbf4ee]">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Tropa / Caravana</th>
                <th className="py-2.5 px-3 text-right">Peso Anterior</th>
                <th className="py-2.5 px-3 text-right">Peso Actual</th>
                <th className="py-2.5 px-3 text-right">Ganancia Total</th>
                <th className="py-2.5 px-3 text-right">Días</th>
                <th className="py-2.5 px-3 text-right">ADPV Calculado</th>
                <th className="py-2.5 px-3 text-center">CC (1-9)</th>
                <th className="py-2.5 px-3">Observaciones</th>
                <th className="py-2.5 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2e6de]">
              {pesadasFiltradas.map((pesada) => {
                const pesoAnt = pesada.peso_anterior_kg ?? pesada.peso_kg;
                const ganancia = pesada.peso_kg - pesoAnt;
                const adpv = pesada.adpv_calculado ?? 0;
                return (
                  <tr key={pesada.id} className="hover:bg-[#fbf4ee] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#5c3a21]">
                      {pesada.fecha}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#2c1d11]">
                      {pesada.lote_o_caravana}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#5c3a21]">
                      {pesada.peso_anterior_kg ? `${pesada.peso_anterior_kg} kg` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#2c1d11]">
                      {pesada.peso_kg} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#5c3a21]">
                      +{ganancia} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#5c3a21]">
                      {pesada.dias_periodo} d
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#78350f]">
                      +{adpv.toFixed(3)} kg/d
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-[#5c3a21]">
                      {pesada.condicion_corporal || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[#5c3a21] max-w-xs truncate">
                      {pesada.observaciones || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <RowActions
                        unit="BOVINOS"
                        canEdit={permissions.canEdit('produccion')}
                        onViewDetail={() => setDetailRecord({ record: pesada, tableName: 'Pesadas_Bovinas', unit: 'BOVINOS', title: `PESADA BOVINA (${pesada.id})` })}
                        onEdit={() => handleEditarPesada(pesada)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Pesada */}
      {showPesadaModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-scale-in border border-[#e7d4c4]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#78350f] block">
                  Unidad Productiva: Bovinos · Manga & ADPV
                </span>
                <h3 className="text-base font-bold text-[#2c1d11]">
                  BOVINOS · REGISTRO DE PESADA
                </h3>
              </div>
              <button onClick={() => setShowPesadaModal(false)} className="text-[#8c674e] hover:text-[#2c1d11] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarPesada} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={pesadaForm.fecha}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, fecha: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] bg-[#fbf4ee] rounded-lg text-[#2c1d11]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Tropa o Caravana</label>
                  <input
                    type="text"
                    required
                    value={pesadaForm.lote_o_caravana}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, lote_o_caravana: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] bg-[#fbf4ee] rounded-lg text-[#2c1d11]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Peso Anterior (kg)</label>
                  <input
                    type="number"
                    required
                    value={pesadaForm.peso_anterior_kg}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, peso_anterior_kg: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] bg-[#fbf4ee] rounded-lg text-[#2c1d11]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Peso Actual (kg)</label>
                  <input
                    type="number"
                    required
                    value={pesadaForm.peso_kg}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, peso_kg: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] bg-[#fbf4ee] rounded-lg text-[#2c1d11]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Días Intervalo</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pesadaForm.dias_periodo}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, dias_periodo: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] bg-[#fbf4ee] rounded-lg text-[#2c1d11]"
                  />
                </div>
              </div>

              {/* Banner de Cálculo en Vivo de ADPV */}
              <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#78350f] block">ADPV Calculado Automáticamente:</span>
                  <span className="text-lg font-bold font-mono text-[#78350f]">+{adpvCalculado} kg/cab/día</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#5c3a21] block">Ganancia Bruta:</span>
                  <span className="text-xs font-bold text-[#2c1d11]">+{pesadaForm.peso_kg - pesadaForm.peso_anterior_kg} kg en {pesadaForm.dias_periodo} días</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Condición Corporal (1-9)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="9"
                    value={pesadaForm.condicion_corporal}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, condicion_corporal: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] bg-[#fbf4ee] rounded-lg text-[#2c1d11]"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Categoría</label>
                  <select
                    value={pesadaForm.categoria_id}
                    onChange={(e) => setPesadaForm({ ...pesadaForm, categoria_id: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#e7d4c4] bg-[#fbf4ee] rounded-lg text-[#2c1d11]"
                  >
                    <option value="BOV_NOV">Novillo</option>
                    <option value="BOV_NVL">Novillito</option>
                    <option value="BOV_VAQ">Vaquillona</option>
                    <option value="BOV_TRN">Ternero</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Observaciones</label>
                <input
                  type="text"
                  value={pesadaForm.observaciones}
                  onChange={(e) => setPesadaForm({ ...pesadaForm, observaciones: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e7d4c4] bg-[#fbf4ee] rounded-lg text-[#2c1d11]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowPesadaModal(false)}
                  className="px-3 py-1.5 text-xs text-[#5c3a21] hover:bg-[#fbf4ee] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#78350f] hover:bg-[#5c280b] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Pesada
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
        unit={detailRecord?.unit || 'BOVINOS'}
        title={detailRecord?.title || ''}
        db={db}
        onClose={() => setDetailRecord(null)}
      />
    </div>
  );
};
