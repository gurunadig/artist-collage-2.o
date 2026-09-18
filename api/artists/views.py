from django.db.models import Q
from rest_framework import filters, generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.throttles import SearchThrottle

from .models import ArtistProfile, Discipline, Genre, Language
from .serializers import (
    ArtistCardSerializer,
    ArtistDetailSerializer,
    ArtistProfileWriteSerializer,
    DisciplineSerializer,
    GenreSerializer,
    LanguageSerializer,
)

STOPWORDS = {"a", "an", "the", "in", "for", "and", "or", "of", "to", "with"}


class IsNotSuspended(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return True
        return not user.is_suspended and user.is_active


class LookupView(APIView):
    def get(self, request):
        return Response(
            {
                "disciplines": DisciplineSerializer(Discipline.objects.all(), many=True).data,
                "genres": GenreSerializer(Genre.objects.all(), many=True).data,
                "languages": LanguageSerializer(Language.objects.all(), many=True).data,
            }
        )


class ArtistDirectoryView(generics.ListAPIView):
    serializer_class = ArtistCardSerializer
    throttle_classes = [SearchThrottle]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["stage_name", "created_at", "starting_rate_inr"]
    ordering = ["-is_featured", "stage_name"]

    def get_queryset(self):
        qs = (
            ArtistProfile.objects.select_related("discipline", "user")
            .prefetch_related("genres", "languages")
            .filter(user__is_suspended=False, user__is_active=True)
            .exclude(stage_name="")
        )
        params = self.request.query_params
        city = params.get("city")
        if city:
            qs = qs.filter(city__icontains=city.strip())
        discipline = params.get("discipline")
        if discipline:
            qs = qs.filter(Q(discipline__slug=discipline) | Q(discipline__name__icontains=discipline))
        genre = params.get("genre")
        if genre:
            qs = qs.filter(Q(genres__slug=genre) | Q(genres__name__icontains=genre))
        language = params.get("language")
        if language:
            qs = qs.filter(Q(languages__slug=language) | Q(languages__name__icontains=language))
        availability = params.get("availability")
        if availability == "hire":
            qs = qs.filter(available_for_hire=True)
        elif availability in ("collab", "collaboration"):
            qs = qs.filter(available_for_collaboration=True)
        verified = params.get("verified")
        if verified in ("1", "true", "yes"):
            qs = qs.filter(verification_status=ArtistProfile.Verification.VERIFIED)

        query = (params.get("q") or "").strip()
        if query:
            qs = qs.filter(search_q(query))
        return qs.distinct()


def search_q(query: str) -> Q:
    tokens = [t for t in query.replace(",", " ").split() if t.lower() not in STOPWORDS]
    if not tokens:
        tokens = [query]
    combined = Q()
    for token in tokens:
        combined &= (
            Q(stage_name__icontains=token)
            | Q(bio__icontains=token)
            | Q(city__icontains=token)
            | Q(state__icontains=token)
            | Q(discipline__name__icontains=token)
            | Q(discipline__slug__icontains=token)
            | Q(genres__name__icontains=token)
            | Q(languages__name__icontains=token)
            | Q(skills__icontains=token)
        )
    return combined


class ArtistDetailView(generics.RetrieveAPIView):
    serializer_class = ArtistDetailSerializer
    lookup_field = "slug"
    queryset = (
        ArtistProfile.objects.select_related("discipline", "user")
        .prefetch_related("genres", "languages", "portfolio_items")
        .filter(user__is_suspended=False)
    )


class MeProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsNotSuspended]

    def get(self, request):
        profile = getattr(request.user, "artist_profile", None)
        if not profile:
            return Response({"detail": "No profile yet."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ArtistDetailSerializer(profile, context={"request": request}).data)

    def patch(self, request):
        profile = getattr(request.user, "artist_profile", None)
        serializer = ArtistProfileWriteSerializer(instance=profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if profile is None:
            profile = serializer.save(user=request.user)
        else:
            profile = serializer.save()
        if request.user.role == User.Role.FAN:
            request.user.role = User.Role.ARTIST
            request.user.save(update_fields=["role"])
        return Response(ArtistDetailSerializer(profile, context={"request": request}).data)


class MeProfileImageView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsNotSuspended]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        profile = getattr(request.user, "artist_profile", None)
        if not profile:
            return Response({"detail": "Create a profile before uploading an image."}, status=400)
        image = request.FILES.get("image")
        if not image:
            return Response({"detail": "Choose an image file."}, status=400)
        content_type = getattr(image, "content_type", "") or ""
        if not content_type.startswith("image/"):
            return Response({"detail": "File must be an image."}, status=400)
        profile.image = image
        profile.save(update_fields=["image"])
        return Response(ArtistDetailSerializer(profile, context={"request": request}).data)
