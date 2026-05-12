import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/AppStyles';

// --- ĐỊA CHỈ SERVER ---
const SERVER_IP = "192.168.1.17"; 
const WS_URL = `ws://${SERVER_IP}:8000/ws/json`;

export default function MainScreen() {
    const [prediction, setPrediction] = useState('Wait...');
    const [confidence, setConfidence] = useState(0);
    const [sentence, setSentence] = useState([]);
    const [translation, setTranslation] = useState('');
    const [wsConnected, setWsConnected] = useState(false);
    const [targetLang, setTargetLang] = useState('vi'); // 'vi' hoặc 'en'
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

    // --- Hàm xử lý đọc văn bản ---
    const speakText = (text) => {
        if (!text || text.includes("...")) return;
        
        Speech.speak(text, {
            language: targetLang === 'vi' ? 'vi-VN' : 'en-US',
            pitch: 1.0,
            rate: 0.9,
        });
    };

    // --- Tự động đọc câu khi dịch xong ---
    useEffect(() => {
        if (translation && !isTranslating) {
            speakText(translation);
        }
    }, [translation, isTranslating]);

    const sendCommand = (cmd, extraData = {}) => {
        if (ws.current && wsConnected) {
            ws.current.send(JSON.stringify({ command: cmd, ...extraData }));
        }
    };

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
        #video { width: 100vw; height: 100vh; object-fit: cover; transform: scaleX(-1); position: absolute; top:0; left:0; }
        #canvas { width: 100vw; height: 100vh; object-fit: cover; transform: scaleX(-1); position: absolute; top:0; left:0; z-index: 10; }
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
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: 'rgba(255,255,255,0.3)', lineWidth: 2});
          drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {color: '#6C5CE7', lineWidth: 3});
          drawLandmarks(canvasCtx, results.leftHandLandmarks, {color: '#FFFFFF', lineWidth: 1, radius: 2});
          drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {color: '#6C5CE7', lineWidth: 3});
          drawLandmarks(canvasCtx, results.rightHandLandmarks, {color: '#FFFFFF', lineWidth: 1, radius: 2});
          canvasCtx.restore();

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
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.profilePic}>
                    <Ionicons name="person-circle" size={40} color="#6C5CE7" />
                </View>
                <Text style={styles.appTitle}>Lumina Sign</Text>
                
                {/* Language Toggle */}
                <View style={styles.langToggle}>
                    <TouchableOpacity 
                        style={[styles.langBtn, targetLang === 'vi' && styles.langBtnActive]}
                        onPress={() => setTargetLang('vi')}
                    >
                        <Text style={[styles.langText, targetLang === 'vi' && styles.langTextActive]}>VI</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.langBtn, targetLang === 'en' && styles.langBtnActive]}
                        onPress={() => setTargetLang('en')}
                    >
                        <Text style={[styles.langText, targetLang === 'en' && styles.langTextActive]}>EN</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={24} color="#636E72" />
                </TouchableOpacity>
            </View>

            {/* Camera Viewfinder */}
            <View style={styles.cameraWrapper}>
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
                
                {/* Focus Frame Overlay */}
                <View style={styles.focusFrame}>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerBR} />
                </View>

                {/* Floating Actions */}
                <View style={styles.floatingActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => sendCommand("clear_all")}>
                        <Ionicons name="refresh-outline" size={22} color="#6C5CE7" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="camera-reverse-outline" size={22} color="#6C5CE7" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.actionBtnPrimary]} 
                        onPress={() => sendCommand("translate", { lang: targetLang })}
                    >
                        <Ionicons name="videocam" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Connection Error Overlay */}
                {!wsConnected && (
                    <View style={styles.errorOverlay}>
                        <Text style={styles.errorText}>Mất kết nối server...</Text>
                    </View>
                )}

                {/* Result Card (Floating) */}
                <View style={styles.resultCard}>
                    <View style={styles.liveStatus}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>LIVE TRANSLATION</Text>
                    </View>
                    
                    <View style={styles.translationRow}>
                        <Text style={styles.translationText}>
                            {translation || (sentence.length > 0 ? sentence.join(' ') : 'Bắt đầu ký hiệu để dịch...')}
                        </Text>
                        <TouchableOpacity 
                            style={styles.ttsBtn}
                            onPress={() => speakText(translation || (sentence.length > 0 ? sentence.join(' ') : ''))}
                        >
                            <Ionicons name="volume-medium" size={24} color="#6C5CE7" />
                        </TouchableOpacity>
                    </View>

                    {/* Waveform Visualizer Placeholder */}
                    <View style={styles.waveformContainer}>
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <View 
                                key={i} 
                                style={[styles.waveBar, { height: Math.random() * 15 + 5, opacity: isTranslating ? 1 : 0.4 }]} 
                            />
                        ))}
                    </View>
                </View>
            </View>

            {/* Bottom Tab Navigation */}
            <View style={styles.bottomTab}>
                <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
                    <Ionicons name="home" size={20} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.tabItem}>
                    <Ionicons name="eye-outline" size={20} color="#636E72" />
                    <Text style={styles.tabText}>Trans</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tabItem}>
                    <Ionicons name="school-outline" size={20} color="#636E72" />
                    <Text style={styles.tabText}>Learn</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tabItem}>
                    <Ionicons name="stats-chart-outline" size={20} color="#636E72" />
                    <Text style={styles.tabText}>Stats</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tabItem}>
                    <Ionicons name="person-outline" size={20} color="#636E72" />
                    <Text style={styles.tabText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
