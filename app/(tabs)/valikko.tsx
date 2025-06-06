// app/(tabs)/valikko.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/api/firebaseConfig';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

export default function ValikkoScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.log('Kirjaudu ulos epäonnistui:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Valikko‐välilehti (esim. profiili, asetukset)</Text>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Kirjaudu ulos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: Colors.moss,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
});
