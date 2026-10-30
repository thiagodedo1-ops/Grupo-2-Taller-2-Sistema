/**
 * @file multiUnitManualData.ts
 * @description Manual técnico y tutoriales interactivos para Bovinos, Ovinos y Modo Consolidado
 * Establecimiento Didáctico-Productivo Pozo del Carril · La Aguada (UNRC)
 */

export interface ManualCapitulo {
  id: string;
  num: string;
  titulo: string;
  icono?: any;
  tags: string[];
  resumen: string;
  secciones: {
    subtitulo: string;
    parrafos: string[];
    puntosClave?: string[];
    tabla?: { columnas: string[]; filas: string[][] };
    formulas?: { nombre: string; formula: string; explicacion: string }[];
    alerta?: string;
  }[];
}

export interface TutorialGrafico {
  id: string;
  label: string;
  icon?: any;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  etapas: {
    id: string;
    num: string;
    nombre: string;
    sub: string;
    duracion: string;
    color?: string;
    badge: string;
    objetivo: string;
    descripcion: string;
    parametrosClave?: { label: string; valor: string; detalle: string }[];
    tareasOperativas?: string[];
    reglasControl?: string[];
  }[];
  buenasPracticas: { titulo: string; desc: string }[];
  puntosAuditoria: string[];
}

/* =========================================================================================
 * 1. UNIDAD BOVINA (RODEO ANGUS CABAÑA Y COMERCIAL - POZO DEL CARRIL UNRC)
 * ========================================================================================= */

export const BOVINO_TUTORIALES: TutorialGrafico[] = [
  {
    id: 'bov-tut-cria',
    label: '1. Ciclo Reproductivo & Cría Angus',
    titulo: 'Manejo Reproductivo: Estacionalidad, Tacto Rectal y Parición',
    subtitulo: 'Flujo zootécnico del rodeo de cría y cabaña Angus sobre pasturas de alfalfa',
    descripcion: 'Protocolo de manejo integral de los vientres Angus: servicio estacionado en primavera-verano, ecografía y tacto rectal a los 60 días, cuidados de preparto en piquetes limpios y atención de terneros al pie de la madre.',
    etapas: [
      {
        id: 'bov-e1',
        num: '1',
        nombre: 'Servicio Estacionado',
        sub: 'Monta natural y rotación',
        duracion: '90 días (Oct-Dic)',
        color: 'border-amber-200 bg-amber-50/50 text-amber-900',
        badge: 'Toros al 3-4%',
        objetivo: 'Concentrar la preñez en el primer tercio del servicio (cabeza de parición).',
        descripcion: 'Asignación de toros Angus Puro Registrado evaluados por circunferencia escrotal (≥ 34 cm) y raspaje prepucial negativo para tricomoniasis y campylobacteriosis.',
        parametrosClave: [
          { label: 'Relación Toro/Vientre', valor: '3.0% a 4.0%', detalle: '3 a 4 toros cada 100 vacas en servicio' },
          { label: 'Condición Corporal (CC)', valor: '≥ 3.0 (Escala 1-5)', detalle: 'Óptima fertilidad al inicio de servicio' }
        ],
        tareasOperativas: [
          'Revisión clínica y sanitaria de toros con raspajes oficiales 60 días antes',
          'Distribución de toros por potrero de pastoreo rotativo',
          'Registro de inicio de servicio en módulo Bovinos > Cría'
        ],
        reglasControl: [
          'Exigir certificado libre de venéreas firmado por médico veterinario acreditado SENASA',
          'Controlar aplomos y libido semanalmente en el campo'
        ]
      },
      {
        id: 'bov-e2',
        num: '2',
        nombre: 'Diagnóstico de Preñez',
        sub: 'Tacto rectal y ecografía',
        duracion: '60 d post-servicio',
        color: 'border-blue-200 bg-blue-50/50 text-blue-900',
        badge: 'Meta Preñez ≥ 92%',
        objetivo: 'Determinar vientres preñados y clasificar por tercio de preñez.',
        descripcion: 'Revisión en manga de todo el rodeo. Separación inmediata de vientres vacíos para engorde comercial o descarte productivo sin consumo improductivo de forraje.',
        parametrosClave: [
          { label: 'Meta Preñez Rodeo', valor: '≥ 92.0%', detalle: 'Indicador crítico del CMI Bovino' },
          { label: 'Pérdida Tacto-Parición', valor: '< 3.0%', detalle: 'Tolerancia máxima de mermas biológicas' }
        ],
        tareasOperativas: [
          'Pasaje por manga de raspaje y balanza',
          'Clasificación por ecografía: Cabeza (1er mes), Cuerpo (2do mes) y Cola (3er mes)',
          'Apartado de hembras vacías con caravana de destino a corral'
        ],
        reglasControl: [
          'Registrar el tacto en el sistema dentro de las 48 horas post-manga',
          'Vientres vacíos con 2 servicios fallidos pasan automáticamente a descarte'
        ]
      },
      {
        id: 'bov-e3',
        num: '3',
        nombre: 'Parición & Nacimientos',
        sub: 'Piquete de maternidad',
        duracion: 'Julio a Septiembre',
        color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
        badge: '≥ 95% nacidos vivos',
        objetivo: 'Minimizar distocias y asegurar el consumo oportuno de calostro.',
        descripcion: 'Recorrida diaria matutina y vespertina de los piquetes de parición con pasto tierno y agua de calidad para asistir partos difíciles y verificar vigor neonatal.',
        parametrosClave: [
          { label: 'Peso al Nacer Angus', valor: '30 - 34 kg', detalle: 'Bajo peso para facilidad de parto' },
          { label: 'Calostrado', valor: '< 6 horas de vida', detalle: 'Inmunidad pasiva fundamental' }
        ],
        tareasOperativas: [
          'Caravaneo con dispositivo oficial SENASA y caravana visual de campo',
          'Desinfección de ombligo con tintura de yodo al 10%',
          'Registro de fecha, caravana de la madre, sexo y peso al nacer'
        ],
        reglasControl: [
          'Todo ternero debe recibir calostro de su madre antes de las 6 horas de nacido',
          'En caso de distocia prolongada (> 2 hs de esfuerzo), intervenir con medidas obstétricas asépticas'
        ]
      },
      {
        id: 'bov-e4',
        num: '4',
        nombre: 'Destete Tradicional',
        sub: 'Separación y pesada manga',
        duracion: 'Día 180 a 210',
        color: 'border-purple-200 bg-purple-50/50 text-purple-900',
        badge: 'Peso ≥ 175-190 kg',
        objetivo: 'Interrumpir la lactancia para recuperar condición corporal del vientre antes del invierno.',
        descripcion: 'Pesada individual en balanza electrónica de manga, vacunación contra clostridiosis, desparasitación estratégica y pase del ternero a la recría pastoril.',
        parametrosClave: [
          { label: 'Porcentaje de Destete', valor: '≥ 85.0%', detalle: 'Terneros destetados / Vacas entoradas' },
          { label: 'Peso Ajustado a 205 d', valor: '≥ 180 kg', detalle: 'Potencial genético Angus UNRC' }
        ],
        tareasOperativas: [
          'Pesaje individual por manga y registro en módulo Pesadas',
          'Aplicación de plan sanitario de destete (Clostridiosis, Neumonías, Mancha)',
          'Asignación a potrero de recría con buena oferta forrajera'
        ],
        reglasControl: [
          'El balance de masa debe verificar: Terneros Destetados = Terneros Nacidos - Bajas registradas',
          'Destete precoz obligatorio en vacas con CC < 2.5'
        ]
      }
    ],
    buenasPracticas: [
      { titulo: 'Manejo Sin Estrés en Manga', desc: 'No utilizar picanas ni perros; respetar el punto de balance del animal y curvas de manga ciegas.' },
      { titulo: 'Nutrición en Maternidad', desc: 'Asegurar oferta forrajera de al menos 12 kg MS/vaca/día en el último tercio de gestación.' },
      { titulo: 'Sanidad de Raspajes', desc: 'Dos raspajes negativos consecutivos en toros antes de ingresar a servicio.' }
    ],
    puntosAuditoria: [
      'Conciliación exacta de cabezas nacidas versus caravanas asignadas en SENASA',
      'Verificación del porcentaje de preñez contrastado contra informe veterinario de tacto',
      'Control de mortandad neonatal no superior al 4% del total de partos'
    ]
  },
  {
    id: 'bov-tut-manga',
    label: '2. Manejo de Manga, Pesadas & ADPV',
    titulo: 'Control Ponderal Periódico y Ganancia Diaria de Peso',
    subtitulo: 'Protocolo de balanza de manga, caravaneo SENASA y seguimiento del ADPV',
    descripcion: 'Paso a paso para la captura de pesadas seriadas en balanza electrónica de manga, cálculo automático del Aumento Diario de Peso Vivo (ADPV en kg/día) y detección precoz de baches nutricionales.',
    etapas: [
      {
        id: 'bov-m1',
        num: '1',
        nombre: 'Calibración de Balanza',
        sub: 'Inspección de celdas de carga',
        duracion: '15 min pre-pesaje',
        color: 'border-slate-200 bg-slate-50 text-slate-900',
        badge: 'Cero Balanza ± 0.5 kg',
        objetivo: 'Asegurar precisión milimétrica en la medición de masa muscular.',
        descripcion: 'Limpieza de barro acumulado debajo de la plataforma, verificación de nivel y contraste con peso patrón.',
        parametrosClave: [
          { label: 'Tolerancia de Calibración', valor: '± 0.5 kg', detalle: 'Desvío máximo admisible' },
          { label: 'Estado Celdas de Carga', valor: '100% calibradas', detalle: 'Verificación de cableado y sensor' }
        ],
        tareasOperativas: [
          'Encendido y puesta a cero (tara) del indicador digital',
          'Prueba con operario de peso conocido',
          'Comprobación de trabas de seguridad de la guillotina'
        ],
        reglasControl: [
          'No iniciar el pasaje de animales si la balanza muestra oscilaciones mayores a 1 kg en vacío',
          'Anotar número de lote y potrero de procedencia antes del primer pesaje'
        ]
      },
      {
        id: 'bov-m2',
        num: '2',
        nombre: 'Pasaje y Lectura SENASA',
        sub: 'Identificación individual',
        duracion: '1 min por animal',
        color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        badge: 'Doble Caravana',
        objetivo: 'Vincular el peso exacto a la historia clínica y zootécnica de cada bovino.',
        descripcion: 'Entrada individual al cepo, inmovilización segura sin estrangular, lectura del botón electrónico/visual y registro del peso estabilizado.',
        parametrosClave: [
          { label: 'Tiempo de Inmovilización', valor: '< 45 segundos', detalle: 'Bienestar animal y menor estrés' },
          { label: 'Estabilidad de Lectura', valor: 'Fija en monitor', detalle: 'Esperar indicador OK de la balanza' }
        ],
        tareasOperativas: [
          'Lectura de caravana visual y chip RFID SENASA',
          'Inspección rápida de ojos (queratoconjuntivitis), pezuñas y pelaje',
          'Registro del peso en el módulo Pesadas Bovinas'
        ],
        reglasControl: [
          'Prohibido el uso de picana eléctrica en la manga de compresión',
          'Si un animal pierde la caravana, aplicar re-identificación inmediata con acta oficial'
        ]
      },
      {
        id: 'bov-m3',
        num: '3',
        nombre: 'Cálculo de ADPV y Desvíos',
        sub: 'Procesamiento en software',
        duracion: 'Inmediato post-pesaje',
        color: 'border-blue-200 bg-blue-50 text-blue-900',
        badge: 'ADPV = Δkg / Δdías',
        objetivo: 'Determinar la ganancia media diaria y contrastar contra la meta zootécnica.',
        descripcion: 'El sistema calcula automáticamente la diferencia de kilos respecto a la pesada anterior dividida por los días transcurridos.',
        parametrosClave: [
          { label: 'Meta ADPV Recría Pastoril', valor: '≥ 0.650 kg/día', detalle: 'Sobre pasturas consociadas' },
          { label: 'Meta ADPV Feedlot', valor: '≥ 1.150 kg/día', detalle: 'Terminación con maíz y silo propio' }
        ],
        tareasOperativas: [
          'Cierre del lote de pesada en el sistema',
          'Generación de informe de distribución de pesos (curva de campana)',
          'Alerta inmediata sobre animales con ganancia nula o negativa'
        ],
        reglasControl: [
          'Animales con ADPV < 0.200 kg/día deben ser derivados a inspección veterinaria (parasitosis o neumonía)',
          'El lote debe reagruparse si el coeficiente de variación de peso supera el 15%'
        ]
      }
    ],
    buenasPracticas: [
      { titulo: 'Desbaste de Manga', desc: 'Pesar siempre en el mismo horario (preferentemente a primera hora de la mañana) para evitar distorsiones por llenado de rumen.' },
      { titulo: 'Pisos Antideslizantes', desc: 'Mantenimiento del piso de goma o listones de madera para evitar caídas y hematomas en res.' }
    ],
    puntosAuditoria: [
      'Trazabilidad correlativa de pesadas sin saltos temporales ilógicos',
      'Validación de fecha de pesada contra fecha de movimiento de potreros',
      'Auditoría de consistencia entre kilos registrados y raciones forrajeras suministradas'
    ]
  },
  {
    id: 'bov-tut-comercial',
    label: '3. Comercialización & Liquidación MAG',
    titulo: 'Despacho a Faena, Precios MAG Cañuelas y Desbaste',
    subtitulo: 'Circuito comercial de hacienda en pie, DTE SENASA y cálculo del neto liquidado',
    descripcion: 'Paso a paso para la confección del despacho comercial de novillos y vaquillonas: cotización oficial de referencia MAG Cañuelas, aplicación del 3% de desbaste por flete, gastos de comercialización y liquidación neta.',
    etapas: [
      {
        id: 'bov-c1',
        num: '1',
        nombre: 'Selección de Tropa y Pesaje Bruto',
        sub: 'Apartado de capones/novillos terminados',
        duracion: 'Día de carga',
        color: 'border-amber-200 bg-amber-50 text-amber-900',
        badge: '380 - 420 kg vivo',
        objetivo: 'Conformar una tropa homogénea con terminación grasa grado 2 (óptima comercial).',
        descripcion: 'Pesaje de la tropa en balanza de estancia para determinar los kilos brutos de salida antes del encierre.',
        parametrosClave: [
          { label: 'Peso Meta Novillo Consumo', valor: '390 - 410 kg', detalle: 'Conformación carnicera superior' },
          { label: 'Homogeneidad de Tropa', valor: 'Desvío < 8%', detalle: 'Mejor precio de remate o faena' }
        ],
        tareasOperativas: [
          'Apartado en corrales de embarque con sombra y agua limpia',
          'Control de caravanas contra DTE SENASA emitido',
          'Inspección previa al embarque según normas de bienestar animal'
        ],
        reglasControl: [
          'Tiempo máximo de espera en corral antes del camión: 12 horas con ayuno de sólidos',
          'Camión jaula habilitado por SENASA con piso enrejado o paja'
        ]
      },
      {
        id: 'bov-c2',
        num: '2',
        nombre: 'Aplicación de Desbaste y Flete',
        sub: 'Deducciones reglamentarias',
        duracion: 'En viaje / Destino',
        color: 'border-blue-200 bg-blue-50 text-blue-900',
        badge: 'Desbaste Oficial 3.0%',
        objetivo: 'Computar con exactitud la merma de peso por transporte hacia balanza de destino.',
        descripcion: 'El peso neto liquidado resulta de descontar el porcentaje de desbaste acordado en contrato sobre los kilos brutos en pie.',
        parametrosClave: [
          { label: 'Desbaste Estándar', valor: '3.0%', detalle: 'Flete corta/media distancia (< 300 km)' },
          { label: 'Fórmula Kilos Netos', valor: 'Kg Brutos × 0.97', detalle: 'Base de facturación' }
        ],
        tareasOperativas: [
          'Cálculo de kilos netos a liquidar en el formulario de ventas',
          'Imputación del costo del flete por km/jaula',
          'Archivo del remito de balanza de destino'
        ],
        reglasControl: [
          'Si el desbaste real supera el 4.5%, elevar informe de auditoría por demoras excesivas en viaje',
          'Registrar el transportista con CUIT y habilitación SENASA vigente'
        ]
      },
      {
        id: 'bov-c3',
        num: '3',
        nombre: 'Liquidación Comercial MAG Cañuelas',
        sub: 'Precio y gastos comerciales',
        duracion: 'Cierre de operación',
        color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        badge: 'Importe Neto Liquidado',
        objetivo: 'Registrar el ingreso formal y dar de baja las existencias del inventario biológico.',
        descripcion: 'Contraste del precio pactado contra la cotización del día en el Mercado Agroganadero de Cañuelas y cálculo de retenciones impositivas y comisiones.',
        parametrosClave: [
          { label: 'Precio Referencia MAG', valor: '$/kg según categoría', detalle: 'Novillo / Vaquillona / Vaca' },
          { label: 'Gastos de Comercialización', valor: 'Guías + DTA + Comisión', detalle: 'Deducción del valor bruto' }
        ],
        tareasOperativas: [
          'Carga de comprobante de venta en módulo Bovinos > Ventas',
          'Imputación a la cuenta contable "Ventas de Hacienda Bovina"',
          'Baja automática de cabezas y kilos en el balance de stock físico'
        ],
        reglasControl: [
          'Todo comprobante de venta debe contar con número de DTE y CUIT del comprador',
          'El precio pactado no debe presentar un desvío negativo mayor al 10% respecto a la pizarra MAG del día sin justificación técnica'
        ]
      }
    ],
    buenasPracticas: [
      { titulo: 'Horarios de Carga', desc: 'Cargar hacienda en horas frescas (madrugada o atardecer) para reducir el estrés calórico y desbaste.' },
      { titulo: 'Trazabilidad Ininterrumpida', desc: 'Verificar coincidencia del 100% de caravanas con el DTE oficial antes de precintar la jaula.' }
    ],
    puntosAuditoria: [
      'Baja simultánea e inmutable en el módulo de Stock Físico Bovino',
      'Registro del ingreso neto en el Estado de Resultados y Cuadro de Mando Integral',
      'Conciliación de comisiones y fletes contra facturas de proveedores de servicios'
    ]
  }
];

