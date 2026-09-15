import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import TopBar from '../components/TopBar';
import { ioPortCount, loadingSimulationStyles } from '../utils/loadingSimulationUtils';

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
      <View style={loadingSimulationStyles.contentContainer}>
        <Text style={loadingSimulationStyles.title}>Cable Connectivity Mapping</Text>
        <View style={loadingSimulationStyles.progressBarBg}>
          <Animated.View style={[loadingSimulationStyles.progressBar, { width: barWidth }]} />
        </View>
        <Text style={loadingSimulationStyles.percent}>{percent}%</Text>
        <Text style={loadingSimulationStyles.status}>
          {done
            ? `Cable connectivity mapping successful.\n${terminated}/${totalPorts} Connections Confirmed`
            : 'Mapping cable connectivity\nThis may take some time. Please wait.'}
        </Text>
        {done && (
          <TouchableOpacity style={loadingSimulationStyles.proceedButton} onPress={handleProceed}>
            <Text style={loadingSimulationStyles.proceedButtonText}>
              Proceed to Cabling Certification Test
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}


