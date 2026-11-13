import React, { useEffect, useState } from 'react';
import { Desa, Layanan, Pengajuan, Warga } from '../types';
import { WizardPengajuan } from '../components/WizardPengajuan';
import { SuratTemplate } from '../components/SuratTemplate';
import { CameraCaptureModal } from '../components/CameraCaptureModal';
import { maskNik } from '../utils/nikValidator';
import {
  getStoredPengajuan,
  saveStoredPengajuan,
  addLogAktivitas,
  getStoredSettings,
} from '../utils/storage';
import {
  cloudSavePengajuan,
  syncAllFromCloud,
  uploadBerkasCloud,
} from '../utils/gasApi';
import {
  ShieldCheck,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  MessageCircle,
  LogOut,
  ChevronRight,
  ExternalLink,
  Home,
  FileCheck,
  HelpCircle,
  Upload,
  RefreshCw,
} from 'lucide-react';

interface WargaDashboardProps {
  warga: Warga;
  daftarDesa: Desa[];
  daftarLayanan: Layanan[];
  onLogout: () => void;
}

export const WargaDashboard: React.FC<WargaDashboardProps> = ({
  warga,
  daftarDesa,
  daftarLayanan,
  onLogout,
}) => {
  const [activeBottomTab, setActiveBottomTab] = useState<'beranda' | 'pengajuan' | 'bantuan'>('pengajuan');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedSuratPreview, setSelectedSuratPreview] = useState<Pengajuan | null>(null);
  const [selectedDetailPengajuan, setSelectedDetailPengajuan] = useState<Pengajuan | null>(null);

  // Perbaiki Berkas Modal State
  const [perbaikiTarget, setPerbaikiTarget] = useState<Pengajuan | null>(null);
  const [isCameraFixOpen, setIsCameraFixOpen] = useState(false);

  // Help WhatsApp Modal
  const [isWaHelpOpen, setIsWaHelpOpen] = useState(false);
  const [settings, setSettings] = useState(getStoredSettings());
  const [allPengajuanState, setAllPengajuanState] = useState<Pengajuan[]>(getStoredPengajuan());
  const [isSyncing, setIsSyncing] = useState(false);

  const reloadLocal = () => {
    setAllPengajuanState(getStoredPengajuan());
    setSettings(getStoredSettings());
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

  // Read submissions for this specific citizen NIK
  const myPengajuan = allPengajuanState.filter((p) => p.nik === warga.nik);

  // Status badge styling helper
  const renderStatusBadge = (status: Pengajuan['status']) => {
    switch (status) {
      case 'Diajukan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-sky-600" />
            <span>Diajukan</span>
          </span>
        );
      case 'Diverifikasi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-indigo-600" />
            <span>Diverifikasi</span>
          </span>
        );
      case 'Diproses':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100/80 border border-amber-300 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>Diproses</span>
          </span>
        );
      case 'Perlu Perbaikan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Perlu Perbaikan</span>
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>Selesai</span>
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-200 border border-slate-300 px-2.5 py-0.5 rounded-full">
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
          catatan: 'Berkas perbaikan telah diunggah kembali oleh pemohon. Menunggu verifikasi ulang.',
          berkas: newBerkas,
          riwayat: [
            ...p.riwayat,
            {
              status: 'Diajukan' as const,
              catatan: 'Pemohon mengunggah ulang dokumen perbaikan.',
              oleh: `${warga.nama} (Pemohon)`,
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
      warga.nama,
      'warga',
      'Perbaiki Berkas',
      `Mengunggah ulang berkas perbaikan untuk pengajuan ${perbaikiTarget.kode}`
    );

    setPerbaikiTarget(null);
    setIsCameraFixOpen(false);
  };

  // If Wizard is active, render the 4-step wizard
  if (isWizardOpen) {
    return (
      <WizardPengajuan
        currentRole="warga"
        currentUserWarga={warga}
        daftarDesa={daftarDesa}
        daftarLayanan={daftarLayanan}
        onComplete={() => {
          reloadLocal();
          setIsWizardOpen(false);
        }}
        onCancel={() => setIsWizardOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      {/* Container (Mobile-first width, matches Mockup Screen 3) */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-md flex flex-col justify-between relative">
        {/* Top Header Banner (Deep Green with Pemkab Ponorogo Photo Backdrop) */}
        <div className="bg-emerald-950 text-white pt-6 pb-7 px-5 rounded-b-3xl shadow-sm relative overflow-hidden">
          <img
            src="/assets/aistudio/AF835CB3-D8C5-439A-8BAC-D5C0B766A651.jpeg.780x439_q85_50378377.jpg"
            alt="Gedung Pemerintah Kabupaten Ponorogo"
            className="absolute inset-0 w-full h-full object-cover object-[70%_35%] opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/80 to-emerald-900/55" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-800/90 border border-emerald-700 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">
                    Kecamatan Pulung
                  </span>
                  <span className="text-xs font-semibold text-slate-100">
                    {warga.nama}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="text-[11px] font-semibold text-emerald-100 hover:text-white px-2 py-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 transition-colors flex items-center gap-1 disabled:opacity-60"
                  title="Segarkan status dari server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onLogout}
                  className="text-[11px] font-semibold text-emerald-100 hover:text-white px-2.5 py-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700/60 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-emerald-200">Selamat Datang,</span>
              <h1 className="text-lg font-bold text-white tracking-tight mt-0.5">
                {activeBottomTab === 'beranda' ? 'Katalog Layanan' : 'Pengajuan Saya'}
              </h1>
              <p className="text-[11px] text-emerald-200/85 mt-0.5">
                NIK: {maskNik(warga.nik)} · Desa {warga.desaNama || 'Pulung'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 space-y-4 -mt-3">
          {/* Big CTA Button: + Ajukan Layanan Baru (Matches Mockup Screen 3) */}
          <button
            onClick={() => setIsWizardOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 text-center"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Ajukan Layanan Baru</span>
          </button>

          {/* TAB 1: PENGAJUAN SAYA (DEFAULT - SCREEN 3) */}
          {activeBottomTab === 'pengajuan' && (
            <div className="space-y-3">
              {myPengajuan.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 my-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Belum Ada Pengajuan</h3>
                  <p className="text-xs text-slate-500">
                    Anda belum memiliki riwayat pengajuan surat di Kecamatan Pulung. Klik tombol di atas untuk mengajukan.
                  </p>
                </div>
              ) : (
                myPengajuan.map((item) => (
                  <div
                    key={item.kode}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Header Row: Title & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">
                          {item.layananNama}
                        </h3>
                        <p className="font-mono text-xs text-slate-400 mt-0.5">
                          {item.kode}
                        </p>
                      </div>
                      <div className="shrink-0">{renderStatusBadge(item.status)}</div>
                    </div>

                    {/* Specific Action & Notes based on Status (Exactly matching Mockup Screen 3) */}
                    {item.status === 'Perlu Perbaikan' && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                        <p className="text-xs text-rose-900 leading-relaxed font-medium">
                          {item.catatan || 'Foto KK kurang jelas. Mohon unggah ulang.'}
                        </p>
                        <button
                          onClick={() => {
                            setPerbaikiTarget(item);
                            setIsCameraFixOpen(true);
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-white border border-rose-300 text-rose-900 font-bold text-xs hover:bg-rose-100/50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-rose-700" />
                          <span>Perbaiki Berkas</span>
                        </button>
                      </div>
                    )}

                    {item.status === 'Selesai' && (
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedSuratPreview(item)}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Hasil</span>
                        </button>
                      </div>
                    )}

                    {item.status !== 'Perlu Perbaikan' && item.status !== 'Selesai' && (
                      <button
                        onClick={() => setSelectedDetailPengajuan(item)}
                        className="w-full py-1.5 text-center text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1"
                      >
                        <span>Lihat Alur &amp; Catatan Petugas</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: BERANDA (KATALOG LAYANAN PUBLIK) */}
          {activeBottomTab === 'beranda' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-emerald-800 mb-1">
                  6 Kategori Layanan Administrasi
                </h3>
                <p className="text-xs text-slate-500">
                  Semua permohonan surat diproses maksimal 1-3 hari kerja.
                </p>
              </div>

              {daftarLayanan.map((l) => (
                <div
                  key={l.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5"
                >
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">
                    {l.kategori}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{l.nama}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{l.deskripsi}</p>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Estimasi {l.estimasiHari} hari
                    </span>
                    <button
                      onClick={() => setIsWizardOpen(true)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950"
                    >
                      Pilih Layanan →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: BANTUAN */}
          {activeBottomTab === 'bantuan' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pusat Bantuan Warga</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ada kendala saat mengisi atau butuh informasi persyaratan surat? Petugas Kecamatan Pulung siap melayani via WhatsApp.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="font-bold text-emerald-950">Jam Pelayanan Kantor:</div>
                <div className="text-slate-600">Senin - Kamis : {settings.jamPelayananSeninKamis}</div>
                <div className="text-slate-600">Jumat : {settings.jamPelayananJumat}</div>
                <div className="text-slate-600">Sabtu, Minggu &amp; Libur Nasional : Tutup</div>
              </div>

              <a
                href={`https://wa.me/${(() => {
                  const d = settings.whatsappBantuan.replace(/\D/g, '');
                  return d.startsWith('0') ? `62${d.slice(1)}` : d;
                })()}?text=${encodeURIComponent(`Halo Admin ${settings.namaKecamatan}, saya ingin bertanya mengenai layanan surat`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Tanya Petugas via WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar (Matches Mockup Screen 3: Beranda, Pengajuan Saya, Bantuan) */}
        <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between sticky bottom-0 z-30 shadow-lg">
          <button
            onClick={() => setActiveBottomTab('beranda')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              activeBottomTab === 'beranda' ? 'text-emerald-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Beranda</span>
          </button>
          <button
            onClick={() => setActiveBottomTab('pengajuan')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              activeBottomTab === 'pengajuan' ? 'text-emerald-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            <span>Pengajuan Saya</span>
          </button>
          <button
            onClick={() => setActiveBottomTab('bantuan')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              activeBottomTab === 'bantuan' ? 'text-emerald-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span>Bantuan</span>
          </button>
        </div>
      </div>

      {/* MODAL: PRATINJAU SURAT RESMI SELESAI */}
      {selectedSuratPreview && (
        <SuratTemplate
          pengajuan={selectedSuratPreview}
          warga={warga}
          onClose={() => setSelectedSuratPreview(null)}
        />
      )}

      {/* MODAL: DETAIL & TIMELINE PENGAJUAN */}
      {selectedDetailPengajuan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="font-mono text-xs text-slate-400 block">
                  {selectedDetailPengajuan.kode}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedDetailPengajuan.layananNama}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailPengajuan(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Status Terkini:</span>
                {renderStatusBadge(selectedDetailPengajuan.status)}
              </div>

              {selectedDetailPengajuan.catatan && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-0.5">Catatan Petugas:</span>
                  <p className="text-slate-600 italic">"{selectedDetailPengajuan.catatan}"</p>
                </div>
              )}

              {/* Status Timeline */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Riwayat &amp; Alur Proses:
                </span>
                <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedDetailPengajuan.riwayat.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative pl-6">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-800 ring-4 ring-white absolute left-1.5 top-1" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {step.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(step.waktu).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{step.catatan}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Oleh: {step.oleh}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded Files */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5">
                  Berkas yang Diunggah ({selectedDetailPengajuan.berkas.length}):
                </span>
                <ul className="space-y-1.5 text-xs">
                  {selectedDetailPengajuan.berkas.map((b) => (
                    <li
                      key={b.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <span className="text-slate-700 truncate max-w-[220px] font-medium">
                        {b.namaDokumen}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {b.fileSize}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDetailPengajuan(null)}
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
          persyaratanNama="Foto Berkas Perbaikan yang Diminta Kecamatan"
          onCapture={handleSaveFixedDocument}
          onClose={() => {
            setIsCameraFixOpen(false);
            setPerbaikiTarget(null);
          }}
        />
      )}
    </div>
  );
};
