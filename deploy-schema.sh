#!/usr/bin/env bash
# ==============================================================================
# deploy-schema.sh (Root Wrapper)
# Delega la ejecución a infra/database/scripts/deploy-schema.sh
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/infra/database/scripts/deploy-schema.sh" "$@"
