/**
 * mappers.ts
 * Helper functions untuk konversi objek Supabase (snake_case) ke tipe domain aplikasi (camelCase)
 * Beroperasi secara aman (type-safe) dengan penanganan nilai null, undefined, dan default values.
 */

import {
  Participant,
  SupabaseParticipantRow,
  StudyProgram,
  SupabaseStudyProgramRow,
  Faculty,
  SupabaseFacultyRow,
  AcademicYear,
  SupabaseAcademicYearRow,
  SelectionWeights,
  SupabaseSelectionWeightsRow,
  SelectionAuditLog,
  SupabaseAuditLogRow,
  SchoolType,
  HouseCondition,
} from './types';

// ============================================================================
// 1. PARTICIPANTS MAPPERS
// ============================================================================

export function toAppParticipant(row: SupabaseParticipantRow): Participant {
  return {
    id: row.id,
    regNumber: row.reg_number,
    name: row.name,
    nisn: row.nisn,
    nik: row.nik,
    academicYearId: row.academic_year_id,
    academicYearCode: row.academic_year_code ?? undefined,
    firstChoiceProdiId: row.first_choice_prodi_id,
    firstChoiceProdiName: row.first_choice_prodi_name,
    secondChoiceProdiId: row.second_choice_prodi_id,
    secondChoiceProdiName: row.second_choice_prodi_name,
    schoolOrigin: row.school_origin,
    schoolType: (row.school_type as SchoolType) ?? undefined,
    schoolMajor: row.school_major ?? undefined,
    graduationYear: row.graduation_year,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    province: row.province,
    desil: row.desil,
    parentName: row.parent_name,
    parentIncome: Number(row.parent_income) || 0,
    parentJob: row.parent_job,
    familyDependents: Number(row.family_dependents) || 0,
    documentStatus: row.document_status,
    documentReceiver: row.document_receiver ?? undefined,
    documentReceivedDate: row.document_received_date ?? undefined,
    documentChecker: row.document_checker ?? undefined,
    documentCheckedDate: row.document_checked_date ?? undefined,
    documentNotes: row.document_notes ?? undefined,
    documentChecklist: row.document_checklist ?? undefined,
    surveyScore: row.survey_score != null ? Number(row.survey_score) : undefined,
    surveyorName: row.surveyor_name ?? undefined,
    surveyDate: row.survey_date ?? undefined,
    surveyNotes: row.survey_notes ?? undefined,
    houseCondition: (row.house_condition as HouseCondition) ?? undefined,
    utbkScore: row.utbk_score != null ? Number(row.utbk_score) : undefined,
    utbkOperator: row.utbk_operator ?? undefined,
    utbkDate: row.utbk_date ?? undefined,
    utbkNotes: row.utbk_notes ?? undefined,
    interviewScore: row.interview_score != null ? Number(row.interview_score) : undefined,
    interviewerName: row.interviewer_name ?? undefined,
    interviewDate: row.interview_date ?? undefined,
    interviewNotes: row.interview_notes ?? undefined,
    affirmationScore: row.affirmation_score != null ? Number(row.affirmation_score) : undefined,
    finalScore: row.final_score != null ? Number(row.final_score) : undefined,
    selectionStatus: row.selection_status,
    rank: row.rank != null ? Number(row.rank) : undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function toSupabaseParticipant(app: Partial<Participant>): Partial<SupabaseParticipantRow> {
  const row: Partial<SupabaseParticipantRow> = {};
  if (app.id !== undefined) row.id = app.id;
  if (app.regNumber !== undefined) row.reg_number = app.regNumber;
  if (app.name !== undefined) row.name = app.name;
  if (app.nisn !== undefined) row.nisn = app.nisn;
  if (app.nik !== undefined) row.nik = app.nik;
  if (app.academicYearId !== undefined) row.academic_year_id = app.academicYearId;
  if (app.academicYearCode !== undefined) row.academic_year_code = app.academicYearCode;
  if (app.firstChoiceProdiId !== undefined) row.first_choice_prodi_id = app.firstChoiceProdiId;
  if (app.firstChoiceProdiName !== undefined) row.first_choice_prodi_name = app.firstChoiceProdiName;
  if (app.secondChoiceProdiId !== undefined) row.second_choice_prodi_id = app.secondChoiceProdiId;
  if (app.secondChoiceProdiName !== undefined) row.second_choice_prodi_name = app.secondChoiceProdiName;
  if (app.schoolOrigin !== undefined) row.school_origin = app.schoolOrigin;
  if (app.schoolType !== undefined) row.school_type = app.schoolType;
  if (app.schoolMajor !== undefined) row.school_major = app.schoolMajor;
  if (app.graduationYear !== undefined) row.graduation_year = app.graduationYear;
  if (app.phone !== undefined) row.phone = app.phone;
  if (app.email !== undefined) row.email = app.email;
  if (app.address !== undefined) row.address = app.address;
  if (app.city !== undefined) row.city = app.city;
  if (app.province !== undefined) row.province = app.province;
  if (app.desil !== undefined) row.desil = app.desil;
  if (app.parentName !== undefined) row.parent_name = app.parentName;
  if (app.parentIncome !== undefined) row.parent_income = app.parentIncome;
  if (app.parentJob !== undefined) row.parent_job = app.parentJob;
  if (app.familyDependents !== undefined) row.family_dependents = app.familyDependents;
  if (app.documentStatus !== undefined) row.document_status = app.documentStatus;
  if (app.documentReceiver !== undefined) row.document_receiver = app.documentReceiver;
  if (app.documentReceivedDate !== undefined) row.document_received_date = app.documentReceivedDate;
  if (app.documentChecker !== undefined) row.document_checker = app.documentChecker;
  if (app.documentCheckedDate !== undefined) row.document_checked_date = app.documentCheckedDate;
  if (app.documentNotes !== undefined) row.document_notes = app.documentNotes;
  if (app.documentChecklist !== undefined) row.document_checklist = app.documentChecklist;
  if (app.surveyScore !== undefined) row.survey_score = app.surveyScore;
  if (app.surveyorName !== undefined) row.surveyor_name = app.surveyorName;
  if (app.surveyDate !== undefined) row.survey_date = app.surveyDate;
  if (app.surveyNotes !== undefined) row.survey_notes = app.surveyNotes;
  if (app.houseCondition !== undefined) row.house_condition = app.houseCondition;
  if (app.utbkScore !== undefined) row.utbk_score = app.utbkScore;
  if (app.utbkOperator !== undefined) row.utbk_operator = app.utbkOperator;
  if (app.utbkDate !== undefined) row.utbk_date = app.utbkDate;
  if (app.utbkNotes !== undefined) row.utbk_notes = app.utbkNotes;
  if (app.interviewScore !== undefined) row.interview_score = app.interviewScore;
  if (app.interviewerName !== undefined) row.interviewer_name = app.interviewerName;
  if (app.interviewDate !== undefined) row.interview_date = app.interviewDate;
  if (app.interviewNotes !== undefined) row.interview_notes = app.interviewNotes;
  if (app.affirmationScore !== undefined) row.affirmation_score = app.affirmationScore;
  if (app.finalScore !== undefined) row.final_score = app.finalScore;
  if (app.selectionStatus !== undefined) row.selection_status = app.selectionStatus;
  if (app.rank !== undefined) row.rank = app.rank;
  if (app.notes !== undefined) row.notes = app.notes;
  return row;
}

// ============================================================================
// 2. STUDY PROGRAMS MAPPERS
// ============================================================================

export function toAppStudyProgram(row: SupabaseStudyProgramRow): StudyProgram {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    degree: row.degree,
    facultyId: row.faculty_id,
    facultyName: row.faculty_name ?? undefined,
    quota: Number(row.quota) || 0,
    accreditation: row.accreditation,
    isActive: Boolean(row.is_active),
    title: row.title,
  };
}

export function toSupabaseStudyProgram(app: Partial<StudyProgram>): Partial<SupabaseStudyProgramRow> {
  const row: Partial<SupabaseStudyProgramRow> = {};
  if (app.id !== undefined) row.id = app.id;
  if (app.code !== undefined) row.code = app.code;
  if (app.name !== undefined) row.name = app.name;
  if (app.degree !== undefined) row.degree = app.degree;
  if (app.facultyId !== undefined) row.faculty_id = app.facultyId;
  if (app.facultyName !== undefined) row.faculty_name = app.facultyName;
  if (app.quota !== undefined) row.quota = app.quota;
  if (app.accreditation !== undefined) row.accreditation = app.accreditation;
  if (app.isActive !== undefined) row.is_active = app.isActive;
  if (app.title !== undefined) row.title = app.title;
  return row;
}

// ============================================================================
// 3. FACULTIES MAPPERS
// ============================================================================

export function toAppFaculty(row: SupabaseFacultyRow): Faculty {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    dean: row.dean,
    building: row.building ?? undefined,
    isActive: Boolean(row.is_active),
    studyProgramsCount: Number(row.study_programs_count) || 0,
  };
}

