try:
    import mediapipe.solutions.holistic as mp_holistic
    print("Successfully imported mediapipe.solutions.holistic")
except ImportError as e:
    print(f"Failed to import mediapipe.solutions.holistic: {e}")

try:
    from mediapipe.python.solutions import holistic as mp_holistic
    print("Successfully imported from mediapipe.python.solutions")
except ImportError as e:
    print(f"Failed to import from mediapipe.python.solutions: {e}")
