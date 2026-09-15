import axios from 'axios';
import { PPLocation, IOLocation, generateSwitchLocations } from './switchUtils';

const API_BASE = 'http://18.117.181.30:3004/api';

// Function to fetch all location data
export async function fetchLocationData() {
  try {
    const [ppRes, ioRes] = await Promise.all([
      axios.get(`${API_BASE}/pp-location/all`),
      axios.get(`${API_BASE}/io-location/all`),
    ]);
    const ppData = ppRes.data || [];
    const ioData = ioRes.data || [];
    
    // Generate switch locations dynamically from PP and IO data
    const generatedSwitchLocations = generateSwitchLocations(ppData, ioData);
    console.log('Generated switch locations:', generatedSwitchLocations);
    
    return {
      ppLocations: ppData,
      ioLocations: ioData,
      switchLocations: generatedSwitchLocations
    };
  } catch (e) {
    console.error('Error fetching location data:', e);
    return {
      ppLocations: [],
      ioLocations: [],
      switchLocations: []
    };
  }
} 