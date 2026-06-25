from pathlib import Path
from uuid import uuid4


def _unique_upload_path(prefix, filename):
    suffix = Path(filename).suffix.lower()
    return f"{prefix}/{uuid4().hex}{suffix}"


def avatar_upload_path(instance, filename):
    return _unique_upload_path("avatars", filename)


def question_image_upload_path(instance, filename):
    return _unique_upload_path("pergunta_imagens", filename)
