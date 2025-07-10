import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');
const WINDOW_SIZE = 300;
const TEXT_SPACING = 20;

interface QRScannerOverlayProps {
  text?: string;
}

export default function QRScannerOverlay({ text = 'Scan QR Code on the Apparatus' }: QRScannerOverlayProps) {
  const centerX = (width - WINDOW_SIZE) / 2;
  const centerY = (height - WINDOW_SIZE) / 2;

  return (
    <>
      {/* Overlay: top */}
      <View style={[styles.overlay, { top: 0, left: 0, width, height: centerY }]} />
      {/* Overlay: bottom */}
      <View style={[styles.overlay, { top: centerY + WINDOW_SIZE, left: 0, width, height: height - (centerY + WINDOW_SIZE) }]} />
      {/* Overlay: left */}
      <View style={[styles.overlay, { top: centerY, left: 0, width: centerX, height: WINDOW_SIZE }]} />
      {/* Overlay: right */}
      <View style={[styles.overlay, { top: centerY, left: centerX + WINDOW_SIZE, width: width - (centerX + WINDOW_SIZE), height: WINDOW_SIZE }]} />

      {/* Centered 300x300 window border */}
      <View style={[styles.scanWindow, { top: centerY, left: centerX }]} />

      {/* Centered text just above the window */}
      <View style={[styles.textContainer, { top: centerY - TEXT_SPACING - 30 }]}>
        <Text style={styles.scanText}>{text}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1,
  },
  scanWindow: {
    position: 'absolute',
    width: WINDOW_SIZE,
    height: WINDOW_SIZE,
    borderWidth: 5,
    borderColor: '#F7A800',
    borderRadius: 0,
    zIndex: 2,
  },
  textContainer: {
    position: 'absolute',
    left: 0,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  scanText: {
    color: '#fff',
    fontSize: 17.5,
    fontWeight: 'normal',
    textAlign: 'center',
  },
}); 