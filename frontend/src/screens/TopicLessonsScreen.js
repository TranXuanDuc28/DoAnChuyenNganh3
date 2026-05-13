import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Image, 
    SafeAreaView,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/ExploreStyles';

const API_BASE = "https://phrenologic-lindsy-abstractedly.ngrok-free.dev"; 

const TopicLessonsScreen = ({ navigation, route }) => {
    const { category_id, category_name } = route.params;
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLessons();
    }, []);

    const fetchLessons = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/v1/lessons?category_id=${category_id}`);
            const data = await response.json();
            setLessons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching lessons:", error);
            setLessons([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header with Back Button */}
            <View style={[styles.topNav, { justifyContent: 'flex-start', gap: 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#4317C6" />
                </TouchableOpacity>
                <Text style={styles.logoText}>{category_name}</Text>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
            >
                <View style={styles.headerWrapper}>
                    <Text style={styles.title}>{category_name} Lessons</Text>
                    <Text style={styles.subtitle}>
                        Mastering signs for {category_name.toLowerCase()}.
                    </Text>
                </View>

                {/* Lesson Cards */}
                <View style={styles.lessonList}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#4317C6" style={{ marginTop: 40 }} />
                    ) : lessons.length > 0 ? (
                        lessons.map((lesson) => (
                            <TouchableOpacity 
                                key={lesson.lesson_id} 
                                style={styles.lessonCard}
                                onPress={() => navigation.navigate('LessonDetail', { lessonId: lesson.lesson_id })}
                            >
                                <View style={styles.lessonCardTop}>
                                    <View style={styles.lessonImageContainer}>
                                        <Image 
                                            source={{ uri: lesson.thumbnail ? `${API_BASE}/static/${lesson.thumbnail}` : 'https://placehold.co/96x96' }} 
                                            style={styles.lessonImage} 
                                        />
                                    </View>
                                    <View style={styles.lessonInfo}>
                                        <View style={styles.badgeRow}>
                                            <View style={styles.levelBadge}>
                                                <Text style={styles.levelBadgeText}>{lesson.difficulty.toUpperCase()}</Text>
                                            </View>
                                            <Text style={styles.completionText}>0% Complete</Text>
                                        </View>
                                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                                        <Text numberOfLines={2} style={styles.lessonDesc}>
                                            Learn the sign for "{lesson.title}" and its variations.
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cardStatsRow}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="book-outline" size={16} color="#484555" />
                                        <Text style={styles.statText}>1 word</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Ionicons name="time-outline" size={16} color="#484555" />
                                        <Text style={styles.statText}>~1 min</Text>
                                    </View>
                                </View>

                                <View style={styles.progressBarBackground}>
                                    <View style={[styles.progressBarFill, { width: `0%`, backgroundColor: '#4317C6' }]} />
                                </View>

                                <TouchableOpacity 
                                    style={[styles.startButton, { backgroundColor: '#5B3CDD' }]}
                                    onPress={() => navigation.navigate('LessonDetail', { lessonId: lesson.lesson_id })}
                                >
                                    <Text style={[styles.startButtonText, { color: '#D7CFFF' }]}>
                                        Start Lesson
                                    </Text>
                                    <Ionicons name="play" size={14} color="#D7CFFF" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Text style={{ color: '#797587', fontFamily: 'Lexend' }}>No lessons found.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default TopicLessonsScreen;
