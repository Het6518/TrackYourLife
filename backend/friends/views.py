from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import avatar_url_for

from .models import Friendship, friendship_between, friends_of
from .serializers import FriendshipSerializer, PublicUserSerializer, SendRequestSerializer


class FriendsListView(APIView):
    """Your accepted friends."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        people = friends_of(request.user).order_by("username")
        return Response(PublicUserSerializer(people, many=True, context={"request": request}).data)


class FriendRequestsView(APIView):
    """Pending requests, split into what's waiting on you and what you're
    waiting on someone else for."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        incoming = Friendship.objects.filter(to_user=request.user, status="pending").select_related("from_user", "to_user")
        outgoing = Friendship.objects.filter(from_user=request.user, status="pending").select_related("from_user", "to_user")
        ctx = {"request": request}
        return Response({
            "incoming": FriendshipSerializer(incoming, many=True, context=ctx).data,
            "outgoing": FriendshipSerializer(outgoing, many=True, context=ctx).data,
        })

    def post(self, request):
        serializer = SendRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]

        if username == request.user.username:
            return Response({"detail": "You can't friend yourself."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "No user with that username."}, status=status.HTTP_404_NOT_FOUND)

        existing = friendship_between(request.user, target)
        if existing:
            if existing.status == "accepted":
                return Response({"detail": "You're already friends."}, status=status.HTTP_400_BAD_REQUEST)
            if existing.from_user_id == request.user.id:
                return Response({"detail": "You already sent a request."}, status=status.HTTP_400_BAD_REQUEST)
            # they'd already requested us — accepting instead of creating a
            # mirrored duplicate row is what a real "friends" flow does
            existing.status = "accepted"
            existing.responded_at = timezone.now()
            existing.save()
            return Response(FriendshipSerializer(existing, context={"request": request}).data, status=status.HTTP_200_OK)

        friendship = Friendship.objects.create(from_user=request.user, to_user=target)
        return Response(FriendshipSerializer(friendship, context={"request": request}).data, status=status.HTTP_201_CREATED)


class RespondFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        try:
            friendship = Friendship.objects.get(pk=pk, to_user=request.user, status="pending")
        except Friendship.DoesNotExist:
            return Response({"detail": "No pending request found."}, status=status.HTTP_404_NOT_FOUND)

        if action == "accept":
            friendship.status = "accepted"
            friendship.responded_at = timezone.now()
            friendship.save()
            return Response(FriendshipSerializer(friendship, context={"request": request}).data)
        if action == "decline":
            friendship.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Unknown action."}, status=status.HTTP_400_BAD_REQUEST)


class RemoveFriendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, username):
        try:
            target = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "No user with that username."}, status=status.HTTP_404_NOT_FOUND)

        friendship = friendship_between(request.user, target)
        if not friendship or friendship.status != "accepted":
            return Response({"detail": "You're not friends with this user."}, status=status.HTTP_404_NOT_FOUND)
        friendship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SearchUsersView(APIView):
    """Search by username so you can find someone to friend, with each
    result tagged by your current relationship to them."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response([])

        matches = (
            User.objects.filter(username__icontains=query)
            .exclude(id=request.user.id)
            .order_by("username")[:20]
        )

        results = []
        for user in matches:
            friendship = friendship_between(request.user, user)
            if not friendship:
                relationship = "none"
            elif friendship.status == "accepted":
                relationship = "friends"
            elif friendship.from_user_id == request.user.id:
                relationship = "pending_outgoing"
            else:
                relationship = "pending_incoming"
            results.append({
                "id": user.id,
                "username": user.username,
                "avatar_url": avatar_url_for(user, request),
                "relationship": relationship,
                "request_id": friendship.id if friendship and friendship.status == "pending" else None,
            })
        return Response(results)
