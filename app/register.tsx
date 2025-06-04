// app/register.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { auth } from '../src/api/firebaseConfig'; // COMPAT-Auth
import type firebase from 'firebase/compat/app';

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Jos käyttäjä on jo kirjautunut (esim. takaisin puskiessa), ohjataan "/"
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((usr: firebase.User | null) => {
      if (usr) {
        router.replace('/');
      }
    });
    return unsubscribe;
  }, []);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Virhe', 'Täytä kaikki kentät');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Virhe', 'Salasanat eivät täsmää');
      return;
    }

    setLoading(true);
    try {
      await auth.createUserWithEmailAndPassword(email.trim(), password);
      // Käyttäjä ohjataan "/" onAuthStateChangedin kautta
    } catch (err: any) {
      console.error('Rekisteröintivirhe:', err);
      Alert.alert('Rekisteröinti-virhe', err.message || 'Jokin meni pieleen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Expo Router asettaa header-otsikon */}
      <Stack.Screen options={{ title: 'Rekisteröidy' }} />

      <Text style={styles.title}>Luo uusi käyttäjätili</Text>

      <TextInput
        style={styles.input}
        placeholder="Sähköpostiosoite"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Salasana"
        secureTextEntry
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Toista salasana"
        secureTextEntry
        textContentType="newPassword"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#f1c40f" style={{ marginVertical: 20 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Rekisteröidy</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.footerText}>
          Onko sinulla jo tili? <Text style={styles.linkText}>Kirjaudu sisään</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 32, textAlign: 'center' },
  input: {
    height: 52,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    height: 52,
    backgroundColor: '#f1c40f',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  buttonText: { color: '#000', fontSize: 18, fontWeight: '600' },
  footerText: { textAlign: 'center', color: '#666', fontSize: 14 },
  linkText: { color: '#f1c40f', fontWeight: 'bold' },
});
