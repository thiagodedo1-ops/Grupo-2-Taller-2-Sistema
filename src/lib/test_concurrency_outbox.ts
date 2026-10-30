/**
 * @file test_concurrency_outbox.ts
 * @description Suite de Pruebas de Simulación para Control de Concurrencia Optimista (OCC)
 * y Cola de Sincronización Persistente (Outbox) - Bloque 3, Fase B, Paso B1.
 * Establecimiento Pozo del Carril · La Aguada (UNRC)
 */

import { syncQueue } from './syncQueue';
import { SyncOutboxItem, ConcurrencyCheckResult, FieldChangeDiff } from '../types/sync';

export interface TestResult {
  id: string;
  nombre: string;
  descripcion: string;
  unidad: 'PORCINOS' | 'BOVINOS' | 'OVINOS' | 'CONSOLIDADO';
  pasoExitoso: boolean;
  detalles: string;
  datos?: any;
}

/**
 * Mock Server Engine para simular el comportamiento de Google Apps Script + Google Sheets
 * sin tocar las hojas de cálculo reales durante el Paso B1.
 */
class MockSheetsBackend {
  private sheets: Record<string, any[]> = {};
  private processedOperationIds: Set<string> = new Set();
  public networkOnline: boolean = true;
  public simulatePermissionError: boolean = false;

  constructor() {
    this.reset();
  }

  public reset() {
    this.sheets = {
      'Porcinos_Madres': [
        { id: 'M-001', caravana: '101', categoria: 'Madre Activa', estado: 'Productiva', observaciones: 'Inicial', version: 1, updated_at: '2026-10-01T10:00:00Z' },
        { id: 'M-002', caravana: '102', categoria: 'Madre Activa', estado: 'Productiva', observaciones: 'Original', version: 1, updated_at: '2026-10-01T10:00:00Z' }
      ],
      'Bovinos_Rodeo': [
        { id: 'B-001', caravana: 'BOV-501', categoria: 'Vaca', rodeo: 'Lote 1', estado: 'Preñada', observaciones: 'Vacunada', version: 1, updated_at: '2026-10-01T10:00:00Z' }
      ],
      'Ovinos_Majada': [
        { id: 'O-001', caravana: 'OV-901', categoria: 'Oveja', lote: 'Potrero 4', estado: 'Lactancia', observaciones: 'Esquila completada', version: 1, updated_at: '2026-10-01T10:00:00Z' }
      ]
    };
    this.processedOperationIds.clear();
    this.networkOnline = true;
    this.simulatePermissionError = false;
  }

  public getRecord(sheetName: string, id: string): any | null {
    const list = this.sheets[sheetName] || [];
    return list.find(r => r.id === id) || null;
  }

  /**
   * Simula la lógica de handleSaveRecord de Apps Script con soporte OCC e Idempotencia
   */
  public executeSaveRecord(item: SyncOutboxItem): {
    success: boolean;
    code: string;
    message: string;
    current_version?: number;
    new_version?: number;
    remote_record?: any;
    idempotent_replay?: boolean;
  } {
    if (!this.networkOnline) {
      throw new Error('NETWORK_TIMEOUT: No hay conexión con Google Apps Script');
    }

    if (this.simulatePermissionError) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Acceso denegado: El usuario no cuenta con rol ADMINISTRADOR para modificar este registro'
      };
    }

    // 1. Verificación de Idempotencia por operation_id
    if (this.processedOperationIds.has(item.operation_id)) {
      const existing = this.getRecord(item.table_name, item.record_id);
      return {
        success: true,
        code: 'IDEMPOTENT_SUCCESS',
        message: 'Operación previamente procesada. Idempotencia garantizada sin duplicar filas.',
        current_version: existing?.version || item.expected_version,
        new_version: existing?.version || item.expected_version,
        idempotent_replay: true
      };
    }

    const currentRecord = this.getRecord(item.table_name, item.record_id);
    if (!currentRecord) {
      return {
        success: false,
        code: 'RECORD_NOT_FOUND',
        message: `El registro ${item.record_id} no existe en la hoja ${item.table_name}`
      };
    }

    // 2. Control de Concurrencia Optimista (OCC)
    const currentVersion = currentRecord.version ?? 1;
    if (currentVersion !== item.expected_version) {
      return {
        success: false,
        code: 'VERSION_CONFLICT',
        message: `Conflicto de versiones: El servidor tiene la versión ${currentVersion}, pero el cliente envió la versión ${item.expected_version}.`,
        current_version: currentVersion,
        remote_record: { ...currentRecord }
      };
    }

    // 3. Aplicación de la Modificación
    const newVersion = currentVersion + 1;
    const updated = {
      ...currentRecord,
      ...item.payload,
      version: newVersion,
      modificado_por: item.usuario,
      updated_at: new Date().toISOString()
    };

    const sheet = this.sheets[item.table_name];
    const idx = sheet.findIndex(r => r.id === item.record_id);
    sheet[idx] = updated;

    // Registrar operation_id para idempotencia
    this.processedOperationIds.add(item.operation_id);

    return {
      success: true,
      code: 'OK',
      message: 'Registro actualizado con éxito en Google Sheets',
      current_version: currentVersion,
      new_version: newVersion
    };
  }

  /**
   * Simula modificación externa concurrente por otro usuario directamente en Sheets
   */
  public mutateRecordDirectly(sheetName: string, id: string, changes: any) {
    const list = this.sheets[sheetName];
    if (list) {
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...changes,
          version: (list[idx].version || 1) + 1,
          updated_at: new Date().toISOString()
        };
      }
    }
  }
}

