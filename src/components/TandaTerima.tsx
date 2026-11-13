import React from 'react';
import { Pengajuan } from '../types';
import { LogoKecamatan } from './LogoKecamatan';
import { QRCodeSvg } from '../utils/qrGenerator';
import { getStoredSettings } from '../utils/storage';
import { Printer, X, CheckCircle, FileText } from 'lucide-react';

interface TandaTerimaProps {
  pengajuan: Pengajuan;
  onClose: () => void;
}

export const TandaTerima: React.FC<TandaTerimaProps> = ({ pengajuan, onClose }) => {
  const settings = getStoredSettings();
  const handlePrint = () => {
    window.print();
  };

  const verificationUrl = `${window.location.origin}/?tab=verifikasi&kode=${pengajuan.kode}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <FileText className="w-4 h-4" />
            <span>Tanda Terima Pengajuan Layanan</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Tanda Terima
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Receipt */}
        <div className="p-6 text-slate-900">
          <div className="text-center pb-4 border-b border-slate-200 mb-4">
            <div className="flex justify-center mb-1.5">
              <LogoKecamatan size={44} />
            </div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              KANTOR {settings.namaKecamatan}
            </div>
            <h2 className="text-lg font-extrabold text-emerald-950 uppercase">
              Tanda Terima Berkas Pelayanan
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Jalur: <span className="font-semibold text-slate-800">{pengajuan.jalur === 'desa' ? `Petugas Desa ${pengajuan.desaNama}` : 'Mandiri (Warga)'}</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3.5 text-center mb-5">
            <div className="text-xs text-emerald-900 font-medium">KODE PENGAJUAN ANDA:</div>
            <div className="font-mono text-2xl font-extrabold text-emerald-950 tracking-wider my-1">
              {pengajuan.kode}
            </div>
            <div className="text-[11px] text-emerald-800">
              Simpan kode ini untuk mengecek status permohonan surat Anda.
            </div>
          </div>

          <div className="space-y-2 text-xs border-y border-dashed border-slate-300 py-3 mb-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Pemohon:</span>
              <span className="font-semibold uppercase text-slate-800">{pengajuan.namaWarga}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">NIK:</span>
              <span className="font-mono text-slate-800">{pengajuan.nik}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Layanan:</span>
              <span className="font-semibold text-right text-slate-900">{pengajuan.layananNama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Asal Desa:</span>
              <span className="text-slate-800">Desa {pengajuan.desaNama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tanggal Diajukan:</span>
              <span className="text-slate-800">{new Date(pengajuan.dibuatPada).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jumlah Berkas:</span>
              <span className="font-medium text-slate-800">{pengajuan.berkas.length} berkas terlampir</span>
            </div>
          </div>

          {/* QR Code and Instructions */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <QRCodeSvg value={verificationUrl} size={76} includeMargin={false} />
            <div className="text-[11px] text-slate-600 leading-tight">
              <div className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pindai untuk Pantau Status</span>
              </div>
              <p>
                Arahkan kamera HP ke QR Code di samping untuk melihat progres verifikasi dan mengunduh surat saat selesai.
              </p>
              <p className="mt-1 font-medium text-emerald-900">
                Pusat Bantuan WA: {settings.whatsappBantuan}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
