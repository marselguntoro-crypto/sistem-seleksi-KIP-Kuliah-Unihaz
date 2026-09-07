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

interface ImportExcelViewProps {
  existingParticipants: Participant[];
  studyPrograms: StudyProgram[];
  academicYears: AcademicYear[];
  onImportSuccess: (newParticipants: Participant[]) => void;
  onCancel: () => void;
}

export const ImportExcelView: React.FC<ImportExcelViewProps> = ({
  existingParticipants,
  studyPrograms,
  academicYears,
  onImportSuccess,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeYear = academicYears.find((y) => y.isActive) || academicYears[0];

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ImportPreviewRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'VALID' | 'ERROR' | 'DUPLICATE'>('ALL');
  const [transactionMode, setTransactionMode] = useState<'STRICT' | 'PARTIAL'>('STRICT');
  const [importStatus, setImportStatus] = useState<'IDLE' | 'SUCCESS' | 'ROLLED_BACK'>('IDLE');
  const [importedCount, setImportedCount] = useState(0);

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
        'Pilihan Prodi 2': 'S1 Akuntansi',
        'Asal Sekolah': 'SMKN 1 Arga Makmur',
        'Jurusan': 'Akuntansi',
        'Tahun Lulus': 2026,
        'Nomor WhatsApp': '085288990011',
        'Email': 'ratna.dewi@yahoo.com',
        'Desil': 'Desil 2',
        'Nama Orang Tua': 'Rustam',
        'Pekerjaan Orang Tua': 'Petani Sayur',
        'Penghasilan': 1100000,
        'Tanggungan': 3,
        'Alamat': 'Desa Rama Agung RT 03',
        'Kota': 'Bengkulu Utara',
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
      // Row 1: Valid
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
      // Row 2: Valid
      {
        'Nomor Pendaftaran': 'KIPK-2026-0502',
        'Nama Lengkap': 'Citra Kirana Lestari',
        'NIK': '1702015509060032',
        'NISN': '0067890123',
        'Pilihan Prodi 1': 'S1 Ilmu Hukum',
        'Pilihan Prodi 2': 'S1 Administrasi Publik',
        'Asal Sekolah': 'SMAN 1 Curup',
        'Jurusan': 'IPS',
        'Tahun Lulus': '2026',
        'Nomor WhatsApp': '085299001122',
        'Email': 'citra.kirana@gmail.com',
        'Desil': 'Desil 2',
        'Nama Orang Tua': 'Herman',
        'Pekerjaan Orang Tua': 'Pedagang',
        'Penghasilan': '1200000',
        'Tanggungan': '3',
        'Alamat': 'Jl. Merdeka No. 45, Curup',
        'Kota': 'Rejang Lebong',
        'Provinsi': 'Bengkulu'
      },
      // Row 3: Format Error (NIK kurang digit, NISN salah, prodi tidak valid)
      {
        'Nomor Pendaftaran': 'KIPK-2026-0503',
        'Nama Lengkap': 'Danang Prasetyo (Data Cacat)',
        'NIK': '177102140', // Error: only 9 digits
        'NISN': '00612', // Error: only 5 digits
        'Pilihan Prodi 1': 'S1 Kedokteran Gigi', // Error: not existing in UNIHAZ
        'Pilihan Prodi 2': 'S1 Kedokteran Gigi', // Error: duplicate choice
        'Asal Sekolah': 'SMAN 2 Bengkulu',
        'Jurusan': 'IPA',
        'Tahun Lulus': '2026',
        'Nomor WhatsApp': '081234', // Error: too short
        'Email': 'danang-tanpa-domain', // Error: invalid email
        'Desil': 'Desil 9', // Error: invalid desil
        'Nama Orang Tua': 'Prasetyo',
        'Pekerjaan Orang Tua': 'Karyawan',
        'Penghasilan': '1500000',
        'Tanggungan': '2',
        'Alamat': 'Jl. P. Natadirja',
        'Kota': 'Kota Bengkulu',
        'Provinsi': 'Bengkulu'
      },
      // Row 4: Duplicate Error with Database (same NIK with existing Ahmad Fauzan)
      {
        'Nomor Pendaftaran': 'KIPK-2026-0504',
        'Nama Lengkap': 'Ahmad Fauzan Duplikat',
        'NIK': '1771011204060001', // Duplicate NIK in DB!
        'NISN': '0065412891',
        'Pilihan Prodi 1': 'S1 Ilmu Hukum',
        'Pilihan Prodi 2': 'S1 Manajemen',
        'Asal Sekolah': 'SMAN 1 Kota Bengkulu',
        'Jurusan': 'MIPA',
        'Tahun Lulus': '2026',
        'Nomor WhatsApp': '081273849102',
        'Email': 'ahmad.fauzan@gmail.com',
        'Desil': 'Desil 1',
        'Nama Orang Tua': 'M. Yusuf',
        'Pekerjaan Orang Tua': 'Buruh',
        'Penghasilan': '950000',
        'Tanggungan': '4',
        'Alamat': 'Jl. Danau Dendam',
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
    const internalRegs = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const errors: string[] = [];

      const regNumber = String(row['Nomor Pendaftaran'] || row['regNumber'] || '').trim();
      const name = String(row['Nama Lengkap'] || row['Nama'] || row['name'] || '').trim();
      const nik = String(row['NIK'] || row['nik'] || '').replace(/[^0-9]/g, '');
      const nisn = String(row['NISN'] || row['nisn'] || '').replace(/[^0-9]/g, '');
      const prodi1Name = String(row['Pilihan Prodi 1'] || row['Pilihan 1'] || row['firstChoiceProdiName'] || '').trim();
      const prodi2Name = String(row['Pilihan Prodi 2'] || row['Pilihan 2'] || row['secondChoiceProdiName'] || '').trim();
      const schoolOrigin = String(row['Asal Sekolah'] || row['schoolOrigin'] || '').trim();
      const phone = String(row['Nomor WhatsApp'] || row['No HP'] || row['phone'] || '').trim();
      const email = String(row['Email'] || row['email'] || '').trim();
      const desil = String(row['Desil'] || row['desil'] || 'Desil 1').trim();
      const graduationYear = parseInt(row['Tahun Lulus'] || row['graduationYear']) || 2026;
      const parentName = String(row['Nama Orang Tua'] || row['parentName'] || 'Wali').trim();
      const parentJob = String(row['Pekerjaan Orang Tua'] || row['parentJob'] || 'Buruh/Petani').trim();
      const parentIncome = parseInt(row['Penghasilan'] || row['parentIncome']) || 1000000;
      const familyDependents = parseInt(row['Tanggungan'] || row['familyDependents']) || 3;
      const address = String(row['Alamat'] || row['address'] || 'Provinsi Bengkulu').trim();
      const city = String(row['Kota'] || row['city'] || 'Kota Bengkulu').trim();
      const province = String(row['Provinsi'] || row['province'] || 'Bengkulu').trim();

      // Field Check: Name
      if (!name) {
        errors.push('Nama calon peserta wajib diisi');
      }

      // Field Check: NIK 16 digits
      if (nik.length !== 16) {
        errors.push(`NIK harus berupa 16 digit angka (ditemukan ${nik.length} digit)`);
      }

      // Field Check: NISN 10 digits
      if (nisn.length !== 10) {
        errors.push(`NISN harus berupa 10 digit angka (ditemukan ${nisn.length} digit)`);
      }

      // Field Check: Phone
      if (phone.length < 9) {
        errors.push(`Nomor HP/WhatsApp '${phone}' tidak valid`);
      }

      // Field Check: Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Format email '${email}' tidak valid`);
      }

      // Check Desil
      const validDesils = ['Desil 1', 'Desil 2', 'Desil 3', 'Desil 4', 'P3KE'];
      if (!validDesils.includes(desil)) {
        errors.push(`Desil '${desil}' tidak valid. Harus antara Desil 1 s/d 4 atau P3KE`);
      }

      // Match Prodi 1
      const foundProdi1 = studyPrograms.find(
        (p) => p.name.toLowerCase() === prodi1Name.toLowerCase() || p.code === prodi1Name
      );
      if (!foundProdi1) {
        errors.push(`Program Studi Pilihan 1 '${prodi1Name}' tidak terdaftar di master data UNIHAZ`);
      }

      // Match Prodi 2
      const foundProdi2 = studyPrograms.find(
        (p) => p.name.toLowerCase() === prodi2Name.toLowerCase() || p.code === prodi2Name
      );
      if (!foundProdi2) {
        errors.push(`Program Studi Pilihan 2 '${prodi2Name}' tidak terdaftar di master data UNIHAZ`);
      }

      if (foundProdi1 && foundProdi2 && foundProdi1.id === foundProdi2.id) {
        errors.push('Pilihan Prodi 1 dan Pilihan 2 tidak boleh sama');
      }

      // Check Duplicates: Internal File Check
      let isDuplicate = false;
      if (internalNiks.has(nik)) {
        errors.push(`Duplikat dalam file: NIK ${nik} muncul lebih dari satu kali`);
        isDuplicate = true;
      } else if (nik) {
        internalNiks.add(nik);
      }

      if (regNumber && internalRegs.has(regNumber.toLowerCase())) {
        errors.push(`Duplikat dalam file: No Registrasi ${regNumber} ganda`);
        isDuplicate = true;
      } else if (regNumber) {
        internalRegs.add(regNumber.toLowerCase());
      }

      // Check Duplicates: Database Check
      const dbDuplicateNik = existingParticipants.find((p) => p.nik === nik);
      if (dbDuplicateNik) {
        errors.push(`Duplikat Database: NIK ${nik} sudah terdaftar atas nama ${dbDuplicateNik.name}`);
        isDuplicate = true;
      }

      const dbDuplicateReg = existingParticipants.find(
        (p) => p.regNumber.toLowerCase() === regNumber.toLowerCase()
      );
      if (dbDuplicateReg) {
        errors.push(`Duplikat Database: No Registrasi ${regNumber} sudah ada di database`);
        isDuplicate = true;
      }

      // Determine Status
      let status: 'VALID' | 'ERROR' | 'DUPLICATE' = 'VALID';
      if (isDuplicate) {
        status = 'DUPLICATE';
      } else if (errors.length > 0) {
        status = 'ERROR';
      }

      validatedRows.push({
        rowNumber: rowNum,
        name,
        regNumber: regNumber || `KIPK-2026-AUTO${rowNum}`,
        nik,
        nisn,
        firstChoiceProdiName: foundProdi1?.name || prodi1Name,
        secondChoiceProdiName: foundProdi2?.name || prodi2Name,
        schoolOrigin,
        phone,
        email,
        desil,
        status,
        errors,
        rawPayload: {
          name,
          regNumber: regNumber || `KIPK-2026-AUTO${rowNum}`,
          nik,
          nisn,
          academicYearId: activeYear.id,
          academicYearCode: activeYear.code,
          firstChoiceProdiId: foundProdi1?.id || studyPrograms[0]?.id || 1,
          firstChoiceProdiName: foundProdi1?.name || prodi1Name,
          secondChoiceProdiId: foundProdi2?.id || studyPrograms[1]?.id || 2,
          secondChoiceProdiName: foundProdi2?.name || prodi2Name,
          schoolOrigin,
          schoolType: 'SMA',
          schoolMajor: 'MIPA',
          graduationYear,
          phone,
          email,
          address,
          city,
          province,
          desil: desil as any,
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
    if (selectedTab === 'ERROR') return r.status === 'ERROR';
    if (selectedTab === 'DUPLICATE') return r.status === 'DUPLICATE';
    return true;
  });

  const validRowsCount = parsedRows.filter((r) => r.status === 'VALID').length;
  const errorRowsCount = parsedRows.filter((r) => r.status === 'ERROR').length;
  const duplicateRowsCount = parsedRows.filter((r) => r.status === 'DUPLICATE').length;

  // Execute Database Transaction Import
  const handleExecuteImport = () => {
    // Check if strict mode has errors
    if (transactionMode === 'STRICT' && (errorRowsCount > 0 || duplicateRowsCount > 0)) {
      setImportStatus('ROLLED_BACK');
      return;
    }

    const rowsToImport =
      transactionMode === 'STRICT'
        ? parsedRows.map((r) => r.rawPayload)
        : parsedRows.filter((r) => r.status === 'VALID').map((r) => r.rawPayload);

    if (rowsToImport.length === 0) {
      alert('Tidak ada baris valid yang dapat diimpor ke database.');
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

        <div className="flex items-center gap-2">
          <button
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
            <span>Muat Dataset Sampel Uji (4 Baris)</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Baris File</span>
              <div className="text-lg font-bold text-slate-900">{parsedRows.length} Baris</div>
              <div className="text-[10px] text-slate-500">Termasuk header</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Baris Valid (Siap Impor)</span>
              <div className="text-lg font-bold text-emerald-700">{validRowsCount} Baris</div>
              <div className="text-[10px] text-emerald-600">Lolos semua aturan validasi</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs bg-rose-50/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Format Error</span>
              <div className="text-lg font-bold text-rose-700">{errorRowsCount} Baris</div>
              <div className="text-[10px] text-rose-600">NIK/NISN/Email cacat</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs bg-amber-50/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Duplikat Terdeteksi</span>
              <div className="text-lg font-bold text-amber-700">{duplicateRowsCount} Baris</div>
              <div className="text-[10px] text-amber-600">Duplikat file atau database</div>
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
                  Sebanyak <strong>{importedCount} data calon mahasiswa</strong> berhasil dimasukkan ke dalam database peserta KIP-Kuliah UNIHAZ. Mengarahkan kembali ke daftar peserta...
                </p>
              </div>
            </div>
          )}

          {/* Preview Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Filter Tabs */}
            <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
              <div className="flex items-center gap-1.5">
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
                  Hanya Valid ({validRowsCount})
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
                <button
                  onClick={() => setSelectedTab('DUPLICATE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedTab === 'DUPLICATE'
                      ? 'bg-amber-700 text-white'
                      : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  Peringatan Duplikat ({duplicateRowsCount})
                </button>
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
                    <th className="py-2.5 px-3 text-center w-28">Status Verifikasi</th>
                    <th className="py-2.5 px-4">Nama Lengkap</th>
                    <th className="py-2.5 px-3 font-mono">NIK (16 Digit)</th>
                    <th className="py-2.5 px-3 font-mono">NISN</th>
                    <th className="py-2.5 px-4">Pilihan Prodi 1 & 2</th>
                    <th className="py-2.5 px-3 text-center">Desil</th>
                    <th className="py-2.5 px-4">Laporan Error Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((item) => (
                    <tr
                      key={item.rowNumber}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.status === 'ERROR'
                          ? 'bg-rose-50/40'
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
                        {item.status === 'ERROR' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Error Format</span>
                          </span>
                        )}
                        {item.status === 'DUPLICATE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Duplikat</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div>{item.name || '<KOSONG>'}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.schoolOrigin}</div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        <span className={item.nik.length !== 16 ? 'text-rose-600 font-bold bg-rose-100 px-1 rounded' : 'text-slate-800'}>
                          {item.nik || '-'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        <span className={item.nisn.length !== 10 ? 'text-rose-600 font-bold bg-rose-100 px-1 rounded' : 'text-slate-800'}>
                          {item.nisn || '-'}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap text-[11px]">
                        <div className="font-semibold text-blue-900">1. {item.firstChoiceProdiName}</div>
                        <div className="text-slate-500">2. {item.secondChoiceProdiName}</div>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {item.desil}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-xs">
                        {item.errors.length === 0 ? (
                          <span className="text-emerald-700 font-medium text-[11px]">Tidak ada kesalahan</span>
                        ) : (
                          <ul className="list-disc pl-3 text-rose-700 text-[11px] space-y-0.5 font-medium">
                            {item.errors.map((err, errIdx) => (
                              <li key={errIdx}>{err}</li>
                            ))}
                          </ul>
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
                {transactionMode === 'STRICT' ? (
                  <span>
                    Mode Strict: Jika Anda menekan Simpan, seluruh <strong>{parsedRows.length} baris</strong> akan dimasukkan atau dibatalkan bersama-sama.
                  </span>
                ) : (
                  <span>
                    Mode Skip Errors: Hanya <strong>{validRowsCount} baris valid</strong> yang akan dimasukkan ke database.
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
                  disabled={isProcessing || importStatus === 'SUCCESS' || (transactionMode === 'PARTIAL' && validRowsCount === 0)}
                  className={`px-5 py-2 rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer ${
                    transactionMode === 'STRICT' && (errorRowsCount > 0 || duplicateRowsCount > 0)
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>
                    {transactionMode === 'STRICT'
                      ? 'Eksekusi Import (DB::transaction)'
                      : `Eksekusi Import (${validRowsCount} Baris Valid)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
