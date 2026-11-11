import React from 'react';
import {
  Lantai,
  Proyek,
  Dinding,
  Perangkat,
  KabelJalur,
  Furniture,
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
  onExportImage: () => void;
  onSaveToDb: () => void;
  isSaving: boolean;
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
}) => {
  const totalPanjangKabel = kabel.reduce((sum, c) => sum + (c.total_panjang_meter || 0), 0);

  return (
    <div className="flex-1 h-full p-6 bg-slate-900/60 overflow-y-auto space-y-6 text-slate-100 select-none">
      {/* Banner Informasi Layar 2 Aktif */}
      <div className="p-4 bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 border border-sky-500/30 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30 shadow-inner">
            <Monitor className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Mode 2 Layar (Studio Immersion) Sedang Berjalan</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Layar 2 Aktif
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kanvas CAD berada di monitor kedua Anda. Layar ini berfungsi sebagai <strong>Pusat Kendali (Control Deck)</strong>, Katalog Komponen, dan Panel Pengaturan Properti.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDockBack}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow transition hover:border-sky-500/40"
          title="Kembalikan Kanvas CAD ke Layar Ini"
        >
          <ArrowDownLeft className="w-4 h-4" />
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

      {/* Aksi Cepat Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onOpenBomModal}
          className="p-3.5 bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center space-x-3 transition group text-left"
        >
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-110 transition">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">Lihat Laporan BOM & Rol Kabel</div>
            <div className="text-[11px] text-slate-400">Kalkulasi vertikal & estimasi rol 305m</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onExportImage}
          className="p-3.5 bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center space-x-3 transition group text-left"
        >
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-lg group-hover:scale-110 transition">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">Export Blueprint Bersih (PNG)</div>
            <div className="text-[11px] text-slate-400">Format gambar kertas putih siap cetak</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onSaveToDb}
          disabled={isSaving}
          className="p-3.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 rounded-xl flex items-center space-x-3 transition shadow-lg text-left disabled:opacity-50"
        >
          <div className="p-2.5 bg-white/10 text-white rounded-lg">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">{isSaving ? 'Menyimpan...' : 'Simpan Seluruh Data'}</div>
            <div className="text-[11px] text-sky-200">Sinkronisasi ke database MariaDB</div>
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
