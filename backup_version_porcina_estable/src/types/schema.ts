/**
 * @file schema.ts
 * @description Tipos e interfaces de datos para el Sistema de Gestión Porcina - Pozo del Carril
 * Taller de Práctica II - FCE UNRC - Grupo 2
 */

// Origen del dato estrictamente normado
export type OrigenDato = 'REAL' | 'SUPUESTO' | 'REFERENCIA EXTERNA';

// Estados de ciclo de vida transaccional
export type EstadoTransaccion = 'Borrador' | 'Confirmado' | 'Cerrado' | 'Anulado';

// Estado de validación (Integridad de datos)
export type EstadoValidacion = 'OK' | 'Observado';

// Roles del sistema
export type RolId = 'ROL_ADMIN' | 'ROL_ENCARGADO' | 'ROL_OPERARIO' | 'ROL_AUDITOR';

export interface Usuario {
  usuario_id: string;
  usuario: string;
  contrasena_hash?: string;
  nombre: string;
  rol_id: RolId | string;
  activo: boolean;
  ultimo_acceso?: string;
  requiere_cambio_clave?: boolean;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export interface Rol {
  rol_id: string;
  nombre: string;
  permisos_acciones: string;
  activo: boolean;
}

export interface ReferenciaRelevada {
  id: string;
  indicador: string;
  valor: string | number;
  periodo: string;
  fuente: string;
  origen_dato: OrigenDato;
  notas?: string;
}

export interface UnidadNegocio {
  id: string;
  nombre: string;
  tipo_actividad: string;
  activo: boolean;
}

export interface Subunidad {
  id: string;
  unidad_neg_id: string;
  nombre: string;
  tipo: 'PRODUCTIVA' | 'DE_APOYO';
  activo: boolean;
}

export interface FaseProceso {
  id: string;
  nombre: string;
  orden: number;
  peso_min: number;
  peso_max: number;
  duracion_referencia_dias?: number;
  subunidad_id: string;
  activo: boolean;
}

export interface CategoriaSENASA {
  id: string;
  nombre: string;
  peso_min?: number | null;
  peso_max?: number | null;
  sexo_aplica?: string;
  activo: boolean;
}

export interface Insumo {
  id: string;
  nombre: string;
  tipo_insumo: string;
  es_alimento: boolean;
  um_id: string;
  cuenta_id?: string;
  activo: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria_senasa_id: string;
  um_id: string;
  activo: boolean;
}

export interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  rubro: string;
  tipo_cuenta: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO_NETO' | 'RESULTADO_POSITIVO' | 'RESULTADO_NEGATIVO';
  imputable: boolean;
  activo: boolean;
}

export interface UnidadMedida {
  id: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export interface Campana {
  id: string;
  nombre: string;
  fecha_desde: string;
  fecha_hasta: string;
  estado: 'Abierto' | 'Cerrado';
  activo: boolean;
}

export interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  es_principal: boolean;
  activo: boolean;
}

