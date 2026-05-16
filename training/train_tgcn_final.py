
import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from tqdm import tqdm
from torch.utils.data import Dataset, DataLoader
import sys
import argparse

# Constants
FINAL_DIR = os.path.dirname(os.path.abspath(__file__))
WLASL_DIR = os.path.abspath(os.path.join(FINAL_DIR, '..', 'WLASL'))

# Import TGCN model components
sys.path.append(os.path.join(WLASL_DIR, 'code', 'TGCN'))
try:
    from tgcn_model import GCN_muti_att
except ModuleNotFoundError:
    print("Error: Could not find TGCN code folder.")
    sys.exit(1)

KEYPOINTS_DIR = os.path.join(FINAL_DIR, 'keypoints')
LABEL_MAP_FILE = os.path.join(FINAL_DIR, 'final_label_map.json')

NUM_SAMPLES = 30  
HIDDEN_SIZE = 128 
NUM_STAGES = 20

# Joint Indices
BODY_INDICES = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24]
HAND_INDICES = list(range(33, 75)) # 21 LH + 21 RH
TGCN_INDICES = BODY_INDICES + HAND_INDICES # 55 joints

class TGCN_Folder_Dataset(Dataset):
    def __init__(self, label_map, is_train=True, split_ratio=0.85, balance_limit=None):
        self.samples = []
        self.labels = []
        self.is_train = is_train
        # --- Logic nạp dữ liệu và Oversampling để cân bằng ---
        max_class_count = 0
        word_data = {}
        
        
        for word, idx in label_map.items():
            word_dir = os.path.join(KEYPOINTS_DIR, word)
            if os.path.exists(word_dir):
                files = [os.path.join(word_dir, f) for f in os.listdir(word_dir) if f.endswith('.npy')]
                if len(files) > 0:
                    np.random.shuffle(files)
                    split_idx = int(len(files) * split_ratio)
                    selected = files[:split_idx] if is_train else files[split_idx:]
                    
                    if len(selected) > 0:
                        word_data[idx] = selected
                        if len(selected) > max_class_count:
                            max_class_count = len(selected)
        
        # Nếu đang Train, thực hiện Oversampling để mọi lớp đều có số mẫu bằng max_class_count
        target_count = max_class_count if is_train else None
        
        for idx, files in word_data.items():
            current_files = list(files)
            if is_train and target_count:
                # Nhân bản cho đến khi đạt target_count
                while len(current_files) < target_count:
                    current_files.extend(files[:target_count - len(current_files)])
            
            for f in current_files:
                self.samples.append(f)
                self.labels.append(idx)
            
        print(f"--- Loaded {'TRAIN' if is_train else 'VALID'} Data ---")
        print(f" Total samples after balancing: {len(self.samples)} | Samples per class: {target_count if is_train else 'Variable'}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        seq = np.load(self.samples[idx])
        T = seq.shape[0]
        res_seq = np.zeros_like(seq)
        for i in range(T):
            nose = seq[i, 0]
            s1, s2 = seq[i, 11], seq[i, 12]
            dist = np.linalg.norm(s1 - s2)
            if dist == 0: dist = 1.0
            if not np.all(nose == 0):
                for j in range(75):
                    if not np.all(seq[i, j] == 0):
                        res_seq[i, j] = (seq[i, j] - nose) / dist
        
        seq_55 = res_seq[:, TGCN_INDICES, :2]
        if self.is_train and T > 5:
            if np.random.rand() > 0.5:
                fact = np.random.uniform(0.8, 1.2)
                new_T = max(5, int(T * fact))
                indices = np.linspace(0, T - 1, new_T).astype(int)
                seq_55 = seq_55[indices]
                T = new_T
            if np.random.rand() > 0.8:
                seq_55 += np.random.normal(0, 0.002, seq_55.shape)

        indices = np.linspace(0, T - 1, NUM_SAMPLES).astype(int)
        sampled_seq = seq_55[indices]
        seq_flat = sampled_seq.transpose(1, 0, 2).reshape(55, -1)
        return torch.FloatTensor(seq_flat), torch.tensor(self.labels[idx])

def train(output_dir=None):
    if not output_dir: output_dir = "."
    os.makedirs(output_dir, exist_ok=True)
        
    model_save_path = os.path.join(output_dir, 'best_tgcn_model_30.pth')
    history_img_path = os.path.join(output_dir, 'training_history.png')
    cm_img_path = os.path.join(output_dir, 'confusion_matrix.png')
    report_txt_path = os.path.join(output_dir, 'classification_report.txt')

    if not os.path.exists(LABEL_MAP_FILE):
        print(f"Error: {LABEL_MAP_FILE} not found.")
        return
    with open(LABEL_MAP_FILE, 'r') as f:
        label_map = json.load(f)
    num_classes = len(label_map)
    id_to_word = {v: k for k, v in label_map.items()}

    # --- DIAGNOSTICS ---
    print(f"🔍 Working Directory: {os.getcwd()}")
    print(f"🔍 Keypoints Path: {KEYPOINTS_DIR}")
    if os.path.exists(KEYPOINTS_DIR):
        total_files = 0
        for root, dirs, files in os.walk(KEYPOINTS_DIR):
            total_files += len([f for f in files if f.endswith('.npy')])
        print(f"📂 ✅ Tổng cộng tìm thấy {total_files} file keypoints (.npy) trong các thư mục con.")
    else:
        print(f"❌ KHÔNG tìm thấy thư mục: {KEYPOINTS_DIR}")

    train_dataset = TGCN_Folder_Dataset(label_map, is_train=True, balance_limit=100)
    val_dataset = TGCN_Folder_Dataset(label_map, is_train=False, balance_limit=100)
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = GCN_muti_att(input_feature=NUM_SAMPLES*2, hidden_feature=HIDDEN_SIZE, 
                         num_class=num_classes, p_dropout=0.3, num_stage=NUM_STAGES).to(device)
    
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=8)
    criterion = nn.CrossEntropyLoss()
    
    epochs = 80
    best_val_acc = 0
    patience = 15 # Dừng sau 15 epoch nếu không cải thiện
    trigger_times = 0
    best_val_loss = float('inf')
    
    history = {'train_acc': [], 'val_acc': [], 'train_loss': [], 'val_loss': []}

    print(f"Starting training on {device.type.upper()}...")
    try:
        for epoch in range(epochs):
            model.train()
            train_loss, correct_train = 0, 0
            for x, y in tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}"):
                x, y = x.to(device), y.to(device)
                optimizer.zero_grad()
                output = model(x)
                loss = criterion(output, y)
                loss.backward()
                optimizer.step()
                train_loss += loss.item()
                _, pred = torch.max(output.data, 1)
                correct_train += (pred == y).sum().item()
            
            model.eval()
            val_loss, correct_val = 0, 0
            with torch.no_grad():
                for x, y in val_loader:
                    x, y = x.to(device), y.to(device)
                    output = model(x)
                    loss = criterion(output, y)
                    val_loss += loss.item()
                    _, pred = torch.max(output.data, 1)
                    correct_val += (pred == y).sum().item()
            
            t_acc, v_acc = correct_train/len(train_dataset), correct_val/len(val_dataset)
            v_loss = val_loss/len(val_loader)
            
            history['train_acc'].append(t_acc); history['val_acc'].append(v_acc)
            history['train_loss'].append(train_loss/len(train_loader)); history['val_loss'].append(v_loss)
            
            scheduler.step(v_loss)
            
            # --- CƠ CHẾ EARLY STOPPING & SAVE BEST ---
            if v_acc > best_val_acc:
                best_val_acc = v_acc
                torch.save(model.state_dict(), model_save_path)
                print(f" [SAVE] Model đạt Acc mới: {best_val_acc:.4f}")

            if v_loss < best_val_loss:
                best_val_loss = v_loss
                trigger_times = 0
            else:
                trigger_times += 1
                if trigger_times >= patience:
                    print(f"\n[EARLY STOP] Loss không giảm sau {patience} epoch. Dừng huấn luyện để tránh Overfitting.")
                    break
            
            print(f" Acc: T={t_acc:.4f}, V={v_acc:.4f} | Loss: V={v_loss:.4f} | Patience: {trigger_times}/{patience}")
    except KeyboardInterrupt:
        print("Training stopped manually.")

    # --- REPORTING ---
    print("\n--- Generating Reports ---")
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
        from sklearn.metrics import confusion_matrix, classification_report
        
        # A. Plot History
        plt.figure(figsize=(12, 5))
        plt.subplot(1, 2, 1); plt.plot(history['train_acc'], label='Train'); plt.plot(history['val_acc'], label='Val'); plt.title('Accuracy'); plt.legend()
        plt.subplot(1, 2, 2); plt.plot(history['train_loss'], label='Train'); plt.plot(history['val_loss'], label='Val'); plt.title('Loss'); plt.legend()
        plt.savefig(history_img_path)
        
        # B. Confusion Matrix & Detailed Report
        model.load_state_dict(torch.load(model_save_path))
        model.eval()
        preds, targets = [], []
        with torch.no_grad():
            for x, y in val_loader:
                out = model(x.to(device))
                _, p = torch.max(out, 1)
                preds.extend(p.cpu().numpy()); targets.extend(y.numpy())
        
        cm = confusion_matrix(targets, preds)
        plt.figure(figsize=(15, 12))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=id_to_word.values(), yticklabels=id_to_word.values())
        plt.savefig(cm_img_path)
        
        report = classification_report(targets, preds, target_names=[id_to_word[i] for i in range(num_classes)])
        with open(report_txt_path, 'w') as f: f.write(report)
        print(f"Reports saved to {output_dir}")
    except Exception as e:
        print(f"Reporting failed: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=str, default=None)
    args = parser.parse_args()
    train(output_dir=args.output)
