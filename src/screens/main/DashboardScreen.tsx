import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, ScrollView, ActivityIndicator, Animated} from 'react-native';
import {Text, Surface, Avatar} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {UserProfile, Task} from '../../types';
import {AIService} from '../../services/ai';

// Animated stat card with stagger support
const StatCard = ({title, value, icon, color, delay = 0}: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCardWrapper,
        {opacity: anim, transform: [{translateY: slideAnim}]},
      ]}>
      <Surface style={styles.statCard} elevation={1}>
        <View style={styles.statHeader}>
          <Avatar.Icon size={20} icon={icon} style={{backgroundColor: 'transparent'}} color={color || COLORS.primary} />
          <Text variant="labelSmall" style={styles.statTitle}>{title.toUpperCase()}</Text>
        </View>
        <Text variant="headlineMedium" style={styles.statValue}>{value}</Text>
      </Surface>
    </Animated.View>
  );
};

const DashboardScreen = () => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [dailyTip, setDailyTip] = useState('Loading daily insight...');
  const [loading, setLoading] = useState(true);

  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const aiCardAnim = useRef(new Animated.Value(0)).current;
  const aiCardSlide = useRef(new Animated.Value(30)).current;
  const taskAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const runEntranceAnimations = (taskCount: number) => {
    // Ensure we have enough anim values for tasks
    while (taskAnims.length < taskCount) {
      taskAnims.push(new Animated.Value(0));
    }

    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(aiCardAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.stagger(
        80,
        taskAnims.slice(0, taskCount).map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ),
      ),
    ]).start();

    Animated.timing(aiCardSlide, {
      toValue: 0,
      duration: 400,
      delay: 500,
      useNativeDriver: true,
    }).start();
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [p, tasks, tip] = await Promise.all([
        DatabaseService.getUserProfile(user!.uid),
        DatabaseService.getTasks(user!.uid),
        AIService.getDailyTip(),
      ]);
      setProfile(p);
      const upcoming = tasks.filter(t => t.status === 'scheduled').slice(0, 3);
      setUpcomingTasks(upcoming);
      setDailyTip(tip);
      runEntranceAnimations(upcoming.length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View style={[styles.header, {opacity: headerAnim}]}>
        <View>
          <Text variant="bodyLarge" style={styles.greeting}>
            {t('welcome')}, {profile?.firstName || 'User'}
          </Text>
          <Text variant="labelMedium" style={styles.date}>
            {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
          </Text>
        </View>
        <Avatar.Icon size={48} icon="account" style={{backgroundColor: COLORS.surfaceHigh}} color={COLORS.primary} />
      </Animated.View>

      {/* Stats row — each card staggers in */}
      <View style={styles.statsRow}>
        <StatCard title="Today" value={upcomingTasks.length.toString()} icon="calendar-check" delay={0} />
        <StatCard title="Level" value={profile?.level?.toString() || '1'} icon="star" delay={100} />
        <StatCard title="Streak" value={profile?.streak?.toString() || '0'} icon="fire" color="#FF8C00" delay={200} />
      </View>

      {/* AI Insight card */}
      <Animated.View
        style={{
          opacity: aiCardAnim,
          transform: [{translateY: aiCardSlide}],
          marginBottom: SPACING.xl,
        }}>
        <Surface style={styles.aiCard} elevation={2}>
          <Text variant="labelLarge" style={styles.aiTitle}>GROQ AI INSIGHT</Text>
          <Text variant="bodyMedium" style={styles.aiText}>
            "{dailyTip}"
          </Text>
        </Surface>
      </Animated.View>

      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>{t('upcoming')}</Text>
      </View>

      {/* Task items — staggered */}
      {upcomingTasks.map((task, index) => {
        const anim = taskAnims[index] || new Animated.Value(1);
        return (
          <Animated.View
            key={task.id}
            style={{
              opacity: anim,
              transform: [
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            }}>
            <Surface style={styles.taskItem} elevation={1}>
              <View style={[styles.taskAccent, {backgroundColor: task.color}]} />
              <View style={styles.taskInfo}>
                <Text variant="titleMedium" style={styles.taskTitle}>{task.title}</Text>
                <Text variant="labelSmall" style={styles.taskTime}>
                  {new Date(task.startTime.toDate()).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </Text>
              </View>
            </Surface>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {padding: SPACING.lg},
  loader: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl},
  greeting: {color: COLORS.onSurface, fontFamily: 'Manrope-Bold'},
  date: {color: COLORS.onSurfaceVariant},
  statsRow: {flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl},
  statCardWrapper: {flex: 1},
  statCard: {padding: SPACING.md, borderRadius: ROUNDNESS.md, backgroundColor: COLORS.surfaceLow},
  statHeader: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4},
  statTitle: {color: COLORS.onSurfaceVariant, fontSize: 10, letterSpacing: 1},
  statValue: {color: COLORS.onSurface, fontFamily: 'Manrope-Bold'},
  aiCard: {padding: SPACING.lg, borderRadius: ROUNDNESS.lg, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: 'rgba(46, 91, 255, 0.2)'},
  aiTitle: {color: COLORS.primary, letterSpacing: 2, marginBottom: SPACING.sm},
  aiText: {color: COLORS.onSurface, fontFamily: 'Inter-Regular', lineHeight: 22, opacity: 0.9},
  sectionHeader: {marginBottom: SPACING.md},
  sectionTitle: {color: COLORS.onSurface, fontFamily: 'Manrope-Bold'},
  taskItem: {flexDirection: 'row', backgroundColor: COLORS.surfaceLow, borderRadius: ROUNDNESS.md, marginBottom: SPACING.sm, height: 64, overflow: 'hidden'},
  taskAccent: {width: 4, height: '100%'},
  taskInfo: {flex: 1, paddingHorizontal: SPACING.md, justifyContent: 'center'},
  taskTitle: {color: COLORS.onSurface},
  taskTime: {color: COLORS.onSurfaceVariant},
});

export default DashboardScreen;
