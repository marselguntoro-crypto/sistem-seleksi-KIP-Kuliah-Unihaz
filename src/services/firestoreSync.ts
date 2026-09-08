import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Participant, 
  AcademicYear, 
  Faculty, 
  StudyProgram, 
  User, 
  SelectionWeights, 
  SelectionAuditLog, 
  DatabaseBackupItem 
} from '../types';
import { 
  INITIAL_PARTICIPANTS, 
  INITIAL_ACADEMIC_YEARS, 
  INITIAL_FACULTIES, 
  INITIAL_STUDY_PROGRAMS, 
  SEEDED_USERS 
} from '../data/mockData';
import { INITIAL_AUDIT_LOGS, INITIAL_BACKUPS } from '../data/initialAuditAndBackup';
import { DEFAULT_SELECTION_WEIGHTS } from '../utils/selectionUtils';

// Helper to remove undefined fields which Firestore rejects
function sanitize<T>(obj: T): any {
  return JSON.parse(JSON.stringify(obj));
}

// -------------------------------------------------------------
// Seeder: Populates initial data into Firestore if empty
// -------------------------------------------------------------
let isSeeding = false;
export async function seedFirestoreIfEmpty(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const participantsSnap = await getDocs(collection(db, 'participants'));
    if (participantsSnap.empty) {
      console.log('Seeding initial data into Firestore for team sync...');
      const batch = writeBatch(db);

      // Seed participants
      INITIAL_PARTICIPANTS.forEach((p) => {
        const docRef = doc(db, 'participants', String(p.id));
        batch.set(docRef, sanitize(p));
      });

      // Seed academic years
      INITIAL_ACADEMIC_YEARS.forEach((y) => {
        const docRef = doc(db, 'academic_years', String(y.id));
        batch.set(docRef, sanitize(y));
      });

      // Seed faculties
      INITIAL_FACULTIES.forEach((f) => {
        const docRef = doc(db, 'faculties', String(f.id));
        batch.set(docRef, sanitize(f));
      });

      // Seed study programs
      INITIAL_STUDY_PROGRAMS.forEach((sp) => {
        const docRef = doc(db, 'study_programs', String(sp.id));
        batch.set(docRef, sanitize(sp));
      });

      // Seed users
      SEEDED_USERS.forEach((u) => {
        const docRef = doc(db, 'users', String(u.id));
        batch.set(docRef, sanitize(u));
      });

      // Seed weights
      const weightsRef = doc(db, 'settings', 'selection_weights');
      batch.set(weightsRef, sanitize(DEFAULT_SELECTION_WEIGHTS));

      // Seed audit logs
      INITIAL_AUDIT_LOGS.slice(0, 10).forEach((l) => {
        const docRef = doc(db, 'audit_logs', String(l.id));
        batch.set(docRef, sanitize(l));
      });

      // Seed backups
      INITIAL_BACKUPS.forEach((b) => {
        const docRef = doc(db, 'backups', String(b.id));
        batch.set(docRef, sanitize(b));
      });

      await batch.commit();
      console.log('Firestore seeding completed successfully.');
    }
  } catch (err) {
    console.error('Firestore seeding check error:', err);
  } finally {
    isSeeding = false;
  }
}

// -------------------------------------------------------------
// Real-time Listeners (Crucial for Vercel team synchronization!)
// -------------------------------------------------------------
export function subscribeToParticipants(callback: (participants: Participant[]) => void) {
  const colRef = collection(db, 'participants');
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const items: Participant[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Participant);
      });
      // Sort by id or rank
      items.sort((a, b) => a.id - b.id);
      callback(items);
    }
  }, (err) => {
    console.warn('Firestore participants subscription error:', err);
  });
}

export function subscribeToAuditLogs(callback: (logs: SelectionAuditLog[]) => void) {
  const colRef = collection(db, 'audit_logs');
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const items: SelectionAuditLog[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as SelectionAuditLog);
      });
      items.sort((a, b) => b.id - a.id);
      callback(items);
    }
  }, (err) => {
    console.warn('Firestore audit logs subscription error:', err);
  });
}

export function subscribeToWeights(callback: (weights: SelectionWeights) => void) {
  const docRef = doc(db, 'settings', 'selection_weights');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as SelectionWeights);
    }
  }, (err) => {
    console.warn('Firestore weights subscription error:', err);
  });
}

