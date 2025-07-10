import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { getApparatusInfo, ApparatusInfo } from '../utils/apparatusUtils.new';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PanelOverlay from '../components/PanelOverlay';
import SwitchOverlay from '../components/SwitchOverlay';
import { getFullConnectivityMap } from '../utils/connectivityUtils';
import IOOverlay from '../components/IOOverlay';
import PortSelectionOverlay from '../components/PortSelectionOverlay';
import { IO_IMAGES, PP_IMAGE, IO_PORT_POSITIONS, getImageDimensions, SWITCH_IMAGE } from '../config/assets';
import TopBar from '../components/TopBar';
import ScannerStatus from '../components/ScannerStatus';
import LocationInfoBox from '../components/LocationInfoBox';
import axios from 'axios';

const ICON_SIZE = 36;
const TOP_BAR_HEIGHT = 64;
const TOP_BAR_TOP_SPACING = 52;

const windowWidth = Dimensions.get('window').width;
const { IO_IMAGE_WIDTHS, IO_IMAGE_HEIGHTS } = getImageDimensions(windowWidth);

const PORT_LEFT_OFFSET = 26; // Adjust this value as needed

const SWITCH_LOCATION = {
  site: 'Allen',
  building: '450 Century',
  floor: '2',
  room: 'TC 1',
  switch: 'NETGEAR_M',
};

