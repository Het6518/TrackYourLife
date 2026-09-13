from rest_framework import serializers
from .models import Day

class DaySerializer(serializers.ModelSerializer):
     class Meta:
        model = Day
        fields = [
            "id",
            "date",
            "score",
            "note",
            "is_public",
            "created_at",
            "updated_at",
        ]