import axios from 'axios';

export type ConnectivityInfo = {
  type: 'PP' | 'IO';
  data: Array<{ ru?: string; port: string }>;
};

export async function getConnectivityInfo(scannedData: string): Promise<ConnectivityInfo | null> {
  if (!scannedData) return null;
  const trimmed = scannedData.trim();

  // PP: 22 chars + space + MAC
  if (trimmed.length > 22 && trimmed[22] === ' ') {
    const ppSerial = trimmed.slice(0, 22);
    try {
      const res = await axios.get(`http://18.117.181.30:3004/api/pp-connectivity/${encodeURIComponent(ppSerial)}`);
      if (res.data && Array.isArray(res.data)) {
        return {
          type: 'PP',
          data: res.data.map((row: any) => ({ ru: row.ru, port: row.pp_port })),
        };
      }
    } catch (e) {
      return null;
    }
  }

  // IO: 3 chars + space + MAC
  if (trimmed.length > 3 && trimmed[3] === ' ') {
    const mac = trimmed.slice(4);
    try {
      const res = await axios.get(`http://18.117.181.30:3004/api/io-connectivity/${encodeURIComponent(mac)}`);
      if (res.data && Array.isArray(res.data)) {
        return {
          type: 'IO',
          data: res.data.map((row: any) => ({ port: row.io_port })),
        };
      }
    } catch (e) {
      return null;
    }
  }

  return null;
}

// Fetch all connections for a list of PP serials
export async function getAllPPConnections(ppSerials: string[]): Promise<any[]> {
  const allConnections: any[] = [];
  for (const serial of ppSerials) {
    try {
      const res = await axios.get(`http://18.117.181.30:3004/api/pp-connectivity/${encodeURIComponent(serial)}`);
      if (res.data && Array.isArray(res.data)) {
        // Each row: {pp_serial_no, ru, pp_port, io_mac, io_port}
        allConnections.push(...res.data);
      }
    } catch (e) {
      // Ignore errors for individual PPs
    }
  }
  return allConnections;
}

// Fetch full connectivity map info for PP or IO
export async function getFullConnectivityMap(params: { type: 'PP' | 'IO', pp_serial_no?: string, ru?: number, pp_port?: number, io_mac?: string, io_port?: number }) {
  try {
    const res = await axios.get('http://18.117.181.30:3004/api/connectivity-map', { params });
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      // Convert ru, pp_port, io_port to strings for frontend compatibility
      return res.data.data.map((row: any) => ({
        ...row,
        ru: row.ru !== undefined ? String(row.ru) : row.ru,
        pp_port: row.pp_port !== undefined ? String(row.pp_port) : row.pp_port,
        io_port: row.io_port !== undefined ? String(row.io_port) : row.io_port,
      }));
    }
    return [];
  } catch (e) {
    return [];
  }
} 