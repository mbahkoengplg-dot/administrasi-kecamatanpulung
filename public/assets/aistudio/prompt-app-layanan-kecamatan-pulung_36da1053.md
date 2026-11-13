# PROMPT: Web App "Layanan Kecamatan Pulung"

Kamu adalah senior full-stack developer sekaligus UI/UX designer. Bangun aplikasi web **pelayanan administrasi Kantor Kecamatan Pulung** (Kab. Ponorogo, Jawa Timur) sesuai spesifikasi di bawah. Prioritas utama: **sederhana, alurnya jelas, mudah dipakai orang awam**, dan nyaman dibuka dari HP.

---

## 1. Tujuan

Memudahkan masyarakat mengurus administrasi di kecamatan, melalui dua jalur:

1. **Lewat Desa** – petugas desa menginput/mengajukan berkas warganya.
2. **Mandiri** – warga mengajukan sendiri tanpa harus ke balai desa.

Petugas kecamatan memverifikasi, memproses, dan menerbitkan hasilnya.

---

## 2. Peran Pengguna

| Peran | Siapa | Tugas Utama |
|---|---|---|
| **Admin Kecamatan** | Petugas kantor kecamatan | Verifikasi, proses, terbitkan surat, kelola data & laporan |
| **Petugas Desa** | Operator/perangkat desa se-Kecamatan Pulung | Pendamping warga yang kurang paham teknologi: input data & berkas warga di kantor desa, pantau status, perbaiki berkas |
| **Pemohon Mandiri** | Warga umum | Ajukan layanan sendiri, lacak status, unduh hasil |

---

## 3. Prinsip Desain (WAJIB)

- Bahasa Indonesia yang sederhana, tanpa istilah teknis.
- **Mobile-first**, tombol besar, huruf mudah dibaca (min. 16px).
- Satu halaman = satu tujuan. Maksimal 3 klik untuk mengajukan layanan.
- Form dibuat **bertahap (wizard)**: 1) Pilih layanan → 2) Isi data → 3) Unggah berkas → 4) Cek & kirim.
- Pesan error jelas dan ramah (contoh: "NIK harus 16 angka").
- Status selalu ditampilkan dengan warna + teks (bukan warna saja).
- Warna: hijau tua (utama), putih, abu muda. Hindari tampilan ramai.

---

## 4. Halaman Login (SATU untuk semua peran)

Hanya ada **satu halaman login** di `/masuk`. Sistem mengenali peran otomatis setelah login dan mengarahkan ke dashboard yang sesuai.

Halaman login punya **dua tab sederhana**:

### Tab A — "Warga" (Pemohon Mandiri) → default
**Tanpa daftar akun terpisah.** Login memakai **NIK + Tanggal Lahir** saja:

1. Warga isi **NIK (16 angka)** dan **Tanggal Lahir** (dd/mm/yyyy, boleh pakai pemilih tanggal).
2. Sistem cek sheet `warga`:
   - **NIK sudah ada** → tanggal lahir harus cocok dengan data tersimpan → masuk.
   - **NIK belum ada (pertama kali)** → tampilkan form singkat: Nama Lengkap, No. HP, Alamat/Desa → data dibuat otomatis, tanggal lahir yang diisi tersimpan → masuk.
3. Setelah masuk, warga tidak perlu isi data diri lagi saat mengajukan layanan.

Validasi NIK otomatis (berlaku untuk warga mandiri **dan** input petugas desa), karena tidak ada data warga sebagai pembanding:
- NIK wajib 16 angka. Digit ke-7 sampai ke-12 memuat tanggal lahir (hari + 40 untuk perempuan), lalu dicocokkan dengan tanggal lahir yang diketik; tidak cocok → ditolak dengan pesan jelas.
- Data warga **dibangun bertahap** dari pendaftaran pertama (mandiri) atau input petugas desa. Tidak ada kewajiban punya data awal.
- Akun/data warga baru berstatus **"belum terverifikasi"**; menjadi **"terverifikasi"** setelah admin mencocokkan foto KTP/KK pada pengajuan pertama yang disetujui.

