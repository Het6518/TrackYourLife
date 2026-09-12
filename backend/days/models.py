from django.db import models

# Create your models here.
#Django projects are divided into apps, where each app handles one particular part of the application.

# Our days app will handle the core feature:

# User
#   ↓
# Daily Entry
#   ├── Date
#   ├── Score (1–10)
#   ├── Note
#   └── Public / Private

from django.contrib.auth.models import User #this is the built-in User model provided by Django for user authentication and management.
class Day(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE,
                           related_name = "days") #This line defines a foreign key relationship between the Day model and the User model. Each Day entry is associated with a specific user.
  date = models.DateField()
  score = models.PositiveIntegerField()
  note = models.TextField(blank=True)
  is_public = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  class Meta:
    constraints = [models.UniqueConstraint(fields=['user', 'date'], name='one_entry_per_day')] #This constraint ensures that each user can only have one entry per date, preventing duplicate entries for the same day. combination of user and date must be unique across all Day entries.
    ordering = ['-date'] #This line specifies the default ordering of Day entries when queried from the database. The '-' sign indicates descending order, so entries will be ordered from the most recent date to the oldest.

    def __str__(self):
        return f"{self.user.username} - {self.date}" #This method defines how instances of the Day model will be represented as strings. It returns a string that includes the username of the associated user, the date of the entry, and the score. This is useful for debugging and displaying entries in the Django admin interface or other parts of the application.