import React from 'react';
import { FloorCanvas } from './FloorCanvas.tsx';
import {
  ToolType,
  Dinding,
  Bukaan,
  Ruangan,
  Furniture,
  Perangkat,
  KabelJalur,
  KabelTipe,
  Point,
  DenahJiplakan,
  LayerVisibility,
} from '../types/schema.ts';
import {
  MousePointer,
  Hand,
  Maximize2,
  Grid,
  ZoomIn,
  ZoomOut,
  ArrowDownLeft,
  Square,
  Circle,
  Cable,
  Ruler,
  Undo2,
  Redo2,
} from 'lucide-react';

interface PopoutCanvasViewProps {
  tool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  scalePxPerMeter: number;
  snapGrid: boolean;
  onToggleSnapGrid: () => void;
  dinding: Dinding[];
  bukaan: Bukaan[];
  ruangan: Ruangan[];
  furniture: Furniture[];
  perangkat: Perangkat[];
  kabel: KabelJalur[];
  kabelTipe: KabelTipe[];
  selectedItem: { type: string; id: string } | null;
  selectedItems?: Array<{ type: string; id: string }>;
  underlayDinding?: Dinding[];
  underlayRuangan?: Ruangan[];
  onSelectItem: (item: { type: string; id: string } | null) => void;
  onSelectItems?: (items: Array<{ type: string; id: string }>) => void;
  onUpdateDinding: (items: Dinding[]) => void;
  onUpdateBukaan: (items: Bukaan[]) => void;
  onUpdateRuangan: (items: Ruangan[]) => void;
  onUpdateFurniture: (items: Furniture[]) => void;
  onUpdatePerangkat: (items: Perangkat[]) => void;
  onUpdateKabel: (items: KabelJalur[]) => void;
  activeItemToPlace: any | null;
  selectedCableTypeId: string;
  onSelectCableType: (id: string) => void;
  tinggiPlafon: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  panOffset: Point;
  onPanChange: (offset: Point) => void;
  onDockBack: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  jiplakan?: DenahJiplakan | null;
  onUpdateJiplakan?: (item: DenahJiplakan | null) => void;
  onUploadJiplakan?: (file: File) => void;
  onDeleteJiplakan?: () => void;
  isCalibratingTracing?: boolean;
  onStartCalibration?: () => void;
  onCalibrationFinished?: () => void;
  visibleCableType?: string;
  onSelectVisibleCableType?: (id: string) => void;
  theme?: 'dark' | 'light';
  layerVisibility?: LayerVisibility;
  onSelectLayerVisibility?: (layer: LayerVisibility) => void;
}

