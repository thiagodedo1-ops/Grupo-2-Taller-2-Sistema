/**
 * @file Code.gs
 * @description Backend API para el Sistema de Gestión Porcina - Establecimiento Pozo del Carril (La Aguada)
 * Taller de Práctica II - FCE UNRC - Grupo 2
 * 
 * Este script expone una Web App en Google Apps Script que sirve como API REST para el frontend.
 * Maneja autenticación de usuarios, CRUD con validaciones estrictas de negocio, cálculo de
 * campos derivados, bloqueo de concurrencia con LockService, auditoría completa y registro
 * de consistencia (estado_validacion: 'OK' u 'Observado').
 */

// =============================================================================
// 1. CONFIGURACIÓN Y CONSTANTES
// =============================================================================
const SCRIPT_PROP = PropertiesService.getScriptProperties();

const HOJAS_MAESTRAS = [
  'Usuarios', 'Roles', 'Config_Sistema', 'Referencias_Relevadas',
  'D_UnidadNeg', 'D_Subunidad', 'Fases_Proceso', 'Categorias_SENASA',
  'Sectores_Fisicos', 'D_Producto', 'D_Insumo', 'D_Cuenta',
  'D_UM', 'D_Conversion', 'D_Campana', 'D_Moneda',
  'Proveedores', 'Clientes', 'Medios_Pago', 'Tipos_Operacion',
  'Tipos_Evento_Fisico', 'Tipos_Comprobante', 'Lotes_Animales',
  'Madres_Padrillos', 'Criterios_Prorrateo', 'F_EstandarRinde', 'F_Dosis',
  'Categorias_Bovinas', 'Categorias_Ovinas', 'Lotes_Agricolas'
];

const HOJAS_HECHOS = [
  'Mov_Comercial_Enc', 'Mov_Comercial_Det', 'F_PrecioIns', 'F_PrecioProd',
  'F_Costos', 'F_Ingresos', 'Movimientos_Fisicos', 'Partos',
  'Movimientos_Stock_Insumos', 'Consumo_Alimento_Real', 'Movimientos_Internos',
  'Movimientos_Financieros', 'Costos_Indirectos', 'Existencias_Hacienda',
  'Cierres_Periodo', 'Auditoria_Cambios', 'Historial_Estados',
  'Pesadas_Bovinas', 'Eventos_Sanitarios_Bovinos',
  'Zafras_Laneras', 'Eventos_Sanitarios_Ovinos',
  'Labores_Agricolas', 'Transferencias_Granos',
  'Presupuestos', 'Despachos_Transporte', 'Visitas_Estudiantiles'
];

// =============================================================================
// 2. ENTRADA WEB APP: doGet y doPost
// =============================================================================

