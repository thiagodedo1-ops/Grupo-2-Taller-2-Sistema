/**
 * @file calculations.ts
 * @description Lógica matemática, cálculos contables, indicadores técnicos y conciliaciones
 * Sección 9 del requerimiento: Fórmulas de costeo, margen bruto, ICA, desvíos y conciliaciones.
 */

import { BaseDatosPorcina } from '../types/schema';

export interface IndicadoresEconomicos {
  ingresosTotales: number;
  costoVentas: number;
  margenBruto: number;
  costosIndirectos: number;
  resultadoNeto: number;
  costoSobreIngresosPct: number | null; // null si ingresos = 0 (muestra Pendiente)
  margenSobreIngresosPct: number | null;
  margenSobreCostosPct: number | null;
  kgVendidos: number;
  precioPromedioPorKg: number | null;
  kgEquilibrio: number | null;
  costoTotalPeriodo: number;
}

export interface IndicadoresProductivos {
  kgProducidosPorFase: {
    faseId: string;
    faseNombre: string;
    kgGanancia: number;
    costoDirecto: number;
    costoPorKg: number | null;
  }[];
  kgProducidosTotal: number;
  costoMedioPorKgProducido: number | null;
  icaRealEngorde: number | null;
  icaRefEngorde: number; // 3.0 REAL
  icaRealDestete: number | null;
  icaRefDestete: number; // 1.75 SUPUESTO
  desvioIcaEngorde: number | null;
  desvioIcaEngordePct: number | null;
  supervivenciaDesteteReal: number | null;
  supervivenciaDesteteRef: number; // 85.81%
  nacidosVivosPromedio: number | null;
  destetadosPromedio: number | null;
  costoPorLechonDestetado: number | null;
  totalLechonesDestetados: number;
  partosRegistrados: number;
}

export interface ConciliacionHaciendaResultado {
  stockInicialCab: number;
  stockInicialKg: number;
  nacimientosCab: number;
  ingresosPaseCab: number;
  bajasCab: number;
  egresosPaseCab: number;
  ventasCab: number;
  ajustesCab: number;
  stockCalculadoCab: number;
  stockRealRegistradoCab: number;
  diferenciaCab: number;
  conciliado: boolean;
}

export interface ConciliacionAlimentoResultado {
  insumoId: string;
  insumoNombre: string;
  stockInicialKg: number;
  comprasKg: number;
  transferenciasRecibidasKg: number;
  consumosKg: number;
  transferenciasEnviadasKg: number;
  ajustesKg: number;
  stockCalculadoKg: number;
  stockActualKg: number;
  diferenciaKg: number;
  conciliado: boolean;
}

/**
 * Calcula los indicadores económicos consolidados y por subunidad
 */
