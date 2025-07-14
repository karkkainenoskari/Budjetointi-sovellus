import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
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

  const renderItem = ({ item }: { item: RecurringExpense }) => (
    <View style={styles.row}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.subText}>
          {item.amount.toFixed(2)} € •{' '}
          {item.dueDate.toDate ? item.dueDate.toDate().toLocaleDateString('fi-FI') : ''}
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
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Toistuvat menot</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.moss} />
        </TouchableOpacity>
      </View>

      {showAdd && (
        <>
          <Text style={styles.label}>Nimi</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Summa (€)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
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
          <Text style={styles.label}>Eräpäivä</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.dateButtonText}>{date.toLocaleDateString('fi-FI')}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, d) => {
                setShowDatePicker(false);
                if (d) setDate(d);
              }}
            />
          )}
          <Text style={styles.label}>Toistuvuus</Text>
          <View style={styles.pickerContainer}>
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
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>Tallenna</Text>
          </TouchableOpacity>
        </>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
  label: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary, marginTop: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4, fontSize: 16, color: Colors.textPrimary, backgroundColor: Colors.cardBackground },
  pickerContainer: { marginTop: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, backgroundColor: Colors.cardBackground },
  picker: { height: 50, width: '100%', color: Colors.textPrimary },
  dateButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, marginTop: 8, backgroundColor: Colors.cardBackground },
  dateButtonText: { marginLeft: 8, fontSize: 16, color: Colors.textPrimary },
  saveButton: { marginTop: 16, backgroundColor: Colors.moss, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: Colors.background, fontSize: 18, fontWeight: '600' },
  listContent: { paddingTop: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: Colors.border },
  name: { fontSize: 16, color: Colors.textPrimary },
  subText: { fontSize: 14, color: Colors.textSecondary },
});