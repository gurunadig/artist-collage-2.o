"""HMAC-signed, time-limited media URLs. Private audio never gets a permanent public path."""

import hashlib
import hmac
import time

from django.conf import settings


def _sign(payload: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()


def sign_preview(track_id: str, ttl_seconds: int | None = None) -> tuple[int, str]:
    ttl = ttl_seconds or getattr(settings, "PREVIEW_URL_TTL", 180)
    expires = int(time.time()) + ttl
    return expires, _sign(f"preview:{track_id}:{expires}")


def verify_preview(track_id: str, expires: str | int, signature: str) -> bool:
    try:
        expires_int = int(expires)
    except (TypeError, ValueError):
        return False
    if expires_int < int(time.time()):
        return False
    return hmac.compare_digest(_sign(f"preview:{track_id}:{expires_int}"), signature or "")


def sign_download(track_id: str, user_id: str, fmt: str, ttl_seconds: int | None = None) -> tuple[int, str]:
    ttl = ttl_seconds or getattr(settings, "DOWNLOAD_URL_TTL", 180)
    expires = int(time.time()) + ttl
    return expires, _sign(f"download:{track_id}:{user_id}:{fmt}:{expires}")


def verify_download(track_id: str, user_id: str, fmt: str, expires: str | int, signature: str) -> bool:
    try:
        expires_int = int(expires)
    except (TypeError, ValueError):
        return False
    if expires_int < int(time.time()):
        return False
    expected = _sign(f"download:{track_id}:{user_id}:{fmt}:{expires_int}")
    return hmac.compare_digest(expected, signature or "")
