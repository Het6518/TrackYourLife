from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

PAPER_COLORS = [
    ("cream", "Cream"),
    ("accent", "Accent"),
    ("accent-soft", "Accent soft"),
    ("slate", "Slate"),
]


class GoalPin(models.Model):
    """One item pinned to a user's vision board — a sticky note (text) or a
    photo (image), positioned freely like a real corkboard."""

    KIND_CHOICES = [("text", "Text"), ("image", "Image")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="goal_pins")
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="text")
    title = models.CharField(max_length=120, blank=True)
    body = models.TextField(blank=True)
    image = models.ImageField(upload_to="vision_board/", blank=True)
    color = models.CharField(max_length=20, choices=PAPER_COLORS, default="cream")
    done = models.BooleanField(default=False)

    # position as a percentage of the board (0-100), so it stays correctly
    # placed at any board size/viewport
    x = models.FloatField(default=50, validators=[MinValueValidator(0), MaxValueValidator(100)])
    y = models.FloatField(default=50, validators=[MinValueValidator(0), MaxValueValidator(100)])
    rotation = models.FloatField(default=0, validators=[MinValueValidator(-25), MaxValueValidator(25)])
    z_index = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["z_index", "created_at"]

    def __str__(self):
        return f"{self.title or self.kind} — {self.user.username}"
