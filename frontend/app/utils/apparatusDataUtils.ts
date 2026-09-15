import { getApparatusInfo, ApparatusInfo } from './apparatusUtils.new';
import { getFullConnectivityMap } from './connectivityUtils';
import { getSwitchNameForLocation, fetchSwitchActivePorts } from './apparatusViewUtils';

// Fetch apparatus info and active ports
export async function fetchApparatusInfo(apparatusType: string, params: any) {
  if (apparatusType === 'Switch') {
    const switchName = getSwitchNameForLocation(
      Array.isArray(params.site) ? params.site[0] : params.site,
      Array.isArray(params.building) ? params.building[0] : params.building,
      Array.isArray(params.floor) ? params.floor[0] : params.floor,
      Array.isArray(params.room) ? params.room[0] : params.room
    );
    
    const switchActivePorts = switchName ? await fetchSwitchActivePorts(switchName) : [];
    
    return {
      result: {
        type: 'Switch',
        connectivity: [],
        location: {
          site: params.site,
          building: params.building,
          floor: params.floor,
          room: params.room,
          pp_serial_no: params.switchName || switchName || '',
        }
      } as any,
      switchActivePorts
    };
  }
  
  const info = await getApparatusInfo(apparatusType);
  const ioActivePorts = info?.type === 'IO' && Array.isArray(info.connectivity)
    ? info.connectivity
        .map((row: any) => parseInt(row.io_port, 10))
        .filter((port: any) => !isNaN(port))
    : [];
  
  return { result: info, ioActivePorts };
}

// Fetch PP connectivity for a specific RU
export async function fetchPPConnectivity(ppSerial: string, ru: string) {
  try {
    const fullMap = await getFullConnectivityMap({
      type: 'PP',
      pp_serial_no: ppSerial,
      ru: Number(ru)
    });
    
    const ports = fullMap
      .filter((row: any) => String(row.ru).trim() === String(ru).trim())
      .map((row: any) => parseInt(row.pp_port, 10))
      .filter((port: any) => !isNaN(port));
    
    return ports;
  } catch (error) {
    console.error('Error fetching PP connectivity:', error);
    return [];
  }
}

// Fetch IO connectivity for a specific port
export async function fetchIOConnectivity(ioMac: string, port: number) {
  try {
    const fullMap = await getFullConnectivityMap({
      type: 'IO',
      io_mac: ioMac,
      io_port: Number(port)
    });
    return fullMap;
  } catch (error) {
    console.error('Error fetching IO connectivity:', error);
    return [];
  }
} 