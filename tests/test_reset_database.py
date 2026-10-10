import sqlite3
from pathlib import Path

from scripts.reset_database import reset_database


def test_reset_creates_verified_backup_then_clears_rows(tmp_path: Path):
    db_path = tmp_path / "training.sqlite3"
    backup_dir = tmp_path / "backups"
    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("CREATE TABLE participants (id INTEGER PRIMARY KEY, username TEXT UNIQUE)")
        conn.execute("CREATE TABLE portal_sessions (token TEXT PRIMARY KEY, participant_id INTEGER REFERENCES participants(id))")
        conn.execute("CREATE TABLE portal_settings (id INTEGER PRIMARY KEY, key TEXT, value TEXT)")
        conn.execute("INSERT INTO participants VALUES (1, 'participant.test')")
        conn.execute("INSERT INTO portal_sessions VALUES ('token-test', 1)")
        conn.execute("INSERT INTO portal_settings VALUES (1, 'notice', 'baseline')")
    backup, deleted = reset_database(db_path, backup_dir)
    assert backup.is_file()
    assert backup.stat().st_mode & 0o777 == 0o600
    assert deleted["portal_sessions"] == 1
    assert deleted["participants"] == 1
    with sqlite3.connect(backup) as conn:
        assert conn.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert conn.execute("SELECT COUNT(*) FROM participants").fetchone()[0] == 1
        assert conn.execute("SELECT COUNT(*) FROM portal_sessions").fetchone()[0] == 1
    with sqlite3.connect(db_path) as conn:
        assert conn.execute("SELECT COUNT(*) FROM participants").fetchone()[0] == 0
        assert conn.execute("SELECT COUNT(*) FROM portal_sessions").fetchone()[0] == 0
        assert conn.execute("SELECT COUNT(*) FROM portal_settings").fetchone()[0] == 0
