import asyncio
import os
from google import genai
from google.genai import types

async def test():
    client = genai.Client(
        vertexai=True,
        project="servadium",
        location="us-central1",
        http_options={"api_version": "v1beta1"}
    )
    model = "gemini-live-2.5-flash-native-audio"
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
    )
    
    try:
        async with client.aio.live.connect(model=model, config=config) as session:
            print("Connected")
            print("Sending text via .send()...")
            await session.send(input="Hello world!")
            print("Sending audio...")
            audio_data = b'\x00' * 32000
            await session.send_realtime_input(
                audio=types.Blob(data=audio_data, mime_type="audio/pcm;rate=16000")
            )
            print("Sent audio. Waiting for received messages...")
            
            async for msg in session.receive():
                print("Received msg:", msg)
                break
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
