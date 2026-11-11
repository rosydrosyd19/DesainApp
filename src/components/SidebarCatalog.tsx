import React, { useState } from 'react';
import {
  ToolType,
  KabelTipe,
} from '../types/schema.ts';
import {
  MousePointer,
  Hand,
  Maximize2,
  DoorOpen,
  Square,
  Circle,
  Ruler,
  Monitor,
  Printer,
  Server,
  Network,
  Video,
  Wifi,
  Cable,
  Armchair,
  Layers,
  Shield,
  Radio,
  Phone,
} from 'lucide-react';

interface SidebarCatalogProps {
  tool: ToolType;
  onSelectTool: (tool: ToolType, itemData?: any) => void;
  kabelTipe: KabelTipe[];
  selectedCableTypeId: string;
  onSelectCableType: (id: string) => void;
}

type TabType = 'arsitektur' | 'furniture' | 'it_endpoints' | 'network_rack' | 'cctv_security' | 'kabel';

export const SidebarCatalog: React.FC<SidebarCatalogProps> = ({
  tool,
  onSelectTool,
  kabelTipe,
  selectedCableTypeId,
  onSelectCableType,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('it_endpoints');

  return (
    <aside className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0">
      {/* Tool Dasar CAD */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          Alat Gambar CAD
        </div>
        <div className="grid grid-cols-6 gap-1">
          <button
            type="button"
            onClick={() => onSelectTool('select')}
            className={`p-1 flex flex-col items-center justify-center rounded-lg text-[9px] font-medium transition relative ${
              tool === 'select'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Pilih & Pindahkan Objek / Multi-Select Box [V]"
          >
            <MousePointer className="w-3.5 h-3.5 mb-0.5" />
            <span>Pilih</span>
            <span className="text-[8px] opacity-75 font-mono">[V]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('pan')}
            className={`p-1 flex flex-col items-center justify-center rounded-lg text-[9px] font-medium transition relative ${
              tool === 'pan'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Geser Tampilan Kanvas [H / Tahan Spasi]"
          >
            <Hand className="w-3.5 h-3.5 mb-0.5" />
            <span>Geser</span>
            <span className="text-[8px] opacity-75 font-mono">[H]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('wall')}
            className={`p-1 flex flex-col items-center justify-center rounded-lg text-[9px] font-medium transition relative ${
              tool === 'wall'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Tarik Dinding Berantai / Keliling Ruangan [W]"
          >
            <Maximize2 className="w-3.5 h-3.5 mb-0.5" />
            <span>Dinding</span>
            <span className="text-[8px] opacity-75 font-mono">[W]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('wall_box')}
            className={`p-1 flex flex-col items-center justify-center rounded-lg text-[9px] font-medium transition relative ${
              tool === 'wall_box'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Tarik Kotak Ruangan (4 Dinding Sekaligus) [B]"
          >
            <Square className="w-3.5 h-3.5 mb-0.5" />
            <span>Kotak</span>
            <span className="text-[8px] opacity-75 font-mono">[B]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('wall_circle')}
            className={`p-1 flex flex-col items-center justify-center rounded-lg text-[9px] font-medium transition relative ${
              tool === 'wall_circle'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Dinding Lingkaran Bulat Penuh [C]"
          >
            <Circle className="w-3.5 h-3.5 mb-0.5" />
            <span>Bulat</span>
            <span className="text-[8px] opacity-75 font-mono">[C]</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTool('measure')}
            className={`p-1 flex flex-col items-center justify-center rounded-lg text-[9px] font-medium transition relative ${
              tool === 'measure'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Ukur Jarak Berbelok Multi-Titik [M]"
          >
            <Ruler className="w-3.5 h-3.5 mb-0.5" />
            <span>Ukur</span>
            <span className="text-[8px] opacity-75 font-mono">[M]</span>
          </button>
        </div>
      </div>

      {/* Navigasi Kategori Katalog */}
      <div className="flex border-b border-slate-800 overflow-x-auto text-xs scrollbar-none bg-slate-950/20">
        <button
          type="button"
          onClick={() => setActiveTab('arsitektur')}
          className={`px-3 py-2.5 font-medium whitespace-nowrap border-b-2 transition ${
            activeTab === 'arsitektur'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Ruang & Pintu
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('it_endpoints')}
          className={`px-3 py-2.5 font-medium whitespace-nowrap border-b-2 transition ${
            activeTab === 'it_endpoints'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Workstation
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('network_rack')}
          className={`px-3 py-2.5 font-medium whitespace-nowrap border-b-2 transition ${
            activeTab === 'network_rack'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Server & Rack
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cctv_security')}
          className={`px-3 py-2.5 font-medium whitespace-nowrap border-b-2 transition ${
            activeTab === 'cctv_security'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          CCTV & AP
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kabel')}
          className={`px-3 py-2.5 font-medium whitespace-nowrap border-b-2 transition ${
            activeTab === 'kabel'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Kabel LAN
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('furniture')}
          className={`px-3 py-2.5 font-medium whitespace-nowrap border-b-2 transition ${
            activeTab === 'furniture'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Meja
        </button>
      </div>

      {/* Konten Tab Katalog */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* TAB ARSITEKTUR & RUANGAN */}
        {activeTab === 'arsitektur' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-semibold mb-1">Elemen Bangunan & Zonasi Ruang</div>

            {/* Tarik Dinding Berantai / Muter */}
            <button
              type="button"
              onClick={() => onSelectTool('wall')}
              className={`w-full p-2.5 flex items-center space-x-3 rounded-lg border text-left transition group ${
                tool === 'wall'
                  ? 'border-sky-500 bg-sky-500/15'
                  : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-105 transition">
                <Maximize2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Tarik Dinding Muter (Berantai)</div>
                <div className="text-[11px] text-slate-400">
                  Tarik kontinu keliling ruangan seperti narik kabel (klik titik awal untuk tutup)
                </div>
              </div>
            </button>

            {/* Kotak Ruangan Sekaligus (4 Dinding) */}
            <button
              type="button"
              onClick={() => onSelectTool('wall_box')}
              className={`w-full p-2.5 flex items-center space-x-3 rounded-lg border text-left transition group ${
                tool === 'wall_box'
                  ? 'border-sky-500 bg-sky-500/15'
                  : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Kotak Ruangan (4 Dinding Sekaligus)</div>
                <div className="text-[11px] text-slate-400">
                  1 kali tarik langsung jadi 4 dinding kotak persegi lengkap dengan ukuran
                </div>
              </div>
            </button>

            {/* Dinding Lingkaran Bulat Penuh */}
            <button
              type="button"
              onClick={() => onSelectTool('wall_circle')}
              className={`w-full p-2.5 flex items-center space-x-3 rounded-lg border text-left transition group ${
                tool === 'wall_circle'
                  ? 'border-sky-500 bg-sky-500/15'
                  : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-105 transition">
                <Circle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Dinding Lingkaran (Bulat Penuh)</div>
                <div className="text-[11px] text-slate-400">
                  Klik titik pusat, tarik untuk atur diameter dan keliling ruangan bundar
                </div>
              </div>
            </button>

            {/* Pintu Tunggal */}
            <button
              type="button"
              onClick={() => onSelectTool('door', { tipe: 'pintu_tunggal', lebar_cm: 90 })}
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Pintu Tunggal (90 cm)</div>
                <div className="text-xs text-slate-400">Bukaan swing pintu arsitektur standar</div>
              </div>
            </button>

            {/* Pintu Ganda */}
            <button
              type="button"
              onClick={() => onSelectTool('door', { tipe: 'pintu_ganda', lebar_cm: 150 })}
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Pintu Ganda (150 cm)</div>
                <div className="text-xs text-slate-400">Pintu dua daun masuk gedung / ruang server</div>
              </div>
            </button>

            {/* Pintu Geser */}
            <button
              type="button"
              onClick={() => onSelectTool('door', { tipe: 'pintu_geser', lebar_cm: 120 })}
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Pintu Geser / Sliding (120 cm)</div>
                <div className="text-xs text-slate-400">Pintu geser partisi rapat / lorong</div>
              </div>
            </button>

            {/* Jendela Kaca */}
            <button
              type="button"
              onClick={() => onSelectTool('window', { tipe: 'jendela', lebar_cm: 120 })}
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Jendela Kaca (120 cm)</div>
                <div className="text-xs text-slate-400">Bukaan kaca pencahayaan luar</div>
              </div>
            </button>

            {/* Zonasi Ruangan */}
            <div className="pt-2 text-xs text-slate-400 font-semibold">Zonasi Ruang & Area:</div>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_room', {
                  nama: 'Ruang Server & Data Center',
                  warna: 'rgba(239, 68, 68, 0.12)',
                  w_m: 6,
                  h_m: 5,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-rose-900/30 bg-rose-950/20 hover:bg-rose-950/40 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-300">Ruang Server & Data Center</div>
                <div className="text-[10px] text-slate-400">Zona rack server & UPS</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_room', {
                  nama: 'Ruang Kerja Staff & Client',
                  warna: 'rgba(56, 189, 248, 0.08)',
                  w_m: 10,
                  h_m: 8,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-sky-900/30 bg-sky-950/20 hover:bg-sky-950/40 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-sky-300">Ruang Kerja Staff / Client</div>
                <div className="text-[10px] text-slate-400">Area meja kerja & PC client</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_room', {
                  nama: 'Ruang Meeting / Rapat',
                  warna: 'rgba(168, 85, 247, 0.08)',
                  w_m: 7,
                  h_m: 5,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-purple-900/30 bg-purple-950/20 hover:bg-purple-950/40 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                <Square className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-purple-300">Ruang Meeting & Rapat</div>
                <div className="text-[10px] text-slate-400">Area rapat & konferensi</div>
              </div>
            </button>
          </div>
        )}

        {/* TAB WORKSTATION / ENDPOINTS */}
        {activeTab === 'it_endpoints' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-semibold mb-1">Perangkat Client & Endpoint</div>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'pc_client',
                  prefix: 'PC-CLIENT',
                  model: 'Workstation Desktop',
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-105 transition">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">PC Client / Workstation</div>
                <div className="text-xs text-slate-400">Desktop staff / client</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'printer',
                  prefix: 'PRN',
                  model: 'HP LaserJet Network',
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Printer Jaringan</div>
                <div className="text-xs text-slate-400">Network Printer / Scanner</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'pc_client',
                  prefix: 'VOIP',
                  model: 'Grandstream IP Phone',
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">IP Phone / VoIP</div>
                <div className="text-xs text-slate-400">Telepon Meja Client</div>
              </div>
            </button>
          </div>
        )}

        {/* TAB SERVER & RACK */}
        {activeTab === 'network_rack' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-semibold mb-1">Infrastruktur Server & Switch</div>

            {/* Shaft / Riser Kabel (Tembus Antar Lantai) */}
            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'shaft_riser',
                  prefix: 'SHAFT',
                  model: 'Shaft / Riser Kabel Antar Lantai',
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-amber-900/40 bg-amber-950/20 hover:bg-amber-950/40 hover:border-amber-700/60 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-amber-300">Shaft / Riser Kabel</div>
                <div className="text-xs text-slate-400">Jalur vertikal kabel tembus lantai (L1 ⇄ L2)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'rack_server',
                  prefix: 'RACK',
                  model: 'Standing Server Rack 42U',
                  rack_total_u: 42,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Standing Server Rack (42U)</div>
                <div className="text-xs text-slate-400">Rak Server Utama / Switch Distribution</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'switch',
                  prefix: 'SW',
                  model: 'Cisco Catalyst 24-Port Gigabit',
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Switch Hub (24/48 Port)</div>
                <div className="text-xs text-slate-400">Managed PoE Switch</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'server',
                  prefix: 'SRV',
                  model: 'Dell PowerEdge R740',
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Dedicated Server</div>
                <div className="text-xs text-slate-400">Database / App / AD Server</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'nvr_dvr',
                  prefix: 'NVR',
                  model: 'NVR 32 Channel 4K',
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">NVR / DVR CCTV</div>
                <div className="text-xs text-slate-400">Perekam Video Keamanan</div>
              </div>
            </button>
          </div>
        )}

        {/* TAB CCTV & ACCESS POINT */}
        {activeTab === 'cctv_security' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-semibold mb-1">CCTV & Wireless Network</div>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'cctv',
                  prefix: 'CCTV-DOME',
                  model: 'Hikvision 4MP Dome',
                  cctv_fov_angle: 80,
                  cctv_jarak_meter: 12,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-105 transition">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">CCTV Dome (Indoor)</div>
                <div className="text-xs text-slate-400">Sudut FOV 80° - Jarak 12m</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'cctv',
                  prefix: 'CCTV-BULLET',
                  model: 'Hikvision Bullet Outdoor IP67',
                  cctv_fov_angle: 65,
                  cctv_jarak_meter: 18,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-105 transition">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">CCTV Bullet (Outdoor)</div>
                <div className="text-xs text-slate-400">Jarak Pantau 18m - Sudut 65°</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_device', {
                  kategori: 'access_point',
                  prefix: 'AP-WIFI',
                  model: 'UniFi U6 Pro Dual Band',
                  ap_radius_meter: 12,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Access Point (Ceiling)</div>
                <div className="text-xs text-slate-400">Radius Wi-Fi 12 Meter</div>
              </div>
            </button>
          </div>
        )}

        {/* TAB PENARIKAN KABEL */}
        {activeTab === 'kabel' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-semibold mb-1">Pilih Tipe Kabel untuk Penarikan</div>

            <div className="space-y-1.5">
              {kabelTipe.map((kt) => (
                <div
                  key={kt.id}
                  onClick={() => onSelectCableType(kt.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    selectedCableTypeId === kt.id
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: kt.warna_hex }}
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{kt.nama_tipe}</div>
                      <div className="text-[10px] text-slate-400">{kt.keterangan || 'Kabel Jaringan'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onSelectTool('cable')}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 text-xs font-semibold shadow-md transition ${
                tool === 'cable'
                  ? 'bg-sky-500 text-white shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Cable className="w-4 h-4" />
              <span>{tool === 'cable' ? 'Mode Tarik Kabel Aktif' : 'Mulai Tarik Jalur Kabel'}</span>
            </button>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Cara Tarik Kabel:</div>
              <p>1. Klik perangkat asal (misal: Switch / Rack).</p>
              <p>2. Klik titik-titik belokan (mengikuti tray/plafon).</p>
              <p>3. Klik perangkat tujuan (PC, CCTV, AP) untuk menyelesaikan.</p>
              <p className="text-sky-400 pt-1">*Otomatis menghitung total meter + cadangan drop 2m.</p>
            </div>
          </div>
        )}

        {/* TAB MEJA & FURNITURE */}
        {activeTab === 'furniture' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-semibold mb-1">Tata Letak Meja Client & Kursi</div>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_furniture', {
                  tipe: 'meja_tunggal',
                  label: 'Meja Client',
                  lebar_cm: 120,
                  panjang_cm: 60,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Meja Client Standar</div>
                <div className="text-xs text-slate-400">Ukuran 120 cm x 60 cm</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_furniture', {
                  tipe: 'meja_tunggal',
                  label: 'Meja Client Besar',
                  lebar_cm: 160,
                  panjang_cm: 80,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Meja Client Besar (Manager)</div>
                <div className="text-xs text-slate-400">Ukuran 160 cm x 80 cm</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectTool('place_furniture', {
                  tipe: 'meja_rapat',
                  label: 'Meja Rapat',
                  lebar_cm: 240,
                  panjang_cm: 120,
                })
              }
              className="w-full p-2.5 flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Meja Rapat / Meeting</div>
                <div className="text-xs text-slate-400">Ukuran 240 cm x 120 cm</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
