import React from 'react';
import {
  Save,
  FileSpreadsheet,
  Download,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Database,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Maximize2,
  PanelLeft,
  PanelRight,
  Layers,
  Ghost,
  Plus,
  ChevronDown,
  X,
  Image as ImageIcon,
  Undo2,
  Redo2,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';
import { Proyek, Lantai } from '../types/schema.ts';

interface HeaderProps {
  proyek: Proyek | null;
  lantai: Lantai | null;
  projectFloors?: Lantai[];
  onSelectFloor?: (floorId: string) => void;
  onAddFloor?: () => void;
  underlayFloorId?: string | null;
  onToggleUnderlayFloor?: (floorId: string | null) => void;
  isLeftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  onChangeCeilingHeight?: (newHeight: number) => void;
  dualScreenMode?: 'none' | 'canvas' | 'presentation';
  onToggleDualScreen?: (mode: 'none' | 'canvas' | 'presentation') => void;
  dbStatus: 'connected' | 'connecting' | 'error';
  dbMessage: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  scalePxPerMeter: number;
  onChangeScale: (newScale: number, rescaleExisting?: boolean) => void;
  snapGrid: boolean;
  onToggleSnapGrid: () => void;
  onSaveToDb: () => void;
  onOpenBomModal: () => void;
  onOpenProjectModal: () => void;
  onExportImage: (includeGrid?: boolean) => void;
  isSaving: boolean;
  hasJiplakan?: boolean;
  onUploadJiplakan?: (file: File) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  proyek,
  lantai,
  projectFloors,
  onSelectFloor,
  onAddFloor,
  underlayFloorId,
  onToggleUnderlayFloor,
  isLeftSidebarOpen = true,
  onToggleLeftSidebar,
  isRightSidebarOpen = true,
  onToggleRightSidebar,
  onChangeCeilingHeight,
  dualScreenMode = 'none',
  onToggleDualScreen,
  dbStatus,
  dbMessage,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  scalePxPerMeter,
  onChangeScale,
  snapGrid,
  onToggleSnapGrid,
  onSaveToDb,
  onOpenBomModal,
  onOpenProjectModal,
  onExportImage,
  isSaving,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  hasJiplakan,
  onUploadJiplakan,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [isDualMenuOpen, setIsDualMenuOpen] = React.useState(false);
  const dualMenuRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isScaleMenuOpen, setIsScaleMenuOpen] = React.useState(false);
  const [rescaleObjects, setRescaleObjects] = React.useState(true);
  const scaleMenuRef = React.useRef<HTMLDivElement>(null);

  const [isExportMenuOpen, setIsExportMenuOpen] = React.useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  // Tutup dropdown jika user klik di luar menu
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dualMenuRef.current && !dualMenuRef.current.contains(event.target as Node)) {
        setIsDualMenuOpen(false);
      }
      if (scaleMenuRef.current && !scaleMenuRef.current.contains(event.target as Node)) {
        setIsScaleMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 px-1.5 sm:px-3 flex items-center justify-between gap-1 sm:gap-2 z-50 relative shrink-0 w-full overflow-visible">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 min-w-0 shrink">
        {/* Tombol Buka Tutup Sidebar Kiri */}
        <button
          type="button"
          onClick={onToggleLeftSidebar}
          className={`p-1.5 rounded-lg border transition shrink-0 ${
            isLeftSidebarOpen
              ? 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-700'
              : 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
          }`}
          title={`Buka/Tutup Sidebar Menu CAD & Perangkat IT [ [ ] (${isLeftSidebarOpen ? 'Terbuka' : 'Tertutup'})`}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-sky-500/20">
            D
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center space-x-1">
              <span className="hidden md:inline">DenahApp</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
              <span className="truncate max-w-[50px] sm:max-w-[70px] lg:max-w-[90px]">{proyek ? proyek.nama_proyek : 'Proyek'}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenProjectModal}
          className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center space-x-1 border border-slate-700 transition shrink-0"
          title="Buka / Ganti Proyek di MariaDB [Ctrl+O]"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden 2xl:inline">Proyek</span>
        </button>

        {/* Tab Lantai Cepat (Quick Switcher) & + Tambah Lantai */}
        <div className="flex items-center space-x-1 pl-1 border-l border-slate-800 shrink-0">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 space-x-0.5">
            {projectFloors && projectFloors.map((fl) => {
              const isActive = fl.id === lantai?.id;
              return (
                <button
                  key={fl.id}
                  type="button"
                  onClick={() => onSelectFloor && onSelectFloor(fl.id)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition max-w-[65px] sm:max-w-[85px] truncate ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title={`Pindah ke ${fl.nama_lantai}`}
                >
                  {fl.nama_lantai}
                </button>
              );
            })}
            {onAddFloor && (
              <button
                type="button"
                onClick={onAddFloor}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded transition"
                title="Tambah Lantai Baru (+ Lantai 2, dst)"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tombol Ghost View / Bayangan Lantai Lain */}
          {projectFloors && projectFloors.length > 1 && lantai && (
            <button
              type="button"
              onClick={() => {
                if (underlayFloorId) {
                  onToggleUnderlayFloor && onToggleUnderlayFloor(null);
                } else {
                  const otherFloor = projectFloors.find((f) => f.id !== lantai.id);
                  if (otherFloor) {
                    onToggleUnderlayFloor && onToggleUnderlayFloor(otherFloor.id);
                  }
                }
              }}
              className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium flex items-center space-x-1 border transition ${
                underlayFloorId
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
              title={
                underlayFloorId
                  ? `Bayangan Aktif: ${projectFloors.find((f) => f.id === underlayFloorId)?.nama_lantai} (Klik untuk matikan)`
                  : 'Ghost View: Tampilkan bayangan denah lantai lain sebagai referensi tembus pandang arsitektur & riser shaft'
              }
            >
              <Ghost className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] hidden 2xl:inline">
                {underlayFloorId ? 'Bayangan Aktif' : 'Bayangan'}
              </span>
            </button>
          )}
        </div>

        {/* Widget Ketinggian Atap / Plafon Lantai */}
        {lantai && (
          <div className="hidden sm:flex items-center space-x-1 pl-1 border-l border-slate-800 text-xs shrink-0">
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg px-1.5 py-0.5 space-x-1 shadow-sm">
              <span className="text-amber-400 text-xs" title="Tinggi Atap Gedung">📐</span>
              <span className="text-slate-400 text-[10px] hidden 2xl:inline">Atap:</span>
              <select
                value={
                  [2.8, 3.2, 4.5, 7.0, 9.0].includes(lantai.tinggi_plafon_meter ?? 3.2)
                    ? (lantai.tinggi_plafon_meter ?? 3.2).toString()
                    : 'custom'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    const input = window.prompt(
                      'Masukkan tinggi atap dalam meter (contoh: 6.5 atau 8):',
                      (lantai.tinggi_plafon_meter ?? 3.2).toString()
                    );
                    if (input) {
                      const num = parseFloat(input);
                      if (!isNaN(num) && num > 0) {
                        onChangeCeilingHeight && onChangeCeilingHeight(num);
                      }
                    }
                  } else {
                    onChangeCeilingHeight && onChangeCeilingHeight(parseFloat(val));
                  }
                }}
                className="bg-transparent text-amber-300 font-bold text-[11px] focus:outline-none cursor-pointer"
                title="Pilih tinggi atap / plafon gedung"
              >
                <option value="3.2" className="bg-slate-900 text-slate-200">3.2m</option>
                <option value="2.8" className="bg-slate-900 text-slate-200">2.8m</option>
                <option value="4.5" className="bg-slate-900 text-slate-200">4.5m</option>
                <option value="7.0" className="bg-slate-900 text-amber-400 font-bold">7.0m</option>
                <option value="9.0" className="bg-slate-900 text-amber-400 font-bold">9.0m</option>
                {![2.8, 3.2, 4.5, 7.0, 9.0].includes(lantai.tinggi_plafon_meter ?? 3.2) && (
                  <option value={(lantai.tinggi_plafon_meter ?? 3.2).toString()} className="bg-slate-900 text-amber-300">
                    {lantai.tinggi_plafon_meter}m
                  </option>
                )}
                <option value="custom" className="bg-slate-900 text-sky-400 font-medium">+ Kustom...</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Skala, Grid & Zoom Controls */}
      <div className="hidden md:flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 px-1.5 sm:px-2 py-0.5 rounded-xl shrink-0">
        {/* Kontrol Kalibrasi Skala CAD (Interaktif & Responsif) */}
        <div ref={scaleMenuRef} className="relative pr-1.5 border-r border-slate-800">
          <button
            type="button"
            onClick={() => setIsScaleMenuOpen((prev) => !prev)}
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-lg text-xs font-medium border transition cursor-pointer shadow-sm ${
              isScaleMenuOpen
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 ring-1 ring-sky-500/30'
                : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700/80'
            }`}
            title="Klik untuk Mengubah Kalibrasi Rasio Skala CAD [1m = ? px]"
          >
            <span className="text-amber-400 text-xs">📐</span>
            <span className="text-[11px] font-bold text-sky-400 whitespace-nowrap">
              1m={scalePxPerMeter}px
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Popover Menu Kalibrasi Skala CAD */}
          {isScaleMenuOpen && (
            <div className="absolute left-0 top-full pt-1.5 w-72 z-50">
              <div className="bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl p-3 space-y-3 backdrop-blur-sm text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">📐</span>
                    <span className="text-xs font-bold text-white">Kalibrasi Skala Denah</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScaleMenuOpen(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Penjelasan Singkat */}
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Menentukan rasio pixel kanvas untuk mewakili <strong className="text-slate-200">1 meter fisik</strong>.
                </div>

                {/* Nilai Aktif & Slider */}
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Rasio Konversi:</span>
                    <span className="text-xs font-bold text-sky-400 font-mono bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/50">
                      1 m = {scalePxPerMeter} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="120"
                    step="5"
                    value={scalePxPerMeter}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChangeScale(val, rescaleObjects);
                    }}
                    className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>20px (Area Luas)</span>
                    <span>120px (Detail)</span>
                  </div>
                </div>

                {/* Pilihan Preset Cepat Standar CAD */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Preset Standar Arsitektur:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChangeScale(25, rescaleObjects)}
                      className={`p-1.5 rounded-lg text-center transition border text-xs cursor-pointer ${
                        scalePxPerMeter === 25
                          ? 'bg-sky-600/30 border-sky-500 text-sky-300 font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
                      }`}
                      title="Cocok untuk gedung bertingkat besar, pabrik, gudang luas"
                    >
                      <div className="font-semibold">25 px/m</div>
                      <div className="text-[9px] text-slate-400">Gedung Luas</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeScale(50, rescaleObjects)}
                      className={`p-1.5 rounded-lg text-center transition border text-xs cursor-pointer ${
                        scalePxPerMeter === 50
                          ? 'bg-sky-600/30 border-sky-500 text-sky-300 font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
                      }`}
                      title="Standar default denah kantor, ruko, gedung 2-3 lantai"
                    >
                      <div className="font-semibold">50 px/m</div>
                      <div className="text-[9px] text-emerald-400 font-medium">Standar CAD</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeScale(100, rescaleObjects)}
                      className={`p-1.5 rounded-lg text-center transition border text-xs cursor-pointer ${
                        scalePxPerMeter === 100
                          ? 'bg-sky-600/30 border-sky-500 text-sky-300 font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
                      }`}
                      title="Cocok untuk ruang server, data center, detail instalasi rack"
                    >
                      <div className="font-semibold">100 px/m</div>
                      <div className="text-[9px] text-slate-400">Presisi Detail</div>
                    </button>
                  </div>
                </div>

                {/* Checkbox Rescale Objek yang Ada */}
                <label className="flex items-start space-x-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 cursor-pointer hover:bg-slate-950/60 transition">
                  <input
                    type="checkbox"
                    checked={rescaleObjects}
                    onChange={(e) => setRescaleObjects(e.target.checked)}
                    className="mt-0.5 rounded accent-sky-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <div className="text-[11px] leading-tight text-slate-300">
                    <span className="font-semibold text-white">Pertahankan Ukuran Meter Riil</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Otomatis sesuaikan koordinat objek agar panjang meteran tidak berubah saat skala diganti.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Snap to Grid Button */}
        <button
          type="button"
          onClick={onToggleSnapGrid}
          className={`px-1.5 py-0.5 rounded-lg text-xs flex items-center space-x-1 border transition ${
            snapGrid
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
              : 'text-slate-400 hover:bg-slate-800 border-transparent'
          }`}
          title="Snap ke Grid (Magnet Garis) [G]"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden 2xl:inline">Snap</span>
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-0.5 pl-1 border-l border-slate-800 text-xs">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
            title="Zoom Out [-]"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-300 font-mono text-[11px]"
            title="Reset Zoom 100% [0]"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 transition"
            title="Zoom In [+ / =]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo & Redo Controls */}
        <div className="flex items-center space-x-0.5 pl-1 border-l border-slate-800 text-xs">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded text-slate-300 transition cursor-pointer"
            title="Undo / Batalkan Aksi [Ctrl+Z]"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded text-slate-300 transition cursor-pointer"
            title="Redo / Ulangi Aksi [Ctrl+Y / Ctrl+Shift+Z]"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action Buttons: Save to MariaDB, BOM, Export */}
      <div className="flex items-center space-x-1 shrink-0 ml-auto">
        {/* Status Koneksi MariaDB */}
        <div
          className={`px-1.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 border shrink-0 ${
            dbStatus === 'connected'
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
          }`}
          title={dbMessage}
        >
          {dbStatus === 'connected' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden 2xl:inline text-[11px]">
            {dbStatus === 'connected' ? 'MariaDB' : 'Offline'}
          </span>
        </div>

        {/* Tombol Fitur Layar 2 (Dual Monitor) */}
        <div ref={dualMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsDualMenuOpen((prev) => !prev)}
            className={`px-1.5 py-1 sm:px-2 sm:py-1 rounded-lg text-xs font-medium flex items-center space-x-1 border transition shadow cursor-pointer ${
              dualScreenMode !== 'none'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Buka Denah di Monitor / Layar ke-2 [L]"
          >
            <Monitor className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden 2xl:inline">Layar 2</span>
            {dualScreenMode !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
          </button>

          {/* Menu Dropdown Pilihan Mode Layar 2 (Click Toggle - Tidak hilang saat kursor mendekat) */}
          {isDualMenuOpen && (
            <div className="absolute right-0 top-full pt-1.5 z-50" style={{ minWidth: '260px', maxWidth: 'calc(100vw - 16px)' }}>
              <div className="bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl p-2 space-y-1.5 backdrop-blur-sm" style={{ minWidth: '260px' }}>
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
                  <span>Pilihan Mode Layar 2</span>
                  <span className="text-[9px] bg-slate-800 px-1 py-0.2 rounded text-slate-400">[L]</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsDualMenuOpen(false);
                    onToggleDualScreen && onToggleDualScreen(dualScreenMode === 'canvas' ? 'none' : 'canvas');
                  }}
                  className={`w-full p-2 rounded-lg text-left text-xs transition flex items-start space-x-2 ${
                    dualScreenMode === 'canvas' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Maximize2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Kanvas CAD di Layar 2</div>
                    <div className="text-[10px] text-slate-400">Area gambar ultra luas tanpa sidebar/inspector</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDualMenuOpen(false);
                    onToggleDualScreen && onToggleDualScreen(dualScreenMode === 'presentation' ? 'none' : 'presentation');
                  }}
                  className={`w-full p-2 rounded-lg text-left text-xs transition flex items-start space-x-2 ${
                    dualScreenMode === 'presentation' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Live Blueprint (Klien/Rapat)</div>
                    <div className="text-[10px] text-slate-400">Gambar bersih kertas putih tanpa grid editor</div>
                  </div>
                </button>

                {dualScreenMode !== 'none' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDualMenuOpen(false);
                      onToggleDualScreen && onToggleDualScreen('none');
                    }}
                    className="w-full p-1.5 mt-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-center text-[11px] font-medium transition"
                  >
                    Kembalikan ke Layar 1 (Tutup)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input File & Tombol Upload Gambar Jiplakan Denah */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUploadJiplakan?.(e.target.files[0]);
              e.target.value = ''; // Reset input agar file sama bisa diunggah ulang
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`px-1.5 py-1 sm:px-2 sm:py-1 border rounded-lg text-xs font-medium flex items-center space-x-1 shadow transition shrink-0 ${
            hasJiplakan
              ? 'bg-pink-950/40 border-pink-700/60 text-pink-300 hover:bg-pink-900/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
          title="Upload Foto / Sketsa Denah untuk Dijiplak (Underlay Tracing)"
        >
          <ImageIcon className={`w-3.5 h-3.5 shrink-0 ${hasJiplakan ? 'text-pink-400' : 'text-slate-400'}`} />
          <span className="hidden 2xl:inline">Jiplak</span>
        </button>

        {/* Tombol Laporan BOM (Bill of Materials) */}
        <button
          type="button"
          onClick={onOpenBomModal}
          className="px-1.5 py-1 sm:px-2 sm:py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 shadow transition shrink-0"
          title="Lihat Rekapitulasi Kabel & Daftar Perangkat [Ctrl+B]"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="hidden 2xl:inline">BOM</span>
        </button>

        {/* Tombol & Popover Pilihan Export Denah (Dengan / Tanpa Grid) */}
        <div ref={exportMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            className={`px-1.5 py-1 sm:px-2 sm:py-1 rounded-lg text-xs font-medium flex items-center space-x-1 shadow transition shrink-0 border cursor-pointer ${
              isExportMenuOpen
                ? 'bg-sky-600/30 text-sky-300 border-sky-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Export Denah ke Gambar PNG Kertas Putih (Pilihan Dengan / Tanpa Grid) [Ctrl+E]"
          >
            <Download className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="hidden 2xl:inline">Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 top-full pt-1.5 w-72 z-50">
              <div className="bg-slate-900/98 border border-slate-700/90 rounded-xl shadow-2xl p-2.5 space-y-2 backdrop-blur-sm text-slate-200">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5">
                    <Download className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Export Denah (PNG 300 DPI)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExportMenuOpen(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 leading-tight">
                  Pilih format tampilan lembar kerja arsitektur:
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportImage(true);
                    }}
                    className="w-full p-2 rounded-lg bg-slate-800/90 hover:bg-sky-600/20 hover:border-sky-500/50 border border-slate-700 text-left transition flex items-start space-x-2.5 group cursor-pointer"
                  >
                    <Grid className="w-4 h-4 text-sky-400 mt-0.5 shrink-0 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-sky-300">
                        Export DENGAN Garis Grid CAD
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        Memuat garis petak milimeter (1m & 20cm). Sangat ideal untuk acuan teknisi lapangan & instalasi kabel.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportImage(false);
                    }}
                    className="w-full p-2 rounded-lg bg-slate-800/90 hover:bg-emerald-600/20 hover:border-emerald-500/50 border border-slate-700 text-left transition flex items-start space-x-2.5 group cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0 group-hover:scale-110 transition" />
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-300">
                        Export TANPA Grid (Kertas Polos)
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        Latar kertas putih bersih tanpa garis petak. Sangat cocok untuk laporan resmi, manajemen, dan presentasi klien.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tombol Simpan ke MariaDB */}
        <button
          type="button"
          onClick={onSaveToDb}
          disabled={isSaving}
          className="px-2 py-1 sm:px-2.5 sm:py-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-md shadow-sky-500/25 transition disabled:opacity-50 shrink-0"
          title="Simpan Seluruh Denah & Kabel ke MariaDB [Ctrl+S]"
        >
          <Save className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
        </button>

        {/* Tombol Buka Tutup Panel Properti Inspector Kanan */}
        <button
          type="button"
          onClick={onToggleRightSidebar}
          className={`p-1.5 rounded-lg border transition shrink-0 ml-0.5 ${
            isRightSidebarOpen
              ? 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-700'
              : 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
          }`}
          title={`Buka/Tutup Panel Properti Inspector Kanan [ ] ] (${isRightSidebarOpen ? 'Terbuka' : 'Tertutup'})`}
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Tombol Pengubah Tema (Dark Mode <-> Light Mode) */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg border transition shrink-0 ml-0.5 cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
            }`}
            title={theme === 'light' ? 'Ubah ke Mode Gelap (Dark Mode)' : 'Ubah ke Mode Terang (Light Mode)'}
          >
            {theme === 'light' ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-amber-400" />}
          </button>
        )}
      </div>
    </header>
  );
};
