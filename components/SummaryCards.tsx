import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import AnimatedProgressBar from './AnimatedProgressBar';

export default function SummaryCards({
  income,
  expense
}: {
  income: number;
  expense: number;
}) {
  const balance = income - expense;
  const fmt = (v: number) => v.toLocaleString('fi-FI', { maximumFractionDigits: 0 });

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: Colors.success }]}>
        <Text style={styles.label}>Tulot yhteensä</Text>
        <Text style={styles.value}>{fmt(income)} €</Text>
         <AnimatedProgressBar progress={1} />
      </View>
      <View style={[styles.card, { backgroundColor: Colors.danger }]}>
        <Text style={styles.label}>Menot yhteensä</Text>
        <Text style={styles.value}>{fmt(expense)} €</Text>
        <AnimatedProgressBar
          progress={income > 0 ? Math.min(expense / income, 1) : 0}
        />
      </View>
      <View
        style={[
          styles.card,
          { backgroundColor: balance >= 0 ? Colors.success : Colors.danger }
        ]}
      >
        <Text style={styles.label}>Saldo</Text>
        <Text style={styles.value}>{fmt(balance)} €</Text>
         <AnimatedProgressBar
          progress={income > 0 ? Math.min(Math.max(balance / income, 0), 1) : 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
     paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
});