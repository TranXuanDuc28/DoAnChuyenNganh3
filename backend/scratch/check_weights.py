import torch
import os

weights_path = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\backend\weights\best_tgcn_model.pth"

if os.path.exists(weights_path):
    try:
        state_dict = torch.load(weights_path, map_location='cpu')
        print(f"Keys in state_dict: {state_dict.keys()}")
        if 'fc_out.weight' in state_dict:
            shape = state_dict['fc_out.weight'].shape
            print(f"Shape of fc_out.weight: {shape}")
            print(f"Detected classes in weights: {shape[0]}")
        else:
            # Maybe it's a full model object?
            print("fc_out.weight not found. Checking if it's a model object...")
            # We'd need the class definition to load it if it's a full object, 
            # but let's just see keys first.
    except Exception as e:
        print(f"Error: {e}")
else:
    print("Weights file not found.")
