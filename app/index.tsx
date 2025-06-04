// app/index.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import { useRouter } from 'expo-router';

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
      <Text style={styles.heading}>Tervetuloa sovellukseen!</Text>
      {/* Lisää haluamiasi komponentteja / navigaatioita tälle näytölle */}

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
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
    padding: 16,
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
  },
  logoutButton: {
    marginTop: 10,
  },
  logoutText: {
    color: '#f00',
    textDecorationLine: 'underline',
  },
});
