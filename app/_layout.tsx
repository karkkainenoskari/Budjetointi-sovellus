// app/_layout.tsx

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { auth } from '../src/api/firebaseConfig';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (initializing) {
        setInitializing(false);
      }

      if (user) {
        // Jos on kirjautunut sisään, 
        // estetään pääsy login-/register-reiteille:
        if (pathname === '/login' || pathname === '/register') {
          router.replace('/'); // Ohjaa suoraan budjetti‐välilehdelle
        }
      } else {
        // Jos ei ole kirjautunut, ohjataan aina /login
        if (pathname !== '/login' && pathname !== '/register') {
          router.replace('/login');
        }
      }
    });
    return unsubscribe;
  }, [initializing, pathname]);

  if (initializing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#f1c40f" />
      </View>
    );
  }

  // Slot() renderöi joko login/register-sivun (jos käyttäjä ei ole kirjautunut)
  // tai (tabs)-hakemiston sisällä olevat sivut (jos on kirjautunut).
  return <Slot />;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
