import { createClient } from '@supabase/supabase-js';
import {
  Participant,
  AcademicYear,
  Faculty,
  StudyProgram,
  User,
  SelectionWeights,
  SelectionAuditLog,
  DatabaseBackupItem,
  RoleName
} from '../types';

// ==========================================
// 1. Supabase Client Configuration & Init
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-unihaz-kip.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-unihaz';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// 2. Supabase Database Interfaces (snake_case)
// ==========================================
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
  school_type?: 'SMA' | 'SMK' | 'MA' | null;
  school_major?: string | null;
  graduation_year: number;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  desil: string;
  parent_name: string;
  parent_income: number;
  parent_job: string;
  family_dependents: number;
  document_status: string;
  document_receiver?: string | null;
  document_received_date?: string | null;
  document_checker?: string | null;
  document_notes?: string | null;
  document_checklist?: Record<string, boolean> | null;
  survey_score?: number | null;
  surveyor_name?: string | null;
  survey_date?: string | null;
  survey_notes?: string | null;
  house_condition?: string | null;
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
  selection_status: string;
  rank?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseAcademicYearRow {
  id: number;
  code: string;
  semester: string;
  quota: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string | null;
  participants_count?: number;
}

export interface SupabaseFacultyRow {
  id: number;
  code: string;
  name: string;
  dean: string;
  building?: string | null;
  is_active: boolean;
  study_programs_count?: number;
}

export interface SupabaseStudyProgramRow {
  id: number;
  code: string;
  name: string;
  degree: string;
  faculty_id: number;
  faculty_name?: string | null;
  quota: number;
  accreditation: string;
  is_active: boolean;
  title: string;
}

export interface SupabaseUserRow {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at?: string | null;
  avatar_url?: string | null;
  password?: string | null;
}

export interface SupabaseSelectionWeightsRow {
  id?: number;
  utbk_weight: number;
  interview_weight: number;
  survey_weight: number;
  affirmation_weight: number;
}

export interface SupabaseAuditLogRow {
  id: number;
  participant_id?: number | null;
  participant_name?: string | null;
  action: string;
  module: string;
  changed_by: string;
  role?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  details?: string | null;
  severity?: string | null;
  ip_address?: string | null;
  timestamp: string;
}

// ==========================================
// 3. Bidirectional Mapping Functions
// snake_case (DB) <---> camelCase (TypeScript)
// ==========================================

