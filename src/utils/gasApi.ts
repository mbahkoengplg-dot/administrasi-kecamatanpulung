import {
  Desa,
  KecamatanSettings,
  Layanan,
  LogAktivitas,
  Pengajuan,
  UserAccount,
  Warga,
} from '../types';
import {
  DEFAULT_KECAMATAN_SETTINGS,
  STORAGE_KEYS,
} from './storage';

export interface CloudHealth {
  available: boolean;
  configured: boolean;
  message: string;
}

interface GasResponse<T = unknown> {
  success?: boolean;
  configured?: boolean;
  code?: string;
  error?: string;
  data?: T;
  is_new?: boolean;
  warga?: Warga;
  user?: UserAccount;
  pengajuan?: Pengajuan;
  driveFileId?: string;
  fileUrl?: string;
  settings?: KecamatanSettings;
}

let cachedCloudStatus: CloudHealth | null = null;

export const getCachedCloudStatus = (): CloudHealth => {
  return (
    cachedCloudStatus || {
      available: false,
      configured: false,
      message: 'Mode Lokal Browser',
    }
  );
};

async function callGasApi<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<GasResponse<T> | null> {
  try {
    const res = await fetch('/api/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      cachedCloudStatus = {
        available: false,
        configured: false,
        message: 'Mode Lokal (Preview)',
      };
      return null;
    }

    const json = (await res.json()) as GasResponse<T>;
    if (json.configured === false || json.code === 'GAS_NOT_CONFIGURED') {
      cachedCloudStatus = {
        available: true,
        configured: false,
        message: 'Vercel Aktif · GAS_URL Belum Diatur',
      };
      return null;
    }

    cachedCloudStatus = {
      available: true,
      configured: true,
      message: 'Terhubung ke Google Spreadsheet & Drive',
    };
    return json;
  } catch {
    return null;
  }
}

export const checkCloudHealth = async (): Promise<CloudHealth> => {
  try {
    const res = await fetch('/api/gas', { method: 'GET' });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      cachedCloudStatus = {
        available: false,
        configured: false,
        message: 'Mode Lokal Browser',
      };
      return cachedCloudStatus;
    }

    const data = (await res.json()) as { configured?: boolean; hasApiKey?: boolean };
    if (data.configured) {
      cachedCloudStatus = {
        available: true,
        configured: true,
        message: 'Terhubung ke Google Spreadsheet & Drive',
      };
    } else {
      cachedCloudStatus = {
        available: true,
        configured: false,
        message: 'GAS_URL Belum Diisi di Vercel',
      };
    }
    return cachedCloudStatus;
  } catch {
    cachedCloudStatus = {
      available: false,
      configured: false,
      message: 'Mode Lokal Browser',
    };
    return cachedCloudStatus;
  }
};

export interface CloudSyncBundle {
  desa?: Desa[];
  layanan?: Layanan[];
  pengajuan?: Pengajuan[];
  warga?: Warga[];
  users?: UserAccount[];
  logs?: LogAktivitas[];
  settings?: KecamatanSettings;
}

export const syncAllFromCloud = async (): Promise<{
  synced: boolean;
  error?: string;
}> => {
  const health = await checkCloudHealth();
  if (!health.configured) {
    return { synced: false };
  }

  const res = await callGasApi<CloudSyncBundle>('sync_all', {});
  if (!res || !res.success || !res.data) {
    return {
      synced: false,
      error: res?.error || 'Gagal menyinkronkan data dari Google Spreadsheet.',
    };
  }

  const d = res.data;
  if (Array.isArray(d.desa) && d.desa.length > 0) {
    localStorage.setItem(STORAGE_KEYS.DESA, JSON.stringify(d.desa));
  }
  if (Array.isArray(d.layanan) && d.layanan.length > 0) {
    localStorage.setItem(STORAGE_KEYS.LAYANAN, JSON.stringify(d.layanan));
  }
  if (Array.isArray(d.pengajuan)) {
    localStorage.setItem(STORAGE_KEYS.PENGAJUAN, JSON.stringify(d.pengajuan));
  }
  if (Array.isArray(d.warga)) {
    localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(d.warga));
  }
  if (Array.isArray(d.users) && d.users.length > 0) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(d.users));
  }
  if (Array.isArray(d.logs)) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(d.logs));
  }
  if (d.settings && typeof d.settings === 'object') {
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ ...DEFAULT_KECAMATAN_SETTINGS, ...d.settings })
    );
  }

  window.dispatchEvent(new CustomEvent('pulung-data-synced'));
  return { synced: true };
};

