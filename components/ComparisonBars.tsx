import React from 'react';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryLabel } from 'victory-native';
import Colors from '../constants/Colors';

const INCOME_COLOR = Colors.moss;
const EXPENSE_COLOR = '#E71D36'; // sama sävy kuin nykyisessä paletissa

export default function ComparisonBars({
  income, expense, width, height = 220
}: { income: number; expense: number; width: number; height?: number }) {
  const data = [
    { x: 'Tulot', y: income, fill: INCOME_COLOR },
    { x: 'Menot', y: expense, fill: EXPENSE_COLOR },
  ];
  const fmt = (v:number) => v.toLocaleString('fi-FI', { maximumFractionDigits: 0 });

  return (
    <VictoryChart width={width} height={height} domainPadding={{ x: 50, y: 14 }}
      animate={{ duration: 600, easing: 'exp' }}>
      <VictoryAxis style={{
        axis: { stroke: 'transparent' },
        tickLabels: { fill: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
      }}/>
      <VictoryAxis dependentAxis tickFormat={t => fmt(t)}
        style={{
          grid: { stroke: Colors.border, strokeDasharray: '4,6' },
          axis: { stroke: 'transparent' },
          tickLabels: { fill: Colors.textSecondary, fontSize: 10 },
        }}/>
      <VictoryBar
        data={data}
        labels={({ datum }) => `${fmt(datum.y)} €`}
        labelComponent={<VictoryLabel dy={-8} style={{ fill: Colors.textPrimary, fontSize: 12, fontWeight: '600' }} />}
        style={{
          data: { fill: ({ datum }) => (datum as any).fill, width: 36, borderRadius: 12 },
        }}
      />
    </VictoryChart>
  );
}