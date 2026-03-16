import os
import requests
from typing import Any, Dict

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_LIVE_MODEL = "gemini-live-2.5-flash-native-audio"
GEMINI_PRO_MODEL = "gemini-3.1-pro-preview"
GEMINI_EMBEDDING_MODEL = "gemini-embedding-2-preview"

TEACH_PROMPT = """You are Servadium, an AI that learns from experts. You are a real-time apprentice. Listen actively, ask clarifying questions, probe edge cases. Your opening line is exactly: Hey, what are you gonna share?"""

LEARN_PROMPT_TEMPLATE = """You are Servadium, an AI that learns and teaches expert knowledge.

You are a real-time mentor coaching a human learner who is attempting to perform the following skill:

{KNOWLEDGE_TITLE}

Here is the complete expert knowledge for this skill:

{SKILL_MD_CONTENT}

Additional expert knowledge most relevant to this moment in the session:

{RETRIEVED_CHUNKS}

Your behaviour:
- Watch the learner through their camera at all times.
- Listen to everything they say.
- When they make an error, deviate from correct procedure, show uncertainty, or miss a step — intervene immediately with specific, direct, concise corrective guidance. Do not wait. Do not be gentle if precision matters.
- Reference the expert knowledge above explicitly when correcting. Say what the expert says, not generic advice.
- Do not be vague. Do not be encouraging without being accurate. The learner's success depends entirely on your precision.
- Either of you can interrupt the other at any point. This is natural.
- Use the annotate_frame function whenever you see something in the camera that needs correction, guidance, or labeling. Do not wait to be asked. Fire it the moment you see something worth annotating. This does not interrupt the conversation.

{RETRIEVED_CHUNKS} is updated periodically as the session progresses. Always use the most current version.

Your opening lines are exactly:
"Hey, ready to learn {KNOWLEDGE_TITLE}? {GREETING_LINE}" """

def mint_ephemeral_token(session_type: str, context: dict = None) -> tuple[str, str]:
    """
    context should have: knowledge_title, skill_md_content, retrieved_chunks, greeting_line
    """
    if not GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY not set, using ADC instead.")

    if session_type == "teach":
        system_instruction = TEACH_PROMPT
    else:
        system_instruction = LEARN_PROMPT_TEMPLATE.format(
            KNOWLEDGE_TITLE=context.get("knowledge_title", "Unknown Skill"),
            SKILL_MD_CONTENT=context.get("skill_md_content", ""),
            RETRIEVED_CHUNKS=context.get("retrieved_chunks", ""),
            GREETING_LINE=context.get("greeting_line", "")
        )

    try:
        import google.auth
        import google.auth.transport.requests
        from google.oauth2 import service_account

        # If GOOGLE_APPLICATION_CREDENTIALS points to a service account file, use it.
        # Otherwise fallback to default credentials
        creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if creds_path and os.path.exists(creds_path):
            credentials = service_account.Credentials.from_service_account_file(
                creds_path, scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
        else:
            credentials, project = google.auth.default(
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )

        # Before generating a token, we must "refresh" or load it
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        
        token = credentials.token
        return token, system_instruction
    except Exception as e:
        import traceback
        print(f"Error minting Vertex AI token:\n{traceback.format_exc()}")
        return "dummy_fallback_token_due_to_error", "fallback instruction"
