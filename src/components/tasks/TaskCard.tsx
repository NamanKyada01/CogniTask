import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Pressable} from 'react-native';
import {Text, Surface, IconButton} from 'react-native-paper';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {Task} from '../../types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({task, onPress, onComplete, onDelete}) => {
  const mountAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mountAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: mountAnim,
        transform: [{translateY: slideAnim}, {scale: scaleAnim}],
      }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
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
      </Pressable>
    </Animated.View>
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
