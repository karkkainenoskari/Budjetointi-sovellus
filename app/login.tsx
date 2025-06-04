// app/login.tsx

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

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Jos käyttäjä on jo kirjautunut, ohjataan kotisivulle
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((usr: firebase.User | null) => {
      if (usr) {
        router.replace('/'); // Vaihda haluamaksesi kotireitiksi
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Virhe', 'Täytä sähköpostiosoite ja salasana');
      return;
    }

    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email.trim(), password);
      // Käyttäjä ohjataan "/" onAuthStateChangedin kautta
    } catch (err: any) {
      console.error('Kirjautumisvirhe:', err);
      Alert.alert('Kirjautumisvirhe', err.message || 'Tarkista tunnukset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Expo Router asettaa header-otsikon */}
      <Stack.Screen options={{ title: 'Kirjaudu sisään' }} />

      <Text style={styles.title}>Tervetuloa takaisin</Text>

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
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#f1c40f" style={{ marginVertical: 20 }} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Kirjaudu sisään</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.footerText}>
          Ei vielä tiliä? <Text style={styles.linkText}>Rekisteröidy</Text>
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