export function calcularIndicadoresEconomicos(db: BaseDatosPorcina, campanaId?: string): IndicadoresEconomicos {
  // 1. Ingresos por ventas confirmadas (excluye anulados)
  const ventas = db.Mov_Comercial_Enc.filter(m => 
    m.tipo_operacion === 'VENTA' && 
    m.estado === 'Confirmado' &&
    m.estado_validacion !== 'Observado'
  );

  const ingresosTotales = ventas.reduce((acc, v) => acc + (Number(v.total_neto) || 0), 0);

  // Kilos vendidos
  let kgVendidos = 0;
  ventas.forEach(v => {
    const detalles = db.Mov_Comercial_Det.filter(d => d.mov_comercial_id === v.id);
    detalles.forEach(d => {
      kgVendidos += (Number(d.kg) || 0);
    });
  });

  const precioPromedioPorKg = kgVendidos > 0 ? (ingresosTotales / kgVendidos) : null;

  // 2. Costos directos devengados
  const costosDirectos = db.F_Costos
    .filter(c => c.estado === 'Confirmado' && c.estado_validacion !== 'Observado')
    .reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

  // Consumo de alimento con costo imputado confirmado
  const costosAlimento = db.Consumo_Alimento_Real
    .filter(c => c.estado === 'Confirmado' && c.estado_validacion !== 'Observado')
    .reduce((acc, c) => acc + (Number(c.costo_total_imputado) || 0), 0);

  const totalCostosDirectos = costosDirectos + costosAlimento;

  // Existencias de hacienda para Costo de Ventas
  // Costo de ventas = Existencia inicial + Costos directos devengados - Existencia final
  const existenciasConfirmadas = db.Existencias_Hacienda.filter(e => e.estado === 'Confirmado');
  const valorExistenciaFinal = existenciasConfirmadas.reduce((acc, e) => acc + (Number(e.valor_total) || 0), 0);
  
  // Si no hay cierre previo registrado, existencia inicial es 0 o calculada
  const valorExistenciaInicial = 0; 

  const costoVentas = Math.max(0, (valorExistenciaInicial + totalCostosDirectos - valorExistenciaFinal));

  // Margen bruto
  const margenBruto = ingresosTotales - costoVentas;

  // Costos indirectos y de estructura
  const costosIndirectos = db.Costos_Indirectos
    .filter(c => c.estado === 'Confirmado')
    .reduce((acc, c) => acc + (Number(c.importe_prorrateado) || Number(c.importe_total) || 0), 0);

  const resultadoNeto = margenBruto - costosIndirectos;

  const costoSobreIngresosPct = ingresosTotales > 0 ? (costoVentas / ingresosTotales) * 100 : null;
  const margenSobreIngresosPct = ingresosTotales > 0 ? (margenBruto / ingresosTotales) * 100 : null;
  const margenSobreCostosPct = costoVentas > 0 ? (margenBruto / costoVentas) * 100 : null;

  const costoTotalPeriodo = totalCostosDirectos + costosIndirectos;

  // Punto de equilibrio: kg_equilibrio = costo_total / precio_real_vigente_kg
  const kgEquilibrio = (precioPromedioPorKg && precioPromedioPorKg > 0)
    ? (costoTotalPeriodo / precioPromedioPorKg)
    : null;

  return {
    ingresosTotales,
    costoVentas,
    margenBruto,
    costosIndirectos,
    resultadoNeto,
    costoSobreIngresosPct,
    margenSobreIngresosPct,
    margenSobreCostosPct,
    kgVendidos,
    precioPromedioPorKg,
    kgEquilibrio,
    costoTotalPeriodo
  };
}

/**
 * Calcula los indicadores productivos y de conversión alimenticia (ICA)
 */
