import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

type PortSelectionOverlayProps = {
  selectedPort: number;
  onConfirm: () => void;
  ioType: string;
  ioMac: string;
};

export default function PortSelectionOverlay({ selectedPort, onConfirm, ioType, ioMac }: PortSelectionOverlayProps) {
  if (!selectedPort) return null;

  const handleConfirmSelection = () => {
    router.push({
      pathname: '/connectivity/network-map',
      params: {
        type: 'IO',
        io_mac: ioMac,
        io_port: selectedPort.toString(),
      },
    });
  };

  return (
    <View style={styles.overlay}>
      <Text style={styles.portText}>Port: {selectedPort}</Text>
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSelection}>
        <Text style={styles.buttonText}>Confirm selection</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  portText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: '#F7A800',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 2,
    minWidth: 160,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 