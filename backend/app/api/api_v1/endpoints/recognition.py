import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.services.ai_service import ai_service
import sys
import os

# Đường dẫn để import các util
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
CORE_DIR = os.path.join(BACKEND_DIR, 'core')
sys.path.append(CORE_DIR)

try:
    from inference_utils import SlidingWindowBuffer, compute_hand_movement
except ImportError:
    print("Warning: SlidingWindowBuffer not found.")

router = APIRouter()

def parse_landmarks(data):
    pose = np.array(data.get('pose', [])) if data.get('pose') else np.zeros((33, 3))
    lh = np.array(data.get('left_hand', [])) if data.get('left_hand') else np.zeros((21, 3))
    rh = np.array(data.get('right_hand', [])) if data.get('right_hand') else np.zeros((21, 3))
    
    if pose.shape != (33, 3): pose = np.zeros((33, 3))
    if lh.shape != (21, 3): lh = np.zeros((21, 3))
    if rh.shape != (21, 3): rh = np.zeros((21, 3))
    
    return np.concatenate([pose, lh, rh], axis=0)

@router.websocket("/ws")
async def websocket_recognition(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    print("AI Recognition Client Connected via WebSocket.")
    
    buffer = SlidingWindowBuffer(window_size=30)
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
            
            # --- COMMANDS ---
            if "command" in data:
                cmd = data["command"]
                if cmd == "delete_last" and sentence_buffer:
                    sentence_buffer.pop()
                    last_added_word = ""
                elif cmd == "clear_all":
                    sentence_buffer.clear()
                    translated_sentence = ""
                    last_added_word = ""
                elif cmd == "translate" and not is_translating:
                    is_translating = True
                    await websocket.send_json({"status": "translating", "sentence": sentence_buffer})
                    translated_sentence = await ai_service.translate_gloss(sentence_buffer.copy())
                    is_translating = False
                
                await websocket.send_json({
                    "prediction": current_prediction,
                    "confidence": round(confidence, 2),
                    "sentence": sentence_buffer,
                    "translation": translated_sentence if not is_translating else "AI Đang dịch..."
                })
                continue

            # --- INFERENCE ---
            keypoints = parse_landmarks(data)
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
                else:
                    if translated_sentence: translated_sentence = ""
                    
                    pred_word, conf = ai_service.predict(window, prediction_history)
                    confidence = conf
                    
                    if confidence > 0.85:
                        consecutive_predictions.append(pred_word)
                        if len(consecutive_predictions) > 3: consecutive_predictions.pop(0)
                        
                        if len(consecutive_predictions) == 3 and len(set(consecutive_predictions)) == 1:
                            current_prediction = consecutive_predictions[0]
                            if current_prediction != "Unknown" and current_prediction != last_added_word:
                                sentence_buffer.append(current_prediction)
                                last_added_word = current_prediction
                                
                                # Lưu vào lịch sử (History)
                                try:
                                    db.execute(
                                        text("INSERT INTO recognition_history (user_id, recognized_text, confidence) VALUES (:u, :t, :c)"),
                                        {"u": 1, "t": current_prediction, "c": round(confidence, 2)}
                                    )
                                    db.commit()
                                except Exception as e:
                                    print(f"DB Error: {e}")
                    else:
                        consecutive_predictions.clear()

            # Trả về kết quả
            await websocket.send_json({
                "prediction": current_prediction,
                "confidence": round(confidence, 2),
                "sentence": sentence_buffer,
                "translation": translated_sentence if not is_translating else "AI Đang dịch..."
            })

    except WebSocketDisconnect:
        print("AI Recognition Client Disconnected.")
    except Exception as e:
        print(f"Recognition Error: {e}")
