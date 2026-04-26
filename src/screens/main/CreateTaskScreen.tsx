import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {Text, TextInput, Button, IconButton, Surface, Chip} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {useThemeColors} from '../../theme/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import firestore from '@react-native-firebase/firestore';
import {RepeatType} from '../../types';

const CATEGORIES = ['Work', 'Study', 'Personal', 'Focus', 'Health', 'Other'];
const ACCENT_COLORS = ['#2E5BFF', '#FF6B6B', '#FFB59B', '#4CAF50', '#B8C3FF', '#FF9800'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRIORITIES = ['low', 'medium', 'high'] as const;
const PRIORITY_COLORS: Record<string, string> = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#FF6B6B',
};

type PickerMode = 'date' | 'startTime' | 'endTime' | null;

const CreateTaskScreen = ({navigation}: any) => {
  const {user} = useAuth();
  const colors = useThemeColors();

  // Core fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);

  // Date & time
  const [taskDate, setTaskDate] = useState(new Date());
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });

  // Repeat
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Picker state
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
      Animated.parallel([
        Animated.timing(contentAnim, {toValue: 1, duration: 450, useNativeDriver: true}),
        Animated.spring(contentSlide, {toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6}),
      ]),
    ]).start();
  }, []);

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});

  const buildTimestamp = (date: Date, time: Date) => {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return firestore.Timestamp.fromDate(combined);
  };

  const getDuration = () => {
    const start = buildTimestamp(taskDate, startTime).toDate();
    const end = buildTimestamp(taskDate, endTime).toDate();
    const diff = Math.round((end.getTime() - start.getTime()) / 60000);
    return diff > 0 ? diff : 0;
  };

  const handlePickerChange = (_: any, selected?: Date) => {
    if (!selected) {
      setPickerMode(null);
      return;
    }
    if (pickerMode === 'date') setTaskDate(selected);
    else if (pickerMode === 'startTime') setStartTime(selected);
    else if (pickerMode === 'endTime') setEndTime(selected);

    if (Platform.OS === 'android') setPickerMode(null);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }
    if (getDuration() <= 0) {
      setError('End time must be after start time.');
      return;
    }
    if (repeatType === 'weekly' && selectedDays.length === 0) {
      setError('Please select at least one day for weekly repeat.');
      return;
    }
    setError('');
    if (!user) return;
    setLoading(true);
    try {
      const startTs = buildTimestamp(taskDate, startTime);
      const endTs = buildTimestamp(taskDate, endTime);
      const duration = getDuration();

      await DatabaseService.createTask(user.uid, {
        title: title.trim(),
        description: description.trim(),
        category,
        startTime: startTs,
        endTime: endTs,
        duration,
        status: 'scheduled',
        priority,
        xpAwarded: priority === 'high' ? 100 : priority === 'medium' ? 50 : 25,
        reminderMinutes: 10,
        repeatType,
        repeat: repeatType === 'weekly' ? selectedDays : [],
        color: accentColor,
      });
      navigation.goBack();
    } catch (err) {
      console.error(err);
      setError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      {/* Header */}
      <Animated.View style={[s.header, {opacity: headerAnim}]}>
        <IconButton icon="close" iconColor={colors.onSurface} onPress={() => navigation.goBack()} />
        <Text variant="headlineSmall" style={s.headerTitle}>New Task</Text>
        <View style={{width: 48}} />
      </Animated.View>

      <Animated.ScrollView
        style={{opacity: contentAnim, transform: [{translateY: contentSlide}]}}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled">

        {/* Title */}
        <TextInput
          label="What needs to be done?"
          value={title}
          onChangeText={t => {setTitle(t); setError('');}}
          mode="flat"
          style={s.input}
          textColor={colors.onSurface}
          underlineColor={colors.outlineVariant}
          activeUnderlineColor={colors.primary}
        />
        <TextInput
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          mode="flat"
          style={s.input}
          textColor={colors.onSurface}
          underlineColor={colors.outlineVariant}
          activeUnderlineColor={colors.primary}
        />

        {error ? (
          <Text variant="labelMedium" style={s.errorText}>{error}</Text>
        ) : null}

        {/* ── DATE & TIME ── */}
        <SectionLabel label="DATE & TIME" colors={colors} />
        <Surface style={s.dateTimeCard} elevation={1}>
          {/* Date row */}
          <TouchableOpacity style={s.dateRow} onPress={() => setPickerMode('date')}>
            <IconButton icon="calendar" size={20} iconColor={colors.primary} style={s.rowIcon} />
            <View style={s.rowContent}>
              <Text variant="labelSmall" style={s.rowLabel}>DATE</Text>
              <Text variant="titleMedium" style={s.rowValue}>{formatDate(taskDate)}</Text>
            </View>
            <IconButton icon="chevron-right" size={18} iconColor={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Start time */}
          <TouchableOpacity style={s.dateRow} onPress={() => setPickerMode('startTime')}>
            <IconButton icon="clock-start" size={20} iconColor={colors.primary} style={s.rowIcon} />
            <View style={s.rowContent}>
              <Text variant="labelSmall" style={s.rowLabel}>START TIME</Text>
              <Text variant="titleMedium" style={s.rowValue}>{formatTime(startTime)}</Text>
            </View>
            <IconButton icon="chevron-right" size={18} iconColor={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={s.divider} />

          {/* End time */}
          <TouchableOpacity style={s.dateRow} onPress={() => setPickerMode('endTime')}>
            <IconButton icon="clock-end" size={20} iconColor={colors.primary} style={s.rowIcon} />
            <View style={s.rowContent}>
              <Text variant="labelSmall" style={s.rowLabel}>END TIME</Text>
              <Text variant="titleMedium" style={s.rowValue}>{formatTime(endTime)}</Text>
            </View>
            <IconButton icon="chevron-right" size={18} iconColor={colors.onSurfaceVariant} />
          </TouchableOpacity>

          {getDuration() > 0 && (
            <View style={s.durationBadge}>
              <Text variant="labelSmall" style={[s.durationText, {color: colors.primary}]}>
                {getDuration()} min
              </Text>
            </View>
          )}
        </Surface>

        {/* Native date/time picker */}
        {pickerMode !== null && (
          <DateTimePicker
            value={
              pickerMode === 'date'
                ? taskDate
                : pickerMode === 'startTime'
                ? startTime
                : endTime
            }
            mode={pickerMode === 'date' ? 'date' : 'time'}
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickerChange}
            minimumDate={pickerMode === 'date' ? new Date() : undefined}
          />
        )}

        {/* ── REPEAT ── */}
        <SectionLabel label="REPEAT" colors={colors} />
        <View style={s.chipRow}>
          {(['none', 'daily', 'weekly', 'custom'] as RepeatType[]).map(rt => (
            <TouchableOpacity
              key={rt}
              style={[
                s.repeatChip,
                {
                  backgroundColor:
                    repeatType === rt ? colors.primaryContainer : colors.surfaceLow,
                  borderColor:
                    repeatType === rt ? colors.primaryContainer : colors.outlineVariant,
                },
              ]}
              onPress={() => setRepeatType(rt)}>
              <Text
                variant="labelMedium"
                style={{
                  color: repeatType === rt ? colors.onPrimaryContainer : colors.onSurface,
                  textTransform: 'capitalize',
                }}>
                {rt === 'none' ? 'Once' : rt === 'custom' ? 'Custom' : rt.charAt(0).toUpperCase() + rt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly day selector */}
        {repeatType === 'weekly' && (
          <View style={s.daysRow}>
            {DAYS.map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  s.dayChip,
                  {
                    backgroundColor: selectedDays.includes(day)
                      ? colors.primaryContainer
                      : colors.surfaceLow,
                    borderColor: selectedDays.includes(day)
                      ? colors.primaryContainer
                      : colors.outlineVariant,
                  },
                ]}
                onPress={() => toggleDay(day)}>
                <Text
                  variant="labelSmall"
                  style={{
                    color: selectedDays.includes(day)
                      ? colors.onPrimaryContainer
                      : colors.onSurface,
                    fontFamily: 'Inter-SemiBold',
                  }}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── CATEGORY ── */}
        <SectionLabel label="CATEGORY" colors={colors} />
        <View style={s.chipRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                s.repeatChip,
                {
                  backgroundColor:
                    category === c ? colors.primaryContainer : colors.surfaceLow,
                  borderColor:
                    category === c ? colors.primaryContainer : colors.outlineVariant,
                },
              ]}
              onPress={() => setCategory(c)}>
              <Text
                variant="labelMedium"
                style={{
                  color: category === c ? colors.onPrimaryContainer : colors.onSurface,
                }}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PRIORITY ── */}
        <SectionLabel label="PRIORITY" colors={colors} />
        <View style={s.chipRow}>
          {PRIORITIES.map(p => (
            <TouchableOpacity
              key={p}
              style={[
                s.repeatChip,
                {
                  backgroundColor:
                    priority === p ? PRIORITY_COLORS[p] + '33' : colors.surfaceLow,
                  borderColor:
                    priority === p ? PRIORITY_COLORS[p] : colors.outlineVariant,
                },
              ]}
              onPress={() => setPriority(p)}>
              <View style={s.priorityRow}>
                <View
                  style={[
                    s.priorityDot,
                    {backgroundColor: PRIORITY_COLORS[p]},
                  ]}
                />
                <Text
                  variant="labelMedium"
                  style={{
                    color: priority === p ? PRIORITY_COLORS[p] : colors.onSurface,
                    textTransform: 'capitalize',
                  }}>
                  {p}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── COLOR ── */}
        <SectionLabel label="COLOR" colors={colors} />
        <View style={s.colorRow}>
          {ACCENT_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                s.colorDot,
                {backgroundColor: c},
                accentColor === c && s.colorDotSelected,
              ]}
              onPress={() => setAccentColor(c)}>
              {accentColor === c && (
                <Text style={s.colorCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Save */}
        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          style={[s.saveButton, {backgroundColor: colors.primaryContainer}]}
          contentStyle={s.saveButtonContent}
          labelStyle={{color: colors.onPrimaryContainer, fontFamily: 'Inter-SemiBold', fontSize: 16}}>
          Save Task
        </Button>
      </Animated.ScrollView>
    </View>
  );
};

const SectionLabel = ({label, colors}: {label: string; colors: any}) => (
  <Text
    variant="labelLarge"
    style={{
      color: colors.onSurfaceVariant,
      letterSpacing: 1.2,
      marginBottom: SPACING.sm,
      marginTop: SPACING.md,
    }}>
    {label}
  </Text>
);

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.background},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.sm,
      paddingTop: SPACING.sm,
    },
    headerTitle: {color: colors.primary, fontFamily: 'Manrope-Bold'},
    content: {padding: SPACING.lg, gap: SPACING.xs, paddingBottom: SPACING.xxl},
    input: {backgroundColor: 'transparent', marginBottom: SPACING.xs},
    errorText: {color: colors.error, marginTop: -SPACING.xs},

    // Date/time card
    dateTimeCard: {
      borderRadius: ROUNDNESS.lg,
      backgroundColor: colors.surfaceLow,
      overflow: 'hidden',
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: SPACING.sm,
    },
    rowIcon: {margin: 0},
    rowContent: {flex: 1, paddingVertical: SPACING.sm},
    rowLabel: {color: colors.onSurfaceVariant, fontSize: 10, letterSpacing: 1},
    rowValue: {color: colors.onSurface, fontFamily: 'Inter-SemiBold'},
    divider: {height: 1, backgroundColor: colors.outlineVariant, marginHorizontal: SPACING.md, opacity: 0.4},
    durationBadge: {
      alignSelf: 'flex-end',
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    durationText: {fontFamily: 'Inter-SemiBold'},

    // Chips
    chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm},
    repeatChip: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: ROUNDNESS.full,
      borderWidth: 1,
    },
    daysRow: {flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm, flexWrap: 'wrap'},
    dayChip: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Priority
    priorityRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
    priorityDot: {width: 8, height: 8, borderRadius: 4},

    // Color
    colorRow: {flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap'},
    colorDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorDotSelected: {
      borderWidth: 3,
      borderColor: colors.onSurface,
    },
    colorCheck: {color: 'white', fontSize: 16, fontWeight: 'bold'},

    // Save
    saveButton: {marginTop: SPACING.xl, borderRadius: ROUNDNESS.md},
    saveButtonContent: {height: 56},
  });

export default CreateTaskScreen;
