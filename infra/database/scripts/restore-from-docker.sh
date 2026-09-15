#!/usr/bin/env bash
# ==============================================================================
# restore-from-docker.sh
# Vuelca la base de datos local en Docker (cs_postgres_db / restored_db_feb21)
# y la restaura completamente en la base de datos remota (Neon Postgres u otra).
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}📦 Sincronizador Docker -> Neon Postgres              ${NC}"
echo -e "${BLUE}======================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

DOCKER_CONTAINER="${DOCKER_CONTAINER:-cs_postgres_db}"
DOCKER_DB="${DOCKER_DB:-restored_db_feb21}"
DOCKER_USER="${DOCKER_USER:-postgres}"

# Obtener DATABASE_URL destino (argumento, variable o .env.local)
TARGET_URL="${1:-${DATABASE_URL:-}}"
if [ -z "$TARGET_URL" ] && [ -f "${REPO_ROOT}/.env.local" ]; then
  echo -e "${BLUE}ℹ️ Cargando DATABASE_URL desde .env.local...${NC}"
  TARGET_URL=$(grep '^DATABASE_URL=' "${REPO_ROOT}/.env.local" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$TARGET_URL" ]; then
  echo -e "${RED}❌ Error: No se especificó la DATABASE_URL de destino.${NC}"
  echo -e "Uso: $0 \"<postgresql://user:pass@host/db?sslmode=require>\""
  exit 1
fi

# 1. Verificar contenedor Docker
echo -e "\n${YELLOW}🐳 Paso 1: Verificando contenedor Docker '${DOCKER_CONTAINER}'...${NC}"
if ! docker ps --format '{{.Names}}' | grep -wq "$DOCKER_CONTAINER"; then
  echo -e "${RED}❌ Error: El contenedor Docker '${DOCKER_CONTAINER}' no está corriendo.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Contenedor activo.${NC}"

# 2. Verificar conectividad destino
echo -e "\n${YELLOW}🔌 Paso 2: Verificando conectividad con la base remota...${NC}"
psql "$TARGET_URL" -c "SELECT version();" > /dev/null
echo -e "${GREEN}✅ Conexión remota verificada.${NC}"

# 3. Limpiar esquema public en destino
echo -e "\n${YELLOW}🧹 Paso 3: Limpiando esquema public en destino...${NC}"
psql "$TARGET_URL" -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;'
echo -e "${GREEN}✅ Esquema public listo y limpio.${NC}"

# 4. Volcar y restaurar en streaming
echo -e "\n${YELLOW}🚀 Paso 4: Migrando datos desde Docker a la base remota...${NC}"
docker exec "$DOCKER_CONTAINER" pg_dump -U "$DOCKER_USER" -d "$DOCKER_DB" --no-owner --no-privileges | psql "$TARGET_URL" -v ON_ERROR_STOP=1 > /dev/null
echo -e "${GREEN}✅ Datos y esquema restaurados con éxito.${NC}"

# 5. Aplicar migraciones posteriores al volcado
echo -e "\n${YELLOW}🔧 Paso 5: Aplicando migraciones incrementales pendientes...${NC}"
for migration in "${REPO_ROOT}"/infra/database/migrations/0*.sql; do
  mig_name=$(basename "$migration")
  if [ "$mig_name" != "0001_initial_tables.sql" ]; then
    echo -e "  - Aplicando ${mig_name}..."
    psql "$TARGET_URL" -v ON_ERROR_STOP=1 -f "$migration" > /dev/null
  fi
done
echo -e "${GREEN}✅ Migraciones aplicadas con éxito.${NC}"

# 6. Resumen de filas en destino
echo -e "\n${YELLOW}📊 Paso 6: Verificando conteo de registros en la base remota...${NC}"
psql "$TARGET_URL" -c "
SELECT 
  'members' as tbl, count(*) as count FROM public.members
UNION ALL SELECT 'meetings', count(*) FROM public.meetings
UNION ALL SELECT 'operations', count(*) FROM public.operations
UNION ALL SELECT 'ledger_entries', count(*) FROM public.ledger_entries
UNION ALL SELECT 'stock_types', count(*) FROM public.stock_types
UNION ALL SELECT 'stocks', count(*) FROM public.stocks
UNION ALL SELECT 'loan_types', count(*) FROM public.loan_types
UNION ALL SELECT 'loans', count(*) FROM public.loans
UNION ALL SELECT 'loan_transaction_details', count(*) FROM public.loan_transaction_details
UNION ALL SELECT 'mandatory_contributions', count(*) FROM public.mandatory_contributions
UNION ALL SELECT 'stock_subscriptions', count(*) FROM public.stock_subscriptions
UNION ALL SELECT 'pending_member_payments', count(*) FROM public.pending_member_payments
UNION ALL SELECT 'stock_value_history', count(*) FROM public.stock_value_history
ORDER BY 1;
"

echo -e "\n${GREEN}🎉 ¡Base de datos de Docker sincronizada exitosamente con Neon Postgres!${NC}"
