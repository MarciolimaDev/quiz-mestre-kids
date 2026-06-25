from io import BytesIO
from pathlib import Path
from uuid import uuid4

from django.core.files.base import ContentFile
from PIL import Image, ImageOps


def image_to_webp(uploaded_file, *, prefix, max_size, quality=82):
    image = Image.open(uploaded_file)
    image = ImageOps.exif_transpose(image)
    image.thumbnail(max_size, Image.Resampling.LANCZOS)

    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

    output = BytesIO()
    image.save(output, format="WEBP", quality=quality, method=6)
    output.seek(0)

    original_stem = Path(uploaded_file.name).stem[:40] or prefix
    filename = f"{original_stem}-{uuid4().hex[:12]}.webp"
    return ContentFile(output.read(), name=filename)
