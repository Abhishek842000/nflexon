// Types
export interface Connection {
  pp_serial_no: string;
  ru: string;
  pp_port: number;
  io_mac: string;
  io_port: number;
}

// Standard color palette for port overlays
export const PORT_COLORS = [
  '#D32F2F', // Red (selected)
  '#1976D2', // Blue
  '#388E3C', // Green
  '#FBC02D', // Yellow
  '#7B1FA2', // Purple
  '#F57C00', // Orange
  '#0288D1', // Cyan
  '#C2185B', // Pink
  '#455A64', // Slate
  '#F7A800', // Gold
  '#009688', // Teal
  '#8D6E63', // Brown
  '#5D4037', // Dark Brown
  '#C0CA33', // Lime
  '#E64A19', // Deep Orange
  '#1976D2', // Blue2
  '#388E3C', // Green2
  '#FBC02D', // Yellow2
  '#7B1FA2', // Purple2
  '#F57C00', // Orange2
  '#0288D1', // Cyan2
  '#C2185B', // Pink2
  '#455A64', // Slate2
  '#F7A800', // Gold2
];

export const PALETTE = ['#D32F2F', '#1976D2', '#FBC02D', '#F57C00', '#7B1FA2', '#888888']; // red, blue, yellow, orange, violet, grey

