#!/usr/bin/env bash
# ==============================================================================
# test-migrations.sh
# Suite automatizada de pruebas para el sistema de migraciones (schema_migrations).
# Valida creación, ejecución secuencial, idempotencia, detección de nuevas migraciones
# y rollback transaccional ante fallos en una base de datos aislada.
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/infra/database/migrations"
MIGRATE_BIN="${SCRIPT_DIR}/migrate.sh"

TEST_DB_NAME="test_migrations_$(date +%s)_$$"
BASE_URL="${1:-${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/postgres}}"

# Extraer URL base para crear la base de datos de prueba
DB_HOST_PORT=$(echo "$BASE_URL" | sed -E 's|^(postgresql://[^/]+)/.*$|\1|')
TEST_DB_URL="${DB_HOST_PORT}/${TEST_DB_NAME}"

cleanup() {
  echo -e "\n${BLUE}🧹 Limpiando recursos de prueba...${NC}"
  rm -f "${MIGRATIONS_DIR}/0998_test_success.sql"
  rm -f "${MIGRATIONS_DIR}/0999_test_failure.sql"
  psql "$BASE_URL" -c "DROP DATABASE IF EXISTS \"${TEST_DB_NAME}\";" >/dev/null 2>&1 || true
  echo -e "${GREEN}✅ Base de datos temporal eliminada.${NC}"
}
trap cleanup EXIT

echo -e "\n${BOLD}${BLUE}========================================================================${NC}"
echo -e "${BOLD}${BLUE}🧪 Iniciando Suite de Pruebas: Sistema de Versionamiento de Migraciones   ${NC}"
echo -e "${BOLD}${BLUE}========================================================================${NC}"

# 1. Crear base de datos de prueba
echo -e "\n${YELLOW}▶ Paso 1: Creando base de datos temporal: ${TEST_DB_NAME}...${NC}"
psql "$BASE_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${TEST_DB_NAME}\";" >/dev/null
echo -e "${GREEN}✅ Base de datos temporal creada exitosamente.${NC}"

# 2. Probar ejecución inicial (migrate up)
echo -e "\n${YELLOW}▶ Paso 2: Ejecutando migraciones iniciales (0001 a 0005)...${NC}"
bash "$MIGRATE_BIN" up "$TEST_DB_URL"

# Validar que schema_migrations tenga 5 registros
COUNT=$(psql "$TEST_DB_URL" -t -A -c "SELECT count(*) FROM public.schema_migrations;")
if [ "$COUNT" -ne 5 ]; then
  echo -e "${RED}❌ Error: Se esperaban 5 registros en schema_migrations, se encontraron: ${COUNT}${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Correcto: 5 migraciones registradas en schema_migrations.${NC}"

