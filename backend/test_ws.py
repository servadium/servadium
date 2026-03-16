import sys
try:
    import websockets.sync.client
    with websockets.sync.client.connect("ws://localhost:8000/ws/testsession", additional_headers={"Origin": "http://localhost:3000"}) as ws:
        print("Connected")
        try:
            msg = ws.recv()
            print(f"Received: {msg}")
        except Exception as e:
            print(f"Receive error: {e}")
except Exception as e:
    print(f"Error: {e}")
