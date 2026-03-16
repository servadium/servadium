import os
import sys
import traceback

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import agent
import db

def main():
    session_id = os.getenv("SESSION_ID")
    if not session_id:
        print("ERROR: SESSION_ID environment variable not set. Exiting.")
        sys.exit(1)
        
    print(f"Starting Knowledge Modelling Pipeline for session: {session_id}")
    
    try:
        # Load db (we assume db module auto-inits if env vars are present)
        # 1. Analyse session
        session_analysis = agent.analyse_session(session_id)
        
        doc = db.db.collection("sessions").document(session_id).get()
        data = doc.to_dict() if doc.exists else {}
        transcript = data.get("transcript", "")
        recording_url = data.get("recording_url", "")
        
        # 2. Chunk Video
        chunks = agent.chunk_video_semantically(session_id, transcript, recording_url, session_analysis)
        
        # 3. Embed Knowledge (Multimodal)
        if chunks:
            agent.embed_knowledge(session_id, chunks)
            
        # 4. Generate Skill MD
        agent.generate_and_validate_skill_md(session_id, transcript, session_analysis, chunks)
        
        # 5. Emit Completion
        agent.emit_completion(session_id)
        
        print(f"Pipeline complete for session: {session_id}")
    except Exception as e:
        print(f"PIPELINE FATAL ERROR for {session_id}: {e}")
        traceback.print_exc()
        # Should we emit a failed event? Yes.
        agent.emit_progress(session_id, "failed", f"Pipeline failed: {str(e)}", 0)
        sys.exit(1)

if __name__ == "__main__":
    main()
