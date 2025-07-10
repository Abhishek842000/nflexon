import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopBar from '../components/TopBar';
import ScannerStatus from '../components/ScannerStatus';
import LocationInfoBox from '../components/LocationInfoBox';

const API_BASE = 'http://18.117.181.30:3004/api';
const ICON_SIZE = 36;
const TOP_BAR_HEIGHT = 64;
const TOP_BAR_TOP_SPACING = 52;

export default function NetworkMap() {
  const params = useLocalSearchParams();
  const [location, setLocation] = useState<any>(null);
  const [connectivity, setConnectivity] = useState<any>(null);
  const [ppLocation, setPpLocation] = useState<any>(null);
  const [ioLocation, setIoLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch location and connectivity data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let connRes, ioLocRes, ppLocRes, locRes;
        if (params.type === 'Switch') {
          console.log('Selected switch_port:', params.switch_port);
          console.log('Switch name from params:', params.switch_name);
          
          // Use the switch_name from params instead of hardcoded 'NETGEAR_M'
          const switchName = params.switch_name || 'NETGEAR_M';
          
          connRes = await axios.get(`${API_BASE}/connectivity-map`, {
            params: {
              switch_name: switchName,
              switch_port: params.switch_port,
            },
          });
          console.log('connectivity-map data:', connRes?.data?.data);
          const connData = Array.isArray(connRes?.data?.data)
            ? connRes.data.data.find(
                (row: any) =>
                  String(row.switch_port) === String(params.switch_port) &&
                  row.switch_name === switchName
              )
            : null;
          console.log('Filtered connData:', connData);

          if (connData && connData.io_mac) {
            ioLocRes = await axios.get(`${API_BASE}/io-location/${encodeURIComponent(connData.io_mac)}`);
            console.log('IO location:', ioLocRes?.data);
            setIoLocation(ioLocRes?.data?.[0] || null);
            setLocation(ioLocRes?.data?.[0] || null);
          } else {
            setIoLocation(null);
            setLocation(null);
          }

          if (connData && connData.pp_serial_no) {
            ppLocRes = await axios.get(`${API_BASE}/pp-location/${encodeURIComponent(connData.pp_serial_no)}`);
            setPpLocation(ppLocRes?.data?.[0] || null);
          } else {
            setPpLocation(null);
          }

          setConnectivity(connData || null);
        } else if (params.type === 'PP') {
          locRes = await axios.get(`${API_BASE}/pp-location/${encodeURIComponent(params.pp_serial_no as string)}`);
          connRes = await axios.get(`${API_BASE}/connectivity-map`, {
            params: {
              type: 'PP',
              pp_serial_no: params.pp_serial_no,
              ru: params.ru,
              pp_port: params.pp_port,
            },
          });
          setPpLocation(null);
          const connData = connRes?.data?.data?.[0];
          if (connData && connData.io_mac) {
            ioLocRes = await axios.get(`${API_BASE}/io-location/${encodeURIComponent(connData.io_mac)}`);
            setIoLocation(ioLocRes?.data?.[0] || null);
          } else {
            setIoLocation(null);
          }
          setLocation(locRes?.data?.[0] || null);
          setConnectivity(connRes?.data?.data?.[0] || null);
        } else if (params.type === 'IO') {
          locRes = await axios.get(`${API_BASE}/io-location/${encodeURIComponent(params.io_mac as string)}`);
          connRes = await axios.get(`${API_BASE}/connectivity-map`, {
            params: {
              type: 'IO',
              io_mac: params.io_mac,
              io_port: params.io_port,
            },
          });
          const connData = connRes?.data?.data?.[0];
          if (connData && connData.pp_serial_no) {
            ppLocRes = await axios.get(`${API_BASE}/pp-location/${encodeURIComponent(connData.pp_serial_no)}`);
            setPpLocation(ppLocRes?.data?.[0] || null);
          } else {
            setPpLocation(null);
          }
          setIoLocation(null);
          setLocation(locRes?.data?.[0] || null);
          setConnectivity(connRes?.data?.data?.[0] || null);
        }
      } catch (e) {
        setError('Failed to load network map');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.type, params.switch_port, params.switch_name, params.pp_serial_no, params.ru, params.pp_port, params.io_mac, params.io_port]);

  // Render the network path (custom design)
  const renderPath = () => {
    if (!connectivity) return null;
    const patchPanelRoom = (params.type === 'PP' ? location?.room : ppLocation?.room) || '-';
    const patchPanelRack = (params.type === 'PP' ? location?.rack : ppLocation?.rack) || '-';
    const ioRoom = (params.type === 'IO' ? location?.room : ioLocation?.room) || '-';
    const ioDesc = (params.type === 'IO' ? location?.additional_description : ioLocation?.additional_description) || '-';
    return (
      <View style={styles.pathContainer}>
        {/* Switch */}
        <View style={styles.pathRow}>
          <MaterialCommunityIcons name="server-network" size={36} color="#7CFCB5" style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Switch:</Text> {connectivity.switch_name}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Port:</Text> {connectivity.switch_port}</Text>
          </View>
        </View>
        {/* Patch Panel */}
        <View style={styles.pathRow}>
          <MaterialCommunityIcons name="ethernet" size={36} color="#7CFCB5" style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Room:</Text> {patchPanelRoom}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Rack:</Text> {patchPanelRack}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Serial No.:</Text> {connectivity.pp_serial_no}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>RU:</Text> {connectivity.ru}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Port:</Text> {connectivity.pp_port}</Text>
          </View>
        </View>
        {/* IO/Faceplate */}
        <View style={styles.pathRow}>
          <MaterialCommunityIcons name="ethernet" size={36} color="#7CFCB5" style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Room:</Text> {ioRoom}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Location:</Text> {ioDesc}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Type:</Text> {connectivity.io_type}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>MAC:</Text> {connectivity.io_mac}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Port:</Text> {connectivity.io_port}</Text>
          </View>
        </View>
        {/* Device */}
        <View style={styles.pathRow}>
          <MaterialCommunityIcons name="access-point-network" size={36} color="#7CFCB5" style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Device:</Text> {connectivity.device}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>MAC:</Text> {connectivity.device_mac}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <TopBar
        title="Connectivity Map"
        showBackButton
        onBackPress={() => router.back()}
        showMenuIcon
      />
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ScannerStatus loading={true} />
        ) : error ? (
          <ScannerStatus error={error} onRetry={() => router.replace('/connectivity/qr-scanner')} />
        ) : (
          <>
            {console.log('Rendering LocationInfoBox with:', location)}
            {params.type === 'Switch' ? (
              <LocationInfoBox
                location={{
                  site: params.site,
                  building: params.building,
                  floor: params.floor,
                  room: params.room,
                  switch_name: params.switch_name,
                }}
                type="IO"
                hideFields={['pp_serial_no', 'io_mac', 'io_type', 'additional_description', 'rack']}
              />
            ) : location && (
              <LocationInfoBox
                location={location}
                type={params.type === 'PP' ? 'PP' : 'IO'}
                hideFields={params.type === 'PP' ? ['room', 'rack'] : params.type === 'IO' ? ['additional_description'] : undefined}
              />
            )}
            {renderPath()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  pathContainer: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  icon: {
    marginRight: 12,
  },
  pathText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
});