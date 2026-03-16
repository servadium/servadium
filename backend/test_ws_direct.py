import asyncio
import base64
import json
import websockets
import uuid
from google.cloud import firestore
import os

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "firebase-credentials.json"
db = firestore.Client()

async def test_ws():
    session_id = str(uuid.uuid4())
    print(f"Creating dummy session: {session_id}")
    
    # Create dummy session in Firestore
    db.collection("sessions").document(session_id).set({
        "session_id": session_id,
        "session_type": "teach",
        "user_id": "test_user",
        "status": "active",
        "created_at": firestore.SERVER_TIMESTAMP
    })

    uri = f"ws://127.0.0.1:8000/ws/{session_id}"
    print(f"Connecting to {uri}")
    
    async with websockets.connect(uri, open_timeout=30) as websocket:
        print("Connected.")
        
        # Wait for session_ready
        resp = await websocket.recv()
        print(f"Received from backend: {resp}")
        
        # Send a dummy 16kHz PCM audio chunk (1 second of silence)
        dummy_audio = b'\x00' * 32000
        b64_audio = base64.b64encode(dummy_audio).decode()
        
        await websocket.send(json.dumps({
            "event": "audio_chunk",
            "data": b64_audio
        }))
        print("Sent audio chunk.")
        
        # Wait for Gemini response (audio or transcript)
        while True:
            try:
                resp = await asyncio.wait_for(websocket.recv(), timeout=10)
                data = json.loads(resp)
                print(f"Received event: {data.get('event')}")
                if data.get('event') == 'audio':
                    print("SUCCESS: Received audio from Gemini!")
                if data.get('event') == 'transcript':
                    print(f"Transcript from Gemini: {data.get('text')}")
                    if "what are you gonna share" in data.get('text').lower():
                        print("FINAL SUCCESS: Gemini said the magic words!")
                        break
            except asyncio.TimeoutError:
                print("Timed out waiting for Gemini response.")
                break

if __name__ == "__main__":
    asyncio.run(test_ws())
