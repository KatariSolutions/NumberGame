// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./middleware/logger');
const { sql, poolConnect } = require('./db');
const config = require('./config')

const app = express();
app.use(express.json());

//Middleware
app.set('trust proxy', true);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.json());
app.use(cors());
app.use(logger);

// Sample Initial Route
app.use('/', (req, res) => { 
    res.send("Welcome to new project");
});

// Simple route to test SQL Server connection
app.get('/test-db', async (req, res) => {
  try {
    await poolConnect; // Wait for connection
    const request = new sql.Request();
    const result = await request.query('SELECT * FROM users');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

let port = config.port || 8080;
app.listen(port,'127.0.0.1', ()=>{
    console.log(`App listening at http://localhost:${port}`);
});
