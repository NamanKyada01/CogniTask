import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, ActivityIndicator} from 'react-native';
import {Text, Surface, Avatar} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {UserProfile, Task} from '../../types';
import {AIService} from '../../services/ai';

const DashboardScreen = () => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [dailyTip, setDailyTip] = useState('Loading daily insight...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [p, tasks, tip] = await Promise.all([
        DatabaseService.getUserProfile(user!.uid),
        DatabaseService.getTasks(user!.uid),
        AIService.getDailyTip(),
      ]);
      setProfile(p);
      setUpcomingTasks(tasks.filter(t => t.status === 'scheduled').slice(0, 3));
      setDailyTip(tip);
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
      <View style={styles.header}>
        <View>
          <Text variant="bodyLarge" style={styles.greeting}>
            {t('welcome')}, {profile?.firstName || 'User'}
          </Text>
          <Text variant="labelMedium" style={styles.date}>
            {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
          </Text>
        </View>
        <Avatar.Icon size={48} icon="account" backgroundColor={COLORS.surfaceHigh} color={COLORS.primary} />
      </View>

      <View style={styles.statsRow}>
        <StatCard title="Today" value={upcomingTasks.length.toString()} icon="calendar-check" />
        <StatCard title="Level" value={profile?.level?.toString() || '1'} icon="star" />
        <StatCard title="Streak" value={profile?.streak?.toString() || '0'} icon="fire" color="#FF8C00" />
      </View>

      <Surface style={styles.aiCard} elevation={2}>
        <Text variant="labelLarge" style={styles.aiTitle}>GROQ AI INSIGHT</Text>
        <Text variant="bodyMedium" style={styles.aiText}>
          "{dailyTip}"
        </Text>
      </Surface>

      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>{t('upcoming')}</Text>
      </View>

      {upcomingTasks.map(task => (
        <Surface key={task.id} style={styles.taskItem} elevation={1}>
          <View style={[styles.taskAccent, {backgroundColor: task.color}]} />
          <View style={styles.taskInfo}>
            <Text variant="titleMedium" style={styles.taskTitle}>{task.title}</Text>
            <Text variant="labelSmall" style={styles.taskTime}>
              {new Date(task.startTime.toDate()).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
          </View>
        </Surface>
      ))}
    </ScrollView>
  );
};

const StatCard = ({title, value, icon, color}: any) => (
  <Surface style={styles.statCard} elevation={1}>
    <View style={styles.statHeader}>
      <Avatar.Icon size={20} icon={icon} backgroundColor="transparent" color={color || COLORS.primary} />
      <Text variant="labelSmall" style={styles.statTitle}>{title.toUpperCase()}</Text>
    </View>
    <Text variant="headlineMedium" style={styles.statValue}>{value}</Text>
  </Surface>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  greeting: { color: COLORS.onSurface, fontFamily: 'Manrope-Bold' },
  date: { color: COLORS.onSurfaceVariant },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  statCard: { flex: 1, padding: SPACING.md, borderRadius: ROUNDNESS.md, backgroundColor: COLORS.surfaceLow },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  statTitle: { color: COLORS.onSurfaceVariant, fontSize: 10, letterSpacing: 1 },
  statValue: { color: COLORS.onSurface, fontFamily: 'Manrope-Bold' },
  aiCard: { padding: SPACING.lg, borderRadius: ROUNDNESS.lg, backgroundColor: COLORS.surfaceHigh, marginBottom: SPACING.xl, borderWidth: 1, borderColor: 'rgba(46, 91, 255, 0.2)' },
  aiTitle: { color: COLORS.primary, letterSpacing: 2, marginBottom: SPACING.sm },
  aiText: { color: COLORS.onSurface, fontFamily: 'Inter-Regular', lineHeight: 22, opacity: 0.9 },
  sectionHeader: { marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.onSurface, fontFamily: 'Manrope-Bold' },
  taskItem: { flexDirection: 'row', backgroundColor: COLORS.surfaceLow, borderRadius: ROUNDNESS.md, marginBottom: SPACING.sm, height: 64, overflow: 'hidden' },
  taskAccent: { width: 4, height: '100%' },
  taskInfo: { flex: 1, paddingHorizontal: SPACING.md, justifyContent: 'center' },
  taskTitle: { color: COLORS.onSurface },
  taskTime: { color: COLORS.onSurfaceVariant },
});

export default DashboardScreen;
