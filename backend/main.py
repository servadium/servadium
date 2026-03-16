import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from auth import get_current_user
import db

from routers import session, websockets, webhooks

app = FastAPI(title="Servadium Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://servadium-frontend-881320329014.us-central1.run.app",
        "https://servadium.web.app",
        "https://servadium.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(websockets.router)
app.include_router(webhooks.router)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/health/firestore")
async def health_firestore():
    try:
        if db.db is None:
            return {"status": "error", "error": "Firestore not initialized"}
        # Do a simple read
        db.db.collection("test").limit(1).get()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/protected")
async def protected_route(user: dict = Depends(get_current_user)):
    return {
        "message": "You are authenticated",
        "user": user
    }
