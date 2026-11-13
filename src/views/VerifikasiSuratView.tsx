import React from 'react';
import { Pengajuan } from '../types';
import { SuratTemplate } from '../components/SuratTemplate';
import { LogoKecamatan } from '../components/LogoKecamatan';
import { ShieldCheck, CheckCircle2, Building2, Calendar, FileText, ArrowLeft, Printer } from 'lucide-react';

interface VerifikasiSuratViewProps {
  pengajuan: Pengajuan;
  onBack: () => void;
}

export const VerifikasiSuratView: React.FC<VerifikasiSuratViewProps> = ({
  pengajuan,
  onBack,
}) => {
  const [showFullLetter, setShowFullLetter] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-emerald-900 text-white p-6 text-center">
          <div className="flex items-center justify-center mx-auto mb-3">
            <LogoKecamatan size={64} />
          </div>
          <span className="text-[11px] font-bold tracking-widest text-emerald-300 uppercase block">
            Pemerintah Kabupaten Ponorogo
          </span>
          <h1 className="text-xl font-black text-white mt-0.5">
            Verifikasi Keaslian Dokumen
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            Kecamatan Pulung · Sistem Pelayanan Administrasi
          </p>
        </div>

        {/* Status Verification Badge */}
        <div className="p-6 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <div className="inline-flex items-center gap-1.5 text-emerald-800 font-extrabold text-sm mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>DOKUMEN RESMI &amp; TERVERIFIKASI</span>
            </div>
            <p className="text-xs text-emerald-900/80">
              Dokumen ini tercatat sah dalam basis data Kantor Kecamatan Pulung.
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl text-xs">
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Nomor Registrasi Surat:</span>
              <span className="font-mono font-bold text-slate-900">{pengajuan.nomorSurat || '470/118/405.29/2026'}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Kode Pengajuan:</span>
              <span className="font-mono text-slate-700">{pengajuan.kode}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Jenis Layanan:</span>
              <span className="font-bold text-slate-900 text-right">{pengajuan.layananNama}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Nama Pemohon:</span>
              <span className="font-semibold uppercase text-slate-800">
                {pengajuan.namaWarga.substring(0, 3)}*** (Disamarkan)
              </span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Desa Domisili:</span>
              <span className="text-slate-800">Desa {pengajuan.desaNama}, Kec. Pulung</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Tanggal Pengesahan:</span>
              <span className="text-slate-800">
                {pengajuan.tanggalTerbit
                  ? new Date(pengajuan.tanggalTerbit).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : new Date().toLocaleDateString('id-ID')}
              </span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Penandatangan:</span>
              <span className="font-bold text-emerald-950">
                {pengajuan.namaPejabat || 'Camat Pulung'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setShowFullLetter(true)}
              className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Buka Dokumen Resmi Lengkap</span>
            </button>
            <button
              onClick={onBack}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>

      {showFullLetter && (
        <SuratTemplate
          pengajuan={pengajuan}
          onClose={() => setShowFullLetter(false)}
        />
      )}
    </div>
  );
};
