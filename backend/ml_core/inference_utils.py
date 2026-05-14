import numpy as np
import torch

# Same indices as used in training
BODY_INDICES = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24]
HAND_INDICES = list(range(33, 75))
TGCN_INDICES = BODY_INDICES + HAND_INDICES

def extract_keypoints(results):
    """Extract and concatenate pose, left hand, and right hand landmarks."""
    pose = np.array([[res.x, res.y, res.z] for res in results.pose_landmarks.landmark]) if results.pose_landmarks else np.zeros((33, 3))
    lh = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark]) if results.left_hand_landmarks else np.zeros((21, 3))
    rh = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark]) if results.right_hand_landmarks else np.zeros((21, 3))
    
    # Shape: (75, 3)
    return np.concatenate([pose, lh, rh], axis=0)

def interpolate_missing_keypoints(seq_75):
    """
    Điền các khung hình bị mất nội suy tiến/lùi. (T, 75, 3)
    """
    T, V, C = seq_75.shape
    res = seq_75.copy()
    
    for v in range(V):
        valid_frames = []
        for t in range(T):
            if not np.all(res[t, v] == 0):
                valid_frames.append(t)
                
        if len(valid_frames) == 0:
            continue # Cả video hỏng điểm này
            
        # Nội suy
        for t in range(T):
            if np.all(res[t, v] == 0):
                if t < valid_frames[0]:
                    res[t, v] = res[valid_frames[0], v]
                elif t > valid_frames[-1]:
                    res[t, v] = res[valid_frames[-1], v]
                else:
                    # Tìm nội suy tuyến tính (nếu muốn) hoặc điền forward
                    # Ta dùng điền forward nhanh:
                    # Tìm frame hợp lệ ngay phía trước
                    prev_valid = max([idx for idx in valid_frames if idx < t])
                    res[t, v] = res[prev_valid, v]
    return res

def compute_hand_movement(seq_75):
    """
    seq_75: (T, 75, 3)
    Tính biến động trung bình của toàn bộ các điểm trên hai bàn tay
    (từ index 33 đến 74)
    """
    hand_seq = seq_75[:, 33:75, :2] # Lấy X,Y 2 bàn tay
    diff = np.diff(hand_seq, axis=0) # (T-1, 42, 2)
    movement = np.linalg.norm(diff, axis=-1) # (T-1, 42)
    avg_movement = np.mean(movement)
    return avg_movement

def normalize_sequence_for_tgcn(seq_75):
    """
    seq_75: shape (T, 75, 3) or list
    Returns: (55, T*2) as expected by TGCN
    """
    seq_75 = np.array(seq_75)
    T = seq_75.shape[0]
    
    # Bù dữ liệu bị missing (từ mediapipe 0,0,0)
    seq_75 = interpolate_missing_keypoints(seq_75)
    
    # 1. Normalize based on nose and shoulder
    res_seq = np.zeros_like(seq_75)
    for i in range(T):
        nose = seq_75[i, 0]
        s1, s2 = seq_75[i, 11], seq_75[i, 12]
        shoulder_dist = np.linalg.norm(s1 - s2)
        if shoulder_dist == 0:
            shoulder_dist = 1.0
            
        if not np.all(nose == 0):
            for j in range(75):
                if not np.all(seq_75[i, j] == 0):
                    res_seq[i, j] = (seq_75[i, j] - nose) / shoulder_dist
    
    # 2. Select 55 joints
    seq_55 = res_seq[:, TGCN_INDICES, :2]  # Only X, Y
    
    # 3. Flaten to (55, T*2)
    seq_flat = seq_55.transpose(1, 0, 2).reshape(55, -1)
    
    return seq_flat

class SlidingWindowBuffer:
    def __init__(self, window_size=30):
        self.window_size = window_size
        self.buffer = []

    def add(self, keypoints):
        self.buffer.append(keypoints)
        if len(self.buffer) > self.window_size:
            self.buffer.pop(0)

    def is_full(self):
        return len(self.buffer) == self.window_size

    def get_window(self):
        return np.array(self.buffer)
