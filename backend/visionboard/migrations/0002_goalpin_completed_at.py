from django.db import migrations, models
from django.db.models import F


def backfill_completed_at(apps, schema_editor):
    # pins already marked done have no completion time — updated_at is the
    # best available guess
    GoalPin = apps.get_model("visionboard", "GoalPin")
    GoalPin.objects.filter(done=True, completed_at__isnull=True).update(completed_at=F("updated_at"))


class Migration(migrations.Migration):

    dependencies = [
        ('visionboard', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='goalpin',
            name='completed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(backfill_completed_at, migrations.RunPython.noop),
    ]
