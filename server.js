const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const mysql = require('mysql2/promise');

const app = express();

// Configure CORS to allow all origins during development
app.use(cors());

const port = 3002;

// Add a root route handler
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// PostgreSQL Connection
const pgPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'abd123ABD@',
  port: 5432,
});

// MariaDB Connection
const mariaPool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  database: 'test',
  password: 'abd123ABD@',
  port: 3307,
});

// Helper to build Postgres query dynamically
function buildPostgresQuery(params) {
  let { date, month, domain, location, limit } = params;
  let query = 'SELECT * FROM transaction_partition';
  let conditions = [];
  let values = [];

  if (date) {
    values.push(date);
    conditions.push(`date = $${values.length}::date`);
  }

  if (month) {
    values.push(parseInt(month));
    conditions.push(`EXTRACT(MONTH FROM date) = $${values.length}`);
  }

  if (domain) {
    values.push(`%${domain}%`);
    conditions.push(`domain LIKE $${values.length}`);
  }

  if (location) {
    values.push(`%${location}%`);
    conditions.push(`location LIKE $${values.length}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  values.push(Math.min(parseInt(limit) || 1000, 1000000));
  query += ` LIMIT $${values.length}`;

  return { query, values };
}

// Helper to build MariaDB query dynamically
function buildMariaDBQuery(params) {
  let { date, month, domain, location, limit } = params;
  let query = 'SELECT * FROM bank';
  let conditions = [];
  let values = [];

  console.log('Building MariaDB query with params:', JSON.stringify(params, null, 2));

  try {
    if (date) {
      conditions.push(`date = ?`);
      values.push(date);
    }
    if (month) {
      // Use EXTRACT for MariaDB to be consistent with PostgreSQL
      conditions.push(`EXTRACT(MONTH FROM date) = ?`);
      const monthNum = parseInt(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new Error('Month must be a number between 1 and 12');
      }
      values.push(monthNum);
    }
    if (domain) {
      conditions.push(`domain LIKE ?`);
      values.push(`%${domain.toString()}%`);
    }
    if (location) {
      conditions.push(`location LIKE ?`);
      values.push(`%${location}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Ensure limit is a number with higher cap
    const numericLimit = Math.min(parseInt(limit) || 1000, 1000000);
    query += ` LIMIT ?`;
    values.push(numericLimit);

    console.log('Built MariaDB query:', {
      query,
      values,
      valueTypes: values.map(v => `${typeof v}: ${v}`),
      conditions
    });

    return { query, values };
  } catch (err) {
    console.error('Error building MariaDB query:', err);
    throw new Error(`Failed to build query: ${err.message}`);
  }
}

// Helper function to validate date format (YYYY-MM-DD)
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// API for Postgres
app.get('/postgres-fetch', async (req, res) => {
  console.log('\n=== PostgreSQL Request ===');
  console.log('Request query params:', JSON.stringify(req.query, null, 2));
  
  try {
    // Validate date format if provided
    if (req.query.date && !isValidDate(req.query.date)) {
      console.error('Invalid date format:', req.query.date);
      return res.status(400).json({ 
        error: 'Invalid date format', 
        details: 'Date must be in YYYY-MM-DD format'
      });
    }

    const { query, values } = buildPostgresQuery(req.query);

    console.log('Built query:', {
      query: query,
      values: values,
      valueTypes: values.map(v => `${typeof v}: ${v}`)
    });

    const start = Date.now();
    let result;
    try {
      result = await pgPool.query(query, values);
      console.log('\nQuery executed successfully');
      console.log('First 2 rows of results:', JSON.stringify(result.rows.slice(0, 2), null, 2));
      
      if (result.rows.length === 0) {
        console.log('WARNING: Query returned no results');
      }
    } catch (queryErr) {
      console.error('\nQuery execution error:', {
        error: queryErr.message,
        code: queryErr.code,
        position: queryErr.position,
        stack: queryErr.stack
      });
      throw queryErr;
    }

    const end = Date.now();
    console.log(`\nQuery stats:`);
    console.log(`- Time taken: ${end - start}ms`);
    console.log(`- Rows returned: ${result.rows.length}`);
    console.log(`- Column names: ${Object.keys(result.rows[0] || {}).join(', ')}`);

    res.json({
      timeTakenMs: end - start,
      rowCount: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('\nPostgreSQL request failed:', {
      message: err.message,
      code: err.code,
      position: err.position,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Error fetching from PostgreSQL', 
      details: err.message,
      code: err.code
    });
  }
});


// API for MariaDB
app.get('/mariadb-fetch', async (req, res) => {
  console.log('\n=== MariaDB Request ===');
  console.log('Request query params:', JSON.stringify(req.query, null, 2));
  
  try {
    // Validate date format if provided
    if (req.query.date && !isValidDate(req.query.date)) {
      console.error('Invalid date format:', req.query.date);
      return res.status(400).json({ 
        error: 'Invalid date format', 
        details: 'Date must be in YYYY-MM-DD format'
      });
    }

    // Validate month if provided
    if (req.query.month) {
      const monthNum = parseInt(req.query.month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          error: 'Invalid month',
          details: 'Month must be a number between 1 and 12'
        });
      }
    }

    const { query, values } = buildMariaDBQuery(req.query);
    
    console.log('Executing MariaDB query:', {
      query: query,
      values: values,
      valueTypes: values.map(v => `${typeof v}: ${v}`)
    });

    const start = Date.now();
    
    try {
      // Execute query and handle potential errors
      const [rows] = await mariaPool.query(query, values);
      console.log('\nQuery executed successfully');
      
      if (rows.length === 0) {
        console.log('WARNING: Query returned no results');
      } else {
        console.log('First 2 rows of results:', JSON.stringify(rows.slice(0, 2), null, 2));
      }

      const end = Date.now();
      console.log(`\nQuery stats:`);
      console.log(`- Time taken: ${end - start}ms`);
      console.log(`- Rows returned: ${rows.length}`);
      if (rows.length > 0) {
        console.log(`- Column names: ${Object.keys(rows[0]).join(', ')}`);
      }

      res.json({
        timeTakenMs: end - start,
        rowCount: rows.length,
        data: rows,
      });
    } catch (queryErr) {
      console.error('\nQuery execution error:', {
        message: queryErr.message,
        code: queryErr.code,
        errno: queryErr.errno,
        sql: queryErr.sql,
        sqlState: queryErr.sqlState,
        stack: queryErr.stack
      });
      
      return res.status(500).json({ 
        error: 'Database query failed',
        details: queryErr.message,
        sqlMessage: queryErr.sqlMessage,
        code: queryErr.code,
        query: query,
        params: values
      });
    }
  } catch (err) {
    console.error('\nMariaDB request failed:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    res.status(500).json({ 
      error: 'Error processing MariaDB request',
      details: err.message,
      code: err.code
    });
  }
});

