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
      {/* Floating Mini-Toolbar di Bagian Atas Kanvas Layar 2 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-2xl space-x-2 text-xs">
        {/* Tool Seleksi & Gambar Utama */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button
            type="button"
            onClick={() => onSelectTool('select')}
            className={`p-1.5 rounded-lg flex items-center space-x-1 transition ${
              tool === 'select' ? 'bg-sky-500 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Pilih Objek (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">Pilih [V]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('pan')}
            className={`p-1.5 rounded-lg flex items-center space-x-1 transition ${
              tool === 'pan' ? 'bg-sky-500 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Geser Kanvas [H / Tahan Spasi]"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Gambar Dinding & Ruangan */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button
            type="button"
            onClick={() => onSelectTool('wall')}
            className={`px-2 py-1.5 rounded-lg flex items-center space-x-1 transition ${
              tool === 'wall' ? 'bg-sky-500 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Tarik Dinding Berantai [W]"
          >
            <span className="text-xs">🧱</span>
            <span className="text-[11px]">Dinding [W]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('wall_box')}
            className={`px-2 py-1.5 rounded-lg flex items-center space-x-1 transition ${
              tool === 'wall_box' ? 'bg-sky-500 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Kotak Ruangan Sekaligus [B]"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="text-[11px]">Kotak [B]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('wall_circle')}
            className={`px-2 py-1.5 rounded-lg flex items-center space-x-1 transition ${
              tool === 'wall_circle' ? 'bg-sky-500 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Dinding Lingkaran Bulat [C]"
          >
            <Circle className="w-3.5 h-3.5" />
            <span className="text-[11px]">Bulat [C]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('cable')}
            className={`px-2 py-1.5 rounded-lg flex items-center space-x-1 transition ${
              tool === 'cable' ? 'bg-sky-500 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Tarik Jalur Kabel Jaringan [K]"
          >
            <Cable className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px]">Kabel [K]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('measure')}
            className={`p-1.5 rounded-lg transition ${
              tool === 'measure' ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Ukur Jarak Berbelok Multi-Titik [M]"
          >
            <Ruler className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tipe Kabel jika Tool Cable aktif */}
        {tool === 'cable' && (
          <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
            <select
              value={selectedCableTypeId}
              onChange={(e) => onSelectCableType(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded px-1.5 py-0.5 focus:outline-none"
            >
              {kabelTipe.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama_tipe}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Snap & Zoom Controls */}
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-800">
          <button
            type="button"
            onClick={onToggleSnapGrid}
            className={`p-1.5 rounded-lg text-xs flex items-center space-x-1 border transition ${
              snapGrid ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'text-slate-400 hover:bg-slate-800 border-transparent'
            }`}
            title="Snap to Grid [G]"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onZoomOut} className="p-1 hover:bg-slate-800 rounded text-slate-300" title="Zoom Out [-]">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onZoomReset} className="px-1.5 py-0.5 hover:bg-slate-800 rounded font-mono text-[10px]" title="Reset Zoom 100% [0]">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={onZoomIn} className="p-1 hover:bg-slate-800 rounded text-slate-300" title="Zoom In [+ / =]">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Layar Penuh & Kembalikan ke Layar 1 */}
        <div className="flex items-center space-x-1 pl-1">
          <button
            type="button"
            onClick={handleToggleFullScreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
            title="Layar Penuh (F11)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDockBack}
            className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium text-[11px] flex items-center space-x-1 transition shadow"
            title="Kembalikan Kanvas ke Jendela Utama Layar 1"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
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
        />
      </div>
    </div>
  );
};
