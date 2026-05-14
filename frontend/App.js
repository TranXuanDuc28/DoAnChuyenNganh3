import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainTabNavigator from './src/screens/MainTabNavigator';
import LessonDetailScreen from './src/screens/LessonDetailScreen';
import PracticeDetailScreen from './src/screens/PracticeDetailScreen';
import TopicLessonsScreen from './src/screens/TopicLessonsScreen';
import QuizScreen from './src/screens/QuizScreen';
import QuizResultScreen from './src/screens/QuizResultScreen';
import RecognitionHistoryScreen from './src/screens/RecognitionHistoryScreen';
import LearningStreakScreen from './src/screens/LearningStreakScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      try {
        token = await AsyncStorage.getItem('userToken');
      } catch (e) {
        console.log('Restoring token failed');
      }
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF8FF' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={userToken ? "MainTabs" : "Login"}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FDF8FF' }
          }}
        >
          {/* Auth Flow */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          {/* Main App with Bottom Tabs */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />

          {/* Screens outside of tabs (details) */}
          <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
          <Stack.Screen name="PracticeDetail" component={PracticeDetailScreen} />
          <Stack.Screen name="TopicLessons" component={TopicLessonsScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="QuizResult" component={QuizResultScreen} />
          <Stack.Screen name="RecognitionHistory" component={RecognitionHistoryScreen} />
          <Stack.Screen name="LearningStreak" component={LearningStreakScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
