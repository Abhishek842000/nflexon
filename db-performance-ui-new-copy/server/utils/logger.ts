import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};

export const queryLogger = (query: string, params: any[]): void => {
  console.log('\n=== Query Execution ===');
  console.log('Query:', query);
  console.log('Parameters:', params);
};

export const errorLogger = (error: Error): void => {
  console.error('\n=== Error ===');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
}; 