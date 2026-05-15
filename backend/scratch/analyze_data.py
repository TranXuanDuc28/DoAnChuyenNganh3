import pandas as pd
import os

data_dir = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\backend\data"
csv_files = ["train.csv", "valid.csv", "test.csv"]

all_counts = pd.Series(dtype=int)

for f in csv_files:
    path = os.path.join(data_dir, f)
    if os.path.exists(path):
        df = pd.read_csv(path)
        counts = df['Gloss'].value_counts()
        all_counts = all_counts.add(counts, fill_value=0)

all_counts = all_counts.sort_values(ascending=False)
print("=== DATASET STATISTICS ===")
print(f"{'Gloss':<15} | {'Samples':<10}")
print("-" * 30)
for gloss, count in all_counts.items():
    print(f"{gloss:<15} | {int(count):<10}")

total = all_counts.sum()
print("-" * 30)
print(f"{'TOTAL':<15} | {int(total):<10}")
print(f"Number of classes: {len(all_counts)}")
print(f"Average samples per class: {total / len(all_counts):.2f}")
print(f"Min samples: {all_counts.min()}")
print(f"Max samples: {all_counts.max()}")
print(f"Diff (Max-Min): {all_counts.max() - all_counts.min()}")
