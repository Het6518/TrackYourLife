from rest_framework import serializers
from .models import Day


class DaySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Day
        fields = [
            "id",
            "username",
            "date",
            "score",
            "note",
            "is_public",
            "created_at",
            "updated_at",
        ]

    def validate_score(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Score must be between 1 and 10.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        date = attrs.get("date", getattr(self.instance, "date", None))

        if user and user.is_authenticated and date:
            exists = Day.objects.filter(user=user, date=date)
            if self.instance:
                exists = exists.exclude(pk=self.instance.pk)
            if exists.exists():
                raise serializers.ValidationError(
                    {"date": "You already have an entry for this date."}
                )

        return attrs
