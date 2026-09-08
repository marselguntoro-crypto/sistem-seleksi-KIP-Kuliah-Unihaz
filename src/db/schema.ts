import { pgTable, serial, text, varchar, integer, boolean, doublePrecision, jsonb, timestamp } from "drizzle-orm/pg-core";

// 1. Users / Operators Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  password: text("password").notNull(),
  lastLoginAt: varchar("last_login_at", { length: 50 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Academic Years (Tahun Akademik)
export const academicYears = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  semester: varchar("semester", { length: 20 }).notNull(),
  quota: integer("quota").notNull(),
  startDate: varchar("start_date", { length: 20 }).notNull(),
  endDate: varchar("end_date", { length: 20 }).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Faculties (Fakultas)
export const faculties = pgTable("faculties", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  dean: varchar("dean", { length: 255 }).notNull(),
  building: varchar("building", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Study Programs (Program Studi)
export const studyPrograms = pgTable("study_programs", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  degree: varchar("degree", { length: 20 }).notNull(),
  facultyId: integer("faculty_id").notNull(),
  facultyName: varchar("faculty_name", { length: 255 }),
  quota: integer("quota").notNull(),
  accreditation: varchar("accreditation", { length: 50 }).notNull(),
  title: varchar("title", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Participants (Calon Mahasiswa KIP-Kuliah)
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  regNumber: varchar("reg_number", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nisn: varchar("nisn", { length: 20 }).notNull(),
  nik: varchar("nik", { length: 20 }).notNull(),
  academicYearId: integer("academic_year_id").notNull(),
  academicYearCode: varchar("academic_year_code", { length: 50 }),
  firstChoiceProdiId: integer("first_choice_prodi_id").notNull(),
  firstChoiceProdiName: varchar("first_choice_prodi_name", { length: 255 }).notNull(),
  secondChoiceProdiId: integer("second_choice_prodi_id").notNull(),
  secondChoiceProdiName: varchar("second_choice_prodi_name", { length: 255 }).notNull(),
  schoolOrigin: varchar("school_origin", { length: 255 }).notNull(),
  schoolType: varchar("school_type", { length: 20 }),
  schoolMajor: varchar("school_major", { length: 100 }),
  graduationYear: integer("graduation_year").notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  desil: varchar("desil", { length: 50 }).notNull(),
  parentName: varchar("parent_name", { length: 255 }).notNull(),
  parentIncome: doublePrecision("parent_income").notNull(),
  parentJob: varchar("parent_job", { length: 255 }).notNull(),
  familyDependents: integer("family_dependents").notNull(),
  documentStatus: varchar("document_status", { length: 50 }).notNull(),
  
  // Pemberkasan
  documentReceiver: varchar("document_receiver", { length: 255 }),
  documentReceivedDate: varchar("document_received_date", { length: 50 }),
  documentChecker: varchar("document_checker", { length: 255 }),
  documentNotes: text("document_notes"),
  documentChecklist: jsonb("document_checklist"),

  // Survey
  surveyScore: doublePrecision("survey_score"),
  surveyorName: varchar("surveyor_name", { length: 255 }),
  surveyDate: varchar("survey_date", { length: 50 }),
  surveyNotes: text("survey_notes"),
  houseCondition: varchar("house_condition", { length: 50 }),

  // UTBK
  utbkScore: doublePrecision("utbk_score"),
  utbkOperator: varchar("utbk_operator", { length: 255 }),
  utbkDate: varchar("utbk_date", { length: 50 }),
  utbkNotes: text("utbk_notes"),

  // Wawancara
  interviewScore: doublePrecision("interview_score"),
  interviewerName: varchar("interviewer_name", { length: 255 }),
  interviewDate: varchar("interview_date", { length: 50 }),
  interviewNotes: text("interview_notes"),

  // Kelulusan & Nilai Akhir
  affirmationScore: doublePrecision("affirmation_score"),
  finalScore: doublePrecision("final_score"),
  selectionStatus: varchar("selection_status", { length: 50 }).notNull().default("Belum Diproses"),
  rank: integer("rank"),
  notes: text("notes"),
  createdAt: varchar("created_at", { length: 50 }).notNull(),
  updatedAt: varchar("updated_at", { length: 50 }).notNull(),
});

// 6. Selection Weights (Bobot Penilaian)
export const selectionWeights = pgTable("selection_weights", {
  id: serial("id").primaryKey(),
  utbkWeight: doublePrecision("utbk_weight").notNull().default(30),
  interviewWeight: doublePrecision("interview_weight").notNull().default(40),
  surveyWeight: doublePrecision("survey_weight").notNull().default(30),
  affirmationWeight: doublePrecision("affirmation_weight").notNull().default(0),
  minUtbkScore: doublePrecision("min_utbk_score").notNull().default(400),
  maxParentIncome: doublePrecision("max_parent_income").notNull().default(4000000),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Selection Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userRole: varchar("user_role", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  module: varchar("module", { length: 100 }).notNull(),
  details: text("details").notNull(),
  ipAddress: varchar("ip_address", { length: 50 }).notNull(),
  timestamp: varchar("timestamp", { length: 50 }).notNull(),
});

// 8. Database Backups
export const backups = pgTable("backups", {
  id: varchar("id", { length: 100 }).primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  sizeBytes: integer("size_bytes"),
  formattedSize: varchar("formatted_size", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  createdAt: varchar("created_at", { length: 50 }).notNull(),
  createdBy: varchar("created_by", { length: 255 }),
  checksumSha256: text("checksum_sha256"),
  description: text("description"),
  recordCounts: jsonb("record_counts"),
  status: varchar("status", { length: 50 }).notNull(),
});

