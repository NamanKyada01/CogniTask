import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, StyleSheet, ScrollView, Animated} from 'react-native';
import {Text, Surface, IconButton, ProgressBar} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {useThemeColors} from '../../theme/ThemeContext';
import {SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {UserProfile} from '../../types';

// Badge unlock rules based on real profile data
const getBadges = (profile: UserProfile | null, taskCount: number) => [
  {
    id: '1',
    title: 'Early Bird',
    icon: 'weather-sunny',
    desc: 'Complete a task before 9 AM',
    unlocked: taskCount > 0,
  },
  {
    id: '2',
    title: 'Focus Master',
    icon: 'brain',
    desc: 'Complete a 25-min focus session',
    unlocked: (profile?.xp || 0) >= 100,
  },
  {
    id: '3',
    title: 'Streak King',
    icon: 'fire',
    desc: '7-day streak',
    unlocked: (profile?.streak || 0) >= 7,
  },
  {
    id: '4',
    title: 'Task Crusher',
    icon: 'check-decagram',
    desc: 'Complete 10 tasks',
    unlocked: taskCount >= 10,
  },
  {
    id: '5',
    title: 'Level Up',
    icon: 'star-circle',
    desc: 'Reach Level 3',
    unlocked: (profile?.level || 1) >= 3,
  },
  {
    id: '6',
    title: 'Centurion',
    icon: 'trophy',
    desc: 'Earn 500 XP',
    unlocked: (profile?.xp || 0) >= 500,
  },
];

const BadgeCard = ({badge, delay, colors}: {badge: any; delay: number; colors: any}) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {toValue: 1, delay, useNativeDriver: true, speed: 14, bounciness: 8}),
      Animated.timing(opacityAnim, {toValue: 1, duration: 300, delay, useNativeDriver: true}),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.badgeWrapper, {opacity: opacityAnim, transform: [{scale: scaleAnim}]}]}>
      <Surface
        style={[
          styles.badgeCard,
          {backgroundColor: colors.surfaceLow},
          !badge.unlocked && styles.lockedBadge,
        ]}
        elevation={1}>
        <IconButton
          icon={badge.icon}
          size={32}
          iconColor={badge.unlocked ? colors.primary : colors.onSurfaceVariant}
        />
        <Text variant="labelMedium" style={{color: colors.onSurface, textAlign: 'center'}}>
          {badge.title}
        </Text>
        <Text variant="labelSmall" style={{color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 10, marginTop: 2}}>
          {badge.desc}
        </Text>
        {badge.unlocked && (
          <View style={[styles.unlockedBadge, {backgroundColor: colors.primary + '22'}]}>
            <Text style={{color: colors.primary, fontSize: 9, fontFamily: 'Inter-SemiBold'}}>UNLOCKED</Text>
          </View>
        )}
      </Surface>
    </Animated.View>
  );
};

