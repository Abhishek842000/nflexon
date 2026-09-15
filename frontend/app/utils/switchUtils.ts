// Function to normalize room names (handle "TC 1" vs "TC1" variations)
export function normalizeRoomName(room: string): string {
  if (room === 'TC 1') return 'TC1';
  if (room === 'TC1') return 'TC1';
  return room;
}

// Function to generate location-based switch name (same logic as backend)
export function generateSwitchName(site: string, building: string, floor: string, room: string, sequence: number = 1): string {
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
export function getLocationFromSwitchName(switchName: string): { site: string; building: string; floor: string; room: string } | null {
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

export type PPLocation = {
  pp_serial_no: string;
  pp_mac: string;
  site: string;
  building: string;
  floor: string | number;
  room: string;
  rack: string;
};

export type IOLocation = {
  io_mac: string;
  site: string;
  building: string;
  floor: string | number;
  room: string;
  additional_description: string;
};

export type SwitchLocation = {
  site: string;
  building: string;
  floor: string;
  room: string;
  switch_name: string;
};

// Function to generate switch locations dynamically from PP and IO data
export function generateSwitchLocations(ppLocations: PPLocation[], ioLocations: IOLocation[]): SwitchLocation[] {
  const switchLocations: SwitchLocation[] = [];
  
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