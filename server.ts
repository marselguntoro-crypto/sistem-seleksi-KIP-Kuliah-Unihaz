import express from 'express';
import path from 'path';
import { db, isDatabaseConfigured } from './src/db/index.ts';
import { 
  users, 
  academicYears, 
  faculties, 
  studyPrograms, 
  participants, 
  selectionWeights, 
  auditLogs, 
  backups 
} from './src/db/schema.ts';
import { eq, desc, inArray } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';
import { 
  SEEDED_USERS, 
  INITIAL_ACADEMIC_YEARS, 
  INITIAL_FACULTIES, 
  INITIAL_STUDY_PROGRAMS, 
  INITIAL_PARTICIPANTS 
} from './src/data/mockData.ts';
import { INITIAL_AUDIT_LOGS, INITIAL_BACKUPS } from './src/data/initialAuditAndBackup.ts';
import { DEFAULT_SELECTION_WEIGHTS } from './src/utils/selectionUtils.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory fallback stores when Cloud SQL is not connected
let memUsers = [...SEEDED_USERS];
let memAcademicYears = [...INITIAL_ACADEMIC_YEARS];
let memFaculties = [...INITIAL_FACULTIES];
let memStudyPrograms = [...INITIAL_STUDY_PROGRAMS];
let memParticipants = [...INITIAL_PARTICIPANTS];
let memWeights = { ...DEFAULT_SELECTION_WEIGHTS };
let memAuditLogs = [...INITIAL_AUDIT_LOGS];
let memBackups = [...INITIAL_BACKUPS];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: isDatabaseConfigured ? 'Cloud SQL PostgreSQL (Developer Edition)' : 'In-Memory Store (Active)',
    isConfigured: isDatabaseConfigured
  });
});

// Seed data on server start (lazy, non-blocking) if Cloud SQL is configured
seedDatabaseIfEmpty().catch(err => console.error('[Server Seed Error]:', err));

// ==========================================
// 1. Users / Operators
// ==========================================
app.get('/api/users', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const list = await db.select().from(users);
      return res.json(list);
    } catch (error) {
      console.warn('DB query failed, using in-memory users:', error);
    }
  }
  res.json(memUsers);
});

app.post('/api/users', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const { name, username, email, role, isActive, password, avatarUrl } = req.body;
      const [created] = await db.insert(users).values({
        name,
        username,
        email,
        role,
        isActive: isActive ?? true,
        password: password || 'Operator@12345',
        avatarUrl: avatarUrl || null,
      }).returning();
      return res.status(201).json(created);
    } catch (error: any) {
      console.warn('DB insert failed, using in-memory user creation:', error);
    }
  }
  const nextId = memUsers.length > 0 ? Math.max(...memUsers.map(u => u.id)) + 1 : 1;
  const created = {
    id: nextId,
    name: req.body.name || '',
    username: req.body.username || '',
    email: req.body.email || '',
    role: req.body.role || 'Operator',
    isActive: req.body.isActive ?? true,
    password: req.body.password || 'Operator@12345',
    avatarUrl: req.body.avatarUrl || null,
    lastLoginAt: null,
  };
  memUsers.push(created as any);
  res.status(201).json(created);
});

app.put('/api/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDatabaseConfigured) {
    try {
      const { name, email, role, isActive, avatarUrl, password } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (password !== undefined) updateData.password = password;

      const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
      return res.json(updated);
    } catch (error: any) {
      console.warn('DB update failed, using in-memory user update:', error);
    }
  }
  const idx = memUsers.findIndex(u => u.id === id);
  if (idx !== -1) {
    memUsers[idx] = { ...memUsers[idx], ...req.body, id };
    res.json(memUsers[idx]);
  } else {
    res.json({ id, ...req.body });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDatabaseConfigured) {
    try {
      await db.delete(users).where(eq(users.id, id));
      return res.json({ success: true, id });
    } catch (error: any) {
      console.warn('DB delete failed, using in-memory user delete:', error);
    }
  }
  memUsers = memUsers.filter(u => u.id !== id);
  res.json({ success: true, id });
});

