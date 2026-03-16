import os
from google import genai
from google.genai import types

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "firebase-credentials.json"

def test_live_sync():
    client = genai.Client(
        vertexai=True,
        project="servadium",
        location="us-central1",
    )
    model_id = "gemini-live-2.5-flash-native-audio"
    print(f"Connecting to {model_id} (sync)...")
    try:
        # Live connect is usually async in the SDK, 
        # but let's see if we can just start it.
        # Actually, let's use a simple generate_content to test model availability.
        resp = client.models.generate_content(
            model=model_id,
            contents="test"
        )
        print(f"Success! Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_live_sync()
