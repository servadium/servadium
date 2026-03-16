import asyncio
import base64
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types
from google.cloud import firestore
import db
import trigger
import gemini

router = APIRouter(prefix="/ws", tags=["WebSockets"])

GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "servadium")
GOOGLE_CLOUD_LOCATION = os.getenv("VERTEX_AI_LOCATION", "us-central1")
MODEL = "gemini-live-2.5-flash-native-audio"

@router.websocket("/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    session_type = "teach"
    system_instruction = gemini.TEACH_PROMPT

    if db.db:
        try:
            doc = db.db.collection("sessions").document(session_id).get()
            if doc.exists:
                session_data = doc.to_dict()
                session_type = session_data.get("session_type", "teach")
                if session_type == "learn":
                    _, system_instruction = gemini.mint_ephemeral_token("learn", context={}) 
        except Exception as e:
            print(f"Firestore session lookup error: {e}")

    client = genai.Client(
        vertexai=True,
        project=GOOGLE_CLOUD_PROJECT,
        location=GOOGLE_CLOUD_LOCATION,
        http_options={
            "api_version": "v1beta1",
            "async_client_args": {
                "ping_interval": None,
                "ping_timeout": None
            }
        },
    )

    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        system_instruction=types.Content(parts=[types.Part.from_text(text=system_instruction)]),
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Aoede")
            )
        ),
    )

    try:
        print(f"Connecting to Gemini Live with model {MODEL}...")
        async with client.aio.live.connect(model=MODEL, config=config) as gemini_session:
            print("Gemini Live connection successful, sending session_ready to frontend")
            await websocket.send_json({"event": "session_ready"})
            
            async def receive_from_frontend():
                try:
                    while True:
                        message = await websocket.receive_text()
                        msg_data = json.loads(message)
                        event = msg_data.get("event")

                        if event == "audio_chunk":
                            audio_bytes = base64.b64decode(msg_data["data"])
                            if not hasattr(websocket.state, 'first_chunk_logged'):
                                print("[MIC] First audio chunk received from frontend!")
                                websocket.state.first_chunk_logged = True
                            await gemini_session.send_realtime_input(
                                media=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
                            )
                        elif event == "image_chunk":
                            image_bytes = base64.b64decode(msg_data["data"])
                            mime_type = msg_data.get("mime_type", "image/jpeg")
                            if not hasattr(websocket.state, 'first_video_logged'):
                                print("[CAM] First video frame received from frontend!")
                                websocket.state.first_video_logged = True
                            await gemini_session.send_realtime_input(
                                media=types.Blob(data=image_bytes, mime_type=mime_type)
                            )
                        elif event == "end_session":
                            if db.db:
                                db.db.collection("sessions").document(session_id).update({
                                    "status": "ended",
                                    "ended_at": firestore.SERVER_TIMESTAMP
                                })
                            if session_type == "teach":
                                trigger.trigger_job(session_id)
                            return
                except WebSocketDisconnect:
                    return
                except Exception as e:
                    import traceback
                    print("Frontend receive error:")
                    traceback.print_exc()
                    return

            async def receive_from_gemini():
                try:
                    while True:
                        async for response in gemini_session.receive():
                            if response.server_content and response.server_content.model_turn:
                                for part in response.server_content.model_turn.parts:
                                    if part.inline_data:
                                        audio_b64 = base64.b64encode(part.inline_data.data).decode()
                                        await websocket.send_json({
                                            "event": "audio",
                                            "data": audio_b64
                                        })
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    print(f"Gemini receive error: {e}")
                    return

            frontend_task = asyncio.create_task(receive_from_frontend())
            gemini_task = asyncio.create_task(receive_from_gemini())

            done, pending = await asyncio.wait(
                [frontend_task, gemini_task],
                return_when=asyncio.FIRST_COMPLETED
            )
            for task in pending:
                task.cancel()

    except Exception as e:
        print(f"WebSocket fatal error: {e}")
        try:
            await websocket.send_json({"event": "error", "message": str(e)})
        except:
            pass
