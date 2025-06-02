export const API_URL = 'http://192.168.22.28:3002';

export const DEFAULT_LIMIT = '1000';

export const MONTH_VALIDATION = {
  MIN: 1,
  MAX: 12
};

export const LIMIT_VALIDATION = {
  MIN: 1
};

export const ERROR_MESSAGES = {
  INVALID_MONTH: 'Month must be a number between 1 and 12',
  INVALID_LIMIT: 'Limit must be a positive number',
  CONNECTION_ERROR: 'Cannot connect to server. Please make sure the backend server is running.',
  UNKNOWN_ERROR: 'An unknown error occurred'
}; 