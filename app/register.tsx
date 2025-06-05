// app/register.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    // 1) Varmistetaan, että kentät eivät ole tyhjiä
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Virhe', 'Täytä kaikki kentät');
      return;
    }

    // 2) Tarkistetaan, että salasanat täsmäävät keskenään
    if (password !== confirmPassword) {
      Alert.alert('Virhe', 'Salasanat eivät täsmää');
      return;
    }

    // 3) Kootaan lista puuttuvista salasanaehdoista:
    const requirements: string[] = [];

    // 3.1) Pituus: vähintään 8 merkkiä
    if (password.length < 8) {
      requirements.push('vähintään 8 merkkiä pitkä');
    }

    // 3.2) Iso kirjain (A–Z, myös ÅÄÖ)
    if (!/[A-ZÅÄÖ]/.test(password)) {
      requirements.push('vähintään yksi iso kirjain (A–Z)');
    }

    // 3.3) Numero (0–9)
    if (!/\d/.test(password)) {
      requirements.push('vähintään yksi numero (0–9)');
    }

    // 3.4) Erikoismerkki (esim. !@#$%^&*()_+-=[]{};\'":,./<>?)
    if (!/[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      requirements.push('vähintään yksi erikoismerkki (esim. !@#$%^&*)');
    }

    // 4) Jos jokin ehto ei täyty, näytetään yksityiskohtainen viesti
    if (requirements.length > 0) {
      const msg = `Salasanan täytyy sisältää:\n• ${requirements.join('\n• ')}`;
      Alert.alert('Salasana ei kelpaa', msg);
      return;
    }

    setLoading(true);
    try {
      // 5) Luodaan uusi käyttäjä Firebaseen
      await createUserWithEmailAndPassword(auth, email.trim(), password);

      // 6) Kirjaudutaan heti ulos, jotta käyttäjä ei jää automaattisesti sisään
      await signOut(auth);

      // 7) Näytetään Alert, ja vasta kun käyttäjä painaa OK, siirrytään /login
      Alert.alert(
        'Onnistui',
        'Rekisteröinti onnistui! Nyt voit kirjautua sisään.',
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
    } catch (err: any) {
      console.log('Rekisteröintivirhe:', err);

      let message = 'Tuntematon virhe';
      if (err.code === 'auth/invalid-email') {
        message = 'Sähköpostiosoite ei ole muodoltaan oikea.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Tällä sähköpostiosoitteella on jo tili.';
      } else if (err.code === 'auth/weak-password') {
        // Firebase voi tästä huolimatta palauttaa weak-password, jos alle 6 merkkiä
        message = 'Salasanan täytyy olla vähintään 6 merkkiä pitkä.';
      } else {
        message = err.message || message;
      }

      Alert.alert('Rekisteröintivirhe', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.heading}>Rekisteröidy</Text>

      <TextInput
        style={styles.input}
        placeholder="Sähköpostiosoite"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Salasana"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Vahvista salasana"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        onPress={handleRegister}
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Luodaan tili...' : 'Luo tili'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          Onko sinulla jo tili?{' '}
          <Text style={styles.linkText} onPress={() => router.push('/login')}>
            Kirjaudu
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#f1c40f',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  buttonDisabled: {
    backgroundColor: '#ddd',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  footerContainer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#f1c40f',
    fontWeight: 'bold',
  },
});
