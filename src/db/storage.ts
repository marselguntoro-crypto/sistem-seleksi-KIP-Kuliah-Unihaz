import { Db } from 'mongodb';
import { getMongoDb, isMongoConfigured } from './mongodb.ts';
import { db, isDatabaseConfigured } from './index.ts';
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
import { eq, desc, inArray } from 'drizzle-orm';
import { 
  SEEDED_USERS, 
  INITIAL_ACADEMIC_YEARS, 
  INITIAL_FACULTIES, 
  INITIAL_STUDY_PROGRAMS, 
  INITIAL_PARTICIPANTS 
} from '../data/mockData.ts';
import { INITIAL_AUDIT_LOGS, INITIAL_BACKUPS } from '../data/initialAuditAndBackup.ts';
import { DEFAULT_SELECTION_WEIGHTS } from '../utils/selectionUtils.ts';

// In-memory fallback stores
let memUsers = [...SEEDED_USERS];
let memAcademicYears = [...INITIAL_ACADEMIC_YEARS];
let memFaculties = [...INITIAL_FACULTIES];
let memStudyPrograms = [...INITIAL_STUDY_PROGRAMS];
let memParticipants = [...INITIAL_PARTICIPANTS];
let memWeights = { ...DEFAULT_SELECTION_WEIGHTS };
let memAuditLogs = [...INITIAL_AUDIT_LOGS];
let memBackups = [...INITIAL_BACKUPS];

// Helper to remove MongoDB _id
function sanitizeMongoDoc<T>(doc: any): T {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest as T;
}

function sanitizeMongoDocs<T>(docs: any[]): T[] {
  return docs.map(doc => sanitizeMongoDoc<T>(doc));
}

