import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, StyleSheet, ScrollView, ActivityIndicator, Animated} from 'react-native';
import {Text, Surface, Avatar} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {SPACING, ROUNDNESS} from '../../theme/tokens';
import {useThemeColors} from '../../theme/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService, getTasksForDate} from '../../services/database';
import {UserProfile, Task} from '../../types';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SmartRecapModal} from '../../components/SmartRecapModal';

const DAILY_TIPS = [
  'Focus on the small wins today. Every task completed brings you closer to your goal.',
  'Break big tasks into smaller steps. Progress is progress, no matter the size.',
  'Your future self will thank you for starting now.',
  'Consistency beats perfection. Show up every day.',
  'One focused hour beats three distracted ones.',
];

const getFallbackTip = () => DAILY_TIPS[new Date().getDay() % DAILY_TIPS.length];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// Animated stat card
const StatCard = ({title, value, icon, color, delay = 0, colors}: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {toValue: 1, duration: 400, delay, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0, duration: 400, delay, useNativeDriver: true}),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{flex: 1}, {opacity: anim, transform: [{translateY: slideAnim}]}]}>
      <Surface style={[styles.statCard, {backgroundColor: colors.surfaceLow}]} elevation={1}>
        <View style={styles.statHeader}>
          <Avatar.Icon
            size={20}
            icon={icon}
            style={{backgroundColor: 'transparent'}}
            color={color || colors.primary}
          />
          <Text variant="labelSmall" style={[styles.statTitle, {color: colors.onSurfaceVariant}]}>
            {title.toUpperCase()}
          </Text>
        </View>
        <Text variant="headlineMedium" style={[styles.statValue, {color: colors.onSurface}]}>
          {value}
        </Text>
      </Surface>
    </Animated.View>
  );
};

