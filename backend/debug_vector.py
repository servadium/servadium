import os, sys
sys.path.append('.')
from dotenv import load_dotenv
load_dotenv()

try:
    import vector
    print("vector module imports: OK")
    print(f"vector module contents: {dir(vector)}")
except Exception as e:
    import traceback
    print(f"vector import FAILED: {traceback.format_exc()}")
