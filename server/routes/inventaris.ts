import { Router } from 'express';
import { pool } from '../config/database.ts';

const router = Router();

// Endpoint untuk Bill of Materials (BOM) & Rekapitulasi Inventaris
router.get('/bom/:floorId', async (req, res) => {
  try {
    const floorId = req.params.floorId;

    // Rekapitulasi Kabel per Tipe (Termasuk Naik/Turun Plafon & Masuk Lantai)
    const [rekapKabel]: any = await pool.query(`
      SELECT 
        t.id as tipe_id,
        t.nama_tipe,
        t.warna_hex,
        COUNT(k.id) as jumlah_tarikan,
        ROUND(COALESCE(SUM(k.panjang_denah_meter), 0), 2) as total_panjang_denah,
        ROUND(COALESCE(SUM(COALESCE(k.tinggi_drop_asal_meter, 2.5)), 0), 2) as total_drop_asal,
        ROUND(COALESCE(SUM(COALESCE(k.tinggi_drop_tujuan_meter, 2.5)), 0), 2) as total_drop_tujuan,
        ROUND(COALESCE(SUM(COALESCE(k.panjang_cadangan_meter, 1.0)), 0), 2) as total_cadangan,
        ROUND(COALESCE(SUM(k.panjang_tambahan_drop_meter), 0), 2) as total_drop,
        ROUND(COALESCE(SUM(k.total_panjang_meter), 0), 2) as total_meter,
        CEIL(COALESCE(SUM(k.total_panjang_meter), 0) / 305.0) as estimasi_rol_305m
      FROM kabel_tipe t
      LEFT JOIN kabel_jalur k ON t.id = k.tipe_kabel_id AND k.lantai_id = ?
      GROUP BY t.id, t.nama_tipe, t.warna_hex
    `, [floorId]);

    // Rincian Detail Tiap Tarikan Kabel (Horizontal + Naik Atap / Turun Lantai)
    const [daftarKabelDetail]: any = await pool.query(`
      SELECT 
        k.id,
        k.kode_kabel,
        t.nama_tipe,
        t.warna_hex,
        k.jalur_tipe,
        k.panjang_denah_meter,
        COALESCE(k.tinggi_drop_asal_meter, 2.5) as tinggi_drop_asal_meter,
        COALESCE(k.tinggi_drop_tujuan_meter, 2.5) as tinggi_drop_tujuan_meter,
        COALESCE(k.panjang_cadangan_meter, 1.0) as panjang_cadangan_meter,
        k.panjang_tambahan_drop_meter,
        k.total_panjang_meter,
        k.status,
        p1.nama_perangkat as perangkat_asal,
        p1.kategori as kategori_asal,
        p2.nama_perangkat as perangkat_tujuan,
        p2.kategori as kategori_tujuan
      FROM kabel_jalur k
      LEFT JOIN kabel_tipe t ON k.tipe_kabel_id = t.id
      LEFT JOIN perangkat_terpasang p1 ON k.perangkat_asal_id = p1.id
      LEFT JOIN perangkat_terpasang p2 ON k.perangkat_tujuan_id = p2.id
      WHERE k.lantai_id = ?
      ORDER BY k.kode_kabel
    `, [floorId]);

    // Rekapitulasi Perangkat IT & CCTV & AP
    const [rekapPerangkat]: any = await pool.query(`
      SELECT 
        kategori,
        COUNT(id) as total_unit,
        GROUP_CONCAT(nama_perangkat SEPARATOR ', ') as daftar_nama
      FROM perangkat_terpasang
      WHERE lantai_id = ?
      GROUP BY kategori
    `, [floorId]);

    // Rekapitulasi Meja & Furniture
    const [rekapFurniture]: any = await pool.query(`
      SELECT 
        tipe,
        COUNT(id) as total_unit,
        GROUP_CONCAT(label SEPARATOR ', ') as daftar_label
      FROM furniture_barang
      WHERE lantai_id = ?
      GROUP BY tipe
    `, [floorId]);

    // Daftar IP Address & Status Endpoint
    const [daftarEndpoint]: any = await pool.query(`
      SELECT 
        p.id,
        p.nama_perangkat,
        p.kategori,
        p.model_merk,
        p.ip_address,
        p.mac_address,
        p.status,
        f.label as label_meja,
        f.pemilik_client
      FROM perangkat_terpasang p
      LEFT JOIN furniture_barang f ON p.furniture_id = f.id
      WHERE p.lantai_id = ?
      ORDER BY p.kategori, p.nama_perangkat
    `, [floorId]);

    res.json({
      rekapKabel,
      daftarKabelDetail,
      rekapPerangkat,
      rekapFurniture,
      daftarEndpoint,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
