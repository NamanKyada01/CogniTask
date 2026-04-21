import React, {useState} from 'react';
import {View, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {Text, TextInput, Button} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import auth from '@react-native-firebase/auth';

const LoginScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="displayMedium" style={styles.title}>CogniTask</Text>
          <Text variant="bodyLarge" style={styles.tagline}>{t('tagline')}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="flat"
            textColor={COLORS.onSurface}
            style={styles.input}
            underlineColor={COLORS.outlineVariant}
            activeUnderlineColor={COLORS.primary}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="flat"
            textColor={COLORS.onSurface}
            style={styles.input}
            underlineColor={COLORS.outlineVariant}
            activeUnderlineColor={COLORS.primary}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}>
            Sign In
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Register')}>
                Sign Up
              </Text>
            </Text>
            <Text
              style={[styles.link, styles.forgotPassword]}
              onPress={() => console.log('Forgot Password')}>
              Forgot Password?
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xxl,
  },
  title: {
    color: COLORS.primary,
    fontFamily: 'Manrope-Bold',
    marginBottom: SPACING.xs,
  },
  tagline: {
    color: COLORS.onSurface,
    opacity: 0.7,
    fontFamily: 'Inter-Regular',
  },
  form: {
    gap: SPACING.md,
  },
  input: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  button: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: ROUNDNESS.md,
    shadowColor: COLORS.hyperBlue,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: COLORS.onPrimaryContainer,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  footerText: {
    color: COLORS.onSurface,
    opacity: 0.8,
  },
  link: {
    color: COLORS.primary,
    fontFamily: 'Inter-SemiBold',
  },
  forgotPassword: {
    marginTop: SPACING.sm,
    opacity: 0.6,
  },
});

export default LoginScreen;
