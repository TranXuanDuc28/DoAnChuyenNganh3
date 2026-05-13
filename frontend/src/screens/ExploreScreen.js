import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    SafeAreaView,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { styles } from '../styles/ExploreStyles';

const API_BASE = "https://phrenologic-lindsy-abstractedly.ngrok-free.dev"; 

const topicConfig = {
    'Greetings': { icon: 'hand-peace', color: '#7B61FF', bg: '#F2EEFF' },
    'Family': { icon: 'users', color: '#FF6B6B', bg: '#FFF0F0' },
    'Food': { icon: 'utensils', color: '#4ECDC4', bg: '#EFFFFD' },
    'Daily Actions': { icon: 'walking', color: '#FFD93D', bg: '#FFFBEB' },
    'School': { icon: 'graduation-cap', color: '#6BCB77', bg: '#F0FFF4' },
    'Emotion': { icon: 'smile', color: '#FF9F43', bg: '#FFF5EB' },
    'Numbers': { icon: 'list-ol', color: '#54A0FF', bg: '#EBF5FF' },
    'Colors': { icon: 'palette', color: '#5F27CD', bg: '#F3EBFF' },
    'General': { icon: 'star', color: '#797587', bg: '#F1ECF9' }
};

const ExploreScreen = ({ navigation }) => {
    const [lessons, setLessons] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState('All');

    useEffect(() => {
        fetchCategories();
        fetchLessons();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/categories`);
            const data = await response.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchLessons = async (catId = null) => {
        setLoading(true);
        try {
            let url = `${API_BASE}/api/v1/lessons`;
            if (catId) url += `?category_id=${catId}`;
            
            const response = await fetch(url);
            const data = await response.json();
            setLessons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching lessons:", error);
            setLessons([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryPress = (catId) => {
        setSelectedCategory(catId);
        fetchLessons(catId);
    };

    const handleLevelPress = (level) => {
        setSelectedLevel(level);
        // Local filtering normally, but let's just keep it simple for now
    };

    const filteredLessons = (lessons || []).filter(lesson => {
        if (!lesson || !lesson.difficulty) return false;
        if (selectedLevel === 'All') return true;
        return lesson.difficulty.toLowerCase() === selectedLevel.toLowerCase();
    });
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Top Navigation */}
            <View style={styles.topNav}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Ionicons name="flash" size={16} color="white" style={{alignSelf: 'center', marginTop: 3}} />
                    </View>
                    <Text style={styles.logoText}>Lumina Sign</Text>
                </View>
                <Image 
                    source={{ uri: 'https://placehold.co/40x40' }} 
                    style={styles.profilePic} 
                />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
            >
                {/* Header */}
                <View style={styles.headerWrapper}>
                    <Text style={styles.title}>Explore Lessons</Text>
                    <Text style={styles.subtitle}>
                        Continue your sign language mastery{'\n'}journey.
                    </Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#797587" style={styles.searchIcon} />
                    <Text style={styles.searchPlaceholder}>Search topics...</Text>
                </View>

                {/* Category Cards */}
                <View style={styles.lessonList}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#4317C6" style={{ marginTop: 40 }} />
                    ) : (
                        categories.map((cat) => {
                            const config = topicConfig[cat.category_name] || topicConfig['General'];
                            return (
                                <TouchableOpacity 
                                    key={cat.category_id} 
                                    style={styles.lessonCard}
                                    onPress={() => navigation.navigate('LessonDetail', { 
                                        category_id: cat.category_id, 
                                        category_name: cat.category_name 
                                    })}
                                >
                                    <View style={styles.lessonCardTop}>
                                        <View style={[styles.lessonImageContainer, { backgroundColor: config.bg, justifyContent: 'center', alignItems: 'center' }]}>
                                            {/* Priority: Real Image (if any) -> Themed Icon */}
                                            {cat.image ? (
                                                <Image source={{ uri: cat.image }} style={styles.lessonImage} />
                                            ) : (
                                                <FontAwesome5 name={config.icon} size={32} color={config.color} />
                                            )}
                                        </View>
                                        <View style={styles.lessonInfo}>
                                            <View style={styles.badgeRow}>
                                                <View style={styles.levelBadge}>
                                                    <Text style={styles.levelBadgeText}>BASIC</Text>
                                                </View>
                                                <Text style={styles.completionText}>0% Complete</Text>
                                            </View>
                                            <Text style={styles.lessonTitle}>{cat.category_name}</Text>
                                            <Text numberOfLines={2} style={styles.lessonDesc}>
                                                Explore the vocabulary for {cat.category_name.toLowerCase()}.
                                            </Text>
                                        </View>
                                    </View>

                                <View style={styles.cardStatsRow}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="book-outline" size={16} color="#484555" />
                                        <Text style={styles.statText}>{cat.lesson_count} signs</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Ionicons name="time-outline" size={16} color="#484555" />
                                        <Text style={styles.statText}>~10 mins</Text>
                                    </View>
                                </View>

                                <View style={styles.progressBarBackground}>
                                    <View style={[styles.progressBarFill, { width: '0%', backgroundColor: '#7B61FF' }]} />
                                </View>

                                <TouchableOpacity 
                                    style={styles.startButton} 
                                    onPress={() => navigation.navigate('LessonDetail', { 
                                        category_id: cat.category_id, 
                                        category_name: cat.category_name 
                                    })}
                                >
                                    <Text style={styles.startButtonText}>Start Learning</Text>
                                    <Ionicons name="play" size={14} color="white" />
                                </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>

        </SafeAreaView>
    );
};

export default ExploreScreen;
