// app/_layout.tsx

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Slot, Stack, useRouter, usePathname } from 'expo-router';
import { auth } from '../src/api/firebaseConfig'; // Kompat‐Auth

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Kuunnellaan auth‐tilaa
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Jos ollaan yhä alustamassa, pysäytetään spinner tämän jälkeen
      if (initializing) {
        setInitializing(false);
      }

      if (user) {
        // Jos käyttäjä on kirjautunut, EI näytetä login‐/register‐sivuja enää
        if (pathname === '/login' || pathname === '/register') {
          router.replace('/'); 
        }
      } else {
        // Jos käyttäjä ei ole kirjautunut, ohjataan aina loginiin (paitsi jos ollaan jo login tai register)
        if (pathname !== '/login' && pathname !== '/register') {
          router.replace('/login');
        }
      }
    });

    return unsubscribe;
  }, [initializing, pathname]);

  if (initializing) {
    // Näytetään lataussykli ensimmäisellä kerralla, kun auth‐tila määrittyy
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#f1c40f" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 
        Slot‐komponentti huolehtii siitä, että esim. /login, /register ja / (index.tsx)
        latautuvat oikein perustuen siihen, missä hakemistossa _layout on.
      */}
      <Slot />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
