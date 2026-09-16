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

- **Base de Datos:** Neon Serverless Postgres (PostgreSQL 15+, SSL obligatorio, Connection Pooling con PgBouncer).
- **Autenticación:** Firebase Auth.
- **Backend:** NestJS en PaaS / Container (Render / Cloud Run).
- **Frontend:** SPA Vue 3 en CDN (Cloudflare Pages / Vercel).

### CI/CD

- **Herramienta:** GitHub Actions.
- **Trigger:** Push a main.
- **Pasos:** Build -> Lint -> Test -> Deploy.

### Despliegue del Backend API (Fase 4)

El backend NestJS se despliega como un servicio web gestionado en **Render** (o alternativamente en **Google Cloud Run** usando el contenedor Docker).

#### Opción A: Despliegue en Render (Recomendado $0)

##### Método 1: Render Blueprint (1-Click / IaC)
El proyecto incluye un manifiesto declarativo [`render.yaml`](../render.yaml) en la raíz:
1. En el panel de Render, selecciona **New +** -> **Blueprint**.
2. Conecta el repositorio de GitHub (`collaborative-saving`).
3. Render detectará automáticamente el servicio `collaborative-saving-backend` con todas sus configuraciones en la región `ohio` (co-ubicada con Neon en `aws-us-east-2`).
4. Asigna los valores secretos solicitados (`DATABASE_URL` y `FIREBASE_SERVICE_ACCOUNT_JSON`).
5. Haz clic en **Apply**.

##### Método 2: Configuración Manual en Render
Si prefieres crearlo manualmente:
1. **New +** -> **Web Service**.
2. Conectar repositorio y configurar:
   - **Name:** `collaborative-saving-backend`
   - **Root Directory:** `backend`
   - **Region:** `Ohio (US East)`
   - **Runtime:** `Node`
   - **Build Command:** `npm ci --include=dev && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Instance Type:** `Free`
   - **Health Check Path:** `/`

#### Opción B: Despliegue en Google Cloud Run
Para desplegar vía contenedor:
1. Compilar y subir la imagen usando [`backend/Dockerfile`](../backend/Dockerfile):
   ```bash
   gcloud builds submit --tag gcr.io/<PROJECT-ID>/collaborative-saving-backend ./backend
   ```
2. Desplegar el servicio en Cloud Run:
   ```bash
   gcloud run deploy collaborative-saving-backend \
     --image gcr.io/<PROJECT-ID>/collaborative-saving-backend \
     --platform managed \
     --region us-east4 \
     --allow-unauthenticated \
     --port 3000
   ```

#### Matriz de Variables de Entorno de Producción

| Variable | Valor / Descripción | Sensible |
|---|---|:---:|
| `NODE_ENV` | `production` | No |
| `PORT` | `3000` (o asignado automáticamente por el proveedor) | No |
| `DATABASE_URL` | URI de conexión pooled de Neon (`postgresql://neondb_owner:...@...-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`) | **Sí** |
| `DATABASE_SSL` | `true` (habilita conexión segura TLS con `{ rejectUnauthorized: false }`) | No |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | String JSON de la clave privada de Firebase Admin en una sola línea (`{"type":"service_account",...}`) | **Sí** |
| `ALLOWED_ORIGINS` | Orígenes autorizados separados por coma (`https://collaborative-saving.pages.dev,https://collaborative-saving.vercel.app,http://localhost:5173`) | No |
| `ENABLE_SWAGGER` | `false` (deshabilita la interfaz `/api` en producción para proteger esquemas y endpoints) | No |

#### Ciclo de Vida y Migraciones en Producción
1. **Migraciones de Esquema SQL:** Las tablas maestras y modificaciones estructuradas se registran en `public.schema_migrations` y se gestionan con `./deploy-schema.sh` o `npm run db:migrate`.
2. **Migraciones TypeORM de Arranque:** Al arrancar el servicio en producción (`npm run start:prod`), se ejecuta automáticamente `typeorm:migration:run:prod` para aplicar cualquier migración pendiente de TypeORM (ej. ajustes de redondeo contable) antes de que NestJS empiece a recibir tráfico.
3. **Escucha en `0.0.0.0`:** La API escucha en todas las interfaces para permitir que el reverse proxy del proveedor enrute las peticiones externas.

#### Verificación y Pruebas Post-Despliegue

Una vez desplegada la instancia, valida su funcionamiento y seguridad:

```bash
# 1. Health Check público (debe responder 200 OK con 'Hello World!')
curl -i https://<TU-BACKEND-URL>/

# 2. Validación de correo (público con rate-limiting, debe responder 200 OK)
curl -i -X POST https://<TU-BACKEND-URL>/v2/auth/validate-email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@collaborativesaving.com"}'

# 3. Verificación de seguridad en rutas protegidas (DEBE responder 401 Unauthorized)
curl -i https://<TU-BACKEND-URL>/members
```

## Observabilidad

Se utilizan los logs estructurados de NestJS y la consola de monitoreo de Neon / Cloud Logging.

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

### Sistema de Migraciones y Versionamiento (`schema_migrations`)

El versionamiento y trazabilidad de los cambios en la base de datos se gestiona automáticamente mediante la tabla `public.schema_migrations`:

```sql
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    execution_time_ms INTEGER,
    checksum VARCHAR(64)
);
```

#### Comandos Disponibles

| Comando | Descripción |
|---|---|
| `npm run db:status` o `./deploy-schema.sh --status` | Muestra el estado de cada migración (aplicada o pendiente), fecha, duración y checksum. |
| `npm run db:migrate` o `./deploy-schema.sh` | Aplica todas las migraciones pendientes en una transacción atómica por archivo. |
| `npm run db:baseline` o `./deploy-schema.sh --baseline` | Registra las migraciones existentes sin ejecutarlas (para sincronizar bases de datos ya existentes). |

También es posible ejecutar directamente el runner con una URL personalizada:
```bash
./infra/database/scripts/migrate.sh status "postgresql://..."
./infra/database/scripts/migrate.sh up "postgresql://..."
./infra/database/scripts/migrate.sh baseline "postgresql://..."
```

### Plan de Migración de Esquemas
Para realizar cambios en la estructura de la base de datos de manera segura:

1. **Crear Migración:** Generar un nuevo archivo `.sql` en `infra/database/migrations/` con un prefijo numérico secuencial (ej. `0006_add_new_table.sql`).
2. **Ambiente de Pruebas:** Aplicar la migración localmente con `npm run db:migrate` y verificar con `npm run db:status`.
3. **Validación de Atomicidad:** El runner ejecuta cada script dentro de una transacción (`BEGIN ... COMMIT`). Si una migración falla, se aplica `ROLLBACK` automático y no se registra en `schema_migrations`.
4. **Despliegue:** Al correr el flujo de despliegue (`deploy-schema.sh`), las migraciones previas se omiten automáticamente (`[OMITIDA]`) y solo se aplican las nuevas pendientes.
5. **Auditoría:** Es posible auditar el historial de migraciones en cualquier momento mediante SQL:
   ```sql
   SELECT * FROM public.schema_migrations ORDER BY applied_at;
   ```

## Docs relacionados

- [Arquitectura](./architecture.md)
- [Decisiones](./adrs/)
- [Desarrollo Frontend](./frontend/DEVELOPMENT.md) — Configuración de entorno y Vite.
- [Performance Frontend](./frontend/PERFORMANCE.md) — Optimizaciones y builds.
