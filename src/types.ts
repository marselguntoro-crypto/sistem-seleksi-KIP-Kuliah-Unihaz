/**
 * types.ts
 * Arsitektur Tipe TypeScript untuk Sistem Seleksi KIP-Kuliah UNIHAZ
 * Mendukung entitas domain aplikasi (camelCase) dan skema Supabase Database (snake_case)
 */

// ============================================================================
// 1. TYPE UNIONS & ENUMS
// ============================================================================

export type RoleName = 
  | 'Super Admin' 
  | 'Operator Pemberkasan' 
  | 'Operator SPMB' 
  | 'Operator Survey';

export type SemesterType = 'Ganjil' | 'Genap';

export type DegreeLevel = 'S1' | 'D3' | 'S2';

export type AccreditationGrade = 'Unggul' | 'A' | 'Baik Sekali' | 'B' | 'Baik' | 'C' | 'Belum Terakreditasi';

export type SchoolType = 'SMA' | 'SMK' | 'MA';

export type DesilEkonomi = 'Non-Desil' | 'Desil 1' | 'Desil 2' | 'Desil 3' | 'Desil 4' | 'Desil 5' | 'Desil 6-10';
export type DesilCategory = DesilEkonomi;

export interface DocumentRequirement {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
}

export type DocumentStatus = 'Belum Diverifikasi' | 'Lengkap' | 'Perlu Perbaikan' | 'Ditolak';

export type SelectionStatus = 'Belum Diproses' | 'Lulus' | 'Cadangan' | 'Tidak Lulus';

export type HouseCondition = 'Sangat Sederhana' | 'Sederhana' | 'Menengah' | 'Permanen';

export type AuditModule = 
  | 'PEMBERKASAN' 
  | 'SURVEY' 
  | 'UTBK' 
  | 'WAWANCARA' 
  | 'KELULUSAN' 
  | 'BOBOT_SELEKSI' 
  | 'OPERATOR' 
  | 'MASTER_DATA' 
  | 'BACKUP' 
  | 'AUTH';

export type AuditSeverity = 'info' | 'success' | 'warning' | 'danger';

// ============================================================================
// 2. APLIKASI REACT DOMAIN INTERFACES (camelCase)
// ============================================================================

export interface Participant {
  id: number;
  regNumber: string;
  name: string;
  nisn: string;
  nik: string;
  academicYearId: number;
  academicYearCode?: string;
  firstChoiceProdiId: number;
  firstChoiceProdiName: string;
  secondChoiceProdiId: number;
  secondChoiceProdiName: string;
  schoolOrigin: string;
  schoolType?: SchoolType;
  schoolMajor?: string;
  graduationYear: number;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  desil: DesilEkonomi;
  parentName: string;
  parentIncome: number;
  parentJob: string;
  familyDependents: number;
  documentStatus: DocumentStatus;
  documentReceiver?: string;
  documentReceivedDate?: string;
  documentChecker?: string;
  documentNotes?: string;
  documentChecklist?: Record<string, boolean>;
  surveyScore?: number;
  surveyorName?: string;
  surveyDate?: string;
  surveyNotes?: string;
  houseCondition?: HouseCondition;
  utbkScore?: number;
  utbkOperator?: string;
  utbkDate?: string;
  utbkNotes?: string;
  interviewScore?: number;
  interviewerName?: string;
  interviewDate?: string;
  interviewNotes?: string;
  affirmationScore?: number;
  finalScore?: number;
  selectionStatus: SelectionStatus;
  rank?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyProgram {
  id: number;
  code: string;
  name: string;
  degree: DegreeLevel;
  facultyId: number;
  facultyName?: string;
  quota: number;
  accreditation: AccreditationGrade;
  isActive: boolean;
  title: string;
}

export interface Faculty {
  id: number;
  code: string;
  name: string;
  dean: string;
  building?: string;
  isActive: boolean;
  studyProgramsCount?: number;
}

export interface AcademicYear {
  id: number;
  code: string;
  semester: SemesterType;
  quota: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  participantsCount?: number;
}

export interface SelectionWeights {
  utbkWeight: number;
  interviewWeight: number;
  surveyWeight: number;
  affirmationWeight: number;
  minUtbkScore?: number;
  maxParentIncome?: number;
}

export interface SelectionAuditLog {
  id: number;
  participantId?: number;
  participantName?: string;
  action: string;
  module: AuditModule;
  changedBy: string;
  role?: string;
  oldStatus?: string;
  newStatus?: string;
  details?: string;
  severity?: AuditSeverity;
  ipAddress?: string;
  timestamp: string;
}

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
  status: SelectionStatus;
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
  status: 'VALID' | 'ERROR' | 'DUPLICATE';
  errors: string[];
  rawPayload: any;
}

