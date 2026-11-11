import React, { useEffect, useRef } from 'react';
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
import { generateWhitePaperBlueprint } from '../utils/exportBlueprint.ts';
import { Maximize2, X, Download } from 'lucide-react';

interface PresentationViewProps {
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
  onClose: () => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
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
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHolderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate blueprint kertas putih real-time
    const blueprintCanvas = generateWhitePaperBlueprint({
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
    });

    blueprintCanvas.style.maxWidth = '100%';
    blueprintCanvas.style.maxHeight = '100%';
    blueprintCanvas.style.objectFit = 'contain';
    blueprintCanvas.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
    blueprintCanvas.style.borderRadius = '8px';

    if (canvasHolderRef.current) {
      canvasHolderRef.current.innerHTML = '';
      canvasHolderRef.current.appendChild(blueprintCanvas);
    }
  }, [proyek, lantai, dinding, bukaan, ruangan, furniture, perangkat, kabel, kabelTipe, scalePxPerMeter]);

  const handleDownload = () => {
    const blueprintCanvas = generateWhitePaperBlueprint({
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
    });
    const doc = containerRef.current?.ownerDocument || document;
    const link = doc.createElement('a');
    link.download = `Live_Blueprint_${lantai?.nama_lantai || 'Lantai1'}.png`;
    link.href = blueprintCanvas.toDataURL('image/png');
    link.click();
  };

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
      className="w-full h-full flex flex-col bg-slate-900 text-slate-100 select-none"
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Top Floating Control Bar */}
      <div className="h-12 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200">
            Live Presentation View • {lantai?.nama_lantai || 'Denah Lantai'}
          </span>
          <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded">
            Layar 2 Klien / Rapat
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center space-x-1 border border-slate-700 transition"
            title="Download PNG Gambar Blueprint Ini"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullScreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center space-x-1 border border-slate-700 transition"
            title="Layar Penuh (F11)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-xs flex items-center space-x-1 border border-rose-500/30 transition"
            title="Tutup & Kembalikan ke Layar 1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Blueprint Display */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 overflow-hidden">
        <div ref={canvasHolderRef} className="max-w-full max-h-full flex items-center justify-center" />
      </div>
    </div>
  );
};
