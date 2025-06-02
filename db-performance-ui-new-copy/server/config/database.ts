import { Pool } from 'pg';
import { createPool } from 'mysql2/promise';
import { DatabaseConfig } from '../types';

const postgresConfig: DatabaseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'performance_db'
};

const mariadbConfig: DatabaseConfig = {
  host: process.env.MARIADB_HOST || 'localhost',
  port: parseInt(process.env.MARIADB_PORT || '3306'),
  user: process.env.MARIADB_USER || 'root',
  password: process.env.MARIADB_PASSWORD || 'root',
  database: process.env.MARIADB_DB || 'performance_db'
};

export const pgPool = new Pool(postgresConfig);
export const mariaPool = createPool(mariadbConfig);

// Handle pool errors
pgPool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

mariaPool.on('error', (err) => {
  console.error('Unexpected error on idle MariaDB client', err);
  process.exit(-1);
}); 