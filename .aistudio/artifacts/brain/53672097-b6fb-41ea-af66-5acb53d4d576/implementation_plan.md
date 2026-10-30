# Plan de Perfeccionamiento de la Unidad Bovina: Navegación, Compras, Gestión Económica y Modelo de Gestión

Establecimiento Pozo del Carril – La Aguada (UNRC)  
Unidades: **Porcinos** · **Bovinos** · **Ovinos**

> [!IMPORTANT]
> **REGLA DE ORO DE CONSERVACIÓN**: La Unidad Porcina se encuentra 100% operativa y validada. Este plan garantiza la preservación innegociable de sus páginas, formularios, cálculos, registros históricos, cotizaciones ROSPORC, vínculos con Google Sheets y reglas zootécnicas, así como la integridad de la Unidad Ovina. **No se modificará código ni datos hasta recibir la confirmación expresa del usuario.**

---

## 1. Fase A: Diagnóstico Integral del Estado Actual

### 1.1. Diagnóstico de la Interfaz y Navegación
* **Problema Identificado (Barra Horizontal Interna)**:  
  En `src/views/GanaderiaBovinaView.tsx` (líneas 457 a 529) existe una barra horizontal de pestañas (`Panel & CMI Bovino`, `Rodeo, Cría & Cabaña`, `Manga & Pesadas (ADPV)`, `Alimentación, Potreros & Carga`, `Decisión de Venta & MAG`, `Sanidad SENASA`) que rompe el criterio de navegación unificado del sistema.
* **Causa Raíz en el Enrutador (`src/App.tsx`, línea 262)**:  
  `App.tsx` utiliza un condicional *catch-all*:  
  `activeBusinessUnit === 'BOVINOS' && !['usuarios', 'configuracion', 'auditoria', 'manual'].includes(activeModule) ? <GanaderiaBovinaView /> : ...`  
  Esto provoca que cuando el usuario hace clic en el menú lateral en *Compras*, *Presupuesto*, *Histórico*, *Indicadores* o *Stock*, no se abran pantallas correspondientes a esos módulos, sino la vista monolítica `GanaderiaBovinaView` forzando la barra de pestañas horizontal.

### 1.2. Diagnóstico de Compras y Proveedores
* En `src/views/ComprasView.tsx`, las compras están hardcodeadas con `unidad_neg_id: 'UN_PORCINA'`, sin discriminación por la unidad de negocio activa.
* No existe en la vista de compras de Bovinos la selección de insumos específicos ganaderos: rollos de alfalfa, silo de maíz picado fino, concentrados proteicos, núcleos minerales, caravanas/RFID oficiales SENASA, vacunas obligatorias (Aftosa, Carbunclo) ni reproductores comprados.
* Falta de trazabilidad y distinción de **Transferencias Internas de Granos** (maíz propio desde la Unidad Agrícola): actualmente no existe el selector de remito interno con costo contable transferido sin duplicar la salida de caja de proveedores externos.

### 1.3. Diagnóstico de Gestión Económica (Presupuestos e Histórico)
* En Bovinos, hacer clic en *Presupuesto y Desvíos* o *Histórico Económico* abre actualmente una solapa genérica de ventas de la barra horizontal, sin mostrar:
  1. Presupuesto por campaña/período segmentado por las subunidades bovinas: *Cría*, *Recría*, *Adaptación*, *Engorde*, *Cabaña Angus* y *Costos de Estructura Bovinos*.
  2. Histórico de operaciones bovinas con filtros zootécnicos por categoría (Toros, Vacas, Vaquillonas, Novillos, Terneros), tipo de evento (pesada, tacto, sanidad, venta, compra) y valuación RT 54.
  3. Cálculo de margen bruto operativo bovino considerando la variación de inventario de hacienda sin distorsión por granos propios.

### 1.4. Diagnóstico del Modelo de Gestión (CMI Bovino)
* El Cuadro de Mando Integral bovino actual es estático y resumido dentro de la pestaña `Panel & CMI Bovino`, impidiendo al usuario editar metas, umbrales de semáforo o marcar indicadores favoritos como sí lo permite `src/views/IndicadoresView.tsx` en Porcinos.
* Falta la integración bidireccional donde los indicadores favoritos seleccionados en el CMI se proyecten en el **Inicio / Panel General de Ganadería Bovina**.

