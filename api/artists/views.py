from django.db import IntegrityError
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django.http import FileResponse, Http404
from rest_framework import filters, generics, permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.throttles import SearchThrottle
from core.signing import verify_download, verify_preview

from .models import ArtistProfile, Discipline, Genre, Language, Track, clamp_preview_window
from .serializers import (
    ArtistCardSerializer,
    ArtistDetailSerializer,
    ArtistProfileWriteSerializer,
    DisciplineSerializer,
    GenreSerializer,
    LanguageSerializer,
    TrackCardSerializer,
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
        .prefetch_related("genres", "languages", "portfolio_items", "tracks")
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
        try:
            if profile is None:
                profile = serializer.save(user=request.user)
            else:
                profile = serializer.save()
        except IntegrityError:
            return Response(
                {"slug": ["That public URL is already taken."], "detail": "That public URL is already taken."},
                status=400,
            )
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


MP3_TYPES = {"audio/mpeg", "audio/mp3", "audio/mpeg3"}
WAV_TYPES = {"audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"}
IMAGE_PREFIX = "image/"


def _require_profile(user):
    return getattr(user, "artist_profile", None)


def _validate_upload(file_obj, allowed_types, label):
    content_type = (getattr(file_obj, "content_type", "") or "").lower()
    name = (getattr(file_obj, "name", "") or "").lower()
    if content_type in allowed_types:
        return
    if label == "mp3" and name.endswith(".mp3"):
        return
    if label == "wav" and name.endswith(".wav"):
        return
    raise ValueError(f"{label} must be a valid {label.upper()} file.")


def _parse_float(value, default=None):
    if value in (None, ""):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _apply_preview_window(track, data, files=None):
    duration = _parse_float(data.get("duration_seconds"), track.duration_seconds)
    start = _parse_float(data.get("preview_start_seconds"), track.preview_start_seconds)
    if duration is not None:
        track.duration_seconds = duration
    start, window = clamp_preview_window(track.duration_seconds, start)
    track.preview_start_seconds = start
    track.preview_seconds = window
    files = files or {}
    preview = files.get("preview_audio")
    if preview:
        _validate_upload(preview, WAV_TYPES, "wav")
        track.preview_audio = preview
    return track


class PublicTrackDetailView(APIView):
    def get(self, request, slug, track_slug):
        track = (
            Track.objects.select_related("artist", "artist__user")
            .filter(
                artist__slug=slug,
                slug=track_slug,
                is_published=True,
                artist__user__is_suspended=False,
            )
            .first()
        )
        if not track:
            return Response({"detail": "Track not found."}, status=404)
        return Response(TrackCardSerializer(track, context={"request": request}).data)


class TrackPreviewView(APIView):
    def get(self, request, slug, track_slug):
        track = (
            Track.objects.select_related("artist", "artist__user")
            .filter(artist__slug=slug, slug=track_slug)
            .first()
        )
        if not track or not (track.preview_audio or track.mp3):
            raise Http404("No preview.")

        owner = (
            request.user.is_authenticated
            and getattr(request.user, "artist_profile", None) == track.artist
        )
        if not owner:
            if not track.is_published or track.artist.user.is_suspended:
                raise Http404("No preview.")
            if not verify_preview(
                str(track.id),
                request.query_params.get("expires"),
                request.query_params.get("sig"),
            ):
                return Response({"detail": "Preview link expired. Refresh the page."}, status=403)

        clip = bool(track.preview_audio)
        audio = track.preview_audio if clip else track.mp3
        handle = audio.open("rb")
        content_type = "audio/wav" if clip else "audio/mpeg"
        response = FileResponse(handle, content_type=content_type)
        response["Content-Disposition"] = "inline"
        response["Cache-Control"] = "private, max-age=60"
        response["X-Preview-Seconds"] = str(track.preview_seconds)
        response["X-Preview-Start"] = "0" if clip else str(track.preview_start_seconds)
        return response


class TrackDownloadView(APIView):
    def get(self, request, slug, track_slug):
        track = (
            Track.objects.select_related("artist", "artist__user")
            .filter(artist__slug=slug, slug=track_slug)
            .first()
        )
        fmt = (request.query_params.get("kind") or request.query_params.get("format") or "mp3").lower()
        if fmt not in ("mp3", "wav"):
            return Response({"detail": "Format must be mp3 or wav."}, status=400)
        audio = track.mp3 if track and fmt == "mp3" else track.wav if track else None
        if not track or not audio:
            raise Http404("File not found.")

        user_id = request.query_params.get("uid") or (
            str(request.user.id) if request.user.is_authenticated else ""
        )
        from payments.models import Entitlement
        from payments.services import user_owns_track

        entitled = False
        if request.user.is_authenticated and user_owns_track(request.user, track):
            entitled = True
        elif user_id and Entitlement.objects.filter(user_id=user_id, track=track).exists():
            entitled = True
        elif user_id and str(track.artist.user_id) == str(user_id):
            entitled = True

        if not entitled:
            return Response({"detail": "Purchase this track to download it."}, status=403)
        if not verify_download(
            str(track.id),
            user_id,
            fmt,
            request.query_params.get("expires"),
            request.query_params.get("sig"),
        ):
            if not (request.user.is_authenticated and user_owns_track(request.user, track)):
                return Response({"detail": "Download link expired. Refresh the page."}, status=403)

        handle = audio.open("rb")
        content_type = "audio/mpeg" if fmt == "mp3" else "audio/wav"
        filename = f"{track.slug}.{fmt}"
        response = FileResponse(handle, content_type=content_type)
        if request.query_params.get("inline"):
            response["Content-Disposition"] = "inline"
        else:
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Cache-Control"] = "private, max-age=60"
        return response


class MeTrackListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsNotSuspended]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        profile = _require_profile(request.user)
        if not profile:
            return Response({"count": 0, "results": []})
        tracks = profile.tracks.all()
        return Response(
            {
                "count": tracks.count(),
                "results": TrackCardSerializer(tracks, many=True, context={"request": request}).data,
            }
        )

    def post(self, request):
        profile = _require_profile(request.user)
        if not profile:
            return Response({"detail": "Create your artist profile first."}, status=400)
        title = (request.data.get("title") or "").strip()
        if not title:
            return Response({"detail": "A track title is required."}, status=400)
        mp3 = request.FILES.get("mp3")
        if not mp3:
            return Response({"detail": "Upload an MP3."}, status=400)
        try:
            _validate_upload(mp3, MP3_TYPES, "mp3")
            wav = request.FILES.get("wav")
            if wav:
                _validate_upload(wav, WAV_TYPES, "wav")
            artwork = request.FILES.get("artwork")
            if artwork:
                content_type = getattr(artwork, "content_type", "") or ""
                if not content_type.startswith(IMAGE_PREFIX):
                    raise ValueError("Artwork must be an image.")
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)

        track = Track(
            artist=profile,
            title=title,
            price_inr=int(request.data.get("price_inr") or 50),
            is_published=str(request.data.get("is_published", "true")).lower()
            in ("1", "true", "yes", "on"),
        )
        track.mp3 = mp3
        if request.FILES.get("wav"):
            track.wav = request.FILES["wav"]
        if request.FILES.get("artwork"):
            track.artwork = request.FILES["artwork"]
        try:
            _apply_preview_window(track, request.data, request.FILES)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        if request.user.role == User.Role.FAN:
            request.user.role = User.Role.ARTIST
            request.user.save(update_fields=["role"])
        track.save()
        return Response(
            TrackCardSerializer(track, context={"request": request}).data,
            status=201,
        )


class MeTrackDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsNotSuspended]
    parser_classes = [MultiPartParser, FormParser]

    def _get(self, request, track_id):
        profile = _require_profile(request.user)
        if not profile:
            return None
        return profile.tracks.filter(pk=track_id).first()

    def patch(self, request, track_id):
        track = self._get(request, track_id)
        if not track:
            return Response({"detail": "Track not found."}, status=404)
        if "title" in request.data and str(request.data.get("title")).strip():
            track.title = str(request.data.get("title")).strip()
        if "price_inr" in request.data:
            track.price_inr = int(request.data.get("price_inr") or track.price_inr)
        if "is_published" in request.data:
            track.is_published = str(request.data.get("is_published")).lower() in (
                "1",
                "true",
                "yes",
                "on",
            )
        try:
            if request.FILES.get("mp3"):
                _validate_upload(request.FILES["mp3"], MP3_TYPES, "mp3")
                track.mp3 = request.FILES["mp3"]
            if request.FILES.get("wav"):
                _validate_upload(request.FILES["wav"], WAV_TYPES, "wav")
                track.wav = request.FILES["wav"]
            if request.FILES.get("artwork"):
                artwork = request.FILES["artwork"]
                if not (getattr(artwork, "content_type", "") or "").startswith(IMAGE_PREFIX):
                    raise ValueError("Artwork must be an image.")
                track.artwork = artwork
            _apply_preview_window(track, request.data, request.FILES)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)
        track.save()
        return Response(TrackCardSerializer(track, context={"request": request}).data)

    def delete(self, request, track_id):
        track = self._get(request, track_id)
        if not track:
            return Response({"detail": "Track not found."}, status=404)
        if track.orders.exists():
            if track.is_published:
                track.is_published = False
                track.save(update_fields=["is_published"])
            return Response(
                {
                    "detail": "This track has been purchased, so it cannot be deleted. It is hidden from your public profile."
                },
                status=409,
            )
        try:
            track.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": "This track has been purchased, so it cannot be deleted. Hide it instead."
                },
                status=409,
            )
        return Response(status=204)
