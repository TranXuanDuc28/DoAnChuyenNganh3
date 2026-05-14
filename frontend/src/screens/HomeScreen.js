import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../styles/HomeStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE } from '../constants/Config';

const HomeScreen = ({ navigation }) => {
    const [user, setUser] = useState({ name: 'Guest' });
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchUserData();
        }, [])
    );

    const fetchUserData = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE}/api/v1/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.upperHeader}>
                <View style={styles.profileSection}>
                    <View style={styles.profileImageWrapper}>
                        <Image
                            source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' }}
                            style={styles.profileImage}
                        />
                    </View>
                    <View>
                        <Text style={styles.greetingText}>Welcome back,</Text>
                        <Text style={styles.nameText}>{user.name} 👋</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={22} color="#4317C6" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.scrollContent}>
                    {/* Banner AI Gradient */}
                    <LinearGradient
                        colors={['#7B61FF', '#A78BFA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bannerCard}
                    >
                        <View style={styles.bannerDecoration} />
                        <View style={styles.bannerTag}>
                            <View style={styles.bannerTagDot} />
                            <Text style={styles.bannerTagText}>AI LIVE TRACKING</Text>
                        </View>
                        <View>
                            <Text style={styles.bannerTitle}>Real-time Sign Language{'\n'}Recognition</Text>
                            <Text style={styles.bannerDesc}>
                                Translate hand signs to text instantly{'\n'}with advanced AI technology.
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.bannerBtn}
                            onPress={() => navigation.navigate('Main')}
                        >
                            <Text style={styles.bannerBtnText}>Start Now</Text>
                            <View style={{ marginLeft: 4 }}>
                                <Ionicons name="arrow-forward" size={16} color="#4317C6" />
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
                        {[
                            { label: 'Recognition', icon: 'eye-outline', bg: '#F5F3FF', route: 'Main' },
                            { label: 'Learning', icon: 'book-outline', bg: '#F5F3FF', route: 'Explore' },
                            { label: 'Practice', icon: 'fitness-outline', bg: '#F5F3FF', route: 'Explore' },
                            { label: 'History', icon: 'time-outline', bg: '#F5F3FF', route: 'RecognitionHistory' }
                        ].map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.actionCard, { flex: 0, width: '48%' }]}
                                onPress={() => navigation.navigate(item.route)}
                            >
                                <View style={[styles.actionIconContainer, { backgroundColor: item.bg }]}>
                                    <Ionicons name={item.icon} size={22} color="#4317C6" />
                                </View>
                                <Text style={styles.actionLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Streak & Progress */}
                    <View style={styles.statsCard}>
                        <View style={styles.statsLeft}>
                            <View style={styles.streakRow}>
                                <Ionicons name="flame" size={18} color="#F97316" />
                                <Text style={styles.streakText}>14 Day Streak</Text>
                            </View>
                            <Text style={styles.statsQuote}>You're doing great!{'\n'}Keep it up.</Text>
                            <View style={{ flexDirection: 'row', gap: 4, height: 48, alignItems: 'flex-end', marginTop: 12 }}>
                                <View style={[styles.chartBar, { height: 20, backgroundColor: '#5B3CDD' }]} />
                                <View style={[styles.chartBar, { height: 35, backgroundColor: '#5B3CDD' }]} />
                                <View style={[styles.chartBar, { height: 48, backgroundColor: '#5B3CDD' }]} />
                                <View style={[styles.chartBar, { height: 13, backgroundColor: '#5B3CDD' }]} />
                                <View style={[styles.chartBar, { height: 20, backgroundColor: 'rgba(91, 60, 221, 0.20)' }]} />
                                <View style={[styles.chartBar, { height: 10, backgroundColor: 'rgba(91, 60, 221, 0.20)' }]} />
                                <View style={[styles.chartBar, { height: 4, backgroundColor: 'rgba(91, 60, 221, 0.20)' }]} />
                            </View>
                        </View>
                        <View style={styles.progressCircle}>
                            <View style={styles.circleTrack} />
                            <View style={styles.circleFill} />
                            <Text style={styles.percentageText}>70%</Text>
                        </View>
                    </View>

                    {/* Recent History */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent History</Text>
                        <TouchableOpacity><Text style={styles.viewAllBtn}>View All</Text></TouchableOpacity>
                    </View>
                    <View style={styles.historyList}>
                        <View style={styles.historyItem}>
                            <View style={styles.historyLeft}>
                                <View style={styles.historyIconBox}>
                                    <Ionicons name="language-outline" size={20} color="#4317C6" />
                                </View>
                                <View>
                                    <Text style={styles.historyTitle}>"I need help"</Text>
                                    <Text style={styles.historyTime}>Today, 10:24 AM</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.historyScanBtn}>
                                <Ionicons name="volume-medium-outline" size={18} color="#4317C6" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.historyItem}>
                            <View style={styles.historyLeft}>
                                <View style={styles.historyIconBox}>
                                    <Ionicons name="language-outline" size={20} color="#4317C6" />
                                </View>
                                <View>
                                    <Text style={styles.historyTitle}>"Thank you"</Text>
                                    <Text style={styles.historyTime}>Yesterday, 04:15 PM</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.historyScanBtn}>
                                <Ionicons name="volume-medium-outline" size={18} color="#4317C6" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Recommended Lessons */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recommended Lessons</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lessonScroll}>
                        <TouchableOpacity style={styles.lessonCard}>
                            <View style={styles.lessonImageContainer}>
                                <Image source={{ uri: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' }} style={styles.lessonImage} />
                                <View style={styles.lessonDifficulty}>
                                    <Text style={styles.lessonDifficultyText}>Basic</Text>
                                </View>
                            </View>
                            <View style={styles.lessonInfo}>
                                <Text style={styles.lessonItemTitle}>Basic Communication</Text>
                                <Text style={styles.lessonItemMeta}>15 mins • 5 lessons</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.lessonCard}>
                            <View style={styles.lessonImageContainer}>
                                <Image source={{ uri: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' }} style={styles.lessonImage} />
                                <View style={[styles.lessonDifficulty, { backgroundColor: '#E1DEEC' }]}>
                                    <Text style={[styles.lessonDifficultyText, { color: '#62616D' }]}>New</Text>
                                </View>
                            </View>
                            <View style={styles.lessonInfo}>
                                <Text style={styles.lessonItemTitle}>Alphabet Mastery</Text>
                                <Text style={styles.lessonItemMeta}>30 mins • 24 lessons</Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </ScrollView>

            {/* Floating FAB */}
            {/* <TouchableOpacity
                style={styles.fabContainer}
                onPress={() => navigation.navigate('Main')}
            >
                <Ionicons name="aperture-outline" size={32} color="white" />
            </TouchableOpacity> */}
        </SafeAreaView>
    );
};

export default HomeScreen;
