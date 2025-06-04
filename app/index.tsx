// app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../src/api/firebaseConfig';
import { signOut } from 'firebase/auth';
import { useRouter, Stack } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Kun signOut onnistuu, onAuthStateChanged (RootLayout) ohjaa takaisin /login
    } catch (error) {
      console.log('Kirjaudu ulos -virhe:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Koti' }} />

      <Text style={styles.title}>Olet kirjautunut sisään!</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/explore')}
      >
        <Text style={styles.buttonText}>Siirry Explore-näkymään</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Kirjaudu ulos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#f1c40f',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 10,
  },
  logoutText: {
    color: '#f00',
    textDecorationLine: 'underline',
  },
});
