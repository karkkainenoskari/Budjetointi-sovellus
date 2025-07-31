import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../src/api/firebaseConfig';
import {
  getHistoryMonths,
  getHistoryCategories,
} from '../../src/services/history';
import {

  getCurrentBudgetPeriod,
  getBudgetPeriodFromHistory,
} from '../../src/services/budget';
import {
  formatMonthRange,
  generateMonthRange,
  nextMonthId,
  prevMonthId,
} from '@/src/utils';
import { getExpensesByPeriod, Expense } from '../../src/services/expenses';
import { getIncomes } from '../../src/services/incomes';
import Colors from '../../constants/Colors';
import { Category } from '../../src/services/categories';

export default function HistoriaScreen() {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [months, setMonths] = useState<string[]>([]);
  const [loadingMonths, setLoadingMonths] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<Record<string, { loading: boolean; categories: Category[]; expenses: Record<string, number> }>>({});
  const [chartData, setChartData] = useState<{ pieData: any[]; totals: { income: number; expense: number } } | null>(null);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);
  const [monthHasPeriod, setMonthHasPeriod] = useState<Record<string, boolean>>({});

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
        if (m.length > 0) {
          const filled = generateMonthRange(m[0], m[m.length - 1]);
          setMonths(filled);
          setSelectedMonth(filled[0]);
        } else {
          setMonths([]);
          setSelectedMonth(null);
        }
      })
      .catch((e) => console.error('getHistoryMonths error:', e))
      .finally(() => setLoadingMonths(false));
  }, [userId]);

  const loadMonthData = async (m: string) => {
    if (!userId) return;

    setMonthData((prev) => ({ ...prev, [m]: { loading: true, categories: [], expenses: {} } }));
    try {
      const [cats, incomes, period] = await Promise.all([
        getHistoryCategories(userId, m),
        getIncomes(userId),
        getBudgetPeriodFromHistory(userId, m),
      ]);
      const [year, month] = m.split('-').map((x) => parseInt(x, 10));
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      const expenses = await getExpensesByPeriod(userId, start, end);
      const sums: Record<string, number> = {};
      expenses.forEach((exp: Expense) => {
        sums[exp.categoryId] = (sums[exp.categoryId] || 0) + exp.amount;
      });

      const colors = [
        Colors.evergreen,
        Colors.moss,
        '#FF9F1C',
        '#E71D36',
        '#2EC4B6',
        '#FFBF69',
      ];
      let colorIndex = 0;
      const pie = cats
        .filter((c) => sums[c.id])
        .map((c) => {
          const color = colors[colorIndex % colors.length];
          colorIndex += 1;
          return {
            name: c.title,
            amount: sums[c.id],
            color,
            legendFontColor: Colors.textPrimary,
            legendFontSize: 12,
          };
        });
      const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

      const hasPeriod = !!period || m === currentPeriodId;
      setMonthHasPeriod((prev) => ({ ...prev, [m]: hasPeriod }));

      setMonthData((prev) => ({ ...prev, [m]: { loading: false, categories: cats, expenses: sums } }));
      if (selectedMonth === m) setChartData({ pieData: pie, totals: { income: totalIncome, expense: totalExpense } });
    } catch (e) {
      console.error('loadMonthData error:', e);
      setMonthData((prev) => ({ ...prev, [m]: { loading: false, categories: [], expenses: {} } }));
      setMonthHasPeriod((prev) => ({ ...prev, [m]: m === currentPeriodId }));
      if (selectedMonth === m) setChartData({ pieData: [], totals: { income: 0, expense: 0 } });
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      loadMonthData(selectedMonth);
    }
  }, [selectedMonth, userId]);

  const changeMonth = (dir: number) => {
    if (!selectedMonth) return;
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
  const chartConfig = {
    backgroundColor: Colors.background,
    backgroundGradientFrom: Colors.background,
    backgroundGradientTo: Colors.background,
    color: () => Colors.moss,
    labelColor: () => Colors.textPrimary,
    decimalPlaces: 2,
  } as const;
  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={32} color={Colors.evergreen} />
        </TouchableOpacity>
        <View style={styles.pickerWrapper}>
          <Text style={styles.monthLabel}>
            {selectedMonth ? formatMonthRange(selectedMonth) : ''}
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
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>{formatMonthRange(selectedMonth)}</Text>
              </View>

              <Text style={styles.header}>Menot kategorioittain</Text>
              {chartData.pieData.length > 0 ? (
                <PieChart
                  data={chartData.pieData as any}
                  width={screenWidth}
                  height={220}
                  accessor="amount"
                  chartConfig={chartConfig}
                  paddingLeft="0"
                  absolute
                  backgroundColor="transparent"
                  style={{ alignSelf: 'center' }}
                />
              ) : (
                <Text style={styles.noData}>Ei kuluja tältä jaksolta</Text>
              )}

              <Text style={[styles.header, { marginTop: 24 }]}>Tulot vs. Menot</Text>
              <BarChart
                data={{
                  labels: ['Tulot', 'Menot'],
                  datasets: [{ data: [chartData.totals.income, chartData.totals.expense] }],
                }}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                fromZero
                style={{ alignSelf: 'center' }}
                yAxisLabel={''}
                yAxisSuffix={''}
              />

              <View style={styles.monthContent}>
                {monthData[selectedMonth]?.categories.map((cat) => (
                  <View key={cat.id} style={styles.catRow}>
                    <Text style={styles.catTitle}>{cat.title}</Text>
                    <Text style={styles.catAmount}>
                      {monthData[selectedMonth]?.expenses[cat.id] || 0} / {cat.allocated} €
                   </Text>
                </View>
              ))}
            </View>
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
    height: 50,
    textAlignVertical: 'center',
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
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

