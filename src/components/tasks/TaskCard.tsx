import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Pressable} from 'react-native';
import {Text, Surface, IconButton} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SPACING, ROUNDNESS} from '../../theme/tokens';
import {useThemeColors} from '../../theme/ThemeContext';
import {Task} from '../../types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#FF6B6B',
};

const REPEAT_ICONS: Record<string, string> = {
  daily: 'repeat',
  weekly: 'calendar-repeat',
  custom: 'calendar-check',
  none: '',
};

const TaskCard: React.FC<TaskCardProps> = ({task, onPress, onComplete, onDelete}) => {
  const colors = useThemeColors();
  const mountAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mountAnim, {toValue: 1, duration: 350, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0, duration: 350, useNativeDriver: true}),
    ]).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4}).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4}).start();

  const repeatIcon = REPEAT_ICONS[task.repeatType || 'none'];
  const priorityColor = PRIORITY_COLORS[task.priority || 'medium'];
  const isCompleted = task.status === 'completed';

  const startStr = new Date(task.startTime.toDate()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endStr = new Date(task.endTime.toDate()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View
      style={{
        opacity: mountAnim,
        transform: [{translateY: slideAnim}, {scale: scaleAnim}],
      }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Surface style={[styles.card, {backgroundColor: colors.surfaceLow}, isCompleted && styles.completedCard]} elevation={1}>
          {/* Left accent bar with priority color */}
          <View style={[styles.accent, {backgroundColor: task.color || colors.primary}]} />

          <View style={styles.content}>
            <View style={styles.left}>
              {/* Title row */}
              <View style={styles.titleRow}>
                {/* Priority dot */}
                <View style={[styles.priorityDot, {backgroundColor: priorityColor}]} />
                <Text
                  variant="titleMedium"
                  style={[styles.title, {color: colors.onSurface}, isCompleted && styles.completedText]}
                  numberOfLines={1}>
                  {task.title}
                </Text>
              </View>

              {/* Metadata row */}
              <View style={styles.metadata}>
                <Text variant="labelSmall" style={[styles.category, {color: colors.primary}]}>
                  {task.category.toUpperCase()}
                </Text>
                <Text variant="labelSmall" style={[styles.time, {color: colors.onSurfaceVariant}]}>
                  {startStr} – {endStr}
                </Text>
                {task.duration > 0 && (
                  <Text variant="labelSmall" style={[styles.duration, {color: colors.onSurfaceVariant}]}>
                    {task.duration}m
                  </Text>
                )}
                {repeatIcon ? (
                  <MaterialCommunityIcons name={repeatIcon} size={12} color={colors.onSurfaceVariant} />
                ) : null}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.right}>
              <IconButton
                icon={isCompleted ? 'check-circle' : 'check-circle-outline'}
                iconColor={isCompleted ? colors.primary : colors.onSurfaceVariant}
                size={22}
                onPress={onComplete}
              />
              <IconButton
                icon="delete-outline"
                iconColor={colors.error}
                size={22}
                onPress={onDelete}
              />
            </View>
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: ROUNDNESS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    minHeight: 72,
  },
  completedCard: {
    opacity: 0.6,
  },
  accent: {
    width: 5,
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  left: {flex: 1},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  category: {
    opacity: 0.8,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
  },
  duration: {
    fontSize: 11,
    opacity: 0.7,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default TaskCard;
