import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator
} from 'react-native';
import { ChartDataPoint } from './types';
import { QueryForm } from './components/QueryForm';
import { PerformanceChart } from './components/PerformanceChart';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ErrorDisplay } from './components/ErrorDisplay';
import { useQuery } from './hooks/useQuery';

export default function App(): JSX.Element {
  const {
    inputs,
    loading,
    results,
    error,
    showingDb,
    handleInputChange,
    toggleDb,
    runQuery,
  } = useQuery();

  const currentDb = results[showingDb];

  const chartData: ChartDataPoint[] = [
    { db: 'Postgres', time: results.postgres?.timeTakenMs || 0 },
    { db: 'MariaDB', time: results.mariadb?.timeTakenMs || 0 },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>DB Performance Comparator</Text>

      <QueryForm 
        inputs={inputs}
        onInputChange={handleInputChange}
        onRunQuery={runQuery}
      />

      {loading && <ActivityIndicator size="large" color="blue" style={{ marginVertical: 20 }} />}
      <ErrorDisplay error={error} />

      {results.postgres && results.mariadb && (
        <View>
          <Text style={styles.sectionTitle}>Performance Results</Text>
          <PerformanceChart data={chartData} />
          <ResultsDisplay 
            currentDb={currentDb}
            showingDb={showingDb}
            onToggleDb={toggleDb}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 100,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
}); 