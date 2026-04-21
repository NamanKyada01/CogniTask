import React from 'react';
import {StatusBar, View, StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import {ThemeProvider} from './src/theme/ThemeContext';
import {Text} from 'react-native-paper';

import {AppNavigator} from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar barStyle="light-content" backgroundColor="#131314" />
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131314',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#B8C3FF',
    fontFamily: 'Manrope-Bold',
    marginBottom: 8,
  },
  tagline: {
    color: '#E5E2E3',
    fontFamily: 'Inter-Regular',
    opacity: 0.8,
  },
});

export default App;
