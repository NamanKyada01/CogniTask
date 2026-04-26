import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, ScrollView, Animated} from 'react-native';
import {Text, Surface, List, Avatar, Switch, Button} from 'react-native-paper';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {UserProfile} from '../../types';
import auth from '@react-native-firebase/auth';

const HEATMAP_COUNT = 30;

const ProfileScreen = () => {
  const {user} = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const settingsAnim = useRef(new Animated.Value(0)).current;
  const settingsSlide = useRef(new Animated.Value(30)).current;
  const heatmapAnims = useRef(
    Array.from({length: HEATMAP_COUNT}, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (user) loadProfile();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(
        20,
        heatmapAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ),
      ),
      Animated.parallel([
        Animated.timing(settingsAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(settingsSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [user]);

  const loadProfile = async () => {
    const p = await DatabaseService.getUserProfile(user!.uid);
    setProfile(p);
  };

  const handleLogout = () => {
    auth().signOut();
  };

  return (
    <View style={styles.container}>
      {/* Animated header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{translateY: headerSlide}],
          },
        ]}>
        <Avatar.Icon size={80} icon="account" style={{backgroundColor: COLORS.surfaceHigh}} color={COLORS.primary} />
        <Text variant="headlineSmall" style={styles.userName}>
          {profile ? `${profile.firstName} ${profile.lastName}` : 'User'}
        </Text>
        <Text variant="bodyMedium" style={styles.userEmail}>{profile?.email}</Text>
        <Button mode="outlined" style={styles.editButton} labelStyle={{fontSize: 12}}>
          Edit Profile
        </Button>
      </Animated.View>

      <ScrollView style={styles.content}>
        {/* Habit DNA heatmap with staggered cells */}
        <Surface style={styles.settingsGroup} elevation={1}>
          <Text variant="labelLarge" style={styles.groupTitle}>HABIT DNA (LAST 30 DAYS)</Text>
          <View style={styles.heatmapRow}>
            {heatmapAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.heatmapCell,
                  {
                    backgroundColor: i % 3 === 0 ? COLORS.primary : COLORS.surfaceHigh,
                    opacity: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.3 + (i % 7) * 0.1],
                    }),
                    transform: [
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
          <Text variant="labelSmall" style={styles.heatmapLegend}>Focus consistency: High (84%)</Text>
        </Surface>

        {/* Settings groups */}
        <Animated.View
          style={{
            opacity: settingsAnim,
            transform: [{translateY: settingsSlide}],
          }}>
          <Surface style={styles.settingsGroup} elevation={1}>
            <Text variant="labelLarge" style={styles.groupTitle}>PREFERENCES</Text>
            <List.Item
              title="Push Notifications"
              right={() => (
                <Switch value={notifications} onValueChange={setNotifications} color={COLORS.primary} />
              )}
              titleStyle={styles.listItemText}
            />
            <List.Item
              title="Dark Mode"
              right={() => (
                <Switch value={darkMode} onValueChange={setDarkMode} color={COLORS.primary} />
              )}
              titleStyle={styles.listItemText}
            />
            <List.Item
              title="Language"
              description="English"
              right={() => <List.Icon icon="chevron-right" />}
              titleStyle={styles.listItemText}
              descriptionStyle={styles.descriptionText}
            />
          </Surface>

          <Surface style={styles.settingsGroup} elevation={1}>
            <Text variant="labelLarge" style={styles.groupTitle}>ACCOUNT</Text>
            <List.Item
              title="Privacy Policy"
              right={() => <List.Icon icon="chevron-right" />}
              titleStyle={styles.listItemText}
            />
            <List.Item
              title="Terms of Service"
              right={() => <List.Icon icon="chevron-right" />}
              titleStyle={styles.listItemText}
            />
            <List.Item
              title="Sign Out"
              titleStyle={[styles.listItemText, {color: COLORS.error}]}
              onPress={handleLogout}
              left={() => <List.Icon icon="logout" color={COLORS.error} />}
            />
          </Surface>

          <View style={styles.footer}>
            <Text variant="labelSmall" style={styles.version}>VERSION 1.0.0 (BETA)</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.surfaceLow,
  },
  userName: {color: COLORS.onSurface, marginTop: SPACING.md, fontFamily: 'Manrope-Bold'},
  userEmail: {color: COLORS.onSurfaceVariant, marginBottom: SPACING.md},
  editButton: {borderRadius: ROUNDNESS.sm, borderColor: COLORS.outlineVariant},
  content: {padding: SPACING.lg},
  heatmapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  heatmapCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatmapLegend: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontSize: 10,
  },
  settingsGroup: {
    padding: SPACING.sm,
    borderRadius: ROUNDNESS.lg,
    backgroundColor: COLORS.surfaceLow,
    marginBottom: SPACING.lg,
  },
  groupTitle: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.primary,
    letterSpacing: 1.5,
    fontSize: 10,
  },
  listItemText: {color: COLORS.onSurface},
  descriptionText: {color: COLORS.onSurfaceVariant},
  footer: {alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xxl},
  version: {color: COLORS.onSurfaceVariant, letterSpacing: 1},
});

export default ProfileScreen;
