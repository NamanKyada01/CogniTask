import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import {COLORS} from '../../theme/tokens';

const DashboardScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.text}>Dashboard</Text>
      <Text variant="bodyLarge" style={styles.subtext}>Lumina Onyx Premium</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: COLORS.primary,
    fontFamily: 'Manrope-Bold',
  },
  subtext: {
    color: COLORS.onSurface,
    opacity: 0.7,
  },
});

export default DashboardScreen;
