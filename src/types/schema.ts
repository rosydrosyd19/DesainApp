export type ToolType =
  | 'select'
  | 'pan'
  | 'wall'
  | 'wall_box'
  | 'wall_circle'
  | 'door'
  | 'window'
  | 'measure'
  | 'cable'
  | 'place_furniture'
  | 'place_device'
  | 'place_room';

export interface Point {
  x: number;
  y: number;
}

export interface Proyek {
  id: string;
  nama_proyek: string;
  deskripsi: string;
  skala_px_per_meter: number; // default: 50px = 1 meter
  satuan: string;
}

export interface Lantai {
  id: string;
  proyek_id: string;
  nama_lantai: string;
  lebar_meter: number;
  panjang_meter: number;
  tinggi_plafon_meter?: number;
  urutan: number;
}

export interface Dinding {
  id: string;
  lantai_id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ketebalan_cm: number;
  tipe_dinding: 'utama' | 'partisi' | 'kaca';
  warna?: string;
  tipe_bentuk?: 'lurus' | 'lengkung' | 'lingkaran';
  kelengkungan?: number; // Nilai offset lengkungan dalam pixel (sagitta)
}

export interface Bukaan {
  id: string;
  lantai_id: string;
  dinding_id?: string;
  tipe: 'pintu_tunggal' | 'pintu_ganda' | 'pintu_geser' | 'jendela';
  posisi_x: number;
  posisi_y: number;
  lebar_cm: number;
  rotasi: number;
}

export interface Ruangan {
  id: string;
  lantai_id: string;
  nama_ruangan: string;
  polygon_points: Point[];
  warna_area: string;
}

export interface Furniture {
  id: string;
  lantai_id: string;
  tipe: 'meja_tunggal' | 'meja_l' | 'cubicle_4' | 'meja_rapat' | 'kursi';
  label: string;
  pemilik_client: string; // Nama staff / Divisi client pemakai
  posisi_x: number;
  posisi_y: number;
  lebar_cm: number;
  panjang_cm: number;
  rotasi: number;
}

export type PerangkatKategori =
  | 'rack_server'
  | 'switch'
  | 'server'
  | 'nvr_dvr'
  | 'cctv'
  | 'access_point'
  | 'printer'
  | 'pc_client'
  | 'patch_panel'
  | 'ups'
  | 'shaft_riser';

export interface Perangkat {
  id: string;
  lantai_id: string;
  furniture_id?: string | null;
  kategori: PerangkatKategori;
  nama_perangkat: string;
  model_merk: string;
  ip_address: string;
  mac_address: string;
  posisi_x: number;
  posisi_y: number;
  rotasi: number;
  // Spesifik CCTV
  cctv_fov_angle?: number; // Derajat sudut pandang (default 75)
  cctv_jarak_meter?: number; // Radius jangkauan (default 12 meter)
  // Spesifik Access Point
  ap_radius_meter?: number; // Radius sinyal Wi-Fi (default 12 meter)
  // Spesifik Server Rack
  rack_total_u?: number; // misal 42U
  status: 'aktif' | 'maintenance' | 'rencana';
}

export interface KabelTipe {
  id: string;
  nama_tipe: string;
  warna_hex: string;
  keterangan?: string;
}

export interface KabelJalur {
  id: string;
  lantai_id: string;
  tipe_kabel_id: string;
  kode_kabel: string;
  perangkat_asal_id?: string | null;
  perangkat_tujuan_id?: string | null;
  waypoints: Point[]; // Titik-titik rute fisik kabel
  panjang_denah_meter: number;
  tinggi_drop_asal_meter?: number; // Naik / Turun di perangkat asal (m) (misal: Rack Server ke Plafon)
  tinggi_drop_tujuan_meter?: number; // Naik / Turun di perangkat tujuan (m) (misal: Plafon ke Meja/PC/AP)
  panjang_cadangan_meter?: number; // Cadangan tarikan & terminasi (m)
  panjang_tambahan_drop_meter: number; // Total drop vertikal + cadangan (asal + tujuan + cadangan)
  total_panjang_meter: number;
  jalur_tipe: 'plafon' | 'tray' | 'bawah_lantai' | 'conduit';
  status: 'terpasang' | 'rencana';
  // Joined fields
  nama_tipe?: string;
  warna_hex?: string;
}

export interface DimensionLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distance_meter: number;
}
