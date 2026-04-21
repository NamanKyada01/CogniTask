import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '../context/AuthContext';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {COLORS} from '../theme/tokens';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';
import CreateTaskScreen from '../screens/main/CreateTaskScreen';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {user ? (
          // Main App
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="CreateTask" 
              component={CreateTaskScreen} 
              options={{presentation: 'modal'}}
            />
          </>
        ) : (
          // Auth Flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
