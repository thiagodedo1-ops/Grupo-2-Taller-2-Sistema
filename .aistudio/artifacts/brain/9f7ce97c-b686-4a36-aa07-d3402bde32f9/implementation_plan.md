# Plan de Implementación – Etapa 2: Reorganización de Pantallas Internas y Simplificación de UX

Este documento presenta el diagnóstico exhaustivo de las pantallas internas del Sistema Integral de Gestión Ganadera (Pozo del Carril – La Aguada | UNRC) y la propuesta concreta de simplificación para homologar la experiencia de usuario entre **Porcinos**, **Bovinos** y **Ovinos**, preservando intactos todos los procesos productivos, cálculos, permisos y la conexión con Google Sheets.

---

## 1. Diagnóstico del Estado Actual de Pantallas Internas

### A. Unidad Porcina (Estándar de Referencia)
- **Estado**: Totalmente operativo, claro y ordenado.
- **Estructura que funciona**:
  1. Encabezado con título y descripción contextual.
  2. Tarjetas superiores de resumen métrico (3-4 KPIs inmediatos).
  3. Barra de filtros rápidos y búsqueda por texto.
  4. Botón de acción principal destacado (*«Nuevo Registro»*) que abre formulario modal limpio.
  5. Tabla de datos central con estados de validación (*Borrador*, *Confirmado*, *Observado*, *Anulado*) y bitácora de auditoría.
- **Decisión**: **CONSERVAR 100% INTACTO**. No se modifica ningún componente porcino.

---

### B. Unidad Bovina (Diagnóstico y Oportunidades de Mejora)
- **Componentes modulares existentes en `src/views/bovinos/`**:
  - `DashboardBovinoView.tsx`: Síntesis ejecutiva del rodeo, carga en EV/ha y 6 KPIs favoritos del CMI.
  - `RodeoBovinoView.tsx`: Registro individual, caravanas SENASA, categorías y eventos reproductivos.
  - `MangaPesadasBovinoView.tsx`: Sesiones de pesada en manga, cálculo de ADPV y evolución.
  - `AlimentacionPotrerosBovinoView.tsx`: Gestión de 180 ha, receptividad forrajera y raciones.
  - `SanidadBovinoView.tsx`: Libreta oficial SENASA, actas de vacunación (Aftosa/Carbunclo).
  - `ComprasBovinoView.tsx`: Facturas de compra de insumos ganaderos y remitos de maíz propio UNRC.
  - `StockBovinoView.tsx`: Silos, rollos, concentrados y vacunas.
  - `VentasBovinoView.tsx`: Liquidaciones de hacienda con DTE SENASA y ventas de Cabaña Angus.
  - `SimulacionVentaBovinoView.tsx`: Modelo predictivo de retención con precios del MAG Cañuelas (estrictamente aislado de la contabilidad).
  - `PresupuestoBovinoView.tsx`: Presupuestos por campaña y subunidad bovina (Cría, Recría, Adaptación, Engorde, Cabaña).
  - `HistoricoBovinoView.tsx`: Series históricas zootécnicas y margen bruto RT 54.
  - `IndicadoresBovinoView.tsx`: Cuadro de Mando Integral bovino completo con metas editables.
- **Inconsistencias detectadas**:
  1. *Ruta de Existencias*: En `App.tsx`, la ruta `existencias` en Bovinos abría redundantemente `DashboardBovinoView` en vez de la tabla de existencias y distribución zootécnica por categoría.
  2. *Archivo Monolítico Residual*: El archivo `src/views/GanaderiaBovinaView.tsx` (1995 líneas con pestañas horizontales internas) quedó como un remanente no utilizado; sus funciones ya están desacopladas en los componentes de `src/views/bovinos/`. Debe retirarse su import huérfano.
  3. *Unificación de Estilo*: Alinear los botones de acción, filtros y modales de las pantallas de `src/views/bovinos/` para que sigan exactamente el mismo ritmo visual que Porcinos (usando la paleta tierra/marrón).

---

### C. Unidad Ovina (Diagnóstico y Cuello de Botella Principal)
- **Problema Crítico Identificado**:
  - Actualmente, en `src/App.tsx`, **todas las rutas del menú lateral en Ovinos** (`inicio`, `produccion`, `alimentacion`, `compras`, `ventas`, `presupuesto`, `historico`, `indicadores`, `stock`, `existencias`) abren el **mismo componente único**: `GanaderiaOvinaView.tsx`.
  - Dentro de ese componente existe una barra de 3 pestañas internas (*Categorías y Condición Corporal*, *Zafras Laneras*, *Manejo Sanitario*). El usuario hace clic en "Compras" o "Presupuesto" y vuelve a ver la misma pantalla de majada con pestañas internas.
  - Además, el formulario de zafra lanera actual simula ventas comerciales de lana a barracas locales, lo cual contradice el perfil real de la unidad:
    > *La unidad ovina está orientada a la producción de carne y a la transición genética hacia la raza Dorper. La esquila es una labor de bienestar animal y sanidad, no una actividad comercial principal.*
