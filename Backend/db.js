// db.js
import sql from 'mssql';
import config from './config.js';

const dbConfig = {
  user: config.sql.user,
  password: config.sql.password,
  server: config.sql.server,
  database: config.sql.database,
  port: parseInt(config.sql.port, 10),
  options: {
    encrypt: true,              // true if using Azure
    trustServerCertificate: true // required for local dev
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

pool.on('error', (err) => {
  console.error('SQL Server connection pool error:', err);
});

export {
  sql,
  poolConnect,
  pool
};