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
import argparse

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
NUM_CLASSES = 30  # Chốt 30 từ để đạt độ chính xác cao nhất
HIDDEN_SIZE = 128 # Tăng lại lên 128 để gánh 30 lớp tốt hơn
NUM_STAGES = 20

# ... (giữ nguyên BODY_INDICES, HAND_INDICES, TGCN_INDICES)

class TGCN_Final_Dataset(Dataset):
    def __init__(self, csv_file, label_map, is_train=True, max_samples=None):
        self.samples = []
        self.labels = []
        self.is_train = is_train
        
        DATA_DIR = os.path.join(FINAL_DIR, '..', 'backend', 'data')
        path = os.path.join(DATA_DIR, csv_file)
        if not os.path.exists(path):
            print(f"Cảnh báo: Không tìm thấy {csv_file} tại {DATA_DIR}")
            return
            
        df = pd.read_csv(path)
        
        # --- Logic cân bằng dữ liệu ---
        counts = {gloss: 0 for gloss in label_map}
        
        for _, row in df.iterrows():
            video_id = row['VideoID']
            gloss = row['Gloss']
            file_path = os.path.join(KEYPOINTS_DIR, f"{video_id}.npy")
            
            if os.path.exists(file_path) and gloss in label_map:
                # Nếu max_samples được cung cấp, ta giới hạn cứng để cân bằng
                if max_samples is not None and counts[gloss] >= max_samples:
                    continue
                    
                self.samples.append(file_path)
                self.labels.append(label_map[gloss])
                counts[gloss] += 1
        
        if self.is_train:
            print(f"--- Đã nạp dữ liệu Train (Cân bằng: {max_samples} mẫu/lớp) ---")
            # In tóm tắt ngắn gọn
            valid_counts = [c for c in counts.values() if c > 0]
            print(f" Số lớp: {len(valid_counts)} | Mẫu mỗi lớp: {min(valid_counts) if valid_counts else 0} - {max(valid_counts) if valid_counts else 0}")

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
            elif np.random.rand() > 0.7:
                # Thêm nhiễu Gaussian
                noise = np.random.normal(0, 0.005, seq_55.shape)
                seq_55 = seq_55 + noise
                
        indices = np.linspace(0, T - 1, NUM_SAMPLES).astype(int)
        sampled_seq = seq_55[indices]
        seq_flat = sampled_seq.transpose(1, 0, 2).reshape(55, -1)
            
        return torch.FloatTensor(seq_flat), torch.tensor(self.labels[idx])

