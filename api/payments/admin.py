from django.contrib import admin

from .models import Entitlement, Order, Payment


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ("provider_payment_id", "status", "created_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "track",
        "buyer",
        "amount_inr",
        "platform_fee_inr",
        "artist_earnings_inr",
        "status",
        "provider",
        "created_at",
    )
    list_filter = ("status", "provider")
    search_fields = ("razorpay_order_id", "track__title", "buyer__email", "buyer__phone")
    inlines = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("provider_payment_id", "order", "status", "created_at")
    search_fields = ("provider_payment_id",)


@admin.register(Entitlement)
class EntitlementAdmin(admin.ModelAdmin):
    list_display = ("user", "track", "created_at")
    search_fields = ("user__email", "user__phone", "track__title")
