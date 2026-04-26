import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, FlatList, ActivityIndicator} from 'react-native';
import {Text, SegmentedButtons, FAB} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useThemeColors} from '../../theme/ThemeContext';
import {SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService, getTasksForDate, taskOccursOnDate} from '../../services/database';
import {Task} from '../../types';
import TaskCard from '../../components/tasks/TaskCard';

const todayStr = () => new Date().toISOString().split('T')[0];

const TaskManagerScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const colors = useThemeColors();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [displayTasks, setDisplayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');

  // Reload every time the screen comes into focus (e.g. after CreateTask)
  useFocusEffect(
    useCallback(() => {
      if (user) loadTasks();
    }, [user]),
  );

  useEffect(() => {
    applyFilter(allTasks, filter);
  }, [filter, allTasks]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tasks = await DatabaseService.getTasks(user!.uid);
      setAllTasks(tasks);
      applyFilter(tasks, filter);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (tasks: Task[], f: string) => {
    const today = todayStr();
    const now = new Date();

    if (f === 'today') {
      // All tasks (including recurring) that occur today
      const todayTasks = getTasksForDate(tasks, today);
      setDisplayTasks(todayTasks);
    } else if (f === 'upcoming') {
      // Tasks starting from now (next 7 days), not completed
      const result: Task[] = [];
      for (let i = 0; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayTasks = getTasksForDate(tasks, dateStr).filter(t => {
          if (t.status === 'completed') return false;
          // For today, only show tasks that haven't ended yet
          if (dateStr === today) {
            return t.endTime.toDate() >= now;
          }
          return true;
        });
        result.push(...dayTasks);
      }
      // Deduplicate by id+date
      const seen = new Set<string>();
      const deduped = result.filter(t => {
        const key = (t.id || '') + t.startTime.toDate().toISOString().split('T')[0];
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setDisplayTasks(deduped);
    } else {
      // History — completed tasks
      setDisplayTasks(tasks.filter(t => t.status === 'completed'));
    }
  };

  const handleComplete = async (task: Task) => {
    if (!task.id) return;
    try {
      await DatabaseService.updateTaskStatus(user!.uid, task.id, 'completed');
      await DatabaseService.updateXP(user!.uid, task.xpAwarded || 50);
      loadTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!task.id) return;
    try {
      await DatabaseService.deleteTask(user!.uid, task.id);
      loadTasks();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.header}>
        <Text variant="displaySmall" style={[styles.title, {color: colors.primary}]}>
          {t('taskManager')}
        </Text>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          style={styles.segmented}
          theme={{colors: {secondaryContainer: colors.primaryContainer}}}
          buttons={[
            {value: 'today', label: 'Today', checkedColor: colors.onPrimaryContainer},
            {value: 'upcoming', label: 'Upcoming', checkedColor: colors.onPrimaryContainer},
            {value: 'completed', label: 'History', checkedColor: colors.onPrimaryContainer},
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={displayTasks}
          keyExtractor={(item, index) =>
            (item.id || '') + item.startTime.toDate().toISOString() + index
          }
          renderItem={({item}) => (
            <TaskCard
              task={item}
              onComplete={() => handleComplete(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="bodyLarge" style={[styles.emptyText, {color: colors.onSurface}]}>
                {filter === 'today'
                  ? 'No tasks for today'
                  : filter === 'upcoming'
                  ? 'Nothing coming up'
                  : 'No completed tasks yet'}
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, {backgroundColor: colors.primaryContainer}]}
        color={colors.onPrimaryContainer}
        onPress={() => navigation.navigate('CreateTask')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {padding: SPACING.lg, paddingBottom: SPACING.md},
  title: {fontFamily: 'Manrope-Bold', marginBottom: SPACING.md},
  segmented: {marginTop: SPACING.sm},
  loader: {marginTop: SPACING.xl},
  listContent: {padding: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 100},
  empty: {alignItems: 'center', marginTop: 100},
  emptyText: {opacity: 0.5},
  fab: {position: 'absolute', margin: 24, right: 0, bottom: 0},
});

export default TaskManagerScreen;
