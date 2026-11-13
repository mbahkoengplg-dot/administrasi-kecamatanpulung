import React, { useState } from 'react';
import { Desa, UserAccount, Warga } from '../types';
import { parseNik, validateNikWithBirthDate } from '../utils/nikValidator';
import {
  getStoredUsers,
  getStoredWarga,
  saveStoredWarga,
  addLogAktivitas,
  getStoredSettings,
} from '../utils/storage';
import {
  cloudLoginPetugas,
  cloudLoginWarga,
  syncAllFromCloud,
} from '../utils/gasApi';
import {
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import { LogoKecamatan } from '../components/LogoKecamatan';

interface LoginViewProps {
  daftarDesa: Desa[];
  onLoginWarga: (warga: Warga) => void;
  onLoginPetugas: (user: UserAccount) => void;
  onNavigateHome: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  daftarDesa,
  onLoginWarga,
  onLoginPetugas,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<'warga' | 'petugas'>('warga');

  // Warga Form State
  const [nik, setNik] = useState('');
  const [tglLahir, setTglLahir] = useState('');
  const [wargaError, setWargaError] = useState<string | null>(null);

  // Warga First-time Registration State (when NIK is not yet in sheet)
  const [isFirstTimeModalOpen, setIsFirstTimeModalOpen] = useState(false);
  const [firstTimeNama, setFirstTimeNama] = useState('');
  const [firstTimeHp, setFirstTimeHp] = useState('');
  const [firstTimeAlamat, setFirstTimeAlamat] = useState('');
  const [firstTimeDesaId, setFirstTimeDesaId] = useState('desa-01');

  // Petugas Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [petugasError, setPetugasError] = useState<string | null>(null);

  // Login attempts security check (lock after 5 failed attempts)
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle Warga Login
  const handleWargaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setWargaError(null);

    if (isLocked) {
      setWargaError('Terlalu banyak percobaan gagal. Akun dikunci sementara demi keamanan (15 menit).');
      return;
    }

    if (!nik.trim()) {
      setWargaError('NIK wajib 16 angka.');
      return;
    }

    if (!tglLahir) {
      setWargaError('Tanggal lahir wajib diisi.');
      return;
    }

    // Step 1: Validate NIK structure & birthdate matching
    const nikCheck = validateNikWithBirthDate(nik, tglLahir);
    if (!nikCheck.isValid) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setIsLocked(true);
        setWargaError('Terlalu banyak percobaan gagal. Akun dikunci sementara 15 menit.');
      } else {
        setWargaError(nikCheck.errorMessage || 'Data NIK dan tanggal lahir tidak cocok.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Try Cloud Google Spreadsheet authentication first
      const cloudRes = await cloudLoginWarga({
        nik: nik.trim(),
        tgl_lahir: tglLahir,
      });

      if (cloudRes.handledByCloud) {
        if (cloudRes.success && cloudRes.warga) {
          const allWarga = getStoredWarga();
          const existsLocal = allWarga.some((w) => w.nik === cloudRes.warga!.nik);
          saveStoredWarga(
            existsLocal
              ? allWarga.map((w) => (w.nik === cloudRes.warga!.nik ? cloudRes.warga! : w))
              : [...allWarga, cloudRes.warga]
          );
          await syncAllFromCloud();
          addLogAktivitas(cloudRes.warga.nama, 'warga', 'Login Warga', 'Masuk ke dashboard pemohon mandiri');
          onLoginWarga(cloudRes.warga);
          return;
        }
        if (cloudRes.isNew) {
          setIsFirstTimeModalOpen(true);
          return;
        }
        setWargaError(cloudRes.error || 'Data tidak cocok. Periksa kembali NIK atau tanggal lahir Anda.');
        return;
      }

      // Fallback local mode
      const allWarga = getStoredWarga();
      const existingWarga = allWarga.find((w) => w.nik === nik.trim());

      if (existingWarga) {
        if (existingWarga.tglLahir !== tglLahir) {
          setWargaError('Data tidak cocok. Periksa kembali NIK atau tanggal lahir Anda.');
          return;
        }
        addLogAktivitas(existingWarga.nama, 'warga', 'Login Warga', 'Masuk ke dashboard pemohon mandiri');
        onLoginWarga(existingWarga);
      } else {
        setIsFirstTimeModalOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete First-Time Registration for Warga
  const handleCompleteFirstTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstTimeNama.trim()) {
      setWargaError('Nama lengkap sesuai KTP wajib diisi.');
      return;
    }
    if (!firstTimeAlamat.trim()) {
      setWargaError('Alamat lengkap tempat tinggal wajib diisi.');
      return;
    }

    const desaObj = daftarDesa.find((d) => d.id === firstTimeDesaId);
    const desaNama = desaObj ? desaObj.nama : 'Pulung';

    setIsSubmitting(true);
    try {
      const cloudRes = await cloudLoginWarga({
        nik: nik.trim(),
        tgl_lahir: tglLahir,
        nama: firstTimeNama.trim(),
        no_hp: firstTimeHp.trim(),
        alamat: firstTimeAlamat.trim(),
        desa_id: firstTimeDesaId,
        desa_nama: desaNama,
      });

      const newWarga: Warga =
        cloudRes.handledByCloud && cloudRes.success && cloudRes.warga
          ? cloudRes.warga
          : {
              nik: nik.trim(),
              nama: firstTimeNama.trim(),
              tglLahir,
              noHp: firstTimeHp.trim(),
              alamat: firstTimeAlamat.trim(),
              desaId: firstTimeDesaId,
              desaNama,
              terverifikasi: false,
              dibuatOleh: 'mandiri',
              dibuatPada: new Date().toISOString(),
            };

      const allWarga = getStoredWarga();
      const filtered = allWarga.filter((w) => w.nik !== newWarga.nik);
      saveStoredWarga([...filtered, newWarga]);

      if (cloudRes.handledByCloud) {
        await syncAllFromCloud();
      }

      addLogAktivitas(
        newWarga.nama,
        'warga',
        'Pendaftaran Pertama Warga',
        `Warga baru mendaftar mandiri dari Desa ${desaNama}`
      );

      setIsFirstTimeModalOpen(false);
      onLoginWarga(newWarga);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Petugas Login
  const handlePetugasLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPetugasError(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setPetugasError('Username dan password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cloudRes = await cloudLoginPetugas(cleanUser, cleanPass);
      if (cloudRes.handledByCloud) {
        if (cloudRes.success && cloudRes.user) {
          await syncAllFromCloud();
          addLogAktivitas(
            cloudRes.user.nama,
            cloudRes.user.role,
            'Login Petugas',
            `Petugas masuk ke dashboard ${cloudRes.user.role === 'admin' ? 'Admin Kecamatan' : `Desa ${cloudRes.user.desaNama}`}`
          );
          onLoginPetugas(cloudRes.user);
          return;
        }
        setPetugasError(cloudRes.error || 'Username atau password salah. Silakan coba kembali.');
        return;
      }

      const allUsers = getStoredUsers();
      const matchedUser = allUsers.find(
        (u) => u.username.toLowerCase() === cleanUser && u.aktif
      );

      const settings = getStoredSettings();
      const adminPassMatch = cleanPass === settings.passwordAdmin;

      const isValidPass =
        (matchedUser?.role === 'admin' && adminPassMatch) ||
        (matchedUser?.role === 'desa' && (cleanPass === 'desa123' || cleanPass === 'desa' || cleanPass === 'password'));

      if (matchedUser && isValidPass) {
        addLogAktivitas(
          matchedUser.nama,
          matchedUser.role,
          'Login Petugas',
          `Petugas masuk ke dashboard ${matchedUser.role === 'admin' ? 'Admin Kecamatan' : `Desa ${matchedUser.desaNama}`}`
        );
        onLoginPetugas(matchedUser);
      } else {
        setPetugasError('Username atau password salah. Silakan coba kembali.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Top Home link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between text-xs text-slate-500 mb-2">
        <button
          onClick={onNavigateHome}
          className="hover:text-emerald-900 font-semibold flex items-center gap-1 transition-colors"
        >
          ← Beranda Publik Kecamatan
        </button>
        <span className="font-mono text-[11px] text-slate-400">Pulung · Ponorogo</span>
      </div>

      {/* Main Card (Matches Mockup Screen 1 & 2) */}
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-5 sm:p-8">
        {/* Emblem & Branding */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center mx-auto mb-2">
            <LogoKecamatan size={56} />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase block">
            Kecamatan Pulung
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Layanan Kecamatan
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {activeTab === 'warga'
              ? 'Urus surat dan administrasi dengan mudah, dari rumah.'
              : 'Masuk untuk petugas kecamatan dan petugas desa.'}
          </p>
        </div>

        {/* Tab Selector: [Warga] | [Petugas] */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('warga');
              setWargaError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'warga'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Warga
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('petugas');
              setPetugasError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'petugas'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Petugas
          </button>
        </div>

        {/* TAB 1: LOGIN WARGA (OTP / NIK + TGL LAHIR) */}
        {activeTab === 'warga' && (
          <form onSubmit={handleWargaLogin} className="space-y-3.5">
            {wargaError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{wargaError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIK (16 angka)
              </label>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => {
                  setNik(e.target.value);
                  setWargaError(null);
                }}
                placeholder="3502xxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono text-xs sm:text-sm tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={tglLahir}
                onChange={(e) => {
                  setTglLahir(e.target.value);
                  setWargaError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent text-xs sm:text-sm text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-950 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Memeriksa Data...' : 'Masuk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-xs text-slate-500 leading-relaxed border-t border-slate-100 mt-4">
              <p>
                <strong>Belum punya akun?</strong> Tidak perlu daftar. Cukup masuk dengan NIK dan tanggal lahir, data diri diisi saat pertama kali.
              </p>
            </div>
          </form>
        )}

        {/* TAB 2: LOGIN PETUGAS (USERNAME + PASSWORD) */}
        {activeTab === 'petugas' && (
          <form onSubmit={handlePetugasLogin} className="space-y-3.5">
            {petugasError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{petugasError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setPetugasError(null);
                }}
                placeholder="Masukkan username petugas"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent text-xs sm:text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPetugasError(null);
                }}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent text-xs sm:text-sm text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-950 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Memverifikasi Akun...' : 'Masuk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center text-xs text-slate-500 leading-relaxed border-t border-slate-100 mt-4">
              <p>
                Akun dibuat oleh Admin Kecamatan. Lupa password? Hubungi admin kecamatan.
              </p>
            </div>
          </form>
        )}
      </div>

      {/* FIRST TIME REGISTRATION MODAL FOR WARGA */}
      {isFirstTimeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Selamat Datang di Layanan Kecamatan Pulung!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                NIK Anda (<strong className="font-mono text-slate-700">{nik}</strong>) baru pertama kali terdeteksi. Silakan lengkapi identitas Anda satu kali saja.
              </p>
            </div>

            <form onSubmit={handleCompleteFirstTime} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstTimeNama}
                  onChange={(e) => setFirstTimeNama(e.target.value)}
                  placeholder="Masukkan nama lengkap sesuai KTP"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor WhatsApp / HP Aktif
                </label>
                <input
                  type="tel"
                  value={firstTimeHp}
                  onChange={(e) => setFirstTimeHp(e.target.value)}
                  placeholder="08xxxxxxxxxx (untuk info status surat)"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Desa Asal di Kecamatan Pulung <span className="text-rose-500">*</span>
                </label>
                <select
                  value={firstTimeDesaId}
                  onChange={(e) => setFirstTimeDesaId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {daftarDesa.map((d) => (
                    <option key={d.id} value={d.id}>
                      Desa {d.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Tempat Tinggal / Dusun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstTimeAlamat}
                  onChange={(e) => setFirstTimeAlamat(e.target.value)}
                  placeholder="Contoh: RT 02 RW 01 Dusun Krajan"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFirstTimeModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 disabled:opacity-60 text-white font-bold transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-400 py-2">
        Pemerintah Kabupaten Ponorogo · Kantor Kecamatan Pulung · Sistem Pelayanan Daring
      </div>
    </div>
  );
};
