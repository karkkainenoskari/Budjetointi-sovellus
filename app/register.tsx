// app/register.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import { seedDefaultCategories } from '../src/services/categories';
import Colors from '../constants/Colors';

export default function RegisterScreen() {
  const router = useRouter();

  // ─── State‐muuttujat ────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // ─── Salasanan validointifunktio ────────────────────────────────────────────────────
  // Vähintään 8 merkkiä, vähintään yksi iso kirjain, yksi numero ja yksi erikoismerkki
  const isPasswordValid = (pwd: string): boolean => {
    // Regex: 
    // ^                    # alusta
    // (?=.*[A-Z])          # ainakin yksi iso kirjain
    // (?=.*\d)             # ainakin yksi numero
    // (?=.*[^A-Za-z0-9])   # ainakin yksi erikoismerkki
    // .{8,}                # vähintään 8 merkkiä
    // $                    # loppuun
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return regex.test(pwd);
  };

  // ─── Handler: rekisteröidy–painike ────────────────────────────────────────────────
  const handleRegister = async () => {
    // 1) Tarkistetaan, että kentät eivät ole tyhjiä
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Virhe', 'Täytä kaikki kentät.');
      return;
    }

    // 2) Tarkista, että salasana ja toista salasana täsmäävät
    if (password !== confirmPassword) {
      Alert.alert('Virhe', 'Salasanat eivät täsmää.');
      return;
    }

    // 3) Tarkista, että salasana täyttää kriteerit
    if (!isPasswordValid(password)) {
      Alert.alert(
        'Salasana ei kelpaa',
        'Salasanassa täytyy olla vähintään 8 merkkiä,\n' +
          'vähintään yksi iso kirjain (A–Z),\n' +
          'vähintään yksi numero (0–9)\n' +
          'ja vähintään yksi erikoismerkki (esim. !@#$%^&*).'
      );
      return;
    }

    // 4) Jos validointi onnistui, luodaan käyttäjä Firebaseen
    setLoading(true);
    try {
       const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      // Lisää oletuskategoriat uudelle käyttäjälle
      if (cred.user) {
        await seedDefaultCategories(cred.user.uid);
      }
      // Rekisteröityminen onnistui: ilmoita ja ohjaa back login‐sivulle
      Alert.alert('Onnistui', 'Rekisteröityminen onnistui! Voit nyt kirjautua.', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/login');
          },
        },
      ]);
    } catch (error: any) {
      // 5) Käsitellään mahdolliset Firebase‐virheet
      console.error('createUserWithEmailAndPassword-virhe:', error);
      let message = 'Rekisteröityminen epäonnistui. Yritä uudelleen.';

      // Esimerkkejä virhekoodeista:
      if (error.code === 'auth/email-already-in-use') {
        message = 'Tämä sähköpostiosoite on jo käytössä.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Sähköpostiosoite on virheellinen.';
      } else if (error.code === 'auth/weak-password') {
        // Tämä virhe harvoin tulee, koska teemme oman validoinnin, mutta varotoimenpide:
        message =
          'Antamasi salasana on liian heikko. Vähintään 8 merkkiä, iso kirjaim…';
      }

      Alert.alert('Rekisteröitymisvirhe', message);
    } finally {
      setLoading(false);
    }
  };

  // ─── UI ────────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Rekisteröidy</Text>

        {/* Sähköposti‐kenttä */}
        <TextInput
          style={styles.input}
          placeholder="Sähköpostiosoite"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />

        {/* Salasana‐kenttä */}
        <TextInput
          style={styles.input}
          placeholder="Salasana"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Toista salasana ‐kenttä */}
        <TextInput
          style={styles.input}
          placeholder="Syötä salasana uudelleen"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Rekisteröidy‐painike */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Odotetaan...' : 'Luo tili'}
          </Text>
        </TouchableOpacity>

        {/* Linkki: jo on tili? Kirjaudu sisään */}
        <TouchableOpacity
          onPress={() => {
            router.replace('/login');
          }}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Onko sinulla jo tili? <Text style={styles.loginLinkText}>Kirjaudu</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 32,
    alignSelf: 'center',
  },
  input: {
    height: 48,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBackground,
  },
  button: {
    height: 48,
    backgroundColor: Colors.moss,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLinkText: {
    color: Colors.moss,
    fontWeight: '500',
  },
});
