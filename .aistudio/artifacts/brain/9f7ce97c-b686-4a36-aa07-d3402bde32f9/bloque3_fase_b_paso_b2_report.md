# INFORME TÉCNICO OFICIAL – BLOQUE 3, FASE B, PASO B2
## Integración Real de Concurrencia Optimista (OCC), Cola Outbox y Google Apps Script / Sheets
### Sistema Integral de Gestión Ganadera – Establecimiento Pozo del Carril · La Aguada (UNRC)

---

## RESUMEN DE ESTADO GENERAL

| Componente / Dimensión | Estado de Madurez | Clasificación de Trabajo |
| :--- | :---: | :--- |
| **Controlador Backend OCC en `apps-script/Code.gs`** | **100% Completo** | **Implementado en código local** (Listo para despliegue) |
| **Persistencia de Idempotencia (`_Operaciones_Idempotencia`)** | **100% Completo** | **Implementado en código local** |
| **Migración No Destructiva de Esquema (`version`, `updated_at`)** | **100% Completo** | **Implementado en código local** (Listo para correr) |
| **Integración Cola Outbox Frontend (`syncQueue.ts` & `storage.ts`)** | **100% Completo** | **Implementado en código local y compilado** |
| **Protección contra Sobrescritura en Cargas Remotas** | **100% Completo** | **Implementado en código local** |
| **Modal Comparativo de Conflicto (`ConflictResolutionModal.tsx`)** | **100% Completo** | **Implementado y conectado en `App.tsx`** |
| **Exclusión Estricta de CONSOLIDADO** | **100% Completo** | **Implementado y verificado en cliente y servidor** |
| **Despliegue en Google Apps Script** | **Pendiente de acción manual** | **Pendiente de despliegue en consola de Google** |
| **Verificación Remota en Google Sheets Real** | **Pendiente de despliegue** | **Condicionado al despliegue manual del script** |

---

## 1. CÓDIGO DEL BACKEND MODIFICADO (`apps-script/Code.gs`)

Se incorporó en `apps-script/Code.gs` la arquitectura requerida para el backend:

1. **Recepción en `doPost` y `doGet`:**
   - Soporte para acción `'saveRecordVersioned'` y comprobación de `payload.operation_id`.
   - Soporte para comprobación de migración (`action === 'checkMigrationStatus'`) y ejecución de migración (`action === 'runMigrationB2'`).
2. **Controlador `handleSaveRecordVersioned(payload, session)`:**
   - **Exclusión de Consolidado:** Rechaza con `403 UNAUTHORIZED_UNIT` cualquier intento de edición en el módulo analítico consolidado.
   - **Permisos en Servidor:** Verifica sesión y bloquea modificaciones administrativas si el rol es `ROL_OPERARIO` (`403 UNAUTHORIZED`).
   - **Bloqueo de Concurrencia:** Utiliza `LockService.getScriptLock()` con espera de hasta 30 segundos (`lock.waitLock(30000)`) para evitar colisiones atómicas entre solicitudes concurrentes.
   - **Idempotencia Persistente:** Lee y escribe en la hoja `_Operaciones_Idempotencia`. Si un `operation_id` ya fue procesado, responde con `IDEMPOTENT_REPLAY` devolviendo la versión resultante sin duplicar filas ni eventos de auditoría.
   - **Comprobación de Versión (OCC):**
     - Si la fila no tiene versión previa, asume versión retrocompatible `1`.
     - Si `expected_version !== current_version`, rechaza la operación con código `409 Conflict`, retornando `{ status: 'error', code: 'VERSION_CONFLICT', current_version, remote_record }`.
   - **Actualización Segura:** Incrementa `version = current_version + 1`, graba `updated_at` (marca ISO), preserva de forma inmutable el identificador original `id`, actualiza únicamente los campos autorizados en la fila existente mediante `sheet.getRange(row, col).setValue()`.
   - **Auditoría Trazable:** Inserta en `Auditoria_Cambios` el detalle de la modificación administrativa con usuario, versión previa y nueva, y motivo.

---

## 2. CÓDIGO DEL FRONTEND INTEGRADO