export function subscribeToAcademicYears(callback: (years: AcademicYear[]) => void) {
  const colRef = collection(db, 'academic_years');
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const items: AcademicYear[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AcademicYear);
      });
      items.sort((a, b) => a.id - b.id);
      callback(items);
    }
  }, (err) => {
    console.warn('Firestore academic years subscription error:', err);
  });
}

export function subscribeToFaculties(callback: (faculties: Faculty[]) => void) {
  const colRef = collection(db, 'faculties');
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const items: Faculty[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Faculty);
      });
      items.sort((a, b) => a.id - b.id);
      callback(items);
    }
  }, (err) => {
    console.warn('Firestore faculties subscription error:', err);
  });
}

export function subscribeToStudyPrograms(callback: (prodis: StudyProgram[]) => void) {
  const colRef = collection(db, 'study_programs');
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const items: StudyProgram[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as StudyProgram);
      });
      items.sort((a, b) => a.id - b.id);
      callback(items);
    }
  }, (err) => {
    console.warn('Firestore study programs subscription error:', err);
  });
}

export function subscribeToUsers(callback: (users: User[]) => void) {
  const colRef = collection(db, 'users');
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const items: User[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as User);
      });
      items.sort((a, b) => a.id - b.id);
      callback(items);
    }
  }, (err) => {
    console.warn('Firestore users subscription error:', err);
  });
}

// -------------------------------------------------------------
// CRUD Operations directly using Firestore
// -------------------------------------------------------------

// Participants
export async function fsGetParticipants(): Promise<Participant[]> {
  const snap = await getDocs(collection(db, 'participants'));
  if (snap.empty) return [];
  const list: Participant[] = [];
  snap.forEach(d => list.push(d.data() as Participant));
  list.sort((a, b) => a.id - b.id);
  return list;
}

export async function fsCreateParticipant(data: Omit<Participant, 'id'>): Promise<Participant> {
  const id = Date.now();
  const newP: Participant = { ...data, id };
  await setDoc(doc(db, 'participants', String(id)), sanitize(newP));
  return newP;
}

export async function fsUpdateParticipant(data: Participant): Promise<Participant> {
  await setDoc(doc(db, 'participants', String(data.id)), sanitize(data), { merge: true });
  return data;
}

export async function fsBatchUpdateParticipants(participants: Participant[]): Promise<Participant[]> {
  const batch = writeBatch(db);
  for (const p of participants) {
    const docRef = doc(db, 'participants', String(p.id));
    batch.set(docRef, sanitize(p), { merge: true });
  }
  await batch.commit();
  return participants;
}

export async function fsDeleteParticipant(id: number): Promise<void> {
  await deleteDoc(doc(db, 'participants', String(id)));
}

// Academic Years
export async function fsGetAcademicYears(): Promise<AcademicYear[]> {
  const snap = await getDocs(collection(db, 'academic_years'));
  if (snap.empty) return [];
  const list: AcademicYear[] = [];
  snap.forEach(d => list.push(d.data() as AcademicYear));
  return list;
}

export async function fsCreateAcademicYear(data: Omit<AcademicYear, 'id'>): Promise<AcademicYear> {
  const id = Date.now();
  const item: AcademicYear = { ...data, id };
  await setDoc(doc(db, 'academic_years', String(id)), sanitize(item));
  return item;
}

export async function fsUpdateAcademicYear(data: AcademicYear): Promise<AcademicYear> {
  await setDoc(doc(db, 'academic_years', String(data.id)), sanitize(data), { merge: true });
  return data;
}

export async function fsDeleteAcademicYear(id: number): Promise<void> {
  await deleteDoc(doc(db, 'academic_years', String(id)));
}

// Faculties
export async function fsGetFaculties(): Promise<Faculty[]> {
  const snap = await getDocs(collection(db, 'faculties'));
  if (snap.empty) return [];
  const list: Faculty[] = [];
  snap.forEach(d => list.push(d.data() as Faculty));
  return list;
}

export async function fsCreateFaculty(data: Omit<Faculty, 'id'>): Promise<Faculty> {
  const id = Date.now();
  const item: Faculty = { ...data, id };
  await setDoc(doc(db, 'faculties', String(id)), sanitize(item));
  return item;
}

