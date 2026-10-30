/**
 * @file ovino_schema.ts
 * @description Definición de tipos para la Unidad Ovina.
 * Específicos para Cría, Recría y Engorde.
 */

import { EstadoTransaccion, EstadoValidacion, OrigenDato } from './schema';

// Tablas Maestras Ovinas (Extensiones)
export interface CategoriaOvina {
  id: string; // PK
  nombre: string;
  activo: boolean;
}

export interface SubunidadOvina {
  id: string; // PK: OVI_CRIA, OVI_RECRIA, OVI_ENGORDE
  nombre: string;
  activo: boolean;
}

// Registros Reales
export interface ExistenciaOvina {
  id: string; // PK
  id_campana: string; // FK
  id_subunidad: string; // FK
  id_categoria: string; // FK
  cabezas: number;
  kg_totales: number;
  fecha: string;
  estado: EstadoTransaccion;
}

export interface ProduccionOvina {
  id: string; // PK
  id_campana: string; // FK
  id_subunidad: string; // FK
  tipo_evento: 'NACIMIENTO' | 'MUERTE' | 'DESTETE' | 'SEÑALADA';
  cabezas: number;
  fecha: string;
  estado: EstadoTransaccion;
  origen_dato: OrigenDato;
}

export interface ConsumoInsumoOvino {
  id: string; // PK
  id_campana: string; // FK
  id_subunidad: string; // FK
  id_insumo: string; // FK
  cantidad_real: number;
  fecha: string;
  estado: EstadoTransaccion;
}

export interface CompraOvina {
  id: string; // PK
  id_proveedor: string; // FK
  id_campana: string; // FK
  fecha: string;
  total_neto: number;
  estado: EstadoTransaccion;
  items: CompraOvinaDetalle[];
}

export interface CompraOvinaDetalle {
  id: string; // PK
  id_compra: string; // FK
  id_insumo: string; // FK
  cantidad: number;
  precio_unitario: number;
}

export interface VentaOvina {
  id: string; // PK
  id_cliente: string; // FK
  id_campana: string; // FK
  fecha: string;
  kg_totales: number;
  importe_neto: number;
  estado: EstadoTransaccion;
  items: VentaOvinaDetalle[];
}

export interface VentaOvinaDetalle {
  id: string; // PK
  id_venta: string; // FK
  id_categoria: string; // FK
  cabezas: number;
  precio_unitario_kg: number;
}
