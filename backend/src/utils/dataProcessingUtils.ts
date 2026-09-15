import { pool } from '../aws/db';

export interface PPConnection {
  pp_serial_no: string;
  ru: number;
  pp_port: number;
  io_mac: string;
  io_port: number;
}

// Function to fetch used switch pairs and device MACs
export async function fetchUsedData() {
  const usedSwitchPairs: Record<string, Set<number>> = {};
  const switchRows = (await pool.query('SELECT switch_name, switch_port FROM nflexon_app.connectivity_map WHERE switch_name IS NOT NULL AND switch_port IS NOT NULL')).rows;
  for (const row of switchRows) {
    if (!usedSwitchPairs[row.switch_name]) usedSwitchPairs[row.switch_name] = new Set();
    usedSwitchPairs[row.switch_name].add(row.switch_port);
  }
  
  const usedDeviceMacs = new Set<string>(
    (await pool.query('SELECT device_mac FROM nflexon_app.connectivity_map WHERE device_mac IS NOT NULL')).rows.map((r: any) => r.device_mac)
  );
  
  return { usedSwitchPairs, usedDeviceMacs };
}

// Function to fetch IO type mapping
export async function fetchIOTypeMap(ioMacs: string[]) {
  const ioLocations = await pool.query('SELECT io_mac, io_type FROM nflexon_app.io_location WHERE io_mac = ANY($1)', [ioMacs]);
  const ioTypeMap: Record<string, string> = {};
  ioLocations.rows.forEach((row: any) => {
    ioTypeMap[row.io_mac] = row.io_type;
  });
  return ioTypeMap;
}

// Function to fetch PP location mapping
export async function fetchPPLocationMap(ppSerials: string[]) {
  const ppLocations = await pool.query('SELECT pp_serial_no, site, building, floor, room FROM nflexon_app.pp_location WHERE pp_serial_no = ANY($1)', [ppSerials]);
  const ppLocationMap: Record<string, { site: string; building: string; floor: string; room: string }> = {};
  ppLocations.rows.forEach((row: any) => {
    ppLocationMap[row.pp_serial_no] = {
      site: row.site,
      building: row.building,
      floor: row.floor,
      room: row.room
    };
  });
  return ppLocationMap;
}

// Function to group connections by location
export function groupConnectionsByLocation(
  newConnections: PPConnection[], 
  ppLocationMap: Record<string, { site: string; building: string; floor: string; room: string }>
) {
  const centralConns: PPConnection[] = [];
  const centuryConns: PPConnection[] = [];
  const otherConns: PPConnection[] = [];
  
  for (const conn of newConnections) {
    const location = ppLocationMap[conn.pp_serial_no];
    if (!location) {
      otherConns.push(conn);
      continue;
    }
    
    if (location.site === 'Allen' && location.building === '700 Central' && location.floor === '2') {
      centralConns.push(conn);
    } else if (location.site === 'Allen' && location.building === '450 Century' && location.floor === '2') {
      centuryConns.push(conn);
    } else {
      otherConns.push(conn);
    }
  }
  
  return { centralConns, centuryConns, otherConns };
}

// Function to split connections for 80-20 logic
export function split80_20(arr: PPConnection[]) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const splitIndex = Math.floor(shuffled.length * 0.8);
  return [shuffled.slice(0, splitIndex), shuffled.slice(splitIndex)];
}

// Function to get next available switch port
export function getNextSwitchPort(switchName: string, usedSwitchPairs: Record<string, Set<number>>, switchCounters: Record<string, number>) {
  if (!usedSwitchPairs[switchName]) usedSwitchPairs[switchName] = new Set();
  if (!switchCounters[switchName]) switchCounters[switchName] = 1;
  let port = switchCounters[switchName];
  while (usedSwitchPairs[switchName].has(port)) port++;
  usedSwitchPairs[switchName].add(port);
  switchCounters[switchName] = port + 1;
  return port;
} 