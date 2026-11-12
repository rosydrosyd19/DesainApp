import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'denah_app';

export let pool: mysql.Pool;

export async function initDatabase() {
  try {
    // 1. Buat koneksi awal untuk memastikan database denah_app ada
    const initConn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    console.log(`[MariaDB] Terhubung ke server MariaDB pada ${DB_HOST}:${DB_PORT}`);
    await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await initConn.end();

    // 2. Inisialisasi pool koneksi dengan database denah_app
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log(`[MariaDB] Database '${DB_NAME}' siap. Menginisialisasi tabel-tabel berprefix modul...`);

    // 3. Eksekusi pembuatan tabel dengan prefix: nama_modul_nama_tabel
    // MODUL 1: PROYEK
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proyek_master (
        id VARCHAR(50) PRIMARY KEY,
        nama_proyek VARCHAR(150) NOT NULL,
        deskripsi TEXT,
        skala_px_per_meter DOUBLE DEFAULT 50.0,
        satuan VARCHAR(20) DEFAULT 'meter',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS proyek_lantai (
        id VARCHAR(50) PRIMARY KEY,
        proyek_id VARCHAR(50) NOT NULL,
        nama_lantai VARCHAR(100) NOT NULL,
        lebar_meter DOUBLE DEFAULT 24.0,
        panjang_meter DOUBLE DEFAULT 16.0,
        tinggi_plafon_meter DOUBLE DEFAULT 3.2,
        urutan INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_proyek (proyek_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // MODUL 2: DENAH ARSITEKTUR
    await pool.query(`
      CREATE TABLE IF NOT EXISTS denah_dinding (
        id VARCHAR(50) PRIMARY KEY,
        lantai_id VARCHAR(50) NOT NULL,
        x1 DOUBLE NOT NULL,
        y1 DOUBLE NOT NULL,
        x2 DOUBLE NOT NULL,
        y2 DOUBLE NOT NULL,
        ketebalan_cm DOUBLE DEFAULT 15.0,
        tipe_dinding VARCHAR(30) DEFAULT 'utama',
        warna VARCHAR(20) DEFAULT '#475569',
        tipe_bentuk VARCHAR(20) DEFAULT 'lurus',
        kelengkungan DOUBLE DEFAULT 0.0,
        INDEX idx_lantai (lantai_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS denah_bukaan (
        id VARCHAR(50) PRIMARY KEY,
        lantai_id VARCHAR(50) NOT NULL,
        tipe VARCHAR(30) NOT NULL, -- pintu_tunggal, pintu_ganda, jendela
        posisi_x DOUBLE NOT NULL,
        posisi_y DOUBLE NOT NULL,
        lebar_cm DOUBLE DEFAULT 90.0,
        rotasi DOUBLE DEFAULT 0.0,
        INDEX idx_lantai (lantai_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS denah_ruangan (
        id VARCHAR(50) PRIMARY KEY,
        lantai_id VARCHAR(50) NOT NULL,
        nama_ruangan VARCHAR(100) NOT NULL,
        polygon_points LONGTEXT NOT NULL,
        warna_area VARCHAR(30) DEFAULT 'rgba(56, 189, 248, 0.1)',
        INDEX idx_lantai (lantai_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // MODUL 3: FURNITURE & MEJA CLIENT
    await pool.query(`
      CREATE TABLE IF NOT EXISTS furniture_barang (
        id VARCHAR(50) PRIMARY KEY,
        lantai_id VARCHAR(50) NOT NULL,
        tipe VARCHAR(50) NOT NULL, -- meja_tunggal, meja_l, cubicle_4, meja_rapat, kursi
        label VARCHAR(100),
        pemilik_client VARCHAR(100),
        posisi_x DOUBLE NOT NULL,
        posisi_y DOUBLE NOT NULL,
        lebar_cm DOUBLE DEFAULT 120.0,
        panjang_cm DOUBLE DEFAULT 60.0,
        rotasi DOUBLE DEFAULT 0.0,
        INDEX idx_lantai (lantai_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // MODUL 4: PERANGKAT IT, RACK, SWITCH, CCTV, AP, SERVER
    await pool.query(`
      CREATE TABLE IF NOT EXISTS perangkat_terpasang (
        id VARCHAR(50) PRIMARY KEY,
        lantai_id VARCHAR(50) NOT NULL,
        furniture_id VARCHAR(50),
        kategori VARCHAR(50) NOT NULL, -- rack_server, switch, server, nvr_dvr, cctv, access_point, printer, pc_client
        nama_perangkat VARCHAR(100) NOT NULL,
        model_merk VARCHAR(100),
        ip_address VARCHAR(45),
        mac_address VARCHAR(30),
        posisi_x DOUBLE NOT NULL,
        posisi_y DOUBLE NOT NULL,
        rotasi DOUBLE DEFAULT 0.0,
        cctv_fov_angle DOUBLE DEFAULT 75.0,
        cctv_jarak_meter DOUBLE DEFAULT 12.0,
        ap_radius_meter DOUBLE DEFAULT 12.0,
        rack_total_u INT DEFAULT 42,
        switch_total_port INT DEFAULT 24,
        port_notes LONGTEXT,
        status VARCHAR(30) DEFAULT 'aktif',
        INDEX idx_lantai (lantai_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // MODUL 5: KABEL & JARINGAN
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kabel_tipe (
        id VARCHAR(50) PRIMARY KEY,
        nama_tipe VARCHAR(50) NOT NULL,
        warna_hex VARCHAR(20) NOT NULL,
        keterangan VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS kabel_jalur (
        id VARCHAR(50) PRIMARY KEY,
        lantai_id VARCHAR(50) NOT NULL,
        tipe_kabel_id VARCHAR(50) NOT NULL,
        kode_kabel VARCHAR(100) NOT NULL,
        perangkat_asal_id VARCHAR(50),
        perangkat_tujuan_id VARCHAR(50),
        waypoints LONGTEXT NOT NULL,
        panjang_denah_meter DOUBLE NOT NULL,
        tinggi_drop_asal_meter DOUBLE DEFAULT 2.5,
        tinggi_drop_tujuan_meter DOUBLE DEFAULT 2.5,
        panjang_cadangan_meter DOUBLE DEFAULT 1.0,
        panjang_tambahan_drop_meter DOUBLE DEFAULT 6.0,
        total_panjang_meter DOUBLE NOT NULL,
        jalur_tipe VARCHAR(30) DEFAULT 'plafon',
        status VARCHAR(30) DEFAULT 'terpasang',
        INDEX idx_lantai (lantai_id),
        INDEX idx_tipe (tipe_kabel_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // MODUL 6: GAMBAR REFERENSI JIPLAKAN DENAH (TRACING UNDERLAY)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS denah_jiplakan (
        id VARCHAR(50) PRIMARY KEY,
        lantai_id VARCHAR(50) NOT NULL,
        image_url LONGTEXT NOT NULL,
        posisi_x DOUBLE DEFAULT 0.0,
        posisi_y DOUBLE DEFAULT 0.0,
        lebar_px DOUBLE DEFAULT 800.0,
        tinggi_px DOUBLE DEFAULT 600.0,
        skala DOUBLE DEFAULT 1.0,
        rotasi DOUBLE DEFAULT 0.0,
        opacity DOUBLE DEFAULT 0.5,
        is_locked TINYINT DEFAULT 0,
        is_visible TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_lantai (lantai_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Modul Migrasi Kolom Otomatis untuk tabel yang sudah ada
    try {
      await pool.query('ALTER TABLE perangkat_terpasang ADD COLUMN switch_total_port INT DEFAULT 24');
    } catch {
      // Kolom mungkin sudah ada, abaikan
    }
    try {
      await pool.query('ALTER TABLE perangkat_terpasang ADD COLUMN port_notes LONGTEXT');
    } catch {
      // Kolom mungkin sudah ada, abaikan
    }

    // 4. Seed Data Dasar Tipe Kabel
    await seedKabelTipe();

    // 5. Seed Proyek & Denah Bawaan jika masih kosong
    await seedDefaultProject();

    console.log('[MariaDB] Seluruh tabel modul berhasil diinisialisasi!');
    return true;
  } catch (error) {
    console.error('[MariaDB Error] Gagal menginisialisasi database:', error);
    throw error;
  }
}

async function seedKabelTipe() {
  const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM kabel_tipe');
  if (rows[0].count === 0) {
    console.log('[MariaDB Seed] Memasukkan katalog tipe kabel...');
    await pool.query(`
      INSERT INTO kabel_tipe (id, nama_tipe, warna_hex, keterangan) VALUES
      ('cat6_data', 'Cat6 UTP (Data LAN)', '#2563eb', 'Kabel data Gigabit LAN'),
      ('cat6_cctv', 'Cat6 UTP (CCTV PoE)', '#f97316', 'Kabel PoE CCTV & NVR'),
      ('cat6_ap', 'Cat6A STP (Access Point)', '#10b981', 'Kabel High Bandwidth AP'),
      ('fiber_sm', 'Fiber Optic SM (Backbone)', '#eab308', 'Kabel FO Single-Mode Uplink Core'),
      ('coaxial', 'Coaxial / Power', '#ef4444', 'Kabel Analog / Listrik UPS')
    `);
  }
}

async function seedDefaultProject() {
  const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM proyek_master');
  if (rows[0].count === 0) {
    console.log('[MariaDB Seed] Membuat proyek contoh denah IT pertama...');
    const projectId = 'proj-default-01';
    const floorId = 'floor-default-01';

    await pool.query(`
      INSERT INTO proyek_master (id, nama_proyek, deskripsi, skala_px_per_meter)
      VALUES (?, ?, ?, ?)
    `, [projectId, 'Denah Kantor & Jaringan IT Gedung A', 'Denah master pemetaan kabel, server, CCTV, dan workstation client', 50.0]);

    await pool.query(`
      INSERT INTO proyek_lantai (id, proyek_id, nama_lantai, lebar_meter, panjang_meter, urutan)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [floorId, projectId, 'Lantai 1 - Operasional & Server', 24.0, 16.0, 1]);

    // Tambahkan contoh dinding ruangan server dan ruang kerja
    const walls = [
      // Dinding luar gedung (20m x 14m)
      { id: 'w1', x1: 2, y1: 2, x2: 22, y2: 2 },
      { id: 'w2', x2: 22, y1: 2, y2: 14, x1: 22 },
      { id: 'w3', x1: 22, y1: 14, x2: 2, y2: 14 },
      { id: 'w4', x1: 2, y1: 14, x2: 2, y2: 2 },
      // Ruang Server (kiri atas: 5m x 4m)
      { id: 'w5', x1: 2, y1: 6, x2: 7, y2: 6 },
      { id: 'w6', x1: 7, y1: 2, x2: 7, y2: 6 },
    ];

    for (const w of walls) {
      await pool.query(`
        INSERT INTO denah_dinding (id, lantai_id, x1, y1, x2, y2, ketebalan_cm, tipe_dinding)
        VALUES (?, ?, ?, ?, ?, ?, 15.0, 'utama')
      `, [w.id, floorId, w.x1 * 50, w.y1 * 50, w.x2 * 50, w.y2 * 50]);
    }

    // Pintu ruang server & pintu utama
    await pool.query(`
      INSERT INTO denah_bukaan (id, lantai_id, tipe, posisi_x, posisi_y, lebar_cm, rotasi)
      VALUES
      ('door-1', ?, 'pintu_tunggal', 7 * 50, 4.5 * 50, 90.0, 90.0),
      ('door-main', ?, 'pintu_ganda', 12 * 50, 14 * 50, 160.0, 0.0)
    `, [floorId, floorId]);

    // Ruang Server & Ruang Kerja label zonasi
    await pool.query(`
      INSERT INTO denah_ruangan (id, lantai_id, nama_ruangan, polygon_points, warna_area)
      VALUES
      ('zone-server', ?, 'Ruang Server & NOC', ?, 'rgba(239, 68, 68, 0.12)'),
      ('zone-staff', ?, 'Ruang Kerja Staff & Client', ?, 'rgba(56, 189, 248, 0.08)')
    `, [
      floorId,
      JSON.stringify([{ x: 2 * 50, y: 2 * 50 }, { x: 7 * 50, y: 2 * 50 }, { x: 7 * 50, y: 6 * 50 }, { x: 2 * 50, y: 6 * 50 }]),
      floorId,
      JSON.stringify([{ x: 7 * 50, y: 2 * 50 }, { x: 22 * 50, y: 2 * 50 }, { x: 22 * 50, y: 14 * 50 }, { x: 2 * 50, y: 14 * 50 }, { x: 2 * 50, y: 6 * 50 }, { x: 7 * 50, y: 6 * 50 }]),
    ]);

    // Furniture Meja Client
    await pool.query(`
      INSERT INTO furniture_barang (id, lantai_id, tipe, label, pemilik_client, posisi_x, posisi_y, lebar_cm, panjang_cm, rotasi)
      VALUES
      ('desk-1', ?, 'meja_tunggal', 'Meja Client 01', 'Budi - Accounting', 10 * 50, 5 * 50, 140, 70, 0),
      ('desk-2', ?, 'meja_tunggal', 'Meja Client 02', 'Siti - IT Support', 10 * 50, 7 * 50, 140, 70, 0),
      ('desk-3', ?, 'meja_tunggal', 'Meja Client 03', 'Rudi - Marketing', 14 * 50, 5 * 50, 140, 70, 0),
      ('desk-4', ?, 'meja_tunggal', 'Meja Client 04', 'Dewi - HRD', 14 * 50, 7 * 50, 140, 70, 0)
    `, [floorId, floorId, floorId, floorId]);

    // Perangkat IT (Rack Server, Switch, NVR, CCTV, AP, PC Client, Printer)
    await pool.query(`
      INSERT INTO perangkat_terpasang
      (id, lantai_id, furniture_id, kategori, nama_perangkat, model_merk, ip_address, mac_address, posisi_x, posisi_y, rotasi, cctv_fov_angle, cctv_jarak_meter, ap_radius_meter, rack_total_u)
      VALUES
      ('dev-rack', ?, NULL, 'rack_server', 'RACK-MAIN-42U', 'Fortress 42U Server Rack', '192.168.1.2', '', 4.5 * 50, 3.5 * 50, 0, 0, 0, 0, 42),
      ('dev-sw-core', ?, NULL, 'switch', 'SW-CORE-01', 'Cisco Catalyst 24P PoE', '192.168.1.3', '00:1A:2B:3C:4D:01', 4.5 * 50, 4.3 * 50, 0, 0, 0, 0, 24),
      ('dev-nvr', ?, NULL, 'nvr_dvr', 'NVR-32CH', 'Hikvision NVR 32 Channel', '192.168.1.10', '', 3.5 * 50, 3.5 * 50, 0, 0, 0, 0, 0),
      ('dev-cctv-1', ?, NULL, 'cctv', 'CCTV-CORRIDOR-01', 'Hikvision 4MP Dome', '192.168.1.101', '00:1A:2B:3C:4D:11', 2.5 * 50, 2.5 * 50, 45, 80, 10, 0, 0),
      ('dev-cctv-2', ?, NULL, 'cctv', 'CCTV-MAIN-LOBBY', 'Hikvision 4MP Bullet', '192.168.1.102', '00:1A:2B:3C:4D:12', 21.5 * 50, 2.5 * 50, 135, 75, 12, 0, 0),
      ('dev-ap-1', ?, NULL, 'access_point', 'AP-OFFICE-01', 'UniFi U6 Pro Dual Band', '192.168.1.201', '00:1A:2B:3C:4D:21', 12 * 50, 6 * 50, 0, 0, 0, 10, 0),
      ('dev-pc-1', ?, 'desk-1', 'pc_client', 'PC-BUDI', 'Dell OptiPlex 7090', '192.168.1.51', '', 10 * 50, 5 * 50, 0, 0, 0, 0, 0),
      ('dev-pc-2', ?, 'desk-2', 'pc_client', 'PC-SITI', 'Lenovo ThinkCentre', '192.168.1.52', '', 10 * 50, 7 * 50, 0, 0, 0, 0, 0),
      ('dev-printer', ?, NULL, 'printer', 'PRN-OFFICE-01', 'HP LaserJet Enterprise', '192.168.1.30', '', 17 * 50, 10 * 50, 0, 0, 0, 0, 0)
    `, [floorId, floorId, floorId, floorId, floorId, floorId, floorId, floorId, floorId]);

    // Jalur Kabel Internet & CCTV awal
    await pool.query(`
      INSERT INTO kabel_jalur
      (id, lantai_id, tipe_kabel_id, kode_kabel, perangkat_asal_id, perangkat_tujuan_id, waypoints, panjang_denah_meter, panjang_tambahan_drop_meter, total_panjang_meter, jalur_tipe)
      VALUES
      ('cbl-1', ?, 'cat6_data', 'CBL-LAN-PC01', 'dev-sw-core', 'dev-pc-1', ?, 7.5, 2.0, 9.5, 'plafon'),
      ('cbl-2', ?, 'cat6_cctv', 'CBL-CCTV-01', 'dev-nvr', 'dev-cctv-1', ?, 3.2, 2.0, 5.2, 'plafon'),
      ('cbl-3', ?, 'cat6_ap', 'CBL-AP-01', 'dev-sw-core', 'dev-ap-1', ?, 8.8, 2.0, 10.8, 'plafon')
    `, [
      floorId,
      JSON.stringify([{ x: 4.5 * 50, y: 4.3 * 50 }, { x: 7 * 50, y: 4.3 * 50 }, { x: 10 * 50, y: 5 * 50 }]),
      floorId,
      JSON.stringify([{ x: 3.5 * 50, y: 3.5 * 50 }, { x: 2.5 * 50, y: 2.5 * 50 }]),
      floorId,
      JSON.stringify([{ x: 4.5 * 50, y: 4.3 * 50 }, { x: 7 * 50, y: 4.3 * 50 }, { x: 12 * 50, y: 6 * 50 }]),
    ]);
  }
}