export const uploadBerkasCloud = async (
  fileName: string,
  dataUrl: string,
  kodePengajuan?: string
): Promise<{ fileUrl: string; driveFileId?: string; cloudUploaded: boolean }> => {
  // Already uploaded to Drive proxy
  if (dataUrl.startsWith('/api/gas?fileId=')) {
    return { fileUrl: dataUrl, cloudUploaded: true };
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { fileUrl: dataUrl, cloudUploaded: false };
  }

  const mimeType = match[1];
  const base64Data = match[2];

  const res = await callGasApi('upload_berkas', {
    fileName,
    mimeType,
    base64Data,
    kodePengajuan: kodePengajuan || 'DRAFT',
  });

  if (res && res.success && res.driveFileId) {
    return {
      fileUrl: `/api/gas?fileId=${encodeURIComponent(res.driveFileId)}`,
      driveFileId: res.driveFileId,
      cloudUploaded: true,
    };
  }

  // Fallback to compressed base64 when running locally without GAS
  return { fileUrl: dataUrl, cloudUploaded: false };
};

export const cloudLoginWarga = async (payload: {
  nik: string;
  tgl_lahir: string;
  nama?: string;
  no_hp?: string;
  alamat?: string;
  desa_id?: string;
  desa_nama?: string;
}): Promise<{
  handledByCloud: boolean;
  success: boolean;
  isNew?: boolean;
  warga?: Warga;
  error?: string;
}> => {
  const res = await callGasApi('login_warga', payload);
  if (!res) {
    return { handledByCloud: false, success: false };
  }
  if (res.success && res.warga) {
    return { handledByCloud: true, success: true, warga: res.warga };
  }
  return {
    handledByCloud: true,
    success: false,
    isNew: res.is_new,
    error: res.error,
  };
};

export const cloudLoginPetugas = async (
  username: string,
  password: string
): Promise<{
  handledByCloud: boolean;
  success: boolean;
  user?: UserAccount;
  error?: string;
}> => {
  const res = await callGasApi('login_petugas', { username, password });
  if (!res) {
    return { handledByCloud: false, success: false };
  }
  if (res.success && res.user) {
    return { handledByCloud: true, success: true, user: res.user };
  }
  return {
    handledByCloud: true,
    success: false,
    error: res.error,
  };
};

export const cloudSavePengajuan = async (
  pengajuan: Pengajuan,
  isNew = false
): Promise<{ handledByCloud: boolean; success: boolean; pengajuan?: Pengajuan; error?: string }> => {
  const res = await callGasApi('save_pengajuan', { pengajuan, isNew });
  if (!res) return { handledByCloud: false, success: false };
  return {
    handledByCloud: true,
    success: Boolean(res.success),
    pengajuan: res.pengajuan || pengajuan,
    error: res.error,
  };
};

export const cloudSaveWarga = async (warga: Warga): Promise<boolean> => {
  const res = await callGasApi('save_warga', { warga });
  return Boolean(res?.success);
};

export const cloudSaveUser = async (
  user: UserAccount,
  options?: { password?: string; resetPassword?: boolean }
): Promise<boolean> => {
  const res = await callGasApi('save_user', {
    user,
    password: options?.password,
    resetPassword: options?.resetPassword,
  });
  return Boolean(res?.success);
};

export const cloudSaveLayanan = async (layananList: Layanan[]): Promise<boolean> => {
  const res = await callGasApi('save_layanan', { layananList });
  return Boolean(res?.success);
};

export const cloudSaveSettings = async (settings: KecamatanSettings): Promise<boolean> => {
  const res = await callGasApi('save_settings', { settings });
  return Boolean(res?.success);
};

export const cloudAddLog = async (log: LogAktivitas): Promise<void> => {
  await callGasApi('add_log', { log });
};

export const cloudTrackKode = async (
  kode: string
): Promise<{ handledByCloud: boolean; pengajuan?: Pengajuan; settings?: KecamatanSettings }> => {
  const res = await callGasApi('track_kode', { kode });
  if (!res) return { handledByCloud: false };
  return {
    handledByCloud: true,
    pengajuan: res.pengajuan,
    settings: res.settings,
  };
};
