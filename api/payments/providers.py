"""Payment providers stay behind this adapter. Dev locally; Razorpay when keys exist."""

import base64
import hashlib
import hmac
import json
import uuid
from urllib.request import Request, urlopen

from django.conf import settings


class PaymentError(Exception):
    pass


class DevProvider:
    name = "dev"

    def create_order(self, *, amount_inr: int, receipt: str) -> dict:
        return {
            "provider": self.name,
            "razorpay_order_id": f"order_dev_{uuid.uuid4().hex[:16]}",
            "key_id": "",
            "amount_paise": amount_inr * 100,
        }

    def verify_checkout(self, *, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        return razorpay_order_id.startswith("order_dev_")

    def verify_webhook(self, body: bytes, signature: str) -> dict:
        return json.loads(body.decode() or "{}")


class RazorpayProvider:
    name = "razorpay"
    endpoint = "https://api.razorpay.com/v1/orders"

    def create_order(self, *, amount_inr: int, receipt: str) -> dict:
        key_id = settings.RAZORPAY_KEY_ID
        secret = settings.RAZORPAY_KEY_SECRET
        if not key_id or not secret:
            raise PaymentError("Razorpay keys are not configured.")
        payload = json.dumps(
            {"amount": amount_inr * 100, "currency": "INR", "receipt": receipt[:40]}
        ).encode()
        token = base64.b64encode(f"{key_id}:{secret}".encode()).decode()
        request = Request(
            self.endpoint,
            data=payload,
            headers={
                "Authorization": f"Basic {token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=20) as response:
                data = json.loads(response.read().decode())
        except Exception as exc:
            raise PaymentError("Could not create a Razorpay order.") from exc
        return {
            "provider": self.name,
            "razorpay_order_id": data["id"],
            "key_id": key_id,
            "amount_paise": data["amount"],
        }

    def verify_checkout(self, *, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        secret = settings.RAZORPAY_KEY_SECRET
        payload = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, razorpay_signature or "")

    def verify_webhook(self, body: bytes, signature: str) -> dict:
        secret = settings.RAZORPAY_WEBHOOK_SECRET
        expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature or ""):
            raise PaymentError("Invalid webhook signature.")
        return json.loads(body.decode())


def get_provider():
    if getattr(settings, "PAYMENT_PROVIDER", "dev") == "razorpay":
        return RazorpayProvider()
    return DevProvider()
