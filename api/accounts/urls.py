from django.urls import path

from .views import MeView, OTPRequestView, OTPVerifyView

urlpatterns = [
    path("otp/request", OTPRequestView.as_view()),
    path("otp/verify", OTPVerifyView.as_view()),
    path("me", MeView.as_view()),
]
