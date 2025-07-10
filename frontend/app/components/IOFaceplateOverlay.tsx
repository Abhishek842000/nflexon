import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

interface IOFaceplateOverlayProps {
  imageUri: string;
  ioType: 'FP2' | 'FP4' | 'FP6' | 'SB1' | 'SB2' | 'SB4';
  activePorts: number[];
  selectedPort?: number | null;
  onPortPress?: (port: number) => void;
  portColorMap?: Record<number, string>;
}

const { width } = Dimensions.get('window');

export default function IOFaceplateOverlay({ imageUri, ioType, activePorts, selectedPort, onPortPress, portColorMap }: IOFaceplateOverlayProps) {
  const isSB = ioType.startsWith('SB');
  const FACEPLATE_WIDTH = isSB ? width * 0.8 : width * 0.4;
  const FACEPLATE_HEIGHT = isSB ? FACEPLATE_WIDTH * 0.6 : FACEPLATE_WIDTH * 1.56;
  let BUTTON_SIZE;
  switch (ioType) {
    case 'SB1':
      BUTTON_SIZE = FACEPLATE_WIDTH / 3.5;
      break;
    case 'SB2':
      BUTTON_SIZE = FACEPLATE_WIDTH / 5.5;
      break;
    case 'SB4':
      BUTTON_SIZE = FACEPLATE_WIDTH / 8.5;
      break;
    case 'FP2':
      BUTTON_SIZE = FACEPLATE_WIDTH / 4.5;
      break;
    case 'FP4':
      BUTTON_SIZE = FACEPLATE_WIDTH / 4.75;
      break;
    case 'FP6':
      BUTTON_SIZE = FACEPLATE_WIDTH / 4.5;
      break;
    default:
      BUTTON_SIZE = FACEPLATE_WIDTH / 4.5;
  }

  const PORT_LAYOUTS = {
    FP2: [
      { left: 0.4, top: 0.27 },
      { left: 0.4, top: 0.57 },
    ],
    FP4: [
      { left: 0.235, top: 0.3275 },
      { left: 0.55, top: 0.3275 },
      { left: 0.235, top: 0.5325 },
      { left: 0.55, top: 0.5325 },
    ],
    FP6: [
      { left: 0.23, top: 0.24 },
      { left: 0.55, top: 0.24 },
      { left: 0.23, top: 0.43 },
      { left: 0.55, top: 0.43 },
      { left: 0.23, top: 0.61 },
      { left: 0.55, top: 0.61 },
    ],
    SB1: [
      { left: 0.36, top: 0.2 },
    ],
    SB2: [
      { left: 0.225, top: 0.32 },
      { left: 0.59, top: 0.32 },
    ],
    SB4: [
      { left: 0.1375, top: 0.385 },
      { left: 0.3425, top: 0.385 },
      { left: 0.5375, top: 0.385 },
      { left: 0.7475, top: 0.385 },
    ],
  };

  const layout = PORT_LAYOUTS[ioType];
  return (
    <View style={{
      width: FACEPLATE_WIDTH,
      height: FACEPLATE_HEIGHT,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    }}>
      <Image source={{ uri: imageUri }} style={{ width: FACEPLATE_WIDTH, height: FACEPLATE_HEIGHT, position: 'absolute', left: 0, top: 0 }} resizeMode="contain" />
      {layout.map((pos, i) => {
        const portNum = i + 1;
        const isActive = activePorts.includes(portNum);
        const isSelected = selectedPort === portNum;
        const color = portColorMap && portColorMap[portNum] ? portColorMap[portNum] : 'transparent';
        return (
          <TouchableOpacity
            key={portNum}
            style={{
              position: 'absolute',
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: 6,
              zIndex: 10,
              left: pos.left * FACEPLATE_WIDTH,
              top: pos.top * FACEPLATE_HEIGHT,
              borderColor: isActive ? '#00C853' : '#D32F2F',
              borderWidth: isSelected ? 4 : 2,
              backgroundColor: color,
              opacity: 1,
            }}
            disabled={!isActive}
            onPress={() => isActive && onPortPress && onPortPress(portNum)}
            activeOpacity={isActive ? 0.7 : 1}
          />
        );
      })}
    </View>
  );
} 