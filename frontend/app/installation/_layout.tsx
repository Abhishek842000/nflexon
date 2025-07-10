import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function ConnectivityLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'white' }
        }}
      >
        <Stack.Screen name="qr-scanner"/>
        <Stack.Screen name="Location"/>
      </Stack>
    </View>
  );
} 