export function toSupabaseFaculty(app: Partial<Faculty>): Partial<SupabaseFacultyRow> {
  const row: Partial<SupabaseFacultyRow> = {};
  if (app.id !== undefined) row.id = app.id;
  if (app.code !== undefined) row.code = app.code;
  if (app.name !== undefined) row.name = app.name;
  if (app.dean !== undefined) row.dean = app.dean;
  if (app.building !== undefined) row.building = app.building;
  if (app.isActive !== undefined) row.is_active = app.isActive;
  return row;
}

// ============================================================================
// 4. ACADEMIC YEARS MAPPERS
// ============================================================================

export function toAppAcademicYear(row: SupabaseAcademicYearRow): AcademicYear {
  return {
    id: row.id,
    code: row.code,
    semester: row.semester,
    quota: Number(row.quota) || 0,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: Boolean(row.is_active),
    description: row.description ?? undefined,
    participantsCount: Number(row.participants_count) || 0,
  };
}

export function toSupabaseAcademicYear(app: Partial<AcademicYear>): Partial<SupabaseAcademicYearRow> {
  const row: Partial<SupabaseAcademicYearRow> = {};
  if (app.id !== undefined) row.id = app.id;
  if (app.code !== undefined) row.code = app.code;
  if (app.semester !== undefined) row.semester = app.semester;
  if (app.quota !== undefined) row.quota = app.quota;
  if (app.startDate !== undefined) row.start_date = app.startDate;
  if (app.endDate !== undefined) row.end_date = app.endDate;
  if (app.isActive !== undefined) row.is_active = app.isActive;
  if (app.description !== undefined) row.description = app.description;
  return row;
}

