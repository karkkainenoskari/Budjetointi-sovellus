// app/(tabs)/addExpense.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../../src/api/firebaseConfig';
import {
  addExpense as addExpenseToFirestore,
  Expense,
} from '../../src/services/expenses';
import { getCategories, Category } from '../../src/services/categories';
import Colors from '../../constants/Colors';

export default function AddExpenseScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  // ─── States ─────────────────────────────────────────────────────────
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);

  // ─── Fetch categories on mount ────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    setLoadingCategories(true);
    getCategories(userId)
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0].id);
        }
      })
      .catch((e) => console.error('getCategories-virhe:', e))
      .finally(() => setLoadingCategories(false));
  }, [userId]);

  // ─── Handler: Päivämäärän valinta ─────────────────────────────────────
  const onChangeDate = (event: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setDate(selected);
    }
  };

  // ─── Handler: Tallenna uusi kulu ─────────────────────────────────────
  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Virhe', 'Et ole kirjautunut sisään.');
      return;
    }

    // Tarkista summa
    const amt = parseFloat(amount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Virhe', 'Syötä kelvollinen summa (esim. 12.50).');
      return;
    }

    // Tarkista kategoria
    if (!selectedCategory) {
      Alert.alert('Virhe', 'Valitse kategoria.');
      return;
    }

    setSaving(true);

    // Expense-tyyppi edellyttää id-kenttää, mutta koska Firestore etsii uuden dokumentin ID:n itse,
    // kastamme olion tässä vaiheessa `as any` niin, että TypeScript ei valita puuttuvasta id:stä.
    const newExpense = {
      amount: amt,
      categoryId: selectedCategory,
      description: description.trim(),
      date: date,
    } as any; // -> back-end (addExpenseToFirestore) luo id:n itse.

    try {
      await addExpenseToFirestore(userId, newExpense as Expense);
      router.back();
    } catch (e) {
      console.error('addExpense-virhe:', e);
      Alert.alert('Virhe', 'Kulun lisääminen epäonnistui.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Jos lataamme kategorioita, näytetään loader ──────────────────────
  if (loadingCategories) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Summa‐kenttä */}
      <Text style={styles.label}>Summa (€)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="Esim. 29.90"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Kuvaus‐kenttä */}
      <Text style={styles.label}>Kuvaus (valinnainen)</Text>
      <TextInput
        style={styles.input}
        placeholder="Esim. Lounaskulu"
        value={description}
        onChangeText={setDescription}
      />

      {/* Kategorian valinta */}
      <Text style={styles.label}>Kategoria</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          style={styles.picker}
        >
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.title} value={cat.id} />
          ))}
        </Picker>
      </View>

      {/* Päivämäärän valinta */}
      <Text style={styles.label}>Päivämäärä</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.dateButton}
      >
        <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
        <Text style={styles.dateButtonText}>
          {date.toLocaleDateString('fi-FI')}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
        />
      )}

      {/* Tallenna‐painike */}
      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Tallenna kulu</Text>
        )}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
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
    paddingVertical: 8,
    marginTop: 4,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBackground,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: Colors.cardBackground,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  saveButton: {
    marginTop: 24,
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