export const BOVINO_CAPITULOS: ManualCapitulo[] = [
  {
    id: 'bov-cap-1',
    num: '1',
    titulo: 'Fundamentos Zootécnicos del Rodeo Angus',
    tags: ['bovinos', 'angus', 'cabaña', 'rodeo comercial', 'pozo del carril', 'unrc'],
    resumen: 'Estructura organizativa, objetivos de selección genética y caracterización del rodeo vacuno en el establecimiento Pozo del Carril.',
    secciones: [
      {
        subtitulo: '1.1. Misión del Rodeo Bovino en Pozo del Carril',
        parrafos: [
          'La Unidad de Producción Bovina del establecimiento didáctico-productivo Pozo del Carril · La Aguada (UNRC) tiene como propósito central la cría, recría y terminación de ganado vacuno de carne de raza Aberdeen Angus, tanto en su variedad Negra como Colorada.',
          'El rodeo se compone de dos núcleos interdependientes: el Rodeo de Cabaña (reproductores Puro Registrado con destino a reposición propia y venta de toros a productores de la región) y el Rodeo Comercial (orientado a la producción eficiente de novillos pesados y vaquillonas para consumo interno y faena comercial).'
        ],
        puntosClave: [
          'Genética Angus rústica y adaptada a la región semiárida centro-sur de Córdoba',
          'Enfoque de doble propósito: rentabilidad agropecuaria y formación práctica de estudiantes de Agronomía, Veterinaria y Ciencias Económicas',
          'Producción de carne con base pastoril y terminación a corral con maíz de producción propia'
        ]
      },
      {
        subtitulo: '1.2. Metas Productivas e Índices Zootécnicos Clave',
        parrafos: [
          'Para sostener la sustentabilidad económica del planteo, el establecimiento opera bajo metas cuantitativas estrictas que se contrastan mensualmente en el Cuadro de Mando Integral (CMI Bovino).'
        ],
        tabla: {
          columnas: ['Indicador Zootécnico', 'Meta Pozo del Carril', 'Rango Aceptable', 'Impacto en el Negocio'],
          filas: [
            ['Porcentaje de Preñez', '≥ 92.0%', '88% - 94%', 'Eficiencia del rodeo de cría y costo del ternero'],
            ['Porcentaje de Destete', '≥ 85.0%', '82% - 88%', 'Cabezas efectivas disponibles para recría'],
            ['ADPV Recría Pastoril', '≥ 0.650 kg/día', '0.550 - 0.750 kg/d', 'Duración del ciclo y carga animal'],
            ['ADPV Terminación Feedlot', '≥ 1.150 kg/día', '1.050 - 1.300 kg/d', 'Costo de alimentación y grasa comercial'],
            ['Desbaste a Destino', '≤ 3.0%', '2.5% - 3.5%', 'Merma de transporte y liquidación neta']
          ]
        }
      }
    ]
  },
  {
    id: 'bov-cap-2',
    num: '2',
    titulo: 'Sanidad Oficial SENASA y Planes de Control',
    tags: ['sanidad', 'senasa', 'aftosa', 'brucelosis', 'carbunclo', 'vacunacion'],
    resumen: 'Calendario sanitario obligatorio, control de enfermedades venéreas y auditoría de tratamientos en el rodeo vacuno.',
    secciones: [
      {
        subtitulo: '2.1. Planes Sanitarios Oficiales Obligatorios',
        parrafos: [
          'El rodeo se encuentra bajo estricto control de SENASA. Se ejecutan con carácter indelegable las campañas de vacunación antiaftosa (dos campañas anuales en menores y una en adultos según cronograma regional) y la inmunización contra Carbunclo Bacteridiano en la totalidad de los vientres y toros.',
          'En materia de brucelosis bovina, se cumple con el Plan Nacional de Control y Erradicación mediante la vacunación de terneras con cepa 19 entre los 3 y 8 meses de edad, garantizando el estatus de Establecimiento Oficialmente Libre.'
        ],
        puntosClave: [
          'Vacunación Antiaftosa semestral coordinada con el ente de vacunación Río Cuarto',
          'Vacunación obligatoria contra Carbunclo Bacteridiano previa a la primavera',
          'Serología negativa de brucelosis y tuberculinización periódica en Cabaña'
        ],
        alerta: 'Queda terminantemente prohibido el movimiento de hacienda sin DTE emitido y con certificados de vacunación pendientes en el sistema de SENASA.'
      },
      {
        subtitulo: '2.2. Costo Sanitario por Cabeza y Fórmulas',
        parrafos: [
          'Todos los insumos veterinarios (vacunas, antiparasitarios, reconstituyentes vitamínicos y antibióticos) se compran a través del módulo de Compras e imputan al costo directo de la subunidad receptora.'
        ],
        formulas: [
          {
            nombre: 'Costo Sanitario Unitario Bovino',
            formula: 'Costo Sanitario ($/cab) = Total Insumos Veterinarios Devengados ($) / Cabezas Promedio en Rodeo',
            explicacion: 'Mide la incidencia del plan sanitario sobre cada animal del inventario; meta: ≤ 3.5% del costo operativo directo total.'
          }
        ]
      }
    ]
  },
  {
    id: 'bov-cap-3',
    num: '3',
    titulo: 'Nutrición, Balance Forrajero y Manejo de Pasturas',
    tags: ['nutricion', 'pasturas', 'alfalfa', 'equivalente vaca', 'maiz', 'suplementacion'],
    resumen: 'Requerimientos energéticos y proteicos en pastoreo rotativo, cálculo de carga animal (EV/ha) y suplementación estratégica con grano propio.',
    secciones: [
      {
        subtitulo: '3.1. Cadena Forrajera de Pozo del Carril',
        parrafos: [
          'La base forrajera del establecimiento está constituida por pasturas polifíticas consociadas con base de Alfalfa (Medicago sativa) combinada con Festuca y Cebadilla criolla, complementadas con verdeos de invierno (avena y centeno) y rastrojos de maíz cosechado.',
          'La presupuestación forrajera se realiza mediante el concepto zootécnico de Equivalente Vaca (EV), definiendo 1 EV como el requerimiento promedio de una vaca de 400 kg que cría un ternero hasta el destete (consumo aproximado de 18.5 Mcal EM/día).'
        ],
        tabla: {
          columnas: ['Categoría Bovina', 'Peso Promedio', 'Factor Equivalente Vaca (EV)', 'Consumo Diario MS (kg)'],
          filas: [
            ['Vaca de Cría con Ternero', '420 kg', '1.00 EV', '10.5 - 11.5 kg MS'],
            ['Vaquillona de Reposición (1-2 años)', '280 kg', '0.70 EV', '7.0 - 8.0 kg MS'],
            ['Ternero al Pie (último tercio)', '130 kg', '0.35 EV', '3.5 - 4.0 kg MS'],
            ['Novillo en Recría Pastoril', '320 kg', '0.80 EV', '8.0 - 9.0 kg MS'],
            ['Toro Angus en Servicio', '750 kg', '1.50 EV', '15.0 - 17.0 kg MS']
          ]
        }
      },
      {
        subtitulo: '3.2. Carga Animal y Fórmula de Ajuste Forrajero',
        parrafos: [
          'El control mensual de la carga animal previene el sobrepastoreo y asegura la persistencia de las alfalfas durante al menos 4 temporadas productivas.'
        ],
        formulas: [
          {
            nombre: 'Carga Animal Global en Equivalente Vaca',
            formula: 'Carga Animal (EV/ha) = Σ (Cabezas por Categoría × Factor EV) / Hectáreas Forrajeras Totales',
            explicacion: 'Meta de Pozo del Carril: 1.10 a 1.35 EV/ha en rotativo sobre alfalfas de primer nivel.'
          }
        ]
      }
    ]
  },
  {
    id: 'bov-cap-4',
    num: '4',
    titulo: 'Comercialización Bovina y Liquidación MAG Cañuelas',
    tags: ['comercializacion', 'mag', 'cañuelas', 'desbaste', 'dte', 'liquidaciones'],
    resumen: 'Pautas de comercialización de novillos y vaquillonas, precios pizarreros de referencia, fletes ganaderos y auditoría contable de la venta.',
    secciones: [
      {
        subtitulo: '4.1. Mercado de Referencia y Fijación de Precios',
        parrafos: [
          'La hacienda en pie comercializada por Pozo del Carril se referencia en las cotizaciones publicadas por el Mercado Agroganadero de Cañuelas (MAG) para las categorías Novillos Especiales (390-430 kg) y Vaquillonas Especiales (350-390 kg).',
          'Las operaciones se liquidan con pago pactado a 15-30 días con compradores frigoríficos habilitados por SENASA y consignatarios de hacienda registrados en el catálogo maestro de Clientes.'
        ],
        puntosClave: [
          'Actualización de precios de pizarra de MAG Cañuelas en el sistema',
          'Aplicación contractual del 3.0% de desbaste sobre el peso en estancia',
          'Imputación a F_Ingresos y conciliación automática con el saldo de cuentas a cobrar'
        ]
      },
      {
        subtitulo: '4.2. Fórmula del Ingreso Neto Liquidado',
        parrafos: [
          'El ingreso que efectivamente percibe el establecimiento se obtiene deduciendo del importe bruto todos los costos comerciales directos.'
        ],
        formulas: [
          {
            nombre: 'Ingreso Neto por Venta de Tropa Bovina',
            formula: 'Ingreso Neto ($) = (Kg Brutos × 0.97 × $/kg MAG) − (Flete Jaula + Guías Municipales + DTA SENASA + Comisión)',
            explicacion: 'Calcula el valor real en tranquera de campo (netback) obtenido por el establecimiento.'
          }
        ]
      }
    ]
  },
  {
    id: 'bov-cap-5',
    num: '5',
    titulo: 'Cuadro de Mando Integral (CMI) Rodeo Bovino',
    tags: ['cmi', 'indicadores', 'bovinos', 'semaforos', 'metas', 'auditoria'],
    resumen: 'Estructura de las 4 perspectivas del CMI Bovino, reglas de semaforización y plan de contingencia ante desvíos biológicos o financieros.',
    secciones: [
      {
        subtitulo: '5.1. Arquitectura de Indicadores Bovinos',
        parrafos: [
          'Al igual que en las unidades Porcina y Ovina, el CMI Bovino estructura el control de gestión en cuatro perspectivas estratégicas vinculadas por relaciones de causa-efecto.',
          'La perspectiva de Aprendizaje sostiene la precisión de pesadas en manga y cargas en 48 hs; los Procesos Internos garantizan alta fertilidad y ADPV; la perspectiva Clientes asegura terminación de calidad para frigorífico; y la perspectiva Financiera maximiza el margen bruto por hectárea ganadera.'
        ],
        tabla: {
          columnas: ['Perspectiva', 'Indicador Crítico', 'Meta Oficial', 'Semáforo Verde', 'Semáforo Rojo'],
          filas: [
            ['Financiera', 'Margen Bruto Bovino ($/ha)', '≥ $320.000 /ha', '≥ Meta', '< 85% de Meta'],
            ['Financiera', 'Costo Directo por Kilo Ganado', '≤ $1.450 /kg', '≤ Meta', '> 115% de Meta'],
            ['Clientes', 'Homogeneidad de Tropa a Faena', '≥ 85% en rango', '≥ 85%', '< 70%'],
            ['Procesos', 'Porcentaje de Preñez al Tacto', '≥ 92.0%', '≥ 92%', '< 87%'],
            ['Procesos', 'ADPV Recría Pastoril', '≥ 0.650 kg/día', '≥ 0.650', '< 0.500 kg/d'],
            ['Aprendizaje', 'Completitud de Pesadas en Manga', '≥ 98.0%', '≥ 98%', '< 90%']
          ]
        }
      }
    ]
  },
  {
    id: 'bov-cap-6',
    num: '6',
    titulo: 'Glosario Bovino y Parámetros Técnicos',
    tags: ['glosario', 'adpv', 'ev', 'cepo', 'senasa', 'manga', 'terminos'],
    resumen: 'Definiciones técnicas estandarizadas y conceptos zootécnicos del sector bovino aplicados a la gestión de Pozo del Carril.',
    secciones: [
      {
        subtitulo: '6.1. Definiciones Zootécnicas',
        parrafos: [
          '• ADPV (Aumento Diario de Peso Vivo): Ganancia de masa muscular y grasa de un bovino expresada en kilogramos por cada día de permanencia en el potrero o corral.',
          '• Equivalente Vaca (EV): Unidad de equivalencia forrajera estándar que representa la demanda energética de una vaca de 400 kg gestando y criando su ternero.',
          '• Tacto Rectal: Palpación diagnóstica realizada por el médico veterinario a los 60 días post-retiro de toros para clasificar el rodeo en vientres preñados y vacíos.',
          '• DTE (Documento de Tránsito Electrónico): Permiso sanitario y comercial obligatorio emitido por SENASA para autorizar cualquier movimiento de hacienda en el territorio nacional.'
        ]
      }
    ]
  }
];

