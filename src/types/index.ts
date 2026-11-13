export type UserRole = 'admin' | 'desa' | 'warga';

export interface Desa {
  id: string;
  nama: string;
  kodePos: string;
  alamatKantor: string;
}

export interface Warga {
  nik: string;
  nama: string;
  tglLahir: string; // YYYY-MM-DD
  noHp: string;
  alamat: string;
  desaId: string;
  desaNama?: string;
  terverifikasi: boolean;
  dibuatOleh: 'mandiri' | 'desa';
  dibuatPada: string;
}

export interface UserAccount {
  id: string;
  nama: string;
  username: string;
  role: 'admin' | 'desa';
  desaId?: string;
  desaNama?: string;
  aktif: boolean;
  wajibGantiPassword?: boolean;
}

export interface PersyaratanItem {
  id: string;
  nama: string;
  wajib: boolean;
  deskripsi?: string;
}

export interface Layanan {
  id: string;
  kategori: string;
  nama: string;
  deskripsi: string;
  persyaratan: PersyaratanItem[];
  estimasiHari: number;
  aktif: boolean;
  kodeSuratPrefix: string;
}

export type StatusPengajuan =
  | 'Diajukan'
  | 'Diverifikasi'
  | 'Diproses'
  | 'Selesai'
  | 'Perlu Perbaikan'
  | 'Ditolak';

export interface BerkasItem {
  id: string;
  persyaratanId: string;
  namaDokumen: string;
  fileUrl?: string; // base64 or placeholder url
  fileName: string;
  fileSize?: string;
  diunggahPada: string;
}

export interface RiwayatStatus {
  status: StatusPengajuan;
  catatan?: string;
  oleh: string; // e.g. "Pemohon (Mandiri)", "Admin Kecamatan", "Petugas Desa Banaran"
  waktu: string;
}

export interface Pengajuan {
  kode: string; // e.g. PLG-2026-000125
  layananId: string;
  layananNama: string;
  kategoriLayanan: string;
  nik: string;
  namaWarga: string;
  desaId: string;
  desaNama: string;
  jalur: 'desa' | 'mandiri';
  diajukanOleh: string; // "Mandiri" or "Petugas Desa [Nama]"
  status: StatusPengajuan;
  catatan?: string;
  nomorSurat?: string; // e.g. 470/142/405.29/2026
  tanggalTerbit?: string;
  namaPejabat?: string; // Camat Pulung / Sekretaris Kecamatan
  nipPejabat?: string;
  berkas: BerkasItem[];
  riwayat: RiwayatStatus[];
  keperluan?: string;
  dibuatPada: string;
  diubahPada: string;
}

export interface LogAktivitas {
  id: string;
  waktu: string;
  pengguna: string;
  peran: string;
  aksi: string;
  detail: string;
}

export interface KecamatanSettings {
  namaAdmin: string;
  nipAdmin: string;
  usernameAdmin: string;
  passwordAdmin: string;
  jabatanCamat: string;
  namaCamat: string;
  pangkatCamat: string;
  nipCamat: string;
  namaKabupaten: string;
  namaKecamatan: string;
  alamatKantor: string;
  telepon: string;
  faksimile: string;
  whatsappBantuan: string;
  emailResmi: string;
  websiteResmi: string;
  jamPelayananSeninKamis: string;
  jamPelayananJumat: string;
}