Pengamanan (karena NIK dan tanggal lahir bukan rahasia):
- Salah 5x → kunci NIK tersebut 15 menit (hitung di `CacheService`).
- Pesan error sama untuk NIK salah maupun tanggal lahir salah ("Data tidak cocok"), agar NIK tidak bisa ditebak.
- Warga hanya melihat pengajuan miliknya; NIK ditampilkan sebagian (mask).
- Admin kecamatan **mencocokkan foto KTP/KK dengan data akun** saat verifikasi, jadi akun palsu tidak akan lolos jadi surat.
- Rate limit per perangkat/IP di sisi Vercel.

### Tab B — "Petugas" (Admin Kecamatan & Petugas Desa)
- Input: **Username** + **Password**.
- Akun petugas desa **dibuat oleh Admin Kecamatan** (tidak ada pendaftaran sendiri).
- Fitur: lupa password (reset oleh admin), wajib ganti password saat login pertama.
- Batasi percobaan login (5x salah → kunci 15 menit).

### Pengalihan setelah login
- Admin Kecamatan → `/admin`
- Petugas Desa → `/desa`
- Pemohon Mandiri → `/warga`

---

## 5. Daftar Layanan (sesuaikan tugas Kecamatan)

Siapkan sebagai **data master yang bisa diubah admin** (nama layanan, persyaratan, template surat).

1. **Pengantar Administrasi Kependudukan** – KTP-el, KK, akta kelahiran/kematian, pindah/datang.
2. **Surat Keterangan** – domisili, usaha, penghasilan, tidak mampu (SKTM).
3. **Surat Rekomendasi** – izin keramaian, usaha mikro/kecil, bantuan sosial/beasiswa.
4. **Pengantar Pernikahan** – pengantar nikah/rujuk (N1–N4) ke KUA.
5. **Pertanahan** – keterangan waris, pengantar sertifikat/riwayat tanah, legalisasi.
6. **Pengaduan & Layanan Lain** – keluhan, saran, permohonan lain.

Setiap layanan memiliki: deskripsi singkat, **checklist persyaratan**, jenis berkas yang diunggah, estimasi waktu selesai.

---

## 6. Alur Status Pengajuan (sama untuk semua jalur)

```
Diajukan → Diverifikasi → Diproses → Selesai (siap diambil / diunduh)
              ↓
      Perlu Perbaikan (kembali ke pemohon/desa)
              ↓
           Ditolak (disertai alasan)
```

- Setiap perubahan status: catat waktu + petugas + catatan.
- Status terbaru selalu tampil di dashboard pemohon dan petugas desa. Tersedia tombol "Hubungi Petugas" yang membuka WhatsApp kecamatan (tanpa gateway WhatsApp).
- Setiap pengajuan mendapat **Kode Pengajuan** unik, contoh: `PLG-2026-000123`.
- Jalur pengajuan ditandai: **Desa** atau **Mandiri**.

---

## 7. Fitur per Peran

### 7.1 Pemohon Mandiri (SANGAT SEDERHANA)
Dashboard hanya berisi:
- Tombol besar **"+ Ajukan Layanan Baru"**
- Daftar **"Pengajuan Saya"** (kode, jenis, status berwarna)
- Detail pengajuan: tahapan status (timeline), catatan petugas, tombol **Unduh Hasil** bila selesai
- Bila status "Perlu Perbaikan": tombol **"Perbaiki Berkas"**
- Tombol bantuan: **"Tanya Petugas via WhatsApp"**

**Tidak ada:** pengaturan rumit, laporan, banyak menu. Maksimal 3 menu: *Beranda, Pengajuan Saya, Bantuan*.

Pengajuan: wizard 4 langkah (lihat Prinsip Desain). Unggah berkas dari kamera/galeri HP (foto KTP, KK, dll.), kompres otomatis.

### 7.2 Petugas Desa (pendamping warga yang kurang paham teknologi)
Desa **tidak punya data warga awal**. Petugas desa melayani warga yang datang ke kantor desa dengan menginput datanya langsung. Data tersimpan dan terpakai lagi bila warga datang kembali.

- Dashboard: ringkasan jumlah pengajuan (diajukan / perlu perbaikan / selesai) **khusus desanya**.
- **Ajukan untuk Warga** (wizard 4 langkah, tombol besar):
  1. Isi **NIK** → bila sudah pernah tercatat, nama & data terisi otomatis; bila baru, isi Nama, Tanggal Lahir, No. HP (boleh kosong), Alamat. Validasi NIK otomatis (lihat bagian 4).
  2. Pilih layanan (+ checklist persyaratan).
  3. **Foto berkas langsung dari kamera HP/webcam petugas** (KTP, KK, dll.).
  4. Cek & kirim → tampil **Kode Pengajuan** + tombol **Cetak Tanda Terima** untuk warga.
