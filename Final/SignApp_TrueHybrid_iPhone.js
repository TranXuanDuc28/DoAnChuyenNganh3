import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview'; // Cài đặt: npx expo install react-native-webview

const { width, height } = Dimensions.get('window');

// --- ĐỊA CHỈ SERVER (Thay bằng IPv4 máy tính của bạn) ---
const SERVER_IP = "192.168.1.10"; 
const WS_URL = `ws://${SERVER_IP}:8000/ws/json`;

export default function App() {
  const [prediction, setPrediction] = useState('Đang chờ camera...');
  const [confidence, setConfidence] = useState(0);
  const [sentence, setSentence] = useState([]);
  const [translation, setTranslation] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const ws = useRef(null);

  // --- Khởi tạo WebSocket ---
  useEffect(() => {
    const connectWS = () => {
      ws.current = new WebSocket(WS_URL);
      ws.current.onopen = () => setWsConnected(true);
      ws.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.prediction) setPrediction(data.prediction);
          if (data.confidence !== undefined) setConfidence(data.confidence);
          if (data.sentence) setSentence(data.sentence);
          if (data.translation) setTranslation(data.translation);
          if (data.status === "translating") setTranslation("AI Đang Dịch...");
        } catch (err) { console.error("WS Parse Error:", err); }
      };
      ws.current.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWS, 3000);
      };
    };
    connectWS();
    return () => ws.current?.close();
  }, []);

  // --- Hàm xử lý tin nhắn từ WebView (MediaPipe JSON) ---
  const onMessageFromWebView = (event) => {
    if (!wsConnected || !ws.current) return;
    
    try {
      const landmarks = JSON.parse(event.nativeEvent.data);
      // Gửi toạ độ thô JSON sang Server (Dữ liệu cực nhẹ)
      ws.current.send(JSON.stringify(landmarks));
    } catch (e) {
      console.error("Lỗi gửi tọa độ:", e);
    }
  };

  // --- HTML Engine (MediaPipe Holistic JS cho iPhone) ---
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
      <style>
        body { margin: 0; padding: 0; overflow: hidden; background: black; }
        #video { width: 100vw; height: 100vh; object-fit: cover; transform: scaleX(-1); }
        #canvas { display: none; }
      </style>
    </head>
    <body>
      <video id="video" playsinline></video>
      <script>
        const videoElement = document.getElementById('video');
        const holistic = new Holistic({locateFile: (file) => {
          return \`https://cdn.jsdelivr.net/npm/@mediapipe/holistic/\${file}\`;
        }});

        holistic.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        holistic.onResults((results) => {
          // Chỉ gửi 1 lần mỗi 200ms để tránh nghẽn luồng WebView (Khoảng 5 FPS là đủ cho TGCN)
          // Hoặc gửi liên tục nếu mạng Wifi mạnh.
          const landmarks = {
            pose: results.poseLandmarks ? results.poseLandmarks.map(p => [p.x, p.y, p.z]) : null,
            left_hand: results.leftHandLandmarks ? results.leftHandLandmarks.map(p => [p.x, p.y, p.z]) : null,
            right_hand: results.rightHandLandmarks ? results.rightHandLandmarks.map(p => [p.x, p.y, p.z]) : null
          };
          window.ReactNativeWebView.postMessage(JSON.stringify(landmarks));
        });

        const camera = new Camera(videoElement, {
          onFrame: async () => {
             await holistic.send({image: videoElement});
          },
          width: 640,
          height: 480
        });
        camera.start();
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. WebView chạy MediaPipe Ẩn bên dưới Camera hiển thị */}
      <View style={styles.cameraContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webView}
          onMessage={onMessageFromWebView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          scrollEnabled={false}
        />
        
        {/* Lớp phủ Giao diện AI (HUD) */}
        <View style={styles.hudContainer}>
           <View style={styles.predictionBadge}>
              <Text style={styles.badgeTitle}>TRẠNG THÁI AI</Text>
              <Text style={styles.badgeText}>{prediction}</Text>
           </View>
           <View style={styles.confBadge}>
              <Text style={styles.confText}>{Math.round(confidence * 100)}%</Text>
           </View>
        </View>
      </View>

      {/* 2. Khu vực Dashboard kết quả (Dưới cùng) */}
      <View style={styles.dashboard}>
        <View style={styles.section}>
          <Text style={styles.label}>TỪ VỰNG (GLOSS):</Text>
          <Text style={styles.glossValue}>{sentence.length > 0 ? sentence.join(' · ') : '---'}</Text>
        </View>
        
        <View style={[styles.section, styles.translationSection]}>
          <Text style={styles.label}>AI DỊCH (TỰ ĐỘNG SAU 3S):</Text>
          <Text style={translation.includes("...") ? styles.translationPending : styles.translationValue}>
            {translation || 'Chuẩn bị dịch...'}
          </Text>
        </View>

        {!wsConnected && (
          <View style={styles.errorBanner}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.errorText}> Mất kết nối Server Python...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 2,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    margin: 10,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  hudContainer: {
    position: 'absolute',
    top: 20,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  predictionBadge: {
    backgroundColor: 'rgba(255, 69, 0, 0.85)', // Cam đỏ đậm
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 140,
  },
  badgeTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  confBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dashboard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  glossValue: {
    color: '#F9D423',
    fontSize: 22,
    fontWeight: 'bold',
  },
  translationSection: {
    flex: 1,
    backgroundColor: '#262626',
    padding: 15,
    borderRadius: 15,
  },
  translationValue: {
    color: '#4CD964', // Apple Green
    fontSize: 24,
    fontWeight: 'bold',
  },
  translationPending: {
    color: '#8E8E93',
    fontSize: 20,
    fontStyle: 'italic',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
