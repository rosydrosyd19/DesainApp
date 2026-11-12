import React from 'react';
import {
  Lantai,
  Proyek,
  Dinding,
  Perangkat,
  KabelJalur,
  Furniture,
  DenahJiplakan,
} from '../types/schema.ts';
import {
  Monitor,
  ArrowDownLeft,
  Server,
  Cable,
  Square,
  FileSpreadsheet,
  Download,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  Unlock,
  RotateCw,
  Trash2,
  Compass,
  Upload,
  Grid,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';

interface StudioControlDeckProps {
  proyek: Proyek | null;
  lantai: Lantai | null;
  dinding: Dinding[];
  furniture: Furniture[];
  perangkat: Perangkat[];
  kabel: KabelJalur[];
  onDockBack: () => void;
  onOpenBomModal: () => void;
  onExportImage: (includeGrid?: boolean) => void;
  onSaveToDb: () => void;
  isSaving: boolean;
  jiplakan?: DenahJiplakan | null;
  onUpdateJiplakan?: (item: DenahJiplakan | null) => void;
  onUploadJiplakan?: (file: File) => void;
  onDeleteJiplakan?: () => void;
  isCalibratingTracing?: boolean;
  onStartCalibration?: () => void;
}

export const StudioControlDeck: React.FC<StudioControlDeckProps> = ({
  proyek,
  lantai,
  dinding,
  furniture,
  perangkat,
  kabel,
  onDockBack,
  onOpenBomModal,
  onExportImage,
  onSaveToDb,
  isSaving,
  jiplakan,
  onUpdateJiplakan,
  onUploadJiplakan,
  onDeleteJiplakan,
  isCalibratingTracing,
  onStartCalibration,
}) => {
  const deckFileInputRef = React.useRef<HTMLInputElement>(null);
  const totalPanjangKabel = kabel.reduce((sum, c) => sum + (c.total_panjang_meter || 0), 0);

  return (
    <div className="flex-1 h-full p-6 bg-slate-900/60 overflow-y-auto space-y-6 text-slate-100 select-none">
      {/* Banner Informasi Layar 2 Aktif (Responsif & Rapi) */}
      <div className="p-4 bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-xl">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30 shadow-inner shrink-0">
            <Monitor className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">
                Mode 2 Layar Aktif (Studio Immersion)
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                <span>Monitor 2 Terhubung</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Kanvas CAD aktif di monitor sekunder. Monitor utama ini berfungsi sebagai <strong>Pusat Kendali (Control Deck)</strong>, Katalog Komponen, dan Panel Properti.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDockBack}
          className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 hover:border-sky-500/50 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-lg transition shrink-0 cursor-pointer whitespace-nowrap self-start md:self-center"
          title="Kembalikan Kanvas CAD ke Jendela Utama Layar 1"
        >
          <ArrowDownLeft className="w-4 h-4 text-sky-400" />
          <span>Kembalikan ke Layar 1</span>
        </button>
      </div>

      {/* Kartu Ringkasan Statistik Denah */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Dinding & Struktur</span>
            <span className="text-base">🧱</span>
          </div>
          <div className="text-xl font-bold text-slate-100">{dinding.length} Segmen</div>
          <div className="text-[11px] text-slate-500">Tinggi Atap: {lantai?.tinggi_plafon_meter ?? 3.2}m</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Perangkat IT & Keamanan</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-sky-400">{perangkat.length} Unit</div>
          <div className="text-[11px] text-slate-500">Switch, Rack, CCTV, AP, PC</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Jalur Kabel Jaringan</span>
            <Cable className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{kabel.length} Tarikan</div>
          <div className="text-[11px] text-slate-500">Total: {totalPanjangKabel.toFixed(1)} Meter</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Meja & Workstation</span>
            <Square className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400">{furniture.length} Meja</div>
          <div className="text-[11px] text-slate-500">Staff & Client Workstation</div>
        </div>
      </div>

      {/* Panel Jiplakan Foto / Underlay Tracing di Layar 1 */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                jiplakan
                  ? jiplakan.is_visible
                    ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                    : 'bg-slate-800/80 text-slate-500 border-slate-700/60'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide whitespace-nowrap">
                  Jiplakan Foto & Cetak Biru Denah
                </span>
                {jiplakan && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 transition ${
                      jiplakan.is_visible
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {jiplakan.is_visible ? '● Aktif di Layar 2' : '○ Disembunyikan'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Foto latar belakang denah ditampilkan di monitor kedua sebagai acuan menggambar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              type="file"
              ref={deckFileInputRef}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onUploadJiplakan?.(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />

            {/* Tombol Tampilkan / Sembunyikan (Show & Hide) */}
            {jiplakan && (
              <button
                type="button"
                onClick={() => onUpdateJiplakan?.({ ...jiplakan, is_visible: !jiplakan.is_visible })}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border cursor-pointer ${
                  jiplakan.is_visible
                    ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/40'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                }`}
                title={jiplakan.is_visible ? 'Sembunyikan foto jiplakan dari kanvas' : 'Tampilkan kembali foto jiplakan di kanvas'}
              >
                {jiplakan.is_visible ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Sembunyikan</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Tampilkan Foto</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => deckFileInputRef.current?.click()}
              className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-pink-600/20 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{jiplakan ? 'Ganti Foto' : 'Unggah Foto Denah'}</span>
            </button>

            {jiplakan && (
              <button
                type="button"
                onClick={onDeleteJiplakan}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                title="Hapus Gambar Jiplakan dari Lantai Ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>

        {jiplakan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* 1. Slider Transparansi Opasitas */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Transparansi Gambar:</span>
                <span className="font-mono font-bold text-pink-400 bg-pink-950/50 px-2 py-0.5 rounded border border-pink-800/40 text-[10px]">
                  {Math.round((jiplakan.opacity ?? 0.6) * 100)}%
                </span>
              </div>
              <div className="h-[58px] flex flex-col justify-center px-1">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={jiplakan.opacity ?? 0.6}
                  onChange={(e) => onUpdateJiplakan?.({ ...jiplakan, opacity: parseFloat(e.target.value) })}
                  className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10% Tipis</span>
                <span>100% Jelas</span>
              </div>
            </div>

            {/* 2. Visibilitas (Show/Hide), Kunci Posisi & Rotasi Sudut */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Posisi & Visibilitas:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded border text-[10px] ${
                    jiplakan.is_visible
                      ? 'text-sky-400 bg-sky-950/50 border-sky-800/40'
                      : 'text-amber-400 bg-amber-950/50 border-amber-800/40'
                  }`}
                >
                  {jiplakan.is_visible ? 'Aktif' : 'Sembunyi'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Tombol Show/Hide */}
                <button
                  type="button"
                  onClick={() => onUpdateJiplakan?.({ ...jiplakan, is_visible: !jiplakan.is_visible })}
                  className={`py-2 px-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 border transition cursor-pointer min-h-[58px] ${
                    jiplakan.is_visible
                      ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40 shadow-sm'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                  }`}
                  title={jiplakan.is_visible ? 'Sembunyikan foto dari kanvas' : 'Tampilkan foto di kanvas'}
                >
                  {jiplakan.is_visible ? (
                    <Eye className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="text-[11px] leading-tight font-medium text-center">
                    {jiplakan.is_visible ? 'Tampil' : 'Sembunyi'}
                  </span>
                </button>

                {/* Tombol Kunci */}
                <button
                  type="button"
                  onClick={() => onUpdateJiplakan?.({ ...jiplakan, is_locked: !jiplakan.is_locked })}
                  className={`py-2 px-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 border transition cursor-pointer min-h-[58px] ${
                    jiplakan.is_locked
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                  title={jiplakan.is_locked ? 'Foto terkunci, tidak dapat digeser' : 'Foto bebas digeser di kanvas'}
                >
                  {jiplakan.is_locked ? (
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-[11px] leading-tight font-medium text-center">
                    {jiplakan.is_locked ? 'Terkunci' : 'Bebas'}
                  </span>
                </button>

                {/* Tombol Rotasi */}
                <button
                  type="button"
                  onClick={() => onUpdateJiplakan?.({ ...jiplakan, rotasi: ((jiplakan.rotasi || 0) + 90) % 360 })}
                  className="py-2 px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer min-h-[58px]"
                  title="Putar 90 Derajat Searah Jarum Jam"
                >
                  <RotateCw className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-[11px] leading-tight font-medium text-slate-200 text-center">
                    Putar ({jiplakan.rotasi || 0}°)
                  </span>
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{jiplakan.is_visible ? '● Kanvas Tampil' : '○ Disembunyikan'}</span>
                <span>{jiplakan.is_locked ? '🔒 Terkunci' : '🔓 Bebas Geser'}</span>
              </div>
            </div>

            {/* 3. Kalibrasi Skala 2 Titik Presisi */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Kalibrasi Skala CAD:</span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40 text-[10px]">
                  {jiplakan.skala ? `Skala ${(jiplakan.skala).toFixed(2)}x` : 'CAD 1:1'}
                </span>
              </div>
              <button
                type="button"
                onClick={onStartCalibration}
                className={`w-full h-[58px] rounded-xl text-xs font-semibold flex flex-col items-center justify-center space-y-1 border transition cursor-pointer ${
                  isCalibratingTracing
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 animate-pulse'
                    : 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border-emerald-800/60'
                }`}
                title="Kalibrasi 2 Titik Presisi di Kanvas Denah"
              >
                <Compass className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">
                  {isCalibratingTracing ? 'Klik 2 Titik di Kanvas...' : 'Kalibrasi Skala 2 Titik'}
                </span>
              </button>
              <div className="text-[10px] text-slate-500 leading-tight">
                Ukur 2 titik di kanvas untuk mencocokkan ke skala meter nyata.
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 border-2 border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-1 bg-slate-950/30">
            <p className="font-semibold text-slate-300">Belum ada foto jiplakan denah untuk lantai ini.</p>
            <p className="text-[11px] text-slate-500">
              Klik tombol "Unggah Foto Denah" di atas untuk memasukkan cetak biru arsitektur atau denah sketsa JPG/PNG.
            </p>
          </div>
        )}
      </div>

      {/* Aksi Cepat Dashboard (4 Kartu Seimbang & Proporsional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* 1. Laporan BOM */}
        <button
          type="button"
          onClick={onOpenBomModal}
          className="p-3.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex items-center space-x-3 transition group text-left shadow-lg cursor-pointer min-h-[76px]"
        >
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-105 transition shrink-0 border border-emerald-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition truncate">
              Laporan BOM & Rol
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              Rekap kabel & estimasi rol
            </div>
          </div>
        </button>

        {/* 2. Export Dengan Grid CAD */}
        <button
          type="button"
          onClick={() => onExportImage(true)}
          className="p-3.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl flex items-center space-x-3 transition group text-left shadow-lg cursor-pointer min-h-[76px]"
        >
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl group-hover:scale-105 transition shrink-0 border border-sky-500/20">
            <Grid className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition truncate">
              Export DENGAN Grid CAD
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              Petak 1m & 20cm acuan teknis
            </div>
          </div>
        </button>

        {/* 3. Export Tanpa Grid (Kertas Putih Polos) */}
        <button
          type="button"
          onClick={() => onExportImage(false)}
          className="p-3.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl flex items-center space-x-3 transition group text-left shadow-lg cursor-pointer min-h-[76px]"
        >
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-105 transition shrink-0 border border-cyan-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition truncate">
              Export Kertas Polos
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              Putih bersih presentasi klien
            </div>
          </div>
        </button>

        {/* 4. Simpan ke MariaDB */}
        <button
          type="button"
          onClick={onSaveToDb}
          disabled={isSaving}
          className="p-3.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 border border-sky-400/30 rounded-2xl flex items-center space-x-3 transition shadow-xl shadow-sky-600/20 text-left disabled:opacity-50 cursor-pointer min-h-[76px]"
        >
          <div className="p-2.5 bg-white/20 text-white rounded-xl shrink-0">
            <Save className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {isSaving ? 'Menyimpan...' : 'Simpan Seluruh Data'}
            </div>
            <div className="text-[11px] text-sky-100 truncate mt-0.5">
              Sinkronisasi ke database MariaDB
            </div>
          </div>
        </button>
      </div>

      {/* Tabel Ringkas Perangkat Terpasang */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Daftar Perangkat Terpasang di Denah ({perangkat.length} Host):</span>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Nama Perangkat</th>
                <th className="py-2 px-3">Kategori</th>
                <th className="py-2 px-3">Model / Merk</th>
                <th className="py-2 px-3 font-mono">IP Address</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {perangkat.slice(0, 8).map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/20">
                  <td className="py-1.5 px-3 font-semibold text-slate-200">{p.nama_perangkat}</td>
                  <td className="py-1.5 px-3 text-slate-400 uppercase text-[10px]">{p.kategori.replace('_', ' ')}</td>
                  <td className="py-1.5 px-3 text-slate-400">{p.model_merk || '-'}</td>
                  <td className="py-1.5 px-3 font-mono text-sky-400">{p.ip_address || '-'}</td>
                  <td className="py-1.5 px-3">
                    <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{p.status || 'aktif'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
