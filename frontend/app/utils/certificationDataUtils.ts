import axios from 'axios';
import { API_BASE } from './certificationTestUtils';

// Fetch connections for PP or IO
export async function fetchConnections(type: 'PP' | 'IO' | null, ppSerial: string, ioMac: string) {
  if (type === 'PP' && ppSerial) {
    try {
      const res = await axios.get(`${API_BASE}/pp-connectivity/serial/${encodeURIComponent(ppSerial)}`);
      return res.data || [];
    } catch {
      return [];
    }
  } else if (type === 'IO' && ioMac) {
    try {
      const res = await axios.get(`${API_BASE}/pp-connectivity/io_mac/${encodeURIComponent(ioMac)}`);
      return res.data || [];
    } catch {
      return [];
    }
  }
  return [];
}

// Fetch IO location
export async function fetchIOLocation(ioMac: string) {
  try {
    const res = await axios.get(`${API_BASE}/io-location/${encodeURIComponent(ioMac)}`);
    return res.data && res.data[0] ? res.data[0] : null;
  } catch {
    return null;
  }
}

// Fetch PP location
export async function fetchPPLocation(ppSerial: string) {
  try {
    const res = await axios.get(`${API_BASE}/pp-location/${encodeURIComponent(ppSerial)}`);
    return res.data && res.data[0] ? res.data[0] : null;
  } catch {
    return null;
  }
} 