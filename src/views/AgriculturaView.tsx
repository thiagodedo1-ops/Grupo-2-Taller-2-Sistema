/**
 * @file AgriculturaView.tsx
 * @description Módulo de Gestión Agrícola (Maíz y Soja) - Establecimiento Pozo del Carril (UNRC)
 * Control de Lotes, Labores, Cosecha y Matriz de Transferencias Internas a Silo Porcino/Ganadero
 */

import React, { useState } from 'react';
import { BaseDatosPorcina, LoteAgricola, LaborAgricola, TransferenciaInternaGrano, Usuario } from '../types/schema';
import { 
  Sprout, 
  Layers, 
  ArrowRightLeft, 
  Calendar, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  FileText, 
  DollarSign, 
  AlertCircle 
} from 'lucide-react';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const AgriculturaView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const [activeTab, setActiveTab] = useState<'lotes' | 'labores' | 'transferencias'>('lotes');
  const [showNewLaborModal, setShowNewLaborModal] = useState(false);
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const lotes = db.Lotes_Agricolas || [];
  const labores = db.Labores_Agricolas || [];
  const transferencias = db.Transferencias_Granos || [];

  // Cálculos consolidados
  const totalHa = lotes.reduce((acc, l) => acc + (l.superficie_ha || 0), 0);
  const haMaiz = lotes.filter(l => l.cultivo_actual === 'Maíz').reduce((acc, l) => acc + l.superficie_ha, 0);
  const haSoja = lotes.filter(l => l.cultivo_actual === 'Soja').reduce((acc, l) => acc + l.superficie_ha, 0);
  
  const totalKgMaizTransferido = transferencias
    .filter(t => t.grano === 'Maíz')
    .reduce((acc, t) => acc + (t.kg_transferidos || 0), 0);
  
  const totalValorTransferencias = transferencias
    .reduce((acc, t) => acc + (t.valor_total_transferencia || 0), 0);

  // Form State: Nueva Labor
  const [laborForm, setLaborForm] = useState({
    lote_id: lotes[0]?.id || 'LOTE_01',
    tipo_labor: 'Fertilización' as LaborAgricola['tipo_labor'],
    cultivo: 'Maíz' as 'Maíz' | 'Soja',
    fecha: new Date().toISOString().split('T')[0],
    insumo_aplicado: '',
    dosis_ha: '',
    costo_total_estimado: 0,
    contratista_o_personal: 'Personal Pozo del Carril',
    observaciones: ''
  });

  // Form State: Nueva Transferencia
  const [transfForm, setTransfForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    grano: 'Maíz' as 'Maíz' | 'Soja',
    kg_transferidos: 10000,
    unidad_destino_id: 'UN_PORCINA' as 'UN_PORCINA' | 'UN_BOVINOS' | 'UN_OVINOS',
    precio_fas_teorico_por_kg: 170.00,
    remito_interno_nro: `REM-INT-${String(transferencias.length + 1).padStart(3, '0')}`,
    observaciones: 'Transferencia para alimentación de piara/rodeo a valor FAS teórico'
  });

  const handleCreateLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: LaborAgricola = {
      id: `LAB_${Date.now()}`,
      ...laborForm
    };
    await onSaveRecord('Labores_Agricolas', newRecord);
    setShowNewLaborModal(false);
    setFeedbackMsg('Labor agrícola registrada exitosamente.');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleCreateTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(transfForm.kg_transferidos) * Number(transfForm.precio_fas_teorico_por_kg);
    const newRecord: TransferenciaInternaGrano = {
      id: `TRF_${Date.now()}`,
      fecha: transfForm.fecha,
      grano: transfForm.grano,
      kg_transferidos: Number(transfForm.kg_transferidos),
      unidad_origen_id: 'UN_AGRICULTURA',
      unidad_destino_id: transfForm.unidad_destino_id,
      precio_fas_teorico_por_kg: Number(transfForm.precio_fas_teorico_por_kg),
      valor_total_transferencia: total,
      remito_interno_nro: transfForm.remito_interno_nro,
      observaciones: transfForm.observaciones,
      estado: 'Confirmado'
    };
    await onSaveRecord('Transferencias_Granos', newRecord);
    setShowNewTransferModal(false);
    setFeedbackMsg(`Transferencia interna de grano registrada por $${total.toLocaleString('es-AR')}.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const getUnidadDestinoNombre = (id: string) => {
    switch (id) {
      case 'UN_PORCINA': return 'Producción Porcina (Silo Maternidad/Engorde)';
      case 'UN_BOVINOS': return 'Ganadería Bovina (Suplementación)';
      case 'UN_OVINOS': return 'Ganadería Ovina (Flushing/Servicio)';
      default: return id;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Métricas Principales */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e5efe7]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#eaf4ec] text-[#1c4b31] rounded-lg">
                <Sprout className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-[#14281d] tracking-tight">
                Unidad Agrícola · Maíz y Soja
              </h2>
            </div>
            <p className="text-xs text-[#526b5c] mt-1">
              Establecimiento Pozo del Carril · La Aguada (UNRC) · Campaña 2024/2025
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewLaborModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registrar Labor
            </button>
            <button
              onClick={() => setShowNewTransferModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1c4b31] bg-[#eaf4ec] hover:bg-[#dbeee0] border border-[#bcdbc3] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transferir Maíz (FAS)
            </button>
          </div>
        </div>

        {/* Notificación de feedback */}
        {feedbackMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Tarjetas de Métricas Clave */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-[#f8faf7] border border-[#e2ece4] rounded-lg p-3">
            <span className="text-[11px] font-medium text-[#688574] uppercase tracking-wider block">Superficie Total</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#14281d]">{totalHa}</span>
              <span className="text-xs text-[#526b5c]">hectáreas</span>
            </div>
            <span className="text-[11px] text-[#688574] mt-0.5 block">{haMaiz} ha Maíz · {haSoja} ha Soja</span>
          </div>

          <div className="bg-[#f8faf7] border border-[#e2ece4] rounded-lg p-3">
            <span className="text-[11px] font-medium text-[#688574] uppercase tracking-wider block">Rendimiento Maíz</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1c4b31]">80.5</span>
              <span className="text-xs text-[#526b5c]">qq/ha promedio</span>
            </div>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">+3.2% vs presupuestado</span>
          </div>

          <div className="bg-[#f8faf7] border border-[#e2ece4] rounded-lg p-3">
            <span className="text-[11px] font-medium text-[#688574] uppercase tracking-wider block">Rendimiento Soja</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1c4b31]">35.0</span>
              <span className="text-xs text-[#526b5c]">qq/ha promedio</span>
            </div>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">Cosecha de 1ra y 2da cerrada</span>
          </div>

          <div className="bg-[#f8faf7] border border-[#e2ece4] rounded-lg p-3">
            <span className="text-[11px] font-medium text-[#688574] uppercase tracking-wider block">Maíz Transferido a Silos</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#14281d]">{(totalKgMaizTransferido / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}</span>
              <span className="text-xs text-[#526b5c]">toneladas</span>
            </div>
            <span className="text-[11px] text-[#1c4b31] font-semibold mt-0.5 block">${totalValorTransferencias.toLocaleString('es-AR')} FAS teórico</span>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación del Módulo */}
      <div className="flex border-b border-[#d6e3d8] bg-white rounded-t-xl px-4 pt-2 gap-2">
        <button
          onClick={() => setActiveTab('lotes')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'lotes'
              ? 'border-[#1c4b31] text-[#1c4b31]'
              : 'border-transparent text-[#688574] hover:text-[#14281d]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Lotes y Estado Fenológico ({lotes.length})
        </button>
        <button
          onClick={() => setActiveTab('labores')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'labores'
              ? 'border-[#1c4b31] text-[#1c4b31]'
              : 'border-transparent text-[#688574] hover:text-[#14281d]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Labores y Costos de Campaña ({labores.length})
        </button>
        <button
          onClick={() => setActiveTab('transferencias')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'transferencias'
              ? 'border-[#1c4b31] text-[#1c4b31]'
              : 'border-transparent text-[#688574] hover:text-[#14281d]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Transferencias Internas de Grano ({transferencias.length})
        </button>
      </div>

      {/* Contenido según Tab Activo */}
      {activeTab === 'lotes' && (
        <div className="bg-white border border-[#d6e3d8] rounded-b-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#e5efe7] bg-[#f8faf7] flex items-center justify-between">
            <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">
              Padrón de Lotes Agrícolas y Productividad
            </span>
            <span className="text-xs text-[#526b5c]">
              Superficie activa bajo manejo técnico UNRC
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#14281d]">
              <thead className="bg-[#f0f4ef] text-[#526b5c] font-semibold border-b border-[#e0eae2]">
                <tr>
                  <th className="py-2.5 px-4">Lote / Identificador</th>
                  <th className="py-2.5 px-4 text-right">Superficie (ha)</th>
                  <th className="py-2.5 px-4">Cultivo Actual</th>
                  <th className="py-2.5 px-4">Estado Fenológico</th>
                  <th className="py-2.5 px-4 text-right">Rinde Est. (qq/ha)</th>
                  <th className="py-2.5 px-4 text-right">Rinde Real (qq/ha)</th>
                  <th className="py-2.5 px-4 text-center">Desvío Rinde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ee]">
                {lotes.map((lote) => {
                  const desvio = (lote.rendimiento_real_qq_ha || 0) - (lote.rendimiento_estimado_qq_ha || 0);
                  const isPositive = desvio >= 0;
                  return (
                    <tr key={lote.id} className="hover:bg-[#f9fbf8] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#14281d]">
                        {lote.nombre}
                        <span className="block text-[10px] text-[#718f7d]">{lote.id} · {lote.campana_id}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{lote.superficie_ha} ha</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          lote.cultivo_actual === 'Maíz' ? 'bg-amber-100 text-amber-900' :
                          lote.cultivo_actual === 'Soja' ? 'bg-emerald-100 text-emerald-900' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {lote.cultivo_actual}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#526b5c] font-medium">{lote.estado_fenologico || 'En producción'}</td>
                      <td className="py-3 px-4 text-right">{lote.rendimiento_estimado_qq_ha || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#1c4b31]">{lote.rendimiento_real_qq_ha || '-'}</td>
                      <td className="py-3 px-4 text-center font-medium">
                        {lote.rendimiento_real_qq_ha ? (
                          <span className={isPositive ? 'text-emerald-700' : 'text-amber-700'}>
                            {isPositive ? `+${desvio.toFixed(1)}` : desvio.toFixed(1)} qq/ha
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'labores' && (
        <div className="bg-white border border-[#d6e3d8] rounded-b-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#e5efe7] bg-[#f8faf7] flex items-center justify-between">
            <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">
              Registro Cronológico de Labores y Aplicaciones de Campaña
            </span>
            <span className="text-xs text-[#526b5c]">Costos directos acumulados por hectárea</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#14281d]">
              <thead className="bg-[#f0f4ef] text-[#526b5c] font-semibold border-b border-[#e0eae2]">
                <tr>
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4">Lote</th>
                  <th className="py-2.5 px-4">Labor</th>
                  <th className="py-2.5 px-4">Cultivo</th>
                  <th className="py-2.5 px-4">Insumo / Dosis</th>
                  <th className="py-2.5 px-4 text-right">Costo Estimado</th>
                  <th className="py-2.5 px-4">Responsable / Contratista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ee]">
                {labores.map((lab) => {
                  const loteObj = lotes.find(l => l.id === lab.lote_id);
                  return (
                    <tr key={lab.id} className="hover:bg-[#f9fbf8] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#526b5c]">{lab.fecha}</td>
                      <td className="py-3 px-4 font-semibold text-[#14281d]">{loteObj?.nombre || lab.lote_id}</td>
                      <td className="py-3 px-4 font-medium">{lab.tipo_labor}</td>
                      <td className="py-3 px-4">{lab.cultivo}</td>
                      <td className="py-3 px-4 text-[#526b5c]">
                        <span className="font-medium text-[#14281d] block">{lab.insumo_aplicado || '-'}</span>
                        <span className="text-[11px]">{lab.dosis_ha || ''}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#1c4b31]">
                        ${(lab.costo_total_estimado || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-4 text-[#526b5c]">{lab.contratista_o_personal || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transferencias' && (
        <div className="space-y-4">
          <div className="bg-[#f3f7f4] border border-[#bcdbc3] rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#1c4b31] shrink-0 mt-0.5" />
            <div className="text-xs text-[#244530]">
              <span className="font-bold block text-sm">Política de Precios de Transferencia al FAS Teórico de Mercado</span>
              El maíz cosechado en los lotes agrícolas de Pozo del Carril no se transfiere a costo cero hacia la unidad porcina o ganadera. Se valora al precio de mercado de referencia en el momento de la descarga, asegurando que Agricultura refleje su verdadero Margen Bruto y Porcinos reconozca su Costo de Alimentación real.
            </div>
          </div>

          <div className="bg-white border border-[#d6e3d8] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#e5efe7] bg-[#f8faf7] flex items-center justify-between">
              <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">
                Remitos Internos de Grano (Agricultura ➔ Destinos)
              </span>
              <span className="text-xs text-[#526b5c]">Trazabilidad contable inter-unidades</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#14281d]">
                <thead className="bg-[#f0f4ef] text-[#526b5c] font-semibold border-b border-[#e0eae2]">
                  <tr>
                    <th className="py-2.5 px-4">Remito / Fecha</th>
                    <th className="py-2.5 px-4">Grano</th>
                    <th className="py-2.5 px-4 text-right">Cantidad (kg)</th>
                    <th className="py-2.5 px-4 text-right">Precio FAS ($/kg)</th>
                    <th className="py-2.5 px-4 text-right">Valor Total ($)</th>
                    <th className="py-2.5 px-4">Unidad Receptora</th>
                    <th className="py-2.5 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ee]">
                  {transferencias.map((trf) => (
                    <tr key={trf.id} className="hover:bg-[#f9fbf8] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#14281d] block">{trf.remito_interno_nro}</span>
                        <span className="font-mono text-[11px] text-[#526b5c]">{trf.fecha}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-amber-800">{trf.grano}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#14281d]">
                        {trf.kg_transferidos.toLocaleString('es-AR')} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#526b5c]">
                        ${trf.precio_fas_teorico_por_kg.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#1c4b31]">
                        ${trf.valor_total_transferencia.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-4 text-[#526b5c] font-medium">
                        {getUnidadDestinoNombre(trf.unidad_destino_id)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          {trf.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nueva Labor */}
      {showNewLaborModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#c8d9cc] rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#14281d] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1c4b31]" />
              Registrar Nueva Labor Agrícola
            </h3>

            <form onSubmit={handleCreateLabor} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Lote</label>
                  <select
                    value={laborForm.lote_id}
                    onChange={(e) => setLaborForm({ ...laborForm, lote_id: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  >
                    {lotes.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre} ({l.superficie_ha} ha - {l.cultivo_actual})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Tipo de Labor</label>
                  <select
                    value={laborForm.tipo_labor}
                    onChange={(e) => setLaborForm({ ...laborForm, tipo_labor: e.target.value as any })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  >
                    <option value="Siembra">Siembra</option>
                    <option value="Fertilización">Fertilización</option>
                    <option value="Pulverización">Pulverización / Barbecho</option>
                    <option value="Cosecha">Cosecha</option>
                    <option value="Monitoreo">Monitoreo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={laborForm.fecha}
                    onChange={(e) => setLaborForm({ ...laborForm, fecha: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Cultivo</label>
                  <select
                    value={laborForm.cultivo}
                    onChange={(e) => setLaborForm({ ...laborForm, cultivo: e.target.value as any })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  >
                    <option value="Maíz">Maíz</option>
                    <option value="Soja">Soja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Insumo Aplicado</label>
                  <input
                    type="text"
                    placeholder="ej. Urea 46%, Híbrido Dekalb"
                    value={laborForm.insumo_aplicado}
                    onChange={(e) => setLaborForm({ ...laborForm, insumo_aplicado: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Dosis por Hectárea</label>
                  <input
                    type="text"
                    placeholder="ej. 150 kg/ha"
                    value={laborForm.dosis_ha}
                    onChange={(e) => setLaborForm({ ...laborForm, dosis_ha: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Costo Estimado ($ ARS)</label>
                  <input
                    type="number"
                    value={laborForm.costo_total_estimado}
                    onChange={(e) => setLaborForm({ ...laborForm, costo_total_estimado: Number(e.target.value) })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Responsable / Contratista</label>
                  <input
                    type="text"
                    value={laborForm.contratista_o_personal}
                    onChange={(e) => setLaborForm({ ...laborForm, contratista_o_personal: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#526b5c] mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={laborForm.observaciones}
                  onChange={(e) => setLaborForm({ ...laborForm, observaciones: e.target.value })}
                  placeholder="Detalles técnicos, condiciones climáticas o lote."
                  className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0eae2]">
                <button
                  type="button"
                  onClick={() => setShowNewLaborModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#526b5c] hover:bg-[#edf3ee] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Labor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nueva Transferencia de Grano al FAS */}
      {showNewTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#c8d9cc] rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#14281d] mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#1c4b31]" />
              Remito de Transferencia Interna de Grano
            </h3>

            <form onSubmit={handleCreateTransferencia} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Nº Remito Interno</label>
                  <input
                    type="text"
                    value={transfForm.remito_interno_nro}
                    onChange={(e) => setTransfForm({ ...transfForm, remito_interno_nro: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={transfForm.fecha}
                    onChange={(e) => setTransfForm({ ...transfForm, fecha: e.target.value })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Grano</label>
                  <select
                    value={transfForm.grano}
                    onChange={(e) => setTransfForm({ ...transfForm, grano: e.target.value as any })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  >
                    <option value="Maíz">Maíz Propio</option>
                    <option value="Soja">Soja Propia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Unidad Destino</label>
                  <select
                    value={transfForm.unidad_destino_id}
                    onChange={(e) => setTransfForm({ ...transfForm, unidad_destino_id: e.target.value as any })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                  >
                    <option value="UN_PORCINA">Producción Porcina (Silo Maternidad/Engorde)</option>
                    <option value="UN_BOVINOS">Ganadería Bovina (Suplementación)</option>
                    <option value="UN_OVINOS">Ganadería Ovina (Flushing/Servicio)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Kilogramos Transferidos</label>
                  <input
                    type="number"
                    min="1"
                    value={transfForm.kg_transferidos}
                    onChange={(e) => setTransfForm({ ...transfForm, kg_transferidos: Number(e.target.value) })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#526b5c] mb-1">Precio FAS Teórico ($/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={transfForm.precio_fas_teorico_por_kg}
                    onChange={(e) => setTransfForm({ ...transfForm, precio_fas_teorico_por_kg: Number(e.target.value) })}
                    className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d] font-bold"
                    required
                  />
                </div>
              </div>

              {/* Total Calculado en Tiempo Real */}
              <div className="bg-[#eaf4ec] border border-[#bcdbc3] p-3 rounded-lg flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1c4b31]">Valor Total Imputado a la Transferencia:</span>
                <span className="text-base font-bold text-[#1c4b31]">
                  ${(transfForm.kg_transferidos * transfForm.precio_fas_teorico_por_kg).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block font-medium text-[#526b5c] mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={transfForm.observaciones}
                  onChange={(e) => setTransfForm({ ...transfForm, observaciones: e.target.value })}
                  className="w-full border border-[#c8d9cc] rounded-lg p-2 bg-[#f8faf7] text-[#14281d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0eae2]">
                <button
                  type="button"
                  onClick={() => setShowNewTransferModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#526b5c] hover:bg-[#edf3ee] rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Remito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
