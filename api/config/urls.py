from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

admin.site.site_header = "Artist Collage"
admin.site.site_title = "Artist Collage"
admin.site.index_title = "Operations"


def health(_request):
    return JsonResponse({"ok": True, "service": "artist-collage-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health", health),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("artists.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL + "artists/",
        document_root=settings.MEDIA_ROOT / "artists",
    )
    urlpatterns += static(
        settings.MEDIA_URL + "tracks/artwork/",
        document_root=settings.MEDIA_ROOT / "tracks" / "artwork",
    )
