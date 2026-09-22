from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q


class Friendship(models.Model):
    """A friend request that may still be pending, or has been accepted.
    Directional (from_user asked to_user), but once accepted the
    relationship is treated as mutual everywhere it's queried."""

    STATUS_CHOICES = [("pending", "Pending"), ("accepted", "Accepted")]

    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="friend_requests_sent")
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="friend_requests_received")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["from_user", "to_user"], name="one_request_per_pair")
        ]

    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username} ({self.status})"


def are_friends(user_a, user_b):
    if not user_a or not user_b or user_a == user_b or not user_a.is_authenticated:
        return False
    return Friendship.objects.filter(
        Q(from_user=user_a, to_user=user_b) | Q(from_user=user_b, to_user=user_a),
        status="accepted",
    ).exists()


def friendship_between(user_a, user_b):
    return Friendship.objects.filter(
        Q(from_user=user_a, to_user=user_b) | Q(from_user=user_b, to_user=user_a)
    ).first()


def friends_of(user):
    sent = Friendship.objects.filter(from_user=user, status="accepted").values_list("to_user", flat=True)
    received = Friendship.objects.filter(to_user=user, status="accepted").values_list("from_user", flat=True)
    return User.objects.filter(id__in=list(sent) + list(received))
