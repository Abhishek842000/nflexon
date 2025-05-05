export interface QueryParams {
  date?: string;
  month?: string;
  domain?: string;
  location?: string;
  limit?: string;
}

export interface QueryResult {
  timeTakenMs: number;
  rowCount: number;
  data: any[];
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface QueryBuilderResult {
  query: string;
  values: any[];
} 