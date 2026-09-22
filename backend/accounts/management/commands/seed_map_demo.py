from datetime import date, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Profile
from days.models import Day

# A handful of fictional public accounts spread across real-world cities, so
# the Map tab has something to show immediately without waiting on real
# users to grant geolocation permission.
DEMO_USERS = [
    {"username": "demo_tokyo", "city": "Tokyo", "lat": 35.6762, "lng": 139.6503, "score": 8},
    {"username": "demo_newyork", "city": "New York", "lat": 40.7128, "lng": -74.0060, "score": 6},
    {"username": "demo_london", "city": "London", "lat": 51.5072, "lng": -0.1276, "score": 5},
    {"username": "demo_mumbai", "city": "Mumbai", "lat": 19.0760, "lng": 72.8777, "score": 9},
    {"username": "demo_saopaulo", "city": "São Paulo", "lat": -23.5505, "lng": -46.6333, "score": 7},
    {"username": "demo_capetown", "city": "Cape Town", "lat": -33.9249, "lng": 18.4241, "score": 4},
    {"username": "demo_sydney", "city": "Sydney", "lat": -33.8688, "lng": 151.2093, "score": 8},
    {"username": "demo_cairo", "city": "Cairo", "lat": 30.0444, "lng": 31.2357, "score": 6},
]


class Command(BaseCommand):
    help = "Creates a handful of demo public users with real-world map locations, for verifying the Map tab UI."

    def handle(self, *args, **options):
        created = 0
        for entry in DEMO_USERS:
            user, was_created = User.objects.get_or_create(
                username=entry["username"],
                defaults={"email": f"{entry['username']}@example.com"},
            )
            if was_created:
                user.set_unusable_password()
                user.save()
                created += 1

            profile, _ = Profile.objects.get_or_create(user=user)
            profile.latitude = entry["lat"]
            profile.longitude = entry["lng"]
            profile.location_updated_at = timezone.now()
            profile.save()

            Day.objects.update_or_create(
                user=user,
                date=date.today() - timedelta(days=1),
                defaults={
                    "score": entry["score"],
                    "note": f"Checking in from {entry['city']}.",
                    "visibility": "public",
                },
            )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(DEMO_USERS)} demo map users ({created} newly created)."
        ))
