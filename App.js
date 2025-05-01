import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Button, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import axios from 'axios';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryContainer } from 'victory';

// Backend server URL
const API_URL = 'http://localhost:3002';  // Using localhost since server is on same machine

export default function App() {
  const [inputs, setInputs] = useState({ date: '', month: '', domain: '', location: '', limit: '1000' });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ postgres: null, mariadb: null });
  const [error, setError] = useState('');
  const [dbStatus, setDbStatus] = useState(null);

  // Check database status on component mount
  useEffect(() => {
    checkDatabases();
  }, []);

  const checkDatabases = async () => {
    try {
      console.log('Checking database status...');
      const response = await axios.get(`${API_URL}/table-info`);
      console.log('Database status:', response.data);
      setDbStatus(response.data);
    } catch (err) {
      console.error('Database check error:', err);
      setError('Failed to connect to the server. Make sure the server is running and accessible.');
    }
  };

  const handleChange = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    setError(''); // Clear error when user makes changes
  };

  const runQuery = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Running query with inputs:', inputs);

      // Input validation
      if (inputs.month && (isNaN(inputs.month) || inputs.month < 1 || inputs.month > 12)) {
        throw new Error('Month must be a number between 1 and 12');
      }
      if (inputs.limit && (isNaN(inputs.limit) || inputs.limit < 1)) {
        throw new Error('Limit must be a positive number');
      }

      const params = { ...inputs };
      console.log('Sending requests to:', {
        postgres: `${API_URL}/postgres-fetch`,
        mariadb: `${API_URL}/mariadb-fetch`,
        params: params
      });

      // Make the requests one at a time for better error tracking
      console.log('Fetching PostgreSQL data...');
      const pgRes = await axios.get(`${API_URL}/postgres-fetch`, { params });
      console.log('PostgreSQL Response:', {
        status: pgRes.status,
        headers: pgRes.headers,
        data: pgRes.data
      });

      console.log('Fetching MariaDB data...');
      const mariaRes = await axios.get(`${API_URL}/mariadb-fetch`, { params });
      console.log('MariaDB Response:', {
        status: mariaRes.status,
        headers: mariaRes.headers,
        data: mariaRes.data
      });

      if (!pgRes.data || !mariaRes.data) {
        throw new Error('Received empty response from database');
      }

      console.log('Setting results in state:', {
        postgres: pgRes.data,
        mariadb: mariaRes.data
      });

      setResults({
        postgres: pgRes.data,
        mariadb: mariaRes.data
      });
    } catch (err) {
      console.error('Query error:', {
        message: err.message,
        code: err.code,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        } : 'No response'
      });
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message;
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>DB Performance Comparator</Text>

      {/* Debug Information */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text>Has Results: {results.postgres || results.mariadb ? 'Yes' : 'No'}</Text>
        <Text>Loading: {loading ? 'Yes' : 'No'}</Text>
        <Text>Error: {error || 'None'}</Text>
      </View>

      {/* Database Status */}
      {dbStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.subtitle}>Database Status:</Text>
          <Text style={[styles.statusText, { color: dbStatus.postgres?.status === 'connected' ? 'green' : 'red' }]}>
            PostgreSQL: {dbStatus.postgres?.status || 'unknown'}
          </Text>
          <Text style={[styles.statusText, { color: dbStatus.mariadb?.status === 'connected' ? 'green' : 'red' }]}>
            MariaDB: {dbStatus.mariadb?.status || 'unknown'}
          </Text>
        </View>
      )}

      {/* Input Fields */}
      {['date', 'month', 'domain', 'location', 'limit'].map(key => (
        <View key={key} style={styles.inputContainer}>
          <Text style={styles.label}>{key.toUpperCase()}</Text>
          <TextInput
            placeholder={key === 'date' ? 'YYYY-MM-DD' : key.toUpperCase()}
            value={inputs[key]}
            onChangeText={val => handleChange(key, val)}
            style={styles.input}
            keyboardType={key === 'month' || key === 'limit' ? 'numeric' : 'default'}
          />
        </View>
      ))}

      {/* Error Display */}
      {error !== '' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Query Button */}
      <Button 
        title={loading ? "Running Query..." : "Run Query"} 
        onPress={runQuery}
        disabled={loading}
      />

      {/* Loading Indicator */}
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

      {/* Results Display */}
      {(results.postgres || results.mariadb) && (
        <View style={styles.resultsContainer}>
          <Text style={styles.subtitle}>Performance Results</Text>
          
          {/* Results Debug */}
          <View style={styles.debugBox}>
            <Text>PostgreSQL Results Present: {results.postgres ? 'Yes' : 'No'}</Text>
            <Text>MariaDB Results Present: {results.mariadb ? 'Yes' : 'No'}</Text>
            {results.postgres && (
              <Text>PostgreSQL Row Count: {results.postgres.rowCount || 'N/A'}</Text>
            )}
            {results.mariadb && (
              <Text>MariaDB Row Count: {results.mariadb.rowCount || 'N/A'}</Text>
            )}
          </View>

          {/* Performance Chart */}
          {results.postgres && results.mariadb && (
            <View style={styles.chartContainer}>
              <VictoryChart
                width={600}
                height={400}
                domainPadding={{ x: 50 }}
                padding={{ top: 50, bottom: 50, left: 60, right: 60 }}
                containerComponent={<VictoryContainer responsive={false} />}
              >
                <VictoryAxis
                  tickFormat={(t) => t}
                  style={{
                    axis: { stroke: "#333" },
                    ticks: { stroke: "#333" },
                    tickLabels: { fill: "#333", fontSize: 12 }
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => `${t}ms`}
                  style={{
                    axis: { stroke: "#333" },
                    ticks: { stroke: "#333" },
                    tickLabels: { fill: "#333", fontSize: 12 }
                  }}
                />
                <VictoryBar
                  data={[
                    { db: 'Postgres', time: results.postgres.timeTakenMs || 0 },
                    { db: 'MariaDB', time: results.mariadb.timeTakenMs || 0 }
                  ]}
                  x="db"
                  y="time"
                  barWidth={40}
                  style={{
                    data: {
                      fill: "#4287f5"
                    },
                    labels: {
                      fill: "#333",
                      fontSize: 12
                    }
                  }}
                  labels={({ datum }) => `${datum.time}ms`}
                />
              </VictoryChart>
            </View>
          )}

          {/* Detailed Results */}
          {results.postgres && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>PostgreSQL Results</Text>
              <Text>Time: {results.postgres.timeTakenMs || 'N/A'}ms</Text>
              <Text>Rows: {results.postgres.rowCount || 0}</Text>
              <Text style={styles.sampleHeader}>Sample Data:</Text>
              <Text style={styles.sampleData}>
                {results.postgres.data && results.postgres.data.length > 0
                  ? JSON.stringify(results.postgres.data.slice(0, 2), null, 2)
                  : 'No data'}
              </Text>
            </View>
          )}

          {results.mariadb && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>MariaDB Results</Text>
              <Text>Time: {results.mariadb.timeTakenMs || 'N/A'}ms</Text>
              <Text>Rows: {results.mariadb.rowCount || 0}</Text>
              <Text style={styles.sampleHeader}>Sample Data:</Text>
              <Text style={styles.sampleData}>
                {results.mariadb.data && results.mariadb.data.length > 0
                  ? JSON.stringify(results.mariadb.data.slice(0, 2), null, 2)
                  : 'No data'}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sampleHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  sampleData: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugBox: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    ...Platform.select({
      web: {
        maxWidth: 800
      }
    })
  },
}); 