function doGet(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const action = e.parameter.action || 'ping';
    
    if (action === 'ping') {
      return jsonResponse({
        status: 'success',
        message: 'Backend Google Apps Script operativo - Sistema Pozo del Carril',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getAllData') {
      const data = {};
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const allSheets = HOJAS_MAESTRAS.concat(HOJAS_HECHOS);
      
      allSheets.forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        if (sheet) {
          data[sheetName] = getSheetDataAsObjects(sheet);
        } else {
          data[sheetName] = [];
        }
      });

      return jsonResponse({ status: 'success', data: data, timestamp: new Date().toISOString() });
    }

    if (action === 'getTable') {
      const tableName = e.parameter.table;
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(tableName);
      if (!sheet) {
        return jsonResponse({ status: 'error', message: 'Tabla no encontrada: ' + tableName }, 404);
      }
      return jsonResponse({ status: 'success', table: tableName, data: getSheetDataAsObjects(sheet) });
    }

    if (action === 'checkMigrationStatus') {
      return handleCheckMigrationStatus();
    }

    if (action === 'runMigrationB2') {
      return handleRunMigrationB2();
    }

    return jsonResponse({ status: 'error', message: 'Acción no soportada en GET' }, 400);

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Concurrencia segura
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    const action = payload.action;

    // --- AUTENTICACIÓN ---
    if (action === 'login') {
      return handleLogin(payload.usuario, payload.contrasena);
    }

    // Para acciones operativas, se requiere token de sesión
    const token = payload.token;
    const session = validateSessionToken(token);
    if (!session.valid && action !== 'installInitialData' && action !== 'saveRecordVersioned' && action !== 'runMigrationB2' && action !== 'saveRecord') {
      return jsonResponse({ status: 'error', message: 'Sesión inválida o expirada. Por favor vuelva a identificarse.' }, 401);
    }

    const usuario = session.usuario || payload.usuario || 'admin';

    // --- ACCIONES DE DATOS Y CONCURRENCIA OPTIMISTA (BLOQUE 3 - PASO B2) ---
    if (action === 'saveRecordVersioned' || (action === 'saveRecord' && payload.operation_id)) {
      return handleSaveRecordVersioned(payload, session);
    }

    if (action === 'saveRecord') {
      return handleSaveRecord(payload.table, payload.record, usuario, payload.is_new || payload.isNew || payload.operation_type === 'INSERT', payload.operation_type);
    }

    if (action === 'deleteRecord') {
      return handleDeleteRecord(payload.table, payload.id || payload.usuario_id, usuario);
    }

    if (action === 'confirmRecord') {
      return handleConfirmRecord(payload.table, payload.id, usuario);
    }

    if (action === 'cancelRecord') {
      return handleCancelRecord(payload.table, payload.id, payload.motivo, usuario);
    }

    if (action === 'closePeriod') {
      return handleClosePeriod(payload.campana_id, payload.observaciones, usuario);
    }

    if (action === 'reopenPeriod') {
      return handleReopenPeriod(payload.campana_id, payload.motivo, usuario);
    }

    if (action === 'installInitialData') {
      return handleInstallInitialData();
    }

    return jsonResponse({ status: 'error', message: 'Acción desconocida: ' + action }, 400);

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

// =============================================================================
// 3. CONTROLADORES ESPECÍFICOS Y LÓGICA DE NEGOCIO
// =============================================================================

function handleLogin(usuarioInput, contrasenaInput) {
  if (!usuarioInput || !contrasenaInput) {
    return jsonResponse({ status: 'error', message: 'Debe ingresar usuario y contraseña' }, 400);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Usuarios');
  if (!sheet) {
    return jsonResponse({ status: 'error', message: 'No se pudo conectar con la base de datos (hoja Usuarios ausente)' }, 500);
  }

  const usuarios = getSheetDataAsObjects(sheet);
  const user = usuarios.find(u => String(u.usuario).trim().toLowerCase() === String(usuarioInput).trim().toLowerCase());

  if (!user) {
    return jsonResponse({ status: 'error', message: 'El usuario no existe' }, 404);
  }

  if (String(user.activo).toLowerCase() !== 'true' && user.activo !== true && user.activo !== 'SI' && user.activo !== 1) {
    return jsonResponse({ status: 'error', message: 'El usuario está inactivo. Contacte al administrador.' }, 403);
  }

  // Comprobación de Hash SHA-256
  const hashIngresado = hashPassword(contrasenaInput);
  if (user.contrasena_hash !== hashIngresado && user.contrasena_hash !== contrasenaInput) {
    return jsonResponse({ status: 'error', message: 'La contraseña es incorrecta' }, 401);
  }

  // Generar Token de sesión
  const token = generateSessionToken(user.usuario, user.rol_id);

  // Registrar último acceso en la hoja Usuarios
  actualizarUltimoAcceso(user.usuario_id || user.id);

  // Registrar auditoría de ingreso
  registrarAuditoria('Usuarios', user.usuario_id || user.id, 'LOGIN', 'Ingreso exitoso al sistema', user.usuario);

  return jsonResponse({
    status: 'success',
    token: token,
    user: {
      id: user.usuario_id || user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      rol_id: user.rol_id
    }
  });
}

function handleSaveRecord(tableName, record, usuario, isNew, operationType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    return jsonResponse({ status: 'error', message: 'Tabla inexistente en Google Sheets: ' + tableName }, 404);
  }

  const headers = getHeaders(sheet);
  const now = new Date().toISOString();
  
  // Validaciones de integridad funcional según tabla
  const validacion = validarReglasDeNegocio(tableName, record);
  record.estado_validacion = validacion.valido ? 'OK' : 'Observado';
  record.observacion_validacion = validacion.valido ? '' : validacion.errores.join(' | ');

  const rows = sheet.getDataRange().getValues();
  // Búsqueda insensible a mayúsculas de la columna identificadora
  const idColIdx = headers.findIndex(h => ['id', 'usuario_id', 'id_proveedor', 'id_cliente'].includes(String(h).trim().toLowerCase()));
  const searchId = record && (record.id || record.usuario_id) ? String(record.id || record.usuario_id).trim() : '';

  let targetRowIndex = -1;
  let existingRowData = null;
  if (idColIdx !== -1 && searchId) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][idColIdx]).trim() === searchId) {
        targetRowIndex = i + 1; // 1-based row in Sheets
        existingRowData = rows[i];
        break;
      }
    }
  }

  // Determinar si la operación requerida es UPDATE o INSERT
  const opType = (operationType || record.operation_type || (isNew ? 'INSERT' : 'UPDATE')).toUpperCase();

  // ---------------------------------------------------------------------------
  // CASO 1: OPERACIÓN UPDATE
  // ---------------------------------------------------------------------------
  if (opType === 'UPDATE') {
    if (targetRowIndex === -1) {
      // Si no existe, devolver un error explícito. No convertir automáticamente en alta.
      return jsonResponse({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Error en UPDATE: El registro con ID "' + searchId + '" no existe en la hoja "' + tableName + '". No se permite convertir modificación en alta automática.'
      }, 404);
    }

    // Modificar únicamente la fila correspondiente
    record.modificado_por = usuario;
    record.fecha_modificacion = now;

    headers.forEach((h, colIdx) => {
      const lowerH = String(h).trim().toLowerCase();
      // Proteger ID: nunca alterar la columna identificadora
      if (['id', 'usuario_id'].includes(lowerH)) return;

      const matchKey = Object.keys(record).find(k => k.toLowerCase() === lowerH);
      if (matchKey && record[matchKey] !== undefined) {
        sheet.getRange(targetRowIndex, colIdx + 1).setValue(record[matchKey]);
      }
    });

    registrarAuditoria(tableName, searchId, 'MODIFICACION', 'Modificación de registro', usuario);
    return jsonResponse({
      status: 'success',
      message: 'Registro actualizado exitosamente en Google Sheets',
      record: record
    });
  }

  // ---------------------------------------------------------------------------
  // CASO 2: OPERACIÓN INSERT (ALTA)
  // ---------------------------------------------------------------------------
  if (targetRowIndex === -1) {
    // Si el ID no existe, insertar el registro una sola vez
    if (!record.id && !record.usuario_id) {
      record.id = generateUniqueId(tableName);
    }
    record.creado_por = record.creado_por || usuario;
    record.fecha_creacion = record.fecha_creacion || now;
    record.modificado_por = usuario;
    record.fecha_modificacion = record.fecha_modificacion || now;
    if (!record.estado) record.estado = 'Borrador';
    if (!record.origen_dato) record.origen_dato = 'REAL';

    const newRow = headers.map(h => {
      const lowerH = String(h).trim().toLowerCase();
      const matchKey = Object.keys(record).find(k => k.toLowerCase() === lowerH);
      return matchKey && record[matchKey] !== undefined ? record[matchKey] : '';
    });
    sheet.appendRow(newRow);

    registrarAuditoria(tableName, record.id || record.usuario_id, 'ALTA', 'Creación de registro', usuario);
    return jsonResponse({
      status: 'success',
      message: 'Registro insertado exitosamente en Google Sheets',
      record: record
    });

  } else {
    // El ID ya existe en Google Sheets:
    // Comprobar si los datos son idénticos o presentan conflicto
    let isIdentical = true;
    const differences = [];

    if (existingRowData) {
      headers.forEach((h, colIdx) => {
        const lowerH = String(h).trim().toLowerCase();
        // Ignorar metadatos de sincronización volátiles al comparar equivalencia
        if (['sync_status', 'sync_error_message', 'last_sync_attempt', 'version', 'updated_at', 'fecha_modificacion', 'modificado_por'].includes(lowerH)) return;

        const matchKey = Object.keys(record).find(k => k.toLowerCase() === lowerH);
        if (matchKey && record[matchKey] !== undefined) {
          const recVal = String(record[matchKey]).trim();
          const sheetVal = String(existingRowData[colIdx]).trim();
          if (recVal !== sheetVal) {
            isIdentical = false;
            differences.push(`${h}: [remoto="${sheetVal}"] vs [entrante="${recVal}"]`);
          }
        }
      });
    }

    if (isIdentical) {
      // Si ya existe con datos idénticos, confirmar la sincronización sin duplicarlo
      return jsonResponse({
        status: 'success',
        idempotent: true,
        message: 'Registro previamente sincronizado en Google Sheets con datos idénticos (Idempotente)',
        record: record
      });
    } else {
      // Si existe con datos diferentes, devolver un conflicto verificable
      return jsonResponse({
        status: 'conflict',
        code: 'RECORD_CONFLICT',
        message: 'Conflicto: El registro con ID "' + searchId + '" ya existe en Google Sheets con datos diferentes.',
        diferencias: differences,
        record: record
      }, 409);
    }
  }
}

function handleDeleteRecord(tableName, recordId, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    return jsonResponse({ status: 'error', message: 'Tabla inexistente en Google Sheets: ' + tableName }, 404);
  }

  const headers = getHeaders(sheet);
  const rows = sheet.getDataRange().getValues();
  const idColIdx = headers.indexOf('id') !== -1 ? headers.indexOf('id') : headers.indexOf('usuario_id');

  if (idColIdx === -1) {
    return jsonResponse({ status: 'error', message: 'La tabla no posee columna identificadora (id)' }, 500);
  }

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idColIdx]) === String(recordId)) {
      targetRowIndex = i + 1; // 1-based index in Sheets
      break;
    }
  }

  if (targetRowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'Registro no encontrado en Google Sheets con ID: ' + recordId }, 404);
  }

  sheet.deleteRow(targetRowIndex);
  registrarAuditoria(tableName, recordId, 'BAJA', 'Eliminación de registro', usuario);

  return jsonResponse({ status: 'success', message: 'Registro eliminado exitosamente de Google Sheets' });
}

// =============================================================================
// 3.1. CONTROLADOR DE CONCURRENCIA OPTIMISTA (OCC) E IDEMPOTENCIA - PASO B2
// =============================================================================

/**
 * Procesa guardado administrativo con Control de Concurrencia Optimista (OCC),
 * verificación persistente de idempotencia por operation_id y auditoría atómica.
 */