export function mapSupabaseParticipantToApp(row: SupabaseParticipantRow): Participant {
  return {
    id: row.id,
    regNumber: row.reg_number,
    name: row.name,
    nisn: row.nisn,
    nik: row.nik,
    academicYearId: row.academic_year_id,
    academicYearCode: row.academic_year_code || undefined,
    firstChoiceProdiId: row.first_choice_prodi_id,
    firstChoiceProdiName: row.first_choice_prodi_name,
    secondChoiceProdiId: row.second_choice_prodi_id,
    secondChoiceProdiName: row.second_choice_prodi_name,
    schoolOrigin: row.school_origin,
    schoolType: (row.school_type as 'SMA' | 'SMK' | 'MA') || undefined,
    schoolMajor: row.school_major || undefined,
    graduationYear: row.graduation_year,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    province: row.province,
    desil: row.desil as any,
    parentName: row.parent_name,
    parentIncome: row.parent_income,
    parentJob: row.parent_job,
    familyDependents: row.family_dependents,
    documentStatus: row.document_status as any,
    documentReceiver: row.document_receiver || undefined,
    documentReceivedDate: row.document_received_date || undefined,
    documentChecker: row.document_checker || undefined,
    documentNotes: row.document_notes || undefined,
    documentChecklist: row.document_checklist || undefined,
    surveyScore: row.survey_score ?? undefined,
    surveyorName: row.surveyor_name || undefined,
    surveyDate: row.survey_date || undefined,
    surveyNotes: row.survey_notes || undefined,
    houseCondition: (row.house_condition as any) || undefined,
    utbkScore: row.utbk_score ?? undefined,
    utbkOperator: row.utbk_operator || undefined,
    utbkDate: row.utbk_date || undefined,
    utbkNotes: row.utbk_notes || undefined,
    interviewScore: row.interview_score ?? undefined,
    interviewerName: row.interviewer_name || undefined,
    interviewDate: row.interview_date || undefined,
    interviewNotes: row.interview_notes || undefined,
    affirmationScore: row.affirmation_score ?? undefined,
    finalScore: row.final_score ?? undefined,
    selectionStatus: row.selection_status as any,
    rank: row.rank ?? undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapAppParticipantToSupabase(p: Partial<Participant>): Partial<SupabaseParticipantRow> {
  const row: Partial<SupabaseParticipantRow> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.regNumber !== undefined) row.reg_number = p.regNumber;
  if (p.name !== undefined) row.name = p.name;
  if (p.nisn !== undefined) row.nisn = p.nisn;
  if (p.nik !== undefined) row.nik = p.nik;
  if (p.academicYearId !== undefined) row.academic_year_id = p.academicYearId;
  if (p.academicYearCode !== undefined) row.academic_year_code = p.academicYearCode;
  if (p.firstChoiceProdiId !== undefined) row.first_choice_prodi_id = p.firstChoiceProdiId;
  if (p.firstChoiceProdiName !== undefined) row.first_choice_prodi_name = p.firstChoiceProdiName;
  if (p.secondChoiceProdiId !== undefined) row.second_choice_prodi_id = p.secondChoiceProdiId;
  if (p.secondChoiceProdiName !== undefined) row.second_choice_prodi_name = p.secondChoiceProdiName;
  if (p.schoolOrigin !== undefined) row.school_origin = p.schoolOrigin;
  if (p.schoolType !== undefined) row.school_type = p.schoolType;
  if (p.schoolMajor !== undefined) row.school_major = p.schoolMajor;
  if (p.graduationYear !== undefined) row.graduation_year = p.graduationYear;
  if (p.phone !== undefined) row.phone = p.phone;
  if (p.email !== undefined) row.email = p.email;
  if (p.address !== undefined) row.address = p.address;
  if (p.city !== undefined) row.city = p.city;
  if (p.province !== undefined) row.province = p.province;
  if (p.desil !== undefined) row.desil = p.desil;
  if (p.parentName !== undefined) row.parent_name = p.parentName;
  if (p.parentIncome !== undefined) row.parent_income = p.parentIncome;
  if (p.parentJob !== undefined) row.parent_job = p.parentJob;
  if (p.familyDependents !== undefined) row.family_dependents = p.familyDependents;
  if (p.documentStatus !== undefined) row.document_status = p.documentStatus;
  if (p.documentReceiver !== undefined) row.document_receiver = p.documentReceiver;
  if (p.documentReceivedDate !== undefined) row.document_received_date = p.documentReceivedDate;
  if (p.documentChecker !== undefined) row.document_checker = p.documentChecker;
  if (p.documentNotes !== undefined) row.document_notes = p.documentNotes;
  if (p.documentChecklist !== undefined) row.document_checklist = p.documentChecklist;
  if (p.surveyScore !== undefined) row.survey_score = p.surveyScore;
  if (p.surveyorName !== undefined) row.surveyor_name = p.surveyorName;
  if (p.surveyDate !== undefined) row.survey_date = p.surveyDate;
  if (p.surveyNotes !== undefined) row.survey_notes = p.surveyNotes;
  if (p.houseCondition !== undefined) row.house_condition = p.houseCondition;
  if (p.utbkScore !== undefined) row.utbk_score = p.utbkScore;
  if (p.utbkOperator !== undefined) row.utbk_operator = p.utbkOperator;
  if (p.utbkDate !== undefined) row.utbk_date = p.utbkDate;
  if (p.utbkNotes !== undefined) row.utbk_notes = p.utbkNotes;
  if (p.interviewScore !== undefined) row.interview_score = p.interviewScore;
  if (p.interviewerName !== undefined) row.interviewer_name = p.interviewerName;
  if (p.interviewDate !== undefined) row.interview_date = p.interviewDate;
  if (p.interviewNotes !== undefined) row.interview_notes = p.interviewNotes;
  if (p.affirmationScore !== undefined) row.affirmation_score = p.affirmationScore;
  if (p.finalScore !== undefined) row.final_score = p.finalScore;
  if (p.selectionStatus !== undefined) row.selection_status = p.selectionStatus;
  if (p.rank !== undefined) row.rank = p.rank;
  if (p.notes !== undefined) row.notes = p.notes;
  if (p.createdAt !== undefined) row.created_at = p.createdAt;
  if (p.updatedAt !== undefined) row.updated_at = p.updatedAt;
  return row;
}

export function mapSupabaseAcademicYearToApp(row: SupabaseAcademicYearRow): AcademicYear {
  return {
    id: row.id,
    code: row.code,
    semester: row.semester as 'Ganjil' | 'Genap',
    quota: row.quota,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    description: row.description || undefined,
    participantsCount: row.participants_count || 0
  };
}

export function mapAppAcademicYearToSupabase(y: Partial<AcademicYear>): Partial<SupabaseAcademicYearRow> {
  const row: Partial<SupabaseAcademicYearRow> = {};
  if (y.id !== undefined) row.id = y.id;
  if (y.code !== undefined) row.code = y.code;
  if (y.semester !== undefined) row.semester = y.semester;
  if (y.quota !== undefined) row.quota = y.quota;
  if (y.startDate !== undefined) row.start_date = y.startDate;
  if (y.endDate !== undefined) row.end_date = y.endDate;
  if (y.isActive !== undefined) row.is_active = y.isActive;
  if (y.description !== undefined) row.description = y.description;
  return row;
}

export function mapSupabaseFacultyToApp(row: SupabaseFacultyRow): Faculty {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    dean: row.dean,
    building: row.building || undefined,
    isActive: row.is_active,
    studyProgramsCount: row.study_programs_count || 0
  };
}

