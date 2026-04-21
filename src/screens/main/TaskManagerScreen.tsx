import React, {useState, useEffect} from 'react';
import {View, StyleSheet, FlatList, ActivityIndicator} from 'react-native';
import {Text, SegmentedButtons, FAB} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {COLORS, SPACING} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {Task} from '../../types';
import TaskCard from '../../components/tasks/TaskCard';

const TaskManagerScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user, filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const allTasks = await DatabaseService.getTasks(user!.uid);
      
      // Basic filtering logic
      const filtered = allTasks.filter(task => {
        if (filter === 'completed') return task.status === 'completed';
        if (filter === 'upcoming') return task.status === 'scheduled';
        return true; // Simple 'today' default for now
      });
      
      setTasks(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await DatabaseService.updateTaskStatus(user!.uid, taskId, 'completed');
      await DatabaseService.updateXP(user!.uid, 50); // Award 50 XP
      loadTasks();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.title}>{t('taskManager')}</Text>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          style={styles.segmented}
          theme={{colors: {secondaryContainer: COLORS.primaryContainer}}}
          buttons={[
            {value: 'today', label: 'Today', checkedColor: COLORS.onPrimaryContainer},
            {value: 'upcoming', label: 'Upcoming', checkedColor: COLORS.onPrimaryContainer},
            {value: 'completed', label: 'History', checkedColor: COLORS.onPrimaryContainer},
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id!}
          renderItem={({item}) => (
            <TaskCard
              task={item}
              onComplete={() => handleCompleteTask(item.id!)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="bodyLarge" style={styles.emptyText}>No tasks found</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color={COLORS.onPrimaryContainer}
        onPress={() => navigation.navigate('CreateTask')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    color: COLORS.primary,
    fontFamily: 'Manrope-Bold',
    marginBottom: SPACING.md,
  },
  segmented: {
    marginTop: SPACING.sm,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: COLORS.onSurface,
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    margin: 24,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primaryContainer,
  },
});

export default TaskManagerScreen;
