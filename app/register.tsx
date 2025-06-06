// app/register.tsx

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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import Colors from '../constants/Colors';

export default function RegisterScreen() {
  const router = useRouter();

  // --- State-muuttujat lomakkeelle ---
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * validatePassword tarkistaa, että salasana:
   *  - on vähintään 8 merkkiä pitkä
   *  - sisältää vähintään yhden ison kirjaimen (A–Z)
   *  - sisältää vähintään yhden numeron (0–9)
   *  - sisältää vähintään yhden erikoismerkin (esim. !@#\$%^&*)
   */
  const validatePassword = (pwd: string) => {
    const regex =
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])[A-Za-z0-9!@#\$%\^&\*]{8,}$/;
    return regex.test(pwd);
  };

  const handleRegister = async () => {
    // 1) Tarkista, että kaikki kentät on täytetty
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Virhe', 'Täytä kaikki kentät.');
      return;
    }

    // 2) Tarkista, että salasana täyttää vähimmäisvaatimukset
    if (!validatePassword(password)) {
      Alert.alert(
        'Salasana ei kelpaa',
        'Salasanan tulee olla vähintään 8 merkkiä pitkä,\n'
          + 'sisältää vähintään yhden ison kirjaimen, numeron ja erikoismerkin.'
      );
      return;
    }

    // 3) Tarkista, että salasana ja vahvistus vastaavat toisiaan
    if (password !== confirmPassword) {
      Alert.alert(
        'Salasanat eivät täsmää',
        'Syöttämäsi salasanat eivät ole samat. Tarkista ja yritä uudelleen.'
      );
      return;
    }

    // 4) Mikäli yllä olevat tarkistukset ok, yritetään rekisteröidä Firebaseen
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);

      // Ilmoita onnistuneesta rekisteröitymisestä ja ohjaa login-sivulle
      Alert.alert(
        'Rekisteröityminen onnistui',
        'Tili luotu onnistuneesti! Nyt voit kirjautua.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/login');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      // Käsittele yleisimmät Firebase-virheet
      let message = 'Tuntematon virhe. Yritä uudelleen myöhemmin.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Tällä sähköpostilla on jo olemassa tili.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Sähköpostiosoite ei ole kelvollinen.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Salasana on liian heikko.';
      }
      Alert.alert('Rekisteröitymisvirhe', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Rekisteröidy</Text>

        {/* Sähköpostikenttä */}
        <TextInput
          placeholder="Sähköposti"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor={Colors.textSecondary}
        />

        {/* Salasanakenttä */}
        <TextInput
          placeholder="Salasana"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor={Colors.textSecondary}
        />

        {/* Vahvistuskenttä */}
        <TextInput
          placeholder="Syötä salasana uudelleen"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor={Colors.textSecondary}
        />

        {/* Luo tili -painike */}
        <TouchableOpacity
          onPress={handleRegister}
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Rekisteröidään…' : 'Luo tili'}
          </Text>
        </TouchableOpacity>

        {/* Linkki Kirjaudu-sivulle */}
        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={styles.linkText}>Onko sinulla jo tili? Kirjaudu</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Tyylit
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
