import inspect
from google.genai import types

def print_signature():
    print(inspect.signature(types.LiveClientContent))
    print(dir(types.LiveClientContent))

if __name__ == "__main__":
    print_signature()
