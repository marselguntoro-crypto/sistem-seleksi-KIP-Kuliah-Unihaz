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
    const fsPromise = fsCreateUser(data);
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const resData = await res.json();
          fsCreateUser(resData).catch(() => {});
          return resData;
        }
      } catch {}
    }
    return fsPromise;
  },
  async updateUser(user: User): Promise<User> {
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
    await fsDeleteUser(id);
    if (await isServerAvailable()) {
      fetch(`/api/users/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // Academic Years
  async getAcademicYears(): Promise<AcademicYear[]> {
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/academic-years');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetAcademicYears();
  },
  async createAcademicYear(data: Omit<AcademicYear, 'id'>): Promise<AcademicYear> {
    const fsPromise = fsCreateAcademicYear(data);
    if (await isServerAvailable()) {
      fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async updateAcademicYear(data: AcademicYear): Promise<AcademicYear> {
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
    await fsDeleteAcademicYear(id);
    if (await isServerAvailable()) {
      fetch(`/api/academic-years/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // Faculties
  async getFaculties(): Promise<Faculty[]> {
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/faculties');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetFaculties();
  },
  async createFaculty(data: Omit<Faculty, 'id'>): Promise<Faculty> {
    const fsPromise = fsCreateFaculty(data);
    if (await isServerAvailable()) {
      fetch('/api/faculties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async updateFaculty(data: Faculty): Promise<Faculty> {
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
    await fsDeleteFaculty(id);
    if (await isServerAvailable()) {
      fetch(`/api/faculties/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // Study Programs
  async getStudyPrograms(): Promise<StudyProgram[]> {
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/study-programs');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetStudyPrograms();
  },
  async createStudyProgram(data: Omit<StudyProgram, 'id'>): Promise<StudyProgram> {
    const fsPromise = fsCreateStudyProgram(data);
    if (await isServerAvailable()) {
      fetch('/api/study-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async updateStudyProgram(data: StudyProgram): Promise<StudyProgram> {
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
    await fsDeleteStudyProgram(id);
    if (await isServerAvailable()) {
      fetch(`/api/study-programs/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  // Participants
  async getParticipants(): Promise<Participant[]> {
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/participants');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetParticipants();
  },
  async createParticipant(data: Omit<Participant, 'id'>): Promise<Participant> {
    const fsPromise = fsCreateParticipant(data);
    if (await isServerAvailable()) {
      fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }
    return fsPromise;
  },
  async updateParticipant(data: Participant): Promise<Participant> {
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
    await fsDeleteParticipant(id);
    if (await isServerAvailable()) {
      fetch(`/api/participants/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },
  async batchDeleteParticipants(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) return;
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
    if (await isServerAvailable()) {
      try {
        const res = await fetch('/api/selection-weights');
        if (res.ok) return await res.json();
      } catch {}
    }
    return fsGetWeights();
  },
  async updateWeights(data: SelectionWeights): Promise<SelectionWeights> {
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
};
