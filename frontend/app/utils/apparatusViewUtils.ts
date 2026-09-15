import axios from 'axios';

// Helper to determine switch_name based on site, building, floor, and room
export function getSwitchNameForLocation(site: string | undefined, building: string | undefined, floor: string | undefined, room: string | undefined) {
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

// Fetch switch active ports
export async function fetchSwitchActivePorts(switchName: string): Promise<number[]> {
  try {
    const res = await axios.get('http://18.117.181.30:3004/api/connectivity-map', { 
      params: { switch_name: switchName } 
    });
    const ports = Array.isArray(res.data?.data)
      ? res.data.data
          .filter((row: any) => row.switch_name === switchName && row.switch_port != null)
          .map((row: any) => Number(row.switch_port))
          .filter((port: any) => !isNaN(port))
      : [];
    return ports;
  } catch (error) {
    console.error('Error fetching switch active ports:', error);
    return [];
  }
}

// Helper to build port color map for PP
export function getPPPortColorMap(connectivity: any[], ru: string): Record<number, string> {
  if (!connectivity) return {};
  const map: Record<number, string> = {};
  connectivity.forEach((row: any) => {
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
export function getIOPortColorMap(connectivity: any[]): Record<number, string> {
  if (!connectivity) return {};
  const map: Record<number, string> = {};
  connectivity.forEach((row: any) => {
    const portNum = parseInt(row.io_port, 10);
    if (!isNaN(portNum)) {
      map[portNum] = row.device_mac == null ? '#F7A800' : '#00C853';
    }
  });
  return map;
} 