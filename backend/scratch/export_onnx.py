import torch
import torch.onnx
import os
import sys

# Add core to path
sys.path.append(os.path.join(os.getcwd(), 'core'))
from tgcn_model import GCN_muti_att

# Configuration (Matches current production settings)
NUM_SAMPLES = 30
HIDDEN_SIZE = 64
NUM_CLASSES = 25
NUM_STAGES = 20
WEIGHTS_PATH = "weights/best_tgcn_model.pth"
ONNX_PATH = "weights/best_tgcn_model.onnx"

def export():
    device = torch.device('cpu')
    
    # 1. Initialize model
    model = GCN_muti_att(
        input_feature=NUM_SAMPLES * 2,
        hidden_feature=HIDDEN_SIZE,
        num_class=NUM_CLASSES,
        p_dropout=0.0, # Set dropout to 0 for inference
        num_stage=NUM_STAGES
    )
    
    # 2. Load weights
    if not os.path.exists(WEIGHTS_PATH):
        print(f"Error: Weights not found at {WEIGHTS_PATH}")
        return
        
    model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))
    model.eval()
    
    # 3. Create dummy input (batch_size=1, points=55, features=60)
    dummy_input = torch.randn(1, 55, NUM_SAMPLES * 2)
    
    # 4. Export to ONNX
    print(f"Exporting to {ONNX_PATH}...")
    torch.onnx.export(
        model,
        dummy_input,
        ONNX_PATH,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print("Export successful!")

if __name__ == "__main__":
    export()
