import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const API_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const sessionId = params.session_id;
        
        if (!sessionId) {
          throw new Error('No session ID received');
        }

        // Send session_id to backend
        await axios.post(
          `${API_URL}/api/auth/session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true,
          }
        );

        // Redirect to main app
        router.replace('/currently-reading');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/auth/login');
      }
    };

    processCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});
