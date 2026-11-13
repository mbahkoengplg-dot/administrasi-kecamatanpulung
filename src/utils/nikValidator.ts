/**
 * NIK Validator sesuai aturan kependudukan Republik Indonesia:
 * Format 16 digit: PPKKCC DDMMYY SSSS
 * - PP: Provinsi (35 = Jawa Timur)
 * - KK: Kabupaten/Kota (02 = Ponorogo)
 * - CC: Kecamatan (e.g. 01, 15, etc.)
 * - DD: Tanggal Lahir (Pria: 01-31, Wanita: 41-71 [Tanggal + 40])
 * - MM: Bulan Lahir (01-12)
 * - YY: 2 Digit Akhir Tahun Lahir
 * - SSSS: Nomor Urut Komputerisasi
 */

export interface NikParseResult {
  isValid: boolean;
  errorMessage?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  day?: number;
  month?: number;
  yearSuffix?: number;
  inferredBirthdateStr?: string;
}

export function parseNik(nik: string): NikParseResult {
  const cleanNik = nik.trim();

  if (!cleanNik) {
    return { isValid: false, errorMessage: 'NIK wajib diisi.' };
  }

  if (!/^\d+$/.test(cleanNik)) {
    return { isValid: false, errorMessage: 'NIK hanya boleh memuat angka.' };
  }

  if (cleanNik.length !== 16) {
    return {
      isValid: false,
      errorMessage: `NIK harus tepat 16 angka (saat ini ${cleanNik.length} angka).`,
    };
  }

  const dayRaw = parseInt(cleanNik.substring(6, 8), 10);
  const month = parseInt(cleanNik.substring(8, 10), 10);
  const yearSuffix = parseInt(cleanNik.substring(10, 12), 10);

  const isFemale = dayRaw > 40;
  const actualDay = isFemale ? dayRaw - 40 : dayRaw;

  if (actualDay < 1 || actualDay > 31) {
    return {
      isValid: false,
      errorMessage: 'Digit tanggal lahir pada NIK tidak valid.',
    };
  }

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      errorMessage: 'Digit bulan lahir pada NIK tidak valid.',
    };
  }

  return {
    isValid: true,
    gender: isFemale ? 'Perempuan' : 'Laki-laki',
    day: actualDay,
    month,
    yearSuffix,
    inferredBirthdateStr: `${String(actualDay).padStart(2, '0')}/${String(month).padStart(2, '0')}/xx${String(yearSuffix).padStart(2, '0')}`,
  };
}

/**
 * Validasi kecocokan antara NIK dan Tanggal Lahir input (YYYY-MM-DD atau DD/MM/YYYY)
 */
export function validateNikWithBirthDate(
  nik: string,
  birthDateInput: string
): { isValid: boolean; errorMessage?: string; parsedGender?: string } {
  const nikParsed = parseNik(nik);
  if (!nikParsed.isValid) {
    return { isValid: false, errorMessage: nikParsed.errorMessage };
  }

  if (!birthDateInput) {
    return { isValid: false, errorMessage: 'Tanggal lahir wajib diisi.' };
  }

  // Parse input date (supports YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY)
  let inDay = 0;
  let inMonth = 0;
  let inYear = 0;

  if (birthDateInput.includes('-') && birthDateInput.split('-')[0].length === 4) {
    // YYYY-MM-DD
    const parts = birthDateInput.split('-');
    inYear = parseInt(parts[0], 10);
    inMonth = parseInt(parts[1], 10);
    inDay = parseInt(parts[2], 10);
  } else if (birthDateInput.includes('/')) {
    // DD/MM/YYYY
    const parts = birthDateInput.split('/');
    inDay = parseInt(parts[0], 10);
    inMonth = parseInt(parts[1], 10);
    inYear = parseInt(parts[2], 10);
  } else if (birthDateInput.includes('-')) {
    // DD-MM-YYYY
    const parts = birthDateInput.split('-');
    inDay = parseInt(parts[0], 10);
    inMonth = parseInt(parts[1], 10);
    inYear = parseInt(parts[2], 10);
  } else {
    return { isValid: false, errorMessage: 'Format tanggal lahir tidak valid.' };
  }

  const inYearSuffix = inYear % 100;

  if (
    nikParsed.day !== inDay ||
    nikParsed.month !== inMonth ||
    nikParsed.yearSuffix !== inYearSuffix
  ) {
    return {
      isValid: false,
      errorMessage: 'Tanggal lahir yang dimasukkan tidak cocok dengan NIK Anda.',
    };
  }

  return { isValid: true, parsedGender: nikParsed.gender };
}

/**
 * Masking NIK untuk keamanan tampilan: 350201******0001
 */
export function maskNik(nik: string): string {
  if (!nik || nik.length < 10) return nik;
  return `${nik.substring(0, 6)}******${nik.substring(12)}`;
}
