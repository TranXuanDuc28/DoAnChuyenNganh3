import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    Image, 
    SafeAreaView, 
    StatusBar,
    ScrollView,
    ActivityIndicator,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/PracticeDetailStyles';
import { LinearGradient } from 'expo-linear-gradient';

import { Video } from 'expo-av';

import { API_BASE } from '../constants/Config';

const PracticeDetailScreen = ({ navigation, route }) => {
    const { lessonId } = route.params || { lessonId: 1 };
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = React.useRef(null);

    useEffect(() => {
        fetchLessonDetail();
    }, [lessonId]);

    const fetchLessonDetail = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/lessons/${lessonId}`);
            const data = await response.json();
            setLesson(data);
        } catch (error) {
            console.error("Error fetching lesson detail:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayPause = async () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            await videoRef.current.pauseAsync();
        } else {
            await videoRef.current.playAsync();
        }
        setIsPlaying(!isPlaying);
    };

    if (loading) return (
        <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color="#4317C6" />
        </SafeAreaView>
    );

    if (!lesson) return (
        <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text>Lesson not found.</Text>
        </SafeAreaView>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header Overlay */}
            <View style={styles.headerOverlay}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity 
                        style={styles.backIconContainer}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#4317C6" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleText}>Learn Sign: {lesson.title}</Text>
                </View>
                <View style={styles.headerProfile}>
                    <Image source={{ uri: 'https://placehold.co/36x36' }} style={{ width: '100%', height: '100%' }} />
                </View>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
            >
                {/* Video Section */}
                <TouchableOpacity 
                    style={styles.videoContainer} 
                    activeOpacity={0.9} 
                    onPress={handlePlayPause}
                >
                    <View style={styles.videoWrapper}>
                        {lesson.video_url ? (
                            <Video
                                ref={videoRef}
                                source={{ uri: `${API_BASE}/static/${lesson.video_url}` }}
                                style={styles.videoPlaceholder}
                                resizeMode="cover"
                                isLooping
                                onPlaybackStatusUpdate={status => setIsPlaying(status.isPlaying)}
                            />
                        ) : (
                            <Image 
                                source={{ uri: lesson.thumbnail ? `${API_BASE}/static/${lesson.thumbnail}` : 'https://placehold.co/338x188' }} 
                                style={styles.videoPlaceholder} 
                            />
                        )}
                        
                        {/* Viewfinder Corners */}
                        <View style={styles.markerContainer}>
                            <View style={[styles.markerBase, styles.markerTopLeft]} />
                            <View style={[styles.markerBase, styles.markerTopRight]} />
                            <View style={[styles.markerBase, styles.markerBottomLeft]} />
                            <View style={[styles.markerBase, styles.markerBottomRight]} />
                        </View>

                        {/* Play Button Overlay - Only visible when NOT playing */}
                        {!isPlaying && (
                            <View style={styles.playButtonOverlay} pointerEvents="none">
                                <LinearGradient
                                    colors={['#7B61FF', '#A78BFA']}
                                    style={styles.playButtonCircle}
                                >
                                    <Ionicons 
                                        name="play" 
                                        size={32} 
                                        color="white" 
                                        style={{ marginLeft: 4 }} 
                                    />
                                </LinearGradient>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Media Control Bar */}
                <View style={styles.controlBar}>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={styles.controlItem}>
                            <Ionicons name="speedometer-outline" size={20} color="#4317C6" />
                            <Text style={[styles.controlText, { color: '#4317C6' }]}>0.5x</Text>
                        </View>
                        <View style={styles.controlItem}>
                            <Ionicons name="refresh-outline" size={20} color="#484555" />
                            <Text style={styles.controlText}>Replay</Text>
                        </View>
                    </View>
                    <View style={styles.trackWrapper}>
                        <LinearGradient
                            colors={['#7B61FF', '#A78BFA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.trackFill}
                        />
                    </View>
                    <Text style={styles.timerText}>0:01 / 0:03</Text>
                </View>

                {/* Instruction Content */}
                <View style={styles.contentSection}>
                    <Text style={styles.howToTitle}>How to sign "{lesson.title}"</Text>
                    
                    <View style={styles.stepList}>
                        {[
                            { id: 1, text: 'Raise your right hand near your forehead.', label: 'Initial Position', icon: 'hand-left-outline' },
                            { id: 2, text: 'Palm facing outward.', label: 'Orientation', icon: 'hand-right-outline' },
                            { id: 3, text: 'Wave slightly forward.', label: 'Motion Vector', icon: 'trending-up-outline' }
                        ].map((step) => (
                            <View key={step.id} style={styles.stepCard}>
                                <View style={styles.stepCircle}>
                                    <Text style={styles.stepNumber}>{step.id}</Text>
                                </View>
                                <View style={styles.stepRight}>
                                    <Text style={styles.stepText}>{step.text}</Text>
                                    <View style={styles.stepLabelRow}>
                                        <Ionicons name={step.icon} size={14} color="#4317C6" />
                                        <Text style={styles.stepLabelText}>{step.label}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Footer Navigation */}
            <View style={styles.footerOverlay}>
                <View style={styles.footerNavRow}>
                    <TouchableOpacity style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={20} color="#484555" />
                        <Text style={styles.navBtnText}>Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navBtn}>
                        <Text style={styles.navBtnText}>Next</Text>
                        <Ionicons name="chevron-forward" size={20} color="#484555" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('Main', { lessonId: lesson.lesson_id })}
                >
                    <LinearGradient
                        colors={['#7B61FF', '#A78BFA']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />
                    <Ionicons name="scan-outline" size={20} color="white" />
                    <Text style={styles.actionBtnText}>Practice Again</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PracticeDetailScreen;
