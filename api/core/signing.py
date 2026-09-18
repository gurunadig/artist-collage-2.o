"""HMAC-signed, time-limited media URLs. Private audio never gets a permanent public path."""

import hashlib
import hmac
import time

from django.conf import settings


def sign_preview(track_id: str, ttl_seconds: int | None = None) -> tuple[int, str]:
    ttl = ttl_seconds or getattr(settings, "PREVIEW_URL_TTL", 180)
    expires = int(time.time()) + ttl
    payload = f"preview:{track_id}:{expires}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return expires, signature


def verify_preview(track_id: str, expires: str | int, signature: str) -> bool:
    try:
        expires_int = int(expires)
    except (TypeError, ValueError):
        return False
    if expires_int < int(time.time()):
        return False
    payload = f"preview:{track_id}:{expires_int}"
    expected = hmac.new(
        settings.SECRET_KEY.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")
