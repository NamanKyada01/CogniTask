import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet, KeyboardAvoidingView, Platform, Animated, Alert} from 'react-native';
import {Text, TextInput, Button, Snackbar} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {DARK_COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import auth from '@react-native-firebase/auth';

const C = DARK_COLORS; // auth screens always dark

const LoginScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {toValue: 1, duration: 600, useNativeDriver: true}),
      Animated.parallel([
        Animated.timing(formAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
        Animated.timing(slideAnim, {toValue: 0, duration: 500, useNativeDriver: true}),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e: any) {
      const msg =
        e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : e.code === 'auth/invalid-email'
          ? 'Please enter a valid email.'
          : 'Sign in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above, then tap Forgot Password.');
      return;
    }
    setResetLoading(true);
    try {
      await auth().sendPasswordResetEmail(email);
      setSnackVisible(true);
      setError('');
    } catch (e: any) {
      setError('Could not send reset email. Check the address and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.header, {opacity: headerAnim}]}>
          <Text variant="displayMedium" style={styles.title}>CogniTask</Text>
          <Text variant="bodyLarge" style={styles.tagline}>{t('tagline')}</Text>
        </Animated.View>

        <Animated.View style={[styles.form, {opacity: formAnim, transform: [{translateY: slideAnim}]}]}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={v => {setEmail(v); setError('');}}
            mode="flat"
            textColor={C.onSurface}
            style={styles.input}
            underlineColor={C.outlineVariant}
            activeUnderlineColor={C.primary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={v => {setPassword(v); setError('');}}
            secureTextEntry
            mode="flat"
            textColor={C.onSurface}
            style={styles.input}
            underlineColor={C.outlineVariant}
            activeUnderlineColor={C.primary}
          />

          {error ? (
            <Text variant="labelMedium" style={styles.errorText}>{error}</Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}>
            Sign In
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
                Sign Up
              </Text>
            </Text>
            <Button
              mode="text"
              onPress={handleForgotPassword}
              loading={resetLoading}
              textColor={C.primary}
              compact
              style={{opacity: 0.7}}>
              Forgot Password?
            </Button>
          </View>
        </Animated.View>
      </View>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={4000}
        style={{backgroundColor: C.surfaceHigh}}>
        <Text style={{color: C.onSurface}}>Password reset email sent! Check your inbox.</Text>
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.background},
  content: {flex: 1, padding: SPACING.lg, justifyContent: 'center'},
  header: {marginBottom: SPACING.xxl},
  title: {color: C.primary, fontFamily: 'Manrope-Bold', marginBottom: SPACING.xs},
  tagline: {color: C.onSurface, opacity: 0.7, fontFamily: 'Inter-Regular'},
  form: {gap: SPACING.md},
  input: {backgroundColor: 'transparent', paddingHorizontal: 0},
  errorText: {color: C.error},
  button: {
    marginTop: SPACING.lg,
    backgroundColor: C.primaryContainer,
    borderRadius: ROUNDNESS.md,
    shadowColor: C.hyperBlue,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonContent: {height: 56},
  buttonLabel: {fontFamily: 'Inter-SemiBold', fontSize: 16, color: C.onPrimaryContainer},
  footer: {marginTop: SPACING.xl, alignItems: 'center', gap: SPACING.xs},
  footerText: {color: C.onSurface, opacity: 0.8},
  link: {color: C.primary, fontFamily: 'Inter-SemiBold'},
});

export default LoginScreen;
