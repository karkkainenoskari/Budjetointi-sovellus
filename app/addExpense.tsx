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
  KeyboardAvoidingView,
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

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [saving, setSaving] = useState(false);

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

  const onChangeDate = (event: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setDate(selected);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Virhe', 'Et ole kirjautunut sisään.');
      return;
    }

    const amt = parseFloat(amount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Virhe', 'Syötä kelvollinen summa (esim. 12.50).');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Virhe', 'Valitse kategoria.');
      return;
    }

    setSaving(true);

    const newExpense = {
      amount: amt,
      categoryId: selectedCategory,
      description: description.trim(),
      date: date,
    } as any;

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

  if (loadingCategories) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Lisää kulu</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.label}>Summa (€)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="Esim. 29.90"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Kuvaus (valinnainen)</Text>
          <TextInput
            style={styles.input}
            placeholder="Esim. Lounaskulu"
            value={description}
            onChangeText={setDescription}
          />

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

          <Text style={styles.label}>Päivämäärä</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.dateButtonText}>{date.toLocaleDateString('fi-FI')}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={{ marginTop: 4 }}>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'default' : 'default'}
                onChange={onChangeDate}
              />
            </View>
          )}

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
      </KeyboardAvoidingView>
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
  pickerContainer: {
   marginTop: Platform.OS === 'ios' ? 0 : 4,
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
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});