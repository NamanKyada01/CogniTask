import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, ScrollView, Animated, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {Text, Surface, List, Avatar, Switch, Button} from 'react-native-paper';
import {SPACING, ROUNDNESS} from '../../theme/tokens';
import {useAppTheme, useThemeColors} from '../../theme/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {DatabaseService} from '../../services/database';
import {UserProfile} from '../../types';
import auth from '@react-native-firebase/auth';
import {launchImageLibrary} from 'react-native-image-picker';
import axios from 'axios';

const HEATMAP_COUNT = 7 * 24; // 7 days * 24 hours
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HOURS = ['12a', '6a', '12p', '6p'];

const ProfileScreen = () => {
  const {user} = useAuth();
  const {isDark, toggleTheme} = useAppTheme();
  const colors = useThemeColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Cloudinary Config (Set these in your environment or replace with real ones)
  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload';
  const UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';

  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const settingsAnim = useRef(new Animated.Value(0)).current;
  const settingsSlide = useRef(new Animated.Value(30)).current;
  const heatmapAnims = useRef(
    Array.from({length: HEATMAP_COUNT}, () => new Animated.Value(0)),
  ).current;
  
  // Dummy data generation for the 7x24 grid based on 90-day logic
  const [heatmapData, setHeatmapData] = useState<number[]>([]);
  
  useEffect(() => {
    // Generate placeholder densities (0-5)
    const data = Array.from({length: HEATMAP_COUNT}, () => Math.floor(Math.random() * 6));
    setHeatmapData(data);
  }, []);

  useEffect(() => {
    if (user) loadProfile();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
        Animated.timing(headerSlide, {toValue: 0, duration: 500, useNativeDriver: true}),
      ]),
      Animated.stagger(
        2,
        heatmapAnims.map(anim =>
          Animated.timing(anim, {toValue: 1, duration: 300, useNativeDriver: true}),
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

  const handleAvatarUpload = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', quality: 0.7});
    if (result.didCancel || !result.assets || result.assets.length === 0) return;

    const file = result.assets[0];
    if (!file.uri) return;

    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || 'avatar.jpg',
      } as any);
      data.append('upload_preset', UPLOAD_PRESET);

      const response = await axios.post(CLOUDINARY_URL, data, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      const avatarUrl = response.data.secure_url;
      await DatabaseService.updateUserProfile(user!.uid, {avatarUrl});
      setProfile(prev => prev ? {...prev, avatarUrl} : prev);
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', 'Failed to upload avatar. Check Cloudinary config.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {backgroundColor: colors.surfaceLow, opacity: headerAnim, transform: [{translateY: headerSlide}]},
        ]}>
        <TouchableOpacity onPress={handleAvatarUpload} disabled={uploading}>
          {uploading ? (
            <View style={[styles.avatarPlaceholder, {backgroundColor: colors.surfaceHigh}]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : profile?.avatarUrl ? (
            <Avatar.Image
              size={80}
              source={{uri: profile.avatarUrl}}
              style={{backgroundColor: colors.surfaceHigh}}
            />
          ) : (
            <Avatar.Icon
              size={80}
              icon="account"
              style={{backgroundColor: colors.surfaceHigh}}
              color={colors.primary}
            />
          )}
        </TouchableOpacity>
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
            HABIT DNA (90-DAY FOCUS DENSITY)
          </Text>
          <View style={{flexDirection: 'row', marginTop: SPACING.sm}}>
            <View style={{width: 20, justifyContent: 'space-between', paddingVertical: 4}}>
              {DAYS.map((d, i) => <Text key={i} style={{fontSize: 10, color: colors.onSurfaceVariant}}>{d}</Text>)}
            </View>
            <View style={{flex: 1}}>
              <View style={styles.heatmapGrid}>
                {heatmapAnims.map((anim, i) => {
                  const density = heatmapData[i] || 0;
                  const opacity = density === 0 ? 0.05 : 0.2 + (density * 0.15);
                  return (
                    <Animated.View
                      key={i}
                      style={[
                        styles.heatmapCell,
                        {
                          backgroundColor: colors.primary,
                          opacity: anim.interpolate({inputRange: [0, 1], outputRange: [0, opacity]}),
                          transform: [{scale: anim.interpolate({inputRange: [0, 1], outputRange: [0.4, 1]})}],
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 2}}>
                {HOURS.map((h, i) => <Text key={i} style={{fontSize: 10, color: colors.onSurfaceVariant}}>{h}</Text>)}
              </View>
            </View>
          </View>
          
          <View style={styles.insightsRow}>
            <Surface style={[styles.insightCard, {backgroundColor: colors.surfaceHigh}]} elevation={0}>
              <Text style={{fontSize: 9, color: colors.onSurfaceVariant}}>TOP CATEGORY</Text>
              <Text style={{fontSize: 14, color: colors.primary, fontWeight: 'bold'}}>Study</Text>
            </Surface>
            <Surface style={[styles.insightCard, {backgroundColor: colors.surfaceHigh}]} elevation={0}>
              <Text style={{fontSize: 9, color: colors.onSurfaceVariant}}>BEST DAY</Text>
              <Text style={{fontSize: 14, color: colors.primary, fontWeight: 'bold'}}>Tuesday</Text>
            </Surface>
            <Surface style={[styles.insightCard, {backgroundColor: colors.surfaceHigh}]} elevation={0}>
              <Text style={{fontSize: 9, color: colors.onSurfaceVariant}}>COMPLETION</Text>
              <Text style={{fontSize: 14, color: colors.primary, fontWeight: 'bold'}}>92%</Text>
            </Surface>
          </View>
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
  avatarPlaceholder: {width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center'},
  userName: {marginTop: SPACING.md, fontFamily: 'Manrope-Bold'},
  editButton: {borderRadius: ROUNDNESS.sm},
  content: {padding: SPACING.lg},
  heatmapGrid: {flexDirection: 'column', flexWrap: 'wrap', height: 7 * 14, alignContent: 'space-between'},
  heatmapCell: {width: 10, height: 10, borderRadius: 2, margin: 2},
  insightsRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md, gap: SPACING.sm},
  insightCard: {flex: 1, padding: SPACING.sm, borderRadius: ROUNDNESS.sm, alignItems: 'center'},
  settingsGroup: {padding: SPACING.sm, borderRadius: ROUNDNESS.lg, marginBottom: SPACING.lg},
  groupTitle: {paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, letterSpacing: 1.5, fontSize: 10},
  footer: {alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xxl},
});

export default ProfileScreen;
