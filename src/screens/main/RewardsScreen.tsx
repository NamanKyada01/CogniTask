import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, ScrollView, Animated} from 'react-native';
import {Text, Surface, IconButton, ProgressBar} from 'react-native-paper';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {UserProfile} from '../../types';

const badges = [
  {id: '1', title: 'Early Bird', icon: 'weather-sunny', unlocked: true},
  {id: '2', title: 'Focus Master', icon: 'brain', unlocked: true},
  {id: '3', title: 'Streak King', icon: 'fire', unlocked: false},
  {id: '4', title: 'Task Crusher', icon: 'check-decagram', unlocked: false},
];

// Individual animated badge card
const BadgeCard = ({badge, delay}: {badge: typeof badges[0]; delay: number}) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        speed: 14,
        bounciness: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.badgeWrapper,
        {
          opacity: opacityAnim,
          transform: [{scale: scaleAnim}],
        },
      ]}>
      <Surface
        style={[styles.badgeCard, !badge.unlocked && styles.lockedBadge]}
        elevation={1}>
        <IconButton
          icon={badge.icon}
          size={32}
          iconColor={badge.unlocked ? COLORS.primary : COLORS.onSurfaceVariant}
        />
        <Text variant="labelLarge" style={styles.badgeTitle}>{badge.title}</Text>
      </Surface>
    </Animated.View>
  );
};

const RewardsScreen = () => {
  const {user} = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Header + level card animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const levelCardAnim = useRef(new Animated.Value(0)).current;
  const levelCardSlide = useRef(new Animated.Value(20)).current;
  const shopAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) loadProfile();

    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(levelCardAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(levelCardSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(shopAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user]);

  const loadProfile = async () => {
    const p = await DatabaseService.getUserProfile(user!.uid);
    setProfile(p);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, {opacity: headerAnim}]}>
        <Text variant="displaySmall" style={styles.title}>Rewards</Text>
        <Animated.View
          style={{
            opacity: levelCardAnim,
            transform: [{translateY: levelCardSlide}],
          }}>
          <Surface style={styles.levelCard} elevation={2}>
            <View style={styles.levelInfo}>
              <Text variant="labelLarge" style={styles.levelLabel}>LEVEL {profile?.level || 1}</Text>
              <Text variant="labelLarge" style={styles.xpLabel}>{profile?.xp || 0} / 1000 XP</Text>
            </View>
            <ProgressBar
              progress={(profile?.xp || 0) / 1000}
              color={COLORS.primary}
              style={styles.progress}
            />
          </Surface>
        </Animated.View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Badges & Achievements</Text>
        <View style={styles.badgeGrid}>
          {badges.map((badge, index) => (
            <BadgeCard key={badge.id} badge={badge} delay={index * 80} />
          ))}
        </View>

        <Animated.View style={{opacity: shopAnim}}>
          <Surface style={styles.shopCard} elevation={2}>
            <Text variant="titleMedium" style={styles.shopTitle}>Reward Shop</Text>
            <Text variant="bodySmall" style={styles.shopSubtitle}>
              Unlock premium themes and soundscapes with XP
            </Text>
            <View style={styles.lockedHint}>
              <IconButton icon="lock" size={20} iconColor={COLORS.onSurfaceVariant} />
              <Text variant="labelMedium" style={styles.lockedText}>Unlocked at Level 5</Text>
            </View>
          </Surface>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {padding: SPACING.lg},
  title: {color: COLORS.primary, fontFamily: 'Manrope-Bold', marginBottom: SPACING.lg},
  levelCard: {padding: SPACING.lg, borderRadius: ROUNDNESS.lg, backgroundColor: COLORS.surfaceHigh},
  levelInfo: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  levelLabel: {color: COLORS.onSurface, fontFamily: 'Manrope-Bold'},
  xpLabel: {color: COLORS.onSurfaceVariant},
  progress: {height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)'},
  content: {padding: SPACING.lg, paddingTop: 0},
  sectionTitle: {color: COLORS.onSurface, marginBottom: SPACING.md, fontFamily: 'Inter-SemiBold'},
  badgeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl},
  badgeWrapper: {width: '47%'},
  badgeCard: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ROUNDNESS.md,
    backgroundColor: COLORS.surfaceLow,
  },
  lockedBadge: {opacity: 0.4},
  badgeTitle: {color: COLORS.onSurface, marginTop: 4},
  shopCard: {
    padding: SPACING.lg,
    borderRadius: ROUNDNESS.lg,
    backgroundColor: COLORS.surfaceHigh,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  shopTitle: {color: COLORS.onSurface, marginBottom: 4},
  shopSubtitle: {color: COLORS.onSurfaceVariant, marginBottom: SPACING.md},
  lockedHint: {flexDirection: 'row', alignItems: 'center'},
  lockedText: {color: COLORS.onSurfaceVariant},
});

export default RewardsScreen;
