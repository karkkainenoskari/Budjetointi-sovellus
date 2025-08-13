import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../src/api/firebaseConfig';
import { updateIncome } from '../src/services/incomes';
import Colors from '../constants/Colors';

export default function EditIncomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; title?: string; amount?: string }>();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [title, setTitle] = useState(params.title || '');
  const [amount, setAmount] = useState(params.amount ? String(params.amount) : '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userId || !params.id) return;
    const amt = parseFloat(String(amount).replace(',', '.'));
    setSaving(true);
    try {
      await updateIncome(userId, params.id as string, { title, amount: amt });
      router.back();
    } catch (e) {
      console.error('updateIncome error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Muokkaa tuloa</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.label}>Nimi</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Tulo"
        placeholderTextColor="#888"
      />
      <Text style={styles.label}>Summa</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0"
        keyboardType="numeric"
        placeholderTextColor="#888"
      />
      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>Tallenna</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBackground,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: Colors.moss,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});