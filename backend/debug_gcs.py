import os
from dotenv import load_dotenv
load_dotenv()

bucket_name = os.getenv('GCS_BUCKET_NAME')
print(f"GCS_BUCKET_NAME: {bucket_name}")

if not bucket_name:
    print("CRITICAL: GCS_BUCKET_NAME is not set in .env")
else:
    try:
        from google.cloud import storage
        client = storage.Client(project=os.getenv('GOOGLE_CLOUD_PROJECT'))
        bucket = client.bucket(bucket_name)
        exists = bucket.exists()
        print(f"Bucket exists: {exists}")
        if not exists:
            print(f"CRITICAL: Bucket {bucket_name} does not exist — create it in GCS console")
    except Exception as e:
        import traceback
        print(f"GCS FAILED: {traceback.format_exc()}")
