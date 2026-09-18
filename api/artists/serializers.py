from rest_framework import serializers

from .models import ArtistProfile, Discipline, Genre, Language, PortfolioItem


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

    class Meta(ArtistCardSerializer.Meta):
        fields = ArtistCardSerializer.Meta.fields + (
            "bio",
            "skills",
            "social_links",
            "portfolio_items",
        )


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

    def create(self, validated_data):
        portfolio = validated_data.pop("portfolio_items", [])
        genres = validated_data.pop("genres", [])
        languages = validated_data.pop("languages", [])
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
