/**
 * @file ExistenciasView.tsx
 * @description Módulo de Existencias de Hacienda, Cierres de Período y Valuación con ROSPORC (VNR)
 * Requerimiento 2: Valuación de capones terminados por VNR sugerido ROSPORC menos gastos comerciales,
 * sin aplicar precio de capón a lechones ni madres, con soporte ARS/USD.
 */

import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  Unlock, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  DollarSign, 
  Download, 
  Calendar,
  Layers,
  TrendingUp,
  Info
} from 'lucide-react';
import { BaseDatosPorcina, CierrePeriodo, ExistenciaHacienda, Usuario } from '../types/schema';
import { DataTable, Column } from '../components/DataTable';
import { StatusTag } from '../components/StatusTag';
import { conciliarBalanceHacienda } from '../lib/calculations';
import { getRolePermissions } from '../lib/permissions';
import { useCurrency } from '../context/CurrencyContext';
import { rosporcService } from '../lib/rosporcService';

interface Props {
  db: BaseDatosPorcina;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
  onClosePeriod: (campanaId: string, observaciones: string) => Promise<any>;
  onReopenPeriod: (campanaId: string, motivo: string) => Promise<any>;
  onExportCsv: (table: keyof BaseDatosPorcina) => void;
  currentUser?: Usuario | null;
}

