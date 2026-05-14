import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def list_available_models():
    api_key = os.getenv('GEMINI_API_KEY')
    print(f"Checking models for Key: {api_key[:10]}...")
    
    genai.configure(api_key=api_key)
    
    try:
        print("\nAvailable models and their supported methods:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model Name: {m.name}")
                print(f"Display Name: {m.display_name}")
                print("-" * 20)
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_available_models()
