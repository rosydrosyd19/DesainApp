import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ToolType,
  Point,
  Dinding,
  Bukaan,
  Ruangan,
  Furniture,
  Perangkat,
  KabelJalur,
  KabelTipe,
  DimensionLine,
} from '../types/schema.ts';
import {
  getDistance,
  formatMeasurement,
  snapToGrid,
  distToSegment,
  getCctvFovPolygon,
  calculateCableLength,
  isPointInPolygon,
  isPointInBox,
  calculatePolygonArea,
} from '../utils/geometry.ts';

interface FloorCanvasProps {
  tool: ToolType;
  scalePxPerMeter: number;
  snapGrid: boolean;
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
  onUpdateBukaan?: (items: Bukaan[]) => void;
  onUpdateRuangan?: (items: Ruangan[]) => void;
  onUpdateFurniture: (items: Furniture[]) => void;
  onUpdatePerangkat: (items: Perangkat[]) => void;
  onUpdateKabel: (items: KabelJalur[]) => void;
  activeItemToPlace: any | null;
  selectedCableTypeId: string;
  tinggiPlafon?: number;
  zoom: number;
  panOffset: Point;
  onPanChange: (offset: Point) => void;
}

export const FloorCanvas: React.FC<FloorCanvasProps> = ({
  tool,
  scalePxPerMeter,
  snapGrid,
  dinding,
  bukaan,
  ruangan,
  furniture,
  perangkat,
  kabel,
  kabelTipe,
  selectedItem,
  selectedItems = [],
  underlayDinding = [],
  underlayRuangan = [],
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
  tinggiPlafon = 3.2,
  zoom,
  panOffset,
  onPanChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Pantau ukuran canvas & container secara dinamis (mendukung multi-monitor / popout window)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCanvasDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();

    const ro = new ResizeObserver(() => {
      updateDimensions();
    });
    ro.observe(container);

    const targetWin = container.ownerDocument.defaultView || window;
    targetWin.addEventListener('resize', updateDimensions);

    return () => {
      ro.disconnect();
      targetWin.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Monitor tombol Spasi untuk pan (mendukung interaksi di jendela sekunder)
  useEffect(() => {
    const targetWin = containerRef.current?.ownerDocument.defaultView || window;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    targetWin.addEventListener('keydown', onKeyDown);
    targetWin.addEventListener('keyup', onKeyUp);
    return () => {
      targetWin.removeEventListener('keydown', onKeyDown);
      targetWin.removeEventListener('keyup', onKeyUp);
    };
  }, []);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [mousePosWorld, setMousePosWorld] = useState<Point>({ x: 0, y: 0 });
  const [drawingWallStart, setDrawingWallStart] = useState<Point | null>(null);
  const [wallChainStartPoint, setWallChainStartPoint] = useState<Point | null>(null);
  const [drawingBoxStart, setDrawingBoxStart] = useState<Point | null>(null);
  const [drawingCircleStart, setDrawingCircleStart] = useState<Point | null>(null);
  const [cableWaypoints, setCableWaypoints] = useState<Point[]>([]);
  const [cableStartDevice, setCableStartDevice] = useState<Perangkat | null>(null);
  const [measuringStart, setMeasuringStart] = useState<Point | null>(null);
  const [measurePoints, setMeasurePoints] = useState<Point[]>([]);
  const [tempMeasurement, setTempMeasurement] = useState<DimensionLine | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragItemOffset, setDragItemOffset] = useState<Point>({ x: 0, y: 0 });
  const [draggingWallHandle, setDraggingWallHandle] = useState<'p1' | 'p2' | 'body' | 'curvature' | null>(null);
  const [draggingBukaanHandle, setDraggingBukaanHandle] = useState<'body' | 'rotate' | 'resize_left' | 'resize_right' | null>(null);
  const [dragWallStartWorld, setDragWallStartWorld] = useState<Point>({ x: 0, y: 0 });
  const [dragWallOrig, setDragWallOrig] = useState<{ x1: number; y1: number; x2: number; y2: number }>({ x1: 0, y1: 0, x2: 0, y2: 0 });

  // State Marquee Box Selection
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxSelectionStart, setBoxSelectionStart] = useState<Point | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // State Batch Move (Memindahkan Banyak Dinding / Barang Sekaligus)
  const [isDraggingBatch, setIsDraggingBatch] = useState(false);
  const [batchDragStartWorld, setBatchDragStartWorld] = useState<Point>({ x: 0, y: 0 });
  const [batchOrigWalls, setBatchOrigWalls] = useState<Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>>([]);
  const [batchOrigBukaan, setBatchOrigBukaan] = useState<Array<{ id: string; posisi_x: number; posisi_y: number }>>([]);
  const [batchOrigFurn, setBatchOrigFurn] = useState<Array<{ id: string; posisi_x: number; posisi_y: number }>>([]);
  const [batchOrigDev, setBatchOrigDev] = useState<Array<{ id: string; posisi_x: number; posisi_y: number }>>([]);
  const [batchOrigRooms, setBatchOrigRooms] = useState<Array<{ id: string; polygon_points: Point[] }>>([]);

  // State Resize & Drag Ruangan / Zonasi
  const [draggingRoomHandle, setDraggingRoomHandle] = useState<'nw' | 'ne' | 'se' | 'sw' | 'body' | null>(null);
  const [dragRoomStartWorld, setDragRoomStartWorld] = useState<Point>({ x: 0, y: 0 });
  const [dragRoomOrigPoints, setDragRoomOrigPoints] = useState<Point[]>([]);

  // Helper cek apakah suatu elemen sedang dipilih (baik single maupun multi-select)
  const isItemSelected = (type: string, id: string): boolean => {
    if (selectedItem?.type === type && selectedItem?.id === id) return true;
    return selectedItems.some((s) => s.type === type && s.id === id);
  };

  // Grid step: 1 meter = scalePxPerMeter px
  const gridSizePx = scalePxPerMeter; // 1 meter major grid
  const subGridSizePx = scalePxPerMeter / 5; // 0.2m minor grid

  // Konversi koordinat Layar (Screen) ke Dunia (World Canvas)
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      const worldX = (screenX - panOffset.x) / zoom;
      const worldY = (screenY - panOffset.y) / zoom;
      if (snapGrid && tool !== 'pan' && tool !== 'select') {
        return {
          x: snapToGrid(worldX, subGridSizePx),
          y: snapToGrid(worldY, subGridSizePx),
        };
      }
      return { x: worldX, y: worldY };
    },
    [panOffset, zoom, snapGrid, subGridSizePx, tool]
  );

  // Render Loop Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display pada jendela utama maupun jendela sekunder Layar 2
    const targetWin = canvas.ownerDocument.defaultView || window;
    const dpr = targetWin.devicePixelRatio || 1;
    const width = canvasDimensions.width || canvas.clientWidth || 800;
    const height = canvasDimensions.height || canvas.clientHeight || 600;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#0f172a'; // CAD dark slate
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Terapkan Pan & Zoom
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 1. Gambar Grid Ber-Skala (Meters)
    drawGrid(ctx, width, height, panOffset, zoom, gridSizePx, subGridSizePx);

    // 1.2. Gambar Bayangan Lantai Lain (Ghost View / Onion Skinning Arsitektur & Shaft)
    if (underlayDinding && underlayDinding.length > 0) {
      drawUnderlay(ctx, underlayDinding, underlayRuangan, scalePxPerMeter);
    }

    // 1.5. Gambar Zonasi Ruangan
    drawRooms(ctx, ruangan);

    // 2. Gambar Kerucut CCTV FOV & Radius AP Wi-Fi (Lapisan Bawah)
    drawCoverageAreas(ctx, perangkat, scalePxPerMeter);

    // 3. Gambar Jalur Kabel Internet & Jaringan
    drawCables(ctx, kabel, kabelTipe, scalePxPerMeter, selectedItem);

    // 4. Gambar Dinding Bangunan (dengan label meter di dinding)
    drawWalls(ctx, dinding, scalePxPerMeter, selectedItem);

    // 5. Gambar Bukaan (Pintu & Jendela)
    drawOpenings(ctx, bukaan, scalePxPerMeter, selectedItem);

    // 6. Gambar Furniture (Meja Client, Kursi)
    drawFurniture(ctx, furniture, scalePxPerMeter, selectedItem);

    // 7. Gambar Perangkat IT & CCTV & AP & Server Rack
    drawDevices(ctx, perangkat, scalePxPerMeter, selectedItem);

    // 8. Gambar Aktivitas Menggambar yang Sedang Berjalan (Preview)
    drawActiveDrawing(ctx);

    ctx.restore();

    // 9. Gambar Penggaris (Rulers) X dan Y di atas canvas (Screen Space)
    drawRulers(ctx, width, height, panOffset, zoom, scalePxPerMeter);

    // 10. Gambar Scale Bar penunjuk ukuran di pojok kiri bawah
    drawScaleBar(ctx, width, height, scalePxPerMeter, zoom);

  }, [
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
    zoom,
    panOffset,
    scalePxPerMeter,
    mousePosWorld,
    drawingWallStart,
    wallChainStartPoint,
    drawingBoxStart,
    drawingCircleStart,
    cableWaypoints,
    measurePoints,
    isBoxSelecting,
    selectionBox,
    canvasDimensions,
    tool,
    isMouseDown,
  ]);

  // Fungsi Gambar Grid
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    offset: Point,
    currentZoom: number,
    major: number,
    minor: number
  ) => {
    const startX = -offset.x / currentZoom - 100;
    const startY = -offset.y / currentZoom - 100;
    const endX = (width - offset.x) / currentZoom + 100;
    const endY = (height - offset.y) / currentZoom + 100;

    // Sub-grid (0.2 meter)
    if (currentZoom >= 0.7) {
      ctx.beginPath();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5 / currentZoom;
      for (let x = Math.floor(startX / minor) * minor; x <= endX; x += minor) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = Math.floor(startY / minor) * minor; y <= endY; y += minor) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }

    // Major grid (1 meter)
    ctx.beginPath();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1 / currentZoom;
    for (let x = Math.floor(startX / major) * major; x <= endX; x += major) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = Math.floor(startY / major) * major; y <= endY; y += major) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  };

  // Gambar Bayangan Lantai Lain (Ghost View / Onion Skinning Arsitektur & Jalur Riser)
  const drawUnderlay = (
    ctx: CanvasRenderingContext2D,
    walls: Dinding[],
    rooms: Ruangan[] | undefined,
    scale: number
  ) => {
    ctx.save();

    // 1. Bayangan Ruangan Lantai Lain
    if (rooms && rooms.length > 0) {
      rooms.forEach((r) => {
        if (!r.polygon_points || r.polygon_points.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(r.polygon_points[0].x, r.polygon_points[0].y);
        for (let i = 1; i < r.polygon_points.length; i++) {
          ctx.lineTo(r.polygon_points[i].x, r.polygon_points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.04)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // 2. Bayangan Dinding Lantai Lain (Garis Putus-Putus Halus Transparan)
    walls.forEach((w) => {
      const wallThickness = (w.ketebalan_cm / 100) * scale || 8;
      ctx.beginPath();
      if (w.tipe_bentuk === 'lingkaran') {
        const radiusPx = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
        ctx.arc(w.x1, w.y1, radiusPx, 0, Math.PI * 2);
      } else if (w.tipe_bentuk === 'lengkung') {
        const chordPx = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
        const midX = (w.x1 + w.x2) / 2;
        const midY = (w.y1 + w.y2) / 2;
        const L = Math.max(1, chordPx);
        const nx = -(w.y2 - w.y1) / L;
        const ny = (w.x2 - w.x1) / L;
        const sagitta = w.kelengkungan || 35;
        const cpX = midX + nx * (sagitta * 2);
        const cpY = midY + ny * (sagitta * 2);
        ctx.moveTo(w.x1, w.y1);
        ctx.quadraticCurveTo(cpX, cpY, w.x2, w.y2);
      } else {
        ctx.moveTo(w.x1, w.y1);
        ctx.lineTo(w.x2, w.y2);
      }
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = Math.max(2, wallThickness - 2);
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    ctx.restore();
  };

  // Gambar Zonasi Ruangan / Area
  const drawRooms = (ctx: CanvasRenderingContext2D, roomList: Ruangan[]) => {
    roomList?.forEach((r) => {
      if (!r.polygon_points || r.polygon_points.length < 3) return;
      const isSel = isItemSelected('ruangan', r.id);

      ctx.beginPath();
      ctx.moveTo(r.polygon_points[0].x, r.polygon_points[0].y);
      for (let i = 1; i < r.polygon_points.length; i++) {
        ctx.lineTo(r.polygon_points[i].x, r.polygon_points[i].y);
      }
      ctx.closePath();

      // Warna fill ruangan (lebih tegas jika dipilih)
      ctx.fillStyle = isSel ? 'rgba(56, 189, 248, 0.22)' : (r.warna_area || 'rgba(56, 189, 248, 0.08)');
      ctx.fill();

      // Garis border ruangan
      ctx.strokeStyle = isSel ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = isSel ? 2 : 1.2;
      if (!isSel) {
        ctx.setLineDash([5, 5]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Hitung luas dan ukuran bounding box ruangan
      const xs = r.polygon_points.map((p) => p.x);
      const ys = r.polygon_points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const widthM = (maxX - minX) / scalePxPerMeter;
      const heightM = (maxY - minY) / scalePxPerMeter;
      const luasM2 = calculatePolygonArea(r.polygon_points, scalePxPerMeter);

      const avgX = (minX + maxX) / 2;
      const avgY = (minY + maxY) / 2;

      // Label Nama Ruangan & Luas m2
      ctx.save();
      ctx.translate(avgX, avgY);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = isSel ? '#38bdf8' : '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.nama_ruangan.toUpperCase(), 0, -8);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = isSel ? '#7dd3fc' : '#94a3b8';
      ctx.fillText(`${widthM.toFixed(1)}m × ${heightM.toFixed(1)}m (${luasM2.toFixed(1)} m²)`, 0, 10);
      ctx.restore();

      // Jika ruangan sedang dipilih, gambar 4 Corner Resize Handles
      if (isSel) {
        const handles = [
          { type: 'nw', x: minX, y: minY },
          { type: 'ne', x: maxX, y: minY },
          { type: 'se', x: maxX, y: maxY },
          { type: 'sw', x: minX, y: maxY },
        ];

        handles.forEach((h) => {
          ctx.beginPath();
          ctx.rect(h.x - 5, h.y - 5, 10, 10);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }
    });
  };

  // Gambar Dinding dengan Ukuran Panjang Meter (Mendukung Lurus, Lengkung/Busur, dan Lingkaran Penuh)
  const drawWalls = (
    ctx: CanvasRenderingContext2D,
    wallList: Dinding[],
    scale: number,
    selected: { type: string; id: string } | null
  ) => {
    wallList.forEach((w) => {
      const isSel = isItemSelected('wall', w.id);
      const wallThickness = (w.ketebalan_cm / 100) * scale || 8;

      // 1. DINDING MELINGKAR PENUH (CIRCULAR ROOM / SILO / TANGGA PUTAR)
      if (w.tipe_bentuk === 'lingkaran') {
        const radiusPx = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
        const diaM = (radiusPx * 2) / scale;
        const kelilingM = (2 * Math.PI * radiusPx) / scale;

        ctx.beginPath();
        ctx.arc(w.x1, w.y1, radiusPx, 0, Math.PI * 2);
        ctx.strokeStyle = isSel ? '#38bdf8' : w.warna || '#475569';
        ctx.lineWidth = wallThickness;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(w.x1, w.y1, radiusPx, 0, Math.PI * 2);
        ctx.strokeStyle = isSel ? '#0284c7' : '#1e293b';
        ctx.lineWidth = Math.max(1, wallThickness - 3);
        ctx.stroke();

        // Badge Ukuran Lingkaran
        const label = `Lingkaran: Dia ${formatMeasurement(diaM)} (Kll: ${formatMeasurement(kelilingM)})`;
        ctx.save();
        ctx.translate(w.x1, w.y1 - radiusPx - 10);
        ctx.font = 'bold 11px sans-serif';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = isSel ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 1;
        ctx.fillRect(-tw / 2 - 6, -9, tw + 12, 18);
        ctx.strokeRect(-tw / 2 - 6, -9, tw + 12, 18);
        ctx.fillStyle = isSel ? '#38bdf8' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
        ctx.restore();

        if (isSel) {
          // Handle Titik Pusat
          ctx.beginPath();
          ctx.arc(w.x1, w.y1, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Handle Jari-jari / Radius di Tepi
          ctx.beginPath();
          ctx.arc(w.x2, w.y2, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        return;
      }

      // 2. DINDING LENGKUNG / BUSUR (CURVED ARC WALL)
      if (w.tipe_bentuk === 'lengkung') {
        const chordPx = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
        const midX = (w.x1 + w.x2) / 2;
        const midY = (w.y1 + w.y2) / 2;
        const L = Math.max(1, chordPx);
        const nx = -(w.y2 - w.y1) / L;
        const ny = (w.x2 - w.x1) / L;
        const sagitta = w.kelengkungan || 35; // tinggi lengkungan

        // Control point untuk Quadratic Bézier
        const cpX = midX + nx * (sagitta * 2);
        const cpY = midY + ny * (sagitta * 2);
        const apexX = midX + nx * sagitta;
        const apexY = midY + ny * sagitta;

        // Panjang busur aproksimasi Ramanujan / Parabola
        const arcLenPx = Math.sqrt(L * L + (16 / 3) * sagitta * sagitta);
        const arcLenM = arcLenPx / scale;
        const radiusM = (L * L / 4 + sagitta * sagitta) / (2 * Math.max(1, Math.abs(sagitta))) / scale;

        ctx.beginPath();
        ctx.moveTo(w.x1, w.y1);
        ctx.quadraticCurveTo(cpX, cpY, w.x2, w.y2);
        ctx.strokeStyle = isSel ? '#38bdf8' : w.warna || '#475569';
        ctx.lineWidth = wallThickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w.x1, w.y1);
        ctx.quadraticCurveTo(cpX, cpY, w.x2, w.y2);
        ctx.strokeStyle = isSel ? '#0284c7' : '#1e293b';
        ctx.lineWidth = Math.max(1, wallThickness - 3);
        ctx.stroke();

        // Badge Ukuran Busur
        const label = `Busur: ${formatMeasurement(arcLenM)} (R: ${formatMeasurement(radiusM)})`;
        ctx.save();
        ctx.translate(apexX, apexY - 10);
        ctx.font = 'bold 11px sans-serif';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = isSel ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 1;
        ctx.fillRect(-tw / 2 - 6, -9, tw + 12, 18);
        ctx.strokeRect(-tw / 2 - 6, -9, tw + 12, 18);
        ctx.fillStyle = isSel ? '#38bdf8' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
        ctx.restore();

        if (isSel) {
          // Handle P1 & P2
          ctx.beginPath();
          ctx.arc(w.x1, w.y1, 6, 0, Math.PI * 2);
          ctx.arc(w.x2, w.y2, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Handle Kelengkungan di Puncak Busur (Apex)
          ctx.beginPath();
          ctx.arc(apexX, apexY, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        return;
      }

      // 3. DINDING LURUS STANDAR
      const wallLenPx = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
      const wallLenMeters = wallLenPx / scale;

      // Garis Dinding
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.strokeStyle = isSel ? '#38bdf8' : w.warna || '#475569';
      ctx.lineWidth = wallThickness;
      ctx.lineCap = 'square';
      ctx.stroke();

      // Core dinding dalam (arsitektur CAD)
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.strokeStyle = isSel ? '#0284c7' : '#1e293b';
      ctx.lineWidth = Math.max(1, wallThickness - 3);
      ctx.stroke();

      // Label Ukuran Tertera di Atas Dinding
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

      // Background badge ukuran
      const label = formatMeasurement(wallLenMeters);
      ctx.font = 'bold 11px sans-serif';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = isSel ? '#38bdf8' : '#64748b';
      ctx.lineWidth = 1;
      ctx.fillRect(-textWidth / 2 - 4, -8, textWidth + 8, 16);
      ctx.strokeRect(-textWidth / 2 - 4, -8, textWidth + 8, 16);

      ctx.fillStyle = isSel ? '#38bdf8' : '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);

      ctx.restore();

      // Jika dinding sedang dipilih, gambar handle interaktif
      if (isSel) {
        // Handle Ujung 1 (P1)
        ctx.beginPath();
        ctx.arc(w.x1, w.y1, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Handle Ujung 2 (P2)
        ctx.beginPath();
        ctx.arc(w.x2, w.y2, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Handle Titik Tengah (Move Wall)
        ctx.beginPath();
        ctx.arc(midX, midY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  };

  // Gambar Bukaan (Pintu & Jendela) dengan Handle Rotasi & Resize
  const drawOpenings = (
    ctx: CanvasRenderingContext2D,
    openings: Bukaan[],
    scale: number,
    selected: { type: string; id: string } | null
  ) => {
    openings.forEach((b) => {
      const isSel = isItemSelected('bukaan', b.id);
      const widthPx = (b.lebar_cm / 100) * scale;
      const halfW = widthPx / 2;

      ctx.save();
      ctx.translate(b.posisi_x, b.posisi_y);
      ctx.rotate((b.rotasi * Math.PI) / 180);

      if (b.tipe === 'pintu_tunggal') {
        // 1. PINTU TUNGGAL SWING
        // Kusen / Frame
        ctx.fillStyle = isSel ? '#38bdf8' : '#64748b';
        ctx.fillRect(-halfW - 3, -4, 6, 8);
        ctx.fillRect(halfW - 3, -4, 6, 8);

        // Daun Pintu Tebal
        ctx.strokeStyle = isSel ? '#38bdf8' : '#f8fafc';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-halfW, 0);
        ctx.lineTo(-halfW, -widthPx);
        ctx.stroke();

        // Lengkungan Swing Pintu
        ctx.beginPath();
        ctx.arc(-halfW, 0, widthPx, -Math.PI / 2, 0, false);
        ctx.strokeStyle = isSel ? '#38bdf8' : 'rgba(226, 232, 240, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (b.tipe === 'pintu_ganda') {
        // 2. PINTU GANDA (DOUBLE SWING)
        ctx.fillStyle = isSel ? '#38bdf8' : '#64748b';
        ctx.fillRect(-halfW - 3, -4, 6, 8);
        ctx.fillRect(halfW - 3, -4, 6, 8);

        // Daun Kiri (Setengah Lebar)
        ctx.strokeStyle = isSel ? '#38bdf8' : '#f8fafc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-halfW, 0);
        ctx.lineTo(-halfW, -halfW);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-halfW, 0, halfW, -Math.PI / 2, 0, false);
        ctx.strokeStyle = isSel ? '#38bdf8' : 'rgba(226, 232, 240, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Daun Kanan (Setengah Lebar)
        ctx.strokeStyle = isSel ? '#38bdf8' : '#f8fafc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(halfW, 0);
        ctx.lineTo(halfW, -halfW);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(halfW, 0, halfW, -Math.PI / 2, -Math.PI, true);
        ctx.strokeStyle = isSel ? '#38bdf8' : 'rgba(226, 232, 240, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (b.tipe === 'pintu_geser') {
        // 3. PINTU GESER (SLIDING DOOR)
        ctx.strokeStyle = isSel ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW, -5, widthPx, 10);

        ctx.fillStyle = isSel ? 'rgba(56, 189, 248, 0.25)' : 'rgba(203, 213, 225, 0.2)';
        ctx.fillRect(-halfW, -5, widthPx, 10);

        // Daun geser 1 & 2
        ctx.strokeStyle = isSel ? '#38bdf8' : '#f8fafc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-halfW + 4, -2);
        ctx.lineTo(2, -2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-2, 2);
        ctx.lineTo(halfW - 4, 2);
        ctx.stroke();
      } else {
        // 4. JENDELA KACA
        // Kusen Jendela
        ctx.fillStyle = isSel ? '#0284c7' : '#334155';
        ctx.fillRect(-halfW, -4, widthPx, 8);
        ctx.strokeStyle = isSel ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-halfW, -4, widthPx, 8);

        // Garis Kaca Tengah Ganda
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fillRect(-halfW + 2, -2, widthPx - 4, 4);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-halfW + 3, -1);
        ctx.lineTo(halfW - 3, -1);
        ctx.moveTo(-halfW + 3, 1);
        ctx.lineTo(halfW - 3, 1);
        ctx.stroke();
      }

      // Badge Ukuran & Rotasi Tertera
      const label = `${b.tipe === 'jendela' ? 'Jendela' : 'Pintu'}: ${b.lebar_cm}cm (${b.rotasi}°)`;
      ctx.save();
      const badgeY = b.tipe === 'jendela' ? -18 : 16;
      ctx.translate(0, badgeY);
      ctx.font = 'bold 10px sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = isSel ? '#38bdf8' : '#475569';
      ctx.lineWidth = 1;
      ctx.fillRect(-tw / 2 - 5, -8, tw + 10, 16);
      ctx.strokeRect(-tw / 2 - 5, -8, tw + 10, 16);
      ctx.fillStyle = isSel ? '#38bdf8' : '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();

      // JIKA SEDANG DIPILIH: TAMPILKAN HANDLE INTERAKTIF
      if (isSel) {
        // Kotak seleksi putus-putus
        const boundsH = (b.tipe === 'pintu_tunggal' || b.tipe === 'pintu_ganda') ? widthPx + 10 : 20;
        const boundsY = (b.tipe === 'pintu_tunggal' || b.tipe === 'pintu_ganda') ? -widthPx - 5 : -10;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-halfW - 8, boundsY, widthPx + 16, boundsH + 15);
        ctx.setLineDash([]);

        // 1. Handle Resize Kiri (Hijau)
        ctx.beginPath();
        ctx.arc(-halfW, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Handle Resize Kanan (Hijau)
        ctx.beginPath();
        ctx.arc(halfW, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3. Handle Rotasi (Kuning/Oranye dengan tangkai)
        const rotY = -Math.max(25, halfW + 18);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, rotY);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(0, rotY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Handle Pusat (Biru)
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    });
  };

  // Gambar Furniture (Meja Client, Kursi, dsb.)
  const drawFurniture = (
    ctx: CanvasRenderingContext2D,
    items: Furniture[],
    scale: number,
    selected: { type: string; id: string } | null
  ) => {
    items.forEach((item) => {
      const isSel = isItemSelected('furniture', item.id);
      const wPx = (item.lebar_cm / 100) * scale;
      const hPx = (item.panjang_cm / 100) * scale;

      ctx.save();
      ctx.translate(item.posisi_x, item.posisi_y);
      ctx.rotate((item.rotasi * Math.PI) / 180);

      // Permukaan Meja
      ctx.fillStyle = isSel ? '#1e3a5f' : '#1e293b';
      ctx.strokeStyle = isSel ? '#38bdf8' : '#475569';
      ctx.lineWidth = isSel ? 2 : 1.5;
      ctx.beginPath();
      ctx.roundRect(-wPx / 2, -hPx / 2, wPx, hPx, 4);
      ctx.fill();
      ctx.stroke();

      // Ikon Monitor & Keyboard di Meja Client
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-16, -hPx / 2 + 6, 32, 4); // Layar monitor
      ctx.fillRect(-12, -hPx / 2 + 15, 24, 10); // Keyboard

      // Kursi Kerja
      ctx.beginPath();
      ctx.arc(0, hPx / 2 + 10, 10, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? '#0284c7' : '#334155';
      ctx.fill();
      ctx.stroke();

      // Label Meja & Pemilik Client
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(item.label || 'Meja Client', 0, 0);

      if (item.pemilik_client) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(item.pemilik_client, 0, 12);
      }

      ctx.restore();
    });
  };

  // Gambar Perangkat IT & CCTV & AP
  const drawDevices = (
    ctx: CanvasRenderingContext2D,
    devList: Perangkat[],
    scale: number,
    selected: { type: string; id: string } | null
  ) => {
    devList.forEach((dev) => {
      const isSel = isItemSelected('perangkat', dev.id);
      ctx.save();
      ctx.translate(dev.posisi_x, dev.posisi_y);
      ctx.rotate((dev.rotasi * Math.PI) / 180);

      // Render sesuai Kategori Perangkat
      if (dev.kategori === 'rack_server') {
        // Visual Server Rack (42U / Standing Rack)
        const rw = 0.8 * scale; // 80cm
        const rh = 1.0 * scale; // 100cm
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = isSel ? '#38bdf8' : '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(-rw / 2, -rh / 2, rw, rh);
        ctx.fillRect(-rw / 2, -rh / 2, rw, rh);

        // Garis rak / unit slots
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 1;
        for (let i = -rh / 2 + 6; i < rh / 2; i += 8) {
          ctx.beginPath();
          ctx.moveTo(-rw / 2 + 4, i);
          ctx.lineTo(rw / 2 - 4, i);
          ctx.stroke();
        }
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SERVER RACK', 0, -rh / 2 - 6);
      } else if (dev.kategori === 'switch') {
        // Switch Rackmount
        const sw = 0.5 * scale;
        const sh = 0.25 * scale;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = isSel ? '#38bdf8' : '#10b981';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
        ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);

        // Port LED array
        ctx.fillStyle = '#10b981';
        for (let x = -sw / 2 + 6; x < sw / 2 - 6; x += 6) {
          ctx.fillRect(x, -sh / 2 + 4, 3, 3);
        }
      } else if (dev.kategori === 'cctv') {
        // CCTV Camera Icon
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? '#38bdf8' : '#f97316';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Arah Lensa
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(14, 0);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (dev.kategori === 'access_point') {
        // Access Point Icon (Lingkaran dengan LED)
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? '#38bdf8' : '#059669';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Simbol gelombang Wi-Fi kecil
        ctx.beginPath();
        ctx.arc(0, 0, 6, -Math.PI / 4, Math.PI / 4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (dev.kategori === 'pc_client') {
        // PC Client Workstation
        ctx.fillStyle = isSel ? '#38bdf8' : '#64748b';
        ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-8, -8, 16, 16);
      } else if (dev.kategori === 'printer') {
        // Network Printer
        ctx.fillStyle = '#475569';
        ctx.fillRect(-14, -12, 28, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8, -10, 16, 4); // Kertas atas
        ctx.fillRect(-8, 6, 16, 4); // Kertas bawah
      } else if (dev.kategori === 'shaft_riser') {
        // Simbol Shaft / Riser Kabel (Arsitektur CAD: Kotak dengan Silang 'X' diagonal)
        const sw = 0.5 * scale;
        const sh = 0.5 * scale;
        ctx.fillStyle = isSel ? 'rgba(56, 189, 248, 0.25)' : 'rgba(245, 158, 11, 0.2)';
        ctx.strokeStyle = isSel ? '#38bdf8' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
        ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);

        // Garis diagonal silang X arsitektur
        ctx.beginPath();
        ctx.moveTo(-sw / 2, -sh / 2);
        ctx.lineTo(sw / 2, sh / 2);
        ctx.moveTo(sw / 2, -sh / 2);
        ctx.lineTo(-sw / 2, sh / 2);
        ctx.strokeStyle = isSel ? '#38bdf8' : '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Titik penembus kabel vertikal di tengah
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      } else {
        // Default device generic
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? '#38bdf8' : '#64748b';
        ctx.fill();
      }

      ctx.restore();

      // Label Nama Perangkat & IP Address (di luar rotasi agar selalu terbaca)
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = isSel ? '#38bdf8' : '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.fillText(dev.nama_perangkat, dev.posisi_x, dev.posisi_y + 18);

      if (dev.kategori === 'shaft_riser') {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('SHAFT (L1 ⇄ L2)', dev.posisi_x, dev.posisi_y + 28);
      } else if (dev.ip_address) {
        ctx.font = '9px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(dev.ip_address, dev.posisi_x, dev.posisi_y + 28);
      }
    });
  };

  // Gambar Visual FOV CCTV & Radius Wi-Fi Access Point
  const drawCoverageAreas = (ctx: CanvasRenderingContext2D, devList: Perangkat[], scale: number) => {
    devList.forEach((dev) => {
      if (dev.kategori === 'cctv') {
        const radiusPx = (dev.cctv_jarak_meter || 12) * scale;
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
        // Gradien kerucut CCTV
        ctx.fillStyle = 'rgba(249, 115, 22, 0.12)'; // Oranye transparan
        ctx.fill();
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (dev.kategori === 'access_point') {
        const radiusPx = (dev.ap_radius_meter || 12) * scale;
        ctx.beginPath();
        ctx.arc(dev.posisi_x, dev.posisi_y, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)'; // Hijau Wi-Fi transparan
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label radius meter di tepi lingkaran sinyal
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#10b981';
        ctx.fillText(`Wi-Fi Radius: ${dev.ap_radius_meter || 12}m`, dev.posisi_x, dev.posisi_y - radiusPx - 4);
      }
    });
  };

  // Gambar Jalur Kabel & Label Panjang
  const drawCables = (
    ctx: CanvasRenderingContext2D,
    cableList: KabelJalur[],
    types: KabelTipe[],
    scale: number,
    selected: { type: string; id: string } | null
  ) => {
    cableList.forEach((c) => {
      const isSel = isItemSelected('kabel', c.id);
      const typeInfo = types.find((t) => t.id === c.tipe_kabel_id);
      const color = isSel ? '#38bdf8' : typeInfo?.warna_hex || c.warna_hex || '#3b82f6';

      if (!c.waypoints || c.waypoints.length < 2) return;

      // Garis Jalur Kabel
      ctx.beginPath();
      ctx.moveTo(c.waypoints[0].x, c.waypoints[0].y);
      for (let i = 1; i < c.waypoints.length; i++) {
        ctx.lineTo(c.waypoints[i].x, c.waypoints[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = isSel ? 3.5 : 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Titik sambungan waypoint
      c.waypoints.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      // Label Panjang Total Kabel di Titik Tengah Jalur
      const midIdx = Math.floor(c.waypoints.length / 2);
      const midPoint = c.waypoints[midIdx] || c.waypoints[0];

      ctx.save();
      ctx.translate(midPoint.x, midPoint.y);
      const label = `${c.kode_kabel} (${c.total_panjang_meter.toFixed(1)}m)`;
      ctx.font = 'bold 9px sans-serif';
      const tw = ctx.measureText(label).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.fillRect(-tw / 2 - 4, -7, tw + 8, 14);
      ctx.strokeRect(-tw / 2 - 4, -7, tw + 8, 14);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  };

  // Gambar Aktivitas Menggambar yang Sedang Berlangsung (Preview Realtime)
  const drawActiveDrawing = (ctx: CanvasRenderingContext2D) => {
    // 1. Preview Tarik Dinding Kontinu / Muter
    if (drawingWallStart && tool === 'wall') {
      const p1 = drawingWallStart;
      let p2 = mousePosWorld;
      const isNearLoopStart =
        wallChainStartPoint &&
        getDistance(p1, wallChainStartPoint) > 10 &&
        getDistance(mousePosWorld, wallChainStartPoint) < 20;

      if (isNearLoopStart && wallChainStartPoint) {
        p2 = wallChainStartPoint;
      }

      const distPx = getDistance(p1, p2);
      const distM = distPx / scalePxPerMeter;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = isNearLoopStart ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Indikator Titik Awal untuk Tutup Ruangan
      if (wallChainStartPoint) {
        ctx.beginPath();
        ctx.arc(wallChainStartPoint.x, wallChainStartPoint.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = isNearLoopStart ? '#10b981' : '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (isNearLoopStart) {
          ctx.save();
          ctx.translate(wallChainStartPoint.x, wallChainStartPoint.y - 18);
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'center';
          ctx.fillText('Klik untuk Menutup Ruangan (Loop Selesai)', 0, 0);
          ctx.restore();
        }
      }

      // Label Ukuran Realtime saat ditarik
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const label = formatMeasurement(distM);

      ctx.save();
      ctx.translate(midX, midY);
      ctx.font = 'bold 12px sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = isNearLoopStart ? '#059669' : '#0284c7';
      ctx.fillRect(-tw / 2 - 6, -10, tw + 12, 20);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();

      // Hint di bawah kursor
      ctx.save();
      ctx.translate(mousePosWorld.x + 15, mousePosWorld.y + 20);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Klik untuk belok | Enter / Esc / Double-click untuk selesai', 0, 0);
      ctx.restore();
    }

    // 1.2 Preview Kotak Ruangan Sekaligus (4 Dinding Kotak)
    if (drawingBoxStart && tool === 'wall_box') {
      const p1 = drawingBoxStart;
      const p2 = mousePosWorld;
      const minX = Math.min(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const wPx = Math.abs(p2.x - p1.x);
      const hPx = Math.abs(p2.y - p1.y);
      const wM = wPx / scalePxPerMeter;
      const hM = hPx / scalePxPerMeter;

      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.strokeRect(minX, minY, wPx, hPx);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(minX, minY, wPx, hPx);

      // Label Ukuran Kotak
      const label = `Ruangan: ${formatMeasurement(wM)} x ${formatMeasurement(hM)}`;
      ctx.save();
      ctx.translate(minX + wPx / 2, minY + hPx / 2);
      ctx.font = 'bold 13px sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-tw / 2 - 8, -12, tw + 16, 24);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

    // 1.3 Preview Dinding Lingkaran Bulat Penuh
    if (drawingCircleStart && tool === 'wall_circle') {
      const p1 = drawingCircleStart;
      const p2 = mousePosWorld;
      const radPx = getDistance(p1, p2);
      const radM = radPx / scalePxPerMeter;
      const diaM = radM * 2;
      const kllM = 2 * Math.PI * radM;

      ctx.beginPath();
      ctx.arc(p1.x, p1.y, radPx, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fill();

      // Garis jari-jari / radius
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const label = `Lingkaran: Dia ${formatMeasurement(diaM)} (Kll: ${formatMeasurement(kllM)})`;
      ctx.save();
      ctx.translate(p1.x, p1.y - radPx - 12);
      ctx.font = 'bold 12px sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-tw / 2 - 8, -12, tw + 16, 24);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

    // 2. Preview Tarik Kabel
    if (cableWaypoints.length > 0 && tool === 'cable') {
      const pts = [...cableWaypoints, mousePosWorld];
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const curLen = calculateCableLength(pts, scalePxPerMeter);
      const H = tinggiPlafon || 3.2;
      const estDropAsal = H;
      const estDropTujuan = Math.max(1.5, Number((H - 0.75).toFixed(2)));
      const estDrop = Number((estDropAsal + estDropTujuan + 1.0).toFixed(1));
      const estTotal = curLen + estDrop;
      ctx.save();
      ctx.translate(mousePosWorld.x + 15, mousePosWorld.y - 15);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      const txt = `Rute: ${curLen.toFixed(1)}m + Vertikal & Slack ${estDrop.toFixed(1)}m (Atap ${H}m) = ${estTotal.toFixed(1)}m`;
      ctx.font = 'bold 10px sans-serif';
      const tw = ctx.measureText(txt).width;
      ctx.fillRect(-4, -12, tw + 8, 18);
      ctx.strokeRect(-4, -12, tw + 8, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    }

    // 3. Preview Tool Pengukur Polyline (Bisa Belok-belok Seperti Menarik Kabel)
    if (tool === 'measure') {
      const pts = [...measurePoints];
      if (measuringStart || pts.length > 0) {
        pts.push(mousePosWorld);
      }

      if (pts.length >= 2) {
        ctx.save();
        // Garis putus-putus oranye
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Titik node belokan
        pts.forEach((p, idx) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = idx === pts.length - 1 ? '#ef4444' : '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });

        // Label jarak per-segmen
        let totalLenPx = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          const pA = pts[i];
          const pB = pts[i + 1];
          const segDistPx = getDistance(pA, pB);
          totalLenPx += segDistPx;
          const segDistM = segDistPx / scalePxPerMeter;

          const midX = (pA.x + pB.x) / 2;
          const midY = (pA.y + pB.y) / 2;
          const segLabel = formatMeasurement(segDistM);

          ctx.font = 'bold 10px sans-serif';
          const tw = ctx.measureText(segLabel).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.fillRect(midX - tw / 2 - 4, midY - 8, tw + 8, 16);
          ctx.strokeRect(midX - tw / 2 - 4, midY - 8, tw + 8, 16);

          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(segLabel, midX, midY);
        }

        // Badge Total Kumulatif di kursor / titik akhir
        const totalM = totalLenPx / scalePxPerMeter;
        const endPt = pts[pts.length - 1];
        ctx.translate(endPt.x + 15, endPt.y - 15);
        const totalLabel = `Total Jarak: ${formatMeasurement(totalM)} (Klik: Belok | Esc / Enter: Selesai)`;
        ctx.font = 'bold 11px sans-serif';
        const twTot = ctx.measureText(totalLabel).width;

        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-6, -10, twTot + 12, 20);
        ctx.strokeRect(-6, -10, twTot + 12, 20);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(totalLabel, 0, 0);

        ctx.restore();
      }
    }

    // 4. Preview Marquee Box Selection (Seleksi Banyak Elemen Sekaligus)
    if (isBoxSelecting && selectionBox) {
      const bx = Math.min(selectionBox.x1, selectionBox.x2);
      const by = Math.min(selectionBox.y1, selectionBox.y2);
      const bw = Math.abs(selectionBox.x2 - selectionBox.x1);
      const bh = Math.abs(selectionBox.y2 - selectionBox.y1);

      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);
      ctx.restore();
    }
  };

  // Gambar Penggaris (Rulers) X & Y di Ruang Layar (Screen Space)
  const drawRulers = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    offset: Point,
    currentZoom: number,
    scale: number
  ) => {
    const rulerThickness = 24;
    const majorStepMeters = 1.0; // Tiap 1 meter
    const stepPx = majorStepMeters * scale * currentZoom;

    // Background Rulers
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, rulerThickness); // Top
    ctx.fillRect(0, 0, rulerThickness, height); // Left

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, rulerThickness);
    ctx.strokeRect(0, 0, rulerThickness, height);

    // Sudut kiri atas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, rulerThickness, rulerThickness);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('m', rulerThickness / 2, 16);

    // Ticks Ruler Atas (Sumbu X)
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const startWorldX = -offset.x / currentZoom;
    const endWorldX = (width - offset.x) / currentZoom;
    const firstMeterX = Math.floor(startWorldX / scale);
    const lastMeterX = Math.ceil(endWorldX / scale);

    for (let m = firstMeterX; m <= lastMeterX; m++) {
      const screenX = m * scale * currentZoom + offset.x;
      if (screenX < rulerThickness || screenX > width) continue;

      ctx.beginPath();
      ctx.moveTo(screenX, rulerThickness - 8);
      ctx.lineTo(screenX, rulerThickness);
      ctx.strokeStyle = '#64748b';
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`${m}m`, screenX, 12);

      // Sub-ticks (0.5 meter)
      const subScreenX = (m + 0.5) * scale * currentZoom + offset.x;
      if (subScreenX >= rulerThickness && subScreenX <= width) {
        ctx.beginPath();
        ctx.moveTo(subScreenX, rulerThickness - 4);
        ctx.lineTo(subScreenX, rulerThickness);
        ctx.strokeStyle = '#475569';
        ctx.stroke();
      }
    }

    // Ticks Ruler Kiri (Sumbu Y)
    const startWorldY = -offset.y / currentZoom;
    const endWorldY = (height - offset.y) / currentZoom;
    const firstMeterY = Math.floor(startWorldY / scale);
    const lastMeterY = Math.ceil(endWorldY / scale);

    for (let m = firstMeterY; m <= lastMeterY; m++) {
      const screenY = m * scale * currentZoom + offset.y;
      if (screenY < rulerThickness || screenY > height) continue;

      ctx.beginPath();
      ctx.moveTo(rulerThickness - 8, screenY);
      ctx.lineTo(rulerThickness, screenY);
      ctx.strokeStyle = '#64748b';
      ctx.stroke();

      ctx.save();
      ctx.translate(12, screenY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`${m}m`, 0, 0);
      ctx.restore();

      // Sub-ticks (0.5 meter)
      const subScreenY = (m + 0.5) * scale * currentZoom + offset.y;
      if (subScreenY >= rulerThickness && subScreenY <= height) {
        ctx.beginPath();
        ctx.moveTo(rulerThickness - 4, subScreenY);
        ctx.lineTo(rulerThickness, subScreenY);
        ctx.strokeStyle = '#475569';
        ctx.stroke();
      }
    }
  };

  // Gambar Scale Bar (Skala Visual 1m, 5m) di pojok kiri bawah
  const drawScaleBar = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: number,
    currentZoom: number
  ) => {
    const barMeter = 5; // Batang skala 5 meter
    const barPx = barMeter * scale * currentZoom;
    const startX = 40;
    const startY = height - 30;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#475569';
    ctx.fillRect(startX - 10, startY - 20, barPx + 20, 36);
    ctx.strokeRect(startX - 10, startY - 20, barPx + 20, 36);

    // Garis Skala
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + barPx, startY);
    ctx.lineTo(startX + barPx, startY - 6);
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, startY - 6);
    ctx.moveTo(startX + barPx / 5, startY);
    ctx.lineTo(startX + barPx / 5, startY - 4);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Teks Skala
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0', startX - 2, startY - 8);
    ctx.fillText('1m', startX + barPx / 5 - 6, startY - 8);
    ctx.fillText(`${barMeter}m`, startX + barPx - 10, startY - 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.fillText(`Skala Denah: 1m = ${scale}px`, startX, startY + 12);
    ctx.restore();
  };

  // Helper koordinat lokal bukaan pintu & jendela (ditranslasi & dirotasi)
  const getBukaanLocalPoint = (worldPt: Point, b: Bukaan): Point => {
    const rad = (b.rotasi * Math.PI) / 180;
    const dx = worldPt.x - b.posisi_x;
    const dy = worldPt.y - b.posisi_y;
    return {
      x: dx * Math.cos(-rad) - dy * Math.sin(-rad),
      y: dx * Math.sin(-rad) + dy * Math.cos(-rad),
    };
  };

  // Helper cek apakah sebuah titik menimpa bukaan pintu / jendela
  const isPointInBukaan = (worldPt: Point, b: Bukaan, scale: number): boolean => {
    const local = getBukaanLocalPoint(worldPt, b);
    const widthPx = (b.lebar_cm / 100) * scale;
    const halfW = widthPx / 2;

    // Cek handle rotasi di atas
    const rotHandleY = -Math.max(25, halfW + 18);
    if (getDistance(local, { x: 0, y: rotHandleY }) < 15) {
      return true;
    }

    // Cek handle resize kiri & kanan
    if (getDistance(local, { x: -halfW, y: 0 }) < 15) return true;
    if (getDistance(local, { x: halfW, y: 0 }) < 15) return true;

    // Cek bodi bukaan
    if (b.tipe === 'pintu_tunggal' || b.tipe === 'pintu_ganda') {
      return local.x >= -halfW - 10 && local.x <= halfW + 10 && local.y >= -widthPx - 10 && local.y <= 16;
    }
    return local.x >= -halfW - 10 && local.x <= halfW + 10 && local.y >= -16 && local.y <= 16;
  };

  // Helper cek apakah sebuah titik dekat dengan dinding (mendukung lurus, lengkung, dan lingkaran)
  const isPointNearWall = (pt: Point, w: Dinding): boolean => {
    if (w.tipe_bentuk === 'lingkaran') {
      const rad = getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
      const distCenter = getDistance(pt, { x: w.x1, y: w.y1 });
      return Math.abs(distCenter - rad) < 14 || distCenter < 14;
    }
    if (w.tipe_bentuk === 'lengkung') {
      const midX = (w.x1 + w.x2) / 2;
      const midY = (w.y1 + w.y2) / 2;
      const L = Math.max(1, getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }));
      const nx = -(w.y2 - w.y1) / L;
      const ny = (w.x2 - w.x1) / L;
      const sagitta = w.kelengkungan || 35;
      const cpX = midX + nx * (sagitta * 2);
      const cpY = midY + ny * (sagitta * 2);
      for (let t = 0; t <= 1; t += 0.08) {
        const qx = (1 - t) * (1 - t) * w.x1 + 2 * (1 - t) * t * cpX + t * t * w.x2;
        const qy = (1 - t) * (1 - t) * w.y1 + 2 * (1 - t) * t * cpY + t * t * w.y2;
        if (getDistance(pt, { x: qx, y: qy }) < 14) return true;
      }
      return false;
    }
    return distToSegment(pt, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }) < 12;
  };

  // Event Handlers Mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    setIsMouseDown(true);
    setDragStart({ x: screenX, y: screenY });

    // Mode PAN (atau Middle Click atau tekan Spasi)
    if (tool === 'pan' || e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      return;
    }

    // Mode SELECT
    if (tool === 'select') {
      // 0. BATCH DRAG (PRIORITAS UTAMA): Jika sudah ada multi-seleksi (selectedItems.length > 1),
      // cek apakah klik menyentuh SALAH SATU elemen yang sedang terpilih
      if (selectedItems.length > 1 && !e.shiftKey) {
        let hitBatch = false;
        for (const s of selectedItems) {
          if (s.type === 'wall') {
            const w = dinding.find((item) => item.id === s.id);
            if (w && isPointNearWall(world, w)) {
              hitBatch = true;
              break;
            }
          } else if (s.type === 'bukaan') {
            const b = bukaan.find((item) => item.id === s.id);
            if (b && isPointInBukaan(world, b, scalePxPerMeter)) {
              hitBatch = true;
              break;
            }
          } else if (s.type === 'furniture') {
            const f = furniture.find((item) => item.id === s.id);
            if (f && getDistance(world, { x: f.posisi_x, y: f.posisi_y }) < (f.lebar_cm / 100) * scalePxPerMeter * 0.6) {
              hitBatch = true;
              break;
            }
          } else if (s.type === 'perangkat') {
            const p = perangkat.find((item) => item.id === s.id);
            if (p && getDistance(world, { x: p.posisi_x, y: p.posisi_y }) < 20) {
              hitBatch = true;
              break;
            }
          } else if (s.type === 'ruangan') {
            const r = ruangan.find((item) => item.id === s.id);
            if (r && isPointInPolygon(world, r.polygon_points)) {
              hitBatch = true;
              break;
            }
          }
        }

        if (hitBatch) {
          setIsDraggingBatch(true);
          setBatchDragStartWorld(world);
          setBatchOrigWalls(
            dinding
              .filter((w) => selectedItems.some((s) => s.type === 'wall' && s.id === w.id))
              .map((w) => ({ id: w.id, x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 }))
          );
          setBatchOrigBukaan(
            bukaan
              .filter((b) => selectedItems.some((s) => s.type === 'bukaan' && s.id === b.id))
              .map((b) => ({ id: b.id, posisi_x: b.posisi_x, posisi_y: b.posisi_y }))
          );
          setBatchOrigFurn(
            furniture
              .filter((f) => selectedItems.some((s) => s.type === 'furniture' && s.id === f.id))
              .map((f) => ({ id: f.id, posisi_x: f.posisi_x, posisi_y: f.posisi_y }))
          );
          setBatchOrigDev(
            perangkat
              .filter((p) => selectedItems.some((s) => s.type === 'perangkat' && s.id === p.id))
              .map((p) => ({ id: p.id, posisi_x: p.posisi_x, posisi_y: p.posisi_y }))
          );
          setBatchOrigRooms(
            ruangan
              .filter((r) => selectedItems.some((s) => s.type === 'ruangan' && s.id === r.id))
              .map((r) => ({ id: r.id, polygon_points: r.polygon_points.map((pt) => ({ ...pt })) }))
          );
          return;
        }
      }

      // 0.2. Cek apakah user mengklik salah satu handle dinding yang sedang terpilih (P1, P2, Body, atau Curvature)
      if (selectedItem?.type === 'wall') {
        const curWall = dinding.find((w) => w.id === selectedItem.id);
        if (curWall) {
          // Handle P1 (Titik Pangkal atau Pusat Lingkaran)
          if (getDistance(world, { x: curWall.x1, y: curWall.y1 }) < 15) {
            setDraggingItemId(curWall.id);
            setDraggingWallHandle('p1');
            setDragWallStartWorld(world);
            setDragWallOrig({ x1: curWall.x1, y1: curWall.y1, x2: curWall.x2, y2: curWall.y2 });
            return;
          }
          // Handle P2 (Titik Ujung atau Tepi Radius Lingkaran)
          if (getDistance(world, { x: curWall.x2, y: curWall.y2 }) < 15) {
            setDraggingItemId(curWall.id);
            setDraggingWallHandle('p2');
            setDragWallStartWorld(world);
            setDragWallOrig({ x1: curWall.x1, y1: curWall.y1, x2: curWall.x2, y2: curWall.y2 });
            return;
          }
          // Handle Puncak Kelengkungan (Apex) untuk Dinding Lengkung
          if (curWall.tipe_bentuk === 'lengkung') {
            const midX = (curWall.x1 + curWall.x2) / 2;
            const midY = (curWall.y1 + curWall.y2) / 2;
            const L = Math.max(1, getDistance({ x: curWall.x1, y: curWall.y1 }, { x: curWall.x2, y: curWall.y2 }));
            const nx = -(curWall.y2 - curWall.y1) / L;
            const ny = (curWall.x2 - curWall.x1) / L;
            const sagitta = curWall.kelengkungan || 35;
            const apex = { x: midX + nx * sagitta, y: midY + ny * sagitta };
            if (getDistance(world, apex) < 15) {
              setDraggingItemId(curWall.id);
              setDraggingWallHandle('curvature');
              setDragWallStartWorld(world);
              setDragWallOrig({ x1: curWall.x1, y1: curWall.y1, x2: curWall.x2, y2: curWall.y2 });
              return;
            }
          }
          // Klik Badan Dinding (Geser Posisi Seluruh Dinding)
          if (isPointNearWall(world, curWall)) {
            setDraggingItemId(curWall.id);
            setDraggingWallHandle('body');
            setDragWallStartWorld(world);
            setDragWallOrig({ x1: curWall.x1, y1: curWall.y1, x2: curWall.x2, y2: curWall.y2 });
            return;
          }
        }
      }

      // 0.5. Cek apakah user mengklik handle bukaan (Pintu / Jendela) yang sedang terpilih
      if (selectedItem?.type === 'bukaan') {
        const curB = bukaan.find((b) => b.id === selectedItem.id);
        if (curB) {
          const local = getBukaanLocalPoint(world, curB);
          const widthPx = (curB.lebar_cm / 100) * scalePxPerMeter;
          const halfW = widthPx / 2;
          const rotHandleY = -Math.max(25, halfW + 18);

          // Handle Rotasi (Tangkai Kuning)
          if (getDistance(local, { x: 0, y: rotHandleY }) < 15) {
            setDraggingItemId(curB.id);
            setDraggingBukaanHandle('rotate');
            setDragItemOffset({ x: world.x, y: world.y });
            return;
          }
          // Handle Resize Kiri (Titik Hijau Kiri)
          if (getDistance(local, { x: -halfW, y: 0 }) < 15) {
            setDraggingItemId(curB.id);
            setDraggingBukaanHandle('resize_left');
            setDragItemOffset({ x: world.x, y: world.y });
            return;
          }
          // Handle Resize Kanan (Titik Hijau Kanan)
          if (getDistance(local, { x: halfW, y: 0 }) < 15) {
            setDraggingItemId(curB.id);
            setDraggingBukaanHandle('resize_right');
            setDragItemOffset({ x: world.x, y: world.y });
            return;
          }
          // Klik Bodi Bukaan (Geser Posisi)
          if (isPointInBukaan(world, curB, scalePxPerMeter)) {
            setDraggingItemId(curB.id);
            setDraggingBukaanHandle('body');
            setDragItemOffset({ x: world.x - curB.posisi_x, y: world.y - curB.posisi_y });
            return;
          }
        }
      }

      // 0.7. Cek apakah user mengklik handle ruangan (Zonasi) yang sedang terpilih
      if (selectedItem?.type === 'ruangan') {
        const curRoom = ruangan.find((r) => r.id === selectedItem.id);
        if (curRoom && curRoom.polygon_points && curRoom.polygon_points.length >= 3) {
          const xs = curRoom.polygon_points.map((p) => p.x);
          const ys = curRoom.polygon_points.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          // Cek 4 corner resize handles
          if (getDistance(world, { x: minX, y: minY }) < 15) {
            setDraggingItemId(curRoom.id);
            setDraggingRoomHandle('nw');
            setDragRoomStartWorld(world);
            setDragRoomOrigPoints(curRoom.polygon_points.map((p) => ({ ...p })));
            return;
          }
          if (getDistance(world, { x: maxX, y: minY }) < 15) {
            setDraggingItemId(curRoom.id);
            setDraggingRoomHandle('ne');
            setDragRoomStartWorld(world);
            setDragRoomOrigPoints(curRoom.polygon_points.map((p) => ({ ...p })));
            return;
          }
          if (getDistance(world, { x: maxX, y: maxY }) < 15) {
            setDraggingItemId(curRoom.id);
            setDraggingRoomHandle('se');
            setDragRoomStartWorld(world);
            setDragRoomOrigPoints(curRoom.polygon_points.map((p) => ({ ...p })));
            return;
          }
          if (getDistance(world, { x: minX, y: maxY }) < 15) {
            setDraggingItemId(curRoom.id);
            setDraggingRoomHandle('sw');
            setDragRoomStartWorld(world);
            setDragRoomOrigPoints(curRoom.polygon_points.map((p) => ({ ...p })));
            return;
          }

          // Cek klik di dalam ruangan terpilih (Geser Bodi Ruangan)
          if (isPointInPolygon(world, curRoom.polygon_points)) {
            setDraggingItemId(curRoom.id);
            setDraggingRoomHandle('body');
            setDragRoomStartWorld(world);
            setDragRoomOrigPoints(curRoom.polygon_points.map((p) => ({ ...p })));
            return;
          }
        }
      }

      // Hit testing biasa: bukaan, perangkat, furniture, dinding, kabel, ruangan
      let clickedItem: { type: string; id: string } | null = null;
      let startSingleDrag = () => {};

      // 1. Bukaan
      const hitBukaan = bukaan.find((b) => isPointInBukaan(world, b, scalePxPerMeter));
      if (hitBukaan) {
        clickedItem = { type: 'bukaan', id: hitBukaan.id };
        startSingleDrag = () => {
          setDraggingItemId(hitBukaan.id);
          setDraggingBukaanHandle('body');
          setDragItemOffset({ x: world.x - hitBukaan.posisi_x, y: world.y - hitBukaan.posisi_y });
        };
      }

      // 2. Perangkat
      if (!clickedItem) {
        const hitDev = perangkat.find((p) => getDistance(world, { x: p.posisi_x, y: p.posisi_y }) < 20);
        if (hitDev) {
          clickedItem = { type: 'perangkat', id: hitDev.id };
          startSingleDrag = () => {
            setDraggingItemId(hitDev.id);
            setDragItemOffset({ x: world.x - hitDev.posisi_x, y: world.y - hitDev.posisi_y });
          };
        }
      }

      // 3. Furniture
      if (!clickedItem) {
        const hitFurn = furniture.find(
          (f) => getDistance(world, { x: f.posisi_x, y: f.posisi_y }) < (f.lebar_cm / 100) * scalePxPerMeter * 0.6
        );
        if (hitFurn) {
          clickedItem = { type: 'furniture', id: hitFurn.id };
          startSingleDrag = () => {
            setDraggingItemId(hitFurn.id);
            setDragItemOffset({ x: world.x - hitFurn.posisi_x, y: world.y - hitFurn.posisi_y });
          };
        }
      }

      // 4. Dinding
      if (!clickedItem) {
        const hitWall = dinding.find((w) => isPointNearWall(world, w));
        if (hitWall) {
          clickedItem = { type: 'wall', id: hitWall.id };
          startSingleDrag = () => {
            setDraggingItemId(hitWall.id);
            setDraggingWallHandle('body');
            setDragWallStartWorld(world);
            setDragWallOrig({ x1: hitWall.x1, y1: hitWall.y1, x2: hitWall.x2, y2: hitWall.y2 });
          };
        }
      }

      // 5. Kabel
      if (!clickedItem) {
        const hitCable = kabel.find((c) => {
          if (!c.waypoints) return false;
          for (let i = 0; i < c.waypoints.length - 1; i++) {
            if (distToSegment(world, c.waypoints[i], c.waypoints[i + 1]) < 8) return true;
          }
          return false;
        });
        if (hitCable) {
          clickedItem = { type: 'kabel', id: hitCable.id };
        }
      }

      // 6. Ruangan (Zonasi)
      if (!clickedItem) {
        const hitRoom = ruangan.find((r) => isPointInPolygon(world, r.polygon_points));
        if (hitRoom) {
          clickedItem = { type: 'ruangan', id: hitRoom.id };
          startSingleDrag = () => {
            setDraggingItemId(hitRoom.id);
            setDraggingRoomHandle('body');
            setDragRoomStartWorld(world);
            setDragRoomOrigPoints(hitRoom.polygon_points.map((pt) => ({ ...pt })));
          };
        }
      }

      if (clickedItem) {
        if (e.shiftKey) {
          // Toggle selection dengan Shift+Click
          const alreadyIndex = selectedItems.findIndex((s) => s.type === clickedItem!.type && s.id === clickedItem!.id);
          let newSelected: Array<{ type: string; id: string }>;
          if (alreadyIndex >= 0) {
            newSelected = selectedItems.filter((_, idx) => idx !== alreadyIndex);
          } else {
            newSelected = [...selectedItems, clickedItem];
          }

          if (newSelected.length > 1) {
            onSelectItems?.(newSelected);
          } else if (newSelected.length === 1) {
            onSelectItem(newSelected[0]);
          } else {
            onSelectItem(null);
            onSelectItems?.([]);
          }
        } else {
          onSelectItem(clickedItem);
          onSelectItems?.([clickedItem]);
          startSingleDrag();
        }
        return;
      }

      // Jika klik area kosong:
      if (!e.shiftKey) {
        onSelectItem(null);
        onSelectItems?.([]);
      }
      // Mulai Marquee Box Selection
      setIsBoxSelecting(true);
      setBoxSelectionStart(world);
      setSelectionBox({ x1: world.x, y1: world.y, x2: world.x, y2: world.y });
      return;
    }

    // Mode WALL (Gambar Dinding Berantai / Kontinu seperti Menarik Kabel)
    if (tool === 'wall') {
      if (!drawingWallStart) {
        setDrawingWallStart(world);
        setWallChainStartPoint(world);
      } else {
        // Cek apakah klik balik mendekati titik awal (menutup lingkaran/loop ruangan)
        let endPt = world;
        let isClosed = false;
        if (
          wallChainStartPoint &&
          getDistance(drawingWallStart, wallChainStartPoint) > 10 &&
          getDistance(world, wallChainStartPoint) < 20
        ) {
          endPt = wallChainStartPoint;
          isClosed = true;
        }

        // Jangan buat dinding jika panjangnya terlalu kecil
        if (getDistance(drawingWallStart, endPt) > 5) {
          const newWall: Dinding = {
            id: `wall-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            lantai_id: '',
            x1: drawingWallStart.x,
            y1: drawingWallStart.y,
            x2: endPt.x,
            y2: endPt.y,
            ketebalan_cm: 15.0,
            tipe_dinding: 'utama',
            tipe_bentuk: 'lurus',
            kelengkungan: 0,
            warna: '#475569',
          };
          onUpdateDinding([...dinding, newWall]);
        }

        if (isClosed) {
          // Ruangan tertutup memutar selesai!
          setDrawingWallStart(null);
          setWallChainStartPoint(null);
        } else {
          // Lanjut tarik dinding berikutnya dari titik ujung ini secara berantai!
          setDrawingWallStart(endPt);
        }
      }
      return;
    }

    // Mode WALL_BOX (Kotak Ruangan Otomatis: 4 Dinding Sekaligus)
    if (tool === 'wall_box') {
      if (!drawingBoxStart) {
        setDrawingBoxStart(world);
      } else {
        const x1 = drawingBoxStart.x;
        const y1 = drawingBoxStart.y;
        const x2 = world.x;
        const y2 = world.y;

        // Buat 4 dinding sekaligus (Atas, Kanan, Bawah, Kiri)
        if (Math.abs(x2 - x1) > 10 && Math.abs(y2 - y1) > 10) {
          const now = Date.now();
          const wTop: Dinding = {
            id: `wall-${now}-1`,
            lantai_id: '',
            x1, y1,
            x2, y2: y1,
            ketebalan_cm: 15.0,
            tipe_dinding: 'utama',
            tipe_bentuk: 'lurus',
            kelengkungan: 0,
            warna: '#475569',
          };
          const wRight: Dinding = {
            id: `wall-${now}-2`,
            lantai_id: '',
            x1: x2, y1,
            x2, y2,
            ketebalan_cm: 15.0,
            tipe_dinding: 'utama',
            tipe_bentuk: 'lurus',
            kelengkungan: 0,
            warna: '#475569',
          };
          const wBottom: Dinding = {
            id: `wall-${now}-3`,
            lantai_id: '',
            x1: x2, y1: y2,
            x2: x1, y2,
            ketebalan_cm: 15.0,
            tipe_dinding: 'utama',
            tipe_bentuk: 'lurus',
            kelengkungan: 0,
            warna: '#475569',
          };
          const wLeft: Dinding = {
            id: `wall-${now}-4`,
            lantai_id: '',
            x1, y1: y2,
            x2: x1, y2: y1,
            ketebalan_cm: 15.0,
            tipe_dinding: 'utama',
            tipe_bentuk: 'lurus',
            kelengkungan: 0,
            warna: '#475569',
          };
          onUpdateDinding([...dinding, wTop, wRight, wBottom, wLeft]);
        }
        setDrawingBoxStart(null);
      }
      return;
    }

    // Mode WALL_CIRCLE (Dinding Melingkar Bulat Penuh)
    if (tool === 'wall_circle') {
      if (!drawingCircleStart) {
        setDrawingCircleStart(world);
      } else {
        const rad = getDistance(drawingCircleStart, world);
        if (rad > 10) {
          const newWall: Dinding = {
            id: `wall-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            lantai_id: '',
            x1: drawingCircleStart.x,
            y1: drawingCircleStart.y,
            x2: world.x,
            y2: world.y,
            ketebalan_cm: 15.0,
            tipe_dinding: 'utama',
            tipe_bentuk: 'lingkaran',
            kelengkungan: 0,
            warna: '#475569',
          };
          onUpdateDinding([...dinding, newWall]);
        }
        setDrawingCircleStart(null);
      }
      return;
    }

    // Mode CABLE (Penarikan Kabel)
    if (tool === 'cable') {
      // Cari perangkat target
      const hitDev = perangkat.find((p) => getDistance(world, { x: p.posisi_x, y: p.posisi_y }) < 25);
      const newWaypoints = [...cableWaypoints, hitDev ? { x: hitDev.posisi_x, y: devPos(hitDev).y } : world];

      if (cableWaypoints.length === 0) {
        // Titik awal kabel
        if (hitDev) setCableStartDevice(hitDev);
        setCableWaypoints([hitDev ? { x: hitDev.posisi_x, y: hitDev.posisi_y } : world]);
      } else {
        // Jika klik perangkat kedua / ganda -> selesai
        if (hitDev && cableStartDevice && hitDev.id !== cableStartDevice.id) {
          const finalWaypoints = [...cableWaypoints, { x: hitDev.posisi_x, y: hitDev.posisi_y }];
          const lenM = calculateCableLength(finalWaypoints, scalePxPerMeter);

          // Kalkulasi cerdas drop vertikal berbasis tinggi atap lantai (H)
          const H = tinggiPlafon || 3.2;
          let dropAsal = H; // Dari rack server / panel naik ke atap (H meter)
          if (cableStartDevice.kategori === 'access_point') {
            dropAsal = 0.5; // AP di atap
          }

          let dropTujuan = Math.max(1.5, Number((H - 0.75).toFixed(2))); // Turun ke meja staff / PC client
          if (hitDev.kategori === 'access_point') {
            dropTujuan = 0.5; // AP langsung di atap
          } else if (hitDev.kategori === 'cctv') {
            dropTujuan = Math.max(1.0, Number((H - 3.5).toFixed(2))); // CCTV tiang kolom pada ketinggian 3.5m
          } else if (hitDev.kategori === 'rack_server') {
            dropTujuan = H; // Rack server lain
          }

          const cadangan = 1.0; // 1 meter slack loop cadangan untuk terminasi patch panel / outlet
          const dropExtra = Number((dropAsal + dropTujuan + cadangan).toFixed(2));
          const totalPanjang = Number((lenM + dropExtra).toFixed(2));

          const newCable: KabelJalur = {
            id: `cbl-${Date.now()}`,
            lantai_id: '',
            tipe_kabel_id: selectedCableTypeId || 'cat6_data',
            kode_kabel: `CBL-${cableStartDevice.nama_perangkat.slice(0, 4).toUpperCase()}-${hitDev.nama_perangkat.slice(0, 4).toUpperCase()}`,
            perangkat_asal_id: cableStartDevice.id,
            perangkat_tujuan_id: hitDev.id,
            waypoints: finalWaypoints,
            panjang_denah_meter: lenM,
            tinggi_drop_asal_meter: dropAsal,
            tinggi_drop_tujuan_meter: dropTujuan,
            panjang_cadangan_meter: cadangan,
            panjang_tambahan_drop_meter: dropExtra,
            total_panjang_meter: totalPanjang,
            jalur_tipe: 'plafon',
            status: 'terpasang',
          };
          onUpdateKabel([...kabel, newCable]);
          setCableWaypoints([]);
          setCableStartDevice(null);
        } else {
          setCableWaypoints(newWaypoints);
        }
      }
      return;
    }

    // Mode MEASURE (Penggaris / Ukuran Polyline Berbelok)
    if (tool === 'measure') {
      setMeasurePoints((prev) => [...prev, world]);
      return;
    }

    // Mode PLACE_FURNITURE (Letakkan Meja Client / Kursi)
    if (tool === 'place_furniture' && activeItemToPlace) {
      const newFurniture: Furniture = {
        id: `desk-${Date.now()}`,
        lantai_id: '',
        tipe: activeItemToPlace.tipe || 'meja_tunggal',
        label: activeItemToPlace.label || 'Meja Client',
        pemilik_client: '',
        posisi_x: world.x,
        posisi_y: world.y,
        lebar_cm: activeItemToPlace.lebar_cm || 120,
        panjang_cm: activeItemToPlace.panjang_cm || 60,
        rotasi: 0,
      };
      onUpdateFurniture([...furniture, newFurniture]);
      onSelectItem({ type: 'furniture', id: newFurniture.id });
      onSelectItems?.([{ type: 'furniture', id: newFurniture.id }]);
      return;
    }

    // Mode PLACE_DEVICE (Letakkan Rack, Switch, CCTV, AP, PC, Printer)
    if (tool === 'place_device' && activeItemToPlace) {
      const newDev: Perangkat = {
        id: `dev-${Date.now()}`,
        lantai_id: '',
        kategori: activeItemToPlace.kategori,
        nama_perangkat: `${activeItemToPlace.prefix || 'DEV'}-${perangkat.length + 1}`,
        model_merk: activeItemToPlace.model || '',
        ip_address: '',
        mac_address: '',
        posisi_x: world.x,
        posisi_y: world.y,
        rotasi: 0,
        cctv_fov_angle: activeItemToPlace.cctv_fov_angle || 75,
        cctv_jarak_meter: activeItemToPlace.cctv_jarak_meter || 12,
        ap_radius_meter: activeItemToPlace.ap_radius_meter || 12,
        rack_total_u: activeItemToPlace.rack_total_u || 42,
        status: 'aktif',
      };
      onUpdatePerangkat([...perangkat, newDev]);
      onSelectItem({ type: 'perangkat', id: newDev.id });
      onSelectItems?.([{ type: 'perangkat', id: newDev.id }]);
      return;
    }

    // Mode DOOR / WINDOW
    if ((tool === 'door' || tool === 'window') && onUpdateBukaan) {
      const newOpening: Bukaan = {
        id: `opening-${Date.now()}`,
        lantai_id: '',
        tipe: activeItemToPlace?.tipe || (tool === 'door' ? 'pintu_tunggal' : 'jendela'),
        posisi_x: world.x,
        posisi_y: world.y,
        lebar_cm: activeItemToPlace?.lebar_cm || (tool === 'door' ? 90 : 120),
        rotasi: 0,
      };
      onUpdateBukaan([...bukaan, newOpening]);
      onSelectItem({ type: 'bukaan', id: newOpening.id });
      onSelectItems?.([{ type: 'bukaan', id: newOpening.id }]);
      return;
    }

    // Mode PLACE_ROOM (Zonasi Ruangan)
    if (tool === 'place_room' && activeItemToPlace && onUpdateRuangan) {
      const wPx = (activeItemToPlace.w_m || 6) * scalePxPerMeter;
      const hPx = (activeItemToPlace.h_m || 5) * scalePxPerMeter;
      const newRoom: Ruangan = {
        id: `room-${Date.now()}`,
        lantai_id: '',
        nama_ruangan: activeItemToPlace.nama || 'Ruangan Baru',
        warna_area: activeItemToPlace.warna || 'rgba(56, 189, 248, 0.1)',
        polygon_points: [
          { x: world.x, y: world.y },
          { x: world.x + wPx, y: world.y },
          { x: world.x + wPx, y: world.y + hPx },
          { x: world.x, y: world.y + hPx },
        ],
      };
      onUpdateRuangan([...ruangan, newRoom]);
      onSelectItem({ type: 'ruangan', id: newRoom.id });
      onSelectItems?.([{ type: 'ruangan', id: newRoom.id }]);
      return;
    }
  };

  const devPos = (d: Perangkat) => ({ x: d.posisi_x, y: d.posisi_y });

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    setMousePosWorld(world);

    if (isPanning) {
      const dx = screenX - dragStart.x;
      const dy = screenY - dragStart.y;
      onPanChange({ x: panOffset.x + dx, y: panOffset.y + dy });
      setDragStart({ x: screenX, y: screenY });
      return;
    }

    // 1. Update Marquee Box Selection jika sedang drag kotak seleksi
    if (isBoxSelecting && boxSelectionStart) {
      setSelectionBox({
        x1: boxSelectionStart.x,
        y1: boxSelectionStart.y,
        x2: world.x,
        y2: world.y,
      });
      return;
    }

    // 2. Batch Move Dragging (Memindahkan Banyak Dinding & Barang Sekaligus)
    if (isMouseDown && isDraggingBatch) {
      const snapX = snapGrid ? snapToGrid(world.x, subGridSizePx) : world.x;
      const snapY = snapGrid ? snapToGrid(world.y, subGridSizePx) : world.y;
      const snapStartX = snapGrid ? snapToGrid(batchDragStartWorld.x, subGridSizePx) : batchDragStartWorld.x;
      const snapStartY = snapGrid ? snapToGrid(batchDragStartWorld.y, subGridSizePx) : batchDragStartWorld.y;
      const dx = snapX - snapStartX;
      const dy = snapY - snapStartY;

      if (batchOrigWalls.length > 0) {
        const wMap = new Map(batchOrigWalls.map((w) => [w.id, w]));
        onUpdateDinding(
          dinding.map((w) => {
            const orig = wMap.get(w.id);
            if (!orig) return w;
            return { ...w, x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x2 + dx, y2: orig.y2 + dy };
          })
        );
      }
      if (batchOrigBukaan.length > 0 && onUpdateBukaan) {
        const bMap = new Map(batchOrigBukaan.map((b) => [b.id, b]));
        onUpdateBukaan(
          bukaan.map((b) => {
            const orig = bMap.get(b.id);
            if (!orig) return b;
            return { ...b, posisi_x: orig.posisi_x + dx, posisi_y: orig.posisi_y + dy };
          })
        );
      }
      if (batchOrigFurn.length > 0) {
        const fMap = new Map(batchOrigFurn.map((f) => [f.id, f]));
        onUpdateFurniture(
          furniture.map((f) => {
            const orig = fMap.get(f.id);
            if (!orig) return f;
            return { ...f, posisi_x: orig.posisi_x + dx, posisi_y: orig.posisi_y + dy };
          })
        );
      }
      if (batchOrigDev.length > 0) {
        const pMap = new Map(batchOrigDev.map((p) => [p.id, p]));
        onUpdatePerangkat(
          perangkat.map((p) => {
            const orig = pMap.get(p.id);
            if (!orig) return p;
            return { ...p, posisi_x: orig.posisi_x + dx, posisi_y: orig.posisi_y + dy };
          })
        );
      }
      if (batchOrigRooms.length > 0 && onUpdateRuangan) {
        const rMap = new Map(batchOrigRooms.map((r) => [r.id, r]));
        onUpdateRuangan(
          ruangan.map((r) => {
            const orig = rMap.get(r.id);
            if (!orig) return r;
            return {
              ...r,
              polygon_points: orig.polygon_points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
            };
          })
        );
      }
      return;
    }

    // 3. Single Dragging item yang dipilih (Perangkat / Furniture / Dinding / Ruangan)
    if (isMouseDown && draggingItemId && tool === 'select') {
      // Room / Zonasi Drag & Resize
      if (selectedItem?.type === 'ruangan' && draggingRoomHandle && onUpdateRuangan) {
        const snapX = snapGrid ? snapToGrid(world.x, subGridSizePx) : world.x;
        const snapY = snapGrid ? snapToGrid(world.y, subGridSizePx) : world.y;

        const updated = ruangan.map((r) => {
          if (r.id !== draggingItemId) return r;

          if (draggingRoomHandle === 'body') {
            const snapStartX = snapGrid ? snapToGrid(dragRoomStartWorld.x, subGridSizePx) : dragRoomStartWorld.x;
            const snapStartY = snapGrid ? snapToGrid(dragRoomStartWorld.y, subGridSizePx) : dragRoomStartWorld.y;
            const dx = snapX - snapStartX;
            const dy = snapY - snapStartY;
            return {
              ...r,
              polygon_points: dragRoomOrigPoints.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
            };
          }

          // Resize 4 corner handles
          const xs = dragRoomOrigPoints.map((p) => p.x);
          const ys = dragRoomOrigPoints.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          let newMinX = minX;
          let newMaxX = maxX;
          let newMinY = minY;
          let newMaxY = maxY;

          if (draggingRoomHandle === 'nw') {
            newMinX = Math.min(snapX, maxX - 20);
            newMinY = Math.min(snapY, maxY - 20);
          } else if (draggingRoomHandle === 'ne') {
            newMaxX = Math.max(snapX, minX + 20);
            newMinY = Math.min(snapY, maxY - 20);
          } else if (draggingRoomHandle === 'se') {
            newMaxX = Math.max(snapX, minX + 20);
            newMaxY = Math.max(snapY, minY + 20);
          } else if (draggingRoomHandle === 'sw') {
            newMinX = Math.min(snapX, maxX - 20);
            newMaxY = Math.max(snapY, minY + 20);
          }

          return {
            ...r,
            polygon_points: [
              { x: newMinX, y: newMinY },
              { x: newMaxX, y: newMinY },
              { x: newMaxX, y: newMaxY },
              { x: newMinX, y: newMaxY },
            ],
          };
        });
        onUpdateRuangan(updated);
        return;
      }

      if (selectedItem?.type === 'wall' && draggingWallHandle) {
        const snapX = snapGrid ? snapToGrid(world.x, subGridSizePx) : world.x;
        const snapY = snapGrid ? snapToGrid(world.y, subGridSizePx) : world.y;

        const updated = dinding.map((w) => {
          if (w.id !== draggingItemId) return w;
          if (draggingWallHandle === 'curvature') {
            const midX = (w.x1 + w.x2) / 2;
            const midY = (w.y1 + w.y2) / 2;
            const L = Math.max(1, getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }));
            const nx = -(w.y2 - w.y1) / L;
            const ny = (w.x2 - w.x1) / L;
            // Proyeksikan vektor perpindahan mouse ke arah normal garis dinding
            const sagitta = (world.x - midX) * nx + (world.y - midY) * ny;
            return { ...w, kelengkungan: Math.round(sagitta) };
          } else if (draggingWallHandle === 'p1') {
            if (w.tipe_bentuk === 'lingkaran') {
              // Jika geser titik pusat lingkaran, pertahankan radiusnya
              const dx = snapX - w.x1;
              const dy = snapY - w.y1;
              return { ...w, x1: snapX, y1: snapY, x2: w.x2 + dx, y2: w.y2 + dy };
            }
            return { ...w, x1: snapX, y1: snapY };
          } else if (draggingWallHandle === 'p2') {
            return { ...w, x2: snapX, y2: snapY };
          } else if (draggingWallHandle === 'body') {
            const dx = snapX - dragWallStartWorld.x;
            const dy = snapY - dragWallStartWorld.y;
            return {
              ...w,
              x1: dragWallOrig.x1 + dx,
              y1: dragWallOrig.y1 + dy,
              x2: dragWallOrig.x2 + dx,
              y2: dragWallOrig.y2 + dy,
            };
          }
          return w;
        });
        onUpdateDinding(updated);
      } else if (selectedItem?.type === 'perangkat') {
        const updated = perangkat.map((p) =>
          p.id === draggingItemId
            ? { ...p, posisi_x: world.x - dragItemOffset.x, posisi_y: world.y - dragItemOffset.y }
            : p
        );
        onUpdatePerangkat(updated);
      } else if (selectedItem?.type === 'furniture') {
        const updated = furniture.map((f) =>
          f.id === draggingItemId
            ? { ...f, posisi_x: world.x - dragItemOffset.x, posisi_y: world.y - dragItemOffset.y }
            : f
        );
        onUpdateFurniture(updated);
      } else if (selectedItem?.type === 'bukaan' && draggingBukaanHandle && onUpdateBukaan) {
        const updated = bukaan.map((b) => {
          if (b.id !== draggingItemId) return b;

          if (draggingBukaanHandle === 'body') {
            const snapX = snapGrid ? snapToGrid(world.x - dragItemOffset.x, subGridSizePx) : world.x - dragItemOffset.x;
            const snapY = snapGrid ? snapToGrid(world.y - dragItemOffset.y, subGridSizePx) : world.y - dragItemOffset.y;
            return { ...b, posisi_x: snapX, posisi_y: snapY };
          }

          if (draggingBukaanHandle === 'rotate') {
            const rawRad = Math.atan2(world.y - b.posisi_y, world.x - b.posisi_x);
            let deg = Math.round((rawRad * 180) / Math.PI + 90);
            deg = (deg % 360 + 360) % 360;
            if (snapGrid) {
              deg = Math.round(deg / 15) * 15;
              deg = (deg % 360 + 360) % 360;
            }
            return { ...b, rotasi: deg };
          }

          if (draggingBukaanHandle === 'resize_right' || draggingBukaanHandle === 'resize_left') {
            const local = getBukaanLocalPoint(world, b);
            const halfW = draggingBukaanHandle === 'resize_right' ? local.x : -local.x;
            let newLebarCm = Math.round(((Math.max(15, halfW) * 2) / scalePxPerMeter) * 100);
            if (snapGrid) {
              newLebarCm = Math.round(newLebarCm / 5) * 5;
            }
            newLebarCm = Math.max(40, Math.min(300, newLebarCm));
            return { ...b, lebar_cm: newLebarCm };
          }

          return b;
        });
        onUpdateBukaan(updated);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseDown(false);
    setIsPanning(false);

    // Jika sedang Marquee Box Selecting, kumpulkan semua elemen yang berada di dalam kotak
    if (isBoxSelecting && selectionBox) {
      const bx1 = Math.min(selectionBox.x1, selectionBox.x2);
      const by1 = Math.min(selectionBox.y1, selectionBox.y2);
      const bx2 = Math.max(selectionBox.x1, selectionBox.x2);
      const by2 = Math.max(selectionBox.y1, selectionBox.y2);

      // Hanya seleksi jika ukuran box minimal 6px agar tidak mengganggu klik biasa
      if (bx2 - bx1 > 6 || by2 - by1 > 6) {
        const box = { x1: bx1, y1: by1, x2: bx2, y2: by2 };
        const hitItems: Array<{ type: string; id: string }> = [];

        // Dinding
        dinding.forEach((w) => {
          if (
            isPointInBox({ x: w.x1, y: w.y1 }, box) ||
            isPointInBox({ x: w.x2, y: w.y2 }, box) ||
            isPointInBox({ x: (w.x1 + w.x2) / 2, y: (w.y1 + w.y2) / 2 }, box)
          ) {
            hitItems.push({ type: 'wall', id: w.id });
          }
        });

        // Bukaan
        bukaan.forEach((b) => {
          if (isPointInBox({ x: b.posisi_x, y: b.posisi_y }, box)) {
            hitItems.push({ type: 'bukaan', id: b.id });
          }
        });

        // Furniture
        furniture.forEach((f) => {
          if (isPointInBox({ x: f.posisi_x, y: f.posisi_y }, box)) {
            hitItems.push({ type: 'furniture', id: f.id });
          }
        });

        // Perangkat
        perangkat.forEach((p) => {
          if (isPointInBox({ x: p.posisi_x, y: p.posisi_y }, box)) {
            hitItems.push({ type: 'perangkat', id: p.id });
          }
        });

        // Ruangan (Zonasi)
        ruangan.forEach((r) => {
          const avgX = r.polygon_points.reduce((acc, p) => acc + p.x, 0) / r.polygon_points.length;
          const avgY = r.polygon_points.reduce((acc, p) => acc + p.y, 0) / r.polygon_points.length;
          if (isPointInBox({ x: avgX, y: avgY }, box)) {
            hitItems.push({ type: 'ruangan', id: r.id });
          }
        });

        // Kabel
        kabel.forEach((c) => {
          if (c.waypoints?.some((wp) => isPointInBox(wp, box))) {
            hitItems.push({ type: 'kabel', id: c.id });
          }
        });

        if (e.shiftKey) {
          const combined = [...selectedItems];
          hitItems.forEach((hi) => {
            if (!combined.some((ci) => ci.type === hi.type && ci.id === hi.id)) {
              combined.push(hi);
            }
          });
          if (combined.length > 1) {
            onSelectItems?.(combined);
          } else if (combined.length === 1) {
            onSelectItem(combined[0]);
          } else {
            onSelectItem(null);
            onSelectItems?.([]);
          }
        } else {
          if (hitItems.length > 1) {
            onSelectItems?.(hitItems);
          } else if (hitItems.length === 1) {
            onSelectItem(hitItems[0]);
          } else {
            onSelectItem(null);
            onSelectItems?.([]);
          }
        }
      }

      setIsBoxSelecting(false);
      setBoxSelectionStart(null);
      setSelectionBox(null);
    }

    setIsDraggingBatch(false);
    setDraggingItemId(null);
    setDraggingWallHandle(null);
    setDraggingBukaanHandle(null);
    setDraggingRoomHandle(null);
  };

  const handleDoubleClick = () => {
    setDrawingWallStart(null);
    setWallChainStartPoint(null);
    setDrawingBoxStart(null);
    setDrawingCircleStart(null);
    setMeasurePoints([]);
    setCableWaypoints([]);
    setCableStartDevice(null);
  };

  // Keyboard shortcut (Escape membatalkan aksi, Delete menghapus yang dipilih)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        setDrawingWallStart(null);
        setWallChainStartPoint(null);
        setDrawingBoxStart(null);
        setDrawingCircleStart(null);
        setCableWaypoints([]);
        setCableStartDevice(null);
        setMeasuringStart(null);
        setMeasurePoints([]);
        setIsBoxSelecting(false);
        setSelectionBox(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItems.length > 0) {
          const wallIds = new Set(selectedItems.filter((s) => s.type === 'wall').map((s) => s.id));
          const bukaanIds = new Set(selectedItems.filter((s) => s.type === 'bukaan').map((s) => s.id));
          const furnIds = new Set(selectedItems.filter((s) => s.type === 'furniture').map((s) => s.id));
          const devIds = new Set(selectedItems.filter((s) => s.type === 'perangkat').map((s) => s.id));
          const kabelIds = new Set(selectedItems.filter((s) => s.type === 'kabel').map((s) => s.id));
          const roomIds = new Set(selectedItems.filter((s) => s.type === 'ruangan').map((s) => s.id));

          if (wallIds.size > 0) onUpdateDinding(dinding.filter((w) => !wallIds.has(w.id)));
          if (bukaanIds.size > 0 && onUpdateBukaan) onUpdateBukaan(bukaan.filter((b) => !bukaanIds.has(b.id)));
          if (furnIds.size > 0) onUpdateFurniture(furniture.filter((f) => !furnIds.has(f.id)));
          if (devIds.size > 0) {
            onUpdatePerangkat(perangkat.filter((p) => !devIds.has(p.id)));
            onUpdateKabel(
              kabel.filter(
                (c) =>
                  (!c.perangkat_asal_id || !devIds.has(c.perangkat_asal_id)) &&
                  (!c.perangkat_tujuan_id || !devIds.has(c.perangkat_tujuan_id))
              )
            );
          }
          if (kabelIds.size > 0) onUpdateKabel(kabel.filter((c) => !kabelIds.has(c.id)));
          if (roomIds.size > 0 && onUpdateRuangan) onUpdateRuangan(ruangan.filter((r) => !roomIds.has(r.id)));

          onSelectItem(null);
          onSelectItems?.([]);
          return;
        }

        if (!selectedItem) return;
        if (selectedItem.type === 'wall') {
          onUpdateDinding(dinding.filter((w) => w.id !== selectedItem.id));
        } else if (selectedItem.type === 'bukaan') {
          if (onUpdateBukaan) {
            onUpdateBukaan(bukaan.filter((b) => b.id !== selectedItem.id));
          }
        } else if (selectedItem.type === 'furniture') {
          onUpdateFurniture(furniture.filter((f) => f.id !== selectedItem.id));
        } else if (selectedItem.type === 'perangkat') {
          onUpdatePerangkat(perangkat.filter((p) => p.id !== selectedItem.id));
          onUpdateKabel(
            kabel.filter((c) => c.perangkat_asal_id !== selectedItem.id && c.perangkat_tujuan_id !== selectedItem.id)
          );
        } else if (selectedItem.type === 'kabel') {
          onUpdateKabel(kabel.filter((c) => c.id !== selectedItem.id));
        } else if (selectedItem.type === 'ruangan' && onUpdateRuangan) {
          onUpdateRuangan(ruangan.filter((r) => r.id !== selectedItem.id));
        }
        onSelectItem(null);
        onSelectItems?.([]);
      }
    };
    const targetDoc = canvasRef.current?.ownerDocument || containerRef.current?.ownerDocument || document;
    const targetWin = targetDoc.defaultView || window;
    targetWin.addEventListener('keydown', handleKeyDown);
    return () => targetWin.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, selectedItems, dinding, bukaan, furniture, perangkat, kabel, ruangan, onUpdateBukaan, onUpdateRuangan]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none cursor-crosshair">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
};
