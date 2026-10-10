from __future__ import annotations

import os
from pathlib import Path
import tempfile

import pytest
from fastapi.testclient import TestClient

_TEST_ROOT = Path(tempfile.mkdtemp(prefix="forge-fracture-dvwb-tests-"))
os.environ["DVWB_DATABASE_URL"] = f"sqlite:////{(_TEST_ROOT / 'test.sqlite3').as_posix().lstrip('/')}"

from dvwb import app as dvwb_module  # noqa: E402

@pytest.fixture(autouse=True)
def clean_database():
    dvwb_module.Base.metadata.drop_all(dvwb_module.engine)
    dvwb_module.initialize_db()
    yield
    dvwb_module.Base.metadata.drop_all(dvwb_module.engine)

@pytest.fixture
def client():
    with TestClient(dvwb_module.app) as test_client:
        yield test_client

@pytest.fixture
def participant_client(client):
    response = client.post("/login", data={"username": "participant.asha", "password": "utsav-learn"}, follow_redirects=False)
    assert response.status_code == 303
    assert "utsav_session" in client.cookies
    return client