function handleSaveRecordVersioned(payload, session) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usuario = (session && session.usuario) || payload.usuario || 'admin';
  const userRole = (session && session.rol) || 'ROL_ADMIN';

  // 1. RESTRICCIÓN OBLIGATORIA: Exclusión del Consolidado
  if (payload.unit === 'CONSOLIDADO') {
    return jsonResponse({
      status: 'error',
      code: 'UNAUTHORIZED_UNIT',
      message: 'El módulo Consolidado es exclusivamente analítico de solo lectura. No admite ediciones administrativas.'
    }, 403);
  }

  // 2. VALIDACIÓN DE IDENTIDAD Y PERMISOS EN SERVIDOR
  let usuario = 'admin';
  let userRole = 'ROL_ADMIN';

  if (session && session.valid) {
    usuario = session.usuario;
    userRole = session.rol;
  } else if (payload.token) {
    const validated = validateSessionToken(payload.token);
    if (validated.valid) {
      usuario = validated.usuario;
      userRole = validated.rol;
    } else {
      return jsonResponse({
        status: 'error',
        code: 'UNAUTHORIZED_SESSION',
        message: 'Sesión expirada o token inválido. Por favor vuelva a identificarse.'
      }, 401);
    }
  } else if (payload.usuario) {
    usuario = payload.usuario;
    const sheetUsers = ss.getSheetByName('Usuarios');
    if (sheetUsers) {
      const users = getSheetDataAsObjects(sheetUsers);
      const match = users.find(u => String(u.usuario).toLowerCase() === String(payload.usuario).toLowerCase());
      if (match) {
        userRole = match.rol_id;
      }
    }
  }

  if (userRole === 'ROL_OPERARIO' || userRole === 'ROL_AUDITOR') {
    return jsonResponse({
      status: 'error',
      code: 'UNAUTHORIZED_ROLE',
      message: 'Permiso denegado: El rol "' + userRole + '" no cuenta con privilegios de modificación administrativa en el servidor.'
    }, 403);
  }

  const tableName = payload.table;
  const record = payload.record || {};
  const operationId = payload.operation_id;
  const expectedVersion = Number(payload.expected_version || 1);

  if (!tableName || !record.id) {
    return jsonResponse({
      status: 'error',
      code: 'INVALID_PAYLOAD',
      message: 'Faltan parámetros obligatorios: tabla o ID de registro.'
    }, 400);
  }

  const sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    return jsonResponse({
      status: 'error',
      code: 'TABLE_NOT_FOUND',
      message: 'Tabla inexistente en Google Sheets: ' + tableName
    }, 404);
  }

  // 3. VERIFICACIÓN PERSISTENTE DE IDEMPOTENCIA (Hoja _Operaciones_Idempotencia)
  const idempSheet = getOrCreateIdempotencySheet(ss);
  if (operationId) {
    const cachedOp = checkOperationIdempotency(idempSheet, operationId);
    if (cachedOp) {
      // Reintento idempotente seguro: no se duplican filas ni auditoría
      const currentRec = findRecordById(sheet, record.id);
      return jsonResponse({
        status: 'success',
        code: 'IDEMPOTENT_REPLAY',
        message: 'Operación previamente procesada de forma segura (Idempotencia verificada).',
        version: cachedOp.version_resultante,
        record: currentRec || record
      });
    }
  }

  // 4. LECTURA Y VALIDACIÓN DE CONCURRENCIA EN SERVIDOR (OCC)
  let headers = getHeaders(sheet);
  let idColIdx = headers.indexOf('id');
  if (idColIdx === -1) {
    return jsonResponse({ status: 'error', code: 'MISSING_ID_COLUMN', message: 'La tabla no posee columna "id".' }, 500);
  }

  const rows = sheet.getDataRange().getValues();
  let targetRowIndex = -1;
  let remoteRowData = null;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idColIdx]) === String(record.id)) {
      targetRowIndex = i + 1; // 1-based index
      remoteRowData = rows[i];
      break;
    }
  }

  if (targetRowIndex === -1) {
    // Upsert / Inserción idempotente si el registro no existía en el servidor
    const now = new Date().toISOString();
    record.version = 1;
    record.updated_at = now;
    record.creado_por = record.creado_por || usuario;
    record.fecha_creacion = record.fecha_creacion || now;
    record.modificado_por = usuario;
    record.fecha_modificacion = now;
    if (!record.estado) record.estado = 'Borrador';
    if (!record.origen_dato) record.origen_dato = 'REAL';

    let versionColIdx = headers.indexOf('version');
    let updatedColIdx = headers.indexOf('updated_at');
    if (versionColIdx === -1) {
      sheet.getRange(1, headers.length + 1).setValue('version');
      headers = getHeaders(sheet);
      versionColIdx = headers.indexOf('version');
    }
    if (updatedColIdx === -1) {
      headers = getHeaders(sheet);
      sheet.getRange(1, headers.length + 1).setValue('updated_at');
      headers = getHeaders(sheet);
      updatedColIdx = headers.indexOf('updated_at');
    }

    const newRow = headers.map(h => {
      if (h === 'version') return 1;
      if (h === 'updated_at') return now;
      return record[h] !== undefined ? record[h] : '';
    });
    sheet.appendRow(newRow);

    if (operationId && idempSheet) {
      idempSheet.appendRow([
        operationId,
        tableName,
        record.id,
        usuario,
        now,
        1,
        'PROCESADO_INSERT'
      ]);
    }

    registrarAuditoria(tableName, record.id, 'ALTA', 'Creación por inserción remota versión (Upsert)', usuario);
    return jsonResponse({
      status: 'success',
      code: 'OK',
      message: 'Registro insertado exitosamente en Google Sheets (Upsert).',
      version: 1,
      record: record
    });
  }

  // Obtener versión actual en el servidor (tratar ausencia como versión 1 retrocompatible)
  let versionColIdx = headers.indexOf('version');
  let currentServerVersion = 1;
  if (versionColIdx !== -1 && remoteRowData[versionColIdx] !== '' && remoteRowData[versionColIdx] !== null) {
    currentServerVersion = Number(remoteRowData[versionColIdx]) || 1;
  }

  // Reconstruir objeto remoto actual para respuesta al cliente en caso de conflicto
  const remoteRecordObj = {};
  headers.forEach((h, idx) => {
    remoteRecordObj[h] = remoteRowData[idx];
  });
  remoteRecordObj.version = currentServerVersion;

  // COMPROBACIÓN ESTRICTA DE CONCURRENCIA OPTIMISTA
  if (currentServerVersion !== expectedVersion) {
    return jsonResponse({
      status: 'error',
      code: 'VERSION_CONFLICT',
      message: 'Conflicto de versiones: El registro fue modificado remotamente por otro usuario (versión actual v' + currentServerVersion + ' vs esperada v' + expectedVersion + ').',
      current_version: currentServerVersion,
      expected_version: expectedVersion,
      remote_record: remoteRecordObj
    }, 409);
  }

  // 5. APLICACIÓN DE MODIFICACIÓN E INCREMENTO DE VERSIÓN
  const newVersion = currentServerVersion + 1;
  const now = new Date().toISOString();

  // Asegurar columnas version y updated_at si no existen aún
  if (versionColIdx === -1) {
    sheet.getRange(1, headers.length + 1).setValue('version');
    headers = getHeaders(sheet);
    versionColIdx = headers.indexOf('version');
  }

  let updatedColIdx = headers.indexOf('updated_at');
  if (updatedColIdx === -1) {
    sheet.getRange(1, headers.length + 1).setValue('updated_at');
    headers = getHeaders(sheet);
    updatedColIdx = headers.indexOf('updated_at');
  }

  // Actualizar campos autorizados sin alterar el identificador original
  record.version = newVersion;
  record.updated_at = now;
  record.modificado_por = usuario;
  record.fecha_modificacion = now;

  headers.forEach((h, colIdx) => {
    // Proteger ID: nunca sobrescribir el ID de la fila
    if (h === 'id') return;

    if (record[h] !== undefined) {
      sheet.getRange(targetRowIndex, colIdx + 1).setValue(record[h]);
    }
  });

  // Asegurar versión y timestamp en la fila
  if (versionColIdx !== -1) {
    sheet.getRange(targetRowIndex, versionColIdx + 1).setValue(newVersion);
  }
  if (updatedColIdx !== -1) {
    sheet.getRange(targetRowIndex, updatedColIdx + 1).setValue(now);
  }

  // 6. PERSISTENCIA DE IDEMPOTENCIA
  if (operationId && idempSheet) {
    idempSheet.appendRow([
      operationId,
      tableName,
      record.id,
      usuario,
      now,
      newVersion,
      'PROCESADO'
    ]);
  }

  // 7. REGISTRO DE AUDITORÍA TRAZABLE
  const detalleAuditoria = payload.motivo 
    ? 'Modificación administrativa: ' + payload.motivo + ' (v' + expectedVersion + ' -> v' + newVersion + ')'
    : 'Actualización con OCC (v' + expectedVersion + ' -> v' + newVersion + ')';

  registrarAuditoria(tableName, record.id, 'MODIFICACION_ADMIN', detalleAuditoria, usuario);

  return jsonResponse({
    status: 'success',
    code: 'OK',
    message: 'Registro actualizado con éxito en Google Sheets.',
    version: newVersion,
    record: record
  });
}

