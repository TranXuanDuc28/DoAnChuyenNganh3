import numpy as np
import torch
import json
import sys
import os
import time
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import google.generativeai as genai

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from database import db
from routes import router as api_router
from app.api.api_v1.api import api_router as api_v1_router
from app.core.config import settings

# --- Cấu hình AI Dịch thuật ---
GEMINI_API_KEY = "AIzaSyCjBgv4qe2du1qrdNAlWbFpaZFX530SN6o"
genai.configure(api_key=GEMINI_API_KEY)
generative_model = genai.GenerativeModel('gemini-2.5-flash')

# --- Đường dẫn ---
CORE_DIR = os.path.join(BACKEND_DIR, 'core')
DATA_DIR = os.path.join(BACKEND_DIR, 'data')
WEIGHTS_DIR = os.path.join(BACKEND_DIR, 'weights')

sys.path.append(CORE_DIR)
try:
    from inference_utils import normalize_sequence_for_tgcn, SlidingWindowBuffer, compute_hand_movement
    from tgcn_model import GCN_muti_att
except Exception as e:
    print(f"Error loading core modules: {e}")

# --- Configuration ---
WEIGHTS_PATH = os.path.join(WEIGHTS_DIR, "best_tgcn_model.pth")
LABEL_MAP_PATH = os.path.join(DATA_DIR, "label_map.json")

NUM_SAMPLES = 30
NUM_CLASSES = 25
HIDDEN_SIZE = 64
NUM_STAGES = 20

def load_labels():
    try:
        with open(LABEL_MAP_PATH, 'r') as f:
            label_map = json.load(f)
        id_to_word = {idx: word.upper() for word, idx in label_map.items()}
        return id_to_word
    except Exception:
        return {}

id_to_word = load_labels()
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

try:
    model = GCN_muti_att(input_feature=NUM_SAMPLES*2, hidden_feature=HIDDEN_SIZE, 
                         num_class=NUM_CLASSES, p_dropout=0.3, num_stage=NUM_STAGES)
    if os.path.exists(WEIGHTS_PATH):
        model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))
        print(f"[Thành Công] Đã nạp Mô hình TGCN vào TRUE HYBRID Server.")
    model.to(device)
    model.eval()
except Exception as e:
    print(f"Chưa thể load TGCN, lỗi: {e}")

def parse_json_landmarks(data):
    pose = np.array(data.get('pose', [])) if data.get('pose') else np.zeros((33, 3))
    lh = np.array(data.get('left_hand', [])) if data.get('left_hand') else np.zeros((21, 3))
    rh = np.array(data.get('right_hand', [])) if data.get('right_hand') else np.zeros((21, 3))
    if pose.shape != (33, 3): pose = np.zeros((33, 3))
    if lh.shape != (21, 3): lh = np.zeros((21, 3))
    if rh.shape != (21, 3): rh = np.zeros((21, 3))
    return np.concatenate([pose, lh, rh], axis=0)

# --- FastAPI Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    db.init_db()

app.include_router(api_router)
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

# Để có thể xem được ảnh thumbnail và video từ thư mục archive
app.mount("/static", StaticFiles(directory="archive"), name="static")

async def translate_gloss(gloss_list):
    if not gloss_list: return ""
    gloss_text = ", ".join(gloss_list)
    prompt = (
        f"Tôi có một chuỗi các từ khóa ngôn ngữ ký hiệu (Gloss): [{gloss_text}]. "
        "Hãy chuyển chúng thành một câu Tiếng Việt và một câu Tiếng Anh giao tiếp hoàn chỉnh. "
        "Kết quả trả về theo định dạng: 'VI: [câu tiếng Việt] / EN: [câu tiếng Anh]'. "
        "Không giải thích gì thêm."
    )
    try:
        response = await asyncio.to_thread(generative_model.generate_content, prompt)
        return response.text.replace('\n', ' ').strip()
    except Exception as e:
        return f"(AI Error: {str(e)})"

