import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './store/authStore';
import { GameScreen } from './screens/GameScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { DealerDashboardScreen } from './screens/DealerDashboardScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { ChatWidget } from './components/ChatWidget';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const Stack = createStackNavigator();

export default function App() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    setupLocation();
    setupNotifications();
  }, []);

  const setupLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      // Send location to server
    }
  };

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      const token = await Notifications.getExpoPushTokenAsync();
      // Send push token to server
    }
  };

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="DealerDashboard" component={DealerDashboardScreen} />
          </>
        )}
      </Stack.Navigator>
      {user && <ChatWidget />}
    </NavigationContainer>
  );
}
