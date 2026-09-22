from rest_framework import serializers

from .models import Song

MAX_AUDIO_BYTES = 15 * 1024 * 1024  # 15 MB — a personal library, not a streaming host
MAX_COVER_BYTES = 2 * 1024 * 1024


class SongSerializer(serializers.ModelSerializer):
    audio_url = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = ["id", "title", "artist", "audio", "cover", "audio_url", "cover_url", "created_at"]
        extra_kwargs = {"audio": {"write_only": True}, "cover": {"write_only": True, "required": False}}

    def get_audio_url(self, song):
        request = self.context.get("request")
        return request.build_absolute_uri(song.audio.url) if request and song.audio else None

    def get_cover_url(self, song):
        request = self.context.get("request")
        return request.build_absolute_uri(song.cover.url) if request and song.cover else None

    def validate_audio(self, audio):
        if audio.size > MAX_AUDIO_BYTES:
            raise serializers.ValidationError("Audio file must be 15 MB or smaller.")
        return audio

    def validate_cover(self, cover):
        if cover.size > MAX_COVER_BYTES:
            raise serializers.ValidationError("Cover image must be 2 MB or smaller.")
        return cover
