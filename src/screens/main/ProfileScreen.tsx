import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, ScrollView, Animated} from 'react-native';
import {Text, Surface, List, Avatar, Switch, Button} from 'react-native-paper';
import {SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAppTheme, useThemeColors} from '../../theme/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {UserProfile} from '../../types';
import auth from '@react-native-firebase/auth';

const HEATMAP_COUNT = 30;

const ProfileScreen = () => {
  const {user} = useAuth();
  const {isDark, toggleTheme} = useAppTheme();
  const colors = useThemeColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState(true);

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
        Animated.timing(headerAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
        Animated.timing(headerSlide, {toValue: 0, duration: 500, useNativeDriver: true}),
      ]),
      Animated.stagger(
        20,
        heatmapAnims.map(anim =>
          Animated.timing(anim, {toValue: 1, duration: 200, useNativeDriver: true}),
        ),
      ),
      Animated.parallel([
        Animated.timing(settingsAnim, {toValue: 1, duration: 400, useNativeDriver: true}),
        Animated.timing(settingsSlide, {toValue: 0, duration: 400, useNativeDriver: true}),
      ]),
    ]).start();
  }, [user]);

  const loadProfile = async () => {
    const p = await DatabaseService.getUserProfile(user!.uid);
    setProfile(p);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {backgroundColor: colors.surfaceLow, opacity: headerAnim, transform: [{translateY: headerSlide}]},
        ]}>
        <Avatar.Icon
          size={80}
          icon="account"
          style={{backgroundColor: colors.surfaceHigh}}
          color={colors.primary}
        />
        <Text variant="headlineSmall" style={[styles.userName, {color: colors.onSurface}]}>
          {profile ? `${profile.firstName} ${profile.lastName}` : 'User'}
        </Text>
        <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant, marginBottom: SPACING.md}}>
          {profile?.email}
        </Text>
        <Button
          mode="outlined"
          style={[styles.editButton, {borderColor: colors.outlineVariant}]}
          labelStyle={{fontSize: 12, color: colors.onSurface}}>
          Edit Profile
        </Button>
      </Animated.View>

      <ScrollView style={styles.content}>
        {/* Habit DNA heatmap */}
        <Surface style={[styles.settingsGroup, {backgroundColor: colors.surfaceLow}]} elevation={1}>
          <Text variant="labelLarge" style={[styles.groupTitle, {color: colors.primary}]}>
            HABIT DNA (LAST 30 DAYS)
          </Text>
          <View style={styles.heatmapRow}>
            {heatmapAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.heatmapCell,
                  {
                    backgroundColor: i % 3 === 0 ? colors.primary : colors.surfaceHigh,
                    opacity: anim.interpolate({inputRange: [0, 1], outputRange: [0, 0.3 + (i % 7) * 0.1]}),
                    transform: [{scale: anim.interpolate({inputRange: [0, 1], outputRange: [0.4, 1]})}],
                  },
                ]}
              />
            ))}
          </View>
          <Text variant="labelSmall" style={[styles.heatmapLegend, {color: colors.onSurfaceVariant}]}>
            Focus consistency: High (84%)
          </Text>
        </Surface>

        {/* Settings */}
        <Animated.View style={{opacity: settingsAnim, transform: [{translateY: settingsSlide}]}}>
          <Surface style={[styles.settingsGroup, {backgroundColor: colors.surfaceLow}]} elevation={1}>
            <Text variant="labelLarge" style={[styles.groupTitle, {color: colors.primary}]}>PREFERENCES</Text>
            <List.Item
              title="Push Notifications"
              titleStyle={{color: colors.onSurface}}
              right={() => (
                <Switch value={notifications} onValueChange={setNotifications} color={colors.primary} />
              )}
            />
            <List.Item
              title="Dark Mode"
              titleStyle={{color: colors.onSurface}}
              right={() => (
                <Switch value={isDark} onValueChange={toggleTheme} color={colors.primary} />
              )}
            />
            <List.Item
              title="Language"
              description="English"
              titleStyle={{color: colors.onSurface}}
              descriptionStyle={{color: colors.onSurfaceVariant}}
              right={() => <List.Icon icon="chevron-right" color={colors.onSurfaceVariant} />}
            />
          </Surface>

          <Surface style={[styles.settingsGroup, {backgroundColor: colors.surfaceLow}]} elevation={1}>
            <Text variant="labelLarge" style={[styles.groupTitle, {color: colors.primary}]}>ACCOUNT</Text>
            <List.Item
              title="Privacy Policy"
              titleStyle={{color: colors.onSurface}}
              right={() => <List.Icon icon="chevron-right" color={colors.onSurfaceVariant} />}
            />
            <List.Item
              title="Terms of Service"
              titleStyle={{color: colors.onSurface}}
              right={() => <List.Icon icon="chevron-right" color={colors.onSurfaceVariant} />}
            />
            <List.Item
              title="Sign Out"
              titleStyle={{color: colors.error}}
              onPress={() => auth().signOut()}
              left={() => <List.Icon icon="logout" color={colors.error} />}
            />
          </Surface>

          <View style={styles.footer}>
            <Text variant="labelSmall" style={{color: colors.onSurfaceVariant, letterSpacing: 1}}>
              VERSION 1.0.0 (BETA)
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {alignItems: 'center', paddingVertical: SPACING.xxl},
  userName: {marginTop: SPACING.md, fontFamily: 'Manrope-Bold'},
  editButton: {borderRadius: ROUNDNESS.sm},
  content: {padding: SPACING.lg},
  heatmapRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: SPACING.md, justifyContent: 'center'},
  heatmapCell: {width: 12, height: 12, borderRadius: 2},
  heatmapLegend: {textAlign: 'center', marginBottom: SPACING.sm, fontSize: 10},
  settingsGroup: {padding: SPACING.sm, borderRadius: ROUNDNESS.lg, marginBottom: SPACING.lg},
  groupTitle: {paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, letterSpacing: 1.5, fontSize: 10},
  footer: {alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xxl},
});

export default ProfileScreen;
