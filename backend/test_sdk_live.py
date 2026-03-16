import asyncio
import os
from google import genai
from google.genai import types

os.environ["GRPC_VERBOSITY"] = "DEBUG"
os.environ["GRPC_TRACE"] = "all"

async def test():
    print("Initializing client...")
    client = genai.Client(
        vertexai=True,
        project="servadium",
        location="us-central1",
        http_options={"api_version": "v1beta1"}
    )
    
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
    )
    
    model = "gemini-live-2.5-flash-native-audio"
    print(f"Connecting to {model}...")
    try:
        async with client.aio.live.connect(model=model, config=config) as session:
            print("Connected!")
            await session.send(input="Hello")
            print("Sent input.")
            async for msg in session.receive():
                print("Received msg:", msg)
                break
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("FAIL:", e)

if __name__ == "__main__":
    asyncio.run(test())
