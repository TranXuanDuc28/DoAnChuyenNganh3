import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../components/CustomTabBar';

// Screens
import MainScreen from './MainScreen';
import HomeScreen from './HomeScreen';
import ExploreScreen from './ExploreScreen';
import LearningProgressScreen from './LearningProgressScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ title: 'Home' }}
            />
            <Tab.Screen 
                name="Trans" 
                component={MainScreen} 
                options={{ title: 'Trans' }}
            />
            <Tab.Screen 
                name="Explore" 
                component={ExploreScreen} 
                options={{ title: 'Learn' }}
            />
            <Tab.Screen 
                name="Stats" 
                component={LearningProgressScreen} 
                options={{ title: 'Stats' }}
            />
            <Tab.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ title: 'Profile' }}
            />
        </Tab.Navigator>
    );
}