export default function ApparatusView() {
  const { apparatusType } = useLocalSearchParams();
  const [result, setResult] = useState<ApparatusInfo>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPanel, setSelectedPanel] = useState<{ uri: string; ru: string } | null>(null);
  const [showSwitchOverlay, setShowSwitchOverlay] = useState(false);
  const [activePorts, setActivePorts] = useState<number[]>([]);
  const [ioActivePorts, setIoActivePorts] = useState<number[]>([]);
  const [selectedIoPort, setSelectedIoPort] = useState<number | null>(null);
  const [selectedPanelPort, setSelectedPanelPort] = useState<number | null>(null);
  const params = useLocalSearchParams();
  const [switchActivePorts, setSwitchActivePorts] = useState<number[]>([]);

  // Debug: log params to verify what is received
  console.log('ApparatusView params:', params);

  // Helper to determine switch_name based on site, building, floor, and room
  function getSwitchNameForLocation(site: string | undefined, building: string | undefined, floor: string | undefined, room: string | undefined) {
    if (!site || !building || !floor || !room) return undefined;
    
    // Clean and format location components
    const cleanSite = site.replace(/\s+/g, '');
    const cleanBuilding = building.replace(/\s+/g, '');
    const cleanFloor = floor.toString().replace(/\s+/g, '');
    const cleanRoom = room.replace(/\s+/g, '');
    
    // Determine switch type based on location (deterministic, not random)
    let switchType = 'NETGEAR_M';
    if (site === 'Allen' && building === '700 Central' && floor === '2') {
      switchType = 'NETGEAR_M';
    } else if (site === 'Allen' && building === '450 Century' && floor === '2') {
      switchType = 'Cisco_Catalyst_2960';
    } else {
      // For other locations, use deterministic assignment based on location hash
      const locationHash = `${site}_${building}_${floor}`.length;
      const switchTypes = ['NETGEAR_M', 'Cisco_Catalyst_2960', 'HP_ProCurve', 'Dell_PowerConnect', 'Juniper_EX'];
      switchType = switchTypes[locationHash % switchTypes.length];
    }
    
    return `${switchType}_${cleanSite}_${cleanBuilding}_Floor${cleanFloor}_${cleanRoom}_1`;
  }

  useEffect(() => {
    async function fetchInfo() {
      setLoading(true);
      try {
        if (apparatusType === 'Switch') {
          // Always use params.building for switch_name
          const switchName = getSwitchNameForLocation(
            Array.isArray(params.site) ? params.site[0] : params.site,
            Array.isArray(params.building) ? params.building[0] : params.building,
            Array.isArray(params.floor) ? params.floor[0] : params.floor,
            Array.isArray(params.room) ? params.room[0] : params.room
          );
          if (switchName) {
            // Fetch active ports for this switch_name
            const res = await axios.get('http://18.117.181.30:3004/api/connectivity-map', { params: { switch_name: switchName } });
            const ports = Array.isArray(res.data?.data)
              ? res.data.data
                  .filter((row: any) => row.switch_name === switchName && row.switch_port != null)
                  .map((row: any) => Number(row.switch_port))
                  .filter((port: any) => !isNaN(port))
              : [];
            setSwitchActivePorts(ports);
          } else {
            setSwitchActivePorts([]);
          }
          setResult({ type: 'Switch', connectivity: [], location: {
            site: params.site,
            building: params.building,
            floor: params.floor,
            room: params.room,
            pp_serial_no: params.switchName || getSwitchNameForLocation(
              Array.isArray(params.site) ? params.site[0] : params.site,
              Array.isArray(params.building) ? params.building[0] : params.building,
              Array.isArray(params.floor) ? params.floor[0] : params.floor,
              Array.isArray(params.room) ? params.room[0] : params.room
            ) || '',
          }} as any);
          setLoading(false);
          return;
        }
        const info = await getApparatusInfo(typeof apparatusType === 'string' ? apparatusType : '');
        setResult(info);
        
        // Set active ports for IO
        if (info?.type === 'IO' && Array.isArray(info.connectivity)) {
          const ports = info.connectivity
            .map((row: any) => parseInt(row.io_port, 10))
            .filter((port: any) => !isNaN(port));
          setIoActivePorts(ports);
        }
      } catch (error) {
        if (apparatusType !== 'Switch') {
          console.error('Error fetching apparatus info:', error);
        }
        setResult(null);
      } finally {
        setLoading(false);
      }
    }
    if (apparatusType === 'Switch' && !showSwitchOverlay) return;
    fetchInfo();
  }, [apparatusType, params.site, params.building, params.floor, params.room, showSwitchOverlay]);

  const handlePanelPress = async (ru: string) => {
    if (result?.type !== 'PP') return;
    
    setSelectedPanel({ uri: PP_IMAGE, ru });
    setSelectedPanelPort(null);
    
    try {
      const fullMap = await getFullConnectivityMap({
        type: 'PP',
        pp_serial_no: result.location.pp_serial_no,
        ru: Number(ru)
      });
      
      const ports = fullMap
        .filter((row: any) => String(row.ru).trim() === String(ru).trim())
        .map((row: any) => parseInt(row.pp_port, 10))
        .filter((port: any) => !isNaN(port));
      
      setActivePorts(ports);
    } catch (error) {
      console.error('Error fetching PP connectivity:', error);
    }
  };

  const handleIOPortPress = async (port: number) => {
    if (result?.type !== 'IO') return;
    
    setSelectedIoPort(selectedIoPort === port ? null : port);
    if (selectedIoPort !== port) {
      try {
        const fullMap = await getFullConnectivityMap({
          type: 'IO',
          io_mac: result.location.io_mac,
          io_port: Number(port)
        });
        console.log('Full connectivity map for IO + port:', fullMap);
      } catch (error) {
        console.error('Error fetching IO connectivity:', error);
      }
    }
  };

  // Helper to build port color map for PP
  function getPPPortColorMap(ru: string): Record<number, string> {
    if (!result?.connectivity) return {};
    const map: Record<number, string> = {};
    result.connectivity.forEach((row: any) => {
      if (String(row.ru) === String(ru)) {
        const portNum = parseInt(row.pp_port, 10);
        if (!isNaN(portNum)) {
          map[portNum] = row.device_mac == null ? '#F7A800' : '#00C853';
        }
      }
    });
    return map;
  }

  // Helper to build port color map for IO
  function getIOPortColorMap(): Record<number, string> {
    if (!result?.connectivity) return {};
    const map: Record<number, string> = {};
    result.connectivity.forEach((row: any) => {
      const portNum = parseInt(row.io_port, 10);
      if (!isNaN(portNum)) {
        map[portNum] = row.device_mac == null ? '#F7A800' : '#00C853';
      }
    });
    return map;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <TopBar
        title="Apparatus View"
        showMenuIcon
        showBackButton
        onBackPress={() => router.back()}
      />
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Special case for Switch at the very top */}
        {apparatusType === 'Switch' && (
          <View style={[styles.imageStack, { marginTop: 0 }]}>
            <LocationInfoBox
              location={{
                site: params.site,
                building: params.building,
                floor: params.floor,
                room: params.room,
                switch_name: getSwitchNameForLocation(
                  Array.isArray(params.site) ? params.site[0] : params.site,
                  Array.isArray(params.building) ? params.building[0] : params.building,
                  Array.isArray(params.floor) ? params.floor[0] : params.floor,
                  Array.isArray(params.room) ? params.room[0] : params.room
                ),
              }}
              type="PP"
            />
            <TouchableOpacity onPress={() => setShowSwitchOverlay(true)}>
              <Image
                source={{ uri: SWITCH_IMAGE }}
                style={[styles.ppImage, { marginTop: 8 }]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}
        {apparatusType === 'Switch' ? null : loading ? (
          <ScannerStatus loading={true} />
        ) : result === null ? (
          <ScannerStatus error="Invalid or unknown apparatus" onRetry={() => router.replace('/connectivity/qr-scanner')} />
        ) : result.type === 'PP' ? (
          <View style={styles.imageStack}>
            <LocationInfoBox location={result.location} type="PP" />
            <Text style={styles.tapNote}>Tap on a panel for it's focused view</Text>
            {Array.from({ length: 8 }, (_, i) => {
              const ruNum = (i + 1).toString();
              const img = result.images && result.images.find(img => String(img.ru) === ruNum);
              const isLast = i === 7;
              // Build a map of portNum -> device_mac for this RU
              const portDeviceMacMap: Record<number, string | null | undefined> = {};
              if (result?.connectivity) {
                result.connectivity.forEach((row: any) => {
                  if (String(row.ru) === ruNum) {
                    const portNum = parseInt(row.pp_port, 10);
                    if (!isNaN(portNum)) {
                      portDeviceMacMap[portNum] = row.device_mac;
                    }
                  }
                });
              }
              return (
                <View key={ruNum} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isLast ? 32 : -50 }}>
                  <View style={styles.ppImage}>
                    {img ? (
                      <TouchableOpacity
                        style={{ width: Dimensions.get('window').width * 0.7, height: Dimensions.get('window').width * 0.4 }}
                        onPress={() => handlePanelPress(img.ru)}
                      >
                        <Image
                          source={{ uri: PP_IMAGE }}
                          style={[styles.ppImage, { position: 'absolute', top: 0, left: 0 }]}
                          resizeMode="contain"
                        />
                        {/* Port overlays for stack view */}
                        {Array.from({ length: 24 }, (_, j) => {
                          // Calculate port position (match PanelOverlay logic)
                          let currentLeft = 0;
                          for (let k = 0; k < j; k++) {
                            if ((k + 1) % 6 === 0 && k + 1 !== 24) {
                              currentLeft += ((styles.ppImage.width / 35 + (styles.ppImage.width - (styles.ppImage.width / 35) * 24) / (24 + 58)) * 3.75) / 8;
                            } else {
                              currentLeft += (styles.ppImage.width - (styles.ppImage.width / 35) * 24) / (24 + 58);
                            }
                            currentLeft += styles.ppImage.width / 35;
                          }
                          const portNum = j + 1;
                          const deviceMac = portDeviceMacMap[portNum];
                          let borderColor = 'transparent';
                          let fillColor = 'transparent';
                          let clickable = false;
                          if (deviceMac !== undefined) {
                            if (deviceMac === null) {
                              borderColor = '#F7A800';
                              fillColor = 'rgba(255,255,255,0.7)';
                              clickable = true;
                            } else {
                              borderColor = '#00C853';
                              fillColor = 'rgba(255,255,255,0.7)';
                              clickable = true;
                            }
                          }
                          const isSelected = selectedPanel && selectedPanel.ru === ruNum && selectedPanelPort === portNum;
                          if (isSelected && borderColor !== 'transparent') {
                            fillColor = borderColor;
                          }
                          return (
                            <View
                              key={portNum}
                              style={{
                                position: 'absolute',
                                left: currentLeft + PORT_LEFT_OFFSET,
                                top: 0.49 * (styles.ppImage.height || (Dimensions.get('window').width * 0.4)),
                                width: (styles.ppImage.width || (Dimensions.get('window').width * 0.7)) / 30,
                                height: (styles.ppImage.width || (Dimensions.get('window').width * 0.7)) / 30,
                                borderRadius: 3,
                                borderWidth: borderColor !== 'transparent' ? 3 : 0,
                                borderColor: borderColor,
                                backgroundColor: fillColor,
                                opacity: borderColor !== 'transparent' ? 1 : 0,
                                zIndex: 10,
                              }}
                            />
                          );
                        })}
                      </TouchableOpacity>
                    ) : (
                      <View style={{ flex: 1 }}>
                        <Image
                          source={{ uri: PP_IMAGE }}
                          style={[styles.ppImage, { position: 'absolute', top: 0, left: 0 }]}
                          resizeMode="contain"
                        />
                        <View style={{
                          ...StyleSheet.absoluteFillObject,
                          backgroundColor: 'rgba(255,255,255,0.65)',
                          borderRadius: 0,
                        }} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.ruText, { marginLeft: 6 }]}>
                    RU: <Text style={styles.ruValue}>{ruNum}</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        ) : result.type === 'IO' ? (
          <View style={styles.imageStack}>
            <LocationInfoBox location={result.location} type="IO" />
            <Text style={{ fontStyle: 'italic', color: '#666', fontSize: 14, marginBottom: 10, marginTop: 4, textAlign: 'center' }}>
              Tap any port to view it's connectivity map
            </Text>
            <IOOverlay
              imageUri={IO_IMAGES[result.prefix]}
              ioType={result.prefix}
              activePorts={ioActivePorts}
              selectedPort={selectedIoPort}
              onPortPress={handleIOPortPress}
              portColorMap={getIOPortColorMap()}
              customPortSize={result.prefix === 'FP2' ? 60 : undefined}
              customPortPositions={result.prefix === 'FP2' ? [
                { x: 0.52, y: 0.335 },
                { x: 0.52, y: 0.64 },
              ] : undefined}
            />
            <PortSelectionOverlay
              selectedPort={selectedIoPort ?? 0}
              onConfirm={() => {/* handleConfirmSelection(selectedIoPort) */}}
              ioType={result.prefix}
              ioMac={result.location.io_mac}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* SwitchOverlay rendered as a true overlay above everything */}
      {apparatusType === 'Switch' && showSwitchOverlay && (
        <SwitchOverlay
          imageUri={SWITCH_IMAGE}
          onClose={() => setShowSwitchOverlay(false)}
          activePorts={switchActivePorts}
          switchName={getSwitchNameForLocation(
            Array.isArray(params.site) ? params.site[0] : params.site,
            Array.isArray(params.building) ? params.building[0] : params.building,
            Array.isArray(params.floor) ? params.floor[0] : params.floor,
            Array.isArray(params.room) ? params.room[0] : params.room
          )}
        />
      )}

      {selectedPanel && (
        <PanelOverlay
          imageUri={selectedPanel.uri}
          ruValue={selectedPanel.ru}
          activePorts={activePorts}
          onClose={() => setSelectedPanel(null)}
          ppSerialNo={result?.location?.pp_serial_no || ''}
          selectedPort={selectedPanelPort}
          onPortPress={setSelectedPanelPort}
          customSelectedPort={selectedPanelPort}
          customPortColorMap={selectedPanel ? getPPPortColorMap(selectedPanel.ru) : {}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  imageStack: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
  },
  image: {
    width: Dimensions.get('window').width * 1.75,
    height: Dimensions.get('window').width * 1.0,
    marginVertical: 18,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  ppImage: {
    width: Dimensions.get('window').width * 0.7,
    height: Dimensions.get('window').width * 0.4,
    marginVertical: 1.125,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  ruText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  ruValue: {
    fontSize: 16,
    color: '#F7A800',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  tapNote: {
    fontStyle: 'italic',
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
}); 