import { useState } from 'react';
import { QueryInputs, QueryResult, AppState, DatabaseType } from '../types';
import { fetchAllData, ApiError } from '../services/api';
import { 
  MONTH_VALIDATION, 
  LIMIT_VALIDATION, 
  ERROR_MESSAGES 
} from '../constants/config';

export const useQuery = () => {
  const [inputs, setInputs] = useState<QueryInputs>({ 
    date: '', 
    month: '', 
    domain: '', 
    location: '', 
    limit: '1000' 
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<AppState>({ 
    postgres: null, 
    mariadb: null 
  });
  const [error, setError] = useState<string>('');
  const [showingDb, setShowingDb] = useState<DatabaseType>('postgres');

  const handleInputChange = (key: keyof QueryInputs, value: string): void => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const toggleDb = (): void => {
    setShowingDb(prev => prev === 'postgres' ? 'mariadb' : 'postgres');
  };

  const runQuery = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      // Validate inputs
      if (inputs.month && 
          (isNaN(Number(inputs.month)) || 
           Number(inputs.month) < MONTH_VALIDATION.MIN || 
           Number(inputs.month) > MONTH_VALIDATION.MAX)) {
        throw new Error(ERROR_MESSAGES.INVALID_MONTH);
      }
      
      if (inputs.limit && 
          (isNaN(Number(inputs.limit)) || 
           Number(inputs.limit) < LIMIT_VALIDATION.MIN)) {
        throw new Error(ERROR_MESSAGES.INVALID_LIMIT);
      }

      const data = await fetchAllData(inputs);
      setResults(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ECONNREFUSED') {
          setError(ERROR_MESSAGES.CONNECTION_ERROR);
        } else {
          setError(`API Error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(ERROR_MESSAGES.UNKNOWN_ERROR);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    inputs,
    loading,
    results,
    error,
    showingDb,
    handleInputChange,
    toggleDb,
    runQuery,
  };
}; 