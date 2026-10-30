/**
 * @file cmiConstants.ts
 * @description Catálogo oficial de los 24 indicadores del Cuadro de Mando Integral (CMI)
 * Unidad Productiva Porcina - Pozo del Carril · La Aguada (FCE UNRC)
 */

import { MetaIndicadorCMI } from '../types/cmi';

export const METAS_INICIALES_CMI: MetaIndicadorCMI[] = [
  // =========================================================================
  // PERSPECTIVA FINANCIERA (7 INDICADORES: F1 - F7)
  // =========================================================================
  {
    id: 'F1',
    codigo: 'F1',
    nombre: 'Margen sobre Ventas de Capones',
    perspectiva: 'FINANCIERA',
    esPrioritario: true,
    meta: 30,
    metaTexto: '>= 30%',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por ciclo / Mensual',
    responsable: 'Administración',
    descripcion: 'Evalúa la rentabilidad real del ciclo porcino sobre ingresos netos de capones.',
    accionDesvio: 'Desagregar por precio de venta, costo de alimento, mortandad y fletes.'
  },
  {
    id: 'F2',
    codigo: 'F2',
    nombre: 'Resultado Incremental de Fase 3 (Engorde)',
    perspectiva: 'FINANCIERA',
    esPrioritario: true,
    meta: 0,
    metaTexto: '>= $0',
    unidad: '$',
    direccion: 'REGLA_CERO',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por lote / Ciclo',
    responsable: 'Administración y Encargado',
    descripcion: 'Determina si llevar animales de recría a capón terminado agrega valor económico frente a la venta como cachorro.',
    accionDesvio: 'Revisar conversión alimenticia, costos incrementales y alternativas de mercado.'
  },
  {
    id: 'F3',
    codigo: 'F3',
    nombre: 'Costo por Kilogramo Vivo Producido',
    perspectiva: 'FINANCIERA',
    esPrioritario: true,
    meta: null, // Reducción del 5% contra una línea de base REAL, cuando exista. Si no hay base real: Meta pendiente
    metaTexto: 'Reducción 5% s/ Base Real',
    unidad: '$/kg',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por lote y mes',
    responsable: 'Administración',
    descripcion: 'Controla la eficiencia económica por kilogramo de peso vivo efectivamente ganado.',
    accionDesvio: 'Investigar fases y rubros de insumos que explican el aumento del costo unitario.'
  },
  {
    id: 'F4',
    codigo: 'F4',
    nombre: 'Participación de Alimentación en Costo Total',
    perspectiva: 'FINANCIERA',
    esPrioritario: true,
    meta: 75,
    metaTexto: '<= 75%',
    unidad: '%',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Mensual y ciclo',
    responsable: 'Administración / Encargado',
    descripcion: 'Controla la incidencia del costo del alimento consumido sobre los costos totales.',
    accionDesvio: 'Analizar precios de raciones, formulación, desperdicios en comederos y conversión.'
  },
  {
    id: 'F5',
    codigo: 'F5',
    nombre: 'Desvío Presupuestario',
    perspectiva: 'FINANCIERA',
    esPrioritario: false,
    meta: [-5, 5],
    metaTexto: '[-5%, +5%]',
    unidad: '%',
    direccion: 'INTERVALO',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Mensual',
    responsable: 'Administración',
    descripcion: 'Compara costos reales devengados versus costos presupuestados del período.',
    accionDesvio: 'Identificar desviaciones por rubro e investigar partidas con sobre-ejecución.'
  },
  {
    id: 'F6',
    codigo: 'F6',
    nombre: 'Cobertura del Precio de Equilibrio del Capón',
    perspectiva: 'FINANCIERA',
    esPrioritario: false,
    meta: 100,
    metaTexto: '>= 100%',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por venta y mes',
    responsable: 'Administración',
    descripcion: 'Verifica la suficiencia del precio comercial obtenido frente al costo de equilibrio unitario.',
    accionDesvio: 'Revisar precios obtenidos en balanza, estructura de costos y momento de venta.'
  },
  {
    id: 'F7',
    codigo: 'F7',
    nombre: 'Resultado Neto por Capón Vendido',
    perspectiva: 'FINANCIERA',
    esPrioritario: false,
    meta: null, // Requiere fijar meta monetaria configurable; muestra Meta pendiente si no se fijó
    metaTexto: 'Meta pendiente',
    unidad: '$/cab',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por lote / mes',
    responsable: 'Administración',
    descripcion: 'Evalúa la rentabilidad unitaria neta por cabeza de capón comercializada.',
    accionDesvio: 'Comparar desempeño entre lotes, costos directos y condiciones de venta.'
  },

  // =========================================================================
  // PERSPECTIVA CLIENTES Y DESTINATARIOS (5 INDICADORES: C1 - C5)
  // =========================================================================
  {
    id: 'C1',
    codigo: 'C1',
    nombre: 'Capones Vendidos dentro del Peso Óptimo',
    perspectiva: 'CLIENTES',
    esPrioritario: true,
    meta: 95,
    metaTexto: '>= 95%',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por venta / mes',
    responsable: 'Encargado porcino',
    descripcion: 'Proporción de capones vendidos que cumplen con el rango óptimo comercial (90 a 105 kg).',
    accionDesvio: 'Ajustar pesajes de control en corrales y momento de carga para faena.'
  },
  {
    id: 'C2',
    codigo: 'C2',
    nombre: 'Mortalidad en Transporte (muertos a la llegada)',
    perspectiva: 'CLIENTES',
    esPrioritario: true,
    meta: 0,
    metaTexto: '0% (<= 0,5% tolerancia)',
    unidad: '%',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por envío y consolidado mensual',
    responsable: 'Encargado porcino y área comercial',
    descripcion: 'Pérdidas de cerdos durante el traslado al frigorífico que afectan bienestar animal, reputación y costos.',
    accionDesvio: 'Revisar transportista, densidad de carga en jaula, ayuno previo y horario de despacho.'
  },
  {
    id: 'C3',
    codigo: 'C3',
    nombre: 'Entregas Realizadas en Fecha',
    perspectiva: 'CLIENTES',
    esPrioritario: false,
    meta: 95,
    metaTexto: '>= 95%',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Mensual',
    responsable: 'Encargado comercial',
    descripcion: 'Cumplimiento de fechas de entrega pactadas con compradores y frigoríficos.',
    accionDesvio: 'Ajustar coordinación de fletes y logística de despacho de hacienda.'
  },
  {
    id: 'C4',
    codigo: 'C4',
    nombre: 'Reclamos o Rechazos Comerciales',
    perspectiva: 'CLIENTES',
    esPrioritario: false,
    meta: 2,
    metaTexto: '<= 2%',
    unidad: '%',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Mensual',
    responsable: 'Encargado comercial',
    descripcion: 'Operaciones comerciales con reclamos formales o rechazo de animales en frigorífico.',
    accionDesvio: 'Investigar motivos de disconformidad por cliente y lote despachado.'
  },
  {
    id: 'C5',
    codigo: 'C5',
    nombre: 'Plazo Promedio de Cobranza',
    perspectiva: 'CLIENTES',
    esPrioritario: false,
    meta: 30,
    metaTexto: '<= 30 días',
    unidad: 'días',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Mensual',
    responsable: 'Administración',
    descripcion: 'Días transcurridos entre la fecha de venta y la acreditación efectiva del cobro.',
    accionDesvio: 'Reclamar cobros pendientes y renegociar plazos de pago con clientes.'
  },

  // =========================================================================
  // PERSPECTIVA PROCESOS INTERNOS (7 INDICADORES: P1 - P7)
  // =========================================================================
  {
    id: 'P1',
    codigo: 'P1',
    nombre: 'ICA de Engorde',
    perspectiva: 'PROCESOS',
    esPrioritario: true,
    meta: 3.0,
    metaTexto: '<= 3,0',
    unidad: 'kg/kg',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por lote',
    responsable: 'Encargado porcino',
    descripcion: 'Índice de Conversión Alimenticia: kg de alimento consumidos por kg ganado en engorde.',
    accionDesvio: 'Revisar balance nutricional de ración, desperdicios, comederos y sanidad.'
  },
  {
    id: 'P2',
    codigo: 'P2',
    nombre: 'Supervivencia al Destete',
    perspectiva: 'PROCESOS',
    esPrioritario: true,
    meta: 88,
    metaTexto: '>= 88%',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Camada / mes',
    responsable: 'Encargado de reproducción',
    descripcion: 'Porcentaje de lechones destetados respecto a los nacidos vivos en maternidad.',
    accionDesvio: 'Investigar causas de mortandad en parideras, frío y aplastamiento neonatal.'
  },
  {
    id: 'P3',
    codigo: 'P3',
    nombre: 'Lechones Destetados por Madre por Año',
    perspectiva: 'PROCESOS',
    esPrioritario: true,
    meta: 21,
    metaTexto: '>= 21',
    unidad: 'lech/m/año',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Ventana móvil 12 meses',
    responsable: 'Encargado de reproducción',
    descripcion: 'Productividad biológica global del plantel de reproductoras en base anual.',
    accionDesvio: 'Analizar si el desvío proviene de menor frecuencia de partos o menor camada destetada.'
  },
  {
    id: 'P4',
    codigo: 'P4',
    nombre: 'Partos por Madre por Año',
    perspectiva: 'PROCESOS',
    esPrioritario: false,
    meta: 2.1,
    metaTexto: '>= 2,1',
    unidad: 'partos/m/año',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Ventana móvil 12 meses',
    responsable: 'Encargado de reproducción',
    descripcion: 'Frecuencia de pariciones del plantel de madres ajustada por tiempo de exposición.',
    accionDesvio: 'Evaluar intervalos destete-servicio, detección de celo y fallas de monta.'
  },
  {
    id: 'P5',
    codigo: 'P5',
    nombre: 'Mortalidad por Fase',
    perspectiva: 'PROCESOS',
    esPrioritario: false,
    meta: 5,
    metaTexto: '<= 5% global',
    unidad: '%',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por lote / mes',
    responsable: 'Encargado porcino',
    descripcion: 'Pérdidas de animales por mortandad sobre el total de cabezas ingresadas a la fase.',
    accionDesvio: 'Investigar causas clínicas, condiciones sanitarias y manejo de densidad.'
  },
  {
    id: 'P6',
    codigo: 'P6',
    nombre: 'Duración del Ciclo Productivo',
    perspectiva: 'PROCESOS',
    esPrioritario: true,
    meta: 165,
    metaTexto: '<= 165 días',
    unidad: 'días',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por lote',
    responsable: 'Encargado porcino',
    descripcion: 'Días transcurridos desde el nacimiento de la camada hasta la venta efectiva del lote.',
    accionDesvio: 'Revisar velocidad de crecimiento, ganancia diaria y posibles cuellos de botella.'
  },
  {
    id: 'P7',
    codigo: 'P7',
    nombre: 'Ganancia Media Diaria',
    perspectiva: 'PROCESOS',
    esPrioritario: false,
    meta: 0.65,
    metaTexto: '>= 0,65 kg/día',
    unidad: 'kg/día',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Por lote / fase',
    responsable: 'Encargado porcino',
    descripcion: 'Ganancia Diaria de Peso (GDP) promedio calculada independientemente por fase según registros reales.',
    accionDesvio: 'Verificar consumo voluntario de ración, comederos y temperatura ambiente.'
  },
  {
    id: 'P7.1',
    codigo: 'P7.1',
    nombre: 'P7.1 Cría/lactancia',
    perspectiva: 'PROCESOS',
    esPrioritario: false,
    meta: 0.23,
    metaTexto: '>= 0,23 kg/día',
    unidad: 'kg/día',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Fase Cría / Lactancia (28 d)',
    responsable: 'Encargado de reproducción',
    descripcion: 'Ganancia Diaria de Peso en maternidad: (peso destete - peso inicial) / días lactancia.',
    accionDesvio: 'Revisar producción láctea, suplementación y sanidad en parideras.'
  },
  {
    id: 'P7.2',
    codigo: 'P7.2',
    nombre: 'P7.2 Destete/recría',
    perspectiva: 'PROCESOS',
    esPrioritario: false,
    meta: 0.40,
    metaTexto: '>= 0,40 kg/día',
    unidad: 'kg/día',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Fase Destete / Recría (60 d)',
    responsable: 'Encargado de recría',
    descripcion: 'Ganancia Diaria de Peso en pista de recría: (peso egreso - peso ingreso) / días permanencia.',
    accionDesvio: 'Revisar ración iniciadora, comederos tolva y densidad de corrales.'
  },
  {
    id: 'P7.3',
    codigo: 'P7.3',
    nombre: 'P7.3 Engorde/terminación',
    perspectiva: 'PROCESOS',
    esPrioritario: false,
    meta: 0.65,
    metaTexto: '>= 0,65 kg/día',
    unidad: 'kg/día',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Fase Engorde / Terminación (90 d)',
    responsable: 'Encargado de engorde',
    descripcion: 'Ganancia Diaria de Peso en terminación a campo: (peso faena - peso ingreso) / días permanencia.',
    accionDesvio: 'Verificar consumo voluntario de ración, proteína y sanidad respiratoria.'
  },

  // =========================================================================
  // PERSPECTIVA APRENDIZAJE Y DESARROLLO (5 INDICADORES: A1 - A5)
  // =========================================================================
  {
    id: 'A1',
    codigo: 'A1',
    nombre: 'Registros Completos',
    perspectiva: 'APRENDIZAJE',
    esPrioritario: true,
    meta: 98,
    metaTexto: '>= 98%',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Mensual',
    responsable: 'Administración',
    descripcion: 'Porcentaje de registros con todos los campos obligatorios completos sin omisiones.',
    accionDesvio: 'Reforzar validaciones en formularios y completar campos faltantes de partes de campo.'
  },
  {
    id: 'A2',
    codigo: 'A2',
    nombre: 'Registros con Errores o Duplicados',
    perspectiva: 'APRENDIZAJE',
    esPrioritario: true,
    meta: 1,
    metaTexto: '< 1%',
    unidad: '%',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Mensual',
    responsable: 'Administración',
    descripcion: 'Tasa de registros con inconsistencias detectadas por el sistema de auditoría.',
    accionDesvio: 'Capacitar en reglas de registración y depurar observaciones en la planilla.'
  },
  {
    id: 'A3',
    codigo: 'A3',
    nombre: 'Movimientos Cargados dentro de 48 Horas',
    perspectiva: 'APRENDIZAJE',
    esPrioritario: false,
    meta: 95,
    metaTexto: '>= 95%',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Mensual',
    responsable: 'Administración y Encargado',
    descripcion: 'Proporción de movimientos registrados dentro de las 48 horas de ocurridos.',
    accionDesvio: 'Simplificar circuitos de carga y agilizar la entrega de planillas de campo.'
  },
  {
    id: 'A4',
    codigo: 'A4',
    nombre: 'Horas de Capacitación por Responsable',
    perspectiva: 'APRENDIZAJE',
    esPrioritario: false,
    meta: 12,
    metaTexto: '>= 12 hs/persona/año',
    unidad: 'hs/persona/año',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Anual con revisión trimestral',
    responsable: 'Dirección / Encargado',
    descripcion: 'Horas de formación técnica y de gestión recibidas por persona en el período.',
    accionDesvio: 'Planificar cursos técnicos de bioseguridad, reproducción y uso de software.'
  },
  {
    id: 'A5',
    codigo: 'A5',
    nombre: 'Visitas estudiantiles a Porcinos',
    perspectiva: 'APRENDIZAJE',
    esPrioritario: false,
    meta: 4,
    metaTexto: '>= 4 visitas/año',
    unidad: 'visitas',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2024-07-01',
    periodoAplicable: 'Anual con revisión trimestral',
    responsable: 'Encargado de Producción / Extensión',
    descripcion: 'Número de visitas estudiantiles efectivamente realizadas a la unidad porcina dentro del período seleccionado.',
    accionDesvio: 'Coordinar agendas con facultades y escuelas técnicas para promover actividades prácticas de extensión.'
  }
];

