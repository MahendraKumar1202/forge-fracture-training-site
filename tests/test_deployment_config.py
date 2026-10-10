from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_default_training_ports_are_9000_and_9001():
    env = (ROOT / ".env.example").read_text()
    assert "TRAINER_PORT=9000" in env
    assert "DVWB_PORT=9001" in env
    assert "DVWB_PUBLIC_URL=http://192.168.10.10:9001/" in env


def test_systemd_services_use_env_aware_runner_scripts():
    trainer = (ROOT / "deploy/kali/forge-fracture-training-trainer.service").read_text()
    dvwb = (ROOT / "deploy/kali/forge-fracture-training-dvwb.service").read_text()
    assert "scripts/run-trainer.sh" in trainer
    assert "scripts/run-dvwb.sh" in dvwb
    assert "--port ${TRAINER_PORT}" not in trainer
    assert "--port ${DVWB_PORT}" not in dvwb


def test_runner_scripts_consume_configured_port_environment():
    trainer = (ROOT / "scripts/run-trainer.sh").read_text()
    dvwb = (ROOT / "scripts/run-dvwb.sh").read_text()
    assert '"$TRAINER_PORT"' in trainer and 'TRAINER_PORT:=9000' in trainer
    assert '"$DVWB_PORT"' in dvwb and 'DVWB_PORT:=9001' in dvwb


def test_interactive_state_reset_command_exists_and_requires_confirmation():
    reset = (ROOT / "scripts/reset-training-state.sh").read_text()
    assert "reset_database.py" in reset
    assert "Type RESET" in reset
    assert "restart_services" in reset
