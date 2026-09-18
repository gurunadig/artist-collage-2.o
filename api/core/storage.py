"""Storage adapters. Milestone 1 uses local disk; R2 is a later swap."""

from django.conf import settings
from django.core.files.storage import FileSystemStorage, Storage


class R2StoragePlaceholder:
    """Cloudflare R2 adapter — not wired in Milestone 1."""

    def __init__(self):
        raise NotImplementedError(
            "Cloudflare R2 is not configured. Set STORAGE_BACKEND=local."
        )


def get_storage() -> Storage:
    if settings.STORAGE_BACKEND == "r2":
        R2StoragePlaceholder()
    return FileSystemStorage(location=str(settings.MEDIA_ROOT), base_url=settings.MEDIA_URL)