1. **`src/lib/syncQueue.ts`:**
   - Incorporó `dispatchItem(item, url, token)` para transmitir operaciones individuales con OCC hacia Apps Script.
   - Incorporó `processPendingQueue(url, token, onRecordUpdated)` para procesar en orden los ítems encolados, respetando reintentos e idempotencia.
   - Implementó sistema de suscripción `onConflictDetected` para notificar al árbol de React ante conflictos remotos.
2. **`src/lib/storage.ts`:**
   - **Protección contra Sobrescritura en `syncFromSheets()`:** Al recibir datos remotos de Google Sheets, comprueba si cada registro tiene una operación activa (`PENDIENTE`, `CONFLICTO` o `ERROR`) en la cola Outbox. Si existe, retiene la versión local editada para evitar pérdida de datos no confirmados.
   - **`saveRecord()`:** Encola modificaciones administrativas para Porcinos, Bovinos y Ovinos calculando el diff campo por campo, asignando un `operation_id` único y despachando de inmediato si hay conexión configurada.
   - **Exclusión de Consolidado:** Se verifica mediante `determineUnit(table)` evitando encolar tablas consolidadas en el Outbox.
3. **`src/App.tsx`:**
   - Suscribe globalmente a `syncQueue.onConflictDetected`.
   - Monta `ConflictResolutionModal` cuando se produce un conflicto 409, permitiendo recargar desde Sheets o descartar los cambios locales.
4. **`src/views/ConfiguracionView.tsx`:**
   - Agregó el panel de control del Paso B2 con monitoreo en vivo de la cola Outbox (total y pendientes).
   - Botón para "Despachar Cola Pendiente Ahora".
   - Botón para "Comprobar Esquema" en Google Sheets (`checkMigrationStatus`).
   - Botón para "Ejecutar Migración B2" (`runMigrationB2`).

---

## 3. MIGRACIÓN PREPARADA O EJECUTADA

* **Estado:** **Preparada en código (Lista para ejecutar con 1 clic o desde Apps Script)**.
* **Mecanismo:** Función `migrarEsquemaConcurrenciaB2(ss)` en `apps-script/Code.gs`.
* **Características de Seguridad:**
  - Inspecciona las 26 hojas maestras y 17 hojas de hechos.
  - Verifica si `version` y `updated_at` existen en la fila 1 de encabezados. Si no existen, las añade al final sin alterar las columnas previas ni las fórmulas.
  - Recorre las filas existentes y, si la celda de versión está en blanco, le asigna el valor inicial `1`.
  - Crea la hoja `_Operaciones_Idempotencia` con sus encabezados si no existe.
  - **No destructiva:** Puede ejecutarse múltiples veces de forma idempotente y segura sin duplicar columnas ni reiniciar versiones de registros ya modificados.

---

## 4. RESPALDO VERIFICADO O PENDIENTE

* **Estado:** **Pendiente en el entorno de Google Drive del usuario**.
* **Acción requerida antes del despliegue:**
  - En Google Drive, hacer clic derecho sobre la planilla principal de Google Sheets y seleccionar **Hacer una copia** (ej. *"Respaldo Pre-B2 - Pozo del Carril - 2026"*).
  - Los datos locales en el frontend (`localStorage`) ya cuentan con respaldo persistente en el navegador.

---

## 5. ESTADO DE DESPLIEGUE DE APPS SCRIPT

* **Estado:** **Pendiente de Despliegue Manual**.
* **Motivo:** Google AI Studio opera en un contenedor local aislado sin credenciales OAuth de escritura sobre el editor de Apps Script del usuario. El código local en `apps-script/Code.gs` debe ser copiado al editor de Apps Script de la planilla.

---

## 6. ESTADO DE INTEGRACIÓN CON GOOGLE SHEETS

* **Estado:** **Frontend preparado y conectado lógicamente**. La integración real operativa comenzará tan pronto se actualice el script en Google Apps Script y se ejecute la migración.

---

## 7. PRUEBAS REALES EJECUTADAS

* **Estado:** **Pendientes del despliegue en Google Sheets**.
* **Comportamiento en Modo Local:** Las llamadas a Apps Script se retienen de forma segura en la cola Outbox persistente en `localStorage`, mostrando el indicador amarillo **PENDIENTE** y permitiendo continuar operando offline.

