import os
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types

def test():
    client = genai.Client(vertexai=True, location=os.getenv("VERTEX_AI_LOCATION", "us-central1"))
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
    )
    
    models = [
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash-realtime-exp",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-live-2.5-flash",
    ]
    
    for m in models:
        try:
            print(f"Testing {m}...")
            constraints = types.LiveConnectConstraints(
                model=m,
                config=config
            )
            token = client.auth_tokens.create(
                config=types.CreateAuthTokenConfig(
                    uses=1,
                    live_connect_constraints=constraints
                )
            )
            print(f"SUCCESS: {m} token generated")
        except Exception as e:
            print(f"FAIL {m}: {str(e)}")

if __name__ == "__main__":
    test()
