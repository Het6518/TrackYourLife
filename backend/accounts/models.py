from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", blank=True)
    # captured from the browser's geolocation API on login (best-effort; a
    # user who denies the permission simply has null coordinates and is left
    # off the Map tab)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location_updated_at = models.DateTimeField(null=True, blank=True)
    # the vision board's background: "transparent" (the default glass look,
    # weather photo shows through) or a "#rrggbb" the user picked themselves
    board_background = models.CharField(max_length=20, default="transparent")

    def __str__(self):
        return f"Profile of {self.user.username}"


def avatar_url_for(user, request=None):
    profile = Profile.objects.filter(user=user).first()
    if not profile or not profile.avatar:
        return None
    url = profile.avatar.url
    return request.build_absolute_uri(url) if request else url


def location_for(user):
    profile = Profile.objects.filter(user=user).first()
    if not profile or profile.latitude is None or profile.longitude is None:
        return None
    return {"lat": profile.latitude, "lng": profile.longitude}


def board_background_for(user):
    profile = Profile.objects.filter(user=user).first()
    return profile.board_background if profile else "transparent"
