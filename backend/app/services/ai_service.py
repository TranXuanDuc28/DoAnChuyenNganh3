import os
import sys
import json
import torch
import asyncio
import numpy as np
import google.generativeai as genai
from typing import List, Optional
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# Thêm CORE_DIR vào path để import các util cũ
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CORE_DIR = os.path.join(BACKEND_DIR, 'ml_core')
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
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.generative_model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Params
        self.num_samples = 30
        self.num_classes = 10 # Default, will be updated by load_labels
        self.hidden_size = 128 
        self.num_stages = 20
        
        self.load_labels()
        self.load_model()

    def load_labels(self):
        # Sử dụng label_map.json cũ (25 lớp)
        label_path = os.path.join(BACKEND_DIR, "data", "label_map.json")
            
        # Load label map
        with open(label_path, 'r', encoding='utf-8') as f:
            self.label_map = json.load(f)
        self.id_to_word = {int(v): k for k, v in self.label_map.items()}
        self.num_classes = len(self.label_map)

    def load_model(self):
        # Load model 25 lớp cũ
        weights_path = os.path.join(BACKEND_DIR, "weights", "best_tgcn_model.pth")
            
        try:
            self.model = GCN_muti_att(
                input_feature=self.num_samples*2, 
                hidden_feature=self.hidden_size, 
                num_class=self.num_classes, 
                p_dropout=0.5, # Cập nhật 0.5 cho model mới
                num_stage=self.num_stages
            )
            # LUÔN ĐƯA VỀ EVAL TRƯỚC để tránh lỗi BatchNorm nếu load weights thất bại
            self.model.to(self.device).eval()
            
            if os.path.exists(weights_path):
                self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
                print(f"✅ AI Model loaded from {weights_path} on {self.device}")
            else:
                print(f"⚠️ Warning: Weights not found at {weights_path}. Running with random weights.")
        except Exception as e:
            print(f"❌ Failed to load TGCN model: {e}")

    async def translate_gloss(self, gloss_list: List[str], target_lang: str = 'vi') -> str:
        if not gloss_list: return ""
        # Xóa các số ở cuối từ (VD: DRINK1 -> DRINK) để AI dễ hiểu hơn
        clean_gloss = [(''.join([i for i in word if not i.isdigit()])) for word in gloss_list]
        gloss_text = ", ".join(clean_gloss)
        
        lang_name = "Tiếng Việt" if target_lang == 'vi' else "Tiếng Anh (English)"
        
        prompt = (
            f"Bạn là một chuyên gia dịch thuật Ngôn ngữ ký hiệu (ASL). Tôi có chuỗi từ khóa (Gloss): [{gloss_text}].\n"
            f"Nhiệm vụ: Chuyển chuỗi trên thành MỘT CÂU {lang_name} giao tiếp tự nhiên nhất.\n"
            "- Có thể thêm từ nối, trợ từ, hoặc danh từ phù hợp ngữ cảnh (VD: DRINK -> uống nước, EAT -> ăn cơm).\n"
            "- Phải phù hợp với văn phong giao tiếp hàng ngày.\n"
            "- CHỈ trả về nội dung câu đã dịch, không giải thích, không thêm ký tự lạ."
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
