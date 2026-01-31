import pytest
from fastapi.testclient import TestClient
from copy import deepcopy

from src.app import app, activities

client = TestClient(app)

# Capture the initial state of the activities mapping so tests can reset it
_initial_activities = deepcopy(activities)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities dict before each test."""
    activities.clear()
    activities.update(deepcopy(_initial_activities))
    yield


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Verify a known activity exists
    assert "Basketball" in data


def test_signup_success():
    email = "alex@mergington.edu"
    resp = client.post("/activities/Basketball/signup", params={"email": email})
    assert resp.status_code == 200
    assert resp.json() == {"message": f"Signed up {email} for Basketball"}

    # Verify the participant was added
    resp2 = client.get("/activities")
    assert email in resp2.json()["Basketball"]["participants"]


def test_signup_already_signed_up():
    email = "jamie@mergington.edu"
    # Sign up once
    resp1 = client.post("/activities/Basketball/signup", params={"email": email})
    assert resp1.status_code == 200
    # Try signing up again
    resp2 = client.post("/activities/Basketball/signup", params={"email": email})
    assert resp2.status_code == 400
    assert resp2.json()["detail"] == "Student already signed up for this activity"


def test_signup_activity_not_found():
    resp = client.post("/activities/NoSuchActivity/signup", params={"email": "x@x.com"})
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Activity not found"


def test_unregister_success():
    email = "sam@mergington.edu"
    # Sign up then remove
    client.post("/activities/Basketball/signup", params={"email": email})
    resp = client.delete("/activities/Basketball/participants", params={"email": email})
    assert resp.status_code == 200
    assert resp.json() == {"message": f"Removed {email} from Basketball"}

    # Ensure the participant is no longer present
    resp2 = client.get("/activities")
    assert email not in resp2.json()["Basketball"]["participants"]


def test_unregister_activity_not_found():
    resp = client.delete("/activities/Nope/participants", params={"email": "x@x.com"})
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Activity not found"


def test_unregister_participant_not_found():
    resp = client.delete("/activities/Basketball/participants", params={"email": "unknown@mergington.edu"})
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Participant not found in this activity"