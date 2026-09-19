import artists.models
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("artists", "0002_track"),
    ]

    operations = [
        migrations.AddField(
            model_name="track",
            name="preview_audio",
            field=models.FileField(
                blank=True,
                null=True,
                storage=artists.models.protected_storage,
                upload_to="tracks/previews/",
            ),
        ),
        migrations.AddField(
            model_name="track",
            name="duration_seconds",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="track",
            name="preview_start_seconds",
            field=models.FloatField(default=0),
        ),
    ]