def train(output_dir=None):
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        print(f"📁 Kết quả sẽ được lưu vào: {output_dir}")
        model_save_path = os.path.join(output_dir, 'best_tgcn_model_FINAL.pth')
    else:
        output_dir = "."
        model_save_path = os.path.join(output_dir, 'best_tgcn_model_FINAL.pth')

    label_map_save_path = os.path.join(output_dir, 'final_label_map.json') # Lưu vào Drive
    history_img_path = os.path.join(output_dir, 'training_history.png')
    cm_img_path = os.path.join(output_dir, 'confusion_matrix.png')
    report_txt_path = os.path.join(output_dir, 'classification_report.txt')
    
    # --- DANH SÁCH 30 TỪ VỰNG "VÀNG" ĐỂ GIAO TIẾP ---
    ESSENTIAL_30 = [
        "ME", "YOU", "WE",               # Đại từ
        "WANT1", "NEED", "LIKE", "HELP", # Động từ nhu cầu
        "GO", "COME", "EAT1", "DRINK1",  # Hành động
        "HELLO", "THANKYOU", "SORRY",    # Giao tiếp
        "WHAT1", "WHERE", "WHO", "WHY",  # Câu hỏi
        "GOOD", "BAD", "YES", "NO",      # Phản hồi
        "MOTHER", "FATHER", "FRIEND",    # Đối tượng
        "NOW", "TIME", "FINISH",         # Thời gian/Trạng thái
        "SLEEP", "HAPPY"                 # Cảm xúc/Nhu cầu
    ]
    
    # Tạo Label Map cố định và LƯU VÀO ĐÚNG THƯ MỤC OUTPUT
    label_map = {gloss: i for i, gloss in enumerate(ESSENTIAL_30)}
    with open(label_map_save_path, 'w', encoding='utf-8') as f:
        json.dump(label_map, f, indent=4)
    
    print(f"✅ Đã lưu Label Map vào: {label_map_save_path}")
    
    # Đếm số lượng mẫu hiện có cho danh sách này
    DATA_DIR = os.path.join(FINAL_DIR, '..', 'backend', 'data')
    train_df = pd.read_csv(os.path.join(DATA_DIR, 'train.csv'))
    
    available_counts = {}
    for gloss in ESSENTIAL_30:
        # Lọc các VideoID có file npy tồn tại
        count = 0
        gloss_df = train_df[train_df['Gloss'] == gloss]
        for _, row in gloss_df.iterrows():
            if os.path.exists(os.path.join(KEYPOINTS_DIR, f"{row['VideoID']}.npy")):
                count += 1
        available_counts[gloss] = count
    
    # Tìm ngưỡng cân bằng (lấy từ có ít mẫu nhất nhưng tối thiểu 50)
    valid_counts = [c for c in available_counts.values() if c > 0]
    balance_limit = min(valid_counts) if valid_counts else 0
    
    print(f"🚀 Đã thiết lập bộ 30 từ vựng Giao tiếp Thiết yếu.")
    print(f"📊 Ngưỡng cân bằng hiện tại: {balance_limit} mẫu/lớp.")
    print("⚠️ Cần bổ sung thêm video cho các từ có số mẫu thấp để nâng ngưỡng này lên.")
    
    num_classes = len(label_map)
    id_to_word = {v: k for k, v in label_map.items()}

    # 0. Kiểm tra thư mục dữ liệu (Debug cho Colab)
    print(f"🔍 Thư mục làm việc: {os.getcwd()}")
    print(f"🔍 FINAL_DIR: {FINAL_DIR}")
    print(f"🔍 KEYPOINTS_DIR: {KEYPOINTS_DIR}")
    if os.path.exists(KEYPOINTS_DIR):
        num_files = len([f for f in os.listdir(KEYPOINTS_DIR) if f.endswith('.npy')])
        print(f"📂 Số file .npy tìm thấy trong keypoints/: {num_files}")
    else:
        print(f"❌ Lỗi: Thư mục {KEYPOINTS_DIR} không tồn tại!")
        
    DATA_DIR = os.path.join(FINAL_DIR, '..', 'backend', 'data')
    csv_path = os.path.join(DATA_DIR, 'train.csv')
    if os.path.exists(csv_path):
        train_df = pd.read_csv(csv_path)
        print(f"📊 Đã nạp {csv_path}. Tổng số dòng: {len(train_df)}")
    else:
        print(f"❌ Lỗi: Không thấy file {csv_path}")
        return
        word = id_to_word[label_idx]
        class_counts[word] = class_counts.get(word, 0) + 1
    
    print(f"{'Gloss':<15} | {'Samples':<8}")
    print("-" * 26)
    for word in sorted(class_counts.keys()):
        print(f"{word:<15} | {class_counts[word]:<8}")
    
    total_samples = len(train_dataset) + len(val_dataset)
    print("-" * 26)
    print(f"Tổng số lớp (Classes): {num_classes}")
    print(f"Tổng số mẫu (Samples): {total_samples}")
    print(f"Training: {len(train_dataset)} | Val: {len(val_dataset)}")
    print("------------------------\n")

    if total_samples == 0:
        print("Lỗi: Không nạp được mẫu nào. Kiểm tra thư mục keypoints/ hoặc file CSV.")
        return
        
    train_loader = DataLoader(train_dataset, batch_size=128, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=128, shuffle=False)
    
    # 2. Setup Model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = GCN_muti_att(input_feature=NUM_SAMPLES*2, hidden_feature=HIDDEN_SIZE, 
                         num_class=num_classes, p_dropout=0.5, num_stage=NUM_STAGES)
    
    # --- TỰ ĐỘNG NẠP MODEL CŨ ĐỂ TRAIN TIẾP (RESUME) ---
    # Ưu tiên tìm ở output_dir, nếu không thấy thì tìm ở thư mục hiện tại
    load_path = model_save_path if os.path.exists(model_save_path) else 'best_tgcn_model_FINAL.pth'
    
    if os.path.exists(load_path):
        try:
            model.load_state_dict(torch.load(load_path, map_location=device))
            print(f"🔄 Đã tìm thấy model cũ tại {load_path}. Đang nạp để huấn luyện tiếp tục...")
            # Kiểm tra độ chính xác cũ để cập nhật best_val_acc
            model.to(device)
            model.eval()
            correct_val = 0
            with torch.no_grad():
                for x, y in val_loader:
                    x, y = x.to(device), y.to(device)
                    output = model(x)
                    _, predicted = torch.max(output.data, 1)
                    correct_val += (predicted == y).sum().item()
            best_val_acc = correct_val / len(val_dataset)
            print(f"📊 Độ chính xác hiện tại của model đã nạp: {best_val_acc:.4f}")
        except Exception as e:
            print(f"⚠️ Không thể nạp model cũ (lỗi: {e}), sẽ train từ đầu.")
            best_val_acc = 0
    else:
        best_val_acc = 0

    model.to(device)

    # 3. Training
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    # Thêm Scheduler để giảm LR khi Val Loss không giảm
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=10, verbose=True)
    criterion = nn.CrossEntropyLoss()
    epochs = 100
    history = {
        'train_acc': [], 'val_acc': [],
        'train_loss': [], 'val_loss': []
    }
    
    print(f"Bắt đầu huấn luyện {num_classes} lớp trên {device.type.upper()}...")
    
    try:
        for epoch in range(epochs):
            model.train()
            train_loss, correct_train = 0, 0
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
                train_pbar.set_postfix({'loss': f"{loss.item():.4f}"})
                
            train_acc = correct_train / len(train_dataset)
            
            model.eval()
            val_loss, correct_val = 0, 0
            with torch.no_grad():
                for x, y in val_loader:
                    x, y = x.to(device), y.to(device)
                    output = model(x)
                    loss = criterion(output, y)
                    val_loss += loss.item()
                    _, predicted = torch.max(output.data, 1)
                    correct_val += (predicted == y).sum().item()
                    
            val_acc = correct_val / len(val_dataset)
            avg_val_loss = val_loss / len(val_loader)
            
            # Cập nhật Scheduler dựa trên val_loss
            scheduler.step(avg_val_loss)
            
            # Lưu history
            history['train_acc'].append(train_acc)
            history['val_acc'].append(val_acc)
            history['train_loss'].append(train_loss / len(train_loader))
            history['val_loss'].append(avg_val_loss)
            
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                torch.save(model.state_dict(), model_save_path)
                
            print(f"-> KQ Epoch [{epoch+1:03d}/{epochs}]: Train Acc: {train_acc:.4f} | Val Acc: {val_acc:.4f} (Best: {best_val_acc:.4f}) | LR: {optimizer.param_groups[0]['lr']:.6f}")
    except KeyboardInterrupt:
        print("\n[HÀNH ĐỘNG] Đã dừng huấn luyện thủ công bởi người dùng.")

    print(f"\n✅ Hoàn tất! Best Accuracy đạt được: {best_val_acc:.4f}")
    
    # 4. Xuất Báo cáo & Đồ thị
    print("\n--- Đang tạo báo cáo đánh giá ---")
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
        from sklearn.metrics import confusion_matrix, classification_report
        
        # A. Vẽ biểu đồ Accuracy & Loss
        if len(history['train_acc']) > 0:
            plt.figure(figsize=(12, 5))
            plt.subplot(1, 2, 1)
            plt.plot(history['train_acc'], label='Train Acc')
            plt.plot(history['val_acc'], label='Val Acc')
            plt.title('Model Accuracy')
            plt.legend()
            
            plt.subplot(1, 2, 2)
            plt.plot(history['train_loss'], label='Train Loss')
            plt.plot(history['val_loss'], label='Val Loss')
            plt.title('Model Loss')
            plt.legend()
            plt.savefig(history_img_path)
            print(f"- Đã lưu biểu đồ: {history_img_path}")
        
        # B. Tạo Confusion Matrix
        if os.path.exists(model_save_path):
            model.load_state_dict(torch.load(model_save_path))
            model.eval()
            all_preds = []
            all_labels = []
            with torch.no_grad():
                for x, y in val_loader:
                    x = x.to(device)
                    outputs = model(x)
                    _, predicted = torch.max(outputs, 1)
                    all_preds.extend(predicted.cpu().numpy())
                    all_labels.extend(y.numpy())
            
            cm = confusion_matrix(all_labels, all_preds)
            plt.figure(figsize=(20, 15))
            sns.heatmap(cm, annot=False, cmap='Blues', xticklabels=id_to_word.values(), yticklabels=id_to_word.values())
            plt.title('Confusion Matrix')
            plt.xlabel('Predicted')
            plt.ylabel('True')
            plt.savefig(cm_img_path)
            print(f"- Đã lưu biểu đồ: {cm_img_path}")
            
            # C. Xuất Classification Report
            target_names = [id_to_word[i] for i in range(num_classes)]
            report = classification_report(all_labels, all_preds, target_names=target_names)
            with open(report_txt_path, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"- Đã lưu báo cáo: {report_txt_path}")
        else:
            print("Cảnh báo: Không tìm thấy model đã lưu để tạo Confusion Matrix.")
            
    except Exception as e:
        print(f"Cảnh báo: Không thể tạo báo cáo chi tiết (lỗi: {e}).")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=str, default=None, help='Thư mục lưu kết quả')
    args = parser.parse_args()
    
    train(output_dir=args.output)
