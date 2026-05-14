import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav } from '../components/CustomTabBar';
import styles from '../styles/RecognitionHistoryStyles';
import { API_BASE } from '../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const RecognitionHistoryScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [stats, setStats] = useState({ today_count: 0, avg_confidence: 0, increase_from_yesterday: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState(null);

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
        setUser(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const filters = ['All', 'Text', 'Video', 'Audio'];

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/history/stats`);
      const data = await response.json();
      if (response.ok) setStats(data);
    } catch (error) {
      console.error("Stats Fetch Error:", error);
    }
  };

  const fetchHistory = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentSkip = reset ? 0 : page * 10;
      const url = `${API_BASE}/api/v1/history/?type=${activeFilter}&search=${searchText}&skip=${currentSkip}&limit=10`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        if (reset) {
          setHistoryData(data);
          setPage(1);
        } else {
          setHistoryData(prev => [...prev, ...data]);
          setPage(prev => prev + 1);
        }
        setHasMore(data.length === 10);
      }
    } catch (error) {
      console.error("History Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHistory(true);
  }, [activeFilter, searchText]);

  const onToggleBookmark = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/history/${id}/bookmark`, { method: 'PATCH' });
      if (response.ok) {
        setHistoryData(prev => prev.map(item => 
          item.history_id === id ? { ...item, is_bookmarked: !item.is_bookmarked } : item
        ));
      }
    } catch (error) {
      console.error("Bookmark Error:", error);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${hours}:${minutes} • ${month} ${day}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="molecule" size={24} color="#7B61FF" />
          <Text style={styles.logoText}>Lumina Sign</Text>
        </View>
        <Image 
          source={{ uri: (user && user.avatar) ? user.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' }} 
          style={styles.profilePic} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Recognition History</Text>
          <Text style={styles.subtitle}>Track your communication journey.</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View style={styles.statsIconBg}>
                <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#7B61FF" />
              </View>
              <Text style={styles.statsCardTitle}>Translations{'\n'}Today</Text>
            </View>
            <View style={styles.statsValueRow}>
              <Text style={styles.statsValue}>{stats.today_count}</Text>
              <Text style={styles.statsSubtitle}>
                {stats.increase_from_yesterday >= 0 ? '+' : ''}{stats.increase_from_yesterday} from{'\n'}yesterday
              </Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View style={styles.statsIconBg}>
                <MaterialCommunityIcons name="bullseye-arrow" size={16} color="#A78BFA" />
              </View>
              <Text style={styles.statsCardTitle}>Avg.{'\n'}Accuracy</Text>
            </View>
            <View style={styles.statsValueRow}>
              <Text style={styles.statsValue}>{stats.avg_confidence}%</Text>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#7B61FF', '#A78BFA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${stats.avg_confidence}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Search & Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Feather name="search" size={20} color="#797587" style={styles.searchIcon} />
            <TextInput 
              placeholder="Search translations..." 
              placeholderTextColor="#6B7280"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filters.map((filter) => (
              <TouchableOpacity 
                key={filter} 
                style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* History List */}
        <View style={styles.historyList}>
          {historyData.map((item) => (
            <View key={item.history_id} style={styles.historyItem}>
              <View style={styles.thumbnailContainer}>
                <Image source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f' }} style={styles.thumbnail} />
                <View style={styles.typeTag}>
                  <Text style={styles.typeTagText}>{item.type}</Text>
                </View>
              </View>
 
              <View style={styles.historyContent}>
                <View style={styles.historyContentTop}>
                  <View style={styles.statusContainer}>
                    <MaterialCommunityIcons name="check-decagram-outline" size={16} color="#4317C6" />
                    <Text style={[styles.historyStatus, { color: '#4317C6' }]}>{Math.round(item.confidence * 100)}%</Text>
                  </View>
                  <Text style={styles.historyTime}>{formatTime(item.created_at)}</Text>
                </View>
                
                <Text style={styles.historyText} numberOfLines={2}>"{item.recognized_text}"</Text>
                
                <View style={styles.historyActions}>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Feather name="copy" size={16} color="#484555" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="volume-medium-outline" size={18} color="#484555" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, item.is_bookmarked && styles.actionBtnActive]}
                    onPress={() => onToggleBookmark(item.history_id)}
                  >
                    <Feather name="bookmark" size={16} color={item.is_bookmarked ? "#7B61FF" : "#484555"} />
                  </TouchableOpacity>
                  <View style={{flex: 1}} />
                  <TouchableOpacity style={styles.goBtn}>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {loading && <ActivityIndicator color="#7B61FF" style={{ marginVertical: 20 }} />}
        </View>
 
        {/* Load More Section */}
        <View style={styles.loadMoreContainer}>
          <View style={styles.loadMoreIconBg}>
            <MaterialCommunityIcons name="history" size={24} color="#484555" />
          </View>
          <Text style={styles.loadMoreText}>
            {hasMore ? `You can load more history items` : `You've viewed all history`}
          </Text>
          {hasMore && (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={() => fetchHistory()}>
              <Text style={styles.loadMoreBtnText}>Load more history</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab}>
          <LinearGradient
            colors={['#A78BFA', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Feather name="plus" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <BottomNav
        activeRoute="Trans"
        onTabPress={(name) => navigation.navigate('MainTabs', { screen: name })}
      />
    </SafeAreaView>
  );
};

export default RecognitionHistoryScreen;
