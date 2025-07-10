import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

// Config for each IO type: positions (as fractions) and port size (in px)
const IO_OVERLAY_CONFIG: {
  [key: string]: {
    portPositions: { x: number; y: number }[];
    portSize: number;
    imageWidth: number;
    imageHeight: number;
  };
} = {
  FP2: {
    portPositions: [
      { x: 0.5, y: 0.32 },
      { x: 0.5, y: 0.62 },
    ],
    portSize: 50,
    imageWidth: Dimensions.get('window').width * 0.7,
    imageHeight: Dimensions.get('window').width * 1.1,
  },
  FP4: {
    portPositions: [
      { x: 0.34, y: 0.395 },
      { x: 0.66, y: 0.395 },
      { x: 0.345, y: 0.605 },
      { x: 0.665, y: 0.605 },
    ],
    portSize: 54,
    imageWidth: Dimensions.get('window').width * 0.7,
    imageHeight: Dimensions.get('window').width * 1.1,
  },
  FP6: {
    portPositions: [
      { x: 0.34, y: 0.315 },
      { x: 0.66, y: 0.315 },
      { x: 0.34, y: 0.50 },
      { x: 0.66, y: 0.50 },
      { x: 0.34, y: 0.685 },
      { x: 0.66, y: 0.685 },
    ],
    portSize: 53,
    imageWidth: Dimensions.get('window').width * 0.7,
    imageHeight: Dimensions.get('window').width * 1.1,
  },
  SB1: {
    portPositions: [
      { x: 0.5, y: 0.5 },
    ],
    portSize: 44,
    imageWidth: Dimensions.get('window').width * 0.75,
    imageHeight: Dimensions.get('window').width * 1.2,
  },
  SB2: {
    portPositions: [
      { x: 0.32, y: 0.5 },
      { x: 0.68, y: 0.5 },
    ],
    portSize: 50,
    imageWidth: Dimensions.get('window').width * 0.75,
    imageHeight: Dimensions.get('window').width * 1.2,
  },
  SB4: {
    portPositions: [
      { x: 0.195, y: 0.4975 },
      { x: 0.405, y: 0.4975 },
      { x: 0.595, y: 0.4975 },
      { x: 0.805, y: 0.4975 },
    ],
    portSize: 30,
    imageWidth: Dimensions.get('window').width * 0.75,
    imageHeight: Dimensions.get('window').width * 1.2,
  },
};

type IOOverlayProps = {
  imageUri: string;
  ioType: string;
  activePorts: number[];
  selectedPort: number | null;
  onPortPress: (port: number) => void;
  portColorMap?: Record<number, string>;
  customPortSize?: number;
  customPortPositions?: { x: number; y: number }[];
};

export default function IOOverlay({ imageUri, ioType, activePorts, selectedPort, onPortPress, portColorMap, customPortSize, customPortPositions }: IOOverlayProps) {
  const config = IO_OVERLAY_CONFIG[ioType];
  if (!config) return null;
  const { portPositions, portSize, imageWidth, imageHeight } = config;
  
  // Use custom port size if provided, otherwise use default from config
  const finalPortSize = customPortSize || portSize;
  
  // Use custom port positions if provided, otherwise use default from config
  const finalPortPositions = customPortPositions || portPositions;

  return (
    <View style={{ width: imageWidth, height: imageHeight, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={{ uri: imageUri }}
        style={{ width: imageWidth, height: imageHeight, position: 'absolute', left: 0, top: 0, zIndex: 1 }}
        resizeMode="contain"
      />
      {finalPortPositions.map((pos, idx) => {
        const portNum = idx + 1;
        const isActive = activePorts.includes(portNum);
        const isSelected = selectedPort === portNum;
        const borderColor = portColorMap && portColorMap[portNum] ? portColorMap[portNum] : (isActive ? '#00C853' : 'transparent');
        const fillColor = isSelected
          ? borderColor
          : (isActive ? 'rgba(255,255,255,0.7)' : 'rgba(34,34,34,0.3)');
        return (
          <TouchableOpacity
            key={portNum}
            style={[
              styles.portOverlay,
              {
                left: pos.x * imageWidth - finalPortSize / 2,
                top: pos.y * imageHeight - finalPortSize / 2,
                width: finalPortSize,
                height: finalPortSize,
                borderColor,
                borderWidth: isActive ? 3 : 0,
                borderRadius: 8,
                backgroundColor: fillColor,
                zIndex: 10,
                opacity: isActive ? 1 : 0.08,
              },
            ]}
            onPress={isActive ? () => onPortPress(portNum) : undefined}
            activeOpacity={isActive ? 0.8 : 1}
            disabled={!isActive}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  portOverlay: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
}); 