export const Storage = {
  // -------------------------------------------------------------
  // Users
  // -------------------------------------------------------------
  async getUsers() {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const docs = await mongo.collection('users').find({}).sort({ id: 1 }).toArray();
        if (docs.length > 0) return sanitizeMongoDocs(docs);
      } catch (err) {
        console.warn('[MongoDB] getUsers failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        return await db.select().from(users);
      } catch (err) {
        console.warn('[Cloud SQL] getUsers failed:', err);
      }
    }
    return memUsers;
  },

  async createUser(data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const maxDoc = await mongo.collection('users').find({}).sort({ id: -1 }).limit(1).toArray();
        const nextId = maxDoc.length > 0 && typeof maxDoc[0].id === 'number' ? maxDoc[0].id + 1 : 1;
        const record = {
          id: nextId,
          name: data.name || '',
          username: data.username || '',
          email: data.email || '',
          role: data.role || 'Operator',
          isActive: data.isActive ?? true,
          password: data.password || 'Operator@12345',
          avatarUrl: data.avatarUrl || null,
          lastLoginAt: null,
        };
        await mongo.collection('users').insertOne({ ...record });
        return record;
      } catch (err) {
        console.warn('[MongoDB] createUser failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [created] = await db.insert(users).values({
          name: data.name,
          username: data.username,
          email: data.email,
          role: data.role,
          isActive: data.isActive ?? true,
          password: data.password || 'Operator@12345',
          avatarUrl: data.avatarUrl || null,
        }).returning();
        return created;
      } catch (err) {
        console.warn('[Cloud SQL] createUser failed:', err);
      }
    }
    const nextId = memUsers.length > 0 ? Math.max(...memUsers.map(u => u.id)) + 1 : 1;
    const created = {
      id: nextId,
      name: data.name || '',
      username: data.username || '',
      email: data.email || '',
      role: data.role || 'Operator',
      isActive: data.isActive ?? true,
      password: data.password || 'Operator@12345',
      avatarUrl: data.avatarUrl || null,
      lastLoginAt: null,
    };
    memUsers.push(created as any);
    return created;
  },

  async updateUser(id: number, data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const { _id, id: _, ...fields } = data;
        await mongo.collection('users').updateOne({ id }, { $set: fields });
        const updated = await mongo.collection('users').findOne({ id });
        return sanitizeMongoDoc(updated);
      } catch (err) {
        console.warn('[MongoDB] updateUser failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const { name, email, role, isActive, avatarUrl, password } = data;
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (password !== undefined) updateData.password = password;

        const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
        return updated;
      } catch (err) {
        console.warn('[Cloud SQL] updateUser failed:', err);
      }
    }
    const idx = memUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      memUsers[idx] = { ...memUsers[idx], ...data, id };
      return memUsers[idx];
    }
    return { id, ...data };
  },

  async deleteUser(id: number) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        await mongo.collection('users').deleteOne({ id });
        return { success: true, id };
      } catch (err) {
        console.warn('[MongoDB] deleteUser failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        await db.delete(users).where(eq(users.id, id));
        return { success: true, id };
      } catch (err) {
        console.warn('[Cloud SQL] deleteUser failed:', err);
      }
    }
    memUsers = memUsers.filter(u => u.id !== id);
    return { success: true, id };
  },

  // -------------------------------------------------------------
  // Academic Years
  // -------------------------------------------------------------
  async getAcademicYears() {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const docs = await mongo.collection('academic_years').find({}).sort({ id: 1 }).toArray();
        if (docs.length > 0) return sanitizeMongoDocs(docs);
      } catch (err) {
        console.warn('[MongoDB] getAcademicYears failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        return await db.select().from(academicYears);
      } catch (err) {
        console.warn('[Cloud SQL] getAcademicYears failed:', err);
      }
    }
    return memAcademicYears;
  },

  async createAcademicYear(data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const maxDoc = await mongo.collection('academic_years').find({}).sort({ id: -1 }).limit(1).toArray();
        const nextId = maxDoc.length > 0 && typeof maxDoc[0].id === 'number' ? maxDoc[0].id + 1 : 1;
        const record = { id: nextId, ...data };
        await mongo.collection('academic_years').insertOne({ ...record });
        return record;
      } catch (err) {
        console.warn('[MongoDB] createAcademicYear failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [created] = await db.insert(academicYears).values(data).returning();
        return created;
      } catch (err) {
        console.warn('[Cloud SQL] createAcademicYear failed:', err);
      }
    }
    const nextId = memAcademicYears.length > 0 ? Math.max(...memAcademicYears.map(ay => ay.id)) + 1 : 1;
    const created = { id: nextId, ...data };
    memAcademicYears.push(created);
    return created;
  },

  async updateAcademicYear(id: number, data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const { _id, id: _, ...fields } = data;
        await mongo.collection('academic_years').updateOne({ id }, { $set: fields });
        const updated = await mongo.collection('academic_years').findOne({ id });
        return sanitizeMongoDoc(updated);
      } catch (err) {
        console.warn('[MongoDB] updateAcademicYear failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [updated] = await db.update(academicYears).set(data).where(eq(academicYears.id, id)).returning();
        return updated;
      } catch (err) {
        console.warn('[Cloud SQL] updateAcademicYear failed:', err);
      }
    }
    const idx = memAcademicYears.findIndex(ay => ay.id === id);
    if (idx !== -1) {
      memAcademicYears[idx] = { ...memAcademicYears[idx], ...data, id };
      return memAcademicYears[idx];
    }
    return { id, ...data };
  },

  async deleteAcademicYear(id: number) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        await mongo.collection('academic_years').deleteOne({ id });
        return { success: true, id };
      } catch (err) {
        console.warn('[MongoDB] deleteAcademicYear failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        await db.delete(academicYears).where(eq(academicYears.id, id));
        return { success: true, id };
      } catch (err) {
        console.warn('[Cloud SQL] deleteAcademicYear failed:', err);
      }
    }
    memAcademicYears = memAcademicYears.filter(ay => ay.id !== id);
    return { success: true, id };
  },

  // -------------------------------------------------------------
  // Faculties
  // -------------------------------------------------------------
  async getFaculties() {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const docs = await mongo.collection('faculties').find({}).sort({ id: 1 }).toArray();
        if (docs.length > 0) return sanitizeMongoDocs(docs);
      } catch (err) {
        console.warn('[MongoDB] getFaculties failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        return await db.select().from(faculties);
      } catch (err) {
        console.warn('[Cloud SQL] getFaculties failed:', err);
      }
    }
    return memFaculties;
  },

  async createFaculty(data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const maxDoc = await mongo.collection('faculties').find({}).sort({ id: -1 }).limit(1).toArray();
        const nextId = maxDoc.length > 0 && typeof maxDoc[0].id === 'number' ? maxDoc[0].id + 1 : 1;
        const record = { id: nextId, ...data };
        await mongo.collection('faculties').insertOne({ ...record });
        return record;
      } catch (err) {
        console.warn('[MongoDB] createFaculty failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [created] = await db.insert(faculties).values(data).returning();
        return created;
      } catch (err) {
        console.warn('[Cloud SQL] createFaculty failed:', err);
      }
    }
    const nextId = memFaculties.length > 0 ? Math.max(...memFaculties.map(f => f.id)) + 1 : 1;
    const created = { id: nextId, ...data };
    memFaculties.push(created);
    return created;
  },

  async updateFaculty(id: number, data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const { _id, id: _, ...fields } = data;
        await mongo.collection('faculties').updateOne({ id }, { $set: fields });
        const updated = await mongo.collection('faculties').findOne({ id });
        return sanitizeMongoDoc(updated);
      } catch (err) {
        console.warn('[MongoDB] updateFaculty failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [updated] = await db.update(faculties).set(data).where(eq(faculties.id, id)).returning();
        return updated;
      } catch (err) {
        console.warn('[Cloud SQL] updateFaculty failed:', err);
      }
    }
    const idx = memFaculties.findIndex(f => f.id === id);
    if (idx !== -1) {
      memFaculties[idx] = { ...memFaculties[idx], ...data, id };
      return memFaculties[idx];
    }
    return { id, ...data };
  },

  async deleteFaculty(id: number) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        await mongo.collection('faculties').deleteOne({ id });
        return { success: true, id };
      } catch (err) {
        console.warn('[MongoDB] deleteFaculty failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        await db.delete(faculties).where(eq(faculties.id, id));
        return { success: true, id };
      } catch (err) {
        console.warn('[Cloud SQL] deleteFaculty failed:', err);
      }
    }
    memFaculties = memFaculties.filter(f => f.id !== id);
    return { success: true, id };
  },

  // -------------------------------------------------------------
  // Study Programs
  // -------------------------------------------------------------
  async getStudyPrograms() {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const docs = await mongo.collection('study_programs').find({}).sort({ id: 1 }).toArray();
        if (docs.length > 0) return sanitizeMongoDocs(docs);
      } catch (err) {
        console.warn('[MongoDB] getStudyPrograms failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        return await db.select().from(studyPrograms);
      } catch (err) {
        console.warn('[Cloud SQL] getStudyPrograms failed:', err);
      }
    }
    return memStudyPrograms;
  },

  async createStudyProgram(data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const maxDoc = await mongo.collection('study_programs').find({}).sort({ id: -1 }).limit(1).toArray();
        const nextId = maxDoc.length > 0 && typeof maxDoc[0].id === 'number' ? maxDoc[0].id + 1 : 1;
        const record = { id: nextId, ...data };
        await mongo.collection('study_programs').insertOne({ ...record });
        return record;
      } catch (err) {
        console.warn('[MongoDB] createStudyProgram failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [created] = await db.insert(studyPrograms).values(data).returning();
        return created;
      } catch (err) {
        console.warn('[Cloud SQL] createStudyProgram failed:', err);
      }
    }
    const nextId = memStudyPrograms.length > 0 ? Math.max(...memStudyPrograms.map(sp => sp.id)) + 1 : 1;
    const created = { id: nextId, ...data };
    memStudyPrograms.push(created);
    return created;
  },

  async updateStudyProgram(id: number, data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const { _id, id: _, ...fields } = data;
        await mongo.collection('study_programs').updateOne({ id }, { $set: fields });
        const updated = await mongo.collection('study_programs').findOne({ id });
        return sanitizeMongoDoc(updated);
      } catch (err) {
        console.warn('[MongoDB] updateStudyProgram failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [updated] = await db.update(studyPrograms).set(data).where(eq(studyPrograms.id, id)).returning();
        return updated;
      } catch (err) {
        console.warn('[Cloud SQL] updateStudyProgram failed:', err);
      }
    }
    const idx = memStudyPrograms.findIndex(sp => sp.id === id);
    if (idx !== -1) {
      memStudyPrograms[idx] = { ...memStudyPrograms[idx], ...data, id };
      return memStudyPrograms[idx];
    }
    return { id, ...data };
  },

  async deleteStudyProgram(id: number) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        await mongo.collection('study_programs').deleteOne({ id });
        return { success: true, id };
      } catch (err) {
        console.warn('[MongoDB] deleteStudyProgram failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        await db.delete(studyPrograms).where(eq(studyPrograms.id, id));
        return { success: true, id };
      } catch (err) {
        console.warn('[Cloud SQL] deleteStudyProgram failed:', err);
      }
    }
    memStudyPrograms = memStudyPrograms.filter(sp => sp.id !== id);
    return { success: true, id };
  },

  // -------------------------------------------------------------
  // Participants
  // -------------------------------------------------------------
  async getParticipants() {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const docs = await mongo.collection('participants').find({}).sort({ id: 1 }).toArray();
        if (docs.length > 0) return sanitizeMongoDocs(docs);
      } catch (err) {
        console.warn('[MongoDB] getParticipants failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        return await db.select().from(participants).orderBy(participants.id);
      } catch (err) {
        console.warn('[Cloud SQL] getParticipants failed:', err);
      }
    }
    return memParticipants;
  },

  async createParticipant(data: any) {
    const payload = {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    delete payload.id;

    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const maxDoc = await mongo.collection('participants').find({}).sort({ id: -1 }).limit(1).toArray();
        const nextId = maxDoc.length > 0 && typeof maxDoc[0].id === 'number' ? maxDoc[0].id + 1 : 1;
        const record = { id: nextId, ...payload };
        await mongo.collection('participants').insertOne({ ...record });
        return record;
      } catch (err) {
        console.warn('[MongoDB] createParticipant failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [created] = await db.insert(participants).values(payload).returning();
        return created;
      } catch (err) {
        console.warn('[Cloud SQL] createParticipant failed:', err);
      }
    }
    const nextId = memParticipants.length > 0 ? Math.max(...memParticipants.map(p => p.id)) + 1 : 1;
    const created = { id: nextId, ...payload };
    memParticipants.push(created);
    return created;
  },

  async updateParticipant(id: number, data: any) {
    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    delete payload.id;
    delete payload._id;

    const mongo = await getMongoDb();
    if (mongo) {
      try {
        await mongo.collection('participants').updateOne({ id }, { $set: payload });
        const updated = await mongo.collection('participants').findOne({ id });
        return sanitizeMongoDoc(updated);
      } catch (err) {
        console.warn('[MongoDB] updateParticipant failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [updated] = await db.update(participants).set(payload).where(eq(participants.id, id)).returning();
        return updated;
      } catch (err) {
        console.warn('[Cloud SQL] updateParticipant failed:', err);
      }
    }
    const idx = memParticipants.findIndex(p => p.id === id);
    if (idx !== -1) {
      memParticipants[idx] = { ...memParticipants[idx], ...payload, id };
      return memParticipants[idx];
    }
    return { id, ...payload };
  },

  async batchUpdateParticipants(batchList: any[]) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const updatedList = [];
        for (const p of batchList) {
          const { _id, id, ...rest } = p;
          const payload = { ...rest, updatedAt: new Date().toISOString() };
          await mongo.collection('participants').updateOne({ id: p.id }, { $set: payload });
          const updated = await mongo.collection('participants').findOne({ id: p.id });
          if (updated) updatedList.push(sanitizeMongoDoc(updated));
        }
        return updatedList;
      } catch (err) {
        console.warn('[MongoDB] batchUpdateParticipants failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const updatedList = [];
        for (const p of batchList) {
          const payload = { ...p, updatedAt: new Date().toISOString() };
          delete payload.id;
          const [u] = await db.update(participants).set(payload).where(eq(participants.id, p.id)).returning();
          if (u) updatedList.push(u);
        }
        return updatedList;
      } catch (err) {
        console.warn('[Cloud SQL] batchUpdateParticipants failed:', err);
      }
    }
    const updatedList = [];
    for (const p of batchList) {
      const idx = memParticipants.findIndex(item => item.id === p.id);
      const updated = { ...p, updatedAt: new Date().toISOString() };
      if (idx !== -1) {
        memParticipants[idx] = { ...memParticipants[idx], ...updated };
        updatedList.push(memParticipants[idx]);
      } else {
        updatedList.push(updated);
      }
    }
    return updatedList;
  },

  async deleteParticipant(id: number) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        await mongo.collection('participants').deleteOne({ id });
        return { success: true, id };
      } catch (err) {
        console.warn('[MongoDB] deleteParticipant failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        await db.delete(participants).where(eq(participants.id, id));
        return { success: true, id };
      } catch (err) {
        console.warn('[Cloud SQL] deleteParticipant failed:', err);
      }
    }
    memParticipants = memParticipants.filter(p => p.id !== id);
    return { success: true, id };
  },

  async batchDeleteParticipants(ids: number[]) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        await mongo.collection('participants').deleteMany({ id: { $in: ids } });
        return { success: true, count: ids.length };
      } catch (err) {
        console.warn('[MongoDB] batchDeleteParticipants failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        await db.delete(participants).where(inArray(participants.id, ids));
        return { success: true, count: ids.length };
      } catch (err) {
        console.warn('[Cloud SQL] batchDeleteParticipants failed:', err);
      }
    }
    const idSet = new Set(ids);
    memParticipants = memParticipants.filter(p => !idSet.has(p.id));
    return { success: true, count: ids.length };
  },

  // -------------------------------------------------------------
  // Selection Weights
  // -------------------------------------------------------------
  async getWeights() {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const doc = await mongo.collection('selection_weights').findOne({});
        if (doc) return sanitizeMongoDoc(doc);
      } catch (err) {
        console.warn('[MongoDB] getWeights failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const rows = await db.select().from(selectionWeights).limit(1);
        if (rows.length > 0) return rows[0];
      } catch (err) {
        console.warn('[Cloud SQL] getWeights failed:', err);
      }
    }
    return memWeights;
  },

  async updateWeights(data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const { _id, ...fields } = data;
        await mongo.collection('selection_weights').updateOne({}, { $set: fields }, { upsert: true });
        const updated = await mongo.collection('selection_weights').findOne({});
        return sanitizeMongoDoc(updated);
      } catch (err) {
        console.warn('[MongoDB] updateWeights failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const existing = await db.select().from(selectionWeights).limit(1);
        let result;
        if (existing.length > 0) {
          [result] = await db.update(selectionWeights).set({
            ...data,
            updatedAt: new Date(),
          }).where(eq(selectionWeights.id, existing[0].id)).returning();
        } else {
          [result] = await db.insert(selectionWeights).values(data).returning();
        }
        return result;
      } catch (err) {
        console.warn('[Cloud SQL] updateWeights failed:', err);
      }
    }
    memWeights = { ...memWeights, ...data };
    return memWeights;
  },

  // -------------------------------------------------------------
  // Audit Logs
  // -------------------------------------------------------------
  async getAuditLogs() {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const docs = await mongo.collection('audit_logs').find({}).sort({ id: -1 }).limit(100).toArray();
        if (docs.length > 0) return sanitizeMongoDocs(docs);
      } catch (err) {
        console.warn('[MongoDB] getAuditLogs failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        return await db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(100);
      } catch (err) {
        console.warn('[Cloud SQL] getAuditLogs failed:', err);
      }
    }
    return memAuditLogs.slice(0, 100);
  },

  async createAuditLog(data: any) {
    const entry = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const maxDoc = await mongo.collection('audit_logs').find({}).sort({ id: -1 }).limit(1).toArray();
        const nextId = maxDoc.length > 0 && typeof maxDoc[0].id === 'number' ? maxDoc[0].id + 1 : 1;
        const record = { id: nextId, ...entry };
        await mongo.collection('audit_logs').insertOne({ ...record });
        return record;
      } catch (err) {
        console.warn('[MongoDB] createAuditLog failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [created] = await db.insert(auditLogs).values(entry).returning();
        return created;
      } catch (err) {
        console.warn('[Cloud SQL] createAuditLog failed:', err);
      }
    }
    const nextId = memAuditLogs.length > 0 ? Math.max(...memAuditLogs.map(a => a.id)) + 1 : 1;
    const created = { id: nextId, ...entry };
    memAuditLogs.unshift(created);
    return created;
  },

  // -------------------------------------------------------------
  // Backups
  // -------------------------------------------------------------
  async getBackups() {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const docs = await mongo.collection('backups').find({}).sort({ createdAt: -1 }).toArray();
        if (docs.length > 0) return sanitizeMongoDocs(docs);
      } catch (err) {
        console.warn('[MongoDB] getBackups failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        return await db.select().from(backups).orderBy(desc(backups.createdAt));
      } catch (err) {
        console.warn('[Cloud SQL] getBackups failed:', err);
      }
    }
    return memBackups;
  },

  async createBackup(data: any) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        const record = { ...data };
        await mongo.collection('backups').insertOne({ ...record });
        return record;
      } catch (err) {
        console.warn('[MongoDB] createBackup failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        const [created] = await db.insert(backups).values(data).returning();
        return created;
      } catch (err) {
        console.warn('[Cloud SQL] createBackup failed:', err);
      }
    }
    const created = { ...data };
    memBackups.unshift(created);
    return created;
  },

  async deleteBackup(id: string) {
    const mongo = await getMongoDb();
    if (mongo) {
      try {
        await mongo.collection('backups').deleteOne({ id });
        return { success: true, id };
      } catch (err) {
        console.warn('[MongoDB] deleteBackup failed:', err);
      }
    }
    if (isDatabaseConfigured) {
      try {
        await db.delete(backups).where(eq(backups.id, id));
        return { success: true, id };
      } catch (err) {
        console.warn('[Cloud SQL] deleteBackup failed:', err);
      }
    }
    memBackups = memBackups.filter(b => b.id !== id);
    return { success: true, id };
  }
};