export function calcularIndicadoresProductivos(db: BaseDatosPorcina): IndicadoresProductivos {
  // 1. Partos y camadas
  const partosConfirmados = db.Partos.filter(p => p.estado === 'Confirmado');
  const partosRegistrados = partosConfirmados.length;

  let totalNacidosVivos = 0;
  let totalDestetados = 0;

  partosConfirmados.forEach(p => {
    totalNacidosVivos += (Number(p.nacidos_vivos) || 0);
    totalDestetados += (Number(p.destetados) || 0);
  });

  const nacidosVivosPromedio = partosRegistrados > 0 ? (totalNacidosVivos / partosRegistrados) : null;
  const destetadosPromedio = partosRegistrados > 0 ? (totalDestetados / partosRegistrados) : null;
  const supervivenciaDesteteReal = totalNacidosVivos > 0 ? (totalDestetados / totalNacidosVivos) * 100 : null;

  // 2. Prorrateo del Plantel Reproductor por lechón destetado
  // Costo total atribuible al plantel reproductor / lechones destetados en el período
  const costosPlantel = db.F_Costos
    .filter(c => c.subunidad_id === 'SUB_PLANTEL_REP' && c.estado === 'Confirmado')
    .reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

  const costoPorLechonDestetado = totalDestetados > 0 ? (costosPlantel / totalDestetados) : null;

  // 3. Kilos producidos por fase
  const fases = db.Fases_Proceso;
  let kgProducidosTotal = 0;
  let costoDirectoTotal = 0;

  const kgProducidosPorFase = fases.map(f => {
    // Kilos que entraron o ganaron peso en la fase
    const pasesHaciaFase = db.Movimientos_Fisicos.filter(m => 
      m.fase_destino_id === f.id && 
      m.estado === 'Confirmado' &&
      m.estado_validacion !== 'Observado'
    );
    const pasesDesdeFase = db.Movimientos_Fisicos.filter(m => 
      m.fase_origen_id === f.id && 
      m.estado === 'Confirmado' &&
      m.estado_validacion !== 'Observado'
    );

    const kgSalida = pasesDesdeFase.reduce((acc, m) => acc + (Number(m.kg_totales) || 0), 0);
    const kgEntrada = pasesHaciaFase.reduce((acc, m) => acc + (Number(m.kg_totales) || 0), 0);
    
    // Si la fase es Cría, los kg generados provienen de nacimientos
    let kgGanancia = 0;
    if (f.id === 'FASE_CRIA') {
      kgGanancia = kgSalida; // peso al destete de los lechones
    } else {
      kgGanancia = Math.max(0, kgSalida - kgEntrada);
    }

    // Costos directos de la fase (alimento + costos)
    const costosFase = db.F_Costos
      .filter(c => c.fase_id === f.id && c.estado === 'Confirmado')
      .reduce((acc, c) => acc + (Number(c.importe_neto) || 0), 0);

    const costoAlimentoFase = db.Consumo_Alimento_Real
      .filter(c => c.fase_id === f.id && c.estado === 'Confirmado')
      .reduce((acc, c) => acc + (Number(c.costo_total_imputado) || 0), 0);

    const costoDirecto = costosFase + costoAlimentoFase;
    const costoPorKg = kgGanancia > 0 ? (costoDirecto / kgGanancia) : null;

    kgProducidosTotal += kgGanancia;
    costoDirectoTotal += costoDirecto;

    return {
      faseId: f.id,
      faseNombre: f.nombre,
      kgGanancia,
      costoDirecto,
      costoPorKg
    };
  });

  const costoMedioPorKgProducido = kgProducidosTotal > 0 ? (costoDirectoTotal / kgProducidosTotal) : null;

  // 4. ICA Engorde y Destete
  // Consumo real de alimento en Engorde
  const consumoEngordeKg = db.Consumo_Alimento_Real
    .filter(c => c.fase_id === 'FASE_ENGORDE_TERM' && c.estado === 'Confirmado')
    .reduce((acc, c) => acc + (Number(c.kg_consumidos) || 0), 0);

  const gananciaEngorde = kgProducidosPorFase.find(f => f.faseId === 'FASE_ENGORDE_TERM')?.kgGanancia || 0;
  const icaRealEngorde = (gananciaEngorde > 0 && consumoEngordeKg > 0) 
    ? (consumoEngordeKg / gananciaEngorde) 
    : null;

  const icaRefEngorde = 3.0; // REAL declarado por encargado
  const desvioIcaEngorde = icaRealEngorde !== null ? (icaRealEngorde - icaRefEngorde) : null;
  const desvioIcaEngordePct = icaRealEngorde !== null ? ((icaRealEngorde - icaRefEngorde) / icaRefEngorde) * 100 : null;

  // Consumo real de alimento en Destete
  const consumoDesteteKg = db.Consumo_Alimento_Real
    .filter(c => c.fase_id === 'FASE_DESTETE_REC' && c.estado === 'Confirmado')
    .reduce((acc, c) => acc + (Number(c.kg_consumidos) || 0), 0);

  const gananciaDestete = kgProducidosPorFase.find(f => f.faseId === 'FASE_DESTETE_REC')?.kgGanancia || 0;
  const icaRealDestete = (gananciaDestete > 0 && consumoDesteteKg > 0)
    ? (consumoDesteteKg / gananciaDestete)
    : null;

  const icaRefDestete = 1.75; // SUPUESTO provisorio del grupo

  return {
    kgProducidosPorFase,
    kgProducidosTotal,
    costoMedioPorKgProducido,
    icaRealEngorde,
    icaRefEngorde,
    icaRealDestete,
    icaRefDestete,
    desvioIcaEngorde,
    desvioIcaEngordePct,
    supervivenciaDesteteReal,
    supervivenciaDesteteRef: 85.81,
    nacidosVivosPromedio,
    destetadosPromedio,
    costoPorLechonDestetado,
    totalLechonesDestetados: totalDestetados,
    partosRegistrados
  };
}

/**
 * Conciliación de Hacienda (Stock Inicial + Entradas - Salidas = Stock Final)
 */
