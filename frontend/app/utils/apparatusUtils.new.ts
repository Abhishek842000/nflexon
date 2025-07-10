import React from 'react';
import axios from 'axios';
import { IO_IMAGES } from '../config/assets';

// List of valid IO prefixes
const IO_PREFIXES = ['FP2', 'FP4', 'FP6', 'SB1', 'SB2', 'SB4'];

export type ApparatusInfo =
  | {
      type: 'PP';
      serial: string;
      mac: string;
      images: { ru: string }[];
      location: any;
      connectivity: any[];
    }
  | {
      type: 'IO';
      prefix: string;
      mac: string;
      location: any;
      connectivity: any[];
    }
  | null;

/**
 * Validates QR code format and returns apparatus type
 */
function validateQRCode(qrData: string): { type: 'PP' | 'IO' | null; serial?: string; prefix?: string; mac: string } | null {
  if (!qrData) return null;
  const trimmed = qrData.trim();

  // Split by space to get prefix/serial and MAC
  const parts = trimmed.split(' ');
  if (parts.length !== 2) return null;

  const [identifier, mac] = parts;

  // PP format: 22 chars
  if (identifier.length === 22) {
    return { type: 'PP', serial: identifier, mac };
  }

  // IO format: 3 chars prefix
  if (identifier.length === 3) {
    const prefix = identifier.toUpperCase();
    if (IO_PREFIXES.includes(prefix)) {
      return { type: 'IO', prefix, mac };
    }
  }

  return null;
}

/**
 * Fetches apparatus info from the database
 */
export async function getApparatusInfo(scannedData: string): Promise<ApparatusInfo> {
  const validation = validateQRCode(scannedData);
  if (!validation) {
    console.error('Invalid QR code format:', scannedData);
    return null;
  }

  try {
    if (validation.type === 'PP') {
      // Fetch PP connectivity and location
      const [connRes, locRes] = await Promise.all([
        axios.get(`http://18.117.181.30:3004/api/connectivity-map`, {
          params: { type: 'PP', pp_serial_no: validation.serial }
        }),
        axios.get(`http://18.117.181.30:3004/api/pp-location/${encodeURIComponent(validation.serial || '')}`)
      ]);

      if (!connRes.data?.data || !Array.isArray(connRes.data.data)) {
        console.error('Invalid PP connectivity data');
        return null;
      }

      // Get unique RUs and their connectivity
      const ruSet = new Set<string>();
      const images = connRes.data.data
        .filter((row: any) => {
          if (!row.ru || ruSet.has(row.ru)) return false;
          ruSet.add(row.ru);
          return true;
        })
        .map((row: any) => ({ ru: row.ru }));

      return {
        type: 'PP',
        serial: validation.serial!,
        mac: validation.mac,
        images,
        location: locRes.data?.[0] || null,
        connectivity: connRes.data.data
      };
    } else {
      // Fetch IO connectivity and location
      const [connRes, locRes] = await Promise.all([
        axios.get('http://18.117.181.30:3004/api/connectivity-map', {
          params: { type: 'IO', io_mac: validation.mac }
        }),
        axios.get(`http://18.117.181.30:3004/api/io-location/${encodeURIComponent(validation.mac)}`)
      ]);

      if (!connRes.data?.data || !Array.isArray(connRes.data.data)) {
        console.error('Invalid IO connectivity data');
        return null;
      }

      return {
        type: 'IO',
        prefix: validation.prefix!,
        mac: validation.mac,
        location: locRes.data?.[0] || null,
        connectivity: connRes.data.data
      };
    }
  } catch (error) {
    console.error('Error fetching apparatus info:', error);
    return null;
  }
} 