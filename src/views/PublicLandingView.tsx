import React, { useEffect, useState } from 'react';
import { Desa, KecamatanSettings, Layanan, Pengajuan } from '../types';
import { SuratTemplate } from '../components/SuratTemplate';
import { getStoredPengajuan, getStoredSettings } from '../utils/storage';
import { cloudTrackKode } from '../utils/gasApi';
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { LogoKecamatan } from '../components/LogoKecamatan';

interface PublicLandingViewProps {
  daftarLayanan: Layanan[];
  daftarDesa: Desa[];
  onNavigateLogin: () => void;
  onOpenVerifikasiKode: (kode: string) => void;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  daftarLayanan,
  daftarDesa,
  onNavigateLogin,
  onOpenVerifikasiKode,
}) => {
  const [trackKode, setTrackKode] = useState('');
  const [trackResult, setTrackResult] = useState<Pengajuan | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedSuratForView, setSelectedSuratForView] = useState<Pengajuan | null>(null);
  const [settings, setSettings] = useState<KecamatanSettings>(getStoredSettings());

  useEffect(() => {
    const onSync = () => setSettings(getStoredSettings());
    window.addEventListener('pulung-data-synced', onSync);
    return () => window.removeEventListener('pulung-data-synced', onSync);
  }, []);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackResult(null);

    const clean = trackKode.trim().toUpperCase();
    if (!clean) {
      setTrackError('Silakan masukkan Kode Pengajuan atau Nomor Surat.');
      return;
    }

    setIsTracking(true);
    try {
      const cloudRes = await cloudTrackKode(clean);
      if (cloudRes.handledByCloud) {
        if (cloudRes.pengajuan) {
          setTrackResult(cloudRes.pengajuan);
          return;
        }
        setTrackError(
          `Pengajuan dengan kode "${clean}" tidak ditemukan. Pastikan format penulisan benar, contoh: PLG-2026-000001.`
        );
        return;
      }

      const all = getStoredPengajuan();
      const found = all.find(
        (p) =>
          p.kode.toUpperCase() === clean ||
          (p.nomorSurat && p.nomorSurat.toUpperCase() === clean)
      );

      if (found) {
        setTrackResult(found);
      } else {
        setTrackError(
          `Pengajuan dengan kode "${clean}" tidak ditemukan. Pastikan format penulisan benar, contoh: PLG-2026-000001.`
        );
      }
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-emerald-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1">
              <LogoKecamatan size={32} />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300 block">
                Kabupaten Ponorogo
              </span>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-none">
                Kecamatan Pulung
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const el = document.getElementById('cek-surat');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100 hover:text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800/80 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Cek Surat / Lacak</span>
            </button>
            <button
              onClick={onNavigateLogin}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs active:scale-95 items-center gap-1.5"
            >
              <span>Masuk Layanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-emerald-950 text-white pt-12 pb-16 px-4 sm:px-6">
        {/* Background Photo */}
        <img
          src="/assets/aistudio/AF835CB3-D8C5-439A-8BAC-D5C0B766A651.jpeg.780x439_q85_50378377.jpg"
          alt="Gedung Pemerintah Kabupaten Ponorogo"
          className="absolute inset-0 w-full h-full object-cover object-[60%_35%] sm:object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-950/70 to-emerald-950/95" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/80 backdrop-blur-xs border border-emerald-700/60 text-emerald-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Pelayanan Administrasi Terpadu Kecamatan (PATEN)</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight drop-shadow-sm">
            Pelayanan Administrasi Surat Kecamatan Pulung
          </h2>

          <p className="text-xs sm:text-sm text-emerald-50/90 max-w-xl mx-auto leading-relaxed drop-shadow-xs">
            Mudah, cepat, dan transparan. Warga dapat mengurus surat mandiri dari HP atau dibantu langsung oleh perangkat di kantor desa.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={onNavigateLogin}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Ajukan Layanan Sekarang</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('cek-surat');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl bg-emerald-900/85 hover:bg-emerald-800 backdrop-blur-xs text-white font-semibold text-xs sm:text-sm transition-colors border border-emerald-700/80 flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lacak / Verifikasi Surat</span>
            </button>
          </div>

          {/* 2 Jalur Highlights */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
            <div className="p-4 rounded-2xl bg-emerald-950/75 backdrop-blur-xs border border-emerald-800/80">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                Jalur 1 · Warga Mandiri
              </span>
              <h4 className="font-bold text-sm text-white mt-0.5">Ajukan dari Rumah</h4>
              <p className="text-xs text-emerald-100/85 mt-1">
                Cukup masuk dengan NIK &amp; Tanggal Lahir tanpa harus antre di balai desa.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-950/75 backdrop-blur-xs border border-emerald-800/80">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                Jalur 2 · Pendampingan Desa
              </span>
              <h4 className="font-bold text-sm text-white mt-0.5">Lewat Petugas Desa</h4>
              <p className="text-xs text-emerald-100/85 mt-1">
                Bagi warga yang kurang paham teknologi, operator desa siap menginput dan memfoto berkas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKING & CEK KEASLIAN SURAT SECTION */}
      <section id="cek-surat" className="py-10 px-4 sm:px-6 max-w-4xl mx-auto w-full -mt-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-lg p-5 sm:p-7">
          <div className="text-center max-w-md mx-auto mb-5">
            <div className="w-10 h-10 bg-emerald-100/80 text-emerald-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Cek Keaslian Dokumen &amp; Lacak Status
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Masukkan Kode Pengajuan (contoh: <strong className="font-mono text-slate-700">PLG-2026-000001</strong>) atau Nomor Surat untuk memverifikasi keabsahan dokumen.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={trackKode}
              onChange={(e) => {
                setTrackKode(e.target.value);
                setTrackError(null);
              }}
              placeholder="PLG-2026-xxxxxx atau No. Surat"
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
            />
            <button
              type="submit"
              disabled={isTracking}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs"
            >
              {isTracking ? 'Mencari...' : 'Periksa'}
            </button>
          </form>

          {trackError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 max-w-md mx-auto text-center font-medium">
              {trackError}
            </div>
          )}

          {/* Track Result Card */}
          {trackResult && (
            <div className="max-w-lg mx-auto bg-slate-50 border border-emerald-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {trackResult.kode}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {trackResult.layananNama}
                  </h4>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    trackResult.status === 'Selesai'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {trackResult.status}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600 border-y border-slate-200 py-3">
                <div className="flex justify-between">
                  <span>Nama Pemohon:</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {trackResult.namaWarga.substring(0, 3)}*** (Privasi)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Asal Desa:</span>
                  <span className="text-slate-800 font-medium">Desa {trackResult.desaNama}</span>
                </div>
                {trackResult.nomorSurat && (
                  <div className="flex justify-between">
                    <span>Nomor Surat Resmi:</span>
                    <span className="font-mono font-bold text-emerald-900">
                      {trackResult.nomorSurat}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Terakhir Diperbarui:</span>
                  <span className="text-slate-700">
                    {new Date(trackResult.diubahPada).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {trackResult.status === 'Selesai' ? (
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSelectedSuratForView(trackResult)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Lihat Dokumen Resmi Ber-QR</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Permohonan saat ini sedang dalam proses verifikasi petugas kecamatan.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 6 MASTER LAYANAN KATALOG */}
      <section className="py-10 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-7">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Layanan Terpadu
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Daftar Layanan Administrasi Kecamatan
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tersedia 6 kelompok pelayanan administrasi kependudukan, perizinan, dan rekomendasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daftarLayanan.map((lay) => (
            <div
              key={lay.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-emerald-600 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {lay.kategori}
                </span>
                <h4 className="font-bold text-slate-900 text-base mt-1">{lay.nama}</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{lay.deskripsi}</p>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Persyaratan Utama:
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {lay.persyaratan.slice(0, 3).map((p) => (
                      <li key={p.id} className="flex items-start gap-1.5">
                        <span className="text-emerald-700 font-bold">✓</span>
                        <span className="truncate">{p.nama}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Estimasi: {lay.estimasiHari} hari
                </span>
                <button
                  onClick={onNavigateLogin}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
                >
                  Ajukan <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INFO KANTOR KECAMATAN */}
      <section className="bg-slate-100 py-8 px-4 sm:px-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              Kantor {settings.namaKecamatan} · Kabupaten Ponorogo
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Pusat Pelayanan Administrasi Terpadu Kecamatan (PATEN)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs">Alamat Kantor</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {settings.alamatKantor}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5">
                <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs">Telepon &amp; WA</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {settings.telepon}<br />WA: {settings.whatsappBantuan}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5">
                <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs">Surel Resmi</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed break-all">
                {settings.emailResmi}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs">Jam Pelayanan</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Senin - Kamis: {settings.jamPelayananSeninKamis}<br />Jumat: {settings.jamPelayananJumat}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-6 px-4 text-center text-xs text-slate-400">
        <p>© 2026 {settings.namaKabupaten} · Kantor {settings.namaKecamatan}.</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Aplikasi Pelayanan Administrasi Terpadu Kecamatan (PATEN) Daring
        </p>
      </footer>

      {/* Surat Preview Modal if clicked from tracking */}
      {selectedSuratForView && (
        <SuratTemplate
          pengajuan={selectedSuratForView}
          onClose={() => setSelectedSuratForView(null)}
        />
      )}
    </div>
  );
};