// ==========================================
// 2. Academic Years
// ==========================================
app.get('/api/academic-years', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const list = await db.select().from(academicYears).orderBy(academicYears.id);
      return res.json(list);
    } catch (error) {
      console.warn('DB query failed, using in-memory academic years:', error);
    }
  }
  res.json(memAcademicYears);
});

app.post('/api/academic-years', async (req, res) => {
  const data = req.body;
  if (isDatabaseConfigured) {
    try {
      if (data.isActive) {
        await db.update(academicYears).set({ isActive: false });
      }
      const [created] = await db.insert(academicYears).values({
        code: data.code,
        semester: data.semester,
        quota: data.quota,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? false,
        description: data.description || null,
      }).returning();
      return res.status(201).json(created);
    } catch (error: any) {
      console.warn('DB insert failed, using in-memory academic year:', error);
    }
  }
  if (data.isActive) {
    memAcademicYears = memAcademicYears.map(y => ({ ...y, isActive: false }));
  }
  const nextId = memAcademicYears.length > 0 ? Math.max(...memAcademicYears.map(y => y.id)) + 1 : 1;
  const created = { id: nextId, ...data };
  memAcademicYears.push(created);
  res.status(201).json(created);
});

app.put('/api/academic-years/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const data = req.body;
  if (isDatabaseConfigured) {
    try {
      if (data.isActive) {
        await db.update(academicYears).set({ isActive: false });
      }
      const [updated] = await db.update(academicYears).set({
        code: data.code,
        semester: data.semester,
        quota: data.quota,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        description: data.description,
      }).where(eq(academicYears.id, id)).returning();
      return res.json(updated);
    } catch (error: any) {
      console.warn('DB update failed, using in-memory academic year:', error);
    }
  }
  if (data.isActive) {
    memAcademicYears = memAcademicYears.map(y => ({ ...y, isActive: false }));
  }
  const idx = memAcademicYears.findIndex(y => y.id === id);
  if (idx !== -1) {
    memAcademicYears[idx] = { ...memAcademicYears[idx], ...data, id };
    res.json(memAcademicYears[idx]);
  } else {
    res.json({ id, ...data });
  }
});

app.delete('/api/academic-years/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDatabaseConfigured) {
    try {
      await db.delete(academicYears).where(eq(academicYears.id, id));
      return res.json({ success: true, id });
    } catch (error: any) {
      console.warn('DB delete failed, using in-memory academic year:', error);
    }
  }
  memAcademicYears = memAcademicYears.filter(y => y.id !== id);
  res.json({ success: true, id });
});

// ==========================================
// 3. Faculties
// ==========================================
app.get('/api/faculties', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const list = await db.select().from(faculties).orderBy(faculties.id);
      return res.json(list);
    } catch (error) {
      console.warn('DB query failed, using in-memory faculties:', error);
    }
  }
  res.json(memFaculties);
});

app.post('/api/faculties', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const [created] = await db.insert(faculties).values(req.body).returning();
      return res.status(201).json(created);
    } catch (error: any) {
      console.warn('DB insert failed, using in-memory faculty:', error);
    }
  }
  const nextId = memFaculties.length > 0 ? Math.max(...memFaculties.map(f => f.id)) + 1 : 1;
  const created = { id: nextId, ...req.body };
  memFaculties.push(created);
  res.status(201).json(created);
});

app.put('/api/faculties/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDatabaseConfigured) {
    try {
      const [updated] = await db.update(faculties).set(req.body).where(eq(faculties.id, id)).returning();
      return res.json(updated);
    } catch (error: any) {
      console.warn('DB update failed, using in-memory faculty:', error);
    }
  }
  const idx = memFaculties.findIndex(f => f.id === id);
  if (idx !== -1) {
    memFaculties[idx] = { ...memFaculties[idx], ...req.body, id };
    res.json(memFaculties[idx]);
  } else {
    res.json({ id, ...req.body });
  }
});

