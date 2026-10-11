#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${FORGE_TRAINING_VENV:-$HOME/.venvs/forge-fracture-training-site}"
if [[ ! -x "$VENV_DIR/bin/uvicorn" && -x "$ROOT/.venv/bin/uvicorn" ]]; then VENV_DIR="$ROOT/.venv"; fi
: "${DVWB_HOST:=0.0.0.0}"
: "${DVWB_PORT:=9001}"
exec "$VENV_DIR/bin/uvicorn" dvwb.app:app --host "$DVWB_HOST" --port "$DVWB_PORT"
