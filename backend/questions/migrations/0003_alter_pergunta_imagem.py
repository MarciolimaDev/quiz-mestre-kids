import core.upload_paths
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("questions", "0002_pergunta_imagem"),
    ]

    operations = [
        migrations.AlterField(
            model_name="pergunta",
            name="imagem",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to=core.upload_paths.question_image_upload_path,
                verbose_name="imagem",
            ),
        ),
    ]
