import axios from 'axios';

// Define the apparatus image URLs
export const APPARATUS_IMAGES: Record<string, string> = {
  FP2: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/FP2.png',
  FP4: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/FP4.png',
  FP6: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/FP6.png',
  SB1: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/SB1.png',
  SB2: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/SB2.png',
  SB4: 'https://nflexon-app-assets.s3.us-east-2.amazonaws.com/io/SB4.png',
};

// Example: port positions for each apparatus (to be customized per image)
export const APPARATUS_PORTS: Record<string, { x: number; y: number; label: string }[]> = {
  FP2: [
    { x: 0.25, y: 0.5, label: 'Port 1' },
    { x: 0.75, y: 0.5, label: 'Port 2' },
  ],
  // Add more for FP4, FP6, SB1, SB2, SB4 as needed
};

// Validate QR by checking with backend
export async function validateQR(qr: string): Promise<{ valid: boolean; prefix?: string }> {
  // Replace with your backend API endpoint
  const API_URL = 'http://localhost:3000/api/validate-qr';
  try {
    const res = await axios.post(API_URL, { qr });
    if (res.data && res.data.valid && res.data.prefix) {
      return { valid: true, prefix: res.data.prefix };
    }
    return { valid: false };
  } catch (e) {
    return { valid: false };
  }
}

// Get apparatus image URL by prefix
export function getApparatusImage(prefix: string): string | undefined {
  return APPARATUS_IMAGES[prefix];
}

// Get port positions for apparatus
export function getApparatusPorts(prefix: string) {
  return APPARATUS_PORTS[prefix] || [];
} 