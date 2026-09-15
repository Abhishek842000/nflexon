import { PPLocation, IOLocation, SwitchLocation, normalizeRoomName } from './switchUtils';

// Function to get location field options for dropdowns
export function getLocationFieldOptions(
  field: string,
  apparatus: string | null,
  site: string | null,
  building: string | null,
  floor: string | number | null,
  room: string | null,
  switchLocations: SwitchLocation[],
  ppLocations: PPLocation[],
  ioLocations: IOLocation[]
) {
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

// Function to get selected record
export function getSelectedRecord(
  apparatus: string | null,
  site: string | null,
  building: string | null,
  floor: string | number | null,
  room: string | null,
  rack: string | null,
  additionalDescription: string | null,
  switchLocations: SwitchLocation[],
  ppLocations: PPLocation[],
  ioLocations: IOLocation[]
): PPLocation | IOLocation | undefined {
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