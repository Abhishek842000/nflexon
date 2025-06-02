import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { QueryResult, DatabaseType } from '../types';

interface ResultsDisplayProps {
  currentDb: QueryResult | null;
  showingDb: DatabaseType;
  onToggleDb: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  currentDb,
  showingDb,
  onToggleDb,
}) => {
  if (!currentDb) return null;

  return (
    <View style={styles.container}>
      <Button 
        title={`Switch to ${showingDb === 'postgres' ? 'MariaDB' : 'PostgreSQL'}`}
        onPress={onToggleDb}
      />

      <View style={styles.resultBox}>
        <Text style={styles.resultTitle}>
          {showingDb === 'postgres' ? 'PostgreSQL' : 'MariaDB'} Results
        </Text>
        <Text>Time: {currentDb.timeTakenMs} ms</Text>
        <Text>Rows: {currentDb.rowCount}</Text>
        <Text>Sample: {JSON.stringify(currentDb.data.slice(0, 3), null, 2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },
  resultBox: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    borderRadius: 6,
  },
  resultTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
}); 