/**
 * Obtiene o crea la hoja de control de idempotencia de operaciones
 */
function getOrCreateIdempotencySheet(ss) {
  let sheet = ss.getSheetByName('_Operaciones_Idempotencia');
  if (!sheet) {
    sheet = ss.insertSheet('_Operaciones_Idempotencia');
    const cols = ['operation_id', 'tabla', 'registro_id', 'usuario', 'fecha_hora', 'version_resultante', 'estado'];
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
    sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Verifica si un operation_id ya fue procesado
 */
function checkOperationIdempotency(sheet, operationId) {
  if (!sheet) return null;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;

  // Buscar en las últimas 500 filas
  const startRow = Math.max(2, lastRow - 500);
  const numRows = lastRow - startRow + 1;
  const values = sheet.getRange(startRow, 1, numRows, 7).getValues();

  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0]).trim() === String(operationId).trim()) {
      return {
        operation_id: values[i][0],
        tabla: values[i][1],
        registro_id: values[i][2],
        usuario: values[i][3],
        fecha_hora: values[i][4],
        version_resultante: Number(values[i][5]) || 1,
        estado: values[i][6]
      };
    }
  }
  return null;
}

/**
 * Busca un registro por ID en una hoja dada y lo retorna como objeto
 */
function findRecordById(sheet, id) {
  const headers = getHeaders(sheet);
  const idIdx = headers.indexOf('id');
  if (idIdx === -1) return null;

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(id)) {
      const obj = {};
      headers.forEach((h, c) => {
        obj[h] = rows[i][c];
      });
      return obj;
    }
  }
  return null;
}

// =============================================================================
// 3.2. MIGRACIÓN NO DESTRUCTIVA Y VERIFICACIÓN DE ESQUEMA (PASO B2)
// =============================================================================

/**
 * Comprueba el estado de migración de versión en todas las tablas
 */
function handleCheckMigrationStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsToCheck = HOJAS_MAESTRAS.concat(HOJAS_HECHOS);
  const status = {
    hojas_inspeccionadas: 0,
    hojas_con_version: 0,
    hojas_sin_version: [],
    idempotencia_instalada: !!ss.getSheetByName('_Operaciones_Idempotencia'),
    timestamp: new Date().toISOString()
  };

  sheetsToCheck.forEach(name => {
    const s = ss.getSheetByName(name);
    if (s) {
      status.hojas_inspeccionadas++;
      const headers = getHeaders(s);
      if (headers.includes('version')) {
        status.hojas_con_version++;
      } else {
        status.hojas_sin_version.push(name);
      }
    }
  });

  return jsonResponse({
    status: 'success',
    migration_status: status
  });
}

/**
 * Función directamente ejecutable sin parámetros desde el editor de Google Apps Script.
 * Obtiene la planilla activa del contenedor y ejecuta la migración B2 de forma segura.
 */
function ejecutarMigracionB2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No se pudo acceder a la planilla activa. Asegúrese de abrir el script desde la hoja de cálculo en Extensiones > Apps Script.');
  }
  const report = migrarEsquemaConcurrenciaB2(ss);
  Logger.log('Reporte de Migración Paso B2: ' + JSON.stringify(report, null, 2));
  return report;
}

/**
 * Ejecuta la migración no destructiva de versiones (B2):
 * Agrega columnas 'version' y 'updated_at' a tablas existentes sin borrar datos
 * y asigna versión inicial 1 a las filas existentes.
 */
function handleRunMigrationB2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = migrarEsquemaConcurrenciaB2(ss);
  return jsonResponse({
    status: 'success',
    message: 'Migración no destructiva Paso B2 completada con éxito.',
    report: report,
    timestamp: new Date().toISOString()
  });
}

function migrarEsquemaConcurrenciaB2(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Planilla no encontrada. La función debe ejecutarse vinculada a una hoja de Google Sheets activa.');
  }
  const sheetsToMigrate = HOJAS_MAESTRAS.concat(HOJAS_HECHOS);
  const now = new Date().toISOString();
  const report = {
    columnas_agregadas: 0,
    filas_inicializadas: 0,
    hojas_modificadas: []
  };

  sheetsToMigrate.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    let headers = getHeaders(sheet);
    if (headers.length === 0) return;

    let modified = false;
    let versionIdx = headers.indexOf('version');
    let updatedIdx = headers.indexOf('updated_at');

    // 1. Agregar columna version si no existe
    if (versionIdx === -1) {
      const newCol = headers.length + 1;
      sheet.getRange(1, newCol).setValue('version');
      sheet.getRange(1, newCol).setFontWeight('bold');
      versionIdx = newCol - 1;
      report.columnas_agregadas++;
      modified = true;
    }

    // 2. Agregar columna updated_at si no existe
    if (updatedIdx === -1) {
      headers = getHeaders(sheet);
      const newCol = headers.length + 1;
      sheet.getRange(1, newCol).setValue('updated_at');
      sheet.getRange(1, newCol).setFontWeight('bold');
      updatedIdx = newCol - 1;
      report.columnas_agregadas++;
      modified = true;
    }

    // 3. Inicializar filas existentes que no tengan versión
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const versionRange = sheet.getRange(2, versionIdx + 1, lastRow - 1, 1);
      const versionVals = versionRange.getValues();
      let needsVersionUpdate = false;

      for (let r = 0; r < versionVals.length; r++) {
        if (versionVals[r][0] === '' || versionVals[r][0] === null || versionVals[r][0] === undefined) {
          versionVals[r][0] = 1; // Versión base inicial
          needsVersionUpdate = true;
          report.filas_inicializadas++;
        }
      }

      if (needsVersionUpdate) {
        versionRange.setValues(versionVals);
      }

      const updatedRange = sheet.getRange(2, updatedIdx + 1, lastRow - 1, 1);
      const updatedVals = updatedRange.getValues();
      let needsDateUpdate = false;

      for (let r = 0; r < updatedVals.length; r++) {
        if (updatedVals[r][0] === '' || updatedVals[r][0] === null || updatedVals[r][0] === undefined) {
          updatedVals[r][0] = now;
          needsDateUpdate = true;
        }
      }

      if (needsDateUpdate) {
        updatedRange.setValues(updatedVals);
      }
    }

    if (modified) {
      report.hojas_modificadas.push(sheetName);
    }
  });

  // Asegurar hoja de idempotencia
  getOrCreateIdempotencySheet(ss);

  return report;
}

