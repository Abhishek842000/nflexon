import React from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { QueryInputs } from '../types';
import { DEFAULT_LIMIT } from '../constants/config';

interface QueryFormProps {
  inputs: QueryInputs;
  onInputChange: (key: keyof QueryInputs, value: string) => void;
  onRunQuery: () => void;
}

export const QueryForm: React.FC<QueryFormProps> = ({ 
  inputs, 
  onInputChange, 
  onRunQuery 
}) => {
  return (
    <View>
      {(['date', 'month', 'domain', 'location', 'limit'] as const).map(key => (
        <TextInput
          key={key}
          placeholder={key.toUpperCase()}
          value={inputs[key]}
          onChangeText={(val: string) => onInputChange(key, val)}
          style={styles.input}
          keyboardType={key === 'month' || key === 'limit' ? 'numeric' : 'default'}
        />
      ))}

      <View style={styles.buttonContainer}>
        <Button title="Run Query" onPress={onRunQuery} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1,
    marginBottom: 15,
    fontSize: 16,
    padding: 8,
  },
  buttonContainer: {
    marginVertical: 10,
  },
}); 