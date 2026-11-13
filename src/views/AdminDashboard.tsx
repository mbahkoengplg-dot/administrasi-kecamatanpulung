import React, { useEffect, useState } from 'react';
import { Desa, KecamatanSettings, Layanan, Pengajuan, UserAccount, Warga } from '../types';
import { SuratTemplate } from '../components/SuratTemplate';
import { LaporanPdfTemplate } from '../components/LaporanPdfTemplate';
import { LembarPengajuanPdf } from '../components/LembarPengajuanPdf';
import { maskNik } from '../utils/nikValidator';
import {
  getStoredLayanan,
  getStoredPengajuan,
  getStoredUsers,
  getStoredWarga,
  getStoredLogs,
  saveStoredLayanan,
  saveStoredPengajuan,
  saveStoredUsers,
  saveStoredWarga,
  addLogAktivitas,
  resetAllData,
  getStoredSettings,
  saveStoredSettings,
  DEFAULT_KECAMATAN_SETTINGS,
} from '../utils/storage';
import {
  cloudSavePengajuan,
  cloudSaveUser,
  cloudSaveWarga,
  syncAllFromCloud,
} from '../utils/gasApi';
import {
  ShieldCheck,
  LayoutDashboard,
  CheckSquare,
  FileText,
  Settings,
  Users2,
  BarChart3,
  UserCheck,
  Code2,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Plus,
  Printer,
  Download,
  KeyRound,
  RotateCcw,
  Sparkles,
  Menu,
  X,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  SlidersHorizontal,
  Save,
  UserCog,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardProps {
  user: UserAccount;
  daftarDesa: Desa[];
  daftarLayanan: Layanan[];
  onLogout: () => void;
  onOpenGasGuide: () => void;
  onUpdateUser?: (updatedUser: UserAccount) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  daftarDesa,
  daftarLayanan,
  onLogout,
  onOpenGasGuide,
  onUpdateUser,
}) => {
  const [activeMenu, setActiveMenu] = useState<
    | 'dashboard'
    | 'antrean'
    | 'semua'
    | 'layanan'
    | 'petugas'
    | 'warga'
    | 'laporan'
    | 'pengaturan'
    | 'logs'
  >('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterJalur, setFilterJalur] = useState<'Semua' | 'desa' | 'mandiri'>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<KecamatanSettings>(getStoredSettings());
  const [settingsForm, setSettingsForm] = useState<KecamatanSettings>(getStoredSettings());
  const [showAdminPass, setShowAdminPass] = useState<boolean>(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);

  // Submissions state
  const [pengajuanList, setPengajuanList] = useState<Pengajuan[]>(getStoredPengajuan());
  const [usersList, setUsersList] = useState<UserAccount[]>(getStoredUsers());
  const [layananList, setLayananList] = useState<Layanan[]>(getStoredLayanan());
  const [wargaList, setWargaList] = useState<Warga[]>(getStoredWarga());

  // Modal: Periksa / Verifikasi
  const [inspectedPengajuan, setInspectedPengajuan] = useState<Pengajuan | null>(null);
  const [catatanPetugas, setCatatanPetugas] = useState<string>('');
  const [nomorSuratInput, setNomorSuratInput] = useState<string>('');
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [waPanelOpen, setWaPanelOpen] = useState<boolean>(false);
  const [waPhone, setWaPhone] = useState<string>('');
  const [waMessage, setWaMessage] = useState<string>('');
  const [waCopied, setWaCopied] = useState<boolean>(false);
  const [lastDecisionLabel, setLastDecisionLabel] = useState<string>('');

  // Modal: Pratinjau Surat Resmi
  const [previewSurat, setPreviewSurat] = useState<Pengajuan | null>(null);

  // Modal: Ekspor Laporan PDF
  const [isPdfReportOpen, setIsPdfReportOpen] = useState(false);
  const [pdfReportDesaFilter, setPdfReportDesaFilter] = useState('Semua');
  const [pdfReportCustomTitle, setPdfReportCustomTitle] = useState<string>('');

  // Modal: Pratinjau Lembar Pengajuan Ber-KOP Resmi (PDF)
  const [previewLembarPdf, setPreviewLembarPdf] = useState<Pengajuan | null>(null);

  // Modal: Tambah / Edit Petugas Desa
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newNamaPetugas, setNewNamaPetugas] = useState('');
  const [newDesaId, setNewDesaId] = useState('desa-01');

  // Modal: Preview Berkas Foto / PDF
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [userActionNotice, setUserActionNotice] = useState<string | null>(null);

  // Refresh data from storage
  const reloadData = () => {
    setPengajuanList(getStoredPengajuan());
    setUsersList(getStoredUsers());
    setLayananList(getStoredLayanan());
    setWargaList(getStoredWarga());
    setSettings(getStoredSettings());
  };

  useEffect(() => {
    window.addEventListener('pulung-data-synced', reloadData);
    return () => window.removeEventListener('pulung-data-synced', reloadData);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncAllFromCloud();
      reloadData();
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculations for Stat Cards (Matches Mockup Screen 5: 9, 14, 86, 70:30)
  const countMenungguVerifikasi = pengajuanList.filter((p) => p.status === 'Diajukan').length;
  const countSedangDiproses = pengajuanList.filter(
    (p) => p.status === 'Diverifikasi' || p.status === 'Diproses'
  ).length;
  const countSelesai = pengajuanList.filter((p) => p.status === 'Selesai').length;

  const countJalurDesa = pengajuanList.filter((p) => p.jalur === 'desa').length;
  const countJalurMandiri = pengajuanList.filter((p) => p.jalur === 'mandiri').length;
  const totalSubmissions = pengajuanList.length || 1;
  const desaPercent = Math.round((countJalurDesa / totalSubmissions) * 100);
  const mandiriPercent = 100 - desaPercent;
  const ratioStr = `${desaPercent} : ${mandiriPercent}`;

  // Antrean Verifikasi (Status Diajukan & Diverifikasi)
  const antreanVerifikasi = pengajuanList.filter(
    (p) => p.status === 'Diajukan' || p.status === 'Diverifikasi'
  );

  // Filtered master submissions
  const filteredPengajuan = pengajuanList.filter((item) => {
    const matchSearch =
      item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaWarga.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desaNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nik.includes(searchQuery);

    const matchJalur = filterJalur === 'Semua' || item.jalur === filterJalur;
    const matchStatus = filterStatus === 'Semua' || item.status === filterStatus;

    return matchSearch && matchJalur && matchStatus;
  });

  const formatWaPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('0')) return `62${digits.slice(1)}`;
    if (digits.startsWith('8')) return `62${digits}`;
    return digits;
  };

  const buildWaMessage = (
    p: Pengajuan,
    statusBaru: Pengajuan['status'],
    catatan: string,
    nomorSurat?: string
  ): string => {
    const header =
      `Yth. Bapak/Ibu *${p.namaWarga.toUpperCase()}*,\n\n` +
      `Kami dari *Pelayanan Administrasi Terpadu Kecamatan (PATEN) Kecamatan Pulung, Kab. Ponorogo* menginformasikan status pengajuan Anda:\n\n` +
      `• Kode Pengajuan: *${p.kode}*\n` +
      `• Jenis Layanan: *${p.layananNama}*\n` +
      `• Asal Desa: Desa ${p.desaNama}\n`;

    if (statusBaru === 'Ditolak') {
      return (
        header +
        `• Status: *DITOLAK*\n\n` +
        `*Alasan / Catatan Petugas:*\n${catatan || 'Pengajuan belum memenuhi ketentuan persyaratan.'}\n\n` +
        `Silakan menghubungi Kantor Kecamatan Pulung atau operator Desa ${p.desaNama} untuk penjelasan lebih lanjut.\nTerima kasih.`
      );
    }

    if (statusBaru === 'Perlu Perbaikan') {
      return (
        header +
        `• Status: *PERLU PERBAIKAN BERKAS*\n\n` +
        `*Catatan Perbaikan dari Petugas:*\n${catatan || 'Mohon periksa dan unggah ulang berkas yang kurang jelas.'}\n\n` +
        `Silakan masuk kembali ke aplikasi menggunakan NIK & Tanggal Lahir Anda (atau hubungi petugas Desa ${p.desaNama}) untuk mengunggah ulang berkas perbaikan.\nTerima kasih.`
      );
    }

    if (statusBaru === 'Selesai') {
      return (
        header +
        `• Status: *SELESAI & SURAT TERBIT*\n` +
        (nomorSurat ? `• Nomor Surat: *${nomorSurat}*\n\n` : '\n') +
        `Surat resmi Anda telah selesai diterbitkan dan dapat diunduh melalui aplikasi Layanan Kecamatan Pulung atau diambil di balai desa.\nTerima kasih.`
      );
    }

    return (
      header +
      `• Status: *BERKAS DITERIMA & DIPROSES*\n\n` +
      `*Catatan Petugas:*\n${catatan || 'Berkas telah diverifikasi lengkap dan sedang dalam proses penerbitan surat.'}\n\n` +
      `Mohon menunggu informasi penerbitan surat selanjutnya.\nTerima kasih.`
    );
  };

  const openInspectionModal = (item: Pengajuan) => {
    const wargaMatch = wargaList.find((w) => w.nik === item.nik);
    setInspectedPengajuan(item);
    setCatatanPetugas(item.catatan || '');
    setNomorSuratInput(item.nomorSurat || '');
    setInspectError(null);
    setWaPhone(wargaMatch?.noHp || '');
    setWaMessage(buildWaMessage(item, item.status, item.catatan || '', item.nomorSurat));
    setWaPanelOpen(false);
    setWaCopied(false);
    setLastDecisionLabel('');
  };

  const triggerWaComposer = (
    updatedItem: Pengajuan,
    statusBaru: Pengajuan['status'],
    catatan: string,
    decisionLabel: string,
    nomorSurat?: string
  ) => {
    const wargaMatch = wargaList.find((w) => w.nik === updatedItem.nik);
    setInspectedPengajuan(updatedItem);
    setWaPhone((prev) => prev || wargaMatch?.noHp || '');
    setWaMessage(buildWaMessage(updatedItem, statusBaru, catatan, nomorSurat));
    setWaPanelOpen(true);
    setWaCopied(false);
    setLastDecisionLabel(decisionLabel);
    setInspectError(null);
  };

  // Action: Setujui & Proses
  const handleApprove = (p: Pengajuan) => {
    const note = catatanPetugas.trim() || 'Berkas telah diverifikasi dan disetujui. Dalam proses penerbitan surat resmi.';
    let updatedItem: Pengajuan = p;

    const updated = pengajuanList.map((item) => {
      if (item.kode === p.kode) {
        updatedItem = {
          ...item,
          status: 'Diproses' as const,
          catatan: note,
          riwayat: [
            ...item.riwayat,
            {
              status: 'Diproses' as const,
              catatan: note,
              oleh: 'Admin Kecamatan Pulung',
              waktu: new Date().toISOString(),
            },
          ],
          diubahPada: new Date().toISOString(),
        };
        return updatedItem;
      }
      return item;
    });

    saveStoredPengajuan(updated);
    void cloudSavePengajuan(updatedItem, false);
    addLogAktivitas(user.nama, 'admin', 'Setujui Pengajuan', `Menyetujui permohonan ${p.kode}`);
    setPengajuanList(updated);
    triggerWaComposer(updatedItem, 'Diproses', note, 'Berkas Diterima & Sedang Diproses');
  };

  // Action: Minta Perbaikan Berkas
  const handleRequestRevision = (p: Pengajuan) => {
    if (!catatanPetugas.trim()) {
      setInspectError('Mohon tuliskan catatan perbaikan berkas agar pemohon/operator desa tahu apa yang harus diperbaiki.');
      return;
    }

    const note = catatanPetugas.trim();
    let updatedItem: Pengajuan = p;

    const updated = pengajuanList.map((item) => {
      if (item.kode === p.kode) {
        updatedItem = {
          ...item,
          status: 'Perlu Perbaikan' as const,
          catatan: note,
          riwayat: [
            ...item.riwayat,
            {
              status: 'Perlu Perbaikan' as const,
              catatan: note,
              oleh: 'Admin Kecamatan Pulung',
              waktu: new Date().toISOString(),
            },
          ],
          diubahPada: new Date().toISOString(),
        };
        return updatedItem;
      }
      return item;
    });

    saveStoredPengajuan(updated);
    void cloudSavePengajuan(updatedItem, false);
    addLogAktivitas(user.nama, 'admin', 'Minta Perbaikan Berkas', `Pengajuan ${p.kode}: ${note}`);
    setPengajuanList(updated);
    triggerWaComposer(updatedItem, 'Perlu Perbaikan', note, 'Status Diubah: Perlu Perbaikan Berkas');
  };

  // Action: Tolak Pengajuan
  const handleReject = (p: Pengajuan) => {
    if (!catatanPetugas.trim()) {
      setInspectError('Mohon cantumkan alasan penolakan secara resmi pada kolom catatan petugas.');
      return;
    }

    const note = catatanPetugas.trim();
    let updatedItem: Pengajuan = p;

    const updated = pengajuanList.map((item) => {
      if (item.kode === p.kode) {
        updatedItem = {
          ...item,
          status: 'Ditolak' as const,
          catatan: note,
          riwayat: [
            ...item.riwayat,
            {
              status: 'Ditolak' as const,
              catatan: note,
              oleh: 'Admin Kecamatan Pulung',
              waktu: new Date().toISOString(),
            },
          ],
          diubahPada: new Date().toISOString(),
        };
        return updatedItem;
      }
      return item;
    });

    saveStoredPengajuan(updated);
    void cloudSavePengajuan(updatedItem, false);
    addLogAktivitas(user.nama, 'admin', 'Tolak Pengajuan', `Menolak ${p.kode}: ${note}`);
    setPengajuanList(updated);
    triggerWaComposer(updatedItem, 'Ditolak', note, 'Pengajuan Ditolak');
  };

  // Action: Terbitkan Surat Resmi (Status Selesai)
  const handleIssueOfficialLetter = (p: Pengajuan) => {
    const year = new Date().getFullYear();
    const prefix = p.layananId === 'layanan-04' ? '401' : p.layananId === 'layanan-03' ? '510' : '470';
    const randNum = Math.floor(100 + Math.random() * 900);
    const autoNomor = nomorSuratInput.trim() || `${prefix}/${randNum}/405.29/${year}`;
    const note = `Surat resmi telah diterbitkan dengan Nomor Registrasi: ${autoNomor}. Siap diambil atau diunduh pemohon.`;
    let updatedItem: Pengajuan = p;

    const updated = pengajuanList.map((item) => {
      if (item.kode === p.kode) {
        updatedItem = {
          ...item,
          status: 'Selesai' as const,
          nomorSurat: autoNomor,
          tanggalTerbit: new Date().toISOString().split('T')[0],
          namaPejabat: settings.namaCamat,
          nipPejabat: settings.nipCamat,
          catatan: note,
          riwayat: [
            ...item.riwayat,
            {
              status: 'Selesai' as const,
              catatan: `Penerbitan surat keterangan resmi Nomor: ${autoNomor} ber-QR verifikasi.`,
              oleh: `${settings.jabatanCamat} (Admin)`,
              waktu: new Date().toISOString(),
            },
          ],
          diubahPada: new Date().toISOString(),
        };
        return updatedItem;
      }
      return item;
    });

    saveStoredPengajuan(updated);
    void cloudSavePengajuan(updatedItem, false);
    addLogAktivitas(
      user.nama,
      'admin',
      'Terbitkan Surat Resmi',
      `Menerbitkan surat ${autoNomor} untuk pengajuan ${p.kode}`
    );
    setPengajuanList(updated);
    setNomorSuratInput('');
    triggerWaComposer(updatedItem, 'Selesai', note, `Surat Resmi Terbit (${autoNomor})`, autoNomor);
  };

  // Action: Verifikasi KTP Warga
  const handleVerifyCitizenId = (targetNik: string) => {
    let targetWarga: Warga | null = null;
    const updated = wargaList.map((w) => {
      if (w.nik === targetNik) {
        targetWarga = { ...w, terverifikasi: true };
        return targetWarga;
      }
      return w;
    });
    saveStoredWarga(updated);
    if (targetWarga) {
      void cloudSaveWarga(targetWarga);
    }
    setWargaList(updated);
    addLogAktivitas(user.nama, 'admin', 'Verifikasi Identitas Warga', `Memvalidasi KTP NIK ${targetNik}`);
  };

  // Action: Buat Akun Petugas Desa Baru
  const handleCreatePetugasDesa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newNamaPetugas.trim()) return;

    const desaObj = daftarDesa.find((d) => d.id === newDesaId);
    const desaNama = desaObj ? desaObj.nama : 'Pulung';

    const newUser: UserAccount = {
      id: `usr-desa-${Date.now()}`,
      nama: newNamaPetugas.trim(),
      username: newUsername.trim().toLowerCase(),
      role: 'desa',
      desaId: newDesaId,
      desaNama,
      aktif: true,
      wajibGantiPassword: true,
    };

    const updated = [...usersList, newUser];
    saveStoredUsers(updated);
    void cloudSaveUser(newUser, { password: 'desa123' });
    setUsersList(updated);
    addLogAktivitas(user.nama, 'admin', 'Buat Akun Desa', `Menambahkan operator untuk Desa ${desaNama}`);
    setUserActionNotice(`Akun operator desa "${newUser.username}" berhasil dibuat (password awal: desa123).`);

    setIsAddUserOpen(false);
    setNewUsername('');
    setNewNamaPetugas('');
  };

  // Action: Export Laporan CSV
  const handleExportCsv = () => {
    const headers = ['Kode', 'Layanan', 'NIK', 'Nama Warga', 'Desa', 'Jalur', 'Status', 'Nomor Surat', 'Tanggal'];
    const rows = pengajuanList.map((p) => [
      p.kode,
      `"${p.layananNama}"`,
      `'${p.nik}`,
      `"${p.namaWarga}"`,
      p.desaNama,
      p.jalur,
      p.status,
      p.nomorSurat || '-',
      new Date(p.dibuatPada).toLocaleDateString('id-ID'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Layanan_Kecamatan_Pulung_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              Admin Kecamatan
            </span>
            <span className="text-xs font-bold text-white leading-tight block">
              Kecamatan Pulung
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {countMenungguVerifikasi > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold animate-pulse">
              {countMenungguVerifikasi} Antrean
            </span>
          )}
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
                    <h2 className="font-bold text-xs text-white">Menu Administrator</h2>
                    <span className="text-[10px] text-emerald-300">Kecamatan Pulung</span>
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
                    setActiveMenu('antrean');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'antrean'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-4 h-4" />
                    <span>Antrean Verifikasi</span>
                  </div>
                  {countMenungguVerifikasi > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold">
                      {countMenungguVerifikasi}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('semua');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'semua'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Semua Pengajuan</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('layanan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'layanan'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Layanan &amp; Persyaratan</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('petugas');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'petugas'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <Users2 className="w-4 h-4" />
                  <span>Akun Petugas Desa</span>
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
                  <UserCheck className="w-4 h-4" />
                  <span>Data &amp; Verifikasi Warga</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMenu('laporan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'laporan'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Laporan &amp; Ekspor</span>
                </button>

                <button
                  onClick={() => {
                    setSettingsForm(getStoredSettings());
                    setSettingsSavedMsg(null);
                    setActiveMenu('pengaturan');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    activeMenu === 'pengaturan'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Pengaturan Kecamatan</span>
                </button>

                {/* Special Menu: Panduan & Script GAS */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenGasGuide();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-200 hover:bg-emerald-800/80 transition-colors"
                >
                  <Code2 className="w-4 h-4 text-amber-300" />
                  <span>Script Google Apps Script</span>
                </button>
              </nav>
            </div>

            {/* User Info & Logout on Mobile Drawer */}
            <div className="p-4 border-t border-emerald-800/80 bg-emerald-950/40">
              <div className="flex items-center justify-between">
                <div className="truncate pr-2">
                  <span className="text-[10px] text-emerald-300 block">Administrator:</span>
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

      {/* DESKTOP SIDEBAR (Visible only on >= md) */}
      <aside className="hidden md:flex w-64 bg-emerald-900 text-white flex-col justify-between shrink-0 shadow-xl min-h-screen sticky top-0 h-screen">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-emerald-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">Admin Kecamatan</h2>
              <span className="text-xs text-emerald-300 font-semibold">
                {settings.namaKecamatan}
              </span>
            </div>
          </div>

          {/* Navigation Items (Matching Mockup Screen 5 Sidebar) */}
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
              onClick={() => setActiveMenu('antrean')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'antrean'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4" />
                <span>Antrean Verifikasi</span>
              </div>
              {countMenungguVerifikasi > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold">
                  {countMenungguVerifikasi}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveMenu('semua')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'semua'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Semua Pengajuan</span>
            </button>

            <button
              onClick={() => setActiveMenu('layanan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'layanan'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Layanan &amp; Persyaratan</span>
            </button>

            <button
              onClick={() => setActiveMenu('petugas')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'petugas'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span>Akun Petugas Desa</span>
            </button>

            <button
              onClick={() => setActiveMenu('warga')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'warga'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Data &amp; Verifikasi Warga</span>
            </button>

            <button
              onClick={() => setActiveMenu('laporan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'laporan'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Laporan &amp; Ekspor</span>
            </button>

            <button
              onClick={() => {
                setSettingsForm(getStoredSettings());
                setSettingsSavedMsg(null);
                setActiveMenu('pengaturan');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeMenu === 'pengaturan'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Pengaturan Kecamatan</span>
            </button>

            {/* Special Menu: Panduan & Script GAS */}
            <button
              onClick={onOpenGasGuide}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-200 hover:bg-emerald-800/80 transition-colors"
            >
              <Code2 className="w-4 h-4 text-amber-300" />
              <span>Script Google Apps Script</span>
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-emerald-800/80 bg-emerald-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-[10px] text-emerald-300 block">Administrator:</span>
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
        {/* VIEW 1: DASHBOARD UTAMA (Matching Mockup Screen 5) */}
        {activeMenu === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Banner with Pemkab Ponorogo Photo */}
            <div className="relative overflow-hidden rounded-2xl bg-emerald-950 text-white p-5 sm:p-6 shadow-md">
              <img
                src="/assets/aistudio/AF835CB3-D8C5-439A-8BAC-D5C0B766A651.jpeg.780x439_q85_50378377.jpg"
                alt="Gedung Pemerintah Kabupaten Ponorogo"
                className="absolute inset-0 w-full h-full object-cover object-[75%_35%] sm:object-center opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/85 to-emerald-950/30" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-300 tracking-wider uppercase block">
                    {settings.namaKabupaten}
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                    Dashboard Administrasi {settings.namaKecamatan}
                  </h1>
                  <p className="text-xs text-emerald-100/85 mt-1 max-w-lg">
                    Pusat verifikasi berkas warga, penerbitan surat ber-QR resmi, dan pelaporan layanan PATEN.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3.5 py-2 rounded-xl bg-emerald-900/85 hover:bg-emerald-800 border border-emerald-700/80 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs backdrop-blur-xs disabled:opacity-60"
                    title="Tarik data terbaru dari Google Spreadsheet"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setPdfReportDesaFilter('Semua');
                      setIsPdfReportOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-emerald-950 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Ekspor PDF</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="px-3.5 py-2 rounded-xl bg-emerald-900/85 hover:bg-emerald-800 border border-emerald-700/80 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs backdrop-blur-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor CSV</span>
                  </button>
                  <button
                    onClick={() => setActiveMenu('antrean')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Periksa Antrean ({countMenungguVerifikasi})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stat Cards (Matching Mockup Screen 5: Menunggu Verifikasi: 9, Sedang Diproses: 14, Selesai Bulan Ini: 86, Jalur Desa : Mandiri: 70:30) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 block">
                  Menunggu Verifikasi
                </span>
                <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1 font-mono tabular-nums">
                  {countMenungguVerifikasi}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Perlu diperiksa segera
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 block">
                  Sedang Diproses
                </span>
                <div className="text-xl sm:text-2xl font-bold text-indigo-600 mt-1 font-mono tabular-nums">
                  {countSedangDiproses}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Dalam pembuatan nomor surat
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 block">
                  Selesai Bulan Ini
                </span>
                <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1 font-mono tabular-nums">
                  {countSelesai}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Surat sah &amp; ber-QR
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 block">
                  Jalur Desa : Mandiri
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                  {ratioStr}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {countJalurDesa} via desa · {countJalurMandiri} mandiri
                </span>
              </div>
            </div>

            {/* Antrean Verifikasi Table (Matches Mockup Screen 5: Code | Layanan | Asal | Jalur | Aksi) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Antrean Verifikasi Berkas
                  </h2>
                  <p className="text-xs text-slate-500">
                    Permohonan masuk yang siap diperiksa kelengkapan syaratnya.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {antreanVerifikasi.length} Menunggu
                </span>
              </div>

              {/* Mobile Card List (< md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {antreanVerifikasi.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Tidak ada antrean verifikasi saat ini. Semua permohonan telah diproses.
                  </div>
                ) : (
                  antreanVerifikasi.map((item) => (
                    <div key={item.kode} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {item.kode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.jalur === 'desa'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.jalur === 'desa' ? 'Desa' : 'Mandiri'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.layananNama}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {item.namaWarga} · Desa {item.desaNama}
                        </p>
                      </div>
                      <button
                        onClick={() => openInspectionModal(item)}
                        className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99]"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Periksa Berkas &amp; Verifikasi</span>
                      </button>
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
                      <th className="py-3 px-4">Layanan</th>
                      <th className="py-3 px-4">Asal</th>
                      <th className="py-3 px-4">Jalur</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {antreanVerifikasi.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Tidak ada antrean verifikasi saat ini. Semua permohonan telah diproses.
                        </td>
                      </tr>
                    ) : (
                      antreanVerifikasi.map((item) => (
                        <tr key={item.kode} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {item.kode}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {item.layananNama}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Pemohon: {item.namaWarga}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            Desa {item.desaNama}
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
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openInspectionModal(item)}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:border-emerald-700 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs transition-colors shadow-2xs"
                            >
                              Periksa
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
        )}

        {/* VIEW 2: SEMUA PENGAJUAN (Full Filterable Table) */}
        {(activeMenu === 'semua' || activeMenu === 'antrean') && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {activeMenu === 'antrean' ? 'Antrean Verifikasi Berkas' : 'Seluruh Pengajuan Layanan'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh pengajuan administrasi dari warga mandiri maupun lewat perangkat desa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPdfReportDesaFilter('Semua');
                    setPdfReportCustomTitle('Laporan Register Seluruh Pengajuan Pelayanan Administrasi');
                    setIsPdfReportOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ekspor PDF (Ber-KOP)</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {/* Controls */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode, nama, desa..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterJalur}
                    onChange={(e) => setFilterJalur(e.target.value as any)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Semua">Semua Jalur</option>
                    <option value="desa">Jalur Desa</option>
                    <option value="mandiri">Jalur Mandiri</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Diajukan">Diajukan</option>
                    <option value="Diverifikasi">Diverifikasi</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Mobile Card List (< md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredPengajuan.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Tidak ada pengajuan yang sesuai filter.
                  </div>
                ) : (
                  filteredPengajuan.map((item) => (
                    <div key={item.kode} className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {item.kode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-900'
                              : item.status === 'Perlu Perbaikan'
                              ? 'bg-rose-100 text-rose-800'
                              : item.status === 'Diproses'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm uppercase">
                          {item.namaWarga}
                        </h4>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">
                          {item.layananNama}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          NIK: {maskNik(item.nik)} · Desa {item.desaNama} · {item.jalur === 'desa' ? 'Jalur Desa' : 'Mandiri'}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => openInspectionModal(item)}
                          className="flex-1 min-w-[70px] py-2 text-center text-xs font-bold rounded-xl border border-slate-300 hover:border-emerald-700 hover:bg-emerald-50 text-slate-800"
                        >
                          Periksa
                        </button>

                        <button
                          onClick={() => setPreviewLembarPdf(item)}
                          className="flex-1 min-w-[95px] py-2 text-center text-xs font-bold rounded-xl border border-slate-300 hover:border-emerald-700 bg-white hover:bg-emerald-50 text-slate-700 inline-flex items-center justify-center gap-1 shadow-2xs"
                          title="Cetak Dokumen Pengajuan Ber-KOP Resmi"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Lembar PDF</span>
                        </button>

                        {item.status === 'Selesai' && (
                          <button
                            onClick={() => setPreviewSurat(item)}
                            className="flex-1 min-w-[85px] py-2 text-center text-xs font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 shadow-2xs"
                          >
                            Lihat Surat
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
                      <th className="py-3 px-4">Warga &amp; NIK</th>
                      <th className="py-3 px-4">Layanan</th>
                      <th className="py-3 px-4">Asal Desa</th>
                      <th className="py-3 px-4">Jalur</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPengajuan.map((item) => (
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
                        <td className="py-3 px-4 text-slate-700">
                          Desa {item.desaNama}
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
                        <td className="py-3 px-4">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.status === 'Selesai'
                                ? 'bg-emerald-100 text-emerald-900'
                                : item.status === 'Perlu Perbaikan'
                                ? 'bg-rose-100 text-rose-800'
                                : item.status === 'Diproses'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openInspectionModal(item)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 hover:border-emerald-700 hover:bg-emerald-50 text-slate-800"
                            >
                              Periksa
                            </button>
                            <button
                              onClick={() => setPreviewLembarPdf(item)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 hover:border-emerald-700 bg-white hover:bg-emerald-50 text-slate-700 inline-flex items-center gap-1 shadow-2xs"
                              title="Cetak Dokumen Pengajuan Ber-KOP Resmi"
                            >
                              <Printer className="w-3 h-3 text-emerald-800" />
                              <span>Cetak PDF</span>
                            </button>
                            {item.status === 'Selesai' && (
                              <button
                                onClick={() => setPreviewSurat(item)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900"
                              >
                                Lihat Surat
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: LAYANAN & PERSYARATAN (Master Data) */}
        {activeMenu === 'layanan' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Master Layanan &amp; Persyaratan
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar 6 kategori layanan kecamatan yang aktif dan dapat dipilih masyarakat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {layananList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        {item.kategori}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{item.nama}</h3>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Prefix: {item.kodeSuratPrefix}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{item.deskripsi}</p>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-xs font-bold text-slate-700 block mb-1.5">
                      Checklist Dokumen Persyaratan:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {item.persyaratan.map((p, idx) => (
                        <li key={p.id} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                          <span>{p.nama}</span>
                          {p.wajib && <span className="text-[10px] text-rose-600 font-bold">(Wajib)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Estimasi Pengerjaan: <strong>{item.estimasiHari} Hari</strong></span>
                    <span className="text-emerald-700 font-bold">Status: Aktif</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: AKUN PETUGAS DESA */}
        {activeMenu === 'petugas' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Kelola Akun Petugas Desa se-Kecamatan Pulung
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akun operator balai desa dibuat oleh Admin Kecamatan. Terdapat 18 desa di Kecamatan Pulung.
                </p>
              </div>

              <button
                onClick={() => setIsAddUserOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Akun Desa</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Nama Petugas</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Peran &amp; Asal Desa</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{u.nama}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{u.username}</td>
                        <td className="py-3 px-4">
                          {u.role === 'admin' ? (
                            <span className="font-bold text-emerald-800">Admin Kecamatan Pulung</span>
                          ) : (
                            <span>Petugas Balai Desa <strong>{u.desaNama}</strong></span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {u.aktif ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Aktif
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                              Non-aktif
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              const resetTarget = { ...u, wajibGantiPassword: true };
                              void cloudSaveUser(resetTarget, {
                                resetPassword: true,
                                password: u.role === 'admin' ? settings.passwordAdmin : 'desa123',
                              });
                              addLogAktivitas(user.nama, 'admin', 'Reset Password', `Reset password ${u.username}`);
                              setUserActionNotice(
                                u.role === 'admin'
                                  ? `Password akun ${u.username} disinkronkan sesuai menu Pengaturan.`
                                  : `Password akun ${u.username} direset ke default: "desa123".`
                              );
                            }}
                            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Reset Password</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {userActionNotice && (
                <div className="p-3 bg-emerald-50 border-t border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center justify-between gap-2">
                  <span>{userActionNotice}</span>
                  <button
                    type="button"
                    onClick={() => setUserActionNotice(null)}
                    className="text-emerald-700 hover:text-emerald-950 font-bold"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: DATA WARGA & VERIFIKASI IDENTITAS */}
        {activeMenu === 'warga' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Data Warga &amp; Verifikasi Identitas
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Bandingkan identitas foto KTP/KK pemohon untuk menandai akun warga sebagai "Terverifikasi".
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">NIK</th>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Tgl Lahir</th>
                      <th className="py-3 px-4">Desa Asal</th>
                      <th className="py-3 px-4">No. HP</th>
                      <th className="py-3 px-4 text-center">Status Verifikasi</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wargaList.map((w) => (
                      <tr key={w.nik} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{w.nik}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 uppercase">{w.nama}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(w.tglLahir).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-slate-700">Desa {w.desaNama}</td>
                        <td className="py-3 px-4 text-slate-600">{w.noHp || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          {w.terverifikasi ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              ✓ Terverifikasi
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Belum Terverifikasi
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!w.terverifikasi && (
                            <button
                              onClick={() => handleVerifyCitizenId(w.nik)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white transition-colors"
                            >
                              Tandai Terverifikasi
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: LAPORAN & AUDIT */}
        {activeMenu === 'laporan' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Laporan Pelayanan Kecamatan Pulung
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekapitulasi berkas masuk per layanan, per desa, dan ekspor data laporan dalam format PDF atau CSV/Excel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={pdfReportDesaFilter}
                  onChange={(e) => setPdfReportDesaFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
                >
                  <option value="Semua">Seluruh Desa (18 Desa)</option>
                  {daftarDesa.map((d) => (
                    <option key={d.id} value={d.nama}>
                      Desa {d.nama}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsPdfReportOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Ekspor Laporan (PDF)</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor (CSV/Excel)</span>
                </button>
              </div>
            </div>

            {/* Summary statistics per service */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">
                Statistik Pengajuan Menurut Kategori Layanan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {layananList.map((lay) => {
                  const count = pengajuanList.filter((p) => p.layananId === lay.id).length;
                  return (
                    <div key={lay.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[11px] font-bold text-slate-500 block truncate">
                        {lay.nama}
                      </span>
                      <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                        {count}{' '}
                        <span className="text-xs font-normal text-slate-400">berkas</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity log */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Log Aktivitas Petugas Terkini</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {getStoredLogs().slice(0, 10).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-800">{log.pengguna}</span>{' '}
                      <span className="text-slate-400">({log.peran})</span>: {log.detail}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {new Date(log.waktu).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: PENGATURAN ADMIN & KECAMATAN */}
        {activeMenu === 'pengaturan' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Pengaturan Admin &amp; Identitas Kecamatan
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ubah nama admin kecamatan, akun login, pejabat penandatangan surat (Camat), dan kontak KOP surat resmi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSettingsForm(DEFAULT_KECAMATAN_SETTINGS);
                  setSettingsSavedMsg(null);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Isi Default Awal</span>
              </button>
            </div>

            {settingsSavedMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{settingsSavedMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleaned: KecamatanSettings = {
                  ...settingsForm,
                  namaAdmin: settingsForm.namaAdmin.trim() || DEFAULT_KECAMATAN_SETTINGS.namaAdmin,
                  usernameAdmin: settingsForm.usernameAdmin.trim() || DEFAULT_KECAMATAN_SETTINGS.usernameAdmin,
                  passwordAdmin: settingsForm.passwordAdmin.trim() || DEFAULT_KECAMATAN_SETTINGS.passwordAdmin,
                  namaCamat: settingsForm.namaCamat.trim() || DEFAULT_KECAMATAN_SETTINGS.namaCamat,
                  namaKecamatan: settingsForm.namaKecamatan.trim() || DEFAULT_KECAMATAN_SETTINGS.namaKecamatan,
                  namaKabupaten: settingsForm.namaKabupaten.trim() || DEFAULT_KECAMATAN_SETTINGS.namaKabupaten,
                };
                saveStoredSettings(cleaned);
                setSettings(cleaned);
                setSettingsForm(cleaned);

                // Sync admin UserAccount in storage & active session
                let updatedAdminAccount: UserAccount | null = null;
                const updatedUsers = usersList.map((u) => {
                  if (u.role === 'admin' && (u.id === user.id || u.id === 'usr-admin')) {
                    updatedAdminAccount = {
                      ...u,
                      nama: cleaned.namaAdmin,
                      username: cleaned.usernameAdmin,
                    };
                    return updatedAdminAccount;
                  }
                  return u;
                });
                saveStoredUsers(updatedUsers);
                setUsersList(updatedUsers);
                if (updatedAdminAccount && onUpdateUser) {
                  onUpdateUser(updatedAdminAccount);
                }

                addLogAktivitas(
                  cleaned.namaAdmin,
                  'admin',
                  'Perbarui Pengaturan',
                  'Memperbarui profil admin, pejabat penandatangan, dan identitas kantor kecamatan'
                );
                setSettingsSavedMsg('Pengaturan berhasil disimpan dan langsung diterapkan ke profil admin, KOP surat, serta halaman publik.');
              }}
              className="space-y-5 text-xs"
            >
              {/* Card 1: Profil & Akun Admin Kecamatan */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <UserCog className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">
                      1. Profil &amp; Akun Admin Kecamatan
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Tampil di dashboard admin, lembar disposisi PDF, dan dipakai untuk login petugas kecamatan.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Lengkap Admin / Verifikator
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.namaAdmin}
                      onChange={(e) => setSettingsForm({ ...settingsForm, namaAdmin: e.target.value })}
                      placeholder="Contoh: Bambang Prasetyo, S.STP, M.Si"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      NIP Admin / Verifikator
                    </label>
                    <input
                      type="text"
                      value={settingsForm.nipAdmin}
                      onChange={(e) => setSettingsForm({ ...settingsForm, nipAdmin: e.target.value })}
                      placeholder="Contoh: 19780825 200212 1 003"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Username Login Admin
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.usernameAdmin}
                      onChange={(e) => setSettingsForm({ ...settingsForm, usernameAdmin: e.target.value })}
                      placeholder="admin"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Password Login Admin
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPass ? 'text' : 'password'}
                        required
                        value={settingsForm.passwordAdmin}
                        onChange={(e) => setSettingsForm({ ...settingsForm, passwordAdmin: e.target.value })}
                        placeholder="Masukkan password admin"
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPass(!showAdminPass)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5"
                        title={showAdminPass ? 'Sembunyikan' : 'Lihat Password'}
                      >
                        {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Pejabat Penandatangan Surat (Camat) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">
                      2. Pejabat Penandatangan Surat Resmi &amp; Laporan PDF
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Nama &amp; NIP di bawah ini tercetak otomatis pada setiap surat keterangan resmi dan laporan bulanan.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama &amp; Gelar Camat / Pejabat
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.namaCamat}
                      onChange={(e) => setSettingsForm({ ...settingsForm, namaCamat: e.target.value })}
                      placeholder="Contoh: Drs. H. Sukadi, M.Si"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      NIP Pejabat
                    </label>
                    <input
                      type="text"
                      value={settingsForm.nipCamat}
                      onChange={(e) => setSettingsForm({ ...settingsForm, nipCamat: e.target.value })}
                      placeholder="Contoh: 19710514 199403 1 002"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jabatan Penandatangan
                    </label>
                    <input
                      type="text"
                      value={settingsForm.jabatanCamat}
                      onChange={(e) => setSettingsForm({ ...settingsForm, jabatanCamat: e.target.value })}
                      placeholder="Contoh: CAMAT PULUNG"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Pangkat / Golongan
                    </label>
                    <input
                      type="text"
                      value={settingsForm.pangkatCamat}
                      onChange={(e) => setSettingsForm({ ...settingsForm, pangkatCamat: e.target.value })}
                      placeholder="Contoh: Pembina Utama Muda"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Identitas Kantor, KOP Surat & Kontak Layanan */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900">
                      3. Identitas Kantor, KOP Surat &amp; Kontak Layanan
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Terhubung dengan KOP Surat resmi, Tanda Terima warga, dan halaman beranda publik.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Instansi / Kabupaten
                    </label>
                    <input
                      type="text"
                      value={settingsForm.namaKabupaten}
                      onChange={(e) => setSettingsForm({ ...settingsForm, namaKabupaten: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Kecamatan
                    </label>
                    <input
                      type="text"
                      value={settingsForm.namaKecamatan}
                      onChange={(e) => setSettingsForm({ ...settingsForm, namaKecamatan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Alamat Kantor Kecamatan
                    </label>
                    <input
                      type="text"
                      value={settingsForm.alamatKantor}
                      onChange={(e) => setSettingsForm({ ...settingsForm, alamatKantor: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Telepon Kantor
                    </label>
                    <input
                      type="text"
                      value={settingsForm.telepon}
                      onChange={(e) => setSettingsForm({ ...settingsForm, telepon: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor WhatsApp Bantuan Warga
                    </label>
                    <input
                      type="text"
                      value={settingsForm.whatsappBantuan}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsappBantuan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Surel / Email Resmi
                    </label>
                    <input
                      type="email"
                      value={settingsForm.emailResmi}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailResmi: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Website / Laman Resmi
                    </label>
                    <input
                      type="text"
                      value={settingsForm.websiteResmi}
                      onChange={(e) => setSettingsForm({ ...settingsForm, websiteResmi: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jam Pelayanan (Senin - Kamis)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.jamPelayananSeninKamis}
                      onChange={(e) => setSettingsForm({ ...settingsForm, jamPelayananSeninKamis: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jam Pelayanan (Jumat)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.jamPelayananJumat}
                      onChange={(e) => setSettingsForm({ ...settingsForm, jamPelayananJumat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm inline-flex items-center gap-2 active:scale-[0.99]"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODAL: PERIKSA & VERIFIKASI PENGAJUAN (Full Inspection Drawer/Modal + Kirim WA) */}
      {inspectedPengajuan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-mono text-emerald-800 font-bold block">
                  {inspectedPengajuan.kode} · {inspectedPengajuan.jalur === 'desa' ? `Jalur Desa ${inspectedPengajuan.desaNama}` : 'Jalur Mandiri'}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {inspectedPengajuan.layananNama}
                </h3>
              </div>
              <button
                onClick={() => setInspectedPengajuan(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {waPanelOpen ? (
              /* PANEL KONFIRMASI & KIRIM NOTIFIKASI WHATSAPP KE WARGA */
              <div className="space-y-4 text-xs">
                {lastDecisionLabel && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                      inspectedPengajuan.status === 'Ditolak'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : inspectedPengajuan.status === 'Perlu Perbaikan'
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    {inspectedPengajuan.status === 'Ditolak' ? (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : inspectedPengajuan.status === 'Perlu Perbaikan' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block">{lastDecisionLabel}</span>
                      <span className="text-[11px] opacity-85">
                        Status pengajuan telah tersimpan ke sistem. Anda dapat langsung mengirim kabar ke WhatsApp warga di bawah ini.
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          Kirim Notifikasi WhatsApp ke Pemohon
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {inspectedPengajuan.namaWarga} · Desa {inspectedPengajuan.desaNama}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor WhatsApp / HP Pemohon:
                    </label>
                    <input
                      type="tel"
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                    {!formatWaPhone(waPhone) && (
                      <p className="text-[11px] text-amber-700 mt-1">
                        Nomor HP pemohon belum tercatat atau kosong. Silakan ketik nomor WhatsApp tujuan di atas.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Isi Pesan WhatsApp (dapat diedit sebelum dikirim):
                    </label>
                    <textarea
                      rows={8}
                      value={waMessage}
                      onChange={(e) => setWaMessage(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setWaPanelOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                  >
                    ← Kembali ke Detail Berkas
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(waMessage);
                        setWaCopied(true);
                        setTimeout(() => setWaCopied(false), 2000);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5"
                    >
                      {waCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-emerald-800">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Pesan</span>
                        </>
                      )}
                    </button>

                    {formatWaPhone(waPhone) ? (
                      <a
                        href={`https://wa.me/${formatWaPhone(waPhone)}?text=${encodeURIComponent(waMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Kirim via WhatsApp</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    ) : (
                      <span className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs inline-flex items-center gap-1.5 cursor-not-allowed">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Isi No. WA Dulu</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setInspectedPengajuan(null);
                        setWaPanelOpen(false);
                        setCatatanPetugas('');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                    >
                      Selesai &amp; Tutup
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* FORM PEMERIKSAAN BERKAS NORMAL */
              <>
                <div className="space-y-4 text-xs">
                  {inspectError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{inspectError}</span>
                    </div>
                  )}

                  {/* Citizen Details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Nama Pemohon:</span>
                      <span className="font-bold text-slate-900 uppercase text-right">{inspectedPengajuan.namaWarga}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">NIK:</span>
                      <span className="font-mono text-slate-800">{inspectedPengajuan.nik}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">No. WhatsApp / HP:</span>
                      <span className="font-mono font-semibold text-emerald-800">
                        {waPhone || 'Belum diisi'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Desa Domisili:</span>
                      <span className="text-slate-800 text-right">Desa {inspectedPengajuan.desaNama}, Kec. Pulung</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Keperluan:</span>
                      <span className="italic text-slate-800 text-right">{inspectedPengajuan.keperluan || '-'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Status Saat Ini:</span>
                      <span className="font-bold text-emerald-800">{inspectedPengajuan.status}</span>
                    </div>
                  </div>

                  {/* Uploaded Documents Inspection */}
                  <div>
                    <span className="font-bold text-slate-800 text-xs block mb-2">
                      Berkas &amp; Foto yang Diunggah ({inspectedPengajuan.berkas.length} dokumen):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {inspectedPengajuan.berkas.map((b) => (
                        <div
                          key={b.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-700 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 block truncate">
                              {b.namaDokumen}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {b.fileName} ({b.fileSize})
                            </span>
                          </div>
                          <button
                            onClick={() => setPreviewImage(b.fileUrl || '')}
                            disabled={!b.fileUrl}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 rounded-lg shrink-0 border border-emerald-200"
                          >
                            {b.fileUrl ? 'Lihat Berkas' : 'Tidak Ada File'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Catatan Petugas Input */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Catatan Verifikasi Petugas (dibaca pemohon, desa &amp; otomatis masuk ke pesan WA):
                    </label>
                    <textarea
                      rows={2}
                      value={catatanPetugas}
                      onChange={(e) => {
                        setCatatanPetugas(e.target.value);
                        if (inspectError) setInspectError(null);
                      }}
                      placeholder="Contoh: Berkas telah lengkap / Foto KK buram mohon unggah ulang..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Option to input custom official letter number if ready to issue */}
                  {(inspectedPengajuan.status === 'Diproses' || inspectedPengajuan.status === 'Diverifikasi') && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                      <label className="block font-bold text-emerald-950">
                        Nomor Surat Resmi (Otomatis / Kustom):
                      </label>
                      <input
                        type="text"
                        value={nomorSuratInput}
                        onChange={(e) => setNomorSuratInput(e.target.value)}
                        placeholder="Contoh: 470/142/405.29/2026 (kosongkan untuk nomor otomatis)"
                        className="w-full px-3 py-2 rounded-xl border border-emerald-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                      />
                      <p className="text-[11px] text-emerald-800">
                        Mengisi nomor surat dan menekan "Terbitkan Surat" akan otomatis menghasilkan surat resmi ber-KOP Kecamatan Pulung dengan QR verifikasi keaslian.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleReject(inspectedPengajuan)}
                      className="px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => handleRequestRevision(inspectedPengajuan)}
                      className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors"
                    >
                      Minta Perbaikan
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerWaComposer(
                          inspectedPengajuan,
                          inspectedPengajuan.status,
                          catatanPetugas || inspectedPengajuan.catatan || '',
                          '',
                          inspectedPengajuan.nomorSurat
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Kirim kabar status pengajuan via WhatsApp ke pemohon"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Kirim WA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLembarPdf(inspectedPengajuan)}
                      className="px-3 py-2 rounded-xl border border-slate-300 hover:border-emerald-700 bg-white hover:bg-emerald-50 text-xs font-bold text-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Cetak Berkas Pengajuan dengan KOP Resmi"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Cetak PDF</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApprove(inspectedPengajuan)}
                      className="px-4 py-2 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition-colors"
                    >
                      Setujui &amp; Proses
                    </button>
                    <button
                      onClick={() => handleIssueOfficialLetter(inspectedPengajuan)}
                      className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      Terbitkan Surat Resmi (Selesai)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PRATINJAU DOKUMEN RESMI */}
      {previewSurat && (
        <SuratTemplate
          pengajuan={previewSurat}
          warga={wargaList.find((w) => w.nik === previewSurat.nik)}
          onClose={() => setPreviewSurat(null)}
        />
      )}

      {/* MODAL: PREVIEW BERKAS FOTO / PDF */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full max-h-[88vh] bg-white p-3 rounded-2xl overflow-hidden flex flex-col gap-2"
          >
            {previewImage.startsWith('data:application/pdf') ? (
              <iframe
                src={previewImage}
                title="Pratinjau Dokumen PDF"
                className="w-full h-[72vh] rounded-xl border border-slate-200"
              />
            ) : (
              <img
                src={previewImage}
                alt="Dokumen Berkas"
                className="max-h-[75vh] w-auto object-contain mx-auto rounded-xl"
              />
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 font-semibold hover:underline"
              >
                Buka di tab baru / Unduh
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH AKUN PETUGAS DESA */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Buat Akun Petugas Balai Desa
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Akun ini digunakan oleh operator desa untuk mendampingi warganya mengajukan surat.
            </p>

            <form onSubmit={handleCreatePetugasDesa} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Petugas / Operator</label>
                <input
                  type="text"
                  required
                  value={newNamaPetugas}
                  onChange={(e) => setNewNamaPetugas(e.target.value)}
                  placeholder="Contoh: Operator Desa Pulung"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: petugas_munggung"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Desa</label>
                <select
                  value={newDesaId}
                  onChange={(e) => setNewDesaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {daftarDesa.map((d) => (
                    <option key={d.id} value={d.id}>
                      Desa {d.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                Password awal standar: <strong className="font-mono text-slate-800">desa123</strong>. Petugas akan diminta mengganti password saat login pertama.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900"
                >
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EKSPOR LAPORAN PDF RESMI */}
      {isPdfReportOpen && (
        <LaporanPdfTemplate
          pengajuanList={activeMenu === 'semua' ? filteredPengajuan : pengajuanList}
          daftarLayanan={layananList}
          daftarDesa={daftarDesa}
          desaFilter={pdfReportDesaFilter}
          customTitle={pdfReportCustomTitle || (activeMenu === 'semua' ? 'Laporan Register Seluruh Pengajuan Pelayanan Administrasi' : undefined)}
          onClose={() => {
            setIsPdfReportOpen(false);
            setPdfReportCustomTitle('');
          }}
        />
      )}

      {/* MODAL: PRATINJAU LEMBAR PENGAJUAN BER-KOP RESMI (PDF) */}
      {previewLembarPdf && (
        <LembarPengajuanPdf
          pengajuan={previewLembarPdf}
          warga={wargaList.find((w) => w.nik === previewLembarPdf.nik)}
          onClose={() => setPreviewLembarPdf(null)}
        />
      )}
    </div>
  );
};
