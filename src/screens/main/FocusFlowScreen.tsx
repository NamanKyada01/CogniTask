import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, Dimensions, Animated, Alert} from 'react-native';
import {Text, Button, IconButton, Modal, Portal} from 'react-native-paper';
import axios from 'axios';
import {useThemeColors} from '../../theme/ThemeContext';
import {SPACING} from '../../theme/tokens';
import CircularProgress from 'react-native-circular-progress-indicator';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import firestore from '@react-native-firebase/firestore';
import TrackPlayer, {Capability} from 'react-native-track-player';

const setupPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      compactCapabilities: [Capability.Play, Capability.Pause],
    });
  } catch (e) {
    // Player already setup
  }
};

const {width} = Dimensions.get('window');
const TIMER_SIZE = width * 0.7;
const DURATIONS = [15, 25, 45, 60]; // minutes

const FocusFlowScreen = () => {
  const {user} = useAuth();
  const colors = useThemeColors();

  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sound, setSound] = useState('Lo-fi');
  
  // Celebration Modal
  const [showCelebration, setShowCelebration] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [xpEarned, setXpEarned] = useState(0);

  // Animations
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const controlsAnim = useRef(new Animated.Value(40)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;

  // ── Entrance animation ──
  useEffect(() => {
    setupPlayer();
    Animated.sequence([
      Animated.timing(entranceAnim, {toValue: 1, duration: 600, useNativeDriver: true}),
      Animated.parallel([
        Animated.timing(controlsOpacity, {toValue: 1, duration: 400, useNativeDriver: true}),
        Animated.timing(controlsAnim, {toValue: 0, duration: 400, useNativeDriver: true}),
      ]),
    ]).start();
  }, []);

  // ── Actual countdown ──
  useEffect(() => {
    if (!isActive) return;
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // ── Pulse glow when active ──
  useEffect(() => {
    let loop: Animated.CompositeAnimation;
    if (isActive) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {toValue: 1.08, duration: 900, useNativeDriver: true}),
            Animated.timing(glowOpacity, {toValue: 0.7, duration: 900, useNativeDriver: true}),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {toValue: 1, duration: 900, useNativeDriver: true}),
            Animated.timing(glowOpacity, {toValue: 0.3, duration: 900, useNativeDriver: true}),
          ]),
        ]),
      );
      loop.start();
    } else {
      Animated.parallel([
        Animated.timing(pulseAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
        Animated.timing(glowOpacity, {toValue: 0.3, duration: 300, useNativeDriver: true}),
      ]).start();
    }
    return () => loop?.stop();
  }, [isActive]);

  // ── Audio playback ──
  useEffect(() => {
    const playSound = async () => {
      try {
        await TrackPlayer.reset();
        // Placeholder URLs for ambient sounds
        let url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        if (sound === 'Rain') url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
        else if (sound === 'White Noise') url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';
        
        await TrackPlayer.add({ id: 'focus_sound', url, title: sound, artist: 'CogniTask' });
        await TrackPlayer.play();
      } catch (e) { console.error('TrackPlayer play error', e); }
    };

    if (isActive) {
      playSound();
    } else {
      TrackPlayer.stop().catch(() => {});
    }
  }, [isActive, sound]);

  const handlePlayPause = () => {
    if (!isActive && !sessionStartTime) {
      setSessionStartTime(new Date());
    }
    setIsActive(prev => !prev);
  };

  const handleFinish = async () => {
    setIsActive(false);
    if (!user || !sessionStartTime) return;
    const endTime = new Date();
    const actualDuration = Math.round(
      (endTime.getTime() - sessionStartTime.getTime()) / 60000,
    );
    
    const earned = selectedDuration >= 45 ? 150 : selectedDuration >= 25 ? 100 : 50;
    setXpEarned(earned);

    try {
      await DatabaseService.addFocusSession(user.uid, {
        userId: user.uid,
        startTime: firestore.Timestamp.fromDate(sessionStartTime),
        endTime: firestore.Timestamp.fromDate(endTime),
        duration: actualDuration || selectedDuration,
        xpAwarded: earned,
        soundscape: sound,
      });

      // Fetch Groq AI tip
      const res = await axios.post('http://localhost:5000/api/ai/suggest', {
        completedThisWeek: 6, 
        missedThisWeek: 0,
        topCategory: 'Focus'
      });
      if (res.data.tip) setAiMessage(res.data.tip);

      setShowCelebration(true);
    } catch (e) {
      console.error(e);
    }
    setSessionStartTime(null);
  };

  const handleReset = () => {
    if (isActive) {
      Alert.alert(
        'Break Out',
        'Are you sure you want to end your focus session early? You will lose your progress.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Break Out',
            style: 'destructive',
            onPress: () => {
              setIsActive(false);
              setSessionStartTime(null);
              setTimeLeft(selectedDuration * 60);
            },
          },
        ],
      );
    } else {
      setIsActive(false);
      setSessionStartTime(null);
      setTimeLeft(selectedDuration * 60);
    }
  };

  const handleDurationChange = (mins: number) => {
    if (isActive) return; // don't change while running
    setSelectedDuration(mins);
    setTimeLeft(mins * 60);
  };

  const progressPercent = timeLeft / (selectedDuration * 60);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Dim Overlay when active */}
      {isActive && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, {backgroundColor: '#000', opacity: 0.85, zIndex: 1}]} />
      )}

      {/* Header */}
      <Animated.View style={[styles.header, {opacity: isActive ? 0.1 : entranceAnim, zIndex: isActive ? 0 : 2}]}>
        <Text variant="headlineMedium" style={[styles.title, {color: colors.primary}]}>
          Focus Flow
        </Text>
        {/* Duration selector */}
        <View style={styles.durationRow}>
          {DURATIONS.map(d => (
            <Button
              key={d}
              mode={selectedDuration === d ? 'contained' : 'text'}
              onPress={() => handleDurationChange(d)}
              compact
              textColor={selectedDuration === d ? colors.onPrimaryContainer : colors.onSurfaceVariant}
              buttonColor={selectedDuration === d ? colors.primaryContainer : undefined}
              style={styles.durationBtn}>
              {d}m
            </Button>
          ))}
        </View>
      </Animated.View>

      {/* Timer */}
      <Animated.View style={[styles.timerContainer, {opacity: entranceAnim, zIndex: 2}]}>
        <Animated.View
          style={[
            styles.glowRing,
            {
              borderColor: colors.primary,
              shadowColor: colors.hyperBlue,
              transform: [{scale: pulseAnim}],
              opacity: glowOpacity,
            },
          ]}
        />
        <CircularProgress
          value={timeLeft}
          radius={TIMER_SIZE / 2}
          duration={1000}
          progressValueColor={colors.onSurface}
          maxValue={selectedDuration * 60}
          title={isActive ? 'FOCUSING' : timeLeft === 0 ? 'DONE!' : 'READY'}
          titleColor={colors.onSurfaceVariant}
          titleStyle={{fontFamily: 'Inter-SemiBold', fontSize: 11, letterSpacing: 2}}
          activeStrokeColor={colors.primary}
          inActiveStrokeColor={colors.surfaceHigh}
          inActiveStrokeWidth={20}
          activeStrokeWidth={20}
          valueSuffix=""
          progressFormatter={(val: number) => {
            'worklet';
            const mins = Math.floor(val / 60);
            const secs = Math.floor(val % 60);
            return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          }}
        />
        <Text variant="bodyMedium" style={[styles.statusText, {color: colors.onSurface}]}>
          {isActive
            ? 'Keep pushing, you got this 🔥'
            : timeLeft === 0
            ? 'Session complete! Great work 🎉'
            : 'Ready to dive in?'}
        </Text>
      </Animated.View>

      {/* Soundscape */}
      <Animated.View style={[styles.audioSection, {opacity: isActive ? 0.1 : entranceAnim, zIndex: isActive ? 0 : 2}]}>
        <Text variant="labelLarge" style={[styles.audioTitle, {color: colors.onSurfaceVariant}]}>
          AMBIENT SOUNDSCAPE
        </Text>
        <View style={styles.audioRow}>
          {['White Noise', 'Lo-fi', 'Rain'].map(s => (
            <Button
              key={s}
              mode={sound === s ? 'contained' : 'text'}
              onPress={() => setSound(s)}
              textColor={sound === s ? colors.onPrimaryContainer : colors.onSurfaceVariant}
              buttonColor={sound === s ? colors.secondaryContainer : undefined}>
              {s}
            </Button>
          ))}
        </View>
      </Animated.View>

      {/* Controls */}
      <Animated.View
        style={[
          styles.controls,
          {opacity: controlsOpacity, transform: [{translateY: controlsAnim}], zIndex: 2},
        ]}>
        <IconButton
          icon={isActive ? 'pause' : 'play'}
          mode="contained"
          containerColor={colors.primaryContainer}
          iconColor={colors.onPrimaryContainer}
          size={56}
          onPress={handlePlayPause}
        />
        <Button
          mode="text"
          textColor={colors.error}
          onPress={handleReset}
          style={styles.resetButton}>
          {isActive ? 'Break Out' : 'Reset'}
        </Button>
      </Animated.View>

      {/* Celebration Modal */}
      <Portal>
        <Modal
          visible={showCelebration}
          onDismiss={() => setShowCelebration(false)}
          contentContainerStyle={[styles.modal, {backgroundColor: colors.surfaceHigh}]}>
          <Text variant="headlineMedium" style={[styles.title, {color: colors.primary, marginBottom: SPACING.md}]}>
            Session Complete! 🎉
          </Text>
          <Text variant="titleMedium" style={{color: colors.onSurface, marginBottom: SPACING.sm}}>
            +{xpEarned} XP Earned
          </Text>
          {aiMessage ? (
            <Surface style={[styles.aiCard, {backgroundColor: colors.surfaceLow, borderColor: colors.primary}]} elevation={1}>
              <Text variant="labelSmall" style={{color: colors.primary, marginBottom: 4, letterSpacing: 1}}>AI COACH</Text>
              <Text variant="bodyMedium" style={{color: colors.onSurface, fontStyle: 'italic'}}>"{aiMessage}"</Text>
            </Surface>
          ) : null}
          <Button mode="contained" onPress={() => setShowCelebration(false)} style={{marginTop: SPACING.xl}}>
            Continue
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxl,
  },
  header: {alignItems: 'center', gap: SPACING.sm},
  title: {fontFamily: 'Manrope-Bold'},
  durationRow: {flexDirection: 'row', gap: 4},
  durationBtn: {borderRadius: 20},
  timerContainer: {alignItems: 'center', position: 'relative'},
  glowRing: {
    position: 'absolute',
    width: TIMER_SIZE + 40,
    height: TIMER_SIZE + 40,
    borderRadius: (TIMER_SIZE + 40) / 2,
    backgroundColor: 'transparent',
    borderWidth: 2,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 0,
    top: -20,
    left: -20,
  },
  statusText: {marginTop: SPACING.lg, opacity: 0.7},
  audioSection: {width: '100%', paddingHorizontal: SPACING.lg},
  audioTitle: {textAlign: 'center', marginBottom: SPACING.sm, letterSpacing: 2},
  audioRow: {flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm},
  controls: {alignItems: 'center', gap: SPACING.sm},
  resetButton: {opacity: 0.7},
  modal: {padding: SPACING.xl, margin: SPACING.xl, borderRadius: 24, alignItems: 'center'},
  aiCard: {padding: SPACING.md, borderRadius: 12, marginTop: SPACING.lg, borderWidth: 1, width: '100%'},
});

export default FocusFlowScreen;
