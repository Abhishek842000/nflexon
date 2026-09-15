import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import TopBar from '../components/TopBar';
import ScannerStatus from '../components/ScannerStatus';
import LocationInfoBox from '../components/LocationInfoBox';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchNetworkMapData } from '../utils/networkMapUtils';
import { networkMapStyles as styles } from '../utils/styles';

export default function NetworkMap() {
  const params = useLocalSearchParams();
  const [location, setLocation] = useState<any>(null);
  const [connectivity, setConnectivity] = useState<any>(null);
  const [ppLocation, setPpLocation] = useState<any>(null);
  const [ioLocation, setIoLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchNetworkMapData(params)
      .then(data => {
        setLocation(data.location);
        setConnectivity(data.connectivity);
        setPpLocation(data.ppLocation);
        setIoLocation(data.ioLocation);
      })
      .catch(() => setError('Failed to load network map'))
      .finally(() => setLoading(false));
  }, [params.type, params.switch_port, params.switch_name, params.pp_serial_no, params.ru, params.pp_port, params.io_mac, params.io_port]);

  const renderPath = () => {
    if (!connectivity) return null;
    const patchPanelRoom = (params.type === 'PP' ? location?.room : ppLocation?.room) || '-';
    const patchPanelRack = (params.type === 'PP' ? location?.rack : ppLocation?.rack) || '-';
    const ioRoom = (params.type === 'IO' ? location?.room : ioLocation?.room) || '-';
    const ioDesc = (params.type === 'IO' ? location?.additional_description : ioLocation?.additional_description) || '-';
    return (
      <View style={styles.pathContainer}>
        <View style={styles.pathRow}>
          <MaterialCommunityIcons name="server-network" size={36} color="#7CFCB5" style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Switch:</Text> {connectivity.switch_name}</Text>
            <Text style={styles.pathText}><Text style={{ fontWeight: 'bold' }}>Port:</Text> {connectivity.switch_port}</Text>
          </View>
        </View>
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