#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
if [[ $EUID -eq 0 ]]; then echo "Run as your normal Kali user, not with sudo." >&2; exit 1; fi
for f in dvwb/app.py dvwb/trainer.py dvwb/requirements.txt; do [[ -f "$f" ]] || { echo "Missing $f; run this from the extracted repository root." >&2; exit 1; }; done
command -v python3 >/dev/null || { echo "python3 is required." >&2; exit 1; }
if ! python3 -m venv .venv 2>/dev/null; then
  rm -rf .venv
  if ! command -v sudo >/dev/null || ! command -v apt-get >/dev/null; then
    echo "Python venv support is missing. Install python3-venv (or python3.X-venv) and rerun." >&2
    exit 1
  fi
  PY_MINOR="$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
  sudo apt-get update
  if apt-cache show "python${PY_MINOR}-venv" >/dev/null 2>&1; then VENV_PACKAGE="python${PY_MINOR}-venv"; else VENV_PACKAGE=python3-venv; fi
  sudo apt-get install -y "$VENV_PACKAGE"
  python3 -m venv .venv
fi
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r dvwb/requirements.txt
.venv/bin/python -m pip install -r requirements-dev.txt
mkdir -p instance/backups "$HOME/.config/systemd/user"
chmod 700 instance instance/backups
if [[ ! -f .env ]]; then
  cp .env.example .env
  python3 - "$ROOT/.env" "$ROOT/instance/dvwb.sqlite3" <<'PY'
import sys
from pathlib import Path
p, db = Path(sys.argv[1]), Path(sys.argv[2])
s = p.read_text()
s = s.replace("DVWB_DATABASE_URL=sqlite:///instance/dvwb.sqlite3", f"DVWB_DATABASE_URL=sqlite:////{db.as_posix().lstrip('/')}")
p.write_text(s)
p.chmod(0o600)
PY
  echo "Created .env. Edit DVWB_PUBLIC_URL to the Kali VM's participant-reachable IP before opening the trainer."
else
  chmod 600 .env
  # Migrate only the previous stock defaults; preserve custom port choices.
  python3 - "$ROOT/.env" <<'PYENV'
import re, sys
from pathlib import Path
p = Path(sys.argv[1])
s = p.read_text()
s = re.sub(r'(?m)^TRAINER_PORT=8001\s*$', 'TRAINER_PORT=9000', s)
s = re.sub(r'(?m)^DVWB_PORT=8002\s*$', 'DVWB_PORT=9001', s)
s = re.sub(r'(?m)^(DVWB_PUBLIC_URL=.*):8002(/?)\s*$', r'\g<1>:9001\2', s)
p.write_text(s)
PYENV
  chmod 600 .env
  echo "Preserved existing .env; migrated old default ports 8001/8002 to 9000/9001 where they were unchanged defaults."
fi
# Load the exact values systemd will receive so readiness checks and printed URLs agree.
set -a
. "$ROOT/.env"
set +a
if [[ "${DVWB_PUBLIC_URL:-}" == "http://192.168.10.10:9001/" ]]; then
  echo "WARNING: .env still has the example DVWB_PUBLIC_URL. Set it to this VM's participant-reachable IP before using the trainer link."
fi
# Keep systemd unit copies local to this checkout so service paths remain deterministic.
sed "s|%h/forge-fracture-training-site|$ROOT|g" deploy/kali/forge-fracture-training-dvwb.service > "$HOME/.config/systemd/user/forge-fracture-training-dvwb.service"
sed "s|%h/forge-fracture-training-site|$ROOT|g" deploy/kali/forge-fracture-training-trainer.service > "$HOME/.config/systemd/user/forge-fracture-training-trainer.service"
systemctl --user daemon-reload
systemctl --user enable forge-fracture-training-dvwb.service forge-fracture-training-trainer.service
# Clear recorded failures from earlier attempts (including StartLimitHit) before restarting.
systemctl --user reset-failed forge-fracture-training-dvwb.service forge-fracture-training-trainer.service
# Explicit restart is required for already-running units to adopt changed EnvironmentFile values and ExecStart wrappers.
if ! systemctl --user restart forge-fracture-training-dvwb.service forge-fracture-training-trainer.service; then
  echo "ERROR: one or both services failed to start. Recent service logs follow:" >&2
  systemctl --user --no-pager --full status forge-fracture-training-dvwb.service forge-fracture-training-trainer.service || true
  journalctl --user -u forge-fracture-training-dvwb.service -u forge-fracture-training-trainer.service -n 60 --no-pager || true
  exit 1
fi
for port in "${TRAINER_PORT:-9000}" "${DVWB_PORT:-9001}"; do
  if ! .venv/bin/python - "$port" <<'PY'
import sys, time, urllib.request
port=int(sys.argv[1]); url=f'http://127.0.0.1:{port}/'
for _ in range(30):
 try:
  with urllib.request.urlopen(url, timeout=2) as r:
   if r.status < 500: raise SystemExit(0)
 except Exception: pass
 time.sleep(1)
raise SystemExit(1)
PY
  then echo "Warning: port $port did not become ready; inspect journalctl --user -u forge-fracture-training-dvwb -n 80 (or trainer service)." >&2; fi
done
printf '\nTrainer: http://<KALI-VM-IP>:%s/\nDVWB:    http://<KALI-VM-IP>:%s/\nServices enabled. Closing the terminal will not stop them; with lingering disabled, keep your Kali user session logged in.\n' "${TRAINER_PORT:-9000}" "${DVWB_PORT:-9001}"
printf 'Reset altered DVWB state: scripts/reset-training-state.sh\n'
printf 'Use: systemctl --user status forge-fracture-training-trainer forge-fracture-training-dvwb\n'
