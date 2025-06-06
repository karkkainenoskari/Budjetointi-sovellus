// app/(tabs)/tavoitteet.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

export default function TavoitteetScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Tavoitteet‐välilehti (tässä voisi olla graafit ja lomakkeet tavoitteille)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
});
