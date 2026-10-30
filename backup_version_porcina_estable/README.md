# Copia de Respaldo - Versión Porcina Estable (Pre-Multinegocio)
Fecha de creación: 21 de Octubre de 2026

Esta carpeta contiene la copia íntegra del sistema antes de la ampliación a múltiples unidades de negocio (Ganadería Bovina, Ganadería Ovina y Agricultura Maíz/Soja).

### Contenido respaldado:
- `src/` (Componentes, tipos, servicios de Google Sheets, autenticación de usuarios, CMI 24 indicadores, vistas de Gestión Porcina).
- `server.ts` (Servidor Express con integración de IA, Vite middlewares y motor contextual).
- `package.json`

### Procedimiento para restaurar a esta versión en caso de requerirlo:
Ejecutar en la raíz del proyecto:
```bash
cp -r backup_version_porcina_estable/src .
cp backup_version_porcina_estable/server.ts .
npm run build
```
