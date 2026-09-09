import React, { useState, useRef } from 'react';
import { Participant } from '../../types';
import { STANDARD_DOCUMENT_REQUIREMENTS } from '../../utils/selectionUtils';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  UserCheck, 
  Calendar, 
  FileText,
  RotateCcw,
  Check,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onBatchUpdate: (updatedParticipants: Participant[]) => void;
  currentUserName?: string;
}

export interface ParsedVerificationRow {
  index: number;
  rawName: string;
  matchedParticipant: Participant | null;
  receiver: string;
  receivedDate: string;
  checker: string;
  checkedDate: string;
  completenessText: string;
  status: 'Lengkap' | 'Perlu Perbaikan' | 'Ditolak' | 'Belum Diverifikasi';
  notes: string;
  isValid: boolean;
  errorReason?: string;
}

export const ImportVerificationModal: React.FC<ImportVerificationModalProps> = ({
  isOpen,
  onClose,
  participants,
  onBatchUpdate,
  currentUserName = 'Operator Pemberkasan'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedVerificationRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MATCHED' | 'UNMATCHED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  // Helper to normalize date string or Excel serial number to YYYY-MM-DD
  const normalizeDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      try {
        const parsed = XLSX.SSF.parse_date_code(val);
        if (parsed) {
          const y = parsed.y;
          const m = String(parsed.m).padStart(2, '0');
          const d = String(parsed.d).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      } catch (e) {
        console.warn('Failed to parse excel date code:', val);
      }
    }
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    const str = String(val).trim();
    // Check if DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }
    // Check if YYYY-MM-DD
    const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = ymdMatch[2].padStart(2, '0');
      const d = ymdMatch[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return str;
  };

  // Helper to normalize verification status
  const normalizeStatus = (rawStatus: any, completeness: string): 'Lengkap' | 'Perlu Perbaikan' | 'Ditolak' | 'Belum Diverifikasi' => {
    const s = String(rawStatus || '').toLowerCase().trim();
    if (s.includes('lengkap') && !s.includes('tidak') && !s.includes('belum')) {
      return 'Lengkap';
    }
    if (s.includes('perlu') || s.includes('perbaikan') || s.includes('revisi') || s.includes('kurang')) {
      return 'Perlu Perbaikan';
    }
    if (s.includes('tolak') || s.includes('ditolak') || s.includes('gugur') || s.includes('tidak sah')) {
      return 'Ditolak';
    }
    if (s.includes('belum')) {
      return 'Belum Diverifikasi';
    }
    // If empty status, check completeness text
    const compLower = completeness.toLowerCase();
    if (compLower.includes('lengkap') && !compLower.includes('tidak')) {
      return 'Lengkap';
    }
    return 'Belum Diverifikasi';
  };

  // Build checklist dictionary from completeness text
  const parseChecklist = (completenessText: string, status: string): Record<string, boolean> => {
    const checklist: Record<string, boolean> = {};
    const textLower = completenessText.toLowerCase();

    if (status === 'Lengkap' || textLower.includes('lengkap') || textLower.includes('semua')) {
      STANDARD_DOCUMENT_REQUIREMENTS.forEach((req) => {
        checklist[req.id] = true;
      });
      return checklist;
    }

    STANDARD_DOCUMENT_REQUIREMENTS.forEach((req) => {
      let isPresent = false;
      const titleLower = req.title.toLowerCase();
      if (textLower.includes('ktp') && titleLower.includes('ktp')) isPresent = true;
      if (textLower.includes('kk') && titleLower.includes('kartu keluarga')) isPresent = true;
      if ((textLower.includes('kip') || textLower.includes('kks') || textLower.includes('pkh')) && titleLower.includes('kip')) isPresent = true;
      if ((textLower.includes('rapor') || textLower.includes('ijazah') || textLower.includes('skl')) && (titleLower.includes('rapor') || titleLower.includes('ijazah'))) isPresent = true;
      if ((textLower.includes('gaji') || textLower.includes('penghasilan')) && titleLower.includes('penghasilan')) isPresent = true;
      if ((textLower.includes('rumah') || textLower.includes('foto')) && titleLower.includes('rumah')) isPresent = true;
      if ((textLower.includes('listrik') || textLower.includes('pbb')) && titleLower.includes('listrik')) isPresent = true;
      if (textLower.includes('pernyataan') && titleLower.includes('pernyataan')) isPresent = true;
      checklist[req.id] = isPresent;
    });

    return checklist;
  };

  // Download template Excel with official column format and real/sample participants
  const handleDownloadTemplate = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Pick sample participants or real ones from list
    const sampleRows = participants.length > 0
      ? participants.slice(0, 5).map((p, idx) => ({
          'Nama': p.name,
          'Petugas Penerima': p.documentReceiver || currentUserName,
          'Tanggal Penerimaan': p.documentReceivedDate || today,
          'Petugas Verifikator / Pengecek': p.documentChecker || 'Dra. Nurhayati, M.Pd',
          'Tanggal Cek Berkas': p.documentCheckedDate || today,
          'Kelengkapan Berkas': idx === 1 ? 'KTP, KK, Surat Miskin RT' : 'Lengkap (Semua Dokumen Sah)',
          'Status Hasil Pemberkasan': idx === 1 ? 'Perlu Perbaikan' : 'Lengkap',
          'Catatan': idx === 1 ? 'Surat keterangan penghasilan belum legalisir kelurahan' : 'Seluruh berkas fisik asli dan fotokopi sah'
        }))
      : [
          {
            'Nama': 'Ahmad Dahlan',
            'Petugas Penerima': 'Budi Santoso, S.Sos',
            'Tanggal Penerimaan': today,
            'Petugas Verifikator / Pengecek': 'Dra. Nurhayati, M.Pd',
            'Tanggal Cek Berkas': today,
            'Kelengkapan Berkas': 'Lengkap (Semua Dokumen Sah)',
            'Status Hasil Pemberkasan': 'Lengkap',
            'Catatan': 'Seluruh berkas fisik asli dan fotokopi legalisir lengkap dan sah.'
          },
          {
            'Nama': 'Siti Rahmawati',
            'Petugas Penerima': 'Budi Santoso, S.Sos',
            'Tanggal Penerimaan': today,
            'Petugas Verifikator / Pengecek': 'Dra. Nurhayati, M.Pd',
            'Tanggal Cek Berkas': today,
            'Kelengkapan Berkas': 'KTP, KK, Surat Keterangan DTKS',
            'Status Hasil Pemberkasan': 'Perlu Perbaikan',
            'Catatan': 'Surat keterangan penghasilan RT/Kelurahan belum bertanda tangan lurah, perlu perbaikan.'
          },
          {
            'Nama': 'Bambang Sudarsono',
            'Petugas Penerima': 'Indra Gunawan, S.Kom',
            'Tanggal Penerimaan': today,
            'Petugas Verifikator / Pengecek': 'Hendri Kurniawan, M.Kom',
            'Tanggal Cek Berkas': today,
            'Kelengkapan Berkas': 'Lengkap',
            'Status Hasil Pemberkasan': 'Lengkap',
            'Catatan': 'Berkas memenuhi kriteria desil kemiskinan dan lolos verifikasi berkas.'
          }
        ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows, {
      header: [
        'Nama',
        'Petugas Penerima',
        'Tanggal Penerimaan',
        'Petugas Verifikator / Pengecek',
        'Tanggal Cek Berkas',
        'Kelengkapan Berkas',
        'Status Hasil Pemberkasan',
        'Catatan'
      ]
    });

    // Set columns width
    worksheet['!cols'] = [
      { wch: 26 }, // Nama
      { wch: 22 }, // Petugas Penerima
      { wch: 18 }, // Tanggal Penerimaan
      { wch: 28 }, // Petugas Verifikator / Pengecek
      { wch: 18 }, // Tanggal Cek Berkas
      { wch: 30 }, // Kelengkapan Berkas
      { wch: 24 }, // Status Hasil Pemberkasan
      { wch: 45 }, // Catatan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verifikasi Berkas');
    XLSX.writeFile(workbook, 'Template_Import_Verifikasi_Berkas_KIPK_UNIHAZ.xlsx');
  };

  // Process uploaded file
  const processFile = (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.');
          setIsProcessing(false);
          return;
        }

        // Build name lookup index for rapid matching
        const participantNameMap = new Map<string, Participant>();
        const participantRegMap = new Map<string, Participant>();
        const participantNikMap = new Map<string, Participant>();
        const participantNisnMap = new Map<string, Participant>();

        participants.forEach((p) => {
          participantNameMap.set(p.name.trim().toLowerCase(), p);
          participantRegMap.set(p.regNumber.trim().toLowerCase(), p);
          if (p.nik) participantNikMap.set(p.nik.trim(), p);
          if (p.nisn) participantNisnMap.set(p.nisn.trim(), p);
        });

        const rows: ParsedVerificationRow[] = rawJson.map((item, idx) => {
          // Flexible key lookup
          const rawName = String(
            item['Nama'] ||
            item['nama'] ||
            item['Nama Lengkap'] ||
            item['nama lengkap'] ||
            item['Nama Peserta'] ||
            item['Peserta'] ||
            item['No Pendaftaran'] ||
            item['Nomor Pendaftaran'] ||
            ''
          ).trim();

          const receiver = String(
            item['Petugas Penerima'] ||
            item['petugas penerma'] ||
            item['Petugas Penerma'] ||
            item['Penerima'] ||
            item['Penerima Berkas'] ||
            currentUserName
          ).trim();

          const receivedDate = normalizeDate(
            item['Tanggal Penerimaan'] ||
            item['tanggal penerimaan'] ||
            item['Tgl Penerimaan'] ||
            item['Tanggal Diterima']
          );

          const checker = String(
            item['Petugas Verifikator / Pengecek'] ||
            item['petugas verifikator/ pengecek'] ||
            item['Petugas Verifikator'] ||
            item['Petugas Pengecek'] ||
            item['Verifikator'] ||
            item['Pemeriksa'] ||
            currentUserName
          ).trim();

          const checkedDate = normalizeDate(
            item['Tanggal Cek Berkas'] ||
            item['tanggal cek berkas'] ||
            item['Tgl Cek Berkas'] ||
            item['Tanggal Petugas Verifikator'] ||
            item['Tanggal Petugas Verifikator / Pengecek'] ||
            item['Tanggal Verifikasi'] ||
            receivedDate
          );

          const completenessText = String(
            item['Kelengkapan Berkas'] ||
            item['kelengkepan berkas'] ||
            item['Kelengkapan'] ||
            item['Checklist'] ||
            ''
          ).trim();

          const rawStatus = item['Status Hasil Pemberkasan'] ||
            item['status hasil pemberkasan'] ||
            item['Status Pemberkasan'] ||
            item['Status Berkas'] ||
            item['Hasil Pemberkasan'];

          const status = normalizeStatus(rawStatus, completenessText);

          const notes = String(
            item['Catatan'] ||
            item['catatan'] ||
            item['Catatan Verifikator'] ||
            item['Keterangan'] ||
            ''
          ).trim();

          // Match against participants
          const lowerName = rawName.toLowerCase();
          let matched: Participant | null = null;

          if (participantNameMap.has(lowerName)) {
            matched = participantNameMap.get(lowerName)!;
          } else if (participantRegMap.has(lowerName)) {
            matched = participantRegMap.get(lowerName)!;
          } else if (participantNikMap.has(rawName)) {
            matched = participantNikMap.get(rawName)!;
          } else if (participantNisnMap.has(rawName)) {
            matched = participantNisnMap.get(rawName)!;
          } else {
            // Partial substring match if exact not found
            for (const p of participants) {
              const pName = p.name.toLowerCase();
              if (pName.includes(lowerName) || lowerName.includes(pName)) {
                matched = p;
                break;
              }
            }
          }

          const isValid = !!matched;
          const errorReason = !matched ? 'Peserta tidak ditemukan di database pendaftar' : undefined;

          return {
            index: idx + 1,
            rawName,
            matchedParticipant: matched,
            receiver,
            receivedDate: receivedDate || new Date().toISOString().split('T')[0],
            checker,
            checkedDate: checkedDate || new Date().toISOString().split('T')[0],
            completenessText: completenessText || 'Lengkap',
            status,
            notes,
            isValid,
            errorReason
          };
        });

        setParsedRows(rows);
      } catch (err) {
        console.error('Failed to parse Excel file:', err);
        alert('Terjadi kesalahan saat membaca file Excel. Pastikan format file valid (.xlsx, .xls, .csv).');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setParsedRows([]);
    setSearchQuery('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit and update matched participants
  const handleApplyUpdates = () => {
    const matchedRows = parsedRows.filter((r) => r.isValid && r.matchedParticipant);
    if (matchedRows.length === 0) {
      alert('Tidak ada data yang cocok dengan database pendaftar.');
      return;
    }

    const updatedParticipants: Participant[] = matchedRows.map((row) => {
      const p = row.matchedParticipant!;
      const checklist = parseChecklist(row.completenessText, row.status);

      return {
        ...p,
        documentReceiver: row.receiver || p.documentReceiver,
        documentReceivedDate: row.receivedDate || p.documentReceivedDate,
        documentChecker: row.checker || p.documentChecker,
        documentCheckedDate: row.checkedDate || p.documentCheckedDate,
        documentStatus: row.status,
        documentNotes: row.notes || p.documentNotes,
        documentChecklist: checklist,
        updatedAt: new Date().toISOString()
      };
    });

    onBatchUpdate(updatedParticipants);
    onClose();
  };

  // Filter and stats
  const totalCount = parsedRows.length;
  const matchedCount = parsedRows.filter((r) => r.isValid).length;
  const unmatchedCount = parsedRows.filter((r) => !r.isValid).length;

  const filteredRows = parsedRows.filter((r) => {
    if (activeFilter === 'MATCHED' && !r.isValid) return false;
    if (activeFilter === 'UNMATCHED' && r.isValid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = r.rawName.toLowerCase().includes(q);
      const matchesChecker = r.checker.toLowerCase().includes(q);
      const matchesStatus = r.status.toLowerCase().includes(q);
      const matchesReg = r.matchedParticipant?.regNumber.toLowerCase().includes(q);
      return matchesName || matchesChecker || matchesStatus || matchesReg;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 text-blue-950 font-bold flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Import Data Verifikasi Berkas (Pemberkasan)</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                  Tahap 1
                </span>
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Upload data penerima, verifikator, tanggal cek berkas, kelengkapan, dan status verifikasi via Excel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">
          
          {/* Top Instruction & Template Banner */}
          <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Format Kolom Upload Excel Resmi:</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-semibold">Nama &bull; Petugas Penerima &bull; Tanggal Penerimaan &bull; Petugas Verifikator / Pengecek &bull; Tanggal Cek Berkas &bull; Kelengkapan Berkas &bull; Status Hasil Pemberkasan &bull; Catatan</span>
              </p>
              <p className="text-[11px] text-blue-600">
                Sistem otomatis mencocokkan data baris dengan pendaftar di database berdasarkan Nama Lengkap atau Nomor Registrasi.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-blue-100/70 border border-blue-300 text-blue-900 font-bold text-xs shadow-xs hover:shadow-sm transition cursor-pointer shrink-0"
              title="Unduh format tabel Excel yang telah disiapkan"
            >
              <Download className="w-4 h-4 text-blue-700" />
              <span>Unduh Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* Upload Zone when no file parsed */}
          {parsedRows.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                isDragging 
                  ? 'border-blue-600 bg-blue-50/70 scale-[0.99]' 
                  : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
                id="verification-file-input"
              />

              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Upload className="w-7 h-7 text-blue-800" />
              </div>

              <h3 className="text-sm font-bold text-slate-800 mb-1">
                Tarik & Letakkan File Excel di Sini
              </h3>
              <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
                Mendukung format file <span className="font-semibold text-slate-700">.xlsx, .xls, dan .csv</span>.
                Gunakan template yang telah disediakan untuk memastikan struktur kolom tepat.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Membaca File...' : 'Pilih File dari Komputer'}
              </button>
            </div>
          ) : (
            /* Parsed Preview Section */
            <div className="space-y-4">
              
              {/* Summary Stats & Actions bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500">Total Baris File</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{totalCount}</div>
                </div>

                <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-200">
                  <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Data Cocok (Valid)</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-900 mt-0.5">{matchedCount}</div>
                </div>

                <div className="bg-rose-50/80 rounded-xl p-3 border border-rose-200">
                  <div className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tidak Ditemukan</span>
                  </div>
                  <div className="text-xl font-bold text-rose-900 mt-0.5">{unmatchedCount}</div>
                </div>

                <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-200 flex flex-col justify-between">
                  <div className="text-[11px] font-semibold text-blue-800 truncate" title={fileName || ''}>
                    {fileName}
                  </div>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 transition mt-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Ganti File Lain</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs w-full sm:w-auto">
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-3 py-1 rounded-md font-semibold transition ${
                      activeFilter === 'ALL' 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({totalCount})
                  </button>
                  <button
                    onClick={() => setActiveFilter('MATCHED')}
                    className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                      activeFilter === 'MATCHED' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Cocok</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/60 text-white">
                      {matchedCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveFilter('UNMATCHED')}
                    className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                      activeFilter === 'UNMATCHED' 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Tidak Cocok</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-700/60 text-white">
                      {unmatchedCount}
                    </span>
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari peserta / verifikator..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Status Match</th>
                        <th className="py-2.5 px-3">Nama Peserta (Excel)</th>
                        <th className="py-2.5 px-3">Petugas Penerima</th>
                        <th className="py-2.5 px-3">Tgl Penerimaan</th>
                        <th className="py-2.5 px-3">Petugas Verifikator / Pengecek</th>
                        <th className="py-2.5 px-3">Tgl Cek Berkas</th>
                        <th className="py-2.5 px-3">Kelengkapan</th>
                        <th className="py-2.5 px-3">Hasil Pemberkasan</th>
                        <th className="py-2.5 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-6 text-center text-slate-400 italic text-xs">
                            Tidak ada baris data yang cocok dengan filter atau pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => (
                          <tr 
                            key={row.index} 
                            className={`hover:bg-slate-50/80 transition-colors ${
                              !row.isValid ? 'bg-rose-50/30' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{row.index}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3" /> Cocok ({row.matchedParticipant?.regNumber})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300" title={row.errorReason}>
                                  <AlertCircle className="w-3 h-3" /> Tidak Ditemukan
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                              {row.rawName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{row.receiver || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {row.receivedDate || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                <span>{row.checker || '-'}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 font-semibold whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{row.checkedDate || '-'}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 max-w-[160px] truncate" title={row.completenessText}>
                              {row.completenessText || 'Lengkap'}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {row.status === 'Lengkap' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  Lengkap
                                </span>
                              )}
                              {row.status === 'Perlu Perbaikan' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Perlu Perbaikan
                                </span>
                              )}
                              {row.status === 'Ditolak' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  Ditolak
                                </span>
                              )}
                              {row.status === 'Belum Diverifikasi' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  Belum Verifikasi
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 italic text-[11px] max-w-[200px] truncate" title={row.notes}>
                              {row.notes || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && (
              <span>
                Menampilkan <strong className="text-slate-800">{filteredRows.length}</strong> dari{' '}
                <strong className="text-slate-800">{totalCount}</strong> baris data.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
            >
              Batal
            </button>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleApplyUpdates}
                disabled={matchedCount === 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan Hasil Verifikasi ({matchedCount} Peserta)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
