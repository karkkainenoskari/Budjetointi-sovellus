// app/_layout.tsx

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Slot, Stack, useRouter, usePathname } from 'expo-router';
import { auth } from '../src/api/firebaseConfig'; // COMPAT-Auth

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (initializing) {
        setInitializing(false);
      }
      if (!user) {
        // Kirjautumaton; ohjataan `/login` (jos ei olla jo siellä)
        if (pathname !== '/login') {
          router.replace('/login');
        }
      } else {
        // Kirjautunut; jos yritetään `/login` tai `/register`, siirrytään `/`
        if (pathname === '/login' || pathname === '/register') {
          router.replace('/');
        }
      }
    });
    return unsubscribe;
  }, [pathname]);

  if (initializing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#f1c40f" />
      </View>
    );
  }

  return (
    <Stack>
      <Slot />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