export function mapAppFacultyToSupabase(f: Partial<Faculty>): Partial<SupabaseFacultyRow> {
  const row: Partial<SupabaseFacultyRow> = {};
  if (f.id !== undefined) row.id = f.id;
  if (f.code !== undefined) row.code = f.code;
  if (f.name !== undefined) row.name = f.name;
  if (f.dean !== undefined) row.dean = f.dean;
  if (f.building !== undefined) row.building = f.building;
  if (f.isActive !== undefined) row.is_active = f.isActive;
  return row;
}

export function mapSupabaseStudyProgramToApp(row: SupabaseStudyProgramRow): StudyProgram {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    degree: row.degree as 'S1' | 'D3' | 'S2',
    facultyId: row.faculty_id,
    facultyName: row.faculty_name || undefined,
    quota: row.quota,
    accreditation: row.accreditation as any,
    isActive: row.is_active,
    title: row.title
  };
}

export function mapAppStudyProgramToSupabase(p: Partial<StudyProgram>): Partial<SupabaseStudyProgramRow> {
  const row: Partial<SupabaseStudyProgramRow> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.code !== undefined) row.code = p.code;
  if (p.name !== undefined) row.name = p.name;
  if (p.degree !== undefined) row.degree = p.degree;
  if (p.facultyId !== undefined) row.faculty_id = p.facultyId;
  if (p.quota !== undefined) row.quota = p.quota;
  if (p.accreditation !== undefined) row.accreditation = p.accreditation;
  if (p.isActive !== undefined) row.is_active = p.isActive;
  if (p.title !== undefined) row.title = p.title;
  return row;
}

export function mapSupabaseUserToApp(row: SupabaseUserRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role as RoleName,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at || null,
    avatarUrl: row.avatar_url || undefined,
  };
}

export function mapAppUserToSupabase(u: Partial<User>): Partial<SupabaseUserRow> {
  const row: Partial<SupabaseUserRow> = {};
  if (u.id !== undefined) row.id = u.id;
  if (u.name !== undefined) row.name = u.name;
  if (u.username !== undefined) row.username = u.username;
  if (u.email !== undefined) row.email = u.email;
  if (u.role !== undefined) row.role = u.role;
  if (u.isActive !== undefined) row.is_active = u.isActive;
  if (u.lastLoginAt !== undefined) row.last_login_at = u.lastLoginAt;
  return row;
}

export function mapSupabaseWeightsToApp(row: SupabaseSelectionWeightsRow): SelectionWeights {
  return {
    utbkWeight: row.utbk_weight,
    interviewWeight: row.interview_weight,
    surveyWeight: row.survey_weight,
    affirmationWeight: row.affirmation_weight,
  };
}

export function mapAppWeightsToSupabase(w: SelectionWeights): SupabaseSelectionWeightsRow {
  return {
    utbk_weight: w.utbkWeight,
    interview_weight: w.interviewWeight,
    survey_weight: w.surveyWeight,
    affirmation_weight: w.affirmationWeight,
  };
}

