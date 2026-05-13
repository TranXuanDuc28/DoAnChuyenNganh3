import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    Image, 
    TouchableOpacity, 
    SafeAreaView,
    StatusBar,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { styles } from '../styles/LessonDetailStyles';
import { LinearGradient } from 'expo-linear-gradient';

const API_BASE = "https://phrenologic-lindsy-abstractedly.ngrok-free.dev";

const LessonDetailScreen = ({ navigation, route }) => {
    const { category_id, category_name } = route.params;
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLessons();
    }, [category_id]);

    const fetchLessons = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/v1/lessons?category_id=${category_id}`);
            const data = await response.json();
            setLessons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching lessons for category:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header Navigation */}
            <View style={styles.headerNav}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color="#4317C6" />
                </TouchableOpacity>
                <Text style={styles.headerLogoText}>Lumina Sign</Text>
                <Image 
                    source={{ uri: 'https://placehold.co/40x40' }} 
                    style={styles.headerProfilePic} 
                />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
            >
                {/* Video Card Player (Show thumbnail of first lesson) */}
                <View style={styles.videoCard}>
                    <Image 
                        source={{ uri: (lessons.length > 0 && lessons[0].thumbnail) ? `${API_BASE}/static/${lessons[0].thumbnail}` : 'https://placehold.co/342x192' }} 
                        style={styles.videoPlaceholder} 
                        resizeMode="cover"
                    />
                    
                    <TouchableOpacity style={styles.playButtonCenter} onPress={() => {
                        if(lessons.length > 0) navigation.navigate('PracticeDetail', { lessonId: lessons[0].lesson_id })
                    }}>
                        <Ionicons name="play" size={32} color="#4317C6" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>

                {/* Lesson Info Section */}
                <View style={styles.lessonInfoSection}>
                    <Text style={styles.lessonTitle}>{category_name} Mastery</Text>
                    <Text style={styles.lessonDescription}>
                        This series covers {lessons.length} essential signs related to {category_name.toLowerCase()}. 
                        Start your journey to master communication in this domain.
                    </Text>
                    <View style={styles.tagRow}>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>#{category_name.replace(/\s+/g, '_')}</Text>
                        </View>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>#Basic</Text>
                        </View>
                    </View>
                </View>

                {/* Vocabulary Section */}
                <View style={styles.vocabularySection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Vocabulary in lesson</Text>
                        <Text style={styles.sectionCount}>{lessons.length} signs</Text>
                    </View>
                    <View style={styles.vocabList}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#4317C6" />
                        ) : (
                            lessons.map((item) => (
                                <TouchableOpacity 
                                    key={item.lesson_id} 
                                    style={styles.vocabItem}
                                    onPress={() => navigation.navigate('PracticeDetail', { lessonId: item.lesson_id })}
                                >
                                    <View style={styles.vocabIconContainer}>
                                        <Ionicons name="hand-right-outline" size={24} color="#4317C6" />
                                    </View>
                                    <View style={styles.vocabInfo}>
                                        <Text style={styles.vocabName}>{item.title}</Text>
                                        <Text style={styles.vocabUppercase}>{item.title.toUpperCase()}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#C9C4D8" />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>

                {/* Action Buttons Section */}
                <View style={styles.actionSectionContainer}>
                    <TouchableOpacity 
                        style={styles.btnPracticeNow}
                        onPress={() => {
                            if (lessons.length > 0) navigation.navigate('PracticeDetail', { lessonId: lessons[0].lesson_id });
                        }}
                    >
                        <LinearGradient
                            colors={['#7B61FF', '#A78BFA']}
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="flash-outline" size={20} color="white" />
                            <Text style={styles.btnTextWhite}>Practice Now</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.secondaryButtonRow}>
                        <TouchableOpacity 
                            style={styles.btnTakeQuiz}
                            onPress={() => navigation.navigate('Quiz', { categoryId: category_id, categoryName: category_name })}
                        >
                            <Ionicons name="help-circle-outline" size={20} color="#4317C6" />
                            <Text style={styles.btnTextPurple}>Take Quiz</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnDictionary}>
                            <Ionicons name="book-outline" size={20} color="#5E5D69" />
                            <Text style={styles.btnTextGray}>Dictionary</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={[styles.navItemTab, styles.navItemActive]}>
                    <Ionicons name="school" size={24} color="#4317C6" />
                    <Text style={[styles.navItemText, styles.navItemTextActive]}>Learn</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItemTab}>
                    <Ionicons name="hand-right-outline" size={24} color="#5E5D69" />
                    <Text style={styles.navItemText}>Practice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItemTab}>
                    <Ionicons name="stats-chart-outline" size={24} color="#5E5D69" />
                    <Text style={styles.navItemText}>Stats</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItemTab}>
                    <Ionicons name="person-outline" size={24} color="#5E5D69" />
                    <Text style={styles.navItemText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default LessonDetailScreen;
