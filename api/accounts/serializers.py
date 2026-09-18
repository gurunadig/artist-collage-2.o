from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "phone", "role", "is_suspended", "date_joined")
        read_only_fields = fields


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    purpose = serializers.ChoiceField(choices=["signup", "login"])

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip()
        phone = (attrs.get("phone") or "").strip()
        if bool(email) == bool(phone):
            raise serializers.ValidationError("Provide either an email or a phone number.")
        attrs["email"] = email or None
        attrs["phone"] = phone or None
        return attrs


class OTPVerifySerializer(OTPRequestSerializer):
    code = serializers.CharField(min_length=4, max_length=8)
