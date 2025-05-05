import express, { Router } from 'express';
import { postgresFetch, mariadbFetch } from '../controllers/databaseController';
import { validateQueryParams } from '../middleware/validateQueryParams';

const router: Router = express.Router();

// Root route
router.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Database routes with validation middleware
router.get('/postgres-fetch', validateQueryParams, postgresFetch);
router.get('/mariadb-fetch', validateQueryParams, mariadbFetch);

export default router; 