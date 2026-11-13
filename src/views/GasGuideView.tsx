import React, { useState } from 'react';
import { Copy, Check, Code, FileSpreadsheet, HardDrive, BookOpen, ExternalLink, X } from 'lucide-react';

interface GasGuideViewProps {
  onClose: () => void;
}

export const GasGuideView: React.FC<GasGuideViewProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'manifest' | 'sheets' | 'install' | 'roles'>('code');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeGsContent = `/**
 * =========================================================================
 * LAYANAN KECAMATAN PULUNG - BACKEND GOOGLE APPS SCRIPT (GAS)
 * Versi: 2.0.0 (Terhubung Penuh ke Vercel /api/gas, Spreadsheet & Drive)
 * Kabupaten Ponorogo, Jawa Timur
 * =========================================================================
 */

var SHEET_NAMES = {
  USERS: 'users',
  DESA: 'desa',
  WARGA: 'warga',
  LAYANAN: 'layanan',
  PENGAJUAN: 'pengajuan',
  BERKAS: 'berkas',
  LOGS: 'logs',
  SETTINGS: 'settings'
};

var DRIVE_ROOT_NAME = 'LayananKecamatan_Pulung';

/**
 * 1. FUNGSI SETUP(): Jalankan 1x saat instalasi awal di Apps Script Editor
 */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Sheet USERS
  var sheetUsers = getOrCreateSheet(ss, SHEET_NAMES.USERS);
  if (sheetUsers.getLastRow() === 0) {
    sheetUsers.appendRow(['id', 'nama', 'username', 'password_hash', 'salt', 'role', 'desa_id', 'desa_nama', 'aktif', 'wajib_ganti_password']);
    var salt = Utilities.getUuid();
    var hash = hashPassword('admin123', salt);
    sheetUsers.appendRow(['usr-admin', 'Admin Kecamatan Pulung', 'admin', hash, salt, 'admin', '', '', true, false]);
  }

  // Sheet DESA (18 Desa se-Kecamatan Pulung)
  var sheetDesa = getOrCreateSheet(ss, SHEET_NAMES.DESA);
  if (sheetDesa.getLastRow() === 0) {
    sheetDesa.appendRow(['id', 'nama', 'kode_pos', 'alamat_kantor']);
    var desaPulung = [
      ['desa-01', 'Pulung', '63492', 'Jl. Raya Pulung No. 12'],
      ['desa-02', 'Banaran', '63492', 'Jl. Desa Banaran No. 05'],
      ['desa-03', 'Bedrug', '63492', 'Jl. Balai Desa Bedrug'],
      ['desa-04', 'Bekiring', '63492', 'Jl. Raya Bekiring'],
      ['desa-05', 'Karangpatihan', '63492', 'Jl. Desa Karangpatihan No. 03'],
      ['desa-06', 'Kesugihan', '63492', 'Jl. Balai Desa Kesugihan'],
      ['desa-07', 'Munggung', '63492', 'Jl. Desa Munggung'],
      ['desa-08', 'Patik', '63492', 'Jl. Balai Desa Patik'],
      ['desa-09', 'Plunturan', '63492', 'Jl. Reyog Budaya Plunturan'],
      ['desa-10', 'Pomahan', '63492', 'Jl. Balai Desa Pomahan'],
      ['desa-11', 'Serag', '63492', 'Jl. Desa Serag'],
      ['desa-12', 'Sidoharjo', '63492', 'Jl. Balai Desa Sidoharjo'],
      ['desa-13', 'Singgahan', '63492', 'Jl. Air Terjun Singgahan'],
      ['desa-14', 'Turlan', '63492', 'Jl. Balai Desa Turlan'],
      ['desa-15', 'Wagir Kidul', '63492', 'Jl. Raya Wagir Kidul'],
      ['desa-16', 'Wayang', '63492', 'Jl. Balai Desa Wayang'],
      ['desa-17', 'Wotan', '63492', 'Jl. Desa Wotan'],
      ['desa-18', 'Wates', '63492', 'Jl. Lingkar Wates Pulung']
    ];
    desaPulung.forEach(function(row) { sheetDesa.appendRow(row); });
  }

  // Sheet WARGA (Format kolom NIK & Tgl Lahir sebagai Text '@' agar 16 digit tidak rusak)
  var sheetWarga = getOrCreateSheet(ss, SHEET_NAMES.WARGA);
  if (sheetWarga.getLastRow() === 0) {
    sheetWarga.appendRow(['nik', 'nama', 'tgl_lahir', 'no_hp', 'alamat', 'desa_id', 'desa_nama', 'terverifikasi', 'dibuat_oleh', 'dibuat_pada']);
    sheetWarga.getRange('A:D').setNumberFormat('@');
  }

  // Sheet LAYANAN (7 Kategori Master)
  var sheetLayanan = getOrCreateSheet(ss, SHEET_NAMES.LAYANAN);
  if (sheetLayanan.getLastRow() === 0) {
    sheetLayanan.appendRow(['id', 'kategori', 'nama', 'deskripsi', 'persyaratan_json', 'estimasi_hari', 'aktif', 'kode_surat_prefix']);
    var layananSeed = [
      ['layanan-01', 'Pengantar Administrasi Kependudukan', 'Pengantar KTP-el & Kartu Keluarga (KK)', 'Pengurusan pengantar pembuatan KTP Elektronik baru/rusak/hilang dan perubahan data Kartu Keluarga ke Disdukcapil.', JSON.stringify([{id:'p1',nama:'Foto Kartu Keluarga (KK) Asli / Lama',wajib:true},{id:'p2',nama:'Surat Pengantar RT / Balai Desa',wajib:true},{id:'p3',nama:'Surat Kehilangan dari Polsek (Bila KTP/KK Hilang)',wajib:false}]), 1, true, '470'],
      ['layanan-02', 'Surat Keterangan', 'Surat Keterangan Domisili', 'Surat resmi yang menerangkan bahwa warga berdomisili atau tinggal di wilayah Kecamatan Pulung.', JSON.stringify([{id:'p1',nama:'Foto KTP Pemohon',wajib:true},{id:'p2',nama:'Foto Kartu Keluarga',wajib:true},{id:'p3',nama:'Surat Keterangan Domisili dari Desa',wajib:true}]), 1, true, '474'],
      ['layanan-03', 'Surat Keterangan', 'Surat Keterangan Usaha (SKU)', 'Keterangan kepemilikan usaha mikro/kecil untuk keperluan perbankan, KUR, atau perizinan usaha.', JSON.stringify([{id:'p1',nama:'Foto KTP Pemilik Usaha',wajib:true},{id:'p2',nama:'Foto Kartu Keluarga',wajib:true},{id:'p3',nama:'Surat Pengantar Usaha dari Desa',wajib:true},{id:'p4',nama:'Foto Tempat / Aktivitas Usaha',wajib:true}]), 2, true, '510'],
      ['layanan-04', 'Surat Keterangan', 'Surat Keterangan Tidak Mampu (SKTM)', 'Keterangan untuk keringanan biaya pengobatan, BPJS, beasiswa pendidikan, atau bantuan sosial.', JSON.stringify([{id:'p1',nama:'Foto KTP Pemohon / Orang Tua',wajib:true},{id:'p2',nama:'Foto Kartu Keluarga',wajib:true},{id:'p3',nama:'Surat Keterangan Tidak Mampu dari Desa',wajib:true},{id:'p4',nama:'Foto Rumah Tinggal Tampak Depan',wajib:false}]), 1, true, '401'],
      ['layanan-05', 'Surat Rekomendasi', 'Surat Rekomendasi Izin Keramaian', 'Rekomendasi kegiatan hajatan, hiburan rakyat, reyog Ponorogo, atau pentas seni ke Polsek Pulung.', JSON.stringify([{id:'p1',nama:'Foto KTP Penanggung Jawab Kegiatan',wajib:true},{id:'p2',nama:'Surat Izin / Pengantar dari Kepala Desa',wajib:true},{id:'p3',nama:'Surat Pernyataan Keamanan bermaterai',wajib:true}]), 2, true, '331'],
      ['layanan-06', 'Pengantar Pernikahan', 'Pengantar Nikah (Model N1-N4 ke KUA)', 'Pemeriksaan berkas dan rekomendasi pengantar pernikahan atau rujuk menuju Kantor Urusan Agama (KUA).', JSON.stringify([{id:'p1',nama:'Foto KTP Calon Pengantin Laki-laki & Perempuan',wajib:true},{id:'p2',nama:'Foto KK Kedua Calon Pengantin',wajib:true},{id:'p3',nama:'Formulir N1 - N4 yang ditandatangani Kades',wajib:true},{id:'p4',nama:'Akta Kelahiran / Ijazah Calon',wajib:true}]), 2, true, '474.2'],
      ['layanan-07', 'Pertanahan', 'Surat Keterangan Waris & Riwayat Tanah', 'Surat pengesahan susunan ahli waris atau keterangan riwayat kepemilikan tanah untuk PTSL/BPN.', JSON.stringify([{id:'p1',nama:'Foto KTP Para Ahli Waris',wajib:true},{id:'p2',nama:'Foto Kartu Keluarga & Akta Kematian Pewaris',wajib:true},{id:'p3',nama:'Surat Keterangan Waris dari Kepala Desa',wajib:true},{id:'p4',nama:'Bukti Kepemilikan / SPPT PBB / Letter C',wajib:true}]), 3, true, '593']
    ];
    layananSeed.forEach(function(row) { sheetLayanan.appendRow(row); });
  }

  // Sheet PENGAJUAN
  var sheetPengajuan = getOrCreateSheet(ss, SHEET_NAMES.PENGAJUAN);
  if (sheetPengajuan.getLastRow() === 0) {
    sheetPengajuan.appendRow(['kode', 'layanan_id', 'layanan_nama', 'kategori_layanan', 'nik', 'nama_warga', 'desa_id', 'desa_nama', 'jalur', 'diajukan_oleh', 'status', 'catatan', 'nomor_surat', 'tanggal_terbit', 'nama_pejabat', 'nip_pejabat', 'keperluan', 'berkas_json', 'riwayat_json', 'dibuat_pada', 'diubah_pada']);
    sheetPengajuan.getRange('E:E').setNumberFormat('@');
  }

  // Sheet BERKAS
  var sheetBerkas = getOrCreateSheet(ss, SHEET_NAMES.BERKAS);
  if (sheetBerkas.getLastRow() === 0) {
    sheetBerkas.appendRow(['id', 'kode_pengajuan', 'persyaratan_id', 'nama_dokumen', 'file_name', 'file_size', 'drive_file_id', 'diunggah_pada']);
  }

  // Sheet LOGS
  var sheetLogs = getOrCreateSheet(ss, SHEET_NAMES.LOGS);
  if (sheetLogs.getLastRow() === 0) {
    sheetLogs.appendRow(['id', 'waktu', 'pengguna', 'peran', 'aksi', 'detail']);
  }

  // Sheet SETTINGS
  var sheetSettings = getOrCreateSheet(ss, SHEET_NAMES.SETTINGS);
  if (sheetSettings.getLastRow() === 0) {
    sheetSettings.appendRow(['key', 'value_json']);
  }

  // Folder Google Drive Privat
  var rootFolders = DriveApp.getFoldersByName(DRIVE_ROOT_NAME);
  var mainFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(DRIVE_ROOT_NAME);
  getOrCreateSubFolder(mainFolder, 'berkas_warga');
  getOrCreateSubFolder(mainFolder, 'hasil_surat_pdf');
  getOrCreateSubFolder(mainFolder, 'template_docs');

  Logger.log('Setup database Spreadsheet & folder Drive Kecamatan Pulung selesai!');
}

/**
 * 2. REST API ENDPOINT: doPost(e)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var req = JSON.parse(e.postData.contents || '{}');
    var action = req.action;
    var payload = req.payload || {};

    var secretKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (secretKey && req.api_key !== secretKey) {
      return createJsonResponse({ success: false, error: 'Akses ditolak: API_KEY tidak valid.' });
    }

    var result = { success: false, error: 'Action tidak dikenal: ' + action };
    if (action === 'ping') result = { success: true, message: 'GAS Kecamatan Pulung Aktif' };
    else if (action === 'sync_all') result = handleSyncAll();
    else if (action === 'track_kode') result = handleTrackKode(payload.kode);
    else if (action === 'login_warga') result = handleLoginWarga(payload);
    else if (action === 'login_petugas') result = handleLoginPetugas(payload);
    else if (action === 'upload_berkas') result = handleUploadBerkas(payload);
    else if (action === 'get_file') result = handleGetFile(payload.fileId);
    else if (action === 'save_pengajuan') result = handleSavePengajuan(payload);
    else if (action === 'save_warga') result = handleSaveWarga(payload.warga);
    else if (action === 'save_user') result = handleSaveUser(payload);
    else if (action === 'save_layanan') result = handleSaveLayanan(payload.layananList);
    else if (action === 'save_settings') result = handleSaveSettings(payload.settings);
    else if (action === 'add_log') result = handleAddLog(payload.log);

    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var kode = e && e.parameter ? e.parameter.kode : '';
  if (!kode) {
    return createJsonResponse({ success: true, status: 'ready', message: 'API Layanan Kecamatan Pulung Aktif' });
  }
  return createJsonResponse(handleTrackKode(kode));
}

// ================= HANDLERS CRUD SPREADSHEET & DRIVE =================

function handleSyncAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    success: true,
    data: {
      desa: readDesaList(ss),
      layanan: readLayananList(ss),
      pengajuan: readPengajuanList(ss),
      warga: readWargaList(ss),
      users: readPublicUsersList(ss),
      logs: readLogsList(ss),
      settings: readSettingsObj(ss)
    }
  };
}

function handleTrackKode(kode) {
  var clean = String(kode || '').trim().toUpperCase();
  if (!clean) return { success: false, error: 'Kode kosong' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var list = readPengajuanList(ss);
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].kode).toUpperCase() === clean || String(list[i].nomorSurat || '').toUpperCase() === clean) {
      return { success: true, pengajuan: list[i], settings: readSettingsObj(ss) };
    }
  }
  return { success: false, error: 'Pengajuan tidak ditemukan' };
}

function handleLoginWarga(payload) {
  var nik = String(payload.nik || '').trim();
  var tglLahir = String(payload.tgl_lahir || '').trim();
  if (nik.length !== 16) return { success: false, error: 'NIK wajib 16 angka.' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.WARGA);
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === nik) {
      var storedDob = formatSheetDate(rows[i][2]);
      if (storedDob === tglLahir) {
        return { success: true, warga: rowToWarga(rows[i]) };
      }
      return { success: false, error: 'Data tidak cocok. Periksa kembali NIK atau tanggal lahir Anda.' };
    }
  }

  if (payload.nama && payload.alamat) {
    var nowIso = new Date().toISOString();
    var newRow = [nik, String(payload.nama).trim(), tglLahir, String(payload.no_hp || ''), String(payload.alamat).trim(), String(payload.desa_id || 'desa-01'), String(payload.desa_nama || 'Pulung'), false, 'mandiri', nowIso];
    sheet.appendRow(newRow);
    sheet.getRange(sheet.getLastRow(), 1, 1, 4).setNumberFormat('@');
    return { success: true, warga: rowToWarga(newRow) };
  }

  return { success: false, is_new: true, message: 'NIK baru pertama kali terdeteksi.' };
}

function handleLoginPetugas(payload) {
  var uname = String(payload.username || '').trim().toLowerCase();
  var pass = String(payload.password || '').trim();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.USERS);
  var rows = sheet.getDataRange().getValues();
  var settings = readSettingsObj(ss);

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).trim().toLowerCase() === uname && rows[i][8] === true) {
      var role = String(rows[i][5]);
      var salt = String(rows[i][4] || '');
      var storedHash = String(rows[i][3] || '');
      var matched = (hashPassword(pass, salt) === storedHash);
      if (!matched && role === 'admin' && settings && settings.passwordAdmin && pass === settings.passwordAdmin) {
        matched = true;
      }
      if (matched) {
        return {
          success: true,
          user: {
            id: String(rows[i][0]),
            nama: String(rows[i][1]),
            username: String(rows[i][2]),
            role: role,
            desaId: String(rows[i][6] || ''),
            desaNama: String(rows[i][7] || ''),
            aktif: true,
            wajibGantiPassword: Boolean(rows[i][9])
          }
        };
      }
    }
  }
  return { success: false, error: 'Username atau password salah. Silakan coba kembali.' };
}

function handleUploadBerkas(payload) {
  var base64 = String(payload.base64Data || '');
  var mimeType = String(payload.mimeType || 'image/jpeg');
  var fileName = String(payload.fileName || ('berkas_' + Date.now() + '.jpg'));
  var kode = String(payload.kodePengajuan || 'BERKAS');
  if (!base64) return { success: false, error: 'File kosong' };

  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, mimeType, kode + '_' + fileName);
  var root = getOrCreateRootFolder();
  var folder = getOrCreateSubFolder(root, 'berkas_warga');
  var file = folder.createFile(blob);

  return {
    success: true,
    driveFileId: file.getId(),
    fileUrl: '/api/gas?fileId=' + encodeURIComponent(file.getId())
  };
}

function handleGetFile(fileId) {
  if (!fileId) return { success: false, error: 'fileId wajib diisi' };
  var file = DriveApp.getFileById(String(fileId));
  var blob = file.getBlob();
  return {
    success: true,
    fileName: file.getName(),
    mimeType: blob.getContentType(),
    base64Data: Utilities.base64Encode(blob.getBytes())
  };
}

function handleSavePengajuan(payload) {
  var p = payload.pengajuan;
  if (!p) return { success: false, error: 'Data pengajuan kosong' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.PENGAJUAN);
  var rows = sheet.getDataRange().getValues();

  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(p.kode)) {
      foundRow = i + 1;
      break;
    }
  }

  if (payload.isNew && foundRow === -1) {
    var year = new Date().getFullYear();
    var maxNum = 0;
    for (var j = 1; j < rows.length; j++) {
      var parts = String(rows[j][0]).split('-');
      if (parts.length === 3) {
        var n = parseInt(parts[2], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    }
    p.kode = 'PLG-' + year + '-' + ('000000' + (maxNum + 1)).slice(-6);
  }

  var rowVals = [
    p.kode, p.layananId || '', p.layananNama || '', p.kategoriLayanan || '',
    String(p.nik || ''), p.namaWarga || '', p.desaId || '', p.desaNama || '',
    p.jalur || 'mandiri', p.diajukanOleh || '', p.status || 'Diajukan',
    p.catatan || '', p.nomorSurat || '', p.tanggalTerbit || '',
    p.namaPejabat || '', p.nipPejabat || '', p.keperluan || '',
    JSON.stringify(p.berkas || []), JSON.stringify(p.riwayat || []),
    p.dibuatPada || new Date().toISOString(), p.diubahPada || new Date().toISOString()
  ];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowVals.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
    sheet.getRange(sheet.getLastRow(), 5).setNumberFormat('@');
    var sheetBerkas = getOrCreateSheet(ss, SHEET_NAMES.BERKAS);
    (p.berkas || []).forEach(function(b) {
      sheetBerkas.appendRow([b.id, p.kode, b.persyaratanId, b.namaDokumen, b.fileName, b.fileSize || '', b.fileUrl || '', b.diunggahPada || '']);
    });
  }

  return { success: true, pengajuan: p };
}

function handleSaveWarga(w) {
  if (!w || !w.nik) return { success: false, error: 'NIK warga wajib ada' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.WARGA);
  var rows = sheet.getDataRange().getValues();
  var rowVals = [String(w.nik), w.nama || '', String(w.tglLahir || ''), String(w.noHp || ''), w.alamat || '', w.desaId || '', w.desaNama || '', Boolean(w.terverifikasi), w.dibuatOleh || 'mandiri', w.dibuatPada || new Date().toISOString()];

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(w.nik).trim()) {
      sheet.getRange(i + 1, 1, 1, rowVals.length).setValues([rowVals]);
      sheet.getRange(i + 1, 1, 1, 4).setNumberFormat('@');
      return { success: true };
    }
  }
  sheet.appendRow(rowVals);
  sheet.getRange(sheet.getLastRow(), 1, 1, 4).setNumberFormat('@');
  return { success: true };
}

function handleSaveUser(payload) {
  var u = payload.user;
  if (!u || !u.username) return { success: false, error: 'User tidak valid' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.USERS);
  var rows = sheet.getDataRange().getValues();

  var foundIdx = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(u.id) || String(rows[i][2]).toLowerCase() === String(u.username).toLowerCase()) {
      foundIdx = i + 1;
      break;
    }
  }

  var passPlain = payload.password || (u.role === 'desa' ? 'desa123' : 'admin123');
  var salt = foundIdx > 0 && !payload.password && !payload.resetPassword ? String(rows[foundIdx - 1][4]) : Utilities.getUuid();
  var hash = foundIdx > 0 && !payload.password && !payload.resetPassword ? String(rows[foundIdx - 1][3]) : hashPassword(passPlain, salt);

  var rowVals = [u.id, u.nama, u.username, hash, salt, u.role, u.desaId || '', u.desaNama || '', Boolean(u.aktif), Boolean(u.wajibGantiPassword)];
  if (foundIdx > 0) {
    sheet.getRange(foundIdx, 1, 1, rowVals.length).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }
  return { success: true };
}

function handleSaveLayanan(list) {
  if (!list || !list.length) return { success: false };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.LAYANAN);
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  list.forEach(function(l) {
    sheet.appendRow([l.id, l.kategori, l.nama, l.deskripsi, JSON.stringify(l.persyaratan || []), l.estimasiHari, Boolean(l.aktif), l.kodeSuratPrefix]);
  });
  return { success: true };
}

function handleSaveSettings(settingsObj) {
  if (!settingsObj) return { success: false };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.SETTINGS);
  var rows = sheet.getDataRange().getValues();
  var jsonStr = JSON.stringify(settingsObj);

  var updated = false;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === 'kecamatan_settings') {
      sheet.getRange(i + 1, 2).setValue(jsonStr);
      updated = true;
      break;
    }
  }
  if (!updated) sheet.appendRow(['kecamatan_settings', jsonStr]);

  if (settingsObj.usernameAdmin && settingsObj.passwordAdmin) {
    handleSaveUser({
      user: {
        id: 'usr-admin',
        nama: settingsObj.namaAdmin || 'Admin Kecamatan Pulung',
        username: settingsObj.usernameAdmin,
        role: 'admin',
        aktif: true,
        wajibGantiPassword: false
      },
      password: settingsObj.passwordAdmin
    });
  }
  return { success: true };
}

function handleAddLog(log) {
  if (!log) return { success: false };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.LOGS);
  sheet.appendRow([log.id || ('log-' + Date.now()), log.waktu || new Date().toISOString(), log.pengguna || '', log.peran || '', log.aksi || '', log.detail || '']);
  return { success: true };
}

// ================= PEMBACA DATA SHEET =================

function readDesaList(ss) {
  var rows = getOrCreateSheet(ss, SHEET_NAMES.DESA).getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    out.push({ id: String(rows[i][0]), nama: String(rows[i][1]), kodePos: String(rows[i][2] || '63492'), alamatKantor: String(rows[i][3] || '') });
  }
  return out;
}

function readLayananList(ss) {
  var rows = getOrCreateSheet(ss, SHEET_NAMES.LAYANAN).getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    var reqs = [];
    try { reqs = JSON.parse(rows[i][4] || '[]'); } catch (e) {}
    out.push({
      id: String(rows[i][0]), kategori: String(rows[i][1]), nama: String(rows[i][2]),
      deskripsi: String(rows[i][3]), persyaratan: reqs, estimasiHari: Number(rows[i][5] || 1),
      aktif: rows[i][6] !== false, kodeSuratPrefix: String(rows[i][7] || '470')
    });
  }
  return out;
}

function readPengajuanList(ss) {
  var rows = getOrCreateSheet(ss, SHEET_NAMES.PENGAJUAN).getDataRange().getValues();
  var out = [];
  for (var i = rows.length - 1; i >= 1; i--) {
    var berkas = [];
    var riwayat = [];
    try { berkas = JSON.parse(rows[i][17] || '[]'); } catch (e) {}
    try { riwayat = JSON.parse(rows[i][18] || '[]'); } catch (e) {}
    out.push({
      kode: String(rows[i][0]), layananId: String(rows[i][1]), layananNama: String(rows[i][2]),
      kategoriLayanan: String(rows[i][3]), nik: String(rows[i][4]), namaWarga: String(rows[i][5]),
      desaId: String(rows[i][6]), desaNama: String(rows[i][7]), jalur: String(rows[i][8] || 'mandiri'),
      diajukanOleh: String(rows[i][9]), status: String(rows[i][10]), catatan: String(rows[i][11] || ''),
      nomorSurat: String(rows[i][12] || ''), tanggalTerbit: String(rows[i][13] || ''),
      namaPejabat: String(rows[i][14] || ''), nipPejabat: String(rows[i][15] || ''),
      keperluan: String(rows[i][16] || ''), berkas: berkas, riwayat: riwayat,
      dibuatPada: String(rows[i][19] || ''), diubahPada: String(rows[i][20] || '')
    });
  }
  return out;
}

function readWargaList(ss) {
  var rows = getOrCreateSheet(ss, SHEET_NAMES.WARGA).getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    out.push(rowToWarga(rows[i]));
  }
  return out;
}

function rowToWarga(r) {
  return {
    nik: String(r[0]).trim(), nama: String(r[1]), tglLahir: formatSheetDate(r[2]),
    noHp: String(r[3] || ''), alamat: String(r[4] || ''), desaId: String(r[5] || 'desa-01'),
    desaNama: String(r[6] || 'Pulung'), terverifikasi: Boolean(r[7]),
    dibuatOleh: String(r[8] || 'mandiri'), dibuatPada: String(r[9] || '')
  };
}

function readPublicUsersList(ss) {
  var rows = getOrCreateSheet(ss, SHEET_NAMES.USERS).getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    out.push({
      id: String(rows[i][0]), nama: String(rows[i][1]), username: String(rows[i][2]),
      role: String(rows[i][5]), desaId: String(rows[i][6] || ''), desaNama: String(rows[i][7] || ''),
      aktif: Boolean(rows[i][8]), wajibGantiPassword: Boolean(rows[i][9])
    });
  }
  return out;
}

function readLogsList(ss) {
  var rows = getOrCreateSheet(ss, SHEET_NAMES.LOGS).getDataRange().getValues();
  var out = [];
  var start = Math.max(1, rows.length - 100);
  for (var i = rows.length - 1; i >= start; i--) {
    out.push({ id: String(rows[i][0]), waktu: String(rows[i][1]), pengguna: String(rows[i][2]), peran: String(rows[i][3]), aksi: String(rows[i][4]), detail: String(rows[i][5]) });
  }
  return out;
}

function readSettingsObj(ss) {
  var rows = getOrCreateSheet(ss, SHEET_NAMES.SETTINGS).getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === 'kecamatan_settings') {
      try { return JSON.parse(rows[i][1]); } catch (e) { return null; }
    }
  }
  return null;
}

function formatSheetDate(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  return String(val || '').trim();
}

function hashPassword(password, salt) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < raw.length; i++) {
    var b = raw[i];
    if (b < 0) b += 256;
    var byteString = b.toString(16);
    if (byteString.length === 1) byteString = '0' + byteString;
    hex += byteString;
  }
  return hex;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) {
  var s = ss.getSheetByName(name);
  return s ? s : ss.insertSheet(name);
}

function getOrCreateRootFolder() {
  var iter = DriveApp.getFoldersByName(DRIVE_ROOT_NAME);
  return iter.hasNext() ? iter.next() : DriveApp.createFolder(DRIVE_ROOT_NAME);
}

function getOrCreateSubFolder(parent, name) {
  var iter = parent.getFoldersByName(name);
  return iter.hasNext() ? iter.next() : parent.createFolder(name);
}
`;

  const appsscriptJson = `{
  "timeZone": "Asia/Jakarta",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center">
              <Code className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                Dokumentasi &amp; Kode Google Apps Script (GAS)
              </h2>
              <p className="text-xs text-emerald-200">
                Sesuai Bagian 10, 11, &amp; 14 Spesifikasi: GAS + Spreadsheet + Drive + Vercel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-emerald-800 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code.gs</span>
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'manifest'
                ? 'border-emerald-800 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>appsscript.json</span>
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'border-emerald-800 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Struktur 8 Sheet</span>
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'install'
                ? 'border-emerald-800 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Panduan Deploy</span>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? 'border-emerald-800 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan 3 Peran</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: CODE.GS */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-sm">
                    Backend Code.gs untuk Google Apps Script Web App
                  </span>
                  <p className="text-slate-500">
                    Mencakup setup() otomatis, LockService, SHA-256 hash password, dan router endpoint.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(codeGsContent, 'codegs')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {copiedKey === 'codegs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'codegs' ? 'Tersalin!' : 'Salin Code.gs'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[50vh]">
                {codeGsContent}
              </pre>
            </div>
          )}

          {/* TAB 2: APPSSCRIPT.JSON */}
          {activeTab === 'manifest' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-sm">
                    Manifest Konfigurasi Apps Script (appsscript.json)
                  </span>
                  <p className="text-slate-500">
                    Izin OAuth scope untuk Spreadsheets, Drive, Docs, dan zona waktu Asia/Jakarta.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(appsscriptJson, 'manifest')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {copiedKey === 'manifest' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'manifest' ? 'Tersalin!' : 'Salin Manifest'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                {appsscriptJson}
              </pre>
            </div>
          )}

          {/* TAB 3: STRUKTUR SPREADSHEET */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Struktur 8 Tab Tabel Database Google Spreadsheet:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-emerald-900 block font-mono">1. users</span>
                  <p className="text-slate-600 mt-1">
                    id, nama, username, password_hash, salt, role (admin|desa), desa_id, aktif, wajib_ganti_password
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-emerald-900 block font-mono">2. desa</span>
                  <p className="text-slate-600 mt-1">
                    id, nama (18 desa: Pulung, Banaran, Bedrug, Bekiring, Karangpatihan, Kesugihan, dst.)
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-emerald-900 block font-mono">3. warga</span>
                  <p className="text-slate-600 mt-1">
                    nik (text 16 digit), nama, tgl_lahir (text YYYY-MM-DD), no_hp, alamat, desa_id, terverifikasi, dibuat_oleh, dibuat_pada
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-emerald-900 block font-mono">4. layanan</span>
                  <p className="text-slate-600 mt-1">
                    id, kategori, nama, deskripsi, persyaratan_json, estimasi_hari, aktif, prefix_surat
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-emerald-900 block font-mono">5. pengajuan</span>
                  <p className="text-slate-600 mt-1">
                    kode (PLG-2026-xxxxxx), layanan_id, nik, jalur (desa|mandiri), diajukan_oleh, desa_id, status, catatan, nomor_surat, file_pdf_id, dibuat_pada, diubah_pada
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-emerald-900 block font-mono">6. berkas</span>
                  <p className="text-slate-600 mt-1">
                    id, kode_pengajuan, jenis, drive_file_id, diunggah_pada
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-emerald-900 block font-mono">7. logs</span>
                  <p className="text-slate-600 mt-1">
                    id, waktu, pengguna, peran, aksi, detail (riwayat aktivitas &amp; audit petugas)
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="font-bold text-emerald-900 block font-mono">8. settings &amp; folder Drive</span>
                  <p className="text-slate-600 mt-1">
                    key, value_json + Folder Drive: /LayananKecamatan_Pulung/ (berkas_warga, hasil_surat_pdf, template_docs)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PANDUAN DEPLOY */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Panduan Lengkap: Google Spreadsheet + Drive + GAS + GitHub + Vercel
              </h3>
              <ol className="list-decimal pl-5 space-y-2.5 text-slate-700 leading-relaxed">
                <li>
                  <strong>Buat Google Spreadsheet</strong>: Buka Google Drive akun resmi Kecamatan, buat Spreadsheet baru (misal: <em>Database Layanan Kecamatan Pulung</em>).
                </li>
                <li>
                  <strong>Pasang Kode <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Code.gs</code></strong>: Di Spreadsheet, klik <em>Ekstensi → Apps Script</em>, hapus kode lama, lalu tempel kode lengkap dari Tab <strong>Code.gs</strong> di atas dan klik Simpan (Ctrl+S).
                </li>
                <li>
                  <strong>Jalankan Fungsi <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">setup()</code></strong>: Pilih fungsi <code className="font-mono">setup</code> di toolbar atas lalu klik <strong>Jalankan (Run)</strong> 1 kali. Berikan izin akses (Sheets &amp; Drive). Seluruh 8 sheet &amp; folder Google Drive <code className="font-mono">/LayananKecamatan_Pulung/</code> akan dibuat otomatis.
                </li>
                <li>
                  <strong>Buat Kata Sandi Rahasia (<code className="font-mono">API_KEY</code>)</strong>: Klik ikon roda gigi ⚙️ (<strong>Setelan Proyek / Project Settings</strong>) di panel kiri Apps Script → gulir ke bawah ke <strong>Properti Skrip (Script Properties)</strong> → klik <em>Tambahkan properti skrip</em>:
                  <ul className="list-disc pl-5 mt-1 text-slate-600">
                    <li>Properti: <code className="font-mono bg-slate-100 px-1">API_KEY</code></li>
                    <li>Nilai: buat kode rahasia acak Anda sendiri (misal: <code className="font-mono bg-slate-100 px-1">Pulung2026#KunciRahasia99</code>), lalu simpan.</li>
                  </ul>
                </li>
                <li>
                  <strong>Deploy GAS sebagai Web App</strong>: Klik <em>Terapkan (Deploy) → Deployment baru → Aplikasi Web (Web App)</em>:
                  <ul className="list-disc pl-5 mt-1 text-slate-600">
                    <li>Execute as: <strong>Me (Akun Google Anda)</strong></li>
                    <li>Who has access: <strong>Anyone (Siapa saja)</strong></li>
                    <li>Klik <em>Terapkan</em> lalu salin <strong>URL Aplikasi Web</strong> yang berakhiran <code className="font-mono">/exec</code>.</li>
                  </ul>
                </li>
                <li>
                  <strong>Push ke GitHub &amp; Deploy di Vercel</strong>:
                  <ul className="list-disc pl-5 mt-1 text-slate-600">
                    <li>Klik <strong>Export → Push to GitHub</strong> pada aplikasi ini.</li>
                    <li>Masuk ke <strong>vercel.com</strong> → <em>Add New Project</em> → pilih repositori GitHub tersebut.</li>
                    <li>Pada bagian <strong>Environment Variables</strong> di Vercel, tambahkan 2 variabel berikut:
                      <div className="mt-1 p-2.5 bg-slate-100 rounded-lg font-mono text-[11px] space-y-1">
                        <div>GAS_URL = https://script.google.com/macros/s/.../exec</div>
                        <div>GAS_API_KEY = (isi sama persis dengan API_KEY di langkah 4)</div>
                      </div>
                    </li>
                    <li>Klik <strong>Deploy</strong>. Selesai! Seluruh HP warga, desa, dan admin kini terhubung langsung ke Google Spreadsheet &amp; Drive Anda.</li>
                  </ul>
                </li>
              </ol>
            </div>
          )}

          {/* TAB 5: PANDUAN PENGGUNAAN 3 PERAN */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                <span className="font-bold text-emerald-950 block text-sm">1. Pemohon Mandiri (Warga Umum)</span>
                <p className="text-slate-700 mt-1 leading-relaxed">
                  Buka aplikasi di HP → Masuk dengan NIK (16 angka) dan tanggal lahir. Jika baru pertama kali, lengkapi nama &amp; nomor telepon. Klik <strong>+ Ajukan Layanan Baru</strong>, pilih jenis surat, isi keperluan, ambil foto berkas menggunakan kamera HP, lalu kirim. Pantau status dan unduh surat resmi ber-QR ketika berstatus "Selesai".
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/40">
                <span className="font-bold text-sky-950 block text-sm">2. Petugas Desa (Pendamping Warga di Balai Desa)</span>
                <p className="text-slate-700 mt-1 leading-relaxed">
                  Login dengan username desa (misal: <code className="font-mono">petugas_pulung</code> / <code className="font-mono">desa123</code>). Klik <strong>+ Ajukan untuk Warga</strong>. Ketik NIK warga yang datang ke kantor desa (jika pernah dilayani sebelumnya, nama &amp; alamat otomatis terisi). Foto dokumen fisik warga lewat webcam/kamera laptop, kirim, dan cetak <strong>Tanda Terima Resmi</strong> untuk dibawa pulang warga.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40">
                <span className="font-bold text-purple-950 block text-sm">3. Admin Kantor Kecamatan</span>
                <p className="text-slate-700 mt-1 leading-relaxed">
                  Login sebagai admin (<code className="font-mono">admin</code> / <code className="font-mono">admin123</code>). Buka menu <strong>Antrean Verifikasi</strong> untuk memeriksa keabsahan foto berkas. Setujui untuk proses, minta perbaikan jika foto buram, atau tolak. Saat berkas disetujui, klik <strong>Terbitkan Surat Resmi</strong>: sistem otomatis menyusun nomor registrasi surat, KOP resmi Kecamatan Pulung, dan barcode QR keaslian yang bisa diverifikasi publik.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900"
          >
            Tutup Dokumentasi
          </button>
        </div>
      </div>
    </div>
  );
};