- Daftar pengajuan desa + filter status, pencarian nama/NIK.
- Perbaiki berkas yang dikembalikan kecamatan.
- Lihat pengajuan mandiri warga desanya (hanya baca), untuk membantu warga yang bertanya.
- **Daftar Warga Desa Saya**: terisi otomatis dari warga yang pernah dilayani; petugas boleh memperbaiki salah ketik data (nama, alamat, No. HP).
- Hanya dapat melihat data **desanya sendiri**.

### 7.3 Admin Kecamatan
- Dashboard: statistik pengajuan (hari ini, bulan ini, per layanan, per desa, per jalur).
- **Antrean verifikasi**: lihat berkas → setujui / minta perbaikan / tolak (+ alasan).
- Proses & **terbitkan surat otomatis** dari template (nomor surat otomatis, tanda tangan/kop kecamatan, **QR verifikasi keaslian**), ekspor PDF.
- Kelola **layanan & persyaratan** (master data).
- Kelola **akun petugas desa** (buat, nonaktifkan, reset password) dan daftar 15+ desa di Kecamatan Pulung.
- Kelola pengajuan mandiri & pengajuan desa dalam satu daftar (filter jalur).
- **Verifikasi identitas warga**: bandingkan foto KTP/KK dengan data akun, tandai "terverifikasi".
- **Koreksi data warga** bila ada salah input atau akun diambil orang lain (ubah nama, tanggal lahir, NIK).
- **Laporan** bulanan/tahunan (ekspor Excel/PDF).
- Pengumuman singkat untuk beranda.
- **Log aktivitas** (siapa mengubah apa).

---

## 8. Halaman Publik (tanpa login)

- **Beranda**: nama layanan, tombol besar "Ajukan Layanan" (mengarah ke login jika belum masuk), daftar layanan + persyaratan, jam pelayanan, kontak/alamat kecamatan.
- **Cek Keaslian Surat**: scan QR / input nomor surat.

---

## 9. Struktur Halaman

```
/                 Beranda publik
/masuk            Login tunggal (tab Warga | Petugas)
/warga/*          Dashboard & pengajuan (Pemohon Mandiri)
/desa/*           Dashboard & pengajuan (Petugas Desa)
/admin/*          Dashboard, verifikasi, master data, laporan (Admin)
/verifikasi/{id}  Cek keaslian surat
```

---

## 10. Arsitektur & Teknologi (WAJIB: GAS + Spreadsheet + Drive + Vercel)

```
Browser (HP/PC)
   ↓
Vercel  → Frontend (Next.js, mobile-first) + API routes (proxy & sesi)
   ↓  (HTTPS + API key rahasia)
Google Apps Script (Web App)  → logika bisnis & API
   ↓                 ↓
Google Spreadsheet   Google Drive
(database)           (berkas, template & hasil surat PDF)
```

- **Vercel**: hosting frontend (Next.js + Tailwind CSS). API routes Vercel jadi perantara agar **URL & kunci GAS tidak terlihat di browser**. Sesi login memakai **cookie httpOnly bertanda tangan (JWT)** yang dibuat di API route Vercel.
- **Google Apps Script (GAS)**: di-deploy sebagai Web App (execute as: pemilik akun kecamatan). Semua baca/tulis data lewat GAS, endpoint: `login`, `pengajuan`, `verifikasi`, `terbitkan`, `layanan`, `laporan`, dll. Setiap request wajib membawa `API_KEY` (disimpan di *Script Properties* GAS dan *Environment Variables* Vercel).
- **Google Spreadsheet**: database. Satu file, satu tab per tabel (lihat bagian 11).
- **Google Drive**: folder privat `/LayananKecamatan/` berisi `/berkas/{kode_pengajuan}/`, `/template/`, `/hasil/`. File **tidak dibagikan publik**; unduhan lewat GAS yang mengecek hak akses.
- **Surat otomatis**: template Google Docs dengan placeholder `{{nama}}`, `{{nik}}` dst. → GAS menyalin, mengisi, mengekspor **PDF** ke Drive, memasang **QR verifikasi**.

