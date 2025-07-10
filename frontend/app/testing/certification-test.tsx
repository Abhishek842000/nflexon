import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import TopBar from '../components/TopBar';
import PPOverlay from '../components/PPOverlay';
import IOFaceplateOverlay from '../components/IOFaceplateOverlay';
import { IO_IMAGES, PP_IMAGE } from '../config/assets';
import type { PPInfo, IOInfo } from '../contexts/SessionContext';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import axios from 'axios';
import LocationInfoBox from '../components/LocationInfoBox';
import PanelOverlay from '../components/PanelOverlay';
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
import ConnectionInfoBox from '../components/ConnectionInfoBox';

const { width } = Dimensions.get('window');

// Add panel dimensions and port positioning constants
const PANEL_WIDTH = width * 0.76; // Match PPOverlay width
const PANEL_HEIGHT = PANEL_WIDTH * 0.4 / 0.7; // maintain aspect ratio
const BUTTON_SIZE = PANEL_WIDTH / 35;
const BUTTON_Y = PANEL_HEIGHT * 0.49;
const BUTTON_SPACING = (PANEL_WIDTH - BUTTON_SIZE * 24) / (24 + 58);
const BUTTON_X_OFFSET = BUTTON_SPACING + 28;

const API_BASE = 'http://18.117.181.30:3004/api';

