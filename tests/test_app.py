import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    # The root redirects to the static index page, so check for HTML content
    assert "<!DOCTYPE html>" in response.text


def test_static_files():
    response = client.get("/static/index.html")
    assert response.status_code == 200
    assert "<!DOCTYPE html>" in response.text  # Check for HTML content
