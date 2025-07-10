import { useEffect, useRef } from 'react';
import { View, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { LOGO_IMAGE } from './config/assets';

export default function LandingScreen() {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start page fade/slide after 2 seconds
    const fadeTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -40,
          duration: 700,
          useNativeDriver: true,
        })
      ]).start(() => {
        router.replace('/main-menu');
      });
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeAnim,
        transform: [{ translateY: translateYAnim }],
      }}
    >
      <Image
        source={{ uri: LOGO_IMAGE }}
        style={{ width: 200, height: 56, resizeMode: 'contain' }}
      />
    </Animated.View>
  );
} 

