import os
import sys
import json
import torch
import asyncio
import numpy as np
import google.generativeai as genai
from typing import List, Optional

# Thêm CORE_DIR vào path để import các util cũ
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CORE_DIR = os.path.join(BACKEND_DIR, 'core')
sys.path.append(CORE_DIR)

try:
    from inference_utils import normalize_sequence_for_tgcn, compute_hand_movement
    from tgcn_model import GCN_muti_att
except ImportError:
    print("Warning: Could not import TGCN modules from core directory.")

class AIService:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.id_to_word = {}
        
        # Cấu hình Gemini
        GEMINI_API_KEY = "AIzaSyCjBgv4qe2du1qrdNAlWbFpaZFX530SN6o"
        genai.configure(api_key=GEMINI_API_KEY)
        self.generative_model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Params
        self.num_samples = 30
        self.num_classes = 25
        self.hidden_size = 64
        self.num_stages = 20
        
        self.load_model()
        self.load_labels()

    def load_labels(self):
        label_path = os.path.join(BACKEND_DIR, "data", "label_map.json")
        try:
            with open(label_path, 'r') as f:
                label_map = json.load(f)
            self.id_to_word = {idx: word.upper() for word, idx in label_map.items()}
        except Exception as e:
            print(f"Error loading label map: {e}")

    def load_model(self):
        weights_path = os.path.join(BACKEND_DIR, "weights", "best_tgcn_model.pth")
        try:
            self.model = GCN_muti_att(
                input_feature=self.num_samples*2, 
                hidden_feature=self.hidden_size, 
                num_class=self.num_classes, 
                p_dropout=0.3, 
                num_stage=self.num_stages
            )
            if os.path.exists(weights_path):
                self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
                print(f"AI Model loaded from {weights_path} on {self.device}")
            self.model.to(self.device).eval()
        except Exception as e:
            print(f"Failed to load TGCN model: {e}")

    async def translate_gloss(self, gloss_list: List[str]) -> str:
        if not gloss_list: return ""
        gloss_text = ", ".join(gloss_list)
        prompt = (
            f"Tôi có một chuỗi các từ khóa ngôn ngữ ký hiệu (Gloss): [{gloss_text}]. "
            "Hãy chuyển chúng thành một câu Tiếng Việt và một câu Tiếng Anh giao tiếp hoàn chỉnh. "
            "Kết quả trả về theo định dạng: 'VI: [câu tiếng Việt] / EN: [câu tiếng Anh]'. "
            "Không giải thích gì thêm."
        )
        try:
            # Chạy blocking call trong thread riêng
            response = await asyncio.to_thread(self.generative_model.generate_content, prompt)
            return response.text.replace('\n', ' ').strip()
        except Exception as e:
            return f"(AI Translation Error: {str(e)})"

    def predict(self, window_landmarks, prediction_history):
        if self.model is None: return "MODEL_ERROR", 0.0
        
        input_data = normalize_sequence_for_tgcn(window_landmarks)
        input_tensor = torch.FloatTensor(input_data).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            logits = self.model(input_tensor)
            probs = torch.softmax(logits, dim=1)
            prediction_history.append(probs)
            if len(prediction_history) > 5: prediction_history.pop(0)
            
            avg_probs = torch.mean(torch.stack(prediction_history), dim=0)
            conf, pred_idx = torch.max(avg_probs, dim=1)
            
            pred_word = self.id_to_word.get(pred_idx.item(), "Unknown")
            return pred_word, conf.item()

# Singleton instance
ai_service = AIService()
