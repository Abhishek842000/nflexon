import { Request, Response } from 'express';
import { pool } from '../aws/db';

export const getSwitchConnections = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM nflexon_app.switch');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get switch connections' });
  }
};