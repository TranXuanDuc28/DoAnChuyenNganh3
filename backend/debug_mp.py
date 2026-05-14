import mediapipe as mp
print(f"Mediapipe file: {mp.__file__}")
print(f"Mediapipe version: {mp.__version__}")
print(f"Mediapipe attributes: {dir(mp)}")
try:
    print(f"Mediapipe solutions: {mp.solutions}")
except AttributeError as e:
    print(f"Error: {e}")
