import React, { useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { auth } from '../src/api/firebaseConfig';

export default function ProfiiliScreen() {
  const router = useRouter();
  const user = auth.currentUser;

   useEffect(() => {
    const handleBack = () => {
      router.replace('/(tabs)/valikko');
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [router]);
  return (
     <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/valikko')}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.evergreen} />
          </TouchableOpacity>
          <Text style={styles.title}>Profiili</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Käyttäjätiedot</Text>
          <View style={styles.row}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={Colors.evergreen}
              style={styles.icon}
            />
            <Text style={styles.rowLabel}>Sähköposti</Text>
            <Text style={styles.rowValue}>{user?.email ?? '-'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 12 },
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
     color: Colors.textSecondary,
    marginBottom: 12,
  },
row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  rowValue: { fontSize: 16, color: Colors.textSecondary },
});