import uuid

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from artists.models import Track
from artists.serializers import TrackCardSerializer
from payments.models import Entitlement, Order
from payments.providers import PaymentError, get_provider
from payments.serializers import OrderSerializer
from payments.services import fulfill_order, split_amount, user_owns_track


class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        artist_slug = (request.data.get("artist_slug") or "").strip()
        track_slug = (request.data.get("track_slug") or "").strip()
        track = (
            Track.objects.select_related("artist", "artist__user")
            .filter(artist__slug=artist_slug, slug=track_slug, is_published=True)
            .first()
        )
        if not track:
            return Response({"detail": "Track not found."}, status=404)
        if user_owns_track(request.user, track):
            return Response({"detail": "You already own this track.", "owned": True}, status=400)
        if request.user.is_suspended:
            return Response({"detail": "This account is suspended."}, status=403)

        amount = track.price_inr
        fee, earnings = split_amount(amount)
        provider = get_provider()
        order = Order.objects.create(
            buyer=request.user,
            track=track,
            amount_inr=amount,
            platform_fee_inr=fee,
            artist_earnings_inr=earnings,
            provider=provider.name,
        )
        try:
            checkout = provider.create_order(amount_inr=amount, receipt=str(order.id))
        except PaymentError as exc:
            order.status = Order.Status.FAILED
            order.save(update_fields=["status", "updated_at"])
            return Response({"detail": str(exc)}, status=502)
        order.razorpay_order_id = checkout["razorpay_order_id"]
        order.save(update_fields=["razorpay_order_id", "updated_at"])
        payload = OrderSerializer(order).data
        payload.update(
            {
                "key_id": checkout["key_id"],
                "amount_paise": checkout["amount_paise"],
                "mock": provider.name == "dev",
            }
        )
        return Response(payload, status=201)


class VerifyOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        order = Order.objects.filter(pk=order_id, buyer=request.user).select_related("track").first()
        if not order:
            return Response({"detail": "Order not found."}, status=404)
        provider = get_provider()
        payment_id = request.data.get("razorpay_payment_id") or f"pay_dev_{uuid.uuid4().hex[:12]}"
        razorpay_order_id = request.data.get("razorpay_order_id") or order.razorpay_order_id
        signature = request.data.get("razorpay_signature") or ""
        if not provider.verify_checkout(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
        ):
            order.status = Order.Status.FAILED
            order.save(update_fields=["status", "updated_at"])
            return Response({"detail": "Payment could not be verified."}, status=400)
        fulfill_order(
            order,
            provider_payment_id=payment_id,
            signature=signature,
            raw=request.data if isinstance(request.data, dict) else {},
        )
        order.refresh_from_db()
        return Response(OrderSerializer(order).data)


class WebhookView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        provider = get_provider()
        signature = request.headers.get("X-Razorpay-Signature", "")
        try:
            payload = provider.verify_webhook(request.body, signature)
        except PaymentError as exc:
            return Response({"detail": str(exc)}, status=400)
        event = payload.get("event")
        if event != "payment.captured":
            return Response({"ok": True, "ignored": event})
        entity = (payload.get("payload") or {}).get("payment", {}).get("entity") or {}
        razorpay_order_id = entity.get("order_id")
        payment_id = entity.get("id")
        if not razorpay_order_id or not payment_id:
            return Response({"ok": True})
        order = Order.objects.filter(razorpay_order_id=razorpay_order_id).first()
        if not order:
            return Response({"ok": True, "unknown_order": True})
        fulfill_order(order, provider_payment_id=payment_id, signature=signature, raw=payload)
        return Response({"ok": True})


class LibraryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entitlements = (
            Entitlement.objects.filter(user=request.user)
            .select_related("track", "track__artist")
            .order_by("-created_at")
        )
        tracks = [item.track for item in entitlements]
        return Response(
            {
                "count": len(tracks),
                "results": TrackCardSerializer(tracks, many=True, context={"request": request}).data,
            }
        )


class SalesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "artist_profile", None)
        if not profile:
            return Response({"total_earnings_inr": 0, "count": 0, "results": []})
        orders = Order.objects.filter(track__artist=profile, status=Order.Status.PAID)
        total = sum(order.artist_earnings_inr for order in orders)
        return Response(
            {
                "total_earnings_inr": total,
                "count": orders.count(),
                "results": OrderSerializer(orders[:50], many=True).data,
            }
        )
