import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../src/api/firebaseConfig';
import Colors from '../constants/Colors';
import { useRouter } from 'expo-router';

export default function HeaderBar() {
  const insets = useSafeAreaInsets();
   const router = useRouter();
  const [logoutPressed, setLogoutPressed] = useState(false);
 

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.log('Ulos kirjautuminen epäonnistui:', err);
    }
  };

return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
     
      <TouchableOpacity
         onPress={() => router.push('/profiili')}
        style={styles.avatarButton}
      >
         <Ionicons name="person-circle" size={32} color={Colors.evergreen} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Image
          source={require('../assets/images/budjetti_logo.png')}
          style={styles.logo}
        />
      </View>
      <View style={styles.rightButtons}>
        <TouchableOpacity
          onPress={handleLogout}
          onPressIn={() => setLogoutPressed(true)}
          onPressOut={() => setLogoutPressed(false)}
          style={[styles.iconButton, logoutPressed && styles.logoutButtonPressed]}
          activeOpacity={0.8}
        >
          <Ionicons name="lock-closed-outline" size={24} color={Colors.evergreen} />
        </TouchableOpacity>
      </View>
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
     overflow: 'visible',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 68,
    height: 68,
    resizeMode: 'contain',
     position: 'absolute',  
      top: -38,  
       alignSelf: 'center',
    transform: [{ scale: 1.5 }],
     left: 112,
  },
   avatarButton: {
    padding: 6,
    borderRadius: 20,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    borderRadius: 12,
     marginLeft: 8,
  },
  logoutButtonPressed: {
    backgroundColor: '#FFEBD6',
  },
});