- **Oportunidades de Mejora**:
  - Desacoplar la experiencia de Ovinos en vistas específicas según la sección del menú lateral.
  - Orientar los formularios comerciales y productivos exclusivamente a **carne ovina (corderos pesados / capones)** y **genética Dorper**.
  - Mantener el registro de esquila como evento de manejo y bienestar de la majada, sin generar ingresos ficticios por venta de lana.

---

## 2. Propuesta Concreta de Simplificación por Secciones

La siguiente tabla resume qué componentes se conservan, cuáles se ajustan y qué verá el usuario en cada sección:

| Sección Principal | Unidad Porcina (Intacta) | Unidad Bovina (Simplificada) | Unidad Ovina (Desacoplada y Orientada a Carne) |
| :--- | :--- | :--- | :--- |
| **1. Panel General** | `DashboardView.tsx`<br>*(Conservado 100%)* | `DashboardBovinoView.tsx`<br>• Síntesis de cabezas y EV/ha.<br>• ADPV novillos y preñez.<br>• 6 KPIs favoritos del CMI.<br>• Sin CMI completo duplicado. | `DashboardOvinoView.tsx`<br>• Síntesis de majada y carga UO.<br>• Señalada (%) y vientres encarnerados.<br>• Condición corporal y alertas sanitarias.<br>• Acceso rápido a tareas clave. |
| **2. Producción** | `ProduccionView.tsx`<br>`AlimentacionView.tsx`<br>`StockView.tsx`<br>`ExistenciasView.tsx`<br>*(Conservados 100%)* | • **Rodeo & Cabaña**: `RodeoBovinoView.tsx`<br>• **Manga & ADPV**: `MangaPesadasBovinoView.tsx`<br>• **Alimentación**: `AlimentacionPotrerosBovinoView.tsx`<br>• **Sanidad**: `SanidadBovinoView.tsx`<br>• **Stock**: `StockBovinoView.tsx`<br>• **Existencias**: Tabla zootécnica de categorías SENASA. | • **Majada & Rodeo**: Categorías zootécnicas, carneros Dorper, condición corporal.<br>• **Manejo Sanitario & Señalada**: Vacunación clostridial y registros de señalada.<br>• **Esquila de Bienestar**: Registro de zafra física sin venta ficticia.<br>• **Stock & Alimentación**: Forrajes, pasturas y balance de raciones. |
| **3. Gestión Comercial** | `ComprasView.tsx`<br>`VentasView.tsx`<br>*(Conservados 100%)* | • **Compras**: `ComprasBovinoView.tsx` (con remito de maíz propio).<br>• **Ventas**: `VentasBovinoView.tsx` (con DTE SENASA).<br>• **Simulador**: `SimulacionVentaBovinoView.tsx` (aislado de asientos). | • **Compras Ovinas**: Alimentos, premezclas, botiquín veterinario e insumos de majada.<br>• **Ventas de Hacienda**: Venta comercial de corderos para carne y descartes. |
| **4. Gestión Económica** | `PresupuestosView.tsx`<br>`HistoricoEconomicoView.tsx`<br>*(Conservados 100%)* | • **Presupuestos**: `PresupuestoBovinoView.tsx` (subunidades Cría, Recría, Feedlot, Cabaña).<br>• **Histórico**: `HistoricoBovinoView.tsx` (margen bruto RT 54). | • **Presupuestos Ovinos**: Costos directos de la majada, verdeos y suplementación.<br>• **Histórico Ovino**: Resultados cronológicos y margen de carne ovina. |
| **5. Modelo de Gestión** | `IndicadoresView.tsx`<br>`AuditoriaView.tsx`<br>*(Conservados 100%)* | • **CMI Bovino**: `IndicadoresBovinoView.tsx` (4 perspectivas, metas y semáforos).<br>• **Auditoría**: Filtro de consistencia y caravanas. | • **CMI Ovino**: Indicadores de majada (señalada %, mortalidad en corderos, GDP Dorper, margen por UO).<br>• **Auditoría**: Trazabilidad de operaciones ovinas. |
| **6. Administración** | `UsuariosView.tsx`<br>`ConfiguracionView.tsx`<br>*(Compartido y universal)* | *(Mismo módulo transversal con persistencia de Google Sheets en servidor)* | *(Mismo módulo transversal con persistencia de Google Sheets en servidor)* |
| **7. Ayuda** | `ManualView.tsx`<br>Guía Interactiva & Asistente IA | *(Mismo módulo transversal descargable e imprimible)* | *(Mismo módulo transversal descargable e imprimible)* |

---

## 3. Identidad Cromática Homogénea

