from django.conf import settings
from django.db import transaction

from .models import Entitlement, Order, Payment


def split_amount(amount_inr: int) -> tuple[int, int]:
    percent = int(getattr(settings, "PLATFORM_FEE_PERCENT", 10))
    fee = (amount_inr * percent) // 100
    return fee, amount_inr - fee


def user_owns_track(user, track) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "artist_profile", None) == track.artist:
        return True
    return Entitlement.objects.filter(user=user, track=track).exists()


@transaction.atomic
def fulfill_order(order: Order, *, provider_payment_id: str, signature: str = "", raw=None) -> Order:
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.status == Order.Status.PAID:
        return order
    Payment.objects.get_or_create(
        provider_payment_id=provider_payment_id,
        defaults={
            "order": order,
            "signature": signature,
            "status": Payment.Status.CAPTURED,
            "raw": raw or {},
        },
    )
    order.status = Order.Status.PAID
    order.save(update_fields=["status", "updated_at"])
    Entitlement.objects.get_or_create(user=order.buyer, track=order.track, defaults={"order": order})
    return order
