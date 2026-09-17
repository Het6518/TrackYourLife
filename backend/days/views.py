from django.contrib.auth.models import User
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Day
from .serializers import DaySerializer


class DayViewSet(viewsets.ModelViewSet):
    serializer_class = DaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Day.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def public_users(request):
    users = (
        User.objects.filter(days__is_public=True)
        .distinct()
        .order_by("username")
        .values("id", "username")
    )
    return Response(list(users))


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def public_user_days(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    days = Day.objects.filter(user=user, is_public=True)
    return Response(
        {
            "user": {"id": user.id, "username": user.username},
            "days": DaySerializer(days, many=True).data,
        }
    )
