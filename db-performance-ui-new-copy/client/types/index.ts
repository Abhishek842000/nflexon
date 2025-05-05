export interface QueryInputs {
  date: string;
  month: string;
  domain: string;
  location: string;
  limit: string;
}

export interface QueryResult {
  timeTakenMs: number;
  rowCount: number;
  data: any[]; // TODO: Replace with proper type based on your data structure
}

export interface AppState {
  postgres: QueryResult | null;
  mariadb: QueryResult | null;
}

export interface ApiError extends Error {
  code?: string;
  response?: {
    data?: any;
    status?: number;
  };
}

export type DatabaseType = 'postgres' | 'mariadb';

export interface ChartDataPoint {
  db: string;
  time: number;
} 