import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, Surface, List, Avatar, Switch, Button} from 'react-native-paper';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {UserProfile} from '../../types';
import auth from '@react-native-firebase/auth';

const ProfileScreen = () => {
  const {user} = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (user) loadProfile();
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
      <View style={styles.header}>
        <Avatar.Icon size={80} icon="account" backgroundColor={COLORS.surfaceHigh} color={COLORS.primary} />
        <Text variant="headlineSmall" style={styles.userName}>
          {profile ? `${profile.firstName} ${profile.lastName}` : 'User'}
        </Text>
        <Text variant="bodyMedium" style={styles.userEmail}>{profile?.email}</Text>
        <Button mode="outlined" style={styles.editButton} labelStyle={{fontSize: 12}}>Edit Profile</Button>
      </View>

      <ScrollView style={styles.content}>
        <Surface style={styles.settingsGroup} elevation={1}>
          <Text variant="labelLarge" style={styles.groupTitle}>HABIT DNA (LAST 30 DAYS)</Text>
          <View style={styles.heatmapRow}>
            {Array.from({length: 30}).map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.heatmapCell, 
                  {backgroundColor: i % 3 === 0 ? COLORS.primary : COLORS.surfaceHigh, opacity: 0.3 + (i % 7) * 0.1}
                ]} 
              />
            ))}
          </View>
          <Text variant="labelSmall" style={styles.heatmapLegend}>Focus consistency: High (84%)</Text>
        </Surface>

        <Surface style={styles.settingsGroup} elevation={1}>
          <Text variant="labelLarge" style={styles.groupTitle}>PREFERENCES</Text>
          <List.Item
            title="Push Notifications"
            right={() => <Switch value={notifications} onValueChange={setNotifications} color={COLORS.primary} />}
            titleStyle={styles.listItemText}
          />
          <List.Item
            title="Dark Mode"
            right={() => <Switch value={darkMode} onValueChange={setDarkMode} color={COLORS.primary} />}
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', paddingVertical: SPACING.xxl, backgroundColor: COLORS.surfaceLow },
  userName: { color: COLORS.onSurface, marginTop: SPACING.md, fontFamily: 'Manrope-Bold' },
  userEmail: { color: COLORS.onSurfaceVariant, marginBottom: SPACING.md },
  editButton: { borderRadius: ROUNDNESS.sm, borderColor: COLORS.outlineVariant },
  content: { padding: SPACING.lg },
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
  settingsGroup: { padding: SPACING.sm, borderRadius: ROUNDNESS.lg, backgroundColor: COLORS.surfaceLow, marginBottom: SPACING.lg },
  groupTitle: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.primary, letterSpacing: 1.5, fontSize: 10 },
  listItemText: { color: COLORS.onSurface },
  descriptionText: { color: COLORS.onSurfaceVariant },
  footer: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xxl },
  version: { color: COLORS.onSurfaceVariant, letterSpacing: 1 },
});

export default ProfileScreen;
