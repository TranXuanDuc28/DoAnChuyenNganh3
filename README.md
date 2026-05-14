# Lumina Sign - Advanced Multi-Modal Sign Language System

Lumina Sign is a high-performance, AI-driven sign language recognition platform designed to bridge the communication gap for the deaf and hard-of-hearing. Powered by **TGCN (Temporal Graph Convolutional Network)**, **MediaPipe**, and **Gemini AI**, it provides real-time, bilingual translation with a premium user experience.

---

## ✨ Key Features

- **Premium Lumina UI**: A state-of-the-art mobile interface built with React Native, featuring modern aesthetics, glassmorphism, and fluid animations.
- **Real-time Recognition**: Continuous ASL translation (25+ classes) via WebSockets with a smart 2.5s idle detection system.
- **Multi-Modal AI**: Integrated hand tracking and Face Mesh for comprehensive gesture and facial expression analysis.
- **Smart Learning Dashboard**: Track your progress with detailed statistics, learning streaks, and personalized lesson recommendations.
- **Bilingual Translation & TTS**: Advanced English-Vietnamese translation using Gemini AI with integrated Text-to-Speech feedback.
- **History Tracking**: Securely log and review your previous translations and learning sessions.

---

## 📂 Project Structure

- **`backend/`**: High-performance FastAPI server handling AI inference, WebSockets, and Gemini integration.
- **`frontend/`**: Premium React Native (Expo) mobile application.
- **`training/`**: Research and development scripts for model training and data processing.

---

## 🚀 Quick Start

### 1. AI Backend Setup
Initialize the server to handle AI recognition and user data.
```bash
cd backend
pip install -r requirements.txt
python run.py
```

*For standalone webcam recognition:*
```bash
python main_realtime.py
```

### 2. Mobile App (Frontend)
Launch the Lumina Sign mobile interface.
```bash
cd frontend
npm install
npx expo start
```

### 3. Model Training
To retrain or fine-tune the TGCN model:
```bash
cd training
python train_tgcn_final.py
```

---

## 🛠 Tech Stack

- **AI/ML**: PyTorch, TGCN, MediaPipe, Gemini AI.
- **Backend**: Python, FastAPI, WebSockets, SQLAlchemy.
- **Mobile**: React Native, Expo, Ionicons, Linear Gradients.
- **Database**: MySQL / SQLite.

---
© 2026 Lumina Sign Team. All rights reserved.