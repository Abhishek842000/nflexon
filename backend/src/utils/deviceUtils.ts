// Function to generate realistic network devices with weighted distribution
export function generateNetworkDevice(): string {
  const devices = [
    { name: 'Computer', weight: 35 },         // Most common - office computers
    { name: 'IP Phone', weight: 20 },         // Common in office environments
    { name: 'Security Camera', weight: 15 },  // Common for surveillance
    { name: 'Network Printer', weight: 10 },  // Office printers
    { name: 'Access Point', weight: 8 },      // WiFi access points
    { name: 'Television', weight: 5 },        // Display screens and TVs
    { name: 'VoIP Phone', weight: 3 },        // Modern phone systems
    { name: 'Digital Signage', weight: 2 },   // Display systems
    { name: 'Video Conference Unit', weight: 2 } // Meeting room equipment
  ];
  
  // Calculate total weight
  const totalWeight = devices.reduce((sum, device) => sum + device.weight, 0);
  
  // Generate random number
  const random = Math.random() * totalWeight;
  
  // Find the device based on weight
  let currentWeight = 0;
  for (const device of devices) {
    currentWeight += device.weight;
    if (random <= currentWeight) {
      return device.name;
    }
  }
  
  // Fallback to computer if something goes wrong
  return 'Computer';
}

// Function to generate unique MAC address
export function generateUniqueMac(usedMacs: Set<string>): string {
  let mac;
  do {
    mac = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
  } while (usedMacs.has(mac));
  usedMacs.add(mac);
  return mac;
} 