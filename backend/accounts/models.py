from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", blank=True)

    def __str__(self):
        return f"Profile of {self.user.username}"


def avatar_url_for(user, request=None):
    profile = Profile.objects.filter(user=user).first()
    if not profile or not profile.avatar:
        return None
    url = profile.avatar.url
    return request.build_absolute_uri(url) if request else url