export interface Proveedor {
  id: string;
  razon_social: string;
  cuit: string;
  condicion_iva?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  tipo_suministro?: string;
  condiciones_pago?: string;
  observaciones?: string;
  activo: boolean;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export interface Cliente {
  id: string;
  razon_social: string;
  cuit: string;
  condicion_iva?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  condiciones_pago?: string;
  observaciones?: string;
  activo: boolean;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export interface MedioPago {
  id: string;
  nombre: string;
  tipo: string;
  activo: boolean;
}

export interface SectorFisico {
  id: string;
  nombre: string;
  tipo_instalacion: string;
  capacidad_estimada?: number;
  activo: boolean;
}

export interface LoteAnimales {
  id: string;
  codigo_lote: string;
  fecha_formacion: string;
  origen: string;
  fase_actual_id: string;
  subunidad_id: string;
  sector_fisico_id: string;
  cabezas_actuales: number;
  kg_actuales: number;
  estado: 'Activo' | 'Cerrado';
}

export interface MadrePadrillo {
  id: string;
  identificacion_caravana: string;
  tipo_animal: 'MADRE' | 'PADRILLO';
  linea_genetica: string;
  fecha_ingreso: string;
  estado: 'ACTIVA' | 'GESTACION' | 'LACTANCIA' | 'BAJA' | 'REPOSO';
  fecha_baja?: string;
  motivo_baja?: string;
}

export interface VisitaEstudiantil {
  id: string;
  fecha: string;
  institucion: string;
  carrera_catedra?: string;
  cantidad_estudiantes: number;
  responsable: string;
  observaciones?: string;
  estado: 'Programada' | 'Realizada' | 'Cancelada';
  origen_dato: OrigenDato;
}

export interface CriterioProrrateo {
  id: string;
  criterio: string;
  driver: string; // ej: 'LECHONES_DESTETADOS', 'KG_PRODUCIDOS', 'CABEZAS_DIA'
  periodo: string;
  subunidades_destino: string;
  activo: boolean;
}

export interface FEstandarRinde {
  id: string;
  campana_id: string;
  subunidad_id: string;
  indicador_rendimiento: string;
  valor_esperado: number;
  um_id: string;
  origen_dato: OrigenDato;
}

export interface FDosis {
  id: string;
  fase_id: string;
  subunidad_id: string;
  insumo_id?: string;
  cantidad_animal_dia?: number;
  cantidad_kg_ganancia?: number; // Para ICA
  um_id: string;
  vigencia_desde: string;
  vigencia_hasta?: string;
  origen_dato: OrigenDato;
}

// =============================================================================
// HECHOS Y MOVIMIENTOS
// =============================================================================

export interface MovComercialEnc {
  id: string;
  tipo_comprobante_id: string; // Factura A, Factura B, Liquidacion SENASA, Remito
  punto_venta: string;
  numero_comprobante: string;
  fecha: string;
  proveedor_id?: string;
  cliente_id?: string;
  tipo_operacion: 'COMPRA' | 'VENTA' | 'TRANSFERENCIA' | 'AJUSTE';
  unidad_neg_id: string;
  subunidad_id: string;
  campana_id?: string;
  costo_flete?: number;
  descuento_comercial_pct?: number;
  descuento_comercial_importe?: number;
  descuento_comercial_motivo?: string;
  rosporc_precio_historico?: number;
  rosporc_semana_vigencia?: string;
  rosporc_fuente?: string;
  rosporc_desvio_pct?: number;
  total_neto: number;
  total_iva: number;
  total_percepciones: number;
  total_retenciones: number;
  total_final: number;
  estado: EstadoTransaccion;
  origen_dato: OrigenDato;
  estado_validacion: EstadoValidacion;
  observacion_validacion?: string;
  creado_por: string;
  fecha_creacion: string;
  modificado_por?: string;
  fecha_modificacion?: string;
  fecha_confirmacion?: string;
  motivo_anulacion?: string;
}

export interface MovComercialDet {
  id: string;
  mov_comercial_id: string;
  numero_linea: number;
  insumo_id?: string;
  producto_id?: string;
  categoria_senasa_id?: string;
  cantidad_animales?: number;
  kg?: number;
  precio_unitario_real: number;
  precio_sugerido_rosporc?: number;
  desvio_precio_rosporc?: number;
  costo_flete?: number;
  descuento_comercial_pct?: number;
  descuento_comercial_importe?: number;
  descuento_comercial_motivo?: string;
  rosporc_precio_historico?: number;
  rosporc_semana_vigencia?: string;
  rosporc_fuente?: string;
  rosporc_desvio_pct?: number;
  cabezas_muertas_transporte?: number;
  importe_neto: number;
  alicuota_iva: number;
  importe_iva: number;
  destino_productivo_id?: string; // subunidad o fase destino
}

export interface FPrecioIns {
  id: string;
  insumo_id: string;
  mov_comercial_id: string;
  fecha: string;
  precio_unitario_real: number;
  um_id: string;
  proveedor_id?: string;
  origen_dato: OrigenDato;
}

export interface FPrecioProd {
  id: string;
  producto_id: string;
  mov_comercial_id: string;
  fecha: string;
  precio_unitario_real: number;
  um_id: string;
  cliente_id?: string;
  origen_dato: OrigenDato;
}

export interface FCostos {
  id: string;
  fecha: string;
  cuenta_id: string;
  unidad_neg_id: string;
  subunidad_id: string;
  fase_id?: string;
  lote_id?: string;
  origen_costo: 'COMPRA' | 'CONSUMO' | 'PRORRATEO' | 'TRANSFERENCIA';
  comprobante_id?: string;
  importe_neto: number;
  estado: EstadoTransaccion;
  origen_dato: OrigenDato;
  estado_validacion: EstadoValidacion;
  observacion_validacion?: string;
}

export interface FIngresos {
  id: string;
  fecha: string;
  cuenta_id: string;
  unidad_neg_id: string;
  subunidad_id: string;
  fase_id?: string;
  lote_id?: string;
  comprobante_id?: string;
  importe_neto: number;
  estado: EstadoTransaccion;
  origen_dato: OrigenDato;
  estado_validacion: EstadoValidacion;
  observacion_validacion?: string;
}

export interface MovimientoFisico {
  id: string;
  fecha: string;
  tipo_evento: 'NACIMIENTO' | 'PASE_FASE' | 'MUERTE' | 'DESCARTE' | 'VENTA' | 'AJUSTE';
  lote_id: string;
  madre_id?: string;
  cantidad_cabezas: number;
  kg_totales: number;
  fase_origen_id?: string;
  fase_destino_id?: string;
  categoria_senasa_id?: string;
  sector_origen_id?: string;
  sector_destino_id?: string;
  motivo?: string;
  estado: EstadoTransaccion;
  origen_dato: OrigenDato;
  estado_validacion: EstadoValidacion;
  observacion_validacion?: string;
  creado_por: string;
  fecha_creacion: string;
  fecha_confirmacion?: string;
}

export interface Parto {
  id: string;
  madre_id: string;
  padrillo_id?: string;
  fecha_servicio?: string;
  fecha_parto: string;
  nacidos_vivos: number;
  nacidos_muertos: number;
  bajas_lactancia?: number;
  fecha_destete?: string;
  destetados?: number;
  peso_promedio_destete?: number;
  lote_generado_id?: string;
  lote_destete_id?: string;
  campana_id?: string;
  adopciones_transferencias?: number;
  observaciones?: string;
  estado: EstadoTransaccion;
  origen_dato: OrigenDato;
}



export interface MovimientoStockInsumos {
  id: string;
  fecha: string;
  tipo_movimiento: 'COMPRA' | 'TRANSFERENCIA_RECIBIDA' | 'CONSUMO' | 'TRANSFERENCIA_ENVIADA' | 'AJUSTE';
  insumo_id: string;
  cantidad: number;
  um_id: string;
  origen_movimiento_id?: string;
  stock_resultante?: number;
  observaciones?: string;
}

export interface ConsumoAlimentoReal {
  id: string;
  fecha: string;
  insumo_id: string;
  kg_consumidos: number;
  fase_id: string;
  subunidad_id: string;
  lote_id?: string;
  costo_unitario_imputado?: number;
  costo_total_imputado?: number;
  estado: EstadoTransaccion;
  origen_dato: OrigenDato;
  estado_validacion: EstadoValidacion;
  observacion_validacion?: string;
  creado_por: string;
  fecha_creacion: string;
}

export interface MovimientoInterno {
  id: string;
  fecha: string;
  unidad_origen_id: string;
  unidad_destino_id: string;
  insumo_id?: string;
  producto_id?: string;
  cantidad: number;
  um_id: string;
  criterio_valorizacion: 'COSTO_PRODUCCION' | 'PRECIO_MERCADO' | 'VNR' | 'VALOR_ACORDADO';
  valor_unitario: number;
  valor_total: number;
  estado: EstadoTransaccion;
  observaciones?: string;
}

export interface MovimientoFinanciero {
  id: string;
  fecha: string;
  mov_comercial_id: string;
  medio_pago_id: string;
  tipo_flujo: 'COBRO' | 'PAGO';
  importe: number;
  estado: EstadoTransaccion;
  referencia_bancaria?: string;
}

export interface CostoIndirecto {
  id: string;
  campana_id: string;
  periodo: string;
  cuenta_id: string;
  criterio_prorrateo_id: string;
  importe_total: number;
  subunidad_destino_id: string;
  importe_prorrateado: number;
  estado: EstadoTransaccion;
}

export interface ExistenciaHacienda {
  id: string;
  campana_id: string;
  fecha_cierre: string;
  subunidad_id: string;
  fase_id: string;
  categoria_senasa_id: string;
  lote_id?: string;
  cabezas: number;
  kg_totales: number;
  base_valuacion: 'COSTO_ACUMULADO' | 'VNR';
  valor_unitario: number;
  valor_total: number;
  fuente_valor: string;
  estado: EstadoTransaccion;
}

export interface CierrePeriodo {
  id: string;
  campana_id: string;
  fecha_cierre: string;
  cerrado_por: string;
  estado: 'Cerrado' | 'Reabierto';
  observaciones?: string;
  fecha_creacion: string;
}

export interface AuditoriaCambio {
  id: string;
  tabla: string;
  registro_id: string;
  operacion: 'ALTA' | 'MODIFICACION' | 'CONFIRMACION' | 'ANULACION' | 'CIERRE_PERIODO' | 'REAPERTURA_PERIODO' | 'LOGIN';
  detalle: string;
  usuario: string;
  fecha_hora: string;
}

// =============================================================================
// PRESUPUESTOS Y DESVÍOS (Requerimiento 7)
// =============================================================================

export interface PresupuestoItem {
  id: string;
  presupuesto_id: string;
  concepto: string;
  tipo: 'INGRESO' | 'COSTO';
  rubro: string; // 'Alimentación - Maíz' | 'Alimentación - Pellets' | 'Sanidad' | 'Mano de Obra' | 'Energía y Agua' | 'Mantenimiento' | 'Inseminación/Genética' | 'Ventas Capones' | 'Comercialización' | 'Estructura'
  fase_id?: string;
  subunidad_id?: string;
  lote_id?: string;
  cantidad_prevista?: number;
  um?: string;
  precio_unitario_previsto?: number;
  importe_presupuestado: number;
}

export interface PresupuestoVersion {
  id: string;
  campana_id: string;
  nombre: string; // ej: 'Presupuesto Operativo Campaña 2024/2025'
  version: 'ORIGINAL' | 'REVISADA' | 'APROBADA';
  es_base_comparacion: boolean;
  fecha_creacion: string;
  creado_por: string;
  criterio_utilizado: string; // 'Hipótesis presupuestaria' | 'Referencias históricas reales'
  observaciones?: string;
  cabezas_previstas?: number;
  kg_venta_previstos?: number;
  items: PresupuestoItem[];
}

// Despachos y Registro de Mortalidad en Transporte (Indicador C2 - Requerimiento 8)
export interface DespachoTransporte {
  id: string;
  mov_comercial_id?: string;
  fecha: string;
  lote_id?: string;
  cabezas_despachadas: number;
  cabezas_muertas_llegada: number;
  frigorifico: string;
  transportista: string;
  vehiculo_patente?: string;
  origen_dato: OrigenDato;
  estado: EstadoTransaccion;
  observaciones?: string;
}

// Estructura consolidada del almacén de datos (todas las hojas)
export interface BaseDatosPorcina {
  Usuarios: Usuario[];
  Roles: Rol[];
  Config_Sistema: { parametro: string; valor: string; descripcion: string; fecha_modificacion: string }[];
  Referencias_Relevadas: ReferenciaRelevada[];
  D_UnidadNeg: UnidadNegocio[];
  D_Subunidad: Subunidad[];
  Fases_Proceso: FaseProceso[];
  Categorias_SENASA: CategoriaSENASA[];
  Sectores_Fisicos: SectorFisico[];
  D_Producto: Producto[];
  D_Insumo: Insumo[];
  D_Cuenta: CuentaContable[];
  D_UM: UnidadMedida[];
  D_Conversion: { id: string; um_origen_id: string; um_destino_id: string; factor_conversion: number; activo: boolean }[];
  D_Campana: Campana[];
  D_Moneda: Moneda[];
  Proveedores: Proveedor[];
  Clientes: Cliente[];
  Medios_Pago: MedioPago[];
  Tipos_Operacion: { id: string; codigo: string; descripcion: string; activo: boolean }[];
  Tipos_Evento_Fisico: { id: string; codigo: string; descripcion: string; activo: boolean }[];
  Tipos_Comprobante: { id: string; codigo: string; descripcion: string; activo: boolean }[];
  Lotes_Animales: LoteAnimales[];
  Madres_Padrillos: MadrePadrillo[];
  Criterios_Prorrateo: CriterioProrrateo[];
  F_EstandarRinde: FEstandarRinde[];
  F_Dosis: FDosis[];
  Mov_Comercial_Enc: MovComercialEnc[];
  Mov_Comercial_Det: MovComercialDet[];
  F_PrecioIns: FPrecioIns[];
  F_PrecioProd: FPrecioProd[];
  F_Costos: FCostos[];
  F_Ingresos: FIngresos[];
  Movimientos_Fisicos: MovimientoFisico[];
  Partos: Parto[];
  Movimientos_Stock_Insumos: MovimientoStockInsumos[];
  Consumo_Alimento_Real: ConsumoAlimentoReal[];
  Movimientos_Internos: MovimientoInterno[];
  Movimientos_Financieros: MovimientoFinanciero[];
  Costos_Indirectos: CostoIndirecto[];
  Existencias_Hacienda: ExistenciaHacienda[];
  Cierres_Periodo: CierrePeriodo[];
  Auditoria_Cambios: AuditoriaCambio[];
  Historial_Estados: { id: string; tabla: string; registro_id: string; estado_anterior: string; estado_nuevo: string; motivo: string; usuario: string; fecha_hora: string }[];
  Presupuestos?: PresupuestoVersion[];
  Despachos_Transporte?: DespachoTransporte[];
  Metas_CMI?: any[];
  Historial_Metas_CMI?: any[];
  Presupuesto_Costos?: any[];
  Capacitaciones_Personal?: any[];
  Reuniones_CMI?: any[];
  Reclamos_Comerciales?: any[];
  Compromisos_Entrega?: any[];
  Visitas_Estudiantiles?: VisitaEstudiantil[];
}
