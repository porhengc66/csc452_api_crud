const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Reuse a single pool across invocations (serverless-friendly)
let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool(process.env.DATABASE_URL);
  }
  return pool;
}

app.get('/', (req, res) => {
  res.send('Hello world!!');
});

app.get('/healthz/db', async (req, res) => {
  try {
    const [rows] = await getPool().query('SELECT 1 AS ok');
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const [rows] = await getPool().query('SELECT * FROM users');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await getPool().execute(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { fname, lname, username, password, avatar } = req.body;
    const [result] = await getPool().execute(
      'INSERT INTO `users` (`fname`, `lname`, `username`, `password`, `avatar`) VALUES (?, ?, ?, ?, ?)',
      [fname, lname, username, password, avatar]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/users', async (req, res) => {
  try {
    const { id, fname, lname, username, password, avatar } = req.body;
    const [result] = await getPool().execute(
      'UPDATE `users` SET `fname`=?, `lname`=?, `username`=?, `password`=?, `avatar`=? WHERE id = ?',
      [fname, lname, username, password, avatar, id]
    );
    res.json({ affectedRows: result.affectedRows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/users', async (req, res) => {
  try {
    const { id } = req.body;
    const [result] = await getPool().execute(
      'DELETE FROM `users` WHERE id = ?',
      [id]
    );
    res.json({ affectedRows: result.affectedRows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export handler for Vercel
module.exports = (req, res) => app(req, res);
