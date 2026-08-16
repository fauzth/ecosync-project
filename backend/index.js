const express = require('express');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server EcoSync Berjalan!');
});

// Cek koneksi ke DB
app.get('/test-db', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ message: 'Koneksi DB Berhasil', users });
  } catch (error) {
    res.status(500).json({ error: 'Koneksi DB Gagal', details: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));