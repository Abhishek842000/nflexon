import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import TopBar from '../components/TopBar';

// Helper to get port count from io_type (e.g., FP6 -> 6, SB2 -> 2)
function ioPortCount(type: string): number {
  const match = type.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

export default function LoadingSimulation() {
  const params = useLocalSearchParams();
  const totalPorts = params.totalPorts ? parseInt(params.totalPorts as string, 10) : 0;
  const ppsParam = params.pps ? String(params.pps) : undefined;
  const iosParam = params.ios ? String(params.ios) : undefined;

  const [terminated, setTerminated] = useState(0);
  const [done, setDone] = useState(false);
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let portInterval: NodeJS.Timeout;
    setTerminated(0);
    setDone(false);
    progressAnim.setValue(0);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 4500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setDone(true);
      }
    });

    // Simulate port termination
    let port = 0;
    portInterval = setInterval(() => {
      if (port < totalPorts && !done) {
        port++;
        setTerminated(port);
      } else {
        clearInterval(portInterval);
      }
    }, totalPorts > 0 ? 4500 / totalPorts : 4500);

    return () => {
      clearInterval(portInterval);
    };
    // eslint-disable-next-line
  }, [totalPorts]);

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => {
      setPercent(Math.round(value));
    });
    return () => progressAnim.removeListener(id);
  }, [progressAnim]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const handleProceed = () => {
    router.push({ pathname: '/testing/qr-scanner2', params: { pps: ppsParam, ios: iosParam } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ marginLeft: -18 }}>
        <TopBar title="Cable Connectivity Mapping" showMenuIcon titleColor="#fff" />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Cable Connectivity Mapping</Text>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBar, { width: barWidth }]} />
        </View>
        <Text style={styles.percent}>{percent}%</Text>
        <Text style={styles.status}>
          {done
            ? `Cable connectivity mapping successful.\n${terminated}/${totalPorts} Connections Confirmed`
            : 'Mapping cable connectivity\nThis may take some time. Please wait.'}
        </Text>
        {done && (
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
            <Text style={styles.proceedButtonText}>
              Proceed to Cabling Certification Test
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 36,
    textAlign: 'center',
  },
  progressBarBg: {
    width: '90%',
    height: 24,
    backgroundColor: '#eee',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#F7A800',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F7A800',
    borderRadius: 16,
  },
  percent: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F7A800',
    marginBottom: 18,
    marginTop: 2,
  },
  status: {
    fontSize: 18,
    color: '#111',
    marginBottom: 32,
    textAlign: 'center',
    minHeight: 48,
  },
  proceedButton: {
    backgroundColor: '#F7A800',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 32,
    width: '75%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  proceedButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
});