| Elemento UI | Porcinos (Referencia) | Bovinos (Tierra/Ganadero) | Ovinos (Azul Marino/Cielo) |
| :--- | :--- | :--- | :--- |
| **Fondo de Barra Lateral** | `#0a1b12` (Verde bosque profundo) | `#1c120c` (Cacao oscuro) | `#090e17` (Azul medianoche) |
| **Botón de Acción Principal** | `#1c4b31` (Verde esmeralda sobrio) | `#78350f` (Ámbar tierra intenso) | `#1e40af` (Azul institucional) |
| **Bordes de Tarjetas** | `#d8e2d7` | `#e7d4c4` | `#bfdbfe` |
| **Fondos Secundarios** | `#edf5ef` | `#fbf4ee` | `#eff6ff` |
| **Semáforos Funcionales** | Verde / Amarillo / Rojo / Gris *(Idénticos en las tres unidades)* | Verde / Amarillo / Rojo / Gris *(Idénticos en las tres unidades)* | Verde / Amarillo / Rojo / Gris *(Idénticos en las tres unidades)* |

---

## 4. Componentes Específicos que se Conservan vs. que se Modifican

### Componentes que se CONSERVAN ÍNTEGRAMENTE (Sin Modificaciones):
- Todos los componentes y vistas de la Unidad Porcina: `ProduccionView`, `AlimentacionView`, `ComprasView`, `VentasView`, `StockView`, `ExistenciasView`, `PresupuestosView`, `HistoricoEconomicoView`, `IndicadoresView`.
- Todos los servicios contables y de cálculo: `calculations.ts`, `cmiCalculations.ts`, `cmiConstants.ts`, `currencyService.ts`, `rosporcService.ts`.
- La persistencia y sincronización con Google Sheets: `storage.ts`, `server.ts`, `config/sheets-config.json`.
- Los componentes transversales: `Header.tsx`, `Sidebar.tsx`, `DataTable.tsx`, `StatusTag.tsx`, `BadgeOrigin.tsx`.

### Componentes que se MODIFICAN o AJUSTAN en esta Etapa:
1. **`src/App.tsx`**:
   - Ajustar el enrutador para que las opciones del Sidebar en **Bovinos** y **Ovinos** abran su vista especializada directamente en lugar de vistas monolíticas o incorrectas.
   - Corregir el enlace de `existencias` en Bovinos para que renderice la tabla zootécnica de existencias y categorías SENASA.
   - Retirar el import no utilizado de `GanaderiaBovinaView.tsx`.
2. **`src/views/bovinos/`**:
   - Pulir `DashboardBovinoView.tsx` para que los accesos rápidos apunten limpiamente a los submódulos del Sidebar.
   - Asegurar que `RodeoBovinoView.tsx`, `MangaPesadasBovinoView.tsx`, `AlimentacionPotrerosBovinoView.tsx`, `SanidadBovinoView.tsx`, `ComprasBovinoView.tsx`, `VentasBovinoView.tsx` y `SimulacionVentaBovinoView.tsx` respeten la estructura estándar de pantalla (Título $\rightarrow$ Métricas $\rightarrow$ Filtros $\rightarrow$ Botón Carga $\rightarrow$ Tabla).
3. **`src/views/GanaderiaOvinaView.tsx` / Subvistas Ovinas**:
   - Desacoplar las pestañas internas en submódulos ordenados que respondan a la opción seleccionada en el Sidebar (`produccion`, `alimentacion`, `sanidad`, `compras`, `ventas`).
   - Depurar el formulario de zafra lanera: eliminar destinos comerciales y precios de venta de lana ficticios, conservando el registro real de esquila higiénica/sanitaria.
   - Enfocar los registros de comercialización exclusivamente en **carne ovina (corderos Dorper)**.

---

## 5. Plan de Ejecución por Bloques Pequeños (Tras Aprobación)

1. **Bloque 1 (Bovinos)**:
   - Limpieza de enlaces en `App.tsx` para Bovinos.
   - Verificación de la estructura de pantalla en los componentes de `src/views/bovinos/`.
   - Comprobación de que el Simulador de Venta siga aislado de las ventas reales.
2. **Bloque 2 (Ovinos)**:
   - Desacoplamiento de las vistas de Ovinos por submódulo del Sidebar.
   - Ajuste del enfoque a carne ovina y transición Dorper (sin ingresos ficticios de lana).
3. **Bloque 3 (Alineación y Pruebas)**:
   - Verificación de identidad visual (paletas de colores).
   - Ejecución de la matriz de pruebas de navegación, linteo (`tsc --noEmit`) y compilación (`compile_applet`).
   - Validación de no-regresión en Porcinos y persistencia de Google Sheets.

---

> [!IMPORTANT]
> **REGLA DE SEGURIDAD**: No se modificará código hasta recibir la aprobación expresa del usuario de esta propuesta y diagnóstico.
