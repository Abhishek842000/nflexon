import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SubmitButtonProps {
  onPress: () => void;
  text: string;
  disabled?: boolean;
}

export default function SubmitButton({ onPress, text, disabled }: SubmitButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.submitButton, disabled && styles.disabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.submitButtonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    backgroundColor: '#F7A800',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  disabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#222',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 