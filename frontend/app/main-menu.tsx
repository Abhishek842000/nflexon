import { View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useSession } from './contexts/SessionContext';
import { useEffect } from 'react';
import { LOGO_IMAGE } from './config/assets';

export default function MainMenuScreen() {
  const { pps, ios, firstApparatusLocation } = useSession();
  useEffect(() => {
    console.log('Main menu session:', { pps, ios, firstApparatusLocation });
  }, [pps, ios, firstApparatusLocation]);

  return (
    <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 60 }}>
      {/* Logo at the top */}
      <Image
        source={{ uri: LOGO_IMAGE }}
        style={{ width: 142, height: 33, resizeMode: 'contain', marginBottom: 60 }}
      />

      {/* Begin Installation Process Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#FEF9F3',
          borderRadius: 16,
          borderWidth: 3,
          borderColor: '#F7A800',
          width: 300,
          height: 160,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
        onPress={() => router.push('/installation')}
      >
        <Text style={{ color: '#222', fontSize: 20, fontWeight: '500', textAlign: 'center' }}>
          Begin the Installation{"\n"}Process
        </Text>
      </TouchableOpacity>

      {/* Cabling Certification Testing Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#FEF9F3',
          borderRadius: 16,
          borderWidth: 3,
          borderColor: '#F7A800',
          width: 300,
          height: 160,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
        onPress={() => router.push('/testing/qr-scanner2')}
      >
        <Text style={{ color: '#222', fontSize: 20, fontWeight: '500', textAlign: 'center' }}>
          Cabling Certification{"\n"}Testing
        </Text>
      </TouchableOpacity>

      {/* View Connectivity Map Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#FEF9F3',
          borderRadius: 16,
          borderWidth: 3,
          borderColor: '#F7A800',
          width: 300,
          height: 160,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
        onPress={() => router.push('/connectivity/active-link-search')}
      >
        <Text style={{ color: '#222', fontSize: 20, fontWeight: '500', textAlign: 'center' }}>
          Trace LAN Connections
        </Text>
      </TouchableOpacity>
    </View>
  );
} 