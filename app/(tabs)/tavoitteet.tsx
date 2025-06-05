// app/(tabs)/tavoitteet.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TavoitteetScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tavoitteet‐välilehti (tähän tulee graafit, lomakkeet yms.)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
