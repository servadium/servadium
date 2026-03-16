import os
from dotenv import load_dotenv
load_dotenv()

project = os.getenv('GOOGLE_CLOUD_PROJECT')
location = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
index_endpoint = os.getenv('VERTEX_AI_INDEX_ENDPOINT')
index_id = os.getenv('VERTEX_AI_INDEX_ID')

print(f"Project: {project}")
print(f"Location: {location}")
print(f"Index Endpoint: {index_endpoint}")
print(f"Index ID: {index_id}")

if not index_endpoint or not index_id:
    print("CRITICAL: VERTEX_AI_INDEX_ENDPOINT or VERTEX_AI_INDEX_ID is not set")
else:
    try:
        from google.cloud import aiplatform
        aiplatform.init(project=project, location=location)
        endpoint = aiplatform.MatchingEngineIndexEndpoint(
            index_endpoint_name=f"projects/{project}/locations/{location}/indexEndpoints/{index_endpoint}"
        )
        print(f"Vertex AI endpoint: {endpoint.display_name}")
        print("Vertex AI connection: OK")
    except Exception as e:
        import traceback
        print(f"Vertex AI FAILED: {traceback.format_exc()}")