export async function fsUpdateFaculty(data: Faculty): Promise<Faculty> {
  await setDoc(doc(db, 'faculties', String(data.id)), sanitize(data), { merge: true });
  return data;
}

export async function fsDeleteFaculty(id: number): Promise<void> {
  await deleteDoc(doc(db, 'faculties', String(id)));
}

// Study Programs
export async function fsGetStudyPrograms(): Promise<StudyProgram[]> {
  const snap = await getDocs(collection(db, 'study_programs'));
  if (snap.empty) return [];
  const list: StudyProgram[] = [];
  snap.forEach(d => list.push(d.data() as StudyProgram));
  return list;
}

export async function fsCreateStudyProgram(data: Omit<StudyProgram, 'id'>): Promise<StudyProgram> {
  const id = Date.now();
  const item: StudyProgram = { ...data, id };
  await setDoc(doc(db, 'study_programs', String(id)), sanitize(item));
  return item;
}

export async function fsUpdateStudyProgram(data: StudyProgram): Promise<StudyProgram> {
  await setDoc(doc(db, 'study_programs', String(data.id)), sanitize(data), { merge: true });
  return data;
}

export async function fsDeleteStudyProgram(id: number): Promise<void> {
  await deleteDoc(doc(db, 'study_programs', String(id)));
}

// Selection Weights
export async function fsGetWeights(): Promise<SelectionWeights> {
  const snap = await getDocs(collection(db, 'settings'));
  const weightsDoc = snap.docs.find(d => d.id === 'selection_weights');
  if (weightsDoc) {
    return weightsDoc.data() as SelectionWeights;
  }
  return DEFAULT_SELECTION_WEIGHTS;
}

export async function fsUpdateWeights(data: SelectionWeights): Promise<SelectionWeights> {
  await setDoc(doc(db, 'settings', 'selection_weights'), sanitize(data), { merge: true });
  return data;
}

// Audit Logs
export async function fsGetAuditLogs(): Promise<SelectionAuditLog[]> {
  const snap = await getDocs(collection(db, 'audit_logs'));
  if (snap.empty) return [];
  const list: SelectionAuditLog[] = [];
  snap.forEach(d => list.push(d.data() as SelectionAuditLog));
  list.sort((a, b) => b.id - a.id);
  return list;
}

export async function fsCreateAuditLog(data: Omit<SelectionAuditLog, 'id' | 'timestamp'>): Promise<SelectionAuditLog> {
  const id = Date.now();
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);
  const newLog: SelectionAuditLog = {
    ...data,
    id,
    timestamp,
    ipAddress: data.ipAddress || '10.14.20.101'
  };
  await setDoc(doc(db, 'audit_logs', String(id)), sanitize(newLog));
  return newLog;
}

// Users
export async function fsGetUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  if (snap.empty) return [];
  const list: User[] = [];
  snap.forEach(d => list.push(d.data() as User));
  return list;
}

export async function fsCreateUser(data: Omit<User, 'id'>): Promise<User> {
  const id = Date.now();
  const item: User = { ...data, id };
  await setDoc(doc(db, 'users', String(id)), sanitize(item));
  return item;
}

export async function fsUpdateUser(data: User): Promise<User> {
  await setDoc(doc(db, 'users', String(data.id)), sanitize(data), { merge: true });
  return data;
}

export async function fsDeleteUser(id: number): Promise<void> {
  await deleteDoc(doc(db, 'users', String(id)));
}

// Backups
export async function fsGetBackups(): Promise<DatabaseBackupItem[]> {
  const snap = await getDocs(collection(db, 'backups'));
  if (snap.empty) return [];
  const list: DatabaseBackupItem[] = [];
  snap.forEach(d => list.push(d.data() as DatabaseBackupItem));
  return list;
}

export async function fsCreateBackup(data: DatabaseBackupItem): Promise<DatabaseBackupItem> {
  await setDoc(doc(db, 'backups', String(data.id)), sanitize(data));
  return data;
}

export async function fsDeleteBackup(id: string): Promise<void> {
  await deleteDoc(doc(db, 'backups', String(id)));
}
