import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import ProfileButton from '../src/components/ProfileButton';

function TabsContent() {
  const { theme } = useTheme();
  
  return (
    <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#4A90E2',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5EA',
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '600',
            color: '#000000',
          },
          headerRight: () => <ProfileButton />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null, // Hide from tabs
          }}
        />
        <Tabs.Screen
          name="currently-reading"
          options={{
            title: 'Currently Reading',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="want-to-read"
          options={{
            title: 'Want to Read',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'bookmark' : 'bookmark-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="read"
          options={{
            title: 'Read',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            href: null, // Hide from tabs, access via profile
          }}
        />
        <Tabs.Screen
          name="auth/login"
          options={{
            href: null, // Hide from tabs
          }}
        />
        <Tabs.Screen
          name="auth/register"
          options={{
            href: null, // Hide from tabs
          }}
        />
        <Tabs.Screen
          name="auth/callback"
          options={{
            href: null, // Hide from tabs
          }}
        />
      </Tabs>
    </AuthProvider>
  );
}
