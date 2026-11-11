import { Point } from '../types/schema.ts';

// Hitung jarak Euclidean antar 2 titik
export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Konversi pixel ke meter
export function pxToMeters(px: number, scalePxPerMeter: number): number {
  return px / scalePxPerMeter;
}

// Konversi meter ke pixel
export function metersToPx(meters: number, scalePxPerMeter: number): number {
  return meters * scalePxPerMeter;
}

// Format ukuran meter (contoh: "4.50 m" atau "85 cm")
export function formatMeasurement(meters: number): string {
  if (meters < 1.0) {
    return `${Math.round(meters * 100)} cm`;
  }
  return `${meters.toFixed(2)} m`;
}

// Snap koordinat ke grid
export function snapToGrid(val: number, gridSizePx: number): number {
  return Math.round(val / gridSizePx) * gridSizePx;
}

// Hitung total panjang rute kabel (dalam meter) dari array waypoints
export function calculateCableLength(waypoints: Point[], scalePxPerMeter: number): number {
  if (!waypoints || waypoints.length < 2) return 0;
  let totalPx = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalPx += getDistance(waypoints[i], waypoints[i + 1]);
  }
  return Number((totalPx / scalePxPerMeter).toFixed(2));
}

// Hitung sudut rotasi antara dua titik (derajat)
export function getAngleDegrees(p1: Point, p2: Point): number {
  const radians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  return (radians * 180) / Math.PI;
}

// Jarak titik P ke segmen garis AB
export function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
  if (l2 === 0) return getDistance(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return getDistance(p, {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y),
  });
}

// Hitung koordinat kerucut FOV CCTV
export function getCctvFovPolygon(
  center: Point,
  rotationDeg: number,
  fovDeg: number,
  radiusPx: number
): Point[] {
  const points: Point[] = [center];
  const startAngle = ((rotationDeg - fovDeg / 2) * Math.PI) / 180;
  const endAngle = ((rotationDeg + fovDeg / 2) * Math.PI) / 180;
  const steps = 16;
  const stepAngle = (endAngle - startAngle) / steps;

  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * stepAngle;
    points.push({
      x: center.x + Math.cos(angle) * radiusPx,
      y: center.y + Math.sin(angle) * radiusPx,
    });
  }

  return points;
}

// Cek apakah titik P berada di dalam Polygon tertutup (Ray-Casting Algorithm)
export function isPointInPolygon(p: Point, polygon: Point[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Cek apakah titik P berada di dalam kotak seleksi (Marquee Box)
export function isPointInBox(p: Point, box: { x1: number; y1: number; x2: number; y2: number }): boolean {
  const minX = Math.min(box.x1, box.x2);
  const maxX = Math.max(box.x1, box.x2);
  const minY = Math.min(box.y1, box.y2);
  const maxY = Math.max(box.y1, box.y2);
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

// Hitung luas poligon dalam meter persegi (m²) menggunakan Shoelace Formula
export function calculatePolygonArea(polygon: Point[], scalePxPerMeter: number): number {
  if (!polygon || polygon.length < 3) return 0;
  let areaPx = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    areaPx += polygon[i].x * polygon[j].y;
    areaPx -= polygon[j].x * polygon[i].y;
  }
  areaPx = Math.abs(areaPx) / 2;
  const areaM2 = areaPx / (scalePxPerMeter * scalePxPerMeter);
  return Number(areaM2.toFixed(2));
}
