import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProfileModal from './ProfileModal';
import { useRouter } from 'expo-router';

export default function ProfileButton() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const handlePress = () => {
    if (user) {
      setModalVisible(true);
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={user ? 'person-circle' : 'person-circle-outline'}
          size={28}
          color={user ? theme.primary : theme.textSecondary}
        />
      </TouchableOpacity>

      {user && (
        <ProfileModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
