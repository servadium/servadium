import json
from google.genai.types import LiveConnectConstraints

schema = LiveConnectConstraints.model_json_schema()
print(json.dumps(schema, indent=2))
