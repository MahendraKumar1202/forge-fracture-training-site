#!/usr/bin/env bash
# Interactive reset of the DVWB database to its built-in training baseline.
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PYTHON="$ROOT/.venv/bin/python"
[[ -x "$PYTHON" ]] || { echo "Missing .venv. Run bash setup.sh first." >&2; exit 1; }
USER_DVWB=forge-fracture-training-dvwb.service
USER_TRAINER=forge-fracture-training-trainer.service
SYSTEM_DVWB=forge-fracture-dvwb.service
SYSTEM_TRAINER=forge-fracture-trainer.service
was_user_dvwb=0; was_user_trainer=0; was_system_dvwb=0; was_system_trainer=0
systemctl --user is-active --quiet "$USER_DVWB" 2>/dev/null && was_user_dvwb=1 || true
systemctl --user is-active --quiet "$USER_TRAINER" 2>/dev/null && was_user_trainer=1 || true
sudo -n systemctl is-active --quiet "$SYSTEM_DVWB" 2>/dev/null && was_system_dvwb=1 || true
sudo -n systemctl is-active --quiet "$SYSTEM_TRAINER" 2>/dev/null && was_system_trainer=1 || true
restart_services() {
  if (( was_user_dvwb )); then systemctl --user start "$USER_DVWB" || true; fi
  if (( was_user_trainer )); then systemctl --user start "$USER_TRAINER" || true; fi
  if (( was_system_dvwb )); then sudo systemctl start "$SYSTEM_DVWB" || true; fi
  if (( was_system_trainer )); then sudo systemctl start "$SYSTEM_TRAINER" || true; fi
}
trap restart_services EXIT
if (( was_user_dvwb )); then systemctl --user stop "$USER_DVWB"; fi
if (( was_user_trainer )); then systemctl --user stop "$USER_TRAINER"; fi
if (( was_system_dvwb )); then sudo systemctl stop "$SYSTEM_DVWB"; fi
if (( was_system_trainer )); then sudo systemctl stop "$SYSTEM_TRAINER"; fi
printf '\nCurrent database and row counts (dry run):\n'
"$PYTHON" "$ROOT/scripts/reset_database.py"
printf '\nThis resets the DVWB database to its seeded training baseline. A verified pre-reset backup is retained in instance/backups/.\n'
read -r -p 'Type RESET to clear all database state and restore the baseline: ' answer
if [[ "$answer" != RESET ]]; then echo 'Cancelled; database unchanged.'; exit 0; fi
"$PYTHON" "$ROOT/scripts/reset_database.py" --confirm
printf '\nDatabase reset completed. Restarting any training services that were running...\n'
