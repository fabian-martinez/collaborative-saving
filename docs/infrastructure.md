# Infraestructura

## Desarrollo local

### Prerrequisitos

- Node.js 18+
- Docker (opcional, para base de datos local)
- PostgreSQL

### Inicio rápido

```bash
# 1. Instalar todo
npm run install:all

# 2. Configurar variables de entorno (ver .env.example en backend y frontend-v2)

# 3. Iniciar proyecto
npm run dev
```

### Servicios (local)

| Servicio | URL | Propósito |
|---|---|---|
| Backend | http://localhost:3000 | API REST |
| Frontend | http://localhost:5173 | Interfaz de usuario |
| Base de Datos | localhost:5432 | PostgreSQL |

### Variables de entorno

- Cada subproyecto tiene su propio `.env.example`.
- Nunca commitees `.env`.

## Producción

### Objetivo de despliegue

Supabase (BD + Auth) y Host de Node.js (Vercel/Render/Docker).

### CI/CD

- **Herramienta:** GitHub Actions.
- **Trigger:** Push a main.
- **Pasos:** Build -> Lint -> Test -> Deploy.

## Observabilidad

Se utilizan los logs de NestJS y las herramientas de monitoreo de Supabase.

## Gestión de Base de Datos

### Estructura de Carpetas

- **Ubicación:** `infra/database/`
- `migrations/`: Scripts SQL incrementales para cambios en el esquema.
- `scripts/`: Scripts de utilidad (seed, reseteo, cálculos puntuales).
- `backups/` (opcional/ignorado): Volcados de datos.

### Gestión de Backups

#### Convenciones
Los backups deben nombrarse siguiendo el patrón: `backup_restored_db_feb21_YYYYMMDD.sql`.

#### Creación
Para generar un backup completo (esquema + datos) desde la terminal:
```bash
export PGPASSWORD='tu_password'
pg_dump -h localhost -p 5432 -U postgres -d restored_db_feb21 -f "infra/database/backup_restored_db_feb21_$(date +%Y%m%d).sql"
unset PGPASSWORD
```

#### Restauración
Para restaurar un backup en una base de datos limpia:
```bash
export PGPASSWORD='tu_password'
psql -h localhost -p 5432 -U postgres -d restored_db_feb21 -f "infra/database/nombre_del_backup.sql"
unset PGPASSWORD
```

### Automatización de Backups
Se recomienda configurar una tarea programada (cron job) en el servidor de base de datos o mediante un GitHub Action que realice el `pg_dump` semanalmente y lo almacene en un almacenamiento seguro (S3, Google Drive, etc.).

### Plan de Migración de Esquemas
Para realizar cambios en la estructura de la base de datos de manera segura:

1. **Crear Migración:** Generar un nuevo archivo `.sql` en `infra/database/migrations/` con un prefijo numérico secuencial (ej. `0003_add_new_table.sql`).
2. **Ambiente de Pruebas:** Aplicar la migración en una base de datos local o de staging para validar que no rompe la aplicación.
3. **Backup Pre-Migración:** Generar un backup manual de producción justo antes de aplicar cambios.
4. **Ejecución:** Aplicar el script en producción.
5. **Estrategia de Rollback:** Cada migración debe tener un script de reversión documentado o el backup previo listo para ser restaurado en caso de falla catastrófica.

## Docs relacionados

- [Arquitectura](./architecture.md)
- [Decisiones](./adrs/)