/* =========================================================================================
 * 2. UNIDAD OVINA (MAJADA DORPER CARNICERA - POZO DEL CARRIL UNRC)
 * ========================================================================================= */

export const OVINO_TUTORIALES: TutorialGrafico[] = [
  {
    id: 'ovi-tut-repro',
    label: '1. Encarnerada & Ciclo Reproductivo Dorper',
    titulo: 'Manejo Reproductivo: Flushing, Sincronización y Encarnerada',
    subtitulo: 'Protocolo para maximizar la tasa ovulatoria y prolificidad de la majada Dorper',
    descripcion: 'Paso a paso para la preparación de las ovejas de cría y carneros Dorper puros: suplementación de flushing 3 semanas antes del servicio, relación carnero/oveja al 3-4% y control de celos.',
    etapas: [
      {
        id: 'ovi-e1',
        num: '1',
        nombre: 'Flushing Nutricional',
        sub: 'Suplementación con grano propio',
        duracion: '21 d pre-servicio',
        color: 'border-amber-200 bg-amber-50 text-amber-900',
        badge: '350 g maíz/oveja/d',
        objetivo: 'Incrementar la tasa de ovulación múltiple para favorecer partos melliceros.',
        descripcion: 'Aporte de energía concentrada con maíz de propia producción sobre pasturas de alfalfa de alta digestibilidad.',
        parametrosClave: [
          { label: 'Condición Corporal (CC)', valor: 'Meta 3.0 a 3.5', detalle: 'Escala ovina 1 a 5' },
          { label: 'Ración de Flushing', valor: '300-400 g maíz/día', detalle: 'Maíz partido cosechado en el campo' }
        ],
        tareasOperativas: [
          'Revisión de boca (dientes) y ubre en la manga ovina',
          'Suministro del grano en comederos lineales con espacio de 35 cm/oveja',
          'Dosificación de selenio y vitamina E inyectable'
        ],
        reglasControl: [
          'No suministrar grano sin período previo de acostumbramiento ruminal de 5 días para evitar acidosis',
          'Ovejas con CC < 2.0 deben apartarse a lote diferencial'
        ]
      },
      {
        id: 'ovi-e2',
        num: '2',
        nombre: 'Encarnerada a Campo',
        sub: 'Servicio con carneros Dorper',
        duracion: '45 a 50 días (Mar-Abr)',
        color: 'border-blue-200 bg-blue-50 text-blue-900',
        badge: '3 a 4% Carneros',
        objetivo: 'Concentrar los partos en un período no mayor a dos ciclos estrales ovinos (17 días por ciclo).',
        descripcion: 'Servicio a campo con carneros puros de pedigree Dorper evaluados sanitariamente con análisis serológico de Brucella ovis (epididimitis).',
        parametrosClave: [
          { label: 'Duración Ciclo Estral', valor: '17 días promedio', detalle: 'Celo ovino cada 16-18 días' },
          { label: 'Meta Fertilidad', valor: '≥ 90.0%', detalle: 'Ovejas preñadas sobre servidas' }
        ],
        tareasOperativas: [
          'Aplicación de tiza marcadora o arnés marcador en el pecho del carnero',
          'Recorrida diaria para anotar ovejas marcadas por color de tiza semanal',
          'Rotación de carneros a potrero de descanso cada 15 días'
        ],
        reglasControl: [
          'Carneros con lesiones en testículos o miembros locomotores deben ser reemplazados de inmediato',
          'Prohibido el uso de carneros sin certificado negativo a Brucella ovis'
        ]
      },
      {
        id: 'ovi-e3',
        num: '3',
        nombre: 'Diagnóstico Ecográfico',
        sub: 'Detección temprana y melliceras',
        duracion: 'Día 45 post-retiro',
        color: 'border-purple-200 bg-purple-50 text-purple-900',
        badge: 'Detección Mellizos',
        objetivo: 'Separar vientres únicos de melliceras para brindar nutrición diferencial en el último tercio de gestación.',
        descripcion: 'Ecografía transabdominal con transductor sectorial. Las ovejas melliceras requieren un 40% más de energía para prevenir toxemia de la preñez.',
        parametrosClave: [
          { label: 'Tasa de Melliceras Dorper', valor: '35% a 50%', detalle: 'Alta prolificidad genética' },
          { label: 'Diagnóstico de Vacías', valor: '< 8% vacías', detalle: 'Apartado de vientres improductivos' }
        ],
        tareasOperativas: [
          'Pasaje por manga de ecografía',
          'Caravaneo con distintivo de color para ovejas gestando mellizos',
          'Ajuste del balance forrajero en el módulo Ovino'
        ],
        reglasControl: [
          'Las ovejas vacías con dos temporadas consecutivas de falla pasan a descarte comercial para faena',
          'Registrar el porcentaje de preñez en el CMI Ovino'
        ]
      }
    ],
    buenasPracticas: [
      { titulo: 'Prevención de Toxemia de Preñez', desc: 'Asegurar que las ovejas con doble feto reciban suplementación energética en las últimas 6 semanas de gestación.' },
      { titulo: 'Manejo de Sombras y Reparos', desc: 'Los piquetes de parición deben contar con cortinas de árboles o reparos contra vientos del sur.' }
    ],
    puntosAuditoria: [
      'Verificación del índice de señalada (corderos vivos / ovejas entoradas)',
      'Registro inmutable de bajas por mortandad perinatal en el módulo Stock Ovino',
      'Control de transferencias de maíz de la UN Agrícola al lote de flushing'
    ]
  },
  {
    id: 'ovi-tut-destete',
    label: '2. Parición, Señalada & Destete Temprano',
    titulo: 'Maternidad Ovina, Calostrado y Destete a 70 Días',
    subtitulo: 'Protocolo de supervivencia del cordero y crecimiento acelerado Dorper',
    descripcion: 'Paso a paso desde la atención del parto a campo, desinfección de cordón, señale y descole higiénico, hasta el destete precoz con cordero de más de 18 kg.',
    etapas: [
      {
        id: 'ovi-d1',
        num: '1',
        nombre: 'Atención del Parto a Campo',
        sub: 'Vigor del cordero y calostrado',
        duracion: 'Primeras 6 horas',
        color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        badge: 'Peso Nacer 3.5 - 4.5 kg',
        objetivo: 'Asegurar la viabilidad neonatal y el vínculo madre-cría.',
        descripcion: 'Vigilancia en potrero de parición para asistir partos melliceros, limpiar mucosidades nasales y garantizar mamada antes de 2 horas de nacido.',
        parametrosClave: [
          { label: 'Peso Nacer Cordero Único', valor: '4.0 - 4.8 kg', detalle: 'Excelente vitalidad' },
          { label: 'Peso Nacer Mellizos', valor: '3.2 - 3.8 kg', detalle: 'Vigilancia especial en invierno' }
        ],
        tareasOperativas: [
          'Desinfección de cordón umbilical con solución yodada al 7%',
          'Asegurar consumo de calostro materno de inmediato',
          'Caravaneo provisorio al pie de la madre'
        ],
        reglasControl: [
          'En noches frías con viento (< 5 °C), cobijar corderos mellizos en casillas refugio',
          'Ovejas con rechazo de cordero deben ingresar a corral de ahijamiento'
        ]
      },
      {
        id: 'ovi-d2',
        num: '2',
        nombre: 'Señalada y Vacunación Clostridial',
        sub: 'Día 25 a 35 de vida',
        duracion: '1 jornada',
        color: 'border-blue-200 bg-blue-50 text-blue-900',
        badge: 'Meta Señalada ≥ 135%',
        objetivo: 'Fijar el inventario oficial de corderos de la campaña y aplicar profilaxis sanitaria.',
        descripcion: 'Caravaneo oficial definitivo, descole higiénico con goma elastomérica o cauterio térmico y aplicación de vacuna contra Mancha, Gangrena y Enterotoxemia (Basquilla).',
        parametrosClave: [
          { label: 'Porcentaje de Señalada', valor: '≥ 135.0%', detalle: 'Corderos señalados / Ovejas entoradas' },
          { label: 'Mortalidad Parto-Señale', valor: '< 8.0%', detalle: 'Tolerancia zootécnica de majada' }
        ],
        tareasOperativas: [
          'Cómputo formal de corderos machos y hembras en la manga',
          'Aplicación de vacuna clostridial polivalente y desparasitación según recuento HPG',
          'Registro del evento de señale en el módulo Majada Ovina'
        ],
        reglasControl: [
          'Descole con asepsia estricta dejando al menos dos vértebras caudales para protección vulvar/anal',
          'Actualizar el balance de existencias físicas inmediatamente'
        ]
      },
      {
        id: 'ovi-d3',
        num: '3',
        nombre: 'Destete Tradicional a 70 Días',
        sub: 'Separación definitiva',
        duracion: 'Día 70 (± 5 d)',
        color: 'border-purple-200 bg-purple-50 text-purple-900',
        badge: 'Peso Destete ≥ 18 kg',
        objetivo: 'Separar los corderos de las madres para enviarlos a terminación con grano propio.',
        descripcion: 'Pesaje individual de la camada, clasificación por peso y sexo, y pase a pasturas tiernas con suplementación ad-libitum de maíz y concentrado proteico.',
        parametrosClave: [
          { label: 'Peso Individual Meta', valor: '≥ 18.0 - 20.0 kg', detalle: 'Cordero Dorper a los 70 días' },
          { label: 'Ganancia Diaria Lactante', valor: '≥ 220 g/día', detalle: 'Potencial de crecimiento pre-destete' }
        ],
        tareasOperativas: [
          'Pesaje por balanza de caja ovina',
          'Formación de lote de terminación (machos castrados y hembras no para reposición)',
          'Apartado de las mejores borregas para reposición de vientres de Cabaña'
        ],
        reglasControl: [
          'Corderos con peso < 14 kg a los 70 días deben ingresar a lote de suplementación reforzada',
          'Ovejas destetadas pasan a potrero de mantenimiento con menor oferta para secado de ubre'
        ]
      }
    ],
    buenasPracticas: [
      { titulo: 'Creep Feeding Previo', desc: 'Instalar corrales de alimentación exclusiva para corderos (creep feeding) desde el día 20 para facilitar la transición ruminal.' },
      { titulo: 'Monitoreo Famacha', desc: 'Revisión periódica de la conjuntiva ocular para el control selectivo de Haemonchus contortus.' }
    ],
    puntosAuditoria: [
      'Verificación matemática de corderos destetados versus nacimientos registrados',
      'Control de pesadas individuales registradas en base de datos',
      'Auditoría de insumos sanitarios utilizados en la jornada de destete'
    ]
  },
  {
    id: 'ovi-tut-comercial',
    label: '3. Comercialización de Cordero Pesado',
    titulo: 'Despacho de Cordero Pesado Dorper a Faena',
    subtitulo: 'Circuito comercial de carne ovina: 28-32 kg vivo y rendimiento carnicero ≥ 48%',
    descripcion: 'Paso a paso para la liquidación de corderos pesados: tipificación de res, rinde carnicero, confección de DTE SENASA y determinación del margen bruto ovino.',
    etapas: [
      {
        id: 'ovi-c1',
        num: '1',
        nombre: 'Apartado y Pesaje de Tropa',
        sub: 'Tropa terminada para faena',
        duracion: 'Día de embarque',
        color: 'border-amber-200 bg-amber-50 text-amber-900',
        badge: '28 - 32 kg vivo',
        objetivo: 'Comercializar corderos con óptima cobertura grasa sin exceso de grasa subcutánea.',
        descripcion: 'Pesaje de los corderos en balanza ovina verificando terminación de lomo y paleta. La raza Dorper ofrece un rendimiento de res del 48% al 52%.',
        parametrosClave: [
          { label: 'Peso Vivo de Salida', valor: '28.0 a 32.0 kg', detalle: 'Cordero pesado terminado' },
          { label: 'Rendimiento al Gancho', valor: '48.0% a 52.0%', detalle: 'Res limpia eviscerada de 14-16 kg' }
        ],
        tareasOperativas: [
          'Pesaje individual y agrupamiento en corral de embarque',
          'Verificación de ayuno higiénico previo al transporte (10 horas)',
          'Emisión de DTE SENASA con destino a frigorífico de la zona'
        ],
        reglasControl: [
          'No enviar a faena animales bajo período de carencia de antiparasitarios o antibióticos',
          'Corderos sin cola o con heridas abiertas deben ser descartados del despacho comercial'
        ]
      },
      {
        id: 'ovi-c2',
        num: '2',
        nombre: 'Liquidación y Cobranza Comercial',
        sub: 'Factura y liquidación frigorífica',
        duracion: 'Plazo 15 días',
        color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        badge: 'Ingreso Neto Ovino',
        objetivo: 'Imputar formalmente el ingreso contable y liquidar la tropa despachada.',
        descripcion: 'Registro de la factura de venta en base al precio pactado por kilo vivo o por kilo al gancho, descontando el flete y aranceles bromatológicos.',
        parametrosClave: [
          { label: 'Precio Referencia Cordero', valor: '$2.200 /kg vivo', detalle: 'Precio orientativo de mercado' },
          { label: 'Deducciones Comerciales', valor: 'Guías y flete jaula', detalle: 'Imputación de costos comerciales' }
        ],
        tareasOperativas: [
          'Carga de la venta en el módulo Ventas Ovinas',
          'Descargo de cabezas y kilos en el módulo de Stock Ovino',
          'Conciliación con el saldo de caja o cuenta corriente en tesorería'
        ],
        reglasControl: [
          'La factura debe corresponder exactamente al número de DTE y comprador registrado en el maestro de Clientes',
          'Confirmar el estado del comprobante a "Confirmado" por el Encargado o Administrador'
        ]
      }
    ],
    buenasPracticas: [
      { titulo: 'Acondicionamiento para Faena', desc: 'No levantar los corderos por la lana o la piel para evitar hematomas en el costillar y cuarto trasero de la res.' },
      { titulo: 'Homogeneidad de Tropa', desc: 'Despachar tropas con rango de peso no mayor a 4 kg entre el animal más liviano y el más pesado.' }
    ],
    puntosAuditoria: [
      'Conciliación de corderos vendidos versus baja física en el módulo Stock Físico Ovino',
      'Control de correspondencia entre kilos pesados en granja y kilos liquidados en frigorífico',
      'Verificación del margen bruto de la majada en el Cuadro de Mando Integral'
    ]
  }
];

