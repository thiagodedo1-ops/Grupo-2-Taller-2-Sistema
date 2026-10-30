/**
 * @file sync.ts
 * @description Tipos e interfaces para el Control de Concurrencia Optimista (OCC)
 * y la Cola de Sincronización Persistente (Outbox Pattern).
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 */

export type SyncStatus = 'SINCRONIZADO' | 'PENDIENTE' | 'ERROR' | 'CONFLICTO';

export type SyncOperationType = 'INSERT' | 'UPDATE' | 'CANCEL';

export type SyncItemStatus = 'PENDING' | 'SYNCING' | 'CONFIRMED' | 'ERROR' | 'CONFLICT';

export interface FieldChangeDiff {
  campo: string;
  valor_anterior: any;
  valor_nuevo: any;
}

export interface SyncOutboxItem {
  operation_id: string; // UUID v4 único para garantizar idempotencia
  unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
  table_name: string;
  record_id: string;
  operation_type: SyncOperationType;
  expected_version: number;
  payload: any;
  cambios?: FieldChangeDiff[];
  motivo?: string;
  usuario: string;
  status: SyncItemStatus;
  retry_count: number;
  max_retries?: number;
  last_error?: string;
  remote_data_on_conflict?: any;
  created_at: string;
  updated_at: string;
}

export interface VersionedRecord {
  id: string;
  version?: number;
  updated_at?: string;
  creado_por?: string;
  fecha_creacion?: string;
  modificado_por?: string;
  fecha_modificacion?: string;
  [key: string]: any;
}

export interface ConcurrencyCheckResult {
  allowed: boolean;
  code?: 'OK' | 'VERSION_CONFLICT' | 'RECORD_NOT_FOUND' | 'LOCKED_BY_DEPENDENCY' | 'UNAUTHORIZED';
  message: string;
  current_version?: number;
  expected_version?: number;
  remote_record?: any;
}
