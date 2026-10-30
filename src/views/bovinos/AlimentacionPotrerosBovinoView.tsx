import React, { useState, useMemo } from 'react';
import { 
  Wheat, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  Utensils, 
  Scale, 
  Sliders, 
  ArrowRight,
  Plus,
  ChevronDown,
  X
} from 'lucide-react';
import { BaseDatosPorcina, PotreroBovino, DietaRacionBovina, ConsumoAlimentoReal, Usuario } from '../../types/schema';
import { getRolePermissions } from '../../lib/permissions';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const AlimentacionPotrerosBovinoView: React.FC<Props> = ({
  db,
  currentUser,
  onSaveRecord
}) => {
  const { theme } = useTheme();
  const { formatMoney } = useCurrency();
  const permissions = getRolePermissions(currentUser);
  
  const potreros = db.Potreros_Bovinos || [];
  const dietas = db.Dieta_Racion_Bovina || [];
  const categorias = db.Categorias_Bovinas || [];
  const transferencias = db.Transferencias_Granos?.filter(t => t.unidad_destino_id === 'UN_BOVINOS') || [];
  const consumosBovinos = useMemo(() => {
    return (db.Consumo_Alimento_Real || []).filter(c => c.unidad_neg_id === 'UN_BOVINOS' || c.subunidad_id?.startsWith('BOV'));
  }, [db.Consumo_Alimento_Real]);

  const insumos = db.D_Insumo || [];
  
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    insumo_id: insumos[0]?.id || 'INS_MAIZ_PROP',
    kg_consumidos: 250,
    fase_id: 'FASE_ENGORDE_CORRAL',
    subunidad_id: 'BOV_ENGORDE',
    costo_unitario_imputado: 210
  });

  // Cálculos de carga
  const superficieTotalHa = 180;
  const totalEV = categorias.reduce((acc, c) => {
    let factor = 1.0;
    if (c.categoria.includes('Toro')) factor = 1.4;
    else if (c.categoria.includes('Vaca') || c.categoria.includes('Vientre')) factor = 1.0;
    else if (c.categoria.includes('Vaquillona')) factor = 0.8;
    else if (c.categoria.includes('Novillo')) factor = 0.9;
    else if (c.categoria.includes('Ternero')) factor = 0.5;
    return acc + (c.cabezas * factor);
  }, 0);
  const cargaMediaEVHa = totalEV / superficieTotalHa;

  const totalKgMaizPropio = transferencias.reduce((acc, t) => acc + (t.kg_transferidos || 0), 0);

  const handleSubmitConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.kg_consumidos) <= 0) {
      alert('Ingrese una cantidad de kilos mayor a 0');
      return;
    }

    const costoTotal = Number(formData.kg_consumidos) * Number(formData.costo_unitario_imputado);
    const consumoId = `CON_BOV_${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Guardar Consumo Real
    const nuevoConsumo: ConsumoAlimentoReal = {
      id: consumoId,
      fecha: formData.fecha,
      insumo_id: formData.insumo_id,
      unidad_neg_id: 'UN_BOVINOS',
      kg_consumidos: Number(formData.kg_consumidos),
      fase_id: formData.fase_id,
      subunidad_id: formData.subunidad_id,
      costo_unitario_imputado: Number(formData.costo_unitario_imputado),
      costo_total_imputado: costoTotal,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      creado_por: currentUser?.usuario || 'admin',
      fecha_creacion: now
    };

    await onSaveRecord('Consumo_Alimento_Real', nuevoConsumo);

    // 2. Descontar stock de insumos
    await onSaveRecord('Movimientos_Stock_Insumos', {
      id: `MS_BOV_${Date.now()}`,
      fecha: formData.fecha,
      tipo_movimiento: 'CONSUMO',
      insumo_id: formData.insumo_id,
      cantidad: -Number(formData.kg_consumidos),
      um_id: 'UM_KG',
      origen_movimiento_id: consumoId,
      observaciones: `Consumo bovino en subunidad ${formData.subunidad_id}`
    });

    // 3. Imputar a costos directos (F_Costos) -> Costo de ventas / Producción
    await onSaveRecord('F_Costos', {
      id: `CST_BOV_${Date.now()}`,
      fecha: formData.fecha,
      cuenta_id: 'CTA_ALIM_MAIZ',
      unidad_neg_id: 'UN_BOVINOS',
      subunidad_id: formData.subunidad_id,
      origen_costo: 'CONSUMO',
      comprobante_id: consumoId,
      importe_neto: costoTotal,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      creado_por: currentUser?.usuario || 'admin',
      fecha_creacion: now
    });

    setShowModal(false);
    setShowMenu(false);
    setFeedbackMsg(`Consumo bovino de ${Number(formData.kg_consumidos).toLocaleString()} kg registrado e imputado a costos (${formatMoney(costoTotal)}).`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in font-sans relative">
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#2c1d11] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-[#78350f]">
          <CheckCircle2 className="w-4 h-4 text-[#fde68a]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Encabezado con Botón Menú Desplegable */}
      <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`p-1.5 ${theme.iconBg} rounded-lg`}>
              <Wheat className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5c3a21]">
              Producción Bovina · Pozo del Carril (UNRC)
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#2c1d11] tracking-tight">
            Alimentación, Potreros & Carga (EV/ha)
          </h1>
          <p className="text-xs text-[#5c3a21] mt-0.5">
            Balance forrajero pastoril, receptividad EV/ha, raciones balanceadas de corral y aprovechamiento de grano propio
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg text-xs">
            <span className="text-[#5c3a21]">Superficie Asignada: </span>
            <strong className="text-[#2c1d11] font-mono">180 ha</strong>
          </div>

          {/* Menú Desplegable de Acciones de Alimentación */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#78350f] hover:bg-[#652b0c] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Utensils className="w-4 h-4" />
              <span>Acciones Alimentación</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e7d4c4] rounded-xl shadow-lg z-50 py-1.5 text-xs">
                <button
                  onClick={() => { setShowModal(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[#fbf4ee] text-[#2c1d11] font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#78350f]" />
                  <span>Registrar Consumo Real</span>
                </button>
                <div className="border-t border-[#f2e6de] my-1"></div>
                <div className="px-4 py-1.5 text-[10px] text-[#8c674e] uppercase font-bold">
                  Catálogo y Dietas
                </div>
                <div className="px-4 py-1.5 text-slate-600">
                  {dietas.length} dietas formuladas activas
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tira de Resumen Forrajero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#e7d4c4] shadow-xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase">Carga Media General</div>
          <div className="text-2xl font-bold text-[#78350f] font-mono tabular-nums mt-1">
            {cargaMediaEVHa.toFixed(2)} <span className="text-xs font-normal text-[#5c3a21]">EV/ha</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">Receptividad recomendada: 0.85 - 1.10</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e7d4c4] shadow-xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase">Potreros Ganaderos</div>
          <div className="text-2xl font-bold text-[#2c1d11] font-mono tabular-nums mt-1">
            {potreros.length} <span className="text-xs font-normal text-[#5c3a21]">sectores</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">Alfalfa, Festuca, Verdeos y Feedlot</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e7d4c4] shadow-xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase">Total Equivalente Vaca</div>
          <div className="text-2xl font-bold text-[#2c1d11] font-mono tabular-nums mt-1">
            {totalEV.toFixed(1)} <span className="text-xs font-normal text-[#5c3a21]">EV</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">Total rodeo bovino activo</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e7d4c4] shadow-xs">
          <div className="text-[11px] font-semibold text-[#8c674e] uppercase">Maíz Propio UNRC</div>
          <div className="text-2xl font-bold text-[#78350f] font-mono tabular-nums mt-1">
            {totalKgMaizPropio.toLocaleString('es-AR')} <span className="text-xs font-normal text-[#5c3a21]">kg</span>
          </div>
          <div className="text-[11px] text-[#5c3a21] mt-0.5">Transferido desde UN Agrícola</div>
        </div>
      </div>

      {/* Historial de Consumos Reales Bovinos */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#2c1d11]">Historial de Consumos Reales de Alimento (Bovinos)</h2>
            <p className="text-xs text-[#5c3a21]">Kilos de ración consumidos por subunidad e imputación automática al costo de ventas</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#78350f] bg-[#fbf4ee] px-2.5 py-1 rounded-lg border border-[#e7d4c4]">
            {consumosBovinos.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e7d4c4] text-[#8c674e] font-semibold bg-[#fbf4ee]">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Insumo / Ración</th>
                <th className="py-2.5 px-3">Subunidad / Destino</th>
                <th className="py-2.5 px-3 text-right">Kg Consumidos</th>
                <th className="py-2.5 px-3 text-right">Costo Imputado ($)</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2e6de]">
              {consumosBovinos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#5c3a21]">
                    No hay consumos de alimento bovino registrados. Haga clic en <strong>Acciones Alimentación &gt; Registrar Consumo Real</strong>.
                  </td>
                </tr>
              ) : (
                consumosBovinos.map(c => {
                  const ins = insumos.find(i => i.id === c.insumo_id);
                  return (
                    <tr key={c.id} className="hover:bg-[#fbf4ee]/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#5c3a21]">{c.fecha}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2c1d11]">{ins ? ins.nombre : c.insumo_id}</td>
                      <td className="py-2.5 px-3 text-[#5c3a21]">{c.subunidad_id}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2c1d11]">{Number(c.kg_consumidos).toLocaleString('es-AR')} kg</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#78350f]">{formatMoney(c.costo_total_imputado || 0)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{c.estado}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 1: Distribución por Potreros y Receptividad */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#2c1d11]">Potreros de Pastoreo y Corrales de Encierre</h2>
            <p className="text-xs text-[#5c3a21]">Recurso forrajero, receptividad en EV/ha y carga instantánea asignada</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e7d4c4] text-[#8c674e] font-semibold bg-[#fbf4ee]">
                <th className="py-2.5 px-3">Potrero / Sector</th>
                <th className="py-2.5 px-3">Recurso Forrajero</th>
                <th className="py-2.5 px-3 text-right">Superficie</th>
                <th className="py-2.5 px-3 text-right">Receptividad Base</th>
                <th className="py-2.5 px-3 text-right">Cabezas Actuales</th>
                <th className="py-2.5 px-3 text-right">Carga Actual</th>
                <th className="py-2.5 px-3 text-center">Estado del Pastizal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2e6de]">
              {potreros.map((p) => {
                const esSobrepastoreo = p.carga_actual_ev_ha > p.receptividad_ev_ha * 1.15;
                return (
                  <tr key={p.id} className="hover:bg-[#fbf4ee]/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#2c1d11]">
                      {p.nombre}
                    </td>
                    <td className="py-2.5 px-3 text-[#5c3a21]">
                      {p.tipo_recurso}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#2c1d11]">
                      {p.superficie_ha} ha
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#5c3a21]">
                      {p.receptividad_ev_ha.toFixed(2)} EV/ha
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#2c1d11]">
                      {p.cabezas_asignadas} cab
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold">
                      <span className={esSobrepastoreo ? 'text-rose-600' : 'text-[#78350f]'}>
                        {p.carga_actual_ev_ha.toFixed(2)} EV/ha
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[11px] font-semibold text-[#78350f]">
                        {p.estado_pastura}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 2: Raciones Formuladas y Dietas de Confinamiento */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
        <div className="pb-3 border-b border-[#f2e6de] mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-[#fbf4ee] text-[#78350f] rounded border border-[#e7d4c4]">
              <Utensils className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-[#2c1d11]">Dietas Balanceadas y Raciones de Corral</h2>
          </div>
          <p className="text-xs text-[#5c3a21] mt-0.5">
            Formulación zootécnica para adaptación, recría y terminación con grano de maíz propio y subproductos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dietas.map((d) => (
            <div key={d.id} className="p-4 bg-[#fbf4ee]/50 border border-[#e7d4c4] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#78350f]">{d.nombre}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-white rounded border border-[#e7d4c4] text-[#5c3a21]">
                  {d.etapa_destino}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded border border-[#e7d4c4]">
                  <span className="text-[#8c674e] block">Costo estimado:</span>
                  <strong className="text-[#2c1d11] font-mono">${d.costo_estimado_cab_dia}/cab/día</strong>
                </div>
                <div className="bg-white p-2 rounded border border-[#e7d4c4]">
                  <span className="text-[#8c674e] block">ADPV esperado:</span>
                  <strong className="text-[#78350f] font-mono">+{d.adpv_esperado_kg_dia} kg/día</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: REGISTRAR CONSUMO REAL BOVINO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#e7d4c4] max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#f2e6de] pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#78350f]" />
                <h3 className="text-sm font-bold text-[#2c1d11]">
                  BOVINOS · REGISTRAR CONSUMO DE ALIMENTO REAL
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#8c674e] hover:text-[#2c1d11] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitConsumo} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Fecha de Consumo *:</label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e7d4c4] rounded-xl font-mono text-xs text-[#2c1d11] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Insumo / Ración *:</label>
                <select
                  value={formData.insumo_id}
                  onChange={e => setFormData({ ...formData, insumo_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e7d4c4] rounded-xl bg-white font-medium text-[#2c1d11]"
                >
                  {insumos.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre} ({i.tipo_insumo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#5c3a21] font-semibold mb-1">Subunidad / Destino Ganadero *:</label>
                <select
                  value={formData.subunidad_id}
                  onChange={e => setFormData({ ...formData, subunidad_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e7d4c4] rounded-xl bg-white font-medium text-[#2c1d11]"
                >
                  <option value="BOV_CRIA">BOV_CRIA (Cría / Vientres)</option>
                  <option value="BOV_RECRIA">BOV_RECRIA (Recría Pastoril)</option>
                  <option value="BOV_ENGORDE">BOV_ENGORDE (Feedlot / Terminación)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Kilos Consumidos *:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.kg_consumidos}
                    onChange={e => setFormData({ ...formData, kg_consumidos: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#e7d4c4] rounded-xl font-mono font-bold text-[#2c1d11] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#5c3a21] font-semibold mb-1">Costo Unitario ($/kg) *:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costo_unitario_imputado}
                    onChange={e => setFormData({ ...formData, costo_unitario_imputado: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#e7d4c4] rounded-xl font-mono font-bold text-[#78350f] outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#fbf4ee] p-3 rounded-xl border border-[#e7d4c4] text-xs flex justify-between items-center">
                <span>Costo Total Imputado:</span>
                <strong className="text-[#78350f] font-mono text-sm">${(Number(formData.kg_consumidos) * Number(formData.costo_unitario_imputado)).toLocaleString('es-AR')}</strong>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f2e6de]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#e7d4c4] rounded-xl text-[#5c3a21] font-semibold hover:bg-[#fbf4ee] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#78350f] hover:bg-[#652b0c] text-white font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar e Imputar Costo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
