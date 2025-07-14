import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import Colors from '../constants/Colors';

export default function HeaderBar() {
  const insets = useSafeAreaInsets();
  const [logoutPressed, setLogoutPressed] = useState(false);
  const [fontsLoaded] = useFonts({ Poppins_700Bold });

  if (!fontsLoaded) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.log('Ulos kirjautuminen epäonnistui:', err);
    }
  };

return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
     <View style={styles.titleContainer}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>BudjettiKoutsi</Text>
      </View>
      <TouchableOpacity
        onPress={handleLogout}
        onPressIn={() => setLogoutPressed(true)}
        onPressOut={() => setLogoutPressed(false)}
        style={[styles.logoutButton, logoutPressed && styles.logoutButtonPressed]}
        activeOpacity={0.8}
      >
         <Ionicons name="lock-closed-outline" size={24} color={Colors.evergreen} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
     alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
   marginRight: 8,
  },
  title: {
   fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: Colors.moss,
  },
  logoutButton: {
   padding: 6,
    borderRadius: 12,
  },
  logoutButtonPressed: {
    backgroundColor: '#FFEBD6',
  },
});
