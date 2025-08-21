import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VictoryPie } from 'victory-native';
import Svg from 'react-native-svg';
import Colors from '../constants/Colors';

type Item = { id?: string; label: string; value: number; color: string };
export default function DonutChart({
  data,
  width,
  height = 240,
  centerLabel = 'Yhteensä',
 onSlicePress,
  onCenterPress,
}: {
  data: Item[];
  width: number;
  height?: number;
  centerLabel?: string;
  onSlicePress?: (item: Item) => void;
  onCenterPress?: () => void;
}) {
  const fmt = (v: number) =>
    v.toLocaleString('fi-FI', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const total = data.reduce((s, d) => s + d.value, 0);
 const hasData = data.some((d) => d.value > 0);
  const pieData = hasData
     ? data.map((d) => ({ x: d.label, y: d.value, _id: d.id }))
    : [{ x: '', y: 1, _id: undefined }];
  const colors = hasData ? data.map((d) => d.color) : [Colors.border];
   const pieKey = data.map((d) => d.id ?? d.label).join('-');
  return (
    <View style={{ width, alignSelf: 'center' }}>
      <View style={{ height, justifyContent: 'center' }}>
        <Svg width={width} height={height}>
          <VictoryPie
           key={pieKey}
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
            events=
              {onSlicePress
                ? [
                    {
                      target: 'data',
                      eventHandlers: {
                        onPressIn: (_evt, props) => {
                           const id = (props.datum as any)._id as string | undefined;
                          const item = id
                            ? data.find((d) => d.id === id)
                            : undefined;
                          if (item) onSlicePress(item);
                          return undefined as any;
                        },
                      },
                    },
                  ]
                : undefined}
          />
        </Svg>
        <View style={StyleSheet.absoluteFillObject as any}>
           <TouchableOpacity
            style={styles.center}
            activeOpacity={onCenterPress ? 0.7 : 1}
            onPress={onCenterPress}
          >
            <Text style={styles.centerTitle}>{centerLabel}</Text>
            <Text style={styles.centerValue}>
              {total.toLocaleString('fi-FI', { minimumFractionDigits: 2 })} €
            </Text>
           </TouchableOpacity>
        </View>
      </View>

      {/* legenda */}
      <View style={styles.legend}>
        {data.map((d) => (
          <TouchableOpacity
             key={d.id ?? d.label}
            style={styles.legendRow}
            activeOpacity={onSlicePress ? 0.7 : 1}
            onPress={() => onSlicePress && onSlicePress(d)}
            disabled={!onSlicePress}
          >
            <View style={[styles.swatch, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>
              {d.label}: {fmt(d.value)} €
            </Text>
           </TouchableOpacity>
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