import { Desa, Layanan, Pengajuan, UserAccount, Warga } from '../types';

export const DAFTAR_DESA_PULUNG: Desa[] = [
  { id: 'desa-01', nama: 'Pulung', kodePos: '63492', alamatKantor: 'Jl. Raya Pulung No. 12' },
  { id: 'desa-02', nama: 'Banaran', kodePos: '63492', alamatKantor: 'Jl. Desa Banaran No. 05' },
  { id: 'desa-03', nama: 'Bedrug', kodePos: '63492', alamatKantor: 'Jl. Balai Desa Bedrug' },
  { id: 'desa-04', nama: 'Bekiring', kodePos: '63492', alamatKantor: 'Jl. Raya Bekiring' },
  { id: 'desa-05', nama: 'Karangpatihan', kodePos: '63492', alamatKantor: 'Jl. Desa Karangpatihan No. 03' },
  { id: 'desa-06', nama: 'Kesugihan', kodePos: '63492', alamatKantor: 'Jl. Balai Desa Kesugihan' },
  { id: 'desa-07', nama: 'Munggung', kodePos: '63492', alamatKantor: 'Jl. Desa Munggung' },
  { id: 'desa-08', nama: 'Patik', kodePos: '63492', alamatKantor: 'Jl. Balai Desa Patik' },
  { id: 'desa-09', nama: 'Plunturan', kodePos: '63492', alamatKantor: 'Jl. Reyog Budaya Plunturan' },
  { id: 'desa-10', nama: 'Pomahan', kodePos: '63492', alamatKantor: 'Jl. Balai Desa Pomahan' },
  { id: 'desa-11', nama: 'Serag', kodePos: '63492', alamatKantor: 'Jl. Desa Serag' },
  { id: 'desa-12', nama: 'Sidoharjo', kodePos: '63492', alamatKantor: 'Jl. Balai Desa Sidoharjo' },
  { id: 'desa-13', nama: 'Singgahan', kodePos: '63492', alamatKantor: 'Jl. Air Terjun Singgahan' },
  { id: 'desa-14', nama: 'Turlan', kodePos: '63492', alamatKantor: 'Jl. Balai Desa Turlan' },
  { id: 'desa-15', nama: 'Wagir Kidul', kodePos: '63492', alamatKantor: 'Jl. Raya Wagir Kidul' },
  { id: 'desa-16', nama: 'Wayang', kodePos: '63492', alamatKantor: 'Jl. Balai Desa Wayang' },
  { id: 'desa-17', nama: 'Wotan', kodePos: '63492', alamatKantor: 'Jl. Desa Wotan' },
  { id: 'desa-18', nama: 'Wates', kodePos: '63492', alamatKantor: 'Jl. Lingkar Wates Pulung' },
];

