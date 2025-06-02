import { Request, Response } from 'express';
import { pool } from '../aws/db';

export const getPpLocation = async (req: Request, res: Response) => {
  try {
    const { serial } = req.params;
    const result = await pool.query('SELECT * FROM nflexon_app.pp_location WHERE pp_serial_no = $1', [serial]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get PP location' });
  }
};

export const getPpConnectivity = async (req: Request, res: Response) => {
  try {
    const { serial } = req.params;
    const result = await pool.query('SELECT * FROM nflexon_app.pp_connectivity WHERE pp_serial_no = $1', [serial]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get PP connectivity' });
  }
};