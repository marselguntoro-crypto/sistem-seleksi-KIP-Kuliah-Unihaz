import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Participant, StudyProgram, User } from '../../types';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Save,
  X,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Award,
  Edit3,
  FileSpreadsheet,
  Download,
  Upload,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UtbkScoreViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  currentUser: User;
  onUpdateParticipant: (participant: Participant) => void;
  onBatchUpdateParticipants?: (participants: Participant[], message?: string) => void;
}

interface ParsedScoreRow {
  rowNum: number;
  regNumber: string;
  nisn: string;
  name: string;
  rawScore: any;
  parsedScore: number | null;
  notes: string;
  matchedParticipant: Participant | null;
  status: 'VALID' | 'UNMATCHED' | 'INVALID_SCORE';
  errorMessage?: string;
}

export const UtbkScoreView: React.FC<UtbkScoreViewProps> = ({
  participants,
  studyPrograms,
  currentUser,
  onUpdateParticipant,
  onBatchUpdateParticipants
}) => {
  // Mode selection: 'MANUAL' or 'IMPORT'
  const [activeMode, setActiveMode] = useState<'MANUAL' | 'IMPORT'>('MANUAL');

  // Manual Mode State
  const [searchTerm, setSearchTerm] = useState('');
  const [prodiFilter, setProdiFilter] = useState<string>('ALL');
  const [scoreStatusFilter, setScoreStatusFilter] = useState<'ALL' | 'INPUTTED' | 'EMPTY'>('ALL');

  // Modal State for Manual Input
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [utbkScoreInput, setUtbkScoreInput] = useState<string>('');
  const [operatorName, setOperatorName] = useState('');
  const [utbkDate, setUtbkDate] = useState('');
  const [utbkNotes, setUtbkNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Import Mode State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedScoreRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'ISSUES'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Quick stats for participants
  const stats = useMemo(() => {
    const total = participants.length;
    const inputted = participants.filter((p) => (p.utbkScore || 0) > 0);
    const count = inputted.length;
    const scores = inputted.map((p) => p.utbkScore || 0);
    const avg = count > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
    const max = count > 0 ? Math.max(...scores) : 0;
    const min = count > 0 ? Math.min(...scores) : 0;
    return { total, count, avg, max, min, pending: total - count };
  }, [participants]);

  // Filtered participants for manual mode
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nisn.includes(searchTerm);

      const matchesProdi =
        prodiFilter === 'ALL' ||
        String(p.firstChoiceProdiId) === prodiFilter ||
        p.firstChoiceProdiName.toLowerCase().includes(prodiFilter.toLowerCase());

      const matchesStatus =
        scoreStatusFilter === 'ALL' ||
        (scoreStatusFilter === 'INPUTTED' && (p.utbkScore || 0) > 0) ||
        (scoreStatusFilter === 'EMPTY' && (!p.utbkScore || p.utbkScore === 0));

      return matchesSearch && matchesProdi && matchesStatus;
    });
  }, [participants, searchTerm, prodiFilter, scoreStatusFilter]);

  // Handle Manual Modal Open
  const handleOpenScoreModal = (p: Participant) => {
    setSelectedParticipant(p);
    setUtbkScoreInput(p.utbkScore ? String(p.utbkScore) : '');
    setOperatorName(p.utbkOperator || currentUser.name);
    setUtbkDate(p.utbkDate || new Date().toISOString().split('T')[0]);
    setUtbkNotes(p.utbkNotes || `Skor UTBK/TPA resmi Kemdikbud.`);
    setValidationError(null);
  };

  // Handle Manual Save
  const handleSaveScore = () => {
    if (!selectedParticipant) return;

    const num = parseFloat(utbkScoreInput.replace(',', '.'));
    if (isNaN(num)) {
      setValidationError('Nilai UTBK harus berupa angka valid.');
      return;
    }

    if (num < 0 || num > 100) {
      setValidationError('Validasi gagal: Nilai UTBK wajib berada dalam rentang 0 – 100.');
      return;
    }

    const updated: Participant = {
      ...selectedParticipant,
      utbkScore: Math.round(num * 100) / 100,
      utbkOperator: operatorName,
      utbkDate,
      utbkNotes,
      updatedAt: new Date().toISOString()
    };

    onUpdateParticipant(updated);
    setSelectedParticipant(null);
  };

  // ==========================================
  // IMPORT UTBK SCORES LOGIC
  // ==========================================

  // Process rows from Excel/JSON
  const processImportRows = (rawRows: any[], sourceName: string) => {
    setFileName(sourceName);
    setImportSuccessMessage(null);

    const results: ParsedScoreRow[] = rawRows.map((row, index) => {
      const rowNum = index + 2; // Assuming row 1 is header

      // Extract registration number
      const regNumber = String(
        row['Nomor Pendaftaran'] ||
        row['No Pendaftaran'] ||
        row['No. Pendaftaran'] ||
        row['No Registrasi'] ||
        row['regNumber'] ||
        row['Nomor Registrasi'] ||
        ''
      ).trim();

      // Extract NISN
      const rawNisn = String(
        row['NISN'] ||
        row['nisn'] ||
        row['Nomor Induk Siswa Nasional'] ||
        ''
      ).trim().replace(/[^0-9]/g, '');

      // Extract Name (optional for display)
      const name = String(
        row['Nama Lengkap'] ||
        row['Nama'] ||
        row['name'] ||
        ''
      ).trim();

      // Extract Score
      const rawScore =
        row['Nilai UTBK'] ??
        row['Skor UTBK'] ??
        row['Nilai'] ??
        row['utbkScore'] ??
        row['Skor'] ??
        '';

      // Extract Notes
      const notes = String(
        row['Catatan'] ||
        row['Keterangan'] ||
        row['notes'] ||
        row['Keterangan Nilai'] ||
        ''
      ).trim();

      // Parse Score
      let parsedScore: number | null = null;
      let isScoreValid = false;

      if (rawScore !== '' && rawScore !== null && rawScore !== undefined) {
        const cleanedScoreStr = String(rawScore).replace(',', '.').trim();
        const num = parseFloat(cleanedScoreStr);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          parsedScore = Math.round(num * 100) / 100;
          isScoreValid = true;
        }
      }

      // Match Participant
      let matched: Participant | null = null;
      if (regNumber) {
        matched = participants.find(
          (p) => p.regNumber.toLowerCase() === regNumber.toLowerCase()
        ) || null;
      }
      if (!matched && rawNisn) {
        matched = participants.find((p) => p.nisn === rawNisn) || null;
      }

      // Determine Status
      let status: 'VALID' | 'UNMATCHED' | 'INVALID_SCORE' = 'VALID';
      let errorMessage: string | undefined = undefined;

      if (!matched) {
        status = 'UNMATCHED';
        errorMessage = `Peserta dengan No. Reg '${regNumber || '-'}' atau NISN '${rawNisn || '-'}' tidak ditemukan di database.`;
      } else if (!isScoreValid) {
        status = 'INVALID_SCORE';
        errorMessage = `Nilai '${rawScore}' tidak valid (wajib berupa angka antara 0.00 – 100.00).`;
      }

      return {
        rowNum,
        regNumber: regNumber || (matched ? matched.regNumber : '-'),
        nisn: rawNisn || (matched ? matched.nisn : '-'),
        name: name || (matched ? matched.name : '-'),
        rawScore,
        parsedScore,
        notes,
        matchedParticipant: matched,
        status,
        errorMessage
      };
    });

    setParsedRows(results);
  };

  // Handle File Upload via Input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('File Excel atau CSV kosong atau tidak memiliki data.');
          return;
        }

        processImportRows(data, file.name);
      } catch (err) {
        console.error('Failed to parse file:', err);
        alert('Gagal membaca file. Pastikan format file adalah .xlsx, .xls, atau .csv yang valid.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Quick Demo / Sample Test Runner
  const handleLoadSampleScores = () => {
    if (participants.length === 0) {
      alert('Tidak ada data peserta di sistem untuk dipasangkan nilai.');
      return;
    }

    // Pick first 5 participants and generate sample scores
    const sampleData: any[] = participants.slice(0, 5).map((p, idx) => {
      const sampleScore = [88.75, 76.50, 91.25, 83.00, 68.50][idx % 5];
      return {
        'Nomor Pendaftaran': p.regNumber,
        'NISN': p.nisn,
        'Nama Lengkap': p.name,
        'Program Studi': p.firstChoiceProdiName,
        'Nilai UTBK': sampleScore,
        'Catatan': 'Hasil Ujian CBT Gelombang 1'
      };
    });

    // Add 1 unmatched row for testing error detection
    sampleData.push({
      'Nomor Pendaftaran': 'KIPK-2026-9999',
      'NISN': '0099999999',
      'Nama Lengkap': 'Peserta Uji Error (Unmatched)',
      'Program Studi': 'S1 Hukum',
      'Nilai UTBK': 85.00,
      'Catatan': 'Uji Coba Unmatched'
    });

    // Add 1 invalid score row for testing validation
    if (participants.length > 5) {
      const p = participants[5];
      sampleData.push({
        'Nomor Pendaftaran': p.regNumber,
        'NISN': p.nisn,
        'Nama Lengkap': p.name,
        'Program Studi': p.firstChoiceProdiName,
        'Nilai UTBK': 150.00,
        'Catatan': 'Uji Coba Skor Di Luar Rentang'
      });
    }

    processImportRows(sampleData, 'data-sampel-nilai-utbk-demo.xlsx');
  };

  // Download Blank Excel Template
  const handleDownloadBlankTemplate = () => {
    const templateData = [
      {
        'Nomor Pendaftaran': 'KIPK-2026-0001',
        'NISN': '0065412891',
        'Nama Lengkap': 'Ahmad Fauzi',
        'Program Studi': 'S1 Teknik Informatika',
        'Nilai UTBK': 87.50,
        'Catatan': 'Skor UTBK SNBT 2026'
      },
      {
        'Nomor Pendaftaran': 'KIPK-2026-0002',
        'NISN': '0065412892',
        'Nama Lengkap': 'Siti Nurhaliza',
        'Program Studi': 'S1 Manajemen',
        'Nilai UTBK': 79.25,
        'Catatan': 'Skor TPA Mandiri UNIHAZ'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Nilai_UTBK');
    XLSX.writeFile(wb, 'Format_Template_Import_Nilai_UTBK_UNIHAZ.xlsx');
  };

  // Download Template pre-filled with Registered Participants
  const handleDownloadActiveParticipantsTemplate = () => {
    if (participants.length === 0) {
      alert('Belum ada peserta terdaftar untuk diunduh.');
      return;
    }

    const data = participants.map((p, idx) => ({
      'No': idx + 1,
      'Nomor Pendaftaran': p.regNumber,
      'NISN': p.nisn,
      'Nama Lengkap': p.name,
      'Program Studi': p.firstChoiceProdiName,
      'Nilai UTBK': (p.utbkScore || 0) > 0 ? p.utbkScore : '',
      'Catatan': p.utbkNotes || 'Hasil UTBK SNBT / CBT'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar_Peserta_Nilai');
    XLSX.writeFile(wb, `Template_Peserta_Nilai_UTBK_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Apply Batch Import
  const handleApplyBatchImport = () => {
    const validRows = parsedRows.filter((r) => r.status === 'VALID' && r.matchedParticipant && r.parsedScore !== null);
    if (validRows.length === 0) {
      alert('Tidak ada baris valid yang siap disimpan.');
      return;
    }

    setIsProcessing(true);
    const today = new Date().toISOString().split('T')[0];

    // Build updated participants list
    const updatedParticipantsList: Participant[] = validRows.map((r) => {
      const p = r.matchedParticipant!;
      return {
        ...p,
        utbkScore: r.parsedScore!,
        utbkOperator: currentUser.name,
        utbkDate: today,
        utbkNotes: r.notes || `Import Excel (${fileName || 'File'})`,
        updatedAt: new Date().toISOString()
      };
    });

    if (onBatchUpdateParticipants) {
      onBatchUpdateParticipants(
        updatedParticipantsList,
        `Sebanyak ${updatedParticipantsList.length} nilai UTBK peserta berhasil diperbarui ke sistem.`
      );
    } else {
      updatedParticipantsList.forEach((p) => onUpdateParticipant(p));
    }

    setIsProcessing(false);
    setImportSuccessMessage(`Berhasil memperbarui ${validRows.length} nilai UTBK calon mahasiswa.`);
    setParsedRows([]);
    setFileName(null);
  };

  // Import Mode Metrics
  const importMetrics = useMemo(() => {
    const total = parsedRows.length;
    const valid = parsedRows.filter((r) => r.status === 'VALID').length;
    const unmatched = parsedRows.filter((r) => r.status === 'UNMATCHED').length;
    const invalidScore = parsedRows.filter((r) => r.status === 'INVALID_SCORE').length;
    return { total, valid, unmatched, invalidScore, issues: unmatched + invalidScore };
  }, [parsedRows]);

  // Filtered Parsed Rows for Preview
  const filteredParsedRows = useMemo(() => {
    if (previewFilter === 'VALID') return parsedRows.filter((r) => r.status === 'VALID');
    if (previewFilter === 'ISSUES') return parsedRows.filter((r) => r.status !== 'VALID');
    return parsedRows;
  }, [parsedRows, previewFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner & Mode Selector */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-indigo-900 text-white rounded-lg shadow-2xs">
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Tahap 2: Pengelolaan Nilai UTBK / TPA
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Seleksi Tahap Pertama
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan skor Tes Potensi Akademik / UTBK SNBT sebagai bagian evaluasi seleksi tahap pertama bersama wawancara.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveMode('MANUAL')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'MANUAL'
                ? 'bg-white text-indigo-950 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Isi Manual</span>
          </button>

          <button
            onClick={() => setActiveMode('IMPORT')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'IMPORT'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Nilai (Excel/CSV)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${activeMode === 'IMPORT' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-100 text-indigo-800'}`}>
              Batch
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {importSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{importSuccessMessage}</span>
          </div>
          <button
            onClick={() => {
              setImportSuccessMessage(null);
              setActiveMode('MANUAL');
            }}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer"
          >
            Lihat di Tabel Manual &rarr;
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: ISI MANUAL                                                        */}
      {/* ========================================================================= */}
      {activeMode === 'MANUAL' && (
        <div className="space-y-6">
          {/* Quick Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Peserta</span>
              <div className="text-lg font-bold text-slate-900">{stats.total}</div>
              <div className="text-[10px] text-slate-500">Seluruh calon mahasiswa</div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-indigo-200 shadow-xs bg-indigo-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Sudah Diinput</span>
              <div className="text-lg font-bold text-indigo-900">{stats.count}</div>
              <div className="text-[10px] text-indigo-600">
                {stats.total > 0 ? `${Math.round((stats.count / stats.total) * 100)}% selesai` : '0%'}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-xs bg-amber-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Belum Ada Skor</span>
              <div className="text-lg font-bold text-amber-900">{stats.pending}</div>
              <div className="text-[10px] text-amber-600">Perlu input nilai</div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-Rata</span>
              <div className="text-lg font-bold text-slate-800">{stats.avg.toFixed(1)}</div>
              <div className="text-[10px] text-slate-500">Skor rata-rata peserta</div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Tertinggi</span>
              <div className="text-lg font-bold text-emerald-700">{stats.max.toFixed(1)}</div>
              <div className="text-[10px] text-emerald-600">Skor maksimum</div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Terendah</span>
              <div className="text-lg font-bold text-rose-700">{stats.min.toFixed(1)}</div>
              <div className="text-[10px] text-rose-600">Skor minimum terisi</div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, no. reg, NISN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter:</span>
              </div>
              <select
                value={scoreStatusFilter}
                onChange={(e) => setScoreStatusFilter(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="ALL">Semua Nilai</option>
                <option value="INPUTTED">Sudah Diinput</option>
                <option value="EMPTY">Belum Diinput (0.0)</option>
              </select>

              <select
                value={prodiFilter}
                onChange={(e) => setProdiFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="ALL">Semua Program Studi</option>
                {studyPrograms.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setActiveMode('IMPORT')}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Excel</span>
              </button>
            </div>
          </div>

          {/* UTBK Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Peserta & NISN</th>
                    <th className="py-3 px-4">Pilihan Prodi</th>
                    <th className="py-3 px-4">Asal Sekolah</th>
                    <th className="py-3 px-4">Operator Pencatat</th>
                    <th className="py-3 px-4">Tanggal Input</th>
                    <th className="py-3 px-4 text-center">Nilai UTBK (0–100)</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada calon mahasiswa yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p, idx) => {
                      const hasScore = (p.utbkScore || 0) > 0;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono bg-blue-50 text-blue-800 px-1 py-0.2 rounded text-[10px]">
                                {p.regNumber}
                              </span>
                              <span>NISN: {p.nisn}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {p.firstChoiceProdiName}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-800">{p.schoolOrigin}</div>
                            <div className="text-[11px] text-slate-400">{p.schoolMajor || 'Umum'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-slate-700">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span>{p.utbkOperator || 'Petugas SPMB'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {p.utbkDate || (hasScore ? p.createdAt.split(' ')[0] : '-')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {hasScore ? (
                              <span
                                className={`inline-block px-3 py-1 rounded-md font-bold text-xs ${
                                  (p.utbkScore || 0) >= 85
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                    : (p.utbkScore || 0) >= 70
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                {p.utbkScore?.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs font-mono">0.00</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleOpenScoreModal(p)}
                              className="px-3 py-1 bg-indigo-900 text-white hover:bg-indigo-800 rounded font-semibold text-xs flex items-center gap-1 mx-auto cursor-pointer transition-colors shadow-2xs"
                            >
                              <Edit3 className="w-3 h-3" />
                              {hasScore ? 'Ubah' : 'Input Nilai'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: IMPORT NILAI DARI EXCEL / CSV                                     */}
      {/* ========================================================================= */}
      {activeMode === 'IMPORT' && (
        <div className="space-y-6">
          {/* Action Toolbar & Download Template */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="px-2 py-0.5 rounded bg-indigo-800/80 text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                Fitur Import Nilai UTBK
              </span>
              <h2 className="text-lg font-bold mt-1">Import Massal Nilai UTBK / TPA</h2>
              <p className="text-xs text-indigo-200 mt-0.5 max-w-2xl leading-relaxed">
                Unggah file Excel (.xlsx, .xls) atau CSV. Sistem mencocokkan peserta via Nomor Pendaftaran atau NISN (8–10 digit) serta memvalidasi skor (rentang 0 s/d 100).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadActiveParticipantsTemplate}
                className="px-3 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Unduh format excel yang sudah terisi nomor dan nama peserta aktif"
              >
                <Download className="w-4 h-4" />
                <span>Download Daftar Peserta (.xlsx)</span>
              </button>

              <button
                onClick={handleDownloadBlankTemplate}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Unduh format template kosong"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Format Kosong</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone & Test Runner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File Dropzone */}
            <div className="md:col-span-2 bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-indigo-600 transition flex flex-col items-center justify-center space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-900">
                <FileSpreadsheet className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {fileName ? fileName : 'Pilih atau Tarik File Excel/CSV Nilai UTBK ke Sini'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Format yang didukung: .xlsx, .xls, .csv (Kolom utama: Nomor Pendaftaran / NISN, Nilai UTBK)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse File Excel Komputer</span>
                </button>
              </div>
            </div>

            {/* Quick Test / Demo Card */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Uji Coba Cepat (Test Demo)</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Belum memiliki file Excel? Klik tombol di bawah untuk memuat data simulasi nilai yang langsung dipasangkan dengan peserta yang terdaftar di database.
                </p>
              </div>

              <button
                onClick={handleLoadSampleScores}
                className="w-full px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-indigo-900 font-bold text-xs border border-indigo-300 shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Muat Data Sampel Nilai</span>
              </button>
            </div>
          </div>

          {/* Parsed Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Baris File</span>
                  <div className="text-lg font-bold text-slate-900">{importMetrics.total} Baris</div>
                  <div className="text-[10px] text-slate-500">Seluruh entri terbaca</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Valid (Siap Disimpan)</span>
                  <div className="text-lg font-bold text-emerald-700">{importMetrics.valid} Peserta</div>
                  <div className="text-[10px] text-emerald-600">Peserta cocok & skor valid</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs bg-amber-50/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Tidak Ditemukan</span>
                  <div className="text-lg font-bold text-amber-700">{importMetrics.unmatched} Baris</div>
                  <div className="text-[10px] text-amber-600">No. Reg / NISN tidak di DB</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs bg-rose-50/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Format Nilai Cacat</span>
                  <div className="text-lg font-bold text-rose-700">{importMetrics.invalidScore} Baris</div>
                  <div className="text-[10px] text-rose-600">Bukan angka atau di luar 0–100</div>
                </div>
              </div>

              {/* Filter Tabs & Batch Apply Action */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewFilter('ALL')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      previewFilter === 'ALL'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({importMetrics.total})
                  </button>

                  <button
                    onClick={() => setPreviewFilter('VALID')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      previewFilter === 'VALID'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    Hanya Siap Update ({importMetrics.valid})
                  </button>

                  <button
                    onClick={() => setPreviewFilter('ISSUES')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      previewFilter === 'ISSUES'
                        ? 'bg-rose-700 text-white'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    Hanya Bermasalah ({importMetrics.issues})
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFileName(null);
                    }}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                  >
                    Batal / Reset
                  </button>

                  <button
                    onClick={handleApplyBatchImport}
                    disabled={importMetrics.valid === 0 || isProcessing}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? 'Menyimpan...'
                        : `Terapkan & Simpan ${importMetrics.valid} Nilai ke Database`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Baris</th>
                        <th className="py-3 px-4">No. Pendaftaran / NISN</th>
                        <th className="py-3 px-4">Peserta di Database</th>
                        <th className="py-3 px-4">Program Studi</th>
                        <th className="py-3 px-4 text-center">Nilai Lama</th>
                        <th className="py-3 px-4 text-center">Nilai Baru (File)</th>
                        <th className="py-3 px-4 text-center">Status Validasi</th>
                        <th className="py-3 px-4">Keterangan / Pesan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredParsedRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Tidak ada data dalam filter ini.
                          </td>
                        </tr>
                      ) : (
                        filteredParsedRows.map((r) => {
                          const isMatched = !!r.matchedParticipant;
                          const currentScore = r.matchedParticipant?.utbkScore || 0;

                          return (
                            <tr
                              key={r.rowNum}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                r.status === 'UNMATCHED'
                                  ? 'bg-amber-50/20'
                                  : r.status === 'INVALID_SCORE'
                                  ? 'bg-rose-50/20'
                                  : ''
                              }`}
                            >
                              <td className="py-3 px-4 font-mono font-medium text-slate-400">
                                #{r.rowNum}
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-mono font-bold text-slate-800">
                                  {r.regNumber}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  NISN: {r.nisn}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                {isMatched ? (
                                  <div>
                                    <div className="font-bold text-slate-900">
                                      {r.matchedParticipant!.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {r.matchedParticipant!.schoolOrigin}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-amber-700 italic font-medium">
                                    Peserta Tidak Ditemukan
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-slate-700">
                                {isMatched ? r.matchedParticipant!.firstChoiceProdiName : '-'}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <span className="font-mono text-slate-500 text-xs">
                                  {currentScore > 0 ? currentScore.toFixed(2) : '0.00'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center">
                                {r.parsedScore !== null ? (
                                  <span className="px-2.5 py-0.5 rounded font-bold text-xs bg-indigo-100 text-indigo-900 border border-indigo-300 font-mono">
                                    {r.parsedScore.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-100 text-rose-800 font-mono">
                                    {String(r.rawScore || '-')}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-center">
                                {r.status === 'VALID' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Siap Disimpan</span>
                                  </span>
                                ) : r.status === 'UNMATCHED' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Tidak Ada di DB</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    <span>Skor Cacat</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-[11px]">
                                {r.errorMessage ? (
                                  <span className="text-rose-600 font-medium">
                                    {r.errorMessage}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">
                                    {r.notes || 'Siap diimpor ke database'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Input Nilai UTBK Manual */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-lg text-indigo-300">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base leading-tight">Input Nilai UTBK / TPA</h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {selectedParticipant.name} ({selectedParticipant.regNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Score Input with Strict Validation (0-100) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nilai UTBK / Skor TPA (0.00 – 100.00) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Contoh: 85.50"
                  value={utbkScoreInput}
                  onChange={(e) => {
                    setUtbkScoreInput(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full px-3 py-2 text-base font-bold border border-slate-300 rounded text-indigo-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Validasi ketat sistem: Nilai harus berupa numerik antara rentang 0 sampai 100.
                </p>
              </div>

              {/* Operator Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Operator Input / Petugas SPMB
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tanggal Penginputan
                </label>
                <input
                  type="date"
                  value={utbkDate}
                  onChange={(e) => setUtbkDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Nilai
                </label>
                <textarea
                  rows={2}
                  value={utbkNotes}
                  onChange={(e) => setUtbkNotes(e.target.value)}
                  placeholder="Catatan sertifikat UTBK atau hasil ujian CBT SPMB..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-semibold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveScore}
                className="px-5 py-2 bg-indigo-900 text-white rounded-md font-semibold text-xs hover:bg-indigo-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Nilai UTBK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
