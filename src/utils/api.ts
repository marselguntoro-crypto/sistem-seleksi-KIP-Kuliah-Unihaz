import { 
  User, 
  AcademicYear, 
  Faculty, 
  StudyProgram, 
  Participant, 
  SelectionWeights, 
  SelectionAuditLog, 
  DatabaseBackupItem 
} from '../types';
import {
  fsGetParticipants,
  fsCreateParticipant,
  fsUpdateParticipant,
  fsBatchUpdateParticipants,
  fsDeleteParticipant,
  fsGetAcademicYears,
  fsCreateAcademicYear,
  fsUpdateAcademicYear,
  fsDeleteAcademicYear,
  fsGetFaculties,
  fsCreateFaculty,
  fsUpdateFaculty,
  fsDeleteFaculty,
  fsGetStudyPrograms,
  fsCreateStudyProgram,
  fsUpdateStudyProgram,
  fsDeleteStudyProgram,
  fsGetWeights,
  fsUpdateWeights,
  fsGetAuditLogs,
  fsCreateAuditLog,
  fsGetUsers,
  fsCreateUser,
  fsUpdateUser,
  fsDeleteUser,
  fsGetBackups,
  fsCreateBackup,
  fsDeleteBackup,
  seedFirestoreIfEmpty,
  fsBatchDeleteParticipants,
  clearAllDummyParticipants
} from '../services/firestoreSync';
import { supabaseService, isSupabaseConfigured } from '../services/supabaseClient';

// Flag to check if we can reach the local Express server
let serverReachable: boolean | null = null;

async function isServerAvailable(): Promise<boolean> {
  if (serverReachable !== null) return serverReachable;
  try {
    const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
    serverReachable = res.ok;
  } catch {
    serverReachable = false;
  }
  return serverReachable;
}