app.delete('/api/faculties/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDatabaseConfigured) {
    try {
      await db.delete(faculties).where(eq(faculties.id, id));
      return res.json({ success: true, id });
    } catch (error: any) {
      console.warn('DB delete failed, using in-memory faculty:', error);
    }
  }
  memFaculties = memFaculties.filter(f => f.id !== id);
  res.json({ success: true, id });
});

// ==========================================
// 4. Study Programs
// ==========================================
app.get('/api/study-programs', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const list = await db.select().from(studyPrograms).orderBy(studyPrograms.id);
      return res.json(list);
    } catch (error) {
      console.warn('DB query failed, using in-memory study programs:', error);
    }
  }
  res.json(memStudyPrograms);
});

app.post('/api/study-programs', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const [created] = await db.insert(studyPrograms).values(req.body).returning();
      return res.status(201).json(created);
    } catch (error: any) {
      console.warn('DB insert failed, using in-memory study program:', error);
    }
  }
  const nextId = memStudyPrograms.length > 0 ? Math.max(...memStudyPrograms.map(sp => sp.id)) + 1 : 1;
  const created = { id: nextId, ...req.body };
  memStudyPrograms.push(created);
  res.status(201).json(created);
});

app.put('/api/study-programs/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDatabaseConfigured) {
    try {
      const [updated] = await db.update(studyPrograms).set(req.body).where(eq(studyPrograms.id, id)).returning();
      return res.json(updated);
    } catch (error: any) {
      console.warn('DB update failed, using in-memory study program:', error);
    }
  }
  const idx = memStudyPrograms.findIndex(sp => sp.id === id);
  if (idx !== -1) {
    memStudyPrograms[idx] = { ...memStudyPrograms[idx], ...req.body, id };
    res.json(memStudyPrograms[idx]);
  } else {
    res.json({ id, ...req.body });
  }
});

app.delete('/api/study-programs/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDatabaseConfigured) {
    try {
      await db.delete(studyPrograms).where(eq(studyPrograms.id, id));
      return res.json({ success: true, id });
    } catch (error: any) {
      console.warn('DB delete failed, using in-memory study program:', error);
    }
  }
  memStudyPrograms = memStudyPrograms.filter(sp => sp.id !== id);
  res.json({ success: true, id });
});

// ==========================================
// 5. Participants (Full CRUD, Scoring, Batch)
// ==========================================
app.get('/api/participants', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const list = await db.select().from(participants).orderBy(participants.id);
      return res.json(list);
    } catch (error) {
      console.warn('DB query failed, using in-memory participants:', error);
    }
  }
  res.json(memParticipants);
});

app.post('/api/participants', async (req, res) => {
  const payload = {
    ...req.body,
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: req.body.updatedAt || new Date().toISOString(),
  };
  delete payload.id;
  if (isDatabaseConfigured) {
    try {
      const [created] = await db.insert(participants).values(payload).returning();
      return res.status(201).json(created);
    } catch (error: any) {
      console.warn('DB insert failed, using in-memory participant:', error);
    }
  }
  const nextId = memParticipants.length > 0 ? Math.max(...memParticipants.map(p => p.id)) + 1 : 1;
  const created = { id: nextId, ...payload };
  memParticipants.push(created);
  res.status(201).json(created);
});

app.put('/api/participants/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const payload = {
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  delete payload.id;
  if (isDatabaseConfigured) {
    try {
      const [updated] = await db.update(participants).set(payload).where(eq(participants.id, id)).returning();
      return res.json(updated);
    } catch (error: any) {
      console.warn('DB update failed, using in-memory participant:', error);
    }
  }
  const idx = memParticipants.findIndex(p => p.id === id);
  if (idx !== -1) {
    memParticipants[idx] = { ...memParticipants[idx], ...payload, id };
    res.json(memParticipants[idx]);
  } else {
    res.json({ id, ...payload });
  }
});

