import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PortIndicatorProps {
  portNumber: number;
  position: { x: number; y: number };
  isConnected?: boolean;
}

export default function PortIndicator({ portNumber, position, isConnected }: PortIndicatorProps) {
  return (
    <View
      style={[
        styles.portIndicator,
        {
          left: position.x,
          top: position.y,
          backgroundColor: isConnected ? '#F7A800' : '#E5E7EB',
        },
      ]}
    >
      <Text style={styles.portNumber}>{portNumber}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  portIndicator: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  portNumber: {
    color: '#222',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 