import { db, pool } from './index.ts';
import { 
  users, 
  academicYears, 
  faculties, 
  studyPrograms, 
  participants, 
  selectionWeights, 
  auditLogs, 
  backups 
} from './schema.ts';
import { 
  SEEDED_USERS, 
  INITIAL_ACADEMIC_YEARS, 
  INITIAL_FACULTIES, 
  INITIAL_STUDY_PROGRAMS, 
  INITIAL_PARTICIPANTS 
} from '../data/mockData.ts';
import { INITIAL_AUDIT_LOGS, INITIAL_BACKUPS } from '../data/initialAuditAndBackup.ts';
import { sql } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    const userCountRes = await db.select({ count: sql<number>`count(*)` }).from(users);
    const count = Number(userCountRes[0]?.count || 0);

    if (count > 0) {
      console.log(`[Seed] Database already contains ${count} users. Skipping seed.`);
      return;
    }

    console.log('[Seed] Seeding initial database data into Cloud SQL...');

    // 1. Users
    for (const u of SEEDED_USERS) {
      await db.insert(users).values({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        password: u.password || 'Admin@12345',
        lastLoginAt: u.lastLoginAt,
        avatarUrl: u.avatarUrl,
      }).onConflictDoNothing();
    }

    // 2. Academic Years
    for (const y of INITIAL_ACADEMIC_YEARS) {
      await db.insert(academicYears).values({
        id: y.id,
        code: y.code,
        semester: y.semester,
        quota: y.quota,
        startDate: y.startDate,
        endDate: y.endDate,
        isActive: y.isActive,
        description: y.description || null,
      }).onConflictDoNothing();
    }

    // 3. Faculties
    for (const f of INITIAL_FACULTIES) {
      await db.insert(faculties).values({
        id: f.id,
        code: f.code,
        name: f.name,
        dean: f.dean,
        building: f.building || null,
        isActive: f.isActive,
      }).onConflictDoNothing();
    }

    // 4. Study Programs
    for (const sp of INITIAL_STUDY_PROGRAMS) {
      await db.insert(studyPrograms).values({
        id: sp.id,
        code: sp.code,
        name: sp.name,
        degree: sp.degree,
        facultyId: sp.facultyId,
        facultyName: sp.facultyName || null,
        quota: sp.quota,
        accreditation: sp.accreditation,
        title: sp.title,
        isActive: sp.isActive,
      }).onConflictDoNothing();
    }

    // 5. Participants
    for (const p of INITIAL_PARTICIPANTS) {
      await db.insert(participants).values({
        id: p.id,
        regNumber: p.regNumber,
        name: p.name,
        nisn: p.nisn,
        nik: p.nik,
        academicYearId: p.academicYearId,
        academicYearCode: p.academicYearCode || null,
        firstChoiceProdiId: p.firstChoiceProdiId,
        firstChoiceProdiName: p.firstChoiceProdiName,
        secondChoiceProdiId: p.secondChoiceProdiId,
        secondChoiceProdiName: p.secondChoiceProdiName,
        schoolOrigin: p.schoolOrigin,
        schoolType: p.schoolType || 'SMA',
        schoolMajor: p.schoolMajor || null,
        graduationYear: p.graduationYear,
        phone: p.phone,
        email: p.email,
        address: p.address,
        city: p.city,
        province: p.province,
        desil: p.desil,
        parentName: p.parentName,
        parentIncome: p.parentIncome,
        parentJob: p.parentJob,
        familyDependents: p.familyDependents,
        documentStatus: p.documentStatus,
        documentReceiver: p.documentReceiver || null,
        documentReceivedDate: p.documentReceivedDate || null,
        documentChecker: p.documentChecker || null,
        documentNotes: p.documentNotes || null,
        documentChecklist: p.documentChecklist || null,
        surveyScore: p.surveyScore ?? null,
        surveyorName: p.surveyorName || null,
        surveyDate: p.surveyDate || null,
        surveyNotes: p.surveyNotes || null,
        houseCondition: p.houseCondition || null,
        utbkScore: p.utbkScore ?? null,
        utbkOperator: p.utbkOperator || null,
        utbkDate: p.utbkDate || null,
        utbkNotes: p.utbkNotes || null,
        interviewScore: p.interviewScore ?? null,
        interviewerName: p.interviewerName || null,
        interviewDate: p.interviewDate || null,
        interviewNotes: p.interviewNotes || null,
        affirmationScore: p.affirmationScore ?? null,
        finalScore: p.finalScore ?? null,
        selectionStatus: p.selectionStatus || 'Belum Diproses',
        rank: p.rank ?? null,
        notes: p.notes || null,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      }).onConflictDoNothing();
    }

    // 6. Selection Weights
    await db.insert(selectionWeights).values({
      utbkWeight: 30,
      interviewWeight: 40,
      surveyWeight: 30,
      affirmationWeight: 0,
      minUtbkScore: 400,
      maxParentIncome: 4000000,
    }).onConflictDoNothing();

    // 7. Audit Logs
    for (const log of INITIAL_AUDIT_LOGS) {
      await db.insert(auditLogs).values({
        id: log.id,
        userId: null,
        userName: log.changedBy || 'System',
        userRole: log.role || 'Admin',
        action: log.action,
        module: log.module,
        details: log.details,
        ipAddress: log.ipAddress || '10.14.20.101',
        timestamp: log.timestamp,
      }).onConflictDoNothing();
    }

    // 8. Backups
    for (const b of INITIAL_BACKUPS) {
      await db.insert(backups).values({
        id: b.id,
        filename: b.filename,
        sizeBytes: b.sizeBytes,
        formattedSize: b.formattedSize,
        type: b.type,
        createdAt: b.createdAt,
        createdBy: b.createdBy,
        checksumSha256: b.checksumSha256,
        description: b.description,
        recordCounts: b.recordCounts,
        status: b.status,
      }).onConflictDoNothing();
    }

    // Reset Postgres sequences so new auto-increment IDs do not clash
    await db.execute(sql`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));`);
    await db.execute(sql`SELECT setval('academic_years_id_seq', (SELECT COALESCE(MAX(id), 1) FROM academic_years));`);
    await db.execute(sql`SELECT setval('faculties_id_seq', (SELECT COALESCE(MAX(id), 1) FROM faculties));`);
    await db.execute(sql`SELECT setval('study_programs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM study_programs));`);
    await db.execute(sql`SELECT setval('participants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM participants));`);
    await db.execute(sql`SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM audit_logs));`);
    await db.execute(sql`SELECT setval('backups_id_seq', (SELECT COALESCE(MAX(id), 1) FROM backups));`);

    console.log('[Seed] Database seeding completed successfully!');
  } catch (error) {
    console.error('[Seed] Database seeding error:', error);
  }
}
