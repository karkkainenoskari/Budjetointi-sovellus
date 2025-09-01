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
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import { seedDefaultCategories } from '../src/services/categories';
import Colors from '../constants/Colors';

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const isPasswordValid = (pwd: string): boolean => {

    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return regex.test(pwd);
  };

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Virhe', 'Täytä kaikki kentät.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Virhe', 'Salasanat eivät täsmää.');
      return;
    }
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

    setLoading(true);
    try {
       const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      if (cred.user) {
        await seedDefaultCategories(cred.user.uid);
      }
      Alert.alert('Rekisteröityminen onnistui', 'Tervetuloa käyttämään sovellusta!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/login');
          },
        },
      ]);
    } catch (error: any) {
      console.error('createUserWithEmailAndPassword-virhe:', error);
      let message = 'Rekisteröityminen epäonnistui. Yritä uudelleen.';

      if (error.code === 'auth/email-already-in-use') {
        message = 'Tämä sähköpostiosoite on jo käytössä.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Sähköpostiosoite on virheellinen.';
      } else if (error.code === 'auth/weak-password') {
        message =
          'Antamasi salasana on liian heikko. Vähintään 8 merkkiä, iso kirjaim…';
      }

      Alert.alert('Rekisteröitymisvirhe', message);
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
         source={require('@/assets/images/budjetti_logo.png')}
          style={styles.logo}
        />
        <Text style={styles.welcome}></Text>
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
