import os
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types

def test():
    client = genai.Client() # Uses GEMINI_API_KEY
    print("API Key:", os.getenv("GEMINI_API_KEY")[:5] + "...")
    print("Testing generate_content...")
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents='What is 2+2?'
    )
    print("Response:", response.text)

if __name__ == "__main__":
    test()