// ============================================================================
// 5. SELECTION WEIGHTS MAPPERS
// ============================================================================

export function toAppSelectionWeights(row: SupabaseSelectionWeightsRow): SelectionWeights {
  return {
    utbkWeight: Number(row.utbk_weight) || 0,
    interviewWeight: Number(row.interview_weight) || 0,
    surveyWeight: Number(row.survey_weight) || 0,
    affirmationWeight: Number(row.affirmation_weight) || 0,
    minUtbkScore: row.min_utbk_score != null ? Number(row.min_utbk_score) : undefined,
    maxParentIncome: row.max_parent_income != null ? Number(row.max_parent_income) : undefined,
  };
}

export function toSupabaseSelectionWeights(app: SelectionWeights): SupabaseSelectionWeightsRow {
  return {
    utbk_weight: app.utbkWeight,
    interview_weight: app.interviewWeight,
    survey_weight: app.surveyWeight,
    affirmation_weight: app.affirmationWeight,
    min_utbk_score: app.minUtbkScore,
    max_parent_income: app.maxParentIncome,
  };
}

// ============================================================================
// 6. AUDIT LOGS MAPPERS
// ============================================================================

export function toAppAuditLog(row: SupabaseAuditLogRow): SelectionAuditLog {
  return {
    id: row.id,
    participantId: row.participant_id ?? undefined,
    participantName: row.participant_name ?? undefined,
    action: row.action,
    module: row.module,
    changedBy: row.changed_by,
    role: row.role ?? undefined,
    oldStatus: row.old_status ?? undefined,
    newStatus: row.new_status ?? undefined,
    details: row.details ?? undefined,
    severity: row.severity ?? undefined,
    ipAddress: row.ip_address ?? undefined,
    timestamp: row.timestamp,
  };
}

export function toSupabaseAuditLog(app: Omit<SelectionAuditLog, 'id' | 'timestamp'>): Omit<SupabaseAuditLogRow, 'id' | 'timestamp'> {
  return {
    participant_id: app.participantId ?? null,
    participant_name: app.participantName ?? null,
    action: app.action,
    module: app.module,
    changed_by: app.changedBy,
    role: app.role ?? null,
    old_status: app.oldStatus ?? null,
    new_status: app.newStatus ?? null,
    details: app.details ?? null,
    severity: app.severity ?? null,
    ip_address: app.ipAddress ?? null,
  };
}
