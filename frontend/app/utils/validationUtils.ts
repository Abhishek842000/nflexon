import { PPLocation, IOLocation, SwitchLocation, normalizeRoomName } from './switchUtils';

export const APPARATUS_OPTIONS = [
  { label: 'Patch Panel (PP)', value: 'PP' },
  { label: 'FP6 (6-Port Face Plate)', value: 'FP6' },
  { label: 'FP4 (4-Port Face Plate)', value: 'FP4' },
  { label: 'FP2 (2-Port Face Plate)', value: 'FP2' },
  { label: 'SB1 (1-Port Surface Mount Box)', value: 'SB1' },
  { label: 'SB2 (2-Port Surface Mount Box)', value: 'SB2' },
  { label: 'SB4 (4-Port Surface Mount Box)', value: 'SB4' },
  { label: 'Switch', value: 'Switch' },
];

// Helper function to check if an apparatus is valid at a location
export function isApparatusValidAtLocation(
  appType: string, 
  s: string | null, 
  b: string | null, 
  f: string | number | null, 
  r: string | null,
  switchLocations: SwitchLocation[],
  ppLocations: PPLocation[],
  ioLocations: IOLocation[]
): boolean {
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

// Function to get available apparatus options
export function getAvailableApparatusOptions(
  site: string | null,
  building: string | null,
  floor: string | number | null,
  room: string | null,
  switchLocations: SwitchLocation[],
  ppLocations: PPLocation[],
  ioLocations: IOLocation[]
) {
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

// Function to validate form
export function isFormValid(
  apparatus: string | null,
  site: string | null,
  building: string | null,
  floor: string | number | null,
  room: string | null,
  switchLocations: SwitchLocation[],
  ppLocations: PPLocation[],
  ioLocations: IOLocation[]
): boolean {
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
  return !!(site && building && floor && room && apparatus);
} 