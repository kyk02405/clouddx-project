import os, json
from kafka import KafkaConsumer
from app.core.db import get_db
from app.workers.minio_fetch import fetch_object_bytes
from app.workers.ocr_engine import extract_text_from_image_bytes


def parse_bucket_object(path: str) -> tuple[str, str]:
    # expects "bucket/some/key.png"
    parts = path.split("/", 1)
    if len(parts) != 2:
        raise ValueError("object_key must be 'bucket/path'")
    return parts[0], parts[1]


def simple_parse_assets(text: str) -> list[dict]:
    """
    MVP parser: very naive.
    Replace later with regex rules per exchange screenshot formats.
    """
    # Example output stub:
    # Ideally parse symbols/amounts from lines.
    return [{"symbol": "BTC", "amount": 0.1}, {"symbol": "TSLA", "amount": 2}]


def run():
    brokers = os.getenv("KAFKA_BROKERS", "kafka:9092")
    consumer = KafkaConsumer(
        "asset.import.request",
        bootstrap_servers=brokers.split(","),
        group_id="ocr-workers",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda b: json.loads(b.decode("utf-8")),
    )

    db = get_db()

    for msg in consumer:
        job = msg.value
        import_id = job["import_id"]
        object_key = job["object_key"]  # "bucket/path/to/file.png"

        bucket, key = parse_bucket_object(object_key)
        img_bytes = fetch_object_bytes(bucket, key)

        raw_text = extract_text_from_image_bytes(img_bytes)
        items = simple_parse_assets(raw_text)

        db["draft_assets"].update_one(
            {"import_id": import_id},
            {
                "$set": {
                    "import_id": import_id,
                    "raw_text": raw_text,
                    "items": items,
                    "status": "DRAFT",
                }
            },
            upsert=True,
        )

        print(f"[OCR] import_id={import_id} draft_items={len(items)}")


if __name__ == "__main__":
    run()
