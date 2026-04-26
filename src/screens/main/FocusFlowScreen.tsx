import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, Dimensions, Animated} from 'react-native';
import {Text, Button, IconButton} from 'react-native-paper';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';

import CircularProgress from 'react-native-circular-progress-indicator';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';

const {width} = Dimensions.get('window');
const TIMER_SIZE = width * 0.7;

const FocusFlowScreen = () => {
  const {user} = useAuth();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sound, setSound] = useState('Lo-fi');

  // Entrance animation
  const entranceAnim = useRef(new Animated.Value(0)).current;
  // Pulsing glow ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  // Controls slide-up
  const controlsAnim = useRef(new Animated.Value(40)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.sequence([
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(controlsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(controlsAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Pulse loop when active
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation;
    if (isActive) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.7,
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.3,
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      pulseLoop.start();
    } else {
      Animated.parallel([
        Animated.timing(pulseAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
        Animated.timing(glowOpacity, {toValue: 0.3, duration: 300, useNativeDriver: true}),
      ]).start();
    }
    return () => pulseLoop?.stop();
  }, [isActive]);

  const handleFinish = async () => {
    setIsActive(false);
    if (user) {
      await DatabaseService.addFocusSession(user.uid, {
        userId: user.uid,
        startTime: DatabaseService.serverTimestamp() as any,
        endTime: DatabaseService.serverTimestamp() as any,
        duration: 25,
        xpAwarded: 100,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, {opacity: entranceAnim}]}>
        <Text variant="headlineMedium" style={styles.title}>Focus Flow</Text>
      </Animated.View>

      {/* Timer with pulsing glow ring */}
      <Animated.View style={[styles.timerContainer, {opacity: entranceAnim}]}>
        {/* Glow ring behind the circular progress */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{scale: pulseAnim}],
              opacity: glowOpacity,
            },
          ]}
        />
        <CircularProgress
          value={timeLeft}
          radius={TIMER_SIZE / 2}
          duration={1000}
          progressValueColor={COLORS.onSurface}
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
          progressFormatter={(val: number) => {
            'worklet';
            const mins = Math.floor(val / 60);
            const secs = Math.floor(val % 60);
            return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          }}
        />
        <Text variant="bodyLarge" style={styles.statusText}>
          {isActive ? 'Keep pushing, you got this' : 'Ready to dive in?'}
        </Text>
      </Animated.View>

      {/* Soundscape selector */}
      <Animated.View style={[styles.audioSection, {opacity: entranceAnim}]}>
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
      </Animated.View>

      {/* Controls */}
      <Animated.View
        style={[
          styles.controls,
          {
            opacity: controlsOpacity,
            transform: [{translateY: controlsAnim}],
          },
        ]}>
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
          onPress={() => {
            setIsActive(false);
            setTimeLeft(25 * 60);
          }}
          style={styles.breakButton}>
          Break Out
        </Button>
      </Animated.View>
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
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: TIMER_SIZE + 40,
    height: TIMER_SIZE + 40,
    borderRadius: (TIMER_SIZE + 40) / 2,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.hyperBlue,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 0,
    top: -20,
    left: -20,
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
