import React, { useEffect, useRef, useState } from 'react';
import { X, FolderOpen, Plus, Layers, Database, ArrowRight, Edit2, Trash2, Check } from 'lucide-react';
import { Proyek } from '../types/schema.ts';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  onSelectFloor: (floorId: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  currentProjectId,
  onSelectProject,
  onSelectFloor,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [proyekList, setProyekList] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newDeskripsi, setNewDeskripsi] = useState('');
  const [newSkala, setNewSkala] = useState(50);
  const [projectFloors, setProjectFloors] = useState<any[]>([]);

  // State untuk Tambah & Edit Lantai
  const [showAddFloorForm, setShowAddFloorForm] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorWidth, setNewFloorWidth] = useState(24.0);
  const [newFloorLength, setNewFloorLength] = useState(16.0);
  const [newFloorCeilingHeight, setNewFloorCeilingHeight] = useState(3.2);

  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editFloorName, setEditFloorName] = useState('');
  const [editFloorWidth, setEditFloorWidth] = useState(24.0);
  const [editFloorLength, setEditFloorLength] = useState(16.0);
  const [editFloorCeilingHeight, setEditFloorCeilingHeight] = useState(3.2);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        fetchProjects();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/proyek');
      if (res.ok) {
        const data = await res.json();
        setProyekList(data);
        if (currentProjectId) {
          fetchFloors(currentProjectId);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil daftar proyek:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async (projId: string) => {
    try {
      const res = await fetch(`/api/proyek/${projId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectFloors(data.lantai || []);
      }
    } catch (err) {
      console.error('Gagal mengambil lantai:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;

    try {
      const res = await fetch('/api/proyek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_proyek: newNama,
          deskripsi: newDeskripsi,
          skala_px_per_meter: newSkala,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowNewForm(false);
        setNewNama('');
        setNewDeskripsi('');
        await fetchProjects();
        onSelectProject(data.id);
        onSelectFloor(data.floorId);
        onClose();
      }
    } catch (err) {
      console.error('Gagal membuat proyek:', err);
    }
  };

  // Tambah Lantai Baru ke MariaDB
  const handleAddFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProjectId || !newFloorName.trim()) return;

    try {
      const res = await fetch(`/api/proyek/${currentProjectId}/lantai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lantai: newFloorName,
          lebar_meter: newFloorWidth,
          panjang_meter: newFloorLength,
          tinggi_plafon_meter: newFloorCeilingHeight,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowAddFloorForm(false);
        setNewFloorName('');
        await fetchFloors(currentProjectId);
        onSelectFloor(data.id);
        onClose();
      }
    } catch (err) {
      console.error('Gagal menambah lantai:', err);
    }
  };

  // Simpan Perubahan Lantai ke MariaDB
  const handleUpdateFloorSubmit = async (floorId: string) => {
    if (!editFloorName.trim()) return;

    try {
      const res = await fetch(`/api/proyek/lantai/${floorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lantai: editFloorName,
          lebar_meter: editFloorWidth,
          panjang_meter: editFloorLength,
          tinggi_plafon_meter: editFloorCeilingHeight,
        }),
      });

      if (res.ok) {
        setEditingFloorId(null);
        await fetchFloors(currentProjectId);
      }
    } catch (err) {
      console.error('Gagal memperbarui lantai:', err);
    }
  };

  // Hapus Lantai dari MariaDB
  const handleDeleteFloor = async (floorId: string, namaLantai: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${namaLantai}" beserta seluruh denah di dalamnya?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/proyek/lantai/${floorId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchFloors(currentProjectId);
      }
    } catch (err) {
      console.error('Gagal menghapus lantai:', err);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="project-dialog"
      aria-labelledby="project-modal-title"
      onClose={onClose}
      className="m-auto bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl p-0 max-w-2xl w-[90vw] backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 id="project-modal-title" className="text-base font-bold text-slate-100">
              Manajemen Proyek & Daftar Lantai (MariaDB)
            </h2>
            <p className="text-xs text-slate-400">
              Pilih denah gedung yang ingin diedit, tambah lantai baru, atau ubah dimensi ruangan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          title="Tutup (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
        {/* Tombol Buat Proyek Baru */}
        {!showNewForm ? (
          <div className="flex justify-between items-center pb-2">
            <span className="text-slate-400 font-medium">Daftar Proyek Gedung:</span>
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg flex items-center space-x-1.5 transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Proyek Baru</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateProject} className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl space-y-3">
            <div className="font-semibold text-slate-200 text-sm">Formulir Proyek Baru</div>

            <div>
              <label className="text-slate-400 block mb-1">Nama Gedung / Proyek</label>
              <input
                type="text"
                required
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                placeholder="Contoh: Gedung Kantor Cabang Surabaya"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Deskripsi Singkat</label>
              <input
                type="text"
                value={newDeskripsi}
                onChange={(e) => setNewDeskripsi(e.target.value)}
                placeholder="Contoh: Pemetaan jaringan LAN, server room, CCTV"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg transition"
              >
                Simpan & Mulai Gambar
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Daftar Proyek */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-slate-400">Memuat daftar proyek...</div>
          ) : proyekList.length === 0 ? (
            <div className="py-8 text-center text-slate-400">Belum ada proyek denah di MariaDB.</div>
          ) : (
            proyekList.map((p) => {
              const isSelected = p.id === currentProjectId;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                      <span className="font-semibold text-slate-100 text-sm">{p.nama_proyek}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold">
                          Sedang Dibuka
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-[11px]">{p.deskripsi || 'Tidak ada deskripsi'}</div>
                    <div className="text-slate-500 text-[10px]">Skala: 1m = {p.skala_px_per_meter}px</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProject(p.id);
                        fetchFloors(p.id);
                      }}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium flex items-center space-x-1 transition"
                    >
                      <span>Pilih Proyek</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DAFTAR LANTAI & DENAH RUANG (DENGAN FITUR TAMBAH, EDIT, HAPUS) */}
        {currentProjectId && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Daftar Lantai / Denah Ruang pada Proyek Ini:</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFloorForm(!showAddFloorForm)}
                className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg flex items-center space-x-1 transition font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Lantai Baru</span>
              </button>
            </div>

            {/* Form Tambah Lantai Baru */}
            {showAddFloorForm && (
              <form
                onSubmit={handleAddFloorSubmit}
                className="p-3.5 bg-slate-800/60 border border-sky-500/40 rounded-xl space-y-3"
              >
                <div className="font-semibold text-sky-400">Tambah Lantai / Ruangan Baru</div>

                <div>
                  <label className="text-slate-400 block mb-1">Nama Lantai / Denah Ruangan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lantai 2 - Ruang IT Support & Server"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Lebar (Meter)</label>
                    <input
                      type="number"
                      step="1"
                      value={newFloorWidth}
                      onChange={(e) => setNewFloorWidth(parseFloat(e.target.value) || 20)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Panjang (Meter)</label>
                    <input
                      type="number"
                      step="1"
                      value={newFloorLength}
                      onChange={(e) => setNewFloorLength(parseFloat(e.target.value) || 15)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Tinggi Plafon (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFloorCeilingHeight}
                      onChange={(e) => setNewFloorCeilingHeight(parseFloat(e.target.value) || 3.2)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-lg transition"
                  >
                    Simpan Lantai & Buka Denah
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFloorForm(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* List Kartu Lantai */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {projectFloors.map((fl) => {
                const isEditing = editingFloorId === fl.id;

                if (isEditing) {
                  return (
                    <div
                      key={fl.id}
                      className="p-3 bg-slate-800 border border-sky-500 rounded-xl space-y-2 col-span-2"
                    >
                      <div className="font-semibold text-sky-400">Edit Data Lantai</div>
                      <div>
                        <label className="text-slate-400 block text-[10px] mb-0.5">Nama Lantai</label>
                        <input
                          type="text"
                          value={editFloorName}
                          onChange={(e) => setEditFloorName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-slate-400 block text-[10px] mb-0.5">Lebar (m)</label>
                          <input
                            type="number"
                            value={editFloorWidth}
                            onChange={(e) => setEditFloorWidth(parseFloat(e.target.value) || 20)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px] mb-0.5">Panjang (m)</label>
                          <input
                            type="number"
                            value={editFloorLength}
                            onChange={(e) => setEditFloorLength(parseFloat(e.target.value) || 15)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px] mb-0.5">Plafon (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editFloorCeilingHeight}
                            onChange={(e) => setEditFloorCeilingHeight(parseFloat(e.target.value) || 3.2)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateFloorSubmit(fl.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Perubahan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFloorId(null)}
                          className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={fl.id}
                    className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-between transition group"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => {
                        onSelectFloor(fl.id);
                        onClose();
                      }}
                    >
                      <div className="font-semibold text-slate-200 group-hover:text-sky-400 transition">
                        {fl.nama_lantai}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Dimensi: {fl.lebar_meter}m x {fl.panjang_meter}m | Tinggi Plafon: {fl.tinggi_plafon_meter ?? 3.2}m
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 pl-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFloorId(fl.id);
                          setEditFloorName(fl.nama_lantai);
                          setEditFloorWidth(fl.lebar_meter);
                          setEditFloorLength(fl.panjang_meter);
                          setEditFloorCeilingHeight(fl.tinggi_plafon_meter ?? 3.2);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-700 rounded transition"
                        title="Ubah Nama & Dimensi Lantai"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {projectFloors.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFloor(fl.id, fl.nama_lantai);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                          title="Hapus Lantai Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onSelectFloor(fl.id);
                          onClose();
                        }}
                        className="p-1 text-slate-400 hover:text-sky-400 transition"
                        title="Buka Denah Lantai Ini"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};
