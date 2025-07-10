import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface FormContainerProps {
  title: string;
  children: React.ReactNode;
}

export default function FormContainer({ title, children }: FormContainerProps) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
}); 