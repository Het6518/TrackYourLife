from rest_framework import serializers

from .models import GoalPin

MAX_IMAGE_BYTES = 5 * 1024 * 1024


class GoalPinSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GoalPin
        fields = [
            "id", "kind", "title", "body", "image", "image_url", "color", "done",
            "x", "y", "rotation", "z_index", "created_at", "updated_at",
        ]
        extra_kwargs = {"image": {"write_only": True, "required": False}}

    def get_image_url(self, pin):
        request = self.context.get("request")
        return request.build_absolute_uri(pin.image.url) if request and pin.image else None

    def validate_image(self, image):
        if image.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError("Image must be 5 MB or smaller.")
        return image

    def validate(self, attrs):
        kind = attrs.get("kind", getattr(self.instance, "kind", "text"))
        image = attrs.get("image", getattr(self.instance, "image", None))
        title = attrs.get("title", getattr(self.instance, "title", ""))
        body = attrs.get("body", getattr(self.instance, "body", ""))
        if kind == "image" and not image and not self.instance:
            raise serializers.ValidationError({"image": "An image pin needs an image."})
        if kind == "text" and not title and not body:
            raise serializers.ValidationError({"title": "A text pin needs a title or a note."})
        return attrs
