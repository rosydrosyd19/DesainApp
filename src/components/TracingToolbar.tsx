import React, { useState } from 'react';
import {
  DenahJiplakan,
} from '../types/schema.ts';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Ruler,
  ChevronUp,
  ChevronDown,
  Layers,
  Move,
} from 'lucide-react';

interface TracingToolbarProps {
  jiplakan: DenahJiplakan | null;
  onUpdateJiplakan: (item: DenahJiplakan | null) => void;
  onDelete?: () => void;
  onStartCalibration?: () => void;
  isCalibrating?: boolean;
  onResetPosition?: () => void;
}

export const TracingToolbar: React.FC<TracingToolbarProps> = ({
  jiplakan,
  onUpdateJiplakan,
  onDelete,
  onStartCalibration,
  isCalibrating = false,
  onResetPosition,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!jiplakan) return null;

  const handleOpacityChange = (val: number) => {
    onUpdateJiplakan({
      ...jiplakan,
      opacity: val,
    });
  };

  const handleScaleChange = (val: number) => {
    onUpdateJiplakan({
      ...jiplakan,
      skala: Math.max(0.1, Math.min(5.0, Number(val.toFixed(2)))),
    });
  };

  const handleRotate = () => {
    onUpdateJiplakan({
      ...jiplakan,
      rotasi: (jiplakan.rotasi + 90) % 360,
    });
  };

  const handleToggleLock = () => {
    onUpdateJiplakan({
      ...jiplakan,
      is_locked: !jiplakan.is_locked,
    });
  };

  const handleToggleVisibility = () => {
    onUpdateJiplakan({
      ...jiplakan,
      is_visible: !jiplakan.is_visible,
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else if (window.confirm('Hapus gambar jiplakan referensi dari lantai ini?')) {
      onUpdateJiplakan(null);
    }
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 select-none">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 transition-all text-slate-200">
        {/* Header Bar Toolbar */}
        <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              Jiplakan Foto {jiplakan.is_locked ? '(🔒 Terkunci)' : '(🔓 Bisa Digeser)'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {/* Tombol Kunci Posisi */}
            <button
              type="button"
              onClick={handleToggleLock}
              className={`p-1 rounded-lg text-xs flex items-center space-x-1 transition border ${
                jiplakan.is_locked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={
                jiplakan.is_locked
                  ? 'Gambar Terkunci: Gambar aman tidak akan tergeser saat menggambar dinding/kabel. Klik untuk membuka kunci.'
                  : 'Gambar Terbuka: Anda bisa menggeser gambar di kanvas dengan mode Select. Klik untuk mengunci gambar.'
              }
            >
              {jiplakan.is_locked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] hidden sm:inline">Kunci</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] hidden sm:inline">Bebas</span>
                </>
              )}
            </button>

            {/* Tombol Tampilkan / Sembunyikan */}
            <button
              type="button"
              onClick={handleToggleVisibility}
              className={`p-1 rounded-lg border transition ${
                jiplakan.is_visible
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
              }`}
              title={jiplakan.is_visible ? 'Sembunyikan Gambar Jiplakan' : 'Tampilkan Gambar Jiplakan'}
            >
              {jiplakan.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            {/* Minimize Toolbar */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-slate-400 hover:text-white rounded transition"
              title={isCollapsed ? 'Perluas Pengaturan' : 'Ciutkan Toolbar'}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Hapus */}
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 text-rose-400 hover:bg-rose-500/20 rounded transition"
              title="Hapus Gambar Jiplakan"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Konten Kontrol Lengkap (Jika Tidak Diciutkan) */}
        {!isCollapsed && (
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            {/* Slider Transparansi (Opacity) */}
            <div className="flex items-center space-x-1.5 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Transparansi:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={jiplakan.opacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                title="Atur transparansi agar gambar latar dan dinding terlihat jelas"
              />
              <span className="font-mono text-[11px] text-sky-400 w-8 text-right">
                {Math.round(jiplakan.opacity * 100)}%
              </span>
            </div>

            {/* Kontrol Skala Gambar */}
            <div className="flex items-center space-x-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Skala:</span>
              <button
                type="button"
                onClick={() => handleScaleChange(jiplakan.skala - 0.05)}
                className="p-0.5 hover:bg-slate-800 rounded text-slate-300"
                title="Perkecil Gambar (-5%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-amber-300 font-bold px-1 min-w-[42px] text-center">
                {Math.round(jiplakan.skala * 100)}%
              </span>
              <button
                type="button"
                onClick={() => handleScaleChange(jiplakan.skala + 0.05)}
                className="p-0.5 hover:bg-slate-800 rounded text-slate-300"
                title="Perbesar Gambar (+5%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Putar 90 Derajat */}
            <button
              type="button"
              onClick={handleRotate}
              className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 transition shadow-sm"
              title="Putar Gambar 90 Derajat Searah Jarum Jam"
            >
              <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px]">{jiplakan.rotasi}°</span>
            </button>

            {/* Fitur Kalibrasi 2 Titik Presisi */}
            {onStartCalibration && (
              <button
                type="button"
                onClick={onStartCalibration}
                className={`p-1 px-2 rounded-lg border flex items-center space-x-1 transition shadow-sm ${
                  isCalibrating
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 animate-pulse'
                    : 'bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border-indigo-500/40'
                }`}
                title="Kalibrasi Ukuran: Klik 2 titik di gambar dan masukkan jarak meter aslinya"
              >
                <Ruler className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px]">
                  {isCalibrating ? 'Klik 2 Titik di Gambar...' : 'Kalibrasi 2 Titik'}
                </span>
              </button>
            )}

            {/* Pusatkan / Reset Posisi */}
            {onResetPosition && (
              <button
                type="button"
                onClick={onResetPosition}
                className="p-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Pusatkan gambar di tengah kanvas"
              >
                <Move className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
