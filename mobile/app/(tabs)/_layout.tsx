import { Tabs } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Text, Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: Platform.OS === 'android' ? 70 : 64,
          paddingBottom: Platform.OS === 'android' ? 14 : 10,
          paddingTop: 8,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Active & Attendance',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Status & All Students',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>👥</Text>
          ),
        }}
      />
    </Tabs>
  );
}
