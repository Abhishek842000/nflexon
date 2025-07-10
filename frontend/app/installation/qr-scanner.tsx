import React, { useState, useEffect, useRef } from 'react';
import { View, Dimensions, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import axios from 'axios';
import QRScannerOverlay from '../components/QRScannerOverlay';
import ScannerStatus from '../components/ScannerStatus';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../contexts/SessionContext';

const { width, height } = Dimensions.get('window');
const WINDOW_SIZE = 300;
const ICON_SIZE = 32;
const ICON_TOP = 54;
const ICON_RIGHT = 29;

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

function isValidMac(mac: string) {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac);
}

export default function InstallationQRScanner() {
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scanLock = useRef(false);
  const { clearSession } = useSession();

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

    const shortFormat = /^.{3} ([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    const longFormat = /^.{22} ([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    const data = result.data.trim();
    let mac = '';
    let serial = '';
    let isShort = false;
    let isLong = false;

    if (shortFormat.test(data)) {
      isShort = true;
      mac = data.slice(4);
      const ioType = data.slice(0, 3);
      const allowedTypes = ['FP2', 'FP4', 'FP6', 'SB1', 'SB2', 'SB4'];
      if (!allowedTypes.includes(ioType)) {
        setError('Invalid IO type');
        setLoading(false);
        return;
      }
    } else if (longFormat.test(data)) {
      isLong = true;
      serial = data.slice(0, 22);
      mac = data.slice(23);
    } else {
      setError('Invalid QR');
      setLoading(false);
      return;
    }

    try {
      if (isShort) {
        // IO: Check if MAC exists in io-location
        const res = await axios.get(`http://18.117.181.30:3004/api/io-location/${encodeURIComponent(mac)}`);
        if (res.data && res.data.length > 0) {
          setError('All ports are active');
          setLoading(false);
          return;
        } else {
          setLoading(false);
          router.push({ pathname: '/installation/Location', params: { apparatusType: data } });
          return;
        }
      } else if (isLong) {
        // PP: If valid format, proceed to next screen
        setLoading(false);
        router.push({ pathname: '/installation/Location', params: { apparatusType: data } });
        return;
      }
      setError('Invalid QR');
      setLoading(false);
    } catch (e) {
      setError('Invalid QR');
      setLoading(false);
    }
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