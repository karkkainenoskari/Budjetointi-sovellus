// app/(tabs)/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#f1c40f',
        tabBarInactiveTintColor: '#555',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ddd',
        },
      }}
    >
      {/* Budjetti‐välilehti */}
      <Tabs.Screen
        name="index"                // index.tsx näyttää Budjetti-sisällön
        options={{
          title: 'Budjetti',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Tavoitteet‐välilehti */}
      <Tabs.Screen
        name="tavoitteet"
        options={{
          title: 'Tavoitteet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Valikko‐välilehti */}
      <Tabs.Screen
        name="valikko"
        options={{
          title: 'Valikko',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
