import React, { useEffect, useRef, useState } from 'react';
import { X, FileSpreadsheet, Printer, Download, Cable, Server, Square, Hash, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface BomModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorId: string;
  tinggiPlafon?: number;
  namaLantai?: string;
}

export const BomModal: React.FC<BomModalProps> = ({ isOpen, onClose, floorId, tinggiPlafon = 3.2, namaLantai }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [showCableDetails, setShowCableDetails] = useState(true);
  const [data, setData] = useState<{
    rekapKabel: any[];
    daftarKabelDetail?: any[];
    rekapPerangkat: any[];
    rekapFurniture: any[];
    daftarEndpoint: any[];
  } | null>(null);

  // Sync open state with native <dialog> using showModal() per Modern Web Guidance
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        fetchBomData();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, floorId]);

  const fetchBomData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventaris/bom/${floorId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Gagal mengambil data BOM:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export data ke file CSV
  const handleExportCsv = () => {
    if (!data) return;
    let csv = `REKAPITULASI KEBUTUHAN KABEL JARINGAN\n`;
    csv += `Lantai: "${namaLantai || 'Lantai Aktif'}",Tinggi Atap Gedung: ${tinggiPlafon} Meter\n\n`;
    csv += 'Tipe Kabel,Jumlah Tarikan,Panjang Horisontal Denah (m),Total Naik Asal (m),Total Turun Tujuan (m),Total Cadangan Slack (m),Total Drop Vertikal (m),Total Kebutuhan Kabel (m),Estimasi Rol (305m)\n';
    data.rekapKabel.forEach((k) => {
      csv += `"${k.nama_tipe}",${k.jumlah_tarikan},${k.total_panjang_denah},${k.total_drop_asal || 0},${k.total_drop_tujuan || 0},${k.total_cadangan || 0},${k.total_drop},${k.total_meter},${k.estimasi_rol_305m}\n`;
    });

    if (data.daftarKabelDetail && data.daftarKabelDetail.length > 0) {
      csv += '\nRINCIAN DETAIL RUTE DAN PANJANG TIAP KABEL\n';
      csv += 'Kode Kabel,Tipe Kabel,Dari Asal,Ke Tujuan,Jalur Rute,Horisontal Denah (m),Naik Asal (m),Turun Tujuan (m),Cadangan Slack (m),Total Panjang (m),Status\n';
      data.daftarKabelDetail.forEach((c) => {
        csv += `"${c.kode_kabel}","${c.nama_tipe}","${c.perangkat_asal || '-'}","${c.perangkat_tujuan || '-'}","${c.jalur_tipe || 'plafon'}",${c.panjang_denah_meter},${c.tinggi_drop_asal_meter || 0},${c.tinggi_drop_tujuan_meter || 0},${c.panjang_cadangan_meter || 0},${c.total_panjang_meter},"${c.status || 'terpasang'}"\n`;
      });
    }

    csv += '\nREKAPITULASI PERANGKAT IT & KEAMANAN\n';
    csv += 'Kategori,Total Unit,Daftar Nama\n';
    data.rekapPerangkat.forEach((p) => {
      csv += `"${p.kategori}",${p.total_unit},"${p.daftar_nama}"\n`;
    });

    csv += '\nREKAPITULASI MEJA & WORKSTATION CLIENT\n';
    csv += 'Tipe Meja,Total Unit,Daftar Label\n';
    data.rekapFurniture.forEach((f) => {
      csv += `"${f.tipe}",${f.total_unit},"${f.daftar_label}"\n`;
    });

    csv += '\nDAFTAR IP ADDRESS & ENDPOINT CLIENT\n';
    csv += 'Nama Perangkat,Kategori,Model,IP Address,MAC Address,Label Meja,Pemilik Client\n';
    data.daftarEndpoint.forEach((e) => {
      csv += `"${e.nama_perangkat}","${e.kategori}","${e.model_merk || ''}","${e.ip_address || ''}","${e.mac_address || ''}","${e.label_meja || ''}","${e.pemilik_client || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BOM_Infrastruktur_IT_${floorId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <dialog
      ref={dialogRef}
      id="bom-dialog"
      aria-labelledby="bom-title"
      onClose={onClose}
      className="m-auto bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl p-0 max-w-4xl w-[92vw] max-h-[88vh] backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm overflow-hidden"
    >
      {/* Header Modal */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 id="bom-title" className="text-base font-bold text-slate-100">
              Bill of Materials (BOM) & Rincian Infrastruktur IT
            </h2>
            <p className="text-xs text-slate-400">
              Kalkulasi otomatis total kebutuhan kabel, perangkat jaringan, CCTV, dan workstation client • <strong className="text-amber-400 font-mono">Tinggi Atap: {tinggiPlafon}m</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
            title="Download CSV untuk Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
            title="Cetak Laporan BOM"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Cetak</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Konten Data BOM */}
      <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 text-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Memuat data BOM dari MariaDB...</div>
        ) : !data ? (
          <div className="py-12 text-center text-slate-400">Tidak ada data untuk lantai ini.</div>
        ) : (
          <>
            {/* 1. TABEL KEBUTUHAN KABEL */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
                  <Cable className="w-4 h-4 text-sky-400" />
                  <span>1. Rekapitulasi Kebutuhan Kabel (Termasuk Naik/Turun & Cadangan)</span>
                </div>
                {data.daftarKabelDetail && data.daftarKabelDetail.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCableDetails(!showCableDetails)}
                    className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium bg-sky-500/10 hover:bg-sky-500/20 px-2 py-1 rounded transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{showCableDetails ? 'Sembunyikan Rincian Rute' : 'Tampilkan Rincian Tiap Kabel'} ({data.daftarKabelDetail.length})</span>
                    {showCableDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Tabel Ringkasan per Tipe */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Tipe Spesifikasi</th>
                      <th className="py-2.5 px-3 text-center">Tarikan</th>
                      <th className="py-2.5 px-3 text-right">Horisontal Denah</th>
                      <th className="py-2.5 px-3 text-right">Naik Asal (Atap/Lantai)</th>
                      <th className="py-2.5 px-3 text-right">Turun Tujuan (Meja/AP)</th>
                      <th className="py-2.5 px-3 text-right">Cadangan Slack</th>
                      <th className="py-2.5 px-3 text-right text-emerald-400">Total Tambahan</th>
                      <th className="py-2.5 px-3 text-right font-bold text-sky-400">Total Kebutuhan</th>
                      <th className="py-2.5 px-3 text-center text-amber-400">Estimasi Rol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.rekapKabel.map((k) => (
                      <tr key={k.tipe_id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-medium flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: k.warna_hex }} />
                          <span className="text-slate-200">{k.nama_tipe}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-300">{k.jumlah_tarikan} jalur</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{k.total_panjang_denah} m</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">+{k.total_drop_asal || 0} m</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">+{k.total_drop_tujuan || 0} m</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">+{k.total_cadangan || 0} m</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">+{k.total_drop} m</td>
                        <td className="py-2.5 px-3 text-right font-bold text-sky-400">{k.total_meter} Meter</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-amber-400">
                          {k.total_meter > 0 ? `${k.estimasi_rol_305m} Rol` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Rincian Detail Tiap Tarikan Kabel */}
              {showCableDetails && data.daftarKabelDetail && data.daftarKabelDetail.length > 0 && (
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Rincian Perhitungan Tiap Rute Kabel (Panjang Denah + Naik Atap / Turun Meja + Slack):
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-[9px] border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-2.5">Kode Kabel</th>
                          <th className="py-2 px-2.5">Spesifikasi</th>
                          <th className="py-2 px-2.5">Dari Asal</th>
                          <th className="py-2 px-2.5">Ke Tujuan</th>
                          <th className="py-2 px-2.5">Jalur Rute</th>
                          <th className="py-2 px-2 text-right">Denah 2D</th>
                          <th className="py-2 px-2 text-right">Naik Asal</th>
                          <th className="py-2 px-2 text-right">Turun Tujuan</th>
                          <th className="py-2 px-2 text-right">Slack</th>
                          <th className="py-2 px-2.5 text-right font-bold text-sky-400">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {data.daftarKabelDetail.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-800/20">
                            <td className="py-1.5 px-2.5 font-mono text-slate-200">{c.kode_kabel}</td>
                            <td className="py-1.5 px-2.5 text-slate-300">{c.nama_tipe}</td>
                            <td className="py-1.5 px-2.5 text-slate-300">{c.perangkat_asal || '-'}</td>
                            <td className="py-1.5 px-2.5 text-slate-300">{c.perangkat_tujuan || '-'}</td>
                            <td className="py-1.5 px-2.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                                {c.jalur_tipe === 'plafon'
                                  ? 'Plafon'
                                  : c.jalur_tipe === 'bawah_lantai'
                                  ? 'Underfloor'
                                  : c.jalur_tipe === 'tray'
                                  ? 'Cable Tray'
                                  : 'Conduit'}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right text-slate-400">{c.panjang_denah_meter}m</td>
                            <td className="py-1.5 px-2 text-right text-slate-400">+{c.tinggi_drop_asal_meter}m</td>
                            <td className="py-1.5 px-2 text-right text-slate-400">+{c.tinggi_drop_tujuan_meter}m</td>
                            <td className="py-1.5 px-2 text-right text-slate-400">+{c.panjang_cadangan_meter}m</td>
                            <td className="py-1.5 px-2.5 text-right font-bold text-sky-400">{c.total_panjang_meter}m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* 2. REKAPITULASI PERANGKAT & WORKSTATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Perangkat IT & CCTV */}
              <section className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
                  <Server className="w-4 h-4 text-blue-400" />
                  <span>2. Rekap Perangkat IT & Keamanan</span>
                </div>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3 text-center">Unit</th>
                        <th className="py-2 px-3">Daftar Host</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.rekapPerangkat.map((p) => (
                        <tr key={p.kategori} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-medium uppercase text-slate-300">
                            {p.kategori.replace('_', ' ')}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-sky-400">{p.total_unit}</td>
                          <td className="py-2 px-3 text-slate-400 truncate max-w-[180px]">{p.daftar_nama}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Meja Client & Kursi */}
              <section className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
                  <Square className="w-4 h-4 text-purple-400" />
                  <span>3. Rekap Meja & Workstation</span>
                </div>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Tipe Meja</th>
                        <th className="py-2 px-3 text-center">Unit</th>
                        <th className="py-2 px-3">Label / Penempatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.rekapFurniture.map((f) => (
                        <tr key={f.tipe} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-medium uppercase text-slate-300">
                            {f.tipe.replace('_', ' ')}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-purple-400">{f.total_unit}</td>
                          <td className="py-2 px-3 text-slate-400 truncate max-w-[180px]">{f.daftar_label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* 3. TABEL IP ADDRESS & CLIENT MAPPING */}
            <section className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
                <Hash className="w-4 h-4 text-amber-400" />
                <span>4. Rencana IP Address & Mapping Client</span>
              </div>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Nama Perangkat</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 font-mono">IP Address</th>
                      <th className="py-2.5 px-3 font-mono">MAC Address</th>
                      <th className="py-2.5 px-3">Meja Terkait</th>
                      <th className="py-2.5 px-3">Pemilik Client</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.daftarEndpoint.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-200">{e.nama_perangkat}</td>
                        <td className="py-2 px-3 text-slate-400 uppercase text-[10px]">
                          {e.kategori.replace('_', ' ')}
                        </td>
                        <td className="py-2 px-3 font-mono text-sky-400">{e.ip_address || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                          {e.mac_address || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-300">{e.label_meja || '-'}</td>
                        <td className="py-2 px-3 text-emerald-400">{e.pemilik_client || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </dialog>
  );
};