// Helper to normalize MAC addresses and serials
function norm(val: string) {
  return val.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export function getActivePortsForPP(ppSerial: string, connections: Connection[]): Record<string, number[]> {
  const byRU: Record<string, number[]> = {};
  connections.filter((c) => norm(c.pp_serial_no) === norm(ppSerial)).forEach((c) => {
    if (!byRU[c.ru]) byRU[c.ru] = [];
    byRU[c.ru].push(Number(c.pp_port));
  });
  return byRU;
}

export function getActivePortsForIO(ioMac: string, connections: Connection[]): number[] {
  return connections.filter((c) => norm(c.io_mac) === norm(ioMac)).map((c) => Number(c.io_port));
}

export function getIOPortList(ioType: string): number[] {
  const match = ioType.match(/\d+/);
  const count = match ? parseInt(match[0], 10) : 1;
  return Array.from({ length: count }, (_, i) => i + 1);
}

export function getIOPortToPPPortMap(ioMac: string, connections: Connection[]): Record<number, { pp_serial_no: string; ru: string; pp_port: number } | null> {
  const map: Record<number, { pp_serial_no: string; ru: string; pp_port: number } | null> = {};
  connections.forEach((c) => {
    if (norm(c.io_mac) === norm(ioMac)) {
      map[Number(c.io_port)] = {
        pp_serial_no: c.pp_serial_no,
        ru: c.ru,
        pp_port: c.pp_port,
      };
    }
  });
  return map;
}

export function getIOPortColorMap(ioMac: string, selectedPort: number | null, connections: Connection[]) {
  const colorMap: Record<number, string> = {};
  if (!selectedPort) return colorMap;
  const ioConnections = connections.filter((c: Connection) => norm(c.io_mac) === norm(ioMac));
  colorMap[selectedPort] = '#D32F2F';
  let colorIndex = 1;
  ioConnections.forEach((conn: Connection) => {
    if (conn.io_port !== selectedPort) {
      colorMap[conn.io_port] = PORT_COLORS[colorIndex % PORT_COLORS.length];
      colorIndex++;
    }
  });
  return colorMap;
}

export function getPPPortColorMap(ppSerial: string, ru: string, selectedPort: number | null, connections: Connection[]) {
  const colorMap: Record<number, string> = {};
  if (!selectedPort) return colorMap;
  const ppConnections = connections.filter((c: Connection) => c.pp_serial_no === ppSerial && c.ru === ru);
  colorMap[selectedPort] = '#D32F2F';
  let colorIndex = 1;
  ppConnections.forEach((conn: Connection) => {
    if (conn.pp_port !== selectedPort) {
      colorMap[conn.pp_port] = PORT_COLORS[colorIndex % PORT_COLORS.length];
      colorIndex++;
    }
  });
  return colorMap;
}

export function getPPPortColorMapForRU(
  ruNum: string,
  activePorts: number[],
  selectedIO: { io_mac: string; io_type: string; io_port: number } | null,
  selectedPort: number | null,
  connections: Connection[]
): Record<number, string> {
  const PALETTE = [
    'rgba(211,47,47,0.7)', // red
    'rgba(25,118,210,0.7)', // blue
    'rgba(251,192,45,0.7)', // yellow
    'rgba(245,124,0,0.7)', // orange
    'rgba(123,31,162,0.7)', // violet
    'rgba(136,136,136,0.7)', // grey
  ];
  let colorMap: Record<number, string> = {};
  if (!selectedIO || !selectedPort) {
    activePorts.forEach(portNum => {
      colorMap[portNum] = '#00C853';
    });
    return colorMap;
  }
  const ioConnections = connections.filter((conn) => conn.io_mac === selectedIO.io_mac);
  const connectedIOPorts = Array.from(new Set(ioConnections.map(conn => conn.io_port))).sort((a, b) => a - b);
  let ioPortToColor: Record<number, string> = {};
  let paletteIdx = 1;
  connectedIOPorts.forEach(ioPort => {
    if (selectedIO.io_port && ioPort === selectedIO.io_port) {
      ioPortToColor[ioPort] = PALETTE[0];
    } else {
      ioPortToColor[ioPort] = PALETTE[paletteIdx % (PALETTE.length - 1) + 1];
      paletteIdx++;
    }
  });
  activePorts.forEach(portNum => {
    if (portNum === selectedPort) {
      colorMap[portNum] = PALETTE[0];
    } else {
      const conn = connections.find((c) => c.ru === ruNum && c.pp_port === portNum && c.io_mac === selectedIO.io_mac);
      if (conn) {
        colorMap[portNum] = ioPortToColor[conn.io_port];
      } else {
        colorMap[portNum] = '#00C853';
      }
    }
  });
  return colorMap;
}

export function getIOPortHexColorMap(ioPorts: number[], selectedPort: number | null): Record<number, string> {
  const colorMap: Record<number, string> = {};
  if (selectedPort) {
    let colorIdx = 1;
    ioPorts.forEach((port) => {
      if (port === selectedPort) {
        colorMap[port] = '#D32F2F';
      } else {
        colorMap[port] = PORT_COLORS[colorIdx % (PORT_COLORS.length - 1) + 1];
        colorIdx++;
      }
    });
  }
  return colorMap;
}

export function getPPPortColorMapForSelectedIO(selectedIO: { io_mac: string; io_type: string; io_port: number }, connections: Connection[]): Record<string, Record<number, { borderColor: string; backgroundColor: string }>> {
  const map: Record<string, Record<number, { borderColor: string; backgroundColor: string }>> = {};
  const ioConnections = connections.filter(c => c.io_mac === selectedIO.io_mac);
  ioConnections.forEach((conn, idx) => {
    if (!map[conn.ru]) map[conn.ru] = {};
    map[conn.ru][conn.pp_port] = {
      borderColor: PORT_COLORS[(idx + 1) % PORT_COLORS.length],
      backgroundColor: PORT_COLORS[(idx + 1) % PORT_COLORS.length],
    };
  });
  connections.forEach(conn => {
    if (conn.io_mac !== selectedIO.io_mac) {
      if (!map[conn.ru]) map[conn.ru] = {};
      if (!map[conn.ru][conn.pp_port]) {
        map[conn.ru][conn.pp_port] = {
          borderColor: '#00C853',
          backgroundColor: 'transparent',
        };
      }
    }
  });
  return map;
}

export function getIOPortColorMapForIOWithSelected(ioMac: string, selectedPort: number | null, connections: Connection[]): Record<number, string> {
  const colorMap: Record<number, string> = {};
  const ioConnections = connections.filter((c: Connection) => c.io_mac === ioMac);
  const ports = Array.from(new Set(ioConnections.map(conn => conn.io_port))).sort((a, b) => a - b);
  let paletteIdx = 1;
  ports.forEach(port => {
    if (selectedPort && port === selectedPort) {
      colorMap[port] = PALETTE[0];
    } else {
      colorMap[port] = PALETTE[paletteIdx % (PALETTE.length - 1) + 1];
      paletteIdx++;
    }
  });
  return colorMap;
}

export function getGlobalPPPortColorMap(
  connections: Connection[],
  selectedIO: { io_mac: string; io_type: string; io_port: number } | null,
  selectedPort: number | null,
  selectedRU: string | null
): Record<string, Record<number, { borderColor: string; backgroundColor: string }>> {
  const PALETTE = [
    'rgba(211,47,47,0.7)',
    'rgba(25,118,210,0.7)',
    'rgba(251,192,45,0.7)',
    'rgba(245,124,0,0.7)',
    'rgba(123,31,162,0.7)',
    'rgba(136,136,136,0.7)',
  ];
  const map: Record<string, Record<number, { borderColor: string; backgroundColor: string }>> = {};
  if (!selectedIO || !selectedPort || !selectedRU) return map;
  const ioConnections = connections.filter(c => c.io_mac === selectedIO.io_mac);
  const ioPorts = Array.from(new Set(ioConnections.map(conn => conn.io_port))).sort((a, b) => a - b);
  let ioPortToColor: Record<number, string> = {};
  let paletteIdx = 1;
  ioPorts.forEach(ioPort => {
    if (selectedIO.io_port && ioPort === selectedIO.io_port) {
      ioPortToColor[ioPort] = PALETTE[0];
    } else {
      ioPortToColor[ioPort] = PALETTE[paletteIdx % (PALETTE.length - 1) + 1];
      paletteIdx++;
    }
  });
  ioConnections.forEach(conn => {
    if (!map[conn.ru]) map[conn.ru] = {};
    map[conn.ru][conn.pp_port] = {
      borderColor: ioPortToColor[conn.io_port],
      backgroundColor: ioPortToColor[conn.io_port],
    };
  });
  // Only color the selected port red in the selected RU
  connections.forEach(conn => {
    if (conn.pp_port === selectedPort && String(conn.ru) === String(selectedRU)) {
      if (!map[conn.ru]) map[conn.ru] = {};
      map[conn.ru][conn.pp_port] = {
        borderColor: PALETTE[0],
        backgroundColor: PALETTE[0],
      };
    }
  });
  connections.forEach(conn => {
    if (conn.io_mac !== selectedIO.io_mac) {
      if (!map[conn.ru]) map[conn.ru] = {};
      if (!map[conn.ru][conn.pp_port]) {
        map[conn.ru][conn.pp_port] = {
          borderColor: '#00C853',
          backgroundColor: 'transparent',
        };
      }
    }
  });
  return map;
} 