export const ExistenciasView: React.FC<Props> = ({
  db,
  onSaveRecord,
  onClosePeriod,
  onReopenPeriod,
  onExportCsv,
  currentUser = null
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney, symbol } = useCurrency();

  const [selectedCampana, setSelectedCampana] = useState<string>(
    db.D_Campana.find(c => c.estado === 'Abierto')?.id || 'CAMP_2024_2025'
  );

  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [cierreObs, setCierreObs] = useState('');
  const [reopenMotivo, setReopenMotivo] = useState('');

  // Parámetros de gastos comerciales para VNR
  const [gastosComercializacionPct, setGastosComercializacionPct] = useState<number>(4.5);

  const campanaObj = db.D_Campana.find(c => c.id === selectedCampana);
  const estaCerrada = campanaObj?.estado === 'Cerrado';

  // Conciliación de cabezas de hacienda para la campaña
  const conciliacion = useMemo(() => {
    return conciliarBalanceHacienda(db, selectedCampana);
  }, [db, selectedCampana]);

  // Cotización ROSPORC sugerida a la fecha de valuación (o vigente)
  const hoyStr = new Date().toISOString().split('T')[0];
  const refRosporc = rosporcService.getReferenciaVigente('Capón General');
  const vnrCalculado = rosporcService.calcularVNRCapon(refRosporc.precio_kg_vivo, gastosComercializacionPct);

  // Kilos y cabezas de capones en engorde terminados
  const lotesEngorde = db.Lotes_Animales.filter(l => l.fase_actual_id === 'FASE_ENGORDE_TERM' && l.estado === 'Activo');
  const cabezasCapon = lotesEngorde.reduce((acc, l) => acc + (Number(l.cabezas_actuales) || 0), 0);
  const kgTotalesCapon = lotesEngorde.reduce((acc, l) => acc + (Number(l.kg_actuales) || 0), 0);
  const valuacionVnrCapones = kgTotalesCapon * vnrCalculado.vnrSugeridoKg;

  // Lotes de lechones y recría (Costo de producción acumulado)
  const lotesCriaRecria = db.Lotes_Animales.filter(l => l.fase_actual_id !== 'FASE_ENGORDE_TERM' && l.estado === 'Activo');
  const cabezasEnProceso = lotesCriaRecria.reduce((acc, l) => acc + (Number(l.cabezas_actuales) || 0), 0);
  const kgEnProceso = lotesCriaRecria.reduce((acc, l) => acc + (Number(l.kg_actuales) || 0), 0);

  const handleCerrar = async (e: React.FormEvent) => {
    e.preventDefault();
    await onClosePeriod(selectedCampana, cierreObs);
    setShowCierreModal(false);
    setCierreObs('');
  };

  const handleReabrir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenMotivo.trim()) {
      alert('Debe especificar el motivo formal de la reapertura');
      return;
    }
    await onReopenPeriod(selectedCampana, reopenMotivo);
    setShowReopenModal(false);
    setReopenMotivo('');
  };

  // Columnas para Cierres de Período
  const columnsCierres: Column<CierrePeriodo>[] = [
    { key: 'fecha_cierre', header: 'Fecha Cierre' },
    { key: 'campana_id', header: 'Campaña' },
    { key: 'cerrado_por', header: 'Responsable' },
    { key: 'observaciones', header: 'Observaciones / Motivo' },
    { key: 'estado', header: 'Estado', render: (c) => <StatusTag estado={c.estado} /> }
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* Encabezado con selector de campaña y estado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#d8e2d7] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#143422] tracking-tight">
              Existencias de Hacienda & Cierres de Período
            </h2>
            <span className="text-[10px] font-mono text-[#255e39] bg-[#edf6f0] px-2.5 py-0.5 rounded-full border border-[#cbe3d2]">
              RT 22 Porcina
            </span>
          </div>
          <p className="text-xs text-[#5c7767] mt-0.5">
            Conciliación física de piara, valuación dual (VNR ROSPORC y costo acumulado) y bloqueo de períodos contables.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <select
            value={selectedCampana}
            onChange={e => setSelectedCampana(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-[#f8faf8] border border-[#cbd8cb] rounded-xl text-[#153422] focus:ring-1 focus:ring-[#1c4b31] outline-none cursor-pointer"
          >
            {db.D_Campana.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.estado})
              </option>
            ))}
          </select>

          {estaCerrada ? (
            permissions.canReopenPeriod ? (
              <button
                onClick={() => setShowReopenModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#8c5717] hover:bg-[#734509] text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer border border-[#6b400e]"
              >
                <Unlock className="w-4 h-4" />
                <span>Reabrir Período</span>
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-[#6d8274] bg-[#edf2ee] px-3 py-2 rounded-xl border border-[#d2ded3]">
                Período Cerrado
              </span>
            )
          ) : (
            permissions.canClosePeriod && (
              <button
                onClick={() => setShowCierreModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1c4b31] hover:bg-[#123823] text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer border border-[#163c26]"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Período Oficial</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Banner de Modo Solo Lectura para Auditor */}
      {permissions.isReadOnly && (
        <div className="bg-[#edf3f8] border border-[#c4d6e5] text-[#1e4260] text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
          <span><strong>Rango Auditor Porcino:</strong> Modo de solo lectura activo. Verificación de existencias de piara y conciliación física.</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#c5dcf0] text-[#1b3d59] border border-[#b2d0ea]">Solo Lectura</span>
        </div>
      )}

      {/* Regla de negocio 13: Cierres y Bloqueos */}
      <div className="bg-[#edf5f0] border border-[#c5e1cf] rounded-xl p-3.5 text-xs text-[#16432a] flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-[#1b6b3e] shrink-0 mt-0.5" />
        <div>
          <strong>Regla 13 (Integridad de Cierres de Hacienda):</strong> Un período formalmente cerrado bloquea altas, modificaciones y anulaciones con fecha comprendida dentro del mismo. Su reapertura exige rol de Administrador con justificación formal en Auditoría.
        </div>
      </div>

      {/* =====================================================================
          VALUACIÓN DUAL DE EXISTENCIAS CON REFERENCIA ROSPORC (Requerimiento 2)
      ===================================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-[#d8e2d7] shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e5ece3] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#1c4b31]" />
            <div>
              <h3 className="text-base font-bold text-[#143422] tracking-tight">
                Valuación de Existencias de Piara (Criterio RT 22)
              </h3>
              <p className="text-xs text-[#5c7767]">
                Capones valuados a VNR según referencia ROSPORC menos gastos comerciales. Lechones y recría a Costo Acumulado.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#1c4b31] bg-[#edf7f0] px-3 py-1 rounded-lg border border-[#cbe5d3]">
            Moneda: {symbol}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tarjeta 1: Capones Terminados (VNR Sugerido ROSPORC) */}
          <div className="p-4 bg-gradient-to-b from-[#f7fbf8] to-white rounded-xl border-2 border-[#1c4b31]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#143422] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1c4b31]" />
                1. Capones Terminados (Engorde a Faena)
              </span>
              <span className="text-[10px] font-bold text-[#15803d] bg-[#eaf5ed] px-2 py-0.5 rounded border border-[#b8dfc4]">
                Criterio VNR ROSPORC
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#d8e2d7] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#557361]">Precio Base ROSPORC ({refRosporc.semana}):</span>
                <span className="font-mono font-bold text-[#153422]">
                  $ {refRosporc.precio_kg_vivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })} / kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#557361]">Gastos Directos de Comercialización:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.5"
                    value={gastosComercializacionPct}
                    onChange={(e) => setGastosComercializacionPct(Number(e.target.value))}
                    className="w-14 px-1.5 py-0.5 text-right font-mono border border-[#c8d8ca] rounded bg-[#f9fbf9] text-xs font-bold"
                  />
                  <span className="text-[#557361] font-mono">% (flete y faena)</span>
                </div>
              </div>
              <div className="flex justify-between text-[#8c5717]">
                <span>Valorización de gastos de comercialización:</span>
                <span className="font-mono font-semibold">
                  - $ {vnrCalculado.descuentoComercialKg.toFixed(2)} / kg
                </span>
              </div>
              <div className="flex justify-between border-t border-[#edf2ec] pt-1.5 font-bold text-[#1c4b31]">
                <span>VNR Sugerido Aplicable:</span>
                <span className="font-mono text-sm">
                  $ {vnrCalculado.vnrSugeridoKg.toFixed(2)} / kg vivo
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-[#557361] block">Existencia en Piara:</span>
                <span className="font-mono font-bold text-[#153422]">
                  {cabezasCapon} cab. ({kgTotalesCapon.toLocaleString('es-AR')} kg)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#557361] block">Valuación Total VNR:</span>
                <span className="font-mono font-bold text-base text-[#1c4b31]">
                  {formatMoney(valuacionVnrCapones)}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Categorías en Proceso (Costo Acumulado - NO APLICA ROSPORC) */}
          <div className="p-4 bg-[#fafcfa] rounded-xl border border-[#d8e2d7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#234230] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8c5717]" />
                2. Categorías en Proceso (Cría y Destete)
              </span>
              <span className="text-[10px] font-bold text-[#8c5717] bg-[#fdf6ec] px-2 py-0.5 rounded border border-[#f5dcba]">
                Costo Acumulado
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#e2eae2] text-xs space-y-2">
              <p className="text-[#4a6353] leading-relaxed">
                <strong>Instrucción normativa de valuación:</strong> No se aplica el precio del capón de ROSPORC a lechones, cachorros ni madres reproductoras, ya que representan activos biológicos en crecimiento y requieren valuación al costo histórico acumulado.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#edf2ec]">
                <div>
                  <span className="text-[11px] text-[#6b8273]">Cabezas en Proceso:</span>
                  <div className="font-mono font-bold text-[#153422]">{cabezasEnProceso} cabezas</div>
                </div>
                <div>
                  <span className="text-[11px] text-[#6b8273]">Biomasa en Pie:</span>
                  <div className="font-mono font-bold text-[#153422]">{kgEnProceso.toLocaleString('es-AR')} kg</div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#557361] italic pt-1">
              Base de costeo: Alimento peleteado y raciones consumidas imputadas por libro de granja.
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Conciliación de Hacienda */}
      <div className="bg-white p-5 rounded-2xl border border-[#d8e2d7] shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e5ece3] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#143422]">
              Conciliación Física de Piara (Cabezas de Ganado)
            </h3>
            {conciliacion.conciliado ? (
              <span className="text-[11px] font-semibold text-[#1b5c34] bg-[#edf7f0] px-2 py-0.5 rounded border border-[#cbe5d3] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#1b7a3d]" />
                Conciliado sin diferencias
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#8f2828] bg-[#fdf2f2] px-2 py-0.5 rounded border border-[#f8c8c8] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#9e2a2b]" />
                Diferencia: {conciliacion.diferenciaCab} cabezas
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs text-center">
          <div className="p-2.5 bg-[#f6f9f6] rounded-xl border border-[#e1eae1]">
            <span className="text-[#657d6e] text-[11px] font-medium">Stock Inicial</span>
            <div className="font-mono font-bold text-[#153422] text-sm mt-0.5">{conciliacion.stockInicialCab} cab</div>
          </div>
          <div className="p-2.5 bg-[#edf7f0] rounded-xl border border-[#cde5d3]">
            <span className="text-[#1b5c34] text-[11px] font-semibold">+ Nacimientos</span>
            <div className="font-mono font-bold text-[#1b5c34] text-sm mt-0.5">+{conciliacion.nacimientosCab} cab</div>
          </div>
          <div className="p-2.5 bg-[#fdf2f2] rounded-xl border border-[#f8c8c8]">
            <span className="text-[#8f2828] text-[11px] font-semibold">− Bajas / Mort.</span>
            <div className="font-mono font-bold text-[#8f2828] text-sm mt-0.5">-{conciliacion.bajasCab} cab</div>
          </div>
          <div className="p-2.5 bg-[#fef8ee] rounded-xl border border-[#f6dfba]">
            <span className="text-[#855110] text-[11px] font-semibold">− Ventas</span>
            <div className="font-mono font-bold text-[#855110] text-sm mt-0.5">-{conciliacion.ventasCab} cab</div>
          </div>
          <div className="p-2.5 bg-[#f6f9f6] rounded-xl border border-[#e1eae1]">
            <span className="text-[#657d6e] text-[11px] font-medium">± Ajustes</span>
            <div className="font-mono font-bold text-[#153422] text-sm mt-0.5">{conciliacion.ajustesCab} cab</div>
          </div>
          <div className="p-2.5 bg-[#eef3ee] rounded-xl border border-[#d2dfd3]">
            <span className="text-[#254d35] text-[11px] font-semibold">= Calculado</span>
            <div className="font-mono font-bold text-[#143422] text-sm mt-0.5">{conciliacion.stockCalculadoCab} cab</div>
          </div>
          <div className="p-2.5 bg-[#eaf4ec] rounded-xl border border-[#a8ceb1]">
            <span className="text-[#164e2c] text-[11px] font-bold">En Lotes</span>
            <div className="font-mono font-bold text-[#164e2c] text-sm mt-0.5">{conciliacion.stockRealRegistradoCab} cab</div>
          </div>
        </div>
      </div>

      {/* Historial de Cierres de Período */}
      <DataTable
        columns={columnsCierres}
        data={db.Cierres_Periodo}
        title="Historial de Cierres y Aperturas de Campaña"
        subtitle="Control cronológico de bloqueos de períodos contables"
        onExportCsv={() => onExportCsv('Cierres_Periodo')}
        emptyMessage="No se han registrado cierres de período en el sistema."
      />

      {/* MODAL: CERRAR PERÍODO */}
      {showCierreModal && (
        <div className="fixed inset-0 z-50 bg-[#07130c]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#cbd8cb] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#8c2222] font-bold text-base">
              <Lock className="w-5 h-5 text-[#8c2222]" />
              <span>Confirmar Cierre de Campaña</span>
            </div>
            <p className="text-xs text-[#4c6657]">
              Esta acción bloqueará altas, modificaciones y anulaciones con fecha dentro de <strong>{campanaObj?.nombre}</strong>.
            </p>
            <form onSubmit={handleCerrar} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#1d3d2a] font-semibold mb-1">Observaciones de Cierre</label>
                <textarea
                  rows={3}
                  value={cierreObs}
                  onChange={e => setCierreObs(e.target.value)}
                  placeholder="Detalles del cierre de ejercicio..."
                  className="w-full px-3 py-2 border border-[#cbd8cb] rounded-xl text-xs text-[#153422] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#edf2ec]">
                <button
                  type="button"
                  onClick={() => setShowCierreModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#4c6657] hover:bg-[#ebf0ea] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#143422] hover:bg-[#0c2417] rounded-xl shadow-2xs cursor-pointer"
                >
                  Ejecutar Cierre Definitivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REABRIR PERÍODO */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 bg-[#07130c]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#cbd8cb] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#8c5717] font-bold text-base">
              <Unlock className="w-5 h-5 text-[#8c5717]" />
              <span>Autorizar Reapertura de Período</span>
            </div>
            <p className="text-xs text-[#4c6657]">
              Por regla de auditoría, se exige justificar formalmente el motivo de la reapertura de <strong>{campanaObj?.nombre}</strong>.
            </p>
            <form onSubmit={handleReabrir} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#1d3d2a] font-semibold mb-1">Motivo Formal de Reapertura (*)</label>
                <textarea
                  required
                  rows={3}
                  value={reopenMotivo}
                  onChange={e => setReopenMotivo(e.target.value)}
                  placeholder="Ej: Corrección de liquidación de frigorífico requerida por auditoría contable..."
                  className="w-full px-3 py-2 border border-[#cbd8cb] rounded-xl text-xs text-[#153422] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#edf2ec]">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#4c6657] hover:bg-[#ebf0ea] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#8c5717] hover:bg-[#734509] rounded-xl shadow-2xs cursor-pointer"
                >
                  Reabrir y Registrar en Auditoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