### 1.5. Diagnóstico del Módulo Comercial (Ventas vs. Simulación)
* La herramienta de decisión de venta y simulación con precios del MAG Cañuelas se encuentra mezclada con el formulario de liquidación de ventas reales, corriendo el riesgo de que una simulación altere el stock de hacienda o genere un comprobante comercial no deseado.

---

## 2. Fase B: Propuesta de Reorganización y Equivalencia Funcional

### 2.1. Mapa de Navegación del Menú Lateral (Antes vs. Después)

A continuación se detalla cómo quedará la estructura del menú lateral (acordeón profesional) cuando el usuario selecciona **BOVINOS**:

| Grupo de Menú | Estado Anterior (Con Barra Interna) | Propuesta Perfeccionada (Navegación 100% Lateral) | Justificación & Destino de la Vista |
| :--- | :--- | :--- | :--- |
| **Panel General** | • `Inicio · Ganadería Bovina` *(abría pestaña panel con CMI estático)* | • **`Inicio · Ganadería Bovina`** | **Síntesis ejecutiva de alto nivel**: Existencias por categoría, balance forrajero/carga (EV/ha), ADPV actual, tacto/preñez, sanidad SENASA y favoritos del CMI Bovino. |
| **Producción** | • `Rodeo, Cría & Cabaña`<br>• `Alimentación & Potreros`<br>• `Stock de Insumos`<br>• `Existencias & Cierres`<br>*(Dentro de la pantalla había 6 pestañas horizontales)* | • **`Rodeo, Cría & Cabaña`**<br>• **`Manga & Pesadas (ADPV)`**<br>• **`Alimentación, Potreros & Carga`**<br>• **`Sanidad SENASA`** | **Subopciones exactas requeridas**: Cada una abre su propia pantalla completa sin barra horizontal interna. *Manga* y *Sanidad* se promocionan a ítems de primer nivel en el menú lateral. |
| **Gestión Comercial** | • `Compras & Proveedores` *(redirigía a ventas)*<br>• `Ventas MAG & Cabaña` *(mezclaba simulación y ventas)* | • **`Compras & Proveedores Bovinos`**<br>• **`Stock de Insumos Bovinos`**<br>• **`Ventas de Hacienda / Liquidaciones`**<br>• **`Simulación de Venta Bovina (MAG)`** | **Segregación estricta**: Compras adaptadas a insumos ganaderos y remitos de maíz propio; ventas reales con DTE SENASA separadas de la **Simulación de Venta Bovina**, la cual es 100% hipotética y aislada de asientos y stock. |
| **Gestión Económica** | • `Presupuestos & Desvíos` *(inactivo en bovinos)*<br>• `Histórico Económico` *(inactivo en bovinos)* | • **`Presupuestos & Desvíos Bovinos`**<br>• **`Histórico Económico Bovino`** | Presupuestos por campaña y subunidad bovina (Cría, Recría, Adaptación, Engorde, Cabaña). Histórico con filtros por categoría animal y cálculo de margen bruto RT 54. |
| **Modelo de Gestión** | • `Indicadores & CMI` *(abría pestaña panel)*<br>• `Auditoría & Trazabilidad` | • **`Indicadores & CMI Bovino`**<br>• **`Auditoría & Trazabilidad Bovina`** | CMI completo con 4 perspectivas, metas y umbrales editables, semáforos cuatri-estado (Verde, Amarillo, Rojo, Gris) y selección de favoritos. |
| **Administración** | • `Gestión de Usuarios & Maestros`<br>• `Configuración & Sheets` | • **`Gestión de Usuarios & Maestros`**<br>• **`Configuración & Sheets`** | Maestros compartidos multi-unidad (proveedores, clientes, usuarios, potreros) preservados sin colisión. |

### 2.2. Matriz de Equivalencia Funcional (Porcinos ↔ Bovinos)

