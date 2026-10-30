/**
 * @file cmi.ts
 * @description Definición de tipos, modelos e interfaces para el Cuadro de Mando Integral (CMI)
 * Unidad Productiva Porcina - Pozo del Carril · La Aguada (UNRC)
 */

export type PerspectivaCMI = 'FINANCIERA' | 'CLIENTES' | 'PROCESOS' | 'APRENDIZAJE';

export type EstadoSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO' | 'GRIS' | 'META_PENDIENTE';

export type DireccionMejora = 'MAYOR_MEJOR' | 'MENOR_MEJOR' | 'INTERVALO' | 'REGLA_CERO';

export interface MetaIndicadorCMI {
  id: string; // F1..F7, C1..C5, P1..P7, A1..A5
  codigo: string;
  nombre: string;
  perspectiva: PerspectivaCMI;
  esPrioritario: boolean;
  meta: number | null | [number, number]; // null si está pendiente, o número, o intervalo [min, max]
  metaTexto: string;
  unidad: string;
  direccion: DireccionMejora;
  fechaVigencia: string;
  periodoAplicable: string;
  responsable: string;
  descripcion: string;
  accionDesvio: string;
}

export interface HistorialMetaCMI {
  id: string;
  indicadorId: string;
  metaAnterior: number | null | [number, number];
  metaNueva: number | null | [number, number];
  fechaCambio: string;
  usuario: string;
  motivo: string;
}

export type SubfaseP7 = 'P7_1' | 'P7_2' | 'P7_3';

export interface SubindicadorP7 {
  id: 'P7.1' | 'P7.2' | 'P7.3';
  subfaseKey: SubfaseP7;
  codigo: string;
  nombre: string;
  faseNombre: string;
  faseId: string;
  pesoInicialKg: number | null;
  pesoFinalKg: number | null;
  diasPermanencia: number | null;
  gananciaDiariaKg: number | null;
  valorFormateado: string;
  unidad: string;
  meta: number;
  metaTexto: string;
  estadoSemaforo: EstadoSemaforo;
  textoEstado: string;
  loteCodigo?: string;
  periodo: string;
  datosDisponibles: boolean;
  motivoFaltante?: string;
  responsable: string;
}

export interface ResultadoIndicadorCMI {
  id: string;
  codigo: string;
  nombre: string;
  perspectiva: PerspectivaCMI;
  esPrioritario: boolean;
  valorCalculado: number | null;
  unidad: string;
  valorFormateado: string;
  metaTexto: string;
  estadoSemaforo: EstadoSemaforo;
  textoEstado: string; // 'Meta alcanzada', 'Atención', 'Desvío importante', 'Datos insuficientes', 'Meta pendiente'
  periodoConsiderado: string;
  fechaActualizacion: string;
  datosDisponibles: boolean;
  motivoFaltante?: string;
  aspectoAInvestigar?: string;
  responsable: string;
  // Subindicadores de fases para P7 (Requerimiento 9)
  subindicadoresP7?: Record<SubfaseP7, SubindicadorP7>;
  subfaseP7Activa?: SubfaseP7;
  // Metadatos específicos de visitas estudiantiles para A5
  avancePct?: number;
  datosVisitas?: {
    realizadas: number;
    total: number;
    programadas: number;
    canceladas: number;
    meta: number;
  };
}

export interface ResumenEjecutivoCMI {
  totalIndicadores: number;
  cantVerde: number;
  cantAmarillo: number;
  cantRojo: number;
  cantGris: number;
  cantMetaPendiente: number;
  criticos: ResultadoIndicadorCMI[];
}

export interface FiltrosCMI {
  perspectiva: 'TODAS' | PerspectivaCMI;
  estado: 'TODOS' | EstadoSemaforo;
  periodo: 'TODO' | 'MES' | 'TRIMESTRE' | 'ANIO' | 'CAMPANA';
  campanaId?: string;
  loteId?: string;
  faseId?: string;
  soloPrioritarios: boolean;
}

// Modelos opcionales para complementar datos reales de capacitación, reuniones y presupuesto
export interface RegistroCapacitacion {
  id: string;
  fecha: string;
  tema: string;
  horas: number;
  participantes_cabezas: number;
  personal_id?: string;
  responsable: string;
  estado: 'REALIZADA' | 'PLANIFICADA';
}

export interface ReunionCMI {
  id: string;
  fecha: string;
  tipo: 'SEGUIMIENTO_MENSUAL' | 'REVISION_TRIMESTRAL' | 'PLANIFICACION_ANUAL';
  realizada: boolean;
  acta_observaciones?: string;
  participantes?: string[];
}

export interface PresupuestoCostos {
  id: string;
  campana_id: string;
  periodo: string; // ej: 2025-01
  fase_id?: string;
  costo_presupuestado: number;
  descripcion: string;
}

export interface ReclamoComercial {
  id: string;
  fecha: string;
  mov_comercial_id: string;
  cliente_id: string;
  tipo_reclamo: 'PESO_FUERA_RANGO' | 'CALIDAD_GRASA' | 'DECOMISO_FAENA' | 'DOCUMENTACION';
  descripcion: string;
  descuento_aplicado: number;
  resuelto: boolean;
}

export interface CompromisoEntrega {
  id: string;
  fecha_compromiso: string;
  fecha_despacho_real?: string;
  cliente_id: string;
  lote_id?: string;
  cabezas_comprometidas: number;
  cumplida_en_fecha: boolean;
}
