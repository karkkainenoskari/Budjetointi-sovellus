import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth } from '../src/api/firebaseConfig';
import { getCategories, Category } from '../src/services/categories';
import { updateExpense } from '../src/services/expenses';
import Colors from '../constants/Colors';

export default function EditExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; categoryId?: string }>();
  const expenseId = params.id as string | undefined;
  const currentCategory = params.categoryId as string | undefined;

  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getCategories(userId)
      .then((cats) => {
        setCategories(cats);
        if (currentCategory) {
          setSelectedCategory(currentCategory);
        } else if (cats.length > 0) {
          setSelectedCategory(cats[0].id);
        }
      })
      .catch((e) => console.error('getCategories error:', e))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    if (!userId || !expenseId) return;
    setSaving(true);
    try {
      await updateExpense(userId, expenseId, { categoryId: selectedCategory });
      router.back();
    } catch (e) {
      console.error('updateExpense error:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaihda kategoria</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.label}>Kategoria</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(val) => setSelectedCategory(val)}
          style={styles.picker}
          mode="dropdown"
        >
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.title} value={cat.id} />
          ))}
        </Picker>
      </View>
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: Colors.cardBackground,
  },
  picker: {
    height: 50,
    width: '100%',
    color: Colors.textPrimary,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});