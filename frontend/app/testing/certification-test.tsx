import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TopBar from '../components/TopBar';
import PPOverlay from '../components/PPOverlay';
import IOFaceplateOverlay from '../components/IOFaceplateOverlay';
import { IO_IMAGES, PP_IMAGE } from '../config/assets';
import LocationInfoBox from '../components/LocationInfoBox';
import PanelOverlay from '../components/PanelOverlay';
import ConnectionInfoBox from '../components/ConnectionInfoBox';
import {
  getActivePortsForPP,
  getActivePortsForIO,
  getIOPortList,
  getIOPortToPPPortMap,
  getIOPortColorMap,
  getPPPortColorMap,
  getPPPortColorMapForRU,
  getIOPortHexColorMap,
  getPPPortColorMapForSelectedIO,
  getIOPortColorMapForIOWithSelected,
  getGlobalPPPortColorMap
} from '../utils/certificationUtils';
import { parseApparatusType, findConnectedIO, handlePortConfirmation, PANEL_WIDTH, PANEL_HEIGHT, BUTTON_SIZE, BUTTON_Y, BUTTON_SPACING, BUTTON_X_OFFSET } from '../utils/certificationTestUtils';
import { fetchConnections, fetchIOLocation, fetchPPLocation } from '../utils/certificationDataUtils';
import { certificationStyles } from '../utils/certificationStyles';

export default function CertificationTest() {
  const { apparatusType, connections: connectionsParam } = useLocalSearchParams();
  const [type, setType] = useState<'PP' | 'IO' | null>(null);
  const [ppSerial, setPpSerial] = useState('');
  const [ioType, setIoType] = useState('');
  const [ioMac, setIoMac] = useState('');
  const [activePortsByRU, setActivePortsByRU] = useState<Record<string, number[]>>({});
  const [activeIOPorts, setActiveIOPorts] = useState<number[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<{ ru: string } | null>(null);
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [selectedIO, setSelectedIO] = useState<{ io_mac: string; io_type: string; io_port: number } | null>(null);
  const [selectedRU, setSelectedRU] = useState<string | null>(null);
  const [ioPortColorMap, setIoPortColorMap] = useState<Record<number, string>>({});
  const [ioPortToPPPort, setIoPortToPPPort] = useState<Record<number, { pp_serial_no: string; ru: string; pp_port: number } | null>>({});
  const [ioPortHexColorMap, setIoPortHexColorMap] = useState<Record<number, string>>({});
  const [ioLocation, setIoLocation] = useState<any>(null);
  const [ppLocation, setPpLocation] = useState<any>(null);
  const [focusedPanel, setFocusedPanel] = useState<{ ru: string } | null>(null);
  const [globalPPPortColorMap, setGlobalPPPortColorMap] = useState<Record<number, string>>({});
  const router = useRouter();

  // Parse apparatusType from QR
  useEffect(() => {
    const parsed = parseApparatusType(apparatusType as string);
    setType(parsed.type);
    setPpSerial(parsed.ppSerial);
    setIoType(parsed.ioType);
    setIoMac(parsed.ioMac);
  }, [apparatusType]);

  // Fetch connections
  useEffect(() => {
    async function loadConnections() {
      const data = await fetchConnections(type, ppSerial, ioMac);
      setConnections(data);
    }
    if (type && ((type === 'PP' && ppSerial) || (type === 'IO' && ioMac))) {
      loadConnections();
    }
  }, [type, ppSerial, ioMac]);

  // Compute active ports
  useEffect(() => {
    if (type === 'PP' && ppSerial && connections.length > 0) {
      setActivePortsByRU(getActivePortsForPP(ppSerial, connections));
    } else if (type === 'IO' && ioMac && connections.length > 0) {
      setActiveIOPorts(getActivePortsForIO(ioMac, connections));
    }
  }, [type, ppSerial, ioMac, connections]);

  // Update color mapping
  useEffect(() => {
    if (type === 'PP' && ppSerial && selectedPort && focusedPanel) {
      setIoPortColorMap(getPPPortColorMap(ppSerial, focusedPanel.ru, selectedPort, connections));
    } else if (type === 'PP' && selectedIO && selectedPort) {
      setIoPortColorMap(getIOPortColorMap(selectedIO.io_mac, selectedIO.io_port, connections));
    } else if (type === 'IO' && ioMac && selectedPort) {
      setIoPortColorMap(getIOPortColorMap(ioMac, selectedPort, connections));
    }
  }, [type, ppSerial, selectedPort, selectedIO, focusedPanel, connections, ioMac]);

  // Fetch IO location
  useEffect(() => {
    if (type === 'IO' && ioMac) {
      fetchIOLocation(ioMac).then(setIoLocation);
    }
  }, [type, ioMac]);

  // Fetch PP location
  useEffect(() => {
    if (type === 'IO' && selectedPort && connections.length > 0) {
      const conn = connections.find(c => c.io_mac === ioMac && c.io_port === selectedPort);
      if (conn?.pp_serial_no) {
        fetchPPLocation(conn.pp_serial_no).then(setPpLocation);
      } else {
        setPpLocation(null);
      }
    } else {
      setPpLocation(null);
    }
  }, [type, selectedPort, ioMac, connections]);

  const handlePortClick = (ppPort: number) => {
    setSelectedPort(ppPort);
    if (type === 'PP') {
      handlePortConfirmation(ppPort, focusedPanel, ppSerial, connections, setSelectedRU, setSelectedIO, setIoLocation, fetchIOLocation);
    }
  };

  const renderPPContent = () => (
    <>
      <Text style={certificationStyles.title}>Patch Panel Certification Test</Text>
      <LocationInfoBox location={ppLocation} type="PP" />
      <PPOverlay
        imageUri={PP_IMAGE}
        activePorts={activePortsByRU[selectedRU || '1'] || []}
        selectedPort={selectedPort}
        portColorMap={ioPortColorMap}
      />
      {selectedIO && selectedPort && (
        <ConnectionInfoBox 
          ru={selectedRU || '1'} 
          ppPort={selectedPort} 
          ioPort={selectedIO.io_port} 
        />
      )}
    </>
  );

  const renderIOContent = () => (
    <>
      <Text style={certificationStyles.title}>IO Device Certification Test</Text>
      <LocationInfoBox location={ioLocation} type="IO" />
      <IOFaceplateOverlay
        imageUri={IO_IMAGES[ioType as any]}
        ioType={ioType as any}
        activePorts={activeIOPorts}
        selectedPort={selectedPort}
        onPortPress={setSelectedPort}
        portColorMap={ioPortColorMap}
      />
      {selectedPort && ppLocation && (
        <ConnectionInfoBox 
          ru={connections.find(c => c.io_mac === ioMac && c.io_port === selectedPort)?.ru || '1'} 
          ppPort={connections.find(c => c.io_mac === ioMac && c.io_port === selectedPort)?.pp_port || 1} 
          ioPort={selectedPort} 
        />
      )}
    </>
  );

  return (
    <View style={certificationStyles.container}>
      <TopBar title="Certification Test" showBackButton />
      <ScrollView contentContainerStyle={certificationStyles.scrollView}>
        {type === 'PP' ? renderPPContent() : type === 'IO' ? renderIOContent() : <Text style={certificationStyles.title}>Loading...</Text>}
      </ScrollView>
    </View>
  );
}
