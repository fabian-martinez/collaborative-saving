#!/usr/bin/env bash
# ==============================================================================
# migrate.sh
# Runner de migraciones para PostgreSQL con versionamiento y trazabilidad.
# Gestiona la tabla public.schema_migrations, asegurando atomicidad (transacciones)
# e idempotencia en la ejecución de scripts SQL.
# ==============================================================================

set -euo pipefail

# Colores para salida de terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # Sin color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/infra/database/migrations"

show_help() {
  cat << EOF
Uso: $0 [COMANDO] [OPCIONES] [DATABASE_URL]

Comandos disponibles:
  up                (Por defecto) Aplica todas las migraciones pendientes en orden numérico.
  status            Muestra el estado de cada migración (aplicada o pendiente), fecha y checksum.
  baseline          Registra las migraciones existentes en schema_migrations sin ejecutarlas.
  --help, -h        Muestra esta ayuda.

Argumentos:
  DATABASE_URL      URL de conexión PostgreSQL. Si se omite, se buscará en DATABASE_URL,
                    .env.local, .env, backend/.env o la base local estándar de desarrollo.

Ejemplos:
  $0 status
  $0 up "postgresql://postgres:postgres@localhost:5432/restored_db_feb21"
  $0 baseline
EOF
}

# Parseo de argumentos
ACTION="up"
TARGET_DB_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    up|migrate)
      ACTION="up"
      shift
      ;;
    status|--status|-s)
      ACTION="status"
      shift
      ;;
    baseline|--baseline|-b)
      ACTION="baseline"
      shift
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    postgresql://*|postgres://*)
      TARGET_DB_URL="$1"
      shift
      ;;
    *)
      if [ -z "$TARGET_DB_URL" ]; then
        TARGET_DB_URL="$1"
      fi
      shift
      ;;
  esac
done

