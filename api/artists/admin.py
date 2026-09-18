from django.contrib import admin
from django.utils.html import format_html

from .models import ArtistProfile, Discipline, Genre, Language, PortfolioItem, Report


@admin.register(Discipline)
class DisciplineAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "code")


class PortfolioInline(admin.TabularInline):
    model = PortfolioItem
    extra = 0


@admin.register(ArtistProfile)
class ArtistProfileAdmin(admin.ModelAdmin):
    list_display = (
        "stage_name",
        "slug",
        "city",
        "discipline",
        "verification_status",
        "is_featured",
        "available_for_hire",
        "available_for_collaboration",
        "starting_rate_inr",
    )
    list_filter = (
        "verification_status",
        "is_featured",
        "available_for_hire",
        "available_for_collaboration",
        "discipline",
        "city",
    )
    search_fields = ("stage_name", "slug", "city", "user__email", "user__phone")
    prepopulated_fields = {"slug": ("stage_name",)}
    inlines = [PortfolioInline]
    actions = ["mark_verified", "mark_pending", "feature", "unfeature"]
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:120px" />', obj.image.url)
        return "—"

    @admin.action(description="Mark verified")
    def mark_verified(self, request, queryset):
        queryset.update(verification_status=ArtistProfile.Verification.VERIFIED)

    @admin.action(description="Mark pending")
    def mark_pending(self, request, queryset):
        queryset.update(verification_status=ArtistProfile.Verification.PENDING)

    @admin.action(description="Feature")
    def feature(self, request, queryset):
        queryset.update(is_featured=True)

    @admin.action(description="Unfeature")
    def unfeature(self, request, queryset):
        queryset.update(is_featured=False)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("artist", "reason", "status", "reporter", "created_at")
    list_filter = ("status",)
    search_fields = ("artist__stage_name", "reason")
