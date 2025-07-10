import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LocationInfoBoxProps {
  location: any;
  type: 'PP' | 'IO';
  hideFields?: string[];
}

export default function LocationInfoBox({ location, type, hideFields = [] }: LocationInfoBoxProps) {
  if (!location) return null;

  const fieldMap: Record<string, string> = type === 'PP' ? {
    ...(location.switch_name
      ? { switch_name: 'Switch' }
      : { pp_serial_no: 'Serial No.' }),
    'pp_mac': 'MAC',
    'site': 'Site',
    'building': 'Building',
    'floor': 'Floor',
    'room': 'Room',
    'rack': 'Rack'
  } : {
    'io_type': 'Type',
    'io_mac': 'MAC',
    'site': 'Site',
    'building': 'Building',
    'floor': 'Floor',
    'room': 'Room',
    'additional_description': 'Additional Description'
  };

  const fields = Object.keys(fieldMap).filter(field => !hideFields.includes(field) && (field !== 'pp_serial_no' || !location.switch_name));

  return (
    <View style={styles.locationBox}>
      {fields.map((field) => {
        const value = location[field];
        if (value === null || value === undefined || value === '') return null;
        return (
          <Text key={field} style={styles.locationText}>
            <Text style={styles.label}>{fieldMap[field]}: </Text>
            {String(value)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  locationBox: {
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    width: '90%',
    alignSelf: 'center',
  },
  locationText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  label: {
    fontWeight: 'bold',
  },
}); 