import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Participant, StudyProgram, User } from '../../types';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Save,
  X,
  UserCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Sliders,
  Edit3,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Info,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface InterviewScoreViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  currentUser: User;
  onUpdateParticipant: (participant: Participant) => void;
  onBatchUpdateParticipants?: (participants: Participant[], message?: string) => void;
}

export interface ParsedInterviewRow {
  rowNum: number;
  rawName: string;
  rawRegNumber?: string;
  rawNisn?: string;
  rawInterviewer: string;
  rawDate: any;
  parsedDate: string; // YYYY-MM-DD or ""
  dateFormatNote?: string;
  isDateEmpty: boolean;
  isDateValid: boolean;
  rawNotes: string;
  rawScore: any;
  parsedScore: number | null;
  isScoreEmpty: boolean;
  isScoreValid: boolean;
  scoreFormatNote?: string;
  matchedParticipant: Participant | null;
  status: 'VALID' | 'EMPTY_SCORE' | 'UNMATCHED' | 'INVALID_SCORE' | 'INVALID_DATE';
  errorMessage?: string;
}

export interface ParseScoreResult {
  parsedScore: number | null;
  isValid: boolean;
  isEmpty: boolean;
  formatNote?: string;
  errorMessage?: string;
}

export interface ParseDateResult {
  parsedDate: string; // YYYY-MM-DD or ""
  isValid: boolean;
  isEmpty: boolean;
  formatNote?: string;
  errorMessage?: string;
}

/**
 * Normalizes and parses flexible score inputs:
 * - 90,00 -> 90.00
 * - 90.00 -> 90.00
 * - empty string or '-' -> null (isEmpty = true, isValid = true)
 * - non-numeric or out of 0-100 -> isValid = false
 */
export const parseFlexibleInterviewScore = (rawVal: any): ParseScoreResult => {
  if (rawVal === null || rawVal === undefined) {
    return { parsedScore: null, isValid: true, isEmpty: true };
  }

  const str = String(rawVal).trim();
  if (
    str === '' ||
    str === '-' ||
    str === '--' ||
    str.toLowerCase() === 'kosong' ||
    str.toLowerCase() === '(kosong)' ||
    str.toLowerCase() === 'null' ||
    str.toLowerCase() === 'none'
  ) {
    return { parsedScore: null, isValid: true, isEmpty: true };
  }

  let normalizedStr = str;
  let formatNote: string | undefined;

  // Handle standard decimal comma replacement: "90,00" -> "90.00"
  if (/^\d+,\d+$/.test(str)) {
    normalizedStr = str.replace(',', '.');
    formatNote = `Dikonversi dari koma "${str}" menjadi "${normalizedStr}"`;
  } else if ((str.match(/,/g) || []).length === 1 && !str.includes('.')) {
    normalizedStr = str.replace(',', '.');
    formatNote = `Dikonversi dari koma "${str}" menjadi "${normalizedStr}"`;
  }

  const num = Number(normalizedStr);
  if (isNaN(num)) {
    return {
      parsedScore: null,
      isValid: false,
      isEmpty: false,
      errorMessage: `Nilai "${str}" tidak valid (wajib berupa angka 0.00 – 100.00; format titik 90.00 maupun koma 90,00 didukung).`
    };
  }

  if (num < 0 || num > 100) {
    return {
      parsedScore: null,
      isValid: false,
      isEmpty: false,
      errorMessage: `Nilai ${num} di luar rentang (skor wawancara wajib di antara 0.00 – 100.00).`
    };
  }

  const rounded = Math.round(num * 100) / 100;
  return {
    parsedScore: rounded,
    isValid: true,
    isEmpty: false,
    formatNote
  };
};

/**
 * Normalizes and parses flexible date inputs:
 * - 05/03/2026 -> 2026-03-05
 * - 05-03-2026 -> 2026-03-05
 * - 2026-03-05 -> 2026-03-05
 * - Excel serial number -> YYYY-MM-DD
 * - empty or '-' -> "" (isEmpty = true, isValid = true)
 */
