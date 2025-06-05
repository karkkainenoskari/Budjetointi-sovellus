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
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Pienet kenttätarkistukset
    if (!email || !password || !confirmPassword) {
      Alert.alert('Virhe', 'Täytä kaikki kentät');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Virhe', 'Salasanat eivät täsmää');
      return;
    }

    setLoading(true);
    try {
      // Kutsutaan Firebase Auth‐APIa
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert('Onnistui', 'Rekisteröinti onnistui! Kirjaudu sisään.');
      router.replace('/login');
    } catch (err: any) {
      console.log('Rekisteröintivirhe:', err);
      // Voit halutessasi tulkita err.code -> näyttämään käyttäjälle selkeämmän virheilmoituksen
      const message = err.message || 'Tuntematon virhe';
      Alert.alert('Virhe', message);
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
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
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
        placeholder="Toista salasana uudelleen"
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
          <Text 
            style={styles.linkText} 
            onPress={() => router.push('/login')}
          >
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
