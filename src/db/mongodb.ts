import 'dotenv/config';
import { MongoClient, Db } from 'mongodb';
import { 
  SEEDED_USERS, 
  INITIAL_ACADEMIC_YEARS, 
  INITIAL_FACULTIES, 
  INITIAL_STUDY_PROGRAMS, 
  INITIAL_PARTICIPANTS 
} from '../data/mockData.ts';
import { INITIAL_AUDIT_LOGS, INITIAL_BACKUPS } from '../data/initialAuditAndBackup.ts';
import { DEFAULT_SELECTION_WEIGHTS } from '../utils/selectionUtils.ts';

declare global {
  var _mongoClient: MongoClient | undefined;
}

let cachedDb: Db | null = null;
let isConnecting = false;
let connectionError: string | null = null;

export function cleanMongoUri(raw: string): string {
  let uri = raw.trim();
  // Strip surrounding quotes if present
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1);
  }
  // Strip angle brackets around password if user typed :<password>@
  uri = uri.replace(/:(<)([^>]+)(>)@/, ':$2@');
  return uri;
}

export function getMongoUri(): string | null {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  const cleaned = cleanMongoUri(uri);
  // If the user has not replaced the placeholder <db_password>, it cannot connect yet
  if (cleaned.includes('<db_password>') || cleaned.includes('<password>')) {
    return null;
  }
  return cleaned;
}

export const isMongoConfigured = Boolean(getMongoUri());

export async function getMongoDb(): Promise<Db | null> {
  const uri = getMongoUri();
  if (!uri) return null;

  if (cachedDb) return cachedDb;
  if (isConnecting) {
    // Wait briefly if connection in progress
    await new Promise(r => setTimeout(r, 500));
    if (cachedDb) return cachedDb;
  }

  try {
    isConnecting = true;
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await global._mongoClient.connect();
      console.log('🍃 Successfully connected to MongoDB Atlas (Cluster0)!');
    }
    
    // Extract db name from URI or default to 'kip_kuliah_unihaz'
    let dbName = 'kip_kuliah_unihaz';
    try {
      const url = new URL(uri);
      const pathname = url.pathname.replace(/^\//, '');
      if (pathname) dbName = pathname;
    } catch {
      // Default fallback
    }

    cachedDb = global._mongoClient.db(dbName);
    connectionError = null;
    return cachedDb;
  } catch (err: any) {
    connectionError = err.message || 'Unknown MongoDB connection error';
    console.warn('⚠️ MongoDB Atlas connection attempt failed:', connectionError);
    return null;
  } finally {
    isConnecting = false;
  }
}

export function getMongoConnectionStatus(): {
  configured: boolean;
  connected: boolean;
  hasPlaceholderPassword: boolean;
  error: string | null;
} {
  const rawUri = process.env.MONGODB_URI || '';
  const hasPlaceholder = rawUri.includes('<db_password>') || rawUri.includes('<password>');
  return {
    configured: Boolean(rawUri && !hasPlaceholder),
    connected: Boolean(cachedDb),
    hasPlaceholderPassword: hasPlaceholder,
    error: connectionError
  };
}

export async function seedMongoIfEmpty() {
  const db = await getMongoDb();
  if (!db) return;

  try {
    // 1. Users
    const usersCount = await db.collection('users').countDocuments();
    if (usersCount === 0) {
      await db.collection('users').insertMany(SEEDED_USERS.map(u => ({ ...u })));
      console.log('🍃 Seeded users into MongoDB');
    }

    // 2. Academic Years
    const ayCount = await db.collection('academic_years').countDocuments();
    if (ayCount === 0) {
      await db.collection('academic_years').insertMany(INITIAL_ACADEMIC_YEARS.map(a => ({ ...a })));
      console.log('🍃 Seeded academic_years into MongoDB');
    }

    // 3. Faculties
    const facCount = await db.collection('faculties').countDocuments();
    if (facCount === 0) {
      await db.collection('faculties').insertMany(INITIAL_FACULTIES.map(f => ({ ...f })));
      console.log('🍃 Seeded faculties into MongoDB');
    }

    // 4. Study Programs
    const prodiCount = await db.collection('study_programs').countDocuments();
    if (prodiCount === 0) {
      await db.collection('study_programs').insertMany(INITIAL_STUDY_PROGRAMS.map(p => ({ ...p })));
      console.log('🍃 Seeded study_programs into MongoDB');
    }

    // 5. Participants
    const partCount = await db.collection('participants').countDocuments();
    if (partCount === 0 && INITIAL_PARTICIPANTS.length > 0) {
      await db.collection('participants').insertMany(INITIAL_PARTICIPANTS.map(p => ({ ...p })));
      console.log('🍃 Seeded participants into MongoDB');
    }

    // 6. Selection Weights
    const weightsCount = await db.collection('selection_weights').countDocuments();
    if (weightsCount === 0) {
      await db.collection('selection_weights').insertOne({ id: 1, ...DEFAULT_SELECTION_WEIGHTS });
      console.log('🍃 Seeded selection_weights into MongoDB');
    }

    // 7. Audit Logs
    const auditCount = await db.collection('audit_logs').countDocuments();
    if (auditCount === 0 && INITIAL_AUDIT_LOGS.length > 0) {
      await db.collection('audit_logs').insertMany(INITIAL_AUDIT_LOGS.map(l => ({ ...l })));
      console.log('🍃 Seeded audit_logs into MongoDB');
    }

    // 8. Backups
    const backupCount = await db.collection('backups').countDocuments();
    if (backupCount === 0 && INITIAL_BACKUPS.length > 0) {
      await db.collection('backups').insertMany(INITIAL_BACKUPS.map(b => ({ ...b })));
      console.log('🍃 Seeded backups into MongoDB');
    }
  } catch (err) {
    console.warn('MongoDB seed warning:', err);
  }
}