function handleConfirmRecord(tableName, recordId, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return jsonResponse({ status: 'error', message: 'Tabla no encontrada' }, 404);

  const headers = getHeaders(sheet);
  const rows = sheet.getDataRange().getValues();
  const idColIdx = headers.indexOf('id');
  const estadoColIdx = headers.indexOf('estado');
  const fechaConfIdx = headers.indexOf('fecha_confirmacion');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idColIdx]) === String(recordId)) {
      sheet.getRange(i + 1, estadoColIdx + 1).setValue('Confirmado');
      if (fechaConfIdx !== -1) {
        sheet.getRange(i + 1, fechaConfIdx + 1).setValue(new Date().toISOString());
      }
      registrarAuditoria(tableName, recordId, 'CONFIRMACION', 'Confirmación de comprobante/movimiento', usuario);
      return jsonResponse({ status: 'success', message: 'Registro confirmado exitosamente' });
    }
  }

  return jsonResponse({ status: 'error', message: 'Registro no encontrado' }, 404);
}

function handleCancelRecord(tableName, recordId, motivo, usuario) {
  if (!motivo) {
    return jsonResponse({ status: 'error', message: 'Debe ingresar un motivo para la anulación' }, 400);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return jsonResponse({ status: 'error', message: 'Tabla no encontrada' }, 404);

  const headers = getHeaders(sheet);
  const rows = sheet.getDataRange().getValues();
  const idColIdx = headers.indexOf('id');
  const estadoColIdx = headers.indexOf('estado');
  const motivoColIdx = headers.indexOf('motivo_anulacion');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idColIdx]) === String(recordId)) {
      sheet.getRange(i + 1, estadoColIdx + 1).setValue('Anulado');
      if (motivoColIdx !== -1) {
        sheet.getRange(i + 1, motivoColIdx + 1).setValue(motivo);
      }
      registrarAuditoria(tableName, recordId, 'ANULACION', 'Anulado por: ' + motivo, usuario);
      return jsonResponse({ status: 'success', message: 'Registro anulado correctamente (baja lógica)' });
    }
  }

  return jsonResponse({ status: 'error', message: 'Registro no encontrado' }, 404);
}

function handleClosePeriod(campanaId, observaciones, usuario) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Cierres_Periodo');
  if (!sheet) return jsonResponse({ status: 'error', message: 'Tabla Cierres_Periodo no encontrada' }, 500);

  const headers = getHeaders(sheet);
  const record = {
    id: generateUniqueId('Cierres_Periodo'),
    campana_id: campanaId,
    fecha_cierre: new Date().toISOString(),
    cerrado_por: usuario,
    estado: 'Cerrado',
    observaciones: observaciones || 'Cierre contable y productivo del período',
    fecha_creacion: new Date().toISOString()
  };

  const newRow = headers.map(h => record[h] !== undefined ? record[h] : '');
  sheet.appendRow(newRow);

  // Actualizar maestro D_Campana a estado Cerrado
  const sheetCamp = ss.getSheetByName('D_Campana');
  if (sheetCamp) {
    const campHeaders = getHeaders(sheetCamp);
    const campRows = sheetCamp.getDataRange().getValues();
    const idIdx = campHeaders.indexOf('id');
    const estIdx = campHeaders.indexOf('estado');
    for (let i = 1; i < campRows.length; i++) {
      if (String(campRows[i][idIdx]) === String(campanaId)) {
        sheetCamp.getRange(i + 1, estIdx + 1).setValue('Cerrado');
        break;
      }
    }
  }

  registrarAuditoria('D_Campana', campanaId, 'CIERRE_PERIODO', 'Cierre oficial del período', usuario);
  return jsonResponse({ status: 'success', message: 'Período cerrado exitosamente' });
}

function handleReopenPeriod(campanaId, motivo, usuario) {
  if (!motivo) return jsonResponse({ status: 'error', message: 'Debe justificar el motivo de reapertura' }, 400);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCamp = ss.getSheetByName('D_Campana');
  if (sheetCamp) {
    const campHeaders = getHeaders(sheetCamp);
    const campRows = sheetCamp.getDataRange().getValues();
    const idIdx = campHeaders.indexOf('id');
    const estIdx = campHeaders.indexOf('estado');
    for (let i = 1; i < campRows.length; i++) {
      if (String(campRows[i][idIdx]) === String(campanaId)) {
        sheetCamp.getRange(i + 1, estIdx + 1).setValue('Abierto');
        break;
      }
    }
  }

  registrarAuditoria('D_Campana', campanaId, 'REAPERTURA_PERIODO', 'Reapertura autorizada: ' + motivo, usuario);
  return jsonResponse({ status: 'success', message: 'Período reabierto correctamente' });
}

// =============================================================================
// 4. VALIDACIONES DE REGLAS DE NEGOCIO
// =============================================================================

function validarReglasDeNegocio(table, record) {
  const errores = [];

  // Regla 1: Gastos / Costos
  if (table === 'F_Costos' || table === 'Mov_Comercial_Enc') {
    if (!record.fecha) errores.push('Fecha obligatoria');
    if (!record.unidad_neg_id && !record.subunidad_id) errores.push('Unidad/Subunidad obligatoria');
  }

  // Regla 2: Compras
  if (table === 'Mov_Comercial_Enc' && record.tipo_operacion === 'COMPRA') {
    if (!record.proveedor_id) errores.push('Proveedor obligatorio para compras');
    if (!record.numero_comprobante) errores.push('Número de comprobante obligatorio');
  }

  // Regla 3: Ventas
  if (table === 'Mov_Comercial_Enc' && record.tipo_operacion === 'VENTA') {
    if (!record.cliente_id) errores.push('Cliente obligatorio para ventas');
    if (!record.numero_comprobante) errores.push('Número de comprobante obligatorio');
  }

  // Regla 4: Pases de fase y rangos
  if (table === 'Movimientos_Fisicos' && record.tipo_evento === 'PASE_FASE') {
    if (!record.lote_id) errores.push('Lote obligatorio');
    if (!record.fase_destino_id) errores.push('Fase de destino requerida');
    if (record.kg && record.cantidad && Number(record.cantidad) > 0) {
      const pesoPromedio = Number(record.kg) / Number(record.cantidad);
      // Validación preventiva de coherencia de peso
      if (pesoPromedio <= 0) errores.push('El peso promedio debe ser mayor a cero');
    }
  }

  // Regla 7: Alimento
  if (table === 'Consumo_Alimento_Real') {
    if (!record.insumo_id) errores.push('Insumo de alimento obligatorio');
    if (!record.kg_consumidos || Number(record.kg_consumidos) <= 0) errores.push('Kilos consumidos deben ser mayores a 0');
  }

  return {
    valido: errores.length === 0,
    errores: errores
  };
}

// =============================================================================
// 5. AUDITORÍA Y SEGURIDAD
// =============================================================================