# Resolver DATABASE_URL
resolve_db_url() {
  local url="${TARGET_DB_URL:-${DATABASE_URL:-}}"
  
  if [ -z "$url" ] && [ -f "${REPO_ROOT}/.env.local" ]; then
    url=$(grep '^DATABASE_URL=' "${REPO_ROOT}/.env.local" | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  fi
  if [ -z "$url" ] && [ -f "${REPO_ROOT}/.env" ]; then
    url=$(grep '^DATABASE_URL=' "${REPO_ROOT}/.env" | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  fi
  if [ -z "$url" ] && [ -f "${REPO_ROOT}/backend/.env" ]; then
    url=$(grep '^DATABASE_URL=' "${REPO_ROOT}/backend/.env" | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  fi
  
  if [ -z "$url" ]; then
    local default_local="postgresql://postgres:postgres@localhost:5432/restored_db_feb21"
    if command -v psql &>/dev/null && psql "$default_local" -c "SELECT 1;" >/dev/null 2>&1; then
      echo -e "${BLUE}ℹ️ Conectando a base de datos local por defecto (${default_local})${NC}" >&2
      url="$default_local"
    fi
  fi

  if [ -z "$url" ]; then
    echo -e "${RED}❌ Error: No se especificó DATABASE_URL.${NC}" >&2
    echo -e "Uso: $0 [up|status|baseline] [\"<postgresql://user:pass@host/db>\"]" >&2
    echo -e "O exporta la variable: export DATABASE_URL=\"...\" y ejecuta $0" >&2
    exit 1
  fi

  echo "$url"
}

# Validar que psql esté instalado
if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ Error: 'psql' no está instalado en el sistema.${NC}" >&2
  exit 1
fi

DB_URL=$(resolve_db_url)

# Función para calcular checksum SHA-256 de un archivo
compute_checksum() {
  local file="$1"
  if command -v sha256sum &>/dev/null; then
    sha256sum "$file" | awk '{print $1}'
  elif command -v shasum &>/dev/null; then
    shasum -a 256 "$file" | awk '{print $1}'
  elif command -v openssl &>/dev/null; then
    openssl dgst -sha256 "$file" | awk '{print $NF}'
  else
    python3 -c "import hashlib, sys; print(hashlib.sha256(open(sys.argv[1], 'rb').read()).hexdigest())" "$file"
  fi
}

# Crear la tabla schema_migrations si no existe
ensure_migrations_table() {
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -c "
    SET client_min_messages TO WARNING;
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        execution_time_ms INTEGER,
        checksum VARCHAR(64)
    );
  "
}

# Obtener lista ordenada de archivos de migración
get_migration_files() {
  shopt -s nullglob
  local files=("${MIGRATIONS_DIR}"/[0-9]*.sql)
  shopt -u nullglob
  printf '%s\n' "${files[@]}" | sort
}

# Comando: STATUS
run_status() {
  ensure_migrations_table

  echo -e "\n${BOLD}${BLUE}========================================================================${NC}"
  echo -e "${BOLD}${BLUE}📊 Estado de Migraciones de Base de Datos (public.schema_migrations)      ${NC}"
  echo -e "${BOLD}${BLUE}========================================================================${NC}"

  local applied_raw
  applied_raw=$(psql "$DB_URL" -t -A -F '|' -c "
    SELECT version, to_char(applied_at, 'YYYY-MM-DD HH24:MI:SS OF'), COALESCE(execution_time_ms, 0), COALESCE(checksum, '')
    FROM public.schema_migrations
    ORDER BY version;
  " 2>/dev/null || true)

  local total_files=0
  local applied_count=0
  local pending_count=0

  while IFS= read -r migration_file; do
    [ -z "$migration_file" ] && continue
    total_files=$((total_files + 1))
    local mig_name
    mig_name=$(basename "$migration_file")

    local match
    match=$(echo "$applied_raw" | grep "^${mig_name}|" || true)

    if [ -n "$match" ]; then
      applied_count=$((applied_count + 1))
      local applied_at
      applied_at=$(echo "$match" | cut -d '|' -f 2)
      local exec_ms
      exec_ms=$(echo "$match" | cut -d '|' -f 3)
      local checksum
      checksum=$(echo "$match" | cut -d '|' -f 4)
      local chk_display=""
      if [ -n "$checksum" ]; then
        chk_display=" | sha256:${checksum:0:8}..."
      fi
      printf "  ${GREEN}✓ [APLICADA]${NC}  %-45s ${CYAN}(%s | %sms%s)${NC}\n" "$mig_name" "$applied_at" "$exec_ms" "$chk_display"
    else
      pending_count=$((pending_count + 1))
      printf "  ${YELLOW}○ [PENDIENTE]${NC} %-45s\n" "$mig_name"
    fi
  done < <(get_migration_files)

  echo -e "${BLUE}------------------------------------------------------------------------${NC}"
  echo -e "Total: ${BOLD}${total_files}${NC} | Aplicadas: ${GREEN}${applied_count}${NC} | Pendientes: ${YELLOW}${pending_count}${NC}"
  echo -e "${BOLD}${BLUE}========================================================================${NC}\n"
}

# Comando: BASELINE
run_baseline() {
  ensure_migrations_table

  echo -e "\n${BOLD}${BLUE}========================================================================${NC}"
  echo -e "${BOLD}${BLUE}🏷️  Estableciendo Línea Base de Migraciones (Baseline)                   ${NC}"
  echo -e "${BOLD}${BLUE}========================================================================${NC}"

  local applied_raw
  applied_raw=$(psql "$DB_URL" -t -A -F '|' -c "SELECT version FROM public.schema_migrations;" 2>/dev/null || true)

  local count_marked=0

  while IFS= read -r migration_file; do
    [ -z "$migration_file" ] && continue
    local mig_name
    mig_name=$(basename "$migration_file")

    if echo "$applied_raw" | grep -qx "${mig_name}"; then
      echo -e "  ${BLUE}ℹ️  [OMITIDA]${NC} ${mig_name} ya registrada en schema_migrations."
    else
      local checksum
      checksum=$(compute_checksum "$migration_file")
      psql "$DB_URL" -v ON_ERROR_STOP=1 -q -c "
        INSERT INTO public.schema_migrations (version, applied_at, execution_time_ms, checksum)
        VALUES ('${mig_name}', NOW(), 0, '${checksum}')
        ON CONFLICT (version) DO NOTHING;
      "
      echo -e "  ${GREEN}✅ [BASELINE]${NC} ${mig_name} marcada como aplicada (checksum: ${checksum:0:8}...).${NC}"
      count_marked=$((count_marked + 1))
    fi
  done < <(get_migration_files)

  echo -e "\n${GREEN}🎉 Línea base completada. ${count_marked} migraciones nuevas registradas como aplicadas.${NC}\n"
}

# Comando: UP (Ejecutar migraciones pendientes)
run_up() {
  ensure_migrations_table

  echo -e "\n${BOLD}${BLUE}========================================================================${NC}"
  echo -e "${BOLD}${BLUE}🚀 Ejecutando Migraciones de Base de Datos                              ${NC}"
  echo -e "${BOLD}${BLUE}========================================================================${NC}"

  local applied_raw
  applied_raw=$(psql "$DB_URL" -t -A -F '|' -c "
    SELECT version, to_char(applied_at, 'YYYY-MM-DD HH24:MI:SS')
    FROM public.schema_migrations;
  " 2>/dev/null || true)

  local applied_now=0
  local skipped_count=0

  while IFS= read -r migration_file; do
    [ -z "$migration_file" ] && continue
    local mig_name
    mig_name=$(basename "$migration_file")

    local match
    match=$(echo "$applied_raw" | grep "^${mig_name}|" || true)

    if [ -n "$match" ]; then
      local applied_at
      applied_at=$(echo "$match" | cut -d '|' -f 2)
      echo -e "  ${BLUE}ℹ️  [OMITIDA]${NC}  ${mig_name} (Ya aplicada el ${applied_at})"
      skipped_count=$((skipped_count + 1))
      continue
    fi

    echo -e "  ${YELLOW}⚡ [APLICANDO]${NC} ${mig_name}..."
    local checksum
    checksum=$(compute_checksum "$migration_file")

    local tmp_exec_sql
    tmp_exec_sql=$(mktemp)

    cat <<EOF > "$tmp_exec_sql"
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE IF NOT EXISTS _migration_timer (start_time timestamptz);
TRUNCATE _migration_timer;
INSERT INTO _migration_timer VALUES (clock_timestamp());
\i '${migration_file}'
INSERT INTO public.schema_migrations (version, execution_time_ms, checksum)
SELECT
    '${mig_name}',
    ROUND(EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000)::INTEGER,
    '${checksum}'
FROM _migration_timer;
DROP TABLE IF EXISTS _migration_timer;
COMMIT;
EOF

    local exec_output
    set +e
    exec_output=$(psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$tmp_exec_sql" 2>&1)
    local exit_code=$?
    set -e
    rm -f "$tmp_exec_sql"

    if [ "$exit_code" -eq 0 ]; then
      local exec_ms
      exec_ms=$(psql "$DB_URL" -t -A -c "SELECT execution_time_ms FROM public.schema_migrations WHERE version = '${mig_name}';" 2>/dev/null || echo "0")
      echo -e "  ${GREEN}✅ [APLICADA]${NC} ${mig_name} completada en ${exec_ms}ms (checksum: ${checksum:0:8}...).${NC}"
      applied_now=$((applied_now + 1))
    else
      echo -e "\n${RED}❌ [ERROR] Falló la ejecución de la migración: ${mig_name}${NC}" >&2
      echo -e "${RED}🛑 [ROLLBACK] La transacción fue revertida en la base de datos.${NC}" >&2
      echo -e "${RED}Detalles del error:${NC}" >&2
      echo "$exec_output" | sed 's/^/    /' >&2
      exit "$exit_code"
    fi

  done < <(get_migration_files)

  echo -e "${BLUE}------------------------------------------------------------------------${NC}"
  if [ "$applied_now" -eq 0 ]; then
    echo -e "${GREEN}✨ Base de datos al día. No hay migraciones pendientes.${NC}"
  else
    echo -e "${GREEN}🎉 ${applied_now} migración(es) aplicada(s) exitosamente.${NC}"
  fi
  echo -e "${BOLD}${BLUE}========================================================================${NC}\n"
}

# Ejecución de la acción seleccionada
case "$ACTION" in
  status)
    run_status
    ;;
  baseline)
    run_baseline
    ;;
  up)
    run_up
    ;;
  *)
    echo -e "${RED}Acción desconocida: ${ACTION}${NC}"
    show_help
    exit 1
    ;;
esac
