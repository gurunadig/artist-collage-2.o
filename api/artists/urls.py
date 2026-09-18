from django.urls import path

from .views import (
    ArtistDetailView,
    ArtistDirectoryView,
    LookupView,
    MeProfileImageView,
    MeProfileView,
    MeTrackDetailView,
    MeTrackListCreateView,
    PublicTrackDetailView,
    TrackPreviewView,
)

urlpatterns = [
    path("lookups", LookupView.as_view()),
    path("artists", ArtistDirectoryView.as_view()),
    path("artists/<slug:slug>/tracks/<slug:track_slug>/preview", TrackPreviewView.as_view()),
    path("artists/<slug:slug>/tracks/<slug:track_slug>", PublicTrackDetailView.as_view()),
    path("artists/<slug:slug>", ArtistDetailView.as_view()),
    path("me/profile/image", MeProfileImageView.as_view()),
    path("me/profile", MeProfileView.as_view()),
    path("me/tracks/<uuid:track_id>", MeTrackDetailView.as_view()),
    path("me/tracks", MeTrackListCreateView.as_view()),
]
