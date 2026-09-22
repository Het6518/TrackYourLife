from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import GoalPin
from .serializers import GoalPinSerializer


class GoalPinViewSet(viewsets.ModelViewSet):
    """CRUD for a user's own vision board pins. Creating a pin (which may
    include an image) arrives as multipart; the frequent drag-position
    PATCHes (x/y/rotation/z_index/done) arrive as plain JSON, so both parsers
    are needed."""

    serializer_class = GoalPinSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return GoalPin.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_serializer_context(self):
        return {"request": self.request}
