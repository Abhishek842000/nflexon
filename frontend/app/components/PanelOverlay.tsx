import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const PORT_COUNT = 24;
const VISIBLE_FRACTION = 0.25; // Show 1/4th of the image at a time
const BUTTON_SIZE = (28 * 1.5) * (1); // 2/3 of the previous size

type PanelOverlayProps = {
  imageUri: string;
  onClose: () => void;
  ruValue: string;
  activePorts: number[];
  ppSerialNo: string;
  selectedPort?: number | null;
  onPortPress?: (port: number) => void;
  onConfirm?: () => void;
  customPortColorMap?: Record<number, string>; // color mapping from stack view for this RU (semi-transparent)
  customSelectedPort?: number | null; // selected port for custom mapping
};

export default function PanelOverlay({ imageUri, onClose, ruValue, activePorts, ppSerialNo, selectedPort, onPortPress, onConfirm, customPortColorMap, customSelectedPort }: PanelOverlayProps) {
  const screenWidth = Dimensions.get('window').width;
  // Make the image 4x the visible width
  const imageWidth = screenWidth * 0.9 * 4;
  const imageHeight = imageWidth * 0.18; // Use your image's aspect ratio
  const visibleWidth = imageWidth * VISIBLE_FRACTION;

  // Calculate port positions (adjust these to match your image)
  // For now, distribute evenly horizontally, and set a fixed vertical offset
  const BUTTON_Y_OFFSET = imageHeight * 0.45;
  // Reduce the spacing between overlays by 1/4th
  const H_SPACING = (((imageWidth - BUTTON_SIZE) / (PORT_COUNT - 1)) / 2) * 1.5;
  // Move overlays more to the left (start at 1x the new spacing)
  const BASE_LEFT_OFFSET = 3.1 * H_SPACING;

  let currentLeft = BASE_LEFT_OFFSET;
  const portButtons = [];
  for (let i = 0; i < PORT_COUNT; i++) {
    portButtons.push({
      left: currentLeft,
      top: BUTTON_Y_OFFSET,
      port: i + 1,
    });
    // After every 6 overlays, increase spacing by 2.5x for the next overlay, then resume normal spacing
    if ((i + 1) % 6 === 0 && i !== 0 && i !== PORT_COUNT - 1) {
      currentLeft += H_SPACING * 1.475;
    } else {
      currentLeft += H_SPACING;
    }
  }

  const handlePortPress = (port: number) => {
    if (onPortPress) {
      onPortPress(port);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedPort) {
      if (onConfirm) {
        // If onConfirm is provided, use it (for certification-test)
        onConfirm();
      } else {
        // Otherwise use the default navigation (for apparatus-view)
        router.push({
          pathname: '/connectivity/network-map',
          params: {
            type: 'PP',
            pp_serial_no: ppSerialNo,
            ru: ruValue,
            pp_port: selectedPort.toString(),
          },
        });
      }
    }
  };

  return (
    <View style={styles.overlayContainer}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>
      <View style={styles.centeredContent}>
        {customSelectedPort && activePorts.includes(customSelectedPort) && (
          <View style={styles.portSelectionOverlay}>
            <Text style={styles.portText}>
              RU: {ruValue}, Port: {customSelectedPort}
            </Text>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSelection}>
              <Text style={styles.buttonText}>Confirm selection</Text>
            </TouchableOpacity>
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={{ width: visibleWidth, height: imageHeight, alignSelf: 'center' }}
          contentContainerStyle={{ width: imageWidth, height: imageHeight }}
        >
          <View style={{ width: imageWidth, height: imageHeight }}>
            <Image
              source={{ uri: imageUri }}
              style={{ width: imageWidth, height: imageHeight, position: 'absolute', left: 0, top: 0 }}
              resizeMode="contain"
            />
            {portButtons.map((btn) => {
              const isActive = activePorts.includes(btn.port);
              const isSelected = selectedPort === btn.port;
              const borderColor = customPortColorMap && customPortColorMap[btn.port] ? customPortColorMap[btn.port] : (isActive ? '#00C853' : '#444');
              const fillColor = isSelected
                ? borderColor
                : (isActive ? 'rgba(255,255,255,0.7)' : '#222');
              return (
                <TouchableOpacity
                  key={btn.port}
                  style={[
                    styles.portButton,
                    {
                      left: btn.left,
                      top: btn.top,
                      backgroundColor: fillColor,
                      borderColor: borderColor,
                      borderWidth: isActive ? 3 : 2,
                      opacity: isActive ? 1 : 0.5,
                    },
                  ]}
                  onPress={isActive ? () => handlePortPress(btn.port) : undefined}
                  activeOpacity={isActive ? 0.8 : 1}
                  disabled={!isActive}
                />
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.ruContainerBelowImage}>
          <Text style={[styles.ruLabel, { color: '#fff' }]}>RU:</Text>
          <Text style={styles.ruValue}>{ruValue}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 4,
    zIndex: 1001,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  portButton: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  ruContainerBelowImage: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 0,
  },
  ruLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  ruValue: {
    fontSize: 16,
    color: '#F7A800',
    fontWeight: '600',
  },
  portSelectionOverlay: {
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
    color: '#000',
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