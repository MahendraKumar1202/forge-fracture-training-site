#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
: "${TRAINER_HOST:=0.0.0.0}"
: "${TRAINER_PORT:=9000}"
exec "$ROOT/.venv/bin/uvicorn" dvwb.trainer:app --host "$TRAINER_HOST" --port "$TRAINER_PORT"
