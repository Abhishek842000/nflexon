import React, { useState, useEffect, useRef } from 'react';
import { View, Dimensions, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import QRScannerOverlay from '../components/QRScannerOverlay';
import ScannerStatus from '../components/ScannerStatus';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../contexts/SessionContext';
import { getAllPPConnections } from '../utils/connectivityUtils';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const WINDOW_SIZE = 300;
const ICON_SIZE = 32;
const ICON_TOP = 54;
const ICON_RIGHT = 29;

// Remove session-based validation, use API to check existence
const API_BASE = 'http://18.117.181.30:3004/api';

function isWithinWindow(bounds: any) {
  if (!bounds || !bounds.origin || !bounds.size) return true;
  const centerX = bounds.origin.x + bounds.size.width / 2;
  const centerY = bounds.origin.y + bounds.size.height / 2;
  const windowLeft = (width - WINDOW_SIZE) / 2;
  const windowTop = (height - WINDOW_SIZE) / 2;
  return (
    centerX >= windowLeft &&
    centerX <= windowLeft + WINDOW_SIZE &&
    centerY >= windowTop &&
    centerY <= windowTop + WINDOW_SIZE
  );
}

// Replace isValidSessionQR with API-based validation
async function isValidQR(data: string): Promise<boolean> {
  const trimmed = data.trim();
  if (trimmed.length > 22) {
    // PP
    const serial = trimmed.slice(0, 22).trim();
    try {
      const res = await axios.get(`${API_BASE}/pp-location/${encodeURIComponent(serial)}`);
      return !!(res.data && res.data.length > 0);
    } catch {
      return false;
    }
  } else if (trimmed.length > 3) {
    // IO
    const io_mac = trimmed.slice(4).trim();
    try {
      const res = await axios.get(`${API_BASE}/io-location/${encodeURIComponent(io_mac)}`);
      return !!(res.data && res.data.length > 0);
    } catch {
      return false;
    }
  }
  return false;
}

export default function QRScanner2() {
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scanLock = useRef(false);
  const { pps, ios, addPP, addIO, clearSession } = useSession();
  const { ppConnections } = useLocalSearchParams();

  useFocusEffect(
    React.useCallback(() => {
      setError(null);
      setLoading(false);
      scanLock.current = false;
    }, [])
  );

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async (result: { data: string; bounds?: any }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setError(null);
    setLoading(true);

    const data = result.data.trim();
    const isValid = await isValidQR(data);

    if (!isValid) {
      setError('Not found in database. Please scan a valid QR code for a PP or IO.');
      setLoading(false);
      return;
    }

    // Fetch all connections for the scanned IO or PP from the backend
    let connections: any[] = [];
    try {
      if (data.length > 22) {
        // PP
        const serial = data.slice(0, 22).trim();
        const res = await axios.get(`${API_BASE}/pp-connectivity/serial/${encodeURIComponent(serial)}`)
        connections = res.data || [];
      } else if (data.length > 3) {
        // IO
        const io_mac = data.slice(4).trim();
        const res = await axios.get(`${API_BASE}/pp-connectivity/io_mac/${encodeURIComponent(io_mac)}`);
        connections = res.data || [];
      }
    } catch (e) {}

    // Navigate to certification-test page, pass apparatusType and all connections
    setLoading(false);
    router.push({ pathname: '/testing/certification-test', params: { apparatusType: data, connections: JSON.stringify(connections) } });
  };

  if (hasPermission === null || hasPermission === false) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Fullscreen Camera */}
      <CameraView
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      <QRScannerOverlay />

      {/* Hamburger Icon in top right */}
      <TouchableOpacity
        style={{ position: 'absolute', top: ICON_TOP, right: ICON_RIGHT, zIndex: 10 }}
        onPress={() => {
          clearSession();
          router.replace('/main-menu');
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="menu" size={ICON_SIZE} color="#fff" />
      </TouchableOpacity>

      <ScannerStatus
        loading={loading}
        error={error}
        onRetry={() => {
          setError(null);
          setLoading(false);
          scanLock.current = false;
        }}
      />
    </View>
  );
} 