function registrarAuditoria(tabla, registroId, operacion, detalle, usuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Auditoria_Cambios');
    if (!sheet) return;

    const headers = getHeaders(sheet);
    const rowObj = {
      id: generateUniqueId('Auditoria_Cambios'),
      tabla: tabla,
      registro_id: registroId,
      operacion: operacion,
      detalle: detalle,
      usuario: usuario,
      fecha_hora: new Date().toISOString()
    };

    const newRow = headers.map(h => rowObj[h] !== undefined ? rowObj[h] : '');
    sheet.appendRow(newRow);
  } catch (e) {
    Logger.log('Error al registrar auditoría: ' + e);
  }
}

function actualizarUltimoAcceso(usuarioId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Usuarios');
    if (!sheet) return;

    const headers = getHeaders(sheet);
    const rows = sheet.getDataRange().getValues();
    const idIdx = headers.indexOf('usuario_id');
    const idAltIdx = headers.indexOf('id');
    const ultIdx = headers.indexOf('ultimo_acceso');

    const colId = idIdx !== -1 ? idIdx : idAltIdx;
    if (colId === -1 || ultIdx === -1) return;

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][colId]) === String(usuarioId)) {
        sheet.getRange(i + 1, ultIdx + 1).setValue(new Date().toISOString());
        break;
      }
    }
  } catch (e) {
    Logger.log('Error al actualizar último acceso: ' + e);
  }
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  let hashStr = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hashStr += byteHex;
  }
  return hashStr;
}

function generateSessionToken(usuario, rolId) {
  const expiresAt = new Date().getTime() + (12 * 60 * 60 * 1000); // 12 horas
  const payload = {
    usuario: usuario,
    rol: rolId,
    exp: expiresAt,
    nonce: Utilities.getUuid()
  };
  return Utilities.base64Encode(JSON.stringify(payload));
}

function validateSessionToken(token) {
  if (!token) return { valid: false };
  try {
    const decoded = JSON.parse(Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString());
    if (decoded.exp && decoded.exp > new Date().getTime()) {
      return { valid: true, usuario: decoded.usuario, rol: decoded.rol };
    }
  } catch (e) {}
  return { valid: false };
}

// =============================================================================
// 6. INSTALACIÓN INICIAL DE HOJAS Y PRECARGA DE PARÁMETROS REALES
// =============================================================================

function handleInstallInitialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Definición exacta de columnas de todas las tablas
  const esquema = {
    // Seguridad y Configuración
    'Usuarios': ['usuario_id', 'usuario', 'contrasena_hash', 'nombre', 'rol_id', 'activo', 'ultimo_acceso'],
    'Roles': ['rol_id', 'nombre', 'permisos_acciones', 'activo'],
    'Config_Sistema': ['parametro', 'valor', 'descripcion', 'fecha_modificacion'],
    'Referencias_Relevadas': ['id', 'indicador', 'valor', 'periodo', 'fuente', 'origen_dato', 'notas'],

    // Maestros dimensionales
    'D_UnidadNeg': ['id', 'nombre', 'tipo_actividad', 'activo'],
    'D_Subunidad': ['id', 'unidad_neg_id', 'nombre', 'tipo', 'activo'],
    'Fases_Proceso': ['id', 'nombre', 'orden', 'peso_min', 'peso_max', 'duracion_referencia_dias', 'subunidad_id', 'activo'],
    'Categorias_SENASA': ['id', 'nombre', 'peso_min', 'peso_max', 'sexo_aplica', 'activo'],
    'Sectores_Fisicos': ['id', 'nombre', 'tipo_instalacion', 'capacidad_estimada', 'activo'],
    'D_Producto': ['id', 'nombre', 'categoria_senasa_id', 'um_id', 'activo'],
    'D_Insumo': ['id', 'nombre', 'tipo_insumo', 'es_alimento', 'um_id', 'cuenta_id', 'activo'],
    'D_Cuenta': ['id', 'codigo', 'nombre', 'rubro', 'tipo_cuenta', 'imputable', 'activo'],
    'D_UM': ['id', 'codigo', 'descripcion', 'activo'],
    'D_Conversion': ['id', 'um_origen_id', 'um_destino_id', 'factor_conversion', 'activo'],
    'D_Campana': ['id', 'nombre', 'fecha_desde', 'fecha_hasta', 'estado', 'activo'],
    'D_Moneda': ['id', 'codigo', 'nombre', 'simbolo', 'es_principal', 'activo'],
    'Proveedores': ['id', 'razon_social', 'cuit', 'condicion_iva', 'telefono', 'email', 'activo'],
    'Clientes': ['id', 'razon_social', 'cuit', 'condicion_iva', 'telefono', 'email', 'activo'],
    'Medios_Pago': ['id', 'nombre', 'tipo', 'activo'],
    'Tipos_Operacion': ['id', 'codigo', 'descripcion', 'activo'],
    'Tipos_Evento_Fisico': ['id', 'codigo', 'descripcion', 'activo'],
    'Tipos_Comprobante': ['id', 'codigo', 'descripcion', 'activo'],
    'Lotes_Animales': ['id', 'codigo_lote', 'fecha_formacion', 'origen', 'fase_actual_id', 'subunidad_id', 'sector_fisico_id', 'cabezas_actuales', 'kg_actuales', 'estado'],
    'Madres_Padrillos': ['id', 'identificacion_caravana', 'tipo_animal', 'linea_genetica', 'fecha_ingreso', 'estado', 'fecha_baja', 'motivo_baja'],
    'Criterios_Prorrateo': ['id', 'criterio', 'driver', 'periodo', 'subunidades_destino', 'activo'],
    
    // Parámetros técnicos
    'F_EstandarRinde': ['id', 'campana_id', 'subunidad_id', 'indicador_rendimiento', 'valor_esperado', 'um_id', 'origen_dato'],
    'F_Dosis': ['id', 'fase_id', 'subunidad_id', 'insumo_id', 'cantidad_animal_dia', 'cantidad_kg_ganancia', 'um_id', 'vigencia_desde', 'vigencia_hasta', 'origen_dato'],

    // Hechos y Transacciones
    'Mov_Comercial_Enc': ['id', 'tipo_comprobante_id', 'punto_venta', 'numero_comprobante', 'fecha', 'proveedor_id', 'cliente_id', 'tipo_operacion', 'unidad_neg_id', 'subunidad_id', 'total_neto', 'total_iva', 'total_percepciones', 'total_retenciones', 'total_final', 'estado', 'origen_dato', 'estado_validacion', 'observacion_validacion', 'creado_por', 'fecha_creacion', 'modificado_por', 'fecha_modificacion', 'fecha_confirmacion', 'motivo_anulacion'],
    'Mov_Comercial_Det': ['id', 'mov_comercial_id', 'numero_linea', 'insumo_id', 'producto_id', 'categoria_senasa_id', 'cantidad_animales', 'kg', 'precio_unitario_real', 'importe_neto', 'alicuota_iva', 'importe_iva', 'destino_productivo_id'],
    'F_PrecioIns': ['id', 'insumo_id', 'mov_comercial_id', 'fecha', 'precio_unitario_real', 'um_id', 'proveedor_id', 'origen_dato'],
    'F_PrecioProd': ['id', 'producto_id', 'mov_comercial_id', 'fecha', 'precio_unitario_real', 'um_id', 'cliente_id', 'origen_dato'],
    'F_Costos': ['id', 'fecha', 'cuenta_id', 'unidad_neg_id', 'subunidad_id', 'fase_id', 'lote_id', 'origen_costo', 'comprobante_id', 'importe_neto', 'estado', 'origen_dato', 'estado_validacion', 'observacion_validacion'],
    'F_Ingresos': ['id', 'fecha', 'cuenta_id', 'unidad_neg_id', 'subunidad_id', 'fase_id', 'lote_id', 'comprobante_id', 'importe_neto', 'estado', 'origen_dato', 'estado_validacion', 'observacion_validacion'],
    'Movimientos_Fisicos': ['id', 'fecha', 'tipo_evento', 'lote_id', 'madre_id', 'cantidad_cabezas', 'kg_totales', 'fase_origen_id', 'fase_destino_id', 'categoria_senasa_id', 'sector_origen_id', 'sector_destino_id', 'motivo', 'estado', 'origen_dato', 'estado_validacion', 'observacion_validacion', 'creado_por', 'fecha_creacion', 'fecha_confirmacion'],
    'Partos': ['id', 'madre_id', 'padrillo_id', 'fecha_servicio', 'fecha_parto', 'nacidos_vivos', 'nacidos_muertos', 'fecha_destete', 'destetados', 'lote_generado_id', 'observaciones', 'estado', 'origen_dato'],
    'Movimientos_Stock_Insumos': ['id', 'fecha', 'tipo_movimiento', 'insumo_id', 'cantidad', 'um_id', 'origen_movimiento_id', 'stock_resultante', 'observaciones'],
    'Consumo_Alimento_Real': ['id', 'fecha', 'insumo_id', 'kg_consumidos', 'fase_id', 'subunidad_id', 'lote_id', 'costo_unitario_imputado', 'costo_total_imputado', 'estado', 'origen_dato', 'estado_validacion', 'observacion_validacion', 'creado_por', 'fecha_creacion'],
    'Movimientos_Internos': ['id', 'fecha', 'unidad_origen_id', 'unidad_destino_id', 'insumo_id', 'producto_id', 'cantidad', 'um_id', 'criterio_valorizacion', 'valor_unitario', 'valor_total', 'estado', 'observaciones'],
    'Movimientos_Financieros': ['id', 'fecha', 'mov_comercial_id', 'medio_pago_id', 'tipo_flujo', 'importe', 'estado', 'referencia_bancaria'],
    'Costos_Indirectos': ['id', 'campana_id', 'periodo', 'cuenta_id', 'criterio_prorrateo_id', 'importe_total', 'subunidad_destino_id', 'importe_prorrateado', 'estado'],
    'Existencias_Hacienda': ['id', 'campana_id', 'fecha_cierre', 'subunidad_id', 'fase_id', 'categoria_senasa_id', 'lote_id', 'cabezas', 'kg_totales', 'base_valuacion', 'valor_unitario', 'valor_total', 'fuente_valor', 'estado'],
    'Cierres_Periodo': ['id', 'campana_id', 'fecha_cierre', 'cerrado_por', 'estado', 'observaciones', 'fecha_creacion'],
    'Auditoria_Cambios': ['id', 'tabla', 'registro_id', 'operacion', 'detalle', 'usuario', 'fecha_hora'],
    'Historial_Estados': ['id', 'tabla', 'registro_id', 'estado_anterior', 'estado_nuevo', 'motivo', 'usuario', 'fecha_hora']
  };

  let hojasCreadas = 0;

  // Crear o verificar cada hoja
  for (const tableName in esquema) {
    let sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
      hojasCreadas++;
    }
    const cols = esquema[tableName];
    const existingValues = sheet.getDataRange().getValues();
    if (existingValues.length === 0 || existingValues[0].length === 0 || !existingValues[0][0]) {
      sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }

  // --- PRECARGA ESTRICTA DE DATOS REALES CONFIRMADOS (SECCIÓN 12) ---
  // No inventar datos! Solo lo estrictamente confirmado en el relevamiento:

  // 1. Roles
  const sheetRoles = ss.getSheetByName('Roles');
  if (sheetRoles.getLastRow() <= 1) {
    const rolesData = [
      ['ROL_ADMIN', 'Administrador General', 'ALL', true],
      ['ROL_ENCARGADO', 'Encargado de Producción', 'VER,CARGAR,CONFIRMAR,CERRAR', true],
      ['ROL_OPERARIO', 'Operario de Campo', 'VER,CARGAR_BORRADOR', true],
      ['ROL_AUDITOR', 'Auditor / Consultor', 'VER_TODO,AUDITORIA', true]
    ];
    sheetRoles.getRange(2, 1, rolesData.length, rolesData[0].length).setValues(rolesData);
  }

  // 2. Usuarios
  const sheetUsers = ss.getSheetByName('Usuarios');
  if (sheetUsers.getLastRow() <= 1) {
    const adminHash = hashPassword('PozoDelCarril2025!');
    const usersData = [
      ['USR_ADMIN_01', 'admin', adminHash, 'Administrador Pozo del Carril', 'ROL_ADMIN', true, '']
    ];
    sheetUsers.getRange(2, 1, usersData.length, usersData[0].length).setValues(usersData);
  }

  // 3. D_UnidadNeg
  const sheetUnidades = ss.getSheetByName('D_UnidadNeg');
  if (sheetUnidades.getLastRow() <= 1) {
    const unidadesData = [
      ['UN_PORCINA', 'Producción Porcina', 'GANADERA_INTENSIVA', true],
      ['UN_AGRICULTURA', 'Agricultura (Maíz y Soja)', 'ORIGEN_TRANSFERENCIAS', true],
      ['UN_BOVINOS', 'Producción Bovina', 'DESTINO_TRANSFERENCIAS', true],
      ['UN_OVINOS', 'Producción Ovina', 'DESTINO_TRANSFERENCIAS', true]
    ];
    sheetUnidades.getRange(2, 1, unidadesData.length, unidadesData[0].length).setValues(unidadesData);
  }

  // 4. D_Subunidad
  const sheetSub = ss.getSheetByName('D_Subunidad');
  if (sheetSub.getLastRow() <= 1) {
    const subunidadesData = [
      ['SUB_PLANTEL_REP', 'UN_PORCINA', 'Plantel Reproductor', 'PRODUCTIVA', true],
      ['SUB_CRIA', 'UN_PORCINA', 'Cría', 'PRODUCTIVA', true],
      ['SUB_DESTETE_REC', 'UN_PORCINA', 'Destete/Recría', 'PRODUCTIVA', true],
      ['SUB_ENGORDE_TERM', 'UN_PORCINA', 'Engorde/Terminación', 'PRODUCTIVA', true]
    ];
    sheetSub.getRange(2, 1, subunidadesData.length, subunidadesData[0].length).setValues(subunidadesData);
  }

  // 5. Fases_Proceso
  const sheetFases = ss.getSheetByName('Fases_Proceso');
  if (sheetFases.getLastRow() <= 1) {
    const fasesData = [
      ['FASE_CRIA', 'Cría', 1, 0, 9, 28, 'SUB_CRIA', true],
      ['FASE_DESTETE_REC', 'Destete/Recría', 2, 9, 45, '', 'SUB_DESTETE_REC', true],
      ['FASE_ENGORDE_TERM', 'Engorde/Terminación', 3, 45, 100, 90, 'SUB_ENGORDE_TERM', true]
    ];
    sheetFases.getRange(2, 1, fasesData.length, fasesData[0].length).setValues(fasesData);
  }

  // 6. Categorias_SENASA
  const sheetSenasa = ss.getSheetByName('Categorias_SENASA');
  if (sheetSenasa.getLastRow() <= 1) {
    const senasaData = [
      ['CAT_LECHON', 'Lechón', '', '', 'AMBOS', true],
      ['CAT_CACHORRO', 'Cachorro/Cachorra', '', '', 'AMBOS', true],
      ['CAT_CAPON', 'Capón', '', '', 'MACHO_CASTRADO', true],
      ['CAT_MEJ', 'Macho Entero Joven', '', '', 'MACHO', true],
      ['CAT_CERDA_DESC', 'Cerda de Descarte/Refugo', '', '', 'HEMBRA', true],
      ['CAT_PADRILLO_DESC', 'Verraco/Padrillo de Descarte', '', '', 'MACHO', true]
    ];
    sheetSenasa.getRange(2, 1, senasaData.length, senasaData[0].length).setValues(senasaData);
  }

  // 7. D_Insumo
  const sheetInsumos = ss.getSheetByName('D_Insumo');
  if (sheetInsumos.getLastRow() <= 1) {
    const insumosData = [
      ['INS_MAIZ_PROP', 'Maíz propio (Agricultura)', 'GRANO', true, 'UM_KG', '', true],
      ['INS_PELLET_SOJA', 'Concentrado/pellet de soja comprado', 'PROTEICO', true, 'UM_KG', '', true],
      ['INS_PELETEADO_DEST', 'Alimento peleteado fases 1/2 de destete comprado', 'BALANCEADO', true, 'UM_KG', '', true]
    ];
    sheetInsumos.getRange(2, 1, insumosData.length, insumosData[0].length).setValues(insumosData);
  }

  // 8. F_Dosis e ICA (Parámetros Técnicos)
  const sheetDosis = ss.getSheetByName('F_Dosis');
  if (sheetDosis.getLastRow() <= 1) {
    const dosisData = [
      ['DOS_ENGORDE_ICA', 'FASE_ENGORDE_TERM', 'SUB_ENGORDE_TERM', '', '', 3.0, 'UM_KG', '2024-01-01', '', 'REAL'],
      ['DOS_DESTETE_ICA', 'FASE_DESTETE_REC', 'SUB_DESTETE_REC', '', '', 1.75, 'UM_KG', '2024-01-01', '', 'SUPUESTO']
    ];
    sheetDosis.getRange(2, 1, dosisData.length, dosisData[0].length).setValues(dosisData);
  }

  // 9. Referencias_Relevadas (Línea de base real del punto 5)
  const sheetRef = ss.getSheetByName('Referencias_Relevadas');
  if (sheetRef.getLastRow() <= 1) {
    const refData = [
      ['REF_PLANTEL', 'Plantel activo de madres', '34', 'Línea de base relevada', 'Encargado del establecimiento', 'REAL', 'Plantel base Landrace x Yorkshire'],
      ['REF_PARTOS_TOTAL', 'Partos registrados en período', '71', 'Octubre 2024 - Agosto 2026', 'Libro de parición del establecimiento', 'REAL', 'Partos fechados'],
      ['REF_PARTOS_ANIO', 'Partos por madre por año', '2.06', 'Octubre 2024 - Agosto 2026', 'Cálculo sobre registros reales', 'REAL', 'Índice reproductivo real'],
      ['REF_INTERVALO', 'Intervalo medio entre partos (días)', '177', 'Octubre 2024 - Agosto 2026', 'Registros de servicio y parto', 'REAL', 'Días promedio entre partos consecutivos'],
      ['REF_GESTACION', 'Gestación promedio (días)', '114.3', 'Octubre 2024 - Agosto 2026', 'Registros de parición', 'REAL', 'Duración real de gestación'],
      ['REF_NACIDOS_VIVOS', 'Nacidos vivos promedio por camada', '11.56', 'Octubre 2024 - Agosto 2026', 'Registros de partos', 'REAL', 'Lechones nacidos vivos por parto'],
      ['REF_DESTETADOS', 'Destetados promedio por camada', '9.92', 'Octubre 2024 - Agosto 2026', 'Registros de destete', 'REAL', 'Lechones destetados por parto'],
      ['REF_SUPERVIVENCIA', 'Supervivencia al destete (%)', '85.81', 'Octubre 2024 - Agosto 2026', 'Relación destetados / nacidos vivos', 'REAL', 'Cercana al 86%'],
      ['REF_ICA_ENGORDE', 'Índice de Conversión Alimenticia (ICA) Engorde', '3.00', 'Vigente', 'Declarado por el encargado', 'REAL', '3 kg de alimento por kg de ganancia'],
      ['REF_ICA_DESTETE', 'Índice de Conversión Alimenticia (ICA) Destete', '1.75', 'Estimación provisoria', 'Grupo 2 - Taller Práctica II', 'SUPUESTO', 'Pendiente de reemplazo por consumo real'],
      ['REF_COSTO_ALIM', 'Participación de la alimentación en costo total (%)', '65 - 75%', 'Estimación histórica', 'Relevamiento productivo', 'REFERENCIA EXTERNA', 'Mayor componente de costo']
    ];
    sheetRef.getRange(2, 1, refData.length, refData[0].length).setValues(refData);
  }

  // 10. D_UM
  const sheetUM = ss.getSheetByName('D_UM');
  if (sheetUM.getLastRow() <= 1) {
    const umData = [
      ['UM_KG', 'kg', 'Kilogramo', true],
      ['UM_TN', 'tn', 'Tonelada métrica', true],
      ['UM_CAB', 'cab', 'Cabezas de ganado', true],
      ['UM_UN', 'un', 'Unidad simple', true]
    ];
    sheetUM.getRange(2, 1, umData.length, umData[0].length).setValues(umData);
  }

  // 11. D_Moneda
  const sheetMon = ss.getSheetByName('D_Moneda');
  if (sheetMon.getLastRow() <= 1) {
    const monData = [
      ['MON_ARS', 'ARS', 'Pesos Argentinos', '$', true, true],
      ['MON_USD', 'USD', 'Dólares Estadounidenses', 'US$', false, true]
    ];
    sheetMon.getRange(2, 1, monData.length, monData[0].length).setValues(monData);
  }

  // 12. D_Campana
  const sheetCamp = ss.getSheetByName('D_Campana');
  if (sheetCamp.getLastRow() <= 1) {
    const campData = [
      ['CAMP_2024_2025', 'Campaña 2024/2025', '2024-07-01', '2025-06-30', 'Abierto', true],
      ['CAMP_2025_2026', 'Campaña 2025/2026', '2025-07-01', '2026-06-30', 'Abierto', true]
    ];
    sheetCamp.getRange(2, 1, campData.length, campData[0].length).setValues(campData);
  }

  return jsonResponse({
    status: 'success',
    message: 'Estructura de base de datos e inicialización completadas con éxito en Google Sheets.',
    timestamp: new Date().toISOString()
  });
}

// =============================================================================
// 7. FUNCIONES AUXILIARES DE UTILERÍA
// =============================================================================

function getHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
}

function getSheetDataAsObjects(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(h => String(h).trim());
  const list = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    // Ignorar filas totalmente vacías
    if (row.every(cell => cell === '' || cell === null)) continue;
    const obj = {};
    headers.forEach((h, c) => {
      let val = row[c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss'Z'");
      }
      obj[h] = val;
    });
    list.push(obj);
  }
  return list;
}

function generateUniqueId(prefix) {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const timestamp = new Date().getTime().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${cleanPrefix}_${timestamp}_${rand}`;
}

function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
