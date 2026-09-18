from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPChallenge, User
from .otp import hash_otp, issue_otp, normalize_email, normalize_phone
from .serializers import OTPRequestSerializer, OTPVerifySerializer, UserSerializer
from .throttles import OTPRequestThrottle, OTPVerifyThrottle


def _tokens_for(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    }


class OTPRequestView(APIView):
    throttle_classes = [OTPRequestThrottle]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            email = normalize_email(data["email"]) if data["email"] else None
            phone = normalize_phone(data["phone"]) if data["phone"] else None
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        _, payload = issue_otp(
            email=email,
            phone=phone,
            purpose=data["purpose"],
            model=OTPChallenge,
        )
        return Response(payload, status=status.HTTP_200_OK)


class OTPVerifyView(APIView):
    throttle_classes = [OTPVerifyThrottle]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            email = normalize_email(data["email"]) if data["email"] else None
            phone = normalize_phone(data["phone"]) if data["phone"] else None
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        filters = {"consumed_at__isnull": True}
        if email:
            filters["email"] = email
        else:
            filters["phone"] = phone

        challenge = OTPChallenge.objects.filter(**filters).order_by("-created_at").first()
        if not challenge:
            return Response({"detail": "Request a new code."}, status=status.HTTP_400_BAD_REQUEST)
        if challenge.expires_at < timezone.now():
            return Response({"detail": "That code has expired."}, status=status.HTTP_400_BAD_REQUEST)
        if challenge.attempts >= challenge.max_attempts:
            return Response({"detail": "Too many attempts. Request a new code."}, status=status.HTTP_400_BAD_REQUEST)

        challenge.attempts += 1
        challenge.save(update_fields=["attempts"])
        if not hmac_ok(challenge.code_hash, data["code"]):
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)

        challenge.consumed_at = timezone.now()
        challenge.save(update_fields=["consumed_at"])

        user, created = _get_or_create_user(email=email, phone=phone)
        if user.is_suspended or not user.is_active:
            return Response({"detail": "This account is suspended."}, status=status.HTTP_403_FORBIDDEN)

        payload = _tokens_for(user)
        payload["is_new"] = created
        return Response(payload, status=status.HTTP_200_OK)


def hmac_ok(stored_hash: str, code: str) -> bool:
    return stored_hash == hash_otp(code.strip())


def _get_or_create_user(*, email=None, phone=None):
    lookup = {"email": email} if email else {"phone": phone}
    user = User.objects.filter(**lookup).first()
    if user:
        return user, False
    username = email or phone
    user = User.objects.create_user(email=email, phone=phone, username=username)
    return user, True


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
