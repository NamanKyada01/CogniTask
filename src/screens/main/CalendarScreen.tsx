import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, Surface} from 'react-native-paper';
import {Calendar} from 'react-native-calendars';
import {useFocusEffect} from '@react-navigation/native';
import {useThemeColors} from '../../theme/ThemeContext';
import {SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService, getTasksForDate, taskOccursOnDate} from '../../services/database';
import {Task} from '../../types';
import TaskCard from '../../components/tasks/TaskCard';

// Build calendar markers for the next 60 days based on all tasks (including recurring)
const buildMarkers = (allTasks: Task[], selectedDate: string, colors: any) => {
  const markers: Record<string, any> = {};

  // Scan 60 days forward from 30 days ago
  const base = new Date();
  base.setDate(base.getDate() - 30);

  for (let i = 0; i < 90; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const dayTasks = getTasksForDate(allTasks, dateStr);
    if (dayTasks.length > 0) {
      // Use the first task's color as the dot color
      markers[dateStr] = {
        marked: true,
        dotColor: dayTasks[0].color || colors.primary,
        dots: dayTasks.slice(0, 3).map(t => ({color: t.color || colors.primary})),
      };
    }
  }

  // Overlay selected date
  markers[selectedDate] = {
    ...(markers[selectedDate] || {}),
    selected: true,
    selectedColor: colors.primary,
    selectedTextColor: '#ffffff',
  };

  return markers;
};

const CalendarScreen = () => {
  const {user} = useAuth();
  const colors = useThemeColors();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});

  useFocusEffect(
    useCallback(() => {
      if (user) loadTasks();
    }, [user]),
  );

  useEffect(() => {
    if (allTasks.length >= 0) {
      const tasks = getTasksForDate(allTasks, selectedDate);
      setDayTasks(tasks);
      setMarkedDates(buildMarkers(allTasks, selectedDate, colors));
    }
  }, [selectedDate, allTasks]);

  const loadTasks = async () => {
    try {
      const tasks = await DatabaseService.getTasks(user!.uid);
      setAllTasks(tasks);
    } catch (error) {
      console.error(error);
    }
  };

  const handleComplete = async (task: Task) => {
    if (!task.id) return;
    await DatabaseService.updateTaskStatus(user!.uid, task.id, 'completed');
    loadTasks();
  };

  const handleDelete = async (task: Task) => {
    if (!task.id) return;
    await DatabaseService.deleteTask(user!.uid, task.id);
    loadTasks();
  };

  const displayDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.header}>
        <Text variant="displaySmall" style={[styles.title, {color: colors.primary}]}>
          Calendar
        </Text>
      </View>

      <Surface
        style={[
          styles.calendarContainer,
          {backgroundColor: colors.surfaceLow, borderColor: colors.outlineVariant + '20'},
        ]}
        elevation={1}>
        <Calendar
          current={selectedDate}
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: colors.onSurfaceVariant,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.primary,
            todayBackgroundColor: colors.primary + '22',
            dayTextColor: colors.onSurface,
            textDisabledColor: colors.outlineVariant,
            dotColor: colors.primary,
            selectedDotColor: '#ffffff',
            arrowColor: colors.primary,
            monthTextColor: colors.onSurface,
            textDayFontFamily: 'Inter-Regular',
            textMonthFontFamily: 'Manrope-Bold',
            textDayHeaderFontFamily: 'Inter-SemiBold',
            textDayFontSize: 14,
            textMonthFontSize: 16,
          }}
        />
      </Surface>

      <View style={styles.listHeader}>
        <Text variant="titleMedium" style={[styles.listTitle, {color: colors.onSurface}]}>
          {displayDate}
        </Text>
        <Text variant="labelSmall" style={{color: colors.onSurfaceVariant}}>
          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {dayTasks.length > 0 ? (
          dayTasks.map((task, index) => (
            <TaskCard
              key={(task.id || '') + index}
              task={task}
              onComplete={() => handleComplete(task)}
              onDelete={() => handleDelete(task)}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Text variant="bodyMedium" style={{color: colors.onSurface, opacity: 0.5}}>
              No tasks for this day
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {padding: SPACING.lg, paddingBottom: SPACING.sm},
  title: {fontFamily: 'Manrope-Bold'},
  calendarContainer: {
    marginHorizontal: SPACING.lg,
    borderRadius: ROUNDNESS.lg,
    padding: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
  },
  listHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {fontFamily: 'Inter-SemiBold'},
  scrollContent: {paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl},
  empty: {alignItems: 'center', marginTop: SPACING.xl},
});

export default CalendarScreen;