export function conciliarHacienda(db: BaseDatosPorcina): ConciliacionHaciendaResultado {
  const stockInicialCab = 0; // Se obtiene de cierres anteriores
  const stockInicialKg = 0;

  let nacimientosCab = 0;
  let ingresosPaseCab = 0;
  let bajasCab = 0;
  let egresosPaseCab = 0;
  let ventasCab = 0;
  let ajustesCab = 0;

  const movimientos = db.Movimientos_Fisicos.filter(m => 
    m.estado === 'Confirmado' && m.estado_validacion !== 'Observado'
  );

  movimientos.forEach(m => {
    const cab = Number(m.cantidad_cabezas) || 0;
    switch (m.tipo_evento) {
      case 'NACIMIENTO':
        nacimientosCab += cab;
        break;
      case 'PASE_FASE':
        ingresosPaseCab += cab;
        egresosPaseCab += cab; // Entra a una y sale de otra dentro del establecimiento
        break;
      case 'MUERTE':
      case 'DESCARTE':
        bajasCab += cab;
        break;
      case 'VENTA':
        ventasCab += cab;
        break;
      case 'AJUSTE':
        ajustesCab += cab;
        break;
    }
  });

  const stockCalculadoCab = stockInicialCab + nacimientosCab - bajasCab - ventasCab + ajustesCab;

  // Cabezas actuales reportadas en lotes activos
  const stockRealRegistradoCab = db.Lotes_Animales
    .filter(l => l.estado === 'Activo')
    .reduce((acc, l) => acc + (Number(l.cabezas_actuales) || 0), 0);

  const diferenciaCab = stockCalculadoCab - stockRealRegistradoCab;
  const conciliado = Math.abs(diferenciaCab) === 0;

  return {
    stockInicialCab,
    stockInicialKg,
    nacimientosCab,
    ingresosPaseCab,
    bajasCab,
    egresosPaseCab,
    ventasCab,
    ajustesCab,
    stockCalculadoCab,
    stockRealRegistradoCab,
    diferenciaCab,
    conciliado
  };
}

export const conciliarBalanceHacienda = (db: BaseDatosPorcina, _campanaId?: string): ConciliacionHaciendaResultado => {
  return conciliarHacienda(db);
};

/**
 * Conciliación de Insumos / Alimento
 */
export function conciliarAlimento(db: BaseDatosPorcina, insumoId: string): ConciliacionAlimentoResultado {
  const insumo = db.D_Insumo.find(i => i.id === insumoId);
  const insumoNombre = insumo ? insumo.nombre : insumoId;

  const stockInicialKg = 0;

  // Compras de insumo
  let comprasKg = 0;
  db.Mov_Comercial_Det.forEach(d => {
    if (d.insumo_id === insumoId) {
      const enc = db.Mov_Comercial_Enc.find(e => e.id === d.mov_comercial_id);
      if (enc && enc.tipo_operacion === 'COMPRA' && enc.estado === 'Confirmado') {
        comprasKg += (Number(d.kg) || Number(d.cantidad_animales) || 0);
      }
    }
  });

  // Transferencias recibidas
  const transfsRec = db.Movimientos_Internos
    .filter(m => m.insumo_id === insumoId && m.unidad_destino_id === 'UN_PORCINA' && m.estado === 'Confirmado')
    .reduce((acc, m) => acc + (Number(m.cantidad) || 0), 0);

  // Consumo real
  const consumosKg = db.Consumo_Alimento_Real
    .filter(c => c.insumo_id === insumoId && c.estado === 'Confirmado')
    .reduce((acc, c) => acc + (Number(c.kg_consumidos) || 0), 0);

  // Transferencias enviadas
  const transfsEnv = db.Movimientos_Internos
    .filter(m => m.insumo_id === insumoId && m.unidad_origen_id === 'UN_PORCINA' && m.estado === 'Confirmado')
    .reduce((acc, m) => acc + (Number(m.cantidad) || 0), 0);

  const ajustesKg = 0;

  const stockCalculadoKg = stockInicialKg + comprasKg + transfsRec - consumosKg - transfsEnv + ajustesKg;

  // Stock registrado en Movimientos_Stock_Insumos
  const ultimoMov = [...db.Movimientos_Stock_Insumos]
    .filter(m => m.insumo_id === insumoId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

  const stockActualKg = ultimoMov && ultimoMov.stock_resultante !== undefined 
    ? Number(ultimoMov.stock_resultante) 
    : stockCalculadoKg;

  const diferenciaKg = stockCalculadoKg - stockActualKg;
  const conciliado = Math.abs(diferenciaKg) < 0.001;

  return {
    insumoId,
    insumoNombre,
    stockInicialKg,
    comprasKg,
    transferenciasRecibidasKg: transfsRec,
    consumosKg,
    transferenciasEnviadasKg: transfsEnv,
    ajustesKg,
    stockCalculadoKg,
    stockActualKg,
    diferenciaKg,
    conciliado
  };
}
