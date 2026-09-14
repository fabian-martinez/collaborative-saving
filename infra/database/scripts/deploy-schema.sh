#!/usr/bin/env bash
# ==============================================================================
# deploy-schema.sh
# Script para inicializar y verificar el esquema de base de datos en Neon Postgres
# (o cualquier base de datos PostgreSQL remota compatible).
# ==============================================================================

set -euo pipefail

# Colores para salida de terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}🚀 Inicializador de Esquema para Collaborative Saving ${NC}"
echo -e "${BLUE}======================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/infra/database/migrations"

# Obtener DATABASE_URL (parámetro, entorno o .env.local)
DB_URL="${1:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ] && [ -f "${REPO_ROOT}/.env.local" ]; then
  echo -e "${BLUE}ℹ️ Cargando DATABASE_URL desde .env.local...${NC}"
  DB_URL=$(grep '^DATABASE_URL=' "${REPO_ROOT}/.env.local" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$DB_URL" ]; then
  echo -e "${RED}❌ Error: No se especificó DATABASE_URL.${NC}"
  echo -e "Uso: $0 \"<postgresql://user:password@host/dbname?sslmode=require>\""
  echo -e "O exporta la variable: export DATABASE_URL=\"...\" y ejecuta $0"
  exit 1
fi

# Validar que psql esté disponible
if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ Error: 'psql' no está instalado en el sistema.${NC}"
  echo -e "Por favor instala las utilidades de postgresql-client (ej. brew install postgresql)."
  exit 1
fi


# 1. Probar conectividad
echo -e "\n${YELLOW}🔌 Paso 1: Verificando conectividad con la base de datos...${NC}"
if psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Conexión exitosa a PostgreSQL.${NC}"
else
  echo -e "${RED}❌ Error: No fue posible conectar a la base de datos con la URL suministrada.${NC}"
  echo -e "Verifica tus credenciales, conexión a internet y el parámetro sslmode=require."
  exit 1
fi

# 2. Ejecutar migración 0001
MIGRATION_1="${MIGRATIONS_DIR}/0001_initial_tables.sql"
echo -e "\n${YELLOW}📦 Paso 2: Aplicando 0001_initial_tables.sql...${NC}"
if [ -f "$MIGRATION_1" ]; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_1"
  echo -e "${GREEN}✅ Migración 0001 aplicada correctamente.${NC}"
else
  echo -e "${RED}❌ No se encontró el archivo $MIGRATION_1${NC}"
  exit 1
fi

# 3. Ejecutar migración 0002
MIGRATION_2="${MIGRATIONS_DIR}/0002_align_with_entities.sql"
echo -e "\n${YELLOW}📦 Paso 3: Aplicando 0002_align_with_entities.sql...${NC}"
if [ -f "$MIGRATION_2" ]; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_2"
  echo -e "${GREEN}✅ Migración 0002 aplicada correctamente.${NC}"
else
  echo -e "${RED}❌ No se encontró el archivo $MIGRATION_2${NC}"
  exit 1
fi

# 4. Insertar usuario administrador semilla si no existe
echo -e "\n${YELLOW}👤 Paso 4: Configurando usuario administrador semilla...${NC}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@collaborativesaving.com}"
ADMIN_NAME="${ADMIN_NAME:-Administrador Inicial}"
ADMIN_ID_NUM="${ADMIN_ID_NUM:-10000001}"

ADMIN_COUNT=$(psql "$DB_URL" -t -A -c "SELECT count(*) FROM public.members WHERE role = 'admin' AND status = 'active';")

if [ "$ADMIN_COUNT" -eq 0 ]; then
  echo -e "Insertando administrador inicial: ${ADMIN_NAME} (${ADMIN_EMAIL})..."
  psql "$DB_URL" -v ON_ERROR_STOP=1 -c "
    INSERT INTO public.members (name, email, identification_number, role, status)
    VALUES ('${ADMIN_NAME}', '${ADMIN_EMAIL}', '${ADMIN_ID_NUM}', 'admin', 'active');
  "
  echo -e "${GREEN}✅ Administrador inicial creado con éxito.${NC}"
else
  echo -e "${GREEN}ℹ️ Ya existe al menos un usuario administrador activo. Omitiendo inserción.${NC}"
fi

# 5. Verificación de tablas creadas
echo -e "\n${YELLOW}🔍 Paso 5: Verificando tablas del esquema...${NC}"
psql "$DB_URL" -c "
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size('\"' || table_schema || '\".\"' || table_name || '\"')) as total_size
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
"

echo -e "\n${GREEN}🎉 ¡Esquema de base de datos aprovisionado y verificado exitosamente!${NC}"
