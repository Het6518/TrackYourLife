from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.views import APIView

from .models import Profile
from .serializers import (
    AvatarSerializer,
    BoardStyleSerializer,
    LocationSerializer,
    LoginSerializer,
    RegisterSerializer,
    ThemeAccentSerializer,
    ThemeBackgroundSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": UserSerializer(user, context={"request": request}).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user, context={"request": request}).data})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = AvatarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = serializer.validated_data["avatar"]
        profile.save()
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def delete(self, request):
        profile = Profile.objects.filter(user=request.user).first()
        if profile and profile.avatar:
            profile.avatar.delete(save=False)
            profile.avatar = ""
            profile.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LocationView(APIView):
    """Stores the coordinates the browser's geolocation API reported for the
    logged-in user, so they can show up as a pin on the Map tab."""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        serializer = LocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.latitude = serializer.validated_data["latitude"]
        profile.longitude = serializer.validated_data["longitude"]
        profile.location_updated_at = timezone.now()
        profile.save()
        return Response(UserSerializer(request.user, context={"request": request}).data)


class BoardStyleView(APIView):
    """Stores the vision board's chosen background — 'transparent' (glass,
    the default) or a specific #rrggbb the user picked."""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        serializer = BoardStyleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.board_background = serializer.validated_data["background"]
        profile.save()
        return Response(UserSerializer(request.user, context={"request": request}).data)


class ThemeBackgroundView(APIView):
    """The app-wide custom background photo a user uploads, overriding the
    automatic weather-based one everywhere it's used."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ThemeBackgroundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile, _ = Profile.objects.get_or_create(user=request.user)
        if profile.theme_background:
            profile.theme_background.delete(save=False)
        profile.theme_background = serializer.validated_data["background"]
        profile.save()
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def delete(self, request):
        profile = Profile.objects.filter(user=request.user).first()
        if profile and profile.theme_background:
            profile.theme_background.delete(save=False)
            profile.theme_background = ""
            profile.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ThemeAccentView(APIView):
    """The app-wide accent color override — blank clears it back to the
    automatic weather-driven accent."""

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        serializer = ThemeAccentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.theme_accent_color = serializer.validated_data["accent_color"]
        profile.save()
        return Response(UserSerializer(request.user, context={"request": request}).data)