export const OVINO_CAPITULOS: ManualCapitulo[] = [
  {
    id: 'ovi-cap-1',
    num: '1',
    titulo: 'Fundamentos de la Majada Ovina Dorper',
    tags: ['ovinos', 'dorper', 'carne', 'majada', 'pozo del carril', 'unrc'],
    resumen: 'Introducción a la producción ovina de pelo en Pozo del Carril, características de la raza Dorper y objetivos carniceros.',
    secciones: [
      {
        subtitulo: '1.1. Origen y Justificación de la Raza Dorper',
        parrafos: [
          'La majada ovina del establecimiento didáctico-productivo Pozo del Carril · La Aguada (UNRC) está conformada por animales de raza Dorper sudafricana, fruto de un proceso de cruzamiento absorbente sobre base materna tradicional.',
          'La raza Dorper es una raza de pelo 100% carnicera, desarrollada originariamente a partir del cruzamiento entre Dorset Horn y Blackhead Persian. Su principal ventaja zootécnica para la región de Río Cuarto radica en su altísima rusticidad, desprendimiento natural de fibras sin requerir esquila lanera comercial, precocidad sexual y sobresaliente aptitud materna.'
        ],
        puntosClave: [
          '100% orientada a la producción de carne ovina de alta calidad (cordero pesado)',
          'Excelente adaptación a pasturas con clima templado-semiárido y pastoreo rotativo',
          'Eliminación de los costos de comparsa de esquila lanera tradicional'
        ]
      },
      {
        subtitulo: '1.2. Parámetros Biológicos y Metas Zootécnicas',
        parrafos: [
          'El modelo de gestión ovina monitorea indicadores biológicos clave que sustentan la rentabilidad del módulo.'
        ],
        tabla: {
          columnas: ['Indicador de Majada', 'Meta Pozo del Carril', 'Rango Observado', 'Observaciones Técnicas'],
          filas: [
            ['Porcentaje de Fertilidad', '≥ 90.0%', '88% - 94%', 'Ovejas preñadas sobre encarneradas'],
            ['Porcentaje de Prolificidad', '≥ 150.0%', '140% - 165%', 'Corderos nacidos por oveja parida'],
            ['Porcentaje de Señalada', '≥ 135.0%', '125% - 145%', 'Corderos vivos al mes de vida'],
            ['Peso al Destete (70 días)', '≥ 18.0 kg', '16.5 - 21.0 kg', 'Destete precoz con suplementación'],
            ['Peso de Venta Faena', '28.0 - 32.0 kg', '27.0 - 34.0 kg', 'Cordero pesado terminado']
          ]
        }
      }
    ]
  },
  {
    id: 'ovi-cap-2',
    num: '2',
    titulo: 'Manejo Reproductivo y Encarnerada Sincronizada',
    tags: ['reproduccion', 'encarnerada', 'flushing', 'carneros', 'ecografia'],
    resumen: 'Protocolo de servicio estacional, acondicionamiento de reproductores y diagnóstico ecográfico de melliceras.',
    secciones: [
      {
        subtitulo: '2.1. Estacionalidad del Servicio y Efecto Macho',
        parrafos: [
          'La encarnerada se concentra en los meses de marzo y abril para ubicar la parición en agosto y septiembre, coincidiendo con el rebrote primaveral de las pasturas consociadas con alfalfa.',
          'Se implementa el "efecto macho", separando completamente los carneros de la majada durante 30 días previos al servicio. Su reintroducción súbita desencadena una sincronización natural de celos en más del 70% de las ovejas durante los primeros 10 días.'
        ],
        puntosClave: [
          'Aislamiento visual y olfativo de carneros 30 días antes del inicio del servicio',
          'Flushing alimenticio con 350 g/día de maíz propio desde 3 semanas antes',
          'Revisión clínica de carneros: palpación testicular y aplomos'
        ]
      },
      {
        subtitulo: '2.2. Fórmulas Reproductivas Ovinas',
        parrafos: [
          'Las fórmulas matemáticas que calculan el rendimiento biológico de la encarnerada son automáticas en el módulo CMI Ovino.'
        ],
        formulas: [
          {
            nombre: 'Tasa de Prolificidad Ovina',
            formula: 'Prolificidad (%) = (Total Corderos Nacidos Vivos + Muertos / Ovejas Paridas) × 100',
            explicacion: 'Mide el número de embriones gestados por cada vientre fértil; meta institucional: ≥ 150%.'
          },
          {
            nombre: 'Tasa de Señalada Ovina',
            formula: 'Señalada (%) = (Corderos Vivos al Señale / Ovejas Puestas a Encarnerada) × 100',
            explicacion: 'Principal indicador económico de la cría ovina; meta institucional: ≥ 135%.'
          }
        ]
      }
    ]
  },
  {
    id: 'ovi-cap-3',
    num: '3',
    titulo: 'Sanidad de Majada y Manejo PROLANA Funcional',
    tags: ['sanidad', 'prolana', 'famacha', 'clostridiosis', 'desparasitacion'],
    resumen: 'Plan sanitario integral para ovinos, control de parásitos gastrointestinales y pautas de esquila higiénica de manejo.',
    secciones: [
      {
        subtitulo: '3.1. Plan Sanitario Preventivo',
        parrafos: [
          'La majada ovina recibe vacunación sistemática contra el complejo de enfermedades clostridiales (Enterotoxemia o Basquilla, Tétanos, Gangrena y Mancha) aplicando una dosis 30 días antes del parto para transferir anticuerpos a través del calostro.',
          'El control parasitario se orienta al uso racional de antihelmínticos mediante monitoreo del método FAMACHA© (inspección de mucosas oculares para detectar anemia por Haemonchus contortus) y recuentos coprológicos seriados de huevos por gramo (HPG).'
        ],
        puntosClave: [
          'Vacunación preparto a las madres con bacterina clostridial polivalente',
          'Monitoreo FAMACHA mensual en verano y otoño para desparasitación selectiva',
          'Cuidado podal periódico: pediluvios con sulfato de cobre/zinc al 5% para prevenir pietín'
        ],
        alerta: 'Queda prohibida la desparasitación a ciegas de toda la majada; desparasitar únicamente animales con FAMACHA grado 3, 4 o 5 para evitar la resistencia antihelmíntica.'
      },
      {
        subtitulo: '3.2. Esquila de Manejo Funcional (Protocolo PROLANA)',
        parrafos: [
          'Dado que la raza Dorper realiza muda natural de su manto, el establecimiento no computa ingresos por venta de lana lanera industrial.',
          'Sin embargo, se practica una esquila higiénica preparto bajo protocolo PROLANA (esquila desmane o suelta) para despejar la zona perianal y de la ubre, facilitando el amamantamiento de los corderos y previniendo miasis (bicheras).'
        ]
      }
    ]
  },
  {
    id: 'ovi-cap-4',
    num: '4',
    titulo: 'Comercialización y Margen Bruto del Cordero Pesado',
    tags: ['comercializacion', 'cordero pesado', 'margen bruto', 'costeo', 'faena'],
    resumen: 'Circuito comercial de la carne ovina, costeo de dietas de engorde y cálculo del margen bruto por oveja madre.',
    secciones: [
      {
        subtitulo: '4.1. Producto Comercial: Cordero Pesado Dorper',
        parrafos: [
          'El producto final de la unidad es el cordero pesado de 28 a 32 kg de peso vivo con una edad de 90 a 110 días. A diferencia del cordero liviano tradicional (12-14 kg vivo), el cordero pesado Dorper produce una res de 14 a 16 kg limpia con alto porcentaje de carne magra.',
          'Las ventas se liquidan mediante el módulo de Ventas Ovinas y se imputan formalmente a la cuenta "Ventas de Hacienda Ovina".'
        ],
        puntosClave: [
          'Comercialización formal con frigoríficos regionales habilitados por SENASA',
          'Desbaste promedio en camión jaula ovina: 2.5% a 3.0%',
          'Imputación contable automática en el Estado de Resultados consolidado'
        ]
      },
      {
        subtitulo: '4.2. Fórmula del Margen Bruto Ovino',
        parrafos: [
          'El resultado económico del módulo se determina por oveja en producción y por hectárea asignada.'
        ],
        formulas: [
          {
            nombre: 'Margen Bruto por Oveja Madre',
            formula: 'MB ($/oveja) = (Ingresos por Venta de Corderos + Venta de Ovejas Descarte) − (Alimentación + Sanidad + Gastos Comerciales)',
            explicacion: 'Rentabilidad directa antes de costos fijos y gastos de estructura institucional.'
          }
        ]
      }
    ]
  },
  {
    id: 'ovi-cap-5',
    num: '5',
    titulo: 'Cuadro de Mando Integral (CMI) Ovino',
    tags: ['cmi', 'indicadores', 'ovinos', 'semaforos', 'gestion'],
    resumen: 'Catálogo de indicadores del CMI Ovino, ponderación de perspectivas y semáforos de desempeño zootécnico.',
    secciones: [
      {
        subtitulo: '5.1. Matriz de Indicadores Ovinos',
        parrafos: [
          'El CMI Ovino asegura que las metas biológicas de la majada Dorper se traduzcan en resultados económicos consistentes para el establecimiento.'
        ],
        tabla: {
          columnas: ['Perspectiva', 'Indicador Estratégico', 'Meta Anual', 'Semáforo Verde', 'Semáforo Rojo'],
          filas: [
            ['Financiera', 'Margen Bruto Ovino ($/cab)', '≥ $45.000 /madre', '≥ Meta', '< 80% de Meta'],
            ['Financiera', 'Costo Alimentación por Cordero', '≤ $18.000 /cab', '≤ Meta', '> 120% de Meta'],
            ['Clientes', 'Peso Medio de Faena', '≥ 29.0 kg vivo', '≥ 28.0 kg', '< 26.0 kg'],
            ['Procesos', 'Porcentaje de Señalada', '≥ 135.0%', '≥ 135%', '< 120%'],
            ['Procesos', 'Peso al Destete (70 d)', '≥ 18.0 kg', '≥ 18.0 kg', '< 15.0 kg'],
            ['Aprendizaje', 'Registros Sanitarios Completos', '≥ 95.0%', '≥ 95%', '< 85%']
          ]
        }
      }
    ]
  },
  {
    id: 'ovi-cap-6',
    num: '6',
    titulo: 'Glosario Ovino y Parámetros Técnicos',
    tags: ['glosario', 'dorper', 'flushing', 'señalada', 'famacha', 'terminos'],
    resumen: 'Términos zootécnicos del sector ovino y definiciones operativas aplicadas en Pozo del Carril.',
    secciones: [
      {
        subtitulo: '6.1. Vocabulario Técnico',
        parrafos: [
          '• Señalada: Conteo y marcado definitivo de corderos vivos que superaron el período de vulnerabilidad neonatal (habitualmente a los 30 días de vida).',
          '• Flushing: Práctica nutricional consistente en incrementar el plano energético de las ovejas 3 semanas antes del servicio para aumentar la ovulación y partos melliceros.',
          '• FAMACHA: Sistema sudafricano de diagnóstico a campo que evalúa el grado de anemia en la mucosa ocular del ovino para dosificar antiparasitarios selectivamente.',
          '• Raza Dorper: Raza ovina de pelo originada en Sudáfrica, destacada por su crecimiento rápido, alta conformación carnicera y capacidad de autopelado sin requerir esquila lanera tradicional.'
        ]
      }
    ]
  }
];

