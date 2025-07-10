import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PPInfo {
  pp_serial_no: string;
}
export interface IOInfo {
  io_type: string;
  io_mac: string;
}

export interface LocationDetails {
  site: string;
  building: string;
  floor: string;
}

interface SessionContextType {
  pps: PPInfo[];
  ios: IOInfo[];
  firstApparatusLocation: LocationDetails | null;
  addPP: (pp: PPInfo) => void;
  addIO: (io: IOInfo) => void;
  setFirstApparatusLocation: (location: LocationDetails) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [pps, setPPs] = useState<PPInfo[]>([]);
  const [ios, setIOs] = useState<IOInfo[]>([]);
  const [firstApparatusLocation, setFirstApparatusLocation] = useState<LocationDetails | null>(null);

  const addPP = (pp: PPInfo) => setPPs(prev => [...prev, pp]);
  const addIO = (io: IOInfo) => setIOs(prev => [...prev, io]);
  const clearSession = () => {
    setPPs([]);
    setIOs([]);
    setFirstApparatusLocation(null);
    console.log('Session cleared!');
  };

  return (
    <SessionContext.Provider value={{ 
      pps, 
      ios, 
      firstApparatusLocation,
      addPP, 
      addIO, 
      setFirstApparatusLocation,
      clearSession 
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
} 