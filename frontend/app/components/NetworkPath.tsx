import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';

interface NetworkPathProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  strokeWidth?: number;
}

export default function NetworkPath({
  startX,
  startY,
  endX,
  endY,
  color = '#F7A800',
  strokeWidth = 2,
}: NetworkPathProps) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill}>
        <Line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </Svg>
    </View>
  );
} 