import asyncio
import json
import os
from google.auth import default
from google.auth.transport.requests import Request

from dotenv import load_dotenv
load_dotenv()
PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "servadium")
LOCATION = os.environ.get("VERTEX_AI_LOCATION", "us-central1")
MODEL = "gemini-live-2.5-flash-native-audio"

async def test():
    creds, _ = default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    creds.refresh(Request())
    token = creds.token

    url = f"wss://{LOCATION}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent"

    import websockets
    headers = {"Authorization": f"Bearer {token}"}
    try:
        async with websockets.connect(url, additional_headers=headers) as ws:
            setup = {
                "setup": {
                    "model": f"projects/{PROJECT}/locations/{LOCATION}/publishers/google/models/{MODEL}"
                }
            }
            await ws.send(json.dumps(setup))
            response = await asyncio.wait_for(ws.recv(), timeout=10)
            print("Gemini Live connection successful:", response[:100])
    except Exception as e:
        print("FAILED:", e)

asyncio.run(test())
