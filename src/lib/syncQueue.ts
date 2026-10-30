/**
 * @file syncQueue.ts
 * @description Gestor de la Cola Persistente de Sincronización (Outbox Pattern)
 * y Control de Concurrencia Optimista (OCC) para edición administrativa.
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 */

import { SyncOutboxItem, SyncItemStatus, FieldChangeDiff, SyncStatus } from '../types/sync';

const OUTBOX_STORAGE_KEY = 'pozo_del_carril_sync_outbox_v1';
const MAX_DEFAULT_RETRIES = 5;

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'op_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

class SyncQueueManager {
  private queue: SyncOutboxItem[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.queue = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Error cargando cola outbox de sincronización:', e);
      this.queue = [];
    }
  }

  private persist() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(this.queue));
      }
    } catch (e) {
      console.error('Error persistiendo cola outbox:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        console.error('Error en listener de SyncQueue:', err);
      }
    });
  }

  /**
   * Encola una nueva operación en el Outbox con UUID único para idempotencia.
   */
  public enqueue(params: {
    unit: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
    table_name: string;
    record_id: string;
    operation_type: 'INSERT' | 'UPDATE' | 'CANCEL';
    expected_version: number;
    payload: any;
    cambios?: FieldChangeDiff[];
    motivo?: string;
    usuario: string;
  }): SyncOutboxItem {
    const now = new Date().toISOString();
    
    // Verificar si ya existe una operación idéntica pendiente para evitar redundancias
    const existingIndex = this.queue.findIndex(
      item => item.table_name === params.table_name &&
              item.record_id === params.record_id &&
              (item.status === 'PENDING' || item.status === 'ERROR')
    );

    if (existingIndex !== -1) {
      // Actualizar operación pendiente en lugar de acumular múltiples operaciones conflictivas
      const existing = this.queue[existingIndex];
      const updated: SyncOutboxItem = {
        ...existing,
        payload: { ...existing.payload, ...params.payload },
        cambios: params.cambios || existing.cambios,
        motivo: params.motivo || existing.motivo,
        usuario: params.usuario,
        status: 'PENDING',
        updated_at: now
      };
      this.queue[existingIndex] = updated;
      this.persist();
      return updated;
    }

    const item: SyncOutboxItem = {
      operation_id: generateUUID(),
      unit: params.unit,
      table_name: params.table_name,
      record_id: params.record_id,
      operation_type: params.operation_type,
      expected_version: params.expected_version || 1,
      payload: params.payload,
      cambios: params.cambios,
      motivo: params.motivo,
      usuario: params.usuario,
      status: 'PENDING',
      retry_count: 0,
      max_retries: MAX_DEFAULT_RETRIES,
      created_at: now,
      updated_at: now
    };

    this.queue.push(item);
    this.persist();
    return item;
  }

  public getAll(): SyncOutboxItem[] {
    return [...this.queue];
  }

  public getPending(): SyncOutboxItem[] {
    return this.queue.filter(i => i.status === 'PENDING' || i.status === 'ERROR');
  }

  public getById(operationId: string): SyncOutboxItem | undefined {
    return this.queue.find(i => i.operation_id === operationId);
  }

  public markSyncing(operationId: string) {
    const item = this.queue.find(i => i.operation_id === operationId);
    if (item && item.status !== 'CONFIRMED') {
      item.status = 'SYNCING';
      item.updated_at = new Date().toISOString();
      this.persist();
    }
  }

  public markConfirmed(operationId: string, newVersion?: number) {
    const index = this.queue.findIndex(i => i.operation_id === operationId);
    if (index !== -1) {
      this.queue[index].status = 'CONFIRMED';
      if (newVersion !== undefined && this.queue[index].payload) {
        this.queue[index].payload.version = newVersion;
      }
      this.queue[index].updated_at = new Date().toISOString();
      this.persist();
    }
  }

  public markError(operationId: string, errorMessage: string) {
    const item = this.queue.find(i => i.operation_id === operationId);
    if (item) {
      item.status = 'ERROR';
      item.retry_count = (item.retry_count || 0) + 1;
      item.last_error = errorMessage;
      item.updated_at = new Date().toISOString();
      this.persist();
    }
  }

  public markConflict(operationId: string, remoteData: any) {
    const item = this.queue.find(i => i.operation_id === operationId);
    if (item) {
      item.status = 'CONFLICT';
      item.remote_data_on_conflict = remoteData;
      item.last_error = 'Conflicto de versiones: el registro fue modificado por otro usuario en el servidor';
      item.updated_at = new Date().toISOString();
      this.persist();
    }
  }

  public removeOperation(operationId: string) {
    this.queue = this.queue.filter(i => i.operation_id !== operationId);
    this.persist();
  }

  public clearConfirmed() {
    this.queue = this.queue.filter(i => i.status !== 'CONFIRMED');
    this.persist();
  }

  /**
   * Determina el estado de sincronización visual de un registro específico
   */
  public getRecordSyncStatus(tableName: string, recordId: string): SyncStatus {
    const activeOp = this.queue
      .filter(i => i.table_name === tableName && i.record_id === recordId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

    if (!activeOp) {
      return 'SINCRONIZADO';
    }

    if (activeOp.status === 'CONFLICT') {
      return 'CONFLICTO';
    }

    if (activeOp.status === 'ERROR') {
      return 'ERROR';
    }

    if (activeOp.status === 'PENDING' || activeOp.status === 'SYNCING') {
      return 'PENDIENTE';
    }

    return 'SINCRONIZADO';
  }

  /**
   * Calcula diferencias campo por campo entre dos versiones de un registro
   */
  public static calculateDiff(original: any, modificado: any): FieldChangeDiff[] {
    const diffs: FieldChangeDiff[] = [];
    if (!original || !modificado) return diffs;

    const ignoreKeys = ['_syncStatus', 'fecha_modificacion', 'modificado_por', 'version', 'updated_at'];
    const allKeys = Array.from(new Set([...Object.keys(original), ...Object.keys(modificado)]));

    allKeys.forEach(key => {
      if (ignoreKeys.includes(key)) return;
      const vOld = original[key];
      const vNew = modificado[key];

      if (vOld !== vNew && String(vOld ?? '') !== String(vNew ?? '')) {
        diffs.push({
          campo: key,
          valor_anterior: vOld,
          valor_nuevo: vNew
        });
      }
    });

    return diffs;
  }

  public calculateDiff(original: any, modificado: any): FieldChangeDiff[] {
    return SyncQueueManager.calculateDiff(original, modificado);
  }

  // =========================================================================
  // INTEGRACIÓN REAL CON APPS SCRIPT - PASO B2
  // =========================================================================

  private conflictListeners: ((conflict: { item: SyncOutboxItem; remoteRecord: any }) => void)[] = [];

  public onConflictDetected(listener: (conflict: { item: SyncOutboxItem; remoteRecord: any }) => void): () => void {
    this.conflictListeners.push(listener);
    return () => {
      this.conflictListeners = this.conflictListeners.filter(l => l !== listener);
    };
  }

  private notifyConflict(item: SyncOutboxItem, remoteRecord: any) {
    this.conflictListeners.forEach(listener => {
      try {
        listener({ item, remoteRecord });
      } catch (e) {
        console.error('Error en listener de conflicto:', e);
      }
    });
  }

  /**
   * Envía un ítem individual de la cola a Google Apps Script con control de concurrencia e idempotencia.
   */
  public async dispatchItem(
    item: SyncOutboxItem,
    appsScriptUrl: string,
    token?: string
  ): Promise<{ success: boolean; code: string; newVersion?: number; remoteRecord?: any; message: string }> {
    if (!appsScriptUrl) {
      return { success: false, code: 'OFFLINE_NO_URL', message: 'No hay URL de Apps Script configurada. Se retiene en cola local.' };
    }

    if (item.unit === 'CONSOLIDADO') {
      return { success: false, code: 'UNAUTHORIZED_UNIT', message: 'Consolidado excluido de sincronización Outbox.' };
    }

    this.markSyncing(item.operation_id);

    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveRecordVersioned',
          operation_id: item.operation_id,
          unit: item.unit,
          table: item.table_name,
          record: item.payload,
          expected_version: item.expected_version,
          cambios: item.cambios,
          motivo: item.motivo,
          usuario: item.usuario,
          token: token
        })
      });

      const json = await response.json().catch(() => null);

      // Verificación robusta de conflicto: por código JSON, status HTTP 409 o texto de mensaje descriptivo
      const isConflict = 
        response.status === 409 ||
        json?.code === 'VERSION_CONFLICT' ||
        json?.status === 'conflict' ||
        (json?.message && typeof json.message === 'string' && json.message.toLowerCase().includes('conflicto de versiones')) ||
        (json?.error && typeof json.error === 'string' && json.error.toLowerCase().includes('version_conflict'));

      if (isConflict) {
        const remoteData = json?.remote_record || json?.remoteRecord || json?.record || null;
        const msg = json?.message || 'Conflicto de versiones: el registro fue modificado remotamente en el servidor.';
        this.markConflict(item.operation_id, remoteData);
        this.notifyConflict(item, remoteData);
        return {
          success: false,
          code: 'VERSION_CONFLICT',
          remoteRecord: remoteData,
          message: msg
        };
      }

      if (!response.ok || (json && json.status === 'error')) {
        const errorCode = json?.code || 'SERVER_ERROR';
        const errorMsg = json?.message || `HTTP ${response.status}: Error en Apps Script`;
        this.markError(item.operation_id, errorMsg);
        return { success: false, code: errorCode, message: errorMsg };
      }

      // Respuesta exitosa (OK o IDEMPOTENT_REPLAY)
      const newVersion = json?.version || (item.expected_version + 1);
      this.markConfirmed(item.operation_id, newVersion);

      return {
        success: true,
        code: json?.code || 'OK',
        newVersion: newVersion,
        message: json?.message || 'Sincronizado exitosamente con Google Sheets'
      };

    } catch (err: any) {
      const msg = err.message || 'Error de red o timeout conectando con Apps Script';
      this.markError(item.operation_id, msg);
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: msg
      };
    }
  }

  /**
   * Procesa de forma secuencial y segura todos los ítems pendientes en la cola Outbox.
   */
  public async processPendingQueue(
    appsScriptUrl: string,
    token?: string,
    onRecordUpdated?: (table: string, id: string, newVersion: number, updatedRecord: any) => void
  ): Promise<{ processed: number; succeeded: number; conflicts: number; errors: number }> {
    const pending = this.getPending();
    const stats = { processed: 0, succeeded: 0, conflicts: 0, errors: 0 };

    for (const item of pending) {
      // No reintentar automáticamente ítems en conflicto sin resolución explícita
      if (item.status === 'CONFLICT') {
        stats.conflicts++;
        continue;
      }

      stats.processed++;
      const res = await this.dispatchItem(item, appsScriptUrl, token);

      if (res.success) {
        stats.succeeded++;
        if (onRecordUpdated && res.newVersion) {
          onRecordUpdated(item.table_name, item.record_id, res.newVersion, item.payload);
        }
      } else if (res.code === 'VERSION_CONFLICT') {
        stats.conflicts++;
      } else {
        stats.errors++;
        // Detener la cola ante error de red grave para evitar saturación de reintentos
        if (res.code === 'NETWORK_ERROR' || res.code === 'OFFLINE_NO_URL') {
          break;
        }
      }
    }

    return stats;
  }
}

export const syncQueue = new SyncQueueManager();
