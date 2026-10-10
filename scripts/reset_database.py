#!/usr/bin/env python3
"""Back up and reset the local DVWB database. Dry-run unless --confirm is passed."""
from __future__ import annotations

import argparse
import os
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read_env(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    if path.is_file():
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                result[key.strip()] = value.strip().strip("\"'")
    return result

def db_path_from_url(url: str) -> Path:
    prefix = "sqlite:///"
    if not url.startswith(prefix):
        raise ValueError("Only SQLite databases are supported by this reset utility.")
    raw = url[len(prefix):]
    path = Path("/" + raw.lstrip("/")) if url.startswith("sqlite:////") else Path(raw)
    return (path if path.is_absolute() else ROOT / path).resolve()

def backup_database(db_path: Path, backup_dir: Path) -> Path:
    backup_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(backup_dir, 0o700)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    target = backup_dir / f"dvwb-pre-reset-{stamp}.sqlite3"
    with sqlite3.connect(str(db_path), timeout=30) as source, sqlite3.connect(str(target), timeout=30) as destination:
        source.backup(destination)
        check = destination.execute("PRAGMA integrity_check").fetchone()[0]
        fk = destination.execute("PRAGMA foreign_key_check").fetchall()
        if check != "ok" or fk:
            target.unlink(missing_ok=True)
            raise RuntimeError(f"Backup verification failed: integrity={check}; foreign-key violations={len(fk)}")
    os.chmod(target, 0o600)
    return target


def reset_database(db_path: Path, backup_dir: Path) -> tuple[Path, dict[str, int]]:
    """Create a verified backup and remove all rows while retaining schema."""
    backup = backup_database(db_path, backup_dir)
    with sqlite3.connect(str(db_path), timeout=30) as conn:
        conn.execute("PRAGMA foreign_keys=ON")
        tables = [row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
        deleted: dict[str, int] = {}
        delete_order = ["portal_sessions", "portal_records", "participants", "portal_products", "portal_dashboard_views", "portal_settings"]
        conn.execute("BEGIN IMMEDIATE")
        for table in delete_order:
            if table in tables:
                deleted[table] = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
                conn.execute(f'DELETE FROM "{table}"')
        for table in tables:
            if table not in deleted:
                deleted[table] = conn.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
                conn.execute(f'DELETE FROM "{table}"')
        violations = conn.execute("PRAGMA foreign_key_check").fetchall()
        if violations:
            raise RuntimeError(f"Foreign-key check failed after reset ({len(violations)} violation(s))")
        conn.commit()
    return backup, deleted

def service_active() -> bool:
    units = ("forge-fracture-training-dvwb.service", "forge-fracture-training-trainer.service",
             "forge-fracture-dvwb.service", "forge-fracture-trainer.service")
    commands = [["systemctl", "--user", "is-active", "--quiet", unit] for unit in units]
    commands += [["systemctl", "is-active", "--quiet", unit] for unit in units]
    for command in commands:
        try:
            if subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=3).returncode == 0:
                return True
        except (OSError, subprocess.TimeoutExpired):
            pass
    return False

def main() -> int:
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--confirm", action="store_true", help="Back up and delete all current database rows")
    args = parser.parse_args()
    env = read_env(ROOT / ".env")
    url = env.get("DVWB_DATABASE_URL", f"sqlite:///{ROOT / 'instance/dvwb.sqlite3'}")
    try:
        db_path = db_path_from_url(url)
    except ValueError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 2
    if not db_path.is_file():
        print(f"[ERROR] Database does not exist: {db_path}", file=sys.stderr)
        return 2
    with sqlite3.connect(f"file:{db_path}?mode=ro", uri=True) as conn:
        tables = [row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
        counts = {table: conn.execute(f' SELECT COUNT(*) FROM "{table}"').fetchone()[0] for table in tables}
    print(f"Database: {db_path}")
    print("Rows to clear:")
    for table, count in counts.items():
        print(f"  {table}: {count}")
    if not args.confirm:
        print("Dry run only; nothing changed. Stop both services and rerun with --confirm to reset.")
        return 0
    if service_active():
        print("[ERROR] Stop both training services first (user services: systemctl --user stop forge-fracture-training-dvwb forge-fracture-training-trainer; system services: sudo systemctl stop forge-fracture-dvwb forge-fracture-trainer)", file=sys.stderr)
        return 3
    try:
        backup, deleted = reset_database(db_path, ROOT / "instance/backups")
        print(f"[OK] Verified pre-reset backup: {backup}")
        print("[OK] Cleared rows: " + ", ".join(f"{name}={count}" for name, count in deleted.items()))
        print("[OK] All database rows cleared. Restarting the DVWB will recreate its built-in fictional training fixtures.")
        return 0
    except Exception as exc:
        print(f"[ERROR] Reset failed: {exc}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
