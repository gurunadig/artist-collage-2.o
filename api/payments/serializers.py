from rest_framework import serializers

from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    track_title = serializers.CharField(source="track.title", read_only=True)
    artist_name = serializers.CharField(source="track.artist.stage_name", read_only=True)
    artist_slug = serializers.CharField(source="track.artist.slug", read_only=True)
    track_slug = serializers.CharField(source="track.slug", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "provider",
            "amount_inr",
            "platform_fee_inr",
            "artist_earnings_inr",
            "currency",
            "razorpay_order_id",
            "track_title",
            "track_slug",
            "artist_name",
            "artist_slug",
            "created_at",
        )
        read_only_fields = fields
