import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import TopBar from '../components/TopBar';
import { router } from 'expo-router';
import axios from 'axios';
import { Dropdown } from 'react-native-element-dropdown';

const API_BASE = 'http://18.117.181.30:3004/api';

type PPLocation = {
  pp_serial_no: string;
  pp_mac: string;
  site: string;
  building: string;
  floor: string | number;
  room: string;
  rack: string;
};

type IOLocation = {
  io_mac: string;
  site: string;
  building: string;
  floor: string | number;
  room: string;
  additional_description: string;
};

const APPARATUS_OPTIONS = [
  { label: 'Patch Panel (PP)', value: 'PP' },
  { label: 'FP6 (6-Port Face Plate)', value: 'FP6' },
  { label: 'FP4 (4-Port Face Plate)', value: 'FP4' },
  { label: 'FP2 (2-Port Face Plate)', value: 'FP2' },
  { label: 'SB1 (1-Port Surface Mount Box)', value: 'SB1' },
  { label: 'SB2 (2-Port Surface Mount Box)', value: 'SB2' },
  { label: 'SB4 (4-Port Surface Mount Box)', value: 'SB4' },
  { label: 'Switch', value: 'Switch' },
];

const SWITCH_LOCATIONS = [
  {
    site: 'Allen',
    building: '450 Century',
    floor: '2',
    room: 'TC2',
  },
  {
    site: 'Allen', 
    building: '700 Central',
    floor: '2',
    room: 'TC1',
  }
];

const SWITCH_LOCATION = SWITCH_LOCATIONS[0]; // Keep for backward compatibility

// Function to normalize room names (handle "TC 1" vs "TC1" variations)
function normalizeRoomName(room: string): string {
  if (room === 'TC 1') return 'TC1';
  if (room === 'TC1') return 'TC1';
  return room;
}

// Function to generate location-based switch name (same logic as backend)
function generateSwitchName(site: string, building: string, floor: string, room: string, sequence: number = 1): string {
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
  
  return `${switchType}_${cleanSite}_${cleanBuilding}_Floor${cleanFloor}_${cleanRoom}_${sequence}`;
}

// Function to get location info from switch name
function getLocationFromSwitchName(switchName: string): { site: string; building: string; floor: string; room: string } | null {
  const parts = switchName.split('_');
  if (parts.length < 7) return null;
  
  // Handle switch types with underscores (like Cisco_Catalyst_2960)
  let switchTypeEndIndex = 2;
  if (parts[0] === 'Cisco' && parts[1] === 'Catalyst') {
    switchTypeEndIndex = 3;
  }
  
  const site = parts[switchTypeEndIndex];
  const building = parts[switchTypeEndIndex + 1];
  const floor = parts[switchTypeEndIndex + 2].replace('Floor', '');
  const room = parts[switchTypeEndIndex + 3];
  
  return { site, building, floor, room };
}

// Function to generate switch locations dynamically from PP and IO data
function generateSwitchLocations(ppLocations: PPLocation[], ioLocations: IOLocation[]) {
  const switchLocations: Array<{
    site: string;
    building: string;
    floor: string;
    room: string;
    switch_name: string;
  }> = [];
  
  // Get all unique location combinations with room
  // ONLY from PP locations - switches are connected to Patch Panels, not IO devices
  const allLocations = new Set<string>();
  
  // Add PP locations with room (these are the only ones that should have switches)
  ppLocations.forEach(pp => {
    const normalizedRoom = normalizeRoomName(pp.room);
    allLocations.add(`${pp.site}_${pp.building}_${pp.floor}_${normalizedRoom}`);
  });
  
  // Generate switch locations for each unique PP location
  allLocations.forEach(locationKey => {
    const [site, building, floor, room] = locationKey.split('_');
    const switchName = generateSwitchName(site, building, floor, room);
    switchLocations.push({
      site,
      building,
      floor,
      room,
      switch_name: switchName
    });
  });
  
  console.log('Switch location generation debug:', {
    ppLocationsCount: ppLocations.length,
    ioLocationsCount: ioLocations.length,
    allLocations: Array.from(allLocations),
    generatedSwitchLocations: switchLocations
  });
  
  return switchLocations;
}

