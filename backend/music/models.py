from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.storage import storages
from django.db import models


def audio_storage():
    # Cloudinary files audio under its "video" resource type; the default
    # image storage would reject mp3s
    if settings.CLOUDINARY_ENABLED:
        from cloudinary_storage.storage import VideoMediaCloudinaryStorage

        return VideoMediaCloudinaryStorage()
    return storages["default"]


class Song(models.Model):
    """A track in a user's personal library — they upload it once, then can
    browse and play it anytime from the mini player."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="songs")
    title = models.CharField(max_length=120)
    artist = models.CharField(max_length=120, blank=True)
    audio = models.FileField(upload_to="songs/", storage=audio_storage)
    cover = models.ImageField(upload_to="song_covers/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.user.username}"
