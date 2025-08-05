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
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
import { getIncomes, Income } from '../../src/services/incomes';
import Colors from '../../constants/Colors';
import { Category } from '../../src/services/categories';

export default function HistoriaScreen() {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

    const formatCurrency = (value: number) =>
    value.toLocaleString('fi-FI', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const [months, setMonths] = useState<string[]>([]);
  const [loadingMonths, setLoadingMonths] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<Record<string, { loading: boolean; categories: Category[]; expenses: Record<string, number>; incomes: Income[] }>>({});
  const [chartData, setChartData] = useState<{ pieData: any[]; totals: { income: number; expense: number } } | null>(null);
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null);
  const [monthHasPeriod, setMonthHasPeriod] = useState<Record<string, boolean>>({});
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
    const [openIncomes, setOpenIncomes] = useState<boolean>(false);
  const [openExpenses, setOpenExpenses] = useState<boolean>(false);
   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleCat = (id: string) =>
    setOpenCats((prev) => ({ ...prev, [id]: !prev[id] }));

   const loadMonths = async (active: { current: boolean }) => {
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
  };

  useEffect(() => {
    const active = { current: true };
    loadMonths(active);
    return () => {
      active.current = false;
    };
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      const active = { current: true };
      loadMonths(active);
      return () => {
        active.current = false;
      };
    }, [userId])
  );

  const loadMonthData = async (m: string) => {
    if (!userId) return;

     setMonthData((prev) => ({
      ...prev,
      [m]: { loading: true, categories: [], expenses: {}, incomes: [] },
    }));
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

      

      const hasPeriod = !!period || m === currentPeriodId;
      setMonthHasPeriod((prev) => ({ ...prev, [m]: hasPeriod }));

         setMonthData((prev) => ({
        ...prev,
        [m]: { loading: false, categories: cats, expenses: sums, incomes },
      }));
       if (selectedMonth === m) {
        const mainCats = cats.filter((c) => c.parentId === null);
        setSelectedCategory((prev) =>
          prev && mainCats.some((c) => c.id === prev) ? prev : mainCats[0]?.id || null
        );
      }
    } catch (e) {
      console.error('loadMonthData error:', e);
      setMonthData((prev) => ({
        ...prev,
        [m]: { loading: false, categories: [], expenses: {}, incomes: [] },
      }));
      setMonthHasPeriod((prev) => ({ ...prev, [m]: m === currentPeriodId }));
      if (selectedMonth === m) {
        setChartData({ pieData: [], totals: { income: 0, expense: 0 } });
        setSelectedCategory(null);
      }
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      loadMonthData(selectedMonth);
    }
  }, [selectedMonth, userId]);

   useFocusEffect(
    React.useCallback(() => {
      if (selectedMonth) {
        loadMonthData(selectedMonth);
      }
    }, [selectedMonth, userId])
  );
  
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
        (c) => c.parentId === selectedCategory && !c.title.toLowerCase().includes('yhteensä')
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
                 <Text style={styles.header}>Menot</Text>
                {monthData[selectedMonth]?.categories.filter((c) => c.parentId === null)
                  .length > 0 && (
                  <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v)}
                    style={styles.picker}
                  >
                    {monthData[selectedMonth]?.categories
                      .filter((c) => c.parentId === null)
                      .map((c) => (
                        <Picker.Item key={c.id} label={c.title} value={c.id} />
                      ))}
                  </Picker>
                )}
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
                  <Text style={styles.noData}>Ei kuluja valitulle kategorialle</Text>
                )}

                <Text style={[styles.header, { marginTop: 20 }]}>Tulot vs. Menot</Text>
                <BarChart
                  data={{
                    labels: ['Tulot', 'Menot'],
                    datasets: [
                      {
                        data: [chartData.totals.income, chartData.totals.expense],
                      },
                    ],
                  }}
                  width={screenWidth}
                  height={200}
                  chartConfig={chartConfig}
                   fromZero
                  style={{ alignSelf: 'center' }}
                  yAxisLabel={''}
                  yAxisSuffix={''}
                />
             

               <TouchableOpacity
                onPress={() => setOpenIncomes((o) => !o)}
                style={styles.summaryHeader}
              >
                <Text style={styles.catTitle}>Tulot yhteensä</Text>
                <Text style={styles.catAmount}>
                  {formatCurrency(chartData.totals.income)} €
                </Text>
              </TouchableOpacity>
              {openIncomes && (
                <View style={styles.monthContent}>
                  {monthData[selectedMonth]?.incomes.map((inc) => (
                    <View key={inc.id} style={styles.subRow}>
                      <Text style={styles.subTitle}>{inc.title}</Text>
                      <Text style={styles.subAmount}>{formatCurrency(inc.amount)} €</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setOpenExpenses((o) => !o)}
                style={[styles.summaryHeader, { marginTop: 16 }]}
              >
                <Text style={styles.catTitle}>Menot yhteensä</Text>
                <Text style={styles.catAmount}>
                  {formatCurrency(chartData.totals.expense)} €
                </Text>
              </TouchableOpacity>
              {openExpenses && (
                <View style={styles.monthContent}>
                  {monthData[selectedMonth]?.categories
                    .filter((c) => c.parentId === null)
                    .map((main) => {
                      const subs = monthData[selectedMonth]?.categories.filter(
                        (c) => c.parentId === main.id
                      );
                      const totalRow = subs.find((s) =>
                        s.title.toLowerCase().includes('yhteensä')
                      );
                      let totalExpense = totalRow
                        ? monthData[selectedMonth]?.expenses[totalRow.id] || 0
                        : monthData[selectedMonth]?.expenses[main.id] || 0;
                      if (!totalRow) {
                        subs.forEach((s) => {
                          totalExpense +=
                            monthData[selectedMonth]?.expenses[s.id] || 0;
                        });
                      }
                      return (
                        <View key={main.id} style={styles.catRow}>
                          <TouchableOpacity
                            onPress={() => toggleCat(main.id)}
                            style={styles.catHeader}
                          >
                            <Text style={styles.catTitle}>{`${main.title} yhteensä`}</Text>
                            <Text style={styles.catAmount}>
                              {formatCurrency(totalExpense)} €
                            </Text>
                          </TouchableOpacity>
                          {openCats[main.id] &&
                            subs
                              .filter((s) => !s.title.toLowerCase().includes('yhteensä'))
                              .map((sub) => (
                                <View key={sub.id} style={styles.subRow}>
                                  <Text style={styles.subTitle}>{sub.title}</Text>
                                  <Text style={styles.subAmount}>
                                    {formatCurrency(
                                      monthData[selectedMonth]?.expenses[sub.id] || 0
                                    )} €
                                  </Text>
                                </View>
                              ))}
                        </View>
                      );
                    })}
                </View>
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
  monthContent: {
    marginTop: 8,
  },
  catRow: {
     backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  subTitle: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  subAmount: {
    fontSize: 15,
    color: Colors.textSecondary,
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

