/**
 * @file BadgeOrigin.tsx
 * @description Indicador visual de calidad y origen del dato (REAL, SUPUESTO, REFERENCIA EXTERNA, PENDIENTE)
 * Estilo ganadero y precisión técnica agropecuaria
 */

import React from 'react';
import { OrigenDato } from '../types/schema';

interface Props {
  origen?: OrigenDato | 'PENDIENTE' | string;
  className?: string;
}

export const BadgeOrigin: React.FC<Props> = ({ origen = 'REAL', className = '' }) => {
  if (origen === 'REAL') {
    return (
      <span 
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold text-[#1a4d2e] bg-[#edf6f0] px-2 py-0.5 rounded border border-[#c5e4ce] tracking-wide ${className}`}
        title="Dato real verificado en registros de campo de la unidad"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#1b7a3d] inline-block" />
        DATO REAL
      </span>
    );
  }

  if (origen === 'SUPUESTO') {
    return (
      <span 
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold text-[#8a5316] bg-[#fdf7ee] px-2 py-0.5 rounded border border-[#f5dcba] tracking-wide ${className}`} 
        title="Dato estimado o supuesto técnico. Requiere reemplazo por medición real."
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#c9741b] inline-block" />
        ESTIMACIÓN
      </span>
    );
  }

  if (origen === 'REFERENCIA EXTERNA') {
    return (
      <span 
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold text-[#2a4d69] bg-[#f0f5fa] px-2 py-0.5 rounded border border-[#cbe0f2] tracking-wide ${className}`} 
        title="Parámetro referencial bibliográfico o de mercado (ROSPORC / SAGyP)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#3b698f] inline-block" />
        REF. MERCADO
      </span>
    );
  }

  // PENDIENTE
  return (
    <span 
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold text-[#8f2828] bg-[#fef2f2] px-2 py-0.5 rounded border border-dashed border-[#f8b4b4] tracking-wide ${className}`} 
      title="Dato pendiente de confirmación formal con el encargado"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#c93636] inline-block animate-pulse" />
      PENDIENTE
    </span>
  );
};
