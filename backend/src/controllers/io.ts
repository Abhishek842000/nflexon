import type { Request, Response } from 'express';
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

export const saveIoLocation = async (req: Request, res: Response) => {
  try {
    const {
      io_type,
      io_mac,
      site,
      building,
      floor,
      room,
      additional_description
    } = req.body;

    // Validate QR code data
    if (!io_type || !io_mac) {
      return res.status(400).json({ error: 'Invalid QR code data. Please scan the QR code again.' });
    }

    // Validate user input location fields
    if (!site || !building || !floor || !room) {
      return res.status(400).json({ error: 'Missing required location fields' });
    }

    const query = `
      INSERT INTO nflexon_app.io_location 
      (io_type, io_mac, site, building, floor, room, additional_description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      io_type,
      io_mac,
      site,
      building,
      floor,
      room,
      additional_description || null
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error in saveIoLocation:', err);
    if (err instanceof Error) {
      res.status(500).json({
        error: 'Failed to save IO location',
        message: err.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to save IO location',
        message: 'Unknown error occurred'
      });
    }
  }
};

export const getAllIoLocations = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM nflexon_app.io_location');
    res.json(result.rows);
  } catch (err) {
    console.error('Error in getAllIoLocations:', err);
    res.status(500).json({ error: 'Failed to get all IO locations' });
  }
};

export const getAllPpLocations = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM nflexon_app.pp_location');
    res.json(result.rows);
  } catch (err) {
    console.error('Error in getAllPpLocations:', err);
    res.status(500).json({ error: 'Failed to get all PP locations' });
  }
};
