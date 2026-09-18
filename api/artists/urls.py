from django.urls import path

from .views import ArtistDetailView, ArtistDirectoryView, LookupView, MeProfileImageView, MeProfileView

urlpatterns = [
    path("lookups", LookupView.as_view()),
    path("artists", ArtistDirectoryView.as_view()),
    path("artists/<slug:slug>", ArtistDetailView.as_view()),
    path("me/profile/image", MeProfileImageView.as_view()),
    path("me/profile", MeProfileView.as_view()),
]
