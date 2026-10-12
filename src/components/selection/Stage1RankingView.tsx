import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Participant, StudyProgram, AcademicYear, Faculty, User, SelectionWeights, SelectionStatus } from '../../types';
import { calculateStage1Score, getDesilAffirmationScore, DEFAULT_SELECTION_WEIGHTS } from '../../utils/selectionUtils';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Download,
  Settings2,
  Sparkles,
  Sliders,
  Layers,
  ChevronRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Info,
  Check,
  X,
  FileSpreadsheet,
  GraduationCap,
  Building,
  Save,
  ShieldCheck,
  Eye,
  RotateCcw
} from 'lucide-react';

export type Stage1AllocationStatus =
  | 'ACCEPTED_CHOICE_1'
  | 'SHIFTED_CHOICE_2'
  | 'NO_QUOTA'
  | 'INCOMPLETE';

export interface Stage1Candidate {
  participant: Participant;
  rank: number;
  stage1Score: number;
  utbkScore: number;
  interviewScore: number;
  isComplete: boolean;
  choice1: StudyProgram | null;
  choice2: StudyProgram | null;
  status: Stage1AllocationStatus;
  allocatedProdi: StudyProgram | null;
  allocationReason: string;
  choice1FilledAtTime: number;
  choice1Quota: number;
  choice2FilledAtTime: number;
  choice2Quota: number;
}

export interface ProgramQuotaStat {
  program: StudyProgram;
  quota: number;
  filledTotal: number;
  filledChoice1: number;
  filledChoice2: number;
  remaining: number;
  isFull: boolean;
}

interface Stage1RankingViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  academicYears?: AcademicYear[];
  faculties?: Faculty[];
  currentUser: User;
  weights: SelectionWeights;
  onUpdateParticipant: (participant: Participant) => void;
  onBatchUpdateParticipants?: (participants: Participant[], message?: string) => void;
  onNavigateToSurvey: () => void;
  onUpdateWeights?: (newWeights: SelectionWeights) => void;
}