export const parseFlexibleInterviewDate = (rawVal: any): ParseDateResult => {
  if (rawVal === null || rawVal === undefined) {
    return { parsedDate: '', isValid: true, isEmpty: true };
  }

  // If XLSX produced a JS Date object
  if (rawVal instanceof Date) {
    if (!isNaN(rawVal.getTime())) {
      const yyyy = rawVal.getFullYear();
      const mm = String(rawVal.getMonth() + 1).padStart(2, '0');
      const dd = String(rawVal.getDate()).padStart(2, '0');
      return {
        parsedDate: `${yyyy}-${mm}-${dd}`,
        isValid: true,
        isEmpty: false,
        formatNote: 'Dikonversi dari Date objek'
      };
    }
    return { parsedDate: '', isValid: true, isEmpty: true };
  }

  // If XLSX produced an Excel serial number (e.g., 46086)
  if (typeof rawVal === 'number') {
    if (rawVal > 20000 && rawVal < 90000) {
      const utcDays = Math.floor(rawVal - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      const yyyy = dateInfo.getUTCFullYear();
      const mm = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dateInfo.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      return {
        parsedDate: dateStr,
        isValid: true,
        isEmpty: false,
        formatNote: `Dikonversi dari serial Excel (${rawVal}) ke ${dateStr}`
      };
    }
  }

  const str = String(rawVal).trim();
  if (
    str === '' ||
    str === '-' ||
    str === '--' ||
    str.toLowerCase() === 'kosong' ||
    str.toLowerCase() === '(kosong)' ||
    str.toLowerCase() === 'null' ||
    str.toLowerCase() === 'none'
  ) {
    return { parsedDate: '', isValid: true, isEmpty: true };
  }

  // Check DD/MM/YYYY or DD-MM-YYYY (e.g. "05/03/2026" or "5/3/2026")
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        parsedDate: formatted,
        isValid: true,
        isEmpty: false,
        formatNote: `Disesuaikan dari "${str}" ke format sistem "${formatted}"`
      };
    } else {
      return {
        parsedDate: '',
        isValid: false,
        isEmpty: false,
        errorMessage: `Tanggal "${str}" tidak valid (hari 1–31, bulan 1–12).`
      };
    }
  }

  // Check ISO format YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        parsedDate: formatted,
        isValid: true,
        isEmpty: false
      };
    } else {
      return {
        parsedDate: '',
        isValid: false,
        isEmpty: false,
        errorMessage: `Tanggal "${str}" tidak valid (hari 1–31, bulan 1–12).`
      };
    }
  }

  // Check 5-digit number string from Excel
  if (/^\d{5}$/.test(str)) {
    const num = Number(str);
    if (num > 20000 && num < 90000) {
      const utcDays = Math.floor(num - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      const yyyy = dateInfo.getUTCFullYear();
      const mm = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dateInfo.getUTCDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      return {
        parsedDate: dateStr,
        isValid: true,
        isEmpty: false,
        formatNote: `Dikonversi dari serial Excel (${str}) ke ${dateStr}`
      };
    }
  }

  return {
    parsedDate: '',
    isValid: false,
    isEmpty: false,
    errorMessage: `Format tanggal "${str}" tidak dikenali (gunakan format DD/MM/YYYY, contoh: 05/03/2026).`
  };
};

