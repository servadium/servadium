import os
import sys
import json
import base64
import subprocess
from typing import Optional
from urllib.parse import urlparse
from google.cloud import pubsub_v1, storage, firestore
from google import genai
from google.genai import types

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db
import vector

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
TOPIC_ID = os.getenv("PUBSUB_TOPIC_ID", "pipeline-events")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

try:
    if GEMINI_API_KEY:
        ai_client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        ai_client = genai.Client() # Assumes ADC
except Exception as e:
    print(f"Warning: GenAI init failed: {e}")
    ai_client = None

def emit_progress(session_id: str, stage: str, detail: str, percent: int):
    if not PROJECT_ID or not TOPIC_ID:
        return
    try:
        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)
        payload = {
            "session_id": session_id,
            "event": "pipeline_progress",
            "stage": stage,
            "detail": detail,
            "progress_percent": percent
        }
        publisher.publish(topic_path, json.dumps(payload).encode("utf-8"))
    except Exception as e:
        print(f"Failed to publish progress: {e}")

def analyse_session(session_id: str):
    print(f"[{session_id}] Stage 1: analyse_session")
    emit_progress(session_id, "analysing_session", "Analysing your session...", 10)
    
    if not ai_client or not db.db:
        raise Exception("Agent requires AI client and Firestore")

    doc = db.db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise Exception(f"Session {session_id} not found")
        
    data = doc.to_dict()
    transcript = data.get("transcript", "")
    recording_url = data.get("recording_url", "")
    
    prompt = f"""Analyse this teaching session. Identify:
(a) knowledge clearly conveyed,
(b) areas that were ambiguous or incomplete,
(c) moments where the visual demonstration is critical and cannot be captured in text alone (with timestamps),
(d) gaps that would leave a learner confused.

Transcript: {transcript}
"""

    contents = [prompt]
    if recording_url:
        contents.append(types.Part.from_uri(file_uri=recording_url, mime_type="video/mp4"))
        
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "clear_knowledge": {"type": "ARRAY", "items": {"type": "STRING"}},
            "gaps": {"type": "ARRAY", "items": {"type": "STRING"}},
            "critical_visual_moments": {
                "type": "ARRAY", 
                "items": {
                    "type": "OBJECT", 
                    "properties": {
                        "timestamp_seconds": {"type": "NUMBER"}, 
                        "description": {"type": "STRING"}
                    }
                }
            },
            "video_unavailable": {"type": "BOOLEAN"}
        }
    }

    try:
        assert ai_client is not None
        resp = ai_client.models.generate_content(
            model="gemini-3.1-pro-preview",
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )
        return json.loads(resp.text)
    except Exception as e:
        print(f"Error in analyse_session: {e}")
        # fallback
        return {"clear_knowledge": [transcript[:100]], "gaps": [], "critical_visual_moments": [], "video_unavailable": True}

