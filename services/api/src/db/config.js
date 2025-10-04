const { Pool } = require('pg');

// Database configuration optimized for Cloud Run
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flow_dev',
  user: process.env.DB_USER || 'flow_user',
  password: process.env.DB_PASSWORD || 'flow_password1',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Cloud Run optimized connection pooling
  max: process.env.NODE_ENV === 'production' ? 10 : 20, // Reduced for Cloud Run
  min: 2, // Minimum connections
  idleTimeoutMillis: 10000, // Reduced for Cloud Run (10 seconds)
  connectionTimeoutMillis: 5000, // Increased timeout for Cloud SQL
  acquireTimeoutMillis: 10000, // Time to acquire connection from pool
  createTimeoutMillis: 10000, // Time to create new connection
  
  // Cloud Run specific optimizations
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // Statement timeout for long-running queries
  statement_timeout: 30000, // 30 seconds
  query_timeout: 30000, // 30 seconds
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors with graceful degradation
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit process in production, let Cloud Run handle restarts
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

// Handle pool connect events
pool.on('connect', (client) => {
  console.log('New database client connected');
});

pool.on('acquire', (client) => {
  console.log('Database client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('Database client removed from pool');
});

// Test database connection with retry logic
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
};

// Graceful shutdown with timeout
const closePool = async () => {
  try {
    console.log('Closing database pool...');
    await Promise.race([
      pool.end(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pool close timeout')), 10000)
      )
    ]);
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

// Query helper with enhanced error handling and logging
const query = async (text, params = []) => {
  const start = Date.now();
  let client;
  
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100));
    }
    
    console.log('Executed query', { 
      text: text.substring(0, 100), 
      duration, 
      rows: result.rowCount,
      params: params.length 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Database query error:', {
      error: error.message,
      query: text.substring(0, 100),
      duration,
      params: params.length
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Transaction helper with enhanced error handling
const transaction = async callback => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Health check for database
const healthCheck = async () => {
  try {
    const result = await query('SELECT 1 as health_check');
    return {
      status: 'healthy',
      connected: true,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount
    };
  }
};

// Get pool statistics
const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    config: {
      max: dbConfig.max,
      min: dbConfig.min,
      idleTimeoutMillis: dbConfig.idleTimeoutMillis
    }
  };
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool,
  healthCheck,
  getPoolStats,
};
