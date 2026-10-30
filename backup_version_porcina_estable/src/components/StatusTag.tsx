/**
 * @file StatusTag.tsx
 * @description Etiqueta de estado transaccional e integridad con paleta ganadera/agroindustrial
 * Pozo del Carril · La Aguada
 */

import React from 'react';
import { EstadoTransaccion, EstadoValidacion } from '../types/schema';

interface Props {
  estado?: EstadoTransaccion | EstadoValidacion | string;
  className?: string;
  motivo?: string;
}

export const StatusTag: React.FC<Props> = ({ estado, className = '', motivo }) => {
  switch (estado) {
    case 'Confirmado':
      return (
        <span 
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#18452b] bg-[#eef7f1] border border-[#c1e5cd] px-2.5 py-0.5 rounded-md ${className}`}
          title="Movimiento verificado y confirmado a firme"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1b6b3e]" />
          Confirmado
        </span>
      );

    case 'Borrador':
      return (
        <span 
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4a554e] bg-[#f1f4f1] border border-[#d6ddd6] px-2.5 py-0.5 rounded-md ${className}`}
          title="Registro provisorio pendiente de validación"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#718076]" />
          Borrador
        </span>
      );

    case 'Cerrado':
      return (
        <span 
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1e3a5f] bg-[#edf3fa] border border-[#c8daf0] px-2.5 py-0.5 rounded-md ${className}`}
          title="Período o lote formalmente cerrado"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#24528a]" />
          Cerrado
        </span>
      );

    case 'Anulado':
      return (
        <span 
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#822121] bg-[#fdf2f2] border border-[#f8c8c8] px-2.5 py-0.5 rounded-md cursor-help ${className}`}
          title={motivo ? `Motivo formal: ${motivo}` : 'Registro formalmente anulado (baja lógica)'}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#b32b2b]" />
          Anulado
        </span>
      );

    case 'Observado':
      return (
        <span 
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold text-[#804812] bg-[#fdf6ec] border border-[#f5d5a7] px-2.5 py-0.5 rounded-md cursor-help ${className}`}
          title={motivo ? `Observación técnica: ${motivo}` : 'Inconsistencia de campo o registro pendiente de revisión'}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#c26d17] animate-pulse" />
          Observado
        </span>
      );

    case 'OK':
      return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-[#18452b] bg-[#eef7f1] border border-[#c1e5cd] px-2 py-0.5 rounded ${className}`}>
          OK
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center text-[11px] font-medium text-stone-600 ${className}`}>
          {estado || '—'}
        </span>
      );
  }
};
