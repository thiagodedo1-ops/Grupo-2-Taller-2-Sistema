import React, { useState } from 'react';
import { BaseDatosPorcina, ZafraLanera, Usuario } from '../../types/schema';
import { Scissors, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const ZafraOvinaView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();
  const zafras = db.Zafras_Laneras || [];
  const [showModal, setShowModal] = useState(false);
  
  // Logic from GanaderiaOvinaView for Zafra...
  
  return (
    <div className="space-y-6">
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#14281d]">Zafras Laneras & Esquila PROLANA</h2>
          <button 
            onClick={() => setShowModal(true)}
            className={`px-4 py-2 text-xs font-semibold ${theme.primary} rounded-lg`}
          >
            Registrar Esquila
          </button>
        </div>
      </div>
      <div className={`bg-white border ${theme.border} rounded-xl overflow-hidden shadow-xs`}>
        <table className="w-full text-left text-xs text-[#14281d]">
          <thead className={`bg-[#f0f4ef] text-[#526b5c] font-semibold border-b ${theme.border}`}>
            <tr>
              <th className="py-2.5 px-4">Campaña</th>
              <th className="py-2.5 px-4">Fecha</th>
              <th className="py-2.5 px-4 text-right">Animales</th>
              <th className="py-2.5 px-4 text-right">Total Lana (kg)</th>
              <th className="py-2.5 px-4">Destino</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf3ee]">
            {zafras.map((zaf) => (
              <tr key={zaf.id}>
                <td className="py-3 px-4 font-bold">{zaf.campana_id}</td>
                <td className="py-3 px-4">{zaf.fecha}</td>
                <td className="py-3 px-4 text-right">{zaf.animales_esquilados}</td>
                <td className="py-3 px-4 text-right font-bold">{zaf.kg_lana_total}</td>
                <td className="py-3 px-4">{zaf.destino_comercial}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
