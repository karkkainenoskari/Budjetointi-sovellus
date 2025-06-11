// app/login.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import Colors from '../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();

  // ─── State‐muuttujat ─────────────────────────────────────────────────────────────
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // ─── Handler: Kirjaudu sisään ‒painike ───────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Virhe', 'Täytä sähköpostiosoite ja salasana.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Onnistunut kirjautuminen ohjaa sovelluksen pääsivulle (esim. "/")
      router.replace('/');
    } catch (error: any) {
      console.error('signInWithEmailAndPassword-virhe:', error);
      // Tarkistetaan virhekoodi ja näytetään käyttäjälle sopiva ilmoitus
      let message = 'Väärä salasana, yritä uudelleen.';

      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Sähköpostiosoite on virheellinen.';
          break;
        case 'auth/user-disabled':
          message = 'Tämä käyttäjä on estetty.';
          break;
        case 'auth/user-not-found':
          message = 'Tiliä ei löydy. Tarkista sähköpostiosoite.';
          break;
        case 'auth/wrong-password':
          message = 'Väärä salasana, yritä uudelleen.';
          break;
        default:
          // Jos haluat, voit näyttää suoraan Firebase‐virheilmoituksen:
          // message = error.message;
          break;
      }

      Alert.alert('Kirjautuminen epäonnistui', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.innerContainer}>
        <Image
          source={require('@/assets/images/budjettikoutsi_logo.png')}
          style={styles.logo}
        />
        <Text style={styles.welcome}>Tervetuloa!</Text>
        <Text style={styles.title}>Kirjaudu sisään</Text>

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

         {/* Unohtuiko salasana -linkki */}
        <TouchableOpacity
          onPress={() => router.replace('/forgot-password')}
          style={styles.forgotLink}
        >
          <Text style={styles.forgotText}>Unohtuiko salasana?</Text>
        </TouchableOpacity>

        {/* Kirjaudu‐painike */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kirjaudu</Text>
          )}
        </TouchableOpacity>

        {/* Linkki rekisteröitymiseen */}
        <TouchableOpacity
          onPress={() => {
            router.replace('/register');
          }}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>
            Ei vielä tiliä? <Text style={styles.registerLinkText}>Rekisteröidy</Text>
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
  logo: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  welcome: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
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
  registerLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  forgotLink: {
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: Colors.moss,
    fontSize: 14,
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  registerLinkText: {
    color: Colors.moss,
    fontWeight: '500',
  },
});
