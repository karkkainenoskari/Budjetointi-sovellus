import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { auth } from '../../src/api/firebaseConfig';
import { getCurrentBudgetPeriod } from '../../src/services/budget';
import { getExpensesByPeriod } from '../../src/services/expenses';
import { getIncomes } from '../../src/services/incomes';
import { getCategories, Category } from '../../src/services/categories';
import Colors from '../../constants/Colors';

export default function TilastotScreen() {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [loading, setLoading] = useState(true);
  const [pieData, setPieData] = useState<any[]>([]);
  const [totals, setTotals] = useState<{ income: number; expense: number }>({ income: 0, expense: 0 });

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const period = await getCurrentBudgetPeriod(userId);
        if (!period) {
          setPieData([]);
          setTotals({ income: 0, expense: 0 });
          return;
        }
        const [expenses, cats, incs] = await Promise.all([
          getExpensesByPeriod(userId, period.startDate.toDate(), period.endDate.toDate()),
          getCategories(userId),
          getIncomes(userId),
        ]);
        const sums: Record<string, number> = {};
        expenses.forEach((e) => {
          sums[e.categoryId] = (sums[e.categoryId] || 0) + e.amount;
        });
        const colors = [Colors.evergreen, Colors.moss, '#FF9F1C', '#E71D36', '#2EC4B6', '#FFBF69'];
        let colorIndex = 0;
        const pData = cats
          .filter((c: Category) => sums[c.id])
          .map((c: Category) => {
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
        const totalIncome = incs.reduce((sum, i) => sum + i.amount, 0);
        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
        setPieData(pData);
        setTotals({ income: totalIncome, expense: totalExpense });
      } catch (e) {
        console.error('tilastot load error', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  if (!userId) {
    return (
      <View style={styles.centered}> 
        <Text style={{ color: Colors.textPrimary }}>Kirjaudu sisään.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.header}>Menot kategorioittain</Text>
      {pieData.length > 0 ? (
        <PieChart
                   data={pieData as any}
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
                  datasets: [{ data: [totals.income, totals.expense] }],
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              fromZero
              style={{ alignSelf: 'center' }} yAxisLabel={''} yAxisSuffix={''}      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginVertical: 12, textAlign: 'center' },
  noData: { color: Colors.textPrimary, textAlign: 'center' },
});