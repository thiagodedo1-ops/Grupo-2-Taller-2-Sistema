/**
 * @file RecordDetailModal.tsx
 * @description Modal unificado de Consulta de Detalle e Historial de Auditoría por Registro
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 */

import React from 'react';
import { FileText, Clock, User, ShieldCheck, CheckCircle2, History, X } from 'lucide-react';
import { BaseDatosPorcina } from '../types/schema';
import { SyncStatus } from '../types/sync';
import { SyncStatusBadge } from './SyncStatusBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  tableName: string;
  unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
  title: string;
  db?: any;
  syncStatus?: SyncStatus;
}

export const RecordDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  tableName,
  unit,
  title,
  db,
  syncStatus = 'SINCRONIZADO'
}) => {
  if (!isOpen || !record) return null;

  // Filtrar logs de auditoría para este registro específico
  const auditLogs = (db?.Auditoria || []).filter(
    (a: any) => a.registro_id === record.id || (a.tabla_afectada === tableName && a.registro_id === record.id)
  );

  const unitStyles = {
    PORCINOS: {
      headerBg: 'bg-[#1c4b31]',
      badgeBg: 'bg-[#edf7f0]',
      badgeText: 'text-[#1c4b31]',
      border: 'border-[#cbe5d3]',
      text: 'text-[#1c4b31]'
    },
    BOVINOS: {
      headerBg: 'bg-[#78350f]',
      badgeBg: 'bg-[#fbf4ee]',
      badgeText: 'text-[#78350f]',
      border: 'border-[#e7d4c4]',
      text: 'text-[#78350f]'
    },
    OVINOS: {
      headerBg: 'bg-[#1e40af]',
      badgeBg: 'bg-[#eff6ff]',
      badgeText: 'text-[#1e40af]',
      border: 'border-[#bfdbfe]',
      text: 'text-[#1e40af]'
    },
    CONSOLIDADO: {
      headerBg: 'bg-[#334155]',
      badgeBg: 'bg-[#f8fafc]',
      badgeText: 'text-[#334155]',
      border: 'border-[#cbd5e1]',
      text: 'text-[#334155]'
    }
  };

  const style = unitStyles[unit] || unitStyles.PORCINOS;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in font-sans">
        {/* Encabezado con Identificación Visible de Unidad */}
        <div className={`${style.headerBg} text-white p-4.5 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-white/10 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </span>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-80 block">
                {unit} · DETALLE DE REGISTRO & TRAZABILIDAD
              </span>
              <h3 className="text-base font-bold tracking-tight text-white">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Ficha de Identificación del Registro */}
          <div className={`p-3.5 rounded-xl border ${style.border} ${style.badgeBg} flex flex-wrap items-center justify-between gap-3`}>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">ID del Registro</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{record.id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Creado por</span>
              <span className="font-semibold text-slate-700">{record.creado_por || record.usuario || 'Sistema'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Fecha de Registro</span>
              <span className="font-mono text-slate-700">{record.fecha_creacion || record.fecha || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Persistencia & Concurrencia</span>
              <div className="mt-0.5">
                <SyncStatusBadge status={syncStatus} version={record.version || 1} showVersion={true} />
              </div>
            </div>
            {record.estado && (
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Estado Actual</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  record.estado === 'Confirmado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {record.estado}
                </span>
              </div>
            )}
          </div>

          {/* Atributos del Registro en Par de Clave - Valor */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-200">
              Datos Almacenados en Registro
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(record)
                .filter(([key]) => !['id', 'creado_por', 'fecha_creacion', 'modificado_por', 'fecha_modificacion'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between gap-2">
                    <span className="text-slate-500 font-medium capitalize text-[11px]">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-bold text-slate-800 font-mono text-right truncate max-w-[200px]" title={String(value)}>
                      {value === null || value === undefined ? '—' : typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Historial de Auditoría y Trazabilidad */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-200 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-600" />
              <span>Historial de Auditoría & Modificaciones ({auditLogs.length})</span>
            </h4>

            {auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span className="font-mono text-slate-900">{log.accion}</span>
                      <span className="font-mono text-slate-500 text-[10px]">{log.fecha_hora}</span>
                    </div>
                    <p className="text-slate-600">{log.descripcion || log.detalles}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Usuario: <strong>{log.usuario_id || log.usuario}</strong></span>
                      {log.motivo && <span>Motivo: <em>{log.motivo}</em></span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 text-[11px]">
                Este registro conserva su versión original de alta sin modificaciones posteriores.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-lg text-xs hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
