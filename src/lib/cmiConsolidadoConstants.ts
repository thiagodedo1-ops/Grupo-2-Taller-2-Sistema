/**
 * @file cmiConsolidadoConstants.ts
 * @description Catálogo de los 12 Indicadores Estratégicos Consolidados para el CMI General
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 * Identificación de Metas: META PROVISIONAL – PENDIENTE DE APROBACIÓN
 */

import { MetaIndicadorCMI } from '../types/cmi';

export interface MetaIndicadorConsolidadoCMI extends MetaIndicadorCMI {
  calculoExplicacion: string;
  umbralVerde: string;
  umbralAmarillo: string;
  umbralRojo: string;
  coberturaDatos: string;
  estadoAprobacion: string; // 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
}

export const METAS_INICIALES_CONSOLIDADO: MetaIndicadorConsolidadoCMI[] = [
  // ==========================================
  // 1. PERSPECTIVA FINANCIERA (5 Indicadores)
  // ==========================================
  {
    id: 'GF1',
    codigo: 'GF1',
    nombre: 'Ingresos Ganaderos Consolidados',
    perspectiva: 'FINANCIERA',
    esPrioritario: true,
    meta: 85000000,
    metaTexto: '>= $85.000.000 /año (PROVISIONAL)',
    unidad: 'ARS',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Campaña 2024/2025',
    responsable: 'Dirección General / FCE UNRC',
    descripcion: 'Suma de ingresos por ventas externas reconocidas a terceros de Porcinos, Bovinos y Ovinos.',
    accionDesvio: 'Revisar estrategias comerciales por especie y momentos óptimos de salida.',
    calculoExplicacion: 'Ventas Porcinas + Ventas Bovinas + Ventas Ovinas Carne (Sin transferencias internas)',
    umbralVerde: '>= $85.000.000',
    umbralAmarillo: '$70.000.000 - $84.999.999',
    umbralRojo: '< $70.000.000',
    coberturaDatos: '100% - Coincidencia exacta con Estado de Resultados',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },
  {
    id: 'GF2',
    codigo: 'GF2',
    nombre: 'Costos Directos Consolidados',
    perspectiva: 'FINANCIERA',
    esPrioritario: true,
    meta: 42000000,
    metaTexto: '<= $42.000.000 /año (PROVISIONAL)',
    unidad: 'ARS',
    direccion: 'MENOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Campaña 2024/2025',
    responsable: 'Administración Ganadera Consolidada',
    descripcion: 'Costos directos reconocidos de las tres unidades con terceros (compras de insumos externas + comercialización + fletes).',
    accionDesvio: 'Calibrar la dieta con maíz propio producido en establecimiento para reducir compras externas.',
    calculoExplicacion: 'Compras Directas Ext. Porcinos + Bovinos + Ovinos + Gastos Comercialización',
    umbralVerde: '<= $42.000.000',
    umbralAmarillo: '$42.000.001 - $48.000.000',
    umbralRojo: '> $48.000.000',
    coberturaDatos: '100% - Coincidencia exacta con Estado de Resultados',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },
  {
    id: 'GF3',
    codigo: 'GF3',
    nombre: 'Margen Bruto Consolidado',
    perspectiva: 'FINANCIERA',
    esPrioritario: true,
    meta: 43000000,
    metaTexto: '>= $43.000.000 /año (PROVISIONAL)',
    unidad: 'ARS',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Campaña 2024/2025',
    responsable: 'Comité de Gestión UNRC',
    descripcion: 'Resultado económico directo consolidado de las tres producciones ganaderas.',
    accionDesvio: 'Auditar márgenes por especie e identificar unidades con menor contribución relativa.',
    calculoExplicacion: 'GF1 (Ingresos Consolidados) − GF2 (Costos Directos Consolidados)',
    umbralVerde: '>= $43.000.000',
    umbralAmarillo: '$32.000.000 - $42.999.999',
    umbralRojo: '< $32.000.000',
    coberturaDatos: '100% - Coincidencia exacta con Estado de Resultados',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },
  {
    id: 'GF4',
    codigo: 'GF4',
    nombre: 'Margen Bruto sobre Costos Directos',
    perspectiva: 'FINANCIERA',
    esPrioritario: true,
    meta: 100.0,
    metaTexto: '>= 100.0% (PROVISIONAL)',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Anual',
    responsable: 'Dirección Económica UNRC',
    descripcion: 'Rentabilidad directa consolidada sobre los egresos directos del establecimiento.',
    accionDesvio: 'Ajustar la relación insumo-producto y controlar gastos de comercialización.',
    calculoExplicacion: '(GF3 / GF2) × 100 (Cociente global del establecimiento)',
    umbralVerde: '>= 100.0%',
    umbralAmarillo: '75.0% - 99.9%',
    umbralRojo: '< 75.0%',
    coberturaDatos: '100% - Recalculado directamente sobre totales',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },
  {
    id: 'GF5',
    codigo: 'GF5',
    nombre: 'Desvío Presupuestario Global',
    perspectiva: 'FINANCIERA',
    esPrioritario: false,
    meta: 0,
    metaTexto: 'Comparativo vs Presupuesto Aprobado (PROVISIONAL)',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Campaña 2024/2025',
    responsable: 'Administración Presupuestaria',
    descripcion: 'Desvío porcentual del Margen Bruto Real respecto del Margen Bruto Presupuestado Aprobado en registros.',
    accionDesvio: 'Revisar supuestos de precios y cantidades previstas en las partidas presupuestarias.',
    calculoExplicacion: '((Margen Real − Margen Presupuestado Aprobado) / |Margen Presupuestado|) × 100',
    umbralVerde: '>= 0.0%',
    umbralAmarillo: '-10.0% - -0.1%',
    umbralRojo: '< -10.0%',
    coberturaDatos: 'Depende de la disponibilidad de presupuesto aprobado en registros',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },

  // ==========================================
  // 2. PERSPECTIVA CLIENTES Y COMERCIAL (2 Indicadores)
  // ==========================================
  {
    id: 'GC1',
    codigo: 'GC1',
    nombre: 'Clientes Externos Activos',
    perspectiva: 'CLIENTES',
    esPrioritario: true,
    meta: 6,
    metaTexto: '>= 6 clientes activos (PROVISIONAL)',
    unidad: 'clientes',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Campaña',
    responsable: 'Comercialización Consolidada',
    descripcion: 'Cantidad de clientes externos únicos con ventas confirmadas en cualquiera de las 3 unidades sin duplicación.',
    accionDesvio: 'Desarrollar nuevos canales de comercialización directos con frigoríficos y consignatarias.',
    calculoExplicacion: 'Conteo único de CUIT/Razones Sociales en ventas de Porcinos, Bovinos y Ovinos',
    umbralVerde: '>= 6 clientes',
    umbralAmarillo: '4 - 5 clientes',
    umbralRojo: '< 4 clientes',
    coberturaDatos: '100% - Registro unificado de clientes',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },
  {
    id: 'GC2',
    codigo: 'GC2',
    nombre: 'Cumplimiento de Entregas Comerciales',
    perspectiva: 'CLIENTES',
    esPrioritario: false,
    meta: null,
    metaTexto: 'Pendiente de instrumentación',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Por Venta',
    responsable: 'Logística y Comercialización',
    descripcion: 'Porcentaje de entregas cumplidas conforme a compromisos comerciales pactados. (Diferenciado de la validez legal del DTE SENASA).',
    accionDesvio: 'Instrumentar el módulo de compromisos comerciales y fechas pactadas de despacho.',
    calculoExplicacion: '(Entregas Cumplidas en Fecha Pactada / Compromisos Comerciales) × 100',
    umbralVerde: '>= 95.0%',
    umbralAmarillo: '85.0% - 94.9%',
    umbralRojo: '< 85.0%',
    coberturaDatos: 'Pendiente de instrumentación de compromisos pactados',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },

  // ==========================================
  // 3. PERSPECTIVA PROCESOS INTERNOS (3 Indicadores)
  // ==========================================
  {
    id: 'GP1',
    codigo: 'GP1',
    nombre: 'Integridad de Registros Operativos',
    perspectiva: 'PROCESOS',
    esPrioritario: true,
    meta: 95.0,
    metaTexto: '>= 95.0% registros OK (PROVISIONAL)',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Permanente',
    responsable: 'Auditoría y Sistemas UNRC',
    descripcion: 'Porcentaje de registros transaccionales evaluados en las 3 unidades que no presentan la marca "Observado".',
    accionDesvio: 'Capacitar a operarios de campo en carga obligatoria de campos críticos.',
    calculoExplicacion: '(Registros con Estado Validacion OK / Registros Totales Evaluables) × 100',
    umbralVerde: '>= 95.0%',
    umbralAmarillo: '85.0% - 94.9%',
    umbralRojo: '< 85.0%',
    coberturaDatos: '100% - Módulo de Auditoría y Trazabilidad',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },
  {
    id: 'GP2',
    codigo: 'GP2',
    nombre: 'Cumplimiento del Plan Sanitario',
    perspectiva: 'PROCESOS',
    esPrioritario: true,
    meta: 100.0,
    metaTexto: '100% actividades cumplidas (PROVISIONAL)',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Anual',
    responsable: 'Médicos Veterinarios Responsables',
    descripcion: 'Porcentaje de actividades sanitarias programadas efectivamente cumplidas según protocolos oficiales SENASA en las 3 producciones.',
    accionDesvio: 'Coordinar con entes sanitarios locales la pronta ejecución de actas de vacunación y tratamientos.',
    calculoExplicacion: '(Eventos Sanitarios Cumplidos / Eventos Sanitarios Programados) × 100',
    umbralVerde: '100.0%',
    umbralAmarillo: '90.0% - 99.9%',
    umbralRojo: '< 90.0%',
    coberturaDatos: '100% - Libretas Sanitarias por Especie',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },
  {
    id: 'GP3',
    codigo: 'GP3',
    nombre: 'Distribución de Maíz Propio a Unidades Ganaderas',
    perspectiva: 'PROCESOS',
    esPrioritario: false,
    meta: 75.0,
    metaTexto: '>= 75.0% distribuido (PROVISIONAL)',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Campaña',
    responsable: 'Encargado Agrícola-Ganadero',
    descripcion: 'Distribución/asignación física de maíz propio producido hacia las 3 unidades ganaderas sobre el volumen cosechado disponible. (No representa eficiencia alimenticia por falta de registros de comederos).',
    accionDesvio: 'Planificar la capacidad de ensilado y silos de planta para abastecer las raciones ganaderas.',
    calculoExplicacion: '(Kg Maíz Distribuido a Ganadería / Kg Maíz Disponible en Silos) × 100',
    umbralVerde: '>= 75.0%',
    umbralAmarillo: '60.0% - 74.9%',
    umbralRojo: '< 60.0%',
    coberturaDatos: '100% - Módulo de Transferencias de Granos (Asignación Física)',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },

  // ==========================================
  // 4. PERSPECTIVA APRENDIZAJE Y CRECIMIENTO (2 Indicadores)
  // ==========================================
  {
    id: 'GA1',
    codigo: 'GA1',
    nombre: 'Cumplimiento del Plan de Capacitación',
    perspectiva: 'APRENDIZAJE',
    esPrioritario: false,
    meta: null,
    metaTexto: 'Pendiente de instrumentación',
    unidad: '%',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Anual',
    responsable: 'Recursos Humanos y Capacitación',
    descripcion: 'Porcentaje de jornadas de capacitación laboral y bioseguridad completadas sobre las programadas para el personal ganadero.',
    accionDesvio: 'Instrumentar el calendario formal de capacitaciones del establecimiento.',
    calculoExplicacion: '(Jornadas Completadas / Jornadas Programadas) × 100',
    umbralVerde: '>= 90.0%',
    umbralAmarillo: '75.0% - 89.9%',
    umbralRojo: '< 75.0%',
    coberturaDatos: 'Pendiente de cronograma documentado',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  },
  {
    id: 'GA2',
    codigo: 'GA2',
    nombre: 'Actividades Académicas y de Extensión',
    perspectiva: 'APRENDIZAJE',
    esPrioritario: true,
    meta: 12,
    metaTexto: '>= 12 actividades /año (PROVISIONAL)',
    unidad: 'actividades',
    direccion: 'MAYOR_MEJOR',
    fechaVigencia: '2025-01-01',
    periodoAplicable: 'Anual',
    responsable: 'Extensión y Docencia FCE / UNRC',
    descripcion: 'Cantidad de visitas estudiantiles, prácticas docentes y actividades de extensión efectivamente realizadas en el campo.',
    accionDesvio: 'Coordinar con cátedras de la UNRC visitas técnicas organizadas a las unidades productivas.',
    calculoExplicacion: 'Conteo único de Visitas Estudiantiles registradas en el libro de extensión',
    umbralVerde: '>= 12 actividades',
    umbralAmarillo: '8 - 11 actividades',
    umbralRojo: '< 8 actividades',
    coberturaDatos: '100% - Libro de Visitas Estudiantiles UNRC',
    estadoAprobacion: 'META PROVISIONAL – PENDIENTE DE APROBACIÓN'
  }
];
