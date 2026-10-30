import React, { useState } from 'react';
import {
  Workflow,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TutorialGrafico } from '../../data/multiUnitManualData';

interface Props {
  tutorial: TutorialGrafico;
  unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
  onOpenGemini?: () => void;
}

export const MultiUnitTutorialRenderer: React.FC<Props> = ({ tutorial, unit, onOpenGemini }) => {
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);

  // Theme accents per unit
  const theme = {
    PORCINOS: {
      badge: 'bg-[#1c4b31]/80 text-[#edf6f0] border-[#bbf7d0]/40',
      activeStep: 'bg-[#1c4b31] text-white border-[#2b714b] shadow-xs',
      inactiveStep: 'bg-white text-[#1c4b31] border-[#d8e2d7] hover:bg-[#f0f4f1]/50',
      stepNumActive: 'bg-[#edf6f0] text-[#1c4b31]',
      stepNumInactive: 'bg-[#edf6f0] text-[#1c4b31]',
      tagBg: 'bg-[#edf6f0] text-[#1c4b31] border-[#bbf7d0]',
      accentText: 'text-[#1c4b31]',
      cardBorder: 'border-[#d8e2d7]',
      paramCardBg: 'bg-[#f8faf8] border-[#dce6dc]',
      paramValue: 'text-[#1c4b31]',
      bulletIcon: 'text-[#16a34a]'
    },
    BOVINOS: {
      badge: 'bg-[#92400e]/80 text-[#fef3c7] border-[#d97706]/40',
      activeStep: 'bg-[#78350f] text-white border-[#92400e] shadow-xs',
      inactiveStep: 'bg-white text-[#78350f] border-[#fde68a] hover:bg-[#fef3c7]/50',
      stepNumActive: 'bg-[#fef3c7] text-[#78350f]',
      stepNumInactive: 'bg-[#fef3c7] text-[#92400e]',
      tagBg: 'bg-[#fef3c7] text-[#78350f] border-[#fde68a]',
      accentText: 'text-[#78350f]',
      cardBorder: 'border-[#fde68a]',
      paramCardBg: 'bg-[#fffbeb] border-[#fde68a]',
      paramValue: 'text-[#78350f]',
      bulletIcon: 'text-[#d97706]'
    },
    OVINOS: {
      badge: 'bg-[#1e40af]/80 text-[#dbeafe] border-[#60a5fa]/40',
      activeStep: 'bg-[#1e40af] text-white border-[#2563eb] shadow-xs',
      inactiveStep: 'bg-white text-[#1e40af] border-[#bfdbfe] hover:bg-[#dbeafe]/50',
      stepNumActive: 'bg-[#dbeafe] text-[#1e40af]',
      stepNumInactive: 'bg-[#dbeafe] text-[#1e40af]',
      tagBg: 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]',
      accentText: 'text-[#1e40af]',
      cardBorder: 'border-[#bfdbfe]',
      paramCardBg: 'bg-[#eff6ff] border-[#bfdbfe]',
      paramValue: 'text-[#1e40af]',
      bulletIcon: 'text-[#2563eb]'
    },
    CONSOLIDADO: {
      badge: 'bg-[#581c87]/80 text-[#f3e8ff] border-[#c084fc]/40',
      activeStep: 'bg-[#581c87] text-white border-[#7e22ce] shadow-xs',
      inactiveStep: 'bg-white text-[#581c87] border-[#e9d5ff] hover:bg-[#f3e8ff]/50',
      stepNumActive: 'bg-[#f3e8ff] text-[#581c87]',
      stepNumInactive: 'bg-[#f3e8ff] text-[#581c87]',
      tagBg: 'bg-[#f3e8ff] text-[#581c87] border-[#e9d5ff]',
      accentText: 'text-[#581c87]',
      cardBorder: 'border-[#e9d5ff]',
      paramCardBg: 'bg-[#faf5ff] border-[#e9d5ff]',
      paramValue: 'text-[#581c87]',
      bulletIcon: 'text-[#9333ea]'
    }
  }[unit] || {
    badge: 'bg-gray-100',
    activeStep: 'bg-gray-800',
    inactiveStep: 'bg-white',
    stepNumActive: 'bg-gray-200',
    stepNumInactive: 'bg-gray-200',
    tagBg: 'bg-gray-100',
    accentText: 'text-gray-800',
    cardBorder: 'border-gray-200',
    paramCardBg: 'bg-gray-50',
    paramValue: 'text-gray-800',
    bulletIcon: 'text-gray-500'
  };

  const currentStage = tutorial.etapas[activeStageIdx] || tutorial.etapas[0];

  return (
    <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#d8e2d7] shadow-xs space-y-6">
      {/* Encabezado del Tutorial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5ece5] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-1">
            <Workflow className="w-3 h-3" />
            <span>Guía Paso a Paso · {tutorial.label}</span>
          </div>
          <h4 className="text-lg font-bold text-[#143422]">{tutorial.titulo}</h4>
          <p className="text-xs text-[#5c7767] mt-0.5">{tutorial.subtitulo}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#526b5c]">
          <span className="font-semibold">{tutorial.etapas.length} Etapas Operativas</span>
        </div>
      </div>

      {/* Descripción General */}
      <div className="p-4 bg-[#f9faf9] rounded-xl border border-[#e2ece2] text-xs text-[#2d4b38] leading-relaxed">
        {tutorial.descripcion}
      </div>

      {/* Pipeline / Etapas de Proceso */}
      {tutorial.etapas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c4b31] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Etapas del Proceso Operativo</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activeStageIdx === 0}
                onClick={() => setActiveStageIdx(prev => Math.max(0, prev - 1))}
                className="p-1 rounded-lg border border-[#d6e2d7] hover:bg-[#edf4ee] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Etapa anterior"
              >
                <ChevronLeft className="w-4 h-4 text-[#2d4b38]" />
              </button>
              <span className="text-[11px] font-bold px-2 text-[#2d4b38]">
                {activeStageIdx + 1} / {tutorial.etapas.length}
              </span>
              <button
                type="button"
                disabled={activeStageIdx === tutorial.etapas.length - 1}
                onClick={() => setActiveStageIdx(prev => Math.min(tutorial.etapas.length - 1, prev + 1))}
                className="p-1 rounded-lg border border-[#d6e2d7] hover:bg-[#edf4ee] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Siguiente etapa"
              >
                <ChevronRight className="w-4 h-4 text-[#2d4b38]" />
              </button>
            </div>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(tutorial.etapas.length, 6)} gap-2.5`}>
            {tutorial.etapas.map((etapa, idx) => {
              const isActive = activeStageIdx === idx;
              return (
                <button
                  key={etapa.id}
                  type="button"
                  onClick={() => setActiveStageIdx(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isActive ? theme.activeStep : theme.inactiveStep
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? theme.stepNumActive : theme.stepNumInactive
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold truncate max-w-[120px] bg-black/5">
                      {etapa.badge}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs truncate">{etapa.nombre}</h5>
                  <p className="text-[10px] opacity-80 flex items-center gap-1 mt-1 truncate">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    <span>{etapa.duracion}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalle de la Etapa Seleccionada */}
      {currentStage && (
        <div className="p-5 bg-white rounded-xl border border-[#d6e2d7] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#edf4ee] pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf6f0] text-[#1c4b31] border border-[#bbf7d0]">
                <span>Etapa {activeStageIdx + 1} de {tutorial.etapas.length}</span>
                <span>·</span>
                <span>{currentStage.duracion}</span>
              </div>
              <h5 className="text-base font-bold text-[#143422] mt-1">{currentStage.nombre}</h5>
            </div>
            <div className="text-xs text-[#526b5c] font-medium bg-[#f5f8f5] px-3 py-1.5 rounded-lg border border-[#e2ece2]">
              🎯 <strong>Objetivo:</strong> {currentStage.objetivo}
            </div>
          </div>

          <p className="text-xs text-[#2c4735] leading-relaxed">
            {currentStage.descripcion}
          </p>

          {/* Parámetros Clave */}
          {currentStage.parametrosClave && currentStage.parametrosClave.length > 0 && (
            <div>
              <h6 className="text-[11px] font-bold uppercase tracking-wider text-[#1c4b31] mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#16a34a]" />
                <span>Parámetros Críticos de Control</span>
              </h6>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentStage.parametrosClave.map((param, pIdx) => (
                  <div key={pIdx} className={`p-3 rounded-xl border ${theme.paramCardBg}`}>
                    <span className="text-[10px] font-bold text-[#5c7767] uppercase block">{param.label}</span>
                    <strong className={`text-sm font-mono block my-0.5 ${theme.paramValue}`}>{param.valor}</strong>
                    <p className="text-[10px] text-[#557361]">{param.detalle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tareas Operativas y Reglas de Control */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Tareas Operativas */}
            {currentStage.tareasOperativas && currentStage.tareasOperativas.length > 0 && (
              <div className="p-4 bg-[#fbfdfb] rounded-xl border border-[#dce6dc] space-y-2.5">
                <h6 className="text-xs font-bold text-[#1c4b31] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                  <span>Protocolo de Tareas Operativas</span>
                </h6>
                <ul className="space-y-1.5">
                  {currentStage.tareasOperativas.map((tarea, tIdx) => (
                    <li key={tIdx} className="text-xs text-[#31513c] flex items-start gap-2">
                      <span className="text-[#16a34a] font-bold text-xs mt-0.5">✓</span>
                      <span>{tarea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reglas de Control & Validación */}
            {currentStage.reglasControl && currentStage.reglasControl.length > 0 && (
              <div className="p-4 bg-[#fffdfa] rounded-xl border border-[#fed7aa] space-y-2.5">
                <h6 className="text-xs font-bold text-[#9a3412] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#ea580c]" />
                  <span>Reglas de Validación y Alertas</span>
                </h6>
                <ul className="space-y-1.5">
                  {currentStage.reglasControl.map((regla, rIdx) => (
                    <li key={rIdx} className="text-xs text-[#7c2d12] flex items-start gap-2">
                      <span className="text-[#ea580c] font-bold text-xs mt-0.5">⚠</span>
                      <span>{regla}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buenas Prácticas y Puntos de Auditoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tutorial.buenasPracticas && tutorial.buenasPracticas.length > 0 && (
          <div className="p-4 bg-linear-to-br from-[#f8faf8] to-[#edf6f0] rounded-xl border border-[#cfe2d3] space-y-3">
            <h5 className="text-xs font-bold text-[#143422] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#16a34a]" />
              <span>Buenas Prácticas Zootécnicas</span>
            </h5>
            <div className="space-y-2">
              {tutorial.buenasPracticas.map((bp, bpIdx) => (
                <div key={bpIdx} className="text-xs text-[#2c4735]">
                  <strong className="text-[#143422] block font-semibold">{bp.titulo}</strong>
                  <span className="text-[11px] text-[#4d6a57]">{bp.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tutorial.puntosAuditoria && tutorial.puntosAuditoria.length > 0 && (
          <div className="p-4 bg-linear-to-br from-[#faf8fc] to-[#f3edf9] rounded-xl border border-[#e5d5f2] space-y-3">
            <h5 className="text-xs font-bold text-[#4a1d6d] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#7e22ce]" />
              <span>Auditoría & Control Interno FCE</span>
            </h5>
            <ul className="space-y-1.5">
              {tutorial.puntosAuditoria.map((pa, paIdx) => (
                <li key={paIdx} className="text-xs text-[#522b75] flex items-start gap-2">
                  <span className="text-[#9333ea] font-bold">▪</span>
                  <span>{pa}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
