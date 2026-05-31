"""Tests for JWT configuration and token utilities."""

import importlib
from datetime import datetime, timezone

import pytest


def reload_jwt_module(monkeypatch: pytest.MonkeyPatch):
    """Reload jwt module with a clean lazy configuration cache."""
    import app.auth.jwt as jwt_module

    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    monkeypatch.delenv("JWT_ALGORITHM", raising=False)
    monkeypatch.delenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", raising=False)
    monkeypatch.delenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", raising=False)
    return importlib.reload(jwt_module)


def test_jwt_module_import_does_not_require_secret_key(monkeypatch: pytest.MonkeyPatch):
    jwt_module = reload_jwt_module(monkeypatch)

    assert jwt_module.get_algorithm() == "HS256"


def test_secret_key_is_required_only_when_used(monkeypatch: pytest.MonkeyPatch):
    jwt_module = reload_jwt_module(monkeypatch)

    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY environment variable is required"):
        jwt_module.create_access_token({"sub": "user-1"})


def test_secret_key_is_loaded_lazily_and_cached(monkeypatch: pytest.MonkeyPatch):
    jwt_module = reload_jwt_module(monkeypatch)
    monkeypatch.setenv("JWT_SECRET_KEY", "first-secret-key-for-testing-32chars")

    token = jwt_module.create_access_token({"sub": "user-1"})
    monkeypatch.setenv("JWT_SECRET_KEY", "second-secret-key-for-testing-32chars")

    payload = jwt_module.verify_token(token)

    assert payload is not None
    assert payload["sub"] == "user-1"


def test_expiration_settings_are_loaded_lazily(monkeypatch: pytest.MonkeyPatch):
    jwt_module = reload_jwt_module(monkeypatch)
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-testing-only-32chars")
    monkeypatch.setenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "5")
    monkeypatch.setenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "2")

    access_payload = jwt_module.verify_token(jwt_module.create_access_token({"sub": "user-1"}))
    refresh_payload = jwt_module.verify_token(
        jwt_module.create_refresh_token({"sub": "user-1"}),
        token_type="refresh",
    )

    assert access_payload is not None
    assert refresh_payload is not None

    access_exp = datetime.fromtimestamp(access_payload["exp"], tz=timezone.utc)
    refresh_exp = datetime.fromtimestamp(refresh_payload["exp"], tz=timezone.utc)

    access_seconds = (access_exp - datetime.now(timezone.utc)).total_seconds()
    refresh_seconds = (refresh_exp - datetime.now(timezone.utc)).total_seconds()

    assert 0 < access_seconds <= 5 * 60
    assert (2 * 24 * 60 * 60) - 5 <= refresh_seconds <= 2 * 24 * 60 * 60