export const Stage1RankingView: React.FC<Stage1RankingViewProps> = ({
  participants,
  studyPrograms,
  academicYears,
  faculties,
  currentUser,
  weights,
  onUpdateParticipant,
  onBatchUpdateParticipants,
  onNavigateToSurvey,
  onUpdateWeights
}) => {
  const activeYear = useMemo(() => academicYears?.find((y) => y.isActive) || null, [academicYears]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Stage1AllocationStatus>('ALL');
  const [facultyFilter, setFacultyFilter] = useState<string>('ALL');
  const [prodiFilter, setProdiFilter] = useState<string>('ALL');
  const [desilFilter, setDesilFilter] = useState<string>('ALL');
  const [onlyCompleteScores, setOnlyCompleteScores] = useState<boolean>(false);

  // Simulated Quota state (Allows tweaking quota directly to test scenarios, e.g. Hukum quota = 5)
  const [simulatedQuotas, setSimulatedQuotas] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    studyPrograms.forEach((sp) => {
      map[sp.id] = sp.quota ?? 0;
    });
    return map;
  });

  // UI Panels
  const [isQuotaDrawerOpen, setIsQuotaDrawerOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [tempWeights, setTempWeights] = useState<SelectionWeights>(weights);
  const [selectedCandidate, setSelectedCandidate] = useState<Stage1Candidate | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchApplyModalOpen, setIsBatchApplyModalOpen] = useState(false);
  const [batchActionType, setBatchActionType] = useState<'QUALIFIED_ONLY' | 'SELECTED'>('QUALIFIED_ONLY');
  const [targetStatusToApply, setTargetStatusToApply] = useState<SelectionStatus>('Lulus');
  const [isApplyingBatch, setIsApplyingBatch] = useState(false);

  // Reset simulated quotas if study programs change
  const handleResetQuotas = () => {
    const map: Record<number, number> = {};
    studyPrograms.forEach((sp) => {
      map[sp.id] = sp.quota ?? 0;
    });
    setSimulatedQuotas(map);
  };

  // Helper map for prodi lookup
  const prodiLookup = useMemo(() => {
    const byId = new Map<number, StudyProgram>();
    const byName = new Map<string, StudyProgram>();
    studyPrograms.forEach((sp) => {
      byId.set(sp.id, sp);
      byId.set(Number(sp.id), sp);
      const cleanName = sp.name.toLowerCase().trim();
      byName.set(cleanName, sp);
      // Also match without degree prefix
      const stripped = cleanName.replace(/^(s1|d3|s2)\s+/, '').trim();
      byName.set(stripped, sp);
    });
    return { byId, byName };
  }, [studyPrograms]);

  const findProdi = (id?: number, name?: string): StudyProgram | null => {
    if (id && prodiLookup.byId.has(id)) {
      return prodiLookup.byId.get(id) || null;
    }
    if (name) {
      const clean = name.toLowerCase().trim();
      if (prodiLookup.byName.has(clean)) {
        return prodiLookup.byName.get(clean) || null;
      }
      const stripped = clean.replace(/^(s1|d3|s2)\s+/, '').trim();
      if (prodiLookup.byName.has(stripped)) {
        return prodiLookup.byName.get(stripped) || null;
      }
    }
    return null;
  };

  // -------------------------------------------------------------
  // CORE RANKING & QUOTA ALLOCATION ENGINE
  // -------------------------------------------------------------
  const { rankedCandidates, programStats, overallStats } = useMemo(() => {
    // 1. Calculate each participant's Stage 1 Score
    const evaluatedList = participants.map((p) => {
      const utbk = Number(p.utbkScore) || 0;
      const interview = Number(p.interviewScore) || 0;
      const isComplete = (p.utbkScore !== undefined && p.utbkScore !== null && p.utbkScore > 0) &&
                         (p.interviewScore !== undefined && p.interviewScore !== null && p.interviewScore > 0);
      const stage1Score = calculateStage1Score(utbk, interview, weights);
      const affirmationScore = getDesilAffirmationScore(p.desil);
      const choice1 = findProdi(p.firstChoiceProdiId, p.firstChoiceProdiName);
      const choice2 = findProdi(p.secondChoiceProdiId, p.secondChoiceProdiName);

      return {
        participant: p,
        utbkScore: utbk,
        interviewScore: interview,
        isComplete,
        stage1Score,
        affirmationScore,
        choice1,
        choice2
      };
    });

    // 2. Sort candidates:
    // First by score completion (complete scores first),
    // Then by Stage 1 Score descending,
    // Then tie-breakers: UTBK score, Interview score, Desil Priority
    evaluatedList.sort((a, b) => {
      if (a.isComplete !== b.isComplete) {
        return a.isComplete ? -1 : 1;
      }
      if (b.stage1Score !== a.stage1Score) {
        return b.stage1Score - a.stage1Score;
      }
      if (b.utbkScore !== a.utbkScore) {
        return b.utbkScore - a.utbkScore;
      }
      if (b.interviewScore !== a.interviewScore) {
        return b.interviewScore - a.interviewScore;
      }
      if (b.affirmationScore !== a.affirmationScore) {
        return b.affirmationScore - a.affirmationScore;
      }
      return a.participant.id - b.participant.id;
    });

    // 3. Quota Allocation Algorithm
    // Keep track of filled quotas per study program
    const filledTotalMap: Record<number, number> = {};
    const filledChoice1Map: Record<number, number> = {};
    const filledChoice2Map: Record<number, number> = {};

    studyPrograms.forEach((sp) => {
      filledTotalMap[sp.id] = 0;
      filledChoice1Map[sp.id] = 0;
      filledChoice2Map[sp.id] = 0;
    });

    const candidates: Stage1Candidate[] = [];

    evaluatedList.forEach((item, index) => {
      const rank = index + 1;
      const p = item.participant;
      const c1 = item.choice1;
      const c2 = item.choice2;

      if (!item.isComplete) {
        candidates.push({
          participant: p,
          rank,
          stage1Score: item.stage1Score,
          utbkScore: item.utbkScore,
          interviewScore: item.interviewScore,
          isComplete: false,
          choice1: c1,
          choice2: c2,
          status: 'INCOMPLETE',
          allocatedProdi: null,
          allocationReason: 'Nilai UTBK atau Wawancara belum diinput secara lengkap.',
          choice1FilledAtTime: c1 ? (filledTotalMap[c1.id] || 0) : 0,
          choice1Quota: c1 ? (simulatedQuotas[c1.id] ?? c1.quota ?? 0) : 0,
          choice2FilledAtTime: c2 ? (filledTotalMap[c2.id] || 0) : 0,
          choice2Quota: c2 ? (simulatedQuotas[c2.id] ?? c2.quota ?? 0) : 0
        });
        return;
      }

      // Check Choice 1 Quota
      const c1Quota = c1 ? (simulatedQuotas[c1.id] ?? c1.quota ?? 0) : 0;
      const c1Filled = c1 ? (filledTotalMap[c1.id] || 0) : 0;

      if (c1 && c1Filled < c1Quota) {
        // ACCEPTED IN CHOICE 1
        const newFilled = c1Filled + 1;
        filledTotalMap[c1.id] = newFilled;
        filledChoice1Map[c1.id] = (filledChoice1Map[c1.id] || 0) + 1;

        candidates.push({
          participant: p,
          rank,
          stage1Score: item.stage1Score,
          utbkScore: item.utbkScore,
          interviewScore: item.interviewScore,
          isComplete: true,
          choice1: c1,
          choice2: c2,
          status: 'ACCEPTED_CHOICE_1',
          allocatedProdi: c1,
          allocationReason: `Lolos kuota Pilihan 1: ${c1.name} (Urutan ${newFilled} dari kuota ${c1Quota})`,
          choice1FilledAtTime: newFilled,
          choice1Quota: c1Quota,
          choice2FilledAtTime: c2 ? (filledTotalMap[c2.id] || 0) : 0,
          choice2Quota: c2 ? (simulatedQuotas[c2.id] ?? c2.quota ?? 0) : 0
        });
      } else {
        // CHOICE 1 IS FULL (OR DOES NOT EXIST)
        // Evaluate Choice 2
        const c2Quota = c2 ? (simulatedQuotas[c2.id] ?? c2.quota ?? 0) : 0;
        const c2Filled = c2 ? (filledTotalMap[c2.id] || 0) : 0;

        if (c2 && c2Filled < c2Quota) {
          // SHIFTED & ACCEPTED IN CHOICE 2!
          const newC2Filled = c2Filled + 1;
          filledTotalMap[c2.id] = newC2Filled;
          filledChoice2Map[c2.id] = (filledChoice2Map[c2.id] || 0) + 1;

          candidates.push({
            participant: p,
            rank,
            stage1Score: item.stage1Score,
            utbkScore: item.utbkScore,
            interviewScore: item.interviewScore,
            isComplete: true,
            choice1: c1,
            choice2: c2,
            status: 'SHIFTED_CHOICE_2',
            allocatedProdi: c2,
            allocationReason: `Kuota Pilihan 1 (${c1?.name || p.firstChoiceProdiName}) penuh (${c1Quota}/${c1Quota}). Dialihkan & lolos kuota Pilihan 2 (${c2.name}, Urutan ${newC2Filled}/${c2Quota})`,
            choice1FilledAtTime: c1Filled,
            choice1Quota: c1Quota,
            choice2FilledAtTime: newC2Filled,
            choice2Quota: c2Quota
          });
        } else {
          // BOTH CHOICES FULL OR NO CHOICE 2
          const reasonText = !c2
            ? `Kuota Pilihan 1 (${c1?.name || p.firstChoiceProdiName}) penuh (${c1Quota}/${c1Quota}) dan tidak memiliki Pilihan 2.`
            : `Kuota Pilihan 1 (${c1?.name || p.firstChoiceProdiName}) penuh (${c1Quota}/${c1Quota}) & Pilihan 2 (${c2.name}) juga penuh (${c2Quota}/${c2Quota}). Masuk daftar cadangan.`;

          candidates.push({
            participant: p,
            rank,
            stage1Score: item.stage1Score,
            utbkScore: item.utbkScore,
            interviewScore: item.interviewScore,
            isComplete: true,
            choice1: c1,
            choice2: c2,
            status: 'NO_QUOTA',
            allocatedProdi: null,
            allocationReason: reasonText,
            choice1FilledAtTime: c1Filled,
            choice1Quota: c1Quota,
            choice2FilledAtTime: c2Filled,
            choice2Quota: c2Quota
          });
        }
      }
    });

    // 4. Build Program Quota Statistics
    const pStats: ProgramQuotaStat[] = studyPrograms.map((sp) => {
      const quota = simulatedQuotas[sp.id] ?? sp.quota ?? 0;
      const filledTotal = filledTotalMap[sp.id] || 0;
      const filledChoice1 = filledChoice1Map[sp.id] || 0;
      const filledChoice2 = filledChoice2Map[sp.id] || 0;
      const remaining = Math.max(0, quota - filledTotal);
      const isFull = filledTotal >= quota && quota > 0;

      return {
        program: sp,
        quota,
        filledTotal,
        filledChoice1,
        filledChoice2,
        remaining,
        isFull
      };
    });

    // 5. Aggregate overall statistics
    const totalAssessed = candidates.filter((c) => c.isComplete).length;
    const totalChoice1 = candidates.filter((c) => c.status === 'ACCEPTED_CHOICE_1').length;
    const totalShifted = candidates.filter((c) => c.status === 'SHIFTED_CHOICE_2').length;
    const totalNoQuota = candidates.filter((c) => c.status === 'NO_QUOTA').length;
    const totalIncomplete = candidates.filter((c) => c.status === 'INCOMPLETE').length;
    const totalUniversityQuota = pStats.reduce((sum, s) => sum + s.quota, 0);
    const totalUniversityFilled = pStats.reduce((sum, s) => sum + s.filledTotal, 0);

    return {
      rankedCandidates: candidates,
      programStats: pStats,
      overallStats: {
        totalParticipants: candidates.length,
        totalAssessed,
        totalChoice1,
        totalShifted,
        totalNoQuota,
        totalIncomplete,
        totalUniversityQuota,
        totalUniversityFilled,
        qualifiedForSurvey: totalChoice1 + totalShifted
      }
    };
  }, [participants, studyPrograms, simulatedQuotas, weights]);

  // -------------------------------------------------------------
  // FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredCandidates = useMemo(() => {
    return rankedCandidates.filter((cand) => {
      const p = cand.participant;
      const search = searchTerm.toLowerCase().trim();

      // Search match
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(search) ||
        p.nisn.includes(search) ||
        p.regNumber.toLowerCase().includes(search) ||
        (p.schoolOrigin && p.schoolOrigin.toLowerCase().includes(search));

      // Status match
      const matchesStatus = statusFilter === 'ALL' || cand.status === statusFilter;

      // Complete scores only toggle
      const matchesComplete = !onlyCompleteScores || cand.isComplete;

      // Desil match
      const matchesDesil = desilFilter === 'ALL' || p.desil === desilFilter;

      // Faculty match
      let matchesFaculty = true;
      if (facultyFilter !== 'ALL') {
        const facId = Number(facultyFilter);
        const candFac1 = cand.choice1?.facultyId;
        const candFac2 = cand.choice2?.facultyId;
        matchesFaculty = candFac1 === facId || candFac2 === facId;
      }

      // Prodi match (matches either choice 1, choice 2, or allocated prodi)
      let matchesProdi = true;
      if (prodiFilter !== 'ALL') {
        const pId = Number(prodiFilter);
        matchesProdi =
          cand.choice1?.id === pId ||
          cand.choice2?.id === pId ||
          cand.allocatedProdi?.id === pId ||
          p.firstChoiceProdiName.toLowerCase().includes(prodiFilter.toLowerCase()) ||
          p.secondChoiceProdiName.toLowerCase().includes(prodiFilter.toLowerCase());
      }

      return matchesSearch && matchesStatus && matchesComplete && matchesDesil && matchesFaculty && matchesProdi;
    });
  }, [rankedCandidates, searchTerm, statusFilter, onlyCompleteScores, desilFilter, facultyFilter, prodiFilter]);

  // Multi-select helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCandidates.map((c) => c.participant.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // -------------------------------------------------------------
  // EXPORT TO EXCEL
  // -------------------------------------------------------------
  const handleExportExcel = () => {
    const exportData = filteredCandidates.map((c) => {
      const p = c.participant;
      let statusLabel = 'Belum Lengkap';
      if (c.status === 'ACCEPTED_CHOICE_1') statusLabel = 'Lulus Pilihan 1';
      else if (c.status === 'SHIFTED_CHOICE_2') statusLabel = 'Dialihkan ke Pilihan 2';
      else if (c.status === 'NO_QUOTA') statusLabel = 'Tidak Dapat Kuota (Cadangan)';

      return {
        'Peringkat Tahap 1': c.rank,
        'No Pendaftaran': p.regNumber,
        'NISN': p.nisn,
        'Nama Peserta': p.name,
        'Asal Sekolah': p.schoolOrigin,
        'Desil Ekonomi': p.desil,
        'Nilai UTBK': c.utbkScore,
        'Nilai Wawancara': c.interviewScore,
        'Total Nilai Tahap 1': c.stage1Score,
        'Pilihan 1': c.choice1 ? c.choice1.name : p.firstChoiceProdiName,
        'Kuota Pil 1': c.choice1Quota,
        'Pilihan 2': c.choice2 ? c.choice2.name : p.secondChoiceProdiName,
        'Kuota Pil 2': c.choice2Quota,
        'Status Penetapan Kuota': statusLabel,
        'Prodi Yang Diterima': c.allocatedProdi ? c.allocatedProdi.name : '-',
        'Fakultas Diterima': c.allocatedProdi?.facultyName || '-',
        'Keterangan & Riwayat Alokasi': c.allocationReason,
        'Kelayakan Survey Lapangan': c.status === 'ACCEPTED_CHOICE_1' || c.status === 'SHIFTED_CHOICE_2' ? 'Berhak Survey' : 'Cadangan / Pending'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    // Auto column widths
    const wscols = [
      { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 25 }, { wch: 22 },
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 24 },
      { wch: 10 }, { wch: 24 }, { wch: 10 }, { wch: 24 }, { wch: 24 },
      { wch: 24 }, { wch: 45 }, { wch: 20 }
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ranking_Tahap1_Kuota');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Hasil_Ranking_Tahap1_Kuota_Prodi_${dateStr}.xlsx`);
  };

  // -------------------------------------------------------------
  // BATCH APPLY STATUS TO DATABASE
  // -------------------------------------------------------------
  const handleBatchApplyStatus = async () => {
    if (!onBatchUpdateParticipants) return;
    setIsApplyingBatch(true);

    try {
      const candidatesToUpdate = batchActionType === 'QUALIFIED_ONLY'
        ? rankedCandidates.filter((c) => c.status === 'ACCEPTED_CHOICE_1' || c.status === 'SHIFTED_CHOICE_2')
        : rankedCandidates.filter((c) => selectedIds.includes(c.participant.id));

      if (candidatesToUpdate.length === 0) {
        setIsApplyingBatch(false);
        setIsBatchApplyModalOpen(false);
        return;
      }

      const updatedList: Participant[] = candidatesToUpdate.map((c) => {
        const notePrefix = `[Tahap 1: ${c.status === 'ACCEPTED_CHOICE_1' ? 'Lolos Pil 1' : 'Dialihkan Pil 2'} - ${c.allocatedProdi?.name || 'Prodi'}]`;
        const updatedNotes = c.participant.notes
          ? `${notePrefix} ${c.participant.notes}`
          : `${notePrefix} Nilai UTBK: ${c.utbkScore}, Wawancara: ${c.interviewScore}, Total: ${c.stage1Score}`;

        return {
          ...c.participant,
          selectionStatus: targetStatusToApply,
          notes: updatedNotes
        };
      });

      await onBatchUpdateParticipants(
        updatedList,
        `Menerapkan status kelulusan Tahap 1 untuk ${updatedList.length} peserta berdasarkan penetapan kuota prodi.`
      );

      setIsBatchApplyModalOpen(false);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error applying batch status:', err);
    } finally {
      setIsApplyingBatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. TOP HEADER BANNER */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-blue-800/40">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              <span>Alur Seleksi — Tahap 4 (Pra-Survey)</span>
              {activeYear && (
                <>
                  <span className="w-1 h-1 rounded-full bg-blue-300" />
                  <span className="text-yellow-300">{activeYear.code}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Ranking Tahap 1 & Penetapan Kuota Prodi
            </h1>
            <p className="text-blue-200/90 text-sm md:text-base max-w-3xl leading-relaxed">
              Penyaringan peserta berdasarkan akumulasi nilai <span className="text-yellow-300 font-semibold">UTBK & Wawancara</span>. 
              Sistem secara otomatis menetapkan kuota program studi dengan logika pengalihan: jika kuota Pilihan 1 telah terpenuhi, 
              peserta dialihkan ke Pilihan 2 secara transparan sebelum penugasan survey lapangan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="btn-open-quota-simulator"
              onClick={() => setIsQuotaDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800/70 hover:bg-blue-700/80 border border-blue-600/50 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg cursor-pointer backdrop-blur-sm"
              title="Atur kuota program studi untuk simulasi penerimaan"
            >
              <Settings2 className="w-4 h-4 text-cyan-300" />
              <span>Simulasi Kuota Prodi</span>
            </button>

            <button
              id="btn-export-stage1-excel"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
              title="Unduh laporan lengkap perankingan dan alokasi kuota ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              id="btn-navigate-to-survey"
              onClick={onNavigateToSurvey}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer"
              title="Lanjutkan seleksi ke Tahap 5: Survey Lapangan"
            >
              <span>Tahap 5: Survey Lapangan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weights & Formula Info Bar */}
        <div className="mt-6 pt-4 border-t border-blue-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-blue-200">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Formula Nilai Tahap 1:
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-950/60 border border-blue-700/40">
              UTBK: <strong className="text-white">{weights.utbkWeight}%</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-950/60 border border-blue-700/40">
              Wawancara: <strong className="text-white">{weights.interviewWeight}%</strong>
            </span>
            <span className="text-blue-300 italic">
              Skor Tahap 1 = ((UTBK × {weights.utbkWeight}) + (Wawancara × {weights.interviewWeight})) ÷ ({weights.utbkWeight + weights.interviewWeight})
            </span>
          </div>

          {onUpdateWeights && (
            <button
              onClick={() => {
                setTempWeights(weights);
                setIsWeightModalOpen(true);
              }}
              className="text-yellow-300 hover:text-yellow-200 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>Ubah Bobot Penilaian</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. STATS OVERVIEW CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Peserta */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Pendaftar Aktif</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {overallStats.totalParticipants}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Tahun {activeYear?.code || '2026/2027'}
            </div>
          </div>
        </div>

        {/* Nilai Lengkap */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Dinilai Lengkap</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {overallStats.totalAssessed}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              UTBK & Wawancara Ada
            </div>
          </div>
        </div>

        {/* Total Kuota Seluruh Prodi */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Kapasitas Kuota</span>
            <GraduationCap className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {overallStats.totalUniversityFilled} <span className="text-sm font-semibold text-slate-400">/ {overallStats.totalUniversityQuota}</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              {Math.max(0, overallStats.totalUniversityQuota - overallStats.totalUniversityFilled)} Kursi Tersedia
            </div>
          </div>
        </div>

        {/* Lulus Pilihan 1 */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <span>Lulus Pilihan 1</span>
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {overallStats.totalChoice1}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              Diterima di Pilihan Utama
            </div>
          </div>
        </div>

        {/* Dialihkan ke Pilihan 2 */}
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-medium">
            <span>Dialihkan ke Pil 2</span>
            <ArrowLeftRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {overallStats.totalShifted}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
              Pil 1 Penuh, Masuk Pil 2
            </div>
          </div>
        </div>

        {/* Tidak Dapat Kuota / Cadangan */}
        <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200 dark:border-rose-800/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs font-medium">
            <span>Tidak Lolos Kuota</span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
              {overallStats.totalNoQuota}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
              Masuk Daftar Cadangan
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. PROGRAM STUDI QUOTA ALLOCATION MONITOR CARDS */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Status Keterisian Kuota Program Studi</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                {studyPrograms.length} Program Studi
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik salah satu program studi di bawah untuk memfilter daftar peserta yang diterima atau memilih prodi tersebut.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pilihan 1
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Pilihan 2 (Alihan)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Sisa Kuota
            </span>
          </div>
        </div>

        {/* Grid of study program quota badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {programStats.map((stat) => {
            const pct = stat.quota > 0 ? Math.min(100, Math.round((stat.filledTotal / stat.quota) * 100)) : 0;
            const pctP1 = stat.quota > 0 ? Math.round((stat.filledChoice1 / stat.quota) * 100) : 0;
            const pctP2 = stat.quota > 0 ? Math.round((stat.filledChoice2 / stat.quota) * 100) : 0;
            const isSelected = prodiFilter === String(stat.program.id) || prodiFilter === stat.program.name;

            return (
              <div
                key={stat.program.id}
                onClick={() => setProdiFilter(isSelected ? 'ALL' : String(stat.program.id))}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {stat.program.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {stat.program.facultyName || stat.program.degree}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      stat.isFull
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : stat.filledTotal > 0
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {stat.isFull ? 'PENUH' : `${stat.remaining} Sisa`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${pctP1}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Lulus Pilihan 1: ${stat.filledChoice1} siswa`}
                    />
                    <div
                      style={{ width: `${pctP2}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title={`Dialihkan ke Pilihan 2: ${stat.filledChoice2} siswa`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-1.5 font-medium text-slate-600 dark:text-slate-400">
                    <span>
                      Terisi: <strong className="text-slate-900 dark:text-white">{stat.filledTotal}</strong> / {stat.quota}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. FILTERS & SEARCH BAR */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              id="input-search-candidate"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NISN, no reg, atau sekolah..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Penetapan Kuota Filter */}
          <div>
            <select
              id="filter-status-allocation"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Status Kuota</option>
              <option value="ACCEPTED_CHOICE_1">Lulus Pilihan 1 (Utama)</option>
              <option value="SHIFTED_CHOICE_2">Dialihkan ke Pilihan 2</option>
              <option value="NO_QUOTA">Tidak Lolos Kuota (Cadangan)</option>
              <option value="INCOMPLETE">Nilai Belum Lengkap</option>
            </select>
          </div>

          {/* Program Studi Filter */}
          <div>
            <select
              id="filter-study-program"
              value={prodiFilter}
              onChange={(e) => setProdiFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Program Studi</option>
              {studyPrograms.map((sp) => (
                <option key={sp.id} value={String(sp.id)}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fakultas Filter */}
          <div>
            <select
              id="filter-faculty"
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Fakultas</option>
              {faculties && faculties.length > 0
                ? faculties.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name}
                    </option>
                  ))
                : [
                    { id: 1, name: 'Fakultas Hukum' },
                    { id: 2, name: 'Fakultas Teknik' },
                    { id: 3, name: 'Fakultas Ekonomi dan Bisnis' },
                    { id: 4, name: 'Fakultas Pertanian' },
                    { id: 5, name: 'FISIP' },
                    { id: 6, name: 'FKIP' }
                  ].map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name}
                    </option>
                  ))}
            </select>
          </div>

          {/* Desil Filter */}
          <div>
            <select
              id="filter-desil"
              value={desilFilter}
              onChange={(e) => setDesilFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Desil</option>
              <option value="Desil 1">Desil 1</option>
              <option value="Desil 2">Desil 2</option>
              <option value="Desil 3">Desil 3</option>
              <option value="Desil 4">Desil 4</option>
              <option value="Desil 5">Desil 5</option>
              <option value="Desil 6-10">Desil 6-10</option>
              <option value="Non-Desil">Non-Desil</option>
            </select>
          </div>
        </div>

        {/* Filter Toolbar Options & Batch Selection */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyCompleteScores}
                onChange={(e) => setOnlyCompleteScores(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
              />
              <span>Hanya yang memiliki nilai lengkap</span>
            </label>

            {(searchTerm || statusFilter !== 'ALL' || prodiFilter !== 'ALL' || facultyFilter !== 'ALL' || desilFilter !== 'ALL' || onlyCompleteScores) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setProdiFilter('ALL');
                  setFacultyFilter('ALL');
                  setDesilFilter('ALL');
                  setOnlyCompleteScores(false);
                }}
                className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">
              Menampilkan <strong className="text-slate-900 dark:text-white">{filteredCandidates.length}</strong> dari {rankedCandidates.length} pendaftar
            </span>

            {onBatchUpdateParticipants && (
              <button
                id="btn-open-batch-apply"
                onClick={() => {
                  setBatchActionType('QUALIFIED_ONLY');
                  setIsBatchApplyModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Terapkan Status Tahap 1 ({overallStats.qualifiedForSurvey} Siswa Lolos)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. RANKING & ALLOCATION TABLE */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCandidates.length > 0 && selectedIds.length === filteredCandidates.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3 w-16 text-center">Peringkat</th>
                <th className="py-3 px-4">Nama & Identitas Peserta</th>
                <th className="py-3 px-3 text-center">UTBK</th>
                <th className="py-3 px-3 text-center">Wawancara</th>
                <th className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">Skor Tahap 1</th>
                <th className="py-3 px-4">Pilihan 1</th>
                <th className="py-3 px-4">Pilihan 2</th>
                <th className="py-3 px-4">Status & Prodi Diterima</th>
                <th className="py-3 px-4">Keterangan Alokasi</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-medium text-sm text-slate-600 dark:text-slate-300">
                      Tidak ada data peserta yang cocok dengan filter yang dipilih
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau reset filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const p = cand.participant;
                  const isSelected = selectedIds.includes(p.id);

                  // Rank Badge styling
                  let rankBadge = (
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                      {cand.rank}
                    </span>
                  );

                  if (cand.rank === 1) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-yellow-950 font-black text-xs shadow-sm ring-2 ring-yellow-400/30">
                        🥇 1
                      </span>
                    );
                  } else if (cand.rank === 2) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs shadow-sm">
                        🥈 2
                      </span>
                    );
                  } else if (cand.rank === 3) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs shadow-sm">
                        🥉 3
                      </span>
                    );
                  }

                  // Allocation Badge styling
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Belum Lengkap</span>
                    </span>
                  );

                  if (cand.status === 'ACCEPTED_CHOICE_1') {
                    statusBadge = (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-700/50">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Lulus Pilihan 1</span>
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 px-1">
                          ↳ {cand.allocatedProdi?.name}
                        </span>
                      </div>
                    );
                  } else if (cand.status === 'SHIFTED_CHOICE_2') {
                    statusBadge = (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/50 dark:border-amber-700/50">
                          <ArrowLeftRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Dialihkan ke Pil 2</span>
                        </span>
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 px-1">
                          ↳ {cand.allocatedProdi?.name}
                        </span>
                      </div>
                    );
                  } else if (cand.status === 'NO_QUOTA') {
                    statusBadge = (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300/50 dark:border-rose-700/50">
                          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Tidak Lolos Kuota</span>
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 px-1">
                          (Daftar Cadangan)
                        </span>
                      </div>
                    );
                  }

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Rank */}
                      <td className="py-3 px-3 text-center">
                        {rankBadge}
                      </td>

                      {/* Name & Identity */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.desil && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {p.desil}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>NISN: <code className="font-mono">{p.nisn}</code></span>
                          <span>•</span>
                          <span>{p.schoolOrigin}</span>
                        </div>
                      </td>

                      {/* UTBK Score */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          cand.utbkScore > 0
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'text-slate-400'
                        }`}>
                          {cand.utbkScore > 0 ? cand.utbkScore.toFixed(1) : '-'}
                        </span>
                      </td>

                      {/* Interview Score */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          cand.interviewScore > 0
                            ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300'
                            : 'text-slate-400'
                        }`}>
                          {cand.interviewScore > 0 ? cand.interviewScore.toFixed(1) : '-'}
                        </span>
                      </td>

                      {/* Total Stage 1 Score */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                          cand.isComplete
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}>
                          {cand.isComplete ? cand.stage1Score.toFixed(2) : '-'}
                        </span>
                      </td>

                      {/* Choice 1 */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {cand.choice1 ? cand.choice1.name : p.firstChoiceProdiName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>Kuota: {cand.choice1Quota}</span>
                          {cand.status === 'ACCEPTED_CHOICE_1' && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Masuk (slot #{cand.choice1FilledAtTime})</span>
                          )}
                          {cand.status === 'SHIFTED_CHOICE_2' && (
                            <span className="text-rose-500 font-semibold">• Penuh</span>
                          )}
                        </div>
                      </td>

                      {/* Choice 2 */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {cand.choice2 ? cand.choice2.name : (p.secondChoiceProdiName || '-')}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>Kuota: {cand.choice2Quota}</span>
                          {cand.status === 'SHIFTED_CHOICE_2' && (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">• Masuk (slot #{cand.choice2FilledAtTime})</span>
                          )}
                          {cand.status === 'NO_QUOTA' && cand.choice2 && (
                            <span className="text-rose-500 font-semibold">• Penuh</span>
                          )}
                        </div>
                      </td>

                      {/* Status Penetapan & Prodi Diterima */}
                      <td className="py-3 px-4">
                        {statusBadge}
                      </td>

                      {/* Explanation note */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          {cand.allocationReason}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedCandidate(cand)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="Lihat rincian kalkulasi dan alokasi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. MODAL: DETAIL CANDIDATE BREAKDOWN */}
      {/* ============================================================ */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Detail Alokasi Tahap 1
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Peringkat #{selectedCandidate.rank} — {selectedCandidate.participant.regNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Identity */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl space-y-1 text-xs">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedCandidate.participant.name}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                NISN: <code className="font-mono text-slate-800 dark:text-slate-200">{selectedCandidate.participant.nisn}</code> • Asal: {selectedCandidate.participant.schoolOrigin}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Kategori Ekonomi: <strong className="text-slate-800 dark:text-slate-200">{selectedCandidate.participant.desil || 'Non-Desil'}</strong>
              </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Nilai UTBK</div>
                <div className="text-lg font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  {selectedCandidate.utbkScore.toFixed(1)}
                </div>
                <div className="text-[10px] text-indigo-500/80 mt-0.5">Bobot: {weights.utbkWeight}%</div>
              </div>

              <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-100 dark:border-yellow-900/40">
                <div className="text-[10px] uppercase font-bold text-yellow-700 dark:text-yellow-400">Wawancara</div>
                <div className="text-lg font-black text-yellow-800 dark:text-yellow-300 mt-1">
                  {selectedCandidate.interviewScore.toFixed(1)}
                </div>
                <div className="text-[10px] text-yellow-600/80 mt-0.5">Bobot: {weights.interviewWeight}%</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Total Tahap 1</div>
                <div className="text-lg font-black text-blue-700 dark:text-blue-300 mt-1">
                  {selectedCandidate.stage1Score.toFixed(2)}
                </div>
                <div className="text-[10px] text-blue-500/80 mt-0.5">100 Poin Maks</div>
              </div>
            </div>

            {/* Path Alokasi & Status Kuota */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Riwayat Evaluasi Kuota:</h4>
              
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-slate-400">1. Pilihan Pertama:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {selectedCandidate.choice1 ? selectedCandidate.choice1.name : selectedCandidate.participant.firstChoiceProdiName}
                  </strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Kapasitas kuota prodi: {selectedCandidate.choice1Quota} kursi
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-slate-400">2. Pilihan Kedua:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {selectedCandidate.choice2 ? selectedCandidate.choice2.name : (selectedCandidate.participant.secondChoiceProdiName || '-')}
                  </strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Kapasitas kuota prodi: {selectedCandidate.choice2Quota} kursi
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Kesimpulan Penetapan:</span>
                </div>
                <p className="text-xs leading-relaxed">
                  {selectedCandidate.allocationReason}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. DRAWER: QUOTA SIMULATOR & ADJUSTMENT */}
      {/* ============================================================ */}
      {isQuotaDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 h-full max-w-md w-full border-l border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Simulasi Kuota Program Studi
                  </h3>
                </div>
                <button
                  onClick={() => setIsQuotaDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                Ubah nilai kuota di bawah ini untuk melihat simulasi dinamis perankingan dan pengalihan kuota 
                antara Pilihan 1 dan Pilihan 2 secara langsung secara real-time.
              </div>

              <div className="space-y-3">
                {studyPrograms.map((sp) => {
                  const currentVal = simulatedQuotas[sp.id] ?? sp.quota ?? 0;
                  return (
                    <div
                      key={sp.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {sp.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {sp.facultyName || sp.degree} • Standar Master: {sp.quota}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 text-[11px]">Kuota:</span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={currentVal}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setSimulatedQuotas((prev) => ({ ...prev, [sp.id]: val }));
                          }}
                          className="w-16 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={handleResetQuotas}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Master Data</span>
              </button>

              <button
                onClick={() => setIsQuotaDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. MODAL: BATCH APPLY STATUS TO DATABASE */}
      {/* ============================================================ */}
      {isBatchApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Terapkan Status Tahap 1
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perbarui status pendaftar ke basis data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchApplyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Peserta yang Diperbarui:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="batchTarget"
                      checked={batchActionType === 'QUALIFIED_ONLY'}
                      onChange={() => setBatchActionType('QUALIFIED_ONLY')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Seluruh Peserta yang Lolos Kuota ({overallStats.qualifiedForSurvey} siswa)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {overallStats.totalChoice1} Lolos Pil 1 + {overallStats.totalShifted} Dialihkan ke Pil 2
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="batchTarget"
                      disabled={selectedIds.length === 0}
                      checked={batchActionType === 'SELECTED'}
                      onChange={() => setBatchActionType('SELECTED')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className={`font-bold ${selectedIds.length === 0 ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        Hanya Peserta yang Dicentang ({selectedIds.length} siswa)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Pilih peserta melalui tabel utama sebelum mengaktifkan opsi ini
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Tetapkan Status Kelulusan Menjadi:
                </label>
                <select
                  value={targetStatusToApply}
                  onChange={(e) => setTargetStatusToApply(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                >
                  <option value="Lulus">Lulus (Lolos Seleksi Tahap 1)</option>
                  <option value="Lulus KIP DIKTI">Lulus KIP DIKTI</option>
                  <option value="Lulus KIP Aspirasi">Lulus KIP Aspirasi</option>
                  <option value="Cadangan">Cadangan</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                Tindakan ini akan memperbarui status pendaftar dan mencatat riwayat alokasi prodi ke dalam catatan pendaftar dan log audit seleksi.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsBatchApplyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={isApplyingBatch}
                onClick={handleBatchApplyStatus}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isApplyingBatch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isApplyingBatch ? 'Menyimpan...' : 'Terapkan Status'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. MODAL: WEIGHT SETTINGS */}
      {/* ============================================================ */}
      {isWeightModalOpen && onUpdateWeights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-yellow-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bobot Penilaian Tahap 1
                </h3>
              </div>
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>Bobot Nilai UTBK:</span>
                  <span className="font-bold text-blue-600">{tempWeights.utbkWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={tempWeights.utbkWeight}
                  onChange={(e) => setTempWeights((prev) => ({ ...prev, utbkWeight: parseInt(e.target.value, 10) }))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                  <span>Bobot Nilai Wawancara:</span>
                  <span className="font-bold text-yellow-600">{tempWeights.interviewWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={tempWeights.interviewWeight}
                  onChange={(e) => setTempWeights((prev) => ({ ...prev, interviewWeight: parseInt(e.target.value, 10) }))}
                  className="w-full accent-yellow-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px]">
                Total bobot kombinasi Tahap 1 = {tempWeights.utbkWeight + tempWeights.interviewWeight}%. 
                Nilai akhir Tahap 1 dinormalisasi secara proporsional.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onUpdateWeights(tempWeights);
                  setIsWeightModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Terapkan Bobot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Stage1RankingView;
