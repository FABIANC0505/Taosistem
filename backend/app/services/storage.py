from __future__ import annotations

from pathlib import Path
from uuid import uuid4

import boto3
from fastapi import UploadFile

from app.core.config import settings


class StorageError(Exception):
    pass


def _build_safe_extension(filename: str | None) -> str:
    if not filename or "." not in filename:
        return "bin"
    extension = filename.rsplit(".", 1)[-1].lower().strip()
    if not extension:
        return "bin"
    return "".join(char for char in extension if char.isalnum()) or "bin"


def _build_r2_public_url(key: str) -> str:
    if settings.R2_PUBLIC_BASE_URL:
        base_url = settings.R2_PUBLIC_BASE_URL.rstrip("/")
        return f"{base_url}/{key}"
    if not settings.R2_BUCKET_NAME:
        raise StorageError("R2_BUCKET_NAME no configurado")
    endpoint = settings.r2_endpoint_url
    return f"{endpoint}/{settings.R2_BUCKET_NAME}/{key}"


def _upload_to_r2(content: bytes, key: str, content_type: str | None) -> str:
    if not settings.R2_ACCESS_KEY_ID or not settings.R2_SECRET_ACCESS_KEY:
        raise StorageError("Credenciales de R2 no configuradas")
    if not settings.R2_BUCKET_NAME:
        raise StorageError("R2_BUCKET_NAME no configurado")

    client = boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )

    put_kwargs = {
        "Bucket": settings.R2_BUCKET_NAME,
        "Key": key,
        "Body": content,
    }
    if content_type:
        put_kwargs["ContentType"] = content_type

    client.put_object(**put_kwargs)
    return _build_r2_public_url(key)


def _save_locally(content: bytes, key: str) -> str:
    upload_root = Path(settings.LOCAL_UPLOAD_DIR)
    file_path = upload_root / key
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)
    return f"/{settings.LOCAL_UPLOAD_DIR.strip('/')}/{key}"


async def upload_product_image(file: UploadFile) -> str:
    content = await file.read()
    extension = _build_safe_extension(file.filename)
    key = f"products/{uuid4()}.{extension}"

    if settings.is_r2_enabled:
        return _upload_to_r2(content=content, key=key, content_type=file.content_type)

    return _save_locally(content=content, key=key)
