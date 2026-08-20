const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Tambahkan middleware CORS agar diizinkan diakses oleh Next.js
app.use(cors({
  origin: 'http://localhost:3001', // Sesuaikan dengan port frontend Next.js kamu
  credentials: true
}));

app.use(express.json());

// Endpoint Register Warga/User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru ke database MySQL
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'warga' // default role
      }
    });

    res.status(201).json({
      message: 'Registrasi berhasil!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server', details: error.message });
  }
});

// Endpoint Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan!' });
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Password salah!' });
    }

    res.json({
      message: 'Login berhasil!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server', details: error.message });
  }
});

// Endpoint Tambah Transaksi Setoran Sampah (Oleh Admin)
app.post('/api/transactions', async (req, res) => {
  try {
    const { userId, wasteType, weightKg } = req.body;

    // Validasi sederhana
    if (!userId || !wasteType || !weightKg) {
      return res.status(400).json({ error: 'Semua field (userId, wasteType, weightKg) wajib diisi!' });
    }

    // Kalkulasi poin otomatis berdasarkan jenis sampah dan berat (kg)
    // Contoh aturan poin per kg:
    // - Plastik: 100 poin / kg
    // - Kertas: 50 poin / kg
    // - Logam: 200 poin / kg
    let pointsPerKg = 50;
    const lowerCaseType = wasteType.toLowerCase();

    if (lowerCaseType.includes('plastik')) {
      pointsPerKg = 100;
    } else if (lowerCaseType.includes('logam')) {
      pointsPerKg = 200;
    } else if (lowerCaseType.includes('kertas')) {
      pointsPerKg = 50;
    }

    const calculatedPoints = Math.round(weightKg * pointsPerKg);

    // Simpan transaksi ke database MySQL menggunakan Prisma
    const newTransaction = await prisma.transaction.create({
      data: {
        userId: parseInt(userId),
        wasteType,
        weightKg: parseFloat(weightKg),
        pointsEarned: calculatedPoints
      }
    });

    res.status(201).json({
      message: 'Transaksi setoran sampah berhasil dicatat!',
      transaction: newTransaction
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mencatat transaksi', details: error.message });
  }
});

// Endpoint untuk Dashboard Ringkasan Warga (Profil & Statistik)
app.get('/api/users/:id/dashboard', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan!' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const totalPoints = transactions.reduce((sum, tx) => sum + (tx.pointsEarned || 0), 0);
    const totalWeightKg = transactions.reduce((sum, tx) => sum + parseFloat(tx.weightKg || 0), 0);
    const totalTransactions = transactions.length;

    res.json({
      user,
      stats: {
        totalPoints,
        totalWeightKg: Math.round(totalWeightKg * 100) / 100,
        totalTransactions
      },
      recentTransactions: transactions.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data dashboard warga', details: error.message });
  }
});

// Endpoint untuk Riwayat Seluruh Transaksi Setoran Sampah Warga
app.get('/api/transactions/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil riwayat transaksi', details: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));