export interface LaravelFile {
  path: string;
  category: 'config' | 'migration' | 'model' | 'seeder' | 'auth' | 'middleware' | 'view' | 'route' | 'test';
  description: string;
  code: string;
}

// ============================================================================
// 3. SUPABASE RELATIONAL DATABASE INTERFACES (snake_case)
// ============================================================================

export interface SupabaseParticipantRow {
  id: number;
  reg_number: string;
  name: string;
  nisn: string;
  nik: string;
  academic_year_id: number;
  academic_year_code?: string | null;
  first_choice_prodi_id: number;
  first_choice_prodi_name: string;
  second_choice_prodi_id: number;
  second_choice_prodi_name: string;
  school_origin: string;
  school_type?: SchoolType | null;
  school_major?: string | null;
  graduation_year: number;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  desil: DesilEkonomi;
  parent_name: string;
  parent_income: number;
  parent_job: string;
  family_dependents: number;
  document_status: DocumentStatus;
  document_receiver?: string | null;
  document_received_date?: string | null;
  document_checker?: string | null;
  document_notes?: string | null;
  document_checklist?: Record<string, boolean> | null;
  survey_score?: number | null;
  surveyor_name?: string | null;
  survey_date?: string | null;
  survey_notes?: string | null;
  house_condition?: HouseCondition | null;
  utbk_score?: number | null;
  utbk_operator?: string | null;
  utbk_date?: string | null;
  utbk_notes?: string | null;
  interview_score?: number | null;
  interviewer_name?: string | null;
  interview_date?: string | null;
  interview_notes?: string | null;
  affirmation_score?: number | null;
  final_score?: number | null;
  selection_status: SelectionStatus;
  rank?: number | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SupabaseStudyProgramRow {
  id: number;
  code: string;
  name: string;
  degree: DegreeLevel;
  faculty_id: number;
  faculty_name?: string | null;
  quota: number;
  accreditation: AccreditationGrade;
  is_active: boolean;
  title: string;
}

export interface SupabaseFacultyRow {
  id: number;
  code: string;
  name: string;
  dean: string;
  building?: string | null;
  is_active: boolean;
  study_programs_count?: number | null;
}

export interface SupabaseAcademicYearRow {
  id: number;
  code: string;
  semester: SemesterType;
  quota: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string | null;
  participants_count?: number | null;
}

export interface SupabaseSelectionWeightsRow {
  id?: number;
  utbk_weight: number;
  interview_weight: number;
  survey_weight: number;
  affirmation_weight: number;
  min_utbk_score?: number | null;
  max_parent_income?: number | null;
}

export interface SupabaseAuditLogRow {
  id: number;
  participant_id?: number | null;
  participant_name?: string | null;
  action: string;
  module: AuditModule;
  changed_by: string;
  role?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  details?: string | null;
  severity?: AuditSeverity | null;
  ip_address?: string | null;
  timestamp: string;
}

// ============================================================================
// 4. SUPABASE DATABASE SCHEMA DEFINITION (Untuk Strongly-Typed Client)
// ============================================================================

export interface SupabaseDatabase {
  public: {
    Tables: {
      participants: {
        Row: SupabaseParticipantRow;
        Insert: Omit<SupabaseParticipantRow, 'id'> & { id?: number };
        Update: Partial<SupabaseParticipantRow>;
      };
      study_programs: {
        Row: SupabaseStudyProgramRow;
        Insert: Omit<SupabaseStudyProgramRow, 'id'> & { id?: number };
        Update: Partial<SupabaseStudyProgramRow>;
      };
      faculties: {
        Row: SupabaseFacultyRow;
        Insert: Omit<SupabaseFacultyRow, 'id'> & { id?: number };
        Update: Partial<SupabaseFacultyRow>;
      };
      academic_years: {
        Row: SupabaseAcademicYearRow;
        Insert: Omit<SupabaseAcademicYearRow, 'id'> & { id?: number };
        Update: Partial<SupabaseAcademicYearRow>;
      };
      selection_weights: {
        Row: SupabaseSelectionWeightsRow;
        Insert: SupabaseSelectionWeightsRow;
        Update: Partial<SupabaseSelectionWeightsRow>;
      };
      audit_logs: {
        Row: SupabaseAuditLogRow;
        Insert: Omit<SupabaseAuditLogRow, 'id'> & { id?: number };
        Update: Partial<SupabaseAuditLogRow>;
      };
    };
  };
}
