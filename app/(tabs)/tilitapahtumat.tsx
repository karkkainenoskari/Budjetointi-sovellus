import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
   Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { auth } from '../../src/api/firebaseConfig';
import { getCurrentBudgetPeriod } from '../../src/services/budget';
import { getCategories, Category } from '../../src/services/categories';

import {
  getExpensesByPeriod,
  deleteExpense,
  Expense,
   addExpense,
} from '../../src/services/expenses';
import {
  getIncomesByPeriod,
  deleteIncome,
  Income,
  addIncome,
} from '../../src/services/incomes';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Transaction {
  id: string;
  type: 'expense' | 'income';
  date: Date;
  category: string;
  categoryId: string;
  description: string;
  amount: number;
}

export default function TilitapahtumatScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
 const [loading, setLoading] = useState(true);
 const [categories, setCategories] = useState<Category[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
     const [period, cats] = await Promise.all([
        getCurrentBudgetPeriod(userId),
        getCategories(userId),
      ]);
      const map: Record<string, string> = {};
      cats.forEach((c: Category) => {
        map[c.id] = c.title;
      });
        setCategories(cats);
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].id);
      }
      if (period) {
        const [exp, inc] = await Promise.all([
         getExpensesByPeriod(userId, period.startDate, period.endDate),
          getIncomesByPeriod(userId, period.startDate, period.endDate),
        ]);
        const txs: Transaction[] = [];
         exp.forEach((e: Expense) => {
          const date = e.date?.toDate ? e.date.toDate() : new Date(e.date);
          txs.push({
            id: e.id,
            type: 'expense',
            date,
            category: map[e.categoryId] || '',
            categoryId: e.categoryId,
            description: e.description,
            amount: e.amount,
          });
        
        });
        inc.forEach((i: Income) => {
          const date = i.createdAt?.toDate
            ? i.createdAt.toDate()
            : new Date(i.createdAt)
          txs.push({
            id: i.id,
            type: 'income',
            date,
            category: 'Tulo',
            categoryId: 'income',
            description: i.title,
            amount: i.amount,
          });
        });
        txs.sort((a, b) => b.date.getTime() - a.date.getTime());
        setTransactions(txs);
       
      } else {
        setTransactions([]);
      }
    } catch (e) {
       console.error('loadData error:', e);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
       loadData();
    }, [userId])
  );

   const handleAdd = () => {
    if (categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
    setNewType('expense');
    setAmount('');
    setDescription('');
    setNotes('');
    setDate(new Date());
    setAddModalVisible(true);
  };

  const handlePress = (item: Transaction) => {
    Alert.alert('Tapahtuma', '', [
      {
        text: 'Muokkaa',
        onPress: () => {
          if (item.type === 'expense') {
            router.push({
              pathname: '/editExpense',
              params: { id: item.id, categoryId: item.categoryId },
            });
          } else {
            router.push({
              pathname: '/editIncome',
              params: {
                id: item.id,
                title: item.description,
                amount: item.amount.toString(),
              },
            });
          }
        },
      },
      {
        text: 'Poista',
        style: 'destructive',
        onPress: () => handleDelete(item),
      },
      { text: 'Peruuta', style: 'cancel' },
    ]);
  };

  const handleDelete = async (item: Transaction) => {
    if (!userId) return;
    try {
      if (item.type === 'expense') {
        await deleteExpense(userId, item.id);
      } else {
        await deleteIncome(userId, item.id);
      }
      loadData();
    } catch (e) {
      console.error('delete transaction error:', e);
    }
  };

   const onChangeDate = (event: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setDate(selected);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    const amt = parseFloat(amount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Virhe', 'Syötä kelvollinen summa.');
      return;
    }
    setSaving(true);
    try {
      if (newType === 'expense') {
        if (!selectedCategory) {
          Alert.alert('Virhe', 'Valitse kategoria.');
          setSaving(false);
          return;
        }
        await addExpense(userId, {
          categoryId: selectedCategory,
          amount: amt,
          date,
          description:
            description.trim() + (notes.trim() ? ` - ${notes.trim()}` : ''),
        });
      } else {
        await addIncome(userId, {
          title: description.trim() || 'Tulo',
          amount: amt,
          createdAt: date,
        });
      }
      setAddModalVisible(false);
      loadData();
    } catch (e) {
      console.error('save transaction error:', e);
    } finally {
      setSaving(false);
    }
  };



  const renderTransaction = ({ item }: { item: Transaction }) => (
     <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => handlePress(item)}
    >
      <View>
        <Text style={styles.transactionDesc}>{item.description || '-'}</Text>
        <Text style={styles.transactionMeta}>{item.category}</Text>
        <Text style={styles.transactionDate}>
          {item.date.toLocaleDateString('fi-FI')}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          item.type === 'income' ? styles.income : styles.expense,
        ]}
      >
       {item.type === 'income' ? '+' : '-'}
        {item.amount.toFixed(2)} €
      </Text>
    </TouchableOpacity>
  );

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.textPrimary }}>Kirjaudu sisään.</Text>
      </View>
    );
  }

  if (loading) {
    return (
       <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </View>
    );
  }

  return (
     <SafeAreaView style={styles.safeContainer}>
       <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lisää uusi tapahtuma</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeOption, newType === 'expense' && styles.typeSelected]}
                onPress={() => setNewType('expense')}
              >
                <Ionicons
                  name="trending-down-outline"
                  size={20}
                  color={Colors.danger}
                />
                <Text style={styles.typeLabel}>Meno</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, newType === 'income' && styles.typeSelected]}
                onPress={() => setNewType('income')}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={20}
                  color={Colors.moss}
                />
                <Text style={styles.typeLabel}>Tulo</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Summa (€)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
            />
            <Text style={styles.label}>Kuvaus</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Esim. Ruokakauppa"
            />
            {newType === 'expense' && (
              <>
                <Text style={styles.label}>Kategoria</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v)}
                    style={styles.picker}
                  >
                    {categories.map((cat) => (
                      <Picker.Item key={cat.id} label={cat.title} value={cat.id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}
            <Text style={styles.label}>Päivämäärä</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.textPrimary}
              />
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
            <Text style={styles.label}>Lisätiedot (valinnainen)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="Lisää tarvittaessa lisätietoja"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Peruuta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>Lisää</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <FlatList
         data={transactions}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderTransaction}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>Tilitapahtumat</Text>
            <Text style={styles.subtitle}>Lisää ja seuraa kuluja</Text>
            <View style={styles.addCard}>
              <View style={styles.addCardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={Colors.moss}
                  />
                </View>
                <Text style={styles.addCardTitle}>Lisää tapahtuma</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                <Ionicons name="add" size={20} color={Colors.background} />
                <Text style={styles.addButtonText}>Lisää uusi tapahtuma</Text>
              </TouchableOpacity>
            </View>
          <Text style={styles.sectionTitle}>Viimeisimmät tapahtumat</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
    center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.textPrimary,
  },
   subtitle: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
   addCard: {
    backgroundColor: Colors.cardBackground,
     borderRadius: 8,
    padding: 16,
    marginBottom: 24
  },
   addCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
 cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
     alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
    addCardTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.moss,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
    addButtonText: {
    color: Colors.buttonPrimaryText,
    marginLeft: 4,
    fontWeight: '500',
  },
 sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
 transactionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionDesc: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  transactionMeta: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  transactionDate: {
    color: Colors.textSecondary,
    marginTop: 2,
      fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  income: {
    color: Colors.moss,
  },
  expense: {
    color: Colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeSelected: {
    backgroundColor: Colors.background,
    borderColor: Colors.moss,
  },
  typeLabel: {
    marginLeft: 6,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  dateButtonText: {
    marginLeft: 8,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  modalCancelText: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalSaveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: Colors.moss,
  },
  modalSaveText: {
    color: Colors.buttonPrimaryText,
    fontWeight: '600',
  },
  });