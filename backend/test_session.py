import requests

def test_session_start():
    print("Testing /session/start (no token)... ", end="")
    try:
        res = requests.post("http://127.0.0.1:8000/session/start", json={"session_type": "teach"})
        if res.status_code in [401, 403]:
            print("OK (Rejected successfully)")
        else:
            print("FAILED", res.status_code, res.text)
    except Exception as e:
        print("FAILED", e)
        
    print("\nNote: To fully test /session/start, you need a valid Firebase ID token.")
    print("Run this script with a token via env var or pass it explicitly once auth is configured.")

if __name__ == "__main__":
    test_session_start()
