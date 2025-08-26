import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../src/api/firebaseConfig';
import {
  addRecurringExpense,
  getActiveRecurringExpenses,
  deleteRecurringExpense,
  RecurringExpense,
} from '../src/services/recurringExpenses';
import { getCategories, Category } from '../src/services/categories';
import Colors from '../constants/Colors';

export default function RecurringExpensesScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [recurrence, setRecurrence] = useState<'weekly' | 'monthly'>('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [exps, cats] = await Promise.all([
          getActiveRecurringExpenses(userId),
          getCategories(userId),
        ]);
        setExpenses(exps);
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0].id);
      } catch (e) {
        console.error('load recurring expenses error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    const amt = parseFloat(amount.replace(',', '.'));
    if (!name.trim() || isNaN(amt) || amt <= 0 || !selectedCategory) {
      Alert.alert('Virhe', 'Täytä kaikki kentät oikein');
      return;
    }
    setSaving(true);
    try {
      await addRecurringExpense(userId, {
        name: name.trim(),
        amount: amt,
        categoryId: selectedCategory,
        dueDate: date,
        recurrence,
      });
      const exps = await getActiveRecurringExpenses(userId);
      setExpenses(exps);
      setName('');
      setAmount('');
      setShowAdd(false);
    } catch (e) {
      console.error('addRecurringExpense error:', e);
      Alert.alert('Virhe', 'Tallennus epäonnistui');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!userId) return;
    Alert.alert('Poista', 'Poistetaanko toistuva meno?', [
      { text: 'Peruuta', style: 'cancel' },
      {
        text: 'Poista',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecurringExpense(userId, id);
            const exps = await getActiveRecurringExpenses(userId);
            setExpenses(exps);
          } catch (e) {
            console.error('deleteRecurringExpense error:', e);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </SafeAreaView>
    );
  }

 const renderExpenseRow = (item: RecurringExpense) => (
    <View key={item.id} style={styles.row}>
      <Ionicons
        name="repeat-outline"
        size={20}
        color={Colors.evergreen}
        style={styles.icon}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{item.name}</Text>
        <Text style={styles.rowSub}>
          {item.amount.toFixed(2)} € •{' '}
          {item.dueDate.toDate
            ? item.dueDate.toDate().toLocaleDateString('fi-FI')
            : ''}
          {' • '}
          {item.recurrence === 'weekly' ? 'viikoittain' : 'kuukausittain'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color={Colors.iconMuted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.evergreen} />
          </TouchableOpacity>
          <Text style={styles.title}>Toistuvat menot</Text>
          <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
            <Ionicons
              name={showAdd ? 'close' : 'add'}
              size={24}
              color={Colors.evergreen}
            />
          </TouchableOpacity>
        </View>

        {showAdd && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uusi toistuva meno</Text>
            <View style={styles.row}>
              <Ionicons
                name="create-outline"
                size={20}
                color={Colors.evergreen}
                style={styles.icon}
              />
              <TextInput
                style={styles.rowInput}
                placeholder="Nimi"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.row}>
              <Ionicons
                name="cash-outline"
                size={20}
                color={Colors.evergreen}
                style={styles.icon}
              />
              <TextInput
                style={styles.rowInput}
                placeholder="Summa (€)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.row}>
              <Ionicons
                name="list-outline"
                size={20}
                color={Colors.evergreen}
                style={styles.icon}
              />
              <View style={styles.rowPicker}>
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
            </View>
            <View style={styles.row}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.evergreen}
                style={styles.icon}
              />
              <Text style={styles.rowLabel}>Eräpäivä</Text>
              <TouchableOpacity
                style={styles.rowButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.rowButtonText}>
                  {date.toLocaleDateString('fi-FI')}
                </Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  locale="fi-FI"
                onChange={(_, d) => {
                  setShowDatePicker(false);
                  if (d) setDate(d);
                }}
              />
            )}
            <View style={styles.row}>
              <Ionicons
                name="repeat-outline"
                size={20}
                color={Colors.evergreen}
                style={styles.icon}
              />
              <View style={styles.rowPicker}>
                <Picker
                  selectedValue={recurrence}
                  onValueChange={(val) => setRecurrence(val)}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="Kuukausittain" value="monthly" />
                  <Picker.Item label="Viikoittain" value="weekly" />
                </Picker>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
               <Text style={styles.saveButtonText}>Tallenna</Text>
            </TouchableOpacity>
          </View>
          )}

      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toistuvat menot</Text>
          {expenses.map(renderExpenseRow)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
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
    marginBottom: 12,
  },
  icon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  rowSub: { fontSize: 14, color: Colors.textSecondary },
  rowInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  rowPicker: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  picker: { height: 50, width: '100%', color: Colors.textPrimary },
  rowButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },
  rowButtonText: { fontSize: 16, color: Colors.textPrimary },
  saveButton: {
    marginTop: 16,
    backgroundColor: Colors.moss,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: Colors.background, fontSize: 18, fontWeight: '600' },
});