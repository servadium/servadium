import sys
import os
import json
import base64
from fastapi import APIRouter, Request, HTTPException

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db
import storage

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/gcs")
async def gcs_webhook(request: Request):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Only process "OBJECT_FINALIZE" events
    if data.get("kind") == "storage#object" and request.headers.get("X-Goog-Resource-State") == "exists":
        # Extract bucket and object name
        bucket = data.get("bucket")
        name = data.get("name") # format: sessions/{session_id}/raw_session.mp4
        
        if bucket == storage.BUCKET_NAME and name.startswith("sessions/") and name.endswith("/raw_session.mp4"):
            parts = name.split("/")
            if len(parts) >= 3:
                session_id = parts[1]
                print(f"GCS Upload complete for session {session_id}")
                
                # Update Firestore
                if db.db:
                    doc_ref = db.db.collection("sessions").document(session_id)
                    doc_ref.update({"video_uploaded": True})
                    
    return {"status": "ok"}

@router.post("/pubsub")
async def pubsub_webhook(request: Request):
    try:
        data = await request.json()
        message = data.get("message", {})
        if "data" in message:
            decoded_data = base64.b64decode(message["data"]).decode("utf-8")
            payload = json.loads(decoded_data)
            
            session_id = payload.get("session_id")
            if session_id:
                from .websockets import manager
                # Using run_coroutine_threadsafe or await depending on event loop context
                await manager.send_json(session_id, payload)
                
        return {"status": "ok"}
    except Exception as e:
        print(f"Error handling pub/sub push: {e}")
        return {"status": "error"}
