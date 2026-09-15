import { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';

const API_BASE = 'http://18.117.181.30:3004/api';

export interface FormData {
  site: string;
  building: string;
  floor: string;
  room: string;
  rack: string;
  additional_description: string;
}

export interface LocationDetails {
  site: string;
  building: string;
  floor: string;
}

export function useLocationForm(apparatusType: string | string[]) {
  const [formData, setFormData] = useState<FormData>({
    site: '',
    building: '',
    floor: '',
    room: '',
    rack: '',
    additional_description: '',
  });
  const [loading, setLoading] = useState(true);
  const [isPP, setIsPP] = useState(false);
  const [isExistingPP, setIsExistingPP] = useState(false);
  const [fieldsLocked, setFieldsLocked] = useState(false);
  const [error, setError] = useState('');
  const [ppSerial, setPpSerial] = useState('');
  const [ppMac, setPpMac] = useState('');
  const [ioType, setIoType] = useState('');
  const [ioMac, setIoMac] = useState('');
  const { pps, ios, addPP, addIO, clearSession, firstApparatusLocation, setFirstApparatusLocation } = useSession();

  // Parse apparatusType from QR
  useEffect(() => {
    if (!apparatusType || typeof apparatusType !== 'string') return;
    // PP: 22 chars serial + space + 17 char MAC
    if (apparatusType.length > 22) {
      setIsPP(true);
      setPpSerial(apparatusType.slice(0, 22));
      setPpMac(apparatusType.slice(23));
    } else {
      setIsPP(false);
      setIoType(apparatusType.slice(0, 3));
      setIoMac(apparatusType.slice(4));
    }
  }, [apparatusType]);

  // Fetch existing PP location if PP
  useEffect(() => {
    let isMounted = true;
    async function fetchPPLocation() {
      if (isPP && ppSerial) {
        setLoading(true);
        setFieldsLocked(false);
        setIsExistingPP(false);
        setError('');
        try {
          const res = await fetch(`${API_BASE}/pp-location/${encodeURIComponent(ppSerial)}`);
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Existing PP, prepopulate and lock fields
            if (isMounted) {
              setFormData({
                site: data[0].site || '',
                building: data[0].building || '',
                floor: data[0].floor !== undefined && data[0].floor !== null ? String(data[0].floor) : '',
                room: data[0].room || '',
                rack: data[0].rack || '',
                additional_description: '',
              });
              setIsExistingPP(true);
              setFieldsLocked(true);
              // Save to session context if this is the first apparatus
              if (!firstApparatusLocation) {
                setFirstApparatusLocation({
                  site: data[0].site || '',
                  building: data[0].building || '',
                  floor: data[0].floor !== undefined && data[0].floor !== null ? String(data[0].floor) : '',
                });
              }
            }
          } else {
            // New PP
            if (isMounted) {
              if (firstApparatusLocation) {
                // Not first scan - autopopulate Site, Building, Floor
                setFormData({
                  site: firstApparatusLocation.site,
                  building: firstApparatusLocation.building,
                  floor: firstApparatusLocation.floor,
                  room: '',
                  rack: '',
                  additional_description: '',
                });
              } else {
                // First scan - leave all fields empty
                setFormData({ 
                  site: '', 
                  building: '', 
                  floor: '', 
                  room: '', 
                  rack: '', 
                  additional_description: '' 
                });
              }
              setIsExistingPP(false);
              setFieldsLocked(false);
            }
          }
        } catch (e) {
          if (isMounted) setError('Failed to fetch PP location');
        } finally {
          if (isMounted) setLoading(false);
        }
      } else if (!isPP && ioMac) {
        // For IOs
        if (isMounted) {
          if (firstApparatusLocation) {
            // Not first scan - autopopulate Site, Building, Floor
            setFormData({
              site: firstApparatusLocation.site,
              building: firstApparatusLocation.building,
              floor: firstApparatusLocation.floor,
              room: '',
              rack: '',
              additional_description: '',
            });
          } else {
            // First scan - leave all fields empty
            setFormData({ 
              site: '', 
              building: '', 
              floor: '', 
              room: '', 
              rack: '', 
              additional_description: '' 
            });
          }
          setLoading(false);
        }
      } else {
        if (isMounted) setLoading(false);
      }
    }
    fetchPPLocation();
    return () => { isMounted = false; };
  }, [isPP, ppSerial, ioMac, firstApparatusLocation, setFirstApparatusLocation]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    setFormData,
    loading,
    setLoading,
    isPP,
    isExistingPP,
    fieldsLocked,
    error,
    setError,
    ppSerial,
    ppMac,
    ioType,
    ioMac,
    pps,
    ios,
    addPP,
    addIO,
    clearSession,
    firstApparatusLocation,
    setFirstApparatusLocation,
    handleChange,
  };
}

export function ioPortCount(type: string): number {
  const match = type.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export async function submitPPLocation(
  ppSerial: string,
  ppMac: string,
  formData: FormData,
  isExistingPP: boolean,
  firstApparatusLocation: LocationDetails | null,
  setFirstApparatusLocation: (location: LocationDetails) => void
): Promise<void> {
  if (!isExistingPP) {
    const payload = {
      pp_serial_no: ppSerial,
      pp_mac: ppMac,
      site: formData.site,
      building: formData.building,
      floor: formData.floor,
      room: formData.room,
      rack: formData.rack,
    };
    const res = await fetch(`${API_BASE}/pp-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save PP location');
    if (!firstApparatusLocation) {
      setFirstApparatusLocation({
        site: formData.site,
        building: formData.building,
        floor: formData.floor,
      });
    }
  }
}

export async function submitIOLocation(
  ioType: string,
  ioMac: string,
  formData: FormData
): Promise<void> {
  const payload = {
    io_type: ioType,
    io_mac: ioMac,
    site: formData.site,
    building: formData.building,
    floor: formData.floor,
    room: formData.room,
    additional_description: formData.additional_description,
  };
  const res = await fetch(`${API_BASE}/io-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save IO location');
} 