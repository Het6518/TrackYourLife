from rest_framework import serializers

from accounts.models import avatar_url_for


class PublicUserSerializer(serializers.Serializer):
    """Minimal user shape shared across friends endpoints — deliberately not
    the accounts app's UserSerializer, to avoid a cross-app import cycle and
    because friends never need email/location here."""

    id = serializers.IntegerField()
    username = serializers.CharField()
    avatar_url = serializers.SerializerMethodField()

    def get_avatar_url(self, user):
        return avatar_url_for(user, self.context.get("request"))


class FriendshipSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    user = serializers.SerializerMethodField()  # the *other* person, from the caller's perspective
    direction = serializers.SerializerMethodField()  # "incoming" | "outgoing"

    def get_user(self, friendship):
        request = self.context.get("request")
        me = request.user
        other = friendship.to_user if friendship.from_user_id == me.id else friendship.from_user
        return PublicUserSerializer(other, context=self.context).data

    def get_direction(self, friendship):
        request = self.context.get("request")
        return "outgoing" if friendship.from_user_id == request.user.id else "incoming"


class SendRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
