/**
 * @file RowActions.tsx
 * @description Menú / Barra unificada de acciones por fila para tablas de registros
 * Ofrece: Ver Detalle, Editar Registro, Anular / Rectificar
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 */

import React from 'react';
import { Edit3, FileText, XCircle, ShieldAlert } from 'lucide-react';
import { SyncStatus } from '../types/sync';
import { SyncStatusBadge } from './SyncStatusBadge';

interface Props {
  onEdit?: () => void;
  onViewDetail?: () => void;
  onCancel?: () => void;
  canEdit?: boolean;
  canCancel?: boolean;
  unit?: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
  disabledReason?: string;
  syncStatus?: SyncStatus;
  version?: number;
}

export const RowActions: React.FC<Props> = ({
  onEdit,
  onViewDetail,
  onCancel,
  canEdit = true,
  canCancel = true,
  unit = 'PORCINOS',
  disabledReason,
  syncStatus,
  version
}) => {
  const unitStyles = {
    PORCINOS: {
      editBtn: 'text-[#1c4b31] bg-[#ebf2ec] hover:bg-[#d8e5da] border-[#c5d8c8]',
      viewBtn: 'text-[#3b5245] bg-[#f2f6f3] hover:bg-[#e4ece6] border-[#d5ded7]',
      cancelBtn: 'text-[#8a2222] bg-[#fdf2f2] hover:bg-[#f8e2e2] border-[#f4c7c7]'
    },
    BOVINOS: {
      editBtn: 'text-[#78350f] bg-[#fbf4ee] hover:bg-[#f3e4d7] border-[#e7d4c4]',
      viewBtn: 'text-[#5c3a21] bg-[#f8f1ea] hover:bg-[#ebdccf] border-[#decaa7]',
      cancelBtn: 'text-[#8a2222] bg-[#fdf2f2] hover:bg-[#f8e2e2] border-[#f4c7c7]'
    },
    OVINOS: {
      editBtn: 'text-[#1e40af] bg-[#eff6ff] hover:bg-[#dbeafe] border-[#bfdbfe]',
      viewBtn: 'text-[#334155] bg-[#f8fafc] hover:bg-[#f1f5f9] border-[#cbd5e1]',
      cancelBtn: 'text-[#8a2222] bg-[#fdf2f2] hover:bg-[#f8e2e2] border-[#f4c7c7]'
    },
    CONSOLIDADO: {
      editBtn: 'text-[#334155] bg-[#f8fafc] hover:bg-[#f1f5f9] border-[#cbd5e1]',
      viewBtn: 'text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] border-[#cbd5e1]',
      cancelBtn: 'text-[#8a2222] bg-[#fdf2f2] hover:bg-[#f8e2e2] border-[#f4c7c7]'
    }
  };

  const style = unitStyles[unit] || unitStyles.PORCINOS;

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* Indicador de Estado de Sincronización */}
      {syncStatus && (
        <SyncStatusBadge status={syncStatus} version={version} showVersion={false} />
      )}

      {/* Botón Ver Detalle & Trazabilidad */}
      {onViewDetail && (
        <button
          type="button"
          onClick={onViewDetail}
          className={`p-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${style.viewBtn}`}
          title="Consultar detalle completo e historial de trazabilidad"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[10px]">Detalle</span>
        </button>
      )}

      {/* Botón Editar Registro (Nivel 1 & 2) */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={!canEdit}
          className={`p-1.5 rounded-md border text-xs font-semibold transition-colors flex items-center gap-1 ${
            canEdit 
              ? `${style.editBtn} cursor-pointer` 
              : 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
          }`}
          title={canEdit ? 'Editar campos de este registro' : (disabledReason || 'No posee permisos de edición para este registro')}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[10px]">Editar</span>
        </button>
      )}

      {/* Botón Anular / Rectificar (Nivel 3) */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={!canCancel}
          className={`p-1.5 rounded-md border text-xs font-semibold transition-colors flex items-center gap-1 ${
            canCancel 
              ? `${style.cancelBtn} cursor-pointer` 
              : 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
          }`}
          title={canCancel ? 'Anular o solicitar rectificación trazable' : 'Operación bloqueada por movimientos dependientes'}
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
