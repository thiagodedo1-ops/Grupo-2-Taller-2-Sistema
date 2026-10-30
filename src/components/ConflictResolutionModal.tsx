/**
 * @file ConflictResolutionModal.tsx
 * @description Modal de Resolución de Conflictos de Concurrencia Optimista.
 * Se presenta cuando un registro remoto tiene una versión más reciente que la editada por el usuario.
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 */

import React from 'react';
import { AlertOctagon, RefreshCw, X, ArrowRight, ShieldAlert, Check } from 'lucide-react';
import { FieldChangeDiff } from '../types/sync';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recordTitle: string;
  expectedVersion: number;
  remoteVersion: number;
  remoteModifiedBy?: string;
  remoteModifiedAt?: string;
  diffs: FieldChangeDiff[];
  onReloadLatest: () => void;
  onApplyChangesOnLatest?: () => void;
}

export const ConflictResolutionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  recordTitle,
  expectedVersion,
  remoteVersion,
  remoteModifiedBy,
  remoteModifiedAt,
  diffs,
  onReloadLatest,
  onApplyChangesOnLatest
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white rounded-2xl border border-purple-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="bg-[#581c87] text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 rounded-xl">
              <AlertOctagon className="w-5 h-5 text-purple-200" />
            </span>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-purple-200 block">
                Control de Concurrencia Optimista
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Conflicto de Edición Detectado
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-purple-900">
              <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0" />
              <span>Modificación no aplicada para evitar sobrescrituras</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              El registro <strong>{recordTitle}</strong> fue modificado recientemente en el servidor por otro usuario mientras preparabas los cambios.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-purple-900 font-mono">
              <span>Tu versión base: <strong>v{expectedVersion}</strong></span>
              <span>•</span>
              <span>Versión vigente en servidor: <strong>v{remoteVersion}</strong></span>
              {remoteModifiedBy && (
                <>
                  <span>•</span>
                  <span>Por: <strong>{remoteModifiedBy}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Comparativa de diferencias */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              Diferencias entre Versiones ({diffs.length} campos)
            </h4>
            {diffs.length === 0 ? (
              <p className="text-slate-500 italic p-3 bg-slate-50 rounded-lg text-center">
                Los campos modificados tienen valores idénticos o complementarios.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="grid grid-cols-3 bg-slate-100 px-3 py-1.5 font-bold text-[10px] text-slate-600 uppercase">
                  <span>Campo</span>
                  <span>En Servidor (v{remoteVersion})</span>
                  <span>Tus Cambios (v{expectedVersion})</span>
                </div>
                {diffs.map((d, idx) => (
                  <div key={idx} className="grid grid-cols-3 px-3 py-2 text-[11px] items-center hover:bg-slate-50">
                    <span className="font-mono font-semibold text-slate-700 truncate">{d.campo}</span>
                    <span className="font-mono text-purple-900 bg-purple-50/60 px-1.5 py-0.5 rounded truncate">
                      {String(d.valor_anterior ?? '—')}
                    </span>
                    <span className="font-mono text-emerald-900 bg-emerald-50/60 px-1.5 py-0.5 rounded truncate">
                      {String(d.valor_nuevo ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <strong>Recomendación:</strong> Recarga la versión actual del servidor para verificar los cambios más recientes y aplica tu rectificación sobre los datos consolidados.
          </p>
        </div>

        {/* Pie con Acciones */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={onReloadLatest}
            className="px-4 py-1.5 bg-[#581c87] hover:bg-[#4a1572] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recargar Datos Actuales del Servidor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
