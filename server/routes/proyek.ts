import { Router } from 'express';
import { pool } from '../config/database.ts';

const router = Router();

// Ambil semua proyek
router.get('/', async (req, res) => {
  try {
    const [proyek]: any = await pool.query('SELECT * FROM proyek_master ORDER BY updated_at DESC');
    res.json(proyek);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ambil detail proyek beserta daftar lantai
router.get('/:id', async (req, res) => {
  try {
    const [proyek]: any = await pool.query('SELECT * FROM proyek_master WHERE id = ?', [req.params.id]);
    if (proyek.length === 0) return res.status(404).json({ error: 'Proyek tidak ditemukan' });

    const [lantai]: any = await pool.query('SELECT * FROM proyek_lantai WHERE proyek_id = ? ORDER BY urutan ASC', [req.params.id]);
    res.json({ ...proyek[0], lantai });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buat proyek baru
router.post('/', async (req, res) => {
  try {
    const { id, nama_proyek, deskripsi, skala_px_per_meter } = req.body;
    const projId = id || `proj-${Date.now()}`;
    await pool.query(
      'INSERT INTO proyek_master (id, nama_proyek, deskripsi, skala_px_per_meter) VALUES (?, ?, ?, ?)',
      [projId, nama_proyek, deskripsi || '', skala_px_per_meter || 50.0]
    );

    // Otomatis buat lantai 1 bawaan
    const floorId = `floor-${Date.now()}`;
    await pool.query(
      'INSERT INTO proyek_lantai (id, proyek_id, nama_lantai, lebar_meter, panjang_meter, urutan) VALUES (?, ?, ?, ?, ?, ?)',
      [floorId, projId, 'Lantai 1', 24.0, 16.0, 1]
    );

    res.status(201).json({ id: projId, nama_proyek, floorId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Skala Kalibrasi Proyek (proyek_master)
router.put('/:proyekId/skala', async (req, res) => {
  try {
    const proyekId = req.params.proyekId;
    const { skala_px_per_meter } = req.body;
    const skalaVal = parseFloat(skala_px_per_meter) || 50.0;

    await pool.query(
      'UPDATE proyek_master SET skala_px_per_meter = ? WHERE id = ?',
      [skalaVal, proyekId]
    );

    res.json({ success: true, skala_px_per_meter: skalaVal, message: 'Skala proyek berhasil disimpan ke MariaDB' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tambah Lantai Baru pada Proyek
router.post('/:proyekId/lantai', async (req, res) => {
  try {
    const proyekId = req.params.proyekId;
    const { nama_lantai, lebar_meter, panjang_meter, tinggi_plafon_meter } = req.body;
    const floorId = `floor-${Date.now()}`;

    const [existing]: any = await pool.query(
      'SELECT COUNT(*) as count FROM proyek_lantai WHERE proyek_id = ?',
      [proyekId]
    );
    const urutan = (existing[0]?.count || 0) + 1;

    await pool.query(
      'INSERT INTO proyek_lantai (id, proyek_id, nama_lantai, lebar_meter, panjang_meter, tinggi_plafon_meter, urutan) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [floorId, proyekId, nama_lantai || `Lantai ${urutan}`, lebar_meter || 24.0, panjang_meter || 16.0, tinggi_plafon_meter || 3.2, urutan]
    );

    res.status(201).json({ id: floorId, proyek_id: proyekId, nama_lantai, lebar_meter, panjang_meter, tinggi_plafon_meter: tinggi_plafon_meter || 3.2, urutan });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Detail Lantai (Nama Lantai, Ukuran Dimensi Gedung, Tinggi Plafon)
router.put('/lantai/:floorId', async (req, res) => {
  try {
    const floorId = req.params.floorId;
    const { nama_lantai, lebar_meter, panjang_meter, tinggi_plafon_meter } = req.body;

    await pool.query(
      'UPDATE proyek_lantai SET nama_lantai = ?, lebar_meter = ?, panjang_meter = ?, tinggi_plafon_meter = ? WHERE id = ?',
      [nama_lantai, lebar_meter, panjang_meter, tinggi_plafon_meter || 3.2, floorId]
    );

    res.json({ success: true, message: 'Data lantai berhasil diperbarui' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Khusus / Cepat Tinggi Plafon Lantai & Opsi Sinkronisasi Seluruh Kabel Plafon
router.put('/lantai/:floorId/tinggi-plafon', async (req, res) => {
  try {
    const floorId = req.params.floorId;
    const { tinggi_plafon_meter, syncKabelPlafon } = req.body;
    const H = parseFloat(tinggi_plafon_meter) || 3.2;

    await pool.query(
      'UPDATE proyek_lantai SET tinggi_plafon_meter = ? WHERE id = ?',
      [H, floorId]
    );

    let updatedCables: any[] = [];
    if (syncKabelPlafon) {
      // Ambil seluruh kabel plafon di lantai ini beserta info perangkat tujuannya
      const [cables]: any = await pool.query(`
        SELECT k.*, p2.kategori as kategori_tujuan
        FROM kabel_jalur k
        LEFT JOIN perangkat_terpasang p2 ON k.perangkat_tujuan_id = p2.id
        WHERE k.lantai_id = ? AND k.jalur_tipe = 'plafon'
      `, [floorId]);

      for (const c of cables) {
        const dropAsal = H; // dari rack naik ke atap H meter
        let dropTujuan = Math.max(1.5, Number((H - 0.75).toFixed(2))); // meja / pc
        if (c.kategori_tujuan === 'access_point') {
          dropTujuan = 0.5; // AP di atap
        } else if (c.kategori_tujuan === 'cctv') {
          dropTujuan = Math.max(1.0, Number((H - 3.5).toFixed(2))); // CCTV kolom 3.5m
        } else if (c.kategori_tujuan === 'rack_server') {
          dropTujuan = H;
        }

        const cadangan = Number((c.panjang_cadangan_meter || 1.0).toFixed(2));
        const totalDrop = Number((dropAsal + dropTujuan + cadangan).toFixed(2));
        const totalPanjang = Number((c.panjang_denah_meter + totalDrop).toFixed(2));

        await pool.query(`
          UPDATE kabel_jalur 
          SET tinggi_drop_asal_meter = ?, tinggi_drop_tujuan_meter = ?, panjang_tambahan_drop_meter = ?, total_panjang_meter = ?
          WHERE id = ?
        `, [dropAsal, dropTujuan, totalDrop, totalPanjang, c.id]);
      }

      // Ambil kembali daftar kabel lengkap setelah update
      const [allCables]: any = await pool.query(`
        SELECT k.*, t.nama_tipe, t.warna_hex
        FROM kabel_jalur k
        LEFT JOIN kabel_tipe t ON k.tipe_kabel_id = t.id
        WHERE k.lantai_id = ?
      `, [floorId]);
      updatedCables = allCables;
    }

    res.json({
      success: true,
      tinggi_plafon_meter: H,
      updatedCables,
      message: `Tinggi atap/plafon diperbarui ke ${H}m${syncKabelPlafon ? ' dan kabel plafon telah disinkronkan' : ''}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hapus Lantai Beserta Seluruh Denahnya
router.delete('/lantai/:floorId', async (req, res) => {
  try {
    const floorId = req.params.floorId;
    await pool.query('DELETE FROM denah_dinding WHERE lantai_id = ?', [floorId]);
    await pool.query('DELETE FROM denah_bukaan WHERE lantai_id = ?', [floorId]);
    await pool.query('DELETE FROM denah_ruangan WHERE lantai_id = ?', [floorId]);
    await pool.query('DELETE FROM furniture_barang WHERE lantai_id = ?', [floorId]);
    await pool.query('DELETE FROM perangkat_terpasang WHERE lantai_id = ?', [floorId]);
    await pool.query('DELETE FROM kabel_jalur WHERE lantai_id = ?', [floorId]);
    await pool.query('DELETE FROM proyek_lantai WHERE id = ?', [floorId]);

    res.json({ success: true, message: 'Lantai berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ambil seluruh data denah lengkap untuk 1 lantai (dinding, bukaan, ruangan, meja/furniture, perangkat, kabel)
router.get('/lantai/:floorId/full', async (req, res) => {
  try {
    const floorId = req.params.floorId;

    const [lantai]: any = await pool.query('SELECT * FROM proyek_lantai WHERE id = ?', [floorId]);
    if (lantai.length === 0) return res.status(404).json({ error: 'Lantai tidak ditemukan' });

    const [proyek]: any = await pool.query('SELECT * FROM proyek_master WHERE id = ?', [lantai[0].proyek_id]);

    const [dinding]: any = await pool.query('SELECT * FROM denah_dinding WHERE lantai_id = ?', [floorId]);
    const [bukaan]: any = await pool.query('SELECT * FROM denah_bukaan WHERE lantai_id = ?', [floorId]);
    const [ruangan]: any = await pool.query('SELECT * FROM denah_ruangan WHERE lantai_id = ?', [floorId]);
    const [furniture]: any = await pool.query('SELECT * FROM furniture_barang WHERE lantai_id = ?', [floorId]);
    const [perangkat]: any = await pool.query('SELECT * FROM perangkat_terpasang WHERE lantai_id = ?', [floorId]);
    const [kabel]: any = await pool.query(`
      SELECT k.*, t.nama_tipe, t.warna_hex
      FROM kabel_jalur k
      LEFT JOIN kabel_tipe t ON k.tipe_kabel_id = t.id
      WHERE k.lantai_id = ?
    `, [floorId]);

    const [kabelTipe]: any = await pool.query('SELECT * FROM kabel_tipe');

    res.json({
      proyek: proyek[0] || null,
      lantai: lantai[0],
      dinding,
      bukaan,
      ruangan: ruangan.map((r: any) => ({ ...r, polygon_points: JSON.parse(r.polygon_points || '[]') })),
      furniture,
      perangkat,
      kabel: kabel.map((c: any) => ({ ...c, waypoints: JSON.parse(c.waypoints || '[]') })),
      kabelTipe,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Simpan/Sinkronisasi seluruh denah 1 lantai (Dinding, Furniture, Perangkat IT, Kabel) dalam transaksi atomik
router.post('/lantai/:floorId/save-all', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const floorId = req.params.floorId;
    const { proyek, lantai, dinding, bukaan, ruangan, furniture, perangkat, kabel } = req.body;

    // Update info proyek & lantai jika ada
    if (proyek && proyek.id) {
      await conn.query(
        'UPDATE proyek_master SET nama_proyek = ?, deskripsi = ?, skala_px_per_meter = ? WHERE id = ?',
        [proyek.nama_proyek, proyek.deskripsi, proyek.skala_px_per_meter, proyek.id]
      );
    }
    if (lantai && lantai.id) {
      await conn.query(
        'UPDATE proyek_lantai SET nama_lantai = ?, lebar_meter = ?, panjang_meter = ?, tinggi_plafon_meter = ? WHERE id = ?',
        [lantai.nama_lantai, lantai.lebar_meter, lantai.panjang_meter, lantai.tinggi_plafon_meter || 3.2, lantai.id]
      );
    }

    // 1. Dinding
    await conn.query('DELETE FROM denah_dinding WHERE lantai_id = ?', [floorId]);
    for (const d of dinding || []) {
      await conn.query(`
        INSERT INTO denah_dinding (id, lantai_id, x1, y1, x2, y2, ketebalan_cm, tipe_dinding, warna, tipe_bentuk, kelengkungan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        d.id, floorId, d.x1, d.y1, d.x2, d.y2, d.ketebalan_cm || 15.0,
        d.tipe_dinding || 'utama', d.warna || '#475569',
        d.tipe_bentuk || 'lurus', d.kelengkungan || 0.0
      ]);
    }

    // 2. Bukaan (Pintu, Jendela)
    await conn.query('DELETE FROM denah_bukaan WHERE lantai_id = ?', [floorId]);
    for (const b of bukaan || []) {
      await conn.query(`
        INSERT INTO denah_bukaan (id, lantai_id, tipe, posisi_x, posisi_y, lebar_cm, rotasi)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [b.id, floorId, b.tipe, b.posisi_x, b.posisi_y, b.lebar_cm || 90.0, b.rotasi || 0]);
    }

    // 3. Ruangan / Zoning
    await conn.query('DELETE FROM denah_ruangan WHERE lantai_id = ?', [floorId]);
    for (const r of ruangan || []) {
      await conn.query(`
        INSERT INTO denah_ruangan (id, lantai_id, nama_ruangan, polygon_points, warna_area)
        VALUES (?, ?, ?, ?, ?)
      `, [r.id, floorId, r.nama_ruangan, JSON.stringify(r.polygon_points || []), r.warna_area || 'rgba(56, 189, 248, 0.1)']);
    }

    // 4. Furniture (Meja Client, Kursi)
    await conn.query('DELETE FROM furniture_barang WHERE lantai_id = ?', [floorId]);
    for (const f of furniture || []) {
      await conn.query(`
        INSERT INTO furniture_barang (id, lantai_id, tipe, label, pemilik_client, posisi_x, posisi_y, lebar_cm, panjang_cm, rotasi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [f.id, floorId, f.tipe, f.label || '', f.pemilik_client || '', f.posisi_x, f.posisi_y, f.lebar_cm || 120, f.panjang_cm || 60, f.rotasi || 0]);
    }

    // 5. Perangkat Terpasang (Rack, Switch, Server, NVR, CCTV, AP, PC, Printer)
    await conn.query('DELETE FROM perangkat_terpasang WHERE lantai_id = ?', [floorId]);
    for (const p of perangkat || []) {
      await conn.query(`
        INSERT INTO perangkat_terpasang
        (id, lantai_id, furniture_id, kategori, nama_perangkat, model_merk, ip_address, mac_address, posisi_x, posisi_y, rotasi, cctv_fov_angle, cctv_jarak_meter, ap_radius_meter, rack_total_u, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        p.id, floorId, p.furniture_id || null, p.kategori, p.nama_perangkat, p.model_merk || '',
        p.ip_address || '', p.mac_address || '', p.posisi_x, p.posisi_y, p.rotasi || 0,
        p.cctv_fov_angle || 75.0, p.cctv_jarak_meter || 12.0, p.ap_radius_meter || 12.0, p.rack_total_u || 42, p.status || 'aktif'
      ]);
    }

    // 6. Jalur Kabel (Mendukung Drop/Rise Plafon, Masuk Lantai, dan Cadangan)
    await conn.query('DELETE FROM kabel_jalur WHERE lantai_id = ?', [floorId]);
    for (const k of kabel || []) {
      const dropAsal = Number(k.tinggi_drop_asal_meter ?? 2.5);
      const dropTujuan = Number(k.tinggi_drop_tujuan_meter ?? 2.5);
      const cadangan = Number(k.panjang_cadangan_meter ?? 1.0);
      const totalDrop = Number((dropAsal + dropTujuan + cadangan).toFixed(2));
      const panjangDenah = Number((k.panjang_denah_meter || 0).toFixed(2));
      const totalPanjang = Number((panjangDenah + totalDrop).toFixed(2));

      await conn.query(`
        INSERT INTO kabel_jalur
        (id, lantai_id, tipe_kabel_id, kode_kabel, perangkat_asal_id, perangkat_tujuan_id, waypoints, panjang_denah_meter, tinggi_drop_asal_meter, tinggi_drop_tujuan_meter, panjang_cadangan_meter, panjang_tambahan_drop_meter, total_panjang_meter, jalur_tipe, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        k.id, floorId, k.tipe_kabel_id, k.kode_kabel || 'CBL-NEW', k.perangkat_asal_id || null, k.perangkat_tujuan_id || null,
        JSON.stringify(k.waypoints || []), panjangDenah, dropAsal, dropTujuan, cadangan,
        totalDrop, totalPanjang, k.jalur_tipe || 'plafon', k.status || 'terpasang'
      ]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Denah dan mapping infrastruktur IT berhasil disimpan ke MariaDB!' });
  } catch (error: any) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

export default router;
