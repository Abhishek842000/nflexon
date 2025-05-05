import { Request, Response, NextFunction } from 'express';
import { QueryParams } from '../types';
import { AppError } from './errorHandler';

export const validateQueryParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const params: QueryParams = req.query as QueryParams;

  // Validate date format if provided
  if (params.date && !isValidDate(params.date)) {
    throw new AppError(400, 'Invalid date format', {
      details: 'Date must be in YYYY-MM-DD format'
    });
  }

  // Validate month if provided
  if (params.month) {
    const month = parseInt(params.month);
    if (isNaN(month) || month < 1 || month > 12) {
      throw new AppError(400, 'Invalid month', {
        details: 'Month must be a number between 1 and 12'
      });
    }
  }

  // Validate limit if provided
  if (params.limit) {
    const limit = parseInt(params.limit);
    if (isNaN(limit) || limit < 1) {
      throw new AppError(400, 'Invalid limit', {
        details: 'Limit must be a positive number'
      });
    }
  }

  next();
};

const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}; 