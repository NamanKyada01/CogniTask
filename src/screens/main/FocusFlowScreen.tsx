import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Text, Button, IconButton, Surface} from 'react-native-paper';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';

import CircularProgress from 'react-native-circular-progress-indicator';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';

const {width} = Dimensions.get('window');
const TIMER_SIZE = width * 0.7;

const FocusFlowScreen = () => {
  const {user} = useAuth();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [sound, setSound] = useState('Lo-fi');

  const handleFinish = async () => {
    setIsActive(false);
    if (user) {
      await DatabaseService.addFocusSession(user.uid, {
        userId: user.uid,
        startTime: DatabaseService.serverTimestamp(), // I should add this to service
        endTime: DatabaseService.serverTimestamp(),
        duration: 25,
        xpAwarded: 100,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Focus Flow</Text>
      </View>

      <View style={styles.timerContainer}>
        <CircularProgress
          value={timeLeft}
          radius={TIMER_SIZE / 2}
          duration={1000}
          textColor={COLORS.onSurface}
          maxValue={25 * 60}
          title={'Remaining'}
          titleColor={COLORS.onSurfaceVariant}
          titleStyle={{fontFamily: 'Inter-SemiBold', fontSize: 12}}
          activeStrokeColor={COLORS.primary}
          inActiveStrokeColor={COLORS.surfaceHigh}
          inActiveStrokeWidth={20}
          activeStrokeWidth={20}
          valueSuffix={''}
          onAnimationComplete={timeLeft === 0 ? handleFinish : undefined}
          formatValue={(val) => formatTime(val)}
        />
        <Text variant="bodyLarge" style={styles.statusText}>
          {isActive ? 'Keep pushing, Alex' : 'Ready to dive in?'}
        </Text>
      </View>

      <View style={styles.audioSection}>
        <Text variant="labelLarge" style={styles.audioTitle}>AMBIENT SOUNDSCAPE</Text>
        <View style={styles.audioRow}>
          {['White Noise', 'Lo-fi', 'Rain'].map(s => (
            <Button
              key={s}
              mode={sound === s ? 'contained' : 'text'}
              onPress={() => setSound(s)}
              textColor={sound === s ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant}
              style={sound === s ? styles.activeAudio : {}}>
              {s}
            </Button>
          ))}
        </View>
      </View>

      <View style={styles.controls}>
        <IconButton
          icon={isActive ? 'pause' : 'play'}
          mode="contained"
          containerColor={COLORS.primaryContainer}
          iconColor={COLORS.onPrimaryContainer}
          size={56}
          onPress={() => setIsActive(!isActive)}
        />
        <Button 
          mode="text" 
          textColor={COLORS.error} 
          onPress={() => setTimeLeft(25 * 60)}
          style={styles.breakButton}>
          Break Out
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    color: COLORS.primary,
    fontFamily: 'Manrope-Bold',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerCircle: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    borderRadius: TIMER_SIZE / 2,
    borderWidth: 4,
    borderColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLow,
    shadowColor: COLORS.hyperBlue,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  timerText: {
    fontSize: 64,
    color: COLORS.onSurface,
    fontFamily: 'Manrope-Bold',
  },
  statusText: {
    marginTop: SPACING.lg,
    color: COLORS.onSurface,
    opacity: 0.6,
  },
  audioSection: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  audioTitle: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  audioRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  activeAudio: {
    backgroundColor: COLORS.secondaryContainer,
  },
  controls: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  breakButton: {
    opacity: 0.7,
  },
});

export default FocusFlowScreen;
