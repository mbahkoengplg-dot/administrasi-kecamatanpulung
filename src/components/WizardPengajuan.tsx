import React, { useState } from 'react';
import { Desa, Layanan, Pengajuan, Warga } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { TandaTerima } from './TandaTerima';
import {
  parseNik,
  validateNikWithBirthDate,
} from '../utils/nikValidator';
import {
  generateNextKodePengajuan,
  getStoredPengajuan,
  getStoredWarga,
  saveStoredPengajuan,
  saveStoredWarga,
  addLogAktivitas,
} from '../utils/storage';
import {
  cloudSavePengajuan,
  cloudSaveWarga,
  uploadBerkasCloud,
} from '../utils/gasApi';
import {
  CheckCircle,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Camera,
  Printer,
  Home,
  User,
  ShieldCheck,
} from 'lucide-react';

interface WizardPengajuanProps {
  currentRole: 'warga' | 'desa';
  currentUserWarga?: Warga | null;
  desaPetugas?: { id: string; nama: string };
  daftarDesa: Desa[];
  daftarLayanan: Layanan[];
  onComplete: () => void;
  onCancel: () => void;
}

export const WizardPengajuan: React.FC<WizardPengajuanProps> = ({
  currentRole,
  currentUserWarga,
  desaPetugas,
  daftarDesa,
  daftarLayanan,
  onComplete,
  onCancel,
}) => {
  // Wizard steps: 1: Layanan/Warga, 2: Detail Data, 3: Unggah Berkas, 4: Ringkasan
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedLayananId, setSelectedLayananId] = useState<string>('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');

  // Citizen data state (for desa operator input or warga prefill)
  const [nik, setNik] = useState<string>(currentUserWarga?.nik || '');
  const [namaWarga, setNamaWarga] = useState<string>(currentUserWarga?.nama || '');
  const [tglLahir, setTglLahir] = useState<string>(currentUserWarga?.tglLahir || '');
  const [noHp, setNoHp] = useState<string>(currentUserWarga?.noHp || '');
  const [alamat, setAlamat] = useState<string>(currentUserWarga?.alamat || '');
  const [desaId, setDesaId] = useState<string>(
    currentUserWarga?.desaId || desaPetugas?.id || 'desa-01'
  );
  const [keperluan, setKeperluan] = useState<string>('');
  const [nikLookupFound, setNikLookupFound] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Uploaded documents state: map of requirementId -> { fileName, fileSize, fileUrl }
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { fileName: string; fileSize: string; fileUrl: string }>
  >({});
  const [activeUploadReq, setActiveUploadReq] = useState<{
    id: string;
    nama: string;
  } | null>(null);

  // Submission Result State
  const [createdPengajuan, setCreatedPengajuan] = useState<Pengajuan | null>(null);
  const [showTandaTerima, setShowTandaTerima] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitProgress, setSubmitProgress] = useState<string>('');

  // Selected Layanan Object
  const selectedLayanan = daftarLayanan.find((l) => l.id === selectedLayananId);

  // Filter categories
  const categories = ['Semua', ...Array.from(new Set(daftarLayanan.map((l) => l.kategori)))];
  const filteredLayanan = daftarLayanan.filter(
    (l) => selectedKategori === 'Semua' || l.kategori === selectedKategori
  );

  // Auto lookup NIK for Petugas Desa
  const handleNikChange = (value: string) => {
    setNik(value);
    setErrorMessage(null);
    if (value.length === 16) {
      const parsed = parseNik(value);
      if (!parsed.isValid) {
        setErrorMessage(parsed.errorMessage || 'NIK tidak valid');
        return;
      }
      // Check stored citizens
      const wargaList = getStoredWarga();
      const existing = wargaList.find((w) => w.nik === value);
      if (existing) {
        setNamaWarga(existing.nama);
        setTglLahir(existing.tglLahir);
        setNoHp(existing.noHp);
        setAlamat(existing.alamat);
        setDesaId(existing.desaId);
        setNikLookupFound(true);
      } else {
        setNikLookupFound(false);
      }
    } else {
      setNikLookupFound(false);
    }
  };

  // Step 1 Validation
  const handleNextStep1 = () => {
    setErrorMessage(null);

    // If Petugas Desa, validate citizen data first
    if (currentRole === 'desa') {
      if (!nik || nik.length !== 16) {
        setErrorMessage('NIK wajib 16 digit angka.');
        return;
      }
      const nikCheck = validateNikWithBirthDate(nik, tglLahir);
      if (!nikCheck.isValid) {
        setErrorMessage(nikCheck.errorMessage || 'Data NIK dan tanggal lahir tidak cocok.');
        return;
      }
      if (!namaWarga.trim()) {
        setErrorMessage('Nama lengkap warga wajib diisi.');
        return;
      }
      if (!alamat.trim()) {
        setErrorMessage('Alamat warga wajib diisi.');
        return;
      }
    }

    if (!selectedLayananId) {
      setErrorMessage('Silakan pilih salah satu layanan.');
      return;
    }

    setStep(2);
  };

  // Step 2 Validation
  const handleNextStep2 = () => {
    setErrorMessage(null);
    if (!keperluan.trim()) {
      setErrorMessage('Keterangan atau keperluan permohonan wajib diisi secara singkat.');
      return;
    }
    setStep(3);
  };

  // Step 3 Validation (Check required documents)
  const handleNextStep3 = () => {
    setErrorMessage(null);
    if (!selectedLayanan) return;

    const missingRequired = selectedLayanan.persyaratan.filter(
      (p) => p.wajib && !uploadedFiles[p.id]
    );

    if (missingRequired.length > 0) {
      setErrorMessage(
        `Mohon lengkapi dokumen wajib: "${missingRequired.map((m) => m.nama).join(', ')}"`
      );
      return;
    }

    setStep(4);
  };

  // Submit Final
  const handleSubmit = async () => {
    if (!selectedLayanan || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const desaObj = daftarDesa.find((d) => d.id === desaId);
      const desaNama = desaObj ? desaObj.nama : 'Pulung';
      const kodeBaru = generateNextKodePengajuan();

      // Persist/Update Warga record locally & to Google Spreadsheet
      const wargaList = getStoredWarga();
      const existingIndex = wargaList.findIndex((w) => w.nik === nik);
      const wargaRecord: Warga = {
        nik,
        nama: namaWarga,
        tglLahir,
        noHp,
        alamat,
        desaId,
        desaNama,
        terverifikasi: existingIndex >= 0 ? wargaList[existingIndex].terverifikasi : false,
        dibuatOleh: currentRole === 'desa' ? 'desa' : 'mandiri',
        dibuatPada: existingIndex >= 0 ? wargaList[existingIndex].dibuatPada : new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        wargaList[existingIndex] = wargaRecord;
      } else {
        wargaList.push(wargaRecord);
      }
      saveStoredWarga(wargaList);
      void cloudSaveWarga(wargaRecord);

      // Upload each berkas to Google Drive (if GAS configured; otherwise keeps compressed base64)
      const entries = Object.entries(uploadedFiles);
      const berkasArray = [];
      for (let idx = 0; idx < entries.length; idx++) {
        const [pId, f] = entries[idx];
        const p = selectedLayanan.persyaratan.find((item) => item.id === pId);
        setSubmitProgress(`Mengunggah berkas ${idx + 1}/${entries.length}...`);
        const uploaded = await uploadBerkasCloud(f.fileName, f.fileUrl, kodeBaru);
        berkasArray.push({
          id: `berkas-${Date.now()}-${idx}`,
          persyaratanId: pId,
          namaDokumen: p ? p.nama : f.fileName,
          fileName: f.fileName,
          fileSize: f.fileSize,
          fileUrl: uploaded.fileUrl,
          diunggahPada: new Date().toISOString(),
        });
      }

      setSubmitProgress('Menyimpan pengajuan ke database...');
      const draftPengajuan: Pengajuan = {
        kode: kodeBaru,
        layananId: selectedLayanan.id,
        layananNama: selectedLayanan.nama,
        kategoriLayanan: selectedLayanan.kategori,
        nik,
        namaWarga,
        desaId,
        desaNama,
        jalur: currentRole === 'desa' ? 'desa' : 'mandiri',
        diajukanOleh: currentRole === 'desa' ? `Petugas Desa ${desaPetugas?.nama || desaNama}` : 'Mandiri',
        status: 'Diajukan',
        catatan: 'Permohonan baru berhasil dikirim dan menunggu verifikasi admin kecamatan.',
        keperluan,
        berkas: berkasArray,
        riwayat: [
          {
            status: 'Diajukan',
            catatan:
              currentRole === 'desa'
                ? `Diajukan lewat pendampingan petugas balai desa ${desaNama}`
                : 'Diajukan mandiri oleh pemohon secara daring',
            oleh: currentRole === 'desa' ? `Operator Desa ${desaNama}` : `${namaWarga} (Pemohon)`,
            waktu: new Date().toISOString(),
          },
        ],
        dibuatPada: new Date().toISOString(),
        diubahPada: new Date().toISOString(),
      };

      const cloudRes = await cloudSavePengajuan(draftPengajuan, true);
      if (cloudRes.handledByCloud && !cloudRes.success) {
        setErrorMessage(cloudRes.error || 'Gagal menyimpan pengajuan ke Google Spreadsheet. Silakan coba lagi.');
        return;
      }

      const finalPengajuan = cloudRes.pengajuan || draftPengajuan;
      const pengajuanList = getStoredPengajuan();
      const updatedList = [finalPengajuan, ...pengajuanList.filter((x) => x.kode !== finalPengajuan.kode)];
      saveStoredPengajuan(updatedList);

      addLogAktivitas(
        currentRole === 'desa' ? `Petugas Desa ${desaNama}` : namaWarga,
        currentRole,
        'Kirim Pengajuan Layanan',
        `Mendaftarkan ${selectedLayanan.nama} (Kode: ${finalPengajuan.kode})`
      );

      setCreatedPengajuan(finalPengajuan);
    } finally {
      setIsSubmitting(false);
      setSubmitProgress('');
    }
  };

  // SUCCESS VIEW
  if (createdPengajuan) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
            Pengajuan Berhasil Dikirim!
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Berkas permohonan administrasi Anda telah masuk ke sistem antrean pelayanan Kantor Kecamatan Pulung.
          </p>

          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-5 mb-6 text-center max-w-sm mx-auto">
            <div className="text-xs text-emerald-800 font-semibold tracking-wider uppercase">
              KODE PENGAJUAN ANDA
            </div>
            <div className="font-mono text-2xl font-black text-emerald-950 my-1 tracking-wider">
              {createdPengajuan.kode}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {createdPengajuan.layananNama}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowTandaTerima(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Cetak Tanda Terima
            </button>
            <button
              onClick={onComplete}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Home className="w-4 h-4" />
              Kembali ke Dashboard
            </button>
          </div>
        </div>

        {showTandaTerima && (
          <TandaTerima
            pengajuan={createdPengajuan}
            onClose={() => setShowTandaTerima(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
      {/* Wizard Header Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Formulir Permohonan Layanan
            </h1>
            <p className="text-xs text-slate-500">
              {currentRole === 'desa'
                ? `Pendampingan Warga · Kantor Desa ${desaPetugas?.nama || 'Pulung'}`
                : 'Jalur Mandiri · Kecamatan Pulung'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
        </div>

        {/* Mobile Step Indicator (< sm) */}
        <div className="sm:hidden pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-emerald-950">
              Langkah {step} dari 4:{' '}
              <span className="text-emerald-700">
                {[
                  currentRole === 'desa' ? 'Data & Layanan' : 'Pilih Layanan',
                  'Keperluan',
                  'Unggah Berkas',
                  'Cek & Kirim',
                ][step - 1]}
              </span>
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-800">
              {step * 25}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-800 h-full rounded-full transition-all duration-300"
              style={{ width: `${step * 25}%` }}
            />
          </div>
        </div>

        {/* Desktop 4-Step Indicator (>= sm) */}
        <div className="hidden sm:grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          {[
            { num: 1, label: currentRole === 'desa' ? 'Data & Layanan' : 'Pilih Layanan' },
            { num: 2, label: 'Keperluan' },
            { num: 3, label: 'Unggah Berkas' },
            { num: 4, label: 'Cek & Kirim' },
          ].map((item) => (
            <div key={item.num} className="text-center">
              <div
                className={`h-1.5 rounded-full mb-1.5 transition-colors ${
                  step >= item.num ? 'bg-emerald-800' : 'bg-slate-200'
                }`}
              />
              <span
                className={`text-[11px] font-medium block truncate ${
                  step === item.num
                    ? 'text-emerald-900 font-bold'
                    : step > item.num
                    ? 'text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {item.num}. {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: PILIH LAYANAN & DATA WARGA (UNTUK DESA) */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          {/* If Petugas Desa, provide Citizen input box first */}
          {currentRole === 'desa' && (
            <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <User className="w-4 h-4 text-emerald-700" />
                <span>Data Warga yang Didampingi</span>
                {nikLookupFound && (
                  <span className="ml-auto text-[11px] font-medium text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    ✓ Data ditemukan di sistem
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    NIK Warga (16 Angka) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => handleNikChange(e.target.value)}
                    placeholder="350201xxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tanggal Lahir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={tglLahir}
                    onChange={(e) => setTglLahir(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaWarga}
                    onChange={(e) => setNamaWarga(e.target.value)}
                    placeholder="Nama sesuai KTP"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm uppercase"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    No. WhatsApp / HP (Boleh kosong)
                  </label>
                  <input
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Alamat Lengkap / Dusun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Contoh: RT 02 RW 01 Dusun Krajan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Pilih Jenis Layanan Administrasi
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Pilih jenis surat atau rekomendasi yang ingin diurus di Kecamatan Pulung.
            </p>

            {/* Category Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedKategori(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedKategori === cat
                      ? 'bg-emerald-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Services List */}
            <div className="grid grid-cols-1 gap-2.5">
              {filteredLayanan.map((item) => {
                const isSelected = selectedLayananId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedLayananId(item.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-700/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-800">
                            {item.kategori}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Estimasi {item.estimasiHari} hari
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                          {item.nama}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {item.deskripsi}
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-emerald-700 bg-emerald-700 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleNextStep1}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>Lanjut ke Keperluan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ISI KEPERLUAN & KONFIRMASI */}
      {step === 2 && selectedLayanan && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Layanan Terpilih:
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              {selectedLayanan.nama}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {selectedLayanan.deskripsi}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Keperluan / Keterangan Pengajuan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                placeholder="Contoh: Untuk persyaratan pendaftaran beasiswa anak kuliah / kelengkapan pinjaman KUR di bank."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Jelaskan tujuan pembuatan surat ini agar tercantum jelas pada surat keterangan.
              </p>
            </div>

            {/* Checklist Persyaratan Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Dokumen yang Perlu Disiapkan di Langkah Selanjutnya:</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {selectedLayanan.persyaratan.map((p, idx) => (
                  <li key={p.id} className="flex items-start gap-2">
                    <span className="font-mono text-slate-400">{idx + 1}.</span>
                    <span>
                      {p.nama}{' '}
                      {p.wajib ? (
                        <span className="text-rose-600 font-semibold">(Wajib)</span>
                      ) : (
                        <span className="text-slate-400">(Opsional jika ada)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              type="button"
              onClick={handleNextStep2}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>Lanjut Unggah Berkas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: UNGGAH BERKAS (FOTO DARI HP/WEBCAM) */}
      {step === 3 && selectedLayanan && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Unggah Foto / Berkas Persyaratan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Anda dapat mengambil foto langsung menggunakan kamera HP atau memilih foto dari galeri.
            </p>
          </div>

          <div className="space-y-3">
            {selectedLayanan.persyaratan.map((p) => {
              const fileUploaded = uploadedFiles[p.id];
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition-all ${
                    fileUploaded
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : p.wajib
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900">
                          {p.nama}
                        </span>
                        {p.wajib ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            Wajib
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Opsional
                          </span>
                        )}
                      </div>

                      {fileUploaded ? (
                        <div className="mt-1 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[200px]">{fileUploaded.fileName}</span>
                          <span className="font-mono text-[11px] text-emerald-700">({fileUploaded.fileSize})</span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Belum ada foto/berkas yang diunggah.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveUploadReq(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          fileUploaded
                            ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            : 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{fileUploaded ? 'Ganti Foto' : 'Ambil Foto / Pilih File'}</span>
                      </button>

                      {fileUploaded && (
                        <button
                          type="button"
                          onClick={() => {
                            const copy = { ...uploadedFiles };
                            delete copy[p.id];
                            setUploadedFiles(copy);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Hapus berkas"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              type="button"
              onClick={handleNextStep3}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>Lanjut Cek Ringkasan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CEK & KIRIM */}
      {step === 4 && selectedLayanan && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Periksa Kembali Permohonan Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pastikan seluruh informasi dan berkas sudah benar sebelum dikirimkan ke Kantor Kecamatan Pulung.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-500">Nama Pemohon:</span>
              <span className="font-bold text-slate-900 uppercase">{namaWarga}</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-500">NIK:</span>
              <span className="font-mono text-slate-800">{nik}</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-500">Desa Asal:</span>
              <span className="font-semibold text-slate-800">
                Desa {daftarDesa.find((d) => d.id === desaId)?.nama || 'Pulung'}
              </span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-500">Layanan:</span>
              <span className="font-semibold text-emerald-900 text-right">
                {selectedLayanan.nama}
              </span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-500">Estimasi Selesai:</span>
              <span className="text-slate-800">{selectedLayanan.estimasiHari} hari kerja</span>
            </div>
            <div className="p-3.5">
              <span className="text-slate-500 block mb-1">Keperluan:</span>
              <p className="font-medium text-slate-800 bg-slate-50 p-2 rounded-lg italic">
                "{keperluan}"
              </p>
            </div>
            <div className="p-3.5">
              <span className="text-slate-500 block mb-1.5">Berkas yang Dilampirkan:</span>
              <ul className="space-y-1">
                {Object.entries(uploadedFiles).map(([pId, f]) => {
                  const p = selectedLayanan.persyaratan.find((item) => item.id === pId);
                  return (
                    <li key={pId} className="flex items-center gap-2 text-emerald-800 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p ? p.nama : f.fileName}</span>
                      <span className="text-[11px] font-mono text-slate-400">({f.fileSize})</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-7 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? (submitProgress || 'Mengirim...') : 'Kirim Permohonan Sekarang'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Camera / Upload Modal */}
      {activeUploadReq && (
        <CameraCaptureModal
          persyaratanNama={activeUploadReq.nama}
          onCapture={(fileData) => {
            setUploadedFiles((prev) => ({
              ...prev,
              [activeUploadReq.id]: fileData,
            }));
          }}
          onClose={() => setActiveUploadReq(null)}
        />
      )}
    </div>
  );
};
