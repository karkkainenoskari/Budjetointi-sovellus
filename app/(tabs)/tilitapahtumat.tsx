import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../src/api/firebaseConfig';
import { getCurrentBudgetPeriod } from '../../src/services/budget';
import { getExpensesByPeriod, Expense } from '../../src/services/expenses';
import { getCategories, Category } from '../../src/services/categories';
import Colors from '../../constants/Colors';

export default function TilitapahtumatScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});


  const loadExpenses = async () => {
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
      setCategoryMap(map);
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

  const renderItem = ({ item }: { item: Expense }) => {
    const category = categoryMap[item.categoryId];
    const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
    const formatted = date.toLocaleDateString('fi-FI');
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/editExpense',
            params: { id: item.id, categoryId: item.categoryId },
          })
        }
      >
        <View style={styles.cardLeft}>
          <Text style={styles.desc}>{item.description || '-'}</Text>
          <Text style={styles.metaText}>
            {category ? `${category} • ${formatted}` : formatted}
          </Text>
        </View>
        <Text style={styles.amount}>{item.amount.toFixed(2)} €</Text>
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
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Tilitapahtumat</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
headerTitle: {
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
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});