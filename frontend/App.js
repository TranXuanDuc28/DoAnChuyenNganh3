import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';

import ExploreScreen from './src/screens/ExploreScreen';
import LessonDetailScreen from './src/screens/LessonDetailScreen';
import MainScreen from './src/screens/MainScreen';
import PracticeDetailScreen from './src/screens/PracticeDetailScreen';
import TopicLessonsScreen from './src/screens/TopicLessonsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuizScreen from './src/screens/QuizScreen';
import QuizResultScreen from './src/screens/QuizResultScreen';
import CustomTabBar from './src/components/CustomTabBar';
import RecognitionHistoryScreen from './src/screens/RecognitionHistoryScreen';
import LearningProgressScreen from './src/screens/LearningProgressScreen';
import LearningStreakScreen from './src/screens/LearningStreakScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navigator cho các tab chính
function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Trans" component={MainScreen} options={{ title: 'Trans' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Learn' }} />
      <Tab.Screen name="Stats" component={LearningProgressScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="Profile" component={HomeScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
