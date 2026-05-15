import json
import os

wlasl_json_path = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\Sign-Language-Recognition\start_kit\WLASL_v0.3.json"
wlasl_video_dir = r"d:\XuanDuc\TaiLieuKi8\DoAn\WLASL\videos"

# Các từ đang thiếu mẫu trong bộ 25 từ của bạn
target_glosses = [
    "THANKYOU", "BYE", "STOP", "WAIT", "COME", "ME", "PLEASE", "WHY", "HELLO"
]

def normalize(s):
    return s.upper().replace(" ", "")

if not os.path.exists(wlasl_json_path):
    print(f"Error: Path not found: {wlasl_json_path}")
    exit(1)

with open(wlasl_json_path, 'r') as f:
    wlasl_data = json.load(f)

print(f"{'Gloss':<15} | {'WLASL Samples':<20} | {'Video Files Found'}")
print("-" * 60)

found_total = 0
for entry in wlasl_data:
    gloss = normalize(entry['gloss'])
    if gloss in target_glosses:
        instances = entry['instances']
        available_files = []
        for inst in instances:
            video_id = inst['video_id']
            video_path = os.path.join(wlasl_video_dir, f"{video_id}.mp4")
            if os.path.exists(video_path):
                available_files.append(video_id)
        
        print(f"{gloss:<15} | {len(instances):<20} | Found {len(available_files)} mp4 files")
        found_total += len(available_files)

print("-" * 60)
print(f"Total potential new videos: {found_total}")
