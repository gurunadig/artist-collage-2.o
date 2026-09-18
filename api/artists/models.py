import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Discipline(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Genre(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Language(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    code = models.CharField(max_length=8, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ArtistProfile(models.Model):
    class Verification(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="artist_profile",
    )
    stage_name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    image = models.ImageField(upload_to="artists/profiles/", blank=True, null=True)
    bio = models.TextField(blank=True)
    city = models.CharField(max_length=80, blank=True)
    state = models.CharField(max_length=80, blank=True)
    country = models.CharField(max_length=80, default="India")
    discipline = models.ForeignKey(
        Discipline,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="artists",
    )
    genres = models.ManyToManyField(Genre, blank=True, related_name="artists")
    languages = models.ManyToManyField(Language, blank=True, related_name="artists")
    skills = models.JSONField(default=list, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    available_for_collaboration = models.BooleanField(default=False)
    available_for_hire = models.BooleanField(default=False)
    starting_rate_inr = models.PositiveIntegerField(null=True, blank=True)
    verification_status = models.CharField(
        max_length=16,
        choices=Verification.choices,
        default=Verification.PENDING,
    )
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_featured", "stage_name"]

    def __str__(self):
        return self.stage_name

    def save(self, *args, **kwargs):
        if not self.slug and self.stage_name:
            self.slug = unique_slug(self.stage_name, ArtistProfile, self.pk)
        super().save(*args, **kwargs)

    @property
    def is_complete(self) -> bool:
        return bool(self.stage_name and self.slug)


class PortfolioItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artist = models.ForeignKey(
        ArtistProfile,
        on_delete=models.CASCADE,
        related_name="portfolio_items",
    )
    title = models.CharField(max_length=160)
    url = models.URLField(blank=True)
    description = models.CharField(max_length=280, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "title"]

    def __str__(self):
        return self.title


class Report(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWED = "reviewed", "Reviewed"
        CLOSED = "closed", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reports",
    )
    artist = models.ForeignKey(
        ArtistProfile,
        on_delete=models.CASCADE,
        related_name="reports",
    )
    reason = models.CharField(max_length=160)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reason} — {self.artist}"


def unique_slug(name: str, model, pk=None) -> str:
    base = slugify(name) or "artist"
    slug = base
    n = 2
    qs = model.objects.all()
    while qs.filter(slug=slug).exclude(pk=pk).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug
