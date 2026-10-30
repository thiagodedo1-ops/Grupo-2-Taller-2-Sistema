/**
 * @file SyncStatusBadge.tsx
 * @description Indicador visual de los 4 estados de sincronización y concurrencia
 * para la edición administrativa: SINCRONIZADO, PENDIENTE, ERROR, CONFLICTO.
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 */

import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, AlertOctagon } from 'lucide-react';
import { SyncStatus } from '../types/sync';

interface Props {
  status: SyncStatus;
  version?: number;
  className?: string;
  showVersion?: boolean;
  onClick?: () => void;
}

export const SyncStatusBadge: React.FC<Props> = ({
  status,
  version,
  className = '',
  showVersion = false,
  onClick
}) => {
  const configs = {
    SINCRONIZADO: {
      label: 'Sincronizado',
      icon: CheckCircle2,
      style: 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]',
      dot: 'bg-[#22c55e]',
      tooltip: 'Confirmado y persistido en Google Sheets'
    },
    PENDIENTE: {
      label: 'Pendiente',
      icon: Clock,
      style: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]',
      dot: 'bg-[#f59e0b]',
      tooltip: 'Guardado localmente en cola Outbox, pendiente de envío a Google Sheets'
    },
    ERROR: {
      label: 'Error Envío',
      icon: AlertTriangle,
      style: 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]',
      dot: 'bg-[#ef4444]',
      tooltip: 'Falla temporal de red. Reintento seguro disponible sin duplicaciones.'
    },
    CONFLICTO: {
      label: 'Conflicto',
      icon: AlertOctagon,
      style: 'bg-[#faf5ff] text-[#6b21a8] border-[#e9d5ff]',
      dot: 'bg-[#a855f7]',
      tooltip: 'Existe una versión más reciente en el servidor. Requiere revisión del administrador.'
    }
  };

  const current = configs[status] || configs.SINCRONIZADO;
  const Icon = current.icon;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors select-none ${current.style} ${onClick ? 'cursor-pointer hover:opacity-85' : ''} ${className}`}
      title={`${current.tooltip}${version !== undefined ? ` (v${version})` : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} shrink-0`} />
      <Icon className="w-3 h-3 shrink-0" />
      <span>{current.label}</span>
      {showVersion && version !== undefined && (
        <span className="font-mono text-[9px] opacity-75 pl-0.5">v{version}</span>
      )}
    </span>
  );
};
