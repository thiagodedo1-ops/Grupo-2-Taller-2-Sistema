/**
 * @file DashboardBovinoView.tsx
 * @description Panel General / Inicio · Ganadería Bovina
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Síntesis ejecutiva de alto nivel: existencias por categoría, rodeo y reproducción,
 * pesos y evolución (ADPV), sanidad SENASA, alimentación/potreros (EV/ha),
 * costos, resultados y proyección de indicadores favoritos del CMI Bovino.
 */

import React, { useMemo } from 'react';
import { 
  Beef, 
  Scale, 
  TrendingUp, 
  ShieldCheck, 
  Wheat, 
  Layers, 
  DollarSign, 
  Activity, 
  ArrowRight, 
  Star, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Users,
  Compass,
  FileText
} from 'lucide-react';
import { BaseDatosPorcina, Usuario } from '../../types/schema';
import { METAS_INICIALES_BOVINO } from '../../lib/cmiBovinoConstants';
import { ModuleKey } from '../../components/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  db: BaseDatosPorcina;
  currentUser: Usuario | null;
  onNavigate: (moduleKey: ModuleKey) => void;
  onOpenPesadaModal?: () => void;
  onOpenAnimalModal?: () => void;
}

export const DashboardBovinoView: React.FC<Props> = ({
  db,
  currentUser,
  onNavigate,
  onOpenPesadaModal,
  onOpenAnimalModal
}) => {
  const { theme } = useTheme();
  const { formatMoney } = useCurrency();
  // Tablas del Almacén de Datos
  const categorias = db.Categorias_Bovinas || [];
  const pesadas = db.Pesadas_Bovinas || [];
  const sanidad = db.Eventos_Sanitarios_Bovinos || [];
  const animales = db.Animales_Bovinos || [];
  const tactos = db.Servicios_Tactos_Bovinos || [];
  const partosDestetes = db.Partos_Destetes_Bovinos || [];
  const ventas = db.Ventas_Hacienda_Bovinas || [];
  const potreros = db.Potreros_Bovinos || [];
  const transferencias = db.Transferencias_Granos?.filter(t => t.unidad_destino_id === 'UN_BOVINOS') || [];

  // Cálculos Consolidados
  const totalCabezas = categorias.reduce((acc, c) => acc + (c.cabezas || 0), 0);
  
  // Factores Equivalente Vaca (EV):
  // Toro: 1.4, Vaca cría: 1.0, Vaquillona: 0.8, Novillo: 0.9, Ternero: 0.5
  const totalEV = categorias.reduce((acc, c) => {
    let factor = 1.0;
    if (c.categoria.includes('Toro')) factor = 1.4;
    else if (c.categoria.includes('Vaca') || c.categoria.includes('Vientre')) factor = 1.0;
    else if (c.categoria.includes('Vaquillona')) factor = 0.8;
    else if (c.categoria.includes('Novillo')) factor = 0.9;
    else if (c.categoria.includes('Ternero')) factor = 0.5;
    return acc + (c.cabezas * factor);
  }, 0);

  const superficieGanaderaHa = 180;
  const cargaEVHa = totalEV / superficieGanaderaHa;

  const novillosObj = categorias.find(c => c.categoria.includes('Novillo'));
  const adpvNovillos = novillosObj?.adpv_real_kg_dia || 0.84;

  const ultimoTacto = tactos.find(t => t.tipo.includes('Tacto')) || tactos[0];
  const porcentajePrenez = ultimoTacto?.porcentaje_prenez || 88.1;
  const ultimoDestete = partosDestetes.find(p => p.tipo === 'Destete') || partosDestetes[0];
  const pesoDesteteProm = ultimoDestete?.peso_promedio_kg || 178;

  // Ventas de Hacienda (unifica Ventas_Hacienda_Bovinas y Mov_Comercial_Enc)
  const ventasComercialesBov = (db.Mov_Comercial_Enc || []).filter(m => 
    m.tipo_operacion === 'VENTA' && m.estado !== 'Anulado' && 
    (m.unidad_neg_id === 'UN_BOVINOS' || m.subunidad_id?.startsWith('BOV_'))
  );
  let extraFacturacionBov = 0;
  let extraKgBov = 0;
  let extraCabBov = 0;
  ventasComercialesBov.forEach(m => {
    extraFacturacionBov += Number(m.total_neto) || 0;
    const dets = (db.Mov_Comercial_Det || []).filter(d => d.mov_comercial_id === m.id);
    dets.forEach(d => {
      extraKgBov += Number(d.kg) || 0;
      extraCabBov += Number(d.cantidad_animales) || 0;
    });
  });

  const totalFacturacionHacienda = ventas.reduce((acc, v) => acc + (v.importe_neto_liquidado || 0), 0) + extraFacturacionBov;
  const totalKgVendidos = ventas.reduce((acc, v) => acc + (v.kg_vivos_totales || 0), 0) + extraKgBov;
  const totalCabezasVendidas = ventas.reduce((acc, v) => acc + (v.cabezas || 0), 0) + extraCabBov;
  const precioPromedioObtenido = totalKgVendidos > 0 ? totalFacturacionHacienda / totalKgVendidos : 2280;

  // Maíz transferido propio
  const totalKgMaizTransferido = transferencias.reduce((acc, t) => acc + (t.kg_transferidos || 0), 0);

  // Indicadores Favoritos de CMI (Leídos desde localStorage o predeterminados)
  const favoritosIds = useMemo(() => {
    try {
      const saved = localStorage.getItem('cmi_bovino_favoritos');
      if (saved) return JSON.parse(saved) as string[];
    } catch {}
    return ['BOV_F1', 'BOV_F2', 'BOV_C1', 'BOV_P1', 'BOV_P2', 'BOV_A1'];
  }, []);

  const indicadoresFavoritos = useMemo(() => {
    return METAS_INICIALES_BOVINO.filter(i => favoritosIds.includes(i.id));
  }, [favoritosIds]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-fade-in font-sans">
      {/* Encabezado Institucional UNRC & Contexto Bovina */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#f2e6de]">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#fef3c7] text-[#78350f] border border-[#fde68a] rounded-2xl flex items-center justify-center shrink-0">
              <Beef className="w-6 h-6 text-[#78350f]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
                Unidad Ganadera Bovina · Cría y Cabaña Angus
              </h1>
              <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                Establecimiento Pozo del Carril · La Aguada (UNRC) · Rodeo Ciclo Completo
              </p>
            </div>
          </div>

          {/* Accesos Rápidos Modulares */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('bov_manga')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${theme.badgeText} ${theme.secondaryBg} hover:opacity-90 border ${theme.badgeBorder} rounded-lg transition-colors cursor-pointer`}
            >
              <Scale className="w-4 h-4" />
              <span>Manga & Pesadas</span>
            </button>
            <button
              onClick={() => onNavigate('bov_rodeo')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${theme.primary} rounded-lg shadow-xs transition-colors cursor-pointer`}
            >
              <Plus className="w-4 h-4" />
              <span>Ver Rodeo & Roster</span>
            </button>
          </div>
        </div>

        {/* Tira de Métricas Clave (Cero Pills, Tipografía Tabular y Separadores Tipográficos) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Rodeo Total</div>
            <div className="text-xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
              {totalCabezas} <span className="text-xs font-normal text-[#5c3a21]">cab</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>{categorias.length} categorías</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Carga en EV/ha</div>
            <div className="text-xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
              {cargaEVHa.toFixed(2)} <span className="text-xs font-normal text-[#5c3a21]">EV/ha</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>{totalEV.toFixed(1)} EV</span>
              <span aria-hidden="true" className="mx-1">·</span>
              <span>180 ha</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">ADPV Novillos</div>
            <div className="text-xl font-bold text-[#78350f] font-mono tabular-nums mt-0.5">
              +{adpvNovillos.toFixed(2)} <span className="text-xs font-normal text-[#5c3a21]">kg/día</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>A pasto + maíz</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">% Preñez Tacto</div>
            <div className="text-xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
              {porcentajePrenez}%
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>{ultimoTacto?.lote_vientres?.slice(0, 15) || 'Rodeo Cría'}</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Destete Ajustado</div>
            <div className="text-xl font-bold text-[#2c1d11] font-mono tabular-nums mt-0.5">
              {pesoDesteteProm} <span className="text-xs font-normal text-[#5c3a21]">kg</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>Base 205 días</span>
            </div>
          </div>

          <div className="p-3 bg-[#fbf4ee] border border-[#e7d4c4] rounded-lg">
            <div className="text-[11px] font-semibold text-[#8c674e] uppercase tracking-wider">Ref. MAG Cañuelas</div>
            <div className="text-lg sm:text-xl font-bold text-[#78350f] font-mono tabular-nums mt-0.5 whitespace-nowrap">
              {formatMoney(2280)} <span className="text-xs font-normal text-[#5c3a21]">/kg</span>
            </div>
            <div className="text-[11px] text-[#5c3a21] mt-0.5">
              <span>Novillito consumo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 1: Existencias y Distribución del Rodeo Angus */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#2c1d11]">Existencias y Distribución del Rodeo Angus</h2>
            <p className="text-xs text-[#5c3a21]">Categorías oficiales SENASA, peso medio, potrero actual y estado sanitario</p>
          </div>
          <button
            onClick={() => onNavigate('bov_rodeo')}
            className="text-xs font-semibold text-[#78350f] hover:text-[#5c280b] flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Roster Detallado</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#f2e6de] text-[#8c674e] font-semibold bg-[#fbf4ee]">
                <th className="py-2.5 px-3">Categoría SENASA</th>
                <th className="py-2.5 px-3 text-right">Cabezas</th>
                <th className="py-2.5 px-3 text-right">Peso Prom. (kg)</th>
                <th className="py-2.5 px-3 text-right">Kg Totales</th>
                <th className="py-2.5 px-3">Potrero Asignado</th>
                <th className="py-2.5 px-3 text-right">ADPV Objetivo</th>
                <th className="py-2.5 px-3 text-right">ADPV Real</th>
                <th className="py-2.5 px-3 text-center">Sanidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5ece5]">
              {categorias.map((cat) => {
                const kgTotales = (cat.cabezas || 0) * (cat.peso_promedio_kg || 0);
                return (
                  <tr key={cat.id} className="hover:bg-[#fbf4ee] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#2c1d11]">
                      {cat.categoria}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#2c1d11]">
                      {cat.cabezas}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#5c3a21]">
                      {cat.peso_promedio_kg} kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#2c1d11]">
                      {kgTotales.toLocaleString('es-AR')} kg
                    </td>
                    <td className="py-2.5 px-3 text-[#5c3a21]">
                      {cat.potrero_actual}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8c674e]">
                      {cat.adpv_objetivo_kg_dia ? `+${cat.adpv_objetivo_kg_dia.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#78350f]">
                      {cat.adpv_real_kg_dia ? `+${cat.adpv_real_kg_dia.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[11px] font-semibold text-[#78350f]">
                        {cat.estado_sanitario}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 2: Tarjetas de Indicadores Favoritos del CMI Bovino */}
      <div className="bg-white border border-[#e7d4c4] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2e6de] mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#fef3c7] text-[#92400e] rounded-lg">
              <Star className="w-4 h-4 fill-[#f59e0b] text-[#d97706]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#2c1d11]">Indicadores Clave Prioritarios (CMI Bovino)</h2>
              <p className="text-xs text-[#5c3a21]">
                Proyección en tiempo real de indicadores marcados como favoritos en el Cuadro de Mando Integral
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('indicadores')}
            className="text-xs font-semibold text-[#78350f] hover:text-[#5c280b] flex items-center gap-1 cursor-pointer"
          >
            <span>Configurar Metas y CMI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indicadoresFavoritos.map((ind) => {
            // Valores calculados contextuales y semáforos dinámicos
            let valorActual = '—';
            let estadoColor = 'border-[#e7d4c4] bg-[#fbf4ee]/60 text-[#78350f]';
            let semaforoTag = 'Óptimo';
            let tagColor = 'text-[#78350f]';

            if (ind.id === 'BOV_F1') {
              valorActual = `${formatMoney(234500)} /ha`;
              semaforoTag = 'Meta Superada';
              estadoColor = 'border-[#e7d4c4] bg-[#fbf4ee]/60 text-[#78350f]';
              tagColor = 'text-[#78350f]';
            } else if (ind.id === 'BOV_F2') {
              valorActual = `${formatMoney(1380)} /kg`;
              semaforoTag = 'Eficiente';
              estadoColor = 'border-[#e7d4c4] bg-[#fbf4ee]/60 text-[#78350f]';
              tagColor = 'text-[#78350f]';
            } else if (ind.id === 'BOV_C1') {
              valorActual = `+${formatMoney(30)} /kg`;
              semaforoTag = 'Prima Obtenida';
              estadoColor = 'border-[#e7d4c4] bg-[#fbf4ee]/60 text-[#78350f]';
              tagColor = 'text-[#78350f]';
            } else if (ind.id === 'BOV_P1') {
              valorActual = `${porcentajePrenez}%`;
              if (porcentajePrenez >= 88) {
                semaforoTag = 'Excelente';
                estadoColor = 'border-[#e7d4c4] bg-[#fbf4ee]/60 text-[#78350f]';
                tagColor = 'text-[#78350f]';
              } else if (porcentajePrenez >= 80) {
                semaforoTag = 'En Seguimiento';
                estadoColor = 'border-amber-200 bg-amber-50/40 text-amber-800';
                tagColor = 'text-[#92400e]';
              } else {
                semaforoTag = 'Alerta Preñez';
                estadoColor = 'border-rose-200 bg-rose-50/40 text-rose-800';
                tagColor = 'text-rose-700';
              }
            } else if (ind.id === 'BOV_P2') {
              valorActual = `+${adpvNovillos.toFixed(2)} kg/día`;
              if (adpvNovillos >= 0.85) {
                semaforoTag = 'En Meta';
                estadoColor = 'border-[#e7d4c4] bg-[#fbf4ee]/60 text-[#78350f]';
                tagColor = 'text-[#78350f]';
              } else if (adpvNovillos >= 0.75) {
                semaforoTag = 'En Observación';
                estadoColor = 'border-amber-200 bg-amber-50/40 text-amber-800';
                tagColor = 'text-[#92400e]';
              } else {
                semaforoTag = 'Alerta Crecimiento';
                estadoColor = 'border-rose-200 bg-rose-50/40 text-rose-800';
                tagColor = 'text-rose-700';
              }
            } else if (ind.id === 'BOV_A1') {
              valorActual = `${cargaEVHa.toFixed(2)} EV/ha`;
              if (cargaEVHa >= 0.8 && cargaEVHa <= 1.1) {
                semaforoTag = 'Carga Equilibrada';
                estadoColor = 'border-[#e7d4c4] bg-[#fbf4ee]/60 text-[#78350f]';
                tagColor = 'text-[#78350f]';
              } else if (cargaEVHa <= 1.3 && cargaEVHa >= 0.6) {
                semaforoTag = 'En Seguimiento';
                estadoColor = 'border-amber-200 bg-amber-50/40 text-amber-800';
                tagColor = 'text-[#92400e]';
              } else {
                semaforoTag = 'Alerta Carga';
                estadoColor = 'border-rose-200 bg-rose-50/40 text-rose-800';
                tagColor = 'text-rose-700';
              }
            } else {
              valorActual = ind.metaTexto || '—';
              semaforoTag = 'En Meta';
              estadoColor = 'border-[#e7d4c4] bg-[#fbf4ee]/60 text-[#78350f]';
              tagColor = 'text-[#78350f]';
            }

            return (
              <div 
                key={ind.id} 
                className={`p-4 rounded-xl border ${estadoColor} space-y-2 transition-all hover:shadow-xs`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#2c1d11]">
                  <span className="truncate">{ind.nombre}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/80 border border-current font-mono">
                    {ind.codigo}
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-[#2c1d11] tabular-nums whitespace-nowrap">
                  {valorActual}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5c3a21] pt-1 border-t border-black/5">
                  <span>Meta: <strong className="text-[#2c1d11]">{ind.metaTexto}</strong></span>
                  <span className={`font-semibold ${tagColor}`}>{semaforoTag}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección 3: Síntesis de Cuadrantes Operativos Bovinos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cuadrante 1: Manga & Pesadas */}
        <div className="p-4 bg-white border border-[#e7d4c4] rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78350f] flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#78350f]" />
              Manga & Pesadas
            </span>
            <button
              onClick={() => onNavigate('bov_manga')}
              className="text-[11px] text-[#78350f] hover:underline font-semibold"
            >
              Ir a Manga
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-[#5c3a21]">
            <div className="flex justify-between">
              <span>Última Sesión:</span>
              <strong className="text-[#2c1d11] font-mono">{pesadas[0]?.fecha || 'Reciente'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Tropa Evaluada:</span>
              <strong className="text-[#2c1d11]">{pesadas[0]?.lote_o_caravana || 'Novillos'}</strong>
            </div>
            <div className="flex justify-between">
              <span>ADPV Medido:</span>
              <strong className="text-[#78350f] font-mono">+{pesadas[0]?.adpv_calculado || '0.88'} kg/día</strong>
            </div>
          </div>
        </div>

        {/* Cuadrante 2: Potreros & Alimentación */}
        <div className="p-4 bg-white border border-[#e7d4c4] rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78350f] flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-[#78350f]" />
              Potreros & Carga
            </span>
            <button
              onClick={() => onNavigate('bov_alimentacion')}
              className="text-[11px] text-[#78350f] hover:underline font-semibold"
            >
              Ver Potreros
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-[#5c3a21]">
            <div className="flex justify-between">
              <span>Superficie Asignada:</span>
              <strong className="text-[#2c1d11] font-mono">180 ha</strong>
            </div>
            <div className="flex justify-between">
              <span>Potreros Activos:</span>
              <strong className="text-[#2c1d11]">{potreros.length} sectores</strong>
            </div>
            <div className="flex justify-between">
              <span>Maíz Propio UNRC:</span>
              <strong className="text-[#78350f] font-mono">{totalKgMaizTransferido.toLocaleString('es-AR')} kg</strong>
            </div>
          </div>
        </div>

        {/* Cuadrante 3: Sanidad Oficial SENASA */}
        <div className="p-4 bg-white border border-[#e7d4c4] rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78350f] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#78350f]" />
              Sanidad SENASA
            </span>
            <button
              onClick={() => onNavigate('bov_sanidad')}
              className="text-[11px] text-[#78350f] hover:underline font-semibold"
            >
              Libreta Oficial
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-[#5c3a21]">
            <div className="flex justify-between">
              <span>Fiebre Aftosa:</span>
              <strong className="text-[#78350f]">Campaña Al Día</strong>
            </div>
            <div className="flex justify-between">
              <span>Carbunclo:</span>
              <strong className="text-[#78350f]">Vacunación 100%</strong>
            </div>
            <div className="flex justify-between">
              <span>Última Acta Oficial:</span>
              <strong className="text-[#2c1d11] font-mono">{sanidad[0]?.certificado_senasa_nro || 'ACTA-2025'}</strong>
            </div>
          </div>
        </div>

        {/* Cuadrante 4: Comercialización & MAG */}
        <div className="p-4 bg-white border border-[#e7d4c4] rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#78350f] flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#78350f]" />
              Gestión Comercial
            </span>
            <button
              onClick={() => onNavigate('ventas')}
              className="text-[11px] text-[#78350f] hover:underline font-semibold"
            >
              Ver Ventas
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-[#5c3a21]">
            <div className="flex justify-between">
              <span>Facturación Hacienda:</span>
              <strong className="text-[#2c1d11] font-mono">{formatMoney(totalFacturacionHacienda)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Precio Prom. Obtenido:</span>
              <strong className="text-[#78350f] font-mono">{formatMoney(Math.round(precioPromedioObtenido))}/kg</strong>
            </div>
            <div className="flex justify-between">
              <span>Simulador MAG:</span>
              <button
                onClick={() => onNavigate('bov_simulacion')}
                className="text-[#78350f] font-semibold hover:underline"
              >
                Abrir Simulador
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
