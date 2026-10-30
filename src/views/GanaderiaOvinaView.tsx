/**
 * @file GanaderiaOvinaView.tsx
 * @description Módulo de Gestión Ganadera Ovina - Establecimiento Pozo del Carril (UNRC)
 * Control de Majada, Señalada, Zafra Lanera (PROLANA), Condición Corporal y Sanidad
 */

import React, { useState, useMemo } from 'react';
import { BaseDatosPorcina, CategoriaOvina, ZafraLanera, EventoSanitarioOvino, Usuario } from '../types/schema';
import { 
  Sparkles, 
  Layers, 
  Scissors, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Scale, 
  CircleDot,
  Star,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { calcularTodosLosIndicadoresCMIOvino } from '../lib/cmiOvinoCalculations';
import { METAS_INICIALES_OVINO, MetaIndicadorOvinoCMI } from '../lib/cmiOvinoConstants';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const GanaderiaOvinaView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const { formatMoney, currency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'majada' | 'zafra' | 'sanidad'>('majada');
  const [showNewZafraModal, setShowNewZafraModal] = useState(false);
  const [showNewSanidadModal, setShowNewSanidadModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const categorias = db.Categorias_Ovinas || [];
  const zafras = db.Zafras_Laneras || [];
  const sanidad = db.Eventos_Sanitarios_Ovinos || [];

  // Cálculos de Majada
  const totalCabezas = categorias.reduce((acc, c) => acc + (c.cabezas || 0), 0);
  const ovejasObj = categorias.find(c => c.categoria.includes('Oveja'));
  const corderosObj = categorias.find(c => c.categoria.includes('Cordero'));
  
  const cabezasOvejas = ovejasObj?.cabezas || 135;
  const cabezasCorderos = corderosObj?.cabezas || 122;
  const porcentajeSenalada = ((cabezasCorderos / cabezasOvejas) * 100).toFixed(1);

  // Kilos de lana totales históricos
  const totalKgLana = zafras.reduce((acc, z) => acc + (z.kg_lana_total || 0), 0);

  // CMI Ovino - Indicadores Prioritarios
  const userStorageKey = `pozo_del_carril_cmi_ovino_prioritarios_${currentUser?.usuario_id || 'default'}`;
  const prioritariosIds = useMemo(() => {
    try {
      const guardados = localStorage.getItem(userStorageKey);
      if (guardados) return JSON.parse(guardados);
    } catch {}
    return METAS_INICIALES_OVINO.filter(m => m.esPrioritario).map(m => m.id);
  }, [currentUser, userStorageKey]);

  const indicadoresPrioritarios = useMemo(() => {
    const todos = calcularTodosLosIndicadoresCMIOvino(db);
    return todos.filter(ind => prioritariosIds.includes(ind.id));
  }, [db, prioritariosIds]);

  // Form State: Nueva Zafra Lanera
  const [zafraForm, setZafraForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    campana_id: 'CAMP_2024_2025',
    animales_esquilados: 165,
    kg_lana_total: 630,
    kg_promedio_vellon: 3.8,
    finura_micras_aprox: 24.5,
    destino_comercial: 'Barraca Propietarios Río Cuarto',
    precio_obtenido_kg: 2500,
    observaciones: 'Esquila desmane con acondicionado y acondicionador PROLANA habilitado'
  });

  // Form State: Nuevo Evento Sanitario
  const [sanidadForm, setSanidadForm] = useState({
    tipo_evento: 'Vacunación Clostridial / Enterotoxemia' as EventoSanitarioOvino['tipo_evento'],
    fecha: new Date().toISOString().split('T')[0],
    cabezas_tratadas: totalCabezas,
    producto_aplicado: 'Polivalente Clostridial 8 vías',
    responsable: 'Méd. Veterinario / Encargado de Majada',
    observaciones: 'Vacunación estratégica de otoño'
  });

  const handleCreateZafra = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: ZafraLanera = {
      id: `ZAF_${Date.now()}`,
      ...zafraForm,
      animales_esquilados: Number(zafraForm.animales_esquilados),
      kg_lana_total: Number(zafraForm.kg_lana_total),
      kg_promedio_vellon: Number(zafraForm.kg_promedio_vellon),
      finura_micras_aprox: Number(zafraForm.finura_micras_aprox),
      precio_obtenido_kg: Number(zafraForm.precio_obtenido_kg)
    };
    await onSaveRecord('Zafras_Laneras', newRecord);
    setShowNewZafraModal(false);
    setFeedbackMsg(`Zafra lanera registrada exitosamente: ${zafraForm.kg_lana_total} kg obtenidos.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleCreateSanidad = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: EventoSanitarioOvino = {
      id: `SAN_OVI_${Date.now()}`,
      ...sanidadForm,
      cabezas_tratadas: Number(sanidadForm.cabezas_tratadas)
    };
    await onSaveRecord('Eventos_Sanitarios_Ovinos', newRecord);
    setShowNewSanidadModal(false);
    setFeedbackMsg('Evento sanitario de majada registrado correctamente.');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Encabezado y Métricas Principales */}
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${theme.border}`}>
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] rounded-2xl flex items-center justify-center shrink-0">
              <CircleDot className="w-6 h-6 text-[#1e40af]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
                Unidad Ganadera Ovina · Carne y Lana
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                Establecimiento Pozo del Carril · La Aguada (UNRC) · Majada Doble Propósito
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewZafraModal(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold ${theme.primary} rounded-lg shadow-xs transition-colors cursor-pointer`}
            >
              <Scissors className="w-4 h-4" />
              Registrar Esquila / Zafra
            </button>
            <button
              onClick={() => setShowNewSanidadModal(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold ${theme.badgeText} ${theme.secondaryBg} hover:opacity-90 border ${theme.badgeBorder} rounded-lg shadow-xs transition-colors cursor-pointer`}
            >
              <ShieldCheck className="w-4 h-4" />
              Sanidad / Señalada
            </button>
          </div>
        </div>

        {/* Notificación de feedback */}
        {feedbackMsg && (
          <div className={`mt-3 p-3 ${theme.badgeBg} border ${theme.badgeBorder} ${theme.badgeText} rounded-lg text-xs font-medium flex items-center gap-2`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Tarjetas de Métricas Ovinas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className={`${theme.secondaryBg} border ${theme.border} rounded-lg p-3`}>
            <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider block">Stock Total Majada</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#0f172a]">{totalCabezas}</span>
              <span className="text-xs text-[#334155]">cabezas</span>
            </div>
            <span className="text-[11px] text-[#64748b] mt-0.5 block">{cabezasOvejas} vientres encarnerados</span>
          </div>

          <div className={`${theme.secondaryBg} border ${theme.border} rounded-lg p-3`}>
            <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider block">Índice de Señalada</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${theme.primaryText}`}>{porcentajeSenalada}%</span>
              <span className="text-xs text-[#334155]">corderos logrados</span>
            </div>
            <span className={`text-[11px] ${theme.primaryText} mt-0.5 block`}>{cabezasCorderos} corderos al destete</span>
          </div>

          <div className={`${theme.secondaryBg} border ${theme.border} rounded-lg p-3`}>
            <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider block">Condición Corporal</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${theme.primaryText}`}>3.2</span>
              <span className="text-xs text-[#334155]">escala 1 a 5</span>
            </div>
            <span className={`text-[11px] ${theme.primaryText} mt-0.5 block`}>Flushing con maíz propio</span>
          </div>

          <div className={`${theme.secondaryBg} border ${theme.border} rounded-lg p-3`}>
            <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider block">Zafra Lanera</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#14281d]">{totalKgLana}</span>
              <span className="text-xs text-[#526b5c]">kg lana vellón</span>
            </div>
            <span className={`text-[11px] ${theme.primaryText} font-semibold mt-0.5 block`}>3.8 kg/vellón promedio</span>
          </div>
        </div>
      </div>

      {/* Sección: Mis Indicadores Prioritarios (CMI Ovino) */}
      <div className="bg-white border border-[#cbd5e1] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#eff6ff] text-[#1e40af] rounded-lg border border-[#bfdbfe]">
              <Star className="w-4 h-4 fill-[#1e40af]" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Indicadores Clave Prioritarios (CMI Ovino)</h3>
              <p className="text-xs text-[#64748b]">
                Monitoreo en tiempo real de los indicadores seleccionados como prioritarios en la unidad ovina
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[#1e40af] bg-[#eff6ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
            {indicadoresPrioritarios.length} prioritarios
          </span>
        </div>

        {indicadoresPrioritarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicadoresPrioritarios.map((ind) => {
              let cardStyle = 'border-emerald-200 bg-emerald-50/40 text-emerald-800';
              let tagStyle = 'text-[#1c4b31]';

              if (ind.estadoSemaforo === 'VERDE') {
                cardStyle = 'border-emerald-200 bg-emerald-50/40 text-emerald-800';
                tagStyle = 'text-[#1c4b31]';
              } else if (ind.estadoSemaforo === 'AMARILLO') {
                cardStyle = 'border-amber-200 bg-amber-50/40 text-amber-800';
                tagStyle = 'text-[#92400e]';
              } else if (ind.estadoSemaforo === 'ROJO') {
                cardStyle = 'border-rose-200 bg-rose-50/40 text-rose-800';
                tagStyle = 'text-rose-700';
              } else {
                cardStyle = 'border-slate-200 bg-slate-50/50 text-slate-800';
                tagStyle = 'text-slate-600';
              }

              const displayValue = currency === 'USD' && ind.datosDisponibles && ind.valorCalculado !== null && (ind.unidad?.includes('$') || ind.id?.startsWith('OVI_F'))
                ? (ind.unidad === '$/kg' ? `${formatMoney(ind.valorCalculado)}/kg` : ind.unidad === '$/oveja' ? `${formatMoney(ind.valorCalculado)}/oveja` : formatMoney(ind.valorCalculado))
                : ind.valorFormateado;

              return (
                <div 
                  key={ind.id} 
                  className={`p-4 rounded-xl border ${cardStyle} space-y-2 transition-all hover:shadow-xs`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#14281d]">
                    <span className="truncate pr-2">{ind.nombre}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/80 border border-current font-mono">
                      {ind.codigo}
                    </span>
                  </div>

                  <div className="text-xl font-bold font-mono text-[#14281d] tabular-nums tracking-tight">
                    {displayValue}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#526b5c] pt-1 border-t border-black/5">
                    <span>Meta: <strong className="text-[#14281d]">{ind.metaTexto}</strong></span>
                    <span className={`font-semibold ${tagStyle}`}>
                      {ind.textoEstado}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#64748b]">
            No hay indicadores prioritarios seleccionados. Puede marcarlos en la solapa "Indicadores de Gestión".
          </div>
        )}
      </div>

      {/* Tabs de Navegación del Módulo */}
      <div className={`flex border-b ${theme.border} bg-white rounded-t-xl px-4 pt-2 gap-2`}>
        <button
          onClick={() => setActiveTab('majada')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'majada'
              ? `border-current ${theme.primaryText}`
              : 'border-transparent text-[#688574] hover:text-[#14281d]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Categorías y Condición Corporal ({categorias.length})
        </button>
        <button
          onClick={() => setActiveTab('zafra')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'zafra'
              ? `border-current ${theme.primaryText}`
              : 'border-transparent text-[#688574] hover:text-[#14281d]'
          }`}
        >
          <Scissors className="w-4 h-4" />
          Zafras Laneras & Esquila PROLANA ({zafras.length})
        </button>
        <button
          onClick={() => setActiveTab('sanidad')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sanidad'
              ? `border-current ${theme.primaryText}`
              : 'border-transparent text-[#688574] hover:text-[#14281d]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Manejo Sanitario & Señalada ({sanidad.length})
        </button>
      </div>

      {/* Contenido según Tab Activo */}
      {activeTab === 'majada' && (
        <div className={`bg-white border ${theme.border} rounded-b-xl overflow-hidden shadow-xs`}>
          <div className={`p-4 border-b ${theme.border} ${theme.secondaryBg} flex items-center justify-between`}>
            <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">
              Estructura de la Majada Ovina y Potreros
            </span>
            <span className="text-xs text-[#526b5c]">Condición corporal y sanidad preventiva</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#14281d]">
              <thead className={`bg-[#f0f4ef] text-[#526b5c] font-semibold border-b ${theme.border}`}>
                <tr>
                  <th className="py-2.5 px-4">Categoría Ovina</th>
                  <th className="py-2.5 px-4 text-right">Cabezas</th>
                  <th className="py-2.5 px-4">Potrero Asignado</th>
                  <th className="py-2.5 px-4 text-center">Condición Corporal (1-5)</th>
                  <th className="py-2.5 px-4">Estado Sanitario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ee]">
                {categorias.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#f9fbf8] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#14281d]">
                      {cat.categoria}
                      <span className="block text-[10px] text-[#718f7d]">{cat.id}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#14281d]">{cat.cabezas} cab.</td>
                    <td className="py-3 px-4 text-[#526b5c] font-medium">{cat.potrero_actual}</td>
                    <td className="py-3 px-4 text-center font-bold text-[#1c4b31]">
                      {cat.estado_corporal.toFixed(1)} / 5.0
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        {cat.estado_sanitario}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'zafra' && (
        <div className="bg-white border border-[#d6e3d8] rounded-b-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#e5efe7] bg-[#f8faf7] flex items-center justify-between">
            <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">
              Historial de Zafras Laneras y Calidad de Vellón
            </span>
            <span className="text-xs text-[#526b5c]">Protocolo PROLANA y comercialización</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#14281d]">
              <thead className="bg-[#f0f4ef] text-[#526b5c] font-semibold border-b border-[#e0eae2]">
                <tr>
                  <th className="py-2.5 px-4">Fecha / Campaña</th>
                  <th className="py-2.5 px-4 text-right">Animales Esquilados</th>
                  <th className="py-2.5 px-4 text-right">Total Lana (kg)</th>
                  <th className="py-2.5 px-4 text-right">Promedio Vellón (kg)</th>
                  <th className="py-2.5 px-4 text-center">Finura (µm)</th>
                  <th className="py-2.5 px-4 text-right">Precio Obtenido ({currency === 'USD' ? 'US$/kg' : '$/kg'})</th>
                  <th className="py-2.5 px-4">Destino Comercial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ee]">
                {zafras.map((zaf) => (
                  <tr key={zaf.id} className="hover:bg-[#f9fbf8] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#14281d] block">{zaf.campana_id}</span>
                      <span className="font-mono text-[11px] text-[#526b5c]">{zaf.fecha}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{zaf.animales_esquilados} cab.</td>
                    <td className="py-3 px-4 text-right font-bold text-[#1c4b31]">{zaf.kg_lana_total} kg</td>
                    <td className="py-3 px-4 text-right font-mono">{zaf.kg_promedio_vellon.toFixed(1)} kg</td>
                    <td className="py-3 px-4 text-center font-mono text-[#526b5c]">{zaf.finura_micras_aprox ? `${zaf.finura_micras_aprox} µm` : '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#14281d]">
                      {formatMoney(zaf.precio_obtenido_kg || 0)}
                    </td>
                    <td className="py-3 px-4 text-[#526b5c]">{zaf.destino_comercial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sanidad' && (
        <div className="bg-white border border-[#d6e3d8] rounded-b-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#e5efe7] bg-[#f8faf7] flex items-center justify-between">
            <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">
              Control Sanitario de Majada, Vacunaciones y Señalada
            </span>
            <span className="text-xs text-[#526b5c]">Prevención de enterotoxemia y parasitosis</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#14281d]">
              <thead className="bg-[#f0f4ef] text-[#526b5c] font-semibold border-b border-[#e0eae2]">
                <tr>
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4">Evento Sanitario / Tarea</th>
                  <th className="py-2.5 px-4 text-right">Cabezas Tratadas</th>
                  <th className="py-2.5 px-4">Producto / Dosis</th>
                  <th className="py-2.5 px-4">Responsable</th>
                  <th className="py-2.5 px-4">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ee]">
                {sanidad.map((san) => (
                  <tr key={san.id} className="hover:bg-[#f9fbf8] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#526b5c]">{san.fecha}</td>
                    <td className="py-3 px-4 font-bold text-[#14281d]">{san.tipo_evento}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#14281d]">{san.cabezas_tratadas} cab.</td>
                    <td className="py-3 px-4 text-[#526b5c] font-medium">{san.producto_aplicado}</td>
                    <td className="py-3 px-4 text-[#526b5c]">{san.responsable}</td>
                    <td className="py-3 px-4 text-[#526b5c] text-[11px]">{san.observaciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Registrar Zafra Lanera */}
      {showNewZafraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#c8d9cc] rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#14281d] mb-4 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-[#1c4b31]" />
              Registrar Esquila / Zafra Lanera
            </h3>

            <form onSubmit={handleCreateZafra} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Fecha de Esquila</label>
                  <input
                    type="date"
                    value={zafraForm.fecha}
                    onChange={(e) => setZafraForm({ ...zafraForm, fecha: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Campaña</label>
                  <input
                    type="text"
                    value={zafraForm.campana_id}
                    onChange={(e) => setZafraForm({ ...zafraForm, campana_id: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Animales Esquilados</label>
                  <input
                    type="number"
                    value={zafraForm.animales_esquilados}
                    onChange={(e) => setZafraForm({ ...zafraForm, animales_esquilados: Number(e.target.value) })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Kilos Totales de Lana</label>
                  <input
                    type="number"
                    value={zafraForm.kg_lana_total}
                    onChange={(e) => {
                      const total = Number(e.target.value);
                      const anim = zafraForm.animales_esquilados || 1;
                      setZafraForm({ 
                        ...zafraForm, 
                        kg_lana_total: total,
                        kg_promedio_vellon: Number((total / anim).toFixed(2))
                      });
                    }}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-bold text-[#1c4b31]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Promedio por Vellón (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={zafraForm.kg_promedio_vellon}
                    onChange={(e) => setZafraForm({ ...zafraForm, kg_promedio_vellon: Number(e.target.value) })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Finura Estimada (Micras)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={zafraForm.finura_micras_aprox}
                    onChange={(e) => setZafraForm({ ...zafraForm, finura_micras_aprox: Number(e.target.value) })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Precio Obtenido ($ / kg)</label>
                  <input
                    type="number"
                    value={zafraForm.precio_obtenido_kg}
                    onChange={(e) => setZafraForm({ ...zafraForm, precio_obtenido_kg: Number(e.target.value) })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Destino Comercial</label>
                  <input
                    type="text"
                    value={zafraForm.destino_comercial}
                    onChange={(e) => setZafraForm({ ...zafraForm, destino_comercial: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#526b5c] mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={zafraForm.observaciones}
                  onChange={(e) => setZafraForm({ ...zafraForm, observaciones: e.target.value })}
                  className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0eae2]">
                <button
                  type="button"
                  onClick={() => setShowNewZafraModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#526b5c] hover:bg-[#edf3ee] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Zafra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Sanidad Ovina */}
      {showNewSanidadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#c8d9cc] rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#14281d] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1c4b31]" />
              Registrar Evento Sanitario Ovino
            </h3>

            <form onSubmit={handleCreateSanidad} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Tipo de Evento</label>
                  <select
                    value={sanidadForm.tipo_evento}
                    onChange={(e) => setSanidadForm({ ...sanidadForm, tipo_evento: e.target.value as any })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  >
                    <option value="Señalada">Señalada y Caravaneo</option>
                    <option value="Vacunación Clostridial / Enterotoxemia">Vacunación Clostridial / Enterotoxemia</option>
                    <option value="Desparasitación">Desparasitación Gastrointestinal</option>
                    <option value="Baño de Sarna">Baño de Sarna / Ectoparásitos</option>
                    <option value="Revisación Pre-Servicio">Revisación Clínica de Carneros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={sanidadForm.fecha}
                    onChange={(e) => setSanidadForm({ ...sanidadForm, fecha: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Cabezas Tratadas</label>
                  <input
                    type="number"
                    value={sanidadForm.cabezas_tratadas}
                    onChange={(e) => setSanidadForm({ ...sanidadForm, cabezas_tratadas: Number(e.target.value) })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Producto / Insumo</label>
                  <input
                    type="text"
                    value={sanidadForm.producto_aplicado}
                    onChange={(e) => setSanidadForm({ ...sanidadForm, producto_aplicado: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#526b5c] mb-1">Responsable</label>
                <input
                  type="text"
                  value={sanidadForm.responsable}
                  onChange={(e) => setSanidadForm({ ...sanidadForm, responsable: e.target.value })}
                  className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#526b5c] mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={sanidadForm.observaciones}
                  onChange={(e) => setSanidadForm({ ...sanidadForm, observaciones: e.target.value })}
                  className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0eae2]">
                <button
                  type="button"
                  onClick={() => setShowNewSanidadModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#526b5c] hover:bg-[#edf3ee] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Manejo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
