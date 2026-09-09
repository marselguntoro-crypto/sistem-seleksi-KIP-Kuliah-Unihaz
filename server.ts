import express from 'express';
import path from 'path';
import { Storage } from './src/db/storage.ts';
import { isDatabaseConfigured } from './src/db/index.ts';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';
import { seedMongoIfEmpty, getMongoConnectionStatus } from './src/db/mongodb.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check and database status indicator
app.get('/api/health', (req, res) => {
  const mongoStatus = getMongoConnectionStatus();
  let dbName = 'In-Memory Store (Active)';

  if (mongoStatus.connected) {
    dbName = 'MongoDB Atlas (Cluster0: Connected)';
  } else if (mongoStatus.hasPlaceholderPassword) {
    dbName = 'MongoDB Atlas (Pending Password: ganti <db_password> di Environment)';
  } else if (mongoStatus.configured) {
    dbName = 'MongoDB Atlas (Configured)';
  } else if (isDatabaseConfigured) {
    dbName = 'Cloud SQL PostgreSQL (Developer Edition)';
  }

  res.json({ 
    status: 'ok', 
    database: dbName,
    mongodb: mongoStatus,
    isConfigured: isDatabaseConfigured || mongoStatus.configured || mongoStatus.connected
  });
});

// Seed data on server start (lazy, non-blocking)
seedMongoIfEmpty().catch(err => console.error('[MongoDB Seed Error]:', err));
seedDatabaseIfEmpty().catch(err => console.error('[PostgreSQL Seed Error]:', err));

// ==========================================
// 1. Users / Operators
// ==========================================
app.get('/api/users', async (req, res) => {
  const list = await Storage.getUsers();
  res.json(list);
});

app.post('/api/users', async (req, res) => {
  const created = await Storage.createUser(req.body);
  res.status(201).json(created);
});

app.put('/api/users/:id', async (req, res) => {
  const updated = await Storage.updateUser(parseInt(req.params.id, 10), req.body);
  res.json(updated);
});

app.delete('/api/users/:id', async (req, res) => {
  const result = await Storage.deleteUser(parseInt(req.params.id, 10));
  res.json(result);
});

// ==========================================
// 2. Academic Years
// ==========================================
app.get('/api/academic-years', async (req, res) => {
  const list = await Storage.getAcademicYears();
  res.json(list);
});

app.post('/api/academic-years', async (req, res) => {
  const created = await Storage.createAcademicYear(req.body);
  res.status(201).json(created);
});

app.put('/api/academic-years/:id', async (req, res) => {
  const updated = await Storage.updateAcademicYear(parseInt(req.params.id, 10), req.body);
  res.json(updated);
});

app.delete('/api/academic-years/:id', async (req, res) => {
  const result = await Storage.deleteAcademicYear(parseInt(req.params.id, 10));
  res.json(result);
});

// ==========================================
// 3. Faculties
// ==========================================
app.get('/api/faculties', async (req, res) => {
  const list = await Storage.getFaculties();
  res.json(list);
});

app.post('/api/faculties', async (req, res) => {
  const created = await Storage.createFaculty(req.body);
  res.status(201).json(created);
});

app.put('/api/faculties/:id', async (req, res) => {
  const updated = await Storage.updateFaculty(parseInt(req.params.id, 10), req.body);
  res.json(updated);
});

app.delete('/api/faculties/:id', async (req, res) => {
  const result = await Storage.deleteFaculty(parseInt(req.params.id, 10));
  res.json(result);
});

// ==========================================
// 4. Study Programs
// ==========================================
app.get('/api/study-programs', async (req, res) => {
  const list = await Storage.getStudyPrograms();
  res.json(list);
});

app.post('/api/study-programs', async (req, res) => {
  const created = await Storage.createStudyProgram(req.body);
  res.status(201).json(created);
});

app.put('/api/study-programs/:id', async (req, res) => {
  const updated = await Storage.updateStudyProgram(parseInt(req.params.id, 10), req.body);
  res.json(updated);
});

app.delete('/api/study-programs/:id', async (req, res) => {
  const result = await Storage.deleteStudyProgram(parseInt(req.params.id, 10));
  res.json(result);
});

// ==========================================
// 5. Participants (Full CRUD, Scoring, Batch)
// ==========================================
app.get('/api/participants', async (req, res) => {
  const list = await Storage.getParticipants();
  res.json(list);
});

app.post('/api/participants', async (req, res) => {
  const created = await Storage.createParticipant(req.body);
  res.status(201).json(created);
});

app.put('/api/participants/:id', async (req, res) => {
  const updated = await Storage.updateParticipant(parseInt(req.params.id, 10), req.body);
  res.json(updated);
});

app.post('/api/participants/batch', async (req, res) => {
  const { participants: batchList } = req.body;
  if (!Array.isArray(batchList)) {
    return res.status(400).json({ error: 'Payload harus berupa array participants' });
  }
  const updated = await Storage.batchUpdateParticipants(batchList);
  res.json(updated);
});

app.delete('/api/participants/:id', async (req, res) => {
  const result = await Storage.deleteParticipant(parseInt(req.params.id, 10));
  res.json(result);
});

app.post('/api/participants/batch-delete', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Payload harus berupa array ids' });
  }
  const result = await Storage.batchDeleteParticipants(ids);
  res.json(result);
});

// ==========================================
// 6. Selection Weights
// ==========================================
app.get('/api/selection-weights', async (req, res) => {
  const w = await Storage.getWeights();
  res.json(w);
});

app.put('/api/selection-weights', async (req, res) => {
  const updated = await Storage.updateWeights(req.body);
  res.json(updated);
});

// ==========================================
// 7. Audit Logs
// ==========================================
app.get('/api/audit-logs', async (req, res) => {
  const list = await Storage.getAuditLogs();
  res.json(list);
});

app.post('/api/audit-logs', async (req, res) => {
  const created = await Storage.createAuditLog(req.body);
  res.status(201).json(created);
});

// ==========================================
// 8. Backups
// ==========================================
app.get('/api/backups', async (req, res) => {
  const list = await Storage.getBackups();
  res.json(list);
});

app.post('/api/backups', async (req, res) => {
  const created = await Storage.createBackup(req.body);
  res.status(201).json(created);
});

app.delete('/api/backups/:id', async (req, res) => {
  const result = await Storage.deleteBackup(req.params.id);
  res.json(result);
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
