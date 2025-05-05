import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import databaseRoutes from './routes/databaseRoutes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app: Express = express();
const port: number = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/', databaseRoutes);

// Error handling
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 