import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VictoryBar, VictoryChart, VictoryTheme } from 'victory-native';
import { ChartDataPoint } from '../types';

interface PerformanceChartProps {
  data: ChartDataPoint[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  return (
    <View style={styles.chartContainer}>
      <VictoryChart domainPadding={20} theme={VictoryTheme.material}>
        <VictoryBar
          data={data}
          x="db"
          y="time"
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 20,
  },
}); 