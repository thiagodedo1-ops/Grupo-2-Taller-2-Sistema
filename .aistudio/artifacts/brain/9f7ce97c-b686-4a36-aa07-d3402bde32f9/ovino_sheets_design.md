# Diseño de Persistencia en Google Sheets - Unidad Ovina

## Propuesta: Hojas Relacionadas (Alternativa B)

Se recomienda utilizar múltiples hojas relacionadas por claves únicas (`id_...`) en lugar de una única hoja maestra, para facilitar la gestión de los volúmenes de datos y permitir auditorías independientes por circuito.

### Estructura de Hojas

| Hoja | Descripción | Columnas Clave |
| :--- | :--- | :--- |
| `OVI_MAESTROS` | Categorías, Subunidades | `id_cat`, `id_subu`, `nombre` |
| `OVI_EXISTENCIAS` | Saldo físico animal | `id_exist`, `id_camp`, `id_subu`, `id_cat`, `cabezas`, `fecha` |
| `OVI_PRODUCCION` | Eventos pariciones/muertes | `id_prod`, `id_camp`, `id_subu`, `tipo`, `cant`, `fecha` |
| `OVI_CONSUMOS` | Costeo directo | `id_cons`, `id_camp`, `id_subu`, `id_insumo`, `cant`, `fecha` |
| `OVI_COMPRAS_ENC` | Compras header | `id_comp`, `id_prov`, `id_camp`, `fecha`, `total` |
| `OVI_COMPRAS_DET` | Compras line items | `id_det`, `id_comp`, `id_insumo`, `cant`, `precio` |
| `OVI_VENTAS_ENC` | Ventas header | `id_vent`, `id_cli`, `id_camp`, `fecha`, `total` |
| `OVI_VENTAS_DET` | Ventas line items | `id_det`, `id_vent`, `id_cat`, `cabezas`, `kg`, `precio` |

### Mecanismos de Control
- **PKs:** Se generarán mediante `dbManager` con prefijo `OVI_` + `timestamp` (o UUID).
- **Integridad:** Las funciones de escritura del `dbManager` validarán la existencia de IDs en las hojas `D_...` compartidas antes de confirmar la escritura en hojas `OVI_...`.
- **Previsión de fallas:** Cada fila tendrá un campo `estado` ('Borrador', 'Confirmado') para evitar lecturas de datos incompletos durante un proceso de sincronización interrumpido.
