import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  X,
  FileText,
  Activity
} from 'lucide-react';
import { BaseDatosPorcina, EventoSanitarioBovino, Usuario, FCostos } from '../../types/schema';
import { getRolePermissions } from '../../lib/permissions';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const SanidadBovinoView: React.FC<Props> = ({
  db,
  currentUser,
  onSaveRecord
}) => {
  const { theme } = useTheme();
  const { formatMoney } = useCurrency();
  const eventos = db.Eventos_Sanitarios_Bovinos || [];
  const categorias = db.Categorias_Bovinas || [];
  const totalCabezas = categorias.reduce((acc, c) => acc + (c.cabezas || 0), 0);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showSanidadModal, setShowSanidadModal] = useState(false);

  // Formulario Sanidad
  const [sanidadForm, setSanidadForm] = useState({
    tipo_evento: 'Vacunación Aftosa' as EventoSanitarioBovino['tipo_evento'],
    fecha: new Date().toISOString().split('T')[0],
    cabezas_tratadas: totalCabezas,
    producto_aplicado: 'Aftosa Bivalente Biogénesis Bagó',
    responsable: 'SENASA / Plan Local UNRC',
    certificado_senasa_nro: 'ACTA-2025-1420',
    observaciones: 'Campaña oficial obligatoria de otoño SENASA',
    costo_total: 0
  });

  const handleGuardarSanidad = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventoId = `SAN_BOV_${Date.now()}`;
    const nuevoEvento: EventoSanitarioBovino = {
      id: eventoId,
      tipo_evento: sanidadForm.tipo_evento,
      fecha: sanidadForm.fecha,
      cabezas_tratadas: Number(sanidadForm.cabezas_tratadas),
      producto_aplicado: sanidadForm.producto_aplicado,
      responsable: sanidadForm.responsable,
      certificado_senasa_nro: sanidadForm.certificado_senasa_nro,
      observaciones: sanidadForm.observaciones
    };
    
    await onSaveRecord('Eventos_Sanitarios_Bovinos', nuevoEvento);

    // Imputar costo si es mayor a 0
    if (Number(sanidadForm.costo_total) > 0) {
      await onSaveRecord('F_Costos', {
        id: `CST_BOV_SAN_${Date.now()}`,
        fecha: sanidadForm.fecha,
        cuenta_id: 'CTA_SANIDAD_BOVINA',
        unidad_neg_id: 'UN_BOVINOS',
        subunidad_id: 'BOV_GENERAL',
        origen_costo: 'CONSUMO',
        comprobante_id: eventoId,
        importe_neto: Number(sanidadForm.costo_total),
        estado: 'Confirmado',
        origen_dato: 'REAL',
        estado_validacion: 'OK',
        creado_por: currentUser?.usuario || 'admin',
        fecha_creacion: new Date().toISOString()
      } as FCostos);
    }

    setShowSanidadModal(false);
    setFeedbackMsg(`Evento sanitario registrado e imputado (${formatMoney(sanidadForm.costo_total)}).`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in">
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#14281d] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-[#2b583f] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#78c293]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <h1 className="text-xl font-bold text-[#2c1d11]">Sanidad Oficial SENASA (Bovinos)</h1>
          <p className="text-xs text-[#5c3a21] mt-0.5">Registro de vacunaciones, tratamientos y costos sanitarios.</p>
        </div>
        <button
          onClick={() => setShowSanidadModal(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${theme.primary} text-white rounded-lg shadow-xs cursor-pointer`}
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Evento Sanitario</span>
        </button>
      </div>

      {/* Historial */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#e7d4c4] text-[#8c674e] font-semibold bg-[#fbf4ee]">
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Tipo de Evento</th>
              <th className="py-2.5 px-3 text-right">Cabezas</th>
              <th className="py-2.5 px-3 text-right">Costo ($)</th>
              <th className="py-2.5 px-3">Producto / Responsable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2e6de]">
            {eventos.map((ev) => (
              <tr key={ev.id}>
                <td className="py-2.5 px-3 font-mono">{ev.fecha}</td>
                <td className="py-2.5 px-3 font-bold">{ev.tipo_evento}</td>
                <td className="py-2.5 px-3 text-right">{Number(ev.cabezas_tratadas).toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right">-</td>
                <td className="py-2.5 px-3">{ev.producto_aplicado} / {ev.responsable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showSanidadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold mb-4 border-b pb-2">Registrar Evento Sanitario Bovino</h3>
            <form onSubmit={handleGuardarSanidad} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={sanidadForm.fecha} onChange={e => setSanidadForm({...sanidadForm, fecha: e.target.value})} className="border p-2 rounded" required />
                <select value={sanidadForm.tipo_evento} onChange={e => setSanidadForm({...sanidadForm, tipo_evento: e.target.value as any})} className="border p-2 rounded">
                  <option value="Vacunación Aftosa">Vacunación Aftosa</option>
                  <option value="Vacunación Carbunclo">Vacunación Carbunclo</option>
                  <option value="Desparasitación">Desparasitación</option>
                </select>
              </div>
              <input type="number" placeholder="Cabezas tratadas" value={sanidadForm.cabezas_tratadas} onChange={e => setSanidadForm({...sanidadForm, cabezas_tratadas: Number(e.target.value)})} className="w-full border p-2 rounded" required />
              <input type="number" placeholder="Costo Total ($)" value={sanidadForm.costo_total} onChange={e => setSanidadForm({...sanidadForm, costo_total: Number(e.target.value)})} className="w-full border p-2 rounded" required />
              <input type="text" placeholder="Producto aplicado" value={sanidadForm.producto_aplicado} onChange={e => setSanidadForm({...sanidadForm, producto_aplicado: e.target.value})} className="w-full border p-2 rounded" required />
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowSanidadModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className={`px-4 py-2 ${theme.primary} text-white rounded`}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
