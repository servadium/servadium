import os
from google.cloud import aiplatform

# Requires VERTEX_AI_INDEX_ID and VERTEX_AI_ENDPOINT_ID
PROJECT_ID = os.getenv("GCP_PROJECT_ID")
REGION = "us-central1"
INDEX_ID = os.getenv("VERTEX_AI_INDEX_ID")
ENDPOINT_ID = os.getenv("VERTEX_AI_ENDPOINT_ID")

try:
    aiplatform.init(project=PROJECT_ID, location=REGION)
except Exception as e:
    print(f"Warning: Could not init aiplatform: {e}")

def get_index():
    if not INDEX_ID: return None
    return aiplatform.MatchingEngineIndex(index_name=INDEX_ID)
    
def get_endpoint():
    if not ENDPOINT_ID: return None
    return aiplatform.MatchingEngineIndexEndpoint(index_endpoint_name=ENDPOINT_ID)

def write_vectors(datapoints: list):
    """
    Writes vectors to Vertex AI Vector Search.
    datapoints is a list of dicts: {"id": str, "embedding": list[float], "restricts": list[dict]}
    """
    index = get_index()
    if not index:
        return False
        
    try:
        index.upsert_datapoints(datapoints=datapoints)
        return True
    except Exception as e:
        print(f"Error upserting datapoints to Vertex AI: {e}")
        return False

def query_vectors(embedding: list, knowledge_id: str, num_neighbors: int = 3):
    """
    Queries Vertex AI Vector Search with a vector and filters by knowledge_id.
    """
    endpoint = get_endpoint()
    if not endpoint:
        return []
        
    try:
        response = endpoint.find_neighbors(
            deployed_index_id="servadium_index", # Replace with actual deployed index id if different
            queries=[embedding],
            num_neighbors=num_neighbors,
            filter=[
                {"namespace": "knowledge_id", "allow_list": [knowledge_id]}
            ]
        )
        return response
    except Exception as e:
        print(f"Error querying Vertex AI: {e}")
        return []
