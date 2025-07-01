import type { Request, Response } from 'express';
import { pool } from '../aws/db';
import { generateRandomConnections, PPInfo, IOInfo, PPPort, IOPort } from '../utils/autoConnectivity';
import { populateConnectivityMap } from '../utils/connectivityMapGenerator';

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

export const savePpLocation = async (req: Request, res: Response) => {
  try {
    const {
      pp_serial_no,
      pp_mac,
      site,
      building,
      floor,
      room,
      rack
    } = req.body;

    // Validate QR code data
    if (!pp_serial_no || !pp_mac) {
      return res.status(400).json({ error: 'Invalid QR code data. Please scan the QR code again.' });
    }

    // Validate user input location fields
    if (!site || !building || !floor || !room || !rack) {
      return res.status(400).json({ error: 'Missing required location fields' });
    }

    const query = `
      INSERT INTO nflexon_app.pp_location 
      (pp_serial_no, pp_mac, site, building, floor, room, rack)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      pp_serial_no,
      pp_mac,
      site,
      building,
      floor,
      room,
      rack
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error in savePpLocation:', err);
    if (err instanceof Error) {
      res.status(500).json({
        error: 'Failed to save PP location',
        message: err.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to save PP location',
        message: 'Unknown error occurred'
      });
    }
  }
};

export const autoConnectPPs = async (req: Request, res: Response) => {
  try {
    const { pps, ios } = req.body; // pps: [{pp_serial_no}], ios: [{io_type, io_mac}]
    console.log('Received request:', { pps, ios });
    
    if (!Array.isArray(pps) || !Array.isArray(ios) || pps.length === 0 || ios.length === 0) {
      return res.status(400).json({ error: 'Missing PPs or IOs in request body' });
    }

    // Fetch all existing PP and IO port combinations from pp_connectivity
    const existingRes = await pool.query('SELECT pp_serial_no, ru, pp_port, io_mac, io_port FROM nflexon_app.pp_connectivity');
    console.log('Existing connections:', existingRes.rows);
    
    const usedPP = new Set(existingRes.rows.map((row: any) => `${row.pp_serial_no}-${row.ru}-${row.pp_port}`));
    const usedIO = new Set(existingRes.rows.map((row: any) => `${row.io_mac}-${row.io_port}`));
    console.log('Used PP ports:', Array.from(usedPP));
    console.log('Used IO ports:', Array.from(usedIO));

    // Generate all possible PP and IO ports for this session
    const { generatePPPorts, generateIOPorts, shuffle } = await import('../utils/autoConnectivity');
    let allPPPorts: PPPort[] = generatePPPorts(pps as PPInfo[]);
    let allIOPorts: IOPort[] = generateIOPorts(ios as IOInfo[]);
    console.log('Generated PP ports:', allPPPorts);
    console.log('Generated IO ports:', allIOPorts);

    // Filter out used ports
    allPPPorts = allPPPorts.filter(pp => !usedPP.has(`${pp.pp_serial_no}-${pp.ru}-${pp.pp_port}`));
    allIOPorts = allIOPorts.filter(io => !usedIO.has(`${io.io_mac}-${io.io_port}`));
    console.log('Available PP ports after filtering:', allPPPorts);
    console.log('Available IO ports after filtering:', allIOPorts);

    // But only use the filtered ports for pairing
    const shuffledPP = shuffle(allPPPorts);
    const shuffledIO = shuffle(allIOPorts);
    const totalConnections = Math.min(shuffledIO.length, shuffledPP.length);
    console.log('Total possible connections:', totalConnections);
    
    const finalConnections = [];
    const usedPPNow = new Set();
    const usedIONow = new Set();
    
    for (let i = 0; i < totalConnections; i++) {
      let pp = shuffledPP[i];
      let io = shuffledIO[i];
      if (usedPPNow.has(`${pp.pp_serial_no}-${pp.ru}-${pp.pp_port}`) || usedIONow.has(`${io.io_mac}-${io.io_port}`)) continue;
      usedPPNow.add(`${pp.pp_serial_no}-${pp.ru}-${pp.pp_port}`);
      usedIONow.add(`${io.io_mac}-${io.io_port}`);
      // Only include the fields that match the table structure
      finalConnections.push({
        pp_serial_no: pp.pp_serial_no,
        ru: pp.ru,
        pp_port: pp.pp_port,
        io_mac: io.io_mac,
        io_port: io.io_port
      });
    }
    console.log('Final connections to be inserted:', finalConnections);

    // Insert into pp_connectivity
    const insertQuery = `
      INSERT INTO nflexon_app.pp_connectivity
      (pp_serial_no, ru, pp_port, io_mac, io_port)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const inserted = [];
    for (const conn of finalConnections) {
      const values = [conn.pp_serial_no, conn.ru, conn.pp_port, conn.io_mac, conn.io_port];
      console.log('Inserting connection with values:', values);
      const result = await pool.query(insertQuery, values);
      inserted.push(result.rows[0]);
    }
    console.log('Successfully inserted connections:', inserted);

    // Immediately trigger connectivity_map population
    await populateConnectivityMap(finalConnections);

    res.status(201).json({ connections: inserted });
  } catch (err) {
    console.error('Error in autoConnectPPs:', err);
    res.status(500).json({ error: 'Failed to auto-connect PPs and IOs' });
  }
};

export const getPpConnectivityByIoMac = async (req: Request, res: Response) => {
  const {io_mac} = req.params;
  console.log('getPpConnectivityByIoMac called with io_mac:', io_mac);
  if (!io_mac) {
    console.log('No io_mac provided');
    return res.status(400).json({ error: 'Missing io_mac query parameter' });
  }
  try {
    const result = await pool.query('SELECT * FROM nflexon_app.pp_connectivity WHERE io_mac = $1', [io_mac]);
    console.log('Query result:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Failed to get PP connectivity by io_mac' });
  }
};