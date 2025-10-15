import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CurrentlyReadingScreen from './screens/CurrentlyReadingScreen';
import WantToReadScreen from './screens/WantToReadScreen';
import ReadScreen from './screens/ReadScreen';

const Tab = createBottomTabNavigator();

export default function Index() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <NavigationContainer independent={true}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: any;

                if (route.name === 'Currently Reading') {
                  iconName = focused ? 'book' : 'book-outline';
                } else if (route.name === 'Want to Read') {
                  iconName = focused ? 'bookmark' : 'bookmark-outline';
                } else if (route.name === 'Read') {
                  iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
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
            })}
          >
            <Tab.Screen name="Currently Reading" component={CurrentlyReadingScreen} />
            <Tab.Screen name="Want to Read" component={WantToReadScreen} />
            <Tab.Screen name="Read" component={ReadScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
