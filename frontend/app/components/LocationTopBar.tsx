import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSession } from '../contexts/SessionContext';
import { LOGO_IMAGE } from '../config/assets';

interface LocationTopBarProps {
  title: string;
}

const ICON_SIZE = 36;
const TOP_BAR_HEIGHT = 64;
const TOP_BAR_TOP_SPACING = 52;

export default function LocationTopBar({ title }: LocationTopBarProps) {
  const { clearSession } = useSession();
  return (
    <View>
      {/* Logo above TopBar */}
      <View style={styles.logoContainer}>
        <Image source={{ uri: LOGO_IMAGE }} style={styles.logo} resizeMode="contain" />
      </View>
      {/* TopBar */}
      <View style={[styles.topBar, { marginTop: TOP_BAR_TOP_SPACING }]}> 
        {/* Scanner Icon (left) */}
        <TouchableOpacity 
          style={styles.iconLeft} 
          onPress={() => router.replace('/installation/qr-scanner')}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={ICON_SIZE} color="#F7A800" />
        </TouchableOpacity>
        {/* Title */}
        <Text style={styles.title}>{title}</Text>
        {/* Hamburger Icon (right) */}
        <TouchableOpacity 
          style={styles.iconRight} 
          onPress={() => {
            clearSession();
            router.replace('/main-menu');
          }}
        >
          <Ionicons name="menu" size={ICON_SIZE} color="#222" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    position: 'absolute',
    top: TOP_BAR_TOP_SPACING - 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  logo: {
    width: 48,
    height: 32,
  },
  topBar: {
    height: TOP_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
    zIndex: 10,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.5,
  },
  iconLeft: {
    position: 'absolute',
    left: 18,
    top: 14,
    zIndex: 20,
  },
  iconRight: {
    position: 'absolute',
    right: 18,
    top: 14,
    zIndex: 20,
  },
}); 