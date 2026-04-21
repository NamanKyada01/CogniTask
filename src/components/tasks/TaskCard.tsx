import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Surface, IconButton} from 'react-native-paper';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {Task} from '../../types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({task, onComplete, onDelete}) => {
  return (
    <Surface style={styles.card} elevation={1}>
      <View style={[styles.accent, {backgroundColor: task.color || COLORS.primary}]} />
      <View style={styles.content}>
        <View style={styles.left}>
          <Text variant="titleMedium" style={styles.title}>{task.title}</Text>
          <View style={styles.metadata}>
            <Text variant="labelSmall" style={styles.category}>{task.category.toUpperCase()}</Text>
            <Text variant="labelSmall" style={styles.time}>
              {new Date(task.startTime.toDate()).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          <IconButton
            icon="check-circle-outline"
            iconColor={task.status === 'completed' ? COLORS.primary : COLORS.onSurfaceVariant}
            size={24}
            onPress={onComplete}
          />
          <IconButton
            icon="delete-outline"
            iconColor={COLORS.error}
            size={24}
            onPress={onDelete}
          />
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLow,
    borderRadius: ROUNDNESS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    height: 80,
  },
  accent: {
    width: 6,
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
  },
  title: {
    color: COLORS.onSurface,
    fontFamily: 'Inter-SemiBold',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: SPACING.sm,
  },
  category: {
    color: COLORS.primary,
    opacity: 0.8,
  },
  time: {
    color: COLORS.onSurfaceVariant,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default TaskCard;
