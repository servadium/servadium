import datetime
import uuid
from google.cloud import storage

# Initialize GCS Client
try:
    storage_client = storage.Client()
except Exception as e:
    print(f"Warning: Could not initialize Storage Client: {e}")
    storage_client = None

import os
# Allow overriding bucket name via environment variable
BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "servadium-knowledge-artifacts")

def generate_signed_url(session_id: str) -> str:
    """Generates a v4 signed URL for uploading a video directly to GCS."""
    if not storage_client:
        return ""
        
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob_name = f"sessions/{session_id}/raw_session.mp4"
        blob = bucket.blob(blob_name)
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=30),  # 30 min to complete the upload
            method="PUT",
            content_type="video/mp4",
        )
        return url
    except Exception as e:
        print(f"Warning: Failed to generate signed URL (expected if using local ADC): {e}")
        return ""

