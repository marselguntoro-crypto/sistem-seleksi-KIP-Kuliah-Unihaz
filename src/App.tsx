import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  DashboardStats, 
  ParticipantScoreItem, 
  AcademicYear, 
  Faculty, 
  StudyProgram, 
  Participant,
  SelectionWeights,
  SelectionAuditLog,
  DatabaseBackupItem 
} from './types';
import { 
  SEEDED_USERS, 
  INITIAL_STATS, 
  TOP_RANKING_DATA,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_FACULTIES,
  INITIAL_STUDY_PROGRAMS,
  INITIAL_PARTICIPANTS
} from './data/mockData';
import { INITIAL_AUDIT_LOGS, INITIAL_BACKUPS } from './data/initialAuditAndBackup';
import { DEFAULT_SELECTION_WEIGHTS, calculateParticipantFinalScore } from './utils/selectionUtils';
import { api } from './utils/api';
import { 
  subscribeToParticipants, 
  subscribeToWeights, 
  subscribeToAuditLogs,
  subscribeToAcademicYears,
  subscribeToFaculties,
  subscribeToStudyPrograms,
  subscribeToUsers
} from './services/firestoreSync';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LoginView } from './components/LoginView';
import { TestRunnerView } from './components/TestRunnerView';
import { CodeExplorerModal } from './components/CodeExplorerModal';
import { AcademicYearsView } from './components/master/AcademicYearsView';
import { FacultiesView } from './components/master/FacultiesView';
import { StudyProgramsView } from './components/master/StudyProgramsView';
import { ParticipantsView } from './components/participants/ParticipantsView';
import { ImportExcelView } from './components/import/ImportExcelView';
import { DocumentVerificationView } from './components/selection/DocumentVerificationView';
import { SurveyEvaluationView } from './components/selection/SurveyEvaluationView';
import { UtbkScoreView } from './components/selection/UtbkScoreView';
import { InterviewScoreView } from './components/selection/InterviewScoreView';
import { RankingResultsView } from './components/selection/RankingResultsView';
import { ReportsView } from './components/reports/ReportsView';
import { OperatorsView } from './components/admin/OperatorsView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { SelectionWeightsView } from './components/admin/SelectionWeightsView';
import { BackupRestoreView } from './components/admin/BackupRestoreView';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>(SEEDED_USERS);
  // Default currentUser to null so new visitors & shared URLs see the LoginView first
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('unihaz_kipk_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [weights, setWeights] = useState<SelectionWeights>(DEFAULT_SELECTION_WEIGHTS);
  const [rankings, setRankings] = useState<ParticipantScoreItem[]>(TOP_RANKING_DATA);
  const [activeRoute, setActiveRoute] = useState<string>('dashboard');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tests' | 'code'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Phase 2 State: Master Data & Participants
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(INITIAL_ACADEMIC_YEARS);
  const [faculties, setFaculties] = useState<Faculty[]>(INITIAL_FACULTIES);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>(INITIAL_STUDY_PROGRAMS);
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);

  // Phase 3 State: Audit Logs & Database Backups
  const [auditLogs, setAuditLogs] = useState<SelectionAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [backups, setBackups] = useState<DatabaseBackupItem[]>(INITIAL_BACKUPS);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Load initial data and subscribe to real-time Cloud Firestore updates
  useEffect(() => {
    let isMounted = true;

    async function loadDataFromDb() {
      try {
        await api.init();
        const [
          dbUsers,
          dbYears,
          dbFaculties,
          dbProdis,
          dbParticipants,
          dbWeights,
          dbAudits,
          dbBackups
        ] = await Promise.allSettled([
          api.getUsers(),
          api.getAcademicYears(),
          api.getFaculties(),
          api.getStudyPrograms(),
          api.getParticipants(),
          api.getWeights(),
          api.getAuditLogs(),
          api.getBackups()
        ]);

        if (!isMounted) return;

        if (dbUsers.status === 'fulfilled' && dbUsers.value.length > 0) {
          setUsers(dbUsers.value);
          // Only sync if user was already logged in from saved session
          setCurrentUser((prev) => {
            if (!prev) return null;
            const matched = dbUsers.value.find(u => u.username === prev.username || u.id === prev.id);
            return matched || prev;
          });
        }
        if (dbYears.status === 'fulfilled' && dbYears.value.length > 0) {
          setAcademicYears(dbYears.value);
        }
        if (dbFaculties.status === 'fulfilled' && dbFaculties.value.length > 0) {
          setFaculties(dbFaculties.value);
        }
        if (dbProdis.status === 'fulfilled' && dbProdis.value.length > 0) {
          setStudyPrograms(dbProdis.value);
        }
        if (dbParticipants.status === 'fulfilled') {
          setParticipants(dbParticipants.value);
        }
        if (dbWeights.status === 'fulfilled') {
          setWeights(dbWeights.value);
        }
        if (dbAudits.status === 'fulfilled' && dbAudits.value.length > 0) {
          setAuditLogs(dbAudits.value as any);
        }
        if (dbBackups.status === 'fulfilled' && dbBackups.value.length > 0) {
          setBackups(dbBackups.value);
        }
        setIsDbLoaded(true);
      } catch (err) {
        console.warn('Initial fetch had some fallback:', err);
      }
    }
    loadDataFromDb();

    // Attach real-time cloud listeners so edits made by any team member on Vercel appear instantly
    const unsubParticipants = subscribeToParticipants((liveList) => {
      if (isMounted) {
        setParticipants(liveList);
      }
    });

    const unsubWeights = subscribeToWeights((liveWeights) => {
      if (isMounted && liveWeights) {
        setWeights(liveWeights);
      }
    });

    const unsubAudits = subscribeToAuditLogs((liveLogs) => {
      if (isMounted && liveLogs.length > 0) {
        setAuditLogs(liveLogs);
      }
    });

    const unsubYears = subscribeToAcademicYears((liveYears) => {
      if (isMounted && liveYears.length > 0) {
        setAcademicYears(liveYears);
      }
    });

    const unsubFaculties = subscribeToFaculties((liveFaculties) => {
      if (isMounted && liveFaculties.length > 0) {
        setFaculties(liveFaculties);
      }
    });

    const unsubProdis = subscribeToStudyPrograms((liveProdis) => {
      if (isMounted && liveProdis.length > 0) {
        setStudyPrograms(liveProdis);
      }
    });

    const unsubUsers = subscribeToUsers((liveUsers) => {
      if (isMounted && liveUsers.length > 0) {
        setUsers(liveUsers);
        setCurrentUser((prev) => {
          if (!prev) return null;
          const matched = liveUsers.find((u) => u.username === prev.username || u.id === prev.id);
          return matched || prev;
        });
      }
    });

    return () => {
      isMounted = false;
      unsubParticipants();
      unsubWeights();
      unsubAudits();
      unsubYears();
      unsubFaculties();
      unsubProdis();
      unsubUsers();
    };
  }, []);

  const addAuditLog = (log: Omit<SelectionAuditLog, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);
    const newLog: SelectionAuditLog = {
      ...log,
      id: Date.now(),
      timestamp,
      ipAddress: log.ipAddress || '10.14.20.101',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    api.createAuditLog(log).catch(err => console.error('Failed to log audit to DB:', err));
  };

  // Toast notification state
  const [toast, setToast] = useState<{
    type: 'error' | 'success' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  const showToast = (type: 'error' | 'success' | 'warning', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Automatically derive ranking list from current participants
  useEffect(() => {
    const scoreItems: ParticipantScoreItem[] = participants.map((p) => ({
      rank: p.rank || 1,
      name: p.name,
      regNumber: p.regNumber,
      firstChoice: p.firstChoiceProdiName || 'Belum Memilih',
      secondChoice: p.secondChoiceProdiName || 'Belum Memilih',
      utbkScore: p.utbkScore || 0,
      interviewScore: p.interviewScore || 0,
      surveyScore: p.surveyScore || 0,
      finalScore: p.finalScore || 0,
      status: p.selectionStatus || 'Belum Diproses'
    }));

    // Sort DESC by finalScore
    scoreItems.sort((a, b) => b.finalScore - a.finalScore);
    const reRanked = scoreItems.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    setRankings(reRanked);
  }, [participants]);

  const handleRestrictedAttempt = (moduleName: string) => {
    showToast(
      'error',
      '403 Forbidden - Akses Ditolak',
      `Role "${currentUser?.role}" tidak memiliki izin (Spatie permission) untuk mengakses modul ${moduleName}.`
    );
  };

  const handleRunRecalculate = () => {
    setIsRecalculating(true);
    showToast(
      'success',
      'SelectionCalculationService Dipicu',
      `Menghitung ulang skor akhir berdasarkan bobot: UTBK (${weights.utbkWeight}%), Wawancara (${weights.interviewWeight}%), Survey (${weights.surveyWeight}%), Afirmasi (${weights.affirmationWeight}%)...`
    );

    setTimeout(() => {
      const totalWeight = weights.utbkWeight + weights.interviewWeight + weights.surveyWeight + weights.affirmationWeight;
      const updatedParticipants = participants.map((p) => {
        const utbk = p.utbkScore || 0;
        const interview = p.interviewScore || 0;
        const survey = p.surveyScore || 0;
        const affirmation = p.affirmationScore || 0;

        let finalScore = 0;
        if (totalWeight > 0) {
          finalScore =
            (utbk * weights.utbkWeight +
              interview * weights.interviewWeight +
              survey * weights.surveyWeight +
              affirmation * weights.affirmationWeight) /
            totalWeight;
        }
        return {
          ...p,
          finalScore: parseFloat(finalScore.toFixed(2))
        };
      });

      // Sort DESC
      updatedParticipants.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
      const reRanked = updatedParticipants.map((p, idx) => ({
        ...p,
        rank: idx + 1
      }));

      setParticipants(reRanked);
      setIsRecalculating(false);
      showToast('success', 'Kalkulasi Selesai', 'Peringkat dan nilai akhir peserta berhasil diperbarui.');
    }, 800);
  };

  // Participant Handlers
  const handleAddParticipant = async (newP: Omit<Participant, 'id'>) => {
    try {
      const created = await api.createParticipant(newP);
      setParticipants((prev) => [created, ...prev]);
      showToast('success', 'Peserta Ditambahkan', `Calon mahasiswa ${newP.name} berhasil disimpan ke database.`);
    } catch (e) {
      const nextId = participants.length > 0 ? Math.max(...participants.map((p) => p.id)) + 1 : 1;
      const itemWithId: Participant = { ...newP, id: nextId };
      setParticipants([itemWithId, ...participants]);
      showToast('success', 'Peserta Ditambahkan', `Calon mahasiswa ${newP.name} berhasil disimpan.`);
    }
  };

  const handleUpdateParticipant = async (updated: Participant) => {
    setParticipants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    api.updateParticipant(updated).catch(err => console.error('Failed to sync participant update:', err));
    showToast('success', 'Data Diperbarui', `Data peserta ${updated.name} berhasil diperbarui.`);
  };

  const handleBatchUpdateParticipants = async (updatedList: Participant[], customMessage?: string) => {
    if (updatedList.length === 0) return;
    const updatedMap = new Map(updatedList.map((p) => [p.id, p]));
    setParticipants((prev) => prev.map((p) => updatedMap.get(p.id) || p));
    api.batchUpdateParticipants(updatedList).catch((err) => console.error('Failed to batch sync:', err));
    showToast(
      'success',
      'Pembaruan Data Berhasil',
      customMessage || `Sebanyak ${updatedList.length} data peserta telah berhasil diperbarui ke sistem.`
    );
  };

  const handleDeleteParticipant = async (id: number) => {
    const target = participants.find((p) => p.id === id);
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    api.deleteParticipant(id).catch(err => console.error('Failed to delete participant:', err));
    showToast('success', 'Peserta Dihapus', `Data peserta ${target?.name || ''} telah dihapus dari database.`);
  };

  const handleBatchDeleteParticipants = async (ids: number[]) => {
    if (ids.length === 0) return;
    setParticipants((prev) => prev.filter((p) => !ids.includes(p.id)));
    api.batchDeleteParticipants(ids).catch(err => console.error('Failed to batch delete participants:', err));
    showToast('success', 'Hapus Massal Berhasil', `Sebanyak ${ids.length} data peserta berhasil dihapus dari sistem.`);
  };

  const handleImportSuccess = (newItems: Participant[]) => {
    setParticipants((prev) => [...newItems, ...prev]);
    if (newItems.length > 0) {
      api.batchUpdateParticipants(newItems).catch((err) => console.error('API batch import error:', err));
      addAuditLog({
        module: 'MASTER_DATA',
        action: 'Import Data Masal Calon Peserta',
        changedBy: currentUser?.name || 'Admin',
        role: currentUser?.role || 'Super Admin',
        details: `Berhasil mengimpor ${newItems.length} data peserta baru ke sistem. Data peserta yang telah ada sebelumnya tetap dipertahankan.`,
        severity: 'info',
      });
    }
    showToast(
      'success',
      'Import Berhasil',
      `Sebanyak ${newItems.length} data peserta baru berhasil dimasukkan. Data peserta yang sudah ada tetap dipertahankan.`
    );
    setActiveRoute('participants');
  };

  // Master Data Academic Years Handlers
  const handleAddAcademicYear = (newYear: Omit<AcademicYear, 'id'>) => {
    const nextId = academicYears.length > 0 ? Math.max(...academicYears.map((y) => y.id)) + 1 : 1;
    let list = [...academicYears];
    if (newYear.isActive) {
      list = list.map((y) => ({ ...y, isActive: false }));
    }
    const created = { ...newYear, id: nextId };
    setAcademicYears([...list, created]);
    api.createAcademicYear(newYear).catch((err) => console.error('API create academic year error:', err));
    showToast('success', 'Tahun Akademik Ditambahkan', `Tahun akademik ${newYear.code} berhasil dibuat.`);
  };

  const handleUpdateAcademicYear = (updated: AcademicYear) => {
    let list = [...academicYears];
    if (updated.isActive) {
      list = list.map((y) => ({ ...y, isActive: y.id === updated.id }));
    } else {
      list = list.map((y) => (y.id === updated.id ? updated : y));
    }
    setAcademicYears(list);
    api.updateAcademicYear(updated).catch((err) => console.error('API update academic year error:', err));
    showToast('success', 'Tahun Akademik Diperbarui', `Data tahun akademik ${updated.code} berhasil diperbarui.`);
  };

  const handleDeleteAcademicYear = (id: number) => {
    const target = academicYears.find((y) => y.id === id);
    if (target?.isActive) {
      showToast('error', 'Aksi Ditolak', 'Tahun akademik yang sedang aktif tidak dapat dihapus.');
      return { success: false, message: 'Tahun akademik yang sedang aktif tidak dapat dihapus.' };
    }
    setAcademicYears((prev) => prev.filter((y) => y.id !== id));
    api.deleteAcademicYear(id).catch((err) => console.error('API delete academic year error:', err));
    showToast('success', 'Tahun Akademik Dihapus', 'Data tahun akademik telah dihapus.');
    return { success: true, message: 'Data tahun akademik telah dihapus.' };
  };

  const handleToggleAcademicYearActive = (id: number) => {
    const target = academicYears.find((y) => y.id === id);
    if (!target) return;
    const nextState = !target.isActive;
    let list = academicYears.map((y) => {
      if (y.id === id) return { ...y, isActive: nextState };
      if (nextState) return { ...y, isActive: false };
      return y;
    });
    setAcademicYears(list);
    const updatedTarget = { ...target, isActive: nextState };
    api.updateAcademicYear(updatedTarget).catch((err) => console.error('API toggle academic year error:', err));
    showToast('success', 'Status Diubah', `Tahun akademik ${target.code} kini ${nextState ? 'AKTIF' : 'NONAKTIF'}.`);
  };

  // Master Data Faculties Handlers
  const handleAddFaculty = (newFaculty: Omit<Faculty, 'id'>) => {
    const nextId = faculties.length > 0 ? Math.max(...faculties.map((f) => f.id)) + 1 : 1;
    const created = { ...newFaculty, id: nextId };
    setFaculties([...faculties, created]);
    api.createFaculty(newFaculty).catch((err) => console.error('API create faculty error:', err));
    showToast('success', 'Fakultas Ditambahkan', `${newFaculty.name} berhasil ditambahkan.`);
  };

  const handleUpdateFaculty = (updated: Faculty) => {
    setFaculties(faculties.map((f) => (f.id === updated.id ? updated : f)));
    api.updateFaculty(updated).catch((err) => console.error('API update faculty error:', err));
    showToast('success', 'Fakultas Diperbarui', `Data ${updated.name} berhasil disimpan.`);
  };

  const handleDeleteFaculty = (id: number) => {
    const target = faculties.find((f) => f.id === id);
    const hasProdis = studyPrograms.some((p) => p.facultyId === id);
    if (hasProdis) {
      showToast('error', 'Aksi Ditolak', `Fakultas "${target?.name || ''}" masih menaungi Program Studi aktif.`);
      return { success: false, message: `Fakultas "${target?.name || ''}" masih menaungi Program Studi aktif.` };
    }
    setFaculties((prev) => prev.filter((f) => f.id !== id));
    api.deleteFaculty(id).catch((err) => console.error('API delete faculty error:', err));
    showToast('success', 'Fakultas Dihapus', `${target?.name || ''} berhasil dihapus.`);
    return { success: true, message: `${target?.name || ''} berhasil dihapus.` };
  };

  const handleToggleFacultyActive = (id: number) => {
    const target = faculties.find((f) => f.id === id);
    if (!target) return;
    const updated = { ...target, isActive: !target.isActive };
    setFaculties(faculties.map((f) => (f.id === id ? updated : f)));
    api.updateFaculty(updated).catch((err) => console.error('API toggle faculty error:', err));
  };

  // Master Data Study Programs Handlers
  const handleAddStudyProgram = (newProdi: Omit<StudyProgram, 'id'>) => {
    const nextId = studyPrograms.length > 0 ? Math.max(...studyPrograms.map((p) => p.id)) + 1 : 1;
    const created = { ...newProdi, id: nextId };
    setStudyPrograms([...studyPrograms, created]);
    api.createStudyProgram(newProdi).catch((err) => console.error('API create study program error:', err));
    showToast('success', 'Program Studi Ditambahkan', `${newProdi.name} berhasil disimpan.`);
  };

  const handleUpdateStudyProgram = (updated: StudyProgram) => {
    setStudyPrograms(studyPrograms.map((p) => (p.id === updated.id ? updated : p)));
    api.updateStudyProgram(updated).catch((err) => console.error('API update study program error:', err));
    showToast('success', 'Program Studi Diperbarui', `Data ${updated.name} berhasil diperbarui.`);
  };

  const handleDeleteStudyProgram = (id: number) => {
    const target = studyPrograms.find((p) => p.id === id);
    const hasParticipants = participants.some(
      (p) => p.firstChoiceProdiId === id || p.secondChoiceProdiId === id
    );
    if (hasParticipants) {
      showToast(
        'error',
        'Aksi Ditolak',
        `Program Studi "${target?.name || ''}" sudah dipilih oleh pendaftar KIP-Kuliah.`
      );
      return { success: false, message: `Program Studi "${target?.name || ''}" sudah dipilih oleh pendaftar KIP-Kuliah.` };
    }
    setStudyPrograms((prev) => prev.filter((p) => p.id !== id));
    api.deleteStudyProgram(id).catch((err) => console.error('API delete study program error:', err));
    showToast('success', 'Program Studi Dihapus', `${target?.name || ''} berhasil dihapus.`);
    return { success: true, message: `${target?.name || ''} berhasil dihapus.` };
  };

  const handleToggleStudyProgramActive = (id: number) => {
    const target = studyPrograms.find((p) => p.id === id);
    if (!target) return;
    const updated = { ...target, isActive: !target.isActive };
    setStudyPrograms(studyPrograms.map((p) => (p.id === id ? updated : p)));
    api.updateStudyProgram(updated).catch((err) => console.error('API toggle study program error:', err));
  };

  // User / Operator Management Handlers
  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    const nextId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    const createdUser: User = {
      ...newUser,
      id: nextId
    };
    setUsers((prev) => [...prev, createdUser]);
    api.createUser(newUser).catch((err) => console.error('API create user error:', err));
    showToast(
      'success',
      'Operator Ditambahkan',
      `Akun operator "${createdUser.name}" (@${createdUser.username}) dengan role "${createdUser.role}" berhasil dibuat.`
    );
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    api.updateUser(updatedUser).catch((err) => console.error('API update user error:', err));
    showToast(
      'success',
      'Operator Diperbarui',
      `Data operator "${updatedUser.name}" (@${updatedUser.username}) telah berhasil disimpan.`
    );
  };

  const handleDeleteUser = (userId: number) => {
    const target = users.find((u) => u.id === userId);
    if (userId === 1) {
      showToast('error', 'Aksi Ditolak', 'Akun Super Admin Utama (ID 1) tidak dapat dihapus.');
      return;
    }
    if (currentUser?.id === userId) {
      showToast('error', 'Aksi Ditolak', 'Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif login.');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    api.deleteUser(userId).catch((err) => console.error('API delete user error:', err));
    showToast(
      'success',
      'Operator Dihapus',
      `Akun operator "${target?.name || ''}" (@${target?.username || ''}) telah dihapus dari sistem.`
    );
  };

  const handleToggleUserActive = (userId: number) => {
    if (userId === 1) {
      showToast('warning', 'Peringatan', 'Status Super Admin Utama tidak dapat dinonaktifkan.');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (target) {
      const nextState = !target.isActive;
      const updatedUser = { ...target, isActive: nextState };
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      api.updateUser(updatedUser).catch((err) => console.error('API toggle user error:', err));
      showToast(
        'success',
        'Status Akun Diubah',
        `Akun @${target.username} sekarang ${nextState ? 'AKTIF' : 'NONAKTIF'}.`
      );
    }
  };

  // Selection Weights & Audit Handlers
  const handleUpdateWeights = (newWeights: SelectionWeights) => {
    const oldWeightsStr = `${weights.utbkWeight}/${weights.interviewWeight}/${weights.surveyWeight}/${weights.affirmationWeight}`;
    const newWeightsStr = `${newWeights.utbkWeight}/${newWeights.interviewWeight}/${newWeights.surveyWeight}/${newWeights.affirmationWeight}`;
    setWeights(newWeights);
    api.updateWeights(newWeights).catch(err => console.error('Failed to update weights in DB:', err));
    addAuditLog({
      module: 'BOBOT_SELEKSI',
      action: 'Pembaruan Formula Bobot Seleksi',
      changedBy: currentUser?.name || 'Admin',
      role: currentUser?.role || 'Super Admin',
      oldStatus: oldWeightsStr,
      newStatus: newWeightsStr,
      details: `Penyesuaian formula: UTBK ${newWeights.utbkWeight}%, Wawancara ${newWeights.interviewWeight}%, Survey ${newWeights.surveyWeight}%, Afirmasi ${newWeights.affirmationWeight}%.`,
      severity: 'warning',
    });
    showToast('success', 'Bobot Diperbarui', 'Konfigurasi formula bobot seleksi telah diperbarui.');
  };

  // Backup & Restore Handlers
  const handleCreateBackup = (newBackup: DatabaseBackupItem) => {
    setBackups((prev) => [newBackup, ...prev]);
    addAuditLog({
      module: 'BACKUP',
      action: 'Pembuatan Snapshot Database',
      changedBy: currentUser?.name || 'Admin',
      role: currentUser?.role || 'Super Admin',
      newStatus: newBackup.filename,
      details: `Pencadangan database berhasil (${newBackup.formattedSize}, Tipe: ${newBackup.type}).`,
      severity: 'info',
    });
    showToast('success', 'Backup Berhasil', `Snapshot database "${newBackup.filename}" telah berhasil dibuat.`);
  };

  const handleDeleteBackup = (id: string) => {
    const target = backups.find((b) => b.id === id);
    setBackups((prev) => prev.filter((b) => b.id !== id));
    addAuditLog({
      module: 'BACKUP',
      action: 'Penghapusan Snapshot Database',
      changedBy: currentUser?.name || 'Admin',
      role: currentUser?.role || 'Super Admin',
      oldStatus: target?.filename || id,
      newStatus: 'DELETED',
      details: `Penghapusan berkas snapshot ${target?.filename || id}.`,
      severity: 'warning',
    });
    showToast('success', 'Backup Dihapus', 'Berkas backup telah dihapus.');
  };

  const handleRestoreBackup = (backup: DatabaseBackupItem) => {
    addAuditLog({
      module: 'BACKUP',
      action: 'Pemulihan Database (Restore Snapshot)',
      changedBy: currentUser?.name || 'Admin',
      role: currentUser?.role || 'Super Admin',
      details: `Database dipulihkan ke snapshot ${backup.filename}.`,
      severity: 'danger',
    });
    showToast('success', 'Database Dipulihkan', `Sistem berhasil dipulihkan dari snapshot "${backup.filename}".`);
  };

  const handleRestoreFromJson = (jsonData: any) => {
    if (jsonData?.data?.participants && Array.isArray(jsonData.data.participants)) {
      setParticipants(jsonData.data.participants);
    }
    if (jsonData?.data?.studyPrograms && Array.isArray(jsonData.data.studyPrograms)) {
      setStudyPrograms(jsonData.data.studyPrograms);
    }
    if (jsonData?.data?.faculties && Array.isArray(jsonData.data.faculties)) {
      setFaculties(jsonData.data.faculties);
    }
    if (jsonData?.data?.academicYears && Array.isArray(jsonData.data.academicYears)) {
      setAcademicYears(jsonData.data.academicYears);
    }
    if (jsonData?.weights) {
      setWeights(jsonData.weights);
    }
    addAuditLog({
      module: 'BACKUP',
      action: 'Pemulihan Database dari File JSON',
      changedBy: currentUser?.name || 'Admin',
      role: currentUser?.role || 'Super Admin',
      details: 'Data peserta dan konfigurasi program studi berhasil dipulihkan dari berkas ekspor JSON.',
      severity: 'danger',
    });
    showToast('success', 'Pemulihan Sukses', 'Seluruh data sistem berhasil dipulihkan dari berkas JSON.');
  };

  // Dynamic Stats computed from live participants and master data
  const dynamicStats: DashboardStats = useMemo(() => {
    const totalParticipants = participants.length;
    const documentVerificationDone = participants.filter((p) => p.documentStatus === 'Lengkap').length;
    const passed = participants.filter((p) => p.selectionStatus === 'Lulus').length;
    const failed = participants.filter((p) => p.selectionStatus === 'Tidak Lulus').length;
    const reserved = participants.filter((p) => p.selectionStatus === 'Cadangan').length;

    // Fully assessed = has scores for all 3 components
    const fullyAssessed = participants.filter(
      (p) => (p.utbkScore || 0) > 0 && (p.interviewScore || 0) > 0 && (p.surveyScore || 0) > 0
    ).length;

    // Unassessed = has 0 for any of the 3 score components
    const unassessed = participants.filter(
      (p) => (p.utbkScore || 0) === 0 || (p.interviewScore || 0) === 0 || (p.surveyScore || 0) === 0
    ).length;

    return {
      totalParticipants,
      unassessed,
      documentVerificationDone,
      fullyAssessed,
      passed,
      failed,
      reserved
    };
  }, [participants]);

  // If logged out, render the authentic Laravel Login page
  if (!currentUser) {
    return (
      <LoginView
        availableUsers={users}
        onLoginSuccess={(user) => {
          try {
            localStorage.setItem('unihaz_kipk_session_user', JSON.stringify(user));
          } catch (e) {
            console.error('Failed to save session:', e);
          }
          setCurrentUser(user);
          showToast('success', 'Login Berhasil', `Selamat datang kembali, ${user.name}!`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={() => {
          try {
            localStorage.removeItem('unihaz_kipk_session_user');
          } catch (e) {
            console.error('Failed to clear session:', e);
          }
          setCurrentUser(null);
          showToast('success', 'Logout', 'Anda telah keluar dari sesi sistem.');
        }}
        onOpenCodeExplorer={() => setIsCodeModalOpen(true)}
        onOpenTestRunner={() => setActiveTab('tests')}
        onSwitchRole={(newUser) => {
          try {
            localStorage.setItem('unihaz_kipk_session_user', JSON.stringify(newUser));
          } catch (e) {
            console.error('Failed to update session:', e);
          }
          setCurrentUser(newUser);
          showToast(
            'success',
            'Role Berubah',
            `Sesi disimulasikan sebagai ${newUser.name} (${newUser.role}). Hak akses sidebar diperbarui otomatis.`
          );
        }}
        availableUsers={users}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex flex-1">
        {/* Role-Protected Sidebar */}
        <Sidebar
          currentUser={currentUser}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeRoute={activeRoute}
          onNavigate={(route) => {
            setActiveRoute(route);
            if (activeTab !== 'dashboard') {
              setActiveTab('dashboard');
            }
          }}
          onRestrictedAttempt={handleRestrictedAttempt}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 flex flex-col min-h-[calc(100vh-4rem)]">
          {/* Active Banner / Tab Notification if inside non-dashboard */}
          <div className="p-4 sm:p-5 lg:p-6 flex-1">
            {activeTab === 'tests' ? (
              <TestRunnerView />
            ) : activeTab === 'code' ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Arsip Kode Laravel 12 - Phase 1</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Struktur database, Controller, Model, dan Service Kalkulasi</p>
                  </div>
                  <button
                    onClick={() => setIsCodeModalOpen(true)}
                    className="px-3.5 py-2 rounded-lg bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition cursor-pointer"
                  >
                    Buka File Inspector Penuh
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Seluruh file arsitektur pondasi Phase 1 (migration, model, seeder, request, controller, middleware, layout Blade, routing, dan feature tests) telah selesai dibuat sesuai standar resmi Laravel 12.
                </p>
                <div className="bg-[#0a1931] text-emerald-300 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-blue-900">
                  composer create-project laravel/laravel kip-kuliah-unihaz<br />
                  composer require spatie/laravel-permission maatwebsite/excel barryvdh/laravel-dompdf<br />
                  php artisan migrate:fresh --seed<br />
                  php artisan test --filter=SelectionCalculationTest
                </div>
              </div>
            ) : activeRoute === 'academic-years' ? (
              <AcademicYearsView
                academicYears={academicYears}
                onAdd={handleAddAcademicYear}
                onUpdate={handleUpdateAcademicYear}
                onDelete={handleDeleteAcademicYear}
                onSetActive={handleToggleAcademicYearActive}
                onAddYear={handleAddAcademicYear}
                onUpdateYear={handleUpdateAcademicYear}
                onDeleteYear={handleDeleteAcademicYear}
                onToggleActive={handleToggleAcademicYearActive}
              />
            ) : activeRoute === 'faculties' ? (
              <FacultiesView
                faculties={faculties}
                studyPrograms={studyPrograms}
                onAdd={handleAddFaculty}
                onUpdate={handleUpdateFaculty}
                onDelete={handleDeleteFaculty}
                onToggleStatus={handleToggleFacultyActive}
                onAddFaculty={handleAddFaculty}
                onUpdateFaculty={handleUpdateFaculty}
                onDeleteFaculty={handleDeleteFaculty}
                onToggleActive={handleToggleFacultyActive}
              />
            ) : activeRoute === 'study-programs' ? (
              <StudyProgramsView
                studyPrograms={studyPrograms}
                faculties={faculties}
                participants={participants}
                onAdd={handleAddStudyProgram}
                onUpdate={handleUpdateStudyProgram}
                onDelete={handleDeleteStudyProgram}
                onToggleStatus={handleToggleStudyProgramActive}
                onAddProgram={handleAddStudyProgram}
                onUpdateProgram={handleUpdateStudyProgram}
                onDeleteProgram={handleDeleteStudyProgram}
                onToggleActive={handleToggleStudyProgramActive}
              />
            ) : activeRoute === 'import' ? (
              <ImportExcelView
                existingParticipants={participants}
                studyPrograms={studyPrograms}
                academicYears={academicYears}
                onImportSuccess={handleImportSuccess}
                onCancel={() => setActiveRoute('participants')}
              />
            ) : activeRoute === 'documents' ? (
              <DocumentVerificationView
                participants={participants}
                studyPrograms={studyPrograms}
                currentUser={currentUser}
                onUpdateParticipant={handleUpdateParticipant}
              />
            ) : activeRoute === 'survey' ? (
              <SurveyEvaluationView
                participants={participants}
                studyPrograms={studyPrograms}
                currentUser={currentUser}
                onUpdateParticipant={handleUpdateParticipant}
              />
            ) : activeRoute === 'utbk' ? (
              <UtbkScoreView
                participants={participants}
                studyPrograms={studyPrograms}
                currentUser={currentUser}
                onUpdateParticipant={handleUpdateParticipant}
                onBatchUpdateParticipants={handleBatchUpdateParticipants}
              />
            ) : activeRoute === 'interview' ? (
              <InterviewScoreView
                participants={participants}
                studyPrograms={studyPrograms}
                currentUser={currentUser}
                onUpdateParticipant={handleUpdateParticipant}
              />
            ) : activeRoute === 'ranking' || activeRoute === 'results' ? (
              <RankingResultsView
                participants={participants}
                studyPrograms={studyPrograms}
                academicYears={academicYears}
                currentUser={currentUser}
                onUpdateParticipant={handleUpdateParticipant}
                onBatchUpdateParticipants={handleBatchUpdateParticipants}
                weights={weights}
                onUpdateWeights={(w) => {
                  setWeights(w);
                  showToast('success', 'Bobot Diperbarui', 'Konfigurasi formula bobot seleksi telah diperbarui.');
                }}
              />
            ) : activeRoute === 'reports' ? (
              <ReportsView
                participants={participants}
                studyPrograms={studyPrograms}
                academicYears={academicYears}
                currentUser={currentUser}
              />
            ) : activeRoute === 'operators' ? (
              currentUser.role === 'Super Admin' ? (
                <OperatorsView
                  users={users}
                  currentUser={currentUser}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onToggleUserActive={handleToggleUserActive}
                />
              ) : (
                <div className="bg-white p-8 rounded-xl border border-rose-200 text-center shadow-xs">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                  <h2 className="text-base font-bold text-slate-800">403 - Akses Terbatas (Forbidden)</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Hanya Super Admin yang berwenang mengelola akun operator seleksi KIP-Kuliah UNIHAZ.
                  </p>
                </div>
              )
            ) : activeRoute === 'audit' ? (
              currentUser.role === 'Super Admin' || currentUser.permissions.includes('view-audit-logs') || currentUser.permissions.includes('all-permissions') ? (
                <AuditLogsView
                  auditLogs={auditLogs}
                  currentUser={currentUser}
                />
              ) : (
                <div className="bg-white p-8 rounded-xl border border-rose-200 text-center shadow-xs">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                  <h2 className="text-base font-bold text-slate-800">403 - Akses Terbatas (Forbidden)</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Role "{currentUser.role}" tidak memiliki izin untuk melihat riwayat audit log sistem.
                  </p>
                </div>
              )
            ) : activeRoute === 'weights' ? (
              currentUser.role === 'Super Admin' || currentUser.permissions.includes('manage-selection-weights') || currentUser.permissions.includes('all-permissions') ? (
                <SelectionWeightsView
                  weights={weights}
                  onUpdateWeights={handleUpdateWeights}
                  participants={participants}
                  currentUser={currentUser}
                />
              ) : (
                <div className="bg-white p-8 rounded-xl border border-rose-200 text-center shadow-xs">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                  <h2 className="text-base font-bold text-slate-800">403 - Akses Terbatas (Forbidden)</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Role "{currentUser.role}" tidak memiliki izin untuk mengonfigurasi formula bobot seleksi.
                  </p>
                </div>
              )
            ) : activeRoute === 'backup' ? (
              currentUser.role === 'Super Admin' || currentUser.permissions.includes('manage-backup-restore') || currentUser.permissions.includes('all-permissions') ? (
                <BackupRestoreView
                  backups={backups}
                  participants={participants}
                  studyPrograms={studyPrograms}
                  faculties={faculties}
                  academicYears={academicYears}
                  users={users}
                  auditLogs={auditLogs}
                  weights={weights}
                  currentUser={currentUser}
                  onCreateBackup={handleCreateBackup}
                  onDeleteBackup={handleDeleteBackup}
                  onRestoreBackup={handleRestoreBackup}
                  onRestoreFromJson={handleRestoreFromJson}
                />
              ) : (
                <div className="bg-white p-8 rounded-xl border border-rose-200 text-center shadow-xs">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                  <h2 className="text-base font-bold text-slate-800">403 - Akses Terbatas (Forbidden)</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Hanya Super Admin yang diizinkan melakukan pencadangan atau pemulihan darurat database sistem.
                  </p>
                </div>
              )
            ) : activeRoute === 'participants' || activeRoute === 'export' ? (
              <ParticipantsView
                participants={participants}
                studyPrograms={studyPrograms}
                academicYears={academicYears}
                onAdd={handleAddParticipant}
                onUpdate={handleUpdateParticipant}
                onDelete={handleDeleteParticipant}
                onBatchDelete={handleBatchDeleteParticipants}
                onNavigateToImport={() => setActiveRoute('import')}
              />
            ) : (
              <DashboardView
                stats={dynamicStats}
                rankings={rankings}
                currentUser={currentUser}
                onNavigate={setActiveRoute}
                onRunRecalculate={handleRunRecalculate}
                isRecalculating={isRecalculating}
                participants={participants}
                studyPrograms={studyPrograms}
                weights={weights}
              />
            )}
          </div>

          {/* Institutional Footer */}
          <footer className="bg-white border-t border-slate-200 px-6 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              &copy; {new Date().getFullYear()} Universitas Prof. Dr. Hazairin, SH (UNIHAZ) Bengkulu. Biro Administrasi Akademik & Kemahasiswaan.
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300/60 uppercase">
                Laravel 12 + MySQL 8+
              </span>
              <span>Tahun Akademik: <strong className="text-slate-800 font-semibold">2026/2027</strong></span>
            </div>
          </footer>
        </main>
      </div>

      {/* Code Explorer Modal */}
      <CodeExplorerModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Dynamic Toast Alert Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-slideUp">
          <div
            className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-amber-900 text-white border-amber-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs">{toast.title}</div>
              <div className="text-[11px] opacity-90 mt-0.5">{toast.message}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
