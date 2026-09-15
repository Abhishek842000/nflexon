// Function to generate location-based switch name
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

// Function to get switch type from switch name
export function getSwitchTypeFromName(switchName: string): string {
  return switchName.split('_')[0] + '_' + switchName.split('_')[1];
}

// Function to get location info from switch name
export function getLocationFromSwitchName(switchName: string): { site: string; building: string; floor: string } | null {
  const parts = switchName.split('_');
  if (parts.length < 6) return null;
  
  // Handle switch types with underscores (like Cisco_Catalyst_2960)
  let switchTypeEndIndex = 2;
  if (parts[0] === 'Cisco' && parts[1] === 'Catalyst') {
    switchTypeEndIndex = 3;
  }
  
  const site = parts[switchTypeEndIndex];
  const building = parts[switchTypeEndIndex + 1];
  const floor = parts[switchTypeEndIndex + 2].replace('Floor', '');
  
  return { site, building, floor };
} 