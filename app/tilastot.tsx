import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import DonutChart from '../components/DonutChart';
import ComparisonBars from '../components/ComparisonBars';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, firestore } from '../src/api/firebaseConfig';
import { getCurrentBudgetPeriod } from '../src/services/budget';
import { getCategories, Category } from '../src/services/categories';
import Colors from '../constants/Colors';

export default function TilastotScreen() {
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  const [loading, setLoading] = useState(true);
  const [pieData, setPieData] = useState<any[]>([]);
  const [totals, setTotals] = useState<{ income: number; expense: number }>({
    income: 0,
    expense: 0,
  });

  useEffect(() => {
     if (!userId) return;
    let unsubscribeExpenses: (() => void) | undefined;
    let unsubscribeIncomes: (() => void) | undefined
    const loadData = async () => {
      setLoading(true);
      try {
        const period = await getCurrentBudgetPeriod(userId);
        
       const cats = await getCategories(userId);
        const colors = [
          Colors.evergreen,
          Colors.moss,
          '#FF9F1C',
          '#E71D36',
          '#2EC4B6',
          '#FFBF69',
        ];

        const expRef = collection(firestore, 'budjetit', userId, 'expenses');
        const expQuery = period
          ? query(
              expRef,
              where('date', '>=', period.startDate.toDate()),
              where('date', '<=', period.endDate.toDate())
            )
          : expRef;
        unsubscribeExpenses = onSnapshot(expQuery, (snapshot) => {
          const sums: Record<string, number> = {};
          let totalExpense = 0;
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            sums[data.categoryId] = (sums[data.categoryId] || 0) + data.amount;
            totalExpense += data.amount;
          });

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
          setPieData(pData);
          setTotals((prev) => ({ ...prev, expense: totalExpense }));
        });

        const incRef = collection(firestore, 'budjetit', userId, 'incomes');
           const incQuery = period
          ? query(
              incRef,
               where('createdAt', '>=', period.startDate.toDate()),
              where('createdAt', '<=', period.endDate.toDate())
            )
          : incRef;
        unsubscribeIncomes = onSnapshot(incQuery, (snapshot) => {
          const totalIncome = snapshot.docs.reduce(
            (sum, d) => sum + ((d.data() as any).amount || 0),
            0
          );
          setTotals((prev) => ({ ...prev, income: totalIncome }));
        });
      } catch (e) {
        console.error('tilastot load error', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
     return () => {
      if (unsubscribeExpenses) unsubscribeExpenses();
      if (unsubscribeIncomes) unsubscribeIncomes();
    };
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
 

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.header}>Menot kategorioittain</Text>
      {pieData.length > 0 ? (
       <DonutChart
          data={pieData.map(p => ({ label: p.name, value: p.amount, color: p.color }))}
          width={screenWidth}
        />
      ) : (
        <Text style={styles.noData}>Ei kuluja tältä jaksolta</Text>
      )}

      <Text style={[styles.header, { marginTop: 24 }]}>Tulot vs. Menot</Text>
      <ComparisonBars
        income={totals.income}
        expense={totals.expense}
        width={screenWidth}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginVertical: 12, textAlign: 'center' },
  noData: { color: Colors.textPrimary, textAlign: 'center' },
});