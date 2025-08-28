import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Alert } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (initializing) {
        setInitializing(false);
      }

      if (user) {
  
        if (
          pathname === '/login' ||
          pathname === '/register' ||
          pathname === '/forgot-password'
        ) {
          router.replace('/');
        }
      } else {
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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    registerForPushNotificationsAsync()
      .then((expoPushToken) => {
        if (expoPushToken) {

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

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Ilmoitus vastaanotettu:', notification);
      }
    );

    registerPaydayReminder(user.uid);

    return () => {
      subscription.remove();
    };
  }, []);

  async function registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Ilmoitusoikeus puuttuu',
          'Et antanut lupaa ilmoituksille. Monet muistutukset eivät toimi ilman lupaa.'
        );
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      console.log('Expo Push Token:', token);
      return token;
    } catch (error) {
      console.error('registerForPushNotificationsAsync epäonnistui:', error);
      return null;
    }
  }

  if (initializing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#738A6E" />
      </View>
    );
  }
  const hideHeaderRoutes = ['/login', '/register', '/forgot-password'];
  const showHeader = !hideHeaderRoutes.includes(pathname);

  return (
    <View style={styles.container}>
      {showHeader && <HeaderBar />}
     <Animated.View
        key={pathname}
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(250)}
        style={styles.animatedContainer}
      >
        <Slot />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  animatedContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
