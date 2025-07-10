import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import TopBar from '../components/TopBar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSession } from '../contexts/SessionContext';

const BUTTON_WIDTH = 315;
const BUTTON_HEIGHT = 56;

// Helper to get port count from io_type (e.g., FP6 -> 6, SB2 -> 2)
function ioPortCount(type: string): number {
  const match = type.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export default function CablingInstructions() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { ios } = useSession();
  // Prefer totalPorts from params, fallback to session context
  const totalPorts = params.totalPorts ? parseInt(params.totalPorts as string, 10) : ios.reduce((sum, io) => sum + ioPortCount(io.io_type), 0);
  const ppsParam = params.pps ? String(params.pps) : undefined;
  const iosParam = params.ios ? String(params.ios) : undefined;
  return (
    <View style={styles.container}>
      <TopBar 
        title="Instructions" 
        showMenuIcon 
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instructionsText}>
          The installer must complete the following steps before moving forward:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.bulletText}>Establish a wired and wireless intranet.</Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.bulletText}>Connect each IoT Network Panel to the intranet via a wired connection.</Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.bulletText}>Deploy wireless network effectively so that each FP or SMB can connect to the intranet with a pre-set SSID and password.</Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bullet}>{'\u2022'}</Text>
            <Text style={styles.bulletText}>Connect all cables between data/power bus and IoT network/node panels.</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/installation/loading-simulation', params: { totalPorts: String(totalPorts), pps: ppsParam, ios: iosParam } })}>
          <Text style={styles.buttonText}>Confirm & Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  instructionsText: {
    fontSize: 18,
    color: '#222',
    marginBottom: 40,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  bulletList: {
    marginLeft: 0,
    marginBottom: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  bullet: {
    fontSize: 32,
    color: '#222',
    lineHeight: 32,
    marginRight: 12,
    marginTop: 2,
    width: 28,
    textAlign: 'center',
  },
  bulletText: {
    flex: 1,
    fontSize: 17,
    color: '#222',
    lineHeight: 28,
    textAlign: 'justify',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 48,
    backgroundColor: 'transparent',
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    backgroundColor: '#F7A800',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F7A800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 6,
  },
  buttonText: {
    color: '#222',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
