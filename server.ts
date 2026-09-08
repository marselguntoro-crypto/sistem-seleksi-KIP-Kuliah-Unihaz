import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db/index.ts';
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
import { eq, desc } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'Cloud SQL PostgreSQL (Developer Edition)' });
});

// Seed data on server start (lazy, non-blocking)
seedDatabaseIfEmpty().catch(err => console.error('[Server Seed Error]:', err));

// ==========================================
// 1. Users / Operators
// ==========================================
app.get('/api/users', async (req, res) => {
  try {
    const list = await db.select().from(users);
    res.json(list);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Gagal mengambil data user dari database.' });
  }
});

app.post('/api/users', async (req, res) => {
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
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Failed to create user:', error);
    res.status(500).json({ error: error.message || 'Gagal menambahkan user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, email, role, isActive, avatarUrl, password } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (password !== undefined) updateData.password = password;

    const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update user:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(users).where(eq(users.id, id));
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus user' });
  }
});

// ==========================================
// 2. Academic Years
// ==========================================
app.get('/api/academic-years', async (req, res) => {
  try {
    const list = await db.select().from(academicYears).orderBy(academicYears.id);
    res.json(list);
  } catch (error) {
    console.error('Failed to fetch academic years:', error);
    res.status(500).json({ error: 'Gagal memuat tahun akademik' });
  }
});

app.post('/api/academic-years', async (req, res) => {
  try {
    const data = req.body;
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
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Failed to create academic year:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat tahun akademik' });
  }
});

app.put('/api/academic-years/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body;
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
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update academic year:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui tahun akademik' });
  }
});

app.delete('/api/academic-years/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(academicYears).where(eq(academicYears.id, id));
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete academic year:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus tahun akademik' });
  }
});

// ==========================================
// 3. Faculties
// ==========================================
app.get('/api/faculties', async (req, res) => {
  try {
    const list = await db.select().from(faculties).orderBy(faculties.id);
    res.json(list);
  } catch (error) {
    console.error('Failed to fetch faculties:', error);
    res.status(500).json({ error: 'Gagal mengambil data fakultas' });
  }
});

app.post('/api/faculties', async (req, res) => {
  try {
    const [created] = await db.insert(faculties).values(req.body).returning();
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Failed to create faculty:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat fakultas' });
  }
});

app.put('/api/faculties/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [updated] = await db.update(faculties).set(req.body).where(eq(faculties.id, id)).returning();
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update faculty:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui fakultas' });
  }
});

app.delete('/api/faculties/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(faculties).where(eq(faculties.id, id));
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete faculty:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus fakultas' });
  }
});

// ==========================================
// 4. Study Programs
// ==========================================
app.get('/api/study-programs', async (req, res) => {
  try {
    const list = await db.select().from(studyPrograms).orderBy(studyPrograms.id);
    res.json(list);
  } catch (error) {
    console.error('Failed to fetch study programs:', error);
    res.status(500).json({ error: 'Gagal mengambil program studi' });
  }
});

app.post('/api/study-programs', async (req, res) => {
  try {
    const [created] = await db.insert(studyPrograms).values(req.body).returning();
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Failed to create study program:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat program studi' });
  }
});

app.put('/api/study-programs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [updated] = await db.update(studyPrograms).set(req.body).where(eq(studyPrograms.id, id)).returning();
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update study program:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui program studi' });
  }
});

app.delete('/api/study-programs/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(studyPrograms).where(eq(studyPrograms.id, id));
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete study program:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus program studi' });
  }
});

// ==========================================
// 5. Participants (Full CRUD, Scoring, Batch)
// ==========================================
app.get('/api/participants', async (req, res) => {
  try {
    const list = await db.select().from(participants).orderBy(participants.id);
    res.json(list);
  } catch (error) {
    console.error('Failed to fetch participants:', error);
    res.status(500).json({ error: 'Gagal mengambil data peserta' });
  }
});

app.post('/api/participants', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: req.body.updatedAt || new Date().toISOString(),
    };
    // remove id if present to let postgres assign serial
    delete payload.id;
    const [created] = await db.insert(participants).values(payload).returning();
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Failed to create participant:', error);
    res.status(500).json({ error: error.message || 'Gagal menambahkan peserta' });
  }
});

app.put('/api/participants/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const payload = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    delete payload.id;
    const [updated] = await db.update(participants).set(payload).where(eq(participants.id, id)).returning();
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update participant:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui data peserta' });
  }
});

app.post('/api/participants/batch', async (req, res) => {
  try {
    const { participants: batchList } = req.body;
    if (!Array.isArray(batchList)) {
      return res.status(400).json({ error: 'Payload harus berupa array participants' });
    }

    const updatedList = [];
    for (const p of batchList) {
      const payload = { ...p, updatedAt: new Date().toISOString() };
      delete payload.id;
      const [u] = await db.update(participants).set(payload).where(eq(participants.id, p.id)).returning();
      if (u) updatedList.push(u);
    }
    res.json(updatedList);
  } catch (error: any) {
    console.error('Failed to batch update participants:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan update batch peserta' });
  }
});

app.delete('/api/participants/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(participants).where(eq(participants.id, id));
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete participant:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus peserta' });
  }
});

// ==========================================
// 6. Selection Weights
// ==========================================
app.get('/api/selection-weights', async (req, res) => {
  try {
    const rows = await db.select().from(selectionWeights).limit(1);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json({
        utbkWeight: 30,
        interviewWeight: 40,
        surveyWeight: 30,
        affirmationWeight: 0,
        minUtbkScore: 400,
        maxParentIncome: 4000000,
      });
    }
  } catch (error) {
    console.error('Failed to fetch weights:', error);
    res.status(500).json({ error: 'Gagal mengambil bobot seleksi' });
  }
});

app.put('/api/selection-weights', async (req, res) => {
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
    res.json(result);
  } catch (error: any) {
    console.error('Failed to update weights:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui bobot seleksi' });
  }
});

// ==========================================
// 7. Audit Logs
// ==========================================
app.get('/api/audit-logs', async (req, res) => {
  try {
    const list = await db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(100);
    res.json(list);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    res.status(500).json({ error: 'Gagal memuat log audit' });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  try {
    const [created] = await db.insert(auditLogs).values({
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
    }).returning();
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Failed to create audit log:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan log audit' });
  }
});

// ==========================================
// 8. Backups
// ==========================================
app.get('/api/backups', async (req, res) => {
  try {
    const list = await db.select().from(backups).orderBy(desc(backups.createdAt));
    res.json(list);
  } catch (error) {
    console.error('Failed to fetch backups:', error);
    res.status(500).json({ error: 'Gagal memuat data backup' });
  }
});

app.post('/api/backups', async (req, res) => {
  try {
    const [created] = await db.insert(backups).values(req.body).returning();
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Failed to create backup item:', error);
    res.status(500).json({ error: error.message || 'Gagal mencatat backup' });
  }
});

app.delete('/api/backups/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.delete(backups).where(eq(backups.id, id));
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete backup:', error);
    res.status(500).json({ error: error.message || 'Gagal menghapus backup' });
  }
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
