# Kafka Contract (TUTUM)

## Topics

- asset.import.request
- news.ingest

## Message Schema

### asset.import.request

{
"import_id": "...",
"user_id": "...",
"object_key": "...",
"type": "OCR_IMAGE"
}

### news.ingest

{
"source": "example",
"title": "headline",
"url": "https://...",
"publishedAt": "2026-01-01T00:00:00Z",
"summary": "..."
}

## Consumer Groups

- ocr-workers
- news-workers
