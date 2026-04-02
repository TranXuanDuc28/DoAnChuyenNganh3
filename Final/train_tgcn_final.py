import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import pandas as pd
from tqdm import tqdm
from torch.utils.data import Dataset, DataLoader
import sys

# Constants
FINAL_DIR = os.path.dirname(os.path.abspath(__file__))
WLASL_DIR = os.path.abspath(os.path.join(FINAL_DIR, '..', 'WLASL'))

# Import TGCN model components from the local code folder in WLASL
sys.path.append(os.path.join(WLASL_DIR, 'code', 'TGCN'))
try:
    from tgcn_model import GCN_muti_att
except ModuleNotFoundError:
    print("Lỗi: Không tìm thấy thư mục TGCN tại:", os.path.join(WLASL_DIR, 'code', 'TGCN'))
    sys.exit(1)

KEYPOINTS_DIR = os.path.join(FINAL_DIR, 'keypoints')
LABEL_MAP_FILE = os.path.join(FINAL_DIR, 'final_label_map.json')

NUM_SAMPLES = 30  
NUM_CLASSES = 25  # Tăng lên 25 classes theo dataset Merged_ASL
HIDDEN_SIZE = 64
NUM_STAGES = 20

# 55 Điểm ảnh Xương (Pose + Hand) theo chuẩn MediaPipe
BODY_INDICES = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24]
HAND_INDICES = list(range(33, 75))
TGCN_INDICES = BODY_INDICES + HAND_INDICES

class TGCN_Final_Dataset(Dataset):
    def __init__(self, csv_file, label_map, is_train=True):
        self.samples = []
        self.labels = []
        self.is_train = is_train
        
        df = pd.read_csv(os.path.join(FINAL_DIR, csv_file))
        for _, row in df.iterrows():
            video_id = row['VideoID']
            gloss = row['Gloss']
            file_path = os.path.join(KEYPOINTS_DIR, f"{video_id}.npy")
            
            # Chỉ nạp khi file trích xuất Mediapipe tồn tại
            if os.path.exists(file_path) and gloss in label_map:
                self.samples.append(file_path)
                self.labels.append(label_map[gloss])

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        # seq là (T, 75, 3) do script extract lưu lại
        seq = np.load(self.samples[idx])
        T = seq.shape[0]
        
        # --- Normalization (Chống Domain Gap) ---
        res_seq = np.zeros_like(seq)
        for i in range(T):
            nose = seq[i, 0]
            s1, s2 = seq[i, 11], seq[i, 12]
            shoulder_dist = np.linalg.norm(s1 - s2)
            if shoulder_dist == 0:
                shoulder_dist = 1.0
                
            if not np.all(nose == 0):
                for j in range(75):
                    if not np.all(seq[i, j] == 0):
                        res_seq[i, j] = (seq[i, j] - nose) / shoulder_dist
                        
        seq = res_seq
        
        # Lấy 55 khớp nối X,Y
        seq_55 = seq[:, TGCN_INDICES, :2]
        
        # --- Data Augmentation cho lúc huấn luyện ---
        if self.is_train and T > 5:
            if np.random.rand() > 0.5:
                # Speed up
                drop_count = np.random.randint(1, max(2, int(T * 0.2)))
                keep_indices = sorted(np.random.choice(T, T - drop_count, replace=False))
                seq_55 = seq_55[keep_indices]
                T = seq_55.shape[0]
            elif np.random.rand() > 0.5:
                # Slow down
                dup_count = np.random.randint(1, max(2, int(T * 0.2)))
                dup_indices = sorted(list(range(T)) + list(np.random.choice(T, dup_count, replace=True)))
                seq_55 = seq_55[dup_indices]
                T = seq_55.shape[0]
                
            # Random Jittering & Scale (Như đã viết ở file trước)
            if np.random.rand() > 0.5:
                noise = np.random.normal(0, 0.01, seq_55.shape)
                seq_55 = seq_55 + noise
            if np.random.rand() > 0.5:
                scale = np.random.uniform(0.8, 1.2)
                seq_55 = seq_55 * scale

        # Lấy chốt NUM_SAMPLES (mặc định 30) frames nội suy tuyến tính
        indices = np.linspace(0, T - 1, NUM_SAMPLES).astype(int)
        sampled_seq = seq_55[indices]
        
        # Flatten time cho input TGCN: (55, T*2)
        seq_flat = sampled_seq.transpose(1, 0, 2).reshape(55, -1)
            
        return torch.FloatTensor(seq_flat), torch.tensor(self.labels[idx])

def train():
    if not os.path.exists(LABEL_MAP_FILE):
        print(f"Không tìm thấy file label map: {LABEL_MAP_FILE}")
        print("Vui lòng chạy script extract_final_features.py TRƯỚC!")
        return

    with open(LABEL_MAP_FILE, 'r') as f:
        label_map = json.load(f)

    # 1. Setup Dataloader
    print("--- Nạp Dữ Liệu Huấn Luyện & Đánh Giá ---")
    train_dataset = TGCN_Final_Dataset('train.csv', label_map, is_train=True)
    val_dataset = TGCN_Final_Dataset('valid.csv', label_map, is_train=False)
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    
    print(f"🚀 Tổng số video Training: {len(train_dataset)}")
    print(f"🚀 Tổng số video Validation: {len(val_dataset)}")
    if len(train_dataset) == 0:
        print("Chưa có bất kỳ file .npy nào được tìm thấy. Bạn đã chạy extract chưa?")
        return

    # 2. Setup Model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = GCN_muti_att(input_feature=NUM_SAMPLES*2, hidden_feature=HIDDEN_SIZE, 
                         num_class=NUM_CLASSES, p_dropout=0.3, num_stage=NUM_STAGES)
    model.to(device)

    # 3. Setup Hype-params
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()
    
    # 4. Training Loop
    best_val_acc = 0
    epochs = 100
    print(f"\n--- Bắt đầu huấn luyện với {device.type.upper()} ---")
    
    for epoch in range(epochs):
        # [TRAIN PHASE]
        model.train()
        train_loss = 0
        correct_train = 0
        
        # Thêm hiển thị thanh trạng thái TQDM
        train_pbar = tqdm(train_loader, desc=f"Epoch {epoch+1:03d}/{epochs} [TRAIN]")
        
        for x, y in train_pbar:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            output = model(x)
            loss = criterion(output, y)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = torch.max(output.data, 1)
            correct_train += (predicted == y).sum().item()
            
            # Update info on progress bar
            train_pbar.set_postfix({'loss': f"{loss.item():.4f}"})
            
        train_acc = correct_train / len(train_dataset)
        
        # [VAL PHASE]
        model.eval()
        val_loss = 0
        correct_val = 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                output = model(x)
                loss = criterion(output, y)
                val_loss += loss.item()
                _, predicted = torch.max(output.data, 1)
                correct_val += (predicted == y).sum().item()
                
        val_acc = correct_val / len(val_dataset)
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'best_tgcn_model_FINAL.pth')
            
        # Hiển thị log liên tục mỗi Epoch thay vì 5 epoch 1 lần
        print(f"-> KQ Epoch [{epoch+1:03d}/{epochs}]: "
              f"Train Loss: {train_loss/len(train_loader):.4f} | Train Acc: {train_acc:.4f} || "
              f"Val Loss: {val_loss/len(val_loader):.4f} | Val Acc: {val_acc:.4f}\n")

    print(f"\n✅ Hoàn tất! Best Validation Accuracy: {best_val_acc:.4f}")
    print("Mô hình được lưu ở: best_tgcn_model_FINAL.pth")

if __name__ == "__main__":
    train()