export default function CertificationTest() {
  const { apparatusType, connections: connectionsParam } = useLocalSearchParams();
  const [type, setType] = useState<'PP' | 'IO' | null>(null);
  const [ppSerial, setPpSerial] = useState('');
  const [ioType, setIoType] = useState('');
  const [ioMac, setIoMac] = useState('');
  const [activePortsByRU, setActivePortsByRU] = useState<Record<string, number[]>>({});
  const [activeIOPorts, setActiveIOPorts] = useState<number[]>([]);
  const [connections, setConnections] = useState<any[]>([]); // [{pp_serial_no, ru, pp_port, io_mac, io_port}]
  const [selectedPanel, setSelectedPanel] = useState<{ ru: string } | null>(null);
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [selectedIO, setSelectedIO] = useState<{ io_mac: string; io_type: string; io_port: number } | null>(null);
  const [selectedRU, setSelectedRU] = useState<string | null>(null);
  const router = useRouter();

  // Add state for IO port color mapping
  const [ioPortColorMap, setIoPortColorMap] = useState<Record<number, string>>({});
  const [ioPortToPPPort, setIoPortToPPPort] = useState<Record<number, { pp_serial_no: string; ru: string; pp_port: number } | null>>({});

  // Add state for IO port hex color mapping for PP overlays
  const [ioPortHexColorMap, setIoPortHexColorMap] = useState<Record<number, string>>({});

  // Add state for IO and PP location
  const [ioLocation, setIoLocation] = useState<any>(null);
  const [ppLocation, setPpLocation] = useState<any>(null);

  // Add state for focused panel
  const [focusedPanel, setFocusedPanel] = useState<{ ru: string } | null>(null);

  // Add state for global PP port color map for selected IO
  const [globalPPPortColorMap, setGlobalPPPortColorMap] = useState<Record<number, string>>({});

  // Parse apparatusType from QR
  useEffect(() => {
    if (!apparatusType || typeof apparatusType !== 'string') return;
    if (apparatusType.length > 22) {
      setType('PP');
      setPpSerial(apparatusType.slice(0, 22));
    } else {
      setType('IO');
      setIoType(apparatusType.slice(0, 3));
      setIoMac(apparatusType.slice(4));
      console.log('ioMac:', apparatusType.slice(4));
    }
  }, [apparatusType]);

  // Fetch all connections for the scanned PP or IO from the backend
  useEffect(() => {
    if (type === 'PP' && ppSerial) {
      axios.get(`${API_BASE}/pp-connectivity/serial/${encodeURIComponent(ppSerial)}`)
        .then(res => setConnections(res.data || []))
        .catch(() => setConnections([]));
    } else if (type === 'IO' && ioMac) {
      axios.get(`${API_BASE}/pp-connectivity/io_mac/${encodeURIComponent(ioMac)}`)
        .then(res => setConnections(res.data || []))
        .catch(() => setConnections([]));
    }
  }, [type, ppSerial, ioMac]);

  useEffect(() => {
    console.log('Connections used for active ports:', connections);
  }, [connections]);

  // Compute active ports
  useEffect(() => {
    if (type === 'PP' && ppSerial && connections.length > 0) {
      const active = getActivePortsForPP(ppSerial, connections);
      console.log('Active ports by RU:', active);
      setActivePortsByRU(active);
    } else if (type === 'IO' && ioMac && connections.length > 0) {
      const active = getActivePortsForIO(ioMac, connections);
      console.log('Active IO ports:', active);
      setActiveIOPorts(active);
    }
  }, [type, ppSerial, ioMac, connections]);

  // Update useEffect for color mapping
  useEffect(() => {
    if (type === 'PP' && ppSerial && selectedPort && focusedPanel) {
      setIoPortColorMap(getPPPortColorMap(ppSerial, focusedPanel.ru, selectedPort, connections));
    } else if (type === 'PP' && selectedIO && selectedPort) {
      setIoPortColorMap(getIOPortColorMap(selectedIO.io_mac, selectedIO.io_port, connections));
    } else if (type === 'IO' && ioMac && selectedPort) {
      setIoPortColorMap(getIOPortColorMap(ioMac, selectedPort, connections));
    }
  }, [type, ppSerial, selectedPort, selectedIO, focusedPanel, connections, ioMac]);

  // Fetch IO location on mount
  useEffect(() => {
    if (type === 'IO' && ioMac) {
      axios.get(`${API_BASE}/io-location/${encodeURIComponent(ioMac)}`)
        .then(res => setIoLocation(res.data && res.data[0] ? res.data[0] : null))
        .catch(() => setIoLocation(null));
    }
  }, [type, ioMac]);

  // Fetch PP location when selectedPort changes and a connection exists
  useEffect(() => {
    if (type === 'IO' && selectedPort && connections.length > 0) {
      // Find the connection for selected IO port
      const conn = connections.find(
        c => c.io_mac === ioMac && c.io_port === selectedPort
      );
      if (conn && conn.pp_serial_no) {
        axios.get(`${API_BASE}/pp-location/${encodeURIComponent(conn.pp_serial_no)}`)
          .then(res => setPpLocation(res.data && res.data[0] ? res.data[0] : null))
          .catch(() => setPpLocation(null));
      } else {
        setPpLocation(null);
      }
    } else {
      setPpLocation(null);
    }
  }, [type, selectedPort, ioMac, connections]);

  // Add function to find connected IO for a PP port
  const findConnectedIO = (ppSerial: string, ru: string, ppPort: number) => {
    const connection = connections.find(
      c => c.pp_serial_no === ppSerial && Number(c.ru) === Number(ru) && c.pp_port === ppPort
    );
    if (connection) {
      const ioInfo = connections.find((c: any) => c.io_mac === connection.io_mac);
      return {
        io_mac: connection.io_mac,
        io_type: ioInfo ? ioInfo.io_type : '',
        io_port: connection.io_port
      };
    }
    return null;
  };

  // Add function to handle port confirmation
  const handlePortConfirmation = (ppPort: number) => {
    if (!focusedPanel || !ppSerial) return;
    setSelectedRU(focusedPanel.ru);
    const connectedIO = findConnectedIO(ppSerial, focusedPanel.ru, ppPort);
    if (connectedIO) {
      // Fetch IO location to get io_type
      axios.get(`${API_BASE}/io-location/${encodeURIComponent(connectedIO.io_mac)}`)
        .then(res => {
          if (res.data && res.data[0]) {
            setIoLocation(res.data[0]);
            setSelectedIO({
              io_mac: connectedIO.io_mac,
              io_type: res.data[0].io_type, // Use io_type from location
              io_port: connectedIO.io_port
            });
          } else {
            setSelectedIO({
              io_mac: connectedIO.io_mac,
              io_type: '', // fallback
              io_port: connectedIO.io_port
            });
          }
        })
        .catch(() => {
          setIoLocation(null);
          setSelectedIO({
            io_mac: connectedIO.io_mac,
            io_type: '', // fallback
            io_port: connectedIO.io_port
          });
        });
      setSelectedPort(ppPort);
    }
    setFocusedPanel(null);
  };

  // Add useEffect to update active IO ports when selectedIO changes
  useEffect(() => {
    if (selectedIO) {
      const ports = connections
        .filter(c => c.io_mac === selectedIO.io_mac)
        .map(c => c.io_port);
      setActiveIOPorts(ports);
    }
  }, [selectedIO, connections]);

  // Debug: log render check when selectedIO, type, or ppSerial changes
  useEffect(() => {
    console.log('Render check:', { selectedIO, type, ppSerial });
  }, [selectedIO, type, ppSerial]);

  // When a port is confirmed and an IO is selected, build the global color map
  useEffect(() => {
    if (selectedIO && selectedIO.io_port && selectedPort) {
      // Find all connections for the selected IO (across all RUs)
      const ioConnections = connections.filter(
        (conn) => conn.io_mac === selectedIO.io_mac
      );
      // Assign palette colors to each IO port of the selected IO
      const PALETTE = ['rgba(211,47,47,0.7)', 'rgba(25,118,210,0.7)', 'rgba(251,192,45,0.7)', 'rgba(245,124,0,0.7)', 'rgba(123,31,162,0.7)', 'rgba(136,136,136,0.7)'];
      let ioPortToColor: Record<number, string> = {};
      // Sort by io_port for stable color assignment
      const ioPorts = Array.from(new Set(ioConnections.map(conn => conn.io_port))).sort((a, b) => a - b);
      let paletteIdx = 1; // Start from 1, so PALETTE[1] is the first non-red color
      ioPorts.forEach(port => {
        if (selectedIO.io_port && port === selectedIO.io_port) {
          ioPortToColor[port] = PALETTE[0]; // red
        } else {
          ioPortToColor[port] = PALETTE[paletteIdx % (PALETTE.length - 1) + 1]; // skip red
          paletteIdx++;
        }
      });
      // For each PP port connected to the selected IO, assign the color of its corresponding IO port
      let ppPortToColor: Record<number, string> = {};
      ioConnections.forEach(conn => {
        ppPortToColor[conn.pp_port] = ioPortToColor[conn.io_port];
      });
      setGlobalPPPortColorMap(ppPortToColor);
    } else {
      setGlobalPPPortColorMap({});
    }
  }, [selectedIO, selectedPort, connections]);

  // In the CertificationTest component, after computing activePortsByRU, update:
  const globalPPPortColorMapByRU = getGlobalPPPortColorMap(
    connections,
    selectedIO,
    selectedPort,
    selectedRU
  );

  // Add useEffect to preserve PP location when type is PP
  useEffect(() => {
    if (type === 'PP' && ppSerial && !ppLocation) {
      axios.get(`${API_BASE}/pp-location/${encodeURIComponent(ppSerial)}`)
        .then(res => setPpLocation(res.data && res.data[0] ? res.data[0] : null))
        .catch(() => setPpLocation(null));
    }
  }, [type, ppSerial, ppLocation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <TopBar 
        title="Certification Test" 
        showMenuIcon 
        showScannerIcon 
        onScannerPress={() => router.replace('/testing/qr-scanner2')}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {type === 'PP' && ppSerial ? (
          <View style={styles.imageStack}>
            {/* PP Location InfoBox above stack view */}
            <LocationInfoBox location={ppLocation} type="PP" />
            {/* Connectivity Information Table (only show selected connection) */}
            {selectedPort && selectedRU && (() => {
              const conn = connections.find(
                c => c.pp_serial_no === ppSerial && String(c.ru) === String(selectedRU) && c.pp_port === selectedPort
              );
              if (!conn) return null;
              return (
                <View style={styles.connectivityTableContainer}>
                  <Text style={styles.connectivityTableTitle}>Connectivity Information</Text>
                  <View style={styles.tableRowHeader}>
                    <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>RU</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>PP Port</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>IO Type</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>IO MAC</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>IO Port</Text>
                  </View>
                  <View style={[styles.tableRow, styles.selectedRow]}> 
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{conn.ru}</Text>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{conn.pp_port}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{ioLocation?.io_type || '-'}</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{conn.io_mac}</Text>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{conn.io_port}</Text>
                  </View>
                </View>
              );
            })()}
            {/* Connection Info Box for selected port */}
            {selectedPort && selectedPanel && (() => {
              // Find the connection for the selected port and RU
              const conn = connections.find(
                c => c.pp_serial_no === ppSerial && String(c.ru) === String(selectedPanel.ru) && c.pp_port === selectedPort
              );
              if (!conn) return null;
              return (
                <ConnectionInfoBox ru={selectedPanel.ru} ppPort={selectedPort} ioPort={conn.io_port} />
              );
            })()}
            {Array.from({ length: 8 }, (_, i) => {
              const ruNum = (i + 1).toString();
              const activePorts = activePortsByRU[ruNum] || [];
              const hasActive = activePorts.length > 0;
              const portColorMap = globalPPPortColorMapByRU[ruNum] || {};
              return (
                <View key={ruNum} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i === 7 ? 16 : -2 }}>
                  <View>
                    {hasActive ? (
                      <TouchableOpacity
                        onPress={() => {
                          setFocusedPanel({ ru: ruNum });
                        }}
                      >
                        <View style={{ width: PANEL_WIDTH, height: PANEL_HEIGHT }}>
                          <Image
                            source={{ uri: PP_IMAGE }}
                            style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}
                            resizeMode="contain"
                          />
                          {Array.from({ length: 24 }, (_, i) => {
                            const portNum = i + 1;
                            const isActive = activePorts.includes(portNum);
                            const colorObj = portColorMap[portNum];
                            let currentLeft = BUTTON_X_OFFSET;
                            for (let j = 0; j < i; j++) {
                              if ((j + 1) % 6 === 0 && j + 1 !== 24) {
                                currentLeft += BUTTON_SPACING * 3.75;
                              } else {
                                currentLeft += BUTTON_SPACING;
                              }
                              currentLeft += BUTTON_SIZE;
                            }
                            return (
                              <View
                                key={portNum}
                                style={[
                                  styles.portButton,
                                  isActive
                                    ? colorObj
                                      ? {
                                          left: currentLeft,
                                          top: BUTTON_Y,
                                          borderColor: colorObj.borderColor,
                                          borderWidth: 2,
                                          backgroundColor: colorObj.backgroundColor,
                                          opacity: 1,
                                        }
                                      : {
                                          left: currentLeft,
                                          top: BUTTON_Y,
                                          borderColor: 'rgba(255,255,255,0.7)',
                                          borderWidth: 2,
                                          backgroundColor: 'rgba(255,255,255,0.7)',
                                          opacity: 1,
                                        }
                                    : {
                                        left: currentLeft,
                                        top: BUTTON_Y,
                                        borderColor: 'transparent',
                                        borderWidth: 0,
                                        backgroundColor: 'transparent',
                                        opacity: 0,
                                      },
                                ]}
                              />
                            );
                          })}
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ width: PANEL_WIDTH, height: PANEL_HEIGHT }}>
                        <Image
                          source={{ uri: PP_IMAGE }}
                          style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }}
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
                  <Text style={[styles.ruText, { marginLeft: 6 }]}>RU: <Text style={styles.ruValue}>{ruNum}</Text></Text>
                </View>
              );
            })}
            {/* Only show IO overlay for selectedIO in PP scan mode */}
            {selectedIO && (
              <View style={styles.ioContainer}>
                {/* IO Location InfoBox with only Room and Additional Description */}
                <LocationInfoBox
                  location={ioLocation}
                  type="IO"
                  hideFields={["site", "building", "floor"]}
                />
                <IOFaceplateOverlay
                  imageUri={IO_IMAGES[selectedIO.io_type]}
                  ioType={selectedIO.io_type as any}
                  activePorts={activeIOPorts}
                  selectedPort={selectedIO.io_port}
                  onPortPress={(port) => {
                    // Find the connected PP port
                    const connection = connections.find(
                      c => c.io_mac === selectedIO.io_mac && c.io_port === port
                    );
                    if (connection) {
                      setSelectedPort(connection.pp_port);
                      setSelectedIO({
                        io_mac: selectedIO.io_mac,
                        io_type: selectedIO.io_type,
                        io_port: port
                      });
                      setSelectedRU(connection.ru);
                    }
                  }}
                  portColorMap={getIOPortColorMapForIOWithSelected(selectedIO.io_mac, selectedIO.io_port, connections)}
                />
              </View>
            )}
          </View>
        ) : type === 'IO' && ioType && ioMac ? (
          <>
            {/* Location box above IO overlay */}
            <LocationInfoBox location={ioLocation} type="IO" />
            {/* IO overlay (original color mapping logic, but with new palette and matching logic) */}
            <IOFaceplateOverlay
              imageUri={IO_IMAGES[ioType]}
              ioType={ioType as any}
              activePorts={activeIOPorts}
              selectedPort={selectedPort}
              onPortPress={(port) => {
                if (selectedPort === port) {
                  setSelectedPort(null);
                } else {
                  setSelectedPort(port);
                }
              }}
              portColorMap={selectedPort ? getIOPortColorMapForIOWithSelected(ioMac, selectedPort, connections) : {}}
            />
            {/* Patch Panel Connection info box below IO overlay */}
            {selectedPort && (() => {
              const conn = connections.find(c => c.io_mac === ioMac && c.io_port === selectedPort);
              if (!conn) return null;
              return (
                <View style={{ width: '90%', alignSelf: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginBottom: 8, marginTop: 8 }}>
                  <Text style={{ fontSize: 15, color: '#222', marginBottom: 2 }}>
                    <Text style={{ fontWeight: 'bold' }}>Selected IO Port: </Text>{selectedPort}
                  </Text>
                  <Text style={{ fontSize: 15, color: '#222' }}>
                    <Text style={{ fontWeight: 'bold' }}>Patch Panel Connection - RU: </Text>{conn.ru}, <Text style={{ fontWeight: 'bold' }}>Port: </Text>{conn.pp_port}
                  </Text>
                </View>
              );
            })()}
            {/* PPOverlay and its location info (only when a port is selected) */}
            {selectedPort && (
              <>
                <View style={{ marginTop: 32, width: '100%' }}>
                  {Array.from({ length: 8 }, (_, i) => {
                    const ruNum = (i + 1).toString();
                    const allConnectedPPPorts = connections
                      .filter(c => c.io_mac === ioMac && c.ru.toString() === ruNum)
                      .map(c => ({ pp_port: Number(c.pp_port), io_port: Number(c.io_port) }));
                    // Build portColorMap for this RU: match PP port color to IO port color
                    const ioPortColorMap = getIOPortColorMapForIOWithSelected(ioMac, selectedPort, connections);
                    const portColorMap: Record<number, string> = {};
                    allConnectedPPPorts.forEach(p => {
                      portColorMap[p.pp_port] = ioPortColorMap[p.io_port] || '#888888';
                    });
                    const hasActive = allConnectedPPPorts.length > 0;
                    return (
                      <View key={ruNum} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i === 7 ? 2 : 0 }}>
                        <View style={{ width: PANEL_WIDTH, height: PANEL_HEIGHT }}>
                          {hasActive ? (
                            <PPOverlay
                              imageUri={PP_IMAGE}
                              activePorts={allConnectedPPPorts.map(p => p.pp_port)}
                              portColorMap={portColorMap}
                            />
                          ) : (
                            <PPOverlay
                              imageUri={PP_IMAGE}
                              activePorts={[]}
                              showWhiteOverlay
                            />
                          )}
                        </View>
                        <Text style={[styles.ruText, { marginLeft: 8, marginTop: 0, marginBottom: 0, alignSelf: 'center' }]}>RU: <Text style={styles.ruValue}>{ruNum}</Text></Text>
                      </View>
                    );
                  })}
                </View>
                {/* PP location info below PPOverlay */}
                <LocationInfoBox location={ppLocation} type="PP" hideFields={["site","building","floor"]} />
                <View style={{ height: 10 }} />
              </>
            )}
          </>
        ) : (
          <Text style={{ marginTop: 40, textAlign: 'center', color: '#888' }}>No connections found for this session.</Text>
        )}
      </ScrollView>

      {/* Move PanelOverlay outside of ScrollView */}
      {focusedPanel && type === 'PP' && ppSerial && (
        <PanelOverlay
          imageUri={PP_IMAGE}
          onClose={() => {
            setFocusedPanel(null);
          }}
          ruValue={focusedPanel.ru}
          activePorts={activePortsByRU[focusedPanel.ru] || []}
          ppSerialNo={ppSerial}
          selectedPort={selectedPort}
          onPortPress={(port) => {
            setSelectedPort(port);
          }}
          onConfirm={() => {
            if (selectedPort) {
              handlePortConfirmation(selectedPort);
            }
          }}
          customPortColorMap={(() => {
            const map = globalPPPortColorMapByRU[focusedPanel.ru] || {};
            const colorMap: Record<number, string> = {};
            Object.entries(map).forEach(([port, obj]) => {
              colorMap[Number(port)] = (obj as { backgroundColor: string }).backgroundColor;
            });
            // Always override the selected port to red if it is active
            if (selectedPort && (activePortsByRU[focusedPanel.ru] || []).includes(selectedPort)) {
              colorMap[selectedPort] = 'red';
            }
            return colorMap;
          })()}
          customSelectedPort={selectedPort || null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 0,
    paddingHorizontal: 12,
  },
  imageStack: {
    width: '100%',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#F7A800',
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    color: '#222',
    fontSize: 14,
    textAlign: 'center',
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
  ppImage: {
    width: width * 0.7,
    height: width * 0.4,
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
  portButton: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 4,
    zIndex: 10,
  },
  ioContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  connectivityTableContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectivityTableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  tableScrollView: {
    maxHeight: 200,
  },
  selectedRow: {
    backgroundColor: 'rgba(211,47,47,0.1)',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#F7A800',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
});
