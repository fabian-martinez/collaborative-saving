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
MIGRATE_BIN="${SCRIPT_DIR}/migrate.sh"

# Parseo de opciones
MODE="deploy"
TARGET_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --status|-s|status)
      MODE="status"
      shift
      ;;
    --baseline|-b|baseline)
      MODE="baseline"
      shift
      ;;
    --help|-h)
      echo -e "Uso: $0 [--status | --baseline] [DATABASE_URL]"
      exit 0
      ;;
    postgresql://*|postgres://*)
      TARGET_URL="$1"
      shift
      ;;
    *)
      if [ -z "$TARGET_URL" ]; then
        TARGET_URL="$1"
      fi
      shift
      ;;
  esac
done

# Obtener DATABASE_URL (parámetro, entorno o archivos .env)
DB_URL="${TARGET_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ] && [ -f "${REPO_ROOT}/.env.local" ]; then
  echo -e "${BLUE}ℹ️ Cargando DATABASE_URL desde .env.local...${NC}"
  DB_URL=$(grep '^DATABASE_URL=' "${REPO_ROOT}/.env.local" | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi
if [ -z "$DB_URL" ] && [ -f "${REPO_ROOT}/.env" ]; then
  DB_URL=$(grep '^DATABASE_URL=' "${REPO_ROOT}/.env" | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi
if [ -z "$DB_URL" ] && [ -f "${REPO_ROOT}/backend/.env" ]; then
  DB_URL=$(grep '^DATABASE_URL=' "${REPO_ROOT}/backend/.env" | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi
if [ -z "$DB_URL" ]; then
  default_local="postgresql://postgres:postgres@localhost:5432/restored_db_feb21"
  if command -v psql &>/dev/null && psql "$default_local" -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${BLUE}ℹ️ Conectando a base de datos local por defecto (${default_local})${NC}"
    DB_URL="$default_local"
  fi
fi

if [ -z "$DB_URL" ]; then
  echo -e "${RED}❌ Error: No se especificó DATABASE_URL.${NC}"
  echo -e "Uso: $0 [--status | --baseline] \"<postgresql://user:password@host/dbname?sslmode=require>\""
  echo -e "O exporta la variable: export DATABASE_URL=\"...\" y ejecuta $0"
  exit 1
fi

# Validar que psql esté disponible
if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ Error: 'psql' no está instalado en el sistema.${NC}"
  echo -e "Por favor instala las utilidades de postgresql-client (ej. brew install postgresql)."
  exit 1
fi

# Si se solicitó --status o --baseline, delegar a migrate.sh y terminar
if [ "$MODE" = "status" ]; then
  exec bash "$MIGRATE_BIN" status "$DB_URL"
elif [ "$MODE" = "baseline" ]; then
  exec bash "$MIGRATE_BIN" baseline "$DB_URL"
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

# 2. Ejecutar todas las migraciones en orden numérico con runner atómico
echo -e "\n${YELLOW}📦 Paso 2: Aplicando migraciones de base de datos...${NC}"
bash "$MIGRATE_BIN" up "$DB_URL"

# 3. Insertar usuario administrador semilla si no existe
echo -e "\n${YELLOW}👤 Paso 3: Configurando usuario administrador semilla...${NC}"
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

# 4. Verificación de tablas creadas
echo -e "\n${YELLOW}🔍 Paso 4: Verificando tablas del esquema...${NC}"
psql "$DB_URL" -c "
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size('\"' || table_schema || '\".\"' || table_name || '\"')) as total_size
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
"

echo -e "\n${GREEN}🎉 ¡Esquema de base de datos aprovisionado y verificado exitosamente!${NC}"