// Metas específicas y editables por cada subfase de P7 (Requerimiento 9)
export interface MetaSubfaseP7Config {
  subfaseKey: 'P7_1' | 'P7_2' | 'P7_3';
  codigo: 'P7.1' | 'P7.2' | 'P7.3';
  nombre: string;
  faseNombre: string;
  faseId: string;
  meta: number;
  metaTexto: string;
  unidad: string;
  direccion: any;
  descripcion: string;
}

export const METAS_SUBFASES_P7_INICIALES: Record<'P7_1' | 'P7_2' | 'P7_3', MetaSubfaseP7Config> = {
  P7_1: {
    subfaseKey: 'P7_1',
    codigo: 'P7.1',
    nombre: 'P7.1 Cría / lactancia',
    faseNombre: 'Cría/lactancia',
    faseId: 'FASE_CRIA',
    meta: 0.23,
    metaTexto: '>= 0,23 kg/día',
    unidad: 'kg/día',
    direccion: 'MAYOR_MEJOR',
    descripcion: 'Ganancia Diaria de Peso de lechones en maternidad: (peso destete - peso nacer) / días lactancia.'
  },
  P7_2: {
    subfaseKey: 'P7_2',
    codigo: 'P7.2',
    nombre: 'P7.2 Destete / recría',
    faseNombre: 'Destete/recría',
    faseId: 'FASE_DESTETE_REC',
    meta: 0.40,
    metaTexto: '>= 0,40 kg/día',
    unidad: 'kg/día',
    direccion: 'MAYOR_MEJOR',
    descripcion: 'Ganancia Diaria de Peso en recría: (peso salida recría - peso destete) / días permanencia.'
  },
  P7_3: {
    subfaseKey: 'P7_3',
    codigo: 'P7.3',
    nombre: 'P7.3 Engorde / terminación',
    faseNombre: 'Engorde/terminación',
    faseId: 'FASE_ENGORDE_TERM',
    meta: 0.65,
    metaTexto: '>= 0,65 kg/día',
    unidad: 'kg/día',
    direccion: 'MAYOR_MEJOR',
    descripcion: 'Ganancia Diaria de Peso en engorde: (peso faena - peso ingreso a engorde) / días engorde.'
  }
};

