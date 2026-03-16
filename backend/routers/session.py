import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import storage
import db
from auth import get_current_user
import gemini

router = APIRouter(prefix="/session", tags=["Session"])

class SessionStartRequest(BaseModel):
    session_type: str
    knowledge_id: str | None = None

@router.post("/start")
async def start_session(req: SessionStartRequest, user: dict = Depends(get_current_user)):
    user_id = user.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail={"error": True, "code": "UNAUTHORIZED", "message": "No UID in token"})
    #     raise HTTPException(status_code=401, detail={"error": True, "code": "UNAUTHORIZED", "message": "No UID in token"})
        
    session_id = str(uuid.uuid4())
    
    if req.session_type not in ["teach", "learn"]:
        raise HTTPException(status_code=400, detail={"error": True, "code": "INVALID_TYPE", "message": "session_type must be teach or learn"})
        
    skill_md_content = ""
    knowledge_title = "Unknown Skill"
    greeting_line = ""
    
    if req.session_type == "learn":
        if not req.knowledge_id:
            raise HTTPException(status_code=400, detail={"error": True, "code": "MISSING_KNOWLEDGE", "message": "knowledge_id required for learn session"})
            
        doc = db.db.collection("sessions").document(req.knowledge_id).get()
        if doc.exists:
            skill_md_content = doc.to_dict().get("skill_md", "")
            
        kdoc = db.db.collection("knowledge").document(req.knowledge_id).get()
        if kdoc.exists:
            knowledge_title = kdoc.to_dict().get("title", "Unknown Skill")
            
        greeting_line = "Let's review the knowledge."
        
    # Mint ephemeral token
    context = {}
    if req.session_type == "learn":
        context = {
            "knowledge_title": knowledge_title,
            "skill_md_content": skill_md_content,
            "greeting_line": greeting_line,
            "retrieved_chunks": "" # Empty at T=0
        }
    ephemeral_token, system_instruction = gemini.mint_ephemeral_token(req.session_type, context=context)
        
    # Generate GCS signed URL
    gcs_signed_url = storage.generate_signed_url(session_id)
    
    # Create Firestore document
    if db.db:
        doc_ref = db.db.collection("sessions").document(session_id)
        doc_ref.set({
            "session_id": session_id,
            "session_type": req.session_type,
            "user_id": user_id,
            "knowledge_id": req.knowledge_id if req.session_type == "learn" else None,
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "ended_at": None,
            "transcript": "",
            "recording_url": f"gs://{storage.BUCKET_NAME}/sessions/{session_id}/raw_session.mp4"
        })
        
    response = {
        "session_id": session_id,
        "ephemeral_token": ephemeral_token,
        "gcs_signed_url": gcs_signed_url,
        "system_instruction": system_instruction
    }
    if req.session_type == "learn":
        response["greeting_line"] = greeting_line
        
    return response
