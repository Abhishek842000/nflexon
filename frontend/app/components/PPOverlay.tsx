import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Dimensions, Text } from 'react-native';

interface PPOverlayProps {
  imageUri: string;
  activePorts: number[];
  selectedPort?: number | null;
  onPanelPress?: () => void;
  onConfirm?: () => void;
  showWhiteOverlay?: boolean;
  portColorMap?: Record<number, string>;
}

const PORT_COUNT = 24;
const { width } = Dimensions.get('window');
const PANEL_WIDTH = width * 0.76; // 80% of previous 0.7
const PANEL_HEIGHT = PANEL_WIDTH * 0.4 / 0.7; // maintain aspect ratio
const BUTTON_SIZE = PANEL_WIDTH / 35;
const BUTTON_Y = PANEL_HEIGHT * 0.49;
const BUTTON_SPACING = (PANEL_WIDTH - BUTTON_SIZE * PORT_COUNT) / (PORT_COUNT + 58);
const BUTTON_X_OFFSET = BUTTON_SPACING + 28; // Shift all buttons 8px to the right

export default function PPOverlay({ imageUri, activePorts, onPanelPress, onConfirm, showWhiteOverlay, portColorMap }: PPOverlayProps) {
  let currentLeft = BUTTON_X_OFFSET;
  const hasActive = activePorts.length > 0;
  return (
    <TouchableOpacity
      style={[styles.overlayContainer, { width: PANEL_WIDTH, height: PANEL_HEIGHT }]}
      onPress={hasActive ? onPanelPress : undefined}
      activeOpacity={hasActive ? 0.7 : 1}
      disabled={!hasActive}
    >
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      {/* Port overlays (non-clickable) */}
      {Array.from({ length: PORT_COUNT }, (_, i) => {
        const portNum = i + 1;
        const isActive = activePorts.includes(portNum);
        const left = currentLeft;
        // After every 6 ports, increase spacing for the next port
        if ((portNum) % 6 === 0 && portNum !== PORT_COUNT) {
          currentLeft += BUTTON_SPACING * 3.75;
        } else {
          currentLeft += BUTTON_SPACING;
        }
        currentLeft += BUTTON_SIZE;
        const color = portColorMap && portColorMap[portNum];
        return (
          <View
            key={portNum}
            style={[
              styles.portButton,
              isActive
                ? {
                    left,
                    top: BUTTON_Y,
                    borderColor: color || '#00C853',
                    borderWidth: 2,
                    backgroundColor: color ? color : 'transparent',
                    opacity: 1,
                  }
                : {
                    left,
                    top: BUTTON_Y,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    backgroundColor: 'transparent',
                    opacity: 0,
                  },
            ]}
          />
        );
      })}
      {/* White overlay for disabled/inactive */}
      {showWhiteOverlay && (
        <View style={{ position: 'absolute', left: 0, top: 0, width: PANEL_WIDTH, height: PANEL_HEIGHT, backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 0, zIndex: 20 }} />
      )}
      {/* Confirmation button (if needed) */}
      {/* {selectedPort && (
        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
          <Text style={styles.confirmButtonText}>Confirm selection</Text>
        </TouchableOpacity>
      )} */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  portButton: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 4,
    zIndex: 10,
  },
  confirmButton: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    transform: [{ translateX: -70 }],
    backgroundColor: '#F7A800',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 