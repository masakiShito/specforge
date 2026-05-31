"""JWT token utilities for authentication."""

import os
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt


_secret_key_cache: str | None = None
_algorithm_cache: str | None = None
_access_token_expire_minutes_cache: int | None = None
_refresh_token_expire_days_cache: int | None = None


def _get_secret_key() -> str:
    """Get JWT secret key from environment variable."""
    secret = os.getenv("JWT_SECRET_KEY")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY environment variable is required. "
            "Please set a secure secret key (at least 32 characters)."
        )
    if len(secret) < 32:
        raise RuntimeError(
            "JWT_SECRET_KEY must be at least 32 characters for security."
        )
    return secret


def get_secret_key() -> str:
    """Get JWT secret key lazily and cache it after first use."""
    global _secret_key_cache
    if _secret_key_cache is None:
        _secret_key_cache = _get_secret_key()
    return _secret_key_cache


def get_algorithm() -> str:
    """Get JWT algorithm lazily."""
    global _algorithm_cache
    if _algorithm_cache is None:
        _algorithm_cache = os.getenv("JWT_ALGORITHM", "HS256")
    return _algorithm_cache


def get_access_token_expire_minutes() -> int:
    """Get access token expiration minutes lazily."""
    global _access_token_expire_minutes_cache
    if _access_token_expire_minutes_cache is None:
        _access_token_expire_minutes_cache = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    return _access_token_expire_minutes_cache


def get_refresh_token_expire_days() -> int:
    """Get refresh token expiration days lazily."""
    global _refresh_token_expire_days_cache
    if _refresh_token_expire_days_cache is None:
        _refresh_token_expire_days_cache = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    return _refresh_token_expire_days_cache


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Token payload data
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=get_access_token_expire_minutes())

    to_encode.update({
        "exp": expire,
        "type": "access",
    })

    encoded_jwt = jwt.encode(to_encode, get_secret_key(), algorithm=get_algorithm())
    return encoded_jwt


def create_refresh_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT refresh token.

    Args:
        data: Token payload data
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=get_refresh_token_expire_days())

    to_encode.update({
        "exp": expire,
        "type": "refresh",
    })

    encoded_jwt = jwt.encode(to_encode, get_secret_key(), algorithm=get_algorithm())
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> dict[str, Any] | None:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string
        token_type: Expected token type ("access" or "refresh")

    Returns:
        Token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[get_algorithm()])

        # Verify token type
        if payload.get("type") != token_type:
            return None

        return payload
    except JWTError:
        return None
