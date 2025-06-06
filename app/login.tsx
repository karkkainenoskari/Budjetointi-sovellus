// app/login.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import Colors from '../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Virhe', 'Täytä sähköposti ja salasana');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/'); // ohjaa juureen (=> TabsLayout)
    } catch (error: any) {
      Alert.alert('Kirjautumisvirhe', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Kirjaudu sisään</Text>
      <TextInput
        placeholder="Sähköposti"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        placeholderTextColor={Colors.textSecondary}
      />
      <TextInput
        placeholder="Salasana"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor={Colors.textSecondary}
      />
      <TouchableOpacity
        onPress={handleLogin}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Kirjaudutaan…' : 'Kirjaudu sisään'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.linkText}>Eikö ole tiliä? Rekisteröidy</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBackground,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.moss,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: Colors.sageHint,
  },
  buttonText: {
    color: Colors.buttonPrimaryText,
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    marginTop: 12,
    color: Colors.moss,
    fontSize: 16,
  },
});