@app.websocket("/ws/json")
async def websocket_json_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("True Hybrid Client (iPhone) Connected.")
    
    buffer = SlidingWindowBuffer(window_size=NUM_SAMPLES)
    prediction_history = []
    consecutive_predictions = []
    sentence_buffer = []
    
    last_added_word = ""
    current_prediction = "READY"
    confidence = 0.0
    
    translated_sentence = ""
    is_translating = False

    try:
        while True:
            data = await websocket.receive_json()
            
            # --- XỨ LÝ LỆNH TỪ APP (COMMANDS) ---
            if "command" in data:
                cmd = data["command"]
                if cmd == "delete_last" and len(sentence_buffer) > 0:
                    sentence_buffer.pop()
                    last_added_word = "" # Reset để cho phép múa lại từ vừa xóa
                elif cmd == "clear_all":
                    sentence_buffer.clear()
                    translated_sentence = ""
                    last_added_word = ""
                elif cmd == "translate" and not is_translating:
                    is_translating = True
                    await websocket.send_json({"status": "translating", "sentence": sentence_buffer})
                    translated_sentence = await translate_gloss(sentence_buffer.copy())
                    is_translating = False
                
                # Trả về trạng thái mới nhất cho App
                await websocket.send_json({
                    "prediction": current_prediction,
                    "confidence": round(confidence, 2),
                    "sentence": sentence_buffer,
                    "translation": translated_sentence if not is_translating else "AI Đang dịch..."
                })
                continue # Bỏ qua phần AI Inference vì đây là lệnh điều khiển

            # --- XỬ LÝ TOẠ ĐỘ LANDMARKS (AI INFERENCE) ---
            keypoints = parse_json_landmarks(data)
            buffer.add(keypoints)

            if buffer.is_full():
                window = buffer.get_window()
                movement = compute_hand_movement(window)
                
                if movement < 0.005: 
                    current_prediction = "IDLE"
                    last_added_word = ""
                    confidence = 0.0
                    prediction_history.clear()
                    consecutive_predictions.clear()
                    # (Đã xóa bộ đếm 3s tự động ở đây theo yêu cầu người dùng)
                else:
                    if translated_sentence != "": translated_sentence = ""

                    # TGCN Inference
                    input_data = normalize_sequence_for_tgcn(window)
                    input_tensor = torch.FloatTensor(input_data).unsqueeze(0).to(device)
                    
                    with torch.no_grad():
                        logits = model(input_tensor)
                        probs = torch.softmax(logits, dim=1)
                        prediction_history.append(probs)
                        if len(prediction_history) > 5: prediction_history.pop(0)
                        
                        avg_probs = torch.mean(torch.stack(prediction_history), dim=0)
                        conf, pred_idx = torch.max(avg_probs, dim=1)
                        confidence = conf.item()
                        
                        if confidence > 0.85:
                            pred_word = id_to_word.get(pred_idx.item(), "Unknown")
                            consecutive_predictions.append(pred_word)
                            if len(consecutive_predictions) > 3: consecutive_predictions.pop(0)
                        else:
                            consecutive_predictions.clear()

                        if len(consecutive_predictions) == 3 and len(set(consecutive_predictions)) == 1:
                            current_prediction = consecutive_predictions[0]
                            if current_prediction != "Unknown" and current_prediction != last_added_word:
                                sentence_buffer.append(current_prediction)
                                last_added_word = current_prediction
                                
                                # Log to DB (History)
                                db.execute_query(
                                    "INSERT INTO recognition_history (user_id, recognized_text, confidence, type, thumbnail) VALUES (%s, %s, %s, %s, %s)",
                                    (1, current_prediction, round(confidence, 2), 'VIDEO', 'https://images.unsplash.com/photo-1516321497487-e288fb19713f')
                                )

            # Luôn gửi cập nhật UI
            await websocket.send_json({
                "prediction": current_prediction,
                "confidence": round(confidence, 2),
                "sentence": sentence_buffer,
                "translation": translated_sentence if not is_translating else "AI Đang dịch..."
            })

    except WebSocketDisconnect:
        print("True Hybrid Client disconnected.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
