import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import TopBar from '../components/TopBar';
import { router } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { generateSwitchName } from '../utils/switchUtils';
import { getAvailableApparatusOptions, isFormValid } from '../utils/validationUtils';
import { getLocationFieldOptions, getSelectedRecord } from '../utils/dropdownUtils';
import { fetchLocationData } from '../utils/dataUtils';
import { styles } from '../utils/styles';

export default function ActiveLinkSearch() {
  const [loading, setLoading] = useState(true);
  const [apparatus, setApparatus] = useState<string | null>(null);
  const [site, setSite] = useState<string | null>(null);
  const [building, setBuilding] = useState<string | null>(null);
  const [floor, setFloor] = useState<string | number | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [rack, setRack] = useState<string | null>(null);
  const [additionalDescription, setAdditionalDescription] = useState<string | null>(null);
  const [ppLocations, setPpLocations] = useState<any[]>([]);
  const [ioLocations, setIoLocations] = useState<any[]>([]);
  const [switchLocations, setSwitchLocations] = useState<any[]>([]);

  // Fetch all locations for dropdowns
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchLocationData();
      setPpLocations(data.ppLocations);
      setIoLocations(data.ioLocations);
      setSwitchLocations(data.switchLocations);
      setLoading(false);
    }
    loadData();
  }, []);

  // Clear dependent fields when parent fields change
  useEffect(() => {
    if (apparatus && apparatus !== 'Switch') {
      const isValid = getAvailableApparatusOptions(site, building, floor, room, switchLocations, ppLocations, ioLocations)
        .some(opt => opt.value === apparatus);
      if (!isValid) {
        setApparatus(null);
        setRack(null);
        setAdditionalDescription(null);
      }
    }
    
    if (apparatus === 'Switch') {
      const matchingSwitches = switchLocations.filter(switchLoc => 
        (site ? switchLoc.site === site : true) && 
        (building ? switchLoc.building === building : true) && 
        (floor ? String(switchLoc.floor) === String(floor) : true) &&
        (room ? switchLoc.room === room : true)
      );
      
      if (matchingSwitches.length === 0) {
        setApparatus(null);
      }
    }
  }, [site, building, floor, room, switchLocations]);

  function getDropdownOptions(field: string) {
    if (field === 'apparatus') {
      return getAvailableApparatusOptions(site, building, floor, room, switchLocations, ppLocations, ioLocations);
    }
    return getLocationFieldOptions(field, apparatus, site, building, floor, room, switchLocations, ppLocations, ioLocations);
  }

  function handleSubmit() {
    const record = getSelectedRecord(apparatus, site, building, floor, room, rack, additionalDescription, switchLocations, ppLocations, ioLocations);
    if (!record) return;
    
    if (apparatus === 'PP') {
      const qrString = `${record.pp_serial_no} ${record.pp_mac}`;
      router.push({ pathname: '/connectivity/apparatus-view', params: { apparatusType: qrString } });
    } else if (apparatus === 'Switch') {
      const switchName = generateSwitchName(site!, building!, floor!.toString(), room!);
      router.push({
        pathname: '/connectivity/apparatus-view',
        params: { apparatusType: 'Switch', site, building, floor, room, switchName }
      });
    } else {
      const qrString = `${apparatus} ${record.io_mac}`;
      router.push({ pathname: '/connectivity/apparatus-view', params: { apparatusType: qrString } });
    }
  }

  function clearAllSelections() {
    setSite(null);
    setBuilding(null);
    setFloor(null);
    setRoom(null);
    setRack(null);
    setAdditionalDescription(null);
    setApparatus(null);
  }

  const renderDropdown = (field: string, value: any, onChange: (item: any) => void, placeholder: string) => (
    <View style={styles.coolDropdownContainer}>
      <Dropdown
        style={styles.coolDropdown}
        containerStyle={styles.coolDropdownContainer}
        placeholderStyle={styles.coolDropdownPlaceholder}
        selectedTextStyle={styles.coolDropdownSelectedText}
        itemTextStyle={styles.coolDropdownItemText}
        iconStyle={styles.coolDropdownIcon}
        activeColor={'#FFF8E1'}
        data={getDropdownOptions(field)}
        labelField="label"
        valueField="value"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', position: 'relative' }}>
      <TopBar title="Active Link Search" showMenuIcon />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/connectivity/qr-scanner')}>
          <Text style={styles.scanButtonText}>Scan QR</Text>
        </TouchableOpacity>
        <Text style={styles.orText}>OR</Text>
        <Text style={styles.sectionTitle}>Search by Location</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#F7A800" style={{ marginVertical: 24 }} />
        ) : (
          <>
            {renderDropdown('site', site, item => setSite(item.value), 'Select Site')}
            {renderDropdown('building', building, item => setBuilding(item.value), 'Select Building')}
            {renderDropdown('floor', floor, item => setFloor(item.value), 'Select Floor')}
            {renderDropdown('room', room, item => setRoom(item.value), 'Select Room')}
            {renderDropdown('apparatus', apparatus, item => setApparatus(item.value), 'Select Apparatus')}
            
            {apparatus === 'PP' && renderDropdown('rack', rack, item => setRack(item.value), 'Select Rack')}
            {apparatus && apparatus !== 'Switch' && renderDropdown('additional_description', additionalDescription, item => setAdditionalDescription(item.value), 'Select Additional Description')}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, { opacity: isFormValid(apparatus, site, building, floor, room, switchLocations, ppLocations, ioLocations) ? 1 : 0.5 }]}
                onPress={handleSubmit}
                disabled={!isFormValid(apparatus, site, building, floor, room, switchLocations, ppLocations, ioLocations)}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearButton} onPress={clearAllSelections}>
                <Text style={styles.clearButtonText}>Clear Selection</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
} 