Praktik wajib untuk GAS:
- Pakai `LockService` setiap menulis (nomor pengajuan & nomor surat tidak boleh kembar).
- Pakai `CacheService` untuk cache daftar layanan/desa dan penghitung percobaan login.
- Baca/tulis sheet per batch (`getValues`/`setValues`), jangan per sel.
- Unggahan berkas: dari browser kirim base64 (kompres foto ke maks. 1 MB di browser) → GAS simpan ke Drive. Maks. 5 file per pengajuan.
- Tangani batas kuota GAS (waktu eksekusi, email, URL fetch) dengan pesan error ramah.
- Catat versi deploy; sediakan skrip `setup()` yang membuat semua sheet, header, dan folder Drive otomatis.

---

## 11. Struktur Spreadsheet (satu tab = satu tabel)

- `users` (id, nama, username, password_hash, salt, role[admin|desa], desa_id, aktif, wajib_ganti_password)
- `desa` (id, nama)
- `warga` (nik, nama, tgl_lahir, no_hp, alamat, desa_id, terverifikasi, dibuat_oleh[mandiri|desa], dibuat_pada)
- `layanan` (id, nama, deskripsi, persyaratan, template_doc_id, estimasi_hari, aktif)
- `pengajuan` (kode, layanan_id, nik, jalur[desa|mandiri], diajukan_oleh, desa_id, status, catatan, nomor_surat, file_hasil_id, dibuat_pada, diubah_pada)
- `berkas` (id, kode_pengajuan, jenis, drive_file_id)
- `riwayat_status` (kode_pengajuan, status, catatan, oleh, waktu)
- `pengumuman`, `log_aktivitas`, `config` (penghitung kode & nomor surat, kop surat, jam layanan)

Aturan: kolom `nik` & `tgl_lahir` disimpan sebagai **teks** (hindari NIK berubah jadi notasi ilmiah, tanggal berubah format). Hanya akun pemilik yang boleh membuka Spreadsheet & Drive; **jangan bagikan link ke publik**.

---

## 12. Keamanan & Privasi (data kependudukan = sensitif)

- Password petugas di-hash dengan salt (SHA-256 via `Utilities.computeDigest`), wajib ganti saat login pertama.
- Login petugas: salah 5x → kunci 15 menit.
- Akses berbasis peran: petugas desa hanya data desanya; warga hanya pengajuannya sendiri. Validasi peran **di GAS**, bukan hanya di tampilan.
- HTTPS (otomatis di Vercel), cookie `httpOnly` + `secure` + `sameSite`, validasi semua input, sanitasi teks.
- Berkas: hanya JPG/PNG/PDF, maks. 5 MB, tersimpan privat di Drive.
- Log aktivitas semua perubahan status dan penerbitan surat.
- Cadangan: salin Spreadsheet & folder Drive otomatis tiap minggu (trigger GAS).
- Tampilkan pernyataan persetujuan penggunaan data saat warga pertama kali masuk.

---

## 13. Tahap Pengerjaan

1. **Setup**: skrip `setup()` GAS (sheet, header, folder Drive), deploy Web App, proyek Next.js di Vercel, env `GAS_URL`, `API_KEY`, `JWT_SECRET`.
2. **MVP**: login tunggal (warga NIK+tgl lahir, petugas username+password), 3 dashboard, wizard pengajuan, alur status, 3 layanan awal (Surat Keterangan, Pengantar Adminduk, Rekomendasi).
3. Penerbitan surat PDF otomatis dari template Docs + QR keaslian.
4. Laporan & ekspor, layanan lainnya, perbaikan dari masukan pengguna.

---

## 14. Output yang Diminta

1. Kode Apps Script lengkap (`Code.gs`, `appsscript.json`) beserta fungsi `setup()` dan panduan deploy Web App.
2. Proyek Next.js untuk Vercel (halaman, API routes, komponen) yang bisa dijalankan.
3. Data awal: 1 akun admin, daftar desa se-Kecamatan Pulung, 6 kategori layanan beserta persyaratan, contoh template surat.
4. Panduan instalasi singkat (Google, GAS, Vercel) + panduan penggunaan per peran (1 halaman masing-masing).
5. Semua teks antarmuka dalam **Bahasa Indonesia**.

> Catatan: pertahankan **kesederhanaan**. Bila ada fitur yang membuat alur membingungkan bagi warga awam, pilih opsi yang lebih sederhana.
