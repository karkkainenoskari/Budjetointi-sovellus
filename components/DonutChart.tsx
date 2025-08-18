import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryPie } from 'victory-native';
import Svg from 'react-native-svg';
import Colors from '../constants/Colors';

type Item = { label: string; value: number; color: string };
export default function DonutChart({
  data,
  width,
  height = 240,
  centerLabel = 'Yhteensä',
}: { data: Item[]; width: number; height?: number; centerLabel?: string }) {
    const fmt = (v: number) =>
    v.toLocaleString('fi-FI', { maximumFractionDigits: 0 });
  const total = data.reduce((s, d) => s + d.value, 0);
 const hasData = data.some((d) => d.value > 0);
  const pieData = hasData
    ? data.map((d) => ({ x: d.label, y: d.value }))
    : [{ x: '', y: 1 }];
  const colors = hasData ? data.map((d) => d.color) : [Colors.border];
  return (
    <View style={{ width, alignSelf: 'center' }}>
      <View style={{ height, justifyContent: 'center' }}>
        <Svg width={width} height={height}>
          <VictoryPie
            standalone={false}
            data={pieData}
            width={width}
            height={height}
            innerRadius={70}
            padAngle={2}
            cornerRadius={10}
            colorScale={colors}
         labels={({ datum }) =>
              hasData && datum.y > 0 ? `${fmt(datum.y)} €` : ''
            }
            labelRadius={Math.min(width, height) / 2 - 30}
            style={{
              labels: {
                fill: Colors.textPrimary,
                fontSize: 12,
                fontWeight: '600',
              },
            }}
            animate={{ duration: 600, easing: 'exp' }}
          />
        </Svg>
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
            <Text style={styles.legendText}>
              {d.label}: {fmt(d.value)} €
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
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
 legendText: { color: Colors.textPrimary },
});