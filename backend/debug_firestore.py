import os
from dotenv import load_dotenv
load_dotenv()

print(f"GOOGLE_CLOUD_PROJECT: {os.getenv('GOOGLE_CLOUD_PROJECT')}")
print(f"GOOGLE_APPLICATION_CREDENTIALS: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")

try:
    from google.cloud import firestore
    db = firestore.Client(project=os.getenv('GOOGLE_CLOUD_PROJECT'))
    # Try a test write
    db.collection("_debug").document("test").set({"ok": True})
    print("Firestore write: OK")
    # Try a test read
    doc = db.collection("_debug").document("test").get()
    print(f"Firestore read: OK — {doc.to_dict()}")
    # Clean up
    db.collection("_debug").document("test").delete()
    print("Firestore delete: OK")
except Exception as e:
    import traceback
    print(f"Firestore FAILED: {traceback.format_exc()}")
