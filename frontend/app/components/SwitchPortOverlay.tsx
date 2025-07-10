import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Image, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SwitchPortOverlayProps {
  imageUri: string;
  selectedPort?: number;
  onPortPress?: (port: number) => void;
  tappablePorts?: number[];
}

const PORTS_PER_ROW = 24;
const ROWS = 2;
const TOTAL_PORTS = 48;

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const imageWidth = windowWidth * 4; // Should match SwitchOverlay
const imageHeight = windowWidth * 4 * (110/900); // Use the image's aspect ratio (height/width)

const PORT_WIDTH = 32; // px, adjust as needed
const PORT_HEIGHT = 32; // px, adjust as needed
const PORT_SPACING_X = ((imageWidth - PORTS_PER_ROW * PORT_WIDTH) / (PORTS_PER_ROW + 1)) / 1.9;
const PORT_SPACING_Y = ((imageHeight - ROWS * PORT_HEIGHT) / (ROWS + 1)) / 2.2;
const PORT_OFFSET_X = 73; // px, move overlays right
const PORT_OFFSET_Y = 43; // px, move overlays down
const GROUP_SPACING_FACTOR = 1.4; // Increase for more space between sets of 6 ports

export default function SwitchPortOverlay({ imageUri, selectedPort, onPortPress, tappablePorts = [] }: SwitchPortOverlayProps) {
  return (
    <View style={{ width: imageWidth, height: imageHeight }}>
      <Image
        source={{ uri: imageUri }}
        style={{ width: imageWidth, height: imageHeight, position: 'absolute', top: 0, left: 0 }}
        resizeMode="contain"
      />
      {Array.from({ length: TOTAL_PORTS }).map((_, i) => {
        const portNum = i + 1;
        const isTappable = tappablePorts.includes(portNum);
        const row = Math.floor(i / PORTS_PER_ROW);
        const col = i % PORTS_PER_ROW;
        // Calculate extra spacing after every 6th, 12th, and 18th port in a row
        let extraSpacing = 0;
        if (col > 0) {
          extraSpacing += Math.floor(col / 6) * PORT_SPACING_X * GROUP_SPACING_FACTOR;
        }
        const left = PORT_OFFSET_X + PORT_SPACING_X + col * (PORT_WIDTH + PORT_SPACING_X) + extraSpacing;
        const top = PORT_OFFSET_Y + PORT_SPACING_Y + row * (PORT_HEIGHT + PORT_SPACING_Y);
        const isSelected = selectedPort === portNum;
        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.port,
              {
                left,
                top,
                backgroundColor: isSelected ? '#00C853' : isTappable ? 'rgba(255,255,255,0.25)' : 'rgba(100,100,100,0.15)',
                borderColor: isSelected ? '#00C853' : isTappable ? '#fff' : '#888',
                opacity: isTappable ? 1 : 0.4,
              },
            ]}
            activeOpacity={isTappable ? 0.7 : 1}
            onPress={() => isTappable && onPortPress && onPortPress(portNum)}
            disabled={!isTappable}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  port: {
    position: 'absolute',
    width: PORT_WIDTH,
    height: PORT_HEIGHT,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 10,
  },
}); 