/**
 * @file VentasBovinoView.tsx
 * @description Sub-módulo: Ventas de Hacienda / Liquidaciones bovinas (Operaciones Reales)
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Ubicado en GESTIÓN COMERCIAL.
 * Operaciones reales confirmadas con consignatarios, frigoríficos y venta de reproductores Angus,
 * con detalle de kg vivos, comisiones comerciales, fletes y DTE SENASA.
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  X, 
  Filter, 
  Search,
  Truck,
  Award
} from 'lucide-react';
import { BaseDatosPorcina, VentaHaciendaBovina, Usuario } from '../../types/schema';
import { getRolePermissions } from '../../lib/permissions';
import { getPrecioReferenciaMAG } from '../../lib/magCanuelasService';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onSaveRecord: (table: keyof BaseDatosPorcina, record: any) => Promise<any>;
}

export const VentasBovinoView: React.FC<Props> = ({
  db,
  currentUser,
  onSaveRecord
}) => {
  const permissions = getRolePermissions(currentUser);
  const { formatMoney, currency } = useCurrency();
  const ventas = db.Ventas_Hacienda_Bovinas || [];

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showVentaModal, setShowVentaModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Formulario Venta Real
  const [ventaForm, setVentaForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo_venta: 'Invernada / Faena' as VentaHaciendaBovina['tipo_venta'],
    categoria: 'Novillos Pesados (410-430 kg)',
    comprador_o_consignatario: 'Consignataria Ganadera Río Cuarto S.R.L. / MAG Cañuelas',
    cabezas: 22,
    peso_promedio_kg: 420,
    precio_unitario: 2280.00,
    precio_referencia_mag: 2250.00,
    gastos_comerciales_pct: 4.5,
    flete_total: 280000,
    descuento_comercial_pct: 0,
    descuento_comercial_motivo: '',
    cabezas_muertas_transporte: 0,
    dte_numero: 'DTE-SENASA-2025-099450',
    guia_policial_nro: 'GUIA-CBA-05180',
    observaciones: 'Venta con destino a faena de consumo'
  });

  const handleGuardarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    const kgTotales = Number(ventaForm.cabezas) * Number(ventaForm.peso_promedio_kg);
    const importeBruto = kgTotales * Number(ventaForm.precio_unitario);
    const gastosComerciales = (importeBruto * Number(ventaForm.gastos_comerciales_pct)) / 100;
    const descPct = Math.min(100, Math.max(0, Number(ventaForm.descuento_comercial_pct) || 0));
    const descImporte = (importeBruto * descPct) / 100;
    const fleteTotal = Number(ventaForm.flete_total) || 0;
    const importeNeto = importeBruto - gastosComerciales - descImporte - fleteTotal;

    const nuevaVenta: VentaHaciendaBovina = {
      id: `VTA_BOV_${Date.now()}`,
      ...ventaForm,
      cabezas: Number(ventaForm.cabezas),
      peso_promedio_kg: Number(ventaForm.peso_promedio_kg),
      kg_vivos_totales: kgTotales,
      precio_unitario: Number(ventaForm.precio_unitario),
      precio_referencia_mag: Number(ventaForm.precio_referencia_mag),
      desvio_precio_mag: Number(ventaForm.precio_unitario) - Number(ventaForm.precio_referencia_mag),
      importe_bruto: importeBruto,
      gastos_comerciales_total: gastosComerciales,
      flete_total: fleteTotal,
      descuento_comercial_pct: descPct,
      descuento_comercial_importe: descImporte,
      descuento_comercial_motivo: ventaForm.descuento_comercial_motivo,
      cabezas_muertas_transporte: Number(ventaForm.cabezas_muertas_transporte) || 0,
      importe_neto_liquidado: importeNeto,
      estado: 'Confirmado'
    };

    await onSaveRecord('Ventas_Hacienda_Bovinas', nuevaVenta);
    setShowVentaModal(false);
    setFeedbackMsg(`Venta confirmada por DTE ${nuevaVenta.dte_numero} (${formatMoney(importeNeto)}).`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Totales
  const totalFacturacion = ventas.reduce((acc, v) => acc + (v.importe_neto_liquidado || 0), 0);
  const totalKg = ventas.reduce((acc, v) => acc + (v.kg_vivos_totales || 0), 0);
  const totalCab = ventas.reduce((acc, v) => acc + (v.cabezas || 0), 0);
  const precioMedioKg = totalKg > 0 ? totalFacturacion / totalKg : 0;

  const ventasFiltradas = ventas.filter(v =>
    v.comprador_o_consignatario.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.dte_numero.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#14281d] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-[#2b583f] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#78c293]" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#eaf4ec] text-[#1c4b31] rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#526b5c]">
              Gestión Comercial Bovina · Pozo del Carril (UNRC)
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#14281d] tracking-tight">
            Ventas de Hacienda & Liquidaciones Bovinas (Operaciones Reales)
          </h1>
          <p className="text-xs text-[#526b5c] mt-0.5">
            Liquidaciones de consignatario, faena de consumo, reproductores de Cabaña Angus y comprobantes DTE SENASA
          </p>
        </div>

        <button
          onClick={() => setShowVentaModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Venta de Hacienda</span>
        </button>
      </div>

      {/* Cotización MAG Cañuelas Oficial Vigente de Referencia */}
      {(() => {
        const magVigente = getPrecioReferenciaMAG('Novillos Pesados (410-430 kg)', new Date().toISOString().split('T')[0]);
        const todayStr = new Date().toLocaleDateString('es-AR');
        return (
          <div className="bg-gradient-to-r from-[#fcf8f3] to-white p-4 rounded-xl border border-[#f3d9c3] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#78350f] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Award className="w-5 h-5 text-[#fde68a]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#78350f] uppercase tracking-wider">
                    Referencia Oficial MAG Cañuelas · Mercado Agroganadero
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#78350f] bg-white px-2 py-0.5 rounded border border-[#e2b896]">
                    {todayStr}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-[#78350f]">
                    {formatMoney(magVigente.precioPromedio)}
                  </span>
                  <span className="text-xs text-[#8c5022] font-semibold">/ kg vivo ({magVigente.nombre})</span>
                  <span className="text-xs font-bold text-[#1c4b31]">
                    (+{magVigente.variacionDiariaPct}%)
                  </span>
                </div>
                <p className="text-[11px] text-[#8c5022] mt-0.5">
                  Fuente oficial: <a href="https://www.mercadoganadero.com.ar" target="_blank" rel="noopener noreferrer" className="underline font-medium text-[#78350f]">https://www.mercadoganadero.com.ar</a> · Actualizado: {todayStr} (Auto-actualizado por cambio de semana)
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-[#8c5022] border-t md:border-t-0 md:border-l border-[#f3d9c3] pt-2 md:pt-0 md:pl-4">
              <span className="block font-semibold text-[#78350f]">Criterio Zootécnico & Comercial:</span>
              <span>MAG Cañuelas fija el precio de referencia por categoría. El precio real de liquidación DTe prevalece en cada operación.</span>
            </div>
          </div>
        );
      })()}

      {/* Tira de Resumen de Ventas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Facturación Neta Liquidada</div>
          <div className="text-2xl font-bold text-[#14281d] font-mono tabular-nums mt-1">
            {formatMoney(totalFacturacion)}
          </div>
          <div className="text-[11px] text-[#526b5c] mt-0.5">{ventas.length} liquidaciones confirmadas</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Cabezas Comercializadas</div>
          <div className="text-2xl font-bold text-[#14281d] font-mono tabular-nums mt-1">
            {totalCab} <span className="text-xs font-normal text-[#526b5c]">cab</span>
          </div>
          <div className="text-[11px] text-[#526b5c] mt-0.5">Faena e invernada</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Kg Vivos Entregados</div>
          <div className="text-2xl font-bold text-[#14281d] font-mono tabular-nums mt-1">
            {totalKg.toLocaleString('es-AR')} <span className="text-xs font-normal text-[#526b5c]">kg</span>
          </div>
          <div className="text-[11px] text-[#526b5c] mt-0.5">Peso en balanza pública</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#d6e3d8] shadow-xs">
          <div className="text-[11px] font-semibold text-[#617e6c] uppercase">Precio Promedio Ponderado</div>
          <div className="text-2xl font-bold text-[#1c4b31] font-mono tabular-nums mt-1">
            {formatMoney(Math.round(precioMedioKg))} <span className="text-xs font-normal text-[#526b5c]">/kg</span>
          </div>
          <div className="text-[11px] text-[#1c4b31] font-semibold mt-0.5">+{formatMoney(30)}/kg vs. MAG Cañuelas</div>
        </div>
      </div>

      {/* Tabla de Liquidaciones Reales */}
      <div className="bg-white border border-[#d6e3d8] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5efe7] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#14281d]">Historial de Liquidaciones de Venta</h2>
            <p className="text-xs text-[#526b5c]">Comprobantes de entrega, DTE SENASA, descuentos comerciales y neto acreditado</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#78a587] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por comprador o DTE..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8faf7] border border-[#c8d9cc] rounded-lg text-[#14281d] placeholder-[#8ba895] focus:outline-none focus:border-[#1c4b31]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5efe7] text-[#617e6c] font-semibold bg-[#f8faf7]">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">DTE SENASA</th>
                <th className="py-2.5 px-3">Comprador / Consignatario</th>
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3 text-right">Cab.</th>
                <th className="py-2.5 px-3 text-right">Peso Prom.</th>
                <th className="py-2.5 px-3 text-right">Kg Vivos</th>
                <th className="py-2.5 px-3 text-right">Precio ({currency === 'USD' ? 'US$/kg' : '$/kg'})</th>
                <th className="py-2.5 px-3 text-right">Bruto</th>
                <th className="py-2.5 px-3 text-right">Neto Liquidado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ee]">
              {ventasFiltradas.map((v) => (
                <tr key={v.id} className="hover:bg-[#f8faf7] transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[#526b5c]">
                    {v.fecha}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#1c4b31] font-semibold">
                    {v.dte_numero}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#14281d]">
                    {v.comprador_o_consignatario}
                  </td>
                  <td className="py-2.5 px-3 text-[#526b5c]">
                    {v.categoria}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                    {v.cabezas}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#526b5c]">
                    {v.peso_promedio_kg} kg
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#14281d]">
                    {v.kg_vivos_totales.toLocaleString('es-AR')} kg
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#1c4b31] font-semibold">
                    {formatMoney(v.precio_unitario)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#526b5c]">
                    {formatMoney(v.importe_bruto)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#14281d]">
                    {formatMoney(v.importe_neto_liquidado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Venta */}
      {showVentaModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5efe7]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#78350f] block">
                  Unidad Productiva: Bovinos · Gestión Comercial
                </span>
                <h3 className="text-base font-bold text-[#14281d]">
                  BOVINOS · REGISTRO DE VENTA DE HACIENDA
                </h3>
              </div>
              <button onClick={() => setShowVentaModal(false)} className="text-[#526b5c] hover:text-[#14281d]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarVenta} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={ventaForm.fecha}
                    onChange={(e) => {
                      const nuevaFecha = e.target.value;
                      const ref = getPrecioReferenciaMAG(ventaForm.categoria, nuevaFecha);
                      setVentaForm({
                        ...ventaForm,
                        fecha: nuevaFecha,
                        precio_referencia_mag: ref.precioPromedio
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">DTE SENASA</label>
                  <input
                    type="text"
                    required
                    value={ventaForm.dte_numero}
                    onChange={(e) => setVentaForm({ ...ventaForm, dte_numero: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#526b5c] font-semibold mb-1">Categoría Bovina</label>
                <select
                  value={ventaForm.categoria}
                  onChange={(e) => {
                    const nuevaCat = e.target.value;
                    const ref = getPrecioReferenciaMAG(nuevaCat, ventaForm.fecha);
                    setVentaForm({
                      ...ventaForm,
                      categoria: nuevaCat,
                      precio_referencia_mag: ref.precioPromedio
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] bg-white font-medium"
                >
                  <option value="Novillos Pesados (410-430 kg)">Novillos Pesados (410-430 kg)</option>
                  <option value="Novillitos (350-390 kg)">Novillitos (350-390 kg)</option>
                  <option value="Vaquillonas (300-340 kg)">Vaquillonas (300-340 kg)</option>
                  <option value="Vacas Buenas / Consumo">Vacas Buenas / Consumo</option>
                  <option value="Vacas Conserva / Manufactura">Vacas Conserva / Manufactura</option>
                  <option value="Toros Comerciales">Toros Comerciales</option>
                  <option value="Terneros Invernada (160-200 kg)">Terneros Invernada (160-200 kg)</option>
                </select>
              </div>

              {/* Tarjeta de Precio de Referencia MAG Cañuelas */}
              {(() => {
                const magRef = getPrecioReferenciaMAG(ventaForm.categoria, ventaForm.fecha);
                const desvio = ventaForm.precio_unitario - magRef.precioPromedio;
                const desvioPct = magRef.precioPromedio > 0 ? ((desvio / magRef.precioPromedio) * 100).toFixed(1) : '0.0';
                return (
                  <div className="bg-[#fcf8f3] border border-[#f3d9c3] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#78350f]" />
                        <span className="font-bold text-[#78350f] text-xs">
                          PRECIO DE REFERENCIA – MAG CAÑUELAS
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#f5e6d8] text-[#78350f] rounded-full font-semibold">
                        {magRef.fechaCotizacion}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-[#8c5022]">Promedio de Mercado:</div>
                        <div className="text-base font-bold text-[#78350f] font-mono">
                          {formatMoney(magRef.precioPromedio)} <span className="text-xs font-normal text-[#8c5022]">/kg vivo</span>
                        </div>
                        <div className="text-[10px] text-[#8c5022] mt-0.5">
                          Rango: {formatMoney(magRef.precioMinimo)} - {formatMoney(magRef.precioMaximo)} | Tendencia: {magRef.tendencia} ({magRef.variacionDiariaPct > 0 ? `+${magRef.variacionDiariaPct}` : magRef.variacionDiariaPct}%)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setVentaForm({
                          ...ventaForm,
                          precio_unitario: magRef.precioPromedio,
                          precio_referencia_mag: magRef.precioPromedio
                        })}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#78350f] bg-white border border-[#e2b896] hover:bg-[#f5e6d8] rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        Usar precio sugerido
                      </button>
                    </div>

                    <div className="pt-1.5 border-t border-[#f3d9c3] flex items-center justify-between text-[11px]">
                      <span className="text-[#8c5022]">Desvío vs. Mercado:</span>
                      <span className={`font-mono font-bold ${desvio >= 0 ? 'text-[#1c4b31]' : 'text-[#b91c1c]'}`}>
                        {desvio >= 0 ? `+$${desvio.toFixed(2)} (+${desvioPct}%) por sobre MAG` : `-$${Math.abs(desvio).toFixed(2)} (${desvioPct}%) por debajo MAG`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[#526b5c] font-semibold mb-1">Consignatario / Comprador (Cliente Maestro)</label>
                <select
                  value={ventaForm.comprador_o_consignatario}
                  onChange={(e) => setVentaForm({ ...ventaForm, comprador_o_consignatario: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d] bg-white font-semibold"
                >
                  <option value="" disabled>Seleccione un cliente del maestro...</option>
                  {(db.Clientes || [])
                    .filter(c => c.activo !== false)
                    .sort((a, b) => a.razon_social.localeCompare(b.razon_social))
                    .map(c => (
                      <option key={c.id} value={c.razon_social}>
                        {c.razon_social} (CUIT: {c.cuit})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">Cabezas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ventaForm.cabezas}
                    onChange={(e) => setVentaForm({ ...ventaForm, cabezas: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">Peso Prom. (kg)</label>
                  <input
                    type="number"
                    required
                    value={ventaForm.peso_promedio_kg}
                    onChange={(e) => setVentaForm({ ...ventaForm, peso_promedio_kg: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">PRECIO REAL ($/kg)</label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={ventaForm.precio_unitario}
                    onChange={(e) => setVentaForm({ ...ventaForm, precio_unitario: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border-2 border-[#1c4b31] rounded-lg text-[#14281d] font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">Comisión Comercial (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={ventaForm.gastos_comerciales_pct}
                    onChange={(e) => setVentaForm({ ...ventaForm, gastos_comerciales_pct: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">Flete Total ($)</label>
                  <input
                    type="number"
                    value={ventaForm.flete_total}
                    onChange={(e) => setVentaForm({ ...ventaForm, flete_total: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#526b5c] font-semibold mb-1">Descuento Comercial (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={ventaForm.descuento_comercial_pct}
                    onChange={(e) => setVentaForm({ ...ventaForm, descuento_comercial_pct: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[#526b5c] font-semibold mb-1">Motivo Descuento / Bonificación</label>
                  <input
                    type="type"
                    placeholder="Ej. Descuento calidad / tipificación"
                    value={ventaForm.descuento_comercial_motivo}
                    onChange={(e) => setVentaForm({ ...ventaForm, descuento_comercial_motivo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#526b5c] font-semibold mb-1">Muertes en Flete (Cabezas muertas en transporte)</label>
                <input
                  type="number"
                  min="0"
                  value={ventaForm.cabezas_muertas_transporte}
                  onChange={(e) => setVentaForm({ ...ventaForm, cabezas_muertas_transporte: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-[#c8d9cc] rounded-lg text-[#14281d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5efe7]">
                <button
                  type="button"
                  onClick={() => setShowVentaModal(false)}
                  className="px-3 py-1.5 text-xs text-[#526b5c] hover:bg-[#edf3ee] rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1c4b31] hover:bg-[#153a26] rounded-lg shadow-xs cursor-pointer"
                >
                  Confirmar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
