import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, Surface} from 'react-native-paper';
import {Calendar} from 'react-native-calendars';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {Task} from '../../types';
import TaskCard from '../../components/tasks/TaskCard';

const CalendarScreen = () => {
  const {user} = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    if (user) loadMonthTasks();
  }, [user, selectedDate]);

  const loadMonthTasks = async () => {
    try {
      const allTasks = await DatabaseService.getTasks(user!.uid);
      const dayTasks = allTasks.filter(task => 
        task.startTime.toDate().toISOString().split('T')[0] === selectedDate
      );
      setTasks(dayTasks);

      const markers: any = {};
      allTasks.forEach(task => {
        const date = task.startTime.toDate().toISOString().split('T')[0];
        markers[date] = {marked: true, dotColor: task.color || COLORS.primary};
      });
      markers[selectedDate] = {...markers[selectedDate], selected: true, selectedColor: COLORS.primary};
      setMarkedDates(markers);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.title}>Calendar</Text>
      </View>

      <Surface style={styles.calendarContainer} elevation={1}>
        <Calendar
          current={selectedDate}
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: COLORS.background,
            calendarBackground: 'transparent',
            textSectionTitleColor: COLORS.onSurfaceVariant,
            selectedDayBackgroundColor: COLORS.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: COLORS.primary,
            dayTextColor: COLORS.onSurface,
            textDisabledColor: '#444',
            dotColor: COLORS.primary,
            selectedDotColor: '#ffffff',
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.primary,
            textDayFontFamily: 'Inter-Regular',
            textMonthFontFamily: 'Manrope-Bold',
            textDayHeaderFontFamily: 'Inter-SemiBold',
          }}
        />
      </Surface>

      <View style={styles.listHeader}>
        <Text variant="titleMedium" style={styles.listTitle}>
          Tasks for {new Date(selectedDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {tasks.length > 0 ? (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        ) : (
          <View style={styles.empty}>
            <Text variant="bodyMedium" style={styles.emptyText}>No tasks for this day</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.lg },
  title: { color: COLORS.primary, fontFamily: 'Manrope-Bold' },
  calendarContainer: { marginHorizontal: SPACING.lg, borderRadius: ROUNDNESS.lg, backgroundColor: COLORS.surfaceLow, padding: SPACING.sm, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  listHeader: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md },
  listTitle: { color: COLORS.onSurface, fontFamily: 'Inter-SemiBold' },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  empty: { alignItems: 'center', marginTop: SPACING.xl },
  emptyText: { color: COLORS.onSurface, opacity: 0.5 },
});

export default CalendarScreen;
