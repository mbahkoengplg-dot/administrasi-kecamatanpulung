import React from 'react';
import { LogoKecamatan } from './LogoKecamatan';
import { getStoredSettings } from '../utils/storage';

interface KopSuratKecamatanProps {
  className?: string;
  subTitle?: string;
}

export const KopSuratKecamatan: React.FC<KopSuratKecamatanProps> = ({
  className = '',
  subTitle = 'Sistem Informasi Pelayanan Administrasi Terpadu Kecamatan (PATEN)',
}) => {
  const settings = getStoredSettings();

  return (
    <div className={`w-full text-slate-950 select-text pb-2 mb-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Lambang Daerah Kabupaten Ponorogo Resmi */}
        <div className="w-20 shrink-0 flex items-center justify-center">
          <LogoKecamatan size={74} />
        </div>

        {/* Text Header Kedinasan */}
        <div className="flex-1 text-center font-serif leading-tight">
          <h3 className="text-base sm:text-lg font-bold tracking-widest uppercase text-slate-900 font-sans">
            {settings.namaKabupaten}
          </h3>
          <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-emerald-950 font-sans mt-0.5">
            {settings.namaKecamatan}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-700 mt-1 font-sans">
            {settings.alamatKantor}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 font-sans">
            Telepon: {settings.telepon} · Faksimile: {settings.faksimile} · Surel: <em>{settings.emailResmi}</em>
          </p>
          <p className="text-[10px] text-emerald-900 font-semibold font-sans mt-0.5">
            Laman Resmi: <em>{settings.websiteResmi}</em>
          </p>
        </div>

        {/* Spacer for symmetry */}
        <div className="w-20 hidden sm:block shrink-0" />
      </div>

      {/* Official Government Double Border Line (Dual line thick & thin) */}
      <div className="w-full mt-3">
        <div className="border-t-[3.5px] border-slate-950 w-full" />
        <div className="border-t-[1px] border-slate-950 w-full mt-[2px]" />
      </div>
    </div>
  );
};
