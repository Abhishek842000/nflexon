import { QueryParams, QueryBuilderResult } from '../types';

// Helper to build Postgres query dynamically
export function buildPostgresQuery(params: QueryParams): QueryBuilderResult {
  const { date, month, domain, location, limit } = params;
  let query = 'SELECT * FROM transaction_partition';
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  if (date) {
    values.push(date);
    conditions.push(`date = $${values.length}::date`);
  }

  if (month) {
    values.push(parseInt(month));
    conditions.push(`EXTRACT(MONTH FROM date) = $${values.length}`);
  }

  if (domain) {
    values.push(`%${domain}%`);
    conditions.push(`domain LIKE $${values.length}`);
  }

  if (location) {
    values.push(`%${location}%`);
    conditions.push(`location LIKE $${values.length}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  values.push(Math.min(parseInt(limit || '1000'), 1000000));
  query += ` LIMIT $${values.length}`;

  return { query, values };
}

// Helper to build MariaDB query dynamically
export function buildMariaDBQuery(params: QueryParams): QueryBuilderResult {
  const { date, month, domain, location, limit } = params;
  let query = 'SELECT * FROM bank';
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  try {
    if (date) {
      conditions.push(`date = ?`);
      values.push(date);
    }
    if (month) {
      conditions.push(`MONTH(date) = ?`);
      const monthNum = parseInt(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new Error('Month must be a number between 1 and 12');
      }
      values.push(monthNum);
    }
    if (domain) {
      conditions.push(`domain LIKE ?`);
      values.push(`%${domain.toString()}%`);
    }
    if (location) {
      conditions.push(`location LIKE ?`);
      values.push(`%${location}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const numericLimit = Math.min(parseInt(limit || '1000'), 1000000);
    query += ` LIMIT ?`;
    values.push(numericLimit);

    return { query, values };
  } catch (err) {
    console.error('Error building MariaDB query:', err);
    throw new Error(`Failed to build query: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Helper function to validate date format (YYYY-MM-DD)
export function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
} 