import os
from google import genai

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "firebase-credentials.json"

def test_vertex():
    client = genai.Client(
        vertexai=True,
        project="servadium",
        location="us-central1",
    )
    print("Listing models...")
    try:
        for model in client.models.list():
            print(f"Model: {model.name}")
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_vertex()
