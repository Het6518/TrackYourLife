from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

VISIBILITY_CHOICES = [
    ("private", "Private"),
    ("friends", "Friends"),
    ("public", "Public"),
]


class Day(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="days")
    date = models.DateField()
    score = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    note = models.TextField(blank=True)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default="private")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="one_entry_per_day")
        ]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.user.username} - {self.date}" #this function returns the username and date of the day entry in a string format. it will be used when we print the Day object or display it in the Django admin interface.
