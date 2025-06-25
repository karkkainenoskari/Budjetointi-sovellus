// app/valikko.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';

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
    <SafeAreaView style={styles.safeContainer}>
     <Text style={styles.title}>Valikko</Text>
      <View style={styles.menuContainer}>
        <TouchableOpacity
          onPress={() => router.push('/profiili')}
          style={styles.menuItem}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={Colors.evergreen}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>Profiili</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/asetukset')}
          style={styles.menuItem}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors.evergreen}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>Asetukset</Text>
            </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/budgetPeriod')}
          style={styles.menuItem}
        >
          <Ionicons
            name="calendar-outline"
            size={24}
            color={Colors.evergreen}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>Budjettijakso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color={Colors.evergreen}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>Kirjaudu ulos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
 title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: Colors.textPrimary,
  },
 menuContainer: {
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
});
