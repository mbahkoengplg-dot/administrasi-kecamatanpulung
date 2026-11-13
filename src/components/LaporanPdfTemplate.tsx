import React, { useRef } from 'react';
import { Desa, Layanan, Pengajuan } from '../types';
import { KopSuratKecamatan } from './KopSuratKecamatan';
import { getStoredSettings } from '../utils/storage';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface LaporanPdfTemplateProps {
  pengajuanList: Pengajuan[];
  daftarLayanan: Layanan[];
  daftarDesa: Desa[];
  desaFilter?: string; // 'Semua' or desaId/nama
  customTitle?: string;
  onClose: () => void;
}

export const LaporanPdfTemplate: React.FC<LaporanPdfTemplateProps> = ({
  pengajuanList,
  daftarLayanan,
  daftarDesa,
  desaFilter = 'Semua',
  customTitle,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const settings = getStoredSettings();

  const handlePrint = () => {
    window.print();
  };

  // Filtered data based on selected filter
  const displayedList = desaFilter === 'Semua'
    ? pengajuanList
    : pengajuanList.filter((p) => p.desaId === desaFilter || p.desaNama === desaFilter);

  // Statistics calculation
  const total = displayedList.length;
  const selesai = displayedList.filter((p) => p.status === 'Selesai').length;
  const diproses = displayedList.filter((p) => p.status === 'Diproses' || p.status === 'Diverifikasi').length;
  const diajukan = displayedList.filter((p) => p.status === 'Diajukan').length;
  const perluPerbaikan = displayedList.filter((p) => p.status === 'Perlu Perbaikan').length;
  const ditolak = displayedList.filter((p) => p.status === 'Ditolak').length;

  const jalurDesa = displayedList.filter((p) => p.jalur === 'desa').length;
  const jalurMandiri = displayedList.filter((p) => p.jalur === 'mandiri').length;

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800" />
            <div>
              <span className="font-bold text-slate-800 text-sm">
                Pratinjau Ekspor Dokumen Laporan (PDF)
              </span>
              <p className="text-xs text-slate-500">
                Laporan resmi siap dicetak atau disimpan sebagai PDF (Ctrl+P / Command+P)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
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

        {/* Printable Official Government Report */}
        <div
          ref={printRef}
          className="p-8 sm:p-12 text-slate-900 bg-white font-sans leading-normal text-xs select-text print:p-6"
        >
          {/* Header Kop Surat Resmi Kecamatan Pulung */}
          <KopSuratKecamatan />

          {/* Report Title */}
          <div className="text-center mb-6">
            <h4 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900">
              {customTitle || 'Laporan Rekapitulasi Pelayanan Administrasi'}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Wilayah: <strong>{desaFilter === 'Semua' ? 'Seluruh Desa se-Kecamatan Pulung (18 Desa)' : `Desa ${desaFilter}`}</strong> · Dicetak Pada: <strong>{todayFormatted}</strong>
            </p>
          </div>

          {/* 1. Ringkasan Eksekutif */}
          <div className="mb-6">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              I. Ringkasan Total Pelayanan
            </h5>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                <span className="text-[10px] text-slate-500 font-semibold block">TOTAL BERKAS</span>
                <span className="text-lg font-extrabold font-mono text-slate-900">{total}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50">
                <span className="text-[10px] text-emerald-800 font-semibold block">SELESAI</span>
                <span className="text-lg font-extrabold font-mono text-emerald-700">{selesai}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50/50">
                <span className="text-[10px] text-amber-800 font-semibold block">DIPROSES</span>
                <span className="text-lg font-extrabold font-mono text-amber-700">{diproses}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-sky-300 bg-sky-50/50">
                <span className="text-[10px] text-sky-800 font-semibold block">DIAJUKAN</span>
                <span className="text-lg font-extrabold font-mono text-sky-700">{diajukan}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50/50">
                <span className="text-[10px] text-rose-800 font-semibold block">PERBAIKAN</span>
                <span className="text-lg font-extrabold font-mono text-rose-700">{perluPerbaikan}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                <span className="text-[10px] text-slate-500 font-semibold block">JALUR DESA:MANDIRI</span>
                <span className="text-base font-extrabold font-mono text-slate-800">{jalurDesa} : {jalurMandiri}</span>
              </div>
            </div>
          </div>

          {/* 2. Rincian Per Kategori Layanan */}
          <div className="mb-6">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              II. Rincian Pelayanan Menurut Jenis Dokumen
            </h5>
            <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold">
                  <th className="border border-slate-300 p-2 text-center w-10">No</th>
                  <th className="border border-slate-300 p-2">Kategori &amp; Nama Layanan</th>
                  <th className="border border-slate-300 p-2 text-center w-24">Estimasi Hari</th>
                  <th className="border border-slate-300 p-2 text-center w-20">Jalur Desa</th>
                  <th className="border border-slate-300 p-2 text-center w-20">Jalur Mandiri</th>
                  <th className="border border-slate-300 p-2 text-center w-20">Total Berkas</th>
                </tr>
              </thead>
              <tbody>
                {daftarLayanan.map((lay, idx) => {
                  const filteredThisLay = displayedList.filter((p) => p.layananId === lay.id);
                  const desaCount = filteredThisLay.filter((p) => p.jalur === 'desa').length;
                  const mandiriCount = filteredThisLay.filter((p) => p.jalur === 'mandiri').length;
                  return (
                    <tr key={lay.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-2">
                        <span className="font-bold text-slate-900 block">{lay.nama}</span>
                        <span className="text-[10px] text-slate-500">{lay.kategori}</span>
                      </td>
                      <td className="border border-slate-300 p-2 text-center">{lay.estimasiHari} hari</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{desaCount}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{mandiriCount}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold text-slate-900">
                        {filteredThisLay.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 3. Daftar Detail Pengajuan Terkini */}
          <div className="mb-8">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              III. Register Berkas Pengajuan
            </h5>
            <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold">
                  <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                  <th className="border border-slate-300 p-1.5">Kode Pengajuan</th>
                  <th className="border border-slate-300 p-1.5">Nama Pemohon &amp; NIK</th>
                  <th className="border border-slate-300 p-1.5">Jenis Layanan</th>
                  <th className="border border-slate-300 p-1.5">Asal Desa</th>
                  <th className="border border-slate-300 p-1.5 text-center">Jalur</th>
                  <th className="border border-slate-300 p-1.5 text-center">Status</th>
                  <th className="border border-slate-300 p-1.5">Nomor Surat Resmi</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.map((item, idx) => (
                  <tr key={item.kode} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-300 p-1.5 font-mono font-bold text-slate-800">
                      {item.kode}
                    </td>
                    <td className="border border-slate-300 p-1.5">
                      <span className="font-bold text-slate-900 block uppercase">{item.namaWarga}</span>
                      <span className="font-mono text-[9px] text-slate-500">{item.nik}</span>
                    </td>
                    <td className="border border-slate-300 p-1.5">{item.layananNama}</td>
                    <td className="border border-slate-300 p-1.5">Desa {item.desaNama}</td>
                    <td className="border border-slate-300 p-1.5 text-center">
                      <span className="font-semibold uppercase text-[9px]">{item.jalur}</span>
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold">
                      {item.status}
                    </td>
                    <td className="border border-slate-300 p-1.5 font-mono text-[9px] text-slate-800">
                      {item.nomorSurat || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bagian Pengesahan / Tanda Tangan Pejabat */}
          <div className="flex justify-between items-end pt-4 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
              Catatan:<br />
              Dokumen laporan ini dihasilkan otomatis oleh Sistem Pelayanan Terpadu Daring Kecamatan Pulung, Kabupaten Ponorogo.
            </div>

            <div className="text-center text-xs">
              <p className="text-slate-700">Pulung, {todayFormatted}</p>
              <p className="font-bold text-slate-900 mt-0.5 uppercase">
                {settings.jabatanCamat}
              </p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  [ Tanda Tangan &amp; Cap Terlampir ]
                </span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-2 uppercase">
                {settings.namaCamat}
              </p>
              <p className="text-slate-600 font-mono text-[10px]">
                {settings.pangkatCamat} · NIP. {settings.nipCamat}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden when printing) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Format: Dokumen Laporan Resmi A4</span>
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