| Funcionalidad / Módulo | Implementación en Porcinos | Implementación Perfeccionada en Bovinos | Aislamiento y Reglas de Negocio |
| :--- | :--- | :--- | :--- |
| **Navegación** | Menú lateral acordeón sin barras internas | Menú lateral acordeón idéntico, eliminación total de la barra horizontal interna | Cero barras de pestañas anidadas en ambas unidades. |
| **Compras & Proveedores** | Facturas de compra A/B/C, premezclas, maíz, alícuotas IVA, subunidad porcina | Facturas de compra con detalle multi-ítem, IVA, percepciones, destino ganadero (Cría/Engorde/Cabaña) + **Remito de Maíz Propio** | No computa salida financiera externa en transferencias internas agrícolas (`UN_AGRICULTURA` $\rightarrow$ `UN_BOVINOS`). |
| **Insumos y Stock** | Concentrados cerdas, iniciador, terminador | Rollos alfalfa, silo maíz picado, sales minerales, caravanas RFID SENASA, vacunas oficiales | Actualización de stock ganadero sin mezclar con depósitos porcinos. |
| **Ventas de Hacienda** | Venta de capones al frigorífico con cotización ROSPORC | Liquidaciones de consignatario con comisiones, DTE SENASA, índice MAG Cañuelas y ventas de reproductores Cabaña | No utiliza ROSPORC; precios de referencia basados en MAG Cañuelas ($/kg) o precio por cabeza en Cabaña. |
| **Simulador Comercial** | No aplica | **Simulador de Venta Bovina (MAG)**: Evaluación de margen incremental de retención (ej. 340 kg $\rightarrow$ 420 kg en 45 días) | Estrictamente hipotético: no genera comprobantes ni altera existencias físicas o contables. |
| **Presupuestos y Desvíos** | Presupuesto por campaña (Cerdas, Farrow-to-finish) | Presupuesto por campaña segmentado por: Cría, Recría, Adaptación, Engorde, Cabaña y Costos de Estructura | Comparativa Presupuestado vs. Real con desvíos en $ y % y semáforos económicos. |
| **Histórico Operativo** | Series temporales porcinas de faena y costos | Histórico cronológico con filtros por caravana, categoría SENASA, potrero y tipo de comprobante | Exportación a CSV y cálculo de Margen Bruto Operativo bajo RT 54 FACPCE. |
| **Cuadro de Mando (CMI)** | 4 perspectivas con metas editables y favoritos para piara | 4 perspectivas adaptadas a bovinos con edición de metas, semáforo cuatri-estado y favoritos proyectados al Panel General | Semáforos: Verde (óptimo), Amarillo (alerta), Rojo (crítico) y Gris (datos insuficientes). |

### 2.3. Diseño de Flujos Clave

#### Flujo 1: Compras Bovinas y Manejo de Grano Propio
1. **Compra a Proveedor Externo**: Registro de factura (punto de venta, número, proveedor, fecha, condición de pago, detalle de ítems, alícuotas de IVA 10.5% o 21%, percepciones). Actualiza stock de insumos bovinos y genera pasivo comercial imputado a `UN_BOVINOS`.
2. **Transferencia Interna de Maíz Propio**: Opción *"Transferencia Interna UN Agrícola"*. Se registra con número de remito interno, cantidad de kg y costo de transferencia interno ($/kg). Incrementa el stock de maíz bovino e imputa el costo operativo sin generar pasivo financiero a proveedores ni pago bancario.

#### Flujo 2: Presupuesto y Desvíos por Subunidad Bovina
1. Selección de Campaña (ej. `2024/2025`).
2. Selección de Subunidad: `Todas`, `Cría`, `Recría Pastoril`, `Adaptación Corral`, `Terminación Feedlot`, `Cabaña Angus` o `Estructura Bovina`.
3. Rubros presupuestarios:
   - Alimentación suplementaria y concentrados
   - Implantación y mantenimiento de pasturas / verdeos
   - Sanidad oficial (vacunas Aftosa/Carbunclo SENASA, antiparasitarios)
   - Mano de obra directa y servicios de manga
   - Amortización de reproductores (Toros P.C. RT 54)
   - Comercialización (comisiones consignatario, fletes de hacienda)
4. Comparativa dinámica: Presupuestado vs. Real vs. Desvío ($ y %) con alertas visuales.

#### Flujo 3: Simulación de Venta Bovina (Aislada de Operaciones Reales)
- Entradas: Peso actual (kg), Precio hoy MAG ($/kg), ADPV esperado (kg/día), Días de retención, Costo diario de alimentación/estructura ($/cab/día), Precio proyectado a término ($/kg), Cabezas de la tropa.
- Salidas: Aumento de peso proyectado, Peso final, Margen incremental por cabeza y por tropa, Costo del kg producido, Veredicto de conveniencia económica.
- **Aislamiento**: Aviso destacado en la UI indicando que la simulación es un modelo de decisión prospectivo que no genera asientos ni comprobantes comerciales.

