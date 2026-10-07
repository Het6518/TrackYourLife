from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import GoalPin
from .serializers import GoalPinSerializer


class GoalPinViewSet(viewsets.ModelViewSet):
    """CRUD for a user's own vision board pins. Creating a pin (which may
    include an image) arrives as multipart; the frequent drag-position
    PATCHes (x/y/rotation/z_index/done) arrive as plain JSON, so both parsers
    are needed.

    Completed pins are history: deleting one from the board only archives it
    (off the board, still in /goals/history/). Deleting an already-archived
    pin removes it for good; unfinished pins are always deleted outright."""

    serializer_class = GoalPinSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        pins = GoalPin.objects.filter(user=self.request.user)
        if self.action == "list":
            pins = pins.filter(archived=False)
        return pins

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, pin):
        if pin.done and not pin.archived:
            pin.archived = True
            pin.save(update_fields=["archived", "updated_at"])
        else:
            pin.delete()

    @action(detail=False)
    def history(self, request):
        pins = self.get_queryset().filter(done=True).order_by("-completed_at", "-id")
        return Response(self.get_serializer(pins, many=True).data)

    def get_serializer_context(self):
        return {"request": self.request}
