import React, {useRef, useState} from 'react';
import {View, StyleSheet, Modal, Animated, Alert, Share} from 'react-native';
import {Text, Button, IconButton, Surface} from 'react-native-paper';
import {useThemeColors} from '../theme/ThemeContext';
import {SPACING, ROUNDNESS} from '../theme/tokens';
import ViewShot from 'react-native-view-shot';

interface SmartRecapModalProps {
  visible: boolean;
  onDismiss: () => void;
  recapData: {
    summary: string;
    strengths: string;
    goal: string;
  } | null;
  userName: string;
}

export const SmartRecapModal: React.FC<SmartRecapModalProps> = ({visible, onDismiss, recapData, userName}) => {
  const colors = useThemeColors();
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;
    setSharing(true);
    try {
      const uri = await viewShotRef.current.capture();
      await Share.share({
        url: uri, // works mostly on iOS, for Android we usually need react-native-share, but we'll stick to built-in Share
        message: 'My Weekly CogniTask Recap!',
      });
    } catch (e) {
      // User cancelled or error
    } finally {
      setSharing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onDismiss}>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={onDismiss} iconColor={colors.onSurface} />
        </View>
        <ViewShot ref={viewShotRef} options={{format: 'jpg', quality: 0.9}} style={styles.viewShot}>
          <Surface style={[styles.card, {backgroundColor: colors.surfaceHigh}]} elevation={2}>
            <Text variant="headlineMedium" style={[styles.title, {color: colors.primary}]}>Weekly Recap</Text>
            <Text variant="titleMedium" style={[styles.subtitle, {color: colors.onSurfaceVariant}]}>{userName}</Text>
            
            <View style={styles.section}>
              <Text variant="labelLarge" style={{color: colors.primary, marginBottom: 4}}>SUMMARY</Text>
              <Text variant="bodyLarge" style={{color: colors.onSurface}}>{recapData?.summary || 'Loading...'}</Text>
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={{color: colors.primary, marginBottom: 4}}>TOP STRENGTH</Text>
              <Text variant="bodyLarge" style={{color: colors.onSurface}}>{recapData?.strengths || '...'}</Text>
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={{color: colors.primary, marginBottom: 4}}>NEXT WEEK'S GOAL</Text>
              <Text variant="bodyLarge" style={{color: colors.onSurface}}>{recapData?.goal || '...'}</Text>
            </View>
          </Surface>
        </ViewShot>

        <View style={styles.footer}>
          <Button mode="contained" onPress={handleShare} loading={sharing} disabled={!recapData} style={{borderRadius: 24}}>
            Share Recap
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: SPACING.md},
  header: {alignItems: 'flex-end'},
  viewShot: {flex: 1, justifyContent: 'center', padding: SPACING.md, backgroundColor: 'transparent'},
  card: {padding: SPACING.xl, borderRadius: ROUNDNESS.lg},
  title: {fontFamily: 'Manrope-Bold', textAlign: 'center'},
  subtitle: {textAlign: 'center', marginBottom: SPACING.xl},
  section: {marginBottom: SPACING.lg},
  footer: {padding: SPACING.xl, paddingBottom: SPACING.xxl},
});
