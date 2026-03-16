import os
from google.cloud import run_v2

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "servadium")
REGION = "us-central1"
JOB_NAME = "knowledge-modelling-pipeline"

def trigger_job(session_id: str):
    print(f"Triggering pipeline job for session: {session_id}")
    try:
        client = run_v2.JobsClient()
        job_name = f"projects/{PROJECT_ID}/locations/{REGION}/jobs/{JOB_NAME}"
        
        request = run_v2.RunJobRequest(
            name=job_name,
            overrides={
                "container_overrides": [
                    {
                        "env": [
                            {"name": "SESSION_ID", "value": session_id}
                        ]
                    }
                ]
            }
        )
        operation = client.run_job(request=request)
        print(f"Successfully triggered job. Operation: {operation.operation.name}")
    except Exception as e:
        print(f"Warning: Failed to trigger Cloud Run Job: {e}")
