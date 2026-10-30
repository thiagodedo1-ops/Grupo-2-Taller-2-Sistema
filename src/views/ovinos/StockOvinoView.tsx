import React from 'react';
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { Boxes } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const StockOvinoView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const insumos = db.D_Insumo || [];

  return (
    <div className="space-y-6">
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs`}>
        <h2 className="text-xl font-bold text-[#14281d]">Stock de Insumos & Materias Primas Ovinas</h2>
        <p className="text-xs text-[#526b5c] mt-1">Silos de maíz, sales minerales y productos veterinarios específicos para ovinos.</p>
      </div>

      <div className={`bg-white border ${theme.border} rounded-xl overflow-hidden shadow-xs`}>
        <div className={`p-4 border-b ${theme.border} ${theme.secondaryBg}`}>
          <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">Insumos y Alimentos Disponibles</span>
        </div>
        <table className="w-full text-left text-xs text-[#14281d]">
          <thead className={`bg-[#f0f4ef] text-[#526b5c] font-semibold border-b ${theme.border}`}>
            <tr>
              <th className="py-2.5 px-4">Insumo / Ítem</th>
              <th className="py-2.5 px-4">Tipo</th>
              <th className="py-2.5 px-4 text-right">Stock Disponible</th>
              <th className="py-2.5 px-4">Unidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf3ee]">
            {insumos.map((ins) => (
              <tr key={ins.id} className="hover:bg-[#f9fbf8]">
                <td className="py-3 px-4 font-semibold">{ins.nombre}</td>
                <td className="py-3 px-4 text-[#526b5c]">{ins.tipo_insumo}</td>
                <td className="py-3 px-4 text-right font-bold text-[#1c4b31]">1,250</td>
                <td className="py-3 px-4 font-mono">kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