const RewardsScreen = () => {
  const {user} = useAuth();
  const colors = useThemeColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [taskCount, setTaskCount] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const levelCardAnim = useRef(new Animated.Value(0)).current;
  const levelCardSlide = useRef(new Animated.Value(20)).current;
  const shopAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      if (user) loadData();
    }, [user]),
  );

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
      Animated.parallel([
        Animated.timing(levelCardAnim, {toValue: 1, duration: 400, useNativeDriver: true}),
        Animated.timing(levelCardSlide, {toValue: 0, duration: 400, useNativeDriver: true}),
      ]),
      Animated.timing(shopAnim, {toValue: 1, duration: 400, delay: 200, useNativeDriver: true}),
    ]).start();
  }, []);

  const loadData = async () => {
    const [p, tasks] = await Promise.all([
      DatabaseService.getUserProfile(user!.uid),
      DatabaseService.getTasks(user!.uid),
    ]);
    setProfile(p);
    setTaskCount(tasks.filter(t => t.status === 'completed').length);
  };

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const xpProgress = xp / 1000;
  const badges = getBadges(profile, taskCount);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Animated.View style={[styles.header, {opacity: headerAnim}]}>
        <Text variant="displaySmall" style={[styles.title, {color: colors.primary}]}>Rewards</Text>

        <Animated.View style={{opacity: levelCardAnim, transform: [{translateY: levelCardSlide}]}}>
          <Surface style={[styles.levelCard, {backgroundColor: colors.surfaceHigh}]} elevation={2}>
            <View style={styles.levelRow}>
              <View>
                <Text variant="labelSmall" style={{color: colors.onSurfaceVariant, letterSpacing: 1}}>CURRENT LEVEL</Text>
                <Text variant="headlineMedium" style={{color: colors.onSurface, fontFamily: 'Manrope-Bold'}}>
                  Level {level}
                </Text>
              </View>
              <View style={styles.xpBadge}>
                <Text variant="labelLarge" style={{color: colors.primary, fontFamily: 'Manrope-Bold'}}>
                  {xp}
                </Text>
                <Text variant="labelSmall" style={{color: colors.onSurfaceVariant}}>/ 1000 XP</Text>
              </View>
            </View>
            <ProgressBar
              progress={Math.min(xpProgress, 1)}
              color={colors.primary}
              style={[styles.progress, {backgroundColor: colors.outlineVariant + '44'}]}
            />
            <Text variant="labelSmall" style={{color: colors.onSurfaceVariant, marginTop: 6}}>
              {1000 - xp} XP to Level {level + 1}
            </Text>
          </Surface>
        </Animated.View>

        {/* Streak row */}
        <View style={styles.statsRow}>
          <Surface style={[styles.statChip, {backgroundColor: colors.surfaceLow}]} elevation={1}>
            <IconButton icon="fire" size={18} iconColor="#FF8C00" style={styles.chipIcon} />
            <Text variant="labelMedium" style={{color: colors.onSurface}}>
              {profile?.streak || 0} day streak
            </Text>
          </Surface>
          <Surface style={[styles.statChip, {backgroundColor: colors.surfaceLow}]} elevation={1}>
            <IconButton icon="check-decagram" size={18} iconColor={colors.primary} style={styles.chipIcon} />
            <Text variant="labelMedium" style={{color: colors.onSurface}}>
              {taskCount} tasks done
            </Text>
          </Surface>
          <Surface style={[styles.statChip, {backgroundColor: colors.surfaceLow}]} elevation={1}>
            <IconButton icon="medal" size={18} iconColor="#FFD700" style={styles.chipIcon} />
            <Text variant="labelMedium" style={{color: colors.onSurface}}>
              {unlockedCount}/{badges.length} badges
            </Text>
          </Surface>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={[styles.sectionTitle, {color: colors.onSurface}]}>
          Badges & Achievements
        </Text>
        <View style={styles.badgeGrid}>
          {badges.map((badge, index) => (
            <BadgeCard key={badge.id} badge={badge} delay={index * 60} colors={colors} />
          ))}
        </View>

        <Animated.View style={{opacity: shopAnim}}>
          <Surface
            style={[styles.shopCard, {backgroundColor: colors.surfaceHigh, borderColor: colors.outlineVariant}]}
            elevation={2}>
            <Text variant="titleMedium" style={{color: colors.onSurface, marginBottom: 4}}>
              Reward Shop
            </Text>
            <Text variant="bodySmall" style={{color: colors.onSurfaceVariant, marginBottom: SPACING.md}}>
              Unlock premium themes and soundscapes with XP
            </Text>
            <View style={styles.lockedHint}>
              <IconButton icon={level >= 5 ? 'lock-open' : 'lock'} size={20} iconColor={colors.onSurfaceVariant} />
              <Text variant="labelMedium" style={{color: colors.onSurfaceVariant}}>
                {level >= 5 ? 'Shop unlocked!' : `Unlocked at Level 5 (you're Level ${level})`}
              </Text>
            </View>
          </Surface>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {padding: SPACING.lg, gap: SPACING.md},
  title: {fontFamily: 'Manrope-Bold'},
  levelCard: {padding: SPACING.lg, borderRadius: ROUNDNESS.lg},
  levelRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SPACING.sm},
  xpBadge: {alignItems: 'flex-end'},
  progress: {height: 8, borderRadius: 4},
  statsRow: {flexDirection: 'row', gap: SPACING.sm},
  statChip: {flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: ROUNDNESS.md, paddingRight: SPACING.sm},
  chipIcon: {margin: 0},
  content: {padding: SPACING.lg, paddingTop: 0, paddingBottom: SPACING.xxl},
  sectionTitle: {marginBottom: SPACING.md, fontFamily: 'Inter-SemiBold'},
  badgeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl},
  badgeWrapper: {width: '47%'},
  badgeCard: {
    padding: SPACING.sm,
    paddingBottom: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ROUNDNESS.md,
    minHeight: 120,
  },
  lockedBadge: {opacity: 0.4},
  unlockedBadge: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: ROUNDNESS.full,
  },
  shopCard: {
    padding: SPACING.lg,
    borderRadius: ROUNDNESS.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  lockedHint: {flexDirection: 'row', alignItems: 'center'},
});

export default RewardsScreen;
