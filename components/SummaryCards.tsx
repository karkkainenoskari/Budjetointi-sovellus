import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

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
      </View>
      <View style={[styles.card, { backgroundColor: Colors.danger }]}>
        <Text style={styles.label}>Menot yhteensä</Text>
        <Text style={styles.value}>{fmt(expense)} €</Text>
      </View>
      <View
        style={[
          styles.card,
          { backgroundColor: balance >= 0 ? Colors.success : Colors.danger }
        ]}
      >
        <Text style={styles.label}>Saldo</Text>
        <Text style={styles.value}>{fmt(balance)} €</Text>
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
    borderRadius: 8,
    alignItems: 'center',
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