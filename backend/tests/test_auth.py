import pytest
from backend.app.core.security import (
    verify_password, get_password_hash, create_access_token, decode_token
)

def test_password_hashing():
    raw_pass = "Kassir2026!Secure"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_generation_and_decode():
    user_id = "test-user-uuid-12345"
    token = create_access_token(subject=user_id)
    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == user_id
    assert payload.get("type") == "access"

def test_invalid_token_returns_none():
    invalid_token = "invalid.token.signature"
    payload = decode_token(invalid_token)
    assert payload is None
