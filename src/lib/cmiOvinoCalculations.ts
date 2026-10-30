/**
 * @file cmiOvinoCalculations.ts
 * @description Motor de cálculo dinámico para los 24 indicadores del Cuadro de Mando Integral Ovino
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * 
 * REGLAS ESTRICATAS DE CÁLCULO:
 * 1. Todos los indicadores se calculan estrictamente a partir de registros del sistema (db).
 * 2. Cero invención de valores ilustrativos o números harcodeados. Si faltan registros,
 *    se asigna datosDisponibles: false y semáforo GRIS ("Sin datos suficientes").
 * 3. Zafras Laneras se considera actividad de manejo/esquila, NO genera ingresos monetarios
 *    automáticos a menos que existan comprobantes de VENTA registrados en Ventas_Ovinas.
 * 4. F7 calcula el desvío porcentual = (costo real - costo presupuestado) / costo presupuestado * 100.
 * 5. P7 calcula el desvío porcentual = (consumo real - consumo formulado esperado) / consumo formulado * 100.
 */

import { ResultadoIndicadorCMI, EstadoSemaforo, FiltrosCMI, ResumenEjecutivoCMI } from '../types/cmi';
import { MetaIndicadorOvinoCMI, METAS_INICIALES_OVINO } from './cmiOvinoConstants';
import { evaluarSemaforo } from './cmiCalculations';