/* =========================================================================================
 * 3. MODO CONSOLIDADO (SISTEMA INTEGRAL MULTI-NEGOCIO POZO DEL CARRIL UNRC)
 * ========================================================================================= */

export const CONSOLIDADO_TUTORIALES: TutorialGrafico[] = [
  {
    id: 'con-tut-integracion',
    label: '1. Integración Multi-Especie & Desacople',
    titulo: 'Consolidación de Unidades: Porcinos, Bovinos, Ovinos y Agricultura',
    subtitulo: 'Arquitectura contable desacoplada sin subsidios cruzados entre producciones',
    descripcion: 'Paso a paso para la visualización del estado consolidado: agregación de ingresos externos genuinos, sumatoria de costos directos independientes y control de resultados por unidad de negocio.',
    etapas: [
      {
        id: 'con-e1',
        num: '1',
        nombre: 'Desacople Productivo por Unidad',
        sub: 'Centro de costos independiente',
        duracion: 'Configuración permanente',
        color: 'border-slate-200 bg-slate-50 text-slate-900',
        badge: '4 Unidades de Negocio',
        objetivo: 'Evitar que una actividad rentable subsidie las ineficiencias de otra.',
        descripcion: 'Cada actividad (UN_PORCINOS, UN_BOVINOS, UN_OVINOS, UN_AGRICOLA) registra sus compras, consumos, stock y ventas con independencia total.',
        parametrosClave: [
          { label: 'Unidades Activas', valor: 'Porcinos, Bovinos, Ovinos, Agro', detalle: 'Centros de costo aislados' },
          { label: 'Cuentas Imputadas', valor: 'Plan D_Cuenta', detalle: 'Clasificación contable rigurosa' }
        ],
        tareasOperativas: [
          'Verificación de imputación de unidad de negocio en cada comprobante',
          'Asignación de subunidades específicas (Cría, Recría, Engorde)',
          'Auditoría mensual de gastos no asignados'
        ],
        reglasControl: [
          'Prohibido cargar gastos ganaderos en cuentas agrícolas y viceversa',
          'Todo comprobante de compra debe tener asignada una unidad y subunidad válida'
        ]
      },
      {
        id: 'con-e2',
        num: '2',
        nombre: 'Consolidación de Estados Financieros',
        sub: 'Estado de Resultados Global',
        duracion: 'Cierre mensual',
        color: 'border-purple-200 bg-purple-50 text-purple-900',
        badge: 'Margen Global UNRC',
        objetivo: 'Sintetizar la rentabilidad global del establecimiento para las autoridades de la FCE y UNRC.',
        descripcion: 'El sistema suma las ventas externas de capones, novillos y corderos, deduciendo los costos operativos reales y los costos de estructura prorrateados.',
        parametrosClave: [
          { label: 'Ingresos Consolidados', valor: 'Σ Ventas Externas Reales', detalle: 'Excluye ventas inter-unidad ficticias' },
          { label: 'Margen Bruto Consolidado', valor: 'Ventas − Costos Directos', detalle: 'Contribución marginal de Pozo del Carril' }
        ],
        tareasOperativas: [
          'Generación del Estado de Resultados en la solapa Consolidado > Económico',
          'Exportación a planilla para auditoría de cátedras y decanato',
          'Revisión de desvíos respecto al presupuesto consolidado'
        ],
        reglasControl: [
          'El total consolidado debe coincidir exactamente con la sumatoria de las 3 solapas de cada especie',
          'La eliminación de transferencias internas debe balancear a cero ($0 neto)'
        ]
      }
    ],
    buenasPracticas: [
      { titulo: 'Trazabilidad de Centros de Costos', desc: 'Cada factura de compra debe cargarse con su comprobante respaldatorio imputando la unidad destinataria real.' },
      { titulo: 'Transparencia Académica', desc: 'Los registros económicos consolidados sirven como insumo para tesis de grado y prácticas profesionales de la UNRC.' }
    ],
    puntosAuditoria: [
      'Verificación de que ningún ingreso inter-unidad se compute como ingreso externo',
      'Auditoría de consistencia entre los balances físicos y los valores monetarios',
      'Validación de cierres de campaña por el Administrador General'
    ]
  },
  {
    id: 'con-tut-neutralizacion',
    label: '2. Neutralización de Maíz Propio a Valor FAS',
    titulo: 'Transferencias Internas de Maíz: Regla Cero y Valoración FAS',
    subtitulo: 'Mecanismo contable para valorar el grano propio a precio de mercado sin inflar el margen global',
    descripcion: 'Paso a paso del protocolo contable de neutralización: valuación del maíz propio a precio FAS de mercado (Pizarra Rosario), imputación como costo en la unidad ganadera (+Costo) y como ingreso en la unidad agrícola (+Ingreso), garantizando impacto neto cero ($0) en el estado consolidado.',
    etapas: [
      {
        id: 'con-n1',
        num: '1',
        nombre: 'Fijación de la Cotización FAS',
        sub: 'Pizarra Rosario del día',
        duracion: 'Semanal / Mensual',
        color: 'border-amber-200 bg-amber-50 text-amber-900',
        badge: 'FAS = Pizarra − Gastos',
        objetivo: 'Establecer el precio de paridad de mercado al que la agricultura transfiere maíz a los rodeos y piara.',
        descripcion: 'El grano propio cosechado en Pozo del Carril se valora al precio FAS teórico (Free Alongside Ship) descontando flete a puerto y paritarias de acopio.',
        parametrosClave: [
          { label: 'Cotización Maíz Pizarra', valor: '$205.000 /Tn ($205/kg)', detalle: 'Referencia Bolsa de Comercio Rosario' },
          { label: 'Deducción Acondicionamiento', valor: 'Flete y secado', detalle: 'Deducciones reales para FAS neto' }
        ],
        tareasOperativas: [
          'Consulta de cotización Pizarra Rosario en GanaderIA o Cámara Arbitral',
          'Carga del precio de transferencia en Configuración > Cotizaciones',
          'Registro del remito interno de movimiento de granos'
        ],
        reglasControl: [
          'Prohibido valuar transferencias a costo histórico o a valor cero (evita distorsión zootécnica)',
          'El precio FAS debe ser idéntico para Porcinos, Bovinos y Ovinos en la misma semana'
        ]
      },
      {
        id: 'con-n2',
        num: '2',
        nombre: 'Asiento Cruzado de Transferencia',
        sub: 'Doble imputación interna',
        duracion: 'Al emitir el vale interno',
        color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        badge: '+T (Agro) | -T (Ganadería)',
        objetivo: 'Imputar el costo del alimento en la ganadería y acreditar la producción en la agricultura.',
        descripcion: 'El sistema genera automáticamente el par de asientos en la tabla Movimientos_Internos / Transferencias_Granos.',
        parametrosClave: [
          { label: 'Costo en Ganadería', valor: '+$ por alimento consumido', detalle: 'Afecta el costo por kilo de carne' },
          { label: 'Ingreso en Agricultura', valor: '+$ por venta interna de maíz', detalle: 'Mide la rentabilidad del lote agrícola' }
        ],
        tareasOperativas: [
          'Emisión del remito interno con kilos y destino (tolva porcina, mixer bovino o comedero ovino)',
          'Descargo de stock del silo de maíz en el módulo Stock de Insumos',
          'Cálculo de la equivalencia en el Cuadro de Mando Integral'
        ],
        reglasControl: [
          'En el Estado de Resultados Consolidado: Σ Transferencias Agrícolas − Σ Transferencias Ganaderas = $0.00',
          'Cualquier residuo distinto de cero detiene el cierre contable con semáforo Rojo de auditoría'
        ]
      }
    ],
    buenasPracticas: [
      { titulo: 'Calibración de Tolvas', desc: 'Pesar periódicamente los carros tolva o mixer para asegurar que los kilos transferidos coincidan con la balanza de campo.' },
      { titulo: 'Humedad de Cosecha', desc: 'Ajustar kilos transferidos al 14.5% de humedad estándar comercial.' }
    ],
    puntosAuditoria: [
      'Prueba Matemática D: Verificación de neutralización estricta de transferencias internas',
      'Conciliación de kilos salidos del silo contra kilos consumidos en dietas zootécnicas',
      'Auditoría de consistencia de cotizaciones FAS aplicadas en cada período'
    ]
  },
  {
    id: 'con-tut-auditoria',
    label: '3. Protocolo de Auditoría Matemática A-I',
    titulo: 'Batería de 9 Pruebas de Auditoría Cruzada Matemática',
    subtitulo: 'Validación algorítmica de consistencia entre balances físicos, contables y zootécnicos',
    descripcion: 'Paso a paso para la ejecución de las 9 pruebas de auditoría matemática (Pruebas A a I) implementadas por la Facultad de Ciencias Económicas para validar la integridad de la base de datos de Pozo del Carril.',
    etapas: [
      {
        id: 'con-a1',
        num: '1',
        nombre: 'Pruebas Físicas de Balance de Masa',
        sub: 'Pruebas A, B y C',
        duracion: 'Instantánea en software',
        color: 'border-blue-200 bg-blue-50 text-blue-900',
        badge: 'Stock Inicial + Altas - Bajas',
        objetivo: 'Garantizar que ninguna cabeza de ganado aparezca o desaparezca sin comprobante respaldatorio.',
        descripcion: 'Verificación del balance de masa en Porcinos (Prueba A), Bovinos (Prueba B) y Ovinos (Prueba C). Stock Final = Stock Inicial + Nacimientos + Pases Entrantes − Muertes − Ventas − Pases Salientes.',
        parametrosClave: [
          { label: 'Tolerancia de Cabezas', valor: '0 cabezas (Exactitud)', detalle: 'Cero discrepancias admitidas' },
          { label: 'Tolerancia en Kilos', valor: '< 0.5% por desbaste', detalle: 'Alineado con normas SENASA' }
        ],
        tareasOperativas: [
          'Ejecución del verificador en la solapa Consolidado > Auditoría Matemática',
          'Inspección de comprobantes en estado "Observado"',
          'Rectificación de cualquier duplicado o error de tipeo'
        ],
        reglasControl: [
          'Si una prueba física arroja "Descuadre", el sistema bloquea el botón de Cierre de Período',
          'Toda mortandad debe contar con causa registrada por el operario o veterinario'
        ]
      },
      {
        id: 'con-a2',
        num: '2',
        nombre: 'Pruebas Económicas y de Consistencia',
        sub: 'Pruebas D, E, F, G, H e I',
        duracion: 'Instantánea en software',
        color: 'border-purple-200 bg-purple-50 text-purple-900',
        badge: 'Pruebas D a I',
        objetivo: 'Verificar neutralizaciones, márgenes brutos, costos unitarios y ratios de conversión alimenticia.',
        descripcion: 'Comprobación de transferencias internas (Prueba D), coherencia de precios de venta (Prueba E), consistencia de rinde de faena (Prueba F), cuadre de compras e IVA (Prueba G), absorción de costos fijos (Prueba H) y correlación de horas de visita estudiantil A5 (Prueba I).',
        parametrosClave: [
          { label: 'Prueba D Neutralización', valor: '$0.00 neto', detalle: 'Regla Cero cumplida al 100%' },
          { label: 'Prueba F Rinde Res', valor: 'Porcinos 78-82%, Ovinos 48-52%', detalle: 'Rangos biológicos reales' }
        ],
        tareasOperativas: [
          'Visualización de los semáforos verdes de las 9 pruebas en el tablero',
          'Emisión de dictamen de consistencia para el expediente universitario',
          'Aprobación formal por el Administrador General'
        ],
        reglasControl: [
          'Las 9 pruebas deben estar en estado "OK" para proceder al Cierre de Campaña',
          'Cualquier observación queda registrada inmutablemente en Auditoria_Cambios'
        ]
      }
    ],
    buenasPracticas: [
      { titulo: 'Auditoría Continua', desc: 'No esperar al cierre de ejercicio; revisar el tablero de auditoría matemática semanalmente.' },
      { titulo: 'Segregación Funcional', desc: 'El auditor técnico cuenta con acceso de solo lectura para inspeccionar las pruebas sin alterar registros.' }
    ],
    puntosAuditoria: [
      'Cumplimiento de las 9 pruebas matemáticas A-I sin excepciones',
      'Trazabilidad de usuario y timestamp en cada corrida del verificador',
      'Archivo del dictamen de auditoría en la Facultad de Ciencias Económicas'
    ]
  }
];