export const api = {
  // Ensure Cloud Firestore is seeded on start
  async init() {
    await seedFirestoreIfEmpty();
  },

  // Users
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured) {
      try {
        const spUsers = await supabaseService.getUsers();
        if (spUsers && spUsers.length > 0) return spUsers;
      } catch (err) {
        console.warn('[Supabase] getUsers error:', err);
      }
    }
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/users');
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Local API failed, falling back to Firestore for users:', err);
      }
    }
    return fsGetUsers();
  },
  async createUser(data: Omit<User, 'id'>): Promise<User> {
    let createdItem: User | null = null;
    if (isSupabaseConfigured) {
      try {
        createdItem = await supabaseService.insertUser(data);
      } catch (err) {
        console.warn('[Supabase] createUser error:', err);
      }
    }
    const fsPromise = fsCreateUser(createdItem || data);
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createdItem || data),
        });
        if (res.ok) {
          const resData = await res.json();
          fsCreateUser(resData).catch(() => {});
          return resData;
        }
      } catch {}
    }
    if (createdItem) return createdItem;
    return fsPromise;
  },
  async updateUser(user: User): Promise<User> {
    if (isSupabaseConfigured) {
      supabaseService.updateUser(user).catch(err => console.warn('[Supabase] updateUser error:', err));
    }
    const fsPromise = fsUpdateUser(user);
    if (await isServerAvailable()) {
      try {
        fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        }).catch(() => {});
      } catch {}
    }
    return fsPromise;
  },
  async deleteUser(id: number): Promise<void> {
    if (isSupabaseConfigured) {
      supabaseService.deleteUser(id).catch(err => console.warn('[Supabase] deleteUser error:', err));
    }
    await fsDeleteUser(id);
    if (await isServerAvailable()) {
      fetch(`/api/users/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // Academic Years
  async getAcademicYears(): Promise<AcademicYear[]> {
    if (isSupabaseConfigured) {
      try {
        const spYears = await supabaseService.getAcademicYears();
        if (spYears && spYears.length > 0) return spYears;
      } catch (err) {
        console.warn('[Supabase] getAcademicYears error:', err);
      }
    }
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/academic-years');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetAcademicYears();
  },
  async createAcademicYear(data: Omit<AcademicYear, 'id'>): Promise<AcademicYear> {
    let createdItem: AcademicYear | null = null;
    if (isSupabaseConfigured) {
      try {
        createdItem = await supabaseService.insertAcademicYear(data);
      } catch (err) {
        console.warn('[Supabase] createAcademicYear error:', err);
      }
    }
    const fsPromise = fsCreateAcademicYear(createdItem || data);
    if (await isServerAvailable()) {
      fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdItem || data),
      }).catch(() => {});
    }
    if (createdItem) return createdItem;
    return fsPromise;
  },
  async updateAcademicYear(data: AcademicYear): Promise<AcademicYear> {
    if (isSupabaseConfigured) {
      supabaseService.updateAcademicYear(data).catch(err => console.warn('[Supabase] updateAcademicYear error:', err));
    }
    const fsPromise = fsUpdateAcademicYear(data);
    if (await isServerAvailable()) {
      fetch(`/api/academic-years/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async deleteAcademicYear(id: number): Promise<void> {
    if (isSupabaseConfigured) {
      supabaseService.deleteAcademicYear(id).catch(err => console.warn('[Supabase] deleteAcademicYear error:', err));
    }
    await fsDeleteAcademicYear(id);
    if (await isServerAvailable()) {
      fetch(`/api/academic-years/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // Faculties
  async getFaculties(): Promise<Faculty[]> {
    if (isSupabaseConfigured) {
      try {
        const spFaculties = await supabaseService.getFaculties();
        if (spFaculties && spFaculties.length > 0) return spFaculties;
      } catch (err) {
        console.warn('[Supabase] getFaculties error:', err);
      }
    }
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/faculties');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetFaculties();
  },
  async createFaculty(data: Omit<Faculty, 'id'>): Promise<Faculty> {
    let createdItem: Faculty | null = null;
    if (isSupabaseConfigured) {
      try {
        createdItem = await supabaseService.insertFaculty(data);
      } catch (err) {
        console.warn('[Supabase] createFaculty error:', err);
      }
    }
    const fsPromise = fsCreateFaculty(createdItem || data);
    if (await isServerAvailable()) {
      fetch('/api/faculties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdItem || data),
      }).catch(() => {});
    }
    if (createdItem) return createdItem;
    return fsPromise;
  },
  async updateFaculty(data: Faculty): Promise<Faculty> {
    if (isSupabaseConfigured) {
      supabaseService.updateFaculty(data).catch(err => console.warn('[Supabase] updateFaculty error:', err));
    }
    const fsPromise = fsUpdateFaculty(data);
    if (await isServerAvailable()) {
      fetch(`/api/faculties/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async deleteFaculty(id: number): Promise<void> {
    if (isSupabaseConfigured) {
      supabaseService.deleteFaculty(id).catch(err => console.warn('[Supabase] deleteFaculty error:', err));
    }
    await fsDeleteFaculty(id);
    if (await isServerAvailable()) {
      fetch(`/api/faculties/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // Study Programs
  async getStudyPrograms(): Promise<StudyProgram[]> {
    if (isSupabaseConfigured) {
      try {
        const spPrograms = await supabaseService.getStudyPrograms();
        if (spPrograms && spPrograms.length > 0) return spPrograms;
      } catch (err) {
        console.warn('[Supabase] getStudyPrograms error:', err);
      }
    }
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/study-programs');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetStudyPrograms();
  },
  async createStudyProgram(data: Omit<StudyProgram, 'id'>): Promise<StudyProgram> {
    let createdItem: StudyProgram | null = null;
    if (isSupabaseConfigured) {
      try {
        createdItem = await supabaseService.insertStudyProgram(data);
      } catch (err) {
        console.warn('[Supabase] createStudyProgram error:', err);
      }
    }
    const fsPromise = fsCreateStudyProgram(createdItem || data);
    if (await isServerAvailable()) {
      fetch('/api/study-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdItem || data),
      }).catch(() => {});
    }
    if (createdItem) return createdItem;
    return fsPromise;
  },
  async updateStudyProgram(data: StudyProgram): Promise<StudyProgram> {
    if (isSupabaseConfigured) {
      supabaseService.updateStudyProgram(data).catch(err => console.warn('[Supabase] updateStudyProgram error:', err));
    }
    const fsPromise = fsUpdateStudyProgram(data);
    if (await isServerAvailable()) {
      fetch(`/api/study-programs/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async deleteStudyProgram(id: number): Promise<void> {
    if (isSupabaseConfigured) {
      supabaseService.deleteStudyProgram(id).catch(err => console.warn('[Supabase] deleteStudyProgram error:', err));
    }
    await fsDeleteStudyProgram(id);
    if (await isServerAvailable()) {
      fetch(`/api/study-programs/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // Participants
  async getParticipants(): Promise<Participant[]> {
    if (isSupabaseConfigured) {
      try {
        const spList = await supabaseService.getParticipants();
        if (spList && spList.length > 0) return spList;
      } catch (err) {
        console.warn('[Supabase] getParticipants error:', err);
      }
    }
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/participants');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetParticipants();
  },
  async createParticipant(data: Omit<Participant, 'id'>): Promise<Participant> {
    let createdItem: Participant | null = null;
    if (isSupabaseConfigured) {
      try {
        createdItem = await supabaseService.insertParticipant(data);
        console.log('[Supabase] Berhasil menyimpan peserta baru ke tabel participants:', createdItem);
      } catch (err) {
        console.warn('[Supabase] Gagal menyimpan peserta ke Supabase:', err);
      }
    }
    const fsPromise = fsCreateParticipant(createdItem || data);
    if (await isServerAvailable()) {
      fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdItem || data),
      }).catch(() => {});
    }
    if (createdItem) return createdItem;
    return fsPromise;
  },
  async updateParticipant(data: Participant): Promise<Participant> {
    if (isSupabaseConfigured) {
      supabaseService.updateParticipant(data).catch((err) => console.warn('[Supabase] updateParticipant error:', err));
    }
    const fsPromise = fsUpdateParticipant(data);
    if (await isServerAvailable()) {
      fetch(`/api/participants/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async batchUpdateParticipants(participants: Participant[]): Promise<Participant[]> {
    if (isSupabaseConfigured) {
      supabaseService.batchUpdateParticipants(participants).catch((err) => console.warn('[Supabase] batchUpdate error:', err));
    }
    const fsPromise = fsBatchUpdateParticipants(participants);
    if (await isServerAvailable()) {
      fetch('/api/participants/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants }),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async deleteParticipant(id: number): Promise<void> {
    if (isSupabaseConfigured) {
      supabaseService.deleteParticipant(id).catch((err) => console.warn('[Supabase] deleteParticipant error:', err));
    }
    await fsDeleteParticipant(id);
    if (await isServerAvailable()) {
      fetch(`/api/participants/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },
  async batchDeleteParticipants(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    if (isSupabaseConfigured) {
      supabaseService.batchDeleteParticipants(ids).catch((err) => console.warn('[Supabase] batchDelete error:', err));
    }
    try {
      await fsBatchDeleteParticipants(ids);
    } catch (e) {
      console.warn('Firestore batch delete error:', e);
    }
    if (await isServerAvailable()) {
      try {
        await fetch('/api/participants/batch-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
      } catch (err) {
        console.warn('Backend batch delete error:', err);
      }
    }
  },
  async purgeDummyParticipants(): Promise<number> {
    return clearAllDummyParticipants();
  },

  // Selection Weights
  async getWeights(): Promise<SelectionWeights> {
    if (isSupabaseConfigured) {
      try {
        const spWeights = await supabaseService.getSelectionWeights();
        if (spWeights) return spWeights;
      } catch (err) {
        console.warn('[Supabase] getSelectionWeights error:', err);
      }
    }
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/selection-weights');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetWeights();
  },
  async updateWeights(data: SelectionWeights): Promise<SelectionWeights> {
    if (isSupabaseConfigured) {
      supabaseService.updateSelectionWeights(data).catch((err) => console.warn('[Supabase] updateWeights error:', err));
    }
    const fsPromise = fsUpdateWeights(data);
    if (await isServerAvailable()) {
      fetch('/api/selection-weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },

  // Audit Logs
  async getAuditLogs(): Promise<SelectionAuditLog[]> {
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/audit-logs');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetAuditLogs();
  },
  async createAuditLog(log: Omit<SelectionAuditLog, 'id' | 'timestamp'>): Promise<SelectionAuditLog> {
    const fsPromise = fsCreateAuditLog(log);
    if (await isServerAvailable()) {
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      }).catch(() => {});
    }
    return fsPromise;
  },

  // Backups
  async getBackups(): Promise<DatabaseBackupItem[]> {
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/backups');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetBackups();
  },
  async createBackup(data: DatabaseBackupItem): Promise<DatabaseBackupItem> {
    const fsPromise = fsCreateBackup(data);
    if (await isServerAvailable()) {
      fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async deleteBackup(id: string): Promise<void> {
    await fsDeleteBackup(id);
    if (await isServerAvailable()) {
      fetch(`/api/backups/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // Health & Database Status
  async getHealth(): Promise<{ status: string; database: string; mongodb?: any; isConfigured: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return await res.json();
    } catch {}
    return { status: 'ok', database: 'Cloud Firestore (Online)', isConfigured: true };
  },

  // Sync all entities to Supabase
  async syncAllToSupabase(payload: {
    participants?: Participant[];
    academicYears?: AcademicYear[];
    faculties?: Faculty[];
    studyPrograms?: StudyProgram[];
    users?: User[];
    weights?: SelectionWeights;
  }) {
    return supabaseService.syncAllToSupabase(payload);
  },
};
