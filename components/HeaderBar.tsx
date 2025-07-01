import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import Colors from '../constants/Colors';

export default function HeaderBar() {
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.log('Kirjaudu ulos epäonnistui:', err);
    }
  };

return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Image
        source={require('../assets/images/budjettikoutsi_logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>BUDJETTIKOUTSI</Text>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="lock-closed-outline" size={24} color="#F7931E" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end', // siirtää sisältöä alemmas yläpalkissa
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    paddingBottom: 8, // lisää väliä alas
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    position: 'absolute',
    left: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.moss,
    marginBottom: 4,
  },
  logoutButton: {
    position: 'absolute',
    right: 16,
    bottom: 8,
  },
});