---

## 3. Fase C: Plan de Implementación por Etapas y Protocolo de No Regresión

### Etapa 1: Enrutamiento y Navegación en `Sidebar.tsx` y `App.tsx`
* Extender `ModuleKey` de forma limpia o crear subclaves específicas para la navegación bovina:
  - En `Sidebar.tsx`:
    - Al seleccionar `BOVINOS`, dentro de `PRODUCCIÓN` se renderizan los enlaces exactos:
      1. `Rodeo, Cría & Cabaña` (`bov_rodeo`)
      2. `Manga & Pesadas (ADPV)` (`bov_manga`)
      3. `Alimentación, Potreros & Carga` (`bov_alimentacion`)
      4. `Sanidad SENASA` (`bov_sanidad`)
    - En `GESTIÓN COMERCIAL`, se incorporan:
      1. `Compras & Proveedores Bovinos` (`compras`)
      2. `Stock de Insumos Bovinos` (`stock`)
      3. `Ventas de Hacienda / Liquidaciones` (`ventas`)
      4. `Simulación de Venta Bovina (MAG)` (`bov_simulacion`)
* En `App.tsx`: Reemplazar el catch-all `activeBusinessUnit === 'BOVINOS' && !['usuarios', ...] ? <GanaderiaBovinaView />` por el enrutamiento desacoplado modular.

### Etapa 2: Eliminación de la Barra Horizontal y Desacoplamiento de Vistas Bovinas
* En las vistas de producción bovina, remover definitivamente el contenedor con tabs horizontales (`Panel & CMI Bovino`, etc.).
* El contenido de cada vista responderá de forma directa e inequívoca al ítem activo seleccionado en el Sidebar.

### Etapa 3: Módulo de Compras, Proveedores y Stock Bovino
* Adaptar el formulario de compras para que cuando la unidad activa sea `BOVINOS`:
  - Se visualicen únicamente los comprobantes imputados a `UN_BOVINOS`.
  - Se cargue el catálogo de insumos ganaderos y proveedores veterinarios/forrajeros.
  - Se habilite la opción de **Transferencia Interna de Maíz Propio** (remito interno).
  - Se actualice en tiempo real el stock de insumos bovinos disponible para dietas y sanidad.

### Etapa 4: Módulo de Presupuestos y Gestión Económica Bovina
* Habilitar `PresupuestosView` e `HistoricoEconomicoView` para operar con datos de `UN_BOVINOS`:
  - Presupuesto por subunidades bovinas (Cría, Recría, Adaptación, Engorde, Cabaña).
  - Histórico económico con filtros específicos (categorías SENASA, caravanas, potreros) y exportación a CSV.
  - Cálculo de margen bruto operativo con variación de inventario RT 54 y neutralización de duplicación de granos propios.

### Etapa 5: Cuadro de Mando Integral (CMI) Bovino y Síntesis en Panel General
* Habilitar en `IndicadoresView` el CMI completo de Bovinos con sus 4 perspectivas, edición de metas, umbrales y semáforos cuatri-estado.
* Permitir seleccionar indicadores favoritos que se proyecten automáticamente en la tarjeta resumen de `Inicio · Ganadería Bovina`.

### Etapa 6: Batería de Pruebas de Regresión y Validación
* **Porcinos**:
  - Validar inicio de sesión y selección de `PORCINOS`.
  - Validar que las bandas de servicio, partos, destetes y recría porcina sigan idénticas.
  - Validar que las compras porcinas no contengan insumos bovinos ni se vean afectadas.
  - Validar cotizaciones ROSPORC y liquidaciones de capones.
  - Validar presupuesto porcino y CMI porcino.
* **Ovinos**:
  - Validar que la majada Dorper y sus registros no se alteren.
* **Compilación y Linteo**:
  - Ejecución de `tsc --noEmit` y `compile_applet`.

---

## 4. Fase D: Solicitud Expresa de Confirmación

De acuerdo a la directiva obligatoria:
**"PRIMERO PRESENTÁ EL DIAGNÓSTICO, EL MENÚ PROPUESTO Y EL PLAN DE IMPLEMENTACIÓN, Y ESPERÁ MI APROBACIÓN ANTES DE REALIZAR CAMBIOS EN EL CÓDIGO O LOS DATOS."**

Quedo a la espera de su revisión y aprobación para iniciar inmediatamente la implementación de la Etapa 1.
