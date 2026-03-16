import os, sys
sys.path.append('.')
from dotenv import load_dotenv
load_dotenv()

import trigger
print("Attempting to trigger job...")
try:
    trigger.trigger_job("test_id")
except Exception as e:
    import traceback
    print(traceback.format_exc())
