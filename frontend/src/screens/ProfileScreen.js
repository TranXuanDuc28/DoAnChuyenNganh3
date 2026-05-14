import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Image,
    ScrollView,
    Alert,
    Switch,
    StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import styles from '../styles/ProfileStyles';
import { API_BASE } from '../constants/Config';

export default function ProfileScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchUserData = async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    if (!token) return;

                    const response = await fetch(`${API_BASE}/api/v1/users/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                        // Cập nhật lại AsyncStorage để đồng bộ
                        await AsyncStorage.setItem('userData', JSON.stringify(data));
                    } else {
                        // Nếu fetch lỗi, fallback về data cũ trong storage
                        const localData = await AsyncStorage.getItem('userData');
                        if (localData) setUserData(JSON.parse(localData));
                    }
                } catch (error) {
                    console.error("Error refreshing profile data:", error);
                }
            };
            fetchUserData();
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.clear();
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            })
                        );
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Image
                            source={{ uri: 'https://ui-avatars.com/api/?name=LS&background=7B61FF&color=fff' }}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                    <Text style={styles.logoText}>Lumina Sign</Text>
                </View>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={24} color="#484555" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.mainContent}>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatarWrapper}>
                            <LinearGradient
                                colors={['#7B61FF', '#A78BFA']}
                                style={styles.avatarGradient}
                            >
                                <View style={styles.avatarBorder}>
                                    <Image
                                        source={{ uri: userData?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' }}
                                        style={styles.avatar}
                                    />
                                </View>
                            </LinearGradient>
                            <TouchableOpacity 
                                style={[styles.editAvatarBtn, { backgroundColor: '#7B61FF' }]}
                                onPress={() => navigation.navigate('EditProfile')}
                            >
                                <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.userName}>{userData?.name || 'Minh Duy'}</Text>
                        <Text style={styles.userSubtitle}>Senior Sign Language Learner</Text>

                        <View style={styles.badgesRow}>
                            <View style={styles.verifiedBadge}>
                                <MaterialCommunityIcons name="check-decagram" size={14} color="#D7CFFF" />
                                <Text style={styles.verifiedText}>Verified</Text>
                            </View>
                            <View style={styles.streakBadge}>
                                <MaterialCommunityIcons name="fire" size={14} color="#62616D" />
                                <Text style={styles.streakText}>12 day streak</Text>
                            </View>
                        </View>
                    </View>

                    {/* Progress Card */}
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressTitle}>Learning Progress</Text>
                            <Text style={styles.levelBadge}>Level 14</Text>
                        </View>

                        <View style={styles.xpRow}>
                            <Text style={styles.xpLabel}>Progress to next level</Text>
                            <Text style={styles.xpValue}>840 / 1200 XP</Text>
                        </View>

                        <View style={styles.progressBarBg}>
                            <LinearGradient
                                colors={['#7B61FF', '#A78BFA']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressBarFill, { width: '70%' }]}
                            />
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Text style={styles.statBoxLabel}>Signs Learned</Text>
                                <Text style={styles.statBoxValue}>452</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statBoxLabel}>AI Accuracy</Text>
                                <Text style={styles.statBoxValue}>94%</Text>
                            </View>
                        </View>
                    </View>

                    {/* Achievement Badges */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Achievements</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllBtn}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.achievementsGrid}>
                        <View style={styles.achievementCard}>
                            <View style={styles.achievementIconBox}>
                                <MaterialCommunityIcons name="medal" size={32} color="#EAB308" />
                            </View>
                            <Text style={styles.achievementName}>Signing Master</Text>
                        </View>
                        <View style={styles.achievementCard}>
                            <View style={styles.achievementIconBox}>
                                <Ionicons name="sparkles" size={32} color="#7B61FF" />
                            </View>
                            <Text style={styles.achievementName}>AI Whisperer</Text>
                        </View>
                        <View style={[styles.achievementCard, styles.achievementCardLocked]}>
                            <View style={styles.achievementIconBox}>
                                <MaterialCommunityIcons name="star-circle" size={32} color="#484555" />
                            </View>
                            <Text style={styles.achievementName}>Weekly Top 1</Text>
                        </View>
                    </View>

                    {/* Quick Settings */}
                    <View style={styles.settingsCard}>
                        <View style={styles.settingsGroupHeader}>
                            <Text style={styles.settingsGroupTitle}>Quick Settings</Text>
                        </View>

                        <View style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="notifications-outline" size={22} color="#484555" />
                                <Text style={styles.settingText}>Reminders</Text>
                            </View>
                            <Switch
                                value={isNotificationEnabled}
                                onValueChange={setIsNotificationEnabled}
                                trackColor={{ false: '#D1D1D6', true: '#4317C6' }}
                                thumbColor={'#FFF'}
                            />
                        </View>

                        <TouchableOpacity style={styles.settingItem}>
                            <View style={styles.settingLeft}>
                                <MaterialCommunityIcons name="translate" size={22} color="#484555" />
                                <Text style={styles.settingText}>Source Language</Text>
                            </View>
                            <View style={styles.settingRight}>
                                <Text style={styles.settingValue}>Vietnamese</Text>
                                <Ionicons name="chevron-forward" size={16} color="#484555" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.settingItem, styles.settingItemLast]}
                            onPress={handleLogout}
                        >
                            <View style={styles.settingLeft}>
                                <Feather name="log-out" size={20} color="#BA1A1A" />
                                <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                <LinearGradient
                    colors={['#7B61FF', '#A78BFA']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="camera" size={28} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

