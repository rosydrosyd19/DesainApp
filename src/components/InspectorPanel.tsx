import React from 'react';
import {
  Dinding,
  Bukaan,
  Ruangan,
  Furniture,
  Perangkat,
  KabelJalur,
  KabelTipe,
} from '../types/schema.ts';
import { getDistance, formatMeasurement, calculatePolygonArea } from '../utils/geometry.ts';
import {
  Trash2,
  RotateCw,
  Info,
  Shield,
  Wifi,
  Video,
  Cable,
  Square,
  Circle,
  Network,
  DoorOpen,
  Layers,
  Palette,
  Tag,
  Maximize2,
  X,
  Plus,
  Minus,
  Shapes,
  Grid,
  Copy,
  ArrowUpDown,
  Move,
  Server,
} from 'lucide-react';
import { Point } from '../types/schema.ts';

interface InspectorPanelProps {
  selectedItem: { type: string; id: string } | null;
  selectedItems?: Array<{ type: string; id: string }>;
  dinding: Dinding[];
  bukaan: Bukaan[];
  ruangan?: Ruangan[];
  furniture: Furniture[];
  perangkat: Perangkat[];
  kabel: KabelJalur[];
  kabelTipe: KabelTipe[];
  scalePxPerMeter: number;
  tinggiPlafon?: number;
  onUpdateDinding: (items: Dinding[]) => void;
  onUpdateBukaan: (items: Bukaan[]) => void;
  onUpdateRuangan?: (items: Ruangan[]) => void;
  onUpdateFurniture: (items: Furniture[]) => void;
  onUpdatePerangkat: (items: Perangkat[]) => void;
  onUpdateKabel: (items: KabelJalur[]) => void;
  onDeleteSelected: () => void;
  onDuplicate?: () => void;
  onAlign?: (
    alignment: 'left' | 'center_h' | 'right' | 'top' | 'center_v' | 'bottom' | 'distribute_h' | 'distribute_v'
  ) => void;
  onSelectItem?: (item: { type: string; id: string } | null) => void;
  onClose?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedItem,
  selectedItems,
  dinding,
  bukaan,
  ruangan,
  furniture,
  perangkat,
  kabel,
  kabelTipe,
  scalePxPerMeter,
  tinggiPlafon = 3.2,
  onUpdateDinding,
  onUpdateBukaan,
  onUpdateRuangan,
  onUpdateFurniture,
  onUpdatePerangkat,
  onUpdateKabel,
  onDeleteSelected,
  onDuplicate,
  onAlign,
  onSelectItem,
  onClose,
}) => {
  // 0. INSPECTOR MULTI-SELEKSI BANYAK OBJEK SEKALIGUS
  if (selectedItem?.type === 'multi' || (selectedItems && selectedItems.length > 1)) {
    const items = selectedItems || [];
    const countWalls = items.filter((i) => i.type === 'wall').length;
    const countOpenings = items.filter((i) => i.type === 'bukaan').length;
    const countFurn = items.filter((i) => i.type === 'furniture').length;
    const countDevs = items.filter((i) => i.type === 'perangkat').length;
    const countCables = items.filter((i) => i.type === 'kabel').length;
    const countRooms = items.filter((i) => i.type === 'ruangan').length;

    return (
      <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/30">
              {items.length}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                Multi-Seleksi Objek
              </div>
              <div className="text-[10px] text-slate-400">{items.length} objek aktif terpilih</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onDuplicate && (
              <button
                type="button"
                onClick={onDuplicate}
                className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                title="Duplikat Semua Objek Terpilih (Ctrl+D)"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Hapus Semua Terpilih (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Tutup Panel Inspector [ ] ]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1.5">
              Rincian Objek Terpilih
            </div>
            {countWalls > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>🧱 Dinding Bangunan:</span>
                <span className="font-bold text-sky-400">{countWalls} buah</span>
              </div>
            )}
            {countOpenings > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>🚪 Pintu & Jendela:</span>
                <span className="font-bold text-amber-400">{countOpenings} buah</span>
              </div>
            )}
            {countDevs > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>🖥️ Perangkat IT & CCTV:</span>
                <span className="font-bold text-emerald-400">{countDevs} buah</span>
              </div>
            )}
            {countFurn > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>🪑 Meja & Furniture:</span>
                <span className="font-bold text-purple-400">{countFurn} buah</span>
              </div>
            )}
            {countCables > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>⚡ Jalur Kabel Jaringan:</span>
                <span className="font-bold text-cyan-400">{countCables} jalur</span>
              </div>
            )}
            {countRooms > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>🏷️ Zonasi Ruangan:</span>
                <span className="font-bold text-rose-400">{countRooms} area</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-sky-950/20 border border-sky-900/30 rounded-xl text-[11px] text-sky-300 space-y-1.5">
            <div className="font-bold flex items-center space-x-1">
              <span>💡 Aksi Multi-Seleksi:</span>
            </div>
            <p>• <strong>Geser Bersamaan</strong>: Klik & drag salah satu objek di denah untuk memindahkan seluruh {items.length} objek serentak.</p>
            <p>• <strong>Hapus Bersamaan</strong>: Tekan tombol <code>Delete</code> / <code>Backspace</code> pada keyboard.</p>
            <p>• <strong>Batal Seleksi</strong>: Tekan <code>Escape</code> atau klik area kanvas kosong.</p>
          </div>

          {/* Tombol Duplikat Grup Objek Terpilih */}
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="w-full py-2.5 bg-sky-600/25 hover:bg-sky-600/35 text-sky-200 border border-sky-500/40 rounded-xl font-medium flex items-center justify-center space-x-1.5 transition shadow cursor-pointer"
            >
              <Copy className="w-4 h-4 text-sky-400" />
              <span>Duplikat Semua Terpilih (Ctrl+D)</span>
            </button>
          )}

          {/* Kartu Perataan Objek (Align & Distribute) */}
          {onAlign && countFurn + countDevs + countOpenings >= 2 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Ratakan Objek (Align)</span>
                <span className="text-[10px] text-sky-400 font-normal">Furniture & Perangkat</span>
              </div>

              {/* Rata Horisontal */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onAlign('left')}
                  className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-medium border border-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Ratakan ke Sisi Paling Kiri"
                >
                  ⇤ Kiri
                </button>
                <button
                  type="button"
                  onClick={() => onAlign('center_h')}
                  className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-medium border border-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Ratakan ke Titik Tengah Horisontal"
                >
                  Tengah H
                </button>
                <button
                  type="button"
                  onClick={() => onAlign('right')}
                  className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-medium border border-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Ratakan ke Sisi Paling Kanan"
                >
                  Kanan ⇥
                </button>
              </div>

              {/* Rata Vertikal */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onAlign('top')}
                  className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-medium border border-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Ratakan ke Sisi Paling Atas"
                >
                  ⤒ Atas
                </button>
                <button
                  type="button"
                  onClick={() => onAlign('center_v')}
                  className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-medium border border-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Ratakan ke Titik Tengah Vertikal"
                >
                  Tengah V
                </button>
                <button
                  type="button"
                  onClick={() => onAlign('bottom')}
                  className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-medium border border-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Ratakan ke Sisi Paling Bawah"
                >
                  Bawah ⤓
                </button>
              </div>

              {/* Bagi Rata Jarak (Distribute Evenly) */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onAlign('distribute_h')}
                  className="py-1.5 px-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-750 flex items-center justify-center transition cursor-pointer"
                  title="Bagi Rata Jarak Antar Objek Secara Horisontal"
                >
                  ↔ Bagi Rata Horisontal
                </button>
                <button
                  type="button"
                  onClick={() => onAlign('distribute_v')}
                  className="py-1.5 px-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-750 flex items-center justify-center transition cursor-pointer"
                  title="Bagi Rata Jarak Antar Objek Secara Vertikal"
                >
                  ↕ Bagi Rata Vertikal
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onDeleteSelected}
            className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl font-medium flex items-center justify-center space-x-1.5 transition shadow"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua Objek Terpilih ({items.length})</span>
          </button>
        </div>
      </aside>
    );
  }

  // Jika belum ada objek yang dipilih:
  if (!selectedItem) {
    return (
      <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 text-slate-400 flex flex-col justify-between relative">
        <div className="flex justify-between items-center w-full border-b border-slate-800 pb-2.5">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Inspector Properti</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Tutup Panel Inspector [ ] ]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center text-center my-auto">
          <Info className="w-10 h-10 mb-2 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">Belum Ada Objek Dipilih</p>
          <p className="text-xs text-slate-500 mt-1">
            Klik salah satu objek di denah, atau tarik kotak seleksi (Marquee Drag) untuk memilih & memindahkan banyak objek sekaligus.
          </p>
        </div>
        <div className="text-center text-[10px] text-slate-600 border-t border-slate-800/80 pt-2">
          Tekan tombol <span className="text-slate-400 font-mono">[ ] ]</span> untuk tutup/buka panel
        </div>
      </aside>
    );
  }

  // 0.5 INSPECTOR ZONASI RUANGAN & AREA (RUANGAN)
  if (selectedItem.type === 'ruangan') {
    const room = ruangan?.find((r) => r.id === selectedItem.id);
    if (!room) return null;

    const xs = room.polygon_points?.map((p) => p.x) || [0, 100];
    const ys = room.polygon_points?.map((p) => p.y) || [0, 100];
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const widthM = Number(((maxX - minX) / scalePxPerMeter).toFixed(2));
    const lengthM = Number(((maxY - minY) / scalePxPerMeter).toFixed(2));
    const areaM2 = calculatePolygonArea(room.polygon_points, scalePxPerMeter);

    const handleNameChange = (name: string) => {
      if (onUpdateRuangan && ruangan) {
        onUpdateRuangan(ruangan.map((r) => (r.id === room.id ? { ...r, nama_ruangan: name } : r)));
      }
    };

    const handleColorChange = (color: string) => {
      if (onUpdateRuangan && ruangan) {
        onUpdateRuangan(ruangan.map((r) => (r.id === room.id ? { ...r, warna_area: color } : r)));
      }
    };

    const handleDimensionChange = (newWidthM: number, newLengthM: number) => {
      if (onUpdateRuangan && ruangan && newWidthM > 0 && newLengthM > 0) {
        const newWidthPx = newWidthM * scalePxPerMeter;
        const newLengthPx = newLengthM * scalePxPerMeter;
        const updatedPoints = [
          { x: minX, y: minY },
          { x: minX + newWidthPx, y: minY },
          { x: minX + newWidthPx, y: minY + newLengthPx },
          { x: minX, y: minY + newLengthPx },
        ];
        onUpdateRuangan(ruangan.map((r) => (r.id === room.id ? { ...r, polygon_points: updatedPoints } : r)));
      }
    };

    const handleAddVertex = () => {
      if (!onUpdateRuangan || !ruangan) return;
      const pts = room.polygon_points || [];
      if (pts.length < 3) return;
      // Tambahkan titik baru di tengah antara titik 0 dan 1
      const mid: Point = {
        x: Math.round((pts[0].x + pts[1].x) / 2 + 20),
        y: Math.round((pts[0].y + pts[1].y) / 2 + 20),
      };
      const updated = [pts[0], mid, ...pts.slice(1)];
      onUpdateRuangan(ruangan.map((r) => (r.id === room.id ? { ...r, polygon_points: updated } : r)));
    };

    const handleRemoveVertex = () => {
      if (!onUpdateRuangan || !ruangan) return;
      const pts = room.polygon_points || [];
      if (pts.length <= 3) return;
      const updated = pts.slice(0, pts.length - 1);
      onUpdateRuangan(ruangan.map((r) => (r.id === room.id ? { ...r, polygon_points: updated } : r)));
    };

    const handleApplyPreset = (preset: 'box' | 'l_shape' | 't_shape' | 'trapezoid') => {
      if (!onUpdateRuangan || !ruangan) return;
      const wPx = Math.max(100, maxX - minX);
      const hPx = Math.max(100, maxY - minY);
      let newPts: Point[] = [];
      if (preset === 'box') {
        newPts = [
          { x: minX, y: minY },
          { x: minX + wPx, y: minY },
          { x: minX + wPx, y: minY + hPx },
          { x: minX, y: minY + hPx },
        ];
      } else if (preset === 'l_shape') {
        newPts = [
          { x: minX, y: minY },
          { x: minX + wPx, y: minY },
          { x: minX + wPx, y: minY + hPx * 0.5 },
          { x: minX + wPx * 0.5, y: minY + hPx * 0.5 },
          { x: minX + wPx * 0.5, y: minY + hPx },
          { x: minX, y: minY + hPx },
        ];
      } else if (preset === 't_shape') {
        newPts = [
          { x: minX + wPx * 0.3, y: minY },
          { x: minX + wPx * 0.7, y: minY },
          { x: minX + wPx * 0.7, y: minY + hPx * 0.4 },
          { x: minX + wPx, y: minY + hPx * 0.4 },
          { x: minX + wPx, y: minY + hPx },
          { x: minX, y: minY + hPx },
          { x: minX, y: minY + hPx * 0.4 },
          { x: minX + wPx * 0.3, y: minY + hPx * 0.4 },
        ];
      } else if (preset === 'trapezoid') {
        newPts = [
          { x: minX + wPx * 0.2, y: minY },
          { x: minX + wPx * 0.8, y: minY },
          { x: minX + wPx, y: minY + hPx },
          { x: minX, y: minY + hPx },
        ];
      }
      onUpdateRuangan(ruangan.map((r) => (r.id === room.id ? { ...r, polygon_points: newPts } : r)));
    };

    const colorPresets = [
      { name: 'Server Red', val: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
      { name: 'Sky Office', val: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8' },
      { name: 'Amber Meeting', val: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
      { name: 'Green Reception', val: 'rgba(34, 197, 94, 0.15)', border: '#22c55e' },
      { name: 'Purple Restroom', val: 'rgba(168, 85, 247, 0.15)', border: '#a855f7' },
      { name: 'Slate Storage', val: 'rgba(100, 116, 139, 0.15)', border: '#64748b' },
    ];

    return (
      <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                Zonasi Ruang & Area
              </div>
              <div className="text-[10px] text-slate-400">{room.id}</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onDuplicate && (
              <button
                type="button"
                onClick={onDuplicate}
                className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                title="Duplikat Ruangan Ini (Ctrl+D)"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Hapus Ruangan (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Tutup Panel Inspector [ ] ]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Nama Ruangan */}
          <div>
            <label className="text-slate-400 block mb-1 font-medium flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              <span>Nama Ruangan / Label Area</span>
            </label>
            <input
              type="text"
              value={room.nama_ruangan}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
              placeholder="Contoh: Ruang Server, Ruang Staff, Aula..."
            />
            {/* Petunjuk & Reset Posisi Label */}
            <div className="mt-1.5 flex items-center justify-between p-2 rounded-lg bg-sky-950/30 border border-sky-800/30 text-[10px]">
              <span className="text-slate-300">
                {Boolean(room.label_offset_x || room.label_offset_y) ? '📍 Posisi label digeser manual' : '📍 Label di titik tengah ruangan'}
              </span>
              {Boolean(room.label_offset_x || room.label_offset_y) ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateRuangan && ruangan) {
                      onUpdateRuangan(
                        ruangan.map((r) =>
                          r.id === room.id ? { ...r, label_offset_x: 0, label_offset_y: 0 } : r
                        )
                      );
                    }
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  title="Kembalikan posisi teks label ke dalam ruangan secara otomatis"
                >
                  Reset ke Tengah
                </button>
              ) : (
                <span className="text-slate-500 italic">Geser label di denah</span>
              )}
            </div>
          </div>

          {/* Pengaturan Ukuran Lebar & Panjang */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Dimensi Ruangan (Meter)</span>
              <span className="text-amber-400 font-mono font-bold">{areaM2} m²</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Lebar (m):</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="100"
                  value={widthM}
                  onChange={(e) => handleDimensionChange(parseFloat(e.target.value) || 1, lengthM)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-center focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Panjang (m):</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="100"
                  value={lengthM}
                  onChange={(e) => handleDimensionChange(widthM, parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-center focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
              <span>Estimasi Luas Area:</span>
              <span className="font-bold text-sky-400 font-mono">{areaM2} Meter Persegi</span>
            </div>
          </div>

          {/* Kelola Titik Sudut Poligon (L, T, U, N-Sudut) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Shapes className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Titik Sudut ({room.polygon_points?.length || 4} Sudut)</span>
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleAddVertex}
                  className="px-2 py-0.5 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 rounded text-[10px] font-bold border border-fuchsia-500/40 flex items-center space-x-0.5 transition cursor-pointer"
                  title="Tambah 1 titik sudut baru di poligon"
                >
                  <Plus className="w-3 h-3" />
                  <span>Sudut</span>
                </button>
                {(room.polygon_points?.length || 0) > 3 && (
                  <button
                    type="button"
                    onClick={handleRemoveVertex}
                    className="px-1.5 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-[10px] font-bold border border-rose-500/40 flex items-center space-x-0.5 transition cursor-pointer"
                    title="Hapus titik sudut terakhir"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Ubah ke bentuk standar atau tarik nomor titik (1, 2, 3...) di kanvas:
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('box')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-700/80 transition text-left cursor-pointer"
              >
                ⬛ Kotak (4 Titik)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('l_shape')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-fuchsia-300 rounded-lg text-[10px] font-medium border border-slate-700/80 transition text-left cursor-pointer"
              >
                📐 L-Shape (6 Titik)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('t_shape')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[10px] font-medium border border-slate-700/80 transition text-left cursor-pointer"
              >
                🔲 T-Shape (8 Titik)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('trapezoid')}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[10px] font-medium border border-slate-700/80 transition text-left cursor-pointer"
              >
                🔺 Trapesium / Miring
              </button>
            </div>
          </div>

          {/* Pilihan Warna Zonasi */}
          <div>
            <label className="text-slate-400 block mb-1 font-medium flex items-center space-x-1">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Warna Penanda Zona:</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleColorChange(preset.val)}
                  className={`p-1.5 rounded-lg border text-[10px] text-left transition flex items-center space-x-1.5 ${
                    room.warna_area === preset.val
                      ? 'border-sky-400 bg-sky-500/20 text-white font-semibold shadow'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border"
                    style={{ backgroundColor: preset.border, borderColor: '#ffffff' }}
                  />
                  <span className="truncate">{preset.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Panduan Interaktif Kanvas */}
          <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-sky-400 flex items-center space-x-1">
              <span>💡 Panduan Interaktif di Denah:</span>
            </div>
            <p>• <strong>Titik Sudut (1..N)</strong>: Klik & drag lingkaran nomor sudut di denah untuk membentuk ruangan bersudut L, T, miring, pilar, dsb.</p>
            <p>• <strong>Bodi Ruangan</strong>: Klik & drag area tengah ruangan untuk memindahkan posisi ke ruangan lain.</p>
          </div>
        </div>
      </aside>
    );
  }

  // 1. INSPECTOR PERANGKAT IT / CCTV / AP / SWITCH
  if (selectedItem.type === 'perangkat') {
    const dev = perangkat.find((p) => p.id === selectedItem.id);
    if (!dev) return null;

    const handleChange = (field: keyof Perangkat, value: any) => {
      onUpdatePerangkat(
        perangkat.map((p) => (p.id === dev.id ? { ...p, [field]: value } : p))
      );
    };

    return (
      <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            {dev.kategori === 'cctv' && <Video className="w-5 h-5 text-orange-400" />}
            {dev.kategori === 'access_point' && <Wifi className="w-5 h-5 text-emerald-400" />}
            {dev.kategori === 'switch' && <Network className="w-5 h-5 text-cyan-400" />}
            {dev.kategori === 'rack_server' && <Shield className="w-5 h-5 text-blue-400" />}
            <div>
              <div className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                {dev.kategori.replace('_', ' ')}
              </div>
              <div className="text-[10px] text-slate-400">{dev.id}</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onDuplicate && (
              <button
                type="button"
                onClick={onDuplicate}
                className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                title="Duplikat Perangkat Ini (Ctrl+D)"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Hapus Perangkat (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Tutup Panel Inspector [ ] ]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Badge info: switch terpasang di rack mana */}
          {dev.rack_id && (() => {
            const parentRack = perangkat.find((p) => p.id === dev.rack_id);
            return parentRack ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/50">
                <div className="flex items-center space-x-1.5">
                  <Server className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-sky-300 font-semibold">Terpasang di Server Rack:</div>
                    <div className="text-[11px] text-white font-bold truncate max-w-[140px]">{parentRack.nama_perangkat}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <button
                    type="button"
                    onClick={() => onSelectItem?.({ type: 'perangkat', id: parentRack.id })}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold px-2 py-0.5 rounded hover:bg-sky-900/50 transition cursor-pointer border border-sky-800/50"
                    title={`Buka properti ${parentRack.nama_perangkat}`}
                  >
                    Buka Rack
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdatePerangkat(
                        perangkat.map((p) =>
                          p.id === dev.id
                            ? {
                                ...p,
                                rack_id: null,
                                rack_u_position: null,
                                posisi_x: parentRack.posisi_x + 60,
                                posisi_y: parentRack.posisi_y + 15,
                              }
                            : p
                        )
                      );
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-950/40 transition cursor-pointer"
                    title="Lepaskan dari rack, kembali ke lantai"
                  >
                    Lepas dari Rack
                  </button>
                </div>
              </div>
            ) : null;
          })()}
          <div>
            <label className="text-slate-400 block mb-1">Nama Perangkat / Hostname</label>
            <input
              type="text"
              value={dev.nama_perangkat}
              onChange={(e) => handleChange('nama_perangkat', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Model / Merk</label>
            <input
              type="text"
              value={dev.model_merk}
              onChange={(e) => handleChange('model_merk', e.target.value)}
              placeholder="Contoh: Cisco Catalyst / Hikvision 4MP"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">IP Address</label>
              <input
                type="text"
                value={dev.ip_address}
                onChange={(e) => handleChange('ip_address', e.target.value)}
                placeholder="192.168.1.xxx"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">MAC Address</label>
              <input
                type="text"
                value={dev.mac_address}
                onChange={(e) => handleChange('mac_address', e.target.value)}
                placeholder="00:1A:2B:..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Pengaturan Khusus CCTV */}
          {dev.kategori === 'cctv' && (
            <div className="p-3 bg-orange-950/20 border border-orange-900/40 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-orange-400 flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5" />
                <span>Pengaturan Lensa & Jarak CCTV</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Sudut Pandang (FOV)</span>
                  <span className="font-semibold text-orange-400">{dev.cctv_fov_angle || 75}°</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="120"
                  step="5"
                  value={dev.cctv_fov_angle || 75}
                  onChange={(e) => handleChange('cctv_fov_angle', parseFloat(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Jarak Pengawasan Efektif</span>
                  <span className="font-semibold text-orange-400">{dev.cctv_jarak_meter || 12} Meter</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={dev.cctv_jarak_meter || 12}
                  onChange={(e) => handleChange('cctv_jarak_meter', parseFloat(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>
          )}

          {/* Pengaturan Khusus Access Point */}
          {dev.kategori === 'access_point' && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                <Wifi className="w-3.5 h-3.5" />
                <span>Cakupan Sinyal Wi-Fi (Heatmap)</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Radius Jangkauan Sinyal</span>
                  <span className="font-semibold text-emerald-400">{dev.ap_radius_meter || 12} Meter</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={dev.ap_radius_meter || 12}
                  onChange={(e) => handleChange('ap_radius_meter', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Pengaturan Khusus Server Rack: 42U Elevation & Virtual Switch Mounting */}
          {dev.kategori === 'rack_server' && (
            <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-blue-400 flex items-center space-x-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>Isi Rack Server (42U Elevation)</span>
                </div>
                <div className="text-[10px] text-blue-300 font-mono bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800/40">
                  {dev.rack_total_u || 42}U
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Ukuran Kapasitas Rak (U)</label>
                <select
                  value={dev.rack_total_u || 42}
                  onChange={(e) => handleChange('rack_total_u', parseInt(e.target.value, 10))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value={42}>42U (Standing Server Rack)</option>
                  <option value={24}>24U (Standing Rack)</option>
                  <option value={15}>15U (Wallmount / Standing)</option>
                  <option value={12}>12U (Wallmount Rack)</option>
                  <option value={9}>9U (Wallmount Rack)</option>
                  <option value={6}>6U (Wallmount Mini)</option>
                </select>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed">
                💡 <strong>Solusi Ruang Denah:</strong> Switch dan perangkat IT dipasang ke dalam rack ini secara virtual. Denah tetap bersih dan kabel otomatis terhubung ke rack.
              </div>

              {/* Daftar Switch yang Terpasang */}
              {(() => {
                const mounted = perangkat.filter((p) => p.rack_id === dev.id);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                      <span>Perangkat Terpasang ({mounted.length} Unit):</span>
                    </div>

                    {mounted.length === 0 ? (
                      <div className="p-2.5 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 text-center text-[10px] text-slate-400">
                        Belum ada switch yang dipasang di rack ini.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {mounted.map((m, idx) => (
                          <div
                            key={m.id}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/40">
                                U{m.rack_u_position || (42 - idx * 2)}
                              </span>
                              <div className="min-w-0 truncate">
                                <div className="font-semibold text-slate-200 truncate">{m.nama_perangkat}</div>
                                <div className="text-[10px] text-slate-400">{m.model_merk || m.kategori}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0 ml-1">
                              {/* Tombol Buka: pilih switch ini di Inspector */}
                              <button
                                type="button"
                                onClick={() => onSelectItem?.({ type: 'perangkat', id: m.id })}
                                className="text-[10px] text-sky-400 hover:text-sky-300 px-1.5 py-0.5 rounded hover:bg-sky-950/40 transition cursor-pointer font-semibold"
                                title={`Buka properti ${m.nama_perangkat} di Inspector`}
                              >
                                Buka
                              </button>
                              {/* Tombol Lepas */}
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdatePerangkat(
                                    perangkat.map((p) =>
                                      p.id === m.id
                                        ? {
                                            ...p,
                                            rack_id: null,
                                            rack_u_position: null,
                                            posisi_x: dev.posisi_x + 60,
                                            posisi_y: dev.posisi_y + 15,
                                          }
                                        : p
                                    )
                                  );
                                }}
                                className="text-[10px] text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-rose-950/40 transition cursor-pointer"
                                title="Keluarkan dari Rack dan kembalikan ke lantai"
                              >
                                Lepas
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pasang Switch ke Rack Ini */}
                    <div className="pt-2 border-t border-slate-800">
                      <label className="text-[10px] text-slate-400 block mb-1">
                        + Pasang Switch / Server ke Rack:
                      </label>
                      <select
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-[11px] focus:outline-none focus:border-sky-500 cursor-pointer"
                        defaultValue=""
                        onChange={(e) => {
                          const targetId = e.target.value;
                          if (!targetId) return;
                          const nextU = Math.max(1, 42 - mounted.length * 2);
                          onUpdatePerangkat(
                            perangkat.map((p) =>
                              p.id === targetId
                                ? {
                                    ...p,
                                    rack_id: dev.id,
                                    rack_u_position: nextU,
                                    posisi_x: dev.posisi_x,
                                    posisi_y: dev.posisi_y,
                                  }
                                : p
                            )
                          );
                          e.target.value = '';
                        }}
                      >
                        <option value="">Pilih Switch yang tersedia...</option>
                        {perangkat
                          .filter(
                            (p) =>
                              p.id !== dev.id &&
                              p.rack_id !== dev.id &&
                              (p.kategori === 'switch' ||
                                p.kategori === 'server' ||
                                p.kategori === 'patch_panel' ||
                                p.kategori === 'nvr_dvr')
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nama_perangkat} ({p.model_merk || p.kategori})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Pengaturan Khusus Switch Network: Kapasitas Port & Routing Kabel Otomatis + Catatan Manual */}
          {dev.kategori === 'switch' && (
            <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-cyan-400 flex items-center space-x-1.5">
                  <Network className="w-3.5 h-3.5" />
                  <span>Daftar Port & Rute Kabel</span>
                </div>
                <div className="text-[10px] text-cyan-300/80 bg-cyan-900/40 px-2 py-0.5 rounded-full border border-cyan-800/50">
                  Auto-Detect + Note
                </div>
              </div>

              {/* Penampung Server Rack (Opsional) */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Pasang ke Server Rack (Opsional)</label>
                <select
                  value={dev.rack_id || ''}
                  onChange={(e) => {
                    const rId = e.target.value || null;
                    handleChange('rack_id', rId);
                    if (rId) {
                      const rDev = perangkat.find((p) => p.id === rId);
                      if (rDev) {
                        handleChange('posisi_x', rDev.posisi_x);
                        handleChange('posisi_y', rDev.posisi_y);
                      }
                    } else if (dev.rack_id) {
                      const oldRack = perangkat.find((p) => p.id === dev.rack_id);
                      if (oldRack) {
                        handleChange('posisi_x', oldRack.posisi_x + 60);
                        handleChange('posisi_y', oldRack.posisi_y + 15);
                      }
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">Tidak terpasang di Rack (Stand-alone di Meja/Dinding)</option>
                  {perangkat
                    .filter((p) => p.kategori === 'rack_server' && p.id !== dev.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        🏢 {r.nama_perangkat} ({r.rack_total_u || 42}U Rack)
                      </option>
                    ))}
                </select>
              </div>

              {/* Pilihan Jumlah Port Switch */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kapasitas Port Switch</label>
                <select
                  value={dev.switch_total_port || 24}
                  onChange={(e) => handleChange('switch_total_port', parseInt(e.target.value, 10))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value={8}>8 Port (Switch Ruangan / Edge)</option>
                  <option value={16}>16 Port (Switch Distribusi Kecil)</option>
                  <option value={24}>24 Port (Standar Rak Server)</option>
                  <option value={48}>48 Port (High-Density Core/Distribution)</option>
                </select>
              </div>

              {/* Ringkasan Port Terpakai vs Kosong */}
              {(() => {
                const totalPorts = dev.switch_total_port || 24;
                const connectedCables = kabel.filter(
                  (c) => c.perangkat_asal_id === dev.id || c.perangkat_tujuan_id === dev.id
                );
                const usedCount = connectedCables.length;
                const freeCount = Math.max(0, totalPorts - usedCount);

                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Terhubung (Kabel)</div>
                        <div className="text-cyan-400 font-bold text-sm">
                          {usedCount} <span className="text-[10px] font-normal text-slate-400">Port</span>
                        </div>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Tersedia (Kosong)</div>
                        <div className="text-emerald-400 font-bold text-sm">
                          {freeCount} <span className="text-[10px] font-normal text-slate-400">Port</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 leading-relaxed">
                      💡 <strong>Sistem Hybrid Cerdas:</strong> Tujuan perangkat terdeteksi otomatis dari jalur kabel fisik. Anda dapat menambahkan catatan port (VLAN, nama ruangan, atau uplink) di bawah ini:
                    </div>

                    {/* Daftar Port 1 sampai totalPorts */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border border-slate-800/80 rounded-lg p-1.5 bg-slate-950/40">
                      {Array.from({ length: totalPorts }, (_, idx) => {
                        const portNum = idx + 1;
                        const cable = connectedCables[idx];
                        let targetDeviceName = '';
                        let cableInfo = '';

                        if (cable) {
                          const targetId =
                            cable.perangkat_asal_id === dev.id ? cable.perangkat_tujuan_id : cable.perangkat_asal_id;
                          const targetDev = perangkat.find((p) => p.id === targetId);
                          targetDeviceName = targetDev
                            ? `${targetDev.nama_perangkat} (${targetDev.kategori})`
                            : 'Perangkat Terpasang';
                          const kt = kabelTipe.find((t) => t.id === cable.tipe_kabel_id);
                          cableInfo = `${kt?.nama_tipe || 'UTP'} • ${cable.total_panjang_meter.toFixed(1)}m`;
                        }

                        const currentNote = (dev.port_notes && dev.port_notes[portNum]) || '';

                        return (
                          <div
                            key={portNum}
                            className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-300 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                                Port {portNum}
                              </span>
                              {cable ? (
                                <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[170px]">
                                  ● {targetDeviceName}
                                </span>
                              ) : (
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
                                  Kosong (Spare)
                                </span>
                              )}
                            </div>

                            {cable && (
                              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                                <span className="truncate max-w-[110px]">{cable.kode_kabel}</span>
                                <span className="font-mono text-slate-300">{cableInfo}</span>
                              </div>
                            )}

                            <div>
                              <input
                                type="text"
                                value={currentNote}
                                placeholder="Note: misal VLAN 10, Keuangan, Uplink L2..."
                                onChange={(e) => {
                                  const updatedNotes = { ...(dev.port_notes || {}) };
                                  if (e.target.value.trim() === '') {
                                    delete updatedNotes[portNum];
                                  } else {
                                    updatedNotes[portNum] = e.target.value;
                                  }
                                  handleChange('port_notes', updatedNotes);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-[11px] placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Rotasi Arah Hadap */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Arah Rotasi</span>
              <span className="text-sky-400">{dev.rotasi}°</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={dev.rotasi}
                onChange={(e) => handleChange('rotasi', parseFloat(e.target.value))}
                className="flex-1 accent-sky-500"
              />
              <button
                type="button"
                onClick={() => handleChange('rotasi', (dev.rotasi + 45) % 360)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-200"
                title="Putar 45°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Status Operasional</label>
            <select
              value={dev.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="aktif">Aktif / Online</option>
              <option value="maintenance">Dalam Perawatan (Maintenance)</option>
              <option value="rencana">Rencana Pemasangan Baru</option>
            </select>
          </div>
        </div>
      </aside>
    );
  }

  // 2. INSPECTOR MEJA CLIENT / FURNITURE
  if (selectedItem.type === 'furniture') {
    const item = furniture.find((f) => f.id === selectedItem.id);
    if (!item) return null;

    const handleChange = (field: keyof Furniture, value: any) => {
      onUpdateFurniture(
        furniture.map((f) => (f.id === item.id ? { ...f, [field]: value } : f))
      );
    };

    return (
      <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Square className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">
                {item.tipe.startsWith('tangga') ? 'Tangga Arsitektur' : 'Meja & Workstation'}
              </div>
              <div className="text-[10px] text-slate-400">{item.id}</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onDuplicate && (
              <button
                type="button"
                onClick={onDuplicate}
                className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                title="Duplikat Furniture Ini (Ctrl+D)"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Hapus Meja (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Tutup Panel Inspector [ ] ]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Kontrol Khusus Tangga Arsitektur */}
          {item.tipe.startsWith('tangga') && (
            <div className="p-3 bg-amber-950/25 border border-amber-900/40 rounded-xl space-y-2.5">
              <div className="text-xs font-semibold text-amber-400 flex items-center space-x-1.5">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Arah Alur & Trap Tangga</span>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Arah Tangga Antar Lantai</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleChange('tangga_arah', 'naik')}
                    className={`py-1.5 px-2 rounded-lg text-center text-xs font-semibold transition border cursor-pointer ${
                      (item.tangga_arah || 'naik') === 'naik'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    ↑ NAIK KE L2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('tangga_arah', 'turun')}
                    className={`py-1.5 px-2 rounded-lg text-center text-xs font-semibold transition border cursor-pointer ${
                      item.tangga_arah === 'turun'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    ↓ TURUN KE L1
                  </button>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Jumlah Trap Anak Tangga</span>
                  <span className="font-bold text-amber-400">{item.tangga_jumlah_anak || 16} Trap</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="24"
                  step="1"
                  value={item.tangga_jumlah_anak || 16}
                  onChange={(e) => handleChange('tangga_jumlah_anak', parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1">Label Meja</label>
            <input
              type="text"
              value={item.label}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="Contoh: Meja Staff 01"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Pemilik Client / Staff Pemakai</label>
            <input
              type="text"
              value={item.pemilik_client}
              onChange={(e) => handleChange('pemilik_client', e.target.value)}
              placeholder="Contoh: Budi - Accounting / Siti - IT"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Lebar (cm)</label>
              <input
                type="number"
                value={item.lebar_cm}
                onChange={(e) => handleChange('lebar_cm', parseFloat(e.target.value) || 120)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Panjang (cm)</label>
              <input
                type="number"
                value={item.panjang_cm}
                onChange={(e) => handleChange('panjang_cm', parseFloat(e.target.value) || 60)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Arah Hadap Meja</span>
              <span className="text-sky-400">{item.rotasi}°</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="360"
                step="90"
                value={item.rotasi}
                onChange={(e) => handleChange('rotasi', parseFloat(e.target.value))}
                className="flex-1 accent-sky-500"
              />
              <button
                type="button"
                onClick={() => handleChange('rotasi', (item.rotasi + 90) % 360)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-200"
                title="Putar 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 3. INSPECTOR DINDING (Mendukung Lurus, Busur/Lengkung, dan Lingkaran Penuh)
  if (selectedItem.type === 'wall') {
    const wall = dinding.find((w) => w.id === selectedItem.id);
    if (!wall) return null;

    const wallLenPx = getDistance({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
    const wallLenM = wallLenPx / scalePxPerMeter;

    const tipeBentuk = wall.tipe_bentuk || 'lurus';
    const kelengkungan = wall.kelengkungan ?? 0;

    // Metrik Lingkaran Penuh
    const radPx = wallLenPx;
    const radM = radPx / scalePxPerMeter;
    const diaM = radM * 2;
    const kelilingM = 2 * Math.PI * radM;
    const luasLingkaranM2 = Math.PI * radM * radM;

    // Metrik Busur / Lengkungan
    const chordPx = Math.max(1, wallLenPx);
    const sagitta = kelengkungan || 35;
    const arcLenPx = Math.sqrt(chordPx * chordPx + (16 / 3) * sagitta * sagitta);
    const arcLenM = arcLenPx / scalePxPerMeter;
    const radiusM = (chordPx * chordPx / 4 + sagitta * sagitta) / (2 * Math.max(1, Math.abs(sagitta))) / scalePxPerMeter;

    const handleChange = (field: keyof Dinding, value: any) => {
      onUpdateDinding(
        dinding.map((w) => (w.id === wall.id ? { ...w, [field]: value } : w))
      );
    };

    // Fungsi mengubah radius lingkaran secara presisi
    const handleSetRadiusMeters = (newRadM: number) => {
      if (newRadM <= 0.1) return;
      const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
      const newRadPx = newRadM * scalePxPerMeter;
      onUpdateDinding(
        dinding.map((w) =>
          w.id === wall.id
            ? {
                ...w,
                x2: Number((w.x1 + Math.cos(angle) * newRadPx).toFixed(1)),
                y2: Number((w.y1 + Math.sin(angle) * newRadPx).toFixed(1)),
              }
            : w
        )
      );
    };

    // Fungsi mengubah diameter lingkaran secara presisi
    const handleSetDiameterMeters = (newDiaM: number) => {
      handleSetRadiusMeters(newDiaM / 2);
    };

    // Fungsi mengubah panjang dinding lurus secara presisi
    const handleSetLengthMeters = (newMeters: number) => {
      if (newMeters <= 0.1) return;
      const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
      const newLenPx = newMeters * scalePxPerMeter;
      onUpdateDinding(
        dinding.map((w) =>
          w.id === wall.id
            ? {
                ...w,
                x2: Number((w.x1 + Math.cos(angle) * newLenPx).toFixed(1)),
                y2: Number((w.y1 + Math.sin(angle) * newLenPx).toFixed(1)),
              }
            : w
        )
      );
    };

    // Fungsi memutar dinding 90 derajat siku
    const handleRotate90 = () => {
      const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
      const newAngle = angle + Math.PI / 2;
      onUpdateDinding(
        dinding.map((w) =>
          w.id === wall.id
            ? {
                ...w,
                x2: Number((w.x1 + Math.cos(newAngle) * wallLenPx).toFixed(1)),
                y2: Number((w.y1 + Math.sin(newAngle) * wallLenPx).toFixed(1)),
              }
            : w
        )
      );
    };

    // Fungsi menukar titik ujung P1 dan P2
    const handleFlipEndpoints = () => {
      onUpdateDinding(
        dinding.map((w) =>
          w.id === wall.id
            ? { ...w, x1: w.x2, y1: w.y2, x2: w.x1, y2: w.y1 }
            : w
        )
      );
    };

    // Balik arah cembung / cekung busur lengkungan
    const handleInvertCurve = () => {
      onUpdateDinding(
        dinding.map((w) =>
          w.id === wall.id
            ? { ...w, kelengkungan: -(w.kelengkungan || 35) }
            : w
        )
      );
    };

    return (
      <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              {tipeBentuk === 'lingkaran'
                ? 'Dinding Lingkaran'
                : tipeBentuk === 'lengkung'
                ? 'Dinding Lengkung (Busur)'
                : 'Dinding Bangunan (Lurus)'}
            </div>
            <div className="text-[10px] text-slate-400">{wall.id}</div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Hapus Dinding (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Tutup Panel Inspector [ ] ]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Pilihan Bentuk Geometri Dinding */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Bentuk Geometri Dinding</label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  handleChange('tipe_bentuk', 'lurus');
                }}
                className={`py-1.5 px-1 rounded-lg text-center border text-[11px] font-medium transition ${
                  tipeBentuk === 'lurus'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Lurus
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateDinding(
                    dinding.map((w) =>
                      w.id === wall.id
                        ? { ...w, tipe_bentuk: 'lengkung', kelengkungan: w.kelengkungan || 35 }
                        : w
                    )
                  );
                }}
                className={`py-1.5 px-1 rounded-lg text-center border text-[11px] font-medium transition ${
                  tipeBentuk === 'lengkung'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Busur / Lengkung
              </button>
              <button
                type="button"
                onClick={() => {
                  handleChange('tipe_bentuk', 'lingkaran');
                }}
                className={`py-1.5 px-1 rounded-lg text-center border text-[11px] font-medium transition ${
                  tipeBentuk === 'lingkaran'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Lingkaran
              </button>
            </div>
          </div>

          {/* KONTEN BERDASARKAN BENTUK */}
          {tipeBentuk === 'lingkaran' && (
            <>
              {/* Info Ukuran Lingkaran */}
              <div className="p-3 bg-sky-950/20 border border-sky-900/40 rounded-xl space-y-1">
                <div className="text-[11px] text-slate-400">Diameter Ruangan Lingkaran</div>
                <div className="text-xl font-bold text-sky-400">
                  Dia {formatMeasurement(diaM)}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  Keliling Dinding: {formatMeasurement(kelilingM)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Jari-jari (Radius): {formatMeasurement(radM)} • Luas Area: {luasLingkaranM2.toFixed(1)} m²
                </div>
              </div>

              {/* Edit Diameter Presisi */}
              <div>
                <label className="text-slate-400 block mb-1">Ubah Diameter Lingkaran (Meter)</label>
                <div className="flex space-x-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="100"
                    value={Number(diaM.toFixed(2))}
                    onChange={(e) => handleSetDiameterMeters(parseFloat(e.target.value) || diaM)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                  <span className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 font-semibold">
                    m
                  </span>
                </div>
              </div>

              {/* Edit Radius Presisi */}
              <div>
                <label className="text-slate-400 block mb-1">Ubah Jari-jari (Radius Meter)</label>
                <div className="flex space-x-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.25"
                    max="50"
                    value={Number(radM.toFixed(2))}
                    onChange={(e) => handleSetRadiusMeters(parseFloat(e.target.value) || radM)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                  <span className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 font-semibold">
                    m
                  </span>
                </div>
              </div>
            </>
          )}

          {tipeBentuk === 'lengkung' && (
            <>
              {/* Info Busur Lengkung */}
              <div className="p-3 bg-sky-950/20 border border-sky-900/40 rounded-xl space-y-1">
                <div className="text-[11px] text-slate-400">Panjang Busur Dinding</div>
                <div className="text-xl font-bold text-sky-400">
                  {formatMeasurement(arcLenM)}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  Bentang Titik Ujung (Chord): {formatMeasurement(wallLenM)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Radius Busur R: {formatMeasurement(radiusM)} • Tinggi Lengkung: {(Math.abs(sagitta) / scalePxPerMeter).toFixed(2)}m
                </div>
              </div>

              {/* Slider Kelengkungan (Sagitta) */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Tinggi Kelengkungan Busur</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {(sagitta / scalePxPerMeter).toFixed(2)} m
                  </span>
                </div>
                <input
                  type="range"
                  min="-150"
                  max="150"
                  step="5"
                  value={sagitta}
                  onChange={(e) => handleChange('kelengkungan', parseFloat(e.target.value) || 0)}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleInvertCurve}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center justify-center space-x-1 transition"
                  title="Balik Arah Cekung / Cembung Busur"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Balik Arah</span>
                </button>
                <button
                  type="button"
                  onClick={handleFlipEndpoints}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center justify-center space-x-1 transition"
                  title="Tukar Titik P1 dan P2"
                >
                  <span>Tukar Ujung</span>
                </button>
              </div>
            </>
          )}

          {tipeBentuk === 'lurus' && (
            <>
              {/* Info Ukuran Saat Ini */}
              <div className="p-3 bg-sky-950/20 border border-sky-900/40 rounded-xl">
                <div className="text-[11px] text-slate-400">Panjang Dinding Tertera</div>
                <div className="text-xl font-bold text-sky-400 mt-1">
                  {formatMeasurement(wallLenM)}
                </div>
                <div className="text-[10px] text-slate-500">
                  ({wallLenPx.toFixed(0)} px pada skala {scalePxPerMeter}px/m)
                </div>
              </div>

              {/* Edit Panjang Presisi (Ketik Angka Meter) */}
              <div>
                <label className="text-slate-400 block mb-1">Ubah Panjang Dinding (Meter)</label>
                <div className="flex space-x-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="100"
                    value={Number(wallLenM.toFixed(2))}
                    onChange={(e) => handleSetLengthMeters(parseFloat(e.target.value) || wallLenM)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-bold text-sky-400 focus:outline-none focus:border-sky-500"
                  />
                  <span className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 font-semibold">
                    m
                  </span>
                </div>
              </div>

              {/* Rotasi & Balik Arah */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleRotate90}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center justify-center space-x-1 transition"
                  title="Putar Dinding 90 Derajat Siku"
                >
                  <RotateCw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Putar 90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleFlipEndpoints}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center justify-center space-x-1 transition"
                  title="Balik Posisi Titik P1 dan P2"
                >
                  <span>Tukar Arah</span>
                </button>
              </div>
            </>
          )}

          {/* Ketebalan Dinding */}
          <div>
            <label className="text-slate-400 block mb-1">Ketebalan Dinding (cm)</label>
            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              {[10, 15, 20].map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => handleChange('ketebalan_cm', th)}
                  className={`py-1 rounded text-center border transition ${
                    wall.ketebalan_cm === th
                      ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-semibold'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {th} cm
                </button>
              ))}
            </div>
            <input
              type="number"
              value={wall.ketebalan_cm}
              onChange={(e) => handleChange('ketebalan_cm', parseFloat(e.target.value) || 15)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Tipe Dinding */}
          <div>
            <label className="text-slate-400 block mb-1">Tipe & Bahan Dinding</label>
            <select
              value={wall.tipe_dinding}
              onChange={(e) => handleChange('tipe_dinding', e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="utama">Dinding Utama (Bata / Beton)</option>
              <option value="partisi">Partisi Kantor (Gypsum / Papan)</option>
              <option value="kaca">Dinding Kaca (Ruang Server / Rapat)</option>
            </select>
          </div>

          {/* Warna Dinding */}
          <div>
            <label className="text-slate-400 block mb-1">Warna Garis Dinding</label>
            <div className="flex items-center space-x-2">
              {['#475569', '#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleChange('warna', c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    (wall.warna || '#475569') === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Tips Interaktif di Kanvas */}
          <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-sky-400 flex items-center space-x-1">
              <span>💡 Panduan Interaktif di Kanvas:</span>
            </div>
            {tipeBentuk === 'lingkaran' ? (
              <>
                <p>• <strong>Handle Biru di Tengah</strong>: Klik & drag untuk memindahkan posisi seluruh lingkaran.</p>
                <p>• <strong>Handle Hijau di Tepi</strong>: Klik & drag untuk memperbesar / memperkecil diameter lingkaran.</p>
              </>
            ) : tipeBentuk === 'lengkung' ? (
              <>
                <p>• <strong>Handle Oranye di Puncak</strong>: Klik & drag langsung untuk menarik tinggi lengkungan busur.</p>
                <p>• <strong>Handle Biru di Ujung</strong>: Klik & drag untuk mengubah bentang titik ujung busur.</p>
              </>
            ) : (
              <>
                <p>• <strong>Handle Biru di Ujung</strong>: Klik & drag untuk memanjangkan atau mengubah sudut.</p>
                <p>• <strong>Garis Tengah Dinding</strong>: Klik & drag untuk menggeser posisi seluruh dinding.</p>
              </>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // 4. INSPECTOR KABEL INTERNET & JARINGAN
  if (selectedItem.type === 'kabel') {
    const cbl = kabel.find((c) => c.id === selectedItem.id);
    if (!cbl) return null;

    const currentDropAsal = cbl.tinggi_drop_asal_meter ?? 2.5;
    const currentDropTujuan = cbl.tinggi_drop_tujuan_meter ?? 2.5;
    const currentCadangan = cbl.panjang_cadangan_meter ?? 1.0;

    const handleChange = (field: keyof KabelJalur, value: any) => {
      onUpdateKabel(
        kabel.map((c) => {
          if (c.id !== cbl.id) return c;
          const updated = { ...c, [field]: value };
          if (
            field === 'tinggi_drop_asal_meter' ||
            field === 'tinggi_drop_tujuan_meter' ||
            field === 'panjang_cadangan_meter'
          ) {
            const dropAsal = field === 'tinggi_drop_asal_meter' ? (parseFloat(value) || 0) : (updated.tinggi_drop_asal_meter ?? 2.5);
            const dropTujuan = field === 'tinggi_drop_tujuan_meter' ? (parseFloat(value) || 0) : (updated.tinggi_drop_tujuan_meter ?? 2.5);
            const cadangan = field === 'panjang_cadangan_meter' ? (parseFloat(value) || 0) : (updated.panjang_cadangan_meter ?? 1.0);
            const totalDrop = Number((dropAsal + dropTujuan + cadangan).toFixed(2));
            updated.panjang_tambahan_drop_meter = totalDrop;
            updated.total_panjang_meter = Number((updated.panjang_denah_meter + totalDrop).toFixed(2));
          } else if (field === 'panjang_tambahan_drop_meter') {
            updated.total_panjang_meter = Number(
              (updated.panjang_denah_meter + (parseFloat(value) || 0)).toFixed(2)
            );
          }
          return updated;
        })
      );
    };

    const applyPreset = (asal: number, tujuan: number, cadangan: number, jalur: 'plafon' | 'bawah_lantai' | 'conduit' | 'tray') => {
      onUpdateKabel(
        kabel.map((c) => {
          if (c.id !== cbl.id) return c;
          const totalDrop = Number((asal + tujuan + cadangan).toFixed(2));
          return {
            ...c,
            jalur_tipe: jalur,
            tinggi_drop_asal_meter: asal,
            tinggi_drop_tujuan_meter: tujuan,
            panjang_cadangan_meter: cadangan,
            panjang_tambahan_drop_meter: totalDrop,
            total_panjang_meter: Number((c.panjang_denah_meter + totalDrop).toFixed(2)),
          };
        })
      );
    };

    return (
      <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Cable className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">Jalur Kabel Jaringan</div>
              <div className="text-[10px] text-slate-400">{cbl.id}</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Hapus Kabel (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Tutup Panel Inspector [ ] ]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Kode / Label Kabel</label>
            <input
              type="text"
              value={cbl.kode_kabel}
              onChange={(e) => handleChange('kode_kabel', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Tipe Spesifikasi Kabel</label>
            <select
              value={cbl.tipe_kabel_id}
              onChange={(e) => handleChange('tipe_kabel_id', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {kabelTipe.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama_tipe}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Jalur Rute Fisik</label>
            <select
              value={cbl.jalur_tipe}
              onChange={(e) => handleChange('jalur_tipe', e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="plafon">Plafon / Naik Atap (Ceiling Tray)</option>
              <option value="bawah_lantai">Bawah Lantai / Trench (Underfloor)</option>
              <option value="tray">Cable Tray Terbuka</option>
              <option value="conduit">Pipa Conduit Dinding</option>
            </select>
          </div>

          {/* Preset Cepat Naik/Turun Adaptif terhadap Tinggi Atap Lantai */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Preset Vertikal (Atap {tinggiPlafon}m):</span>
              <span className="text-[10px] text-sky-400 font-mono">H = {tinggiPlafon}m</span>
            </div>
            {(() => {
              const H = tinggiPlafon || 3.2;
              const dropAsal = H;
              const dropMeja = Math.max(1.5, Number((H - 0.75).toFixed(2)));
              const totalMeja = Number((dropAsal + dropMeja + 1.0).toFixed(1));
              const totalAp = Number((dropAsal + 0.5 + 1.0).toFixed(1));
              const totalCctv = Number((dropAsal + Math.max(1.0, H - 3.5) + 1.0).toFixed(1));

              return (
                <>
                  <div className="grid grid-cols-3 gap-1 mb-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset(dropAsal, dropMeja, 1.0, 'plafon')}
                      className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-sky-400 border border-slate-700 rounded text-center transition"
                      title={`Atap Meja: Naik ${dropAsal}m + Turun ${dropMeja}m + Slack 1m = ${totalMeja}m`}
                    >
                      Atap Meja (+{totalMeja}m)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(dropAsal, 0.5, 1.0, 'plafon')}
                      className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 border border-slate-700 rounded text-center transition"
                      title={`Atap AP: Naik ${dropAsal}m + Drop AP 0.5m + Slack 1m = ${totalAp}m`}
                    >
                      Atap AP (+{totalAp}m)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(0.8, 0.8, 1.0, 'bawah_lantai')}
                      className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-400 border border-slate-700 rounded text-center transition"
                      title="Bawah Lantai / Trench: Rack 0.8m + Meja 0.8m + Slack 1m = 2.6m"
                    >
                      Bawah Lantai (+2.6m)
                    </button>
                  </div>

                  {H >= 5.0 && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-[11px] mb-2">
                      <div className="font-semibold text-amber-300 flex items-center space-x-1">
                        <span>💡 Rekomendasi Gedung Tinggi ({H}m)</span>
                      </div>
                      <div className="text-slate-300 leading-relaxed text-[10px]">
                        Menarik kabel lewat atap {H}m butuh <strong>+{totalMeja}m</strong> ekstra vertikal per meja. Jalur <strong>Bawah Lantai (Trench)</strong> menghemat <strong>{(totalMeja - 2.6).toFixed(1)} meter</strong> kabel per titik!
                      </div>
                      {cbl.jalur_tipe !== 'bawah_lantai' && (
                        <button
                          type="button"
                          onClick={() => applyPreset(0.8, 0.8, 1.0, 'bawah_lantai')}
                          className="w-full py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded font-medium text-[10px] transition"
                        >
                          Ganti ke Jalur Bawah Lantai (+2.6m)
                        </button>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Rincian Kalkulasi Panjang Meter */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex justify-between text-slate-400">
              <span>Panjang Denah Horisontal:</span>
              <span className="font-semibold text-slate-200">{cbl.panjang_denah_meter} m</span>
            </div>

            <div className="flex justify-between text-slate-400 items-center">
              <div>
                <div>Naik/Turun Asal (m):</div>
                <div className="text-[10px] text-slate-500">Rack / Panel ke Plafon/Lantai</div>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                value={currentDropAsal}
                onChange={(e) => handleChange('tinggi_drop_asal_meter', e.target.value)}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-right text-slate-200"
              />
            </div>

            <div className="flex justify-between text-slate-400 items-center">
              <div>
                <div>Naik/Turun Tujuan (m):</div>
                <div className="text-[10px] text-slate-500">Plafon/Lantai ke Meja/AP/CCTV</div>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                value={currentDropTujuan}
                onChange={(e) => handleChange('tinggi_drop_tujuan_meter', e.target.value)}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-right text-slate-200"
              />
            </div>

            <div className="flex justify-between text-slate-400 items-center">
              <div>
                <div>Cadangan Slack Terminasi (m):</div>
                <div className="text-[10px] text-slate-500">Loop patch panel & outlet RJ45</div>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                value={currentCadangan}
                onChange={(e) => handleChange('panjang_cadangan_meter', e.target.value)}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-right text-slate-200"
              />
            </div>

            <div className="border-t border-slate-800/80 pt-1.5 flex justify-between text-slate-400">
              <span className="text-[11px]">Total Tambahan Vertikal:</span>
              <span className="font-medium text-emerald-400">+{cbl.panjang_tambahan_drop_meter} m</span>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
              <span className="text-slate-200 font-semibold">Total Kebutuhan Kabel:</span>
              <span className="text-base font-bold text-sky-400">{cbl.total_panjang_meter} Meter</span>
            </div>
            
            <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 leading-relaxed font-mono">
              Rumus: {cbl.panjang_denah_meter}m (denah) + {currentDropAsal}m (asal) + {currentDropTujuan}m (tujuan) + {currentCadangan}m (slack) = <strong className="text-sky-300">{cbl.total_panjang_meter}m</strong>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 5. INSPECTOR PINTU & JENDELA (BUKAAN)
  if (selectedItem.type === 'bukaan') {
    const item = bukaan.find((b) => b.id === selectedItem.id);
    if (!item) return null;

    const handleChange = (field: keyof Bukaan, value: any) => {
      onUpdateBukaan(
        bukaan.map((b) => (b.id === item.id ? { ...b, [field]: value } : b))
      );
    };

    // Fungsi rotasi cepat +90 derajat
    const handleRotatePlus90 = () => {
      handleChange('rotasi', (item.rotasi + 90) % 360);
    };

    // Fungsi rotasi cepat -90 derajat
    const handleRotateMinus90 = () => {
      handleChange('rotasi', (item.rotasi - 90 + 360) % 360);
    };

    // Fungsi balik arah swing 180 derajat
    const handleFlip180 = () => {
      handleChange('rotasi', (item.rotasi + 180) % 360);
    };

    return (
      <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <DoorOpen className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">
                {item.tipe === 'jendela'
                  ? 'Jendela Kaca'
                  : item.tipe === 'pintu_ganda'
                  ? 'Pintu Ganda (Double)'
                  : item.tipe === 'pintu_geser'
                  ? 'Pintu Geser (Sliding)'
                  : 'Pintu Ruangan (Single)'}
              </div>
              <div className="text-[10px] text-slate-400">{item.id}</div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onDuplicate && (
              <button
                type="button"
                onClick={onDuplicate}
                className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                title="Duplikat Pintu / Jendela Ini (Ctrl+D)"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onDeleteSelected}
              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Hapus Pintu / Jendela (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Tutup Panel Inspector [ ] ]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Info Ukuran & Rotasi Tertera */}
          <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-1">
            <div className="text-[11px] text-slate-400">Lebar Bukaan Tertera</div>
            <div className="text-xl font-bold text-amber-400">
              {item.lebar_cm} cm <span className="text-xs text-slate-400 font-normal">({(item.lebar_cm / 100).toFixed(2)} m)</span>
            </div>
            <div className="text-[11px] text-sky-400 font-medium">
              Arah Sudut Rotasi: {item.rotasi}°
            </div>
          </div>

          {/* Pilihan Tipe Bukaan */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Tipe Elemen Bukaan</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleChange('tipe', 'pintu_tunggal')}
                className={`py-1.5 px-2 rounded-lg text-center border text-[11px] font-medium transition ${
                  item.tipe === 'pintu_tunggal'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Pintu Tunggal
              </button>
              <button
                type="button"
                onClick={() => handleChange('tipe', 'pintu_ganda')}
                className={`py-1.5 px-2 rounded-lg text-center border text-[11px] font-medium transition ${
                  item.tipe === 'pintu_ganda'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Pintu Ganda
              </button>
              <button
                type="button"
                onClick={() => handleChange('tipe', 'pintu_geser')}
                className={`py-1.5 px-2 rounded-lg text-center border text-[11px] font-medium transition ${
                  item.tipe === 'pintu_geser'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Pintu Geser
              </button>
              <button
                type="button"
                onClick={() => handleChange('tipe', 'jendela')}
                className={`py-1.5 px-2 rounded-lg text-center border text-[11px] font-medium transition ${
                  item.tipe === 'jendela'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Jendela Kaca
              </button>
            </div>
          </div>

          {/* Penyesuaian Ukuran Lebar */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Ubah Lebar Bukaan (cm)</label>
            {/* Tombol Preset Cepat */}
            <div className="grid grid-cols-4 gap-1 mb-2">
              {[70, 80, 90, 100, 120, 150, 180, 200].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleChange('lebar_cm', w)}
                  className={`py-1 rounded text-center border text-[11px] transition ${
                    item.lebar_cm === w
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {w} cm
                </button>
              ))}
            </div>

            {/* Input Angka Presisi */}
            <div className="flex space-x-1.5">
              <input
                type="number"
                step="5"
                min="40"
                max="400"
                value={item.lebar_cm}
                onChange={(e) => handleChange('lebar_cm', parseFloat(e.target.value) || 90)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
              <span className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 font-semibold">
                cm
              </span>
            </div>
          </div>

          {/* Penyesuaian Rotasi & Arah Hadap */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1 font-semibold">
              <span>Rotasi & Arah Bukaan</span>
              <span className="text-amber-400 font-mono font-bold">{item.rotasi}°</span>
            </div>

            {/* Tombol Cepat Rotasi */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button
                type="button"
                onClick={handleRotatePlus90}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center justify-center space-x-1 transition text-[11px]"
                title="Putar Searah Jarum Jam +90 Derajat"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                <span>+90°</span>
              </button>
              <button
                type="button"
                onClick={handleRotateMinus90}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center justify-center space-x-1 transition text-[11px]"
                title="Putar Berlawanan Jarum Jam -90 Derajat"
              >
                <span>-90°</span>
              </button>
              <button
                type="button"
                onClick={handleFlip180}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 flex items-center justify-center space-x-1 transition text-[11px]"
                title="Balik Arah Bukaan Pintu (180°)"
              >
                <span>Balik 180°</span>
              </button>
            </div>

            {/* Range Slider Sudut Halus */}
            <input
              type="range"
              min="0"
              max="345"
              step="15"
              value={item.rotasi}
              onChange={(e) => handleChange('rotasi', parseFloat(e.target.value) || 0)}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0° (Atas)</span>
              <span>90° (Kanan)</span>
              <span>180° (Bawah)</span>
              <span>270° (Kiri)</span>
            </div>

            {/* Fitur Mirror Pintu (Buka Kiri/Kanan & Dalam/Luar) */}
            {item.tipe !== 'jendela' && (
              <div className="pt-2.5 mt-2.5 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300 font-semibold text-[11px]">
                  <span>Mirror Engsel & Arah Swing</span>
                  <span className="text-[10px] text-amber-400 font-normal">Kiri ↔ Kanan</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('flip_x', !item.flip_x)}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      item.flip_x
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Balik Sisi Engsel Pintu (Kiri ↔ Kanan)"
                  >
                    <span>↔</span>
                    <span>{item.flip_x ? 'Buka Kanan' : 'Buka Kiri'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('flip_y', !item.flip_y)}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      item.flip_y
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Balik Arah Hadap Swing (Dalam ↕ Luar)"
                  >
                    <span>↕</span>
                    <span>{item.flip_y ? 'Buka Luar' : 'Buka Dalam'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panduan Interaktif di Kanvas */}
          <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-amber-400 flex items-center space-x-1">
              <span>💡 Panduan Interaktif di Kanvas:</span>
            </div>
            <p>• <strong>Handle Hijau di Kiri & Kanan</strong>: Klik & drag untuk memperlebar / mempersempit pintu atau jendela langsung di denah.</p>
            <p>• <strong>Handle Oranye di Tangkai Atas</strong>: Klik & drag memutar untuk memutar arah hadap atau arah ayunan pintu.</p>
            <p>• <strong>Handle Biru di Tengah</strong>: Klik & drag untuk menggeser posisi pintu/jendela di dinding.</p>
          </div>
        </div>
      </aside>
    );
  }

  return null;
};