export const InterviewScoreView: React.FC<InterviewScoreViewProps> = ({
  participants,
  studyPrograms,
  currentUser,
  onUpdateParticipant,
  onBatchUpdateParticipants
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'LIST' | 'IMPORT'>('LIST');

  // List View State
  const [searchTerm, setSearchTerm] = useState('');
  const [prodiFilter, setProdiFilter] = useState<string>('ALL');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState<'ALL' | 'INTERVIEWED' | 'PENDING'>('ALL');

  // Manual Modal State
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [interviewScore, setInterviewScore] = useState<number>(0);
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Rubric helpers
  const [motivationScore, setMotivationScore] = useState<number>(85);
  const [academicCommitmentScore, setAcademicCommitmentScore] = useState<number>(85);
  const [integrityScore, setIntegrityScore] = useState<number>(90);

  // Import Massal State
  const [parsedRows, setParsedRows] = useState<ParsedInterviewRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'EMPTY' | 'ISSUES'>('ALL');
  const [includeEmptyScores, setIncludeEmptyScores] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick stats for List View
  const stats = useMemo(() => {
    const total = participants.length;
    const interviewed = participants.filter((p) => (p.interviewScore || 0) > 0);
    const count = interviewed.length;
    const scores = interviewed.map((p) => p.interviewScore || 0);
    const avg = count > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
    return { total, count, avg, pending: total - count };
  }, [participants]);

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
        interviewStatusFilter === 'ALL' ||
        (interviewStatusFilter === 'INTERVIEWED' && (p.interviewScore || 0) > 0) ||
        (interviewStatusFilter === 'PENDING' && (!p.interviewScore || p.interviewScore === 0));

      return matchesSearch && matchesProdi && matchesStatus;
    });
  }, [participants, searchTerm, prodiFilter, interviewStatusFilter]);

  const handleOpenInterviewModal = (p: Participant) => {
    setSelectedParticipant(p);
    const existing = p.interviewScore || 0;
    setInterviewScore(existing);
    setInterviewerName(p.interviewerName || currentUser.name);
    setInterviewDate(p.interviewDate || new Date().toISOString().split('T')[0]);
    setInterviewNotes(
      p.interviewNotes ||
        `Motivasi kuliah: sangat tinggi, komitmen menyelesaikan studi tepat waktu, siap mempertahankan IPK minimal 3.25.`
    );

    if (existing > 0) {
      setMotivationScore(existing);
      setAcademicCommitmentScore(existing);
      setIntegrityScore(existing);
    } else {
      setMotivationScore(85);
      setAcademicCommitmentScore(85);
      setIntegrityScore(90);
      setInterviewScore(87);
    }
  };

  const handleCalculateRubric = () => {
    const calc = Math.round(motivationScore * 0.35 + academicCommitmentScore * 0.35 + integrityScore * 0.3);
    setInterviewScore(calc);
  };

  const handleSaveInterview = () => {
    if (!selectedParticipant) return;

    const validated = Math.min(100, Math.max(0, Number(interviewScore) || 0));

    const updated: Participant = {
      ...selectedParticipant,
      interviewScore: validated,
      interviewerName,
      interviewDate,
      interviewNotes,
      updatedAt: new Date().toISOString()
    };

    onUpdateParticipant(updated);
    setSelectedParticipant(null);
  };

  // ==========================================
  // IMPORT DATA WAWANCARA LOGIC
  // ==========================================

  const getRowValue = (row: any, candidates: string[]): any => {
    const keys = Object.keys(row);
    for (const candidate of candidates) {
      if (row[candidate] !== undefined && row[candidate] !== '') return row[candidate];
      const foundKey = keys.find(
        (k) => k.trim().toLowerCase().replace(/[\s_\.\-]+/g, '') === candidate.toLowerCase().replace(/[\s_\.\-]+/g, '')
      );
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') return row[foundKey];
    }
    return '';
  };

  const processImportRows = (data: any[], filename: string) => {
    const cleanPunctuation = (s: string) =>
      s.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

    const results: ParsedInterviewRow[] = data.map((row, index) => {
      const rowNum = index + 2;

      // Extract values by flexible column names
      const rawName = String(
        getRowValue(row, [
          'nama peserta',
          'nama',
          'nama lengkap',
          'peserta',
          'nama_peserta',
          'student_name',
          'student name',
          'name',
          'participant'
        ])
      ).trim();

      const rawInterviewer = String(
        getRowValue(row, [
          'pewawancara',
          'nama pewawancara',
          'pewawancara_nama',
          'dosen pewawancara',
          'interviewer',
          'interviewer_name',
          'interviewer name'
        ])
      ).trim();

      const rawDate = getRowValue(row, [
        'tanggal pewawancara',
        'tanggal wawancara',
        'tanggal',
        'tgl wawancara',
        'tgl_wawancara',
        'tanggal_wawancara',
        'tanggal_pewawancara',
        'interview_date',
        'interview date',
        'date'
      ]);

      const rawNotes = String(
        getRowValue(row, [
          'catatan',
          'catatan wawancara',
          'catatan_wawancara',
          'keterangan',
          'evaluasi',
          'kesimpulan',
          'notes',
          'interview_notes',
          'interview notes'
        ])
      ).trim();

      const rawScore = getRowValue(row, [
        'nilai',
        'nilai wawancara',
        'nilai_wawancara',
        'skor',
        'skor wawancara',
        'skor_wawancara',
        'score',
        'interview_score',
        'interview score'
      ]);

      const rawRegNumber = String(
        getRowValue(row, [
          'nomor pendaftaran',
          'no pendaftaran',
          'no. pendaftaran',
          'no reg',
          'reg number',
          'reg_number',
          'noreg'
        ])
      ).trim();

      const rawNisn = String(
        getRowValue(row, ['nisn', 'nomor induk siswa nasional', 'no nisn'])
      ).trim();

      // Flexible Score Parsing: "90,00" -> 90.00, empty/'-' -> empty score
      const scoreRes = parseFlexibleInterviewScore(rawScore);

      // Flexible Date Parsing: "05/03/2026" -> "2026-03-05", empty/'-' -> empty date
      const dateRes = parseFlexibleInterviewDate(rawDate);

      // Match Participant from Database
      let matched: Participant | null = null;

      // 1. By Reg Number if present
      if (rawRegNumber) {
        matched =
          participants.find((p) => p.regNumber.trim().toLowerCase() === rawRegNumber.toLowerCase()) || null;
      }

      // 2. By NISN if not matched
      if (!matched && rawNisn) {
        matched = participants.find((p) => p.nisn.trim() === rawNisn) || null;
      }

      // 3. Primary matching: By Name
      if (!matched && rawName) {
        const normName = rawName.toLowerCase().replace(/\s+/g, ' ');
        // Exact name match
        matched = participants.find((p) => p.name.toLowerCase().trim().replace(/\s+/g, ' ') === normName) || null;

        // Punctuation-insensitive match
        if (!matched) {
          const strippedTarget = cleanPunctuation(rawName);
          matched =
            participants.find((p) => cleanPunctuation(p.name) === strippedTarget) || null;
        }
      }

      // Determine Row Status
      let status: 'VALID' | 'EMPTY_SCORE' | 'UNMATCHED' | 'INVALID_SCORE' | 'INVALID_DATE' = 'VALID';
      let errorMessage: string | undefined;

      if (!matched) {
        status = 'UNMATCHED';
        errorMessage = `Peserta "${rawName || 'Tanpa Nama'}" tidak ditemukan di database.`;
      } else if (!scoreRes.isValid) {
        status = 'INVALID_SCORE';
        errorMessage = scoreRes.errorMessage;
      } else if (!dateRes.isValid) {
        status = 'INVALID_DATE';
        errorMessage = dateRes.errorMessage;
      } else if (scoreRes.isEmpty) {
        status = 'EMPTY_SCORE';
      } else {
        status = 'VALID';
      }

      return {
        rowNum,
        rawName,
        rawRegNumber,
        rawNisn,
        rawInterviewer,
        rawDate,
        parsedDate: dateRes.parsedDate,
        dateFormatNote: dateRes.formatNote,
        isDateEmpty: dateRes.isEmpty,
        isDateValid: dateRes.isValid,
        rawNotes,
        rawScore,
        parsedScore: scoreRes.parsedScore,
        isScoreEmpty: scoreRes.isEmpty,
        isScoreValid: scoreRes.isValid,
        scoreFormatNote: scoreRes.formatNote,
        matchedParticipant: matched,
        status,
        errorMessage
      };
    });

    setParsedRows(results);
    setFileName(filename);
    setPreviewFilter('ALL');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        let data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length === 0) {
          alert('File Excel atau CSV kosong atau tidak memiliki data baris.');
          return;
        }

        // Semicolon-separated CSV fallback
        const firstRowKeys = Object.keys(data[0] || {});
        if (firstRowKeys.length === 1 && firstRowKeys[0].includes(';')) {
          const rawText = new TextDecoder('utf-8').decode(buffer);
          const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 1) {
            const headers = lines[0].split(';').map((h) => h.replace(/^["']|["']$/g, '').trim());
            const parsedData = [];
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(';').map((v) => v.replace(/^["']|["']$/g, '').trim());
              const rowObj: Record<string, string> = {};
              headers.forEach((h, idx) => {
                rowObj[h] = values[idx] || '';
              });
              parsedData.push(rowObj);
            }
            if (parsedData.length > 0) {
              data = parsedData;
            }
          }
        }

        processImportRows(data, file.name);
      } catch (err) {
        console.error('Failed to parse file:', err);
        alert('Gagal membaca berkas. Pastikan format file adalah .xlsx, .xls, atau .csv yang valid.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Quick Demo / Sample Test Runner
  const handleLoadSampleInterviewScores = () => {
    if (participants.length === 0) {
      alert('Tidak ada data peserta di sistem untuk dipasangkan nilai.');
      return;
    }

    const sampleInterviewers = [
      'Dr. Hendra Gunawan, M.Si',
      'Dra. Ratna Dewi, M.Pd',
      'Prof. Dr. Suryadi, M.T',
      'Ahmad Syarif, S.Kom, M.Cs',
      'Nurul Hidayah, S.Sos, M.I.Kom'
    ];

    // Examples demonstrating:
    // - 90,00 (comma decimal)
    // - 88.50 (dot decimal)
    // - 05/03/2026 (DD/MM/YYYY date)
    // - empty score / hyphen
    const sampleScores = ['90,00', '88.50', '92,50', '', '-', '85.00'];
    const sampleDates = ['05/03/2026', '06/03/2026', '07/03/2026', '-', '', '10/03/2026'];
    const sampleNotes = [
      'Motivasi sangat kuat, komitmen IPK tinggi (format 90,00)',
      'Data finansial terverifikasi sesuai kondisi lapangan (format 88.50)',
      'Aktif berorganisasi dan siap berprestasi (format 92,50)',
      'Belum hadir wawancara (nilai kosong)',
      "Diberi kesempatan susulan wawancara (tanda '-')",
      'Integritas dan kejujuran sangat baik (format 85.00)'
    ];

    const sampleData: any[] = participants.slice(0, 5).map((p, idx) => {
      return {
        'Nama Peserta': p.name,
        'Pewawancara': sampleInterviewers[idx % sampleInterviewers.length],
        'Tanggal Pewawancara': sampleDates[idx % sampleDates.length],
        'Catatan': sampleNotes[idx % sampleNotes.length],
        'Nilai': sampleScores[idx % sampleScores.length]
      };
    });

    // Add 1 unmatched row for testing verification
    sampleData.push({
      'Nama Peserta': 'Peserta Simulasi Tidak Terdaftar',
      'Pewawancara': 'Dr. Hendra Gunawan, M.Si',
      'Tanggal Pewawancara': '05/03/2026',
      'Catatan': 'Uji Coba Peserta Tidak Ditemukan',
      'Nilai': '90,00'
    });

    // Add 1 invalid score row for testing validation
    if (participants.length > 5) {
      const p = participants[5];
      sampleData.push({
        'Nama Peserta': p.name,
        'Pewawancara': 'Dra. Ratna Dewi, M.Pd',
        'Tanggal Pewawancara': '05/03/2026',
        'Catatan': 'Uji Coba Skor di Luar Rentang (Maks 100)',
        'Nilai': '150,00'
      });
    }

    processImportRows(sampleData, 'data-sampel-nilai-wawancara-demo.xlsx');
  };

  // Download Blank Excel Template
  const handleDownloadBlankTemplate = (formatType: 'xlsx' | 'csv') => {
    const templateData = [
      {
        'Nama Peserta': participants[0]?.name || 'Ahmad Fauzi',
        'Pewawancara': 'Dr. Hendra Gunawan, M.Si',
        'Tanggal Pewawancara': '05/03/2026',
        'Catatan': 'Contoh format nilai titik (90.00) dan tanggal DD/MM/YYYY',
        'Nilai': '90.00'
      },
      {
        'Nama Peserta': participants[1]?.name || 'Siti Nurhaliza',
        'Pewawancara': 'Dra. Ratna Dewi, M.Pd',
        'Tanggal Pewawancara': '06/03/2026',
        'Catatan': 'Contoh format nilai koma (90,00) - otomatis terbaca 90.00',
        'Nilai': '90,00'
      },
      {
        'Nama Peserta': participants[2]?.name || 'Budi Santoso',
        'Pewawancara': 'Dr. Hendra Gunawan, M.Si',
        'Tanggal Pewawancara': '07/03/2026',
        'Catatan': 'Contoh format koma (88,50) dengan catatan evaluasi',
        'Nilai': '88,50'
      },
      {
        'Nama Peserta': participants[3]?.name || 'Dewi Lestari',
        'Pewawancara': 'Dra. Ratna Dewi, M.Pd',
        'Tanggal Pewawancara': '-',
        'Catatan': "Contoh nilai kosong/tanda '-' dianggap tanpa nilai (bukan error)",
        'Nilai': '-'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nilai Wawancara');

    if (formatType === 'xlsx') {
      XLSX.writeFile(wb, 'template-import-nilai-wawancara.xlsx');
    } else {
      XLSX.writeFile(wb, 'template-import-nilai-wawancara.csv', { bookType: 'csv' });
    }
  };

  // Import Metrics
  const importMetrics = useMemo(() => {
    const total = parsedRows.length;
    const validWithScore = parsedRows.filter((r) => r.status === 'VALID').length;
    const emptyScore = parsedRows.filter((r) => r.status === 'EMPTY_SCORE').length;
    const unmatched = parsedRows.filter((r) => r.status === 'UNMATCHED').length;
    const invalidScore = parsedRows.filter((r) => r.status === 'INVALID_SCORE').length;
    const invalidDate = parsedRows.filter((r) => r.status === 'INVALID_DATE').length;
    const issues = unmatched + invalidScore + invalidDate;

    return {
      total,
      validWithScore,
      emptyScore,
      unmatched,
      invalidScore,
      invalidDate,
      issues
    };
  }, [parsedRows]);

  // Filtered preview rows
  const filteredParsedRows = useMemo(() => {
    return parsedRows.filter((r) => {
      if (previewFilter === 'ALL') return true;
      if (previewFilter === 'VALID') return r.status === 'VALID';
      if (previewFilter === 'EMPTY') return r.status === 'EMPTY_SCORE';
      if (previewFilter === 'ISSUES') {
        return r.status === 'UNMATCHED' || r.status === 'INVALID_SCORE' || r.status === 'INVALID_DATE';
      }
      return true;
    });
  }, [parsedRows, previewFilter]);

  // Apply Batch Import to Database
  const handleApplyBatchImport = () => {
    const eligibleRows = parsedRows.filter((r) => {
      if (!r.matchedParticipant) return false;
      if (r.status === 'VALID') return true;
      if (r.status === 'EMPTY_SCORE' && includeEmptyScores) return true;
      return false;
    });

    if (eligibleRows.length === 0) {
      alert('Tidak ada data yang memenuhi kriteria untuk disimpan.');
      return;
    }

    setIsProcessing(true);
    try {
      const updatedParticipants: Participant[] = [];

      eligibleRows.forEach((r) => {
        const p = r.matchedParticipant!;
        const updated: Participant = {
          ...p,
          // Set score if valid number; if empty and includeEmptyScores, reset to 0 or maintain
          interviewScore:
            r.parsedScore !== null ? r.parsedScore : includeEmptyScores ? 0 : p.interviewScore,
          interviewerName: r.rawInterviewer || p.interviewerName || currentUser.name,
          interviewDate: r.parsedDate || p.interviewDate || new Date().toISOString().split('T')[0],
          interviewNotes: r.rawNotes || p.interviewNotes || '',
          updatedAt: new Date().toISOString()
        };
        updatedParticipants.push(updated);
      });

      if (onBatchUpdateParticipants) {
        onBatchUpdateParticipants(
          updatedParticipants,
          `Berhasil mengimpor dan memperbarui nilai wawancara untuk ${updatedParticipants.length} peserta ke database.`
        );
      } else {
        updatedParticipants.forEach((p) => onUpdateParticipant(p));
      }

      setParsedRows([]);
      setFileName(null);
      setActiveTab('LIST');
    } catch (err) {
      console.error('Batch import failed:', err);
      alert('Terjadi kesalahan saat menyimpan data import nilai wawancara.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Tabs */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-yellow-100 text-yellow-900 rounded-lg">
            <MessageSquare className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Tahap 3: Penilaian Wawancara Calon Mahasiswa
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                Seleksi Tahap Pertama
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Evaluasi komitmen akademik, motivasi studi, integritas, dan klarifikasi data sosial-ekonomi bersama nilai UTBK pada seleksi tahap pertama.
            </p>
          </div>
        </div>

        {/* View Mode Switch Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-3.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'LIST'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
            <span>Daftar & Penilaian</span>
          </button>

          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`px-3.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'IMPORT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Data Nilai Wawancara</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-200 text-amber-950">
              Excel / CSV
            </span>
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: DAFTAR & PENILAIAN WAWANCARA (LIST)
          ========================================== */}
      {activeTab === 'LIST' && (
        <div className="space-y-6">
          {/* Quick Stat Badges & Quick Import Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md font-semibold border border-slate-200">
                Total Pendaftar: {stats.total}
              </span>
              <span className="px-3 py-1.5 bg-yellow-50 text-yellow-800 rounded-md font-semibold border border-yellow-200">
                Sudah Diwawancara: {stats.count}
              </span>
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-md font-semibold border border-amber-200">
                Belum Diwawancara: {stats.pending}
              </span>
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-md font-semibold border border-emerald-200">
                Rata-rata Skor: {stats.avg}
              </span>
            </div>

            <button
              onClick={() => setActiveTab('IMPORT')}
              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
              <span>Import Massal File Excel</span>
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, no. reg, prodi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status Wawancara:</span>
              </div>
              <select
                value={interviewStatusFilter}
                onChange={(e) => setInterviewStatusFilter(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">Semua Peserta</option>
                <option value="INTERVIEWED">Sudah Diwawancara</option>
                <option value="PENDING">Belum Diwawancara</option>
              </select>

              <select
                value={prodiFilter}
                onChange={(e) => setProdiFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">Semua Program Studi</option>
                {studyPrograms.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interview Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Peserta & Registrasi</th>
                    <th className="py-3 px-4">Pilihan Prodi</th>
                    <th className="py-3 px-4">Pewawancara</th>
                    <th className="py-3 px-4">Tanggal Wawancara</th>
                    <th className="py-3 px-4">Catatan Wawancara</th>
                    <th className="py-3 px-4 text-center">Nilai Wawancara (0–100)</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data pendaftar yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p, idx) => {
                      const hasInterview = (p.interviewScore || 0) > 0;
                      return (
                        <tr key={`interview-row-${p.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{p.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono bg-blue-50 text-blue-800 px-1 py-0.2 rounded text-[10px]">
                                {p.regNumber}
                              </span>
                              <span>{p.schoolOrigin}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {p.firstChoiceProdiName}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span>{p.interviewerName || 'Belum Ditentukan'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {p.interviewDate || '-'}
                          </td>
                          <td className="py-3 px-4 max-w-[220px]">
                            <p className="text-slate-600 truncate text-[11px]" title={p.interviewNotes || '-'}>
                              {p.interviewNotes || '-'}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {hasInterview ? (
                              <span
                                className={`inline-block px-3 py-1 rounded-md font-bold text-xs ${
                                  (p.interviewScore || 0) >= 85
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : (p.interviewScore || 0) >= 70
                                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                                }`}
                              >
                                {p.interviewScore?.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs font-mono">0.0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleOpenInterviewModal(p)}
                              className="px-3 py-1 bg-yellow-600 text-white hover:bg-yellow-700 rounded font-semibold text-xs flex items-center gap-1 mx-auto cursor-pointer transition-colors shadow-2xs"
                            >
                              <Edit3 className="w-3 h-3" />
                              {hasInterview ? 'Ubah' : 'Nilai'}
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

      {/* ==========================================
          TAB 2: IMPORT MASSAL DATA NILAI WAWANCARA
          ========================================== */}
      {activeTab === 'IMPORT' && (
        <div className="space-y-6">
          {/* Action Header & Format Requirements Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('LIST')}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="Kembali ke Daftar Peserta"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                    <span>Import Massal Nilai & Hasil Wawancara</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Unggah berkas Excel atau CSV berisi data nilai wawancara. Kolom wajib: <strong>nama peserta, pewawancara, tanggal pewawancara, catatan, dan nilai</strong>.
                </p>
              </div>

              {/* Download Template Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadBlankTemplate('xlsx')}
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template .XLSX</span>
                </button>
                <button
                  onClick={() => handleDownloadBlankTemplate('csv')}
                  className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Template .CSV</span>
                </button>
              </div>
            </div>

            {/* Flexible Number & Date Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3.5 shadow-2xs">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1.5">
                <div className="font-bold flex items-center gap-2 flex-wrap text-sm">
                  <span>Dukungan Format Nilai & Tanggal Fleksibel</span>
                  <span className="bg-emerald-200/90 text-emerald-950 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                    Nilai: 90,00 ➔ 90.00
                  </span>
                  <span className="bg-blue-100 text-blue-900 font-mono text-[11px] px-2 py-0.5 rounded font-bold border border-blue-200">
                    Tanggal: 05/03/2026 ➔ 2026-03-05
                  </span>
                  <span className="bg-slate-200 text-slate-800 font-mono text-[11px] px-2 py-0.5 rounded font-bold">
                    Kosong / '-' = Tanpa Nilai
                  </span>
                </div>
                <div className="text-emerald-800 leading-relaxed space-y-1">
                  <p>
                    • <strong>Format Nilai:</strong> Nilai koma (contoh: <code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">90,00</code>) otomatis dinormalisasi menjadi nilai numerik sistem <code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">90.00</code>. Jika kolom nilai kosong atau bertanda <code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">-</code>, sistem menganggapnya sebagai <strong>tanpa nilai / kosong</strong> (bukan error).
                  </p>
                  <p>
                    • <strong>Format Tanggal:</strong> Tanggal Indonesia seperti <code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">05/03/2026</code> atau <code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">05-03-2026</code> otomatis disesuaikan menjadi format sistem <code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">2026-03-05</code>. Jika kosong, sistem menyimpannya sebagai kosong.
                  </p>
                  <p>
                    • <strong>Pencocokan Peserta:</strong> Sistem mencocokkan baris data berdasarkan <strong>Nama Peserta</strong> secara otomatis ke database calon mahasiswa yang ada.
                  </p>
                </div>
              </div>
            </div>

            {/* Dropzone and Quick Test */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* File Dropzone */}
              <div className="md:col-span-2 bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-amber-600 transition flex flex-col items-center justify-center space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {fileName ? fileName : 'Pilih atau Tarik File Excel/CSV Nilai Wawancara ke Sini'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mendukung format .xlsx, .xls, dan .csv | Kolom: Nama Peserta, Pewawancara, Tanggal Pewawancara, Catatan, Nilai
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse File Excel Komputer</span>
                  </button>
                </div>
              </div>

              {/* Quick Demo Test Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Uji Coba Cepat (Test Demo)</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Belum menyiapkan file Excel? Klik tombol di bawah untuk memuat data simulasi wawancara dengan format koma (90,00), tanggal (05/03/2026), dan nilai kosong yang langsung dipasangkan ke database.
                  </p>
                </div>

                <button
                  onClick={handleLoadSampleInterviewScores}
                  className="w-full px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-amber-900 font-bold text-xs border border-amber-300 shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Muat Data Sampel Wawancara</span>
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Baris File</span>
                  <div className="text-lg font-bold text-slate-900">{importMetrics.total} Baris</div>
                  <div className="text-[10px] text-slate-500">Seluruh entri terbaca</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Dengan Nilai Valid</span>
                  <div className="text-lg font-bold text-emerald-700">{importMetrics.validWithScore} Peserta</div>
                  <div className="text-[10px] text-emerald-600">Skor 0.00 – 100.00</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs bg-slate-50/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Tanpa Nilai / Kosong</span>
                  <div className="text-lg font-bold text-slate-800">{importMetrics.emptyScore} Baris</div>
                  <div className="text-[10px] text-slate-500">Kosong atau tanda '-'</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs bg-amber-50/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Tidak Ditemukan</span>
                  <div className="text-lg font-bold text-amber-700">{importMetrics.unmatched} Baris</div>
                  <div className="text-[10px] text-amber-600">Nama tidak ada di DB</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs bg-rose-50/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Format Cacat</span>
                  <div className="text-lg font-bold text-rose-700">
                    {importMetrics.invalidScore + importMetrics.invalidDate} Baris
                  </div>
                  <div className="text-[10px] text-rose-600">Bukan angka / tanggal salah</div>
                </div>
              </div>

              {/* Filter Tabs & Batch Apply Action Bar */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
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
                    Dengan Nilai ({importMetrics.validWithScore})
                  </button>

                  <button
                    onClick={() => setPreviewFilter('EMPTY')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      previewFilter === 'EMPTY'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    Tanpa Nilai / Kosong ({importMetrics.emptyScore})
                  </button>

                  <button
                    onClick={() => setPreviewFilter('ISSUES')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      previewFilter === 'ISSUES'
                        ? 'bg-rose-700 text-white'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    Bermasalah ({importMetrics.issues})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {importMetrics.emptyScore > 0 && (
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        checked={includeEmptyScores}
                        onChange={(e) => setIncludeEmptyScores(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px] font-medium">
                        Sertakan {importMetrics.emptyScore} data kosong (update pewawancara/catatan)
                      </span>
                    </label>
                  )}

                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFileName(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                  >
                    Batal / Reset
                  </button>

                  <button
                    onClick={handleApplyBatchImport}
                    disabled={
                      (importMetrics.validWithScore === 0 &&
                        (!includeEmptyScores || importMetrics.emptyScore === 0)) ||
                      isProcessing
                    }
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? 'Menyimpan...'
                        : `Terapkan & Simpan ${
                            includeEmptyScores
                              ? importMetrics.validWithScore + importMetrics.emptyScore
                              : importMetrics.validWithScore
                          } Data ke Database`}
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
                        <th className="py-3 px-3">Baris</th>
                        <th className="py-3 px-4">Nama Peserta (File)</th>
                        <th className="py-3 px-4">Peserta di Database</th>
                        <th className="py-3 px-4">Pewawancara</th>
                        <th className="py-3 px-3 text-center">Tanggal (Sistem)</th>
                        <th className="py-3 px-3 text-center">Nilai Terbaca</th>
                        <th className="py-3 px-4">Catatan</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredParsedRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            Tidak ada data dalam filter ini.
                          </td>
                        </tr>
                      ) : (
                        filteredParsedRows.map((r) => {
                          const isMatched = !!r.matchedParticipant;

                          return (
                            <tr
                              key={r.rowNum}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                r.status === 'UNMATCHED'
                                  ? 'bg-amber-50/20'
                                  : r.status === 'INVALID_SCORE' || r.status === 'INVALID_DATE'
                                  ? 'bg-rose-50/20'
                                  : r.status === 'EMPTY_SCORE'
                                  ? 'bg-slate-50/40'
                                  : ''
                              }`}
                            >
                              <td className="py-3 px-3 font-mono font-medium text-slate-400">
                                #{r.rowNum}
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{r.rawName || '-'}</div>
                                {r.rawRegNumber && (
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    Reg: {r.rawRegNumber}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                {isMatched ? (
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span>{r.matchedParticipant!.name}</span>
                                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                        Cocok
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {r.matchedParticipant!.firstChoiceProdiName} • {r.matchedParticipant!.regNumber}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-amber-700 italic font-medium">
                                    Peserta Tidak Ditemukan
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 font-medium text-slate-700">
                                {r.rawInterviewer || (
                                  <span className="text-slate-400 italic">Otomatis Petugas Login</span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-center">
                                {r.parsedDate ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      {r.parsedDate}
                                    </span>
                                    {r.dateFormatNote && (
                                      <span
                                        className="text-[9px] text-blue-700 font-medium font-mono mt-0.5"
                                        title={r.dateFormatNote}
                                      >
                                        (dari {String(r.rawDate).trim()})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-mono text-xs">-</span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-center">
                                {r.status === 'EMPTY_SCORE' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                    <MinusCircle className="w-3 h-3 text-slate-400" />
                                    <span>Tanpa Nilai</span>
                                  </span>
                                ) : r.parsedScore !== null ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="px-2.5 py-0.5 rounded font-bold text-xs bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                                      {r.parsedScore.toFixed(2)}
                                    </span>
                                    {r.scoreFormatNote && (
                                      <span
                                        className="text-[9px] text-emerald-700 font-medium font-mono mt-0.5"
                                        title={r.scoreFormatNote}
                                      >
                                        (dari {String(r.rawScore).trim()})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-100 text-rose-800 font-mono">
                                    {String(r.rawScore || '(kosong)')}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 max-w-[180px]">
                                <p className="truncate text-[11px] text-slate-600" title={r.rawNotes || '-'}>
                                  {r.rawNotes || '-'}
                                </p>
                              </td>

                              <td className="py-3 px-3 text-center">
                                {r.status === 'VALID' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Siap Simpan</span>
                                  </span>
                                ) : r.status === 'EMPTY_SCORE' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                    <MinusCircle className="w-3 h-3 text-slate-500" />
                                    <span>Tanpa Nilai</span>
                                  </span>
                                ) : r.status === 'UNMATCHED' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>Tidak Ada di DB</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    <span>Cacat</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-[11px]">
                                {r.errorMessage ? (
                                  <span className="text-rose-600 font-medium">{r.errorMessage}</span>
                                ) : r.status === 'EMPTY_SCORE' ? (
                                  <span className="text-slate-500 italic">
                                    Nilai kosong atau '-' (dianggap tanpa nilai)
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-medium">
                                    Siap diimpor ke database
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

      {/* Modal Input Manual Nilai Wawancara */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-700 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-lg text-yellow-300">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base leading-tight">Penilaian Wawancara Calon Mahasiswa</h3>
                  <p className="text-xs text-yellow-200 mt-0.5">
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
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Pewawancara & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Dosen / Pewawancara
                  </label>
                  <input
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    placeholder="Nama Pewawancara"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tanggal Wawancara
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rubrik Penilaian Wawancara */}
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-700" /> Rubrik Evaluasi Komprehensif
                  </span>
                  <button
                    type="button"
                    onClick={handleCalculateRubric}
                    className="text-[10px] text-amber-800 hover:underline font-bold"
                  >
                    Hitung Nilai Otomatis
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>1. Motivasi & Alasan Mengambil Program Studi:</span>
                    <span className="font-bold text-slate-800">{motivationScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={motivationScore}
                    onChange={(e) => {
                      setMotivationScore(Number(e.target.value));
                      handleCalculateRubric();
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>2. Komitmen Akademik (Lulus Tepat Waktu & Target IPK):</span>
                    <span className="font-bold text-slate-800">{academicCommitmentScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={academicCommitmentScore}
                    onChange={(e) => {
                      setAcademicCommitmentScore(Number(e.target.value));
                      handleCalculateRubric();
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>3. Integritas, Etika & Kejujuran Data Finansial:</span>
                    <span className="font-bold text-slate-800">{integrityScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={integrityScore}
                    onChange={(e) => {
                      setIntegrityScore(Number(e.target.value));
                      handleCalculateRubric();
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                  />
                </div>
              </div>

              {/* Nilai Akhir Wawancara */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nilai Akhir Wawancara (0 – 100)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={interviewScore}
                    onChange={(e) => setInterviewScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-32 px-3 py-2 text-sm font-bold border border-slate-300 rounded text-amber-900 bg-white focus:ring-1 focus:ring-amber-600 focus:outline-none font-mono"
                  />
                  <div className="text-[11px] text-slate-500">
                    Nilai wawancara memiliki bobot menentukan dalam seleksi akhir.
                  </div>
                </div>
              </div>

              {/* Catatan Wawancara */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan Evaluasi / Kesimpulan Wawancara
                </label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Catat potensi calon mahasiswa, rekomendasi pewawancara..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-600 focus:outline-none"
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
                onClick={handleSaveInterview}
                className="px-5 py-2 bg-amber-800 text-white rounded-md font-semibold text-xs hover:bg-amber-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Nilai Wawancara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
