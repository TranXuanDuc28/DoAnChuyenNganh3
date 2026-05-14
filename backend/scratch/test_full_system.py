import os
import torch
import google.generativeai as genai
from dotenv import load_dotenv
import sys

# Add path to import backend modules
sys.path.append(os.getcwd())

load_dotenv()

def test_backend():
    print("=== TESTING BACKEND SYSTEM ===\n")

    # 1. Check Gemini API Key
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        print(f"1. API Key found: {api_key[:10]}...{api_key[-5:]}")
    else:
        print("1. API Key NOT found in .env")
    
    try:
        genai.configure(api_key=api_key)
        # Use stable gemini-2.5-flash
        model_gen = genai.GenerativeModel('gemini-2.5-flash')
        response = model_gen.generate_content("Hello, this is a test message.")
        print("OK - Gemini AI Connection: SUCCESS")
        print(f"   Response: {response.text[:50]}...")
    except Exception as e:
        print("ERR - Gemini AI Connection: FAILED")
        print(f"   Error: {e}")

    print("\n" + "-"*30 + "\n")

    # 2. Check TGCN Model Loading
    try:
        from app.services.ai_service import AIService
        ai_service = AIService()
        
        # Override model name if it was wrong in ai_service.py for this test
        ai_service.generative_model = genai.GenerativeModel('gemini-2.5-flash')
        
        if ai_service.model is not None:
            print("OK - TGCN Model Load: SUCCESS")
            print(f"   Classes: {ai_service.num_classes}")
            print(f"   Device: {ai_service.device}")
            
            # Test dummy inference
            dummy_input = torch.randn(1, 55, 60).to(ai_service.device)
            with torch.no_grad():
                output = ai_service.model(dummy_input)
                print("OK - Dummy Inference: SUCCESS")
        else:
            print("ERR - TGCN Model Load: FAILED (Model is None)")
            
    except Exception as e:
        print(f"ERR - Error loading TGCN Model: {e}")

if __name__ == "__main__":
    test_backend()
