import React from 'react';
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLabel
} from 'victory-native';
import Colors from '../constants/Colors';

const INCOME_COLOR = Colors.moss;
const EXPENSE_COLOR = Colors.danger;

export default function ComparisonBars({
income,
  expense,
  width,
  height = 220
}: {
  income: number;
  expense: number;
  width: number;
  height?: number;
}) {
  const maxValue = Math.max(income, expense);
  const tickCount = 6;
  const step = Math.ceil(maxValue / (tickCount - 1)) || 1;
  const ticks = Array.from({ length: tickCount }, (_, i) => i * step);
  const data = [
 { x: 'Tulot', y: income, type: 'income' },
    { x: 'Menot', y: expense, type: 'expense' },
  ];
 const fmt = (v: number) =>
    v.toLocaleString('fi-FI', { maximumFractionDigits: 0 });

  return (
  <VictoryChart
      width={width}
      height={height}
      domainPadding={{ x: 50, y: 14 }}
      domain={{ y: [0, ticks[ticks.length - 1]] }}
      animate={{ duration: 600, easing: 'exp' }}
      style={{ background: { fill: Colors.cardBackground } }}
    >
      <VictoryAxis
        style={{
          axis: { stroke: 'transparent' },
          tickLabels: {
            fill: Colors.textPrimary,
            fontSize: 13,
            fontWeight: '600'
          }
        }}
      />
      <VictoryAxis
        dependentAxis
        tickValues={ticks}
        tickFormat={(t) => `${fmt(t)} €`}
        style={{
          grid: { stroke: Colors.sageHint },
          axis: { stroke: 'transparent' },
          tickLabels: { fill: Colors.textSecondary, fontSize: 10 }
        }}
      />
      <VictoryBar
        data={data}
        labels={({ datum }) => `${fmt(datum.y)} €`}
         labelComponent={
          <VictoryLabel
             dy={({ datum }) => (datum.y === 0 ? 16 : -8)}
            style={{
              fill: Colors.textPrimary,
              fontSize: 12,
              fontWeight: '600'
            }}
          />
        }
        style={{
         data: {
            fill: ({ datum }) =>
              datum.type === 'income' ? INCOME_COLOR : EXPENSE_COLOR,
            width: 36,
            borderRadius: 8
          }
        }}
      />
    </VictoryChart>
  );
}