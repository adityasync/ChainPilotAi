"""NFR-SEC-01: Unit tests for security module — bcrypt cost factor >= 12."""

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    verify_access_token,
    _BCRYPT_ROUNDS,
    pwd_context,
)
from app.core.exceptions import UnauthorizedError
import pytest


class TestBcryptCostFactor:
    """NFR-SEC-01: bcrypt cost factor must be >= 12."""

    def test_cost_factor_minimum(self):
        assert _BCRYPT_ROUNDS >= 12, "NFR-SEC-01: bcrypt rounds must be >= 12"

    def test_hash_uses_configured_rounds(self):
        h = get_password_hash("testpassword")
        parts = h.split("$")
        # bcrypt format: $2b$<rounds>$<salt><hash>
        # parts: ['', '2b', '<rounds>', '<salt+hash>']
        actual_rounds = int(parts[2])
        assert actual_rounds >= 12

    def test_password_hash_and_verify(self):
        password = "SecureP@ss123"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True
        assert verify_password("wrong", hashed) is False

    def test_different_hashes_for_same_password(self):
        h1 = get_password_hash("same_password")
        h2 = get_password_hash("same_password")
        assert h1 != h2  # bcrypt uses random salt


class TestJWT:
    def test_create_and_verify_token(self):
        token = create_access_token(
            data={"sub": "user@test.com", "user_id": 1, "company_id": 1}
        )
        email = verify_access_token(token, UnauthorizedError("Invalid token"))
        assert email == "user@test.com"

    def test_invalid_token_raises(self):
        with pytest.raises(Exception):
            verify_access_token("invalid.token.here", UnauthorizedError("Invalid token"))
