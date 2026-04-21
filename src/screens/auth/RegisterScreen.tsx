import React, {useState} from 'react';
import {View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {Text, TextInput, Button} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {COLORS, SPACING, ROUNDNESS} from '../../theme/tokens';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const RegisterScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !firstName) return;
    setLoading(true);
    try {
      const {user} = await auth().createUserWithEmailAndPassword(email, password);
      
      // Save extra user info to Firestore
      await firestore().collection('users').doc(user.uid).set({
        firstName,
        lastName,
        email,
        level: 1,
        xp: 0,
        streak: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.title}>Join CogniTask</Text>
          <Text variant="bodyMedium" style={styles.tagline}>Create your premium productivity engine.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            mode="flat"
            textColor={COLORS.onSurface}
            style={styles.input}
            underlineColor={COLORS.outlineVariant}
            activeUnderlineColor={COLORS.primary}
          />
          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            mode="flat"
            textColor={COLORS.onSurface}
            style={styles.input}
            underlineColor={COLORS.outlineVariant}
            activeUnderlineColor={COLORS.primary}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
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
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}>
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Login')}>
                Sign In
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
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
  },
  footerText: {
    color: COLORS.onSurface,
    opacity: 0.8,
  },
  link: {
    color: COLORS.primary,
    fontFamily: 'Inter-SemiBold',
  },
});

export default RegisterScreen;
