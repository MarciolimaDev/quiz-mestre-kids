import core.upload_paths
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("students", "0003_aluno_pontos"),
    ]

    operations = [
        migrations.AlterField(
            model_name="avatar",
            name="imagem",
            field=models.ImageField(upload_to=core.upload_paths.avatar_upload_path),
        ),
    ]
