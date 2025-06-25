import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../src/api/firebaseConfig';
import { getCurrentBudgetPeriod } from '../../src/services/budget';
import { getExpensesByPeriod, Expense } from '../../src/services/expenses';
import Colors from '../../constants/Colors';

export default function TilitapahtumatScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadExpenses = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const period = await getCurrentBudgetPeriod(userId);
      if (period) {
        const data = await getExpensesByPeriod(
          userId,
          period.startDate,
          period.endDate,
        );
        setExpenses(data);
      } else {
        setExpenses([]);
      }
    } catch (e) {
      console.error('loadExpenses error:', e);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [userId])
  );

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.row}>
      <Text style={styles.desc}>{item.description || '-'}</Text>
      <Text style={styles.amount}>{item.amount.toFixed(2)} €</Text>
    </View>
  );

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
    <View style={styles.safeContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Tilitapahtumat</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/addExpense')}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.moss} />
          <Text style={styles.addText}>Lisää tapahtuma</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {
    marginLeft: 6,
    fontSize: 16,
    color: Colors.moss,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  desc: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  amount: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});