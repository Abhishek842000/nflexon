import { Request, Response } from 'express';
import { pgPool, mariaPool } from '../config/database';
import { buildPostgresQuery, buildMariaDBQuery } from '../utils/queryBuilders';
import { QueryResult } from '../types';
import { queryLogger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export const postgresFetch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, values } = buildPostgresQuery(req.query);
    queryLogger(query, values);

    const start = Date.now();
    const result = await pgPool.query(query, values);
    const end = Date.now();

    const response: QueryResult = {
      timeTakenMs: end - start,
      rowCount: result.rows.length,
      data: result.rows
    };

    res.json(response);
  } catch (error) {
    throw new AppError(500, 'PostgreSQL query failed', {
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const mariadbFetch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, values } = buildMariaDBQuery(req.query);
    queryLogger(query, values);

    const start = Date.now();
    const [rows] = await mariaPool.query(query, values);
    const end = Date.now();

    const response: QueryResult = {
      timeTakenMs: end - start,
      rowCount: Array.isArray(rows) ? rows.length : 0,
      data: Array.isArray(rows) ? rows : []
    };

    res.json(response);
  } catch (error) {
    throw new AppError(500, 'MariaDB query failed', {
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 