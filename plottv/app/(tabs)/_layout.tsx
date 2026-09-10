import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import HapticTab from '@/components/haptic-tab';
import { useDictionary } from '@/hooks/useDictionary';

const ICONS = {
  home: {
    active: require('../../assets/icons/icon_home_active.png'),
    inactive: require('../../assets/icons/icon_home.png'),
  },
  foryou: {
    active: require('../../assets/icons/icon_foryou_active.png'),
    inactive: require('../../assets/icons/icon_foryou.png'),
  },
  mylist: {
    active: require('../../assets/icons/icon_mylist_active.png'),
    inactive: require('../../assets/icons/icon_mylist.png'),
  },
  profile: {
    active: require('../../assets/icons/icon_user_active.png'),
    inactive: require('../../assets/icons/icon_user.png'),
  },
};

export default function TabLayout() {
  const dict = useDictionary();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        headerShown: false,
        sceneStyle: { backgroundColor: '#040404' },
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(4, 4, 4, 0.7)',
          borderTopWidth: 0,
          elevation: 0,
          zIndex: 9999,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: dict['Home'] || 'Home',
          tabBarIcon: ({ focused }) => (
            <Image
              source={ focused ? ICONS.home.active : ICONS.home.inactive} 
              style={{ width: 18, height: 18}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="foryou"
        options={{
          title: dict['For You'] || 'For you',
          tabBarIcon: ({ focused }) => (
            <Image
              source={ focused ? ICONS.foryou.active : ICONS.foryou.inactive} 
              style={{ width: 18, height: 18}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mylist"
        options={{
          title: dict['My List'] || 'My list',
          tabBarIcon: ({ focused }) => (
            <Image
              source={ focused ? ICONS.mylist.active : ICONS.mylist.inactive} 
              style={{ width: 18, height: 18}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: dict['Profile'] || 'Profile',
          tabBarIcon: ({ focused }) => (
            <Image
              source={ focused ? ICONS.profile.active : ICONS.profile.inactive} 
              style={{ width: 18, height: 18}}
            />
          ),
        }}
      />
    </Tabs>
  );
}
