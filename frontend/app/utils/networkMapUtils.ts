import axios from 'axios';

const API_BASE = 'http://18.117.181.30:3004/api';

// Fetch switch connectivity data
export async function fetchSwitchConnectivity(switchName: string, switchPort: string) {
  const connRes = await axios.get(`${API_BASE}/connectivity-map`, {
    params: { switch_name: switchName, switch_port: switchPort },
  });
  
  const connData = Array.isArray(connRes?.data?.data)
    ? connRes.data.data.find(
        (row: any) =>
          String(row.switch_port) === String(switchPort) &&
          row.switch_name === switchName
      )
    : null;
  
  return connData;
}

// Fetch IO location data
export async function fetchIOLocation(ioMac: string) {
  try {
    const res = await axios.get(`${API_BASE}/io-location/${encodeURIComponent(ioMac)}`);
    return res?.data?.[0] || null;
  } catch {
    return null;
  }
}

// Fetch PP location data
export async function fetchPPLocation(ppSerial: string) {
  try {
    const res = await axios.get(`${API_BASE}/pp-location/${encodeURIComponent(ppSerial)}`);
    return res?.data?.[0] || null;
  } catch {
    return null;
  }
}

// Fetch PP connectivity data
export async function fetchPPConnectivity(ppSerial: string, ru: string, ppPort: string) {
  const connRes = await axios.get(`${API_BASE}/connectivity-map`, {
    params: { type: 'PP', pp_serial_no: ppSerial, ru, pp_port: ppPort },
  });
  return connRes?.data?.data?.[0] || null;
}

// Fetch IO connectivity data
export async function fetchIOConnectivity(ioMac: string, ioPort: string) {
  const connRes = await axios.get(`${API_BASE}/connectivity-map`, {
    params: { type: 'IO', io_mac: ioMac, io_port: ioPort },
  });
  return connRes?.data?.data?.[0] || null;
}

// Fetch all network map data based on type
export async function fetchNetworkMapData(params: any) {
  if (params.type === 'Switch') {
    const switchName = params.switch_name || 'NETGEAR_M';
    const connData = await fetchSwitchConnectivity(switchName, params.switch_port);
    
    let ioLocation = null;
    let ppLocation = null;
    
    if (connData?.io_mac) {
      ioLocation = await fetchIOLocation(connData.io_mac);
    }
    if (connData?.pp_serial_no) {
      ppLocation = await fetchPPLocation(connData.pp_serial_no);
    }
    
    return {
      location: ioLocation,
      connectivity: connData,
      ppLocation,
      ioLocation
    };
  } else if (params.type === 'PP') {
    const locRes = await axios.get(`${API_BASE}/pp-location/${encodeURIComponent(params.pp_serial_no)}`);
    const connData = await fetchPPConnectivity(params.pp_serial_no, params.ru, params.pp_port);
    
    let ioLocation = null;
    if (connData?.io_mac) {
      ioLocation = await fetchIOLocation(connData.io_mac);
    }
    
    return {
      location: locRes?.data?.[0] || null,
      connectivity: connData,
      ppLocation: null,
      ioLocation
    };
  } else if (params.type === 'IO') {
    const locRes = await axios.get(`${API_BASE}/io-location/${encodeURIComponent(params.io_mac)}`);
    const connData = await fetchIOConnectivity(params.io_mac, params.io_port);
    
    let ppLocation = null;
    if (connData?.pp_serial_no) {
      ppLocation = await fetchPPLocation(connData.pp_serial_no);
    }
    
    return {
      location: locRes?.data?.[0] || null,
      connectivity: connData,
      ppLocation,
      ioLocation: null
    };
  }
  
  return { location: null, connectivity: null, ppLocation: null, ioLocation: null };
} 