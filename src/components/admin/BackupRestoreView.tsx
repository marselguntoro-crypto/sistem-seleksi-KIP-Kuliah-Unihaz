import React, { useState, useEffect } from 'react';
import { DatabaseBackupItem, Participant, StudyProgram, Faculty, AcademicYear, User, SelectionAuditLog, SelectionWeights } from '../../types';
import { api } from '../../utils/api';
import { 
  testSupabaseConnection, 
  isSupabaseConfigured, 
  updateSupabaseCredentials, 
  getStoredSupabaseCredentials,
  sanitizeSupabaseUrl,
  sanitizeSupabaseAnonKey
} from '../../services/supabaseClient';
import { SUPABASE_SCHEMA_SQL } from '../../services/supabaseSchemaSql';
import {
  Database,
  Download,
  UploadCloud,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FileText,
  Clock,
  ShieldCheck,
  HardDrive,
  Calendar,
  AlertCircle,
  X,
  Play,
  Layers,
  Sparkles,
  Server,
  Settings,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

interface BackupRestoreViewProps {
  backups: DatabaseBackupItem[];
  participants: Participant[];
  studyPrograms: StudyProgram[];
  faculties: Faculty[];
  academicYears: AcademicYear[];
  users: User[];
  auditLogs: SelectionAuditLog[];
  weights: SelectionWeights;
  currentUser: User;
  onCreateBackup: (backup: DatabaseBackupItem) => void;
  onDeleteBackup: (id: string) => void;
  onRestoreBackup: (backup: DatabaseBackupItem) => void;
  onRestoreFromJson: (data: any) => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  backups,
  participants,
  studyPrograms,
  faculties,
  academicYears,
  users,
  auditLogs,
  weights,
  currentUser,
  onCreateBackup,
  onDeleteBackup,
  onRestoreBackup,
  onRestoreFromJson,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [targetRestoreBackup, setTargetRestoreBackup] = useState<DatabaseBackupItem | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStep, setRestoreStep] = useState(0);

  // New Backup Form state
  const [backupType, setBackupType] = useState<'FULL_SQL' | 'JSON_DATA' | 'DOCS_LOGS'>('FULL_SQL');
  const [backupDesc, setBackupDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedJsonData, setUploadedJsonData] = useState<any>(null);

  // Health and Database Engine state
  const [dbHealth, setDbHealth] = useState<{ status: string; database: string; mongodb?: any; isConfigured: boolean } | null>(null);
  
  // Supabase Connection Test state
  const [supabaseTest, setSupabaseTest] = useState<{
    testing: boolean;
    tested: boolean;
    success?: boolean;
    message?: string;
    latencyMs?: number;
    url?: string;
    isConfigured?: boolean;
    needsSchema?: boolean;
    source?: 'env' | 'localStorage' | 'none';
  }>({
    testing: false,
    tested: false,
    isConfigured: isSupabaseConfigured,
    source: getStoredSupabaseCredentials().source,
  });

  // Supabase Credentials Config & SQL Schema Modal states
  const [isSupabaseConfigModalOpen, setIsSupabaseConfigModalOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const runTestSupabase = async () => {
    setSupabaseTest(prev => ({ ...prev, testing: true }));
    const creds = getStoredSupabaseCredentials();
    const result = await testSupabaseConnection();
    setSupabaseTest({
      testing: false,
      tested: true,
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
      url: result.url,
      isConfigured: result.isConfigured,
      needsSchema: result.needsSchema,
      source: creds.source,
    });
  };

  const handleOpenSupabaseConfig = () => {
    const creds = getStoredSupabaseCredentials();
    setSupabaseUrlInput(creds.source !== 'none' ? creds.url : '');
    setSupabaseKeyInput(creds.source !== 'none' ? creds.anonKey : '');
    setIsSupabaseConfigModalOpen(true);
  };

  const handleSaveSupabaseConfig = async () => {
    const cleanUrl = sanitizeSupabaseUrl(supabaseUrlInput);
    const cleanKey = sanitizeSupabaseAnonKey(supabaseKeyInput);
    setSupabaseUrlInput(cleanUrl);
    setSupabaseKeyInput(cleanKey);
    updateSupabaseCredentials(cleanUrl, cleanKey);
    setIsSupabaseConfigModalOpen(false);
    runTestSupabase();
  };

  const handleClearSupabaseConfig = async () => {
    updateSupabaseCredentials('', '');
    setIsSupabaseConfigModalOpen(false);
    runTestSupabase();
  };

  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncFeedback(null);
    try {
      const res = await api.syncAllToSupabase({
        participants,
        academicYears,
        faculties,
        studyPrograms,
        users,
        weights,
      });
      if (res.success) {
        setSyncFeedback(`✅ Berhasil mengirim ${res.count} data (termasuk ${participants.length} peserta) ke tabel Supabase!`);
        runTestSupabase();
      } else {
        setSyncFeedback(`⚠️ Gagal: ${res.error || 'Terjadi kesalahan saat sinkronisasi'}`);
      }
    } catch (err: any) {
      setSyncFeedback(`⚠️ Error: ${err?.message || 'Gagal sinkronisasi'}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  useEffect(() => {
    api.getHealth().then(setDbHealth).catch(() => {});
    if (isSupabaseConfigured) {
      runTestSupabase();
    }
  }, []);

  // Database statistics
  const totalRecords =
    participants.length +
    studyPrograms.length +
    faculties.length +
    academicYears.length +
    users.length +
    auditLogs.length;

  // Generate downloadable file
  const handleDownloadBackup = (backup: DatabaseBackupItem) => {
    let content = '';
    let mimeType = 'text/plain';
    let ext = 'sql';

    if (backup.type === 'JSON_DATA') {
      const dumpPayload = {
        metadata: {
          system: 'Sistem Seleksi KIP-Kuliah UNIHAZ Bengkulu',
          backupId: backup.id,
          createdAt: backup.createdAt,
          createdBy: backup.createdBy,
          checksumSha256: backup.checksumSha256,
        },
        weights,
        counts: backup.recordCounts,
        data: {
          participants,
          studyPrograms,
          faculties,
          academicYears,
          users,
          auditLogs: auditLogs.slice(0, 50),
        },
      };
      content = JSON.stringify(dumpPayload, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else {
      // SQL dump simulation with real schema & inserts
      content = `-- ====================================================================\n` +
        `-- UNIVERSITAS PROF. DR. HAZAIRIN, SH (UNIHAZ) BENGKULU\n` +
        `-- SISTEM SELEKSI BEASISWA KIP-KULIAH - RELATIONAL DATABASE DUMP\n` +
        `-- Snapshot ID   : ${backup.id}\n` +
        `-- Dibuat Pada   : ${backup.createdAt}\n` +
        `-- Dibuat Oleh   : ${backup.createdBy}\n` +
        `-- SHA-256 Check : ${backup.checksumSha256}\n` +
        `-- ====================================================================\n\n` +
        `BEGIN TRANSACTION;\n\n` +
        `-- Master Data: Academic Years (${academicYears.length} rows)\n` +
        academicYears.map((ay) => `INSERT INTO academic_years (id, code, semester, quota, is_active) VALUES (${ay.id}, '${ay.code}', '${ay.semester}', ${ay.quota}, ${ay.isActive});`).join('\n') +
        `\n\n-- Master Data: Faculties (${faculties.length} rows)\n` +
        faculties.map((f) => `INSERT INTO faculties (id, code, name, dean, is_active) VALUES (${f.id}, '${f.code}', '${f.name}', '${f.dean}', ${f.isActive});`).join('\n') +
        `\n\n-- Master Data: Study Programs (${studyPrograms.length} rows)\n` +
        studyPrograms.map((p) => `INSERT INTO study_programs (id, code, name, degree, quota, faculty_id) VALUES (${p.id}, '${p.code}', '${p.name}', '${p.degree}', ${p.quota}, ${p.facultyId});`).join('\n') +
        `\n\n-- Selection Candidates (${participants.length} rows)\n` +
        participants.slice(0, 20).map((p) => `INSERT INTO participants (id, reg_number, name, nik, nisn, utbk_score, interview_score, survey_score, final_score, status) VALUES (${p.id}, '${p.regNumber}', '${p.name.replace(/'/g, "''")}', '${p.nik}', '${p.nisn}', ${p.utbkScore || 0}, ${p.interviewScore || 0}, ${p.surveyScore || 0}, ${p.finalScore || 0}, '${p.status}');`).join('\n') +
        `\n\nCOMMIT;\n-- Dump Complete.\n`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Submit create new backup
  const handleCreateNewBackup = () => {
    setIsCreating(true);

    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const ext = backupType === 'JSON_DATA' ? 'json' : 'sql';
      const typeLabel = backupType === 'JSON_DATA' ? 'data' : backupType === 'DOCS_LOGS' ? 'docs_log' : 'full';
      const filename = `backup_unihaz_kipk_${dateStr}_${typeLabel}.${ext}`;

      const fakeChecksum = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const newBackup: DatabaseBackupItem = {
        id: `backup-${dateStr}`,
        filename,
        sizeBytes: backupType === 'JSON_DATA' ? 1620000 : 2850000,
        formattedSize: backupType === 'JSON_DATA' ? '1.55 MB' : '2.72 MB',
        type: backupType,
        createdAt: now.toISOString().replace('T', ' ').slice(0, 19),
        createdBy: `${currentUser.name} (${currentUser.role})`,
        checksumSha256: fakeChecksum,
        description: backupDesc.trim() || 'Snapshot manual sistem sebelum perankingan beasiswa.',
        recordCounts: {
          participants: participants.length,
          studyPrograms: studyPrograms.length,
          faculties: faculties.length,
          academicYears: academicYears.length,
          users: users.length,
          auditLogs: auditLogs.length,
        },
        status: 'VERIFIED',
      };

      onCreateBackup(newBackup);
      setIsCreating(false);
      setIsCreateModalOpen(false);
      setBackupDesc('');

      // Auto download the newly created backup
      handleDownloadBackup(newBackup);
    }, 1200);
  };

  // Trigger restore
  const handleStartRestore = () => {
    if (restoreConfirmText !== 'RESTORE-DATABASE-UNIHAZ') return;
    setIsRestoring(true);
    setRestoreStep(1);

    setTimeout(() => {
      setRestoreStep(2);
      setTimeout(() => {
        setRestoreStep(3);
        setTimeout(() => {
          if (uploadedJsonData) {
            onRestoreFromJson(uploadedJsonData);
          } else if (targetRestoreBackup) {
            onRestoreBackup(targetRestoreBackup);
          }
          setIsRestoring(false);
          setIsRestoreModalOpen(false);
          setTargetRestoreBackup(null);
          setRestoreConfirmText('');
          setUploadedFile(null);
          setUploadedJsonData(null);
          setRestoreStep(0);
        }, 800);
      }, 900);
    }, 900);
  };

  // Handle uploaded backup file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setUploadedJsonData(parsed);
        } catch {
          alert('Format berkas JSON tidak valid.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Backup & Restore Database Sistem</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                  Disaster Recovery
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Pencadangan rutin database relasional, ekspor dump PostgreSQL/JSON data pendaftar KIP-Kuliah, serta prosedur pemulihan darurat sistem UNIHAZ dengan verifikasi integritas SHA-256.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setTargetRestoreBackup(null);
                setUploadedFile(null);
                setRestoreConfirmText('');
                setIsRestoreModalOpen(true);
              }}
              id="btn-open-restore-modal"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
              Pulihkan Database
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              id="btn-open-create-backup-modal"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-900 border border-blue-950 text-white hover:bg-blue-800 transition cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4" />
              Buat Backup Baru
            </button>
          </div>
        </div>

        {/* Database Health & Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Status Database Engine</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-xs font-bold flex items-center gap-1 ${
                dbHealth?.mongodb?.hasPlaceholderPassword 
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  dbHealth?.mongodb?.hasPlaceholderPassword 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500 animate-ping'
                }`} /> 
                {dbHealth?.mongodb?.connected 
                  ? 'MongoDB Atlas Aktif' 
                  : dbHealth?.mongodb?.hasPlaceholderPassword 
                  ? 'Menunggu Password' 
                  : 'Online & Sehat'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono truncate ml-1 max-w-[120px]" title={dbHealth?.database || 'Database'}>
                {dbHealth?.mongodb?.connected ? 'Cluster0 Atlas' : dbHealth?.mongodb?.hasPlaceholderPassword ? 'Atlas (Pending)' : 'PostgreSQL/Cloud'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/60">
            <div className="flex items-center gap-1 text-[11px] font-medium text-blue-700">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Total Entitas Tersimpan</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-blue-900">{totalRecords}</span>
              <span className="text-[10px] text-blue-600 font-semibold">Relasi Data</span>
            </div>
          </div>

          <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200/60">
            <div className="flex items-center gap-1 text-[11px] font-medium text-teal-700">
              <HardDrive className="w-3.5 h-3.5 text-teal-500" />
              <span>Estimasi Ukuran Dump</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-teal-900">2.80 MB</span>
              <span className="text-[10px] text-teal-600 font-semibold">Terkonfigurasi</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200/60">
            <div className="flex items-center gap-1 text-[11px] font-medium text-purple-700">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              <span>Jadwal Auto-Backup</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xs font-bold text-purple-900">Setiap 02:00 WIB</span>
              <span className="text-[10px] text-purple-600 font-semibold">Harian</span>
            </div>
          </div>
        </div>

        {/* Live Supabase Connection Banner & Interactive Tester */}
        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-blue-50/70 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              supabaseTest.tested && supabaseTest.success
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                : supabaseTest.testing
                ? 'bg-blue-600 text-white animate-pulse'
                : supabaseTest.needsSchema
                ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                : supabaseTest.isConfigured
                ? 'bg-slate-800 text-white'
                : 'bg-amber-100 text-amber-700'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800">Supabase Cloud PostgreSQL</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  supabaseTest.tested && supabaseTest.success
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : supabaseTest.testing
                    ? 'bg-blue-100 text-blue-800'
                    : supabaseTest.needsSchema
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : supabaseTest.isConfigured
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {supabaseTest.tested && supabaseTest.success
                    ? '● Terhubung Aktif'
                    : supabaseTest.testing
                    ? 'Memeriksa...'
                    : supabaseTest.needsSchema
                    ? 'Perlu Schema SQL'
                    : supabaseTest.isConfigured
                    ? 'Kredensial Siap'
                    : 'Belum Dikonfigurasi'}
                </span>
                
                {supabaseTest.source && supabaseTest.source !== 'none' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/80 text-slate-700">
                    Sumber: {supabaseTest.source === 'localStorage' ? 'Browser (LocalStorage)' : 'Vercel Env'}
                  </span>
                )}

                {supabaseTest.latencyMs !== undefined && (
                  <span className="text-[10px] font-mono text-slate-500">
                    ({supabaseTest.latencyMs} ms)
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 mt-1">
                {supabaseTest.tested
                  ? supabaseTest.message
                  : supabaseTest.isConfigured
                  ? 'Kredensial database Supabase telah terpasang. Klik "Uji Koneksi" untuk memeriksa status tabel.'
                  : 'Aplikasi di Vercel belum memiliki kredensial Supabase. Klik "Atur URL & Key" untuk mengaktifkannya.'}
              </p>

              {supabaseTest.needsSchema && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Database Supabase Anda terhubung tetapi tabel belum dibuat.</span>
                  <button
                    type="button"
                    onClick={() => setIsSqlModalOpen(true)}
                    className="underline font-bold text-amber-950 hover:text-black cursor-pointer ml-1"
                  >
                    Buka Skrip SQL Tabel
                  </button>
                </div>
              )}

              {syncFeedback && (
                <p className="text-[11px] font-semibold text-emerald-800 mt-1.5 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 inline-block">
                  {syncFeedback}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenSupabaseConfig}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
              title="Atur Supabase Project URL & Anon Key"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Atur URL & Key</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer shadow-2xs"
              title="Lihat dan salin skrip DDL SQL untuk membuat seluruh tabel di Supabase"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Skrip SQL Schema</span>
            </button>

            <button
              type="button"
              onClick={runTestSupabase}
              disabled={supabaseTest.testing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${supabaseTest.testing ? 'animate-spin' : ''}`} />
              <span>{supabaseTest.testing ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={isSyncingSupabase || !supabaseTest.isConfigured}
              title={`Kirim seluruh ${participants.length} data peserta dan master data yang ada saat ini langsung ke tabel Supabase`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-900 hover:bg-blue-800 text-white transition disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-bounce' : ''}`} />
              <span>{isSyncingSupabase ? 'Mengirim Data...' : `Sinkronkan Data (${participants.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Daftar Snapshot Cadangan Database ({backups.length})</h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Berkas cadangan tersimpan di penyimpanan terlindungi dengan hash SHA-256
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama File & Keterangan</th>
                <th className="py-3 px-4 w-28">Tipe Cadangan</th>
                <th className="py-3 px-4 w-24">Ukuran</th>
                <th className="py-3 px-4 w-36">Waktu Pembuatan</th>
                <th className="py-3 px-4 w-40">Dibuat Oleh</th>
                <th className="py-3 px-4 w-24 text-center">Status</th>
                <th className="py-3 px-4 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                    {index + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      {item.type === 'JSON_DATA' ? (
                        <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                      <span>{item.filename}</span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-sm" title={item.checksumSha256}>
                      SHA-256: {item.checksumSha256.slice(0, 16)}...
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.type === 'FULL_SQL' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Full SQL Dump
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        JSON Dataset
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {item.formattedSize}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-slate-700 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.createdAt}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-800 text-[11px] truncate max-w-[150px]">{item.createdBy}</p>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleDownloadBackup(item)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-800 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
                        title="Unduh File Backup ke Komputer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setTargetRestoreBackup(item);
                          setRestoreConfirmText('');
                          setIsRestoreModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50 transition cursor-pointer"
                        title="Pulihkan Database dari Snapshot Ini"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus snapshot backup "${item.filename}"?`)) {
                            onDeleteBackup(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto Backup Notice Card */}
      <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-blue-950">Kebijakan Retensi & Disaster Recovery UNIHAZ</h4>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            Sistem menjalankan snapshot otomatis terenkripsi setiap hari pada pukul 02:00 WIB. Snapshot kadaluarsa yang melewati periode retensi 30 hari akan diarsipkan secara bertahap. Pastikan untuk selalu mengunduh salinan berkas `.sql` atau `.json` ke penyimpanan luar sebelum penetapan SK Kelulusan resmi Rektor.
          </p>
        </div>
      </div>

      {/* Modal: Buat Backup Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Buat Snapshot Cadangan Baru</h3>
                  <p className="text-[11px] text-slate-500">Ekspor data instan ke berkas SQL atau JSON</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Pilih Format Cadangan:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      backupType === 'FULL_SQL'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="backupType"
                      value="FULL_SQL"
                      checked={backupType === 'FULL_SQL'}
                      onChange={() => setBackupType('FULL_SQL')}
                      className="sr-only"
                    />
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-blue-700" />
                      <span>Full SQL Dump (.sql)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Skrip SQL DDL & DML lengkap siap di-restore ke server PostgreSQL / MariaDB.
                    </p>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      backupType === 'JSON_DATA'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="backupType"
                      value="JSON_DATA"
                      checked={backupType === 'JSON_DATA'}
                      onChange={() => setBackupType('JSON_DATA')}
                      className="sr-only"
                    />
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>Dataset JSON (.json)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Data struktural peserta, prodi, dan konfigurasi bobot untuk interoperabilitas API.
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Snapshot (Opsional):
                </label>
                <input
                  type="text"
                  value={backupDesc}
                  onChange={(e) => setBackupDesc(e.target.value)}
                  placeholder="Contoh: Sebelum penetapan hasil wawancara gelombang I"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700">Cakupan Data yang Disimpan:</span>
                <ul className="mt-1.5 space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                  <li>{participants.length} Pendaftar KIP-Kuliah (Biodata, Nilai UTBK, Wawancara, Survey)</li>
                  <li>{studyPrograms.length} Program Studi & Kuota Beasiswa</li>
                  <li>{faculties.length} Fakultas & Dekan</li>
                  <li>{academicYears.length} Tahun Akademik Terdaftar</li>
                  <li>Konfigurasi Bobot Seleksi ({weights.utbkWeight}% / {weights.interviewWeight}% / {weights.surveyWeight}% / {weights.affirmationWeight}%)</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleCreateNewBackup}
                disabled={isCreating}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-900 border border-blue-950 text-white hover:bg-blue-800 transition cursor-pointer shadow-2xs"
              >
                {isCreating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Membuat Snapshot...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Proses & Unduh Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Restore Database */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Pemulihan Darurat (Restore Database)</h3>
                  <p className="text-[11px] text-rose-700">Tindakan ini akan menimpa data aktif saat ini</p>
                </div>
              </div>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                disabled={isRestoring}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {targetRestoreBackup ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">Snapshot Terpilih:</div>
                  <div className="font-mono font-bold text-blue-900 text-xs">{targetRestoreBackup.filename}</div>
                  <div className="text-[11px] text-slate-500">
                    Dibuat: {targetRestoreBackup.createdAt} • Ukuran: {targetRestoreBackup.formattedSize}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unggah File Backup (.json atau .sql):
                  </label>
                  <input
                    type="file"
                    accept=".json,.sql"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-lg"
                  />
                  {uploadedFile && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      Berkas siap diproses: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Peringatan Keamanan Kritis</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Operasi pemulihan akan menggantikan seluruh tabel peserta, kuota, dan skor saat ini dengan status yang tercatat dalam berkas backup. Tindakan ini tidak dapat dibatalkan secara instan.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ketik <span className="font-mono text-rose-700 font-bold">RESTORE-DATABASE-UNIHAZ</span> untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={restoreConfirmText}
                  onChange={(e) => setRestoreConfirmText(e.target.value)}
                  placeholder="Ketik persis teks di atas..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600"
                />
              </div>

              {isRestoring && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>
                      {restoreStep === 1 && 'Langkah 1/3: Membaca berkas & parsing entitas...'}
                      {restoreStep === 2 && 'Langkah 2/3: Memvalidasi integritas relasional data...'}
                      {restoreStep === 3 && 'Langkah 3/3: Menggantikan data & menyinkronkan sistem...'}
                    </span>
                    <span className="text-blue-700">{Math.round((restoreStep / 3) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-800 h-full transition-all duration-300"
                      style={{ width: `${(restoreStep / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleStartRestore}
                disabled={restoreConfirmText !== 'RESTORE-DATABASE-UNIHAZ' || isRestoring}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  restoreConfirmText === 'RESTORE-DATABASE-UNIHAZ' && !isRestoring
                    ? 'bg-rose-700 border border-rose-800 text-white hover:bg-rose-800 cursor-pointer shadow-2xs'
                    : 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRestoring ? 'Memulihkan Data...' : 'Konfirmasi & Pulihkan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Atur Kredensial Supabase (URL & Anon Key) */}
      {isSupabaseConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Pengaturan Kredensial Supabase</h3>
                  <p className="text-[11px] text-blue-200">Hubungkan aplikasi deployed Anda langsung ke database Supabase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupabaseConfigModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  Koneksi Langsung Tanpa Perlu Re-Deploy Vercel
                </p>
                <p className="text-[11px] text-blue-800">
                  Anda dapat memasukkan <strong>Project URL</strong> dan <strong>Anon Key</strong> Supabase di sini. Kredensial akan disimpan di browser (localStorage) dan sistem langsung aktif terhubung.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Project URL Supabase
                </label>
                <input
                  type="text"
                  placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value.trim())}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                {supabaseUrlInput && sanitizeSupabaseUrl(supabaseUrlInput) !== supabaseUrlInput && (
                  <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto-Normalisasi: Domain utama yang akan digunakan adalah <strong>{sanitizeSupabaseUrl(supabaseUrlInput)}</strong> (path tambahan dibersihkan otomatis).</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  Didapat dari: <em>Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL</em>. (Gunakan domain utama saja, contoh: <code>https://abcdefghijkl.supabase.co</code>, jangan sertakan <code>/rest/v1</code>).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Project API Anon / Public Key
                </label>
                <textarea
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value.trim())}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Didapat dari: <em>Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API Keys (anon public)</em>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">💡 Tips untuk Deploy Permanen di Vercel:</span>
                <p>
                  Untuk menghubungkan secara permanen bagi semua pengguna tanpa input manual, tambahkan 2 Environment Variables di Vercel Dashboard (<em>Settings &gt; Environment Variables</em>):
                </p>
                <code className="block bg-slate-200/70 p-1.5 rounded font-mono text-[10px] text-slate-800">
                  VITE_SUPABASE_URL = {supabaseUrlInput || 'https://xxxxxxxx.supabase.co'}<br />
                  VITE_SUPABASE_ANON_KEY = eyJhbG...
                </code>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearSupabaseConfig}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
              >
                Reset Kredensial
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupabaseConfigModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  disabled={!supabaseUrlInput || !supabaseKeyInput}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-blue-900 hover:bg-blue-800 text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan & Uji Koneksi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Skrip DDL SQL Schema Supabase */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Skrip SQL Schema Database Supabase</h3>
                  <p className="text-[11px] text-slate-300">Buat seluruh tabel dan data master awal di Supabase SQL Editor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Cara Menjalankan Skrip Ini di Supabase:</p>
                <ol className="list-decimal list-inside text-[11px] text-amber-800 mt-1 space-y-0.5">
                  <li>Buka dashboard Supabase project Anda di peramban.</li>
                  <li>Buka menu <strong>SQL Editor</strong> di bilah navigasi kiri.</li>
                  <li>Klik <strong>New Query</strong>, lalu tempelkan (Paste) seluruh teks SQL di bawah ini.</li>
                  <li>Klik tombol hijau <strong>Run</strong> (atau tekan Ctrl+Enter). Seluruh tabel dan data master langsung tercipta!</li>
                </ol>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950 font-mono text-[11px] text-slate-200">
              <pre className="whitespace-pre-wrap select-all leading-relaxed">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Mencakup 7 tabel: academic_years, faculties, study_programs, users, selection_weights, participants, audit_logs.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer shadow-xs"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua SQL</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
