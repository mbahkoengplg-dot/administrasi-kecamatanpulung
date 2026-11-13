import {
  DAFTAR_DESA_PULUNG,
  INITIAL_PENGAJUAN,
  INITIAL_PETUGAS_ACCOUNTS,
  INITIAL_WARGA_DATA,
  MASTER_LAYANAN,
} from '../data/mockData';
import { Desa, KecamatanSettings, Layanan, LogAktivitas, Pengajuan, UserAccount, Warga } from '../types';
import {
  cloudAddLog,
  cloudSaveLayanan,
  cloudSaveSettings,
} from './gasApi';

export const STORAGE_KEYS = {
  DESA: 'pulung_desa_v2',
  LAYANAN: 'pulung_layanan_v2',
  PENGAJUAN: 'pulung_pengajuan_v2',
  WARGA: 'pulung_warga_v2',
  USERS: 'pulung_users_v2',
  LOGS: 'pulung_logs_v2',
  SETTINGS: 'pulung_settings_v2',
  ACTIVE_SESSION: 'pulung_active_session_v2',
  FAILED_ATTEMPTS: 'pulung_failed_attempts_v2',
};

export const DEFAULT_KECAMATAN_SETTINGS: KecamatanSettings = {
  namaAdmin: 'Admin Kecamatan Pulung',
  nipAdmin: '19780825 200212 1 003',
  usernameAdmin: 'admin',
  passwordAdmin: 'admin123',
  jabatanCamat: 'CAMAT PULUNG',
  namaCamat: 'Drs. H. Sukadi, M.Si',
  pangkatCamat: 'Pembina Utama Muda',
  nipCamat: '19710514 199403 1 002',
  namaKabupaten: 'Pemerintah Kabupaten Ponorogo',
  namaKecamatan: 'Kecamatan Pulung',
  alamatKantor: 'Jalan Raya Pulung Nomor 01, Pulung, Ponorogo, Jawa Timur 63492',
  telepon: '(0352) 531122',
  faksimile: '(0352) 531122',
  whatsappBantuan: '0812-3456-7890',
  emailResmi: 'kecamatan.pulung@ponorogo.go.id',
  websiteResmi: 'pulung.ponorogo.go.id',
  jamPelayananSeninKamis: '07.30 - 15.30 WIB',
  jamPelayananJumat: '07.30 - 14.30 WIB',
};

export const getStoredSettings = (): KecamatanSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_KECAMATAN_SETTINGS));
      return DEFAULT_KECAMATAN_SETTINGS;
    }
    return { ...DEFAULT_KECAMATAN_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_KECAMATAN_SETTINGS;
  }
};

export const saveStoredSettings = (settings: KecamatanSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  void cloudSaveSettings(settings);
};

export const getStoredDesa = (): Desa[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DESA);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DESA, JSON.stringify(DAFTAR_DESA_PULUNG));
      return DAFTAR_DESA_PULUNG;
    }
    return JSON.parse(raw);
  } catch {
    return DAFTAR_DESA_PULUNG;
  }
};

export const getStoredLayanan = (): Layanan[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAYANAN);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LAYANAN, JSON.stringify(MASTER_LAYANAN));
      return MASTER_LAYANAN;
    }
    const parsed = JSON.parse(raw) as Layanan[];
    return parsed.map((lay) => ({
      ...lay,
      persyaratan: Array.isArray(lay.persyaratan)
        ? lay.persyaratan.map((p: unknown, idx: number) =>
            typeof p === 'string'
              ? { id: `p-${idx + 1}`, nama: p, wajib: true }
              : {
                  id: (p as { id?: string }).id || `p-${idx + 1}`,
                  nama: (p as { nama?: string }).nama || String(p),
                  wajib: (p as { wajib?: boolean }).wajib !== false,
                  deskripsi: (p as { deskripsi?: string }).deskripsi,
                }
          )
        : [],
    }));
  } catch {
    return MASTER_LAYANAN;
  }
};

export const saveStoredLayanan = (layananList: Layanan[]) => {
  localStorage.setItem(STORAGE_KEYS.LAYANAN, JSON.stringify(layananList));
  void cloudSaveLayanan(layananList);
};

export const getStoredPengajuan = (): Pengajuan[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENGAJUAN);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PENGAJUAN, JSON.stringify(INITIAL_PENGAJUAN));
      return INITIAL_PENGAJUAN;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PENGAJUAN;
  }
};

export const saveStoredPengajuan = (list: Pengajuan[]) => {
  localStorage.setItem(STORAGE_KEYS.PENGAJUAN, JSON.stringify(list));
};

export const getStoredWarga = (): Warga[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WARGA);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(INITIAL_WARGA_DATA));
      return INITIAL_WARGA_DATA;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_WARGA_DATA;
  }
};

export const saveStoredWarga = (list: Warga[]) => {
  localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(list));
};

export const getStoredUsers = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_PETUGAS_ACCOUNTS));
      return INITIAL_PETUGAS_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PETUGAS_ACCOUNTS;
  }
};

export const saveStoredUsers = (list: UserAccount[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
};

export const getStoredLogs = (): LogAktivitas[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addLogAktivitas = (pengguna: string, peran: string, aksi: string, detail: string) => {
  const current = getStoredLogs();
  const newLog: LogAktivitas = {
    id: `log-${Date.now()}`,
    waktu: new Date().toISOString(),
    pengguna,
    peran,
    aksi,
    detail,
  };
  const updated = [newLog, ...current.slice(0, 99)];
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
  void cloudAddLog(newLog);
};

export const generateNextKodePengajuan = (): string => {
  const list = getStoredPengajuan();
  const year = new Date().getFullYear();
  let maxNum = 0;
  list.forEach((item) => {
    const parts = item.kode.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = String(maxNum + 1).padStart(6, '0');
  return `PLG-${year}-${nextNum}`;
};

export const resetAllData = () => {
  localStorage.setItem(STORAGE_KEYS.DESA, JSON.stringify(DAFTAR_DESA_PULUNG));
  localStorage.setItem(STORAGE_KEYS.LAYANAN, JSON.stringify(MASTER_LAYANAN));
  localStorage.setItem(STORAGE_KEYS.PENGAJUAN, JSON.stringify(INITIAL_PENGAJUAN));
  localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(INITIAL_WARGA_DATA));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_PETUGAS_ACCOUNTS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_KECAMATAN_SETTINGS));
  localStorage.removeItem(STORAGE_KEYS.LOGS);
};
