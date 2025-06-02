import { Request, Response } from 'express';
import { pool } from '../aws/db';

export const getIoLocation = async (req: Request, res: Response) => {
  try {
    const { mac } = req.params;
    console.log('Received MAC:', mac);

    const query = 'SELECT * FROM nflexon_app.io_location WHERE io_mac = $1';
    console.log('Running query:', query, 'with MAC:', mac);

    const result = await pool.query(query, [mac]);
    console.log('Query result:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error in getIoLocation:', err);

    if (err instanceof Error) {
      res.status(500).json({
        error: 'Failed to get IO location',
        message: err.message,
        stack: err.stack,
      });
    } else {
      res.status(500).json({
        error: 'Failed to get IO location',
        message: 'Unknown error occurred',
      });
    }
  }
};

export const getIoConnectivity = async (req: Request, res: Response) => {
  try {
    const { mac } = req.params;
    console.log('Received MAC for connectivity:', mac);

    const query = 'SELECT * FROM nflexon_app.io_connectivity WHERE io_mac = $1';
    console.log('Running query:', query, 'with MAC:', mac);

    const result = await pool.query(query, [mac]);
    console.log('Query result:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error in getIoConnectivity:', err);

    if (err instanceof Error) {
      res.status(500).json({
        error: 'Failed to get IO connectivity',
        message: err.message,
        stack: err.stack,
      });
    } else {
      res.status(500).json({
        error: 'Failed to get IO connectivity',
        message: 'Unknown error occurred',
      });
    }
  }
};
