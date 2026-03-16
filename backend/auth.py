import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# Initialize Firebase Admin
cred_path = os.path.join(os.path.dirname(__file__), "firebase-credentials.json")
try:
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to Application Default Credentials for Cloud Run
        firebase_admin.initialize_app()
except ValueError:
    # Already initialized
    pass
except Exception as e:
    print(f"Warning: Could not initialize Firebase Admin SDK: {e}")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail={"error": True, "code": "AUTH_FAILED", "message": "Invalid token"})
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail={"error": True, "code": "AUTH_FAILED", "message": "Expired token"})
    except Exception as e:
        raise HTTPException(status_code=401, detail={"error": True, "code": "AUTH_FAILED", "message": str(e)})
