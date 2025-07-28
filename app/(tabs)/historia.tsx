import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../../src/api/firebaseConfig';
import {
  getHistoryMonths,
  getHistoryCategories,
  copyPreviousMonthCategories,
} from '../../src/services/history';
import {
  deleteBudgetPeriod,
  getCurrentBudgetPeriod,
  clearCurrentBudgetPeriod,
} from '../../src/services/budget';
import { formatMonthRange } from '@/src/utils';
import { getExpensesByPeriod, Expense } from '../../src/services/expenses';
import Colors from '../../constants/Colors';
import { Category } from '../../src/services/categories';

export default function HistoriaScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [months, setMonths] = useState<string[]>([]);
  const [loadingMonths, setLoadingMonths] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<Record<string, {loading: boolean; categories: Category[]; expenses: Record<string, number>;}>>({});
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoadingMonths(true);
    Promise.all([getHistoryMonths(userId), getCurrentBudgetPeriod(userId)])
      .then(([m, curr]) => {
        if (curr) {
          const d = curr.startDate.toDate();
          const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!m.includes(id)) m.push(id);
          setCurrentPeriodId(id);
        } else {
          setCurrentPeriodId(null);
        }
        m.sort();
        m.reverse();
        setMonths(m);
      })
      .catch((e) => console.error('getHistoryMonths error:', e))
      .finally(() => setLoadingMonths(false));
  }, [userId]);

  const toggleMonth = async (m: string) => {
    if (!userId) return;
    if (expanded === m) {
      setExpanded(null);
      return;
    }
    setExpanded(m);
    if (monthData[m]) return;

    setMonthData((prev) => ({ ...prev, [m]: { loading: true, categories: [], expenses: {} } }));
    try {
      const cats = await getHistoryCategories(userId, m);
      const [year, month] = m.split('-').map((x) => parseInt(x, 10));
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      const expenses = await getExpensesByPeriod(userId, start, end);
      const sums: Record<string, number> = {};
      expenses.forEach((exp: Expense) => {
        sums[exp.categoryId] = (sums[exp.categoryId] || 0) + exp.amount;
      });
      setMonthData((prev) => ({ ...prev, [m]: { loading: false, categories: cats, expenses: sums } }));
    } catch (e) {
      console.error('toggleMonth error:', e);
      setMonthData((prev) => ({ ...prev, [m]: { loading: false, categories: [], expenses: {} } }));
    }
  };

  const handleCopyPrevious = async () => {
    if (!userId) return;
    try {
      await copyPreviousMonthCategories(userId);
      Alert.alert('Valmis', 'Kategoriat kopioitu uudelle kuukaudelle.');
    } catch (e) {
      console.error('copyPreviousMonthCategories error:', e);
      Alert.alert('Virhe', 'Kopiointi epäonnistui.');
    }
  };

  const handleDeleteMonth = (m: string) => {
    if (!userId) return;
    Alert.alert('Poista jakso', `Poistetaanko jakso ${m}?`, [
      { text: 'Peruuta', style: 'cancel' },
      {
        text: 'Poista',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudgetPeriod(userId, m);
            setMonths((prev) => prev.filter((mon) => mon !== m));
             if (m === currentPeriodId) {
              await clearCurrentBudgetPeriod(userId);
              setCurrentPeriodId(null);
            }
          } catch (e) {
            console.error('deleteBudgetPeriod error:', e);
            Alert.alert('Virhe', 'Poistaminen epäonnistui.');
          }
        },
      },
    ]);
  };


  if (!userId) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: Colors.textPrimary }}>Kirjaudu sisään.</Text>
      </View>
    );
  }

  if (loadingMonths) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.moss} />
      </View>
    );
  }

return (
  <SafeAreaView style={styles.safeContainer}>
     <TouchableOpacity style={styles.statsButton} onPress={() => router.push('/tilastot')}>
      <Text style={styles.copyButtonText}>Tilastot</Text>
    </TouchableOpacity>

    <FlatList
      data={months}
      keyExtractor={(item) => item}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const data = monthData[item];
        return (
          <View style={styles.monthCard}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => toggleMonth(item)} style={{ flex: 1 }}>
                <Text style={styles.monthTitle}>{formatMonthRange(item)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteMonth(item)}
                style={styles.iconButtonSmall}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.evergreen} />
              </TouchableOpacity>
            </View>
            {expanded === item && (
              <View style={styles.monthContent}>
                {data?.loading ? (
                  <ActivityIndicator color={Colors.moss} />
                ) : (
                  data?.categories.map((cat) => (
                    <View key={cat.id} style={styles.catRow}>
                      <Text style={styles.catTitle}>{cat.title}</Text>
                      <Text style={styles.catAmount}>
                        {data.expenses[cat.id] || 0} / {cat.allocated} €
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        );
      }}
    />
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
 safeContainer: {
  flex: 1,
  backgroundColor: Colors.background,
  paddingHorizontal: 16,
  paddingTop: 24,
  paddingBottom: 16,
},

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
   statsButton: {
  backgroundColor: Colors.moss,
  padding: 16,
  borderRadius: 8,
  alignItems: 'center',
  marginBottom: 12,
  width: 375,
  alignSelf: 'center',
  },
  copyButtonText: {
  color: Colors.buttonPrimaryText,
  fontWeight: '600',
  fontSize: 14,
},

  listContent: {
     paddingTop: 8,
    paddingBottom: 24,
  },
 monthCard: {
  backgroundColor: Colors.cardBackground,
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: Colors.border,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 2,
},

   monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  iconButtonSmall: {
    marginLeft: 8,
  },
  monthContent: {
    marginTop: 8,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  catAmount: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

