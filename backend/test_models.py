import os
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types

def test():
    client = genai.Client(http_options={'api_version': 'v1alpha'})
    
    config = types.LiveConnectConfig(
        system_instruction=types.Content(parts=[types.Part.from_text(text="Test")]),
        tools=[types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="annotate_frame",
                    description="Annotate the current camera view",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "x": types.Schema(type=types.Type.NUMBER)
                        }
                    )
                )
            ]
        )]
    )
    
    constraints = types.LiveConnectConstraints(
        model="models/gemini-2.5-flash",
        config=config
    )
    
    try:
        token = client.auth_tokens.create(
            config=types.CreateAuthTokenConfig(
                uses=1,
                live_connect_constraints=constraints
            )
        )
        print("Success for 2.5-flash:", token.name)
    except Exception as e:
        print("Error with 2.5-flash:", e)

    constraints.model = "models/gemini-2.0-flash-exp"
    try:
        token = client.auth_tokens.create(
            config=types.CreateAuthTokenConfig(
                uses=1,
                live_connect_constraints=constraints
            )
        )
        print("Success for 2.0-flash-exp:", token.name)
    except Exception as e:
        print("Error with 2.0-flash-exp:", e)

if __name__ == "__main__":
    test()
