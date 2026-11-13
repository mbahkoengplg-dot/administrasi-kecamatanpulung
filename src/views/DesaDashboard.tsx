import React, { useEffect, useState } from 'react';
import { Desa, Layanan, Pengajuan, UserAccount, Warga } from '../types';
import { WizardPengajuan } from '../components/WizardPengajuan';
import { TandaTerima } from '../components/TandaTerima';
import { SuratTemplate } from '../components/SuratTemplate';
import { LaporanPdfTemplate } from '../components/LaporanPdfTemplate';
import { CameraCaptureModal } from '../components/CameraCaptureModal';
import { maskNik } from '../utils/nikValidator';
import {
  getStoredPengajuan,
  getStoredWarga,
  saveStoredPengajuan,
  saveStoredWarga,
  addLogAktivitas,
} from '../utils/storage';
import {
  cloudSavePengajuan,
  cloudSaveWarga,
  syncAllFromCloud,
  uploadBerkasCloud,
} from '../utils/gasApi';
import {
  ShieldCheck,
  LayoutDashboard,
  UserPlus,
  FileText,
  Users,
  LogOut,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Printer,
  Download,
  Upload,
  Eye,
  Edit2,
  Check,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
} from 'lucide-react';

interface DesaDashboardProps {
  user: UserAccount;
  daftarDesa: Desa[];
  daftarLayanan: Layanan[];
  onLogout: () => void;
}