---

## 8. PRUEBAS SIMULADAS EJECUTADAS

Se ejecutó la suite completa en `src/lib/test_concurrency_outbox.ts` con **100% de éxito (7 de 7 aprobadas)**:
1. **Prueba A (Actualización Común):** Versión coincide (`v1`). Incremento exitoso a `v2` en el servidor simulado sin alterar ID ni campos críticos. *(APROBADO)*
2. **Prueba B (Conflicto Concurrente):** Intento con versión desactualizada frente a versión remota avanzada; rechazo seguro con código `VERSION_CONFLICT` (HTTP 409) y apertura de diff. *(APROBADO)*
3. **Prueba C (Sin Conexión / Outbox):** Falla de conexión; el cambio se almacena en la cola local (`localStorage`). Al restablecer red, se sincroniza a `v2` sin pérdida de datos. *(APROBADO)*
4. **Prueba D (Reintento Idempotente):** Envío duplicado del mismo `operation_id`; el backend detecta la operación previa y responde con `IDEMPOTENT_REPLAY` sin generar filas duplicadas. *(APROBADO)*
5. **Prueba E (Aislamiento de Error Parcial):** Fallo aislado en un registro inválido sin corromper el resto del lote. *(APROBADO)*
6. **Prueba F (Permisos y Roles):** Rechazo estricto con `UNAUTHORIZED` ante intentos de edición por usuarios no administradores. *(APROBADO)*
7. **Prueba G (Separación entre Unidades):** Modificaciones simultáneas en Porcinos, Bovinos y Ovinos sin interferencias de esquemas. *(APROBADO)*

---

## 9. FUNCIONES TODAVÍA PENDIENTES (FASE C)

* Procedimientos formales de rectificación contable / económica (Nivel 3).
* Despacho y trazabilidad inter-unidad avanzada.
* *Nota: La Fase C no se iniciará hasta recibir su autorización explícita.*

---

## 10. ACCIONES MANUALES CONCRETAS QUE DEBE REALIZAR EL USUARIO

Para poner en producción el Paso B2 en su hoja de Google Sheets, siga estos 6 pasos:

1. **Abrir la Planilla y Crear Respaldo:**
   - Abra la hoja de cálculo de Google Sheets de Pozo del Carril.
   - En el menú **Archivo**, seleccione **Hacer una copia** con el nombre `Respaldo_Pre_B2_Pozo_del_Carril`.
2. **Abrir el Editor de Apps Script:**
   - En la hoja original, vaya a **Extensiones > Apps Script**.
3. **Pegar el Nuevo Código:**
   - Abra el archivo `Code.gs` en el editor.
   - Borre todo su contenido y pegue el código completo del archivo local `apps-script/Code.gs` provisto en el proyecto.
   - Presione **Guardar (ícono de disquete o Ctrl+S)**.
4. **Ejecutar la Migración de Esquema (Una sola vez):**
   - En la barra de herramientas superior del editor de Apps Script, seleccione la función `migrarEsquemaConcurrenciaB2` en el menú desplegable.
   - Haga clic en **Ejecutar**.
   - Si Google solicita autorización, acepte los permisos. En el registro de ejecución verá que se crearon las columnas `version` y `updated_at` y la hoja `_Operaciones_Idempotencia`.
5. **Actualizar la Implementación Web:**
   - Haga clic en el botón azul superior **Implementar > Gestionar implementaciones**.
   - Haga clic en el **ícono de lápiz (Editar)** de la implementación activa.
   - En el menú desplegable **Versión**, seleccione **Nueva versión** (ej. *Versión 2 - OCC y Outbox*).
   - Verifique que *"Quién tiene acceso"* siga configurado como **Cualquier persona (Anyone)**.
   - Haga clic en **Implementar**.
6. **Verificar en la Aplicación Web:**
   - Ingrese al módulo **Configuración > Google Sheets & Apps Script**.
   - En el nuevo panel *"Control de Concurrencia Optimista (OCC) & Cola Outbox · Paso B2"*, haga clic en **Comprobar Esquema**.
   - Deberá responder `{ "status": "success", "migration_status": { "hojas_con_version": ..., "idempotencia_instalada": true } }`.
