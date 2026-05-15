import json
import os
import shutil
import pandas as pd

# --- PATH CONFIG ---
WLASL_JSON = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\Sign-Language-Recognition\start_kit\WLASL_v0.3.json"
WLASL_VIDEO_DIR = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\videos"

PROJECT_VIDEO_DIR = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\videos"
PROJECT_TRAIN_CSV = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\backend\data\train.csv"

# Target glosses to supplement
TARGET_GLOSSES = [
    "THANKYOU", "BYE", "STOP", "WAIT", "COME", "ME", "PLEASE", "WHY", "HELLO"
]

def normalize(s):
    return s.upper().replace(" ", "")

def main():
    if not os.path.exists(WLASL_JSON):
        print("Error: WLASL JSON not found.")
        return

    with open(WLASL_JSON, 'r') as f:
        wlasl_data = json.load(f)

    # Read current CSV to avoid duplicates
    existing_df = pd.read_csv(PROJECT_TRAIN_CSV)
    existing_video_ids = set(existing_df['VideoID'].tolist())

    new_entries = []
    copy_count = 0

    print("--- Supplementing data from WLASL ---")

    for entry in wlasl_data:
        gloss_orig = entry['gloss']
        gloss_norm = normalize(gloss_orig)
        
        if gloss_norm in TARGET_GLOSSES:
            for inst in entry['instances']:
                video_id = inst['video_id']
                src_filename = f"{video_id}.mp4"
                src_path = os.path.join(WLASL_VIDEO_DIR, src_filename)
                
                dest_filename = f"WLASL_{gloss_norm}_{video_id}.mp4"
                dest_path = os.path.join(PROJECT_VIDEO_DIR, dest_filename)

                if os.path.exists(src_path) and dest_filename not in existing_video_ids:
                    shutil.copy2(src_path, dest_path)
                    new_entries.append({'VideoID': dest_filename, 'Gloss': gloss_norm})
                    copy_count += 1
                    print(f"Added: {dest_filename} ({gloss_norm})")

    if new_entries:
        new_df = pd.DataFrame(new_entries)
        updated_df = pd.concat([existing_df, new_df], ignore_index=True)
        updated_df.to_csv(PROJECT_TRAIN_CSV, index=False)
        print(f"\n--- SUCCESS ---")
        print(f"Copied {copy_count} new videos.")
        print(f"Updated CSV: {PROJECT_TRAIN_CSV}")
    else:
        print("\nNo new data to add.")

if __name__ == "__main__":
    main()
