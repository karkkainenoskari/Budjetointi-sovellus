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
} from '../../src/services/expenses';
import {
  getIncomesByPeriod,
  deleteIncome,
  Income,
} from '../../src/services/incomes';

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
    router.push('/addExpense');
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
  });