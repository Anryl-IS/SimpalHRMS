const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',          // your DB username
  host: 'localhost',
  database: 'postgres', // your DB name
  password: '12345678', // your DB password
  port: 5432,                // default PostgreSQL port
});

// Test DB route
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // simple query
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// Catch-all for unmatched routes
app.use((req, res) => res.status(404).send('Route not found'));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
