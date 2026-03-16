from google.cloud import firestore

# Initialize Firestore DB globally
# This relies on GOOGLE_APPLICATION_CREDENTIALS being set in the environment,
# or running in an environment with implicit credentials (like Cloud Run).
# However, since we might test locally, we can either rely on default credentials
# or explicitly set them if needed.

try:
    db = firestore.Client()
except Exception as e:
    print(f"Warning: Could not initialize Firestore Client: {e}")
    db = None

print(f"DB initialised: {db}")
