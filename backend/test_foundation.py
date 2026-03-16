import requests
import json
import time

def test_foundation():
    print("Testing /health ... ", end="")
    try:
        res = requests.get("http://127.0.0.1:8000/health")
        if res.status_code == 200:
            print("OK", res.json())
        else:
            print("FAILED", res.status_code)
    except Exception as e:
        print("FAILED", e)
        
    print("Testing /protected (no token) ... ", end="")
    try:
        res = requests.get("http://127.0.0.1:8000/protected")
        if res.status_code == 403 or res.status_code == 401:
            print("OK (Rejected successfully)", res.json())
        else:
            print("FAILED", res.status_code, res.text)
    except Exception as e:
        print("FAILED", e)

if __name__ == "__main__":
    test_foundation()
