from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('visionboard', '0002_goalpin_completed_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='goalpin',
            name='archived',
            field=models.BooleanField(default=False),
        ),
    ]
