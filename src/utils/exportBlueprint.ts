import {
  Proyek,
  Lantai,
  Dinding,
  Bukaan,
  Ruangan,
  Furniture,
  Perangkat,
  KabelJalur,
  KabelTipe,
} from '../types/schema.ts';
import {
  getDistance,
  formatMeasurement,
  getCctvFovPolygon,
} from './geometry.ts';

interface ExportBlueprintOptions {
  proyek: Proyek | null;
  lantai: Lantai | null;
  dinding: Dinding[];
  bukaan: Bukaan[];
  ruangan: Ruangan[];
  furniture: Furniture[];
  perangkat: Perangkat[];
  kabel: KabelJalur[];
  kabelTipe: KabelTipe[];
  scalePxPerMeter: number;
  includeGrid?: boolean; // Default: true (Grid tipis arsitektur CAD)
}

export function generateWhitePaperBlueprint(options: ExportBlueprintOptions): HTMLCanvasElement {
  const {
    proyek,
    lantai,
    dinding,
    bukaan,
    ruangan,
    furniture,
    perangkat,
    kabel,
    kabelTipe,
    scalePxPerMeter,
  } = options;

  // 1. Hitung Bounding Box seluruh denah agar gambar terpusat di kertas putih
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const includePoint = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  dinding.forEach((w) => {
    includePoint(w.x1, w.y1);
    includePoint(w.x2, w.y2);
    if (w.tipe_bentuk === 'lingkaran') {
      const r = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
      includePoint(w.x1 - r, w.y1 - r);
      includePoint(w.x1 + r, w.y1 + r);
    } else if (w.tipe_bentuk === 'lengkung' && w.kelengkungan) {
      const midX = (w.x1 + w.x2) / 2;
      const midY = (w.y1 + w.y2) / 2;
      const L = Math.max(1, getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }));
      const nx = -(w.y2 - w.y1) / L;
      const ny = (w.x2 - w.x1) / L;
      includePoint(midX + nx * w.kelengkungan, midY + ny * w.kelengkungan);
    }
  });

  furniture.forEach((f) => {
    const pad = (Math.max(f.lebar_cm, f.panjang_cm) / 100) * scalePxPerMeter;
    includePoint(f.posisi_x - pad, f.posisi_y - pad);
    includePoint(f.posisi_x + pad, f.posisi_y + pad);
  });

  perangkat.forEach((p) => {
    includePoint(p.posisi_x - 40, p.posisi_y - 40);
    includePoint(p.posisi_x + 40, p.posisi_y + 40);
  });

  kabel.forEach((c) => {
    c.waypoints?.forEach((pt) => includePoint(pt.x, pt.y));
  });

  // Jika denah masih kosong, buat area default
  if (!isFinite(minX) || !isFinite(minY)) {
    minX = 0;
    minY = 0;
    maxX = (lantai?.lebar_meter || 20) * scalePxPerMeter;
    maxY = (lantai?.panjang_meter || 15) * scalePxPerMeter;
  }

  // Tambahkan margin kertas putih (80px sekelilingnya)
  const margin = 80;
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  const titleBlockHeight = 110; // Kop judul teknik di bagian bawah
  const canvasWidth = Math.max(1200, contentWidth + margin * 2);
  const canvasHeight = Math.max(850, contentHeight + margin * 2 + titleBlockHeight);

  // Offset pergeseran agar gambar terpusat
  const offsetX = margin - minX + (canvasWidth - margin * 2 - contentWidth) / 2;
  const offsetY = margin - minY + (canvasHeight - margin * 2 - titleBlockHeight - contentHeight) / 2;

  // 2. Buat Canvas Resolusi Tinggi (2x untuk cetak super tajam / 300 DPI)
  const exportCanvas = document.createElement('canvas');
  const dpr = 2;
  exportCanvas.width = canvasWidth * dpr;
  exportCanvas.height = canvasHeight * dpr;

  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return exportCanvas;

  ctx.scale(dpr, dpr);

  // 3. BACKGROUND KERTAS PUTIH POLOS (TANPA GRID)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Garis tepi / border kertas gambar kerja (Architectural Sheet Border)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, canvasWidth - 30, canvasHeight - 30);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);

  // 3.5. GAMBAR GRID TIPIS ARSITEKTUR (Pola Kotak Kertas Milimeter CAD)
  const { includeGrid = true } = options;
  if (includeGrid) {
    const sheetInnerLeft = 20;
    const sheetInnerTop = 20;
    const sheetInnerRight = canvasWidth - 20;
    const sheetInnerBottom = canvasHeight - 20 - titleBlockHeight;

    ctx.save();
    // Batasi grid agar hanya tergambar di dalam bingkai kerja denah
    ctx.beginPath();
    ctx.rect(sheetInnerLeft, sheetInnerTop, sheetInnerRight - sheetInnerLeft, sheetInnerBottom - sheetInnerTop);
    ctx.clip();

    ctx.translate(offsetX, offsetY);

    const worldLeft = -offsetX + sheetInnerLeft;
    const worldRight = -offsetX + sheetInnerRight;
    const worldTop = -offsetY + sheetInnerTop;
    const worldBottom = -offsetY + sheetInnerBottom;

    const startGridX = Math.floor(worldLeft / scalePxPerMeter) * scalePxPerMeter;
    const endGridX = Math.ceil(worldRight / scalePxPerMeter) * scalePxPerMeter;
    const startGridY = Math.floor(worldTop / scalePxPerMeter) * scalePxPerMeter;
    const endGridY = Math.ceil(worldBottom / scalePxPerMeter) * scalePxPerMeter;

    // Sub-Grid Halus (0.2 meter / 20 cm) - Jelas terbaca saat dicetak di kertas
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = 0.7;
    const subGridStep = scalePxPerMeter / 5;

    ctx.beginPath();
    for (let x = startGridX; x <= endGridX; x += subGridStep) {
      ctx.moveTo(x, worldTop);
      ctx.lineTo(x, worldBottom);
    }
    for (let y = startGridY; y <= endGridY; y += subGridStep) {
      ctx.moveTo(worldLeft, y);
      ctx.lineTo(worldRight, y);
    }
    ctx.stroke();

    // Grid Utama (1 meter) - Garis Tegas & Tajam Standar Gambar Kerja Arsitektur
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.65)'; // Slate-600 yang tajam dan tidak pudar saat dicetak printer
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    for (let x = startGridX; x <= endGridX; x += scalePxPerMeter) {
      ctx.moveTo(x, worldTop);
      ctx.lineTo(x, worldBottom);
    }
    for (let y = startGridY; y <= endGridY; y += scalePxPerMeter) {
      ctx.moveTo(worldLeft, y);
      ctx.lineTo(worldRight, y);
    }
    ctx.stroke();

    ctx.restore();
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // 4. GAMBAR RUANGAN / ZONASI (Warna Pastel Lembut)
  ruangan.forEach((r) => {
    if (!r.polygon_points || r.polygon_points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(r.polygon_points[0].x, r.polygon_points[0].y);
    for (let i = 1; i < r.polygon_points.length; i++) {
      ctx.lineTo(r.polygon_points[i].x, r.polygon_points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = r.warna_area || 'rgba(56, 189, 248, 0.08)';
    ctx.fill();

    // Nama Ruangan
    const avgX = r.polygon_points.reduce((acc, p) => acc + p.x, 0) / r.polygon_points.length;
    const avgY = r.polygon_points.reduce((acc, p) => acc + p.y, 0) / r.polygon_points.length;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(r.nama_ruangan.toUpperCase(), avgX, avgY);
  });

  // 5. GAMBAR AREA CAKUPAN CCTV & WI-FI (Transparan Lembut di Kertas Putih)
  perangkat.forEach((dev) => {
    if (dev.kategori === 'cctv') {
      const radiusPx = (dev.cctv_jarak_meter || 12) * scalePxPerMeter;
      const fovAngle = dev.cctv_fov_angle || 75;
      const poly = getCctvFovPolygon(
        { x: dev.posisi_x, y: dev.posisi_y },
        dev.rotasi,
        fovAngle,
        radiusPx
      );
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i].x, poly[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (dev.kategori === 'access_point') {
      const radiusPx = (dev.ap_radius_meter || 12) * scalePxPerMeter;
      ctx.beginPath();
      ctx.arc(dev.posisi_x, dev.posisi_y, radiusPx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // 6. GAMBAR JALUR KABEL INTERNET & JARINGAN
  kabel.forEach((c) => {
    if (!c.waypoints || c.waypoints.length < 2) return;
    const typeInfo = kabelTipe.find((t) => t.id === c.tipe_kabel_id);
    const color = typeInfo?.warna_hex || c.warna_hex || '#2563eb';

    // Halo / Outline Tepi Luar (memastikan kabel kontras di atas dinding)
    ctx.beginPath();
    ctx.moveTo(c.waypoints[0].x, c.waypoints[0].y);
    for (let i = 1; i < c.waypoints.length; i++) {
      ctx.lineTo(c.waypoints[i].x, c.waypoints[i].y);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5.0;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Garis Inti Kabel
    ctx.beginPath();
    ctx.moveTo(c.waypoints[0].x, c.waypoints[0].y);
    for (let i = 1; i < c.waypoints.length; i++) {
      ctx.lineTo(c.waypoints[i].x, c.waypoints[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Titik sambungan waypoint
    c.waypoints.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Badge Label Panjang Kabel di Kertas Putih
    const midIdx = Math.floor(c.waypoints.length / 2);
    const midPoint = c.waypoints[midIdx] || c.waypoints[0];

    ctx.save();
    ctx.translate(midPoint.x, midPoint.y);
    const label = `${c.kode_kabel} (${c.total_panjang_meter.toFixed(1)}m)`;
    ctx.font = 'bold 9px sans-serif';
    const tw = ctx.measureText(label).width;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.fillRect(-tw / 2 - 4, -7, tw + 8, 14);
    ctx.strokeRect(-tw / 2 - 4, -7, tw + 8, 14);

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // 7. GAMBAR DINDING (Hitam/Arsitektur Tegas dengan Ukuran Meter Tertera, Mendukung Lurus, Lengkung, Lingkaran)
  dinding.forEach((w) => {
    const wallThickness = Math.max(5, (w.ketebalan_cm / 100) * scalePxPerMeter);
    const strokeColor = w.warna === '#475569' ? '#0f172a' : w.warna || '#0f172a';

    // 1. DINDING LINGKARAN PENUH
    if (w.tipe_bentuk === 'lingkaran') {
      const radiusPx = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
      const diaM = (radiusPx * 2) / scalePxPerMeter;
      const kelilingM = (2 * Math.PI * radiusPx) / scalePxPerMeter;

      ctx.beginPath();
      ctx.arc(w.x1, w.y1, radiusPx, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = wallThickness;
      ctx.stroke();

      // Badge Ukuran Lingkaran di Kertas Putih
      const label = `Lingkaran: Dia ${formatMeasurement(diaM)} (Kll: ${formatMeasurement(kelilingM)})`;
      ctx.save();
      ctx.translate(w.x1, w.y1 - radiusPx - 10);
      ctx.font = 'bold 10px sans-serif';
      const tw = ctx.measureText(label).width;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.fillRect(-tw / 2 - 6, -9, tw + 12, 18);
      ctx.strokeRect(-tw / 2 - 6, -9, tw + 12, 18);

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
      return;
    }

    // 2. DINDING BUSUR / LENGKUNG
    if (w.tipe_bentuk === 'lengkung') {
      const chordPx = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
      const midX = (w.x1 + w.x2) / 2;
      const midY = (w.y1 + w.y2) / 2;
      const L = Math.max(1, chordPx);
      const nx = -(w.y2 - w.y1) / L;
      const ny = (w.x2 - w.x1) / L;
      const sagitta = w.kelengkungan || 35;

      const cpX = midX + nx * (sagitta * 2);
      const cpY = midY + ny * (sagitta * 2);
      const apexX = midX + nx * sagitta;
      const apexY = midY + ny * sagitta;

      const arcLenPx = Math.sqrt(L * L + (16 / 3) * sagitta * sagitta);
      const arcLenM = arcLenPx / scalePxPerMeter;
      const radiusM = (L * L / 4 + sagitta * sagitta) / (2 * Math.max(1, Math.abs(sagitta))) / scalePxPerMeter;

      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.quadraticCurveTo(cpX, cpY, w.x2, w.y2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = wallThickness;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Badge Ukuran Busur di Kertas Putih
      const label = `Busur: ${formatMeasurement(arcLenM)} (R: ${formatMeasurement(radiusM)})`;
      ctx.save();
      ctx.translate(apexX, apexY - 10);
      ctx.font = 'bold 10px sans-serif';
      const tw = ctx.measureText(label).width;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.fillRect(-tw / 2 - 6, -9, tw + 12, 18);
      ctx.strokeRect(-tw / 2 - 6, -9, tw + 12, 18);

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
      return;
    }

    // 3. DINDING LURUS STANDAR
    const wallLenPx = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
    const wallLenM = wallLenPx / scalePxPerMeter;

    // Garis Dinding Hitam Padat
    ctx.beginPath();
    ctx.moveTo(w.x1, w.y1);
    ctx.lineTo(w.x2, w.y2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = wallThickness;
    ctx.lineCap = 'square';
    ctx.stroke();

    // Badge Ukuran Dinding di Kertas Putih
    const midX = (w.x1 + w.x2) / 2;
    const midY = (w.y1 + w.y2) / 2;
    const angle = Math.atan2(w.y2 - w.y1, w.x2 - w.x1);

    ctx.save();
    ctx.translate(midX, midY);
    let textAngle = angle;
    if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
      textAngle += Math.PI;
    }
    ctx.rotate(textAngle);

    const label = formatMeasurement(wallLenM);
    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.fillRect(-textWidth / 2 - 4, -8, textWidth + 8, 16);
    ctx.strokeRect(-textWidth / 2 - 4, -8, textWidth + 8, 16);

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // 8. GAMBAR BUKAAN (Pintu Tunggal, Pintu Ganda, Pintu Geser, dan Jendela Kaca)
  bukaan.forEach((b) => {
    const widthPx = (b.lebar_cm / 100) * scalePxPerMeter;
    const halfW = widthPx / 2;
    ctx.save();
    ctx.translate(b.posisi_x, b.posisi_y);
    ctx.rotate((b.rotasi * Math.PI) / 180);

    if (b.tipe === 'pintu_tunggal') {
      // Kusen Hitam Tegas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfW - 3, -4, 6, 8);
      ctx.fillRect(halfW - 3, -4, 6, 8);

      // Daun Pintu
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.lineTo(-halfW, -widthPx);
      ctx.stroke();

      // Busur Ayunan Swing
      ctx.beginPath();
      ctx.arc(-halfW, 0, widthPx, -Math.PI / 2, 0, false);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (b.tipe === 'pintu_ganda') {
      // Kusen Pintu Ganda
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfW - 3, -4, 6, 8);
      ctx.fillRect(halfW - 3, -4, 6, 8);

      // Daun Kiri & Kanan
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.lineTo(-halfW, -halfW);
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, -halfW);
      ctx.stroke();

      // Dua Busur Swing
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(-halfW, 0, halfW, -Math.PI / 2, 0, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(halfW, 0, halfW, -Math.PI / 2, -Math.PI, true);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (b.tipe === 'pintu_geser') {
      // Pintu Geser / Sliding
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-halfW, -4, widthPx, 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-halfW, -4, widthPx, 8);

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-halfW + 3, -2);
      ctx.lineTo(2, -2);
      ctx.moveTo(-2, 2);
      ctx.lineTo(halfW - 3, 2);
      ctx.stroke();
    } else {
      // Jendela Kaca
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(-halfW, -4, widthPx, 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-halfW, -4, widthPx, 8);

      // Garis Kaca Ganda
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-halfW + 2, -1.5);
      ctx.lineTo(halfW - 2, -1.5);
      ctx.moveTo(-halfW + 2, 1.5);
      ctx.lineTo(halfW - 2, 1.5);
      ctx.stroke();
    }

    ctx.restore();
  });

  // 9. GAMBAR MEJA CLIENT & WORKSTATION
  furniture.forEach((item) => {
    const wPx = (item.lebar_cm / 100) * scalePxPerMeter;
    const hPx = (item.panjang_cm / 100) * scalePxPerMeter;

    ctx.save();
    ctx.translate(item.posisi_x, item.posisi_y);
    ctx.rotate((item.rotasi * Math.PI) / 180);

    // Permukaan Meja (Abu-abu Muda Kertas Kerja)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-wPx / 2, -hPx / 2, wPx, hPx, 3);
    ctx.fill();
    ctx.stroke();

    // Monitor & Keyboard
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-16, -hPx / 2 + 6, 32, 4);
    ctx.fillRect(-12, -hPx / 2 + 15, 24, 8);

    // Kursi
    ctx.beginPath();
    ctx.arc(0, hPx / 2 + 10, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    // Label Meja & Nama Client
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(item.label || 'Meja Client', 0, 0);

    if (item.pemilik_client) {
      ctx.font = '8px sans-serif';
      ctx.fillStyle = '#2563eb';
      ctx.fillText(item.pemilik_client, 0, 11);
    }
    ctx.restore();
  });

  // 10. GAMBAR PERANGKAT IT, RACK, SWITCH, CCTV, AP
  perangkat.forEach((dev) => {
    ctx.save();
    ctx.translate(dev.posisi_x, dev.posisi_y);
    ctx.rotate((dev.rotasi * Math.PI) / 180);

    if (dev.kategori === 'rack_server') {
      const rw = 0.8 * scalePxPerMeter;
      const rh = 1.0 * scalePxPerMeter;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-rw / 2, -rh / 2, rw, rh);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      for (let i = -rh / 2 + 6; i < rh / 2; i += 8) {
        ctx.beginPath();
        ctx.moveTo(-rw / 2 + 4, i);
        ctx.lineTo(rw / 2 - 4, i);
        ctx.stroke();
      }
    } else if (dev.kategori === 'switch') {
      const sw = 0.5 * scalePxPerMeter;
      const sh = 0.25 * scalePxPerMeter;
      ctx.fillStyle = '#334155';
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);

      ctx.fillStyle = '#10b981';
      for (let x = -sw / 2 + 6; x < sw / 2 - 6; x += 6) {
        ctx.fillRect(x, -sh / 2 + 4, 3, 3);
      }
    } else if (dev.kategori === 'cctv') {
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(14, 0);
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (dev.kategori === 'access_point') {
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#059669';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 6, -Math.PI / 4, Math.PI / 4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (dev.kategori === 'pc_client') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-9, -9, 18, 18);
    } else if (dev.kategori === 'printer') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(-12, -10, 24, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, -8, 14, 3);
      ctx.fillRect(-7, 5, 14, 3);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-12, -10, 24, 20);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
    }

    ctx.restore();

    // Label Nama Host & IP di Kertas Putih
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(dev.nama_perangkat, dev.posisi_x, dev.posisi_y + 17);

    if (dev.ip_address) {
      ctx.font = '8px monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText(dev.ip_address, dev.posisi_x, dev.posisi_y + 26);
    }
  });

  ctx.restore(); // Selesai translate denah

  // 11. KOP GAMBAR TEKNIK (ARCHITECTURAL TITLE BLOCK) DI BAWAH KERTAS
  const tbY = canvasHeight - 110;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(25, tbY, canvasWidth - 50, 90);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(25, tbY, canvasWidth - 50, 90);

  // Kolom 1: Informasi Proyek
  ctx.beginPath();
  ctx.moveTo(canvasWidth * 0.45, tbY);
  ctx.lineTo(canvasWidth * 0.45, tbY + 90);
  ctx.moveTo(canvasWidth * 0.72, tbY);
  ctx.lineTo(canvasWidth * 0.72, tbY + 90);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Teks Informasi Proyek
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText(proyek?.nama_proyek || 'DENAH BANGUNAN & INFRASTRUKTUR IT', 40, tbY + 28);

  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(`Lantai / Ruang: ${lantai?.nama_lantai || 'Lantai 1'}`, 40, tbY + 48);

  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Dimensi Denah: ${lantai?.lebar_meter || 20}m x ${lantai?.panjang_meter || 15}m`, 40, tbY + 68);

  // Kolom 2: Skala & Tanggal
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('SKALA DENAH:', canvasWidth * 0.45 + 20, tbY + 26);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#0284c7';
  ctx.fillText(`1 Meter = ${scalePxPerMeter} Pixels`, canvasWidth * 0.45 + 20, tbY + 44);

  // Batang Skala (Scale Bar 5 Meter) di Kop
  const barPx = (5 * scalePxPerMeter) / 2; // mini scale bar
  const sbX = canvasWidth * 0.45 + 20;
  const sbY = tbY + 68;
  ctx.beginPath();
  ctx.moveTo(sbX, sbY);
  ctx.lineTo(sbX + barPx, sbY);
  ctx.lineTo(sbX + barPx, sbY - 5);
  ctx.moveTo(sbX, sbY);
  ctx.lineTo(sbX, sbY - 5);
  ctx.moveTo(sbX + barPx / 5, sbY);
  ctx.lineTo(sbX + barPx / 5, sbY - 3);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('0', sbX - 2, sbY - 7);
  ctx.fillText('1m', sbX + barPx / 5 - 6, sbY - 7);
  ctx.fillText('5m', sbX + barPx - 8, sbY - 7);

  // Kolom 3: Legenda Kabel
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('LEGENDA KABEL:', canvasWidth * 0.72 + 20, tbY + 22);

  const legendCables = [
    { label: 'Cat6 LAN Data', color: '#2563eb' },
    { label: 'Cat6 CCTV PoE', color: '#f97316' },
    { label: 'Cat6A AP Wi-Fi', color: '#10b981' },
    { label: 'Fiber Optic SM', color: '#eab308' },
  ];

  legendCables.forEach((leg, idx) => {
    const lx = canvasWidth * 0.72 + 20 + (idx % 2) * 110;
    const ly = tbY + 42 + Math.floor(idx / 2) * 20;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 18, ly);
    ctx.strokeStyle = leg.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(leg.label, lx + 24, ly + 3);
  });

  return exportCanvas;
}
