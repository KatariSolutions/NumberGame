// db.js
import sql from 'mssql';
import config from './config.js';

const dbConfig = {
  user: config.sql.user,
  password: config.sql.password,
  server: config.sql.server,
  database: config.sql.database,
  port: parseInt(config.port, 10),
  options: {
    encrypt: false,              // true if using Azure
    trustServerCertificate: true // required for local dev
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