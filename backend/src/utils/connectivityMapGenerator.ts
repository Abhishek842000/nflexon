import { pool } from '../aws/db';
import { generateSwitchName } from './switchUtils';
import { generateNetworkDevice, generateUniqueMac } from './deviceUtils';
import { 
  PPConnection, 
  fetchUsedData, 
  fetchIOTypeMap, 
  fetchPPLocationMap, 
  groupConnectionsByLocation, 
  split80_20, 
  getNextSwitchPort 
} from './dataProcessingUtils';

export { getSwitchTypeFromName, getLocationFromSwitchName } from './switchUtils';

export async function populateConnectivityMap(newConnections: PPConnection[]) {
  // 1. Fetch all used data
  const { usedSwitchPairs, usedDeviceMacs } = await fetchUsedData();
  
  // 2. Fetch mappings
  const ioMacs = [...new Set(newConnections.map(c => c.io_mac))];
  const ppSerials = [...new Set(newConnections.map(c => c.pp_serial_no))];
  const ioTypeMap = await fetchIOTypeMap(ioMacs);
  const ppLocationMap = await fetchPPLocationMap(ppSerials);
  
  // 3. Group connections by location
  const { centralConns, centuryConns, otherConns } = groupConnectionsByLocation(newConnections, ppLocationMap);
  
  // 4. Apply 80-20 logic to all groups
  const [centralFull, centralMinimal] = split80_20(centralConns);
  const [centuryFull, centuryMinimal] = split80_20(centuryConns);
  const [otherFull, otherMinimal] = split80_20(otherConns);
  
  // 5. Process connections
  const switchCounters: Record<string, number> = {};
  
  // Helper function to insert connection
  async function insertConnection(conn: PPConnection, switchName: string) {
    const switchPort = getNextSwitchPort(switchName, usedSwitchPairs, switchCounters);
    const deviceMac = generateUniqueMac(usedDeviceMacs);
    
    await pool.query(
      `INSERT INTO nflexon_app.connectivity_map
        (pp_serial_no, ru, pp_port, io_mac, io_port, io_type, device, device_mac, switch_name, switch_port)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        conn.pp_serial_no, conn.ru, conn.pp_port, conn.io_mac, conn.io_port,
        ioTypeMap[conn.io_mac] || null, generateNetworkDevice(), deviceMac,
        switchName, switchPort
      ]
    );
  }
  
  // 6. Insert full connections with switches
  for (const conn of [...centralFull, ...centuryFull, ...otherFull]) {
    const location = ppLocationMap[conn.pp_serial_no];
    if (location) {
      const switchName = generateSwitchName(location.site, location.building, location.floor.toString(), location.room);
      await insertConnection(conn, switchName);
    }
  }
  
  // 7. Insert minimal connections without switches
  for (const conn of [...centralMinimal, ...centuryMinimal, ...otherMinimal]) {
    await pool.query(
      `INSERT INTO nflexon_app.connectivity_map
        (pp_serial_no, ru, pp_port, io_mac, io_port, io_type)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [conn.pp_serial_no, conn.ru, conn.pp_port, conn.io_mac, conn.io_port, ioTypeMap[conn.io_mac] || null]
    );
  }
} 