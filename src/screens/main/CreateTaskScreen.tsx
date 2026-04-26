import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, ScrollView, Animated} from 'react-native';
import {Text, TextInput, Button, IconButton} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import firestore from '@react-native-firebase/firestore';

const CreateTaskScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [loading, setLoading] = useState(false);

  const colors = ['#2E5BFF', '#FFB59B', '#B8C3FF', '#C24100', '#FFB4AB'];
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(contentSlide, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 6,
        }),
      ]),
    ]).start();
  }, []);

  const handleCreate = async () => {
    if (!title || !user) return;
    setLoading(true);
    try {
      await DatabaseService.createTask(user.uid, {
        title,
        description,
        category,
        startTime: firestore.Timestamp.now(), // Simplified for now
        endTime: firestore.Timestamp.now(),
        duration: 30,
        status: 'scheduled',
        priority: 'medium',
        xpAwarded: 50,
        reminderMinutes: 10,
        repeat: [],
        color: selectedColor,
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, {opacity: headerAnim}]}>
        <IconButton icon="close" iconColor={COLORS.onSurface} onPress={() => navigation.goBack()} />
        <Text variant="headlineSmall" style={styles.title}>New Task</Text>
        <View style={{width: 48}} />
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        style={{
          opacity: contentAnim,
          transform: [{translateY: contentSlide}],
        }}>
        <TextInput
          label="What needs to be done?"
          value={title}
          onChangeText={setTitle}
          mode="flat"
          style={styles.input}
          textColor={COLORS.onSurface}
        />
        <TextInput
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          mode="flat"
          style={styles.input}
          textColor={COLORS.onSurface}
        />

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {['Work', 'Study', 'Personal', 'Focus'].map(c => (
              <Button
                key={c}
                mode={category === c ? 'contained' : 'outlined'}
                onPress={() => setCategory(c)}
                style={styles.chip}
                labelStyle={styles.chipLabel}>
                {c}
              </Button>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>COLOR THEME</Text>
          <View style={styles.colorRow}>
            {colors.map(c => (
              <IconButton
                key={c}
                icon={selectedColor === c ? 'check' : ''}
                containerColor={c}
                iconColor="white"
                size={24}
                onPress={() => setSelectedColor(c)}
              />
            ))}
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}>
          Save Task
        </Button>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  title: {
    color: COLORS.primary,
    fontFamily: 'Manrope-Bold',
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  input: {
    backgroundColor: 'transparent',
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    borderRadius: ROUNDNESS.full,
  },
  chipLabel: {
    fontSize: 12,
  },
  colorRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.primaryContainer,
    marginTop: SPACING.xl,
    borderRadius: ROUNDNESS.md,
  },
  saveButtonContent: {
    height: 56,
  },
});

export default CreateTaskScreen;
