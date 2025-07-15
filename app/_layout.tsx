// app/_layout.tsx

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Alert } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { auth } from '../src/api/firebaseConfig';
import * as Notifications from 'expo-notifications';
import { firestore } from '../src/api/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { registerPaydayReminder } from '../src/services/notifications';
import HeaderBar from '../components/HeaderBar';
import Colors from '../constants/Colors';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [initializing, setInitializing] = useState(true);

  // ───────────────────────────────────────────────────────────────────────────────
  // Auth‐kuuntelija: ohjaa /login ja /register välillä sen mukaan, onko user sisään
  // ───────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (initializing) {
        setInitializing(false);
      }

      if (user) {
        // Jos kirjautunut, ohjataan pois login/register/forgot-password sivuilta
        if (
          pathname === '/login' ||
          pathname === '/register' ||
          pathname === '/forgot-password'
        ) {
          router.replace('/');
        }
      } else {
        // Jos ei kirjautunut, ohjataan aina login‐sivulle
       if (
          pathname !== '/login' &&
          pathname !== '/register' &&
          pathname !== '/forgot-password'
        ) {
          router.replace('/login');
        }
      }
    });
    return unsubscribe;
  }, [initializing, pathname]);

  // ───────────────────────────────────────────────────────────────────────────────
  // Ilmoitusoikeus + Expo Push Token + kuuntelija + kuukausimuistutus
  // ───────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1) Pyydetään permission ja haetaan Expo Push Token
    registerForPushNotificationsAsync()
      .then((expoPushToken) => {
        if (expoPushToken) {
          // Tallennetaan token Firestoreen kohtaan users/{userId}
          const userDocRef = doc(firestore, 'users', user.uid);
          setDoc(
            userDocRef,
            { expoPushToken: expoPushToken },
            { merge: true }
          ).catch((e) =>
            console.error('Tokenin tallennus Firestoreen epäonnistui:', e)
          );
        }
      })
      .catch((e) => console.error('registerForPushNotificationsAsync-virhe:', e));

    // 2) Kuunnellaan saapuvia ilmoituksia (sovellus auki)
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Ilmoitus vastaanotettu:', notification);
        // Tässä voit halutessasi käsitellä notification.request.content.data:tä
      }
    );

 // 3) Asetetaan käyttäjän palkkapäivämuistutus
    registerPaydayReminder(user.uid);

    return () => {
      subscription.remove();
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────────
  // registerForPushNotificationsAsync: pyytää lupaa ja hakee Expo Push Tokenin
  // ───────────────────────────────────────────────────────────────────────────────
  async function registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      // 1) Tarkistetaan nykyinen lupatila
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 2) Jos lupaa ei annettu, pyydetään uudelleen
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // 3) Jos lupa edelleen hylätty, ilmoita käyttäjälle ja palauta null
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Ilmoitusoikeus puuttuu',
          'Et antanut lupaa ilmoituksille. Monet muistutukset eivät toimi ilman lupaa.'
        );
        return null;
      }

      // 4) Haetaan Expo‐push‐token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      console.log('Expo Push Token:', token);
      return token;
    } catch (error) {
      console.error('registerForPushNotificationsAsync epäonnistui:', error);
      return null;
    }
  }


  // ───────────────────────────────────────────────────────────────────────────────
  // Kun auth‐tilaa odotetaan, näytetään loader
  // ───────────────────────────────────────────────────────────────────────────────
  if (initializing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#738A6E" />
      </View>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────────
  // Käyttäjä on autentikoitu, renderöidään sovelluksen sisältö (Slot)
  // ───────────────────────────────────────────────────────────────────────────────
  const hideHeaderRoutes = ['/login', '/register', '/forgot-password'];
  const showHeader = !hideHeaderRoutes.includes(pathname);

  return (
    <View style={styles.container}>
      {showHeader && <HeaderBar />}
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
