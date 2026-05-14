import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/LearningStreakStyles';
import { BottomNav } from '../components/CustomTabBar';
import { API_BASE } from '../constants/Config';

const LearningStreakScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    current_streak: 0,
    weekly_hours: 0,
    weekly_goal_hours: 15,
    daily_activity: [],
    milestones: [],
    ai_insight: ""
  });

  const fetchStreakDetails = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/streak/details`);
      const result = await response.json();
      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Streak Details Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreakDetails();
  }, []);

  const onFab = () => {
    navigation.navigate('Trans');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF8FF' }}>
        <ActivityIndicator size="large" color="#7B61FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={{ width: 24, height: 23, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="medal" size={22} color="#4317C6" />
          </View>
          <Text style={styles.logoText}>Lumina Sign</Text>
        </View>
        <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
                  }}
                  style={styles.profilePic}
                />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainPadding}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Learning Streak</Text>
            <Text style={styles.subtitle}>Keep up your amazing momentum!</Text>
          </View>

          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#E0D7FF', 'rgba(253, 248, 255, 0)']}
              style={[styles.blurOverlay, { top: -95, left: 181 }]}
            />
            <LinearGradient
              colors={['#F3F0FF', 'rgba(253, 248, 255, 0)']}
              style={[styles.blurOverlay, { top: 137, left: -95 }]}
            />
            <View style={styles.streakIconCircle}>
              <MaterialCommunityIcons name="fire" size={40} color="#7B61FF" />
            </View>
            <Text style={styles.streakValue}>{data.current_streak} Days</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Weekly Progress</Text>
              <Text style={styles.progressStats}>{data.weekly_hours}/{data.weekly_goal_hours} hours</Text>
            </View>
            <View style={styles.daysRow}>
              {data.daily_activity.map((day, index) => (
                <View key={index} style={styles.dayItem}>
                  <Text style={[styles.dayText, day.active && styles.activeDayText]}>
                    {day.label}
                  </Text>
                  <View style={[styles.dayCircle, day.active && styles.activeDayCircle]}>
                    {day.type === 'flame' && (
                      <MaterialCommunityIcons name="fire" size={20} color={day.active ? "#7B61FF" : "#908DA1"} />
                    )}
                    {day.type === 'star' && (
                      <Ionicons name="star" size={20} color="#FFFFFF" />
                    )}
                    {day.type === 'num' && (
                      <Text style={styles.dayCircleText}>{day.value}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.milestonesSection}>
            <Text style={styles.sectionHeader}>Next Milestones</Text>
            
            {data.milestones.map((milestone, index) => (
              <View key={index} style={[styles.milestoneCard, milestone.progress_percent >= 100 && styles.milestoneCardActive]}>
                <View style={styles.milestoneIconBox}>
                  {index === 0 ? (
                    <Ionicons 
                      name="medal" 
                      size={28} 
                      color={milestone.progress_percent >= 100 ? "#4317C6" : "#908DA1"} 
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name="star-circle" 
                      size={28} 
                      color={milestone.progress_percent >= 100 ? "#4317C6" : "#908DA1"} 
                    />
                  )}
                </View>
                <View style={styles.milestoneContent}>
                  <View style={styles.milestoneTitleRow}>
                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                    <Text style={styles.milestoneProgress}>{milestone.current_value}/{milestone.target_value} {milestone.unit}</Text>
                  </View>
                  <View style={styles.milestoneBarTrack}>
                    <View style={[styles.milestoneBarFill, { width: `${milestone.progress_percent}%` }]} />
                  </View>
                  <Text style={styles.milestoneDesc}>{milestone.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.insightCard}>
            <LinearGradient
              colors={['#F3F0FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.insightGradient}
            >
              <View style={styles.insightIconBox}>
                <Ionicons name="sparkles" size={24} color="#7B61FF" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>AI Insight</Text>
                <Text style={styles.insightText}>{data.ai_insight}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={onFab} activeOpacity={0.9}>
          <LinearGradient
            colors={['#5B3CDD', '#7459F7']}
            style={styles.fabGradient}
          >
            <MaterialCommunityIcons name="translate" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <BottomNav 
        activeRoute="Stats" 
        onTabPress={(name) => navigation.navigate('MainTabs', { screen: name })} 
      />
    </SafeAreaView>
  );
};

export default LearningStreakScreen;