// Add test endpoint for MariaDB table check
app.get('/check-mariadb-table', async (req, res) => {
  try {
    // Check if the bank table exists and its structure
    const [tables] = await mariaPool.query('SHOW TABLES LIKE "bank"');
    if (tables.length === 0) {
      res.status(404).json({ error: 'Table "bank" does not exist' });
      return;
    }

    // Get table structure
    const [columns] = await mariaPool.query('DESCRIBE bank');
    
    // Get sample row
    const [sample] = await mariaPool.query('SELECT * FROM bank LIMIT 1');

    res.json({
      tableExists: true,
      columns: columns,
      sampleRow: sample[0] || null
    });
  } catch (err) {
    console.error('Error checking MariaDB table:', err);
    res.status(500).json({ 
      error: 'Failed to check table structure',
      details: err.message
    });
  }
});

// Add diagnostic endpoint
app.get('/check-databases', async (req, res) => {
  const results = {
    postgres: { status: 'unknown' },
    mariadb: { status: 'unknown' }
  };

  // Check PostgreSQL
  try {
    // Check if table exists
    const tableCheck = await pgPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transaction_partition'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      // Get table structure
      const columns = await pgPool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'transaction_partition';
      `);
      
      // Get row count
      const countResult = await pgPool.query('SELECT COUNT(*) FROM transaction_partition');
      
      results.postgres = {
        status: 'connected',
        tableExists: true,
        columns: columns.rows,
        rowCount: parseInt(countResult.rows[0].count)
      };
    } else {
      results.postgres = {
        status: 'connected',
        tableExists: false,
        error: 'Table transaction_partition does not exist'
      };
    }
  } catch (err) {
    results.postgres = {
      status: 'error',
      error: err.message
    };
  }

  // Check MariaDB
  try {
    // Check if table exists
    const [tables] = await mariaPool.query('SHOW TABLES LIKE "bank"');
    
    if (tables.length > 0) {
      // Get table structure
      const [columns] = await mariaPool.query('DESCRIBE bank');
      
      // Get row count
      const [countResult] = await mariaPool.query('SELECT COUNT(*) as count FROM bank');
      
      results.mariadb = {
        status: 'connected',
        tableExists: true,
        columns: columns,
        rowCount: countResult[0].count
      };
    } else {
      results.mariadb = {
        status: 'connected',
        tableExists: false,
        error: 'Table bank does not exist'
      };
    }
  } catch (err) {
    results.mariadb = {
      status: 'error',
      error: err.message
    };
  }

  res.json(results);
});

// Basic test endpoint
app.get('/test', async (req, res) => {
  console.log('Test endpoint called');
  const status = {
    server: 'running',
    postgres: { status: 'unknown' },
    mariadb: { status: 'unknown' }
  };

  // Test PostgreSQL
  try {
    await pgPool.query('SELECT 1');
    status.postgres = {
      status: 'connected',
      config: {
        host: pgPool.options.host,
        port: pgPool.options.port,
        database: pgPool.options.database
      }
    };

    // Check if table exists
    const tableCheck = await pgPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transaction_partition'
      );
    `);
    status.postgres.tableExists = tableCheck.rows[0].exists;
  } catch (err) {
    status.postgres = {
      status: 'error',
      error: err.message,
      config: {
        host: pgPool.options.host,
        port: pgPool.options.port,
        database: pgPool.options.database
      }
    };
  }

  // Test MariaDB
  try {
    await mariaPool.query('SELECT 1');
    status.mariadb = {
      status: 'connected',
      config: {
        host: mariaPool.config.host,
        port: mariaPool.config.port,
        database: mariaPool.config.database
      }
    };

    // Check if table exists
    const [tables] = await mariaPool.query('SHOW TABLES LIKE "bank"');
    status.mariadb.tableExists = tables.length > 0;
  } catch (err) {
    status.mariadb = {
      status: 'error',
      error: err.message,
      config: {
        host: mariaPool.config.host,
        port: mariaPool.config.port,
        database: mariaPool.config.database
      }
    };
  }

  console.log('Server status:', status);
  res.json(status);
});

