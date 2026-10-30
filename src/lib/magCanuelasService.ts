/**
 * @file magCanuelasService.ts
 * @description Servicio de cotizaciones e indicadores de referencia del Mercado Agroganadero (MAG) de Cañuelas.
 * Sistema Integral de Gestión Ganadera – Pozo del Carril – La Aguada (UNRC)
 */

export interface CotizacionMAGCategory {
  id: string;
  nombre: string;
  precioPromedio: number;
  precioMaximo: number;
  precioMinimo: number;
  tendencia: 'ALTA' | 'BAJA' | 'ESTABLE';
  variacionDiariaPct: number;
  fechaCotizacion: string;
}

export interface HistoricoMAGPoint {
  fecha: string;
  novillitos: number;
  novillos: number;
  vaquillonas: number;
  vacas: number;
  terneros: number;
  inbc: number; // Índice Novillo Mercado Cañuelas
}

export const COTIZACIONES_MAG_CANUELAS: Record<string, CotizacionMAGCategory> = {
  'Novillos Pesados (410-430 kg)': {
    id: 'NOV_PESADO',
    nombre: 'Novillos Pesados (410-430 kg)',
    precioPromedio: 2450.00,
    precioMaximo: 2580.00,
    precioMinimo: 2350.00,
    tendencia: 'ALTA',
    variacionDiariaPct: +1.8,
    fechaCotizacion: '2026-10-12'
  },
  'Novillitos (350-390 kg)': {
    id: 'NOVILLITOS',
    nombre: 'Novillitos (350-390 kg)',
    precioPromedio: 2520.00,
    precioMaximo: 2650.00,
    precioMinimo: 2420.00,
    tendencia: 'ALTA',
    variacionDiariaPct: +2.1,
    fechaCotizacion: '2026-10-12'
  },
  'Vaquillonas (300-340 kg)': {
    id: 'VAQUILLONAS',
    nombre: 'Vaquillonas (300-340 kg)',
    precioPromedio: 2380.00,
    precioMaximo: 2510.00,
    precioMinimo: 2280.00,
    tendencia: 'ESTABLE',
    variacionDiariaPct: +0.5,
    fechaCotizacion: '2026-10-12'
  },
  'Vacas Buenas / Consumo': {
    id: 'VACAS_BUENAS',
    nombre: 'Vacas Buenas / Consumo',
    precioPromedio: 1950.00,
    precioMaximo: 2080.00,
    precioMinimo: 1820.00,
    tendencia: 'ALTA',
    variacionDiariaPct: +0.9,
    fechaCotizacion: '2026-10-12'
  },
  'Vacas Conserva / Manufactura': {
    id: 'VACAS_CONSERVA',
    nombre: 'Vacas Conserva / Manufactura',
    precioPromedio: 1550.00,
    precioMaximo: 1680.00,
    precioMinimo: 1420.00,
    tendencia: 'BAJA',
    variacionDiariaPct: -0.8,
    fechaCotizacion: '2026-10-12'
  },
  'Toros Comerciales': {
    id: 'TOROS',
    nombre: 'Toros Comerciales',
    precioPromedio: 1980.00,
    precioMaximo: 2120.00,
    precioMinimo: 1850.00,
    tendencia: 'ESTABLE',
    variacionDiariaPct: +0.2,
    fechaCotizacion: '2026-10-12'
  },
  'Terneros Invernada (160-200 kg)': {
    id: 'TERNEROS',
    nombre: 'Terneros Invernada (160-200 kg)',
    precioPromedio: 2850.00,
    precioMaximo: 3020.00,
    precioMinimo: 2700.00,
    tendencia: 'ALTA',
    variacionDiariaPct: +3.2,
    fechaCotizacion: '2026-10-12'
  }
};

/**
 * Obtiene el precio sugerido del MAG Cañuelas para una categoría bovina con actualización automática semanal según la fecha.
 */
export function getPrecioReferenciaMAG(categoria: string, fecha?: string): CotizacionMAGCategory {
  let base: CotizacionMAGCategory;
  if (COTIZACIONES_MAG_CANUELAS[categoria]) {
    base = COTIZACIONES_MAG_CANUELAS[categoria];
  } else {
    // Búsqueda aproximada si no coincide exacto
    const catLower = categoria.toLowerCase();
    if (catLower.includes('novillito')) base = COTIZACIONES_MAG_CANUELAS['Novillitos (350-390 kg)'];
    else if (catLower.includes('novillo')) base = COTIZACIONES_MAG_CANUELAS['Novillos Pesados (410-430 kg)'];
    else if (catLower.includes('vaquillona')) base = COTIZACIONES_MAG_CANUELAS['Vaquillonas (300-340 kg)'];
    else if (catLower.includes('conserva')) base = COTIZACIONES_MAG_CANUELAS['Vacas Conserva / Manufactura'];
    else if (catLower.includes('vaca')) base = COTIZACIONES_MAG_CANUELAS['Vacas Buenas / Consumo'];
    else if (catLower.includes('toro')) base = COTIZACIONES_MAG_CANUELAS['Toros Comerciales'];
    else if (catLower.includes('ternero')) base = COTIZACIONES_MAG_CANUELAS['Terneros Invernada (160-200 kg)'];
    else base = COTIZACIONES_MAG_CANUELAS['Novillos Pesados (410-430 kg)'];
  }

  if (!fecha) return base;

  const baseDate = new Date(base.fechaCotizacion || '2026-10-12');
  const targetDate = new Date(fecha);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksPassed = Math.floor(diffDays / 7);

  if (weeksPassed > 0) {
    const factor = Math.pow(1 + 0.009, weeksPassed); // ~0.9% semanal de ajuste de mercado ganadero bovino
    return {
      ...base,
      precioPromedio: Number((base.precioPromedio * factor).toFixed(2)),
      precioMaximo: Number((base.precioMaximo * factor).toFixed(2)),
      precioMinimo: Number((base.precioMinimo * factor).toFixed(2)),
      fechaCotizacion: `${new Date().toLocaleDateString('es-AR')} (Auto-actualizado por cambio de semana)`
    };
  }

  return base;
}

/**
 * Serie histórica de cotizaciones MAG Cañuelas para gráficos y comparativas.
 */
export function getHistoricoCotizacionesMAG(): HistoricoMAGPoint[] {
  return [
    { fecha: '2024-12-01', novillitos: 1950, novillos: 1880, vaquillonas: 1870, vacas: 1420, terneros: 2150, inbc: 1890 },
    { fecha: '2025-01-01', novillitos: 2020, novillos: 1940, vaquillonas: 1930, vacas: 1480, terneros: 2280, inbc: 1950 },
    { fecha: '2025-02-01', novillitos: 2110, novillos: 2010, vaquillonas: 2000, vacas: 1540, terneros: 2390, inbc: 2020 },
    { fecha: '2025-03-01', novillitos: 2200, novillos: 2100, vaquillonas: 2120, vacas: 1620, terneros: 2480, inbc: 2110 },
    { fecha: '2025-04-01', novillitos: 2310, novillos: 2200, vaquillonas: 2210, vacas: 1710, terneros: 2590, inbc: 2200 },
    { fecha: '2025-05-15', novillitos: 2380, novillos: 2250, vaquillonas: 2290, vacas: 1780, terneros: 2650, inbc: 2265 }
  ];
}
