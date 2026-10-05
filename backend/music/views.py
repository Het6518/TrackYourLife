import logging

from rest_framework import permissions, serializers, viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from .models import Song
from .serializers import SongSerializer

logger = logging.getLogger(__name__)


class SongViewSet(viewsets.ModelViewSet):
    """A user's personal song library — upload, browse, play, delete. Songs
    are private to the uploader, same as their day entries."""

    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Song.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except Exception as exc:  # storage backend failure — report it instead of a bare 500
            logger.exception("Song upload failed")
            raise serializers.ValidationError({"audio": f"Couldn't store that file: {exc}"})

    def get_serializer_context(self):
        return {"request": self.request}
