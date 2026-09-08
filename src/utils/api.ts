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

export const api = {
  // Users
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Gagal mengambil users');
    return res.json();
  },
  async createUser(data: Omit<User, 'id'>): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal membuat user');
    return res.json();
  },
  async updateUser(user: User): Promise<User> {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Gagal memperbarui user');
    return res.json();
  },
  async deleteUser(id: number): Promise<void> {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  },

  // Academic Years
  async getAcademicYears(): Promise<AcademicYear[]> {
    const res = await fetch('/api/academic-years');
    if (!res.ok) throw new Error('Gagal mengambil academic years');
    return res.json();
  },
  async createAcademicYear(data: Omit<AcademicYear, 'id'>): Promise<AcademicYear> {
    const res = await fetch('/api/academic-years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal membuat tahun akademik');
    return res.json();
  },
  async updateAcademicYear(data: AcademicYear): Promise<AcademicYear> {
    const res = await fetch(`/api/academic-years/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui tahun akademik');
    return res.json();
  },
  async deleteAcademicYear(id: number): Promise<void> {
    await fetch(`/api/academic-years/${id}`, { method: 'DELETE' });
  },

  // Faculties
  async getFaculties(): Promise<Faculty[]> {
    const res = await fetch('/api/faculties');
    if (!res.ok) throw new Error('Gagal mengambil fakultas');
    return res.json();
  },
  async createFaculty(data: Omit<Faculty, 'id'>): Promise<Faculty> {
    const res = await fetch('/api/faculties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal membuat fakultas');
    return res.json();
  },
  async updateFaculty(data: Faculty): Promise<Faculty> {
    const res = await fetch(`/api/faculties/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui fakultas');
    return res.json();
  },
  async deleteFaculty(id: number): Promise<void> {
    await fetch(`/api/faculties/${id}`, { method: 'DELETE' });
  },

  // Study Programs
  async getStudyPrograms(): Promise<StudyProgram[]> {
    const res = await fetch('/api/study-programs');
    if (!res.ok) throw new Error('Gagal mengambil program studi');
    return res.json();
  },
  async createStudyProgram(data: Omit<StudyProgram, 'id'>): Promise<StudyProgram> {
    const res = await fetch('/api/study-programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal membuat program studi');
    return res.json();
  },
  async updateStudyProgram(data: StudyProgram): Promise<StudyProgram> {
    const res = await fetch(`/api/study-programs/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui program studi');
    return res.json();
  },
  async deleteStudyProgram(id: number): Promise<void> {
    await fetch(`/api/study-programs/${id}`, { method: 'DELETE' });
  },

  // Participants
  async getParticipants(): Promise<Participant[]> {
    const res = await fetch('/api/participants');
    if (!res.ok) throw new Error('Gagal mengambil peserta');
    return res.json();
  },
  async createParticipant(data: Omit<Participant, 'id'>): Promise<Participant> {
    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal membuat peserta');
    return res.json();
  },
  async updateParticipant(data: Participant): Promise<Participant> {
    const res = await fetch(`/api/participants/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui peserta');
    return res.json();
  },
  async batchUpdateParticipants(participants: Participant[]): Promise<Participant[]> {
    const res = await fetch('/api/participants/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participants }),
    });
    if (!res.ok) throw new Error('Gagal batch update peserta');
    return res.json();
  },
  async deleteParticipant(id: number): Promise<void> {
    await fetch(`/api/participants/${id}`, { method: 'DELETE' });
  },

  // Selection Weights
  async getWeights(): Promise<SelectionWeights> {
    const res = await fetch('/api/selection-weights');
    if (!res.ok) throw new Error('Gagal mengambil bobot');
    return res.json();
  },
  async updateWeights(data: SelectionWeights): Promise<SelectionWeights> {
    const res = await fetch('/api/selection-weights', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal memperbarui bobot');
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<SelectionAuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Gagal mengambil audit logs');
    return res.json();
  },
  async createAuditLog(log: Omit<SelectionAuditLog, 'id' | 'timestamp'>): Promise<SelectionAuditLog> {
    const res = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error('Gagal mencatat audit log');
    return res.json();
  },

  // Backups
  async getBackups(): Promise<DatabaseBackupItem[]> {
    const res = await fetch('/api/backups');
    if (!res.ok) throw new Error('Gagal mengambil backups');
    return res.json();
  },
  async createBackup(data: DatabaseBackupItem): Promise<DatabaseBackupItem> {
    const res = await fetch('/api/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Gagal mencatat backup');
    return res.json();
  },
  async deleteBackup(id: string): Promise<void> {
    await fetch(`/api/backups/${id}`, { method: 'DELETE' });
  },
};
