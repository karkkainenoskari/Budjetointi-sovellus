// app/addExpense.tsx

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
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../src/api/firebaseConfig';
import {
  addExpense as addExpenseToFirestore,
  Expense,
} from '../src/services/expenses';
import { getCategories, Category } from '../src/services/categories';
import Colors from '../constants/Colors';

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
       <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lisää kulu</Text>
        {/* Tyhjä näkymä tasaamaan tilaa */}
        <View style={{ width: 24 }} />
      </View>
       <ScrollView
        contentContainerStyle={styles.content}
        style={{ flex: 1, overflow: 'visible' }}
        keyboardShouldPersistTaps="handled"
      >
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
           mode="dropdown"
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
  <View style={styles.datePickerContainer}>
    <DateTimePicker
      value={date}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={onChangeDate}
    />
  </View>
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
       </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
   pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    marginTop: 20,
    marginBottom: 170,
    backgroundColor: Colors.cardBackground,
    position: 'relative',  // ilman tätä zIndex ei toimi
    zIndex: 1000,          // nostaa pickerin kaikkien sibliksien yli
    elevation: 10,         // Androidissa
    overflow: 'visible',   // TÄMÄ PUUTUI – lisää tämä
  },
  datePickerContainer: {
    position: 'relative',
    zIndex: 500,
    elevation: 5,
    marginTop: 4,
    overflow: 'visible',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
    overflow: 'visible',  // varmista myös täällä
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
  content: {
    paddingBottom: 80,
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
    marginTop: 16,
    backgroundColor: Colors.cardBackground,
    zIndex: 0,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: Colors.moss,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 0,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});
