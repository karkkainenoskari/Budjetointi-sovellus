import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.moss,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
        },
      }}
    >
      {/* Budjetti‐välilehti */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Budjetti',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />

       {/* Tilitapahtumat-välilehti */}
      <Tabs.Screen
        name="tilitapahtumat"
        options={{
          title: 'Tilitapahtumat',
          tabBarIcon: ({ color, size }) => (
           <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />


      {/* Historia-välilehti */}
      <Tabs.Screen
        name="historia"
        options={{
          title: 'Historia',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
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
       {/* Valikko-välilehti */}
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
