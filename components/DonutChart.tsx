import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryPie } from 'victory-native';
import Colors from '../constants/Colors';

type Item = { label: string; value: number; color: string };
export default function DonutChart({
  data,
  width,
  height = 240,
  centerLabel = 'Yhteensä',
}: { data: Item[]; width: number; height?: number; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <View style={{ width, alignSelf: 'center' }}>
      <View style={{ height, justifyContent: 'center' }}>
        <VictoryPie
          data={data.map(d => ({ x: d.label, y: d.value }))}
          width={width}
          height={height}
          innerRadius={70}
          padAngle={2}
          cornerRadius={10}
          colorScale={data.map(d => d.color)}
          labels={() => null}
          animate={{ duration: 600, easing: 'exp' }}
        />
        <View style={StyleSheet.absoluteFillObject as any}>
          <View style={styles.center}>
            <Text style={styles.centerTitle}>{centerLabel}</Text>
            <Text style={styles.centerValue}>
              {total.toLocaleString('fi-FI', { minimumFractionDigits: 2 })} €
            </Text>
          </View>
        </View>
      </View>

      {/* legenda */}
      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.label} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>{d.label}</Text>
            <Text style={styles.legendAmount}>
              {d.value.toLocaleString('fi-FI', { minimumFractionDigits: 2 })} €
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  centerTitle: { color: Colors.textSecondary, fontSize: 12 },
  centerValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  legend: { marginTop: 10, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: { color: Colors.textPrimary, flex: 1 },
  legendAmount: { color: Colors.textSecondary },
});