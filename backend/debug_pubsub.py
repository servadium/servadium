import os
from dotenv import load_dotenv
load_dotenv()

project = os.getenv('GOOGLE_CLOUD_PROJECT')
print(f"Project: {project}")

try:
    from google.cloud import pubsub_v1
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project, 'servadium-pipeline')
    # Try to get topic
    topic = publisher.get_topic(request={"topic": topic_path})
    print(f"Pub/Sub topic: {topic.name}")
    print("Pub/Sub connection: OK")
except Exception as e:
    import traceback
    print(f"Pub/Sub FAILED: {traceback.format_exc()}")
