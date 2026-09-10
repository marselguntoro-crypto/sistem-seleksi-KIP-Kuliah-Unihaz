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
  XCircle,
  MinusCircle,
  Info
} from 'lucide-react';

interface UtbkScoreViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  currentUser: User;
  onUpdateParticipant: (participant: Participant) => void;
  onBatchUpdateParticipants?: (participants: Participant[], message?: string) => void;
}

export interface ParsedScoreRow {
  rowNum: number;
  regNumber: string;
  nisn: string;
  name: string;
  rawScore: any;
  parsedScore: number | null;
  isEmptyScore: boolean;
  formatNote?: string;
  notes: string;
  matchedParticipant: Participant | null;
  status: 'VALID' | 'EMPTY_SCORE' | 'UNMATCHED' | 'INVALID_SCORE';
  errorMessage?: string;
}

export interface ParseScoreResult {
  parsedScore: number | null;
  isValid: boolean;
  isEmpty: boolean;
  formatNote?: string;
  rawText: string;
}

// Helper function to flexibly parse scores supporting both '.' and ',' (e.g. 76.70 and 76,70),
// and treating empty cells or '-' as empty/no score without error.
export const parseFlexibleUtbkScore = (raw: any): ParseScoreResult => {
  if (raw === null || raw === undefined) {
    return { parsedScore: null, isValid: true, isEmpty: true, rawText: '' };
  }

  const rawStr = String(raw).trim();
  const lower = rawStr.toLowerCase();

  // If score is empty, '-', '--', or similar placeholder text, consider as no score / empty
  const emptyEquivalents = ['', '-', '--', '—', '–', 'n/a', 'na', 'null', 'kosong', 'belum ada', 'tidak ada', 'belum'];
  if (emptyEquivalents.includes(lower)) {
    return {
      parsedScore: null,
      isValid: true,
      isEmpty: true,
      rawText: rawStr || '(kosong)'
    };
  }

  // Already a valid JS/Excel number
  if (typeof raw === 'number') {
    if (isNaN(raw)) {
      return { parsedScore: null, isValid: false, isEmpty: false, rawText: String(raw) };
    }
    if (raw >= 0 && raw <= 100) {
      return {
        parsedScore: Math.round(raw * 100) / 100,
        isValid: true,
        isEmpty: false,
        rawText: String(raw)
      };
    }
    return { parsedScore: null, isValid: false, isEmpty: false, rawText: String(raw) };
  }

  const hasComma = rawStr.includes(',');

  // Standardize: strip '%', replace ',' with '.', remove whitespace around separator
  let cleaned = rawStr
    .replace(/%/g, '')
    .replace(/\s*,\s*/g, '.')
    .replace(/\s+/g, '')
    .trim();

  // If score has fraction notation e.g. "76.70/100"
  if (cleaned.includes('/')) {
    cleaned = cleaned.split('/')[0].trim();
  }

  const num = parseFloat(cleaned);
  if (!isNaN(num) && num >= 0 && num <= 100) {
    const rounded = Math.round(num * 100) / 100;
    return {
      parsedScore: rounded,
      isValid: true,
      isEmpty: false,
      formatNote: hasComma ? `Format koma (${rawStr}) ➔ ${rounded.toFixed(2)}` : undefined,
      rawText: rawStr
    };
  }

  return { parsedScore: null, isValid: false, isEmpty: false, rawText: rawStr };
};

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
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'EMPTY' | 'ISSUES'>('ALL');
  const [includeEmptyScores, setIncludeEmptyScores] = useState<boolean>(false);
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

    const { parsedScore, isValid, isEmpty } = parseFlexibleUtbkScore(utbkScoreInput);

    // If input is empty or '-', treat as clearing or emptying the score
    if (isEmpty) {
      const updated: Participant = {
        ...selectedParticipant,
        utbkScore: 0,
        utbkOperator: operatorName,
        utbkDate,
        utbkNotes: utbkNotes || 'Nilai dikosongkan (tanpa nilai UTBK/TPA).',
        updatedAt: new Date().toISOString()
      };
      onUpdateParticipant(updated);
      setSelectedParticipant(null);
      return;
    }

    if (!isValid || parsedScore === null) {
      setValidationError(
        'Validasi gagal: Nilai UTBK wajib berupa angka antara 0.00 – 100.00 (format titik 76.70 maupun koma 76,70 didukung, atau kosong / "-" jika tanpa nilai).'
      );
      return;
    }

    const updated: Participant = {
      ...selectedParticipant,
      utbkScore: parsedScore,
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

      // Robust field getter (supports exact key or case-insensitive matching)
      const findValue = (candidates: string[]): any => {
        for (const c of candidates) {
          if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
            return row[c];
          }
        }
        const rowKeys = Object.keys(row);
        for (const c of candidates) {
          const normC = c.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matchKey = rowKeys.find(
            (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normC
          );
          if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null && String(row[matchKey]).trim() !== '') {
            return row[matchKey];
          }
        }
        return '';
      };

      // Extract registration number
      const regNumber = String(
        findValue([
          'Nomor Pendaftaran',
          'No Pendaftaran',
          'No. Pendaftaran',
          'No Registrasi',
          'regNumber',
          'Nomor Registrasi',
          'No Peserta'
        ])
      ).trim();

      // Extract NISN
      const rawNisn = String(
        findValue([
          'NISN',
          'nisn',
          'Nomor Induk Siswa Nasional',
          'No NISN'
        ])
      ).trim().replace(/[^0-9]/g, '');

      // Extract Name (optional for display)
      const name = String(
        findValue([
          'Nama Lengkap',
          'Nama',
          'name',
          'Nama Peserta'
        ])
      ).trim();

      // Extract Score with broad alias support
      const rawScore = findValue([
        'Nilai UTBK',
        'Nilai UTBK / TPA',
        'Nilai UTBK/TPA',
        'Skor UTBK',
        'Skor UTBK / TPA',
        'Nilai TPA',
        'Skor TPA',
        'Nilai',
        'Skor',
        'utbkScore',
        'UTBK',
        'TPA',
        'Nilai CBT'
      ]);

      // Extract Notes
      const notes = String(
        findValue([
          'Catatan',
          'Keterangan',
          'notes',
          'Keterangan Nilai'
        ])
      ).trim();

      // Parse Score flexibly supporting both '.' (76.70) and ',' (76,70), plus empty / '-'
      const { parsedScore, isValid: isScoreValid, isEmpty, formatNote, rawText } = parseFlexibleUtbkScore(rawScore);

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
      let status: 'VALID' | 'EMPTY_SCORE' | 'UNMATCHED' | 'INVALID_SCORE' = 'VALID';
      let errorMessage: string | undefined = undefined;

      if (!matched) {
        status = 'UNMATCHED';
        errorMessage = `Peserta dengan No. Reg '${regNumber || '-'}' atau NISN '${rawNisn || '-'}' tidak ditemukan di database.`;
      } else if (isEmpty) {
        // Jika nilai kosong atau '-', maka dianggap tidak ada nilai atau kosong (bukan error)
        status = 'EMPTY_SCORE';
      } else if (!isScoreValid) {
        status = 'INVALID_SCORE';
        errorMessage = `Nilai '${rawText}' tidak valid (wajib berupa angka antara 0.00 – 100.00; format titik 76.70 maupun koma 76,70 didukung).`;
      }

      return {
        rowNum,
        regNumber: regNumber || (matched ? matched.regNumber : '-'),
        nisn: rawNisn || (matched ? matched.nisn : '-'),
        name: name || (matched ? matched.name : '-'),
        rawScore,
        parsedScore,
        isEmptyScore: isEmpty,
        formatNote,
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
        const buffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        let data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length === 0) {
          alert('File Excel atau CSV kosong atau tidak memiliki data.');
          return;
        }

        // Semicolon-separated CSV fallback (standard in Indonesian Excel exports)
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
        alert('Gagal membaca file. Pastikan format file adalah .xlsx, .xls, atau .csv yang valid.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Quick Demo / Sample Test Runner
  const handleLoadSampleScores = () => {
    if (participants.length === 0) {
      alert('Tidak ada data peserta di sistem untuk dipasangkan nilai.');
      return;
    }

    // Sample scores highlighting flexibility: comma (76,70), dot (88.75), empty score "", and hyphen "-"
    const sampleScores = ['88.75', '76,70', '', '-', '76.70'];
    const sampleNotes = [
      'Skor format titik SNBT (88.75)',
      'Format koma fleksibel (76,70) ➔ terbaca 76.70',
      'Nilai kosong (dianggap tanpa nilai)',
      "Nilai tanda strip '-' (dianggap tanpa nilai)",
      'Skor format titik standar (76.70)'
    ];

    // Pick first 5 participants and generate sample scores
    const sampleData: any[] = participants.slice(0, 5).map((p, idx) => {
      return {
        'Nomor Pendaftaran': p.regNumber,
        'NISN': p.nisn,
        'Nama Lengkap': p.name,
        'Program Studi': p.firstChoiceProdiName,
        'Nilai UTBK': sampleScores[idx % sampleScores.length],
        'Catatan': sampleNotes[idx % sampleNotes.length]
      };
    });

    // Add 1 unmatched row for testing error detection
    sampleData.push({
      'Nomor Pendaftaran': 'KIPK-2026-9999',
      'NISN': '0099999999',
      'Nama Lengkap': 'Peserta Uji Error (Unmatched)',
      'Program Studi': 'S1 Hukum',
      'Nilai UTBK': '76,70',
      'Catatan': 'Uji Coba Unmatched (Format Koma 76,70)'
    });

    // Add 1 invalid score row for testing validation
    if (participants.length > 5) {
      const p = participants[5];
      sampleData.push({
        'Nomor Pendaftaran': p.regNumber,
        'NISN': p.nisn,
        'Nama Lengkap': p.name,
        'Program Studi': p.firstChoiceProdiName,
        'Nilai UTBK': '150,00',
        'Catatan': 'Uji Coba Skor Di Luar Rentang (Maks 100)'
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
        'Nilai UTBK': 76.70,
        'Catatan': 'Contoh format titik (76.70)'
      },
      {
        'Nomor Pendaftaran': 'KIPK-2026-0002',
        'NISN': '0065412892',
        'Nama Lengkap': 'Siti Nurhaliza',
        'Program Studi': 'S1 Manajemen',
        'Nilai UTBK': '76,70',
        'Catatan': 'Contoh format koma (76,70) - otomatis terbaca 76.70'
      },
      {
        'Nomor Pendaftaran': 'KIPK-2026-0003',
        'NISN': '0065412893',
        'Nama Lengkap': 'Budi Santoso',
        'Program Studi': 'S1 Ilmu Komunikasi',
        'Nilai UTBK': '-',
        'Catatan': "Contoh tanda '-' atau kosong untuk peserta yang belum memiliki nilai"
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
    // Rows eligible to save:
    // 1. Valid with score (status === 'VALID' && parsedScore !== null)
    // 2. If includeEmptyScores is checked, also update rows with status === 'EMPTY_SCORE' (setting utbkScore to 0)
    const rowsToApply = parsedRows.filter(
      (r) =>
        r.matchedParticipant &&
        (r.status === 'VALID' || (includeEmptyScores && r.status === 'EMPTY_SCORE'))
    );

    if (rowsToApply.length === 0) {
      alert('Tidak ada baris dengan nilai valid yang dapat disimpan.');
      return;
    }

    setIsProcessing(true);
    const today = new Date().toISOString().split('T')[0];

    // Build updated participants list
    const updatedParticipantsList: Participant[] = rowsToApply.map((r) => {
      const p = r.matchedParticipant!;
      const isScoreEmpty = r.status === 'EMPTY_SCORE' || r.parsedScore === null;
      return {
        ...p,
        utbkScore: isScoreEmpty ? 0 : r.parsedScore!,
        utbkOperator: currentUser.name,
        utbkDate: today,
        utbkNotes: r.notes || (isScoreEmpty ? 'Tanpa nilai UTBK (Kosong)' : `Import Excel (${fileName || 'File'})`),
        updatedAt: new Date().toISOString()
      };
    });

    if (onBatchUpdateParticipants) {
      onBatchUpdateParticipants(
        updatedParticipantsList,
        `Sebanyak ${updatedParticipantsList.length} data nilai UTBK peserta berhasil diperbarui ke sistem.`
      );
    } else {
      updatedParticipantsList.forEach((p) => onUpdateParticipant(p));
    }

    setIsProcessing(false);
    const validCount = rowsToApply.filter((r) => r.status === 'VALID').length;
    const emptyCount = rowsToApply.filter((r) => r.status === 'EMPTY_SCORE').length;
    setImportSuccessMessage(
      `Berhasil memperbarui ${rowsToApply.length} data peserta (${validCount} nilai tersimpan${
        emptyCount > 0 ? `, ${emptyCount} baris kosong dikosongkan` : ''
      }).`
    );
    setParsedRows([]);
    setFileName(null);
  };

  // Import Mode Metrics
  const importMetrics = useMemo(() => {
    const total = parsedRows.length;
    const validWithScore = parsedRows.filter((r) => r.status === 'VALID').length;
    const emptyScore = parsedRows.filter((r) => r.status === 'EMPTY_SCORE').length;
    const unmatched = parsedRows.filter((r) => r.status === 'UNMATCHED').length;
    const invalidScore = parsedRows.filter((r) => r.status === 'INVALID_SCORE').length;
    const issues = unmatched + invalidScore;
    return {
      total,
      validWithScore,
      emptyScore,
      unmatched,
      invalidScore,
      issues
    };
  }, [parsedRows]);

  // Filtered Parsed Rows for Preview
  const filteredParsedRows = useMemo(() => {
    if (previewFilter === 'VALID') return parsedRows.filter((r) => r.status === 'VALID');
    if (previewFilter === 'EMPTY') return parsedRows.filter((r) => r.status === 'EMPTY_SCORE');
    if (previewFilter === 'ISSUES') return parsedRows.filter((r) => r.status === 'UNMATCHED' || r.status === 'INVALID_SCORE');
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
                Unggah file Excel (.xlsx, .xls) atau CSV. Format nilai desimal fleksibel: sistem menerima format titik (<span className="font-mono text-amber-300 font-bold">76.70</span>) maupun format koma (<span className="font-mono text-amber-300 font-bold">76,70</span>), keduanya otomatis dinormalisasi menjadi <span className="font-mono text-white font-bold">76.70</span>.
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

          {/* Flexible Number Format Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 space-y-0.5">
              <div className="font-bold flex items-center gap-1.5 flex-wrap">
                <span>Dukungan Format Nilai Fleksibel (Titik & Koma) serta Penanganan Nilai Kosong</span>
                <span className="bg-emerald-200/80 text-emerald-900 font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold">
                  76.70 & 76,70
                </span>
                <span className="bg-slate-200 text-slate-800 font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold">
                  Kosong / '-' = Tanpa Nilai
                </span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Sistem mendukung pemisah desimal titik (<code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">76.70</code>) maupun koma standar (<code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">76,70</code>) dengan normalisasi otomatis menjadi <code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">76.70</code>. Apabila nilai pada kolom berupa kosong atau tanda strip (<code className="font-mono font-bold bg-emerald-100 px-1 py-0.2 rounded">-</code>), sistem menganggapnya sebagai <strong>tidak ada nilai / kosong</strong> (bukan error / cacat validasi).
              </p>
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
                  Format yang didukung: .xlsx, .xls, .csv | Nilai fleksibel: <span className="font-semibold text-indigo-900">76.70</span> / <span className="font-semibold text-indigo-900">76,70</span> | Kosong / '-' = valid tanpa nilai
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
                  Belum memiliki file Excel? Klik tombol di bawah untuk memuat data simulasi nilai fleksibel (koma, titik, kosong, & '-') yang langsung dipasangkan ke database.
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Baris File</span>
                  <div className="text-lg font-bold text-slate-900">{importMetrics.total} Baris</div>
                  <div className="text-[10px] text-slate-500">Seluruh entri terbaca</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Dengan Nilai</span>
                  <div className="text-lg font-bold text-emerald-700">{importMetrics.validWithScore} Peserta</div>
                  <div className="text-[10px] text-emerald-600">Skor valid (0.00 – 100.00)</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs bg-slate-50/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Tanpa Nilai / Kosong</span>
                  <div className="text-lg font-bold text-slate-800">{importMetrics.emptyScore} Baris</div>
                  <div className="text-[10px] text-slate-500">Kosong atau tanda '-'</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs bg-amber-50/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Tidak Ditemukan</span>
                  <div className="text-lg font-bold text-amber-700">{importMetrics.unmatched} Baris</div>
                  <div className="text-[10px] text-amber-600">No. Reg / NISN tidak di DB</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs bg-rose-50/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Format Nilai Cacat</span>
                  <div className="text-lg font-bold text-rose-700">{importMetrics.invalidScore} Baris</div>
                  <div className="text-[10px] text-rose-600">Bukan angka / di luar 0–100</div>
                </div>
              </div>

              {/* Filter Tabs & Batch Apply Action */}
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
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px] font-medium">Sertakan {importMetrics.emptyScore} data kosong (set 0.00)</span>
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
                    disabled={(importMetrics.validWithScore === 0 && (!includeEmptyScores || importMetrics.emptyScore === 0)) || isProcessing}
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
                        <th className="py-3 px-4">Baris</th>
                        <th className="py-3 px-4">No. Pendaftaran / NISN</th>
                        <th className="py-3 px-4">Peserta di Database</th>
                        <th className="py-3 px-4">Program Studi</th>
                        <th className="py-3 px-4 text-center">Nilai Lama</th>
                        <th className="py-3 px-4 text-center">Nilai Terbaca (Sistem)</th>
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
                                  : r.status === 'EMPTY_SCORE'
                                  ? 'bg-slate-50/40'
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
                                {r.status === 'EMPTY_SCORE' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                    <MinusCircle className="w-3 h-3 text-slate-400" />
                                    <span>Tanpa Nilai / Kosong</span>
                                  </span>
                                ) : r.parsedScore !== null ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="px-2.5 py-0.5 rounded font-bold text-xs bg-indigo-100 text-indigo-900 border border-indigo-300 font-mono">
                                      {r.parsedScore.toFixed(2)}
                                    </span>
                                    {r.formatNote && (
                                      <span className="text-[9px] text-emerald-700 font-medium font-mono mt-0.5" title={r.formatNote}>
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

                              <td className="py-3 px-4 text-center">
                                {r.status === 'VALID' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Siap Disimpan</span>
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
                                    <span>Skor Cacat</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-[11px]">
                                {r.errorMessage ? (
                                  <span className="text-rose-600 font-medium">
                                    {r.errorMessage}
                                  </span>
                                ) : r.status === 'EMPTY_SCORE' ? (
                                  <span className="text-slate-500 italic flex items-center gap-1">
                                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>Nilai kosong atau '-' (dianggap belum ada nilai, dilewati / diset 0.00)</span>
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

              {/* Score Input with Flexible Validation (0-100) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    Nilai UTBK / Skor TPA (0.00 – 100.00)
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                    Format fleksibel: 76.70 / 76,70 / Kosong / '-'
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Contoh: 76.70 atau 76,70 (atau kosongkan / '-')"
                  value={utbkScoreInput}
                  onChange={(e) => {
                    setUtbkScoreInput(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full px-3 py-2 text-base font-bold border border-slate-300 rounded text-indigo-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none font-mono"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Sistem menerima format titik (<span className="font-mono font-semibold">76.70</span>) maupun koma (<span className="font-mono font-semibold">76,70</span>). Jika dikosongkan atau diisi <span className="font-mono font-semibold">'-'</span>, sistem menganggapnya tanpa nilai (dikosongkan).
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