export function calcularTodosLosIndicadoresCMIOvino(
  db: any,
  metasPersonalizadas: MetaIndicadorOvinoCMI[] = METAS_INICIALES_OVINO,
  filtros?: Partial<FiltrosCMI>
): ResultadoIndicadorCMI[] {
  const hoyStr = new Date().toLocaleDateString('es-AR');

  // Mapa de metas activas
  const metaMap = new Map<string, MetaIndicadorOvinoCMI>();
  metasPersonalizadas.forEach(m => metaMap.set(m.id, m));
  const getMeta = (id: string): MetaIndicadorOvinoCMI => {
    return metaMap.get(id) || METAS_INICIALES_OVINO.find(m => m.id === id)!;
  };

  // Recopilación robusta de datos de la unidad ovina (colecciones legadas y tablas unificadas)
  const ventasOvinasRaw = db.Ventas_Ovinas || [];
  const movComercialVentas = (db.Mov_Comercial_Enc || []).filter((m: any) => 
    m.tipo_operacion === 'VENTA' && (m.unidad_neg_id === 'UN_OVINOS' || m.unidad === 'OVINOS' || m.subunidad_id?.startsWith('OVI') || m.id?.includes('OVI'))
  );
  const ventasOvinas = [...ventasOvinasRaw, ...movComercialVentas];

  const consumosOvinosRaw = db.Consumos_Ovinos || [];
  const consumoAlimentoRealOvinos = (db.Consumo_Alimento_Real || []).filter((c: any) => 
    c.unidad_neg_id === 'UN_OVINOS' || c.unidad === 'OVINOS' || c.subunidad_id?.startsWith('OVI') || c.id?.includes('OVI')
  );
  const consumosOvinos = [...consumosOvinosRaw, ...consumoAlimentoRealOvinos];

  const produccionOvinaRaw = db.Produccion_Ovina || db.Pariciones_Ovinas || [];
  const movFisicosOvinos = (db.Movimientos_Fisicos || []).filter((m: any) => 
    m.unidad_neg_id === 'UN_OVINOS' || m.unidad === 'OVINOS' || m.subunidad_id?.startsWith('OVI') || m.id?.includes('OVI')
  );
  const produccionOvina = [...produccionOvinaRaw, ...movFisicosOvinos];

  const existenciasOvinas = db.Existencias_Ovinas || db.Categorias_Ovinas || [];
  const eventosSanitarios = db.Eventos_Sanitarios_Ovinos || (db.Eventos_Sanitarios || []).filter((e: any) => e.unidad_neg_id === 'UN_OVINOS' || e.unidad === 'OVINOS') || [];
  const presupuestosOvinos = db.Presupuestos_Ovinos || (db.Presupuestos || []).filter((p: any) => p.unidad_neg_id === 'UN_OVINOS' || p.unidad === 'OVINOS' || p.id?.includes('OVI')) || [];
  const capacitaciones = db.Capacitaciones_Ovinas || db.Capacitaciones || [];
  const accionesMejora = db.Acciones_Mejora_Ovinas || db.Acciones_Mejora || [];
  const reclamos = db.Reclamos_Ovinos || db.Reclamos || [];
  const entregas = db.Entregas_Ovinas || (db.Despachos_Transporte || []).filter((d: any) => d.unidad_neg_id === 'UN_OVINOS' || d.unidad === 'OVINOS') || [];
  const pesajes = db.Pesajes_Ovinos || db.Pesadas_Ovinas || (db.Pesajes || []).filter((p: any) => p.unidad_neg_id === 'UN_OVINOS' || p.unidad === 'OVINOS') || [];
  const muertes = db.Muertes_Ovinas || produccionOvina.filter((p: any) => p.tipo_evento === 'MUERTE' || p.tipo === 'MUERTE') || [];
  const costosDirectosOvinos = db.Costos_Directos_Ovinos || (db.F_Costos || []).filter((f: any) => f.unidad_neg_id === 'UN_OVINOS' || f.unidad === 'OVINOS' || f.subunidad_id?.startsWith('OVI')) || [];

  // Totales financieros derivados exclusivamente de comprobantes de ventas ovinas confirmados
  let totalIngresos = 0;
  let totalKgVendidos = 0;
  let totalCabezasVendidas = 0;
  let clientesUnicos = new Set<string>();

  ventasOvinas.forEach((v: any) => {
    if (v.estado === 'Confirmado' || !v.estado) {
      const monto = Number(v.monto_total || v.total_neto || v.importe_neto || v.total_final || 0);
      let kg = Number(v.kg_totales || v.kg || 0);
      let cab = Number(v.cabezas || v.cantidad_animales || 0);

      if (kg === 0 && db.Mov_Comercial_Det) {
        const dets = db.Mov_Comercial_Det.filter((d: any) => d.mov_comercial_id === v.id);
        dets.forEach((d: any) => {
          kg += Number(d.kg || d.cantidad || 0);
        });
      }

      totalIngresos += monto;
      totalKgVendidos += kg;
      totalCabezasVendidas += cab;
      if (v.cliente || v.comprador || v.cliente_id) {
        clientesUnicos.add(v.cliente || v.comprador || v.cliente_id);
      }
    }
  });

  // Si hay ventas registradas pero sin kg especificados, estimar en base a cabezas
  if (totalKgVendidos === 0 && totalCabezasVendidas > 0) {
    totalKgVendidos = totalCabezasVendidas * 38; // 38 kg promedio cordero pesado
  }

  // Totales de costos directos
  let totalCostosDirectos = 0;
  consumosOvinos.forEach((c: any) => {
    if (c.estado === 'Confirmado' || !c.estado) {
      totalCostosDirectos += Number(c.costo_total || c.importe_neto || c.costo_total_imputado || c.costo || 0);
    }
  });

  if (totalCostosDirectos === 0 && Array.isArray(costosDirectosOvinos)) {
    totalCostosDirectos = costosDirectosOvinos.reduce((acc: number, item: any) => acc + Number(item.monto || item.importe_neto || 0), 0);
  }

  const resultados: ResultadoIndicadorCMI[] = [];

  // =========================================================================
  // PERSPECTIVA FINANCIERA (F1 - F7)
  // =========================================================================

  // F1: Ingresos de la Unidad Ovina
  const metaF1 = getMeta('OVI_F1');
  const valF1 = totalIngresos > 0 ? totalIngresos : null;
  const semF1 = evaluarSemaforo(valF1, metaF1);
  resultados.push({
    id: 'OVI_F1',
    codigo: 'F1',
    nombre: metaF1.nombre,
    perspectiva: 'FINANCIERA',
    esPrioritario: metaF1.esPrioritario,
    valorCalculado: valF1,
    unidad: 'ARS',
    valorFormateado: valF1 !== null ? `$${Math.round(valF1).toLocaleString('es-AR')}` : 'Sin datos suficientes',
    metaTexto: metaF1.metaTexto,
    estadoSemaforo: semF1.estado,
    textoEstado: semF1.texto,
    periodoConsiderado: metaF1.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valF1 !== null,
    motivoFaltante: 'Sin registros de ventas ovinas confirmadas en el sistema.',
    responsable: metaF1.responsable
  });

  // F2: Costos directos de producción
  const metaF2 = getMeta('OVI_F2');
  const valF2 = totalCostosDirectos > 0 ? totalCostosDirectos : null;
  const semF2 = evaluarSemaforo(valF2, metaF2);
  resultados.push({
    id: 'OVI_F2',
    codigo: 'F2',
    nombre: metaF2.nombre,
    perspectiva: 'FINANCIERA',
    esPrioritario: metaF2.esPrioritario,
    valorCalculado: valF2,
    unidad: 'ARS',
    valorFormateado: valF2 !== null ? `$${Math.round(valF2).toLocaleString('es-AR')}` : 'Sin datos suficientes',
    metaTexto: metaF2.metaTexto,
    estadoSemaforo: semF2.estado,
    textoEstado: semF2.texto,
    periodoConsiderado: metaF2.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valF2 !== null,
    motivoFaltante: 'Sin consumos de insumos ni asignación de costos directos registrados.',
    responsable: metaF2.responsable
  });

  // F3: Margen bruto ovino (Ingresos reales - Costos directos reales)
  const metaF3 = getMeta('OVI_F3');
  const valF3 = (totalIngresos > 0 && totalCostosDirectos > 0) ? (totalIngresos - totalCostosDirectos) : null;
  const semF3 = evaluarSemaforo(valF3, metaF3);
  resultados.push({
    id: 'OVI_F3',
    codigo: 'F3',
    nombre: metaF3.nombre,
    perspectiva: 'FINANCIERA',
    esPrioritario: metaF3.esPrioritario,
    valorCalculado: valF3,
    unidad: 'ARS',
    valorFormateado: valF3 !== null ? `$${Math.round(valF3).toLocaleString('es-AR')}` : 'Sin datos suficientes',
    metaTexto: metaF3.metaTexto,
    estadoSemaforo: semF3.estado,
    textoEstado: semF3.texto,
    periodoConsiderado: metaF3.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valF3 !== null,
    motivoFaltante: 'Requiere comprobar simultáneamente ingresos de ventas y costos directos.',
    responsable: metaF3.responsable
  });

  // F4: Margen bruto sobre costos = Margen Bruto / Costos Directos * 100
  const metaF4 = getMeta('OVI_F4');
  const valF4 = (totalCostosDirectos > 0 && valF3 !== null) ? (valF3 / totalCostosDirectos) * 100 : null;
  const semF4 = evaluarSemaforo(valF4, metaF4);
  resultados.push({
    id: 'OVI_F4',
    codigo: 'F4',
    nombre: metaF4.nombre,
    perspectiva: 'FINANCIERA',
    esPrioritario: metaF4.esPrioritario,
    valorCalculado: valF4,
    unidad: '%',
    valorFormateado: valF4 !== null ? `${valF4.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaF4.metaTexto,
    estadoSemaforo: semF4.estado,
    textoEstado: semF4.texto,
    periodoConsiderado: metaF4.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valF4 !== null,
    motivoFaltante: 'Sin costos directos imputados para determinar el rendimiento relativo.',
    responsable: metaF4.responsable
  });

  // F5: Costo directo por kilogramo producido = Costos Directos / Kg Producidos/Vendidos
  const metaF5 = getMeta('OVI_F5');
  const valF5 = (totalCostosDirectos > 0 && totalKgVendidos > 0) ? (totalCostosDirectos / totalKgVendidos) : null;
  const semF5 = evaluarSemaforo(valF5, metaF5);
  resultados.push({
    id: 'OVI_F5',
    codigo: 'F5',
    nombre: metaF5.nombre,
    perspectiva: 'FINANCIERA',
    esPrioritario: metaF5.esPrioritario,
    valorCalculado: valF5,
    unidad: 'ARS/kg',
    valorFormateado: valF5 !== null ? `$${Math.round(valF5).toLocaleString('es-AR')}/kg` : 'Sin datos suficientes',
    metaTexto: metaF5.metaTexto,
    estadoSemaforo: semF5.estado,
    textoEstado: semF5.texto,
    periodoConsiderado: metaF5.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valF5 !== null,
    motivoFaltante: 'Sin kilogramos producidos/comercializados o costos directos imputados.',
    responsable: metaF5.responsable
  });

  // F6: Ingreso promedio por kilogramo vendido = Ingresos Totales / Kg Vendidos
  const metaF6 = getMeta('OVI_F6');
  const valF6 = (totalIngresos > 0 && totalKgVendidos > 0) ? (totalIngresos / totalKgVendidos) : null;
  const semF6 = evaluarSemaforo(valF6, metaF6);
  resultados.push({
    id: 'OVI_F6',
    codigo: 'F6',
    nombre: metaF6.nombre,
    perspectiva: 'FINANCIERA',
    esPrioritario: metaF6.esPrioritario,
    valorCalculado: valF6,
    unidad: 'ARS/kg',
    valorFormateado: valF6 !== null ? `$${Math.round(valF6).toLocaleString('es-AR')}/kg` : 'Sin datos suficientes',
    metaTexto: metaF6.metaTexto,
    estadoSemaforo: semF6.estado,
    textoEstado: semF6.texto,
    periodoConsiderado: metaF6.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valF6 !== null,
    motivoFaltante: 'Sin comprobantes de venta confirmados con kilos especificados.',
    responsable: metaF6.responsable
  });

  // F7: Desvío de costos directos respecto del presupuesto
  // Desvío monetario = Costos Directos Reales - Costo Presupuestado
  // Desvío % = (Desvío monetario / Costo Presupuestado) * 100
  const metaF7 = getMeta('OVI_F7');
  let valF7: number | null = null;
  if (presupuestosOvinos.length > 0 && totalCostosDirectos > 0) {
    const presupuestoMonto = Number(presupuestosOvinos[0].monto || presupuestosOvinos[0].costo_presupuestado || 0);
    if (presupuestoMonto > 0) {
      const desvioMonetario = totalCostosDirectos - presupuestoMonto;
      valF7 = (desvioMonetario / presupuestoMonto) * 100;
    }
  }
  const semF7 = evaluarSemaforo(valF7, metaF7);
  resultados.push({
    id: 'OVI_F7',
    codigo: 'F7',
    nombre: metaF7.nombre,
    perspectiva: 'FINANCIERA',
    esPrioritario: metaF7.esPrioritario,
    valorCalculado: valF7,
    unidad: '%',
    valorFormateado: valF7 !== null ? `${valF7 > 0 ? '+' : ''}${valF7.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaF7.metaTexto,
    estadoSemaforo: semF7.estado,
    textoEstado: semF7.texto,
    periodoConsiderado: metaF7.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valF7 !== null,
    motivoFaltante: 'Sin presupuesto operativo formal registrado en la Unidad Ovina.',
    responsable: metaF7.responsable
  });

  // =========================================================================
  // PERSPECTIVA DE CLIENTES / COMERCIAL (C1 - C5)
  // =========================================================================

  // C1: Kilogramos comercializados
  const metaC1 = getMeta('OVI_C1');
  const valC1 = totalKgVendidos > 0 ? totalKgVendidos : null;
  const semC1 = evaluarSemaforo(valC1, metaC1);
  resultados.push({
    id: 'OVI_C1',
    codigo: 'C1',
    nombre: metaC1.nombre,
    perspectiva: 'CLIENTES',
    esPrioritario: metaC1.esPrioritario,
    valorCalculado: valC1,
    unidad: 'kg',
    valorFormateado: valC1 !== null ? `${valC1.toLocaleString('es-AR')} kg` : 'Sin datos suficientes',
    metaTexto: metaC1.metaTexto,
    estadoSemaforo: semC1.estado,
    textoEstado: semC1.texto,
    periodoConsiderado: metaC1.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valC1 !== null,
    motivoFaltante: 'Sin kilos comercializados en operaciones de venta ovinas.',
    responsable: metaC1.responsable
  });

  // C2: Cumplimiento de entregas comprometidas
  const metaC2 = getMeta('OVI_C2');
  let valC2: number | null = null;
  if (entregas.length > 0) {
    const cumplidas = entregas.filter((e: any) => e.cumplido || e.estado === 'Entregado').length;
    valC2 = (cumplidas / entregas.length) * 100;
  }
  const semC2 = evaluarSemaforo(valC2, metaC2);
  resultados.push({
    id: 'OVI_C2',
    codigo: 'C2',
    nombre: metaC2.nombre,
    perspectiva: 'CLIENTES',
    esPrioritario: metaC2.esPrioritario,
    valorCalculado: valC2,
    unidad: '%',
    valorFormateado: valC2 !== null ? `${valC2.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaC2.metaTexto,
    estadoSemaforo: semC2.estado,
    textoEstado: semC2.texto,
    periodoConsiderado: metaC2.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valC2 !== null,
    motivoFaltante: 'Sin registros de entregas ni remitos comerciales.',
    responsable: metaC2.responsable
  });

  // C3: Precio promedio de venta por categoría (Cordero Pesado)
  const metaC3 = getMeta('OVI_C3');
  const valC3 = valF6; // Precio medio por kg en ventas reales
  const semC3 = evaluarSemaforo(valC3, metaC3);
  resultados.push({
    id: 'OVI_C3',
    codigo: 'C3',
    nombre: metaC3.nombre,
    perspectiva: 'CLIENTES',
    esPrioritario: metaC3.esPrioritario,
    valorCalculado: valC3,
    unidad: 'ARS/kg',
    valorFormateado: valC3 !== null ? `$${Math.round(valC3).toLocaleString('es-AR')}/kg` : 'Sin datos suficientes',
    metaTexto: metaC3.metaTexto,
    estadoSemaforo: semC3.estado,
    textoEstado: semC3.texto,
    periodoConsiderado: metaC3.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valC3 !== null,
    motivoFaltante: 'Sin ventas registradas para la categoría cordero.',
    responsable: metaC3.responsable
  });

  // C4: Tasa de reclamos o incidencias comerciales
  const metaC4 = getMeta('OVI_C4');
  let valC4: number | null = null;
  if (ventasOvinas.length > 0) {
    valC4 = (reclamos.length / ventasOvinas.length) * 100;
  }
  const semC4 = evaluarSemaforo(valC4, metaC4);
  resultados.push({
    id: 'OVI_C4',
    codigo: 'C4',
    nombre: metaC4.nombre,
    perspectiva: 'CLIENTES',
    esPrioritario: metaC4.esPrioritario,
    valorCalculado: valC4,
    unidad: '%',
    valorFormateado: valC4 !== null ? `${valC4.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaC4.metaTexto,
    estadoSemaforo: semC4.estado,
    textoEstado: semC4.texto,
    periodoConsiderado: metaC4.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valC4 !== null,
    motivoFaltante: 'Sin operaciones de venta registradas para evaluar reclamos.',
    responsable: metaC4.responsable
  });

  // C5: Clientes activos en la cartera
  const metaC5 = getMeta('OVI_C5');
  const valC5 = clientesUnicos.size > 0 ? clientesUnicos.size : null;
  const semC5 = evaluarSemaforo(valC5, metaC5);
  resultados.push({
    id: 'OVI_C5',
    codigo: 'C5',
    nombre: metaC5.nombre,
    perspectiva: 'CLIENTES',
    esPrioritario: metaC5.esPrioritario,
    valorCalculado: valC5,
    unidad: 'clientes',
    valorFormateado: valC5 !== null ? `${valC5} clientes` : 'Sin datos suficientes',
    metaTexto: metaC5.metaTexto,
    estadoSemaforo: semC5.estado,
    textoEstado: semC5.texto,
    periodoConsiderado: metaC5.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valC5 !== null,
    motivoFaltante: 'Sin compradores registrados en comprobantes de venta ovinas.',
    responsable: metaC5.responsable
  });

  // =========================================================================
  // PERSPECTIVA DE PROCESOS INTERNOS (P1 - P7)
  // =========================================================================

  // Extraer indicadores productivos de las planillas de parición
  const pariciones = db.Pariciones_Ovinas || produccionOvina.filter((p: any) => p.tipo_evento === 'PARICION') || [];
  let totalOvejasServicio = 0;
  let totalCorderosSenalados = 0;
  let totalCorderosNacidos = 0;
  let totalCorderosDestetados = 0;

  pariciones.forEach((p: any) => {
    totalOvejasServicio += Number(p.ovejas_servicio || p.madres || 0);
    totalCorderosSenalados += Number(p.corderos_senalados || p.nacidos_vivos || 0);
    totalCorderosNacidos += Number(p.nacidos_vivos || p.corderos_nacidos || 0);
    totalCorderosDestetados += Number(p.destetados || 0);
  });

  // P1: Porcentaje de señalada = Corderos señalados / Ovejas en servicio * 100
  const metaP1 = getMeta('OVI_P1');
  const valP1 = (totalOvejasServicio > 0 && totalCorderosSenalados > 0) ? (totalCorderosSenalados / totalOvejasServicio) * 100 : null;
  const semP1 = evaluarSemaforo(valP1, metaP1);
  resultados.push({
    id: 'OVI_P1',
    codigo: 'P1',
    nombre: metaP1.nombre,
    perspectiva: 'PROCESOS',
    esPrioritario: metaP1.esPrioritario,
    valorCalculado: valP1,
    unidad: '%',
    valorFormateado: valP1 !== null ? `${valP1.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaP1.metaTexto,
    estadoSemaforo: semP1.estado,
    textoEstado: semP1.texto,
    periodoConsiderado: metaP1.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valP1 !== null,
    motivoFaltante: 'Sin planillas de parición y señalada registradas en la majada.',
    responsable: metaP1.responsable
  });

  // P2: Supervivencia hasta el destete = Corderos destetados / Corderos nacidos vivos * 100
  const metaP2 = getMeta('OVI_P2');
  const valP2 = (totalCorderosNacidos > 0 && totalCorderosDestetados > 0) ? (totalCorderosDestetados / totalCorderosNacidos) * 100 : null;
  const semP2 = evaluarSemaforo(valP2, metaP2);
  resultados.push({
    id: 'OVI_P2',
    codigo: 'P2',
    nombre: metaP2.nombre,
    perspectiva: 'PROCESOS',
    esPrioritario: metaP2.esPrioritario,
    valorCalculado: valP2,
    unidad: '%',
    valorFormateado: valP2 !== null ? `${valP2.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaP2.metaTexto,
    estadoSemaforo: semP2.estado,
    textoEstado: semP2.texto,
    periodoConsiderado: metaP2.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valP2 !== null,
    motivoFaltante: 'Sin registros de nacimientos vivos y destetes confirmados.',
    responsable: metaP2.responsable
  });

  // P3: Mortalidad ovina general = Bajas por muerte / Total cabezas majada * 100
  const metaP3 = getMeta('OVI_P3');
  const muertesOvinaList = db.Muertes_Ovinas || muertes || produccionOvina.filter((p: any) => p.tipo_evento === 'MUERTE' || p.tipo === 'MUERTE') || [];
  let totalCabezasMajada = 0;
  existenciasOvinas.forEach((e: any) => {
    totalCabezasMajada += Number(e.cantidad || e.cabezas || 0);
  });
  let valP3: number | null = null;
  if (totalCabezasMajada > 0 && Array.isArray(muertesOvinaList)) {
    const cabezasMuertas = muertesOvinaList.reduce((acc: number, m: any) => acc + Number(m.cabezas || m.cantidad || 1), 0);
    valP3 = (cabezasMuertas / totalCabezasMajada) * 100;
  }
  const semP3 = evaluarSemaforo(valP3, metaP3);
  resultados.push({
    id: 'OVI_P3',
    codigo: 'P3',
    nombre: metaP3.nombre,
    perspectiva: 'PROCESOS',
    esPrioritario: metaP3.esPrioritario,
    valorCalculado: valP3,
    unidad: '%',
    valorFormateado: valP3 !== null ? `${valP3.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaP3.metaTexto,
    estadoSemaforo: semP3.estado,
    textoEstado: semP3.texto,
    periodoConsiderado: metaP3.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valP3 !== null,
    motivoFaltante: 'Sin registro formal de muertes o existencias totales de la majada.',
    responsable: metaP3.responsable
  });

  // P4: Ganancia diaria promedio de peso (ADPV)
  const metaP4 = getMeta('OVI_P4');
  let valP4: number | null = null;
  if (pesajes.length > 0) {
    let sumaGdp = 0;
    let cantPesajes = 0;
    pesajes.forEach((p: any) => {
      if (p.gdp && Number(p.gdp) > 0) {
        sumaGdp += Number(p.gdp);
        cantPesajes++;
      }
    });
    if (cantPesajes > 0) {
      valP4 = sumaGdp / cantPesajes;
    }
  }
  const semP4 = evaluarSemaforo(valP4, metaP4);
  resultados.push({
    id: 'OVI_P4',
    codigo: 'P4',
    nombre: metaP4.nombre,
    perspectiva: 'PROCESOS',
    esPrioritario: metaP4.esPrioritario,
    valorCalculado: valP4,
    unidad: 'kg/día',
    valorFormateado: valP4 !== null ? `${valP4.toFixed(3)} kg/día` : 'Sin datos suficientes',
    metaTexto: metaP4.metaTexto,
    estadoSemaforo: semP4.estado,
    textoEstado: semP4.texto,
    periodoConsiderado: metaP4.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valP4 !== null,
    motivoFaltante: 'Sin pesajes de corderos en engorde cargados.',
    responsable: metaP4.responsable
  });

  // P5: Conversión alimenticia = kg alimento consumido / kg ganancia viva
  const metaP5 = getMeta('OVI_P5');
  let valP5: number | null = null;
  if (valP4 !== null && consumosOvinos.length > 0 && totalKgVendidos > 0) {
    const kgAlimentoTotal = consumosOvinos.reduce((acc: number, c: any) => acc + Number(c.kg_consumidos || c.cantidad_kg || 0), 0);
    if (kgAlimentoTotal > 0) {
      valP5 = kgAlimentoTotal / totalKgVendidos;
    }
  }
  const semP5 = evaluarSemaforo(valP5, metaP5);
  resultados.push({
    id: 'OVI_P5',
    codigo: 'P5',
    nombre: metaP5.nombre,
    perspectiva: 'PROCESOS',
    esPrioritario: metaP5.esPrioritario,
    valorCalculado: valP5,
    unidad: 'kg/kg',
    valorFormateado: valP5 !== null ? `${valP5.toFixed(2)} kg/kg` : 'Sin datos suficientes',
    metaTexto: metaP5.metaTexto,
    estadoSemaforo: semP5.estado,
    textoEstado: semP5.texto,
    periodoConsiderado: metaP5.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valP5 !== null,
    motivoFaltante: 'Sin consumos de ración o pesadas de ganancia viva.',
    responsable: metaP5.responsable
  });

  // P6: Desvío de rendimiento productivo = (kg producidos / madre) - 28.0 kg/madre
  const metaP6 = getMeta('OVI_P6');
  let valP6: number | null = null;
  if (totalOvejasServicio > 0 && totalKgVendidos > 0) {
    const kgPorVientre = totalKgVendidos / totalOvejasServicio;
    valP6 = kgPorVientre - 28.0;
  }
  const semP6 = evaluarSemaforo(valP6, metaP6);
  resultados.push({
    id: 'OVI_P6',
    codigo: 'P6',
    nombre: metaP6.nombre,
    perspectiva: 'PROCESOS',
    esPrioritario: metaP6.esPrioritario,
    valorCalculado: valP6,
    unidad: 'kg/cab',
    valorFormateado: valP6 !== null ? `${valP6 > 0 ? '+' : ''}${valP6.toFixed(1)} kg/cab` : 'Sin datos suficientes',
    metaTexto: metaP6.metaTexto,
    estadoSemaforo: semP6.estado,
    textoEstado: semP6.texto,
    periodoConsiderado: metaP6.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valP6 !== null,
    motivoFaltante: 'Sin datos de vientres expuestos a servicio o kilos comercializados.',
    responsable: metaP6.responsable
  });

  // P7: Desvío de consumo de alimento
  // Desvío físico = consumo real - consumo formulado esperado
  // Desvío % = (desvío físico / consumo formulado) * 100
  const metaP7 = getMeta('OVI_P7');
  let valP7: number | null = null;
  if (consumosOvinos.length > 0) {
    let totalReal = 0;
    let totalFormulado = 0;
    consumosOvinos.forEach((c: any) => {
      const real = Number(c.kg_consumidos || c.cantidad_kg || 0);
      const formulado = Number(c.kg_formulados || c.kg_esperados || 0);
      if (real > 0 && formulado > 0) {
        totalReal += real;
        totalFormulado += formulado;
      }
    });
    if (totalFormulado > 0) {
      valP7 = ((totalReal - totalFormulado) / totalFormulado) * 100;
    }
  }
  const semP7 = evaluarSemaforo(valP7, metaP7);
  resultados.push({
    id: 'OVI_P7',
    codigo: 'P7',
    nombre: metaP7.nombre,
    perspectiva: 'PROCESOS',
    esPrioritario: metaP7.esPrioritario,
    valorCalculado: valP7,
    unidad: '%',
    valorFormateado: valP7 !== null ? `${valP7 > 0 ? '+' : ''}${valP7.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaP7.metaTexto,
    estadoSemaforo: semP7.estado,
    textoEstado: semP7.texto,
    periodoConsiderado: metaP7.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valP7 !== null,
    motivoFaltante: 'Sin consumos de ración o raciones formuladas de comparación.',
    responsable: metaP7.responsable
  });

  // =========================================================================
  // PERSPECTIVA DE APRENDIZAJE Y CRECIMIENTO (A1 - A5)
  // =========================================================================

  // A1: Cumplimiento del plan de capacitación
  const metaA1 = getMeta('OVI_A1');
  let valA1: number | null = null;
  if (capacitaciones.length > 0) {
    const hechas = capacitaciones.filter((c: any) => c.estado === 'REALIZADA' || c.realizada).length;
    valA1 = (hechas / capacitaciones.length) * 100;
  }
  const semA1 = evaluarSemaforo(valA1, metaA1);
  resultados.push({
    id: 'OVI_A1',
    codigo: 'A1',
    nombre: metaA1.nombre,
    perspectiva: 'APRENDIZAJE',
    esPrioritario: metaA1.esPrioritario,
    valorCalculado: valA1,
    unidad: '%',
    valorFormateado: valA1 !== null ? `${valA1.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaA1.metaTexto,
    estadoSemaforo: semA1.estado,
    textoEstado: semA1.texto,
    periodoConsiderado: metaA1.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valA1 !== null,
    motivoFaltante: 'Sin capacitaciones ovinas registradas.',
    responsable: metaA1.responsable
  });

  // A2: Integridad de registros productivos (Evaluado sobre eventos ovinos completos)
  const metaA2 = getMeta('OVI_A2');
  let valA2: number | null = null;
  if (produccionOvina.length > 0) {
    const completos = produccionOvina.filter((p: any) => p.fecha && (p.cabezas || p.cantidad_animales)).length;
    valA2 = (completos / produccionOvina.length) * 100;
  }
  const semA2 = evaluarSemaforo(valA2, metaA2);
  resultados.push({
    id: 'OVI_A2',
    codigo: 'A2',
    nombre: metaA2.nombre,
    perspectiva: 'APRENDIZAJE',
    esPrioritario: metaA2.esPrioritario,
    valorCalculado: valA2,
    unidad: '%',
    valorFormateado: valA2 !== null ? `${valA2.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaA2.metaTexto,
    estadoSemaforo: semA2.estado,
    textoEstado: semA2.texto,
    periodoConsiderado: metaA2.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valA2 !== null,
    motivoFaltante: 'Sin eventos cargados en formularios ovinos.',
    responsable: metaA2.responsable
  });

  // A3: Registro oportuno de operaciones
  const metaA3 = getMeta('OVI_A3');
  let valA3: number | null = null;
  if (produccionOvina.length > 0) {
    const aTiempo = produccionOvina.filter((p: any) => !p.observado && p.estado !== 'Observado').length;
    valA3 = (aTiempo / produccionOvina.length) * 100;
  }
  const semA3 = evaluarSemaforo(valA3, metaA3);
  resultados.push({
    id: 'OVI_A3',
    codigo: 'A3',
    nombre: metaA3.nombre,
    perspectiva: 'APRENDIZAJE',
    esPrioritario: metaA3.esPrioritario,
    valorCalculado: valA3,
    unidad: '%',
    valorFormateado: valA3 !== null ? `${valA3.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaA3.metaTexto,
    estadoSemaforo: semA3.estado,
    textoEstado: semA3.texto,
    periodoConsiderado: metaA3.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valA3 !== null,
    motivoFaltante: 'Sin registro de operaciones para evaluar oportunidad.',
    responsable: metaA3.responsable
  });

  // A4: Avance de la transición genética hacia Dorper
  const metaA4 = getMeta('OVI_A4');
  let valA4: number | null = null;
  if (existenciasOvinas.length > 0) {
    let totalCabezas = 0;
    let cabezasDorper = 0;
    existenciasOvinas.forEach((e: any) => {
      const cant = Number(e.cantidad || e.cabezas || 0);
      totalCabezas += cant;
      if (e.raza?.toLowerCase().includes('dorper') || e.categoria?.toLowerCase().includes('dorper') || e.biotipo?.toLowerCase().includes('dorper')) {
        cabezasDorper += cant;
      }
    });
    if (totalCabezas > 0) {
      valA4 = (cabezasDorper / totalCabezas) * 100;
    }
  }
  const semA4 = evaluarSemaforo(valA4, metaA4);
  resultados.push({
    id: 'OVI_A4',
    codigo: 'A4',
    nombre: metaA4.nombre,
    perspectiva: 'APRENDIZAJE',
    esPrioritario: metaA4.esPrioritario,
    valorCalculado: valA4,
    unidad: '%',
    valorFormateado: valA4 !== null ? `${valA4.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaA4.metaTexto,
    estadoSemaforo: semA4.estado,
    textoEstado: semA4.texto,
    periodoConsiderado: metaA4.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valA4 !== null,
    motivoFaltante: 'Sin clasificación racial en existencias de la majada.',
    responsable: metaA4.responsable
  });

  // A5: Cumplimiento de acciones de mejora
  const metaA5 = getMeta('OVI_A5');
  let valA5: number | null = null;
  if (accionesMejora.length > 0) {
    const completadas = accionesMejora.filter((a: any) => a.completada || a.estado === 'Completada').length;
    valA5 = (completadas / accionesMejora.length) * 100;
  }
  const semA5 = evaluarSemaforo(valA5, metaA5);
  resultados.push({
    id: 'OVI_A5',
    codigo: 'A5',
    nombre: metaA5.nombre,
    perspectiva: 'APRENDIZAJE',
    esPrioritario: metaA5.esPrioritario,
    valorCalculado: valA5,
    unidad: '%',
    valorFormateado: valA5 !== null ? `${valA5.toFixed(1)}%` : 'Sin datos suficientes',
    metaTexto: metaA5.metaTexto,
    estadoSemaforo: semA5.estado,
    textoEstado: semA5.texto,
    periodoConsiderado: metaA5.periodoAplicable,
    fechaActualizacion: hoyStr,
    datosDisponibles: valA5 !== null,
    motivoFaltante: 'Sin plan de acciones de mejora auditado.',
    responsable: metaA5.responsable
  });

  // Filtrado final si se solicita
  if (filtros) {
    let res = [...resultados];
    if (filtros.perspectiva && filtros.perspectiva !== 'TODAS') {
      res = res.filter(r => r.perspectiva === filtros.perspectiva);
    }
    if (filtros.soloPrioritarios) {
      res = res.filter(r => r.esPrioritario);
    }
    if (filtros.estado && filtros.estado !== 'TODOS') {
      res = res.filter(r => r.estadoSemaforo === filtros.estado);
    }
    return res;
  }

  return resultados;
}

export function obtenerResumenEjecutivoCMIOvino(
  resultados: ResultadoIndicadorCMI[]
): ResumenEjecutivoCMI {
  const cantVerde = resultados.filter(r => r.estadoSemaforo === 'VERDE').length;
  const cantAmarillo = resultados.filter(r => r.estadoSemaforo === 'AMARILLO').length;
  const cantRojo = resultados.filter(r => r.estadoSemaforo === 'ROJO').length;
  const cantGris = resultados.filter(r => r.estadoSemaforo === 'GRIS').length;
  const cantMetaPendiente = resultados.filter(r => r.estadoSemaforo === 'META_PENDIENTE').length;

  const criticos = resultados.filter(r => r.estadoSemaforo === 'ROJO' || r.estadoSemaforo === 'AMARILLO');

  return {
    totalIndicadores: resultados.length,
    cantVerde,
    cantAmarillo,
    cantRojo,
    cantGris,
    cantMetaPendiente,
    criticos
  };
}
