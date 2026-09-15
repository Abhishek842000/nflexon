import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import TopBar from '../components/TopBar';
import PPOverlay from '../components/PPOverlay';
import SwitchOverlay from '../components/SwitchOverlay';
import IOOverlay from '../components/IOOverlay';
import PortSelectionOverlay from '../components/PortSelectionOverlay';
import { IO_IMAGES, PP_IMAGE, SWITCH_IMAGE } from '../config/assets';
import ScannerStatus from '../components/ScannerStatus';
import LocationInfoBox from '../components/LocationInfoBox';
import { fetchApparatusInfo, fetchPPConnectivity, fetchIOConnectivity } from '../utils/apparatusDataUtils';
import { getPPPortColorMap, getIOPortColorMap } from '../utils/apparatusViewUtils';
import { apparatusViewStyles } from '../utils/apparatusViewStyles';

export default function ApparatusView() {
  const { apparatusType } = useLocalSearchParams();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPanel, setSelectedPanel] = useState<{ uri: string; ru: string } | null>(null);
  const [showSwitchOverlay, setShowSwitchOverlay] = useState(false);
  const [activePorts, setActivePorts] = useState<number[]>([]);
  const [ioActivePorts, setIoActivePorts] = useState<number[]>([]);
  const [selectedIoPort, setSelectedIoPort] = useState<number | null>(null);
  const [selectedPanelPort, setSelectedPanelPort] = useState<number | null>(null);
  const [switchActivePorts, setSwitchActivePorts] = useState<number[]>([]);
  const params = useLocalSearchParams();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { result: apparatusResult, switchActivePorts: ports, ioActivePorts } = await fetchApparatusInfo(apparatusType as string, params);
        setResult(apparatusResult);
        setSwitchActivePorts(ports || []);
        setIoActivePorts(ioActivePorts || []);
      } catch (error) {
        console.error('Error fetching apparatus info:', error);
        setResult(null);
      } finally {
        setLoading(false);
      }
    }
    if (apparatusType === 'Switch' && !showSwitchOverlay) return;
    loadData();
  }, [apparatusType, params.site, params.building, params.floor, params.room, showSwitchOverlay]);

  const handlePanelPress = async (ru: string) => {
    if (result?.type !== 'PP') return;
    setSelectedPanel({ uri: PP_IMAGE, ru });
    setSelectedPanelPort(null);
    const ports = await fetchPPConnectivity(result.location.pp_serial_no, ru);
    setActivePorts(ports);
  };

  const handleIOPortPress = async (port: number) => {
    if (result?.type !== 'IO') return;
    setSelectedIoPort(selectedIoPort === port ? null : port);
    if (selectedIoPort !== port) {
      await fetchIOConnectivity(result.location.io_mac, port);
    }
  };

  const renderPPContent = () => (
    <>
      <Text style={apparatusViewStyles.title}>Patch Panel View</Text>
      <LocationInfoBox location={result.location} type="PP" />
      <PPOverlay
        imageUri={PP_IMAGE}
        activePorts={activePorts}
        selectedPort={selectedPanelPort}
        portColorMap={getPPPortColorMap(result.connectivity, selectedPanel?.ru || '1')}
      />
    </>
  );

  const renderIOContent = () => (
    <>
      <Text style={apparatusViewStyles.title}>IO Device View</Text>
      <LocationInfoBox location={result.location} type="IO" />
      <IOOverlay
        imageUri={IO_IMAGES[result.location.io_type]}
        ioType={result.location.io_type}
        activePorts={ioActivePorts}
        selectedPort={selectedIoPort}
        onPortPress={handleIOPortPress}
        portColorMap={getIOPortColorMap(result.connectivity)}
      />
    </>
  );

  const renderSwitchContent = () => (
    <>
      <Text style={apparatusViewStyles.title}>Switch View</Text>
      <LocationInfoBox location={result.location} type="PP" />
      <SwitchOverlay
        imageUri={SWITCH_IMAGE}
        activePorts={switchActivePorts}
        switchName={result.location.pp_serial_no}
        onClose={() => {}}
      />
    </>
  );

  if (loading) {
    return (
      <View style={apparatusViewStyles.container}>
        <TopBar title="Apparatus View" showBackButton />
        <View style={apparatusViewStyles.loadingContainer}>
          <Text style={apparatusViewStyles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={apparatusViewStyles.container}>
        <TopBar title="Apparatus View" showBackButton />
        <View style={apparatusViewStyles.errorContainer}>
          <Text style={apparatusViewStyles.errorText}>No apparatus found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={apparatusViewStyles.container}>
      <TopBar title="Apparatus View" showBackButton />
      <ScrollView contentContainerStyle={apparatusViewStyles.scrollView}>
        {result.type === 'PP' && renderPPContent()}
        {result.type === 'IO' && renderIOContent()}
        {result.type === 'Switch' && renderSwitchContent()}
      </ScrollView>
      {selectedPanel && selectedPanelPort && (
        <PortSelectionOverlay
          selectedPort={selectedPanelPort}
          onConfirm={() => setSelectedPanelPort(null)}
          ioType="PP"
          ioMac={result.location.pp_serial_no}
        />
      )}
    </View>
  );
} 