export default function ActiveLinkSearch() {
  const [loading, setLoading] = useState(true);
  const [apparatus, setApparatus] = useState<string | null>(null);
  const [site, setSite] = useState<string | null>(null);
  const [building, setBuilding] = useState<string | null>(null);
  const [floor, setFloor] = useState<string | number | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [rack, setRack] = useState<string | null>(null);
  const [additionalDescription, setAdditionalDescription] = useState<string | null>(null);
  const [ppLocations, setPpLocations] = useState<PPLocation[]>([]);
  const [ioLocations, setIoLocations] = useState<IOLocation[]>([]);
  const [switchLocations, setSwitchLocations] = useState<Array<{
    site: string;
    building: string;
    floor: string;
    room: string;
    switch_name: string;
  }>>([]);
  const [dropdowns, setDropdowns] = useState<{
    apparatusOpen?: boolean;
    siteOpen?: boolean;
    buildingOpen?: boolean;
    floorOpen?: boolean;
    roomOpen?: boolean;
    rackOpen?: boolean;
    additionalDescriptionOpen?: boolean;
  }>({});

  // Fetch all locations for dropdowns
  useEffect(() => {
    async function fetchLocations() {
      setLoading(true);
      try {
        const [ppRes, ioRes] = await Promise.all([
          axios.get(`${API_BASE}/pp-location/all`),
          axios.get(`${API_BASE}/io-location/all`),
        ]);
        const ppData = ppRes.data || [];
        const ioData = ioRes.data || [];
        
        setPpLocations(ppData);
        setIoLocations(ioData);
        
        // Generate switch locations dynamically from PP and IO data
        const generatedSwitchLocations = generateSwitchLocations(ppData, ioData);
        console.log('Generated switch locations:', generatedSwitchLocations);
        setSwitchLocations(generatedSwitchLocations);
        
      } catch (e) {
        setPpLocations([]);
        setIoLocations([]);
        setSwitchLocations([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  // Only handle Switch apparatus special case
  useEffect(() => {
    // Remove auto-population - just let the dropdowns filter naturally
    // when Switch is selected
  }, [apparatus]);

  // Clear dependent fields when parent fields change
  useEffect(() => {
    if (apparatus && apparatus !== 'Switch') {
      // Check if current apparatus is still valid at current location
      const isValid = isApparatusValidAtLocation(apparatus, site, building, floor, room);
      if (!isValid) {
        setApparatus(null);
        setRack(null);
        setAdditionalDescription(null);
      }
    }
    
    // Clear Switch if location changes to something that doesn't have any matching switches
    if (apparatus === 'Switch') {
      const matchingSwitches = switchLocations.filter(switchLoc => 
        (site ? switchLoc.site === site : true) && 
        (building ? switchLoc.building === building : true) && 
        (floor ? String(switchLoc.floor) === String(floor) : true) &&
        (room ? switchLoc.room === normalizeRoomName(room) : true)
      );
      
      if (matchingSwitches.length === 0) {
        setApparatus(null);
      }
    }
  }, [site, building, floor, room, switchLocations]);

  // Helper function to check if an apparatus is valid at a location
  function isApparatusValidAtLocation(appType: string, s: string | null, b: string | null, f: string | number | null, r: string | null): boolean {
    if (appType === 'Switch') {
      // For Switch, check if the location matches any switch location including room
      const hasCompleteLocation = !!(s && b && f && r);
      const normalizedRoom = r ? normalizeRoomName(r) : null;
      const isCorrectLocation = hasCompleteLocation && switchLocations.some(switchLoc => 
        switchLoc.site === s && 
        switchLoc.building === b && 
        String(switchLoc.floor) === String(f) &&
        switchLoc.room === normalizedRoom
      );
      return isCorrectLocation;
    }
    if (appType === 'PP') {
      return ppLocations.some(loc => 
        (s ? loc.site === s : true) &&
        (b ? loc.building === b : true) &&
        (f ? String(loc.floor) === String(f) : true) &&
        (r ? (loc.room === r || 
              (loc.room === 'TC 1' && r === 'TC1') || 
              (loc.room === 'TC1' && r === 'TC 1')) : true)
      );
    }
    return ioLocations.some(loc => 
      (s ? loc.site === s : true) &&
      (b ? loc.building === b : true) &&
      (f ? String(loc.floor) === String(f) : true) &&
      (r ? (loc.room === r || 
            (loc.room === 'TC 1' && r === 'TC1') || 
            (loc.room === 'TC1' && r === 'TC 1')) : true) &&
      'io_type' in loc && (loc as any).io_type === appType
    );
  }

  // Clean, simple filtering function
  function getDropdownOptions(field: string) {
    // Handle apparatus field
    if (field === 'apparatus') {
      return getAvailableApparatusOptions();
    }

    // Handle location fields with progressive filtering (including Switch)
    return getLocationFieldOptions(field);
  }

  function getAvailableApparatusOptions() {
    const options = [];
    
    // Show Switch for progressive filtering - show if there are any switches available
    // at the current partial location selection
    const hasAnySwitches = switchLocations.length > 0;
    const hasPartialLocation = site || building || floor || room;
    
    // If no location is selected yet, show Switch if any switches exist
    if (!hasPartialLocation && hasAnySwitches) {
      options.push({ label: 'Switch', value: 'Switch' });
    }
    // If some location fields are selected, show Switch if there are matching switches
    else if (hasPartialLocation) {
      const matchingSwitches = switchLocations.filter(switchLoc => 
        (site ? switchLoc.site === site : true) && 
        (building ? switchLoc.building === building : true) && 
        (floor ? String(switchLoc.floor) === String(floor) : true) &&
        (room ? switchLoc.room === normalizeRoomName(room) : true)
      );
      
      if (matchingSwitches.length > 0) {
        options.push({ label: 'Switch', value: 'Switch' });
      }
    }
    
    console.log('Apparatus filtering debug:', {
      site, building, floor, room,
      hasAnySwitches,
      hasPartialLocation,
      switchLocationsCount: switchLocations.length,
      matchingSwitches: switchLocations.filter(switchLoc => 
        (site ? switchLoc.site === site : true) && 
        (building ? switchLoc.building === building : true) && 
        (floor ? String(switchLoc.floor) === String(floor) : true) &&
        (room ? switchLoc.room === normalizeRoomName(room) : true)
      )
    });
    
    // Check for PP at current location
    const hasPP = ppLocations.some(loc => 
      (site ? loc.site === site : true) &&
      (building ? loc.building === building : true) &&
      (floor ? String(loc.floor) === String(floor) : true) &&
      (room ? (loc.room === room || 
               (loc.room === 'TC 1' && room === 'TC1') || 
               (loc.room === 'TC1' && room === 'TC 1')) : true)
    );
    if (hasPP) {
      options.push({ label: 'Patch Panel (PP)', value: 'PP' });
    }
    
    // Check for IO types at current location
    const ioTypes = new Set<string>();
    ioLocations.forEach(loc => {
      if ((site ? loc.site === site : true) &&
          (building ? loc.building === building : true) &&
          (floor ? String(loc.floor) === String(floor) : true) &&
          (room ? (loc.room === room || 
                   (loc.room === 'TC 1' && room === 'TC1') || 
                   (loc.room === 'TC1' && room === 'TC 1')) : true) &&
          'io_type' in loc && (loc as any).io_type) {
        ioTypes.add((loc as any).io_type);
      }
    });
    
    ioTypes.forEach(ioType => {
      const option = APPARATUS_OPTIONS.find(opt => opt.value === ioType);
      if (option) options.push(option);
    });
    
    return options;
  }

  function getLocationFieldOptions(field: string) {
    // If Switch is selected, show Switch-specific options with proper filtering
    if (apparatus === 'Switch') {
      switch (field) {
        case 'site': {
          // Get unique sites from switch locations
          const sites = Array.from(new Set(switchLocations.map(loc => loc.site)));
          return sites.map(site => ({ label: site, value: site }));
        }
        case 'building': {
          // Filter buildings based on selected site
          const relevantSwitches = site ? switchLocations.filter(loc => loc.site === site) : switchLocations;
          const buildings = Array.from(new Set(relevantSwitches.map(loc => loc.building)));
          return buildings.map(building => ({ label: building, value: building }));
        }
        case 'floor': {
          // Filter floors based on selected site and building
          const relevantSwitches = switchLocations.filter(loc => 
            (site ? loc.site === site : true) && 
            (building ? loc.building === building : true)
          );
          const floors = Array.from(new Set(relevantSwitches.map(loc => loc.floor)));
          return floors.map(floor => ({ label: floor, value: floor }));
        }
        case 'room': {
          // Filter rooms based on selected site, building, and floor
          // Only show rooms that actually have switches
          const relevantSwitches = switchLocations.filter(loc => 
            (site ? loc.site === site : true) && 
            (building ? loc.building === building : true) &&
            (floor ? String(loc.floor) === String(floor) : true)
          );
          
          // Get unique rooms from switch locations
          const rooms = Array.from(new Set(relevantSwitches.map(loc => loc.room)));
          
          console.log('Room dropdown debug:', {
            site, building, floor,
            relevantSwitches,
            availableRooms: rooms
          });
          
          return rooms.map(room => ({ label: room, value: room }));
        }
        default: return [];
      }
    }

    // For non-Switch apparatus, filter locations based on the selected apparatus
    let relevantLocations: (PPLocation | IOLocation)[] = [];
    
    if (apparatus === 'PP') {
      relevantLocations = ppLocations;
    } else if (apparatus && apparatus !== 'Switch') {
      // For IO types, only include locations that have this specific apparatus type
      relevantLocations = ioLocations.filter(loc => 
        'io_type' in loc && (loc as any).io_type === apparatus
      );
    } else {
      // If no apparatus selected, show all locations
      relevantLocations = [...ppLocations, ...ioLocations];
    }

    // Apply current filters to the relevant locations
    const matchingLocations = relevantLocations.filter(loc => {
      // Apply all current filters except the target field
      if (field !== 'site' && site && (loc as any).site !== site) return false;
      if (field !== 'building' && building && (loc as any).building !== building) return false;
      if (field !== 'floor' && floor && String((loc as any).floor) !== String(floor)) return false;
      if (field !== 'room' && room) {
        // Handle TC 1 and TC1 as equivalent
        const currentRoom = (loc as any).room;
        const selectedRoom = room;
        const isRoomMatch = currentRoom === selectedRoom || 
                           (currentRoom === 'TC 1' && selectedRoom === 'TC1') ||
                           (currentRoom === 'TC1' && selectedRoom === 'TC 1');
        if (!isRoomMatch) return false;
      }
      if (field !== 'rack' && rack && 'rack' in loc && (loc as PPLocation).rack !== rack) return false;
      if (field !== 'additional_description' && additionalDescription && 'additional_description' in loc && (loc as IOLocation).additional_description !== additionalDescription) return false;
      return true;
    });

    // Extract unique values for the target field
    const values = Array.from(new Set(
      matchingLocations
        .map(loc => (loc as any)[field])
        .filter(val => val !== null && val !== undefined && val !== '')
    ));

    return values.map(val => ({ label: String(val), value: String(val) }));
  }

  // Find the selected apparatus record
  function getSelectedRecord(): PPLocation | IOLocation | undefined {
    if (apparatus === 'Switch') {
      // For Switch, we don't need to find a record in the database
      // Just check if we have valid switch location data
      const normalizedRoom = room ? normalizeRoomName(room) : null;
      const hasValidSwitchData = switchLocations.some(switchLoc => 
        switchLoc.site === site && 
        switchLoc.building === building && 
        String(switchLoc.floor) === String(floor) &&
        switchLoc.room === normalizedRoom
      );
      
      if (hasValidSwitchData) {
        return { 
          io_mac: 'SWITCH_MAC', 
          site: site || '',
          building: building || '',
          floor: floor || '',
          room: room || '',
          additional_description: '', 
        } as any;
      }
      return undefined;
    }
    if (apparatus === 'PP') {
      return ppLocations.find(loc =>
        (site ? loc.site === site : true) &&
        (building ? loc.building === building : true) &&
        (floor ? String(loc.floor) === String(floor) : true) &&
        (room ? (loc.room === room || 
                 (loc.room === 'TC 1' && room === 'TC1') || 
                 (loc.room === 'TC1' && room === 'TC 1')) : true) &&
        (rack ? loc.rack === rack : true)
      );
    } else {
      return ioLocations.find(loc =>
        (site ? loc.site === site : true) &&
        (building ? loc.building === building : true) &&
        (floor ? String(loc.floor) === String(floor) : true) &&
        (room ? (loc.room === room || 
                 (loc.room === 'TC 1' && room === 'TC1') || 
                 (loc.room === 'TC1' && room === 'TC 1')) : true) &&
        (apparatus && apparatus !== 'Switch' && 'io_type' in loc ? (loc as any).io_type === apparatus : true) &&
        (additionalDescription ? loc.additional_description === additionalDescription : true)
      );
    }
  }

  // Simple validation function
  function isFormValid(): boolean {
    if (apparatus === 'Switch') {
      // For Switch, we need at least some location fields and matching switches
      const hasSomeLocation = !!(site || building || floor || room);
      
      if (!hasSomeLocation) return false;
      
      // Check if there are any matching switches for the current selection
      const matchingSwitches = switchLocations.filter(switchLoc => 
        (site ? switchLoc.site === site : true) && 
        (building ? switchLoc.building === building : true) && 
        (floor ? String(switchLoc.floor) === String(floor) : true) &&
        (room ? switchLoc.room === normalizeRoomName(room) : true)
      );
      
      return matchingSwitches.length > 0;
    }
    return !!(site && building && floor && room && apparatus && getSelectedRecord());
  }

  function handleSubmit() {
    const record = getSelectedRecord();
    if (!record) return;
    let qrString = '';
    if (apparatus === 'PP') {
      const ppRecord = record as PPLocation;
      qrString = `${ppRecord.pp_serial_no} ${ppRecord.pp_mac}`;
      router.push({ pathname: '/connectivity/apparatus-view', params: { apparatusType: qrString } });
    } else if (apparatus === 'Switch') {
      // Generate switch name for the selected location
      const switchName = generateSwitchName(site!, building!, floor!.toString(), room!);
      
      // Pass location fields directly for Switch
      router.push({
        pathname: '/connectivity/apparatus-view',
        params: {
          apparatusType: 'Switch',
          site,
          building,
          floor,
          room,
          switchName: switchName,
        }
      });
    } else {
      const ioRecord = record as IOLocation;
      qrString = `${apparatus} ${ioRecord.io_mac}`;
      router.push({ pathname: '/connectivity/apparatus-view', params: { apparatusType: qrString } });
    }
  }

  // Clear all selections
  function clearAllSelections() {
    setSite(null);
    setBuilding(null);
    setFloor(null);
    setRoom(null);
    setRack(null);
    setAdditionalDescription(null);
    setApparatus(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', position: 'relative' }}>
      <TopBar title="Active Link Search" showMenuIcon />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/connectivity/qr-scanner')}>
          <Text style={styles.scanButtonText}>Scan QR</Text>
        </TouchableOpacity>
        <Text style={styles.orText}>OR</Text>
        <Text style={styles.sectionTitle}>Search by Location</Text>
        {loading ? <ActivityIndicator size="large" color="#F7A800" style={{ marginVertical: 24 }} /> : (
          <>
            {/* Site */}
            <View style={styles.coolDropdownContainer}>
              <Dropdown
                style={styles.coolDropdown}
                containerStyle={styles.coolDropdownContainer}
                placeholderStyle={styles.coolDropdownPlaceholder}
                selectedTextStyle={styles.coolDropdownSelectedText}
                itemTextStyle={styles.coolDropdownItemText}
                iconStyle={styles.coolDropdownIcon}
                activeColor={'#FFF8E1'}
                data={getDropdownOptions('site')}
                labelField="label"
                valueField="value"
                value={site}
                onChange={item => setSite(item.value)}
                placeholder="Select Site"
              />
            </View>
            {/* Building */}
            <View style={styles.coolDropdownContainer}>
              <Dropdown
                style={styles.coolDropdown}
                containerStyle={styles.coolDropdownContainer}
                placeholderStyle={styles.coolDropdownPlaceholder}
                selectedTextStyle={styles.coolDropdownSelectedText}
                itemTextStyle={styles.coolDropdownItemText}
                iconStyle={styles.coolDropdownIcon}
                activeColor={'#FFF8E1'}
                data={getDropdownOptions('building')}
                labelField="label"
                valueField="value"
                value={building}
                onChange={item => setBuilding(item.value)}
                placeholder="Select Building"
              />
            </View>
            {/* Floor */}
            <View style={styles.coolDropdownContainer}>
              <Dropdown
                style={styles.coolDropdown}
                containerStyle={styles.coolDropdownContainer}
                placeholderStyle={styles.coolDropdownPlaceholder}
                selectedTextStyle={styles.coolDropdownSelectedText}
                itemTextStyle={styles.coolDropdownItemText}
                iconStyle={styles.coolDropdownIcon}
                activeColor={'#FFF8E1'}
                data={getDropdownOptions('floor')}
                labelField="label"
                valueField="value"
                value={floor}
                onChange={item => setFloor(item.value)}
                placeholder="Select Floor"
              />
            </View>
            {/* Room */}
            <View style={styles.coolDropdownContainer}>
              <Dropdown
                style={styles.coolDropdown}
                containerStyle={styles.coolDropdownContainer}
                placeholderStyle={styles.coolDropdownPlaceholder}
                selectedTextStyle={styles.coolDropdownSelectedText}
                itemTextStyle={styles.coolDropdownItemText}
                iconStyle={styles.coolDropdownIcon}
                activeColor={'#FFF8E1'}
                data={getDropdownOptions('room')}
                labelField="label"
                valueField="value"
                value={room}
                onChange={item => setRoom(item.value)}
                placeholder="Select Room"
              />
            </View>
            {/* Apparatus */}
            <View style={styles.coolDropdownContainer}>
              <Dropdown
                style={styles.coolDropdown}
                containerStyle={styles.coolDropdownContainer}
                placeholderStyle={styles.coolDropdownPlaceholder}
                selectedTextStyle={styles.coolDropdownSelectedText}
                itemTextStyle={styles.coolDropdownItemText}
                iconStyle={styles.coolDropdownIcon}
                activeColor={'#FFF8E1'}
                data={getDropdownOptions('apparatus')}
                labelField="label"
                valueField="value"
                value={apparatus}
                onChange={item => setApparatus(item.value)}
                placeholder="Select Apparatus"
              />
            </View>
            {/* Rack or Additional Description */}
            {apparatus === 'PP' ? (
              <View style={styles.coolDropdownContainer}>
                <Dropdown
                  style={styles.coolDropdown}
                  containerStyle={styles.coolDropdownContainer}
                  placeholderStyle={styles.coolDropdownPlaceholder}
                  selectedTextStyle={styles.coolDropdownSelectedText}
                  itemTextStyle={styles.coolDropdownItemText}
                  iconStyle={styles.coolDropdownIcon}
                  activeColor={'#FFF8E1'}
                  data={getDropdownOptions('rack')}
                  labelField="label"
                  valueField="value"
                  value={rack}
                  onChange={item => setRack(item.value)}
                  placeholder="Select Rack"
                />
              </View>
            ) : apparatus && apparatus !== 'Switch' ? (
              <View style={styles.coolDropdownContainer}>
                <Dropdown
                  style={styles.coolDropdown}
                  containerStyle={styles.coolDropdownContainer}
                  placeholderStyle={styles.coolDropdownPlaceholder}
                  selectedTextStyle={styles.coolDropdownSelectedText}
                  itemTextStyle={styles.coolDropdownItemText}
                  iconStyle={styles.coolDropdownIcon}
                  activeColor={'#FFF8E1'}
                  data={getDropdownOptions('additional_description')}
                  labelField="label"
                  valueField="value"
                  value={additionalDescription}
                  onChange={item => setAdditionalDescription(item.value)}
                  placeholder="Select Additional Description"
                />
              </View>
            ) : null}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, { opacity: isFormValid() ? 1 : 0.5 }]}
                onPress={handleSubmit}
                disabled={!isFormValid()}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllSelections}
              >
                <Text style={styles.clearButtonText}>Clear Selection</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  scanButton: {
    backgroundColor: '#F7A800',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 24,
    marginBottom: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18,
  },
  orText: {
    fontSize: 16,
    color: '#888',
    marginVertical: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    marginTop: 8,
  },
  coolDropdown: {
    marginBottom: 16,
    minWidth: 320,
    maxWidth: 420,
    width: '90%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 17,
  },
  coolDropdownContainer: {
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  coolDropdownPlaceholder: {
    color: '#888',
    fontSize: 16,
    fontWeight: '400',
  },
  coolDropdownSelectedText: {
    color: '#222',
    fontSize: 17,
    fontWeight: '500',
  },
  coolDropdownItemText: {
    color: '#222',
    fontSize: 16,
  },
  coolDropdownIcon: {
    width: 24,
    height: 24,
    tintColor: '#888',
  },
  submitButton: {
    backgroundColor: '#F7A800',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 140,
    maxWidth: 160,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  submitButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 20,
  },
  clearButton: {
    backgroundColor: '#F7A800',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 160,
    maxWidth: 180,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 