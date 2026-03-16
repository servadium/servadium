import os
from dotenv import load_dotenv
load_dotenv()

try:
    import firebase_admin
    from firebase_admin import credentials, auth

    creds_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    print(f"GOOGLE_APPLICATION_CREDENTIALS: {creds_path}")

    if creds_path and os.path.exists(creds_path):
        cred = credentials.Certificate(creds_path)
        app = firebase_admin.initialize_app(cred)
        print("Firebase Admin initialised with service account: OK")
    else:
        app = firebase_admin.initialize_app()
        print("Firebase Admin initialised with ADC: OK")

    print("Firebase Auth: OK")
except Exception as e:
    import traceback
    print(f"Firebase FAILED: {traceback.format_exc()}")
