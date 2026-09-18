from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import OTPChallenge, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("-date_joined",)
    list_display = ("username", "email", "phone", "role", "is_active", "is_suspended", "is_staff")
    list_filter = ("role", "is_active", "is_suspended", "is_staff")
    search_fields = ("username", "email", "phone")
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Contact", {"fields": ("email", "phone")}),
        ("Role", {"fields": ("role", "is_suspended")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "email", "phone", "password1", "password2", "role"),
            },
        ),
    )
    actions = ["suspend_users", "restore_users"]

    @admin.action(description="Suspend selected users")
    def suspend_users(self, request, queryset):
        queryset.update(is_suspended=True, is_active=False)

    @admin.action(description="Restore selected users")
    def restore_users(self, request, queryset):
        queryset.update(is_suspended=False, is_active=True)


@admin.register(OTPChallenge)
class OTPChallengeAdmin(admin.ModelAdmin):
    list_display = ("email", "phone", "purpose", "attempts", "expires_at", "consumed_at", "created_at")
    list_filter = ("purpose",)
    search_fields = ("email", "phone")
    readonly_fields = ("code_hash",)
