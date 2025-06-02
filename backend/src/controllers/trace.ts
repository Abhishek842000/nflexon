import { Request, Response } from 'express';
import { pool } from '../aws/db';

export const getFullTrace = async (req: Request, res: Response) => {
  try {
    const { mac } = req.params;

    const ioConn = await pool.query('SELECT * FROM nflexon_app.io_connectivity WHERE io_mac = $1', [mac]);
    const ppConn = await pool.query('SELECT * FROM nflexon_app.pp_connectivity WHERE io_mac = $1', [mac]);

    res.json({ ioConnectivity: ioConn.rows, ppConnectivity: ppConn.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trace connectivity' });
  }};