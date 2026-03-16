import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types

GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "servadium")
GOOGLE_CLOUD_LOCATION = os.getenv("VERTEX_AI_LOCATION", "us-central1")
MODEL = "gemini-live-2.5-flash-native-audio"

async def test_live():
    print("Initializing client...")
    client = genai.Client(
        vertexai=True,
        project=GOOGLE_CLOUD_PROJECT,
        location=GOOGLE_CLOUD_LOCATION,
    )
    
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        system_instruction=types.Content(
            parts=[types.Part(text="Hello")]
        )
    )

    print("Connecting to live...")
    try:
        async with client.aio.live.connect(model=MODEL, config=config) as session:
            print("Successfully connected!")
            
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_live())
