import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import DonutChart from '../../components/DonutChart';
import ComparisonBars from '../../components/ComparisonBars';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth, firestore } from '../../src/api/firebaseConfig';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import {
  getHistoryMonths,
  getHistoryCategories,
} from '../../src/services/history';
import {

  getCurrentBudgetPeriod,
  getBudgetPeriodFromHistory,
} from '../../src/services/budget';
import {
   formatDateRange,
  formatMonthRange,
  generateMonthRange,
  nextMonthId,
  prevMonthId,
} from '@/src/utils';
import { Income } from '../../src/services/incomes';
import Colors from '../../constants/Colors';
import { Category, getCategories } from '../../src/services/categories';

export default function HistoriaScreen() {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [months, setMonths] = useState<string[]>([]);
  const [loadingMonths, setLoadingMonths] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<
    Record<
      string,
      {
        loading: boolean;
        categories: Category[];
        expenses: Record<string, number>;
        incomes: Income[];
        period: { startDate: Date; endDate: Date } | null;
      }
    >
  >({});
  const [chartData, setChartData] = useState<{ pieData: any[]; totals: { income: number; expense: number } } | null>(null);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);
  const [monthHasPeriod, setMonthHasPeriod] = useState<Record<string, boolean>>({});
 const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

   const loadMonths = React.useCallback(
    async (active: { current: boolean }) => {
      if (!userId) return;
      setLoadingMonths(true);
      try {
      const [m, curr] = await Promise.all([
        getHistoryMonths(userId),
        getCurrentBudgetPeriod(userId),
      ]);
      if (!active.current) return;
      if (curr) {
        const d = curr.startDate.toDate();
        const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!m.includes(id)) m.push(id);
        setCurrentPeriodId(id);
      } else {
        setCurrentPeriodId(null);
      }
      if (m.length > 0) {
        const filled = generateMonthRange(m[0], m[m.length - 1]);
        setMonths(filled);
        setSelectedMonth((prev) => prev && filled.includes(prev) ? prev : filled[0]);
      } else {
        setMonths([]);
        setSelectedMonth(null);
      }
    } catch (e) {
      if (active.current) console.error('getHistoryMonths error:', e);
    } finally {
        if (active.current) setLoadingMonths(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    const active = { current: true };
    loadMonths(active);
    return () => {
      active.current = false;
    };
 }, [loadMonths]);

  useFocusEffect(
    React.useCallback(() => {
      const active = { current: true };
      loadMonths(active);
      return () => {
        active.current = false;
      };
     }, [loadMonths])
  );

   const loadMonthData = React.useCallback(
    async (m: string) => {
      if (!userId) return;

      setMonthData((prev) => ({
        ...prev,
        [m]: {
           ...(prev[m] || { expenses: {}, incomes: [], period: null }),
          loading: true,
          categories: [],
        },
      }));
      try {
        const [cats, period] = await Promise.all([
          m === currentPeriodId
            ? getCategories(userId)
            : getHistoryCategories(userId, m),
          getBudgetPeriodFromHistory(userId, m),
        ]);

        const periodInfo = period
          ? {
              startDate: period.startDate.toDate(),
              endDate: period.endDate.toDate(),
            }
          : null;

        const hasPeriod = !!periodInfo || m === currentPeriodId;
        setMonthHasPeriod((prev) => ({ ...prev, [m]: hasPeriod }));

        setMonthData((prev) => ({
          ...prev,
          [m]: {
            ...(prev[m] || { expenses: {}, incomes: [], period: null }),
            loading: false,
            categories: cats,
             period: periodInfo,
          },
        }));
        if (selectedMonth === m) {
          const mainCats = cats.filter((c) => c.parentId === null && c.type === 'main');
        setSelectedCategory((prev) =>
            prev && mainCats.some((c) => c.id === prev) ? prev : mainCats[0]?.id || null
          );
        }
      } catch (e) {
        console.error('loadMonthData error:', e);
        setMonthData((prev) => ({
          ...prev,
          [m]: {
            loading: false,
            categories: [],
            expenses: {},
            incomes: [],
            period: null,
          },
        }));
        setMonthHasPeriod((prev) => ({ ...prev, [m]: m === currentPeriodId }));
        if (selectedMonth === m) {
          setChartData({ pieData: [], totals: { income: 0, expense: 0 } });
          setSelectedCategory(null);
        }
      }
   },
    [userId, currentPeriodId, selectedMonth]
  );

  useEffect(() => {
    if (selectedMonth) {
      loadMonthData(selectedMonth);
    }
  }, [selectedMonth, loadMonthData]);

   useFocusEffect(
    React.useCallback(() => {
      if (selectedMonth) {
        loadMonthData(selectedMonth);
      }
    }, [selectedMonth, loadMonthData])
  );

   useEffect(() => {
    if (!userId || !selectedMonth) return;
    const [year, month] = selectedMonth.split('-').map((x) => parseInt(x, 10));
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

     if (selectedMonth === currentPeriodId) {
      const expRef = collection(firestore, 'budjetit', userId, 'expenses');
      const expQuery = query(
        expRef,
        where('date', '>=', start),
        where('date', '<=', end)
      );
      const unsubExpenses = onSnapshot(expQuery, (snapshot) => {
        const sums: Record<string, number> = {};
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          sums[data.categoryId] = (sums[data.categoryId] || 0) + data.amount;
        });
        setMonthData((prev) => ({
          ...prev,
          [selectedMonth]: {
            ...(prev[selectedMonth] || {
              loading: false,
              categories: [],
              incomes: [],
              expenses: {},
              period: null,
            }),
            expenses: sums,
          },
        }));
      });
      

    const incRef = collection(firestore, 'budjetit', userId, 'incomes');
      const incQuery = query(
        incRef,
        where('createdAt', '>=', start),
        where('createdAt', '<=', end)
      );
      const unsubIncomes = onSnapshot(incQuery, (snapshot) => {
        const incomes: Income[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        setMonthData((prev) => ({
          ...prev,
          [selectedMonth]: {
            ...(prev[selectedMonth] || {
              loading: false,
              categories: [],
              expenses: {},
              incomes: [],
              period: null,
            }),
            incomes,
          },
        }));
      });

   return () => {
        unsubExpenses();
        unsubIncomes();
      };
    } else {
      const expRef = collection(firestore, 'budjetit', userId, 'expenses');
      const expQuery = query(
        expRef,
        where('date', '>=', start),
        where('date', '<=', end)
      );
      getDocs(expQuery).then((snapshot) => {
        const sums: Record<string, number> = {};
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          sums[data.categoryId] = (sums[data.categoryId] || 0) + data.amount;
        });
        setMonthData((prev) => ({
          ...prev,
          [selectedMonth]: {
            ...(prev[selectedMonth] || {
              loading: false,
              categories: [],
              incomes: [],
              expenses: {},
              period: null,
            }),
            expenses: sums,
          },
        }));
      });

      const incRef = collection(
        firestore,
        'budjetit',
        userId,
        'history',
        selectedMonth,
        'incomes'
      );
      getDocs(incRef).then((snapshot) => {
        const incomes: Income[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        setMonthData((prev) => ({
          ...prev,
          [selectedMonth]: {
            ...(prev[selectedMonth] || {
              loading: false,
              categories: [],
              expenses: {},
              incomes: [],
              period: null,
            }),
            incomes,
          },
        }));
      });
    }
  }, [userId, selectedMonth, currentPeriodId]);
  
  useEffect(() => {
    if (!selectedMonth || !monthData[selectedMonth]) return;
    const data = monthData[selectedMonth];
    if (data.loading) return;
    const totalIncome = data.incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = Object.values(data.expenses).reduce(
      (sum, v) => sum + v,
      0
    );
    const colors = [
      Colors.evergreen,
      Colors.moss,
      '#FF9F1C',
      '#E71D36',
      '#2EC4B6',
      '#FFBF69',
    ];
    let colorIndex = 0;
    let pie: any[] = [];
      if (selectedCategory) {
      const subs = data.categories.filter(
         (c) =>
          c.parentId === selectedCategory &&
          c.type === 'sub' &&
          !c.title.toLowerCase().includes('yhteensä')
      );
      pie = subs
        .filter((s) => data.expenses[s.id])
        .map((s) => {
          const color = colors[colorIndex % colors.length];
          colorIndex += 1;
          return {
            name: s.title,
            amount: data.expenses[s.id],
            color,
            legendFontColor: Colors.textPrimary,
            legendFontSize: 12,
          };
        });
         
    }
    setChartData({ pieData: pie, totals: { income: totalIncome, expense: totalExpense } });
   }, [selectedMonth, selectedCategory, monthData]);
  const changeMonth = (dir: number) => {
    if (!selectedMonth) return;
    if (dir < 0) {
      const latestAllowed = currentPeriodId || months[0];
      if (selectedMonth === latestAllowed) return;
    }
    const newMonth = dir > 0 ? prevMonthId(selectedMonth) : nextMonthId(selectedMonth);
    setSelectedMonth(newMonth);
    if (!months.includes(newMonth)) {
      setMonths((prev) => [...prev, newMonth].sort().reverse());
    }
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

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={32} color={Colors.evergreen} />
        </TouchableOpacity>
        <View style={styles.pickerWrapper}>
          <Text style={styles.monthLabel}>
            {selectedMonth
              ? monthData[selectedMonth]?.period
                ? formatDateRange(
                    monthData[selectedMonth]!.period!.startDate,
                    monthData[selectedMonth]!.period!.endDate
                  )
                : formatMonthRange(selectedMonth)
              : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={32} color={Colors.evergreen} />
        </TouchableOpacity>
      </View>
      {selectedMonth && (
        monthData[selectedMonth]?.loading || !chartData ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.moss} />
          </View>
        ) : monthHasPeriod[selectedMonth] === false ? (
          <View style={styles.noPeriodContainer}>
            <Text style={styles.noPeriodText}>Ei luotua budjettijaksoa tälle aikavälille</Text>
          </View>
        ) : (
           <ScrollView contentContainerStyle={styles.listContent}>


              <View style={styles.monthCard}>
                 <Text style={styles.header}>Tulot vs. Menot</Text>
                <ComparisonBars
                  income={chartData.totals.income}
                  expense={chartData.totals.expense}
                  width={screenWidth}
                />

                <Text style={[styles.header, { marginTop: 20 }]}>Menot</Text>
                {monthData[selectedMonth]?.categories.filter(
                  (c) => c.parentId === null && c.type === 'main'
                ).length > 0 && (
                  <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v)}
                    style={styles.picker}
                  >
                       {monthData[selectedMonth]?.categories
                      .filter((c) => c.parentId === null && c.type === 'main')
                      .map((c) => (
                        <Picker.Item key={c.id} label={c.title} value={c.id} />
                      ))}
                  </Picker>
                )}
                {chartData.pieData.length > 0 ? (
               <DonutChart
                    data={chartData.pieData.map((p) => ({
                      label: p.name,
                      value: p.amount,
                      color: p.color,
                    }))}
                    width={screenWidth}
                    
                  />
                ) : (
                    <Text style={styles.noData}>Ei kuluja valitulle kategorialle</Text>
                )}
           </View>
            </ScrollView>
          )
        )}
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
    marginBottom: 12,
  },
  pickerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButton: {
    padding: 8,
  },
 monthLabel: {
    textAlignVertical: 'center',
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    marginTop: 1,
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
   picker: {
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginVertical: 12,
    textAlign: 'center',
  },
  noData: {
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  noPeriodContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  noPeriodText: {
    color: Colors.textPrimary,
    fontSize: 20,
    textAlign: 'center',
  },
});

