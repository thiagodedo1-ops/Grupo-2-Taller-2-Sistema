import React from 'react';
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const VentasOvinaView: React.FC<Props> = ({ db, currentUser, onSaveRecord }) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs`}>
        <h2 className="text-xl font-bold text-[#14281d]">Venta de Corderos, Carne & Lana</h2>
        <p className="text-xs text-[#526b5c] mt-1">Comercialización de cordero pesado, capones y zafra lanera.</p>
      </div>

      <div className={`bg-white border ${theme.border} rounded-xl p-6 text-center shadow-xs`}>
        <TrendingUp className="w-10 h-10 text-[#688574] mx-auto mb-3" />
        <h3 className="text-sm font-bold text-[#14281d]">Gestión Comercial Ovina</h3>
        <p className="text-xs text-[#526b5c] mt-1 max-w-md mx-auto">
          Registro de liquidaciones de venta de hacienda ovina y lotes de lana con emisión de comprobantes y trazabilidad.
        </p>
      </div>
    </div>
  );
};
