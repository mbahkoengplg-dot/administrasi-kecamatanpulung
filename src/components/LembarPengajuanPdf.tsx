import React, { useRef } from 'react';
import { Pengajuan, Warga } from '../types';
import { KopSuratKecamatan } from './KopSuratKecamatan';
import { QRCodeSvg } from '../utils/qrGenerator';
import { getStoredSettings } from '../utils/storage';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface LembarPengajuanPdfProps {
  pengajuan: Pengajuan;
  warga?: Warga | null;
  onClose: () => void;
}

export const LembarPengajuanPdf: React.FC<LembarPengajuanPdfProps> = ({
  pengajuan,
  warga,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const settings = getStoredSettings();

  const handlePrint = () => {
    window.print();
  };

  const verificationUrl = `${window.location.origin}/?tab=verifikasi&kode=${pengajuan.kode}`;
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-slate-800 text-xs sm:text-sm block truncate">
                Lembar Pengajuan &amp; Disposisi (PDF)
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Dokumen resmi KOP Kecamatan Pulung untuk arsip &amp; tanda terima
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Letter Paper with Official KOP */}
        <div className="overflow-x-auto max-h-[80vh] print:max-h-none print:overflow-visible">
          <div
            ref={printRef}
            className="p-4 sm:p-8 md:p-12 text-slate-900 bg-white font-sans leading-relaxed text-xs select-text print:p-6 min-w-[320px]"
          >
          {/* OFFICIAL KOP SURAT KECAMATAN PULUNG */}
          <KopSuratKecamatan />

          {/* Judul Lembar */}
          <div className="text-center mb-6">
            <h4 className="text-base sm:text-lg font-black uppercase underline decoration-1 underline-offset-4 tracking-wide text-slate-900">
              Lembar Registrasi &amp; Disposisi Pelayanan Administrasi
            </h4>
            <p className="text-xs font-mono font-bold text-emerald-950 mt-1">
              Nomor Berkas: {pengajuan.kode}
            </p>
            <span className="text-[11px] text-slate-500">
              Jalur Pengajuan: <strong>{pengajuan.jalur === 'desa' ? `Petugas Desa ${pengajuan.desaNama}` : 'Mandiri (Daring)'}</strong>
            </span>
          </div>

          {/* Section 1: Data Identitas Pemohon */}
          <div className="mb-4">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              I. Data Identitas Pemohon
            </h5>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr>
                  <td className="w-44 py-1 text-slate-600 font-medium">Nama Lengkap Pemohon</td>
                  <td className="w-4 py-1">:</td>
                  <td className="py-1 font-bold text-slate-950 uppercase">{pengajuan.namaWarga}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600 font-medium">Nomor Induk Kependudukan (NIK)</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-mono font-bold text-slate-900">{pengajuan.nik}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600 font-medium">Desa Domisili</td>
                  <td className="py-1">:</td>
                  <td className="py-1">Desa {pengajuan.desaNama}, Kecamatan Pulung</td>
                </tr>
                {warga?.alamat && (
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Alamat Tempat Tinggal</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{warga.alamat}</td>
                  </tr>
                )}
                {warga?.noHp && (
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Nomor Kontak / WhatsApp</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-mono">{warga.noHp}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Section 2: Informasi Layanan Dimohon */}
          <div className="mb-4">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              II. Rincian Permohonan Layanan
            </h5>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr>
                  <td className="w-44 py-1 text-slate-600 font-medium">Jenis Layanan Dimohon</td>
                  <td className="w-4 py-1">:</td>
                  <td className="py-1 font-bold text-emerald-950">{pengajuan.layananNama}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600 font-medium">Kategori</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{pengajuan.kategoriLayanan}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600 font-medium">Tanggal Diajukan</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{new Date(pengajuan.dibuatPada).toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600 font-medium">Status Berkas Saat Ini</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-bold text-slate-900 uppercase">{pengajuan.status}</td>
                </tr>
                {pengajuan.nomorSurat && (
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Nomor Surat Resmi Terbit</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-mono font-bold text-emerald-900">{pengajuan.nomorSurat}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 text-slate-600 font-medium">Keperluan / Keterangan</td>
                  <td className="py-1">:</td>
                  <td className="py-1 italic text-slate-800">
                    "{pengajuan.keperluan || 'Pengurusan administrasi kependudukan di Kecamatan Pulung'}"
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Kelengkapan Berkas */}
          <div className="mb-4">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              III. Daftar Berkas &amp; Dokumen Terlampir ({pengajuan.berkas.length} Berkas)
            </h5>
            <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700">
                  <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-300 p-1.5">Nama Dokumen Persyaratan</th>
                  <th className="border border-slate-300 p-1.5">Nama File Dokumen</th>
                  <th className="border border-slate-300 p-1.5 text-center">Ukuran</th>
                  <th className="border border-slate-300 p-1.5 text-center">Status Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {pengajuan.berkas.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-300 p-1.5 font-medium">{b.namaDokumen}</td>
                    <td className="border border-slate-300 p-1.5 font-mono text-slate-600">{b.fileName}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono">{b.fileSize}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-800">
                      Lengkap / Sah
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Catatan Riwayat Disposisi */}
          <div className="mb-6">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              IV. Catatan Disposisi &amp; Riwayat Verifikasi Petugas
            </h5>
            <div className="space-y-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-3">
              {pengajuan.riwayat.map((r, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900">[{r.status}]</span>{' '}
                    <span className="text-slate-700">{r.catatan}</span>{' '}
                    <span className="text-slate-500 font-italic">(Oleh: {r.oleh})</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {new Date(r.waktu).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Signature & Verification QR */}
          <div className="flex justify-between items-end pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <QRCodeSvg value={verificationUrl} size={80} includeMargin={false} />
              <div className="text-[10px] text-slate-600 leading-tight max-w-[200px]">
                <div className="font-bold text-emerald-900 mb-0.5">SISTEM PATEN KEC. PULUNG</div>
                <span>Pindai QR Code untuk memeriksa keaslian dan status verifikasi berkas ini.</span>
                <div className="font-mono text-[9px] text-slate-500 mt-1">Ref: {pengajuan.kode}</div>
              </div>
            </div>

            <div className="text-center text-xs">
              <p className="text-slate-700">Pulung, {todayFormatted}</p>
              <p className="font-bold text-slate-900 mt-0.5 uppercase">
                PETUGAS VERIFIKATOR KECAMATAN
              </p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  [ Tanda Tangan Digital Terverifikasi ]
                </span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-2 uppercase">
                {settings.namaAdmin}
              </p>
              <p className="text-slate-600 font-mono text-[10px]">
                NIP. {settings.nipAdmin}
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* Modal Footer (hidden when printing) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Kode Berkas: <strong className="font-mono text-slate-700">{pengajuan.kode}</strong></span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 font-bold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
