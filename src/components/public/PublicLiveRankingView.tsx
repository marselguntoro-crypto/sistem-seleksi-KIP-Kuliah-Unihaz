import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Participant, StudyProgram, AcademicYear, Faculty, User, SelectionWeights } from '../../types';
import { calculateStage1Score, calculateParticipantFinalScore, getDesilAffirmationScore } from '../../utils/selectionUtils';
import {
  Award,
  Trophy,
  Search,
  Share2,
  Copy,
  Check,
  ExternalLink,
  GraduationCap,
  Building,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  XCircle,
  Printer,
  Download,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  MessageCircle,
  ChevronDown,
  Layers,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface PublicLiveRankingViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  academicYears?: AcademicYear[];
  faculties?: Faculty[];
  weights: SelectionWeights;
  currentUser: User | null;
  onBackToDashboard?: () => void;
  onGoToLogin?: () => void;
}

export type PublicRankingTab = 'STAGE1_QUOTA' | 'FINAL_RANKING';

export const PublicLiveRankingView: React.FC<PublicLiveRankingViewProps> = ({
  participants,
  studyPrograms,
  academicYears,
  faculties,
  weights,
  currentUser,
  onBackToDashboard,
  onGoToLogin
}) => {
  const activeYear = useMemo(() => academicYears?.find((y) => y.isActive) || null, [academicYears]);

  // View state
  const [activeTab, setActiveTab] = useState<PublicRankingTab>('STAGE1_QUOTA');
  const [searchTerm, setSearchTerm] = useState('');
  const [prodiFilter, setProdiFilter] = useState<string>('ALL');
  const [facultyFilter, setFacultyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [maskNisn, setMaskNisn] = useState<boolean>(true);
  const [copiedLink, setCopiedCopied] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Set initial timestamp
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastUpdated(
        now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) + ' pukul ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      );
    };
    updateTime();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      setLastUpdated(
        now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) + ' pukul ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      );
      setIsRefreshing(false);
    }, 400);
  };

  // Helper map for prodi lookup
  const prodiLookup = useMemo(() => {
    const byId = new Map<number, StudyProgram>();
    const byName = new Map<string, StudyProgram>();
    studyPrograms.forEach((sp) => {
      byId.set(sp.id, sp);
      byId.set(Number(sp.id), sp);
      const clean = sp.name.toLowerCase().trim();
      byName.set(clean, sp);
      const stripped = clean.replace(/^(s1|d3|s2)\s+/, '').trim();
      byName.set(stripped, sp);
    });
    return { byId, byName };
  }, [studyPrograms]);

  const findProdi = (id?: number, name?: string): StudyProgram | null => {
    if (id && prodiLookup.byId.has(id)) return prodiLookup.byId.get(id) || null;
    if (name) {
      const clean = name.toLowerCase().trim();
      if (prodiLookup.byName.has(clean)) return prodiLookup.byName.get(clean) || null;
      const stripped = clean.replace(/^(s1|d3|s2)\s+/, '').trim();
      if (prodiLookup.byName.has(stripped)) return prodiLookup.byName.get(stripped) || null;
    }
    return null;
  };

  // Mask NISN for public privacy (e.g. 0065137890 -> 006513****)
  const formatNisn = (nisn: string) => {
    if (!nisn) return '-';
    if (!maskNisn) return nisn;
    if (nisn.length >= 7) {
      return nisn.slice(0, 6) + '****';
    }
    return nisn;
  };

  // -------------------------------------------------------------
  // CALCULATION 1: TAHAP 1 RANKING & STUDY PROGRAM QUOTA ALLOCATION
  // -------------------------------------------------------------
  const { stage1Candidates, programStats, stage1Stats } = useMemo(() => {
    // 1. Calculate each participant's Stage 1 Score
    const evaluated = participants.map((p) => {
      const utbk = Number(p.utbkScore) || 0;
      const interview = Number(p.interviewScore) || 0;
      const isComplete =
        p.utbkScore !== undefined && p.utbkScore !== null && p.utbkScore > 0 &&
        p.interviewScore !== undefined && p.interviewScore !== null && p.interviewScore > 0;
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

    // 2. Sort: complete first, stage1Score desc, utbk desc, interview desc
    evaluated.sort((a, b) => {
      if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
      if (b.stage1Score !== a.stage1Score) return b.stage1Score - a.stage1Score;
      if (b.utbkScore !== a.utbkScore) return b.utbkScore - a.utbkScore;
      if (b.interviewScore !== a.interviewScore) return b.interviewScore - a.interviewScore;
      if (b.affirmationScore !== a.affirmationScore) return b.affirmationScore - a.affirmationScore;
      return a.participant.id - b.participant.id;
    });

    // 3. Quota allocation per program
    const filledTotal: Record<number, number> = {};
    const filledP1: Record<number, number> = {};
    const filledP2: Record<number, number> = {};
    studyPrograms.forEach((sp) => {
      filledTotal[sp.id] = 0;
      filledP1[sp.id] = 0;
      filledP2[sp.id] = 0;
    });

    const candidates = evaluated.map((item, index) => {
      const rank = index + 1;
      const p = item.participant;
      const c1 = item.choice1;
      const c2 = item.choice2;

      if (!item.isComplete) {
        return {
          ...item,
          rank,
          status: 'INCOMPLETE' as const,
          allocatedProdi: null,
          allocationReason: 'Nilai UTBK atau Wawancara belum diinput lengkap'
        };
      }

      const c1Quota = c1 ? (c1.quota ?? 0) : 0;
      const c1Filled = c1 ? (filledTotal[c1.id] || 0) : 0;

      if (c1 && c1Filled < c1Quota) {
        filledTotal[c1.id] = c1Filled + 1;
        filledP1[c1.id] = (filledP1[c1.id] || 0) + 1;
        return {
          ...item,
          rank,
          status: 'ACCEPTED_CHOICE_1' as const,
          allocatedProdi: c1,
          allocationReason: `Lolos kuota Pilihan 1: ${c1.name}`
        };
      }

      // Choice 1 full -> check Choice 2
      const c2Quota = c2 ? (c2.quota ?? 0) : 0;
      const c2Filled = c2 ? (filledTotal[c2.id] || 0) : 0;

      if (c2 && c2Filled < c2Quota) {
        filledTotal[c2.id] = c2Filled + 1;
        filledP2[c2.id] = (filledP2[c2.id] || 0) + 1;
        return {
          ...item,
          rank,
          status: 'SHIFTED_CHOICE_2' as const,
          allocatedProdi: c2,
          allocationReason: `Kuota Pilihan 1 (${c1?.name || p.firstChoiceProdiName}) penuh. Dialihkan & lolos kuota Pilihan 2: ${c2.name}`
        };
      }

      return {
        ...item,
        rank,
        status: 'NO_QUOTA' as const,
        allocatedProdi: null,
        allocationReason: `Kuota Pilihan 1 (${c1?.name || p.firstChoiceProdiName}) & Pilihan 2 (${c2?.name || '-'}) telah terpenuhi (Cadangan)`
      };
    });

    // Program stats
    const pStats = studyPrograms.map((sp) => {
      const quota = sp.quota ?? 0;
      const total = filledTotal[sp.id] || 0;
      const p1 = filledP1[sp.id] || 0;
      const p2 = filledP2[sp.id] || 0;
      const remaining = Math.max(0, quota - total);
      return {
        program: sp,
        quota,
        filledTotal: total,
        filledChoice1: p1,
        filledChoice2: p2,
        remaining,
        isFull: total >= quota && quota > 0
      };
    });

    const totalAssessed = candidates.filter((c) => c.isComplete).length;
    const totalP1 = candidates.filter((c) => c.status === 'ACCEPTED_CHOICE_1').length;
    const totalP2 = candidates.filter((c) => c.status === 'SHIFTED_CHOICE_2').length;
    const totalNoQuota = candidates.filter((c) => c.status === 'NO_QUOTA').length;
    const totalQuota = pStats.reduce((acc, s) => acc + s.quota, 0);
    const totalFilled = pStats.reduce((acc, s) => acc + s.filledTotal, 0);

    return {
      stage1Candidates: candidates,
      programStats: pStats,
      stage1Stats: {
        totalAssessed,
        totalP1,
        totalP2,
        totalNoQuota,
        totalQuota,
        totalFilled,
        totalPassed: totalP1 + totalP2
      }
    };
  }, [participants, studyPrograms, weights]);

  // -------------------------------------------------------------
  // CALCULATION 2: FINAL SELECTION RANKING
  // -------------------------------------------------------------
  const finalCandidates = useMemo(() => {
    const list = participants.map((p) => {
      const finalScore = calculateParticipantFinalScore(
        p.utbkScore || 0,
        p.interviewScore || 0,
        p.surveyScore || 0,
        p.desil,
        weights
      );
      const isComplete =
        (p.utbkScore || 0) > 0 &&
        (p.interviewScore || 0) > 0 &&
        (p.surveyScore || 0) > 0;

      const choice1 = findProdi(p.firstChoiceProdiId, p.firstChoiceProdiName);
      const choice2 = findProdi(p.secondChoiceProdiId, p.secondChoiceProdiName);

      return {
        participant: p,
        finalScore,
        isComplete,
        choice1,
        choice2,
        selectionStatus: p.selectionStatus
      };
    });

    list.sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      return a.participant.id - b.participant.id;
    });

    return list.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [participants, weights, studyPrograms]);

  // -------------------------------------------------------------
  // SEARCH RESULT: INDIVIDUAL APPLICANT RESULT CARD
  // -------------------------------------------------------------
  const matchedApplicant = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) return null;

    // Search by NISN exact/starts or full name
    return (
      stage1Candidates.find(
        (c) =>
          c.participant.nisn.toLowerCase() === trimmed ||
          c.participant.regNumber.toLowerCase() === trimmed ||
          c.participant.name.toLowerCase() === trimmed ||
          (trimmed.length >= 4 && c.participant.nisn.includes(trimmed))
      ) || null
    );
  }, [searchTerm, stage1Candidates]);

  // -------------------------------------------------------------
  // FILTERING FOR ACTIVE TAB TABLE
  // -------------------------------------------------------------
  const filteredStage1List = useMemo(() => {
    return stage1Candidates.filter((c) => {
      const p = c.participant;
      const s = searchTerm.toLowerCase().trim();

      const matchesSearch =
        s === '' ||
        p.name.toLowerCase().includes(s) ||
        p.nisn.includes(s) ||
        p.regNumber.toLowerCase().includes(s) ||
        (p.schoolOrigin && p.schoolOrigin.toLowerCase().includes(s));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'LULUS_ALL' && (c.status === 'ACCEPTED_CHOICE_1' || c.status === 'SHIFTED_CHOICE_2')) ||
        c.status === statusFilter;

      const matchesProdi =
        prodiFilter === 'ALL' ||
        c.choice1?.id === Number(prodiFilter) ||
        c.choice2?.id === Number(prodiFilter) ||
        c.allocatedProdi?.id === Number(prodiFilter);

      const matchesFaculty =
        facultyFilter === 'ALL' ||
        c.choice1?.facultyId === Number(facultyFilter) ||
        c.choice2?.facultyId === Number(facultyFilter);

      return matchesSearch && matchesStatus && matchesProdi && matchesFaculty;
    });
  }, [stage1Candidates, searchTerm, statusFilter, prodiFilter, facultyFilter]);

  const filteredFinalList = useMemo(() => {
    return finalCandidates.filter((c) => {
      const p = c.participant;
      const s = searchTerm.toLowerCase().trim();

      const matchesSearch =
        s === '' ||
        p.name.toLowerCase().includes(s) ||
        p.nisn.includes(s) ||
        p.regNumber.toLowerCase().includes(s) ||
        (p.schoolOrigin && p.schoolOrigin.toLowerCase().includes(s));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'LULUS_ALL' && (p.selectionStatus === 'Lulus' || p.selectionStatus === 'Lulus KIP DIKTI' || p.selectionStatus === 'Lulus KIP Aspirasi')) ||
        p.selectionStatus === statusFilter;

      const matchesProdi =
        prodiFilter === 'ALL' ||
        c.choice1?.id === Number(prodiFilter) ||
        c.choice2?.id === Number(prodiFilter);

      const matchesFaculty =
        facultyFilter === 'ALL' ||
        c.choice1?.facultyId === Number(facultyFilter) ||
        c.choice2?.facultyId === Number(facultyFilter);

      return matchesSearch && matchesStatus && matchesProdi && matchesFaculty;
    });
  }, [finalCandidates, searchTerm, statusFilter, prodiFilter, facultyFilter]);

  // -------------------------------------------------------------
  // SHARE LINK HANDLERS
  // -------------------------------------------------------------
  const getShareableUrl = () => {
    try {
      const origin = window.location.origin;
      const path = window.location.pathname;
      return `${origin}${path}?view=live-ranking`;
    } catch {
      return `${window.location.href}`;
    }
  };

  const handleCopyLink = () => {
    const url = getShareableUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedCopied(true);
        setTimeout(() => setCopiedCopied(false), 2500);
      });
    } else {
      setCopiedCopied(true);
      setTimeout(() => setCopiedCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const url = getShareableUrl();
    const text = encodeURIComponent(
      `*PENGUMUMAN & LIVE RANKING KIP-KULIAH UNIHAZ 2026/2027*\n` +
      `Silakan cek hasil perankingan dan penetapan kuota program studi secara live di tautan berikut:\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleExportExcel = () => {
    const data = (activeTab === 'STAGE1_QUOTA' ? filteredStage1List : filteredFinalList).map((item: any) => {
      const p = item.participant;
      if (activeTab === 'STAGE1_QUOTA') {
        let st = 'Belum Lengkap';
        if (item.status === 'ACCEPTED_CHOICE_1') st = 'Lulus Pilihan 1';
        else if (item.status === 'SHIFTED_CHOICE_2') st = 'Dialihkan ke Pilihan 2';
        else if (item.status === 'NO_QUOTA') st = 'Cadangan (Kuota Penuh)';

        return {
          'Peringkat': item.rank,
          'No Pendaftaran': p.regNumber,
          'NISN': p.nisn,
          'Nama Peserta': p.name,
          'Asal Sekolah': p.schoolOrigin,
          'Nilai UTBK': item.utbkScore,
          'Nilai Wawancara': item.interviewScore,
          'Skor Tahap 1': item.stage1Score,
          'Pilihan 1': item.choice1 ? item.choice1.name : p.firstChoiceProdiName,
          'Pilihan 2': item.choice2 ? item.choice2.name : p.secondChoiceProdiName,
          'Status Penetapan': st,
          'Prodi Diterima': item.allocatedProdi ? item.allocatedProdi.name : '-',
          'Keterangan': item.allocationReason
        };
      } else {
        return {
          'Peringkat': item.rank,
          'No Pendaftaran': p.regNumber,
          'NISN': p.nisn,
          'Nama Peserta': p.name,
          'Asal Sekolah': p.schoolOrigin,
          'Nilai Akhir Final': item.finalScore,
          'Pilihan 1': item.choice1 ? item.choice1.name : p.firstChoiceProdiName,
          'Pilihan 2': item.choice2 ? item.choice2.name : p.secondChoiceProdiName,
          'Status Kelulusan': p.selectionStatus
        };
      }
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab === 'STAGE1_QUOTA' ? 'Ranking_Tahap1' : 'Ranking_Final');
    XLSX.writeFile(wb, `Live_Ranking_KIPK_UNIHAZ_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ============================================================ */}
      {/* 1. TOP OFFICIAL HEADER & INSTITUTIONAL BRAND */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Logo & University Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 shrink-0">
              U
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  KIP-KULIAH UNIHAZ
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE UPDATE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                  T.A {activeYear?.code || '2026/2027'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Universitas Prof. Dr. Hazairin, SH &bull; Portal Pengumuman & Leaderboard Seleksi
              </p>
            </div>
          </div>

          {/* Share & Operator Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Share WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="Bagikan ke WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Copy Link Button */}
            <button
              id="btn-copy-public-ranking-link"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                copiedLink
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
              title="Salin tautan web ranking live ini"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link'}</span>
            </button>

            {/* Operator Navigation */}
            {currentUser ? (
              <button
                onClick={onBackToDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <span>Dashboard Operator</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              onGoToLogin && (
                <button
                  onClick={onGoToLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                  title="Masuk ke portal operator/panitia seleksi"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Login Panitia</span>
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO BANNER WITH LIVE TIMESTAMP */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950/40 to-slate-900 py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Transparansi Penerimaan Mahasiswa Baru KIP-Kuliah</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Pengumuman & Ranking Seleksi Real-Time
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Data pemeringkatan nilai dan penetapan kuota program studi diperbarui secara langsung 
            oleh Panitia SPMB Universitas Prof. Dr. Hazairin, SH Bengkulu.
          </p>

          {/* Real-time Update Indicator */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Terakhir diperbarui: <strong className="text-slate-200">{lastUpdated}</strong></span>
            <button
              onClick={handleRefresh}
              className={`p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ${
                isRefreshing ? 'animate-spin text-blue-400' : ''
              }`}
              title="Perbarui data terbaru"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. PARTICIPANT QUICK SEARCH / PORTAL STATUS MANDIRI */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 w-full">
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-yellow-400" />
                <span>Cek Status Kelulusan Anda</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ketik 10-digit NISN, Nomor Pendaftaran, atau Nama Lengkap untuk melihat peringkat dan status penerimaan Anda secara instan.
              </p>
            </div>

            {/* Privacy Mask Toggle */}
            <button
              onClick={() => setMaskNisn(!maskNisn)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer self-start md:self-auto"
            >
              {maskNisn ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              <span>{maskNisn ? 'Tampilkan NISN Lengkap' : 'Sensor NISN (Privasi)'}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Masukkan NISN (contoh: 0065130195) atau Nama Lengkap..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
            />
          </div>

          {/* INDIVIDUAL MATCHED RESULT CARD (IF USER TYPES SPECIFIC NAME/NISN) */}
          {matchedApplicant && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-800/80 shadow-lg space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-900/60 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                    Hasil Pencarian Peserta
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    {matchedApplicant.participant.name}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    NISN: <code className="font-mono text-yellow-300">{formatNisn(matchedApplicant.participant.nisn)}</code> &bull; No: {matchedApplicant.participant.regNumber} &bull; {matchedApplicant.participant.schoolOrigin}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Peringkat Live</span>
                    <div className="text-xl font-black text-yellow-400">
                      #{matchedApplicant.rank} <span className="text-xs font-normal text-slate-400">/ {stage1Candidates.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Status Penetapan Program Studi:</span>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {matchedApplicant.status === 'ACCEPTED_CHOICE_1' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>LULUS PILIHAN 1: {matchedApplicant.allocatedProdi?.name}</span>
                      </span>
                    )}

                    {matchedApplicant.status === 'SHIFTED_CHOICE_2' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                        <span>DIALIHKAN KE PILIHAN 2: {matchedApplicant.allocatedProdi?.name}</span>
                      </span>
                    )}

                    {matchedApplicant.status === 'NO_QUOTA' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>DAFTAR CADANGAN (Kuota Prodi Pilihan Terpenuhi)</span>
                      </span>
                    )}

                    {matchedApplicant.status === 'INCOMPLETE' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>DALAM PROSES PENILAIAN LENGKAP</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    {matchedApplicant.allocationReason}
                  </p>
                </div>

                {/* Score Pills */}
                <div className="flex items-center gap-2 shrink-0 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 min-w-16">
                    <div className="text-[10px] text-slate-400 uppercase">UTBK</div>
                    <div className="font-mono font-bold text-indigo-300 text-sm">
                      {matchedApplicant.utbkScore > 0 ? matchedApplicant.utbkScore.toFixed(1) : '-'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 min-w-16">
                    <div className="text-[10px] text-slate-400 uppercase">Wawancara</div>
                    <div className="font-mono font-bold text-yellow-300 text-sm">
                      {matchedApplicant.interviewScore > 0 ? matchedApplicant.interviewScore.toFixed(1) : '-'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-700 min-w-20">
                    <div className="text-[10px] text-blue-200 uppercase font-semibold">Skor Tahap 1</div>
                    <div className="font-mono font-black text-white text-base">
                      {matchedApplicant.isComplete ? matchedApplicant.stage1Score.toFixed(2) : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. TABS SWITCHER: TAHAP 1 & KUOTA vs RANKING FINAL */}
      {/* ============================================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 w-full">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-800/80 border border-slate-700 self-start">
            <button
              onClick={() => setActiveTab('STAGE1_QUOTA')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'STAGE1_QUOTA'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Award className="w-4 h-4 text-yellow-400" />
              <span>1. Ranking Tahap 1 & Kuota Prodi</span>
            </button>

            <button
              onClick={() => setActiveTab('FINAL_RANKING')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'FINAL_RANKING'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>2. Ranking Seleksi Final</span>
            </button>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              Total Kuota: <strong className="text-white">{stage1Stats.totalQuota}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300">
              Lulus Pil 1: <strong className="text-emerald-200">{stage1Stats.totalP1}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300">
              Dialihkan ke Pil 2: <strong className="text-amber-200">{stage1Stats.totalP2}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300">
              Cadangan: <strong className="text-rose-200">{stage1Stats.totalNoQuota}</strong>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. STUDY PROGRAM QUOTA CAPACITY LIVE GRID */}
        {/* ============================================================ */}
        {activeTab === 'STAGE1_QUOTA' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>Monitoring Kapasitas Kuota Per Program Studi</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Klik kartu prodi untuk memfilter daftar ranking
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {programStats.map((stat) => {
                const pct = stat.quota > 0 ? Math.min(100, Math.round((stat.filledTotal / stat.quota) * 100)) : 0;
                const isSelected = prodiFilter === String(stat.program.id);

                return (
                  <div
                    key={stat.program.id}
                    onClick={() => setProdiFilter(isSelected ? 'ALL' : String(stat.program.id))}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-950 border-blue-500 ring-2 ring-blue-500/30'
                        : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">
                          {stat.program.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {stat.program.facultyName || stat.program.degree}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          stat.isFull
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {stat.isFull ? 'PENUH' : `${stat.remaining} Sisa`}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${stat.quota > 0 ? (stat.filledChoice1 / stat.quota) * 100 : 0}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Pilihan 1: ${stat.filledChoice1}`}
                        />
                        <div
                          style={{ width: `${stat.quota > 0 ? (stat.filledChoice2 / stat.quota) * 100 : 0}%` }}
                          className="bg-amber-500 h-full"
                          title={`Dialihkan ke Pilihan 2: ${stat.filledChoice2}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] mt-1 text-slate-400">
                        <span>
                          Terisi: <strong className="text-white">{stat.filledTotal}</strong> / {stat.quota}
                        </span>
                        <span className="font-semibold text-slate-300">{pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. FILTER CONTROLS & EXPORT TOOLBAR */}
        {/* ============================================================ */}
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Filter Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="LULUS_ALL">Semua Yang Lulus Kuota</option>
                {activeTab === 'STAGE1_QUOTA' ? (
                  <>
                    <option value="ACCEPTED_CHOICE_1">Lulus Pilihan 1</option>
                    <option value="SHIFTED_CHOICE_2">Dialihkan ke Pilihan 2</option>
                    <option value="NO_QUOTA">Cadangan (Kuota Penuh)</option>
                    <option value="INCOMPLETE">Belum Lengkap</option>
                  </>
                ) : (
                  <>
                    <option value="Lulus">Lulus</option>
                    <option value="Lulus KIP DIKTI">Lulus KIP DIKTI</option>
                    <option value="Lulus KIP Aspirasi">Lulus KIP Aspirasi</option>
                    <option value="Cadangan">Cadangan</option>
                  </>
                )}
              </select>
            </div>

            {/* Program Studi Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Program Studi
              </label>
              <select
                value={prodiFilter}
                onChange={(e) => setProdiFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Fakultas
              </label>
              <select
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Fakultas</option>
                {(faculties && faculties.length > 0
                  ? faculties
                  : [
                      { id: 1, name: 'Fakultas Hukum' },
                      { id: 2, name: 'Fakultas Teknik' },
                      { id: 3, name: 'Fakultas Ekonomi dan Bisnis' },
                      { id: 4, name: 'Fakultas Pertanian' },
                      { id: 5, name: 'FISIP' },
                      { id: 6, name: 'FKIP' }
                    ]
                ).map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Export & Print */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleExportExcel}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Unduh data tabel ke file Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Excel</span>
              </button>

              <button
                onClick={() => window.print()}
                className="py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Cetak pengumuman ini"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 7. LEADERBOARD RANKING DATA TABLE */}
        {/* ============================================================ */}
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {activeTab === 'STAGE1_QUOTA'
                  ? 'Leaderboard Tahap 1 (UTBK & Wawancara)'
                  : 'Leaderboard Hasil Akhir Seleksi KIP-Kuliah'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                {activeTab === 'STAGE1_QUOTA' ? filteredStage1List.length : filteredFinalList.length} Peserta
              </span>
            </div>

            {activeTab === 'STAGE1_QUOTA' && (
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Formula Skor = (UTBK × {weights.utbkWeight} + Wawancara × {weights.interviewWeight}) ÷ {weights.utbkWeight + weights.interviewWeight}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Nama & Asal Sekolah</th>
                  <th className="py-3 px-3">NISN</th>
                  {activeTab === 'STAGE1_QUOTA' ? (
                    <>
                      <th className="py-3 px-3 text-center">UTBK</th>
                      <th className="py-3 px-3 text-center">Wawancara</th>
                      <th className="py-3 px-3 text-center font-bold text-white">Skor Tahap 1</th>
                      <th className="py-3 px-4">Pilihan 1</th>
                      <th className="py-3 px-4">Pilihan 2</th>
                      <th className="py-3 px-4">Status & Prodi Diterima</th>
                      <th className="py-3 px-4">Keterangan Alokasi</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-3 text-center font-bold text-white">Skor Akhir</th>
                      <th className="py-3 px-4">Pilihan 1</th>
                      <th className="py-3 px-4">Pilihan 2</th>
                      <th className="py-3 px-4">Status Kelulusan</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {activeTab === 'STAGE1_QUOTA' ? (
                  filteredStage1List.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        Tidak ada data yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStage1List.map((c) => {
                      const p = c.participant;

                      // Rank medals
                      let rankBadge = (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-slate-300 font-bold text-xs">
                          {c.rank}
                        </span>
                      );
                      if (c.rank === 1) {
                        rankBadge = (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-slate-950 font-black text-xs shadow-md">
                            🥇 1
                          </span>
                        );
                      } else if (c.rank === 2) {
                        rankBadge = (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-bold text-xs shadow-md">
                            🥈 2
                          </span>
                        );
                      } else if (c.rank === 3) {
                        rankBadge = (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs shadow-md">
                            🥉 3
                          </span>
                        );
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-750 transition-colors">
                          <td className="py-3 px-3 text-center">{rankBadge}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-xs">{p.name}</div>
                            <div className="text-[11px] text-slate-400">{p.schoolOrigin}</div>
                          </td>
                          <td className="py-3 px-3">
                            <code className="font-mono text-slate-300 text-xs">{formatNisn(p.nisn)}</code>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono text-indigo-300 font-semibold">
                              {c.utbkScore > 0 ? c.utbkScore.toFixed(1) : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono text-yellow-300 font-semibold">
                              {c.interviewScore > 0 ? c.interviewScore.toFixed(1) : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-200 border border-blue-500/40 font-mono font-bold">
                              {c.isComplete ? c.stage1Score.toFixed(2) : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-300">
                              {c.choice1 ? c.choice1.name : p.firstChoiceProdiName}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-400">
                              {c.choice2 ? c.choice2.name : (p.secondChoiceProdiName || '-')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {c.status === 'ACCEPTED_CHOICE_1' && (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Lulus Pilihan 1
                                </span>
                                <span className="text-[11px] text-emerald-300 font-medium">
                                  ↳ {c.allocatedProdi?.name}
                                </span>
                              </div>
                            )}

                            {c.status === 'SHIFTED_CHOICE_2' && (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 font-bold text-amber-400 text-xs">
                                  <ArrowLeftRight className="w-3.5 h-3.5" /> Dialihkan ke Pil 2
                                </span>
                                <span className="text-[11px] text-amber-300 font-medium">
                                  ↳ {c.allocatedProdi?.name}
                                </span>
                              </div>
                            )}

                            {c.status === 'NO_QUOTA' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-400 text-xs">
                                <XCircle className="w-3.5 h-3.5" /> Cadangan
                              </span>
                            )}

                            {c.status === 'INCOMPLETE' && (
                              <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                                <Clock className="w-3.5 h-3.5" /> Menunggu Nilai
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-[11px] text-slate-400 leading-snug">
                              {c.allocationReason}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  )
                ) : (
                  filteredFinalList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Tidak ada data yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredFinalList.map((c) => {
                      const p = c.participant;
                      return (
                        <tr key={p.id} className="hover:bg-slate-750 transition-colors">
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-slate-300">{c.rank}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-xs">{p.name}</div>
                            <div className="text-[11px] text-slate-400">{p.schoolOrigin}</div>
                          </td>
                          <td className="py-3 px-3">
                            <code className="font-mono text-slate-300 text-xs">{formatNisn(p.nisn)}</code>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 font-mono font-bold">
                              {c.finalScore.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-300">
                              {c.choice1 ? c.choice1.name : p.firstChoiceProdiName}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-400">
                              {c.choice2 ? c.choice2.name : (p.secondChoiceProdiName || '-')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200">
                              {p.selectionStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 8. PUBLIC FOOTER */}
      {/* ============================================================ */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500 space-y-2 mt-auto">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400 font-semibold">Sistem Seleksi KIP-Kuliah Terbuka UNIHAZ</span>
        </div>
        <p>
          Biro Administrasi Akademik & Kemahasiswaan &bull; Universitas Prof. Dr. Hazairin, SH &bull; Kota Bengkulu
        </p>
        <p className="text-[10px] text-slate-600">
          Link publik live ranking: <code className="text-slate-400">{getShareableUrl()}</code>
        </p>
      </footer>
    </div>
  );
};
export default PublicLiveRankingView;
