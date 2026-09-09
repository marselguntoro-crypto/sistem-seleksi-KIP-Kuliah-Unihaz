export type RoleName = 
  | 'Super Admin' 
  | 'Operator Pemberkasan' 
  | 'Operator SPMB' 
  | 'Operator Survey';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: RoleName;
  isActive: boolean;
  lastLoginAt: string | null;
  avatarUrl?: string;
  password?: string;
}

export interface Permission {
  name: string;
  module: string;
  description: string;
}

export interface DashboardStats {
  totalParticipants: number;
  unassessed: number;
  documentVerificationDone: number;
  fullyAssessed: number;
  passed: number;
  failed: number;
  reserved: number;
}

export interface ParticipantScoreItem {
  rank: number;
  name: string;
  regNumber: string;
  firstChoice: string;
  secondChoice: string;
  utbkScore: number;
  interviewScore: number;
  surveyScore: number;
  finalScore: number;
  status: 'Lulus' | 'Tidak Lulus' | 'Cadangan' | 'Belum Diproses';
}

export interface LaravelFile {
  path: string;
  category: 'config' | 'migration' | 'model' | 'seeder' | 'auth' | 'middleware' | 'view' | 'route' | 'test';
  description: string;
  code: string;
}

// ========================
// PHASE 2: MASTER DATA TYPES
// ========================

export interface AcademicYear {
  id: number;
  code: string; // e.g. "2026/2027"
  semester: 'Ganjil' | 'Genap';
  quota: number; // KIP-K quota for this academic year
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  description?: string;
  participantsCount?: number;
}

export interface Faculty {
  id: number;
  code: string; // e.g. "FH", "FT", "FEB", "FP", "FISIP", "FKIP"
  name: string; // e.g. "Fakultas Hukum"
  dean: string; // e.g. "Dr. Helmi, SH, M.Hum"
  building?: string;
  isActive: boolean;
  studyProgramsCount?: number;
}

export interface StudyProgram {
  id: number;
  code: string; // e.g. "74201"
  name: string; // e.g. "Ilmu Hukum"
  degree: 'S1' | 'D3' | 'S2';
  facultyId: number;
  facultyName?: string;
  quota: number; // KIP-K quota for this prodi
  accreditation: 'Unggul' | 'A' | 'Baik Sekali' | 'B' | 'Baik';
  isActive: boolean;
  title: string; // e.g. "S.H."
}

// ========================
// PHASE 2: DATA PESERTA TYPES
// ========================

export type DesilCategory = 'Non-Desil' | 'Desil 1' | 'Desil 2' | 'Desil 3' | 'Desil 4' | 'Desil 5' | 'Desil 6-10' | 'P3KE' | 'Non Desil' | '' | '-';
export type DesilEkonomi = DesilCategory;

export interface Participant {
  id: number;
  regNumber: string; // KIPK-2026-XXXX
  name: string;
  nisn: string; // 10 digits
  nik: string; // 16 digits
  academicYearId: number;
  academicYearCode?: string;
  firstChoiceProdiId: number;
  firstChoiceProdiName: string;
  secondChoiceProdiId: number;
  secondChoiceProdiName: string;
  schoolOrigin: string; // e.g. "SMAN 1 Kota Bengkulu"
  schoolType?: 'SMA' | 'SMK' | 'MA';
  schoolMajor?: string; // e.g. "MIPA", "IPS", "TKJ"
  graduationYear: number;
  phone: string; // WhatsApp number e.g. "081234567890"
  email: string;
  address: string;
  city: string;
  province: string;
  desil: DesilCategory;
  parentName: string;
  parentIncome: number; // e.g. 1500000
  parentJob: string;
  familyDependents: number;
  documentStatus: 'Belum Diverifikasi' | 'Lengkap' | 'Perlu Perbaikan' | 'Ditolak';
  // Phase 3: Pemberkasan details
  documentReceiver?: string;
  documentReceivedDate?: string;
  documentChecker?: string;
  documentCheckedDate?: string;
  documentNotes?: string;
  documentChecklist?: Record<string, boolean>;

  // Phase 3: Survey details
  surveyScore?: number;
  surveyorName?: string;
  surveyDate?: string;
  surveyNotes?: string;
  houseCondition?: 'Sangat Sederhana' | 'Sederhana' | 'Menengah' | 'Layak';

  // Phase 3: UTBK details
  utbkScore?: number;
  utbkOperator?: string;
  utbkDate?: string;
  utbkNotes?: string;

  // Phase 3: Wawancara details
  interviewScore?: number;
  interviewerName?: string;
  interviewDate?: string;
  interviewNotes?: string;

  // Phase 3: Scoring & Ranking
  affirmationScore?: number;
  finalScore?: number;
  selectionStatus: 'Belum Diproses' | 'Lulus' | 'Cadangan' | 'Tidak Lulus';
  rank?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ========================
// PHASE 3: PROSES SELEKSI TYPES
// ========================

export interface SelectionWeights {
  utbkWeight: number; // default: 35
  interviewWeight: number; // default: 25
  surveyWeight: number; // default: 25
  affirmationWeight: number; // default: 15
}

export interface DocumentRequirement {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
}

export interface SelectionAuditLog {
  id: number;
  participantId?: number;
  participantName?: string;
  action: string;
  module: 'PEMBERKASAN' | 'SURVEY' | 'UTBK' | 'WAWANCARA' | 'KELULUSAN' | 'BOBOT_SELEKSI' | 'OPERATOR' | 'MASTER_DATA' | 'BACKUP' | 'AUTH';
  changedBy: string;
  role?: string;
  oldStatus?: string;
  newStatus?: string;
  details?: string;
  severity?: 'info' | 'success' | 'warning' | 'danger';
  ipAddress?: string;
  timestamp: string;
}

export interface DatabaseBackupItem {
  id: string;
  filename: string;
  sizeBytes: number;
  formattedSize: string;
  type: 'FULL_SQL' | 'JSON_DATA' | 'DOCS_LOGS';
  createdAt: string;
  createdBy: string;
  checksumSha256: string;
  description?: string;
  recordCounts: {
    participants: number;
    studyPrograms: number;
    faculties: number;
    academicYears: number;
    users: number;
    auditLogs: number;
  };
  status: 'COMPLETED' | 'IN_PROGRESS' | 'VERIFIED';
}

export interface ImportPreviewRow {
  rowNumber: number;
  name: string;
  regNumber: string;
  nik: string;
  nisn: string;
  firstChoiceProdiName: string;
  secondChoiceProdiName: string;
  schoolOrigin: string;
  phone: string;
  email: string;
  desil: string;
  status: 'VALID' | 'ERROR' | 'DUPLICATE' | 'EXISTING';
  isExistingInDb?: boolean;
  errors: string[];
  warnings?: string[];
  rawPayload: any;
}

