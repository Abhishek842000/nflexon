import { Request, Response } from 'express';
import { pool } from '../aws/db';

export const getConnectivityMap = async (req: Request, res: Response) => {
  try {
    const { type, switch_name } = req.query;

    let query = `
      SELECT 
        pp_serial_no,
        ru,
        pp_port,
        io_mac,
        io_port,
        io_type,
        device,
        device_mac,
        switch_name,
        switch_port
      FROM nflexon_app.connectivity_map
      WHERE 1=1
    `;
    const params: any[] = [];

    // Handle switch_name query for fetching active ports
    if (switch_name) {
      query += ` AND switch_name = $1`;
      params.push(switch_name);
    } else if (type === 'PP') {
      const { pp_serial_no, ru, pp_port } = req.query;
      if (pp_serial_no && ru && pp_port) {
        query += ` AND pp_serial_no = $1 AND ru = $2 AND pp_port = $3`;
        params.push(pp_serial_no, ru, pp_port);
      } else if (pp_serial_no && ru) {
        query += ` AND pp_serial_no = $1 AND ru = $2`;
        params.push(pp_serial_no, ru);
      } else if (pp_serial_no) {
        query += ` AND pp_serial_no = $1`;
        params.push(pp_serial_no);
      }
    } else if (type === 'IO') {
      const { io_mac, io_port } = req.query;
      if (io_mac && io_port) {
        query += ` AND io_mac = $1 AND io_port = $2`;
        params.push(io_mac, io_port);
      } else if (io_mac) {
        query += ` AND io_mac = $1`;
        params.push(io_mac);
      }
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No connectivity information found'
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows
    });
    return;

  } catch (error) {
    console.error('Error fetching connectivity map:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
}; 