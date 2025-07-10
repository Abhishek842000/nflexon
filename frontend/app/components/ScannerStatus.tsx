import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const WINDOW_SIZE = 300;

interface ScannerStatusProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function ScannerStatus({ loading, error, onRetry }: ScannerStatusProps) {
  const centerY = (height - WINDOW_SIZE) / 2;

  if (!loading && !error) return null;

  return (
    <View style={[styles.container, { top: centerY + WINDOW_SIZE + 24 }]}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#F7A800" />
          <Text style={styles.loadingText}>Checking QR...</Text>
        </>
      ) : error && (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    color: '#222',
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#FFC72C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#222',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 