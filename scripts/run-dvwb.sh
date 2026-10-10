#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
: "${DVWB_HOST:=0.0.0.0}"
: "${DVWB_PORT:=9001}"
exec "$ROOT/.venv/bin/uvicorn" dvwb.app:app --host "$DVWB_HOST" --port "$DVWB_PORT"