export const MASTER_LAYANAN: Layanan[] = [
  {
    id: 'layanan-01',
    kategori: 'Pengantar Administrasi Kependudukan',
    nama: 'Pengantar KTP-el & Kartu Keluarga (KK)',
    deskripsi: 'Pengurusan pengantar pembuatan KTP Elektronik baru/rusak/hilang dan perubahan data Kartu Keluarga ke Disdukcapil.',
    estimasiHari: 1,
    aktif: true,
    kodeSuratPrefix: '470',
    persyaratan: [
      { id: 'p1', nama: 'Foto Kartu Keluarga (KK) Asli / Lama', wajib: true },
      { id: 'p2', nama: 'Surat Pengantar RT / Balai Desa', wajib: true },
      { id: 'p3', nama: 'Surat Kehilangan dari Polsek (Bila KTP/KK Hilang)', wajib: false },
    ],
  },
  {
    id: 'layanan-02',
    kategori: 'Surat Keterangan',
    nama: 'Surat Keterangan Domisili',
    deskripsi: 'Surat resmi yang menerangkan bahwa warga berdomisili atau tinggal di wilayah Kecamatan Pulung.',
    estimasiHari: 1,
    aktif: true,
    kodeSuratPrefix: '474',
    persyaratan: [
      { id: 'p1', nama: 'Foto KTP Pemohon', wajib: true },
      { id: 'p2', nama: 'Foto Kartu Keluarga', wajib: true },
      { id: 'p3', nama: 'Surat Keterangan Domisili dari Desa', wajib: true },
    ],
  },
  {
    id: 'layanan-03',
    kategori: 'Surat Keterangan',
    nama: 'Surat Keterangan Usaha (SKU)',
    deskripsi: 'Keterangan kepemilikan usaha mikro/kecil untuk keperluan perbankan, KUR, atau perizinan usaha.',
    estimasiHari: 2,
    aktif: true,
    kodeSuratPrefix: '510',
    persyaratan: [
      { id: 'p1', nama: 'Foto KTP Pemilik Usaha', wajib: true },
      { id: 'p2', nama: 'Foto Kartu Keluarga', wajib: true },
      { id: 'p3', nama: 'Surat Pengantar Usaha dari Desa', wajib: true },
      { id: 'p4', nama: 'Foto Tempat / Aktivitas Usaha', wajib: true },
    ],
  },
  {
    id: 'layanan-04',
    kategori: 'Surat Keterangan',
    nama: 'Surat Keterangan Tidak Mampu (SKTM)',
    deskripsi: 'Keterangan untuk keringanan biaya pengobatan, BPJS, beasiswa pendidikan, atau bantuan sosial.',
    estimasiHari: 1,
    aktif: true,
    kodeSuratPrefix: '401',
    persyaratan: [
      { id: 'p1', nama: 'Foto KTP Pemohon / Orang Tua', wajib: true },
      { id: 'p2', nama: 'Foto Kartu Keluarga', wajib: true },
      { id: 'p3', nama: 'Surat Keterangan Tidak Mampu dari Desa', wajib: true },
      { id: 'p4', nama: 'Foto Rumah Tinggal Tampak Depan', wajib: false },
    ],
  },
  {
    id: 'layanan-05',
    kategori: 'Surat Rekomendasi',
    nama: 'Surat Rekomendasi Izin Keramaian',
    deskripsi: 'Rekomendasi kegiatan hajatan, hiburan rakyat, reyog Ponorogo, atau pentas seni ke Polsek Pulung.',
    estimasiHari: 2,
    aktif: true,
    kodeSuratPrefix: '331',
    persyaratan: [
      { id: 'p1', nama: 'Foto KTP Penanggung Jawab Kegiatan', wajib: true },
      { id: 'p2', nama: 'Surat Izin / Pengantar dari Kepala Desa', wajib: true },
      { id: 'p3', nama: 'Surat Pernyataan Keamanan bermaterai', wajib: true },
    ],
  },
  {
    id: 'layanan-06',
    kategori: 'Pengantar Pernikahan',
    nama: 'Pengantar Nikah (Model N1-N4 ke KUA)',
    deskripsi: 'Pemeriksaan berkas dan rekomendasi pengantar pernikahan atau rujuk menuju Kantor Urusan Agama (KUA).',
    estimasiHari: 2,
    aktif: true,
    kodeSuratPrefix: '474.2',
    persyaratan: [
      { id: 'p1', nama: 'Foto KTP Calon Pengantin Laki-laki & Perempuan', wajib: true },
      { id: 'p2', nama: 'Foto KK Kedua Calon Pengantin', wajib: true },
      { id: 'p3', nama: 'Formulir N1 - N4 yang ditandatangani Kades', wajib: true },
      { id: 'p4', nama: 'Akta Kelahiran / Ijazah Calon', wajib: true },
    ],
  },
  {
    id: 'layanan-07',
    kategori: 'Pertanahan',
    nama: 'Surat Keterangan Waris & Riwayat Tanah',
    deskripsi: 'Surat pengesahan susunan ahli waris atau keterangan riwayat kepemilikan tanah untuk PTSL/BPN.',
    estimasiHari: 3,
    aktif: true,
    kodeSuratPrefix: '593',
    persyaratan: [
      { id: 'p1', nama: 'Foto KTP Seluruh Ahli Waris', wajib: true },
      { id: 'p2', nama: 'Surat Kematian Pewaris dari Desa', wajib: true },
      { id: 'p3', nama: 'Bagan Silsilah Waris disahkan Kepala Desa', wajib: true },
      { id: 'p4', nama: 'Bukti SPPT PBB Tanah Terbaru', wajib: true },
    ],
  },
];

export const INITIAL_PETUGAS_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-admin',
    nama: 'Admin Kecamatan Pulung',
    username: 'admin',
    role: 'admin',
    aktif: true,
  },
];

export const INITIAL_WARGA_DATA: Warga[] = [];

export const INITIAL_PENGAJUAN: Pengajuan[] = [];