export const CONSOLIDADO_CAPITULOS: ManualCapitulo[] = [
  {
    id: 'con-cap-1',
    num: '1',
    titulo: 'Arquitectura del Modelo Multi-Negocio Consolidado',
    tags: ['consolidado', 'arquitectura', 'multi-negocio', 'unrc', 'fce', 'pozo del carril'],
    resumen: 'Estructura organizativa integral del establecimiento Pozo del Carril, interconexión de las tres especies ganaderas y la agricultura auxiliar.',
    secciones: [
      {
        subtitulo: '1.1. Enfoque Sistémico y Desacople Productivo',
        parrafos: [
          'El establecimiento Pozo del Carril · La Aguada de la UNRC opera como un complejo agropecuario integrado donde conviven cuatro actividades primarias: Producción Porcina (ciclo completo semi-intensivo), Producción Bovina (rodeo Angus de cría y cabaña), Producción Ovina (majada Dorper de pelo) y Agricultura Auxiliar (maíz y soja).',
          'La arquitectura del sistema informático sigue el principio contable de "Desacople Operativo": cada negocio se gestiona como una unidad económica autónoma con sus propios centros de costo, parámetros zootécnicos y metas específicas, evitando la contaminación de costos o subsidios cruzados.'
        ],
        puntosClave: [
          'Aislamiento estricto de ingresos y costos por especie ganadera',
          'Consolidación matemática en tiempo real para la toma de decisiones estratégicas de la UNRC',
          'Manejo conjunto de infraestructura (mangas, silos, balanzas y maquinaria)'
        ]
      },
      {
        subtitulo: '1.2. Flujo Integrado de Recursos y Granos Propios',
        parrafos: [
          'El nexo principal de integración física entre las actividades es el grano de maíz producido en los lotes agrícolas de la estancia. Este insumo se transforma en carne en las tres especies ganaderas, optimizando el costo logístico de comercialización granaria.'
        ],
        tabla: {
          columnas: ['Unidad de Negocio', 'Base Animal / Hectáreas', 'Destino del Maíz Propio', 'Producto Comercial Final'],
          filas: [
            ['Porcinos', '34 madres activas (ciclo completo)', 'Raciones gestación, recría y terminación', 'Capones pesados faena (110-115 kg)'],
            ['Bovinos', 'Rodeo Angus Cría y Cabaña', 'Suplementación invernal y feedlot', 'Novillos, vaquillonas y toros PR'],
            ['Ovinos', 'Majada Dorper en cruzamiento', 'Flushing pre-servicio y engorde corderos', 'Corderos pesados faena (28-32 kg)'],
            ['Agricultura', 'Lotes agrícolas bajo siembra directa', 'Abastecimiento interno a valor FAS', 'Grano excedente a acopio local']
          ]
        }
      }
    ]
  },
  {
    id: 'con-cap-2',
    num: '2',
    titulo: 'Neutralización de Transferencias Internas (Regla Cero)',
    tags: ['transferencias', 'maiz', 'fas', 'neutralizacion', 'regla cero', 'costos'],
    resumen: 'Pautas contables para la valoración a precio de mercado del maíz propio y su neutralización en el Estado de Resultados consolidado.',
    secciones: [
      {
        subtitulo: '2.1. El Principio de Valor de Mercado (FAS Teórico)',
        parrafos: [
          'Transferir maíz propio a costo de implantación distorsiona la evaluación zootécnica de los rodeos haciéndolos parecer artificialmente más eficientes. Por el contrario, valorarlo al precio FAS teórico de pizarra refleja el verdadero costo de oportunidad del alimento.',
          'En el sistema, cuando la unidad Agrícola remite maíz a una unidad ganadera, se genera un asiento simultáneo: ingreso ficticio para Agricultura (+T) y costo devengado para Ganadería (-T).'
        ],
        puntosClave: [
          'Cotización FAS Pizarra Rosario fijada semanalmente en el sistema',
          'Imputación al costo de raciones zootécnicas para cálculo verídico de conversión (ICA/ADPV)',
          'Eliminación de la utilidad inter-unidad al consolidar los estados contables'
        ]
      },
      {
        subtitulo: '2.2. Demostración Matemática de la Regla Cero',
        parrafos: [
          'En el Estado de Resultados Consolidado institucional, las transferencias internas deben sumar algebraicamente cero.'
        ],
        formulas: [
          {
            nombre: 'Ecuación de Neutralización de Transferencias Internas',
            formula: 'Resultado Consolidado = Σ Margen Porcino + Σ Margen Bovino + Σ Margen Ovino + Σ Margen Agrícola − Σ Transferencias Internas ($0.00)',
            explicacion: 'Demuestra que el valor del maíz propio no infla artificialmente el patrimonio ni la utilidad neta de la UNRC.'
          }
        ]
      }
    ]
  },
  {
    id: 'con-cap-3',
    num: '3',
    titulo: 'Batería de 9 Pruebas de Auditoría Matemática (A a I)',
    tags: ['auditoria', 'matematica', 'pruebas a-i', 'consistencia', 'balance masa', 'control'],
    resumen: 'Especificación detallada de los 9 algoritmos de verificación cruzada que garantizan la inviolabilidad contable del sistema.',
    secciones: [
      {
        subtitulo: '3.1. Catálogo de las 9 Pruebas Matemáticas',
        parrafos: [
          'Diseñadas por el equipo docente del Taller de Práctica II de la FCE - UNRC, las pruebas evalúan la consistencia algorítmica de la base de datos.'
        ],
        tabla: {
          columnas: ['Prueba', 'Nombre de la Validación', 'Algoritmo Matemático', 'Criterio de Aprobación'],
          filas: [
            ['Prueba A', 'Balance de Masa Porcino', 'Stock Fin = Stock Ini + Nac + Pases Ent − Bajas − Ventas', 'Diferencia = 0 cabezas'],
            ['Prueba B', 'Balance de Masa Bovino', 'Stock Fin = Stock Ini + Nac + Comp − Bajas − Ventas', 'Diferencia = 0 cabezas'],
            ['Prueba C', 'Balance de Masa Ovino', 'Stock Fin = Stock Ini + Nac + Señalados − Bajas − Ventas', 'Diferencia = 0 cabezas'],
            ['Prueba D', 'Neutralización de Maíz Propio', 'Σ Ingresos Transf. Agro − Σ Costos Transf. Ganaderas', 'Diferencia = $0.00 neto'],
            ['Prueba E', 'Precios de Venta vs. Referencia', '| Precio Venta − Precio ROSPORC/MAG | / Precio Ref.', 'Desvío relativo ≤ 10%'],
            ['Prueba F', 'Consistencia de Rinde de Faena', 'Kg Res al Gancho / Kg Vivos Despachados', 'Rango Porcino 78-82%, Ovino 48-52%'],
            ['Prueba G', 'Cuadre Impositivo Compras', 'Total Neto Gravado + IVA Calculado − Total Factura', 'Diferencia ≤ $0.10 de redondeo'],
            ['Prueba H', 'Absorción de Costos Fijos', 'Σ Costos Asignados a Unidades − Total Costos Reales', 'Diferencia = $0.00'],
            ['Prueba I', 'Trazabilidad Visitas UNRC (A5)', 'Horas Registradas vs. Cronograma Académico FCE/FAV', 'Cumplimiento ≥ 95%']
          ]
        }
      }
    ]
  },
  {
    id: 'con-cap-4',
    num: '4',
    titulo: 'Cuadro de Mando Integral (CMI) Consolidado',
    tags: ['cmi', 'consolidado', '12 indicadores', 'perspectivas', 'tablero de control'],
    resumen: 'Estructura de los 12 indicadores estratégicos globales, metas de la UNRC y matriz de causa-efecto multiespecie.',
    secciones: [
      {
        subtitulo: '4.1. Los 12 Indicadores Estratégicos Globales',
        parrafos: [
          'El CMI Consolidado resume en 12 indicadores balanceados (3 por perspectiva) la situación productiva, económica, comercial y didáctica del establecimiento Pozo del Carril.'
        ],
        tabla: {
          columnas: ['Perspectiva', 'N°', 'Indicador Global Consolidado', 'Meta Institucional UNRC', 'Unidad'],
          filas: [
            ['Financiera', 'F1', 'Margen Bruto Global Consolidado', '≥ $18.500.000 /año', 'Pesos ARS'],
            ['Financiera', 'F2', 'Costo Directo Ponderado por Kilo Producido', '≤ $1.350 /kg carne', '$/kg vivo'],
            ['Financiera', 'F3', 'Relación de Cobertura de Costos Fijos', '≥ 1.35', 'Ratio'],
            ['Clientes', 'C1', 'Calidad en Destino y Rendimiento de Tropa', '≥ 85.0% óptimo', 'Porcentaje'],
            ['Clientes', 'C2', 'Mortalidad en Transporte (Todas las especies)', '≤ 0.50%', 'Porcentaje'],
            ['Clientes', 'C3', 'Plazo Promedio de Cobranza Comercial', '≤ 25 días', 'Días'],
            ['Procesos', 'P1', 'Eficiencia de Conversión Alimenticia Ponderada', '≤ 3.20 kg/kg', 'Ratio'],
            ['Procesos', 'P2', 'Supervivencia al Destete Consolidada', '≥ 87.0%', 'Porcentaje'],
            ['Procesos', 'P3', 'Aumento Diario de Peso Vivo (ADPV) Global', '≥ 0.680 kg/día', 'kg/día'],
            ['Aprendizaje', 'A1', 'Carga Oportuna de Comprobantes (< 48 hs)', '≥ 95.0%', 'Porcentaje'],
            ['Aprendizaje', 'A2', 'Aprobación de Pruebas de Auditoría A-I', '100% OK (9 de 9)', 'Pruebas'],
            ['Aprendizaje', 'A5', 'Visitas Estudiantiles y Extensión UNRC', '≥ 12 visitas/año', 'Jornadas']
          ]
        }
      }
    ]
  },
  {
    id: 'con-cap-5',
    num: '5',
    titulo: 'Glosario Consolidado y Normas Universitarias',
    tags: ['glosario', 'unrc', 'fce', 'cmi', 'auditoria', 'regla cero', 'terminos'],
    resumen: 'Definiciones del modelo consolidado y compendio de normas contables profesionales (RT 22 FACPCE).',
    secciones: [
      {
        subtitulo: '5.1. Terminología Económico-Productiva',
        parrafos: [
          '• RT 22 (Resolución Técnica N° 22 de la FACPCE): Norma contable profesional argentina referida a la actividad agropecuaria. Establece la valuación a Valor Neto de Realización (VNR) para activos biológicos con mercado activo transparente (capones y novillos) y a costo acumulado de reposición para aquellos en desarrollo.',
          '• Regla Cero: Principio de neutralización matemática según el cual las transacciones entre dependencias del mismo ente contable deben cancelarse recíprocamente sin generar ganancias ni pérdidas ficticias.',
          '• CMI (Balanced Scorecard): Sistema de gestión estratégica desarrollado por Kaplan y Norton que traduce la misión de Pozo del Carril en un mapa integrado de indicadores financieros y no financieros.',
          '• VNR (Valor Neto de Realización): Precio de venta de mercado menos los costos directos necesarios para realizar la venta (flete, comisiones de consignatario e impuestos específicos).'
        ]
      }
    ]
  }
];
