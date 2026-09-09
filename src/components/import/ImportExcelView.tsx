import React, { useState, useRef } from 'react';
import { Participant, StudyProgram, AcademicYear, ImportPreviewRow } from '../../types';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Database, 
  Layers, 
  HelpCircle,
  FileCheck,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ImportVerificationModal } from '../selection/ImportVerificationModal';

interface ImportExcelViewProps {
  existingParticipants: Participant[];
  studyPrograms: StudyProgram[];
  academicYears: AcademicYear[];
  onImportSuccess: (newParticipants: Participant[]) => void;
  onBatchUpdateParticipants?: (updatedParticipants: Participant[]) => void;
  onCancel: () => void;
}

export const ImportExcelView: React.FC<ImportExcelViewProps> = ({
  existingParticipants,
  studyPrograms,
  academicYears,
  onImportSuccess,
  onBatchUpdateParticipants,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeYear = academicYears.find((y) => y.isActive) || academicYears[0];

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ImportPreviewRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'VALID' | 'EXISTING' | 'ERROR' | 'DUPLICATE'>('ALL');
  const [transactionMode, setTransactionMode] = useState<'STRICT' | 'PARTIAL'>('STRICT');
  const [importStatus, setImportStatus] = useState<'IDLE' | 'SUCCESS' | 'ROLLED_BACK'>('IDLE');
  const [importedCount, setImportedCount] = useState(0);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Template Downloader
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nomor Pendaftaran': 'KIPK-2026-9001',
        'Nama Lengkap': 'Bambang Sudarsono',
        'NIK': '1771012508060020',
        'NISN': '0061298450',
        'Pilihan Prodi 1': 'S1 Informatika',
        'Pilihan Prodi 2': 'S1 Teknik Sipil',
        'Asal Sekolah': 'SMAN 3 Kota Bengkulu',
        'Jurusan': 'MIPA',
        'Tahun Lulus': 2026,
        'Nomor WhatsApp': '081273948192',
        'Email': 'bambang.sudarsono@gmail.com',
        'Desil': 'Desil 1',
        'Nama Orang Tua': 'Sudarsono',
        'Pekerjaan Orang Tua': 'Buruh Nelayan',
        'Penghasilan': 900000,
        'Tanggungan': 4,
        'Alamat': 'Jl. Bentiring RT 02/RW 01, Muara Bangkahulu',
        'Kota': 'Kota Bengkulu',
        'Provinsi': 'Bengkulu'
      },
      {
        'Nomor Pendaftaran': 'KIPK-2026-9002',
        'Nama Lengkap': 'Ratna Sari Dewi',
        'NIK': '1703014509060021',
        'NISN': '0068912340',
        'Pilihan Prodi 1': 'S1 Manajemen',
        'Pilihan Prodi 2': '', // Contoh Pilihan 2 Kosong (Boleh kosong/opsional)
        'Asal Sekolah': 'SMKN 1 Arga Makmur',
        'Jurusan': 'Akuntansi',
        'Tahun Lulus': 2026,
        'Nomor WhatsApp': '085288990011',
        'Email': 'ratna.dewi@yahoo.com',
        'Desil': 'DESIL 6-10', // Contoh format kapital (otomatis disesuaikan)
        'Nama Orang Tua': 'Rustam',
        'Pekerjaan Orang Tua': 'Petani Sayur',
        'Penghasilan': 1100000,
        'Tanggungan': 3,
        'Alamat': 'Desa Rama Agung RT 03',
        'Kota': 'Bengkulu Utara',
        'Provinsi': 'Bengkulu'
      },
      {
        'Nomor Pendaftaran': 'KIPK-2026-9003',
        'Nama Lengkap': 'Fajar Ramadhan',
        'NIK': '1771011503060022',
        'NISN': '0069921455',
        'Pilihan Prodi 1': 'S1 Ilmu Hukum',
        'Pilihan Prodi 2': '', // Pilihan 2 Kosong
        'Asal Sekolah': 'SMAN 2 Kota Bengkulu',
        'Jurusan': 'IPS',
        'Tahun Lulus': 2026,
        'Nomor WhatsApp': '081368994422',
        'Email': '', // Email opsional / fleksibel
        'Desil': 'desil 2', // Contoh format huruf kecil
        'Nama Orang Tua': 'Ramadhan',
        'Pekerjaan Orang Tua': 'Pedagang Kecil',
        'Penghasilan': 1250000,
        'Tanggungan': 3,
        'Alamat': 'Jl. Salak No. 14, Lingkar Timur',
        'Kota': 'Kota Bengkulu',
        'Provinsi': 'Bengkulu'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Peserta');
    XLSX.writeFile(wb, 'Template_Import_Peserta_KIPK_UNIHAZ.xlsx');
  };

  // Sample Data Injector for Instant Testing
  const handleLoadSampleTestData = () => {
    const testRawData = [
      // Row 1: Valid Lengkap
      {
        'Nomor Pendaftaran': 'KIPK-2026-0501',
        'Nama Lengkap': 'Bayu Wicaksono',
        'NIK': '1771021405060031',
        'NISN': '0061234567',
        'Pilihan Prodi 1': 'S1 Informatika',
        'Pilihan Prodi 2': 'S1 Teknik Sipil',
        'Asal Sekolah': 'SMAN 5 Kota Bengkulu',
        'Jurusan': 'MIPA',
        'Tahun Lulus': '2026',
        'Nomor WhatsApp': '081273998811',
        'Email': 'bayu.wicaksono@gmail.com',
        'Desil': 'Desil 1',
        'Nama Orang Tua': 'Sugiono',
        'Pekerjaan Orang Tua': 'Petani',
        'Penghasilan': '850000',
        'Tanggungan': '4',
        'Alamat': 'Jl. Danau Dendam No. 12',
        'Kota': 'Kota Bengkulu',
        'Provinsi': 'Bengkulu'
      },
      // Row 2: Valid dengan Prodi 2 Kosong, Desil Huruf Kapital 'DESIL 6-10', Format Email Fleksibel Kapital, & No HP Fleksibel (+62)
      {
        'Nomor Pendaftaran': 'KIPK-2026-0502',
        'Nama Lengkap': 'Citra Kirana Lestari',
        'NIK': '1702015509060032',
        'NISN': '0067890123',
        'Pilihan Prodi 1': 'S1 Ilmu Hukum',
        'Pilihan Prodi 2': '', // Pilihan 2 KOSONG -> sistem membaca & menerapkan kosong
        'Asal Sekolah': 'SMAN 1 Curup',
        'Jurusan': 'IPS',
        'Tahun Lulus': '2026',
        'Nomor WhatsApp': '+62 852-9900-1122', // Format HP fleksibel dengan +62 & spasi
        'Email': '  CITRA.KIRANA@GMAIL.COM  ', // Format email fleksibel kapital & spasi
        'Desil': 'DESIL 6-10', // Desil kapital -> otomatis disesuaikan ke 'Desil 6-10'
        'Nama Orang Tua': 'Herman',
        'Pekerjaan Orang Tua': 'Pedagang',
        'Penghasilan': '1200000',
        'Tanggungan': '3',
        'Alamat': 'Jl. Merdeka No. 45, Curup',
        'Kota': 'Rejang Lebong',
        'Provinsi': 'Bengkulu'
      },
      // Row 3: NISN tidak 8-10 digit (hanya 5 digit '00612') -> otomatis dianggap kosong penerapannya, NIK 9 digit -> error
      {
        'Nomor Pendaftaran': 'KIPK-2026-0503',
        'Nama Lengkap': 'Danang Prasetyo (Format NIK Cacat)',
        'NIK': '177102140', // Error: hanya 9 digit
        'NISN': '00612', // NISN hanya 5 digit: otomatis dianggap kosong, bukan error fatal
        'Pilihan Prodi 1': 'S1 Kedokteran Gigi', // Error: tidak terdaftar di UNIHAZ
        'Pilihan Prodi 2': '', // Kosong diterapkan kosong
        'Asal Sekolah': 'SMAN 2 Bengkulu',
        'Jurusan': 'IPA',
        'Tahun Lulus': '2026',
        'Nomor WhatsApp': '081234', // Format salah: otomatis nilai kosong
        'Email': 'danang-tanpa-domain', // Error: format email cacat
        'Desil': 'Desil 15', // Format desil tidak sesuai -> otomatis kosong
        'Nama Orang Tua': 'Prasetyo',
        'Pekerjaan Orang Tua': 'Karyawan',
        'Penghasilan': '1500000',
        'Tanggungan': '2',
        'Alamat': 'Jl. P. Natadirja',
        'Kota': 'Kota Bengkulu',
        'Provinsi': 'Bengkulu'
      },
      // Row 4: Data yang sudah ada di database (NIK 1771011204060001 atas nama Ahmad Fauzan)
      // Aturan: Tetap mempertahankan data lama di database (tidak ditimpa dan tidak menjadi error)
      {
        'Nomor Pendaftaran': 'KIPK-2026-0504',
        'Nama Lengkap': 'Ahmad Fauzan (Sudah Ada di Database)',
        'NIK': '1771011204060001', // NIK sudah ada di DB -> Status EXISTING (Data Lama Dipertahankan)
        'NISN': '0065412891',
        'Pilihan Prodi 1': 'S1 Ilmu Hukum',
        'Pilihan Prodi 2': 'S1 Manajemen',
        'Asal Sekolah': 'SMAN 1 Kota Bengkulu',
        'Jurusan': 'MIPA',
        'Tahun Lulus': '2026',
        'Nomor WhatsApp': '081273849102',
        'Email': 'ahmad.fauzan@gmail.com',
        'Desil': 'desil 1',
        'Nama Orang Tua': 'M. Yusuf',
        'Pekerjaan Orang Tua': 'Buruh',
        'Penghasilan': '950000',
        'Tanggungan': '4',
        'Alamat': 'Jl. Danau Dendam',
        'Kota': 'Kota Bengkulu',
        'Provinsi': 'Bengkulu'
      },
      // Row 5: No Registrasi sama dengan Row 1 ('KIPK-2026-0501')
      // Aturan: Peringatan duplikat No Registrasi dalam file diabaikan saja lebih fleksibel
      {
        'Nomor Pendaftaran': 'KIPK-2026-0501', // No Registrasi sama dengan Row 1, diabaikan & diterima fleksibel
        'Nama Lengkap': 'Eka Putri Rahayu',
        'NIK': '1771035508060045',
        'NISN': '0069988771',
        'Pilihan Prodi 1': 'S1 Akuntansi',
        'Pilihan Prodi 2': 'S1 Manajemen',
        'Asal Sekolah': 'SMAN 4 Kota Bengkulu',
        'Jurusan': 'IPS',
        'Tahun Lulus': '2026',
        'Nomor WhatsApp': '082188776655',
        'Email': 'eka.putri@gmail.com',
        'Desil': 'Desil 2',
        'Nama Orang Tua': 'Rahayu',
        'Pekerjaan Orang Tua': 'Wiraswasta',
        'Penghasilan': '1100000',
        'Tanggungan': '3',
        'Alamat': 'Jl. Basuki Rahmat',
        'Kota': 'Kota Bengkulu',
        'Provinsi': 'Bengkulu'
      }
    ];

    setUploadedFileName('Dataset_Sampel_Pengujian_KIPK.xlsx');
    validateAndSetRows(testRawData);
  };

  // Core Validator Engine
  const validateAndSetRows = (rawRows: any[]) => {
    const validatedRows: ImportPreviewRow[] = [];
    const internalNiks = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const errors: string[] = [];
      const warnings: string[] = [];

      const regNumber = String(row['Nomor Pendaftaran'] || row['regNumber'] || '').trim();
      const name = String(row['Nama Lengkap'] || row['Nama'] || row['name'] || '').trim();
      const nik = String(row['NIK'] || row['nik'] || '').replace(/[^0-9]/g, '');

      // ========================================================================
      // Format NISN Lebih Fleksibel:
      // Aturan: Jika NISN tidak 8-10 digit maka otomatis dianggap kosong penerapannya
      // ========================================================================
      const rawNisn = String(
        row['NISN'] || row['nisn'] || row['Nomor Induk Siswa Nasional'] || row['No. NISN'] || ''
      ).trim();
      let nisn = '';
      if (rawNisn) {
        const trimmedNisnLower = rawNisn.toLowerCase();
        const isPlaceholder = ['-', '--', 'tidak ada', 'none', 'n/a', 'kosong', 'null'].includes(trimmedNisnLower);
        if (!isPlaceholder) {
          const cleanDigits = rawNisn.replace(/[^0-9]/g, '');
          if (cleanDigits.length >= 8 && cleanDigits.length <= 10) {
            nisn = cleanDigits;
          } else {
            // Jika tidak 8-10 digit -> otomatis dianggap kosong penerapannya
            nisn = '';
            warnings.push(`NISN '${rawNisn}' bukan 8-10 digit (otomatis dianggap kosong)`);
          }
        }
      }

      const schoolOrigin = String(row['Asal Sekolah'] || row['schoolOrigin'] || '').trim();
      const graduationYear = parseInt(row['Tahun Lulus'] || row['graduationYear']) || 2026;
      const parentName = String(row['Nama Orang Tua'] || row['parentName'] || 'Wali').trim();
      const parentJob = String(row['Pekerjaan Orang Tua'] || row['parentJob'] || 'Buruh/Petani').trim();
      const parentIncome = parseInt(row['Penghasilan'] || row['parentIncome']) || 1000000;
      const familyDependents = parseInt(row['Tanggungan'] || row['familyDependents']) || 3;
      const address = String(row['Alamat'] || row['address'] || 'Provinsi Bengkulu').trim();
      const city = String(row['Kota'] || row['city'] || 'Kota Bengkulu').trim();
      const province = String(row['Provinsi'] || row['province'] || 'Bengkulu').trim();

      // ========================================================================
      // 1. Program Studi Pilihan 1 & Pilihan 2
      // Aturan: Jika Pilihan 2 kosong di data import, sistem membaca & menerapkan kosong
      // ========================================================================
      const rawProdi1Name = String(
        row['Pilihan Prodi 1'] || row['Pilihan 1'] || row['firstChoiceProdiName'] || row['Prodi Pilihan 1'] || ''
      ).trim();
      const rawProdi2Name = String(
        row['Pilihan Prodi 2'] || row['Pilihan 2'] || row['secondChoiceProdiName'] || row['Prodi Pilihan 2'] || row['Pilihan Ke-2'] || ''
      ).trim();

      // Match Prodi 1 (Wajib Ada)
      const foundProdi1 = studyPrograms.find(
        (p) => p.name.toLowerCase() === rawProdi1Name.toLowerCase() || p.code.toLowerCase() === rawProdi1Name.toLowerCase()
      );
      if (!rawProdi1Name) {
        errors.push('Program Studi Pilihan 1 wajib diisi');
      } else if (!foundProdi1) {
        errors.push(`Program Studi Pilihan 1 '${rawProdi1Name}' tidak terdaftar di master data UNIHAZ`);
      }

      // Match Prodi 2 (Opsional: Jika kosong di data import, dibaca dan diterapkan kosong)
      let secondChoiceProdiId = 0;
      let secondChoiceProdiName = '';
      const isProdi2Empty =
        !rawProdi2Name ||
        ['-', '--', 'kosong', 'tidak ada', 'tidak memilih', 'belum memilih', 'none', 'n/a', 'null'].includes(rawProdi2Name.toLowerCase());

      if (!isProdi2Empty) {
        const foundProdi2 = studyPrograms.find(
          (p) => p.name.toLowerCase() === rawProdi2Name.toLowerCase() || p.code.toLowerCase() === rawProdi2Name.toLowerCase()
        );
        if (!foundProdi2) {
          errors.push(`Program Studi Pilihan 2 '${rawProdi2Name}' tidak terdaftar di master data UNIHAZ`);
          secondChoiceProdiName = rawProdi2Name;
        } else {
          secondChoiceProdiId = foundProdi2.id;
          secondChoiceProdiName = foundProdi2.name;
          if (foundProdi1 && foundProdi2 && foundProdi1.id === foundProdi2.id) {
            errors.push('Pilihan Prodi 1 dan Pilihan 2 tidak boleh sama');
          }
        }
      }

      // ========================================================================
      // 2. Email (Format email lebih fleksibel)
      // Pembersihan spasi, tanda petik, lowercase, dukungan subdomain/plus addressing,
      // dan nilai kosong/placeholder diizinkan tanpa memicu error validasi.
      // ========================================================================
      const rawEmail = String(row['Email'] || row['email'] || row['Alamat Email'] || row['E-mail'] || row['Surel'] || '').trim();
      let email = '';
      if (rawEmail) {
        const trimmedLower = rawEmail.toLowerCase();
        const isEmailPlaceholder = ['-', '--', 'tidak ada', 'none', 'n/a', 'kosong', 'null', 'undefined', 'belum ada'].includes(trimmedLower);
        if (!isEmailPlaceholder) {
          // Bersihkan spasi tidak disengaja, tanda petik pembungkus, dan tanda baca di akhir cell
          let cleanedEmail = rawEmail.replace(/[\s"']/g, '').replace(/[.,;:]+$/, '').toLowerCase();
          
          // Regex fleksibel: cek komponen user, @, dan domain dengan minimal 1 titik
          const flexibleEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
          if (flexibleEmailRegex.test(cleanedEmail)) {
            email = cleanedEmail;
          } else if (cleanedEmail.includes('@') && cleanedEmail.split('@')[1]?.includes('.')) {
            // Toleransi domain khusus
            email = cleanedEmail;
          } else {
            errors.push(`Format email '${rawEmail}' tidak valid`);
            email = cleanedEmail;
          }
        }
      }

      // ========================================================================
      // 3. Desil Kemiskinan
      // Aturan: Jika di data import tulisannya capital atau tidak (contoh 'DESIL 6-10'),
      // ketika di upload disesuaikan, atau otomatis kosong jika tidak sesuai format
      // ========================================================================
      const rawDesil = String(
        row['Desil'] || row['desil'] || row['Kategori Desil'] || row['Desil P3KE'] || row['desilEkonomi'] || ''
      ).trim();

      let normalizedDesil = '';
      if (rawDesil) {
        const cleanDesil = rawDesil.toLowerCase().replace(/[\s_\-]+/g, ' ').trim();
        if (cleanDesil === '1' || cleanDesil === 'desil 1' || cleanDesil === 'desil1') {
          normalizedDesil = 'Desil 1';
        } else if (cleanDesil === '2' || cleanDesil === 'desil 2' || cleanDesil === 'desil2') {
          normalizedDesil = 'Desil 2';
        } else if (cleanDesil === '3' || cleanDesil === 'desil 3' || cleanDesil === 'desil3') {
          normalizedDesil = 'Desil 3';
        } else if (cleanDesil === '4' || cleanDesil === 'desil 4' || cleanDesil === 'desil4') {
          normalizedDesil = 'Desil 4';
        } else if (cleanDesil === '5' || cleanDesil === 'desil 5' || cleanDesil === 'desil5') {
          normalizedDesil = 'Desil 5';
        } else if (
          cleanDesil === '6 10' || cleanDesil === '6-10' || cleanDesil === 'desil 6 10' || 
          cleanDesil === 'desil 6-10' || cleanDesil === 'desil6-10' ||
          cleanDesil === '6' || cleanDesil === '7' || cleanDesil === '8' || cleanDesil === '9' || cleanDesil === '10' ||
          cleanDesil === 'desil 6' || cleanDesil === 'desil 7' || cleanDesil === 'desil 8' || cleanDesil === 'desil 9' || cleanDesil === 'desil 10'
        ) {
          normalizedDesil = 'Desil 6-10';
        } else if (
          cleanDesil === 'non desil' || cleanDesil === 'non-desil' || cleanDesil === 'nondesil' ||
          cleanDesil === 'p3ke' || cleanDesil === 'sktm' || cleanDesil === 'non desil p3ke' || cleanDesil === 'non-desil p3ke'
        ) {
          normalizedDesil = 'Non-Desil';
        } else {
          // Tidak sesuai format -> otomatis kosong (tidak menjadi error fatal yang memblokir import)
          normalizedDesil = '';
          warnings.push(`Format Desil '${rawDesil}' tidak sesuai (otomatis dikosongkan)`);
        }
      }

      // ========================================================================
      // 4. Nomor HP / WhatsApp
      // Aturan: Jika formatnya salah sistem membaca tidak valid dan otomatis nilainya kosong
      // ========================================================================
      const rawPhone = String(
        row['Nomor WhatsApp'] || row['No WhatsApp'] || row['Nomor HP'] || row['No HP'] || 
        row['phone'] || row['WhatsApp'] || row['Telepon'] || row['No. HP'] || ''
      ).trim();

      let phone = '';
      if (rawPhone) {
        const trimmedPhoneLower = rawPhone.toLowerCase();
        const isPhonePlaceholder = ['-', '--', 'tidak ada', 'none', 'n/a', 'kosong', 'null'].includes(trimmedPhoneLower);
        if (!isPhonePlaceholder) {
          // Hilangkan karakter pemformatan seperti spasi, tanda strip, kurung, dan titik
          let cleanDigits = rawPhone.replace(/[\s\-\(\)\.]/g, '');
          if (cleanDigits.startsWith('+62')) {
            cleanDigits = '0' + cleanDigits.slice(3);
          } else if (cleanDigits.startsWith('62')) {
            cleanDigits = '0' + cleanDigits.slice(2);
          } else if (cleanDigits.startsWith('8')) {
            cleanDigits = '0' + cleanDigits;
          }

          const isDigitsOnly = /^[0-9]+$/.test(cleanDigits);
          const isValidLength = cleanDigits.length >= 9 && cleanDigits.length <= 15;

          if (isDigitsOnly && isValidLength) {
            phone = cleanDigits;
          } else {
            // Format salah: sistem membaca tidak valid dan otomatis nilainya kosong
            phone = '';
            warnings.push(`Nomor HP/WA '${rawPhone}' tidak valid (otomatis dikosongkan)`);
          }
        }
      }

      // ========================================================================
      // 5. Validasi Standar Identitas Utama (Nama, NIK 16 digit)
      // ========================================================================
      // Field Check: Name
      if (!name) {
        errors.push('Nama calon peserta wajib diisi');
      }

      // Field Check: NIK 16 digits
      if (nik.length !== 16) {
        errors.push(`NIK harus berupa 16 digit angka (ditemukan ${nik.length} digit)`);
      }

      // CATATAN: Format NISN lebih fleksibel telah diproses di atas:
      // Jika NISN tidak 8-10 digit maka otomatis dianggap kosong penerapannya tanpa error fatal.

      // ========================================================================
      // 6. Pemeriksaan Duplikasi & Pengecekan Data yang Sudah Pernah Diimpor
      // Aturan Pengguna:
      // - Peringatan duplikat No Registrasi dalam file diabaikan saja (lebih fleksibel)
      // - Jika sudah pernah import data, ketika import lagi dan ada data yang sama (NIK sama),
      //   maka sistem tetap mempertahankan data yang lama.
      // ========================================================================
      let isDuplicateInFile = false;
      if (internalNiks.has(nik)) {
        errors.push(`Duplikat dalam file: NIK ${nik} muncul lebih dari satu kali dalam berkas ini`);
        isDuplicateInFile = true;
      } else if (nik) {
        internalNiks.add(nik);
      }

      // Cek apakah data sudah pernah ada di database sebelumnya (berdasarkan NIK)
      const dbDuplicateNik = existingParticipants.find((p) => p.nik === nik);
      const isExistingInDb = Boolean(dbDuplicateNik);

      if (isExistingInDb && dbDuplicateNik) {
        warnings.push(
          `Sudah terdaftar di sistem atas nama "${dbDuplicateNik.name}" (${dbDuplicateNik.regNumber}). Data lama di database tetap dipertahankan.`
        );
      }

      // Determine Status
      let status: 'VALID' | 'ERROR' | 'DUPLICATE' | 'EXISTING' = 'VALID';
      if (errors.length > 0) {
        status = 'ERROR';
      } else if (isDuplicateInFile) {
        status = 'DUPLICATE';
      } else if (isExistingInDb) {
        status = 'EXISTING';
      }

      validatedRows.push({
        rowNumber: rowNum,
        name,
        regNumber: regNumber || `KIPK-2026-AUTO${rowNum}`,
        nik,
        nisn,
        firstChoiceProdiName: foundProdi1?.name || rawProdi1Name,
        secondChoiceProdiName: secondChoiceProdiName,
        schoolOrigin,
        phone,
        email,
        desil: normalizedDesil,
        status,
        isExistingInDb,
        errors,
        warnings,
        rawPayload: {
          name,
          regNumber: regNumber || `KIPK-2026-AUTO${rowNum}`,
          nik,
          nisn,
          academicYearId: activeYear.id,
          academicYearCode: activeYear.code,
          firstChoiceProdiId: foundProdi1?.id || studyPrograms[0]?.id || 1,
          firstChoiceProdiName: foundProdi1?.name || rawProdi1Name,
          secondChoiceProdiId: secondChoiceProdiId,
          secondChoiceProdiName: secondChoiceProdiName,
          schoolOrigin,
          schoolType: 'SMA',
          schoolMajor: 'MIPA',
          graduationYear,
          phone,
          email,
          address,
          city,
          province,
          desil: normalizedDesil as any,
          parentName,
          parentJob,
          parentIncome,
          familyDependents,
          documentStatus: 'Belum Diverifikasi',
          utbkScore: 0,
          interviewScore: 0,
          surveyScore: 0,
          finalScore: 0,
          selectionStatus: 'Belum Diproses',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
        }
      });
    });

    setParsedRows(validatedRows);
  };

  // Handle Real File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadedFileName(file.name);
    setImportStatus('IDLE');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet);

        validateAndSetRows(jsonRows);
      } catch (err) {
        alert('Gagal membaca file Excel/CSV. Pastikan format file valid.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Filtered rows for preview table
  const filteredRows = parsedRows.filter((r) => {
    if (selectedTab === 'VALID') return r.status === 'VALID';
    if (selectedTab === 'EXISTING') return r.status === 'EXISTING';
    if (selectedTab === 'ERROR') return r.status === 'ERROR';
    if (selectedTab === 'DUPLICATE') return r.status === 'DUPLICATE';
    return true;
  });

  const validRowsCount = parsedRows.filter((r) => r.status === 'VALID').length;
  const existingRowsCount = parsedRows.filter((r) => r.status === 'EXISTING').length;
  const errorRowsCount = parsedRows.filter((r) => r.status === 'ERROR').length;
  const duplicateRowsCount = parsedRows.filter((r) => r.status === 'DUPLICATE').length;

  // Execute Database Transaction Import
  const handleExecuteImport = () => {
    // Check if strict mode has fatal errors
    // Catatan: Baris EXISTING bukan error dan tidak membatalkan transaksi karena data lama sengaja dipertahankan.
    if (transactionMode === 'STRICT' && (errorRowsCount > 0 || duplicateRowsCount > 0)) {
      setImportStatus('ROLLED_BACK');
      return;
    }

    // Hanya baris baru yang berstatus VALID yang diimpor ke database
    const rowsToImport = parsedRows
      .filter((r) => r.status === 'VALID')
      .map((r) => r.rawPayload);

    if (rowsToImport.length === 0) {
      if (existingRowsCount > 0) {
        alert(
          `Semua ${existingRowsCount} data peserta dalam file ini sudah terdaftar sebelumnya di database. Sistem tetap mempertahankan data lama tanpa ada yang diubah.`
        );
      } else {
        alert('Tidak ada baris baru yang valid untuk diimpor ke database.');
      }
      return;
    }

    // Build actual Participant objects with sequential ID
    let currentMaxId = Math.max(...existingParticipants.map((p) => p.id), 0);
    const newParticipants: Participant[] = rowsToImport.map((payload) => {
      currentMaxId += 1;
      return {
        ...payload,
        id: currentMaxId
      };
    });

    setImportedCount(newParticipants.length);
    setImportStatus('SUCCESS');

    // Notify parent to append to main state
    setTimeout(() => {
      onImportSuccess(newParticipants);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#1e3a8a] p-5 text-white shadow-sm border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 uppercase tracking-wider mb-2">
            <Upload className="w-3.5 h-3.5 text-yellow-400" />
            <span>Modul Import Data Masal & Validasi Transaksi</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Import Data Calon Peserta KIP-Kuliah (Excel/CSV)
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Mendukung file XLSX, XLS, dan CSV. Dilengkapi deteksi format NIK/NISN, validasi prodi, pencegahan duplikasi database, serta mekanisme rollback transaksi database (<code className="font-mono bg-blue-950 px-1 py-0.5 rounded">DB::transaction</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsVerificationModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer whitespace-nowrap"
            title="Upload data pemeriksaan berkas verifikator"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Data Verifikasi Berkas</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Download Format Template Excel</span>
          </button>
        </div>
      </div>

      {/* Upload Zone & Test Injector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dropzone */}
        <div className="md:col-span-2 bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-blue-700 transition flex flex-col items-center justify-center space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              {uploadedFileName ? uploadedFileName : 'Pilih atau Drag File Excel/CSV ke Sini'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Format yang didukung: .xlsx, .xls, .csv (Maksimal 10 MB atau 5.000 baris)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse File Komputer</span>
            </button>
          </div>
        </div>

        {/* Quick Testing & Guidance Card */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Pengujian Cepat (Test Runner)</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Tidak memiliki file Excel saat ini? Muat dataset sampel uji bawaan sistem yang memuat baris valid, format error, dan duplikat database secara instan:
            </p>
          </div>

          <button
            onClick={handleLoadSampleTestData}
            className="w-full py-2 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Dataset Sampel Uji (5 Skenario Uji)</span>
          </button>

          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Otomatis memicu validator & error reporting</span>
          </div>
        </div>
      </div>

      {/* PREVIEW & VALIDATION SECTION */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          {/* Status Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Baris File</span>
              <div className="text-lg font-bold text-slate-900">{parsedRows.length} Baris</div>
              <div className="text-[10px] text-slate-500">Termasuk seluruh baris</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Baris Baru (Siap Impor)</span>
              <div className="text-lg font-bold text-emerald-700">{validRowsCount} Baris</div>
              <div className="text-[10px] text-emerald-600">Peserta baru belum terdaftar</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs bg-blue-50/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Data Lama Dipertahankan</span>
              <div className="text-lg font-bold text-blue-700">{existingRowsCount} Baris</div>
              <div className="text-[10px] text-blue-600">Sudah di database, tidak ditimpa</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs bg-rose-50/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Format Error</span>
              <div className="text-lg font-bold text-rose-700">{errorRowsCount} Baris</div>
              <div className="text-[10px] text-rose-600">NIK cacat / Prodi 1 salah</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs bg-amber-50/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Duplikat File</span>
              <div className="text-lg font-bold text-amber-700">{duplicateRowsCount} Baris</div>
              <div className="text-[10px] text-amber-600">NIK ganda dalam satu file</div>
            </div>
          </div>

          {/* Transaction Strategy Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-900" />
                <span>Strategi Transaksi Database (Laravel DB::transaction)</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pilih perilaku sistem saat menghadapi baris yang cacat atau bermasalah dalam file.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="txMode"
                  checked={transactionMode === 'STRICT'}
                  onChange={() => setTransactionMode('STRICT')}
                  className="text-blue-900 focus:ring-blue-800"
                />
                <span>Strict Mode (Rollback jika ada 1 error)</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="txMode"
                  checked={transactionMode === 'PARTIAL'}
                  onChange={() => setTransactionMode('PARTIAL')}
                  className="text-blue-900 focus:ring-blue-800"
                />
                <span>Skip Errors (Hanya masukkan baris valid)</span>
              </label>
            </div>
          </div>

          {/* Rollback Alert if triggered */}
          {importStatus === 'ROLLED_BACK' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3 animate-in fade-in">
              <RotateCcw className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-900">Transaksi Database Dibatalkan (DB::rollBack)!</h4>
                <p className="mt-1 leading-relaxed">
                  Karena Anda memilih <strong>Strict Mode</strong>, sistem membatalkan seluruh operasi import karena terdapat <strong>{errorRowsCount + duplicateRowsCount} baris bermasalah</strong>. Perbaiki file Anda atau alihkan ke mode <em>Skip Errors</em> untuk memasukkan hanya baris yang valid.
                </p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {importStatus === 'SUCCESS' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-3 animate-in fade-in">
              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900">Transaksi Database Berhasil (DB::commit)!</h4>
                <p className="mt-1 leading-relaxed">
                  Sebanyak <strong>{importedCount} data peserta baru</strong> berhasil dimasukkan ke dalam database. {existingRowsCount > 0 ? `Sebanyak ${existingRowsCount} data yang sudah ada sebelumnya tetap dipertahankan.` : ''} Mengarahkan kembali ke daftar peserta...
                </p>
              </div>
            </div>
          )}

          {/* Preview Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Filter Tabs */}
            <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedTab('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedTab === 'ALL'
                      ? 'bg-blue-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua Baris ({parsedRows.length})
                </button>
                <button
                  onClick={() => setSelectedTab('VALID')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedTab === 'VALID'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  Baris Baru ({validRowsCount})
                </button>
                <button
                  onClick={() => setSelectedTab('EXISTING')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedTab === 'EXISTING'
                      ? 'bg-blue-700 text-white'
                      : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  Data Lama Dipertahankan ({existingRowsCount})
                </button>
                <button
                  onClick={() => setSelectedTab('ERROR')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedTab === 'ERROR'
                      ? 'bg-rose-700 text-white'
                      : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  Format Error ({errorRowsCount})
                </button>
                {duplicateRowsCount > 0 && (
                  <button
                    onClick={() => setSelectedTab('DUPLICATE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedTab === 'DUPLICATE'
                        ? 'bg-amber-700 text-white'
                        : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    Duplikat File ({duplicateRowsCount})
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500">
                Pemeriksaan baris sebelum commit ke database
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200 sticky top-0">
                    <th className="py-2.5 px-3 text-center w-14">Baris</th>
                    <th className="py-2.5 px-3 text-center w-36">Status Verifikasi</th>
                    <th className="py-2.5 px-4">Nama Lengkap</th>
                    <th className="py-2.5 px-3 font-mono">NIK (16 Digit)</th>
                    <th className="py-2.5 px-3 font-mono">NISN</th>
                    <th className="py-2.5 px-4">Pilihan Prodi 1 & 2</th>
                    <th className="py-2.5 px-3 text-center">Desil</th>
                    <th className="py-2.5 px-4">Laporan Verifikasi / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((item) => (
                    <tr
                      key={item.rowNumber}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.status === 'ERROR'
                          ? 'bg-rose-50/40'
                          : item.status === 'EXISTING'
                          ? 'bg-blue-50/40'
                          : item.status === 'DUPLICATE'
                          ? 'bg-amber-50/40'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                        #{item.rowNumber}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.status === 'VALID' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Siap Impor</span>
                          </span>
                        )}
                        {item.status === 'EXISTING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            <span>Data Lama Dipertahankan</span>
                          </span>
                        )}
                        {item.status === 'ERROR' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Error Format</span>
                          </span>
                        )}
                        {item.status === 'DUPLICATE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Duplikat File</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div>{item.name || '<KOSONG>'}</div>
                        <div className="text-[10px] text-slate-500 font-normal flex items-center gap-2 mt-0.5">
                          <span>{item.schoolOrigin}</span>
                          <span>&bull;</span>
                          <span className="font-mono">
                            {item.phone ? item.phone : <span className="text-slate-400 italic">HP Kosong</span>}
                          </span>
                          {item.email && (
                            <>
                              <span>&bull;</span>
                              <span>{item.email}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        <span className={item.nik.length !== 16 ? 'text-rose-600 font-bold bg-rose-100 px-1 rounded' : 'text-slate-800'}>
                          {item.nik || '-'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        {item.nisn ? (
                          <span className="text-slate-800">{item.nisn}</span>
                        ) : (
                          <span className="text-slate-400 italic font-sans font-normal text-[10px]">Kosong</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap text-[11px]">
                        <div className="font-semibold text-blue-900">1. {item.firstChoiceProdiName}</div>
                        <div className="text-slate-500">
                          2. {item.secondChoiceProdiName || (
                            <span className="text-slate-400 italic font-normal">Kosong (Tidak Memilih)</span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.desil ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.desil === 'Desil 1'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : item.desil === 'Desil 2'
                                ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                : item.desil === 'Desil 3'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : item.desil === 'Desil 4'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                : item.desil === 'Desil 5'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : item.desil === 'Desil 6-10'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {item.desil}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            Kosong
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-xs">
                        {item.errors.length === 0 && (!item.warnings || item.warnings.length === 0) ? (
                          <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Tidak ada kesalahan</span>
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {item.errors.length > 0 && (
                              <ul className="list-disc pl-3 text-rose-700 text-[11px] space-y-0.5 font-medium">
                                {item.errors.map((err, errIdx) => (
                                  <li key={errIdx}>{err}</li>
                                ))}
                              </ul>
                            )}
                            {item.warnings && item.warnings.length > 0 && (
                              <ul className="list-disc pl-3 text-amber-700 text-[10px] space-y-0.5">
                                {item.warnings.map((warn, wIdx) => (
                                  <li key={wIdx}>{warn}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                {validRowsCount > 0 ? (
                  <span>
                    Siap memasukkan <strong>{validRowsCount} data peserta baru</strong>. Sebanyak <strong>{existingRowsCount} data yang sudah ada</strong> tetap dipertahankan di database tanpa perubahan.
                  </span>
                ) : existingRowsCount > 0 ? (
                  <span className="text-blue-800 font-medium">
                    Semua <strong>{existingRowsCount} data dalam berkas ini</strong> sudah ada di database. Sistem tetap mempertahankan data lama secara utuh.
                  </span>
                ) : (
                  <span>
                    Tidak ada baris valid baru untuk diimpor.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isProcessing || importStatus === 'SUCCESS' || validRowsCount === 0}
                  className={`px-5 py-2 rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer ${
                    validRowsCount === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : transactionMode === 'STRICT' && (errorRowsCount > 0 || duplicateRowsCount > 0)
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>
                    {validRowsCount > 0
                      ? `Eksekusi Import (${validRowsCount} Data Baru)`
                      : 'Semua Data Lama Dipertahankan'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Verification Import Modal */}
      <ImportVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        participants={existingParticipants}
        onBatchUpdate={(updatedList) => {
          if (onBatchUpdateParticipants) {
            onBatchUpdateParticipants(updatedList);
          }
        }}
      />
    </div>
  );
};
