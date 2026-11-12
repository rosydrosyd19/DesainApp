import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ToolType,
  Proyek,
  Lantai,
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
} from './types/schema.ts';
import { Header } from './components/Header.tsx';
import { SidebarCatalog } from './components/SidebarCatalog.tsx';
import { FloorCanvas } from './components/FloorCanvas.tsx';
import { InspectorPanel } from './components/InspectorPanel.tsx';
import { BomModal } from './components/BomModal.tsx';
import { ProjectModal } from './components/ProjectModal.tsx';
import { PopoutWindow } from './components/PopoutWindow.tsx';
import { PopoutCanvasView } from './components/PopoutCanvasView.tsx';
import { PresentationView } from './components/PresentationView.tsx';
import { StudioControlDeck } from './components/StudioControlDeck.tsx';
import { TracingToolbar } from './components/TracingToolbar.tsx';
import { generateWhitePaperBlueprint } from './utils/exportBlueprint.ts';
import { PanelLeft, PanelRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistorySnapshot {
  dinding: Dinding[];
  bukaan: Bukaan[];
  ruangan: Ruangan[];
  furniture: Furniture[];
  perangkat: Perangkat[];
  kabel: KabelJalur[];
  jiplakan: DenahJiplakan | null;
}

export function App() {
  // Database & Project state
  const [dbStatus, setDbStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  const [dbMessage, setDbMessage] = useState<string>('Menghubungkan ke MariaDB...');
  const [proyek, setProyek] = useState<Proyek | null>(null);
  const [lantai, setLantai] = useState<Lantai | null>(null);
  const [projectFloors, setProjectFloors] = useState<Lantai[]>([]);

  // CAD Floorplan Elements
  const [dinding, setDinding] = useState<Dinding[]>([]);
  const [bukaan, setBukaan] = useState<Bukaan[]>([]);
  const [ruangan, setRuangan] = useState<Ruangan[]>([]);
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [perangkat, setPerangkat] = useState<Perangkat[]>([]);
  const [kabel, setKabel] = useState<KabelJalur[]>([]);
  const [kabelTipe, setKabelTipe] = useState<KabelTipe[]>([]);

  // Interactivity & Tools
  const [tool, setTool] = useState<ToolType>('select');
  const [activeItemToPlace, setActiveItemToPlace] = useState<any | null>(null);
  const [selectedCableTypeId, setSelectedCableTypeId] = useState<string>('cat6_data');
  const [selectedItem, setSelectedItem] = useState<{ type: string; id: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{ type: string; id: string }>>([]);

  const handleSelectItem = (item: { type: string; id: string } | null) => {
    setSelectedItem(item);
    setSelectedItems(item ? [item] : []);
  };

  const handleSelectItems = (items: Array<{ type: string; id: string }>) => {
    setSelectedItems(items);
    if (items.length === 1) {
      setSelectedItem(items[0]);
    } else if (items.length === 0) {
      setSelectedItem(null);
    } else {
      setSelectedItem({ type: 'multi', id: 'multi' });
    }
  };

  const handleDeleteSelected = () => {
    const itemsToDelete = selectedItems.length > 0 ? selectedItems : selectedItem ? [selectedItem] : [];
    if (itemsToDelete.length === 0) return;

    const wallIds = new Set(itemsToDelete.filter((i) => i.type === 'wall').map((i) => i.id));
    const bukaanIds = new Set(itemsToDelete.filter((i) => i.type === 'bukaan').map((i) => i.id));
    const furnIds = new Set(itemsToDelete.filter((i) => i.type === 'furniture').map((i) => i.id));
    const devIds = new Set(itemsToDelete.filter((i) => i.type === 'perangkat').map((i) => i.id));
    const cableIds = new Set(itemsToDelete.filter((i) => i.type === 'kabel').map((i) => i.id));
    const roomIds = new Set(itemsToDelete.filter((i) => i.type === 'ruangan').map((i) => i.id));

    if (wallIds.size > 0) setDinding((prev) => prev.filter((w) => !wallIds.has(w.id)));
    if (bukaanIds.size > 0) setBukaan((prev) => prev.filter((b) => !bukaanIds.has(b.id)));
    if (furnIds.size > 0) setFurniture((prev) => prev.filter((f) => !furnIds.has(f.id)));
    if (devIds.size > 0) {
      setPerangkat((prev) => prev.filter((p) => !devIds.has(p.id)));
      setKabel((prev) =>
        prev.filter(
          (k) =>
            (!k.perangkat_asal_id || !devIds.has(k.perangkat_asal_id)) &&
            (!k.perangkat_tujuan_id || !devIds.has(k.perangkat_tujuan_id))
        )
      );
    }
    if (cableIds.size > 0) setKabel((prev) => prev.filter((k) => !cableIds.has(k.id)));
    if (roomIds.size > 0) setRuangan((prev) => prev.filter((r) => !roomIds.has(r.id)));

    setSelectedItem(null);
    setSelectedItems([]);
  };

  // Viewport & Scale
  const [scalePxPerMeter, setScalePxPerMeter] = useState<number>(50);
  const [snapGrid, setSnapGrid] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<Point>({ x: 60, y: 60 });

  // Modals & UI
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [dualScreenMode, setDualScreenMode] = useState<'none' | 'canvas' | 'presentation'>('none');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [underlayFloorId, setUnderlayFloorId] = useState<string | null>(null);
  const [underlayData, setUnderlayData] = useState<{ dinding: Dinding[]; ruangan: Ruangan[] } | null>(null);

  // Tracing / Jiplakan Denah State
  const [jiplakan, setJiplakan] = useState<DenahJiplakan | null>(null);
  const [isCalibratingTracing, setIsCalibratingTracing] = useState(false);
  const [visibleCableType, setVisibleCableType] = useState<string>('all');

  // Theme State (Dark / Light Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('color-scheme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('color-scheme', next);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', next);
    if (next === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  useEffect(() => {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Layer Visibility Filter (Semua, Dinding, Ruangan, Kabel, Perangkat, Furniture)
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>('all');

  // History Undo & Redo State
  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);
  const isUndoingRedoingRef = useRef<boolean>(false);
  const lastSnapshotRef = useRef<HistorySnapshot | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // Helper cek apakah terjadi perubahan elemen CAD
  const hasSnapshotChanged = (s1: HistorySnapshot | null, s2: HistorySnapshot): boolean => {
    if (!s1) return true;
    return (
      s1.dinding !== s2.dinding ||
      s1.bukaan !== s2.bukaan ||
      s1.ruangan !== s2.ruangan ||
      s1.furniture !== s2.furniture ||
      s1.perangkat !== s2.perangkat ||
      s1.kabel !== s2.kabel ||
      s1.jiplakan !== s2.jiplakan
    );
  };

  // Rekam riwayat snapshot saat state CAD berubah
  useEffect(() => {
    const currentSnapshot: HistorySnapshot = {
      dinding,
      bukaan,
      ruangan,
      furniture,
      perangkat,
      kabel,
      jiplakan,
    };

    if (isInitialLoadRef.current) {
      lastSnapshotRef.current = currentSnapshot;
      isInitialLoadRef.current = false;
      return;
    }

    if (isUndoingRedoingRef.current) {
      isUndoingRedoingRef.current = false;
      lastSnapshotRef.current = currentSnapshot;
      return;
    }

    if (hasSnapshotChanged(lastSnapshotRef.current, currentSnapshot)) {
      if (lastSnapshotRef.current) {
        setUndoStack((prev) => [...prev.slice(-39), lastSnapshotRef.current!]);
        setRedoStack([]);
      }
      lastSnapshotRef.current = currentSnapshot;
    }
  }, [dinding, bukaan, ruangan, furniture, perangkat, kabel, jiplakan]);

  // Handler Undo
  const handleUndo = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      const prevSnapshot = prevUndo[prevUndo.length - 1];
      const newUndo = prevUndo.slice(0, -1);
      const currentSnapshot: HistorySnapshot = {
        dinding,
        bukaan,
        ruangan,
        furniture,
        perangkat,
        kabel,
        jiplakan,
      };

      isUndoingRedoingRef.current = true;
      setRedoStack((prevRedo) => [...prevRedo.slice(-39), currentSnapshot]);

      setDinding(prevSnapshot.dinding);
      setBukaan(prevSnapshot.bukaan);
      setRuangan(prevSnapshot.ruangan);
      setFurniture(prevSnapshot.furniture);
      setPerangkat(prevSnapshot.perangkat);
      setKabel(prevSnapshot.kabel);
      setJiplakan(prevSnapshot.jiplakan ?? null);
      lastSnapshotRef.current = prevSnapshot;
      handleSelectItem(null);

      return newUndo;
    });
  }, [dinding, bukaan, ruangan, furniture, perangkat, kabel, jiplakan]);

  // Handler Redo
  const handleRedo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const nextSnapshot = prevRedo[prevRedo.length - 1];
      const newRedo = prevRedo.slice(0, -1);
      const currentSnapshot: HistorySnapshot = {
        dinding,
        bukaan,
        ruangan,
        furniture,
        perangkat,
        kabel,
        jiplakan,
      };

      isUndoingRedoingRef.current = true;
      setUndoStack((prevUndo) => [...prevUndo.slice(-39), currentSnapshot]);

      setDinding(nextSnapshot.dinding);
      setBukaan(nextSnapshot.bukaan);
      setRuangan(nextSnapshot.ruangan);
      setFurniture(nextSnapshot.furniture);
      setPerangkat(nextSnapshot.perangkat);
      setKabel(nextSnapshot.kabel);
      setJiplakan(nextSnapshot.jiplakan ?? null);
      lastSnapshotRef.current = nextSnapshot;
      handleSelectItem(null);

      return newRedo;
    });
  }, [dinding, bukaan, ruangan, furniture, perangkat, kabel, jiplakan]);

  // 1. Periksa Status MariaDB saat Startup
  useEffect(() => {
    checkDatabaseHealth();
    const interval = setInterval(checkDatabaseHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  const checkDatabaseHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (res.ok && data.status === 'connected') {
        setDbStatus('connected');
        setDbMessage(data.message || 'MariaDB Terhubung');
      } else {
        setDbStatus('error');
        setDbMessage(data.message || 'Koneksi ke MariaDB gagal');
      }
    } catch (err: any) {
      setDbStatus('error');
      setDbMessage('Backend API atau MySQL di XAMPP belum aktif');
    }
  };

  // 2. Muat Proyek Pertama dari MariaDB
  useEffect(() => {
    loadInitialProject();
  }, []);

  const loadInitialProject = async () => {
    try {
      const res = await fetch('/api/proyek');
      if (res.ok) {
        const projects = await res.json();
        if (projects.length > 0) {
          const firstProj = projects[0];
          setProyek(firstProj);
          if (firstProj.skala_px_per_meter) {
            setScalePxPerMeter(firstProj.skala_px_per_meter);
          }

          // Ambil detail proyek & daftar lantainya
          const detailRes = await fetch(`/api/proyek/${firstProj.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setProjectFloors(detail.lantai || []);
            if (detail.lantai && detail.lantai.length > 0) {
              loadFloorData(detail.lantai[0].id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Gagal memuat proyek:', err);
    }
  };

  const loadFloorData = async (floorId: string) => {
    if (underlayFloorId === floorId) {
      setUnderlayFloorId(null);
    }
    setUndoStack([]);
    setRedoStack([]);
    isInitialLoadRef.current = true;
    try {
      const res = await fetch(`/api/proyek/lantai/${floorId}/full`);
      if (res.ok) {
        const data = await res.json();
        setProyek(data.proyek);
        setLantai(data.lantai);
        setDinding(data.dinding || []);
        setBukaan(data.bukaan || []);
        setRuangan(data.ruangan || []);
        setFurniture(data.furniture || []);
        setPerangkat(data.perangkat || []);
        setKabel(data.kabel || []);
        if (data.kabelTipe) setKabelTipe(data.kabelTipe);
        if (data.proyek?.skala_px_per_meter) {
          setScalePxPerMeter(data.proyek.skala_px_per_meter);
        }
        setJiplakan(data.jiplakan || null);
        setIsCalibratingTracing(false);
      }
    } catch (err) {
      console.error('Gagal memuat data lantai:', err);
    }
  };

  // Ambil data denah lantai lain untuk bayangan (Ghost View / Underlay)
  useEffect(() => {
    if (!underlayFloorId) {
      setUnderlayData(null);
      return;
    }
    let isCurrent = true;
    fetch(`/api/proyek/lantai/${underlayFloorId}/full`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCurrent || !data) return;
        setUnderlayData({
          dinding: data.dinding || [],
          ruangan: data.ruangan || [],
        });
      })
      .catch((err) => console.error('Gagal mengambil data underlay:', err));

    return () => {
      isCurrent = false;
    };
  }, [underlayFloorId]);

  // Tambah Lantai Baru pada Proyek
  const handleAddFloor = async () => {
    if (!proyek) return;
    const nextNum = (projectFloors.length || 0) + 1;
    const namaLantai = window.prompt(
      'Masukkan nama lantai baru:',
      `Lantai ${nextNum}`
    );
    if (!namaLantai || !namaLantai.trim()) return;

    try {
      const res = await fetch(`/api/proyek/${proyek.id}/lantai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lantai: namaLantai.trim(),
          lebar_meter: lantai?.lebar_meter || 24.0,
          panjang_meter: lantai?.panjang_meter || 16.0,
          tinggi_plafon_meter: lantai?.tinggi_plafon_meter || 3.2,
        }),
      });

      if (res.ok) {
        const newFloor = await res.json();
        const detailRes = await fetch(`/api/proyek/${proyek.id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setProjectFloors(detail.lantai || []);
        } else {
          setProjectFloors((prev) => [...prev, newFloor]);
        }
        loadFloorData(newFloor.id);
        showToast(`Berhasil menambahkan ${namaLantai.trim()}!`);
      } else {
        showToast('Gagal menambahkan lantai baru.');
      }
    } catch (err) {
      showToast('Error koneksi saat menambah lantai.');
    }
  };

  // 3. Simpan Seluruh Denah ke MariaDB
  const handleSaveToDb = async () => {
    if (!lantai) return;
    try {
      setIsSaving(true);
      const payload = {
        proyek: { ...proyek, skala_px_per_meter: scalePxPerMeter },
        lantai,
        dinding,
        bukaan,
        ruangan,
        furniture,
        perangkat,
        kabel,
        jiplakan,
      };

      const res = await fetch(`/api/proyek/lantai/${lantai.id}/save-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Denah & data mapping IT berhasil disimpan ke MariaDB!');
      } else {
        showToast('Gagal menyimpan: periksa koneksi MariaDB.');
      }
    } catch (err) {
      showToast('Error koneksi saat menyimpan ke MariaDB.');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setSaveNotification(msg);
    setTimeout(() => setSaveNotification(null), 4000);
  };

  // Upload Foto / Sketsa Denah untuk Dijiplak (Underlay Tracing)
  const handleUploadJiplakan = (file: File) => {
    if (!lantai) {
      showToast('Pilih atau buat lantai terlebih dahulu sebelum mengunggah gambar jiplakan.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const naturalW = img.naturalWidth || 800;
        const naturalH = img.naturalHeight || 600;

        // Hitung posisi awal agar tepat berada di tengah kanvas
        const canvasW = window.innerWidth;
        const canvasH = window.innerHeight;
        const centerWorldX = (canvasW / 2 - panOffset.x) / zoom;
        const centerWorldY = (canvasH / 2 - panOffset.y) / zoom;

        const newJiplakan: DenahJiplakan = {
          id: `trc-${Date.now()}`,
          lantai_id: lantai.id,
          image_url: dataUrl,
          posisi_x: Math.round(centerWorldX - naturalW / 2),
          posisi_y: Math.round(centerWorldY - naturalH / 2),
          lebar_px: naturalW,
          tinggi_px: naturalH,
          skala: 1.0,
          rotasi: 0,
          opacity: 0.5,
          is_locked: false,
          is_visible: true,
        };

        setJiplakan(newJiplakan);
        showToast('Gambar jiplakan dimuat! Atur transparansi, geser, atau kalibrasi ukuran.');

        // Simpan langsung ke backend
        fetch(`/api/proyek/lantai/${lantai.id}/jiplakan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newJiplakan),
        }).catch((err) => console.error('Gagal menyimpan gambar jiplakan ke DB:', err));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateJiplakan = (updated: DenahJiplakan | null) => {
    setJiplakan(updated);
  };

  const handleDeleteJiplakan = async () => {
    if (!lantai) return;
    if (window.confirm('Hapus gambar jiplakan dari denah lantai ini?')) {
      setJiplakan(null);
      setIsCalibratingTracing(false);
      try {
        await fetch(`/api/proyek/lantai/${lantai.id}/jiplakan`, { method: 'DELETE' });
        showToast('Gambar jiplakan berhasil dihapus.');
      } catch (err) {
        console.error('Gagal menghapus gambar jiplakan:', err);
      }
    }
  };

  // Ubah Ketinggian Atap / Plafon Lantai & Opsi Sinkronisasi Massal Kabel
  const handleChangeCeilingHeight = async (newHeight: number) => {
    if (!lantai) return;

    // Cek apakah ada kabel plafon di lantai ini
    const ceilingCables = kabel.filter((k) => k.jalur_tipe === 'plafon');
    let syncKabel = false;
    if (ceilingCables.length > 0 && Math.abs((lantai.tinggi_plafon_meter ?? 3.2) - newHeight) > 0.05) {
      syncKabel = window.confirm(
        `Tinggi atap/plafon lantai "${lantai.nama_lantai}" diubah menjadi ${newHeight} meter.\n\nApakah Anda ingin memperbarui otomatis seluruh kalkulasi (${ceilingCables.length}) jalur kabel plafon di lantai ini mengikuti tinggi atap ${newHeight}m?`
      );
    }

    try {
      const res = await fetch(`/api/proyek/lantai/${lantai.id}/tinggi-plafon`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tinggi_plafon_meter: newHeight,
          syncKabelPlafon: syncKabel,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setLantai((prev) => (prev ? { ...prev, tinggi_plafon_meter: newHeight } : null));
        setProjectFloors((prev) =>
          prev.map((f) => (f.id === lantai.id ? { ...f, tinggi_plafon_meter: newHeight } : f))
        );

        if (syncKabel && json.updatedCables && json.updatedCables.length > 0) {
          setKabel(json.updatedCables);
        } else if (syncKabel) {
          // Fallback update kabel di client state jika API tidak mengembalikan array
          setKabel((prev) =>
            prev.map((c) => {
              if (c.jalur_tipe !== 'plafon') return c;
              const targetDev = perangkat.find((p) => p.id === c.perangkat_tujuan_id);
              const dropAsal = newHeight;
              let dropTujuan = Math.max(1.5, Number((newHeight - 0.75).toFixed(2)));
              if (targetDev?.kategori === 'access_point') {
                dropTujuan = 0.5;
              } else if (targetDev?.kategori === 'cctv') {
                dropTujuan = Math.max(1.0, Number((newHeight - 3.5).toFixed(2)));
              } else if (targetDev?.kategori === 'rack_server') {
                dropTujuan = newHeight;
              }
              const cadangan = c.panjang_cadangan_meter || 1.0;
              const dropExtra = Number((dropAsal + dropTujuan + cadangan).toFixed(2));
              return {
                ...c,
                tinggi_drop_asal_meter: dropAsal,
                tinggi_drop_tujuan_meter: dropTujuan,
                panjang_tambahan_drop_meter: dropExtra,
                total_panjang_meter: Number((c.panjang_denah_meter + dropExtra).toFixed(2)),
              };
            })
          );
        }

        showToast(`Tinggi atap diperbarui ke ${newHeight}m${syncKabel ? ' (kabel disinkronkan)' : ''}`);
      }
    } catch (err) {
      console.error('Gagal memperbarui tinggi atap:', err);
      showToast('Gagal memperbarui tinggi atap di database.');
    }
  };

  // Ubah Rasio Skala Kalibrasi CAD (1m = X px) dengan Smart Rescale
  const handleScaleChange = async (newScale: number, rescaleExisting: boolean = true) => {
    if (newScale === scalePxPerMeter || newScale <= 0) return;

    const oldScale = scalePxPerMeter;
    const ratio = newScale / oldScale;

    if (rescaleExisting) {
      // Rescale koordinat dinding (x1, y1, x2, y2, kelengkungan)
      setDinding((prev) =>
        prev.map((d) => ({
          ...d,
          x1: Math.round(d.x1 * ratio),
          y1: Math.round(d.y1 * ratio),
          x2: Math.round(d.x2 * ratio),
          y2: Math.round(d.y2 * ratio),
          kelengkungan: d.kelengkungan !== undefined ? Math.round(d.kelengkungan * ratio) : undefined,
        }))
      );

      // Rescale koordinat bukaan pintu & jendela (posisi_x, posisi_y)
      setBukaan((prev) =>
        prev.map((b) => ({
          ...b,
          posisi_x: Math.round(b.posisi_x * ratio),
          posisi_y: Math.round(b.posisi_y * ratio),
        }))
      );

      // Rescale titik sudut ruangan (polygon_points)
      setRuangan((prev) =>
        prev.map((r) => ({
          ...r,
          polygon_points: r.polygon_points.map((pt) => ({
            x: Math.round(pt.x * ratio),
            y: Math.round(pt.y * ratio),
          })),
        }))
      );

      // Rescale posisi furniture
      setFurniture((prev) =>
        prev.map((f) => ({
          ...f,
          posisi_x: Math.round(f.posisi_x * ratio),
          posisi_y: Math.round(f.posisi_y * ratio),
        }))
      );

      // Rescale posisi perangkat IT & rack
      setPerangkat((prev) =>
        prev.map((p) => ({
          ...p,
          posisi_x: Math.round(p.posisi_x * ratio),
          posisi_y: Math.round(p.posisi_y * ratio),
        }))
      );

      // Rescale jalur rute kabel (waypoints)
      setKabel((prev) =>
        prev.map((k) => ({
          ...k,
          waypoints: (k.waypoints || []).map((pt: Point) => ({
            x: Math.round(pt.x * ratio),
            y: Math.round(pt.y * ratio),
          })),
        }))
      );
    }

    setScalePxPerMeter(newScale);

    if (proyek) {
      setProyek({
        ...proyek,
        skala_px_per_meter: newScale,
      });

      try {
        await fetch(`/api/proyek/${proyek.id}/skala`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skala_px_per_meter: newScale }),
        });
      } catch (err) {
        console.error('Gagal menyimpan skala ke MariaDB:', err);
      }
    }

    showToast(`Skala denah diubah: 1m = ${newScale}px ${rescaleExisting ? '(Ukuran riil dipertahankan)' : ''}`);
  };

  // 4. Pilih Tool & Komponen
  const handleSelectTool = (newTool: ToolType, itemData?: any) => {
    setTool(newTool);
    setActiveItemToPlace(itemData || null);
    if (newTool !== 'select') {
      setSelectedItem(null);
    }
  };

  // 5. Export Gambar Denah Kertas Putih (Architectural Blueprint Sheet - Dengan / Tanpa Grid)
  const handleExportImage = (includeGrid: boolean = true) => {
    try {
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
        includeGrid,
      });

      const suffix = includeGrid ? 'Grid' : 'Polos';
      const link = document.createElement('a');
      link.download = `Denah_Bangunan_IT_${lantai?.nama_lantai || 'Lantai1'}_${suffix}.png`;
      link.href = blueprintCanvas.toDataURL('image/png');
      link.click();
      showToast(
        includeGrid
          ? 'Denah arsitektur DENGAN grid CAD (petak 1m & 20cm) berhasil di-export ke PNG!'
          : 'Denah arsitektur TANPA grid (kertas putih polos) berhasil di-export ke PNG!'
      );
    } catch (err) {
      console.error('Gagal export gambar:', err);
      showToast('Gagal melakukan export denah.');
    }
  };

  // Keyboard Shortcuts Global untuk seluruh menu aplikasi
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Jangan jalankan shortcut jika user sedang mengetik di input form / modal
      const activeEl = document.activeElement;
      if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) {
        return;
      }

      // Kombinasi tombol Ctrl / Cmd
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
          return;
        }
        if (k === 'y' || (k === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (k === 's') {
          e.preventDefault();
          handleSaveToDb();
          return;
        }
        if (k === 'b') {
          e.preventDefault();
          setIsBomModalOpen((o) => !o);
          return;
        }
        if (k === 'o') {
          e.preventDefault();
          setIsProjectModalOpen((o) => !o);
          return;
        }
        if (k === 'e') {
          e.preventDefault();
          handleExportImage();
          return;
        }
      }

      // Shortcut satu huruf
      const key = e.key.toLowerCase();
      if (key === 'v') {
        setTool('select');
      } else if (key === 'h') {
        setTool('pan');
      } else if (key === 'w') {
        setTool('wall');
      } else if (key === 'b') {
        setTool('wall_box');
      } else if (key === 'c') {
        setTool('wall_circle');
      } else if (key === 'k') {
        setTool('cable');
      } else if (key === 'm') {
        setTool('measure');
      } else if (key === 'd') {
        setTool('door');
      } else if (key === 'j') {
        setTool('window');
      } else if (key === 'z') {
        setTool('place_room');
        setActiveItemToPlace({
          nama: 'Ruang Kantor Baru',
          warna: 'rgba(56, 189, 248, 0.1)',
          w_m: 6,
          h_m: 5,
        });
      } else if (key === 'g') {
        setSnapGrid((s) => !s);
      } else if (key === '+' || key === '=') {
        setZoom((z) => Math.min(2.5, z + 0.15));
      } else if (key === '-' || key === '_') {
        setZoom((z) => Math.max(0.4, z - 0.15));
      } else if (key === '0') {
        setZoom(1.0);
        setPanOffset({ x: 60, y: 60 });
      } else if (key === 'l') {
        setDualScreenMode((m) => (m === 'canvas' ? 'none' : 'canvas'));
      } else if (e.key === '[') {
        setIsLeftSidebarOpen((prev) => !prev);
      } else if (e.key === ']') {
        setIsRightSidebarOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setTool('select');
        handleSelectItem(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, selectedItems, dinding, bukaan, furniture, perangkat, kabel, ruangan, handleUndo, handleRedo]);

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notifikasi Simpan */}
      {saveNotification && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center space-x-2 animate-bounce">
          <span>✓</span>
          <span>{saveNotification}</span>
        </div>
      )}

      {/* Header Utama */}
      <Header
        proyek={proyek}
        lantai={lantai}
        projectFloors={projectFloors}
        onSelectFloor={(fId) => {
          if (underlayFloorId === fId) setUnderlayFloorId(null);
          loadFloorData(fId);
        }}
        onAddFloor={handleAddFloor}
        underlayFloorId={underlayFloorId}
        onToggleUnderlayFloor={setUnderlayFloorId}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
        onChangeCeilingHeight={handleChangeCeilingHeight}
        dualScreenMode={dualScreenMode}
        onToggleDualScreen={setDualScreenMode}
        dbStatus={dbStatus}
        dbMessage={dbMessage}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(2.5, z + 0.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.4, z - 0.15))}
        onZoomReset={() => {
          setZoom(1.0);
          setPanOffset({ x: 60, y: 60 });
        }}
        scalePxPerMeter={scalePxPerMeter}
        onChangeScale={handleScaleChange}
        snapGrid={snapGrid}
        onToggleSnapGrid={() => setSnapGrid((s) => !s)}
        onSaveToDb={handleSaveToDb}
        onOpenBomModal={() => setIsBomModalOpen(true)}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onExportImage={handleExportImage}
        isSaving={isSaving}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        hasJiplakan={Boolean(jiplakan)}
        onUploadJiplakan={handleUploadJiplakan}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Area Kerja Tengah (Sidebar + Canvas CAD / Studio Deck + Inspector) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Katalog IT & Furniture (Bisa Buka Tutup) */}
        <div
          className={`h-full transition-all duration-300 ease-in-out shrink-0 relative ${
            isLeftSidebarOpen ? 'w-80' : 'w-0'
          }`}
        >
          {/* Tombol Tab Cepat Tutup Katalog di Garis Batas Kanan (Tengah Vertikal) */}
          {isLeftSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsLeftSidebarOpen(false)}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-30 py-3.5 px-0.5 bg-slate-900/95 hover:bg-sky-600 text-slate-400 hover:text-white border-y border-r border-slate-700/80 rounded-r-lg shadow-2xl flex items-center justify-center transition group cursor-pointer"
              title="Tutup Sidebar Katalog [ [ ]"
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:scale-110 transition" />
            </button>
          )}

          <div className="w-80 h-full overflow-hidden shrink-0">
            <SidebarCatalog
              tool={tool}
              onSelectTool={handleSelectTool}
              kabelTipe={kabelTipe}
              selectedCableTypeId={selectedCableTypeId}
              onSelectCableType={(id) => setSelectedCableTypeId(id)}
              visibleCableType={visibleCableType}
              onSelectVisibleCableType={setVisibleCableType}
            />
          </div>
        </div>

        {/* Mesin Gambar Denah Berskala (Canvas) atau Ruang Kontrol Studio jika Layar 2 Aktif */}
        {dualScreenMode === 'canvas' ? (
          <StudioControlDeck
            proyek={proyek}
            lantai={lantai}
            dinding={dinding}
            furniture={furniture}
            perangkat={perangkat}
            kabel={kabel}
            onDockBack={() => setDualScreenMode('none')}
            onOpenBomModal={() => setIsBomModalOpen(true)}
            onExportImage={handleExportImage}
            onSaveToDb={handleSaveToDb}
            isSaving={isSaving}
            jiplakan={jiplakan}
            onUpdateJiplakan={handleUpdateJiplakan}
            onUploadJiplakan={handleUploadJiplakan}
            onDeleteJiplakan={handleDeleteJiplakan}
            isCalibratingTracing={isCalibratingTracing}
            onStartCalibration={() => setIsCalibratingTracing((prev) => !prev)}
          />
        ) : (
          <div className="flex-1 h-full relative">
            {/* Tombol Melayang Buka Sidebar Kiri saat Tertutup */}
            {!isLeftSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsLeftSidebarOpen(true)}
                className="absolute left-3 top-3 z-30 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-sky-400 border border-slate-700/80 rounded-lg shadow-xl text-xs font-medium flex items-center space-x-1.5 backdrop-blur transition"
                title="Buka Sidebar Katalog IT & CAD [ [ ]"
              >
                <PanelLeft className="w-4 h-4" />
                <span>Katalog [ [ ]</span>
              </button>
            )}

            {/* Tombol Melayang Buka Inspector Kanan saat Tertutup */}
            {!isRightSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsRightSidebarOpen(true)}
                className="absolute right-3 top-3 z-30 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-sky-400 border border-slate-700/80 rounded-lg shadow-xl text-xs font-medium flex items-center space-x-1.5 backdrop-blur transition"
                title="Buka Panel Properti Inspector [ ] ]"
              >
                <PanelRight className="w-4 h-4" />
                <span>Inspector [ ] ]</span>
              </button>
            )}

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
              underlayDinding={underlayData?.dinding}
              underlayRuangan={underlayData?.ruangan}
              onSelectItem={handleSelectItem}
              onSelectItems={handleSelectItems}
              onUpdateDinding={setDinding}
              onUpdateBukaan={setBukaan}
              onUpdateRuangan={setRuangan}
              onUpdateFurniture={setFurniture}
              onUpdatePerangkat={setPerangkat}
              onUpdateKabel={setKabel}
              activeItemToPlace={activeItemToPlace}
              selectedCableTypeId={selectedCableTypeId}
              tinggiPlafon={lantai?.tinggi_plafon_meter ?? 3.2}
              zoom={zoom}
              panOffset={panOffset}
              onPanChange={setPanOffset}
              jiplakan={jiplakan}
              onUpdateJiplakan={handleUpdateJiplakan}
              onUploadJiplakan={handleUploadJiplakan}
              isCalibratingTracing={isCalibratingTracing}
              onCalibrationFinished={() => setIsCalibratingTracing(false)}
              activeFloorId={lantai?.id}
              visibleCableType={visibleCableType}
              onSelectVisibleCableType={setVisibleCableType}
              theme={theme}
              layerVisibility={layerVisibility}
              onSelectLayerVisibility={setLayerVisibility}
            />

            {/* Toolbar Melayang Pengaturan Gambar Jiplakan */}
            {jiplakan && (
              <TracingToolbar
                jiplakan={jiplakan}
                onUpdateJiplakan={handleUpdateJiplakan}
                onDelete={handleDeleteJiplakan}
                isCalibrating={isCalibratingTracing}
                onStartCalibration={() => setIsCalibratingTracing((prev) => !prev)}
              />
            )}
          </div>
        )}

        {/* Panel Properti / Inspector Objek yang Dipilih (Bisa Buka Tutup) */}
        <div
          className={`h-full transition-all duration-300 ease-in-out shrink-0 relative ${
            isRightSidebarOpen ? 'w-80' : 'w-0'
          }`}
        >
          {/* Tombol Tab Cepat Tutup Inspector di Garis Batas Kiri (Tengah Vertikal) */}
          {isRightSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsRightSidebarOpen(false)}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 py-3.5 px-0.5 bg-slate-900/95 hover:bg-sky-600 text-slate-400 hover:text-white border-y border-l border-slate-700/80 rounded-l-lg shadow-2xl flex items-center justify-center transition group cursor-pointer"
              title="Tutup Panel Inspector [ ] ]"
            >
              <ChevronRight className="w-3.5 h-3.5 group-hover:scale-110 transition" />
            </button>
          )}

          <div className="w-80 h-full overflow-hidden shrink-0">
            <InspectorPanel
              selectedItem={selectedItem}
              selectedItems={selectedItems}
              dinding={dinding}
              bukaan={bukaan}
              ruangan={ruangan}
              furniture={furniture}
              perangkat={perangkat}
              kabel={kabel}
              kabelTipe={kabelTipe}
              scalePxPerMeter={scalePxPerMeter}
              tinggiPlafon={lantai?.tinggi_plafon_meter ?? 3.2}
              onUpdateDinding={setDinding}
              onUpdateBukaan={setBukaan}
              onUpdateRuangan={setRuangan}
              onUpdateFurniture={setFurniture}
              onUpdatePerangkat={setPerangkat}
              onUpdateKabel={setKabel}
              onDeleteSelected={handleDeleteSelected}
              onClose={() => setIsRightSidebarOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Modal Bill of Materials (BOM) */}
      <BomModal
        isOpen={isBomModalOpen}
        onClose={() => setIsBomModalOpen(false)}
        floorId={lantai?.id || 'floor-default-01'}
        tinggiPlafon={lantai?.tinggi_plafon_meter ?? 3.2}
        namaLantai={lantai?.nama_lantai || 'Lantai 1'}
      />

      {/* Modal Manajemen Proyek di MariaDB */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        currentProjectId={proyek?.id || ''}
        onSelectProject={(projId) => {
          fetch(`/api/proyek/${projId}`)
            .then((r) => r.json())
            .then((d) => {
              setProyek(d);
              setProjectFloors(d.lantai || []);
              if (d.lantai && d.lantai.length > 0) {
                loadFloorData(d.lantai[0].id);
              }
            });
        }}
        onSelectFloor={(floorId) => loadFloorData(floorId)}
      />

      {/* Popout Window untuk Layar 2: Mode Studio Kanvas CAD */}
      {dualScreenMode === 'canvas' && (
        <PopoutWindow
          title={`Kanvas CAD (Layar 2) - ${lantai?.nama_lantai || 'Denah'}`}
          onClose={() => setDualScreenMode('none')}
        >
          <PopoutCanvasView
            tool={tool}
            onSelectTool={handleSelectTool}
            scalePxPerMeter={scalePxPerMeter}
            snapGrid={snapGrid}
            onToggleSnapGrid={() => setSnapGrid((s) => !s)}
            dinding={dinding}
            bukaan={bukaan}
            ruangan={ruangan}
            furniture={furniture}
            perangkat={perangkat}
            kabel={kabel}
            kabelTipe={kabelTipe}
            selectedItem={selectedItem}
            selectedItems={selectedItems}
            underlayDinding={underlayData?.dinding}
            underlayRuangan={underlayData?.ruangan}
            onSelectItem={handleSelectItem}
            onSelectItems={handleSelectItems}
            onUpdateDinding={setDinding}
            onUpdateBukaan={setBukaan}
            onUpdateRuangan={setRuangan}
            onUpdateFurniture={setFurniture}
            onUpdatePerangkat={setPerangkat}
            onUpdateKabel={setKabel}
            activeItemToPlace={activeItemToPlace}
            selectedCableTypeId={selectedCableTypeId}
            onSelectCableType={(id) => setSelectedCableTypeId(id)}
            tinggiPlafon={lantai?.tinggi_plafon_meter ?? 3.2}
            zoom={zoom}
            onZoomIn={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            onZoomOut={() => setZoom((z) => Math.max(0.4, z - 0.15))}
            onZoomReset={() => {
              setZoom(1.0);
              setPanOffset({ x: 60, y: 60 });
            }}
            panOffset={panOffset}
            onPanChange={setPanOffset}
            onDockBack={() => setDualScreenMode('none')}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            jiplakan={jiplakan}
            onUpdateJiplakan={handleUpdateJiplakan}
            onUploadJiplakan={handleUploadJiplakan}
            onDeleteJiplakan={handleDeleteJiplakan}
            isCalibratingTracing={isCalibratingTracing}
            onStartCalibration={() => setIsCalibratingTracing((prev) => !prev)}
            onCalibrationFinished={() => setIsCalibratingTracing(false)}
            visibleCableType={visibleCableType}
            onSelectVisibleCableType={setVisibleCableType}
            theme={theme}
            layerVisibility={layerVisibility}
            onSelectLayerVisibility={setLayerVisibility}
          />
        </PopoutWindow>
      )}

      {/* Popout Window untuk Layar 2: Mode Live Blueprint Presentasi Klien */}
      {dualScreenMode === 'presentation' && (
        <PopoutWindow
          title={`Live Blueprint (Layar 2) - ${lantai?.nama_lantai || 'Denah'}`}
          onClose={() => setDualScreenMode('none')}
        >
          <PresentationView
            proyek={proyek}
            lantai={lantai}
            dinding={dinding}
            bukaan={bukaan}
            ruangan={ruangan}
            furniture={furniture}
            perangkat={perangkat}
            kabel={kabel}
            kabelTipe={kabelTipe}
            scalePxPerMeter={scalePxPerMeter}
            onClose={() => setDualScreenMode('none')}
          />
        </PopoutWindow>
      )}
    </div>
  );
}
export default App;
