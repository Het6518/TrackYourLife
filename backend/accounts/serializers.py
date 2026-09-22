import re

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import avatar_url_for, board_background_for, location_for

HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    board_background = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar_url", "location", "board_background"]

    def get_avatar_url(self, user):
        return avatar_url_for(user, self.context.get("request"))

    def get_location(self, user):
        return location_for(user)

    def get_board_background(self, user):
        return board_background_for(user)


class LocationSerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)


class BoardStyleSerializer(serializers.Serializer):
    background = serializers.CharField(max_length=20)

    def validate_background(self, value):
        if value != "transparent" and not HEX_COLOR_RE.match(value):
            raise serializers.ValidationError("Must be 'transparent' or a #rrggbb color.")
        return value


MAX_AVATAR_BYTES = 2 * 1024 * 1024


class AvatarSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, image):
        if image.size > MAX_AVATAR_BYTES:
            raise serializers.ValidationError("Avatar must be 2 MB or smaller.")
        return image


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username=attrs.get("username"),
            password=attrs.get("password"),
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        attrs["user"] = user
        return attrs
