import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../src/api/firebaseConfig';
import { getCurrentBudgetPeriod } from '../../src/services/budget';
import { getCategories, Category } from '../../src/services/categories';
import Colors from '../../constants/Colors';
interface Transaction {
  id: string;
  type: 'expense' | 'income';
  date: Date;
  category: string;
  categoryId: string;
  description: string;
  amount: number;
}

import SummaryCards from '../../components/SummaryCards';
import {
  getExpensesByPeriod,
  deleteExpense,
  Expense,
} from '../../src/services/expenses';
import {
  getIncomesByPeriod,
  deleteIncome,
  Income,
} from '../../src/services/incomes';

export default function TilitapahtumatScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
   const [period, setPeriod] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [categoryStats, setCategoryStats] = useState<{ id: string; title: string; amount: number }[]>([]);


const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
     const [p, cats] = await Promise.all([
        getCurrentBudgetPeriod(userId),
        getCategories(userId),
      ]);
       setPeriod(p);
      const map: Record<string, string> = {};
      cats.forEach((c: Category) => {
        map[c.id] = c.title;
      });
      setCategoryMap(map);
       if (p) {
        const [exp, inc] = await Promise.all([
          getExpensesByPeriod(userId, p.startDate, p.endDate),
          getIncomesByPeriod(userId, p.startDate, p.endDate),
        ]);
        const txs: Transaction[] = [];
        const sums: Record<string, number> = {};
        exp.forEach((e) => {
          const date = e.date?.toDate ? e.date.toDate() : new Date(e.date);
          txs.push({
            id: e.id,
            type: 'expense',
            date,
            category: map[e.categoryId] || '',
            categoryId: e.categoryId,
            description: e.description || '',
            amount: e.amount,
          });
          sums[e.categoryId] = (sums[e.categoryId] || 0) + e.amount;
        });
        inc.forEach((i: Income) => {
          const date = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt);
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
        const stats = Object.keys(sums).map((id) => ({
          id,
          title: map[id],
          amount: sums[id],
        }));
        setCategoryStats(stats);
      } else {
         setTransactions([]);
        setCategoryStats([]);
      }
    } catch (e) {
       console.error('loadData error:', e);
      setTransactions([]);
      setCategoryStats([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
       loadData();
    }, [userId])
  );

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
              params: { id: item.id, title: item.description, amount: item.amount.toString() },
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

  const incomeSum = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expenseSum = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const budgetUsed = expenseSum;
  const budgetTotal = period?.totalAmount || 0;
  const budgetLeft = budgetTotal - budgetUsed;

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'income' && t.type !== 'income') return false;
      if (categoryFilter !== 'income' && t.categoryId !== categoryFilter) return false;
    }
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    if (search && !(`${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
      <View style={styles.cardLeft}>
        <Text style={styles.desc}>{item.description || '-'}</Text>
        <Text style={styles.metaText}>
          {item.category} • {item.date.toLocaleDateString('fi-FI')}
        </Text>
      </View>
      <Text
        style={[
          styles.amount,
          item.type === 'income' ? styles.income : styles.expense,
        ]}
      >
       {item.type === 'income' ? '+' : '-'}
        {item.amount.toFixed(2)} €
      </Text>
    </TouchableOpacity>
  );

  const renderCategorySummary = () => {
    if (categoryStats.length === 0) return null;
    const top = [...categoryStats]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    const total = top.reduce((s, c) => s + c.amount, 0) || 1;
    return (
      <TouchableOpacity style={styles.catSummary} onPress={() => router.push('/tilastot')}>
        {top.map((c) => (
          <View key={c.id} style={styles.catRow}>
            <Text style={styles.catLabel}>{c.title}</Text>
            <View style={styles.catBarBg}>
              <View
                style={[
                  styles.catBar,
                  { width: `${(c.amount / total) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.catAmount}>{c.amount.toFixed(2)} €</Text>
          </View>
        ))}
      </TouchableOpacity>
    );
  };

  if (!userId) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: Colors.textPrimary }}>Kirjaudu sisään.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </View>
    );
  }

  return (
     <SafeAreaView style={styles.safeContainer}>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderTransaction}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.headerTitle}>Tilitapahtumat</Text>
            <SummaryCards income={incomeSum} expense={expenseSum} />
            <Text style={styles.budgetText}>
              {`Käytetty ${budgetUsed.toFixed(2)} € / Budjetti ${budgetTotal.toFixed(
                2
              )} € (jäljellä ${budgetLeft.toFixed(2)} €)`}
            </Text>
            {renderCategorySummary()}
            <TextInput
              style={styles.searchInput}
              placeholder="Haku..."
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
            />
            <View style={styles.filterRow}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Tyyppi</Text>
                <Picker
                  selectedValue={typeFilter}
                  onValueChange={(v) => setTypeFilter(v)}
                  style={styles.picker}
                >
                  <Picker.Item label="Kaikki" value="all" />
                  <Picker.Item label="Tulot" value="income" />
                  <Picker.Item label="Menot" value="expense" />
                </Picker>
              </View>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Kategoria</Text>
                <Picker
                  selectedValue={categoryFilter}
                  onValueChange={(v) => setCategoryFilter(v)}
                  style={styles.picker}
                >
                  <Picker.Item label="Kaikki" value="all" />
                  <Picker.Item label="Tulot" value="income" />
                  {Object.entries(categoryMap).map(([id, title]) => (
                    <Picker.Item key={id} label={title} value={id} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.dateFilters}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.textPrimary} />
                <Text style={styles.dateText}>
                  {startDate ? startDate.toLocaleDateString('fi-FI') : 'Alku'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.textPrimary} />
                <Text style={styles.dateText}>
                  {endDate ? endDate.toLocaleDateString('fi-FI') : 'Loppu'}
                </Text>
              </TouchableOpacity>
            </View>
            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
       <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/addExpense')}
      >
        <Ionicons name="add" size={28} color={Colors.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
    listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
     marginVertical: 8,
    textAlign: 'center',
  },
  budgetText: {
    textAlign: 'center',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBackground,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  picker: {
    height: 44,
    backgroundColor: Colors.cardBackground,
    color: Colors.textPrimary,
  },
  dateFilters: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
     flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    gap: 6,
  },
    dateText: {
    color: Colors.textPrimary,
  },
  catSummary: {
    marginBottom: 12,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  catLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  catBarBg: {
    flex: 2,
    height: 8,
    backgroundColor: Colors.tabInactiveBg,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  catBar: {
    height: '100%',
    backgroundColor: Colors.moss,
  },
  catAmount: {
    width: 70,
    textAlign: 'right',
    color: Colors.textSecondary,
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 80,
  },
 card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
     alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
  },
  cardLeft: {
    flex: 1,
    marginRight: 8,
  },
  desc: {
    fontSize: 16,
    color: Colors.textPrimary,
     fontWeight: '500',
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  income: {
    color: Colors.success,
  },
  expense: {
    color: Colors.danger,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.moss,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});