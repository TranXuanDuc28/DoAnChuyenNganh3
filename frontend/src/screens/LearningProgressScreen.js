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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles/LearningProgressStyles';

const API_BASE = "https://phrenologic-lindsy-abstractedly.ngrok-free.dev";

const LearningProgressScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overall_percent: 0,
    completed_lessons: 0,
    total_lessons_goal: 5,
    current_streak: 0,
    total_xp: 0,
    activity: [],
    courses: []
  });

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/progress/dashboard`);
      const result = await response.json();
      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onFab = () => {
    navigation.navigate('Explore');
  };

  const onCoursePress = () => {
    navigation.navigate('Explore');
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
          <MaterialCommunityIcons name="molecule" size={24} color="#7B61FF" />
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
          <View style={styles.headerTitleSection}>
            <Text style={styles.title}>Learning Progress</Text>
            <Text style={styles.subtitle}>
              {`You're doing great! Keep it up to reach your\nweekly goal.`}
            </Text>
          </View>

          <View style={styles.bentoGrid}>
            <View style={styles.overallCard}>
              <View style={styles.progressCircleContainer}>
                <View
                  style={[
                    styles.progressCircleSvg,
                    {
                      borderWidth: 8,
                      borderColor: '#E5E0EE',
                      borderRadius: 64,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressCircleSvg,
                    {
                      borderWidth: 8,
                      borderColor: '#7B61FF',
                      borderRadius: 64,
                      borderTopColor: 'transparent',
                      borderRightColor: 'transparent',
                      transform: [{ rotate: `${(data.overall_percent / 100) * 360 - 45}deg` }],
                    },
                  ]}
                />
                <View style={styles.progressTextContainer}>
                  <Text style={styles.progressPercent}>{data.overall_percent}%</Text>
                  <Text style={styles.progressLabel}>Completed</Text>
                </View>
              </View>
              <View style={styles.weeklyGoalSection}>
                <Text style={styles.weeklyGoalLabel}>Weekly Goal</Text>
                <Text style={styles.weeklyGoalValue}>{data.completed_lessons}/{data.total_lessons_goal} lessons</Text>
              </View>
            </View>

            <View style={styles.statsSubGrid}>
              <TouchableOpacity 
                style={styles.statCard} 
                onPress={() => navigation.navigate('LearningStreak')}
                activeOpacity={0.8}
              >
                <View style={[styles.statIconContainer, styles.streakIconBg]}>
                  <MaterialCommunityIcons name="fire" size={22} color="#F97316" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Current Streak</Text>
                  <Text style={styles.statValue}>{data.current_streak} days</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, styles.xpIconBg]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={24} color="#4317C6" />
                </View>
                <View>
                  <Text style={styles.statLabel}>Total Experience</Text>
                  <Text style={styles.statValue}>{data.total_xp} XP Points</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <View style={styles.activityTitleContainer}>
                <MaterialCommunityIcons name="chart-bar" size={20} color="#4317C6" />
                <Text style={styles.activityTitle}>Activity (Last 7 Days)</Text>
              </View>
              <Text style={styles.activityPeriod}>This{"\n"}week</Text>
            </View>

            <View style={styles.chartContainer}>
              {data.activity.map((day) => (
                <View key={day.label} style={styles.barWrapper}>
                  <View style={styles.barTrack}>
                    {day.active && day.minutes > 0 && (
                      <View style={styles.activeBarLabel}>
                        <Text style={styles.activeBarLabelText}>{day.minutes}m</Text>
                      </View>
                    )}
                    <LinearGradient
                      colors={day.active ? ['#5B3CDD', '#7459F7'] : ['#7B61FF', '#A78BFA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.barFill,
                        { height: day.h, opacity: day.active ? 1 : 0.4 },
                      ]}
                    />
                  </View>
                  <Text style={[styles.dayLabel, day.active && styles.activeDayLabel]}>
                    {day.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.coursesSection}>
            <Text style={styles.sectionHeader}>Current Courses</Text>
            {data.courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={onCoursePress}
                activeOpacity={0.8}
              >
                <View style={styles.courseInfo}>
                  <View style={styles.courseMain}>
                    <View style={[styles.courseIconBox, { backgroundColor: course.iconBg }]}>
                      <MaterialCommunityIcons name={course.icon} size={22} color="#4317C6" />
                    </View>
                    <View>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <View style={[styles.courseBadge, { backgroundColor: course.badgeBg }]}>
                        <Text style={[styles.courseBadgeText, { color: course.badgeColor }]}>
                          {course.badge}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.courseProgressText}>{course.percent}%</Text>
                </View>
                <View style={styles.courseProgressBarTrack}>
                  <LinearGradient
                    colors={['#7B61FF', '#A78BFA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.courseProgressBarFill, { width: `${course.percent}%` }]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={onFab} activeOpacity={0.9}>
          <LinearGradient
            colors={['#5B3CDD', '#7459F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="play" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LearningProgressScreen;
