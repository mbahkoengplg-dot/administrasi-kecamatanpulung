import React, { useRef } from 'react';
import { Pengajuan, Warga } from '../types';
import { KopSuratKecamatan } from './KopSuratKecamatan';
import { QRCodeSvg } from '../utils/qrGenerator';
import { maskNik } from '../utils/nikValidator';
import { getStoredSettings } from '../utils/storage';
import { Printer, Download, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface SuratTemplateProps {
  pengajuan: Pengajuan;
  warga?: Warga | null;
  onClose: () => void;
}

export const SuratTemplate: React.FC<SuratTemplateProps> = ({
  pengajuan,
  warga,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const settings = getStoredSettings();

  const handlePrint = () => {
    window.print();
  };

  const nomorSurat = pengajuan.nomorSurat || '470/118/405.29/2026';
  const tanggalTerbit = pengajuan.tanggalTerbit || new Date().toISOString().split('T')[0];
  const dateFormatted = new Date(tanggalTerbit).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const verificationUrl = `${window.location.origin}/?tab=verifikasi&kode=${pengajuan.kode}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
              Pratinjau Dokumen Resmi
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
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

        {/* Official Letter Paper */}
        <div className="overflow-x-auto max-h-[80vh] print:max-h-none print:overflow-visible">
          <div
            ref={printRef}
            className="p-5 sm:p-10 md:p-12 text-slate-900 bg-white font-serif leading-relaxed text-[14px] sm:text-[15px] select-text min-w-[320px]"
          >
          {/* Header Kop Surat Resmi Kecamatan Pulung */}
          <KopSuratKecamatan />

          {/* Letter Title */}
          <div className="text-center mb-6">
            <h4 className="text-base sm:text-lg font-bold uppercase underline decoration-1 underline-offset-4 tracking-wide font-sans">
              {pengajuan.layananNama}
            </h4>
            <p className="text-xs font-mono font-medium text-slate-700 mt-1">
              Nomor: {nomorSurat}
            </p>
          </div>

          {/* Opening Body */}
          <div className="space-y-4 text-justify font-sans text-sm sm:text-[14px]">
            <p>
              Yang bertanda tangan di bawah ini, Camat Pulung Kabupaten Ponorogo, dengan ini menerangkan bahwa:
            </p>

            <table className="w-full text-xs sm:text-sm my-2 border-collapse">
              <tbody>
                <tr>
                  <td className="w-40 py-1 font-medium text-slate-700">Nama Lengkap</td>
                  <td className="w-4 py-1">:</td>
                  <td className="py-1 font-semibold uppercase text-slate-900">{pengajuan.namaWarga}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-slate-700">Nomor Induk Kependudukan (NIK)</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-mono">{pengajuan.nik}</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-slate-700">Desa / Kelurahan</td>
                  <td className="py-1">:</td>
                  <td className="py-1">Desa {pengajuan.desaNama}, Kec. Pulung</td>
                </tr>
                {warga?.alamat && (
                  <tr>
                    <td className="py-1 font-medium text-slate-700">Alamat Tempat Tinggal</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{warga.alamat}</td>
                  </tr>
                )}
                {warga?.tglLahir && (
                  <tr>
                    <td className="py-1 font-medium text-slate-700">Tanggal Lahir</td>
                    <td className="py-1">:</td>
                    <td className="py-1">
                      {new Date(warga.tglLahir).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 font-medium text-slate-700">Keperluan / Keterangan</td>
                  <td className="py-1">:</td>
                  <td className="py-1 italic text-slate-800">
                    {pengajuan.keperluan || 'Pengurusan administrasi kependudukan / pelayanan masyarakat.'}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="indent-6 leading-relaxed">
              Berdasarkan catatan register kependudukan Kecamatan Pulung serta surat pengantar dari Kepala Desa {pengajuan.desaNama}, nama tersebut di atas adalah benar warga penduduk Desa {pengajuan.desaNama}, Kecamatan Pulung, Kabupaten Ponorogo, dan berstatus aktif.
            </p>

            <p className="indent-6 leading-relaxed">
              Demikian surat keterangan ini diberikan kepada yang bersangkutan untuk dapat dipergunakan sebagaimana mestinya dan penuh tanggung jawab.
            </p>
          </div>

          {/* Signature and Verification QR */}
          <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100 font-sans">
            {/* QR Code Verification */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <QRCodeSvg value={verificationUrl} size={90} includeMargin={false} />
              <div className="text-[11px] text-slate-600 leading-tight max-w-[200px]">
                <div className="flex items-center gap-1 font-bold text-emerald-800 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>TERVERIFIKASI RESMI</span>
                </div>
                <span>Dokumen sah Kantor Kecamatan Pulung. Pindai QR untuk memeriksa validitas surat.</span>
                <div className="mt-1 font-mono text-[9px] text-slate-500">
                  Ref: {pengajuan.kode}
                </div>
              </div>
            </div>

            {/* Officer Signature Block */}
            <div className="text-center sm:text-right text-xs">
              <p className="text-slate-700">Pulung, {dateFormatted}</p>
              <p className="font-bold text-slate-900 mt-1 uppercase">
                a.n. BUPATI PONOROGO<br />{settings.jabatanCamat}
              </p>

              {/* Digital Stamp Simulation */}
              <div className="my-2 flex justify-center sm:justify-end">
                <div className="relative border-2 border-emerald-800 text-emerald-900 rounded-md px-3 py-1 font-bold text-[10px] tracking-widest uppercase bg-emerald-50/50">
                  <span>DITANDATANGANI SECARA ELEKTRONIK</span>
                  <div className="text-[9px] font-normal tracking-normal text-emerald-950">
                    Sistem Layanan Mandiri {settings.namaKecamatan}
                  </div>
                </div>
              </div>

              <p className="font-bold text-slate-900 underline underline-offset-2 uppercase text-sm mt-2">
                {pengajuan.namaPejabat || settings.namaCamat}
              </p>
              <p className="text-slate-600 font-mono text-[11px]">
                NIP. {pengajuan.nipPejabat || settings.nipCamat}
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Kode Registrasi: <strong className="font-mono text-slate-700">{pengajuan.kode}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
