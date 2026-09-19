from django.utils.text import slugify
from rest_framework import serializers

from core.signing import sign_download, sign_preview
from .models import ArtistProfile, Discipline, Genre, Language, PortfolioItem, Track, unique_slug


class NamedSlugSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ("id", "name", "slug")


class DisciplineSerializer(NamedSlugSerializer):
    class Meta(NamedSlugSerializer.Meta):
        model = Discipline


class GenreSerializer(NamedSlugSerializer):
    class Meta(NamedSlugSerializer.Meta):
        model = Genre


class LanguageSerializer(NamedSlugSerializer):
    class Meta(NamedSlugSerializer.Meta):
        model = Language
        fields = ("id", "name", "slug", "code")


class PortfolioItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioItem
        fields = ("id", "title", "url", "description", "sort_order")


class ArtistCardSerializer(serializers.ModelSerializer):
    discipline = DisciplineSerializer(read_only=True)
    genres = GenreSerializer(many=True, read_only=True)
    languages = LanguageSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ArtistProfile
        fields = (
            "slug",
            "stage_name",
            "city",
            "state",
            "country",
            "discipline",
            "genres",
            "languages",
            "image_url",
            "available_for_collaboration",
            "available_for_hire",
            "starting_rate_inr",
            "verification_status",
            "is_featured",
        )

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url


class ArtistDetailSerializer(ArtistCardSerializer):
    portfolio_items = PortfolioItemSerializer(many=True, read_only=True)
    tracks = serializers.SerializerMethodField()

    class Meta(ArtistCardSerializer.Meta):
        fields = ArtistCardSerializer.Meta.fields + (
            "bio",
            "skills",
            "social_links",
            "portfolio_items",
            "tracks",
        )

    def get_tracks(self, obj):
        qs = obj.tracks.filter(is_published=True)
        return TrackCardSerializer(qs, many=True, context=self.context).data


class ArtistProfileWriteSerializer(serializers.ModelSerializer):
    discipline_id = serializers.PrimaryKeyRelatedField(
        source="discipline",
        queryset=Discipline.objects.all(),
        allow_null=True,
        required=False,
    )
    genre_ids = serializers.PrimaryKeyRelatedField(
        source="genres",
        queryset=Genre.objects.all(),
        many=True,
        required=False,
    )
    language_ids = serializers.PrimaryKeyRelatedField(
        source="languages",
        queryset=Language.objects.all(),
        many=True,
        required=False,
    )
    portfolio_items = PortfolioItemSerializer(many=True, required=False)
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = ArtistProfile
        fields = (
            "stage_name",
            "slug",
            "bio",
            "city",
            "state",
            "country",
            "discipline_id",
            "genre_ids",
            "language_ids",
            "skills",
            "social_links",
            "available_for_collaboration",
            "available_for_hire",
            "starting_rate_inr",
            "portfolio_items",
        )

    def validate(self, attrs):
        if self.instance is None and not attrs.get("stage_name"):
            raise serializers.ValidationError({"stage_name": "A stage name is required."})
        return attrs

    def validate_slug(self, value):
        value = slugify((value or "").strip())
        if not value:
            return ""
        qs = ArtistProfile.objects.filter(slug=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("That public URL is already taken.")
        return value

    def create(self, validated_data):
        portfolio = validated_data.pop("portfolio_items", [])
        genres = validated_data.pop("genres", [])
        languages = validated_data.pop("languages", [])
        if not validated_data.get("slug") and validated_data.get("stage_name"):
            validated_data["slug"] = unique_slug(validated_data["stage_name"], ArtistProfile)
        profile = ArtistProfile.objects.create(**validated_data)
        profile.genres.set(genres)
        profile.languages.set(languages)
        self._replace_portfolio(profile, portfolio)
        return profile

    def update(self, instance, validated_data):
        portfolio = validated_data.pop("portfolio_items", None)
        genres = validated_data.pop("genres", None)
        languages = validated_data.pop("languages", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if not instance.slug and instance.stage_name:
            from .models import unique_slug

            instance.slug = unique_slug(instance.stage_name, ArtistProfile, instance.pk)
        instance.save()
        if genres is not None:
            instance.genres.set(genres)
        if languages is not None:
            instance.languages.set(languages)
        if portfolio is not None:
            self._replace_portfolio(instance, portfolio)
        return instance

    def _replace_portfolio(self, profile, items):
        profile.portfolio_items.all().delete()
        for index, item in enumerate(items):
            PortfolioItem.objects.create(
                artist=profile,
                title=item.get("title", ""),
                url=item.get("url", ""),
                description=item.get("description", ""),
                sort_order=item.get("sort_order", index),
            )


class TrackCardSerializer(serializers.ModelSerializer):
    artist_slug = serializers.CharField(source="artist.slug", read_only=True)
    artist_name = serializers.CharField(source="artist.stage_name", read_only=True)
    artwork_url = serializers.SerializerMethodField()
    preview_url = serializers.SerializerMethodField()
    has_mp3 = serializers.SerializerMethodField()
    has_wav = serializers.SerializerMethodField()
    has_preview_audio = serializers.SerializerMethodField()
    owned = serializers.SerializerMethodField()
    stream_url = serializers.SerializerMethodField()
    download_mp3_url = serializers.SerializerMethodField()
    download_wav_url = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = (
            "id",
            "slug",
            "title",
            "artist_slug",
            "artist_name",
            "artwork_url",
            "preview_url",
            "preview_seconds",
            "preview_start_seconds",
            "duration_seconds",
            "has_preview_audio",
            "price_inr",
            "is_published",
            "has_mp3",
            "has_wav",
            "owned",
            "stream_url",
            "download_mp3_url",
            "download_wav_url",
            "created_at",
        )
        read_only_fields = fields

    def get_artwork_url(self, obj):
        if not obj.artwork:
            return None
        request = self.context.get("request")
        url = obj.artwork.url
        return request.build_absolute_uri(url) if request else url

    def get_has_mp3(self, obj):
        return bool(obj.mp3)

    def get_has_wav(self, obj):
        return bool(obj.wav)

    def get_has_preview_audio(self, obj):
        return bool(obj.preview_audio)

    def get_preview_url(self, obj):
        if not obj.mp3 and not obj.preview_audio:
            return None
        request = self.context.get("request")
        expires, signature = sign_preview(str(obj.id))
        path = f"/api/v1/artists/{obj.artist.slug}/tracks/{obj.slug}/preview?expires={expires}&sig={signature}"
        if request:
            return request.build_absolute_uri(path)
        return path

    def _owned(self, obj) -> bool:
        from payments.services import user_owns_track

        request = self.context.get("request")
        user = getattr(request, "user", None)
        return user_owns_track(user, obj)

    def get_owned(self, obj):
        return self._owned(obj)

    def _signed_file(self, obj, fmt: str):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not self._owned(obj):
            return None
        if fmt == "mp3" and not obj.mp3:
            return None
        if fmt == "wav" and not obj.wav:
            return None
        expires, signature = sign_download(str(obj.id), str(user.id), fmt)
        path = (
            f"/api/v1/artists/{obj.artist.slug}/tracks/{obj.slug}/download"
            f"?kind={fmt}&expires={expires}&sig={signature}&uid={user.id}"
        )
        if request:
            return request.build_absolute_uri(path)
        return path

    def get_stream_url(self, obj):
        url = self._signed_file(obj, "mp3")
        if url:
            return f"{url}&inline=1"
        return None

    def get_download_mp3_url(self, obj):
        return self._signed_file(obj, "mp3")

    def get_download_wav_url(self, obj):
        return self._signed_file(obj, "wav")
