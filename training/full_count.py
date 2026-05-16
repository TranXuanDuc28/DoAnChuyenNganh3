
import os
kp_dir = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\keypoints"
for d in os.listdir(kp_dir):
    p = os.path.join(kp_dir, d)
    if os.path.isdir(p):
        files = [f for f in os.listdir(p) if f.endswith('.npy')]
        if len(files) > 0:
            print(f"Word: {d:20} | Samples: {len(files)}")
