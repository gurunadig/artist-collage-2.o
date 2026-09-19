from django.urls import path

from .views import CreateOrderView, LibraryView, SalesView, VerifyOrderView, WebhookView

urlpatterns = [
    path("orders", CreateOrderView.as_view()),
    path("orders/<uuid:order_id>/verify", VerifyOrderView.as_view()),
    path("payments/webhook", WebhookView.as_view()),
    path("me/library", LibraryView.as_view()),
    path("me/sales", SalesView.as_view()),
]
