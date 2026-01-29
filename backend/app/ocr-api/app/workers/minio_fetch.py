import os
from minio import Minio


def get_minio():
    endpoint = os.getenv("MINIO_ENDPOINT", "http://minio:9000").replace("http://", "")
    access = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    secret = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    return Minio(endpoint, access_key=access, secret_key=secret, secure=False)


def fetch_object_bytes(bucket: str, object_key: str) -> bytes:
    minio = get_minio()
    resp = minio.get_object(bucket, object_key)
    try:
        return resp.read()
    finally:
        resp.close()
        resp.release_conn()
