/**
 * @file constants.ts
 * @description Constantes y carga inicial estrictamente confirmada en el relevamiento
 * Sección 12 del requerimiento: "No inventes ningún dato. Solo se precargan los datos confirmados".
 */

import { BaseDatosPorcina } from '../types/schema';

export const INITIAL_DATABASE_STATE: BaseDatosPorcina = {
  Usuarios: [
    {
      usuario_id: 'USR_ADMIN_01',
      usuario: 'admin',
      contrasena_hash: 'sha256:34b1c15f07216d9f931c074f33bced2c7464dc6a71b668eac018875d9625e733',
      nombre: 'Administrador Pozo del Carril',
      email: 'admin@unrc.edu.ar',
      rol_id: 'ROL_ADMIN',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_ENCARGADO_01',
      usuario: 'encargado',
      contrasena_hash: 'sha256:393aa16dfde4f6cd97e23fe9e21a097eaad96723c2a1bf8401c0518997928721',
      nombre: 'Encargado de Producción',
      email: 'encargado@unrc.edu.ar',
      rol_id: 'ROL_ENCARGADO',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_OPERARIO_01',
      usuario: 'operario',
      contrasena_hash: 'sha256:027e6d4db49f88c9673342cd04871b48ddaaad6ecc3fce261f3448c5ab66205b',
      nombre: 'Operario de Galpón / Parideras',
      email: 'operario@unrc.edu.ar',
      rol_id: 'ROL_OPERARIO',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_AUDITOR_01',
      usuario: 'auditor',
      contrasena_hash: 'sha256:dfb1af6cfe6c2b99cb880623309d2b80b967041a2a722f5b0e2f8ac52a8fb417',
      nombre: 'Auditor Técnico / Consultor',
      email: 'auditor@unrc.edu.ar',
      rol_id: 'ROL_AUDITOR',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_MVTVQD8D_107',
      usuario: 'juangallardo',
      contrasena_hash: 'sha256:b248a34ed0d29cbc64d9b008d5a2e79ffb2ebb69a10e3ca558b62b36c4d720b4',
      nombre: 'Juan Gallardo',
      email: 'jgallardo@eco.unrc.edu.ar',
      rol_id: 'ROL_ADMIN',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_MVTVRZTC_274',
      usuario: 'susanamussolini',
      contrasena_hash: 'sha256:b248a34ed0d29cbc64d9b008d5a2e79ffb2ebb69a10e3ca558b62b36c4d720b4',
      nombre: 'Susana Mussolini',
      email: 'mmussolini@eco.unrc.edu.ar',
      rol_id: 'ROL_ADMIN',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_MVTW01LT_796',
      usuario: 'pablopagano',
      contrasena_hash: 'sha256:b248a34ed0d29cbc64d9b008d5a2e79ffb2ebb69a10e3ca558b62b36c4d720b4',
      nombre: 'Pablo Pagano',
      email: 'ppagano@eco.unrc.edu.ar',
      rol_id: 'ROL_ADMIN',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_MVTVWLFX_093',
      usuario: 'nataliamartinez',
      contrasena_hash: 'sha256:28ec6c4ff5f23084c3f8374b08d7cc896f7593ee64a1bfb41b92e72128b1fbfc',
      nombre: 'Natalia Martinez',
      email: 'nataliamartinez@eco.unrc.edu.ar',
      rol_id: 'ROL_ENCARGADO',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_MVTVXN5B_357',
      usuario: 'lucreciabissio',
      contrasena_hash: 'sha256:28ec6c4ff5f23084c3f8374b08d7cc896f7593ee64a1bfb41b92e72128b1fbfc',
      nombre: 'Lucrecia Bissio',
      email: 'lbissio@eco.unrc.edu.ar',
      rol_id: 'ROL_ENCARGADO',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_MVTVYA5J_954',
      usuario: 'virginiacassano',
      contrasena_hash: 'sha256:73dcc37bf3f4c3d832f30c498efb1baa3102115d057e3034784c5e1a33bcbea3',
      nombre: 'Virginia Cassano',
      email: 'vcassano@eco.unrc.edu.ar',
      rol_id: 'ROL_OPERARIO',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_MVTVYTF6_051',
      usuario: 'matiaspenalba',
      contrasena_hash: 'sha256:73dcc37bf3f4c3d832f30c498efb1baa3102115d057e3034784c5e1a33bcbea3',
      nombre: 'Matias Penalba',
      email: 'mpenalba@eco.unrc.edu.ar',
      rol_id: 'ROL_OPERARIO',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_MVTVZKJQ_616',
      usuario: 'marianaarburua',
      contrasena_hash: 'sha256:2ef8c32d6f0d4fcaa4f568a3d8e864750fd65718f21017af1a77a5301a0d4093',
      nombre: 'Mariana Arburua',
      email: 'marburua@eco.unrc.edu.ar',
      rol_id: 'ROL_AUDITOR',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    },
    {
      usuario_id: 'USR_LUISBIANCO_01',
      usuario: 'luisbianco',
      contrasena_hash: 'sha256:2ef8c32d6f0d4fcaa4f568a3d8e864750fd65718f21017af1a77a5301a0d4093',
      nombre: 'Luis Gabriel Bianco',
      email: 'gabi_94@hotmail.es',
      rol_id: 'ROL_AUDITOR',
      activo: true,
      ultimo_acceso: '',
      sync_status: 'SINCRONIZADO'
    }
  ],

  Roles: [
    {
      rol_id: 'ROL_ADMIN',
      nombre: 'Administrador General',
      permisos_acciones: 'ALL',
      activo: true
    },
    {
      rol_id: 'ROL_ENCARGADO',
      nombre: 'Encargado de Producción',
      permisos_acciones: 'VER,CARGAR,CONFIRMAR,CERRAR,AUTORIZAR_EXCEPCION',
      activo: true
    },
    {
      rol_id: 'ROL_OPERARIO',
      nombre: 'Operario de Campo',
      permisos_acciones: 'VER,CARGAR_BORRADOR',
      activo: true
    },
    {
      rol_id: 'ROL_AUDITOR',
      nombre: 'Auditor / Consultor',
      permisos_acciones: 'VER_TODO,AUDITORIA',
      activo: true
    }
  ],

  Config_Sistema: [
    { parametro: 'ESTABLECIMIENTO', valor: 'Pozo del Carril - La Aguada', descripcion: 'Nombre del establecimiento agropecuario', fecha_modificacion: '2026-10-05' },
    { parametro: 'UNIDAD_PRINCIPAL', valor: 'Unidad C - Producción Porcina', descripcion: 'Unidad de costeo y gestión', fecha_modificacion: '2026-10-05' },
    { parametro: 'MONEDA_DEFECTO', valor: 'ARS', descripcion: 'Moneda de presentación de estados de resultados', fecha_modificacion: '2026-10-05' },
    { parametro: 'CAMPANA_ACTIVA', valor: 'CAMP_2024_2025', descripcion: 'Campaña en curso con movimientos abiertos', fecha_modificacion: '2026-10-05' },
    { parametro: 'MODO_SISTEMA', valor: 'LOCAL_O_SHEETS', descripcion: 'Estado de conexión bidireccional', fecha_modificacion: '2026-10-05' }
  ],

  Referencias_Relevadas: [
    { id: 'REF_PLANTEL', indicador: 'Plantel activo de madres', valor: 34, periodo: 'Línea de base relevada', fuente: 'Encargado del establecimiento', origen_dato: 'REAL', notas: 'Plantel base líneas Landrace x Yorkshire' },
    { id: 'REF_PARTOS_TOTAL', indicador: 'Partos fechados registrados', valor: 71, periodo: 'Octubre 2024 - Agosto 2026', fuente: 'Libro de parición del establecimiento', origen_dato: 'REAL', notas: 'Partos confirmados' },
    { id: 'REF_PARTOS_ANIO', indicador: 'Partos por madre por año', valor: 2.06, periodo: 'Octubre 2024 - Agosto 2026', fuente: 'Cálculo sobre registros reales', origen_dato: 'REAL', notas: 'Desempeño reproductivo real' },
    { id: 'REF_INTERVALO', indicador: 'Intervalo medio entre partos (días)', valor: 177, periodo: 'Octubre 2024 - Agosto 2026', fuente: 'Registros de pariciones consecutivas', origen_dato: 'REAL', notas: 'Días promedio entre partos' },
    { id: 'REF_GESTACION', indicador: 'Duración media de gestación (días)', valor: 114.3, periodo: 'Octubre 2024 - Agosto 2026', fuente: 'Registros de parición', origen_dato: 'REAL', notas: 'Duración biológica real' },
    { id: 'REF_NACIDOS_VIVOS', indicador: 'Nacidos vivos promedio por camada', valor: 11.56, periodo: 'Octubre 2024 - Agosto 2026', fuente: 'Registros de partos', origen_dato: 'REAL', notas: 'Promedio histórico real' },
    { id: 'REF_DESTETADOS', indicador: 'Destetados promedio por camada', valor: 9.92, periodo: 'Octubre 2024 - Agosto 2026', fuente: 'Registros de destete', origen_dato: 'REAL', notas: 'Promedio histórico real' },
    { id: 'REF_SUPERVIVENCIA', indicador: 'Supervivencia al destete (%)', valor: 85.81, periodo: 'Octubre 2024 - Agosto 2026', fuente: 'Relación destetados / nacidos vivos', origen_dato: 'REAL', notas: 'Cercana al 86%' },
    { id: 'REF_ICA_ENGORDE', indicador: 'Índice Conversión Alimenticia (ICA) Engorde', valor: 3.0, periodo: 'Vigente', fuente: 'Declarado por el encargado', origen_dato: 'REAL', notas: '3 kg de alimento por kg de ganancia' },
    { id: 'REF_ICA_DESTETE', indicador: 'Índice Conversión Alimenticia (ICA) Destete', valor: 1.75, periodo: 'Estimación provisoria', fuente: 'Grupo 2 - Taller Práctica II', origen_dato: 'SUPUESTO', notas: 'Pendiente de reemplazo por consumo real cuando se releve' },
    { id: 'REF_PARTICIP_ALIM', indicador: 'Participación alimentación en costo total (%)', valor: '65% - 75%', periodo: 'Relevamiento productivo', fuente: 'Informe técnico de la unidad', origen_dato: 'REFERENCIA EXTERNA', notas: 'Mayor componente de costo en porcinos' }
  ],

  D_UnidadNeg: [
    { id: 'UN_PORCINA', nombre: 'Producción Porcina', tipo_actividad: 'GANADERA_INTENSIVA', activo: true },
    { id: 'UN_AGRICULTURA', nombre: 'Agricultura (Maíz y Soja)', tipo_actividad: 'ORIGEN_TRANSFERENCIAS', activo: true },
    { id: 'UN_BOVINOS', nombre: 'Producción Bovina', tipo_actividad: 'DESTINO_TRANSFERENCIAS', activo: true },
    { id: 'UN_OVINOS', nombre: 'Producción Ovina', tipo_actividad: 'DESTINO_TRANSFERENCIAS', activo: true }
  ],

  D_Subunidad: [
    { id: 'SUB_PLANTEL_REP', unidad_neg_id: 'UN_PORCINA', nombre: 'Plantel Reproductor', tipo: 'PRODUCTIVA', activo: true },
    { id: 'SUB_CRIA', unidad_neg_id: 'UN_PORCINA', nombre: 'Cría', tipo: 'PRODUCTIVA', activo: true },
    { id: 'SUB_DESTETE_REC', unidad_neg_id: 'UN_PORCINA', nombre: 'Destete/Recría', tipo: 'PRODUCTIVA', activo: true },
    { id: 'SUB_ENGORDE_TERM', unidad_neg_id: 'UN_PORCINA', nombre: 'Engorde/Terminación', tipo: 'PRODUCTIVA', activo: true }
  ],

  Fases_Proceso: [
    { id: 'FASE_CRIA', nombre: 'Cría', orden: 1, peso_min: 0, peso_max: 9, duracion_referencia_dias: 28, subunidad_id: 'SUB_CRIA', activo: true },
    { id: 'FASE_DESTETE_REC', nombre: 'Destete/Recría', orden: 2, peso_min: 9, peso_max: 45, duracion_referencia_dias: 60, subunidad_id: 'SUB_DESTETE_REC', activo: true },
    { id: 'FASE_ENGORDE_TERM', nombre: 'Engorde/Terminación', orden: 3, peso_min: 45, peso_max: 100, duracion_referencia_dias: 90, subunidad_id: 'SUB_ENGORDE_TERM', activo: true }
  ],

  Categorias_SENASA: [
    { id: 'CAT_LECHON', nombre: 'Lechón', peso_min: null, peso_max: null, sexo_aplica: 'AMBOS', activo: true },
    { id: 'CAT_CACHORRO', nombre: 'Cachorro/Cachorra', peso_min: null, peso_max: null, sexo_aplica: 'AMBOS', activo: true },
    { id: 'CAT_CAPON', nombre: 'Capón', peso_min: null, peso_max: null, sexo_aplica: 'MACHO_CASTRADO', activo: true },
    { id: 'CAT_MEJ', nombre: 'Macho Entero Joven', peso_min: null, peso_max: null, sexo_aplica: 'MACHO', activo: true },
    { id: 'CAT_CERDA_DESC', nombre: 'Cerda de Descarte/Refugo', peso_min: null, peso_max: null, sexo_aplica: 'HEMBRA', activo: true },
    { id: 'CAT_PADRILLO_DESC', nombre: 'Verraco/Padrillo de Descarte', peso_min: null, peso_max: null, sexo_aplica: 'MACHO', activo: true }
  ],

  Sectores_Fisicos: [
    { id: 'SEC_GALPON_GEST', nombre: 'Galpón de Gestación', tipo_instalacion: 'GALPON_CUBIERTO', capacidad_estimada: 40, activo: true },
    { id: 'SEC_PARIDERAS_CAMPO', nombre: 'Parideras de Campo', tipo_instalacion: 'PARIDERA_MOVIL', capacidad_estimada: 20, activo: true },
    { id: 'SEC_CORRALES_DESTETE', nombre: 'Pista de Destete/Recría', tipo_instalacion: 'CORRAL_CON_COMEDERO', capacidad_estimada: 120, activo: true },
    { id: 'SEC_PISTAS_ENGORDE', nombre: 'Pistas de Terminación a Campo', tipo_instalacion: 'CORRAL_AL_AIRE_LIBRE', capacidad_estimada: 150, activo: true }
  ],

  D_Producto: [
    { id: 'PROD_CAPON_TERM', nombre: 'Capón terminado a faena', categoria_senasa_id: 'CAT_CAPON', um_id: 'UM_KG', activo: true },
    { id: 'PROD_LECHON_VIVO', nombre: 'Lechón faenado / para consumo', categoria_senasa_id: 'CAT_LECHON', um_id: 'UM_CAB', activo: true },
    { id: 'PROD_CERDA_DESC', nombre: 'Cerda de descarte', categoria_senasa_id: 'CAT_CERDA_DESC', um_id: 'UM_KG', activo: true },
    { id: 'PROD_PADRILLO_DESC', nombre: 'Padrillo de descarte', categoria_senasa_id: 'CAT_PADRILLO_DESC', um_id: 'UM_KG', activo: true }
  ],

  D_Insumo: [
    { id: 'INS_MAIZ_PROP', nombre: 'Maíz propio', tipo_insumo: 'GRANO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_MAIZ', activo: true },
    { id: 'INS_PELLET_SOJA', nombre: 'Pellet de soja', tipo_insumo: 'PROTEICO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_SOJA', activo: true },
    { id: 'INS_CONC_CRIA', nombre: 'Alimento concentrado iniciador (Cría)', tipo_insumo: 'BALANCEADO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_PELET', activo: true },
    { id: 'INS_PELETEADO_DEST', nombre: 'Alimento concentrado (Destete)', tipo_insumo: 'BALANCEADO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_PELET', activo: true },
    { id: 'INS_VACUNA_SANIDAD', nombre: 'Vacunas y desparasitantes porcinos', tipo_insumo: 'VETERINARIA', es_alimento: false, um_id: 'UM_UN', cuenta_id: 'CTA_SANIDAD', activo: true }
  ],

  D_Cuenta: [
    { id: 'CTA_ALIM_MAIZ', codigo: '5.1.01.01', nombre: 'Alimentación - Maíz', rubro: 'Costos Directos Producción', tipo_cuenta: 'RESULTADO_NEGATIVO', imputable: true, activo: true },
    { id: 'CTA_ALIM_SOJA', codigo: '5.1.01.02', nombre: 'Alimentación - Pellet de Soja', rubro: 'Costos Directos Producción', tipo_cuenta: 'RESULTADO_NEGATIVO', imputable: true, activo: true },
    { id: 'CTA_ALIM_PELET', codigo: '5.1.01.03', nombre: 'Alimentación - Peleteado Iniciador', rubro: 'Costos Directos Producción', tipo_cuenta: 'RESULTADO_NEGATIVO', imputable: true, activo: true },
    { id: 'CTA_SANIDAD', codigo: '5.1.02.01', nombre: 'Sanidad y Productos Veterinarios', rubro: 'Costos Directos Producción', tipo_cuenta: 'RESULTADO_NEGATIVO', imputable: true, activo: true },
    { id: 'CTA_MANO_OBRA_DIR', codigo: '5.1.03.01', nombre: 'Mano de Obra Directa de Campo', rubro: 'Costos Directos Producción', tipo_cuenta: 'RESULTADO_NEGATIVO', imputable: true, activo: true },
    { id: 'CTA_ESTRUCTURA_GRAL', codigo: '5.2.01.01', nombre: 'Gastos de Mantenimiento e Indirectos', rubro: 'Costos Indirectos y Estructura', tipo_cuenta: 'RESULTADO_NEGATIVO', imputable: true, activo: true },
    { id: 'CTA_VENTAS_HACIENDA', codigo: '4.1.01.01', nombre: 'Ventas de Hacienda Porcina', rubro: 'Ingresos Operativos', tipo_cuenta: 'RESULTADO_POSITIVO', imputable: true, activo: true }
  ],

  D_UM: [
    { id: 'UM_KG', codigo: 'kg', descripcion: 'Kilogramo vivo / faena', activo: true },
    { id: 'UM_TN', codigo: 'tn', descripcion: 'Tonelada métrica (1.000 kg)', activo: true },
    { id: 'UM_CAB', codigo: 'cab', descripcion: 'Cabezas de ganado', activo: true },
    { id: 'UM_UN', codigo: 'un', descripcion: 'Unidad simple / Dosis', activo: true }
  ],

  D_Conversion: [
    { id: 'CONV_TN_KG', um_origen_id: 'UM_TN', um_destino_id: 'UM_KG', factor_conversion: 1000, activo: true },
    { id: 'CONV_KG_TN', um_origen_id: 'UM_KG', um_destino_id: 'UM_TN', factor_conversion: 0.001, activo: true }
  ],

  D_Campana: [
    { id: 'CAMP_2024_2025', nombre: 'Campaña 2024/2025', fecha_desde: '2024-07-01', fecha_hasta: '2025-06-30', estado: 'Abierto', activo: true },
    { id: 'CAMP_2025_2026', nombre: 'Campaña 2025/2026', fecha_desde: '2025-07-01', fecha_hasta: '2026-06-30', estado: 'Abierto', activo: true },
    { id: 'CAMP_2026_2027', nombre: 'Campaña 2026/2027', fecha_desde: '2026-07-01', fecha_hasta: '2027-06-30', estado: 'Abierto', activo: true }
  ],

  D_Moneda: [
    { id: 'MON_ARS', codigo: 'ARS', nombre: 'Pesos Argentinos', simbolo: '$', es_principal: true, activo: true },
    { id: 'MON_USD', codigo: 'USD', nombre: 'Dólares Estadounidenses', simbolo: 'US$', es_principal: false, activo: true }
  ],

  Proveedores: [
    {
      id: 'PROV_AGR_INTERNA',
      razon_social: 'Unidad Agrícola Pozo del Carril (Interno)',
      cuit: '30-00000000-0',
      rubro_actividad: 'Granos y Forrajes Propios',
      tipo_suministro: 'Granos y Forrajes Propios',
      condicion_iva: 'Responsable Inscripto',
      direccion: 'Establecimiento Pozo del Carril - La Aguada',
      localidad: 'Río Cuarto',
      provincia: 'Córdoba',
      telefono: '0358-4676200',
      email: 'agricola@pozodelcarril.unrc.edu.ar',
      condiciones_pago: 'Compensación Interna',
      activo: true,
      sync_status: 'SINCRONIZADO'
    },
    {
      id: 'PROV_MVQSJ2BM_088',
      razon_social: 'Veterinaria & Nutrición Animal Río Cuarto',
      cuit: '30-71458923-4',
      rubro_actividad: 'Sanidad y Nutrición Animal',
      tipo_suministro: 'Sanidad y Nutrición Animal',
      condicion_iva: 'Responsable Inscripto',
      direccion: 'Ruta Nacional 36 Km 601',
      localidad: 'Río Cuarto',
      provincia: 'Córdoba',
      telefono: '0358-4676100',
      email: 'ventas@vetnutricion.com.ar',
      condiciones_pago: 'Cuenta Corriente 30 días',
      activo: true,
      sync_status: 'SINCRONIZADO'
    },
    {
      id: 'PROV_ACA_CBA',
      razon_social: 'Asociación de Cooperativas Argentinas (ACA)',
      cuit: '30-50012088-2',
      rubro_actividad: 'Granos y Concentrados Proteicos',
      tipo_suministro: 'Pellet de Soja y Núcleos Vitamínicos',
      condicion_iva: 'Responsable Inscripto',
      direccion: 'Parque Industrial Río Cuarto',
      localidad: 'Río Cuarto',
      provincia: 'Córdoba',
      telefono: '0358-4645200',
      email: 'acariocuarto@acacoop.com.ar',
      condiciones_pago: 'Canje Cereal / 15 días',
      activo: true,
      sync_status: 'SINCRONIZADO'
    }
  ],

  Clientes: [
    {
      id: 'CLI_FRIGORIFICO_REGIONAL',
      razon_social: 'Frigorífico Regional Río Cuarto S.A.',
      cuit: '30-71112223-9',
      tipo_persona: 'Jurídica',
      condicion_iva: 'Responsable Inscripto',
      direccion: 'Av. Sabattini 3800',
      localidad: 'Río Cuarto',
      provincia: 'Córdoba',
      telefono: '0358-4623100',
      email: 'hacienda@frigorificoriocuarto.com.ar',
      condiciones_pago: 'Plazo 15 días s/ faena',
      activo: true,
      sync_status: 'SINCRONIZADO'
    },
    {
      id: 'CLI_CONSIGNATARIA_SUR',
      razon_social: 'Consignataria del Sur Hacienda S.R.L.',
      cuit: '30-68945120-7',
      tipo_persona: 'Jurídica',
      condicion_iva: 'Responsable Inscripto',
      direccion: 'Sociedad Rural Río Cuarto',
      localidad: 'Río Cuarto',
      provincia: 'Córdoba',
      telefono: '0358-4638900',
      email: 'remates@consignatariasur.com.ar',
      condiciones_pago: 'Contado 7 días',
      activo: true,
      sync_status: 'SINCRONIZADO'
    }
  ],

  Medios_Pago: [
    { id: 'MP_EFE', nombre: 'Efectivo en Caja', tipo: 'CONTADO', activo: true },
    { id: 'MP_TRANSF', nombre: 'Transferencia Bancaria CBU', tipo: 'BANCARIO', activo: true },
    { id: 'MP_ECHEQ', nombre: 'Cheque de Pago Diferido / Echeq', tipo: 'CREDITO', activo: true },
    { id: 'MP_INTERNO', nombre: 'Compensación de Cuenta Interna (Agro)', tipo: 'COMPENSACION', activo: true }
  ],

  Tipos_Operacion: [
    { id: 'TOP_COMPRA', codigo: 'COMPRA', descripcion: 'Compra de Insumo / Animal', activo: true },
    { id: 'TOP_VENTA', codigo: 'VENTA', descripcion: 'Venta de Hacienda / Subproducto', activo: true },
    { id: 'TOP_TRANSF', codigo: 'TRANSFERENCIA', descripcion: 'Transferencia entre unidades / sectores', activo: true },
    { id: 'TOP_AJUSTE', codigo: 'AJUSTE', descripcion: 'Ajuste de inventario físico', activo: true }
  ],

  Tipos_Evento_Fisico: [
    { id: 'TEV_NACIMIENTO', codigo: 'NACIMIENTO', descripcion: 'Nacimiento de lechones (ingreso a Cría)', activo: true },
    { id: 'TEV_PASE_FASE', codigo: 'PASE_FASE', descripcion: 'Pase a siguiente fase productiva', activo: true },
    { id: 'TEV_MUERTE', codigo: 'MUERTE', descripcion: 'Baja por mortandad', activo: true },
    { id: 'TEV_DESCARTE', codigo: 'DESCARTE', descripcion: 'Baja por descarte productivo', activo: true },
    { id: 'TEV_VENTA', codigo: 'VENTA', descripcion: 'Egreso físico por venta comercial', activo: true },
    { id: 'TEV_AJUSTE', codigo: 'AJUSTE', descripcion: 'Ajuste de cabezas o kilos', activo: true }
  ],

  Tipos_Comprobante: [
    { id: 'TC_FAC_A', codigo: 'FA', descripcion: 'Factura A', activo: true },
    { id: 'TC_FAC_B', codigo: 'FB', descripcion: 'Factura B', activo: true },
    { id: 'TC_LIQ_SENASA', codigo: 'LS', descripcion: 'Liquidación Electrónica / DTe SENASA', activo: true },
    { id: 'TC_REMITO', codigo: 'REM', descripcion: 'Remito Interno de Movimiento', activo: true },
    { id: 'TC_VALE', codigo: 'VAL', descripcion: 'Vale de Consumo Interno', activo: true }
  ],

  Lotes_Animales: [
    {
      id: 'LOTE_CRIA_01',
      codigo_lote: 'LOTE_CRIA_MADRE01_20241010',
      fecha_formacion: '2024-10-10',
      origen: 'Parto Madre MADRE_01 (12 nacidos vivos)',
      fase_actual_id: 'FASE_CRIA',
      subunidad_id: 'SUB_CRIA',
      sector_fisico_id: 'SEC_PARIDERAS_CAMPO',
      cabezas_actuales: 10,
      kg_actuales: 82.0,
      estado: 'Cerrado'
    },
    {
      id: 'LOTE_CRIA_03',
      codigo_lote: 'LOTE_CRIA_MADRE03_20250201',
      fecha_formacion: '2025-02-01',
      origen: 'Parto Madre MADRE_03 (12 nacidos vivos)',
      fase_actual_id: 'FASE_CRIA',
      subunidad_id: 'SUB_CRIA',
      sector_fisico_id: 'SEC_PARIDERAS_CAMPO',
      cabezas_actuales: 11,
      kg_actuales: 92.4,
      estado: 'Activo'
    },
    {
      id: 'LOTE_REC_01',
      codigo_lote: 'LOTE_REC_2024_06',
      fecha_formacion: '2024-06-15',
      origen: 'Destete camada de junio 2024',
      fase_actual_id: 'FASE_DESTETE_REC',
      subunidad_id: 'SUB_DESTETE_REC',
      sector_fisico_id: 'SEC_CORRALES_DESTETE',
      cabezas_actuales: 70,
      kg_actuales: 2240,
      estado: 'Cerrado'
    },
    {
      id: 'LOTE_ENG_01',
      codigo_lote: 'LOTE_ENG_2024_08',
      fecha_formacion: '2024-08-15',
      origen: 'Ingreso a engorde desde LOTE_REC_01',
      fase_actual_id: 'FASE_ENGORDE_TERM',
      subunidad_id: 'SUB_ENGORDE_TERM',
      sector_fisico_id: 'SEC_PISTAS_ENGORDE',
      cabezas_actuales: 70,
      kg_actuales: 6860,
      estado: 'Cerrado'
    },
    {
      id: 'LOTE_ENG_02',
      codigo_lote: 'LOTE_ENG_2024_11',
      fecha_formacion: '2024-11-25',
      origen: 'Ingreso a engorde camada primavera',
      fase_actual_id: 'FASE_ENGORDE_TERM',
      subunidad_id: 'SUB_ENGORDE_TERM',
      sector_fisico_id: 'SEC_PISTAS_ENGORDE',
      cabezas_actuales: 75,
      kg_actuales: 7400,
      estado: 'Cerrado'
    },
    {
      id: 'LOTE_ENG_ACTIVO',
      codigo_lote: 'LOTE_ENG_ACTIVO_2026',
      fecha_formacion: '2026-08-01',
      origen: 'Piara actual en engorde y terminación',
      fase_actual_id: 'FASE_ENGORDE_TERM',
      subunidad_id: 'SUB_ENGORDE_TERM',
      sector_fisico_id: 'SEC_PISTAS_ENGORDE',
      cabezas_actuales: 85,
      kg_actuales: 8330,
      estado: 'Activo'
    }
  ],
  Madres_Padrillos: [
    {
      id: 'MADRE_01',
      identificacion_caravana: 'PC-M01',
      tipo_animal: 'MADRE',
      linea_genetica: 'Landrace x Yorkshire',
      fecha_ingreso: '2023-03-01',
      estado: 'ACTIVA'
    },
    {
      id: 'MADRE_02',
      identificacion_caravana: 'PC-M02',
      tipo_animal: 'MADRE',
      linea_genetica: 'Landrace x Yorkshire',
      fecha_ingreso: '2023-04-15',
      estado: 'ACTIVA'
    }
  ],

  Criterios_Prorrateo: [
    {
      id: 'CRIT_LECHON_DEST',
      criterio: 'Prorrateo Plantel Reproductor por lechón destetado',
      driver: 'LECHONES_DESTETADOS',
      periodo: 'MENSUAL',
      subunidades_destino: 'SUB_CRIA,SUB_DESTETE_REC',
      activo: true
    },
    {
      id: 'CRIT_KG_PRODUCIDO',
      criterio: 'Prorrateo de costos indirectos por kg de carne producida',
      driver: 'KG_PRODUCIDOS',
      periodo: 'CAMPAÑA',
      subunidades_destino: 'SUB_DESTETE_REC,SUB_ENGORDE_TERM',
      activo: true
    }
  ],

  F_EstandarRinde: [
    {
      id: 'EST_RINDE_ENGORDE',
      campana_id: 'CAMP_2024_2025',
      subunidad_id: 'SUB_ENGORDE_TERM',
      indicador_rendimiento: 'Ganancia Diaria de Peso (GDP)',
      valor_esperado: 0.61, // 55 kg ganancia / 90 días aprox.
      um_id: 'UM_KG',
      origen_dato: 'REFERENCIA EXTERNA'
    }
  ],

  F_Dosis: [
    {
      id: 'DOS_ENGORDE_ICA',
      fase_id: 'FASE_ENGORDE_TERM',
      subunidad_id: 'SUB_ENGORDE_TERM',
      insumo_id: 'INS_MAIZ_PROP',
      cantidad_kg_ganancia: 3.0, // 3:1 declarado por el encargado
      um_id: 'UM_KG',
      vigencia_desde: '2024-07-01',
      origen_dato: 'REAL'
    },
    {
      id: 'DOS_DESTETE_ICA',
      fase_id: 'FASE_DESTETE_REC',
      subunidad_id: 'SUB_DESTETE_REC',
      insumo_id: 'INS_PELETEADO_DEST',
      cantidad_kg_ganancia: 1.75, // 1.75:1 Supuesto provisorio del grupo
      um_id: 'UM_KG',
      vigencia_desde: '2024-07-01',
      origen_dato: 'SUPUESTO'
    }
  ],

  Mov_Comercial_Enc: [
    {
      id: 'MOV_VENTA_001',
      tipo_comprobante_id: 'TC_LIQ_SENASA',
      punto_venta: '0001',
      numero_comprobante: '00000412',
      fecha: '2024-11-20',
      cliente_id: 'CLI_FRIGORIFICO_REGIONAL',
      tipo_operacion: 'VENTA',
      unidad_neg_id: 'UN_PORCINA',
      subunidad_id: 'SUB_ENGORDE_TERM',
      campana_id: 'CAMP_2024_2025',
      total_neto: 11180000,
      total_iva: 1173900,
      total_percepciones: 0,
      total_retenciones: 0,
      total_final: 12353900,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      creado_por: 'admin',
      fecha_creacion: '2024-11-20',
      fecha_confirmacion: '2024-11-20'
    },
    {
      id: 'MOV_VENTA_002',
      tipo_comprobante_id: 'TC_LIQ_SENASA',
      punto_venta: '0001',
      numero_comprobante: '00000458',
      fecha: '2025-03-15',
      cliente_id: 'CLI_FRIGORIFICO_REGIONAL',
      tipo_operacion: 'VENTA',
      unidad_neg_id: 'UN_PORCINA',
      subunidad_id: 'SUB_ENGORDE_TERM',
      campana_id: 'CAMP_2024_2025',
      total_neto: 12950000,
      total_iva: 1359750,
      total_percepciones: 0,
      total_retenciones: 0,
      total_final: 14309750,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      creado_por: 'admin',
      fecha_creacion: '2025-03-15',
      fecha_confirmacion: '2025-03-15'
    }
  ],
  Mov_Comercial_Det: [
    {
      id: 'DET_VENTA_001',
      mov_comercial_id: 'MOV_VENTA_001',
      numero_linea: 1,
      producto_id: 'PROD_CAPON_TERM',
      categoria_senasa_id: 'CAT_CAPON',
      cantidad_animales: 70,
      kg: 6860,
      precio_unitario_real: 1629.74,
      precio_sugerido_rosporc: 1610.00,
      desvio_precio_rosporc: 19.74,
      cabezas_muertas_transporte: 0,
      importe_neto: 11180000,
      alicuota_iva: 10.5,
      importe_iva: 1173900,
      destino_productivo_id: 'SUB_ENGORDE_TERM'
    },
    {
      id: 'DET_VENTA_002',
      mov_comercial_id: 'MOV_VENTA_002',
      numero_linea: 1,
      producto_id: 'PROD_CAPON_TERM',
      categoria_senasa_id: 'CAT_CAPON',
      cantidad_animales: 75,
      kg: 7400,
      precio_unitario_real: 1750.00,
      precio_sugerido_rosporc: 1720.00,
      desvio_precio_rosporc: 30.00,
      cabezas_muertas_transporte: 0,
      importe_neto: 12950000,
      alicuota_iva: 10.5,
      importe_iva: 1359750,
      destino_productivo_id: 'SUB_ENGORDE_TERM'
    }
  ],
  F_PrecioIns: [],
  F_PrecioProd: [],
  F_Costos: [
    {
      id: 'CST_ALIM_01',
      fecha: '2024-11-15',
      cuenta_id: 'CTA_ALIM_MAIZ',
      unidad_neg_id: 'UN_PORCINA',
      subunidad_id: 'SUB_ENGORDE_TERM',
      fase_id: 'FASE_ENGORDE_TERM',
      origen_costo: 'CONSUMO',
      importe_neto: 5200000,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK'
    },
    {
      id: 'CST_SOJA_01',
      fecha: '2024-11-18',
      cuenta_id: 'CTA_ALIM_SOJA',
      unidad_neg_id: 'UN_PORCINA',
      subunidad_id: 'SUB_ENGORDE_TERM',
      fase_id: 'FASE_ENGORDE_TERM',
      origen_costo: 'COMPRA',
      importe_neto: 2450000,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK'
    },
    {
      id: 'CST_SANIDAD_01',
      fecha: '2024-12-05',
      cuenta_id: 'CTA_SANIDAD',
      unidad_neg_id: 'UN_PORCINA',
      subunidad_id: 'SUB_CRIA',
      fase_id: 'FASE_CRIA',
      origen_costo: 'COMPRA',
      importe_neto: 380000,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK'
    },
    {
      id: 'CST_MO_01',
      fecha: '2024-12-30',
      cuenta_id: 'CTA_MANO_OBRA_DIR',
      unidad_neg_id: 'UN_PORCINA',
      subunidad_id: 'SUB_ENGORDE_TERM',
      origen_costo: 'PRORRATEO',
      importe_neto: 1800000,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK'
    }
  ],
  F_Ingresos: [],
  Movimientos_Fisicos: [
    {
      id: 'MF_CRIA_01_INI',
      fecha: '2024-10-10',
      tipo_evento: 'NACIMIENTO',
      lote_id: 'LOTE_CRIA_01',
      madre_id: 'MADRE_01',
      cantidad_cabezas: 10,
      kg_totales: 14.0, // 1.40 kg promedio al nacer
      fase_destino_id: 'FASE_CRIA',
      sector_destino_id: 'SEC_PARIDERAS_CAMPO',
      categoria_senasa_id: 'CAT_LECHON',
      motivo: 'Nacimiento verificado parto MADRE_01',
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      observacion_validacion: 'Pesaje inicial de camada verificado en libro de maternidad.',
      creado_por: 'encargado',
      fecha_creacion: '2024-10-10'
    },
    {
      id: 'MF_CRIA_01_FIN',
      fecha: '2024-11-07',
      tipo_evento: 'PASE_FASE',
      lote_id: 'LOTE_CRIA_01',
      cantidad_cabezas: 10,
      kg_totales: 82.0, // 8.20 kg promedio al destete (28 días de lactancia)
      fase_origen_id: 'FASE_CRIA',
      fase_destino_id: 'FASE_DESTETE_REC',
      sector_origen_id: 'SEC_PARIDERAS_CAMPO',
      sector_destino_id: 'SEC_CORRALES_DESTETE',
      categoria_senasa_id: 'CAT_LECHON',
      motivo: 'Destete camada a los 28 días',
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      observacion_validacion: 'Pesaje final de lactancia y transferencia a recría.',
      creado_por: 'encargado',
      fecha_creacion: '2024-11-07'
    },
    {
      id: 'MF_REC_01_INI',
      fecha: '2024-06-15',
      tipo_evento: 'PASE_FASE',
      lote_id: 'LOTE_REC_01',
      cantidad_cabezas: 70,
      kg_totales: 630.0, // 9.00 kg promedio ingreso destete
      fase_destino_id: 'FASE_DESTETE_REC',
      sector_destino_id: 'SEC_CORRALES_DESTETE',
      categoria_senasa_id: 'CAT_CACHORRO',
      motivo: 'Ingreso lote camada junio a pista de destete/recría',
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      observacion_validacion: 'Pesaje inicial de ingreso a recría registrado.',
      creado_por: 'encargado',
      fecha_creacion: '2024-06-15'
    },
    {
      id: 'MF_REC_01_FIN',
      fecha: '2024-08-15',
      tipo_evento: 'PASE_FASE',
      lote_id: 'LOTE_REC_01',
      cantidad_cabezas: 70,
      kg_totales: 2240.0, // 32.00 kg promedio egreso recría (61 días permanencia)
      fase_origen_id: 'FASE_DESTETE_REC',
      fase_destino_id: 'FASE_ENGORDE_TERM',
      sector_origen_id: 'SEC_CORRALES_DESTETE',
      sector_destino_id: 'SEC_PISTAS_ENGORDE',
      categoria_senasa_id: 'CAT_CACHORRO',
      motivo: 'Transferencia de lote a pistas de engorde/terminación',
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      observacion_validacion: 'Pesaje final de recría al pase a engorde.',
      creado_por: 'encargado',
      fecha_creacion: '2024-08-15'
    },
    {
      id: 'MF_ENG_01_INI',
      fecha: '2024-08-15',
      tipo_evento: 'PASE_FASE',
      lote_id: 'LOTE_ENG_01',
      cantidad_cabezas: 70,
      kg_totales: 2240.0, // 32.00 kg promedio ingreso
      fase_destino_id: 'FASE_ENGORDE_TERM',
      sector_destino_id: 'SEC_PISTAS_ENGORDE',
      categoria_senasa_id: 'CAT_CAPON',
      motivo: 'Recepción lote 70 cabezas en pista de engorde',
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      observacion_validacion: 'Pesaje inicial de lote al iniciar fase de engorde.',
      creado_por: 'encargado',
      fecha_creacion: '2024-08-15'
    },
    {
      id: 'MF_ENG_01_FIN',
      fecha: '2024-11-20',
      tipo_evento: 'VENTA',
      lote_id: 'LOTE_ENG_01',
      cantidad_cabezas: 70,
      kg_totales: 6860.0, // 98.00 kg promedio venta (97 días permanencia)
      fase_origen_id: 'FASE_ENGORDE_TERM',
      sector_origen_id: 'SEC_PISTAS_ENGORDE',
      categoria_senasa_id: 'CAT_CAPON',
      motivo: 'Despacho a faena frigorífico liquidación 001',
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      observacion_validacion: 'Pesaje final de egreso a frigorífico verificado en balanza oficial.',
      creado_por: 'encargado',
      fecha_creacion: '2024-11-20'
    },
    {
      id: 'MF_ENG_02_INI',
      fecha: '2024-11-25',
      tipo_evento: 'PASE_FASE',
      lote_id: 'LOTE_ENG_02',
      cantidad_cabezas: 75,
      kg_totales: 2475.0, // 33.00 kg promedio ingreso
      fase_destino_id: 'FASE_ENGORDE_TERM',
      sector_destino_id: 'SEC_PISTAS_ENGORDE',
      categoria_senasa_id: 'CAT_CAPON',
      motivo: 'Ingreso camada primavera a engorde',
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      observacion_validacion: 'Pesaje inicial ingreso Lote 02.',
      creado_por: 'encargado',
      fecha_creacion: '2024-11-25'
    },
    {
      id: 'MF_ENG_02_FIN',
      fecha: '2025-03-15',
      tipo_evento: 'VENTA',
      lote_id: 'LOTE_ENG_02',
      cantidad_cabezas: 75,
      kg_totales: 7400.0, // 98.67 kg promedio venta (110 días permanencia)
      fase_origen_id: 'FASE_ENGORDE_TERM',
      sector_origen_id: 'SEC_PISTAS_ENGORDE',
      categoria_senasa_id: 'CAT_CAPON',
      motivo: 'Despacho a faena frigorífico liquidación 002',
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      observacion_validacion: 'Pesaje final egreso faena Lote 02 verificado.',
      creado_por: 'encargado',
      fecha_creacion: '2025-03-15'
    }
  ],
  Partos: [
    {
      id: 'PAR_001',
      madre_id: 'MADRE_01',
      fecha_parto: '2024-10-10',
      nacidos_vivos: 12,
      nacidos_muertos: 1,
      bajas_lactancia: 2,
      destetados: 10,
      peso_promedio_destete: 8.2,
      fecha_destete: '2024-11-07',
      lote_generado_id: 'LOTE_CRIA_MADRE01_20241010',
      lote_destete_id: 'LOTE_REC_2024_11',
      campana_id: 'CAMP_2024_2025',
      estado: 'Confirmado',
      origen_dato: 'REAL'
    },
    {
      id: 'PAR_002',
      madre_id: 'MADRE_02',
      fecha_parto: '2024-10-14',
      nacidos_vivos: 11,
      nacidos_muertos: 0,
      bajas_lactancia: 1,
      destetados: 10,
      peso_promedio_destete: 8.5,
      fecha_destete: '2024-11-11',
      lote_generado_id: 'LOTE_CRIA_MADRE02_20241014',
      lote_destete_id: 'LOTE_REC_2024_11',
      campana_id: 'CAMP_2024_2025',
      estado: 'Confirmado',
      origen_dato: 'REAL'
    },
    {
      id: 'PAR_003',
      madre_id: 'MADRE_03',
      fecha_parto: '2025-02-01',
      nacidos_vivos: 12,
      nacidos_muertos: 1,
      bajas_lactancia: 1,
      destetados: 0,
      lote_generado_id: 'LOTE_CRIA_MADRE03_20250201',
      campana_id: 'CAMP_2024_2025',
      estado: 'Confirmado',
      origen_dato: 'REAL'
    }
  ],
  Movimientos_Stock_Insumos: [],
  Consumo_Alimento_Real: [
    {
      id: 'CON_001',
      fecha: '2024-11-15',
      insumo_id: 'INS_MAIZ_PROP',
      kg_consumidos: 18000,
      fase_id: 'FASE_ENGORDE_TERM',
      subunidad_id: 'SUB_ENGORDE_TERM',
      costo_unitario_imputado: 288.88,
      costo_total_imputado: 5200000,
      estado: 'Confirmado',
      origen_dato: 'REAL',
      estado_validacion: 'OK',
      creado_por: 'encargado',
      fecha_creacion: '2024-11-15'
    }
  ],
  Movimientos_Internos: [],
  Movimientos_Financieros: [],
  Costos_Indirectos: [
    {
      id: 'IND_001',
      campana_id: 'CAMP_2024_2025',
      periodo: '2024-11',
      cuenta_id: 'CTA_ESTRUCTURA_GRAL',
      criterio_prorrateo_id: 'CRIT_KG_PRODUCIDO',
      importe_total: 950000,
      subunidad_destino_id: 'SUB_ENGORDE_TERM',
      importe_prorrateado: 950000,
      estado: 'Confirmado'
    }
  ],
  Existencias_Hacienda: [
    {
      id: 'EX_CAPONES_01',
      campana_id: 'CAMP_2024_2025',
      fecha_cierre: '2024-12-31',
      subunidad_id: 'SUB_ENGORDE_TERM',
      fase_id: 'FASE_ENGORDE_TERM',
      categoria_senasa_id: 'CAT_CAPON',
      cabezas: 85,
      kg_totales: 8330,
      base_valuacion: 'VNR',
      valor_unitario: 1666.45, // VNR sugerido ROSPORC descontado gastos
      valor_total: 13881528.5,
      fuente_valor: 'ROSPORC - BCR menos flete y comisión comercial',
      estado: 'Confirmado'
    }
  ],
  Cierres_Periodo: [],
  Auditoria_Cambios: [],
  Historial_Estados: [],

  // Presupuesto operativo real (Requerimiento 7)
  Presupuestos: [
    {
      id: 'PRE_CAMP_2024_2025_BASE',
      campana_id: 'CAMP_2024_2025',
      nombre: 'Presupuesto Operativo Campaña 2024/2025',
      version: 'APROBADA',
      es_base_comparacion: true,
      fecha_creacion: '2024-07-01',
      creado_por: 'admin',
      criterio_utilizado: 'Referencias históricas reales (FCE UNRC Grupo 2)',
      observaciones: 'Presupuesto formulado con base técnica del establecimiento Pozo del Carril.',
      cabezas_previstas: 150,
      kg_venta_previstos: 15000,
      items: [
        {
          id: 'IT_PRE_01',
          presupuesto_id: 'PRE_CAMP_2024_2025_BASE',
          concepto: 'Ventas de Capones faena (150 cab. x 100 kg)',
          tipo: 'INGRESO',
          rubro: 'Ventas Capones',
          cantidad_prevista: 15000,
          um: 'kg',
          precio_unitario_previsto: 1650,
          importe_presupuestado: 24750000
        },
        {
          id: 'IT_PRE_02',
          presupuesto_id: 'PRE_CAMP_2024_2025_BASE',
          concepto: 'Maíz propio de agricultura (ICA 3:1)',
          tipo: 'COSTO',
          rubro: 'Alimentación - Maíz',
          cantidad_prevista: 36000,
          um: 'kg',
          precio_unitario_previsto: 280,
          importe_presupuestado: 10080000
        },
        {
          id: 'IT_PRE_03',
          presupuesto_id: 'PRE_CAMP_2024_2025_BASE',
          concepto: 'Concentrado proteico / Pellet de soja',
          tipo: 'COSTO',
          rubro: 'Alimentación - Pellets',
          cantidad_prevista: 9000,
          um: 'kg',
          precio_unitario_previsto: 520,
          importe_presupuestado: 4680000
        },
        {
          id: 'IT_PRE_04',
          presupuesto_id: 'PRE_CAMP_2024_2025_BASE',
          concepto: 'Alimento peleteado iniciador destete',
          tipo: 'COSTO',
          rubro: 'Alimentación - Peleteado',
          cantidad_prevista: 2500,
          um: 'kg',
          precio_unitario_previsto: 780,
          importe_presupuestado: 1950000
        },
        {
          id: 'IT_PRE_05',
          presupuesto_id: 'PRE_CAMP_2024_2025_BASE',
          concepto: 'Sanidad, vacunas y desparasitantes',
          tipo: 'COSTO',
          rubro: 'Sanidad',
          cantidad_prevista: 150,
          um: 'cab',
          precio_unitario_previsto: 3200,
          importe_presupuestado: 480000
        },
        {
          id: 'IT_PRE_06',
          presupuesto_id: 'PRE_CAMP_2024_2025_BASE',
          concepto: 'Mano de obra directa de campo (asignación)',
          tipo: 'COSTO',
          rubro: 'Mano de Obra',
          cantidad_prevista: 6,
          um: 'meses',
          precio_unitario_previsto: 600000,
          importe_presupuestado: 3600000
        },
        {
          id: 'IT_PRE_07',
          presupuesto_id: 'PRE_CAMP_2024_2025_BASE',
          concepto: 'Energía eléctrica y bombeo agua de pozo',
          tipo: 'COSTO',
          rubro: 'Energía y Agua',
          cantidad_prevista: 6,
          um: 'meses',
          precio_unitario_previsto: 120000,
          importe_presupuestado: 720000
        },
        {
          id: 'IT_PRE_08',
          presupuesto_id: 'PRE_CAMP_2024_2025_BASE',
          concepto: 'Fletes y comercialización hacienda',
          tipo: 'COSTO',
          rubro: 'Comercialización',
          cantidad_prevista: 15000,
          um: 'kg',
          precio_unitario_previsto: 45,
          importe_presupuestado: 675000
        },
        {
          id: 'IT_PRE_09',
          presupuesto_id: 'PRE_CAMP_2024_2025_BASE',
          concepto: 'Mantenimiento de instalaciones y comederos',
          tipo: 'COSTO',
          rubro: 'Mantenimiento',
          cantidad_prevista: 1,
          um: 'global',
          precio_unitario_previsto: 450000,
          importe_presupuestado: 450000
        }
      ]
    }
  ],

  // Despachos a Frigorífico con control de transporte (Requerimiento 8)
  Despachos_Transporte: [
    {
      id: 'DESP_001',
      mov_comercial_id: 'MOV_VENTA_001',
      fecha: '2024-11-20',
      lote_id: 'LOTE_ENG_01',
      cabezas_despachadas: 70,
      cabezas_muertas_llegada: 0,
      frigorifico: 'Frigorífico Regional Río Cuarto S.A.',
      transportista: 'Transporte Don Pedro · Jaula Porcina Doble Piso',
      vehiculo_patente: 'AF 342 KL',
      origen_dato: 'REAL',
      estado: 'Confirmado',
      observaciones: 'Llegada en óptimas condiciones zoosanitarias. Sin mermas por asfixia ni traumatismos.'
    },
    {
      id: 'DESP_002',
      mov_comercial_id: 'MOV_VENTA_002',
      fecha: '2025-03-15',
      lote_id: 'LOTE_ENG_02',
      cabezas_despachadas: 75,
      cabezas_muertas_llegada: 0,
      frigorifico: 'Frigorífico Regional Río Cuarto S.A.',
      transportista: 'Transporte Don Pedro · Jaula Porcina Doble Piso',
      vehiculo_patente: 'AF 342 KL',
      origen_dato: 'REAL',
      estado: 'Confirmado',
      observaciones: 'Viaje nocturno con temperatura templada. Cero bajas a la descarga.'
    }
  ],
  Visitas_Estudiantiles: [
    {
      id: 'VIS_001',
      fecha: '2024-09-12',
      institucion: 'Universidad Nacional de Río Cuarto (UNRC)',
      carrera_catedra: 'Facultad de Agronomía y Veterinaria · Producción Porcina',
      cantidad_estudiantes: 28,
      responsable: 'Dr. Ing. Agr. Responsable de Unidad',
      observaciones: 'Visita técnica a parideras de campo y galpón de gestación.',
      estado: 'Realizada',
      origen_dato: 'REAL'
    },
    {
      id: 'VIS_002',
      fecha: '2024-10-18',
      institucion: 'Instituto Agrotécnico Regional',
      carrera_catedra: 'Técnico en Producción Agropecuaria',
      cantidad_estudiantes: 35,
      responsable: 'Encargado de Producción',
      observaciones: 'Recorrida por instalaciones de destete y recría a campo.',
      estado: 'Realizada',
      origen_dato: 'REAL'
    },
    {
      id: 'VIS_003',
      fecha: '2025-04-10',
      institucion: 'Universidad Nacional de Río Cuarto (UNRC)',
      carrera_catedra: 'FCE · Taller de Práctica Profesional II',
      cantidad_estudiantes: 22,
      responsable: 'Equipo Docente y Coordinador Técnico',
      observaciones: 'Relevamiento de costos y circuito productivo.',
      estado: 'Realizada',
      origen_dato: 'REAL'
    },
    {
      id: 'VIS_004',
      fecha: '2025-10-22',
      institucion: 'Universidad Nacional de Río Cuarto (UNRC)',
      carrera_catedra: 'Medicina Veterinaria · Enfermedades Porcinas',
      cantidad_estudiantes: 30,
      responsable: 'Encargado de Producción',
      observaciones: 'Monitoreo de bioseguridad y plan de vacunación en piara.',
      estado: 'Realizada',
      origen_dato: 'REAL'
    },
    {
      id: 'VIS_005',
      fecha: '2026-05-15',
      institucion: 'Colegio Agrotécnico Regional',
      carrera_catedra: 'Producción Porcina Intensiva',
      cantidad_estudiantes: 25,
      responsable: 'Responsable de Extensión',
      observaciones: 'Jornada práctica de alimentación y pesaje.',
      estado: 'Programada',
      origen_dato: 'REAL'
    }
  ],

  // Datos Multi-Actividad Establecimiento Pozo del Carril · La Aguada (UNRC)
  Lotes_Agricolas: [
    { id: 'LOTE_01', nombre: 'Lote 1 - Campo Norte', superficie_ha: 45, cultivo_actual: 'Maíz', campana_id: 'CAMP_2024_2025', rendimiento_estimado_qq_ha: 85, rendimiento_real_qq_ha: 82.4, estado_fenologico: 'Cosechado / Rastrojo', activo: true },
    { id: 'LOTE_02', nombre: 'Lote 2 - Campo Sur', superficie_ha: 60, cultivo_actual: 'Soja', campana_id: 'CAMP_2024_2025', rendimiento_estimado_qq_ha: 34, rendimiento_real_qq_ha: 36.1, estado_fenologico: 'Cosechado / Rastrojo', activo: true },
    { id: 'LOTE_03', nombre: 'Lote 3 - El Ombú', superficie_ha: 35, cultivo_actual: 'Maíz', campana_id: 'CAMP_2024_2025', rendimiento_estimado_qq_ha: 80, rendimiento_real_qq_ha: 78.5, estado_fenologico: 'Cosechado', activo: true },
    { id: 'LOTE_04', nombre: 'Lote 4 - El Molino', superficie_ha: 50, cultivo_actual: 'Soja', campana_id: 'CAMP_2024_2025', rendimiento_estimado_qq_ha: 32, rendimiento_real_qq_ha: 33.8, estado_fenologico: 'Cosechado', activo: true },
    { id: 'LOTE_05', nombre: 'Lote 5 - Bajo Ganadero', superficie_ha: 40, cultivo_actual: 'Pastura', campana_id: 'CAMP_2024_2025', rendimiento_estimado_qq_ha: 0, rendimiento_real_qq_ha: 0, estado_fenologico: 'Pastoreo Rotativo', activo: true }
  ],

  Labores_Agricolas: [
    { id: 'LAB_001', lote_id: 'LOTE_01', tipo_labor: 'Siembra', cultivo: 'Maíz', fecha: '2024-10-18', insumo_aplicado: 'Híbrido Dekalb 72-27 VT3P', dosis_ha: '72.000 semillas/ha', costo_total_estimado: 4850000, contratista_o_personal: 'Maquinaria UNRC', observaciones: 'Siembra directa sobre rastrojo de trigo' },
    { id: 'LAB_002', lote_id: 'LOTE_01', tipo_labor: 'Fertilización', cultivo: 'Maíz', fecha: '2024-11-20', insumo_aplicado: 'Urea granulada 46%', dosis_ha: '180 kg/ha', costo_total_estimado: 3240000, contratista_o_personal: 'Personal Pozo del Carril', observaciones: 'Fertilización en V6 pre-lluvia' },
    { id: 'LAB_003', lote_id: 'LOTE_01', tipo_labor: 'Cosecha', cultivo: 'Maíz', fecha: '2025-04-12', insumo_aplicado: '-', dosis_ha: '-', costo_total_estimado: 2900000, contratista_o_personal: 'Contratista Cosecha Regional', observaciones: 'Rendimiento promedio 82.4 qq/ha. Humedad 14.2%' },
    { id: 'LAB_004', lote_id: 'LOTE_02', tipo_labor: 'Siembra', cultivo: 'Soja', fecha: '2024-11-10', insumo_aplicado: 'Semilla Don Mario 40R21', dosis_ha: '48 kg/ha', costo_total_estimado: 3900000, contratista_o_personal: 'Maquinaria UNRC', observaciones: 'Inoculada con Bradyrhizobium' },
    { id: 'LAB_005', lote_id: 'LOTE_02', tipo_labor: 'Cosecha', cultivo: 'Soja', fecha: '2025-04-28', insumo_aplicado: '-', dosis_ha: '-', costo_total_estimado: 3100000, contratista_o_personal: 'Contratista Cosecha Regional', observaciones: 'Rinde obtenido: 36.1 qq/ha' }
  ],

  Transferencias_Granos: [
    { id: 'TRF_001', fecha: '2025-04-20', grano: 'Maíz', kg_transferidos: 35000, unidad_origen_id: 'UN_AGRICULTURA', unidad_destino_id: 'UN_PORCINA', precio_fas_teorico_por_kg: 165.00, valor_total_transferencia: 5775000, remito_interno_nro: 'REM-INT-001', observaciones: 'Descarga a silo pulmón planta de alimento porcino. Calidad grado 2.', estado: 'Confirmado' },
    { id: 'TRF_002', fecha: '2025-05-05', grano: 'Maíz', kg_transferidos: 15000, unidad_origen_id: 'UN_AGRICULTURA', unidad_destino_id: 'UN_BOVINOS', precio_fas_teorico_por_kg: 168.50, valor_total_transferencia: 2527500, remito_interno_nro: 'REM-INT-002', observaciones: 'Suplementación grano entero en autocomedero para terneros destete.', estado: 'Confirmado' },
    { id: 'TRF_003', fecha: '2025-05-18', grano: 'Maíz', kg_transferidos: 4000, unidad_origen_id: 'UN_AGRICULTURA', unidad_destino_id: 'UN_OVINOS', precio_fas_teorico_por_kg: 168.50, valor_total_transferencia: 674000, remito_interno_nro: 'REM-INT-003', observaciones: 'Flushing previo a servicio de otoño para majada ovina.', estado: 'Confirmado' },
    { id: 'TRF_004', fecha: '2025-06-02', grano: 'Maíz', kg_transferidos: 30000, unidad_origen_id: 'UN_AGRICULTURA', unidad_destino_id: 'UN_PORCINA', precio_fas_teorico_por_kg: 172.00, valor_total_transferencia: 5160000, remito_interno_nro: 'REM-INT-004', observaciones: 'Reposición silo engorde porcino.', estado: 'Confirmado' }
  ],

  Categorias_Bovinas: [
    { id: 'BOV_VACAS', categoria: 'Vientre/Vaca', cabezas: 118, peso_promedio_kg: 440, potrero_actual: 'Potrero 1 - Bajos del Arroyo', adpv_objetivo_kg_dia: 0.15, adpv_real_kg_dia: 0.12, estado_sanitario: 'Al día' },
    { id: 'BOV_TOROS', categoria: 'Toro', cabezas: 4, peso_promedio_kg: 780, potrero_actual: 'Potrero 1 - Bajos del Arroyo', adpv_objetivo_kg_dia: 0.20, adpv_real_kg_dia: 0.18, estado_sanitario: 'Al día' },
    { id: 'BOV_VAQ', categoria: 'Vaquillona', cabezas: 28, peso_promedio_kg: 330, potrero_actual: 'Potrero 2 - La Aguada', adpv_objetivo_kg_dia: 0.55, adpv_real_kg_dia: 0.58, estado_sanitario: 'Al día' },
    { id: 'BOV_NOV', categoria: 'Novillo', cabezas: 54, peso_promedio_kg: 365, potrero_actual: 'Potrero 3 - Las Acacias', adpv_objetivo_kg_dia: 0.85, adpv_real_kg_dia: 0.82, estado_sanitario: 'Al día' },
    { id: 'BOV_TERN', categoria: 'Ternero/a', cabezas: 92, peso_promedio_kg: 175, potrero_actual: 'Potrero 4 - Silo Comedero', adpv_objetivo_kg_dia: 0.70, adpv_real_kg_dia: 0.74, estado_sanitario: 'Al día' }
  ],

  Pesadas_Bovinas: [
    { id: 'PES_BOV_01', fecha: '2025-03-15', categoria_id: 'BOV_NOV', lote_o_caravana: 'Tropa Novillitos 2024', peso_kg: 310, adpv_calculado: 0.79, dias_periodo: 45, observaciones: 'Pesada de entrada a pastoreo con suplementación' },
    { id: 'PES_BOV_02', fecha: '2025-05-01', categoria_id: 'BOV_NOV', lote_o_caravana: 'Tropa Novillitos 2024', peso_kg: 348, adpv_calculado: 0.84, dias_periodo: 47, observaciones: 'Excelente respuesta a suplementación con maíz propio' },
    { id: 'PES_BOV_03', fecha: '2025-06-15', categoria_id: 'BOV_NOV', lote_o_caravana: 'Tropa Novillitos 2024', peso_kg: 385, adpv_calculado: 0.82, dias_periodo: 45, observaciones: 'Control pre-invernada' },
    { id: 'PES_BOV_04', fecha: '2025-05-10', categoria_id: 'BOV_TERN', lote_o_caravana: 'Terneros Destetados 2025', peso_kg: 175, adpv_calculado: 0.74, dias_periodo: 30, observaciones: 'Peso promedio al destete convencional' }
  ],

  Eventos_Sanitarios_Bovinos: [
    { id: 'SAN_BOV_01', fecha: '2025-04-10', tipo_evento: 'Vacunación Aftosa', cabezas_tratadas: 296, producto_aplicado: 'Aftosa Bivalente Biogénesis Bagó', responsable: 'SENASA / Plan Local UNRC', certificado_senasa_nro: 'ACTA-2025-0941', observaciones: 'Campaña oficial 1ra ronda 2025. Cobertura 100% rodeo.' },
    { id: 'SAN_BOV_02', fecha: '2025-04-10', tipo_evento: 'Vacunación Carbunclo', cabezas_tratadas: 204, producto_aplicado: 'Carbunclo Cepa Sterne', responsable: 'Méd. Vet. Establecimiento', certificado_senasa_nro: 'ACTA-2025-0942', observaciones: 'Mayores de 6 meses.' },
    { id: 'SAN_BOV_03', fecha: '2025-05-20', tipo_evento: 'Desparasitación', cabezas_tratadas: 92, producto_aplicado: 'Ivermectina 3.15%', responsable: 'Personal de Campo', observaciones: 'Desparasitación estratégica a terneros destetados.' },
    { id: 'SAN_BOV_04', fecha: '2025-06-05', tipo_evento: 'Brucelosis', cabezas_tratadas: 28, producto_aplicado: 'Cepa 19 Liofilizada', responsable: 'SENASA / Plan Local', certificado_senasa_nro: 'ACTA-2025-1102', observaciones: 'Terneras de 3 a 8 meses para reposición' }
  ],

  Animales_Bovinos: [
    { id: 'ANM_BOV_001', caravana: 'UNRC-A-101', caravana_rfid: '032000084920111', categoria: 'Toro', sexo: 'Macho', raza: 'Angus Negro', linea_destino: 'Cabaña Angus', etapa_actual: 'Engorde', fecha_nacimiento_ingreso: '2022-09-15', peso_actual_kg: 810, adpv_acumulado_kg: 0.95, condicion_corporal: 7, estado_productivo: 'En Servicio', lote_o_potrero: 'Potrero 1 - Bajos del Arroyo', origen: 'Cabaña Pozo del Carril', unidad_neg_id: 'UN_BOVINOS', observaciones: 'Toro Padre Pedigree - Alta fertilidad y facilidad de parto' },
    { id: 'ANM_BOV_002', caravana: 'UNRC-A-102', caravana_rfid: '032000084920112', categoria: 'Toro', sexo: 'Macho', raza: 'Angus Colorado', linea_destino: 'Cabaña Angus', etapa_actual: 'Engorde', fecha_nacimiento_ingreso: '2023-03-20', peso_actual_kg: 740, adpv_acumulado_kg: 0.92, condicion_corporal: 6.5, estado_productivo: 'En Servicio', lote_o_potrero: 'Potrero 1 - Bajos del Arroyo', origen: 'Cabaña Pozo del Carril', unidad_neg_id: 'UN_BOVINOS', observaciones: 'Toro Puro Controlado - Destinado a venta en remate anual' },
    { id: 'ANM_BOV_003', caravana: 'UNRC-V-205', caravana_rfid: '032000084920205', categoria: 'Vaca de Cría', sexo: 'Hembra', raza: 'Angus Negro', linea_destino: 'Reposición', etapa_actual: 'Cría', fecha_nacimiento_ingreso: '2021-10-10', peso_actual_kg: 465, adpv_acumulado_kg: 0.15, condicion_corporal: 5.5, estado_productivo: 'Preñada', lote_o_potrero: 'Potrero 1 - Bajos del Arroyo', origen: 'Rodeo Propio', unidad_neg_id: 'UN_BOVINOS', observaciones: 'Preñez confirmada por tacto de 60 días' },
    { id: 'ANM_BOV_004', caravana: 'UNRC-V-206', caravana_rfid: '032000084920206', categoria: 'Vaca de Cría', sexo: 'Hembra', raza: 'Angus Colorado', linea_destino: 'Carne', etapa_actual: 'Cría', fecha_nacimiento_ingreso: '2021-11-04', peso_actual_kg: 450, adpv_acumulado_kg: 0.12, condicion_corporal: 5.0, estado_productivo: 'Preñada', lote_o_potrero: 'Potrero 1 - Bajos del Arroyo', origen: 'Rodeo Propio', unidad_neg_id: 'UN_BOVINOS', observaciones: 'Preñada en 1er celo con toro UNRC-A-101' },
    { id: 'ANM_BOV_005', caravana: 'UNRC-Q-310', caravana_rfid: '032000084920310', categoria: 'Vaquillona', sexo: 'Hembra', raza: 'Angus Negro', linea_destino: 'Cabaña Angus', etapa_actual: 'Recría', fecha_nacimiento_ingreso: '2023-09-02', peso_actual_kg: 345, adpv_acumulado_kg: 0.62, condicion_corporal: 6.0, estado_productivo: 'En Servicio', lote_o_potrero: 'Potrero 2 - La Aguada', origen: 'Rodeo Propio', unidad_neg_id: 'UN_BOVINOS', observaciones: 'Apta entore precoz a 15 meses' },
    { id: 'ANM_BOV_006', caravana: 'UNRC-N-412', caravana_rfid: '032000084920412', categoria: 'Novillito', sexo: 'Macho', raza: 'Angus Negro', linea_destino: 'Carne', etapa_actual: 'Adaptación', fecha_nacimiento_ingreso: '2024-04-14', peso_actual_kg: 335, adpv_acumulado_kg: 0.88, condicion_corporal: 6.0, estado_productivo: 'Engorde', lote_o_potrero: 'Potrero 3 - Las Acacias', origen: 'Destete Propio 2024', unidad_neg_id: 'UN_BOVINOS', observaciones: 'Tropa con destino a faena pesada' },
    { id: 'ANM_BOV_007', caravana: 'UNRC-N-415', caravana_rfid: '032000084920415', categoria: 'Novillito', sexo: 'Macho', raza: 'Angus Negro', linea_destino: 'Carne', etapa_actual: 'Engorde', fecha_nacimiento_ingreso: '2024-04-18', peso_actual_kg: 395, adpv_acumulado_kg: 0.94, condicion_corporal: 7.0, estado_productivo: 'Engorde', lote_o_potrero: 'Potrero 4 - Silo Comedero', origen: 'Destete Propio 2024', unidad_neg_id: 'UN_BOVINOS', observaciones: 'Terminación a corral con ración de maíz UNRC' }
  ],

  Servicios_Tactos_Bovinos: [
    { id: 'SRV_BOV_01', fecha: '2024-11-15', tipo: 'Inseminación Artificial (IATF)', toro_o_semen: 'Semen Angus Negro Línea Cabaña Tres Marías', lote_vientres: 'Lote 1 Vientres Seleccionados', cabezas_evaluadas: 60, cabezas_prenadas: 34, porcentaje_prenez: 56.7, responsable: 'Méd. Vet. Esp. Reproducción UNRC', observaciones: 'Protocolo IATF con DIB + Cipionato + eCG. Repaso con toros a campo.', estado: 'Confirmado' },
    { id: 'SRV_BOV_02', fecha: '2025-03-25', tipo: 'Diagnóstico de Preñez (Tacto)', toro_o_semen: 'Repaso Toros UNRC-A-101 y UNRC-A-102', lote_vientres: 'Rodeo General de Cría (118 vacas)', cabezas_evaluadas: 118, cabezas_prenadas: 104, porcentaje_prenez: 88.1, responsable: 'Cátedra de Producción Bovina UNRC', observaciones: 'Excelente preñez de cabeza y cuerpo. 14 vacas vacías asignadas a engorde.', estado: 'Confirmado' }
  ],

  Partos_Destetes_Bovinos: [
    { id: 'DST_BOV_01', fecha: '2025-03-10', tipo: 'Destete', categoria: 'Terneros/as Destete 2024/2025', cabezas: 96, peso_promedio_kg: 178, mortalidad_cabezas: 2, observaciones: 'Destete convencional con 7 meses promedio. Ajuste 205 días: 182 kg.', estado: 'Confirmado' },
    { id: 'PRT_BOV_01', fecha: '2024-09-20', tipo: 'Parto', categoria: 'Parición Primavera 2024', cabezas: 98, peso_promedio_kg: 33.5, mortalidad_cabezas: 1, observaciones: 'Parición concentrada en 60 días sin distocias asistidas.', estado: 'Confirmado' }
  ],

  Lotes_Engorde_Bovinos: [
    { id: 'LT_ENG_01', nombre_lote: 'Tropa Novillitos Invernada 2024', categoria: 'Novillitos', linea_destino: 'Carne', cabezas: 34, peso_inicial_kg: 280, peso_actual_kg: 395, ganancia_media_diaria_kg: 0.88, dias_engorde: 130, dieta_actual: 'Pastura Alfalfa + 1% Maíz', potrero: 'Potrero 3 - Las Acacias', estado: 'Activo' },
    { id: 'LT_ENG_02', nombre_lote: 'Lote Terminación Corral Alta Energía', categoria: 'Novillos', linea_destino: 'Carne', cabezas: 20, peso_inicial_kg: 350, peso_actual_kg: 422, ganancia_media_diaria_kg: 1.15, dias_engorde: 62, dieta_actual: 'Ración 75% Maíz entero + Concentrado Proteico + Fibra', potrero: 'Potrero 4 - Silo Comedero', estado: 'Activo' },
    { id: 'LT_ENG_03', nombre_lote: 'Vaquillonas Cabaña Angus', categoria: 'Vaquillonas', linea_destino: 'Cabaña Angus', cabezas: 12, peso_inicial_kg: 260, peso_actual_kg: 345, ganancia_media_diaria_kg: 0.65, dias_engorde: 130, dieta_actual: 'Pastura base festuca + rollo de alfalfa', potrero: 'Potrero 2 - La Aguada', estado: 'Activo' }
  ],

  Ventas_Hacienda_Bovinas: [
    {
      id: 'VTA_BOV_001',
      fecha: '2025-05-18',
      tipo_venta: 'Invernada / Faena',
      categoria: 'Novillos Pesados (410-430 kg)',
      comprador_o_consignatario: 'Consignataria Ganadera Río Cuarto S.R.L. / MAG Cañuelas',
      cabezas: 25,
      kg_vivos_totales: 10450,
      peso_promedio_kg: 418,
      precio_unitario: 2280.00, // $/kg vivo
      precio_referencia_mag: 2250.00,
      desvio_precio_mag: 30.00,
      importe_bruto: 23826000,
      gastos_comerciales_pct: 4.5,
      gastos_comerciales_total: 1072170,
      flete_total: 350000,
      importe_neto_liquidado: 22403830,
      dte_numero: 'DTE-SENASA-2025-088194',
      guia_policial_nro: 'GUIA-CBA-04419',
      estado: 'Confirmado',
      observaciones: 'Liquidación con plazo 14 días. Rendimiento en gancho estimado 58%.'
    },
    {
      id: 'VTA_BOV_002',
      fecha: '2024-10-30',
      tipo_venta: 'Cabaña (Reproductores)',
      categoria: 'Toros Angus P.C. 2 Años',
      comprador_o_consignatario: 'Establecimiento La Primavera / Remate Cabañas del Sur',
      cabezas: 2,
      kg_vivos_totales: 1520,
      peso_promedio_kg: 760,
      precio_unitario: 3500000.00, // $/cabeza
      precio_referencia_mag: 0,
      desvio_precio_mag: 0,
      importe_bruto: 7000000,
      gastos_comerciales_pct: 6.0,
      gastos_comerciales_total: 420000,
      flete_total: 120000,
      importe_neto_liquidado: 6460000,
      dte_numero: 'DTE-SENASA-2024-071102',
      guia_policial_nro: 'GUIA-CBA-03891',
      estado: 'Confirmado',
      observaciones: 'Venta de reproductores con certificado de fertilidad y raspaje negativo.'
    }
  ],

  Potreros_Bovinos: [
    { id: 'POT_01', nombre: 'Potrero 1 - Bajos del Arroyo', superficie_ha: 65, tipo_recurso: 'Pastura Alfalfa / Festuca', receptividad_ev_ha: 0.95, cabezas_asignadas: 122, ev_actual_total: 123.6, carga_actual_ev_ha: 1.90, estado_pastura: 'Bueno', observaciones: 'Rodeo de cría y toros con pastoreo rotativo con boyero' },
    { id: 'POT_02', nombre: 'Potrero 2 - La Aguada', superficie_ha: 40, tipo_recurso: 'Pastura Alfalfa / Festuca', receptividad_ev_ha: 1.10, cabezas_asignadas: 40, ev_actual_total: 30.4, carga_actual_ev_ha: 0.76, estado_pastura: 'Excelente', observaciones: 'Vaquillonas de reposición y lote Cabaña Angus' },
    { id: 'POT_03', nombre: 'Potrero 3 - Las Acacias', superficie_ha: 45, tipo_recurso: 'Verdeo de Invierno', receptividad_ev_ha: 1.25, cabezas_asignadas: 34, ev_actual_total: 30.6, carga_actual_ev_ha: 0.68, estado_pastura: 'Excelente', observaciones: 'Centeno + Vicia para recría de novillitos con suplementación' },
    { id: 'POT_04', nombre: 'Potrero 4 - Silo Comedero', superficie_ha: 15, tipo_recurso: 'Corral de Feedlot', receptividad_ev_ha: 0, cabezas_asignadas: 20, ev_actual_total: 18.0, carga_actual_ev_ha: 1.20, estado_pastura: 'Bajo Pastoreo Intensivo', observaciones: 'Corral de terminación con bebedero permanente y autocomedero' },
    { id: 'POT_05', nombre: 'Potrero 5 - Rastrojos Altos', superficie_ha: 35, tipo_recurso: 'Rastrojo de Maíz', receptividad_ev_ha: 0.70, cabezas_asignadas: 0, ev_actual_total: 0, carga_actual_ev_ha: 0, estado_pastura: 'Regular / Descanso', observaciones: 'Disponible para pastoreo de vacas secas post-cosecha' }
  ],

  Dieta_Racion_Bovina: [
    {
      id: 'DTA_01',
      nombre: 'Recría Pastoril con Suplementación',
      etapa_destino: 'Recría Pastoril',
      ingredientes: [
        { insumo: 'Pastura Alfalfa / Verdeos (a diente)', porcentaje_ms: 70, kg_dia_cab: 5.6 },
        { insumo: 'Maíz propio quebrado Pozo del Carril', porcentaje_ms: 25, kg_dia_cab: 2.0 },
        { insumo: 'Núcleo Mineral Bovino con Monensina', porcentaje_ms: 5, kg_dia_cab: 0.4 }
      ],
      kg_ms_dia_cab: 8.0,
      costo_estimado_cab_dia: 1420.00,
      adpv_esperado_kg_dia: 0.85,
      observaciones: 'Estrategia de bajo costo aprovechando grano cosechado en el campo.'
    },
    {
      id: 'DTA_02',
      nombre: 'Terminación a Corral (Feedlot Rápido)',
      etapa_destino: 'Terminación Alta Energía',
      ingredientes: [
        { insumo: 'Maíz grano entero seco UNRC', porcentaje_ms: 72, kg_dia_cab: 7.2 },
        { insumo: 'Concentrado Proteico Pelleteado 40%', porcentaje_ms: 18, kg_dia_cab: 1.8 },
        { insumo: 'Heno de Alfalfa picado (Fibra efectiva)', porcentaje_ms: 10, kg_dia_cab: 1.0 }
      ],
      kg_ms_dia_cab: 10.0,
      costo_estimado_cab_dia: 2850.00,
      adpv_esperado_kg_dia: 1.20,
      observaciones: 'Período de 50 a 70 días para engrase uniforme y grado 1-2 SENASA.'
    },
    {
      id: 'DTA_03',
      nombre: 'Preparación Reproductores Cabaña Angus',
      etapa_destino: 'Cabaña Angus Preparación',
      ingredientes: [
        { insumo: 'Avena grano entero', porcentaje_ms: 40, kg_dia_cab: 3.5 },
        { insumo: 'Maíz quebrado', porcentaje_ms: 30, kg_dia_cab: 2.6 },
        { insumo: 'Rollo Alfalfa primera calidad', porcentaje_ms: 25, kg_dia_cab: 2.2 },
        { insumo: 'Premix Mineral Cabaña', porcentaje_ms: 5, kg_dia_cab: 0.4 }
      ],
      kg_ms_dia_cab: 8.7,
      costo_estimado_cab_dia: 2600.00,
      adpv_esperado_kg_dia: 0.75,
      observaciones: 'Desarrollo muscular armónico sin sobreengrase testicular.'
    }
  ],

  Categorias_Ovinas: [
    { id: 'OVI_OVEJAS', categoria: 'Oveja de Cría', cabezas: 135, potrero_actual: 'Potrero Ovino 1 - Casco', estado_corporal: 3.2, estado_sanitario: 'Al día' },
    { id: 'OVI_CARNEROS', categoria: 'Carnero', cabezas: 5, potrero_actual: 'Potrero Ovino 1 - Casco', estado_corporal: 3.5, estado_sanitario: 'Al día' },
    { id: 'OVI_BORREGAS', categoria: 'Borrego/a', cabezas: 30, potrero_actual: 'Potrero Ovino 2 - Cañada', estado_corporal: 3.0, estado_sanitario: 'Al día' },
    { id: 'OVI_CORDEROS', categoria: 'Cordero/a', cabezas: 122, potrero_actual: 'Potrero Ovino 2 - Cañada', estado_corporal: 3.1, estado_sanitario: 'Al día' }
  ],

  Zafras_Laneras: [
    { id: 'ZAF_2024', fecha: '2024-10-25', campana_id: 'CAMP_2024_2025', animales_esquilados: 165, kg_lana_total: 627, kg_promedio_vellon: 3.8, finura_micras_aprox: 24.5, destino_comercial: 'Barraca Propietarios Río Cuarto', precio_obtenido_kg: 2450.00, observaciones: 'Esquila desmane tradicional con acondicionamiento PROLANA.' }
  ],

  Eventos_Sanitarios_Ovinos: [
    { id: 'SAN_OVI_01', fecha: '2024-11-15', tipo_evento: 'Señalada', cabezas_tratadas: 122, producto_aplicado: 'Caravana Senasa + Curabicheras', responsable: 'Encargado de Majada', observaciones: '122 corderos señalados sobre 135 ovejas (90.4% señalada).' },
    { id: 'SAN_OVI_02', fecha: '2025-03-22', tipo_evento: 'Vacunación Clostridial / Enterotoxemia', cabezas_tratadas: 170, producto_aplicado: 'Polivalente Clostridial 8 vías', responsable: 'Méd. Vet. Pozo del Carril', observaciones: 'Vacunación pre-parto y majada general.' },
    { id: 'SAN_OVI_03', fecha: '2025-05-15', tipo_evento: 'Desparasitación', cabezas_tratadas: 292, producto_aplicado: 'Levamisol al 12% oral', responsable: 'Personal de Majada', observaciones: 'Control nematodos gastrointestinales de otoño.' }
  ]
};
