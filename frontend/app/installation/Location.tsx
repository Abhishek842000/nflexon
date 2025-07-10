import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { IO_IMAGES, PP_IMAGE } from '../config/assets';
import type { KeyboardTypeOptions } from 'react-native';
import LocationTopBar from '../components/LocationTopBar';
import { useSession } from '../contexts/SessionContext';

const { width } = Dimensions.get('window');

const API_BASE = 'http://18.117.181.30:3004/api';

export default function LocationDetails() {
  const { apparatusType } = useLocalSearchParams();
  const [formData, setFormData] = useState({
    site: '',
    building: '',
    floor: '',
    room: '',
    rack: '',
    additional_description: '',
  });
  const [loading, setLoading] = useState(true);
  const [isPP, setIsPP] = useState(false);
  const [isExistingPP, setIsExistingPP] = useState(false);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  const [error, setError] = useState('');
  const [ppSerial, setPpSerial] = useState('');
  const [ppMac, setPpMac] = useState('');
  const [ioType, setIoType] = useState('');
  const [ioMac, setIoMac] = useState('');
  const { pps, ios, addPP, addIO, clearSession, firstApparatusLocation, setFirstApparatusLocation } = useSession();

  // Parse apparatusType from QR
  useEffect(() => {
    if (!apparatusType || typeof apparatusType !== 'string') return;
    // PP: 22 chars serial + space + 17 char MAC
    if (apparatusType.length > 22) {
      setIsPP(true);
      setPpSerial(apparatusType.slice(0, 22));
      setPpMac(apparatusType.slice(23));
    } else {
      setIsPP(false);
      setIoType(apparatusType.slice(0, 3));
      setIoMac(apparatusType.slice(4));
    }
  }, [apparatusType]);

  // Fetch existing PP location if PP
  useEffect(() => {
    let isMounted = true;
    async function fetchPPLocation() {
      if (isPP && ppSerial) {
        setLoading(true);
        setFieldsLocked(false);
        setIsExistingPP(false);
        setError('');
        try {
          const res = await fetch(`${API_BASE}/pp-location/${encodeURIComponent(ppSerial)}`);
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Existing PP, prepopulate and lock fields
            if (isMounted) {
              setFormData({
                site: data[0].site || '',
                building: data[0].building || '',
                floor: data[0].floor !== undefined && data[0].floor !== null ? String(data[0].floor) : '',
                room: data[0].room || '',
                rack: data[0].rack || '',
                additional_description: '',
              });
              setIsExistingPP(true);
              setFieldsLocked(true);
              // Save to session context if this is the first apparatus
              if (!firstApparatusLocation) {
                setFirstApparatusLocation({
                  site: data[0].site || '',
                  building: data[0].building || '',
                  floor: data[0].floor !== undefined && data[0].floor !== null ? String(data[0].floor) : '',
                });
              }
            }
          } else {
            // New PP
            if (isMounted) {
              if (firstApparatusLocation) {
                // Not first scan - autopopulate Site, Building, Floor
                setFormData({
                  site: firstApparatusLocation.site,
                  building: firstApparatusLocation.building,
                  floor: firstApparatusLocation.floor,
                  room: '',
                  rack: '',
                  additional_description: '',
                });
              } else {
                // First scan - leave all fields empty
                setFormData({ 
                  site: '', 
                  building: '', 
                  floor: '', 
                  room: '', 
                  rack: '', 
                  additional_description: '' 
                });
              }
              setIsExistingPP(false);
              setFieldsLocked(false);
            }
          }
        } catch (e) {
          if (isMounted) setError('Failed to fetch PP location');
        } finally {
          if (isMounted) setLoading(false);
        }
      } else if (!isPP && ioMac) {
        // For IOs
        if (isMounted) {
          if (firstApparatusLocation) {
            // Not first scan - autopopulate Site, Building, Floor
            setFormData({
              site: firstApparatusLocation.site,
              building: firstApparatusLocation.building,
              floor: firstApparatusLocation.floor,
              room: '',
              rack: '',
              additional_description: '',
            });
          } else {
            // First scan - leave all fields empty
            setFormData({ 
              site: '', 
              building: '', 
              floor: '', 
              room: '', 
              rack: '', 
              additional_description: '' 
            });
          }
          setLoading(false);
        }
      } else {
        if (isMounted) setLoading(false);
      }
    }
    fetchPPLocation();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPP, ppSerial, ioMac, firstApparatusLocation]);

  // Handle input change
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper to get port count from io_type (e.g., FP6 -> 6, SB2 -> 2)
  function ioPortCount(type: string): number {
    const match = type.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }

  // Submit handler
  const handleSubmit = async (proceed: boolean) => {
    setLoading(true);
    setError('');
    try {
      if (isPP) {
        if (!isExistingPP) {
          const payload = {
            pp_serial_no: ppSerial,
            pp_mac: ppMac,
            site: formData.site,
            building: formData.building,
            floor: formData.floor,
            room: formData.room,
            rack: formData.rack,
          };
          const res = await fetch(`${API_BASE}/pp-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to save PP location');
          if (!firstApparatusLocation) {
            setFirstApparatusLocation({
              site: formData.site,
              building: formData.building,
              floor: formData.floor,
            });
          }
        }
        addPP({ pp_serial_no: ppSerial });
        // Use the up-to-date array for navigation/API
        var allPPs = [...pps, { pp_serial_no: ppSerial }];
        var allIOs = ios;
      } else {
        const payload = {
          io_type: ioType,
          io_mac: ioMac,
          site: formData.site,
          building: formData.building,
          floor: formData.floor,
          room: formData.room,
          additional_description: formData.additional_description,
        };
        const res = await fetch(`${API_BASE}/io-location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save IO location');
        if (!firstApparatusLocation) {
          setFirstApparatusLocation({
            site: formData.site,
            building: formData.building,
            floor: formData.floor,
          });
        }
        addIO({ io_type: ioType, io_mac: ioMac });
        // Use the up-to-date array for navigation/API
        var allPPs = pps;
        var allIOs = [...ios, { io_type: ioType, io_mac: ioMac }];
      }
      // Auto-connectivity logic
      if (proceed) {
        if (allPPs.length > 0 && allIOs.length > 0) {
          await fetch(`${API_BASE}/auto-connectivity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pps: allPPs, ios: allIOs }),
          });
          const totalPorts = allIOs.reduce((sum, io) => sum + ioPortCount(io.io_type), 0);
          setTimeout(() => {
            router.push({ pathname: '/installation/cabling-instructions', params: { totalPorts: String(totalPorts), pps: JSON.stringify(allPPs), ios: JSON.stringify(allIOs) } });
          }, 100);
        } else {
          setTimeout(() => {
            router.push('/installation/qr-scanner');
          }, 100);
        }
      } else {
        setTimeout(() => {
          router.push('/installation/qr-scanner');
        }, 100);
      }
    } catch (e) {
      setError('Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  // Apparatus image
  let apparatusImage = '';
  let apparatusLabel = '';
  if (isPP) {
    apparatusImage = PP_IMAGE;
    apparatusLabel = 'Patch Panel';
  } else if (ioType && IO_IMAGES[ioType]) {
    apparatusImage = IO_IMAGES[ioType];
    apparatusLabel = ioType;
  }

  return (
    <View style={styles.container}>
      <LocationTopBar title="Location Details" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {apparatusImage ? (
            <Image
              source={{ uri: apparatusImage }}
              style={[
                isPP ? styles.apparatusImage : styles.apparatusImageIO,
                !isPP && {
                  width: (width - 48) * (ioType?.startsWith('SB') ? 1 : 2),
                  height: ioType?.startsWith('SB') ? 90 : 180,
                }
              ]}
              resizeMode="contain"
            />
          ) : null}
          {/* Apparatus Info (below image) */}
          <Text style={styles.apparatusInfo}>
            {isPP
              ? `24-Port Patch Panel\nSerial No: ${ppSerial}, MAC: ${ppMac}`
              : ioType && ioMac
                ? `Type: ${ioType}\nMAC: ${ioMac}`
                : ''}
          </Text>
          {/* Form */}
          {loading ? (
            <ActivityIndicator size="large" color="#F7A800" style={{ marginVertical: 32 }} />
          ) : (
            <View style={styles.formContainer}>
              <FormField
                label="Site/Campus"
                value={formData.site}
                onChangeText={(v: string) => handleChange('site', v)}
                editable={!fieldsLocked}
                required
              />
              <FormField
                label="Building"
                value={formData.building}
                onChangeText={(v: string) => handleChange('building', v)}
                editable={!fieldsLocked}
                required
              />
              <FormField
                label="Floor #"
                value={formData.floor}
                onChangeText={v => handleChange('floor', v)}
                editable={!fieldsLocked}
                keyboardType="numeric"
                required
              />
              <FormField
                label="Room"
                value={formData.room}
                onChangeText={(v: string) => handleChange('room', v)}
                editable={!fieldsLocked}
                required
              />
              {isPP ? (
                <FormField
                  label="Rack"
                  value={formData.rack}
                  onChangeText={(v: string) => handleChange('rack', v)}
                  editable={!fieldsLocked}
                  required
                />
              ) : (
                <FormField
                  label="Additional Description"
                  value={formData.additional_description}
                  onChangeText={(v: string) => handleChange('additional_description', v)}
                  editable={!fieldsLocked}
                  required
                  multiline
                />
              )}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSmall, { marginRight: 10 }]}
                  onPress={() => handleSubmit(false)}
                  disabled={loading}
                >
                  <Text style={styles.buttonTextSmall}>Submit & Scan More</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSmall]}
                  onPress={() => handleSubmit(true)}
                  disabled={loading}
                >
                  <Text style={styles.buttonTextSmall}>Submit & Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  editable = true,
  required = false,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  editable?: boolean;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 18, fontWeight: '400', color: '#222', marginBottom: 6 }}>
        {label}{required && <Text style={{ color: 'red' }}> *</Text>}
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#E5E7EB',
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          backgroundColor: editable ? '#F9FAFB' : '#F3F4F6',
          color: editable ? '#222' : '#888',
          minHeight: multiline ? 80 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 40,
  },
  apparatusImage: {
    width: width - 48,
    height: 90,
    marginTop: 2,
    marginBottom: 20,
    alignSelf: 'center',
  },
  apparatusImageIO: {
    marginTop: 2,
    marginBottom: 20,
    alignSelf: 'center',
  },
  apparatusInfo: {
    fontSize: 16.5,
    fontWeight: '400',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  button: {
    backgroundColor: '#F7A800',
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#F7A800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonSmall: {
    width: 165,
    height: 56,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: undefined,
    maxWidth: undefined,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 6,
  },
  buttonTextSmall: {
    color: '#222',
    fontSize: 13,
    fontWeight: 'bold',
  },
  error: {
    color: '#EF4444',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
});



