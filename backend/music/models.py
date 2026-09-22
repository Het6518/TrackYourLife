from django.contrib.auth.models import User
from django.db import models


class Song(models.Model):
    """A track in a user's personal library — they upload it once, then can
    browse and play it anytime from the mini player."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="songs")
    title = models.CharField(max_length=120)
    artist = models.CharField(max_length=120, blank=True)
    audio = models.FileField(upload_to="songs/")
    cover = models.ImageField(upload_to="song_covers/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} — {self.user.username}"
