import { pool } from '../aws/db';

interface PPConnection {
  pp_serial_no: string;
  ru: number;
  pp_port: number;
  io_mac: string;
  io_port: number;
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

  // 3. Fetch site, building, and floor for all pp_serial_no
  const ppSerials = [...new Set(newConnections.map(c => c.pp_serial_no))];
  const ppLocations = await pool.query('SELECT pp_serial_no, site, building, floor FROM nflexon_app.pp_location WHERE pp_serial_no = ANY($1)', [ppSerials]);
  const ppLocationMap: Record<string, { site: string; building: string; floor: string }> = {};
  ppLocations.rows.forEach((row: any) => {
    ppLocationMap[row.pp_serial_no] = {
      site: row.site,
      building: row.building,
      floor: row.floor
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
    
    // Only apply 80-20 logic for specific combinations
    if (location.site === 'Allen' && location.building === '700 Central' && location.floor === '2') {
      centralConns.push(conn);
    } else if (location.site === 'Allen' && location.building === '450 Century' && location.floor === '2') {
      centuryConns.push(conn);
    } else {
      // Any other combination gets minimal assignment
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
  // All otherConns are minimal

  // 6. Assign unique switch_port and device_mac
  const switchCounters: Record<string, number> = {
    'NETGEAR_M': 1,
    'Cisco_Catalyst_2960': 1,
  };
  function getNextSwitchPort(switchName: string) {
    if (!usedSwitchPairs[switchName]) usedSwitchPairs[switchName] = new Set();
    let port = switchCounters[switchName] || 1;
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

  // 7. Insert into connectivity_map
  // Central (Allen, 700 Central, 2, NETGEAR_M)
  for (const conn of centralFull) {
    const switchName = 'NETGEAR_M';
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
        Math.random() < 0.5 ? 'Printer' : 'PTZ Camera',
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
    const switchName = 'Cisco_Catalyst_2960';
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
        Math.random() < 0.5 ? 'Printer' : 'PTZ Camera',
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
  // All other combinations: minimal only
  for (const conn of otherConns) {
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