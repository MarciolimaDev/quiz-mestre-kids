from django.conf import settings
from uuid import uuid4

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Testa o storage padrão de media salvando um arquivo pequeno."

    def handle(self, *args, **options):
        name = f"storage-health/{uuid4().hex}.txt"
        content = ContentFile(b"ok\n")

        self.stdout.write(f"Storage backend: {default_storage.__class__.__module__}.{default_storage.__class__.__name__}")
        self.stdout.write(f"USE_REMOTE_MEDIA_STORAGE: {getattr(settings, 'USE_REMOTE_MEDIA_STORAGE', False)}")
        self.stdout.write(f"R2_BUCKET: {getattr(settings, 'R2_BUCKET', None)}")
        self.stdout.write(f"R2_ENDPOINT: {getattr(settings, 'R2_ENDPOINT', None)}")
        self.stdout.write(f"AWS_S3_REGION_NAME: {getattr(settings, 'AWS_S3_REGION_NAME', None)}")
        self.stdout.write(f"AWS_S3_ADDRESSING_STYLE: {getattr(settings, 'AWS_S3_ADDRESSING_STYLE', None)}")
        self.stdout.write(f"AWS_S3_CUSTOM_DOMAIN: {getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None)}")
        self.stdout.write(f"MEDIA_URL: {getattr(settings, 'MEDIA_URL', None)}")

        try:
            saved_name = default_storage.save(name, content)
            url = default_storage.url(saved_name)
        except Exception as exc:
            raise CommandError(f"Falha ao salvar arquivo no storage: {exc.__class__.__name__}: {exc}") from exc

        self.stdout.write(self.style.SUCCESS(f"Upload OK: {saved_name}"))
        self.stdout.write(self.style.SUCCESS(f"URL: {url}"))
