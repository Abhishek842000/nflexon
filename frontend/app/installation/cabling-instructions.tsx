import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import TopBar from '../components/TopBar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSession } from '../contexts/SessionContext';
import { ioPortCount, cablingInstructionsStyles } from '../utils/cablingInstructionsUtils';

export default function CablingInstructions() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { ios } = useSession();
  // Prefer totalPorts from params, fallback to session context
  const totalPorts = params.totalPorts ? parseInt(params.totalPorts as string, 10) : ios.reduce((sum, io) => sum + ioPortCount(io.io_type), 0);
  const ppsParam = params.pps ? String(params.pps) : undefined;
  const iosParam = params.ios ? String(params.ios) : undefined;
  return (
    <View style={cablingInstructionsStyles.container}>
      <TopBar 
        title="Instructions" 
        showMenuIcon 
      />
      <ScrollView contentContainerStyle={cablingInstructionsStyles.content}>
        <Text style={cablingInstructionsStyles.instructionsText}>
          The installer must complete the following steps before moving forward:
        </Text>
        <View style={cablingInstructionsStyles.bulletList}>
          <View style={cablingInstructionsStyles.bulletRow}>
            <Text style={cablingInstructionsStyles.bullet}>{'\u2022'}</Text>
            <Text style={cablingInstructionsStyles.bulletText}>Establish a wired and wireless intranet.</Text>
          </View>
          <View style={cablingInstructionsStyles.bulletRow}>
            <Text style={cablingInstructionsStyles.bullet}>{'\u2022'}</Text>
            <Text style={cablingInstructionsStyles.bulletText}>Connect each IoT Network Panel to the intranet via a wired connection.</Text>
          </View>
          <View style={cablingInstructionsStyles.bulletRow}>
            <Text style={cablingInstructionsStyles.bullet}>{'\u2022'}</Text>
            <Text style={cablingInstructionsStyles.bulletText}>Deploy wireless network effectively so that each FP or SMB can connect to the intranet with a pre-set SSID and password.</Text>
          </View>
          <View style={cablingInstructionsStyles.bulletRow}>
            <Text style={cablingInstructionsStyles.bullet}>{'\u2022'}</Text>
            <Text style={cablingInstructionsStyles.bulletText}>Connect all cables between data/power bus and IoT network/node panels.</Text>
          </View>
        </View>
      </ScrollView>
      <View style={cablingInstructionsStyles.buttonContainer}>
        <TouchableOpacity style={cablingInstructionsStyles.button} onPress={() => router.push({ pathname: '/installation/loading-simulation', params: { totalPorts: String(totalPorts), pps: ppsParam, ios: iosParam } })}>
          <Text style={cablingInstructionsStyles.buttonText}>Confirm & Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


