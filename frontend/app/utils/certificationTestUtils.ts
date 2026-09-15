import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Panel dimensions and port positioning constants
export const PANEL_WIDTH = width * 0.76;
export const PANEL_HEIGHT = PANEL_WIDTH * 0.4 / 0.7;
export const BUTTON_SIZE = PANEL_WIDTH / 35;
export const BUTTON_Y = PANEL_HEIGHT * 0.49;
export const BUTTON_SPACING = (PANEL_WIDTH - BUTTON_SIZE * 24) / (24 + 58);
export const BUTTON_X_OFFSET = BUTTON_SPACING + 28;

export const API_BASE = 'http://18.117.181.30:3004/api';

// Parse apparatus type from QR
export function parseApparatusType(apparatusType: string): { type: 'PP' | 'IO' | null; ppSerial: string; ioType: string; ioMac: string } {
  if (!apparatusType || typeof apparatusType !== 'string') {
    return { type: null, ppSerial: '', ioType: '', ioMac: '' };
  }
  
  if (apparatusType.length > 22) {
    return { type: 'PP', ppSerial: apparatusType.slice(0, 22), ioType: '', ioMac: '' };
  } else {
    return { 
      type: 'IO', 
      ppSerial: '', 
      ioType: apparatusType.slice(0, 3), 
      ioMac: apparatusType.slice(4) 
    };
  }
}

// Find connected IO for a PP port
export function findConnectedIO(
  connections: any[], 
  ppSerial: string, 
  ru: string, 
  ppPort: number
) {
  const connection = connections.find(
    c => c.pp_serial_no === ppSerial && Number(c.ru) === Number(ru) && c.pp_port === ppPort
  );
  if (connection) {
    const ioInfo = connections.find((c: any) => c.io_mac === connection.io_mac);
    return {
      io_mac: connection.io_mac,
      io_type: ioInfo ? ioInfo.io_type : '',
      io_port: connection.io_port
    };
  }
  return null;
}

// Handle port confirmation
export function handlePortConfirmation(
  ppPort: number,
  focusedPanel: { ru: string } | null,
  ppSerial: string,
  connections: any[],
  setSelectedRU: (ru: string | null) => void,
  setSelectedIO: (io: any) => void,
  setIoLocation: (location: any) => void,
  fetchIOLocation: (ioMac: string) => Promise<any>
) {
  if (!focusedPanel || !ppSerial) return;
  
  setSelectedRU(focusedPanel.ru);
  const connectedIO = findConnectedIO(connections, ppSerial, focusedPanel.ru, ppPort);
  
  if (connectedIO) {
    fetchIOLocation(connectedIO.io_mac)
      .then(res => {
        if (res.data && res.data[0]) {
          setIoLocation(res.data[0]);
          setSelectedIO({
            io_mac: connectedIO.io_mac,
            io_type: res.data[0].io_type,
            io_port: connectedIO.io_port
          });
        } else {
          setSelectedIO({
            io_mac: connectedIO.io_mac,
            io_type: '',
            io_port: connectedIO.io_port
          });
        }
      })
      .catch(() => {
        setIoLocation(null);
        setSelectedIO({
          io_mac: connectedIO.io_mac,
          io_type: '',
          io_port: connectedIO.io_port
        });
      });
  }
} 