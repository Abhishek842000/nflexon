import { pool } from '../aws/db';

interface PPConnection {
  pp_serial_no: string;
  ru: number;
  pp_port: number;
  io_mac: string;
  io_port: number;
}

// Function to generate location-based switch name
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

export async function populateConnectivityMap(newConnections: PPConnection[]) {
  // 1. Fetch all used switch_name/switch_port pairs and device_mac
  const usedSwitchPairs: Record<string, Set<number>> = {};
  const switchRows = (await pool.query('SELECT switch_name, switch_port FROM nflexon_app.connectivity_map WHERE switch_name IS NOT NULL AND switch_port IS NOT NULL')).rows;
  for (const row of switchRows) {
    if (!usedSwitchPairs[row.switch_name]) usedSwitchPairs[row.switch_name] = new Set();
    usedSwitchPairs[row.switch_name].add(row.switch_port);
  }
  const usedDeviceMacs = new Set<string>(
    (await pool.query('SELECT device_mac FROM nflexon_app.connectivity_map WHERE device_mac IS NOT NULL')).rows.map((r: any) => r.device_mac)
  );

  // 2. Fetch io_type for all io_mac
  const ioMacs = [...new Set(newConnections.map(c => c.io_mac))];
  const ioLocations = await pool.query('SELECT io_mac, io_type FROM nflexon_app.io_location WHERE io_mac = ANY($1)', [ioMacs]);
  const ioTypeMap: Record<string, string> = {};
  ioLocations.rows.forEach((row: any) => {
    ioTypeMap[row.io_mac] = row.io_type;
  });

  // 3. Fetch site, building, floor, and room for all pp_serial_no
  const ppSerials = [...new Set(newConnections.map(c => c.pp_serial_no))];
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

  // 4. Group connections by site, building, and floor
  const centralConns: PPConnection[] = [];
  const centuryConns: PPConnection[] = [];
  const otherConns: PPConnection[] = [];
  for (const conn of newConnections) {
    const location = ppLocationMap[conn.pp_serial_no];
    if (!location) {
      otherConns.push(conn);
      continue;
    }
    
    // Apply 80-20 logic for specific combinations with their designated switches
    if (location.site === 'Allen' && location.building === '700 Central' && location.floor === '2') {
      centralConns.push(conn);
    } else if (location.site === 'Allen' && location.building === '450 Century' && location.floor === '2') {
      centuryConns.push(conn);
    } else {
      // All other combinations also get 80-20 logic with location-based switch assignment
      otherConns.push(conn);
    }
  }

  // 5. Shuffle and split for 80-20 logic
  function split80_20(arr: PPConnection[]) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * 0.8);
    return [shuffled.slice(0, splitIndex), shuffled.slice(splitIndex)];
  }
  const [centralFull, centralMinimal] = split80_20(centralConns);
  const [centuryFull, centuryMinimal] = split80_20(centuryConns);
  const [otherFull, otherMinimal] = split80_20(otherConns); // Apply 80-20 to other connections too

  // 6. Assign unique switch_port and device_mac
  const switchCounters: Record<string, number> = {};
  
  function getNextSwitchPort(switchName: string) {
    if (!usedSwitchPairs[switchName]) usedSwitchPairs[switchName] = new Set();
    if (!switchCounters[switchName]) switchCounters[switchName] = 1;
    let port = switchCounters[switchName];
    while (usedSwitchPairs[switchName].has(port)) port++;
    usedSwitchPairs[switchName].add(port);
    switchCounters[switchName] = port + 1;
    return port;
  }
  function generateUniqueMac() {
    let mac;
    do {
      mac = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
    } while (usedDeviceMacs.has(mac));
    usedDeviceMacs.add(mac);
    return mac;
  }

  // Function to generate realistic network devices with weighted distribution
  function generateNetworkDevice(): string {
    const devices = [
      { name: 'Computer', weight: 35 },         // Most common - office computers
      { name: 'IP Phone', weight: 20 },         // Common in office environments
      { name: 'Security Camera', weight: 15 },  // Common for surveillance
      { name: 'Network Printer', weight: 10 },  // Office printers
      { name: 'Access Point', weight: 8 },      // WiFi access points
      { name: 'Television', weight: 5 },        // Display screens and TVs
      { name: 'VoIP Phone', weight: 3 },        // Modern phone systems
      { name: 'Digital Signage', weight: 2 },   // Display systems
      { name: 'Video Conference Unit', weight: 2 } // Meeting room equipment
    ];
    
    // Calculate total weight
    const totalWeight = devices.reduce((sum, device) => sum + device.weight, 0);
    
    // Generate random number
    const random = Math.random() * totalWeight;
    
    // Find the device based on weight
    let currentWeight = 0;
    for (const device of devices) {
      currentWeight += device.weight;
      if (random <= currentWeight) {
        return device.name;
      }
    }
    
    // Fallback to computer if something goes wrong
    return 'Computer';
  }

  // 7. Insert into connectivity_map
  // Central (Allen, 700 Central, 2, NETGEAR_M)
  for (const conn of centralFull) {
    const location = ppLocationMap[conn.pp_serial_no];
    const switchName = generateSwitchName(location.site, location.building, location.floor.toString(), location.room);
    const switchPort = getNextSwitchPort(switchName);
    await pool.query(
      `INSERT INTO nflexon_app.connectivity_map
        (pp_serial_no, ru, pp_port, io_mac, io_port, io_type, device, device_mac, switch_name, switch_port)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        conn.pp_serial_no,
        conn.ru,
        conn.pp_port,
        conn.io_mac,
        conn.io_port,
        ioTypeMap[conn.io_mac] || null,
        generateNetworkDevice(),
        generateUniqueMac(),
        switchName,
        switchPort
      ]
    );
  }
  for (const conn of centralMinimal) {
    await pool.query(
      `INSERT INTO nflexon_app.connectivity_map
        (pp_serial_no, ru, pp_port, io_mac, io_port, io_type)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        conn.pp_serial_no,
        conn.ru,
        conn.pp_port,
        conn.io_mac,
        conn.io_port,
        ioTypeMap[conn.io_mac] || null
      ]
    );
  }
  // Century (Allen, 450 Century, 2, Cisco_Catalyst_2960)
  for (const conn of centuryFull) {
    const location = ppLocationMap[conn.pp_serial_no];
    const switchName = generateSwitchName(location.site, location.building, location.floor.toString(), location.room);
    const switchPort = getNextSwitchPort(switchName);
    await pool.query(
      `INSERT INTO nflexon_app.connectivity_map
        (pp_serial_no, ru, pp_port, io_mac, io_port, io_type, device, device_mac, switch_name, switch_port)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        conn.pp_serial_no,
        conn.ru,
        conn.pp_port,
        conn.io_mac,
        conn.io_port,
        ioTypeMap[conn.io_mac] || null,
        generateNetworkDevice(),
        generateUniqueMac(),
        switchName,
        switchPort
      ]
    );
  }
  for (const conn of centuryMinimal) {
    await pool.query(
      `INSERT INTO nflexon_app.connectivity_map
        (pp_serial_no, ru, pp_port, io_mac, io_port, io_type)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        conn.pp_serial_no,
        conn.ru,
        conn.pp_port,
        conn.io_mac,
        conn.io_port,
        ioTypeMap[conn.io_mac] || null
      ]
    );
  }
  // All other combinations: also get 80-20 logic with location-based switches
  for (const conn of otherFull) {
    const location = ppLocationMap[conn.pp_serial_no];
    const switchName = generateSwitchName(location.site, location.building, location.floor.toString(), location.room);
    const switchPort = getNextSwitchPort(switchName);
    await pool.query(
      `INSERT INTO nflexon_app.connectivity_map
        (pp_serial_no, ru, pp_port, io_mac, io_port, io_type, device, device_mac, switch_name, switch_port)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        conn.pp_serial_no,
        conn.ru,
        conn.pp_port,
        conn.io_mac,
        conn.io_port,
        ioTypeMap[conn.io_mac] || null,
        generateNetworkDevice(),
        generateUniqueMac(),
        switchName,
        switchPort
      ]
    );
  }
  for (const conn of otherMinimal) {
    await pool.query(
      `INSERT INTO nflexon_app.connectivity_map
        (pp_serial_no, ru, pp_port, io_mac, io_port, io_type)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        conn.pp_serial_no,
        conn.ru,
        conn.pp_port,
        conn.io_mac,
        conn.io_port,
        ioTypeMap[conn.io_mac] || null
      ]
    );
  }
} 