// Add table info endpoint
app.get('/table-info', async (req, res) => {
  console.log('\n=== Table Info Request ===');
  const info = {
    postgres: {},
    mariadb: {}
  };

  try {
    // Check PostgreSQL
    console.log('Checking PostgreSQL...');
    const pgTableCount = await pgPool.query('SELECT COUNT(*) FROM transaction_partition');
    const pgColumns = await pgPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transaction_partition'
      ORDER BY ordinal_position;
    `);
    info.postgres = {
      status: 'connected',
      rowCount: parseInt(pgTableCount.rows[0].count),
      columns: pgColumns.rows
    };
    console.log('PostgreSQL check complete');
  } catch (err) {
    console.error('PostgreSQL check error:', err);
    info.postgres = {
      status: 'error',
      error: err.message
    };
  }

  try {
    // Check MariaDB
    console.log('Checking MariaDB...');
    const [mariaTableCount] = await mariaPool.query('SELECT COUNT(*) as count FROM bank');
    const [mariaColumns] = await mariaPool.query('DESCRIBE bank');
    info.mariadb = {
      status: 'connected',
      rowCount: mariaTableCount[0].count,
      columns: mariaColumns
    };
    console.log('MariaDB check complete');
  } catch (err) {
    console.error('MariaDB check error:', err);
    info.mariadb = {
      status: 'error',
      error: err.message
    };
  }

  console.log('Sending response:', JSON.stringify(info, null, 2));
  res.json(info);
});

// Wrap server startup in error handling
const startServer = async () => {
  try {
    // Test database connections first
    console.log('Testing PostgreSQL connection...');
    await pgPool.query('SELECT 1');
    console.log('PostgreSQL connection successful');

    console.log('Testing MariaDB connection...');
    await mariaPool.query('SELECT 1');
    console.log('MariaDB connection successful');

    // Start the server
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log('Server is also accessible from other devices on the network');
    });
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

// Start the server
startServer();
