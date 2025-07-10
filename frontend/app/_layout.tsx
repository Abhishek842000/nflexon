import { Stack } from 'expo-router';
import { SessionProvider } from './contexts/SessionContext';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <SessionProvider>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'white' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="main-menu" />
          <Stack.Screen name="installation" />
          <Stack.Screen name="connectivity" />
        </Stack>
      </View>
    </SessionProvider>
  );
}
