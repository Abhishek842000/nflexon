import axios, { AxiosError } from 'axios';
import { QueryInputs, QueryResult } from '../types';
import { API_URL, ERROR_MESSAGES } from '../constants/config';

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const fetchPostgresData = async (params: QueryInputs): Promise<QueryResult> => {
  try {
    const response = await axios.get<QueryResult>(`${API_URL}/postgres-fetch`, { params });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    throw new ApiError(
      err.message,
      err.code,
      err.response?.status
    );
  }
};

export const fetchMariaDBData = async (params: QueryInputs): Promise<QueryResult> => {
  try {
    const response = await axios.get<QueryResult>(`${API_URL}/mariadb-fetch`, { params });
    return response.data;
  } catch (error) {
    const err = error as AxiosError;
    throw new ApiError(
      err.message,
      err.code,
      err.response?.status
    );
  }
};

export const fetchAllData = async (params: QueryInputs): Promise<{
  postgres: QueryResult;
  mariadb: QueryResult;
}> => {
  try {
    const [postgresData, mariadbData] = await Promise.all([
      fetchPostgresData(params),
      fetchMariaDBData(params)
    ]);
    return { postgres: postgresData, mariadb: mariadbData };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'ECONNREFUSED') {
      throw new ApiError(ERROR_MESSAGES.CONNECTION_ERROR, error.code);
    }
    throw error;
  }
}; 