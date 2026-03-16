import asyncio
import websockets
import json
import uuid
import datetime

import db

async def test():
    # 1. Create a fake session in Firestore
    session_id = str(uuid.uuid4())
    print(f"Creating fake session: {session_id}")
    db.db.collection("sessions").document(session_id).set({
        "session_id": session_id,
        "session_type": "teach",
        "status": "active",
        "created_at": datetime.datetime.now(datetime.timezone.utc),
    })

    # 2. Connect via WS
    uri = f"ws://localhost:8000/ws/{session_id}?mode=teach"
    print(f"Connecting to {uri}")
    try:
        async with websockets.connect(uri) as ws:
            print("Connected to WebSocket!")
            
            # Wait for session_ready
            while True:
                msg = await ws.recv()
                print("Received WS Event:", msg)
                data = json.loads(msg)
                if data.get("event") == "session_ready":
                    print("SUCCESS! Got session_ready!")
                    break
                if data.get("event") == "error":
                    print("ERROR from backend:", data)
                    break

    except Exception as e:
        print("WebSocket Connection Error:", type(e).__name__, e)

if __name__ == '__main__':
    asyncio.run(test())
