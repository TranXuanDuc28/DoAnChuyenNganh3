import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Khớp Tab.Screen `name` trong App.js */
export const MAIN_TAB_ITEMS = [
  { name: 'Home', label: 'Home' },
  { name: 'Trans', label: 'Trans' },
  { name: 'Explore', label: 'Learn' },
  { name: 'Stats', label: 'Stats' },
  { name: 'Profile', label: 'Profile' },
];

const getIcon = (name, focused) => {
  let iconName;
  if (name === 'Home') iconName = focused ? 'home' : 'home-outline';
  else if (name === 'Trans') iconName = focused ? 'camera' : 'camera-outline';
  else if (name === 'Explore') iconName = focused ? 'book' : 'book-outline';
  else if (name === 'Stats') iconName = focused ? 'pie-chart' : 'pie-chart-outline';
  else if (name === 'Profile') iconName = focused ? 'person' : 'person-outline';

  return (
    <Ionicons name={iconName} size={focused ? 20 : 22} color={focused ? '#D7CFFF' : '#5E5D69'} />
  );
};

/**
 * Cùng giao diện với tab bar trên Home (CustomTabBar).
 * Dùng thêm cho màn Stack như RecognitionHistory.
 */
export function BottomNav({ activeRoute, onTabPress }) {
  return (
    <View style={styles.tabContainer}>
      <View style={styles.bottomNav}>
        {MAIN_TAB_ITEMS.map(({ name, label }) => {
          const isFocused = activeRoute === name;
          return (
            <TouchableOpacity
              key={name}
              onPress={() => onTabPress(name)}
              style={[styles.navItem, isFocused && styles.navItemActive]}
              activeOpacity={0.85}
            >
              {getIcon(name, isFocused)}
              <Text style={[styles.navText, isFocused && styles.navTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const CustomTabBar = ({ state, navigation }) => {
  const activeRoute = state.routes[state.index].name;

  const onTabPress = (name) => {
    const index = state.routes.findIndex((r) => r.name === name);
    if (index === -1) return;
    const route = state.routes[index];
    const isFocused = state.index === index;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  return <BottomNav activeRoute={activeRoute} onTabPress={onTabPress} />;
};

const styles = StyleSheet.create({
  tabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  bottomNav: {
    height: 85,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 25,
    backgroundColor: 'rgba(253, 248, 255, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 196, 216, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 60,
  },
  navItemActive: {
    backgroundColor: '#5B3CDD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  navText: {
    fontSize: 12,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: '#5E5D69',
    marginTop: 4,
  },
  navTextActive: {
    color: '#D7CFFF',
    fontSize: 10,
    marginTop: 4,
  },
});

export default CustomTabBar;
