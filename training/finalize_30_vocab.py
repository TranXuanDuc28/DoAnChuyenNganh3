
import json

label_map_path = r"d:\XuanDuc\TaiLieuKi8\DoAn\DoAnChuyenNganh3\training\final_label_map.json"

# Manually curated 30 words for best balance of Data Count + Survival Utility
top_30_survival = [
    "ME", "YOU", "WE", "FRIEND",         # Pronouns
    "HELLO", "THANKYOU", "SORRY", "PLEASE", "AGAIN", # Social
    "YES", "NO", "GOOD", "BAD",          # Feedback
    "EAT1", "DRINK1", "WANT1", "NEED", "HELP", # Needs
    "GO", "COME", "SLEEP", "FINISH",      # Actions
    "WHAT1", "WHERE", "WHY", "WHO",      # Questions
    "SICK", "HURT", "NOW", "TIME"        # Survival/Time
]

new_label_map = {word: i for i, word in enumerate(top_30_survival)}

with open(label_map_path, 'w') as f:
    json.dump(new_label_map, f, indent=4)

print(f"Finalized 30-word vocabulary for Lumina Sign. Total: {len(top_30_survival)}")
