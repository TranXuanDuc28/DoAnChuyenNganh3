import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Placeholder Screens
import MainScreen from './MainScreen';
import EditProfileScreen from './EditProfileScreen';

function PlaceholderScreen({ name }) {
    return (
        <View style={styles.center}>
            <Text style={styles.text}>{name} Screen</Text>
        </View>
    );
}

const Tab = createBottomTabNavigator();

const CustomTabIcon = ({ name, label, focused }) => {
    return (
        <View style={[
            styles.tabItemContainer,
            focused && styles.activeTabContainer
        ]}>
            <MaterialIcons 
                name={name} 
                size={24} 
                color={focused ? '#fff' : '#5e5d69'} 
            />
            <Text style={[
                styles.tabLabel, 
                { color: focused ? '#fff' : '#5e5d69' }
            ]}>
                {label}
            </Text>
        </View>
    );
};

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: '#e4e1ef', // Gray background
                    height: Platform.OS === 'ios' ? 90 : 75,
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    borderTopWidth: 0,
                    elevation: 0,
                    paddingTop: 10,
                },
            }}
        >
            <Tab.Screen 
                name="Home" 
                component={() => <PlaceholderScreen name="Home" />} 
                options={{
                    tabBarIcon: ({ focused }) => (
                        <CustomTabIcon name="home" label="Home" focused={focused} />
                    )
                }}
            />
            <Tab.Screen 
                name="Trans" 
                component={MainScreen} 
                options={{
                    tabBarIcon: ({ focused }) => (
                        <CustomTabIcon name="remove-red-eye" label="Trans" focused={focused} />
                    )
                }}
            />
            <Tab.Screen 
                name="Learn" 
                component={() => <PlaceholderScreen name="Learn" />} 
                options={{
                    tabBarIcon: ({ focused }) => (
                        <CustomTabIcon name="school" label="Learn" focused={focused} />
                    )
                }}
            />
            <Tab.Screen 
                name="Stats" 
                component={() => <PlaceholderScreen name="Stats" />} 
                options={{
                    tabBarIcon: ({ focused }) => (
                        <CustomTabIcon name="bar-chart" label="Stats" focused={focused} />
                    )
                }}
            />
            <Tab.Screen 
                name="Profile" 
                component={EditProfileScreen} 
                options={{
                    tabBarIcon: ({ focused }) => (
                        <CustomTabIcon name="person" label="Profile" focused={focused} />
                    )
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fdf8ff',
    },
    text: {
        fontSize: 20,
        color: '#4317c6',
        fontWeight: '800',
    },
    tabItemContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 70,
        height: 60,
        borderRadius: 18,
    },
    activeTabContainer: {
        backgroundColor: '#6344f3', // Purple box for active tab
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    }
});
