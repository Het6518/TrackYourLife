import re

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    Profile,
    avatar_url_for,
    board_background_for,
    location_for,
    theme_accent_color_for,
    theme_background_url_for,
    theme_effect_for,
)

HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    board_background = serializers.SerializerMethodField()
    theme_background_url = serializers.SerializerMethodField()
    theme_accent_color = serializers.SerializerMethodField()
    theme_effect = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "avatar_url", "location", "board_background",
            "theme_background_url", "theme_accent_color", "theme_effect",
        ]

    def get_avatar_url(self, user):
        return avatar_url_for(user, self.context.get("request"))

    def get_location(self, user):
        return location_for(user)

    def get_board_background(self, user):
        return board_background_for(user)

    def get_theme_background_url(self, user):
        return theme_background_url_for(user, self.context.get("request"))

    def get_theme_accent_color(self, user):
        return theme_accent_color_for(user)

    def get_theme_effect(self, user):
        return theme_effect_for(user)


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
MAX_THEME_BACKGROUND_BYTES = 8 * 1024 * 1024


class AvatarSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, image):
        if image.size > MAX_AVATAR_BYTES:
            raise serializers.ValidationError("Avatar must be 2 MB or smaller.")
        return image


class ThemeBackgroundSerializer(serializers.Serializer):
    background = serializers.ImageField()

    def validate_background(self, image):
        if image.size > MAX_THEME_BACKGROUND_BYTES:
            raise serializers.ValidationError("Background image must be 8 MB or smaller.")
        return image


class ThemeAccentSerializer(serializers.Serializer):
    # blank string means "clear it — no accent override"
    accent_color = serializers.CharField(max_length=7, allow_blank=True)

    def validate_accent_color(self, value):
        if value and not HEX_COLOR_RE.match(value):
            raise serializers.ValidationError("Must be blank or a #rrggbb color.")
        return value


class ThemeEffectSerializer(serializers.Serializer):
    # blank string means "none"
    effect = serializers.ChoiceField(choices=[c for c, _ in Profile.THEME_EFFECT_CHOICES], allow_blank=True)


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