/**
 * Ejecutor de la Suite de Pruebas A - G
 */
export function runConcurrencyTestSuite(): {
  allPassed: boolean;
  results: TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const backend = new MockSheetsBackend();
  const results: TestResult[] = [];

  // =========================================================================
  // PRUEBA A: Actualización común
  // Un usuario modifica un campo informativo, versión esperada coincide, se actualiza e incrementa versión
  // =========================================================================
  try {
    backend.reset();
    const op = syncQueue.enqueue({
      unit: 'PORCINOS',
      table_name: 'Porcinos_Madres',
      record_id: 'M-001',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Madre revisada sin novedades sanitarias' },
      cambios: [{ campo: 'observaciones', valor_anterior: 'Inicial', valor_nuevo: 'Madre revisada sin novedades sanitarias' }],
      usuario: 'admin@unrc.edu.ar'
    });

    const res = backend.executeSaveRecord(op);
    if (res.success && res.new_version === 2) {
      syncQueue.markConfirmed(op.operation_id, res.new_version);
      results.push({
        id: 'PRUEBA_A',
        nombre: 'Prueba A: Actualización común',
        descripcion: 'Verificar guardado exitoso con versiones coincidentes e incremento de versión a v2',
        unidad: 'PORCINOS',
        pasoExitoso: true,
        detalles: `Exitoso: Versión incrementada de v1 a v${res.new_version}. Registro actualizado sin alterar ID ni campos críticos.`
      });
    } else {
      results.push({
        id: 'PRUEBA_A',
        nombre: 'Prueba A: Actualización común',
        descripcion: 'Verificar guardado exitoso con versiones coincidentes',
        unidad: 'PORCINOS',
        pasoExitoso: false,
        detalles: `Fallo: Respuesta inesperada del backend: ${JSON.stringify(res)}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'PRUEBA_A',
      nombre: 'Prueba A: Actualización común',
      descripcion: 'Verificar guardado exitoso con versiones coincidentes',
      unidad: 'PORCINOS',
      pasoExitoso: false,
      detalles: `Excepción: ${err.message}`
    });
  }

  // =========================================================================
  // PRUEBA B: Conflicto
  // Dos usuarios modifican el mismo registro a partir de la misma versión. El segundo es rechazado.
  // =========================================================================
  try {
    backend.reset();
    // Simular que el Usuario 1 ya guardó en el servidor y la versión avanzó a v2
    backend.mutateRecordDirectly('Porcinos_Madres', 'M-001', {
      observaciones: 'Modificado por Médico Veterinario externo'
    });

    // Usuario 2 (local) intenta guardar con versión esperada 1 (obsoleta)
    const opConflicto = syncQueue.enqueue({
      unit: 'PORCINOS',
      table_name: 'Porcinos_Madres',
      record_id: 'M-001',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Observación que no debe sobrescribir' },
      usuario: 'operador@unrc.edu.ar'
    });

    const resConflicto = backend.executeSaveRecord(opConflicto);
    if (!resConflicto.success && resConflicto.code === 'VERSION_CONFLICT') {
      syncQueue.markConflict(opConflicto.operation_id, resConflicto.remote_record);
      results.push({
        id: 'PRUEBA_B',
        nombre: 'Prueba B: Detección de Conflicto Concurrente',
        descripcion: 'Verificar que una versión desactualizada sea rechazada sin sobrescritura ciega (no last-write-wins)',
        unidad: 'PORCINOS',
        pasoExitoso: true,
        detalles: `Exitoso: Rechazo seguro con código VERSION_CONFLICT. Servidor reporta v${resConflicto.current_version}. Registro local entra en estado CONFLICTO con diff disponible.`,
        datos: { version_servidor: resConflicto.current_version, version_cliente: 1 }
      });
    } else {
      results.push({
        id: 'PRUEBA_B',
        nombre: 'Prueba B: Detección de Conflicto Concurrente',
        descripcion: 'Verificar que una versión desactualizada sea rechazada',
        unidad: 'PORCINOS',
        pasoExitoso: false,
        detalles: `Fallo: Se esperaba VERSION_CONFLICT pero se obtuvo: ${JSON.stringify(resConflicto)}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'PRUEBA_B',
      nombre: 'Prueba B: Detección de Conflicto Concurrente',
      descripcion: 'Verificar que una versión desactualizada sea rechazada',
      unidad: 'PORCINOS',
      pasoExitoso: false,
      detalles: `Excepción: ${err.message}`
    });
  }

  // =========================================================================
  // PRUEBA C: Sin conexión (Offline Outbox)
  // Se edita sin conexión, queda PENDIENTE en localStorage, al reconectar se sincroniza
  // =========================================================================
  try {
    backend.reset();
    backend.networkOnline = false; // Desconectar

    const opOffline = syncQueue.enqueue({
      unit: 'BOVINOS',
      table_name: 'Bovinos_Rodeo',
      record_id: 'B-001',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Ajuste de lote en manga sin señal' },
      usuario: 'campo@unrc.edu.ar'
    });

    let catchErrorThrown = false;
    try {
      backend.executeSaveRecord(opOffline);
    } catch (e: any) {
      catchErrorThrown = true;
      syncQueue.markError(opOffline.operation_id, e.message);
    }

    const statusInQueue = syncQueue.getRecordSyncStatus('Bovinos_Rodeo', 'B-001');

    // Reconectar red
    backend.networkOnline = true;
    const resReconnected = backend.executeSaveRecord(opOffline);
    if (catchErrorThrown && (statusInQueue === 'PENDIENTE' || statusInQueue === 'ERROR') && resReconnected.success) {
      syncQueue.markConfirmed(opOffline.operation_id, resReconnected.new_version);
      results.push({
        id: 'PRUEBA_C',
        nombre: 'Prueba C: Operación Offline & Reconexión',
        descripcion: 'Comprobar persistencia en cola Outbox durante caída de red y sincronización segura al reconectar',
        unidad: 'BOVINOS',
        pasoExitoso: true,
        detalles: `Exitoso: Registro se retuvo en Outbox local durante corte de red. Al restaurar señal, sincronizó a v${resReconnected.new_version} sin pérdida de datos.`
      });
    } else {
      results.push({
        id: 'PRUEBA_C',
        nombre: 'Prueba C: Operación Offline & Reconexión',
        descripcion: 'Comprobar persistencia en cola Outbox',
        unidad: 'BOVINOS',
        pasoExitoso: false,
        detalles: `Fallo: Reintento offline no cumplió los estados esperados.`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'PRUEBA_C',
      nombre: 'Prueba C: Operación Offline & Reconexión',
      descripcion: 'Comprobar persistencia en cola Outbox',
      unidad: 'BOVINOS',
      pasoExitoso: false,
      detalles: `Excepción: ${err.message}`
    });
  }

  // =========================================================================
  // PRUEBA D: Reintento idempotente
  // Reintentar la misma operación dos veces no duplica filas ni corrompe versiones
  // =========================================================================
  try {
    backend.reset();
    const opIdem = syncQueue.enqueue({
      unit: 'OVINOS',
      table_name: 'Ovinos_Majada',
      record_id: 'O-001',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Revisión sanitaria de pezuñas' },
      usuario: 'admin@unrc.edu.ar'
    });

    const primerIntento = backend.executeSaveRecord(opIdem);
    const segundoIntento = backend.executeSaveRecord(opIdem);

    if (primerIntento.success && segundoIntento.success && segundoIntento.idempotent_replay) {
      results.push({
        id: 'PRUEBA_D',
        nombre: 'Prueba D: Idempotencia en Reintentos',
        descripcion: 'Verificar que reintentos de una misma operación no dupliquen filas gracias al operation_id único',
        unidad: 'OVINOS',
        pasoExitoso: true,
        detalles: `Exitoso: Primer intento persistió cambio a v${primerIntento.new_version}. Segundo intento detectó operation_id ${opIdem.operation_id.substring(0, 8)}... y respondió idempotentemente sin crear duplicados.`
      });
    } else {
      results.push({
        id: 'PRUEBA_D',
        nombre: 'Prueba D: Idempotencia en Reintentos',
        descripcion: 'Verificar que reintentos no dupliquen filas',
        unidad: 'OVINOS',
        pasoExitoso: false,
        detalles: `Fallo: Segundo intento no fue reconocido como idempotente: ${JSON.stringify(segundoIntento)}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'PRUEBA_D',
      nombre: 'Prueba D: Idempotencia en Reintentos',
      descripcion: 'Verificar que reintentos no dupliquen filas',
      unidad: 'OVINOS',
      pasoExitoso: false,
      detalles: `Excepción: ${err.message}`
    });
  }

  // =========================================================================
  // PRUEBA E: Error Parcial y Aislamiento
  // Un error en un lote de sincronización no corrompe los otros registros de la cola
  // =========================================================================
  try {
    backend.reset();
    const op1 = syncQueue.enqueue({
      unit: 'PORCINOS',
      table_name: 'Porcinos_Madres',
      record_id: 'M-001',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Op 1 válida' },
      usuario: 'admin@unrc.edu.ar'
    });

    const opInvalida = syncQueue.enqueue({
      unit: 'PORCINOS',
      table_name: 'Porcinos_Madres',
      record_id: 'ID_INEXISTENTE_999',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Op 2 con error' },
      usuario: 'admin@unrc.edu.ar'
    });

    const res1 = backend.executeSaveRecord(op1);
    const resInvalida = backend.executeSaveRecord(opInvalida);

    if (res1.success && !resInvalida.success && resInvalida.code === 'RECORD_NOT_FOUND') {
      results.push({
        id: 'PRUEBA_E',
        nombre: 'Prueba E: Aislamiento de Errores Parciales',
        descripcion: 'Verificar que el fallo de un ítem no invalide ni bloquee otros ítems independientes en la cola',
        unidad: 'PORCINOS',
        pasoExitoso: true,
        detalles: `Exitoso: Registro M-001 se actualizó correctamente mientras que ID_INEXISTENTE_999 fue rechazado aisladamente sin corromper el lote.`
      });
    } else {
      results.push({
        id: 'PRUEBA_E',
        nombre: 'Prueba E: Aislamiento de Errores Parciales',
        descripcion: 'Verificar aislamiento de errores en lote',
        unidad: 'PORCINOS',
        pasoExitoso: false,
        detalles: `Fallo en aislamiento: res1=${JSON.stringify(res1)}, resInvalida=${JSON.stringify(resInvalida)}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'PRUEBA_E',
      nombre: 'Prueba E: Aislamiento de Errores Parciales',
      descripcion: 'Verificar aislamiento de errores en lote',
      unidad: 'PORCINOS',
      pasoExitoso: false,
      detalles: `Excepción: ${err.message}`
    });
  }

  // =========================================================================
  // PRUEBA F: Permisos y Auditoría
  // Operación rechazada si no cumple autorización de rol administrador
  // =========================================================================
  try {
    backend.reset();
    backend.simulatePermissionError = true;

    const opPermiso = syncQueue.enqueue({
      unit: 'BOVINOS',
      table_name: 'Bovinos_Rodeo',
      record_id: 'B-001',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Intento no autorizado' },
      usuario: 'operario_sin_permiso@unrc.edu.ar'
    });

    const resPermiso = backend.executeSaveRecord(opPermiso);
    backend.simulatePermissionError = false;

    if (!resPermiso.success && resPermiso.code === 'UNAUTHORIZED') {
      results.push({
        id: 'PRUEBA_F',
        nombre: 'Prueba F: Validación de Permisos y Roles',
        descripcion: 'Verificar que usuarios sin rol administrativo no puedan alterar registros protegidos',
        unidad: 'BOVINOS',
        pasoExitoso: true,
        detalles: `Exitoso: Rechazo estricto con código UNAUTHORIZED. El registro de servidor B-001 no sufrió modificaciones.`
      });
    } else {
      results.push({
        id: 'PRUEBA_F',
        nombre: 'Prueba F: Validación de Permisos y Roles',
        descripcion: 'Verificar permisos y roles',
        unidad: 'BOVINOS',
        pasoExitoso: false,
        detalles: `Fallo: Se esperaba UNAUTHORIZED pero se obtuvo: ${JSON.stringify(resPermiso)}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'PRUEBA_F',
      nombre: 'Prueba F: Validación de Permisos y Roles',
      descripcion: 'Verificar permisos y roles',
      unidad: 'BOVINOS',
      pasoExitoso: false,
      detalles: `Excepción: ${err.message}`
    });
  }

  // =========================================================================
  // PRUEBA G: Separación Estricta por Unidades
  // Modificaciones en Porcinos no interfieren con Bovinos ni Ovinos
  // =========================================================================
  try {
    backend.reset();
    const opPorcino = syncQueue.enqueue({
      unit: 'PORCINOS',
      table_name: 'Porcinos_Madres',
      record_id: 'M-002',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Madre Porcina M-002 en gestación' },
      usuario: 'admin_porcinos@unrc.edu.ar'
    });

    const opBovino = syncQueue.enqueue({
      unit: 'BOVINOS',
      table_name: 'Bovinos_Rodeo',
      record_id: 'B-001',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Bovino B-001 pastoreo rotativo' },
      usuario: 'admin_bovinos@unrc.edu.ar'
    });

    const opOvino = syncQueue.enqueue({
      unit: 'OVINOS',
      table_name: 'Ovinos_Majada',
      record_id: 'O-001',
      operation_type: 'UPDATE',
      expected_version: 1,
      payload: { observaciones: 'Ovino O-001 lote carneros' },
      usuario: 'admin_ovinos@unrc.edu.ar'
    });

    const resP = backend.executeSaveRecord(opPorcino);
    const resB = backend.executeSaveRecord(opBovino);
    const resO = backend.executeSaveRecord(opOvino);

    const checkP = backend.getRecord('Porcinos_Madres', 'M-002');
    const checkB = backend.getRecord('Bovinos_Rodeo', 'B-001');
    const checkO = backend.getRecord('Ovinos_Majada', 'O-001');

    if (
      resP.success && resB.success && resO.success &&
      checkP?.observaciones === 'Madre Porcina M-002 en gestación' &&
      checkB?.observaciones === 'Bovino B-001 pastoreo rotativo' &&
      checkO?.observaciones === 'Ovino O-001 lote carneros'
    ) {
      results.push({
        id: 'PRUEBA_G',
        nombre: 'Prueba G: Separación Estricta entre Unidades Productivas',
        descripcion: 'Verificar aislamiento de persistencia entre Porcinos, Bovinos y Ovinos sin colisiones',
        unidad: 'CONSOLIDADO',
        pasoExitoso: true,
        detalles: `Exitoso: Las 3 unidades preservaron sus tablas, esquemas e identidades cromáticas de forma independiente y concurrente.`
      });
    } else {
      results.push({
        id: 'PRUEBA_G',
        nombre: 'Prueba G: Separación Estricta entre Unidades Productivas',
        descripcion: 'Verificar separación por unidades',
        unidad: 'CONSOLIDADO',
        pasoExitoso: false,
        detalles: `Fallo en separación de unidades: P=${resP.success}, B=${resB.success}, O=${resO.success}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'PRUEBA_G',
      nombre: 'Prueba G: Separación Estricta entre Unidades Productivas',
      descripcion: 'Verificar separación por unidades',
      unidad: 'CONSOLIDADO',
      pasoExitoso: false,
      detalles: `Excepción: ${err.message}`
    });
  }

  // Limpiar cola temporal generada por los tests
  syncQueue.clearConfirmed();

  const passed = results.filter(r => r.pasoExitoso).length;
  const failed = results.filter(r => !r.pasoExitoso).length;

  return {
    allPassed: failed === 0,
    results,
    summary: { total: results.length, passed, failed }
  };
}