app.post('/api/participants/batch', async (req, res) => {
  const { participants: batchList } = req.body;
  if (!Array.isArray(batchList)) {
    return res.status(400).json({ error: 'Payload harus berupa array participants' });
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
      return res.json(updatedList);
    } catch (error: any) {
      console.warn('DB batch update failed, using in-memory participants batch:', error);
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
  res.json(updatedList);
});

app.delete('/api/participants/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isDatabaseConfigured) {
    try {
      await db.delete(participants).where(eq(participants.id, id));
      return res.json({ success: true, id });
    } catch (error: any) {
      console.warn('DB delete failed, using in-memory participant delete:', error);
    }
  }
  memParticipants = memParticipants.filter(p => p.id !== id);
  res.json({ success: true, id });
});

app.post('/api/participants/batch-delete', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Payload harus berupa array ids' });
  }
  if (isDatabaseConfigured) {
    try {
      await db.delete(participants).where(inArray(participants.id, ids));
      return res.json({ success: true, count: ids.length });
    } catch (error: any) {
      console.warn('DB batch delete failed, using in-memory delete:', error);
    }
  }
  const idSet = new Set(ids);
  memParticipants = memParticipants.filter(p => !idSet.has(p.id));
  res.json({ success: true, count: ids.length });
});

// ==========================================
// 6. Selection Weights
// ==========================================
app.get('/api/selection-weights', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const rows = await db.select().from(selectionWeights).limit(1);
      if (rows.length > 0) {
        return res.json(rows[0]);
      }
    } catch (error) {
      console.warn('DB query failed, using in-memory weights:', error);
    }
  }
  res.json(memWeights);
});

app.put('/api/selection-weights', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const existing = await db.select().from(selectionWeights).limit(1);
      let result;
      if (existing.length > 0) {
        [result] = await db.update(selectionWeights).set({
          ...req.body,
          updatedAt: new Date(),
        }).where(eq(selectionWeights.id, existing[0].id)).returning();
      } else {
        [result] = await db.insert(selectionWeights).values(req.body).returning();
      }
      return res.json(result);
    } catch (error: any) {
      console.warn('DB update failed, using in-memory weights update:', error);
    }
  }
  memWeights = { ...memWeights, ...req.body };
  res.json(memWeights);
});

// ==========================================
// 7. Audit Logs
// ==========================================
app.get('/api/audit-logs', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const list = await db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(100);
      return res.json(list);
    } catch (error) {
      console.warn('DB query failed, using in-memory audit logs:', error);
    }
  }
  res.json(memAuditLogs.slice(0, 100));
});

app.post('/api/audit-logs', async (req, res) => {
  const entry = {
    ...req.body,
    timestamp: req.body.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  if (isDatabaseConfigured) {
    try {
      const [created] = await db.insert(auditLogs).values(entry).returning();
      return res.status(201).json(created);
    } catch (error: any) {
      console.warn('DB insert failed, using in-memory audit log:', error);
    }
  }
  const nextId = memAuditLogs.length > 0 ? Math.max(...memAuditLogs.map(a => a.id)) + 1 : 1;
  const created = { id: nextId, ...entry };
  memAuditLogs.unshift(created);
  res.status(201).json(created);
});

// ==========================================
// 8. Backups
// ==========================================
app.get('/api/backups', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const list = await db.select().from(backups).orderBy(desc(backups.createdAt));
      return res.json(list);
    } catch (error) {
      console.warn('DB query failed, using in-memory backups:', error);
    }
  }
  res.json(memBackups);
});

app.post('/api/backups', async (req, res) => {
  if (isDatabaseConfigured) {
    try {
      const [created] = await db.insert(backups).values(req.body).returning();
      return res.status(201).json(created);
    } catch (error: any) {
      console.warn('DB insert failed, using in-memory backup:', error);
    }
  }
  const created = { ...req.body };
  memBackups.unshift(created);
  res.status(201).json(created);
});

app.delete('/api/backups/:id', async (req, res) => {
  const id = req.params.id;
  if (isDatabaseConfigured) {
    try {
      await db.delete(backups).where(eq(backups.id, id));
      return res.json({ success: true, id });
    } catch (error: any) {
      console.warn('DB delete failed, using in-memory backup delete:', error);
    }
  }
  memBackups = memBackups.filter(b => b.id !== id);
  res.json({ success: true, id });
});

// ==========================================
// Frontend Middleware Integration
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sistem KIP-K Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