export const PopoutCanvasView: React.FC<PopoutCanvasViewProps> = ({
  tool,
  onSelectTool,
  scalePxPerMeter,
  snapGrid,
  onToggleSnapGrid,
  dinding,
  bukaan,
  ruangan,
  furniture,
  perangkat,
  kabel,
  kabelTipe,
  selectedItem,
  selectedItems,
  underlayDinding,
  underlayRuangan,
  onSelectItem,
  onSelectItems,
  onUpdateDinding,
  onUpdateBukaan,
  onUpdateRuangan,
  onUpdateFurniture,
  onUpdatePerangkat,
  onUpdateKabel,
  activeItemToPlace,
  selectedCableTypeId,
  onSelectCableType,
  tinggiPlafon,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  panOffset,
  onPanChange,
  onDockBack,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  jiplakan,
  onUpdateJiplakan,
  onUploadJiplakan,
  onDeleteJiplakan,
  isCalibratingTracing = false,
  onStartCalibration,
  onCalibrationFinished,
  visibleCableType = 'all',
  onSelectVisibleCableType,
  theme = 'dark',
  layerVisibility = 'all',
  onSelectLayerVisibility,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleToggleFullScreen = () => {
    const doc = containerRef.current?.ownerDocument || document;
    if (!doc.fullscreenElement) {
      doc.documentElement.requestFullscreen().catch(() => {});
    } else {
      doc.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex flex-col bg-slate-950 overflow-hidden select-none"
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Floating Mini-Toolbar di Bagian Atas Kanvas Layar 2 (Standar Konsisten & Sejajar) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-2.5 py-1.5 shadow-2xl space-x-1.5 text-xs text-slate-200 select-none">
        {/* Tool Seleksi & Gambar CAD (Format Ikon + Teks Seragam h-8) */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onSelectTool('select')}
            className={`h-8 px-2.5 rounded-xl flex items-center space-x-1.5 transition font-semibold text-[11px] shrink-0 cursor-pointer ${
              tool === 'select'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Pilih & Pindahkan Objek [V]"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Pilih</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('pan')}
            className={`h-8 px-2.5 rounded-xl flex items-center space-x-1.5 transition font-semibold text-[11px] shrink-0 cursor-pointer ${
              tool === 'pan'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Geser Kanvas [H / Tahan Spasi]"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Geser</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('wall')}
            className={`h-8 px-2.5 rounded-xl flex items-center space-x-1.5 transition font-semibold text-[11px] shrink-0 cursor-pointer ${
              tool === 'wall'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Tarik Dinding Berantai [W]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Dinding</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('wall_box')}
            className={`h-8 px-2.5 rounded-xl flex items-center space-x-1.5 transition font-semibold text-[11px] shrink-0 cursor-pointer ${
              tool === 'wall_box'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Tarik Kotak Ruangan [B]"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Kotak</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('wall_circle')}
            className={`h-8 px-2.5 rounded-xl flex items-center space-x-1.5 transition font-semibold text-[11px] shrink-0 cursor-pointer ${
              tool === 'wall_circle'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Dinding Lingkaran Bulat [C]"
          >
            <Circle className="w-3.5 h-3.5" />
            <span>Bulat</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('cable')}
            className={`h-8 px-2.5 rounded-xl flex items-center space-x-1.5 transition font-semibold text-[11px] shrink-0 cursor-pointer ${
              tool === 'cable'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Tarik Jalur Kabel Jaringan [K]"
          >
            <Cable className="w-3.5 h-3.5 text-sky-400" />
            <span>Kabel</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('measure')}
            className={`h-8 px-2.5 rounded-xl flex items-center space-x-1.5 transition font-semibold text-[11px] shrink-0 cursor-pointer ${
              tool === 'measure'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-400/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Ukur Jarak Berbelok Multi-Titik [M]"
          >
            <Ruler className="w-3.5 h-3.5 text-amber-400" />
            <span>Ukur</span>
          </button>
        </div>

        {/* Tipe Kabel jika Tool Cable aktif */}
        {tool === 'cable' && (
          <div className="flex items-center pl-1 border-l border-slate-800">
            <select
              value={selectedCableTypeId}
              onChange={(e) => onSelectCableType(e.target.value)}
              className="h-8 bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-xl px-2 focus:outline-none focus:border-sky-500"
            >
              {kabelTipe.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama_tipe}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="h-4 w-px bg-slate-800 shrink-0 mx-0.5" />

        {/* Snap & Zoom Controls */}
        <div className="flex items-center space-x-0.5">
          <button
            type="button"
            onClick={onToggleSnapGrid}
            className={`h-8 w-8 rounded-xl flex items-center justify-center transition border ${
              snapGrid
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
            }`}
            title="Snap to Grid [G]"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Zoom Out [-]"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            className="h-8 px-2 hover:bg-slate-800 rounded-xl font-mono text-[11px] text-slate-300 hover:text-white transition"
            title="Reset Zoom 100% [0]"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Zoom In [+ / =]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800 shrink-0 mx-0.5" />

        {/* Undo & Redo Controls */}
        <div className="flex items-center space-x-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-8 w-8 flex items-center justify-center hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-transparent rounded-xl text-slate-300 transition cursor-pointer"
            title="Undo / Batalkan [Ctrl+Z]"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-8 w-8 flex items-center justify-center hover:bg-slate-800 disabled:opacity-25 disabled:hover:bg-transparent rounded-xl text-slate-300 transition cursor-pointer"
            title="Redo / Ulangi [Ctrl+Y / Ctrl+Shift+Z]"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800 shrink-0 mx-0.5" />

        {/* Action Layar Penuh & Kembalikan ke Layar 1 */}
        <div className="flex items-center space-x-1.5 pl-0.5">
          <button
            type="button"
            onClick={handleToggleFullScreen}
            className="h-8 w-8 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-amber-400 rounded-xl transition cursor-pointer"
            title="Layar Penuh (F11)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDockBack}
            className="h-8 px-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold text-[11px] flex items-center space-x-1.5 transition shadow-md shadow-sky-600/25 whitespace-nowrap cursor-pointer"
            title="Kembalikan Kanvas ke Jendela Utama Layar 1"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Kembali ke Layar 1</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Component occupying 100% of Screen 2 */}
      <div className="flex-1 w-full min-h-0 h-full relative">
        <FloorCanvas
          tool={tool}
          scalePxPerMeter={scalePxPerMeter}
          snapGrid={snapGrid}
          dinding={dinding}
          bukaan={bukaan}
          ruangan={ruangan}
          furniture={furniture}
          perangkat={perangkat}
          kabel={kabel}
          kabelTipe={kabelTipe}
          selectedItem={selectedItem}
          selectedItems={selectedItems}
          underlayDinding={underlayDinding}
          underlayRuangan={underlayRuangan}
          onSelectItem={onSelectItem}
          onSelectItems={onSelectItems}
          onUpdateDinding={onUpdateDinding}
          onUpdateBukaan={onUpdateBukaan}
          onUpdateRuangan={onUpdateRuangan}
          onUpdateFurniture={onUpdateFurniture}
          onUpdatePerangkat={onUpdatePerangkat}
          onUpdateKabel={onUpdateKabel}
          activeItemToPlace={activeItemToPlace}
          selectedCableTypeId={selectedCableTypeId}
          tinggiPlafon={tinggiPlafon}
          zoom={zoom}
          panOffset={panOffset}
          onPanChange={onPanChange}
          jiplakan={jiplakan}
          onUpdateJiplakan={onUpdateJiplakan}
          onUploadJiplakan={onUploadJiplakan}
          isCalibratingTracing={isCalibratingTracing}
          onCalibrationFinished={onCalibrationFinished}
          isPopout={true}
          visibleCableType={visibleCableType}
          onSelectVisibleCableType={onSelectVisibleCableType}
          theme={theme}
          layerVisibility={layerVisibility}
          onSelectLayerVisibility={onSelectLayerVisibility}
        />
      </div>
    </div>
  );
};