const DashboardScreen = () => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const colors = useThemeColors();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyTip, setDailyTip] = useState(getFallbackTip());
  
  // Smart Recap
  const [recapVisible, setRecapVisible] = useState(false);
  const [recapData, setRecapData] = useState<any>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const tipCardAnim = useRef(new Animated.Value(0)).current;
  const tipCardSlide = useRef(new Animated.Value(30)).current;
  const taskAnims = useRef<Animated.Value[]>([]).current;

  useFocusEffect(
    useCallback(() => {
      if (user) loadDashboardData();
    }, [user]),
  );

  const runEntranceAnimations = (taskCount: number) => {
    while (taskAnims.length < taskCount) {
      taskAnims.push(new Animated.Value(0));
    }
    Animated.sequence([
      Animated.timing(headerAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
      Animated.parallel([
        Animated.timing(tipCardAnim, {toValue: 1, duration: 400, useNativeDriver: true}),
        Animated.timing(tipCardSlide, {toValue: 0, duration: 400, useNativeDriver: true}),
      ]),
      Animated.stagger(
        80,
        taskAnims.slice(0, taskCount).map(a =>
          Animated.timing(a, {toValue: 1, duration: 350, useNativeDriver: true}),
        ),
      ),
    ]).start();
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [p, tasks] = await Promise.all([
        DatabaseService.getUserProfile(user!.uid),
        DatabaseService.getTasks(user!.uid),
      ]);
      setProfile(p);
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = getTasksForDate(tasks, today);
      const upcoming = todayTasks.filter(t => t.status !== 'completed').slice(0, 3);
      setUpcomingTasks(upcoming);
      runEntranceAnimations(upcoming.length);

      // Fetch AI tip
      try {
        const cachedTip = await AsyncStorage.getItem('dailyTip');
        const cacheDate = await AsyncStorage.getItem('dailyTipDate');
        if (cachedTip && cacheDate === today) {
          setDailyTip(cachedTip);
        } else {
          const res = await axios.post('http://localhost:5000/api/ai/suggest', {
            completedThisWeek: 5, // Placeholder
            missedThisWeek: 1, // Placeholder
            topCategory: 'Study' // Placeholder
          });
          if (res.data.tip) {
            setDailyTip(res.data.tip);
            await AsyncStorage.setItem('dailyTip', res.data.tip);
            await AsyncStorage.setItem('dailyTipDate', today);
          }
        }
      } catch (e) {
        console.log('Failed to fetch AI tip:', e);
      }

      // Check Smart Recap (Sunday after 20:00)
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() >= 20) {
        const lastRecap = await AsyncStorage.getItem('lastRecapDate');
        if (lastRecap !== today) {
          try {
            const res = await axios.post('http://localhost:5000/api/ai/recap', {
              sessions: [], // pass real data if available
              tasks: tasks
            });
            setRecapData(res.data);
            setRecapVisible(true);
            await AsyncStorage.setItem('lastRecapDate', today);
          } catch (e) {
            console.log('Failed to fetch AI recap:', e);
          }
        }
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loader, {backgroundColor: colors.background}]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}>

      {/* Header */}
      <Animated.View style={[styles.header, {opacity: headerAnim}]}>
        <View>
          <Text variant="bodyLarge" style={[styles.greeting, {color: colors.onSurface}]}>
            {getGreeting()}, {profile?.firstName || 'User'} 👋
          </Text>
          <Text variant="labelMedium" style={{color: colors.onSurfaceVariant}}>
            {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
          </Text>
        </View>
        <Avatar.Icon
          size={48}
          icon="account"
          style={{backgroundColor: colors.surfaceHigh}}
          color={colors.primary}
        />
      </Animated.View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard colors={colors} title="Today" value={upcomingTasks.length.toString()} icon="calendar-check" delay={0} />
        <StatCard colors={colors} title="Level" value={profile?.level?.toString() || '1'} icon="star" delay={100} />
        <StatCard colors={colors} title="Streak" value={profile?.streak?.toString() || '0'} icon="fire" color="#FF8C00" delay={200} />
      </View>

      {/* Daily tip card */}
      <Animated.View style={{opacity: tipCardAnim, transform: [{translateY: tipCardSlide}], marginBottom: SPACING.xl}}>
        <Surface style={[styles.tipCard, {backgroundColor: colors.surfaceHigh, borderColor: colors.primary + '33'}]} elevation={2}>
          <Text variant="labelLarge" style={[styles.tipTitle, {color: colors.primary}]}>
            DAILY FOCUS TIP
          </Text>
          <Text variant="bodyMedium" style={[styles.tipText, {color: colors.onSurface}]}>
            "{dailyTip}"
          </Text>
        </Surface>
      </Animated.View>

      {/* Upcoming tasks */}
      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={[styles.sectionTitle, {color: colors.onSurface}]}>
          {t('upcoming')}
        </Text>
      </View>

      {upcomingTasks.map((task, index) => {
        const anim = taskAnims[index] || new Animated.Value(1);
        return (
          <Animated.View
            key={task.id}
            style={{
              opacity: anim,
              transform: [{translateX: anim.interpolate({inputRange: [0, 1], outputRange: [-30, 0]})}],
            }}>
            <Surface style={[styles.taskItem, {backgroundColor: colors.surfaceLow}]} elevation={1}>
              <View style={[styles.taskAccent, {backgroundColor: task.color}]} />
              <View style={styles.taskInfo}>
                <Text variant="titleMedium" style={{color: colors.onSurface}}>{task.title}</Text>
                <Text variant="labelSmall" style={{color: colors.onSurfaceVariant}}>
                  {new Date(task.startTime.toDate()).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </Text>
              </View>
            </Surface>
          </Animated.View>
        );
      })}

      {upcomingTasks.length === 0 && (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant, opacity: 0.6}}>
            No upcoming tasks — enjoy your day!
          </Text>
        </View>
      )}

      <SmartRecapModal 
        visible={recapVisible} 
        onDismiss={() => setRecapVisible(false)} 
        recapData={recapData} 
        userName={profile?.firstName || 'User'} 
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: SPACING.lg},
  loader: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl},
  greeting: {fontFamily: 'Manrope-Bold'},
  statsRow: {flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl},
  statCard: {padding: SPACING.md, borderRadius: ROUNDNESS.md},
  statHeader: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4},
  statTitle: {fontSize: 10, letterSpacing: 1},
  statValue: {fontFamily: 'Manrope-Bold'},
  tipCard: {padding: SPACING.lg, borderRadius: ROUNDNESS.lg, borderWidth: 1},
  tipTitle: {letterSpacing: 2, marginBottom: SPACING.sm},
  tipText: {fontFamily: 'Inter-Regular', lineHeight: 22, opacity: 0.9},
  sectionHeader: {marginBottom: SPACING.md},
  sectionTitle: {fontFamily: 'Manrope-Bold'},
  taskItem: {flexDirection: 'row', borderRadius: ROUNDNESS.md, marginBottom: SPACING.sm, height: 64, overflow: 'hidden'},
  taskAccent: {width: 4, height: '100%'},
  taskInfo: {flex: 1, paddingHorizontal: SPACING.md, justifyContent: 'center'},
  empty: {alignItems: 'center', marginTop: SPACING.xl},
});

export default DashboardScreen;
