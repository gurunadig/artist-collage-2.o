import hashlib
import hmac
import logging
import random
import re
import string
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

PHONE_RE = re.compile(r"^\+?[0-9]{10,15}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 10:
        digits = "91" + digits
    if not digits:
        raise ValueError("Enter a valid phone number.")
    return "+" + digits


def normalize_email(raw: str) -> str:
    email = (raw or "").strip().lower()
    if not EMAIL_RE.match(email):
        raise ValueError("Enter a valid email address.")
    return email


def hash_otp(code: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode(),
        code.encode(),
        hashlib.sha256,
    ).hexdigest()


def generate_otp_code() -> str:
    if settings.OTP_PROVIDER == "dev":
        return settings.DEV_OTP_CODE
    return "".join(random.choices(string.digits, k=6))


class OTPProvider:
    def send(self, *, destination: str, channel: str, code: str) -> None:
        raise NotImplementedError


class DevOTPProvider(OTPProvider):
    def send(self, *, destination: str, channel: str, code: str) -> None:
        logger.info("DEV OTP (%s to %s): %s", channel, destination, code)


class MSG91OTPProvider(OTPProvider):
    """Placeholder until MSG91 credentials exist. Do not call in Milestone 1."""

    def send(self, *, destination: str, channel: str, code: str) -> None:
        raise NotImplementedError(
            "MSG91 is not configured. Set OTP_PROVIDER=dev for local development."
        )


def get_otp_provider() -> OTPProvider:
    if settings.OTP_PROVIDER == "msg91":
        return MSG91OTPProvider()
    return DevOTPProvider()


def issue_otp(*, email=None, phone=None, purpose: str, model):
    if not email and not phone:
        raise ValueError("Provide an email or phone number.")
    code = generate_otp_code()
    destination = email or phone
    channel = "email" if email else "sms"
    provider = get_otp_provider()
    provider.send(destination=destination, channel=channel, code=code)

    expires_at = timezone.now() + timedelta(seconds=settings.OTP_TTL_SECONDS)
    challenge = model.objects.create(
        email=email,
        phone=phone,
        purpose=purpose,
        code_hash=hash_otp(code),
        max_attempts=settings.OTP_MAX_ATTEMPTS,
        expires_at=expires_at,
    )
    payload = {"ok": True, "expires_in": settings.OTP_TTL_SECONDS}
    if settings.DEBUG and settings.OTP_PROVIDER == "dev":
        payload["dev_code"] = code
    return challenge, payload
