/**
 * @file ExistenciasBovinoView.tsx
 * @description Módulo de Existencias y Distribución del Rodeo Bovino
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 */

import React from 'react';
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { Database, TrendingUp, Scale, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const ExistenciasBovinoView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const categorias = db.Categorias_Bovinas || [];
  
  const totalCabezas = categorias.reduce((acc, c) => acc + (c.cabezas || 0), 0);
  const totalKg = categorias.reduce((acc, c) => acc + ((c.cabezas || 0) * (c.peso_promedio_kg || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#14281d] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#78350f]" />
              Existencias y Distribución del Rodeo Bovina
            </h2>
            <p className="text-xs text-[#526b5c] mt-1">
              Inventario físico, pesos promedios por categoría y distribución en potreros.
            </p>
          </div>
          <div className="text-right">
            <span className="block text-2xl font-bold text-[#14281d] font-mono tabular-nums">{totalCabezas}</span>
            <span className="text-xs text-[#526b5c] font-semibold">Total Cabezas</span>
          </div>
        </div>
      </div>

      {/* Tabla de Existencias */}
      <div className={`bg-white border ${theme.border} rounded-xl overflow-hidden shadow-xs`}>
        <div className={`p-4 border-b ${theme.border} bg-[#fdfaf8]`}>
          <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">
            Detalle por Categoría SENASA
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#14281d]">
            <thead className="bg-[#f8f5f2] text-[#526b5c] font-semibold border-b border-[#e7d4c4]">
              <tr>
                <th className="py-2.5 px-4">Categoría SENASA</th>
                <th className="py-2.5 px-4 text-right">Cabezas</th>
                <th className="py-2.5 px-4 text-right">Peso Prom. (kg)</th>
                <th className="py-2.5 px-4 text-right">Kg Totales</th>
                <th className="py-2.5 px-4">Potrero Asignado</th>
                <th className="py-2.5 px-4">Estado Sanitario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2ebe5]">
              {categorias.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-[#fbf7f3] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#14281d]">
                    {cat.categoria}
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-mono tabular-nums">
                    {cat.cabezas}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {cat.peso_promedio_kg} kg
                  </td>
                  <td className="py-3 px-4 text-right font-semibold font-mono tabular-nums">
                    {((cat.cabezas || 0) * (cat.peso_promedio_kg || 0)).toLocaleString('es-AR')} kg
                  </td>
                  <td className="py-3 px-4">{cat.potrero_actual}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#78350f] bg-[#fffbf2] border border-[#f5dcba] px-2 py-0.5 rounded">
                      {cat.estado_sanitario}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#f8f5f2] font-bold border-t border-[#e7d4c4]">
              <tr>
                <td className="py-3 px-4">Total General</td>
                <td className="py-3 px-4 text-right font-mono">{totalCabezas}</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-right font-mono">{totalKg.toLocaleString('es-AR')} kg</td>
                <td className="py-3 px-4" colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