# Validar que las tablas de negocio existan
TABLES_COUNT=$(psql "$TEST_DB_URL" -t -A -c "
  SELECT count(*) FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name IN ('members', 'meetings', 'stocks', 'loans', 'loan_types', 'stock_types');
")
if [ "$TABLES_COUNT" -ne 6 ]; then
  echo -e "${RED}❌ Error: No se crearon todas las tablas esperadas.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Correcto: Tablas del esquema creadas correctamente.${NC}"

# 3. Probar Idempotencia (re-ejecución no debe aplicar nada)
echo -e "\n${YELLOW}▶ Paso 3: Probando idempotencia (re-ejecución inmediata)...${NC}"
OUTPUT=$(bash "$MIGRATE_BIN" up "$TEST_DB_URL")
if ! echo "$OUTPUT" | grep -q "Base de datos al día. No hay migraciones pendientes."; then
  echo -e "${RED}❌ Error en idempotencia: El runner intentó re-ejecutar migraciones aplicadas.${NC}"
  echo "$OUTPUT"
  exit 1
fi
echo -e "${GREEN}✅ Correcto: Todas las migraciones previas fueron omitidas ([OMITIDA]).${NC}"

# 4. Probar comando status
echo -e "\n${YELLOW}▶ Paso 4: Probando comando status...${NC}"
STATUS_OUTPUT=$(bash "$MIGRATE_BIN" status "$TEST_DB_URL")
if ! echo "$STATUS_OUTPUT" | grep -E -q "Total:.*5.*Aplicadas:.*5.*Pendientes:.*0"; then
  echo -e "${RED}❌ Error en salida de status: Se esperaba Total: 5 | Aplicadas: 5 | Pendientes: 0.${NC}"
  echo "$STATUS_OUTPUT"
  exit 1
fi
echo -e "${GREEN}✅ Correcto: Comando status reporta estado exacto.${NC}"

# 5. Probar detección y aplicación de una nueva migración
echo -e "\n${YELLOW}▶ Paso 5: Probando adición de nueva migración (0998_test_success.sql)...${NC}"
cat << 'EOF' > "${MIGRATIONS_DIR}/0998_test_success.sql"
CREATE TABLE public.test_new_feature_table (
    id serial PRIMARY KEY,
    name text NOT NULL
);
INSERT INTO public.test_new_feature_table (name) VALUES ('Test Ok');
EOF

bash "$MIGRATE_BIN" up "$TEST_DB_URL"

# Validar que ahora hay 6 registros en schema_migrations
NEW_COUNT=$(psql "$TEST_DB_URL" -t -A -c "SELECT count(*) FROM public.schema_migrations;")
if [ "$NEW_COUNT" -ne 6 ]; then
  echo -e "${RED}❌ Error: Se esperaban 6 registros tras aplicar nueva migración.${NC}"
  exit 1
fi

TEST_DATA=$(psql "$TEST_DB_URL" -t -A -c "SELECT name FROM public.test_new_feature_table;")
if [ "$TEST_DATA" != "Test Ok" ]; then
  echo -e "${RED}❌ Error: No se insertaron los datos de la nueva migración.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Correcto: Nueva migración detectada y aplicada exitosamente.${NC}"

# 6. Probar atomicidad y ROLLBACK ante error en migración
echo -e "\n${YELLOW}▶ Paso 6: Probando reversión atómica (ROLLBACK) ante migración con error...${NC}"
cat << 'EOF' > "${MIGRATIONS_DIR}/0999_test_failure.sql"
CREATE TABLE public.should_not_exist (id int);
-- Generar error forzado de división por cero
SELECT 1 / 0;
EOF

set +e
bash "$MIGRATE_BIN" up "$TEST_DB_URL" >/dev/null 2>&1
EXIT_CODE=$?
set -e

if [ "$EXIT_CODE" -eq 0 ]; then
  echo -e "${RED}❌ Error: La migración con error debió retornar código de salida no nulo.${NC}"
  exit 1
fi

# Validar que la tabla NO existe (se revirtió el DDL)
TABLE_EXISTS=$(psql "$TEST_DB_URL" -t -A -c "SELECT to_regclass('public.should_not_exist');")
if [ -n "$TABLE_EXISTS" ]; then
  echo -e "${RED}❌ Error de atomicidad: La tabla 'should_not_exist' no fue revertida por ROLLBACK.${NC}"
  exit 1
fi

# Validar que 0999 NO fue registrada en schema_migrations
FAILED_REG=$(psql "$TEST_DB_URL" -t -A -c "SELECT count(*) FROM public.schema_migrations WHERE version = '0999_test_failure.sql';")
if [ "$FAILED_REG" -ne 0 ]; then
  echo -e "${RED}❌ Error: La migración fallida fue erróneamente registrada en schema_migrations.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Correcto: Transacción revertida completamente. Base de datos íntegra.${NC}"

echo -e "\n${BOLD}${GREEN}========================================================================${NC}"
echo -e "${BOLD}${GREEN}🎉 ¡Todas las pruebas del sistema de migraciones pasaron exitosamente!   ${NC}"
echo -e "${BOLD}${GREEN}========================================================================${NC}\n"
