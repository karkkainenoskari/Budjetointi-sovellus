import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import Colors from '../constants/Colors';

export default function HeaderBar() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.log('Kirjaudu ulos epäonnistui:', err);
    }
  };
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/budjettikoutsi_logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Budjetti Koutsi</Text>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={22} color={Colors.moss} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    position: 'absolute',
    left: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.moss,
  },
  logoutButton: {
    position: 'absolute',
    right: 16,
  },
});