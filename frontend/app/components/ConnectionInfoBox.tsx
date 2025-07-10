import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConnectionInfoBoxProps {
  ru: string;
  ppPort: number;
  ioPort: number;
}

export default function ConnectionInfoBox({ ru, ppPort, ioPort }: ConnectionInfoBoxProps) {
  return (
    <View style={styles.connectionBox}>
      <Text style={styles.connectionText}>
        <Text style={styles.label}>Patch Panel - RU:</Text> {ru}, <Text style={styles.label}>Port:</Text> {ppPort}
      </Text>
      <Text style={styles.connectionText}>
        <Text style={styles.label}>IO - Port:</Text> {ioPort}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  connectionBox: {
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    width: '90%',
    alignSelf: 'center',
  },
  connectionText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  label: {
    fontWeight: 'bold',
  },
}); 