// ==========================================
// 4. Complete Supabase CRUD Query Service
// Fetch, Insert, Update, Delete with Try/Catch
// ==========================================
export const supabaseService = {
  // ----------------------------------------
  // PARTICIPANTS CRUD
  // ----------------------------------------
  async getParticipants(): Promise<Participant[]> {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (!data) return [];
      return (data as SupabaseParticipantRow[]).map(mapSupabaseParticipantToApp);
    } catch (err: any) {
      console.error('[Supabase] Error fetching participants:', err.message || err);
      throw err;
    }
  },

  async getParticipantById(id: number): Promise<Participant | null> {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;
      return mapSupabaseParticipantToApp(data as SupabaseParticipantRow);
    } catch (err: any) {
      console.error(`[Supabase] Error fetching participant ${id}:`, err.message || err);
      throw err;
    }
  },

  async insertParticipant(newParticipant: Omit<Participant, 'id'>): Promise<Participant> {
    try {
      const payload = mapAppParticipantToSupabase(newParticipant);
      const { data, error } = await supabase
        .from('participants')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseParticipantToApp(data as SupabaseParticipantRow);
    } catch (err: any) {
      console.error('[Supabase] Error inserting participant:', err.message || err);
      throw err;
    }
  },

  async updateParticipant(participant: Participant): Promise<Participant> {
    try {
      const payload = mapAppParticipantToSupabase(participant);
      const { data, error } = await supabase
        .from('participants')
        .update(payload)
        .eq('id', participant.id)
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseParticipantToApp(data as SupabaseParticipantRow);
    } catch (err: any) {
      console.error(`[Supabase] Error updating participant ${participant.id}:`, err.message || err);
      throw err;
    }
  },

  async batchUpdateParticipants(participants: Participant[]): Promise<Participant[]> {
    try {
      const payloads = participants.map((p) => mapAppParticipantToSupabase(p));
      const { data, error } = await supabase
        .from('participants')
        .upsert(payloads, { onConflict: 'id' })
        .select();

      if (error) throw error;
      return (data as SupabaseParticipantRow[]).map(mapSupabaseParticipantToApp);
    } catch (err: any) {
      console.error('[Supabase] Error batch updating participants:', err.message || err);
      throw err;
    }
  },

  async deleteParticipant(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error(`[Supabase] Error deleting participant ${id}:`, err.message || err);
      throw err;
    }
  },

  // ----------------------------------------
  // ACADEMIC YEARS CRUD
  // ----------------------------------------
  async getAcademicYears(): Promise<AcademicYear[]> {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (!data) return [];
      return (data as SupabaseAcademicYearRow[]).map(mapSupabaseAcademicYearToApp);
    } catch (err: any) {
      console.error('[Supabase] Error fetching academic years:', err.message || err);
      throw err;
    }
  },

  async insertAcademicYear(year: Omit<AcademicYear, 'id'>): Promise<AcademicYear> {
    try {
      const payload = mapAppAcademicYearToSupabase(year);
      const { data, error } = await supabase
        .from('academic_years')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseAcademicYearToApp(data as SupabaseAcademicYearRow);
    } catch (err: any) {
      console.error('[Supabase] Error inserting academic year:', err.message || err);
      throw err;
    }
  },

  async updateAcademicYear(year: AcademicYear): Promise<AcademicYear> {
    try {
      const payload = mapAppAcademicYearToSupabase(year);
      const { data, error } = await supabase
        .from('academic_years')
        .update(payload)
        .eq('id', year.id)
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseAcademicYearToApp(data as SupabaseAcademicYearRow);
    } catch (err: any) {
      console.error(`[Supabase] Error updating academic year ${year.id}:`, err.message || err);
      throw err;
    }
  },

  async deleteAcademicYear(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error(`[Supabase] Error deleting academic year ${id}:`, err.message || err);
      throw err;
    }
  },

  // ----------------------------------------
  // FACULTIES CRUD
  // ----------------------------------------
  async getFaculties(): Promise<Faculty[]> {
    try {
      const { data, error } = await supabase
        .from('faculties')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (!data) return [];
      return (data as SupabaseFacultyRow[]).map(mapSupabaseFacultyToApp);
    } catch (err: any) {
      console.error('[Supabase] Error fetching faculties:', err.message || err);
      throw err;
    }
  },

  async insertFaculty(faculty: Omit<Faculty, 'id'>): Promise<Faculty> {
    try {
      const payload = mapAppFacultyToSupabase(faculty);
      const { data, error } = await supabase
        .from('faculties')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseFacultyToApp(data as SupabaseFacultyRow);
    } catch (err: any) {
      console.error('[Supabase] Error inserting faculty:', err.message || err);
      throw err;
    }
  },

  async updateFaculty(faculty: Faculty): Promise<Faculty> {
    try {
      const payload = mapAppFacultyToSupabase(faculty);
      const { data, error } = await supabase
        .from('faculties')
        .update(payload)
        .eq('id', faculty.id)
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseFacultyToApp(data as SupabaseFacultyRow);
    } catch (err: any) {
      console.error(`[Supabase] Error updating faculty ${faculty.id}:`, err.message || err);
      throw err;
    }
  },

  async deleteFaculty(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('faculties')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error(`[Supabase] Error deleting faculty ${id}:`, err.message || err);
      throw err;
    }
  },

  // ----------------------------------------
  // STUDY PROGRAMS CRUD
  // ----------------------------------------
  async getStudyPrograms(): Promise<StudyProgram[]> {
    try {
      const { data, error } = await supabase
        .from('study_programs')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (!data) return [];
      return (data as SupabaseStudyProgramRow[]).map(mapSupabaseStudyProgramToApp);
    } catch (err: any) {
      console.error('[Supabase] Error fetching study programs:', err.message || err);
      throw err;
    }
  },

  async insertStudyProgram(program: Omit<StudyProgram, 'id'>): Promise<StudyProgram> {
    try {
      const payload = mapAppStudyProgramToSupabase(program);
      const { data, error } = await supabase
        .from('study_programs')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseStudyProgramToApp(data as SupabaseStudyProgramRow);
    } catch (err: any) {
      console.error('[Supabase] Error inserting study program:', err.message || err);
      throw err;
    }
  },

  async updateStudyProgram(program: StudyProgram): Promise<StudyProgram> {
    try {
      const payload = mapAppStudyProgramToSupabase(program);
      const { data, error } = await supabase
        .from('study_programs')
        .update(payload)
        .eq('id', program.id)
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseStudyProgramToApp(data as SupabaseStudyProgramRow);
    } catch (err: any) {
      console.error(`[Supabase] Error updating study program ${program.id}:`, err.message || err);
      throw err;
    }
  },

  async deleteStudyProgram(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('study_programs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error(`[Supabase] Error deleting study program ${id}:`, err.message || err);
      throw err;
    }
  },

  // ----------------------------------------
  // SELECTION WEIGHTS
  // ----------------------------------------
  async getSelectionWeights(): Promise<SelectionWeights> {
    try {
      const { data, error } = await supabase
        .from('selection_weights')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return mapSupabaseWeightsToApp(data as SupabaseSelectionWeightsRow);
    } catch (err: any) {
      console.error('[Supabase] Error fetching selection weights:', err.message || err);
      throw err;
    }
  },

  async updateSelectionWeights(weights: SelectionWeights): Promise<SelectionWeights> {
    try {
      const payload = mapAppWeightsToSupabase(weights);
      const { data, error } = await supabase
        .from('selection_weights')
        .upsert([{ id: 1, ...payload }])
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseWeightsToApp(data as SupabaseSelectionWeightsRow);
    } catch (err: any) {
      console.error('[Supabase] Error updating selection weights:', err.message || err);
      throw err;
    }
  },

  // ----------------------------------------
  // USERS / OPERATORS
  // ----------------------------------------
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (!data) return [];
      return (data as SupabaseUserRow[]).map(mapSupabaseUserToApp);
    } catch (err: any) {
      console.error('[Supabase] Error fetching users:', err.message || err);
      throw err;
    }
  },

  async insertUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const payload = mapAppUserToSupabase(user);
      const { data, error } = await supabase
        .from('users')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseUserToApp(data as SupabaseUserRow);
    } catch (err: any) {
      console.error('[Supabase] Error inserting user:', err.message || err);
      throw err;
    }
  },

  async updateUser(user: User): Promise<User> {
    try {
      const payload = mapAppUserToSupabase(user);
      const { data, error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return mapSupabaseUserToApp(data as SupabaseUserRow);
    } catch (err: any) {
      console.error(`[Supabase] Error updating user ${user.id}:`, err.message || err);
      throw err;
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error(`[Supabase] Error deleting user ${id}:`, err.message || err);
      throw err;
    }
  },
};
