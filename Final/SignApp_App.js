import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, CameraType } from 'expo-camera'; // Yêu cầu: npx expo install expo-camera

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  
  // States AI 
  const [prediction, setPrediction] = useState('Đang kết nối Server...');
  const [confidence, setConfidence] = useState(0);
  const [sentence, setSentence] = useState([]);
  const [translation, setTranslation] = useState('');
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [ws, setWs] = useState(null);
  
  // QUAN TRỌNG: Đổi IP này thành IPv4 của máy tính chạy code Python
  // (mở cmd -> ipconfig -> lấy IPv4 Address)
  const SERVER_IP = "192.168.1.10"; 
  const WS_URL = `ws://${SERVER_IP}:8000/ws/stream`;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    let websocket;
    const connectWS = () => {
      websocket = new WebSocket(WS_URL);
      
      websocket.onopen = () => {
        setIsWsOpen(true);
        setPrediction('Server đã sẵn sàng (Đang chờ)');
      };
      
      websocket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setPrediction(data.prediction);
          setConfidence(data.confidence);
          setSentence(data.sentence);
          setTranslation(data.translation);
        } catch (err) { console.error("Lỗi parse WS:", err); }
      };
      
      websocket.onclose = () => {
        setIsWsOpen(false);
        setPrediction('Mất kết nối. Đang thử lại...');
        setTimeout(connectWS, 3000);
      };
      setWs(websocket);
    };
    
    connectWS();
    return () => { if (websocket) websocket.close(); };
  }, []);

  const sendFrame = async () => {
    // Nếu mạng hoặc camera chưa sẵn sàng thì pass frame này
    if (cameraRef.current && isWsOpen && ws) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.1, // Nén ảnh xuống nhỏ nhất để gửi cho nhanh
          base64: true,
          skipProcessing: true // Tắt xử lý ảnh để giảm độ trễ chụp
        });
        ws.send(photo.base64);
      } catch (error) {
        // Bỏ qua lỗi khung hình bị rơi
      }
    }
  };

  useEffect(() => {
    // Lấy frame liên tục mỗi 300ms (~3 fps)
    // Lưu ý: Đây là cách lấy frame cơ bản của Expo. Thực tế muốn mượt hơn nữa (15fps) bạn sẽ cần react-native-vision-camera
    const interval = setInterval(() => {
      sendFrame();
    }, 300); 
    
    return () => clearInterval(interval);
  }, [isWsOpen]);

  if (hasPermission === null) {
    return <View style={styles.loading}><ActivityIndicator size="large" /></View>;
  }
  if (hasPermission === false) {
    return <Text style={styles.errorText}>Ứng dụng cần quyền Camera để hoạt động</Text>;
  }

  return (
    <View style={styles.container}>
      {/* 1. Khu vực Video Camera */}
      <View style={styles.cameraWrapper}>
        <Camera 
          style={styles.camera} 
          type={CameraType.front} 
          ref={cameraRef} 
          ratio="16:9"
        />
        {/* Lớp phủ dự đoán Từ vựng hiện tại (HUD) */}
        <View style={styles.hudOverlay}>
           <View style={styles.hudBox}>
              <Text style={styles.hudTitle}>PREDICTION</Text>
              <Text style={styles.hudPrediction}>{prediction.toUpperCase()}</Text>
           </View>
           <View style={styles.hudConfBox}>
              <Text style={styles.hudConf}>CONF: {confidence}</Text>
           </View>
        </View>
      </View>

      {/* 2. Khu vực Giao diện Kết quả AI Dịch thuật */}
      <View style={styles.dashboard}>
         <View style={styles.sentenceBox}>
             <Text style={styles.dashboardTitle}>TỪ VỰNG NHẬN DIỆN (GLOSS)</Text>
             <Text style={styles.glossText}>
                {sentence.length > 0 ? sentence.join(' + ') : '---'}
             </Text>
         </View>

         <View style={styles.translationBox}>
             <Text style={styles.dashboardTitle}>AI DỊCH (TỰ ĐỘNG SAU 3S)</Text>
             <Text style={
               translation.includes("Đang Dịch") ? styles.translatingText : styles.translationText
             }>
                {translation || '...'}
             </Text>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark mode background
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212'
  },
  errorText: {
    color: 'red',
    marginTop: 50,
    textAlign: 'center',
    fontSize: 18
  },
  cameraWrapper: {
    flex: 1.5,
    width: '100%',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  hudOverlay: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  hudBox: {
    backgroundColor: 'rgba(200, 20, 20, 0.8)',
    padding: 10,
    borderRadius: 8,
    minWidth: 150,
  },
  hudTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hudPrediction: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  hudConfBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center'
  },
  hudConf: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dashboard: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: -20, // Kéo lên đè nhẹ mờng camera
  },
  sentenceBox: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  dashboardTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  glossText: {
    color: '#FFD700', // Vàng
    fontSize: 18,
    fontWeight: 'bold',
  },
  translationBox: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    flex: 1,
  },
  translationText: {
    color: '#00FA9A', // Xanh mint
    fontSize: 22,
    fontWeight: 'bold',
  },
  translatingText: {
    color: '#A9A9A9', // Xám mờ cho lúc đang dịch
    fontSize: 20,
    fontStyle: 'italic',
  }
});
