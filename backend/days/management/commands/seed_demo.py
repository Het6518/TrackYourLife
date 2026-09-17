from datetime import date, timedelta
import random

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from days.models import Day


DEMO_USERS = [
    {
        "username": "shah",
        "email": "shah@example.com",
        "password": "demo12345",
        "public_ratio": 0.7,
        "base_score": 7,
        "notes": [
            "Good reset day. Went for a walk, cleared pending work, and slept earlier than usual.",
            "A solid day overall. I stayed focused for most of the afternoon and did not overthink too much.",
            "Had a slow morning but recovered later. Small progress still counts.",
            "Felt calm today. Finished my main task and kept the evening light.",
            "Not perfect, but I showed up. Need to protect sleep better tomorrow.",
        ],
    },
    {
        "username": "y",
        "email": "harsh@example.com",
        "password": "demo12345",
        "public_ratio": 0.9,
        "base_score": 6,
        "notes": [
            "Long coding session. A little tired, but the streak is alive.",
            "Debugged one annoying issue and finally understood what was going wrong.",
            "Mixed day. Productive in patches, distracted in between.",
            "Good learning day. Revised Django REST Framework and cleaned up old notes.",
            "Energy dipped after lunch, but I still completed the important work.",
        ],
    },
    {
        "username": "maya",
        "email": "maya@example.com",
        "password": "demo12345",
        "public_ratio": 0.55,
        "base_score": 8,
        "notes": [
            "Peaceful day. Journaled in the morning and spent time away from screens.",
            "Very good mood today. Finished errands early and cooked dinner at home.",
            "Felt grateful and steady. Nothing huge happened, just a clean day.",
            "Great workout, better focus, and no late-night scrolling.",
            "Social day. Met friends and came back feeling lighter.",
        ],
    },
    {
        "username": "devansh",
        "email": "devansh@example.com",
        "password": "demo12345",
        "public_ratio": 0.45,
        "base_score": 5,
        "notes": [
            "Average day. Got some things done but wasted more time than I wanted.",
            "Stressful start, better evening. Need to stop checking my phone first thing.",
            "Low energy. I did the bare minimum and called it enough.",
            "Too many context switches today. Tomorrow needs a simpler plan.",
            "Small win: cleaned my desk and planned the next three tasks.",
        ],
    },
]

LOW_NOTES = [
    "Rough day. Felt scattered and could not get into a rhythm.",
    "Bad sleep made everything harder. Keeping this honest so I can notice the pattern.",
    "Not my best. I avoided the main task and felt guilty about it later.",
]

HIGH_NOTES = [
    "Excellent day. Deep work, good food, and a genuinely calm evening.",
    "One of the better days this month. I felt present and capable.",
    "Strong momentum today. Finished more than expected without burning out.",
]


class Command(BaseCommand):
    help = "Seed demo TrackYourLife users and day entries."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=120,
            help="How many past days to generate for each demo user.",
        )

    def handle(self, *args, **options):
        random.seed(42)
        days_back = options["days"]
        end = date.today()
        start = end - timedelta(days=days_back - 1)

        for profile in DEMO_USERS:
            user, created = User.objects.get_or_create(
                username=profile["username"],
                defaults={"email": profile["email"]},
            )
            user.email = profile["email"]
            user.set_password(profile["password"])
            user.save()

            Day.objects.filter(user=user, date__gte=start, date__lte=end).delete()

            entries = []
            for offset in range(days_back):
                current = start + timedelta(days=offset)

                if random.random() < 0.18:
                    continue

                weekday_bonus = 1 if current.weekday() in (5, 6) else 0
                drift = random.choice([-2, -1, 0, 0, 1, 1, 2])
                score = max(1, min(10, profile["base_score"] + weekday_bonus + drift))

                if score <= 3:
                    note = random.choice(LOW_NOTES)
                elif score >= 8:
                    note = random.choice(HIGH_NOTES)
                else:
                    note = random.choice(profile["notes"])

                entries.append(
                    Day(
                        user=user,
                        date=current,
                        score=score,
                        note=note,
                        is_public=random.random() < profile["public_ratio"],
                    )
                )

            Day.objects.bulk_create(entries)
            state = "created" if created else "updated"
            self.stdout.write(
                self.style.SUCCESS(
                    f"{state} {user.username}: {len(entries)} entries, password demo12345"
                )
            )

        self.stdout.write(self.style.SUCCESS("Seed data ready."))
