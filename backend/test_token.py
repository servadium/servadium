import os
from dotenv import load_dotenv
load_dotenv()
from gemini import mint_ephemeral_token

try:
    print("Testing teach token...")
    teach_token = mint_ephemeral_token("teach")
    print("Teach token length:", len(teach_token))
    print("Teach token prefix:", teach_token[:10])
    
    context = {
        "knowledge_title": "Test",
        "skill_md_content": "Content",
        "greeting_line": "Hello"
    }
    print("Testing learn token...")
    learn_token = mint_ephemeral_token("learn", context)
    print("Learn token length:", len(learn_token))
    pass
except Exception as e:
    print("Error:", e)
