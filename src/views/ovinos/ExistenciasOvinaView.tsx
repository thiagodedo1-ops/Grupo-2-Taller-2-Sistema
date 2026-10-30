import React from 'react';
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { Compass } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const ExistenciasOvinaView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const categorias = db.Categorias_Ovinas || [];
  const totalCabezas = categorias.reduce((acc, c) => acc + (c.cabezas || 0), 0);

  return (
    <div className="space-y-6">
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs`}>
        <h2 className="text-xl font-bold text-[#14281d]">Existencias & Cierres de Inventario Ovino</h2>
        <p className="text-xs text-[#526b5c] mt-1">Valuación de majada, inventario físico y cierre de campaña.</p>
      </div>

      <div className={`bg-white border ${theme.border} rounded-xl overflow-hidden shadow-xs`}>
        <div className={`p-4 border-b ${theme.border} ${theme.secondaryBg}`}>
          <span className="text-xs font-bold text-[#14281d] uppercase tracking-wider">Inventario y Valuación del Rodeo</span>
        </div>
        <table className="w-full text-left text-xs text-[#14281d]">
          <thead className={`bg-[#f0f4ef] text-[#526b5c] font-semibold border-b ${theme.border}`}>
            <tr>
              <th className="py-2.5 px-4">Categoría</th>
              <th className="py-2.5 px-4 text-right">Cabezas</th>
              <th className="py-2.5 px-4 text-right">Peso Promedio (kg)</th>
              <th className="py-2.5 px-4 text-right">Valor Estimado ($/cab)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf3ee]">
            {categorias.map((cat) => (
              <tr key={cat.id}>
                <td className="py-3 px-4 font-semibold">{cat.categoria}</td>
                <td className="py-3 px-4 text-right font-bold">{cat.cabezas}</td>
                <td className="py-3 px-4 text-right">55.0</td>
                <td className="py-3 px-4 text-right font-mono">$120,000</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