export const DesaDashboard: React.FC<DesaDashboardProps> = ({
  user,
  daftarDesa,
  daftarLayanan,
  onLogout,
}) => {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'ajukan' | 'pengajuan' | 'warga'>(
    'dashboard'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals
  const [selectedTandaTerima, setSelectedTandaTerima] = useState<Pengajuan | null>(null);
  const [selectedSuratPreview, setSelectedSuratPreview] = useState<Pengajuan | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Pengajuan | null>(null);
  const [isPdfOpen, setIsPdfOpen] = useState<boolean>(false);

  // Perbaiki Berkas Modal
  const [perbaikiTarget, setPerbaikiTarget] = useState<Pengajuan | null>(null);
  const [isCameraFixOpen, setIsCameraFixOpen] = useState(false);

  // Edit Warga Modal
  const [editingWarga, setEditingWarga] = useState<Warga | null>(null);

  // Village info
  const desaId = user.desaId || 'desa-01';
  const desaNama = user.desaNama || 'Pulung';

  const [allPengajuanState, setAllPengajuanState] = useState<Pengajuan[]>(getStoredPengajuan());
  const [allWargaState, setAllWargaState] = useState<Warga[]>(getStoredWarga());
  const [isSyncing, setIsSyncing] = useState(false);

  const reloadLocal = () => {
    setAllPengajuanState(getStoredPengajuan());
    setAllWargaState(getStoredWarga());
  };

  useEffect(() => {
    window.addEventListener('pulung-data-synced', reloadLocal);
    return () => window.removeEventListener('pulung-data-synced', reloadLocal);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncAllFromCloud();
      reloadLocal();
    } finally {
      setIsSyncing(false);
    }
  };

  // Read submissions for this specific village
  const desaPengajuan = allPengajuanState.filter((p) => p.desaId === desaId);

  // Read warga in this village
  const desaWarga = allWargaState.filter((w) => w.desaId === desaId);

  // Statistics (Matching Mockup Screen 4: Diajukan, Perlu Perbaikan, Selesai)
  const countDiajukan = desaPengajuan.filter(
    (p) => p.status === 'Diajukan' || p.status === 'Diverifikasi' || p.status === 'Diproses'
  ).length;
  const countPerluPerbaikan = desaPengajuan.filter(
    (p) => p.status === 'Perlu Perbaikan'
  ).length;
  const countSelesai = desaPengajuan.filter((p) => p.status === 'Selesai').length;

  // Filtered submissions list
  const filteredList = desaPengajuan.filter((item) => {
    const matchSearch =
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaWarga.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nik.includes(searchQuery);

    const matchStatus =
      statusFilter === 'Semua' || item.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const renderStatusBadge = (status: Pengajuan['status']) => {
    switch (status) {
      case 'Diajukan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-sky-600" />
            <span>Diajukan</span>
          </span>
        );
      case 'Diverifikasi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-indigo-600" />
            <span>Diverifikasi</span>
          </span>
        );
      case 'Diproses':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>Diproses</span>
          </span>
        );
      case 'Perlu Perbaikan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Perlu Perbaikan</span>
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>Selesai</span>
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-slate-600" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Handle saving fixed documents
  const handleSaveFixedDocument = async (fileData: { fileName: string; fileSize: string; fileUrl: string }) => {
    if (!perbaikiTarget) return;

    const uploaded = await uploadBerkasCloud(fileData.fileName, fileData.fileUrl, perbaikiTarget.kode);

    const list = getStoredPengajuan();
    let updatedItem: Pengajuan | null = null;
    const updated = list.map((p) => {
      if (p.kode === perbaikiTarget.kode) {
        const newBerkas = [
          ...p.berkas,
          {
            id: `berkas-fix-${Date.now()}`,
            persyaratanId: 'p-fix',
            namaDokumen: `Perbaikan Berkas (${fileData.fileName})`,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            fileUrl: uploaded.fileUrl,
            diunggahPada: new Date().toISOString(),
          },
        ];
        updatedItem = {
          ...p,
          status: 'Diajukan' as const,
          catatan: 'Petugas desa telah mengunggah perbaikan berkas warga. Menunggu verifikasi ulang kecamatan.',
          berkas: newBerkas,
          riwayat: [
            ...p.riwayat,
            {
              status: 'Diajukan' as const,
              catatan: `Operator Desa ${desaNama} mengunggah ulang dokumen perbaikan.`,
              oleh: `Petugas Desa ${desaNama}`,
              waktu: new Date().toISOString(),
            },
          ],
          diubahPada: new Date().toISOString(),
        };
        return updatedItem;
      }
      return p;
    });

    saveStoredPengajuan(updated);
    if (updatedItem) {
      await cloudSavePengajuan(updatedItem, false);
    }
    reloadLocal();
    addLogAktivitas(
      user.nama,
      'desa',
      'Perbaiki Berkas Warga',
      `Operator Desa ${desaNama} memperbaiki berkas ${perbaikiTarget.kode}`
    );

    setPerbaikiTarget(null);
    setIsCameraFixOpen(false);
  };

  // Handle saving updated citizen data (koreksi typo nama/alamat/hp)
  const handleUpdateWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarga) return;

    const list = getStoredWarga();
    const updated = list.map((w) => (w.nik === editingWarga.nik ? editingWarga : w));
    saveStoredWarga(updated);
    await cloudSaveWarga(editingWarga);
    reloadLocal();

    addLogAktivitas(
      user.nama,
      'desa',
      'Koreksi Data Warga',
      `Operator Desa ${desaNama} memperbarui data warga NIK ${editingWarga.nik}`
    );

    setEditingWarga(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* MOBILE TOP BAR (< md) */}
      <header className="md:hidden bg-emerald-900 text-white px-4 py-3 sticky top-0 z-40 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
              Petugas Balai Desa
            </span>
            <span className="text-xs font-bold text-white leading-tight block">
              Desa {desaNama}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {countPerluPerbaikan > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold">
              {countPerluPerbaikan} Perbaikan
            </span>
          )}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center disabled:opacity-60"
            aria-label="Sinkronkan Data"
            title="Sinkronkan data dari server"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center"
            aria-label="Menu Navigasi"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY (< md) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs h-full bg-emerald-900 text-white shadow-2xl flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xs text-white">Petugas Balai Desa</h2>
                    <span className="text-[10px] text-emerald-300">Desa {desaNama}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="p-3 space-y-1">
                <button
                  onClick={() => {
                    setActiveMenu('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'dashboard'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('ajukan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'ajukan'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ajukan untuk Warga</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('pengajuan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'pengajuan'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Pengajuan Desa</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('warga');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'warga'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Warga Desa Saya</span>
                </button>
              </nav>
            </div>

            {/* User Info & Logout on Mobile Drawer */}
            <div className="p-4 border-t border-emerald-800/80 bg-emerald-950/40">
              <div className="flex items-center justify-between">
                <div className="truncate pr-2">
                  <span className="text-[10px] text-emerald-300 block">Operator Aktif:</span>
                  <p className="text-xs font-semibold text-white truncate">{user.nama}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/60 transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR (Matching Mockup Screen 4) */}
      <aside className="hidden md:flex w-64 bg-emerald-900 text-white flex-col justify-between shrink-0 shadow-xl min-h-screen sticky top-0 h-screen">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-emerald-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">Petugas Desa</h2>
              <span className="text-xs text-emerald-300 font-semibold">
                Desa {desaNama}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveMenu('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'dashboard'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveMenu('ajukan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'ajukan'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Ajukan untuk Warga</span>
            </button>

            <button
              onClick={() => setActiveMenu('pengajuan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'pengajuan'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Pengajuan Desa</span>
            </button>

            <button
              onClick={() => setActiveMenu('warga')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'warga'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Warga Desa Saya</span>
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-emerald-800/80 bg-emerald-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-[10px] text-emerald-300 block">Operator Aktif:</span>
              <p className="text-xs font-semibold text-white truncate">{user.nama}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* VIEW 1: WIZARD AJUKAN UNTUK WARGA */}
        {activeMenu === 'ajukan' ? (
          <WizardPengajuan
            currentRole="desa"
            desaPetugas={{ id: desaId, nama: desaNama }}
            daftarDesa={daftarDesa}
            daftarLayanan={daftarLayanan}
            onComplete={() => {
              reloadLocal();
              setActiveMenu('dashboard');
            }}
            onCancel={() => setActiveMenu('dashboard')}
          />
        ) : activeMenu === 'warga' ? (
          /* VIEW 2: WARGA DESA SAYA */
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Data Warga Desa {desaNama}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar warga yang pernah didampingi atau mengajukan layanan surat di kantor desa.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Mobile Card List (< md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {desaWarga.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada data warga terdaftar untuk desa ini.
                  </div>
                ) : (
                  desaWarga.map((w) => (
                    <div key={w.nik} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-800">{w.nik}</span>
                        {w.terverifikasi ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            Belum Verifikasi
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm uppercase">{w.nama}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Lahir: {new Date(w.tglLahir).toLocaleDateString('id-ID')} · HP: {w.noHp || '-'}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{w.alamat}</p>
                      </div>
                      <div className="pt-1">
                        <button
                          onClick={() => setEditingWarga(w)}
                          className="w-full py-2 text-xs font-semibold text-emerald-850 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Koreksi Data Warga</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">NIK</th>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Tanggal Lahir</th>
                      <th className="py-3 px-4">No. HP</th>
                      <th className="py-3 px-4">Alamat / Dusun</th>
                      <th className="py-3 px-4 text-center">Status Akun</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {desaWarga.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Belum ada data warga terdaftar untuk desa ini.
                        </td>
                      </tr>
                    ) : (
                      desaWarga.map((w) => (
                        <tr key={w.nik} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-medium text-slate-800">
                            {w.nik}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 uppercase">
                            {w.nama}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {new Date(w.tglLahir).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{w.noHp || '-'}</td>
                          <td className="py-3 px-4 text-slate-600">{w.alamat}</td>
                          <td className="py-3 px-4 text-center">
                            {w.terverifikasi ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Terverifikasi
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                Belum Verifikasi
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setEditingWarga(w)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Koreksi Data</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 3: DASHBOARD & PENGAJUAN DESA (Matching Mockup Screen 4) */
          <div className="space-y-6">
            {/* Top Banner with Pemkab Ponorogo Photo */}
            <div className="relative overflow-hidden rounded-2xl bg-emerald-950 text-white p-5 sm:p-6 shadow-md">
              <img
                src="/assets/aistudio/AF835CB3-D8C5-439A-8BAC-D5C0B766A651.jpeg.780x439_q85_50378377.jpg"
                alt="Gedung Pemerintah Kabupaten Ponorogo"
                className="absolute inset-0 w-full h-full object-cover object-[75%_35%] sm:object-center opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/85 to-emerald-950/30" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-300 tracking-wider uppercase block">
                    Kantor Desa {desaNama} · Kabupaten Ponorogo
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                    Dashboard Pelayanan Desa
                  </h1>
                  <p className="text-xs text-emerald-100/85 mt-1 max-w-lg">
                    Pendampingan pengajuan layanan administrasi warga menuju Kantor Kecamatan Pulung.
                  </p>
                </div>

                {/* Quick CTAs: Ekspor PDF & + Ajukan untuk Warga */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsPdfOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-emerald-950 font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-emerald-800" />
                    <span>Ekspor PDF</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('ajukan')}
                    className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Ajukan untuk Warga</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stat Cards (Matching Mockup Screen 4: Diajukan 12, Perlu Perbaikan 3, Selesai 48) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 block leading-tight">
                  Diajukan / Proses
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                  {countDiajukan}
                </div>
                <span className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                  Menunggu pengerjaan
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-rose-200 p-3 sm:p-4 shadow-2xs bg-rose-50/20">
                <span className="text-[10px] sm:text-xs font-semibold text-rose-800 block leading-tight">
                  Perlu Perbaikan
                </span>
                <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-1 font-mono tabular-nums">
                  {countPerluPerbaikan}
                </div>
                <span className="text-[9px] sm:text-[11px] text-rose-600/80 mt-0.5 hidden sm:block">
                  Perlu upload foto ulang
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-200 p-3 sm:p-4 shadow-2xs bg-emerald-50/20">
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-800 block leading-tight">
                  Selesai
                </span>
                <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 font-mono tabular-nums">
                  {countSelesai}
                </div>
                <span className="text-[9px] sm:text-[11px] text-emerald-700/80 mt-0.5 hidden sm:block">
                  Siap dicetak
                </span>
              </div>
            </div>

            {/* Main Table Card (Matches Mockup Screen 4 Table: Code, Warga, Layanan, Jalur, Status) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {/* Table Controls */}
              <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-900">
                    Pengajuan Warga Desa {desaNama}
                  </h2>
                  <span className="text-xs font-mono text-slate-400">
                    ({filteredList.length} berkas)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari kode, nama, NIK..."
                      className="w-full sm:w-auto pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Filter Status */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Diajukan">Diajukan</option>
                    <option value="Diverifikasi">Diverifikasi</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              {/* Mobile Card List (< md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Tidak ditemukan pengajuan dengan kriteria pencarian ini.
                  </div>
                ) : (
                  filteredList.map((item) => (
                    <div key={item.kode} className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {item.kode}
                        </span>
                        <div>{renderStatusBadge(item.status)}</div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm uppercase">
                          {item.namaWarga}
                        </h4>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">
                          {item.layananNama}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          NIK: {maskNik(item.nik)} · Jalur: {item.jalur === 'desa' ? 'Desa' : 'Mandiri'}
                        </div>
                      </div>

                      {item.status === 'Perlu Perbaikan' && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-900">
                          <p className="font-medium">{item.catatan || 'Foto dokumen kurang jelas.'}</p>
                          <button
                            onClick={() => {
                              setPerbaikiTarget(item);
                              setIsCameraFixOpen(true);
                            }}
                            className="w-full py-1.5 bg-white border border-rose-300 text-rose-900 font-bold text-xs rounded-lg hover:bg-rose-100 flex items-center justify-center gap-1"
                          >
                            <Upload className="w-3.5 h-3.5 text-rose-700" />
                            <span>Unggah Foto Ulang</span>
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => setSelectedDetail(item)}
                          className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => setSelectedTandaTerima(item)}
                          className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1"
                        >
                          <Printer className="w-3 h-3 text-slate-600" />
                          <span>Tanda Terima</span>
                        </button>
                        {item.status === 'Selesai' && (
                          <button
                            onClick={() => setSelectedSuratPreview(item)}
                            className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
                          >
                            Surat Resmi
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Kode</th>
                      <th className="py-3 px-4">Warga</th>
                      <th className="py-3 px-4">Layanan</th>
                      <th className="py-3 px-4">Jalur</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Tidak ditemukan pengajuan dengan kriteria pencarian ini.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => (
                        <tr key={item.kode} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {item.kode}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block uppercase">
                              {item.namaWarga}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {maskNik(item.nik)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {item.layananNama}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                item.jalur === 'desa'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.jalur === 'desa' ? 'Desa' : 'Mandiri'}
                            </span>
                          </td>
                          <td className="py-3 px-4">{renderStatusBadge(item.status)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.status === 'Perlu Perbaikan' && (
                                <button
                                  onClick={() => {
                                    setPerbaikiTarget(item);
                                    setIsCameraFixOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Perbaiki</span>
                                </button>
                              )}

                              {item.status === 'Selesai' && (
                                <button
                                  onClick={() => setSelectedSuratPreview(item)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Cetak Surat</span>
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedTandaTerima(item)}
                                className="px-2 py-1 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                                title="Cetak Tanda Terima Warga"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setSelectedDetail(item)}
                                className="px-2 py-1 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                                title="Lihat Detail"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: TANDA TERIMA WARGA */}
      {selectedTandaTerima && (
        <TandaTerima
          pengajuan={selectedTandaTerima}
          onClose={() => setSelectedTandaTerima(null)}
        />
      )}

      {/* MODAL: PRATINJAU SURAT RESMI */}
      {selectedSuratPreview && (
        <SuratTemplate
          pengajuan={selectedSuratPreview}
          warga={allWargaState.find((w) => w.nik === selectedSuratPreview.nik)}
          onClose={() => setSelectedSuratPreview(null)}
        />
      )}

      {/* MODAL: DETAIL PENGAJUAN */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="font-mono text-xs text-slate-400 block">{selectedDetail.kode}</span>
                <h3 className="font-bold text-slate-900 text-sm">{selectedDetail.layananNama}</h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pemohon:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedDetail.namaWarga}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIK:</span>
                  <span className="font-mono text-slate-800">{selectedDetail.nik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jalur:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDetail.jalur === 'desa' ? 'Operator Desa' : 'Mandiri'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Keperluan:</span>
                  <span className="italic text-slate-800">{selectedDetail.keperluan || '-'}</span>
                </div>
              </div>

              {selectedDetail.catatan && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-0.5">Catatan Terakhir:</span>
                  <p className="text-amber-800">{selectedDetail.catatan}</p>
                </div>
              )}

              {/* Berkas List */}
              <div>
                <span className="font-bold text-slate-800 block mb-1.5">Berkas Dilampirkan:</span>
                <ul className="space-y-1">
                  {selectedDetail.berkas.map((b) => (
                    <li key={b.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                      <span className="text-slate-700 font-medium">{b.namaDokumen}</span>
                      <span className="font-mono text-slate-400">{b.fileSize}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timeline */}
              <div>
                <span className="font-bold text-slate-800 block mb-2">Riwayat Proses:</span>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                  {selectedDetail.riwayat.map((r, idx) => (
                    <div key={idx} className="text-[11px]">
                      <span className="font-bold text-slate-800">{r.status}</span> ·{' '}
                      <span className="text-slate-400">{new Date(r.waktu).toLocaleString('id-ID')}</span>
                      <p className="text-slate-600">{r.catatan}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA / UPLOAD MODAL UNTUK PERBAIKI BERKAS */}
      {isCameraFixOpen && perbaikiTarget && (
        <CameraCaptureModal
          persyaratanNama="Foto Berkas Perbaikan dari Warga"
          onCapture={handleSaveFixedDocument}
          onClose={() => {
            setIsCameraFixOpen(false);
            setPerbaikiTarget(null);
          }}
        />
      )}

      {/* MODAL: EDIT DATA WARGA (KOREKSI TYPO) */}
      {editingWarga && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Koreksi Data Warga Desa {desaNama}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbaiki kesalahan pengetikan nama, nomor telepon, atau alamat warga.
            </p>

            <form onSubmit={handleUpdateWarga} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">NIK (Terkunci)</label>
                <input
                  type="text"
                  disabled
                  value={editingWarga.nik}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editingWarga.nama}
                  onChange={(e) =>
                    setEditingWarga({ ...editingWarga, nama: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  value={editingWarga.noHp}
                  onChange={(e) =>
                    setEditingWarga({ ...editingWarga, noHp: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                <input
                  type="text"
                  required
                  value={editingWarga.alamat}
                  onChange={(e) =>
                    setEditingWarga({ ...editingWarga, alamat: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWarga(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EKSPOR LAPORAN PDF DESA */}
      {isPdfOpen && (
        <LaporanPdfTemplate
          pengajuanList={desaPengajuan}
          daftarLayanan={daftarLayanan}
          daftarDesa={daftarDesa}
          desaFilter={desaNama}
          onClose={() => setIsPdfOpen(false)}
        />
      )}
    </div>
  );
};