def chunk_video_semantically(session_id: str, transcript: str, recording_url: str, session_analysis: dict):
    print(f"[{session_id}] Stage 2: chunk_video_semantically")
    emit_progress(session_id, "chunking_video", "Chunking key moments...", 30)
    
    if not ai_client:
        return []

    # Get chunks from Gemini
    prompt = f"""
    Based on the transcript and this session analysis, split the session into semantic chunks.
    Each chunk must represent a coherent concept, procedure, or demonstration.
    MAXIMUM chunk duration is 120 seconds.
    The analysis identified critical visual moments: {json.dumps(session_analysis.get('critical_visual_moments', []))}
    
    Return a list of chunks, identifying the precise start and end time in seconds.
    
    Transcript: {transcript}
    """
    
    # We provide the video URI again so gemini can see exact timings
    contents = [prompt]
    if recording_url and not session_analysis.get("video_unavailable"):
        contents.append(types.Part.from_uri(file_uri=recording_url, mime_type="video/mp4"))

    response_schema = {
        "type": "ARRAY",
        "items": {
            "type": "OBJECT",
            "properties": {
                "start_time_seconds": {"type": "NUMBER"},
                "end_time_seconds": {"type": "NUMBER"},
                "semantic_label": {"type": "STRING"}
            }
        }
    }

    try:
        resp = ai_client.models.generate_content(
            model="gemini-3.1-pro-preview",
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )
        chunk_plan = json.loads(resp.text)
    except Exception as e:
        print(f"Error defining chunks: {e}")
        # fallback
        chunk_plan = [{"start_time_seconds": 0, "end_time_seconds": 120, "semantic_label": "Whole Session"}]
        
    final_chunks = []
    
    if recording_url and recording_url.startswith("gs://"):
        try:
            # Download full video locally
            parsed_url = urlparse(recording_url)
            bucket_name = parsed_url.netloc
            blob_path = parsed_url.path.lstrip('/')
            
            sc = storage.Client()
            bucket = sc.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            
            local_raw = f"/tmp/{session_id}_raw.mp4"
            blob.download_to_filename(local_raw)
            
            # Slice and upload
            for idx, c in enumerate(chunk_plan):
                start = c.get("start_time_seconds", 0)
                end = c.get("end_time_seconds", 120)
                label = c.get("semantic_label", f"Chunk {idx}")
                
                # cap to 120s
                if end - start > 120:
                    end = start + 120
                    
                local_chunk = f"/tmp/{session_id}_chunk_{idx:03d}.mp4"
                
                # run ffmpeg silently
                try:
                    subprocess.run([
                        "ffmpeg", "-y", "-i", local_raw, "-ss", str(start), "-to", str(end),
                        "-c", "copy", local_chunk
                    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    
                    chunk_blob_path = f"sessions/{session_id}/chunks/chunk_{idx:03d}.mp4"
                    chunk_blob = bucket.blob(chunk_blob_path)
                    chunk_blob.upload_from_filename(local_chunk)
                    
                    final_chunks.append({
                        "chunk_id": f"chunk_{idx:03d}",
                        "gcs_url": f"gs://{bucket_name}/{chunk_blob_path}",
                        "start_time_seconds": start,
                        "end_time_seconds": end,
                        "semantic_label": label
                    })
                    
                    if os.path.exists(local_chunk):
                        os.remove(local_chunk)
                except Exception as ex:
                    print(f"Error ffmpeg chunk {idx}: {ex}")
                    
            if os.path.exists(local_raw):
                os.remove(local_raw)
                
        except Exception as e:
            print(f"Storage operations failed for chunks: {e}")
            
    return final_chunks

def embed_knowledge(session_id: str, chunks: list):
    print(f"[{session_id}] Stage 3: embed_knowledge")
    emit_progress(session_id, "embedding_knowledge", "Converting knowledge into vectors...", 60)
    
    if not ai_client:
        return False
        
    datapoints = []
    
    for c in chunks:
        # Use multimodal embedding model
        # The prompt is just the video, we'll embed the chunk directly
        try:
            resp = ai_client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=types.Part.from_uri(file_uri=c["gcs_url"], mime_type="video/mp4")
            )
            embedding = resp.embeddings[0].values
            
            datapoints.append({
                "id": f"{session_id}_{c['chunk_id']}",
                "embedding": embedding,
                "restricts": [{"namespace": "knowledge_id", "allow_list": [session_id]}]
            })
        except Exception as e:
            print(f"Error embedding chunk {c['chunk_id']}: {e}")
            
    if datapoints:
        success = vector.write_vectors(datapoints)
        return success
    return False

def generate_and_validate_skill_md(session_id: str, transcript: str, session_analysis: dict, chunks: list):
    print(f"[{session_id}] Stage 4: generate_and_validate_skill_md")
    emit_progress(session_id, "generating_skill_doc", "Writing permanent skill documentation...", 80)
    
    if not ai_client:
        return "# Error\nGenAI client not initialized."
        
    prompt = f"""
    You are an expert technical writer. Create a comprehensive `skill.md` markdown document that encapsulates everything taught in this session.
    
    The document MUST be structured clearly with:
    - # Title
    - ## Overview
    - ## Prerequisites (if any)
    - ## Step-by-Step Instructions
    - ## Common Pitfalls & Edge Cases
    - ## Critical Visuals (reference the timestamps where necessary)
    
    Transcript: {transcript}
    
    Clear Knowledge Identified: {json.dumps(session_analysis.get('clear_knowledge', []))}
    Gaps/Ambiguities (Address these cautiously): {json.dumps(session_analysis.get('gaps', []))}
    Critical Visual Moments: {json.dumps(session_analysis.get('critical_visual_moments', []))}
    
    Make the documentation professional, actionable, and exhaustive.
    """
    
    try:
        resp = ai_client.models.generate_content(
            model="gemini-3.1-pro-preview",
            contents=prompt
        )
        skill_md = resp.text
    except Exception as e:
        print(f"Error generating skill.md: {e}")
        skill_md = f"# Skill Documentation\n\nError generating full document.\n\n## Raw Transcript\n{transcript}"
        
    # Upload to GCS
    try:
        bucket_name = os.getenv("GCS_BUCKET_NAME")
        if bucket_name:
            sc = storage.Client()
            bucket = sc.bucket(bucket_name.replace("gs://", ""))
            blob = bucket.blob(f"knowledge/{session_id}/skill.md")
            blob.upload_from_string(skill_md, content_type="text/markdown")
    except Exception as e:
        print(f"Error uploading skill.md to GCS: {e}")
        
    # Save to Firestore
    if db.db:
        try:
            short_id = session_id[:8] # type: ignore
            db.db.collection("knowledge").document(session_id).set({
                "title": f"Skill {short_id}", # We could extract a better title or ask Gemini
                "created_at": firestore.SERVER_TIMESTAMP,
                "chunks_count": len(chunks),
                "chunks": chunks
            }, merge=True)
            
            db.db.collection("sessions").document(session_id).update({
                "skill_md": skill_md
            })
        except Exception as e:
            print(f"Error saving to Firestore: {e}")
            
    return skill_md

def emit_completion(session_id: str):
    print(f"[{session_id}] Stage 5: emit_completion")
    # Emit to Pub/Sub to notify frontend
    # This will be picked up by /webhooks/pubsub and sent to Websocket
    
    import json
    import base64
    from google.cloud import pubsub_v1
    
    project_id = os.getenv("GCP_PROJECT_ID")
    topic_id = os.getenv("PUBSUB_TOPIC_ID", "pipeline-events")
    
    if project_id and topic_id:
        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(project_id, topic_id)
        
        payload = {
            "session_id": session_id,
            "event": "modelling_complete",
            "message": "Knowledge modelling has finished successfully."
        }
        
        data = json.dumps(payload).encode("utf-8")
        try:
            publisher.publish(topic_path, data)
        except Exception as e:
            print(f"Failed to publish completion event: {e}")
            
    # Also update Firestore
    if db.db:
        db.db.collection("sessions").document(session_id).update({
            "modelling_complete": True
        })
    
    return True
