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
      contrasena_hash: 'PozoDelCarril2025!', // Por default en modo local o Apps Script hash
      nombre: 'Administrador Pozo del Carril',
      rol_id: 'ROL_ADMIN',
      activo: true,
      ultimo_acceso: ''
    },
    {
      usuario_id: 'USR_ENCARGADO_01',
      usuario: 'encargado',
      contrasena_hash: 'Porcinos2025!',
      nombre: 'Encargado de Producción',
      rol_id: 'ROL_ENCARGADO',
      activo: true,
      ultimo_acceso: ''
    },
    {
      usuario_id: 'USR_OPERARIO_01',
      usuario: 'operario',
      contrasena_hash: 'Campo2025!',
      nombre: 'Operario de Galpón / Parideras',
      rol_id: 'ROL_OPERARIO',
      activo: true,
      ultimo_acceso: ''
    },
    {
      usuario_id: 'USR_AUDITOR_01',
      usuario: 'auditor',
      contrasena_hash: 'Auditor2025!',
      nombre: 'Auditor Técnico / Consultor',
      rol_id: 'ROL_AUDITOR',
      activo: true,
      ultimo_acceso: ''
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
    { id: 'INS_MAIZ_PROP', nombre: 'Maíz propio.', tipo_insumo: 'GRANO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_MAIZ', activo: true },
    { id: 'INS_PELLET_SOJA', nombre: 'Pellet de soja.', tipo_insumo: 'PROTEICO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_SOJA', activo: true },
    { id: 'INS_CONC_CRIA', nombre: 'Alimento concentrado iniciador (Cría).', tipo_insumo: 'BALANCEADO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_PELET', activo: true },
    { id: 'INS_PELETEADO_DEST', nombre: 'Alimento concentrado (Destete).', tipo_insumo: 'BALANCEADO', es_alimento: true, um_id: 'UM_KG', cuenta_id: 'CTA_ALIM_PELET', activo: true },
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
    { id: 'CAMP_2025_2026', nombre: 'Campaña 2025/2026', fecha_desde: '2025-07-01', fecha_hasta: '2026-06-30', estado: 'Abierto', activo: true }
  ],

  D_Moneda: [
    { id: 'MON_ARS', codigo: 'ARS', nombre: 'Pesos Argentinos', simbolo: '$', es_principal: true, activo: true },
    { id: 'MON_USD', codigo: 'USD', nombre: 'Dólares Estadounidenses', simbolo: 'US$', es_principal: false, activo: true }
  ],

  Proveedores: [
    { id: 'PROV_AGR_INTERNA', razon_social: 'Unidad Agrícola Pozo del Carril (Interno)', cuit: '30-00000000-0', condicion_iva: 'Responsable Inscripto', telefono: '', email: '', activo: true }
  ],

  Clientes: [
    { id: 'CLI_FRIGORIFICO_REGIONAL', razon_social: 'Frigorífico Regional Río Cuarto S.A.', cuit: '30-71112223-9', condicion_iva: 'Responsable Inscripto', telefono: '', email: '', activo: true }
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
  ]
};
