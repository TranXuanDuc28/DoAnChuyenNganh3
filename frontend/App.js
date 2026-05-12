import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

// --- ĐỊA CHỈ SERVER (Thay bằng IPv4 máy tính của bạn) ---
const SERVER_IP = "192.168.1.17"; 
const WS_URL = `ws://${SERVER_IP}:8000/ws/json`;

export default function App() {
    const [prediction, setPrediction] = useState('Đang chờ camera...');
    const [confidence, setConfidence] = useState(0);
    const [sentence, setSentence] = useState([]);
    const [translation, setTranslation] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
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
                    if (data.status === "translating") {
                        setIsTranslating(true);
                        setTranslation("AI Đang Dịch...");
                    } else {
                        setIsTranslating(false);
                    }
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

    // --- Tự động đọc câu khi dịch xong ---
    useEffect(() => {
        if (translation && !translation.includes("...") && translation !== "Chuẩn bị dịch...") {
            Speech.speak(translation, {
                language: 'en-US', // Đọc giọng tiếng Anh chuẩn
                pitch: 1.0,
                rate: 0.9, // Tốc độ đọc chậm rãi, dễ nghe
            });
        }
    }, [translation]);

    // --- CÁC HÀM ĐIỀU KHIỂN (GỬI LỆNH LÊN SERVER) ---
    const sendCommand = (cmd) => {
        if (ws.current && wsConnected) {
            ws.current.send(JSON.stringify({ command: cmd }));
        }
    };

    const onDeleteLast = () => sendCommand("delete_last");
    const onClearAll = () => sendCommand("clear_all");
    const onTranslate = () => sendCommand("translate");

    const onMessageFromWebView = (event) => {
        if (!wsConnected || !ws.current) return;
        try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.error) return;
            ws.current.send(JSON.stringify(msg));
        } catch (e) { }
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
      <style>
        body { margin: 0; padding: 0; overflow: hidden; background: black; }
        #video { width: 100vw; height: 100vh; object-fit: contain; transform: scaleX(-1); position: absolute; top:0; left:0; }
        #canvas { width: 100vw; height: 100vh; object-fit: contain; transform: scaleX(-1); position: absolute; top:0; left:0; z-index: 10; }
      </style>
    </head>
    <body>
      <video id="video" playsinline autoplay muted></video>
      <canvas id="canvas"></canvas>
      <script>
        const videoElement = document.getElementById('video');
        const canvasElement = document.getElementById('canvas');
        const canvasCtx = canvasElement.getContext('2d');

        const holistic = new Holistic({locateFile: (file) => {
          return "https://cdn.jsdelivr.net/npm/@mediapipe/holistic/" + file;
        }});
        holistic.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        
        holistic.onResults((results) => {
          // VẼ KHUNG XƯƠNG LÊN CANVAS
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          
          // 1. Vẽ Pose (Cơ thể) - Màu trắng mờ
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: 'rgba(255,255,255,0.5)', lineWidth: 2});
          
          // 2. Vẽ bàn tay trái - Màu xanh lá
          drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {color: '#4CD964', lineWidth: 3});
          drawLandmarks(canvasCtx, results.leftHandLandmarks, {color: '#FFFFFF', lineWidth: 1, radius: 2});
          
          // 3. Vẽ bàn tay phải - Màu vàng
          drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {color: '#FFCC00', lineWidth: 3});
          drawLandmarks(canvasCtx, results.rightHandLandmarks, {color: '#FFFFFF', lineWidth: 1, radius: 2});
          
          canvasCtx.restore();

          // Gửi tọa độ về App (để Backend xử lý AI)
          const landmarks = {
            pose: results.poseLandmarks ? results.poseLandmarks.map(p => [p.x, p.y, p.z]) : null,
            left_hand: results.leftHandLandmarks ? results.leftHandLandmarks.map(p => [p.x, p.y, p.z]) : null,
            right_hand: results.rightHandLandmarks ? results.rightHandLandmarks.map(p => [p.x, p.y, p.z]) : null
          };
          window.ReactNativeWebView.postMessage(JSON.stringify(landmarks));
        });

        async function startCamera() {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
            videoElement.srcObject = stream;
            async function processFrame() {
              if (videoElement.paused || videoElement.ended) return;
              await holistic.send({image: videoElement});
              requestAnimationFrame(processFrame);
            }
            videoElement.onloadedmetadata = () => { videoElement.play(); processFrame(); };
          } catch (err) { window.ReactNativeWebView.postMessage(JSON.stringify({error: err.name + ": " + err.message})); }
        }
        startCamera();
      </script>
    </body>
    </html>
    `;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.cameraContainer}>
                <WebView
                    originWhitelist={['*']}
                    source={{ html: htmlContent, baseUrl: 'https://localhost' }}
                    style={styles.webView}
                    onMessage={onMessageFromWebView}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    scrollEnabled={false}
                    mediaCapturePermissionGrantType="grant"
                />
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

            {/* BỘ NÚT ĐIỀU KHIỂN (CONTROL PANEL) */}
            <View style={styles.controlPanel}>
                <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={onDeleteLast}>
                    <Text style={styles.btnText}>XÓA TỪ</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.btnClear]} onPress={onClearAll}>
                    <Text style={styles.btnText}>XÓA HẾT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btn, styles.btnTranslate, isTranslating && styles.btnDisabled]}
                    onPress={onTranslate}
                    disabled={isTranslating}
                >
                    <Text style={styles.btnText}>DỊCH NGAY</Text>
                </TouchableOpacity>
            </View>

            {/* DASHBOARD KẾT QUẢ */}
            <View style={styles.dashboard}>
                <View style={styles.section}>
                    <Text style={styles.label}>TỪ VỰNG (GLOSS):</Text>
                    <Text style={styles.glossValue}>{sentence.length > 0 ? sentence.join(' · ') : '---'}</Text>
                </View>
                <View style={[styles.section, styles.translationSection]}>
                    <Text style={styles.label}>KẾT QUẢ AI DỊCH:</Text>
                    <Text style={isTranslating ? styles.translationPending : styles.translationValue}>
                        {translation || 'Vui lòng nhấn [Dịch ngay]...'}
                    </Text>
                </View>
                {!wsConnected && (
                    <View style={styles.errorBanner}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.errorText}> Mất kết nối Server...</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    cameraContainer: { flex: 1.5, position: 'relative', overflow: 'hidden', borderRadius: 20, margin: 10 },
    webView: { flex: 1, backgroundColor: 'transparent' },
    hudContainer: { position: 'absolute', top: 20, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between' },
    predictionBadge: { backgroundColor: 'rgba(255, 69, 0, 0.85)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, minWidth: 140 },
    badgeTitle: { color: '#fff', fontSize: 10, fontWeight: 'bold', opacity: 0.8 },
    badgeText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    confBadge: { backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // --- Styles cho Nút bấm mới ---
    controlPanel: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    btn: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    btnDelete: { backgroundColor: '#444' },
    btnClear: { backgroundColor: '#B22222' },
    btnTranslate: { backgroundColor: '#4CD964', minWidth: 140 },
    btnDisabled: { backgroundColor: '#225522', opacity: 0.6 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

    dashboard: { flex: 1, backgroundColor: '#1A1A1A', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, elevation: 20 },
    section: { marginBottom: 15 },
    label: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    glossValue: { color: '#F9D423', fontSize: 18, fontWeight: 'bold' },
    translationSection: { flex: 1, backgroundColor: '#262626', padding: 15, borderRadius: 15 },
    translationValue: { color: '#4CD964', fontSize: 20, fontWeight: 'bold' },
    translationPending: { color: '#8E8E93', fontSize: 18, fontStyle: 'italic' },
    errorBanner: { position: 'absolute', bottom: 10, left: 25, right: 25, backgroundColor: '#FF3B30', flexDirection: 'row', padding: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});

registerRootComponent(App);
