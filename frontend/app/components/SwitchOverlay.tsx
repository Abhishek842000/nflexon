import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SwitchPortOverlay from './SwitchPortOverlay';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

interface SwitchOverlayProps {
  imageUri: string;
  onClose: () => void;
  activePorts?: number[];
  switchName?: string;
}

export default function SwitchOverlay({ imageUri, onClose, activePorts, switchName }: SwitchOverlayProps) {
  const [selectedPort, setSelectedPort] = useState<number | undefined>(undefined);
  const [tappablePorts, setTappablePorts] = useState<number[]>(activePorts || []);
  const [pendingPort, setPendingPort] = useState<number | undefined>(undefined);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (activePorts) {
      setTappablePorts(activePorts);
      return;
    }
    async function fetchTappablePorts() {
      try {
        const res = await axios.get('http://18.117.181.30:3004/api/connectivity-map');
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          const ports = res.data.data
            .map((row: any) => parseInt(row.switch_port, 10))
            .filter((port: any) => !isNaN(port));
          setTappablePorts(Array.from(new Set(ports)));
        }
      } catch (e) {
        setTappablePorts([]);
      }
    }
    fetchTappablePorts();
  }, [activePorts]);

  const handlePortPress = (port: number) => {
    if (selectedPort === port) {
      setSelectedPort(undefined);
      setPendingPort(undefined);
    } else {
      setSelectedPort(port);
      setPendingPort(port);
    }
  };

  const handleConfirm = () => {
    if (pendingPort !== undefined) {
      setSelectedPort(pendingPort);
      setPendingPort(undefined);
      router.push({
        pathname: '/connectivity/network-map',
        params: {
          type: 'Switch',
          switch_port: pendingPort,
          site: params.site,
          building: params.building,
          floor: params.floor,
          room: params.room,
          switch_name: switchName,
        },
      });
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <MaterialCommunityIcons name="close" size={28} color="#fff" />
      </TouchableOpacity>
      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <SwitchPortOverlay
            imageUri={imageUri}
            selectedPort={selectedPort}
            onPortPress={handlePortPress}
            tappablePorts={tappablePorts}
          />
        </ScrollView>
      </View>
      {/* Port confirmation overlay */}
      {pendingPort !== undefined && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>{`Port: ${pendingPort}`}</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 80,
    right: 16,
    zIndex: 1001,
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalScrollContent: {
    alignItems: 'center',
    minHeight: windowHeight * 0.8,
  },
  switchImage: {
    width: windowWidth * 4,
    height: windowHeight * 0.8,
  },
  confirmOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '25%',
    height: 90,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2000,
    backgroundColor: 'transparent',
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 6,
    minWidth: 120,
  },
  confirmText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#F7A800',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 36,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmButtonText: {
    color: '#222',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 