// Utility for auto-generating random unique PP-IO connections for a session

export interface PPInfo {
  pp_serial_no: string;
}
export interface IOInfo {
  io_type: string;
  io_mac: string;
}
export interface PPPort {
  pp_serial_no: string;
  ru: number;
  pp_port: number;
}
export interface IOPort {
  io_mac: string;
  io_port: number;
}
export interface Connection {
  pp_serial_no: string;
  ru: number;
  pp_port: number;
  io_mac: string;
  io_port: number;
}

// Helper: get IO port count from type (e.g., FP6 -> 6, SB2 -> 2)
export function ioPortCount(type: string): number {
  const match = type.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

// Generate all possible PP ports
export function generatePPPorts(pps: PPInfo[]): PPPort[] {
  const all: PPPort[] = [];
  for (const pp of pps) {
    for (let ru = 1; ru <= 8; ru++) {
      for (let pp_port = 1; pp_port <= 24; pp_port++) {
        all.push({ pp_serial_no: pp.pp_serial_no, ru, pp_port });
      }
    }
  }
  return all;
}

// Generate all possible IO ports
export function generateIOPorts(ios: IOInfo[]): IOPort[] {
  const all: IOPort[] = [];
  for (const io of ios) {
    const count = ioPortCount(io.io_type);
    for (let io_port = 1; io_port <= count; io_port++) {
      all.push({ io_mac: io.io_mac, io_port });
    }
  }
  return all;
}

// Shuffle helper
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Main pairing logic
export function generateRandomConnections(pps: PPInfo[], ios: IOInfo[]): Connection[] {
  const allPPPorts = shuffle(generatePPPorts(pps));
  const allIOPorts = shuffle(generateIOPorts(ios));
  const totalConnections = Math.min(allIOPorts.length, allPPPorts.length);
  const connections: Connection[] = [];
  const usedPP = new Set();
  const usedIO = new Set();
  for (let i = 0; i < totalConnections; i++) {
    let pp, io, tries = 0;
    do {
      pp = allPPPorts[i];
      io = allIOPorts[i];
      tries++;
    } while ((usedPP.has(`${pp.pp_serial_no}-${pp.ru}-${pp.pp_port}`) || usedIO.has(`${io.io_mac}-${io.io_port}`)) && tries < 10);
    if (tries >= 10) continue;
    usedPP.add(`${pp.pp_serial_no}-${pp.ru}-${pp.pp_port}`);
    usedIO.add(`${io.io_mac}-${io.io_port}`);
    connections.push({ ...pp, ...io });
  }
  return connections;
} 