import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, pool } from './config/database.ts';
import proyekRoutes from './routes/proyek.ts';
import inventarisRoutes from './routes/inventaris.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health & Status Check
app.get('/api/health', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ status: 'connecting', message: 'Menghubungkan ke MariaDB...' });
    }
    const [rows]: any = await pool.query('SELECT 1 as val');
    res.json({
      status: 'connected',
      database: process.env.DB_NAME || 'denah_app',
      message: 'MariaDB XAMPP Terhubung',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Koneksi ke MariaDB gagal. Pastikan MySQL di XAMPP Control Panel sudah di-Start!',
      error: error.message,
    });
  }
});

// Routes
app.use('/api/proyek', proyekRoutes);
app.use('/api/inventaris', inventarisRoutes);

// Jalankan Server & Inisialisasi Database
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`[Server] Backend API berjalan di http://localhost:${PORT}`);
      console.log(`[Server] Siap melayani permintaan denah & mapping IT.`);
    });
  } catch (error: any) {
    console.error('[Server Error] Gagal memulai koneksi MariaDB:', error.message);
    // Tetap dengarkan port agar frontend bisa menerima pesan status MariaDB belum nyala
    app.listen(PORT, () => {
      console.warn(`[Server Warning] Backend aktif di http://localhost:${PORT} namun MariaDB belum terhubung.`);
    });
  }
}

startServer();
