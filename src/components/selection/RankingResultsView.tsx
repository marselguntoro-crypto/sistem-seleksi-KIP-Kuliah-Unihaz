import React, { useState, useMemo } from 'react';
import { Participant, StudyProgram, AcademicYear, Faculty, User, SelectionWeights } from '../../types';
import {
  calculateParticipantFinalScore,
  calculateStage1Score,
  getDesilAffirmationScore,
  DEFAULT_SELECTION_WEIGHTS
} from '../../utils/selectionUtils';
import {
  Trophy,
  Sliders,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Save,
  Building,
  GraduationCap,
  Users,
  Check,
  X,
  Layers,
  ArrowUpDown,
  MapPin,
  FileText,
  Tag
} from 'lucide-react';

interface RankingResultsViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  academicYears: AcademicYear[];
  faculties?: Faculty[];
  currentUser: User;
  onUpdateParticipant: (participant: Participant) => void;
  onBatchUpdateParticipants: (participants: Participant[]) => void;
  weights: SelectionWeights;
  onUpdateWeights: (newWeights: SelectionWeights) => void;
}

export const RankingResultsView: React.FC<RankingResultsViewProps> = ({
  participants,
  studyPrograms,
  academicYears,
  faculties,
  currentUser,
  onUpdateParticipant,
  onBatchUpdateParticipants,
  weights,
  onUpdateWeights
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState<string>('ALL');
  const [firstChoiceProdiFilter, setFirstChoiceProdiFilter] = useState<string>('ALL');
  const [secondChoiceProdiFilter, setSecondChoiceProdiFilter] = useState<string>('ALL');
  const [desilFilter, setDesilFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [surveyFilterState, setSurveyFilterState] = useState<'ALL' | 'SURVEYED' | 'UNSURVEYED'>('ALL');
  const [rankingMode, setRankingMode] = useState<'FINAL' | 'STAGE1'>('FINAL');

  // Weight configuration panel open/close
  const [isWeightsOpen, setIsWeightsOpen] = useState(false);
  const [tempWeights, setTempWeights] = useState<SelectionWeights>(weights);

  // Total weight check
  const totalWeight =
    tempWeights.utbkWeight +
    tempWeights.interviewWeight +
    tempWeights.surveyWeight +
    tempWeights.affirmationWeight;

  // Normalized faculty list
  const facultyList = useMemo(() => {
    if (faculties && faculties.length > 0) return faculties;
    // Derive unique faculties from study programs if not provided
    const map = new Map<number, { id: number; name: string; code: string }>();
    studyPrograms.forEach((sp) => {
      if (sp.facultyId && sp.facultyName) {
        map.set(sp.facultyId, {
          id: sp.facultyId,
          name: sp.facultyName,
          code: `F-${sp.facultyId}`
        });
      }
    });
    return Array.from(map.values()).map((f) => ({
      ...f,
      dean: '',
      isActive: true
    }));
  }, [faculties, studyPrograms]);

  // Available study programs conditioned by selected faculty
  const availableStudyPrograms = useMemo(() => {
    if (facultyFilter === 'ALL') {
      return studyPrograms;
    }
    return studyPrograms.filter(
      (sp) =>
        String(sp.facultyId) === facultyFilter ||
        sp.facultyName?.toLowerCase() === facultyFilter.toLowerCase()
    );
  }, [studyPrograms, facultyFilter]);

  // Handle Faculty Filter Change
  const handleFacultyFilterChange = (newFacultyVal: string) => {
    setFacultyFilter(newFacultyVal);
    if (newFacultyVal !== 'ALL') {
      // Check if current firstChoiceProdiFilter still belongs to the newly chosen faculty
      const stillBelongs = studyPrograms.some(
        (sp) =>
          (String(sp.id) === firstChoiceProdiFilter || sp.name === firstChoiceProdiFilter) &&
          (String(sp.facultyId) === newFacultyVal || sp.facultyName === newFacultyVal)
      );
      if (!stillBelongs) {
        setFirstChoiceProdiFilter('ALL');
      }
    }
  };

  // Helper map for fast lookup of prodi by ID or Name
  const prodiLookup = useMemo(() => {
    const byId = new Map<number, StudyProgram>();
    const byName = new Map<string, StudyProgram>();
    studyPrograms.forEach((sp) => {
      byId.set(sp.id, sp);
      byName.set(sp.name.toLowerCase().trim(), sp);
    });
    return { byId, byName };
  }, [studyPrograms]);

  // Calculate live ranking
  const rankedParticipants = useMemo(() => {
    // 1. Calculate each participant's stage1Score and finalScore using current weights
    const scoredList = participants.map((p) => {
      const stage1Score = calculateStage1Score(
        p.utbkScore || 0,
        p.interviewScore || 0,
        weights
      );
      const finalScore = calculateParticipantFinalScore(
        p.utbkScore || 0,
        p.interviewScore || 0,
        p.surveyScore || 0,
        p.desil,
        weights
      );
      const affirmationScore = getDesilAffirmationScore(p.desil);
      const isSurveyed = (p.surveyScore || 0) > 0;
      const isStage1Complete = (p.utbkScore || 0) > 0 && (p.interviewScore || 0) > 0;

      return {
        ...p,
        stage1Score,
        finalScore,
        affirmationScore,
        isSurveyed,
        isStage1Complete
      };
    });

    // 2. Sort according to active ranking mode
    if (rankingMode === 'STAGE1') {
      scoredList.sort((a, b) => (b.stage1Score || 0) - (a.stage1Score || 0));
    } else {
      scoredList.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    }

    // 3. Assign overall rank
    return scoredList.map((p, index) => ({
      ...p,
      rank: index + 1
    }));
  }, [participants, weights, rankingMode]);

  // Filtered participants by search, faculty, prodi 1 & 2, desil, survey status, and selection status
  const filteredParticipants = useMemo(() => {
    return rankedParticipants.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nik.includes(searchTerm);

      // Find participant's primary study program details
      const prodiObj1 =
        prodiLookup.byId.get(p.firstChoiceProdiId) ||
        prodiLookup.byName.get(p.firstChoiceProdiName.toLowerCase().trim());

      const participantFacultyId = prodiObj1?.facultyId;
      const participantFacultyName = prodiObj1?.facultyName;

      const matchesFaculty =
        facultyFilter === 'ALL' ||
        (participantFacultyId !== undefined && String(participantFacultyId) === facultyFilter) ||
        (participantFacultyName !== undefined && participantFacultyName === facultyFilter);

      const matchesProdi1 =
        firstChoiceProdiFilter === 'ALL' ||
        String(p.firstChoiceProdiId) === firstChoiceProdiFilter ||
        p.firstChoiceProdiName.toLowerCase().trim() === firstChoiceProdiFilter.toLowerCase().trim() ||
        (prodiObj1 && (String(prodiObj1.id) === firstChoiceProdiFilter || prodiObj1.name.toLowerCase().trim() === firstChoiceProdiFilter.toLowerCase().trim()));

      const prodiObj2 =
        prodiLookup.byId.get(p.secondChoiceProdiId) ||
        prodiLookup.byName.get((p.secondChoiceProdiName || '').toLowerCase().trim());

      const matchesProdi2 =
        secondChoiceProdiFilter === 'ALL' ||
        String(p.secondChoiceProdiId) === secondChoiceProdiFilter ||
        Boolean(p.secondChoiceProdiName && p.secondChoiceProdiName.toLowerCase().trim() === secondChoiceProdiFilter.toLowerCase().trim()) ||
        Boolean(prodiObj2 && (String(prodiObj2.id) === secondChoiceProdiFilter || prodiObj2.name.toLowerCase().trim() === secondChoiceProdiFilter.toLowerCase().trim()));

      const matchesDesil =
        desilFilter === 'ALL' ||
        p.desil === desilFilter;

      const matchesStatus =
        statusFilter === 'ALL' || p.selectionStatus === statusFilter;

      const matchesSurvey =
        surveyFilterState === 'ALL' ||
        (surveyFilterState === 'SURVEYED' && p.isSurveyed) ||
        (surveyFilterState === 'UNSURVEYED' && !p.isSurveyed);

      return (
        matchesSearch &&
        matchesFaculty &&
        matchesProdi1 &&
        matchesProdi2 &&
        matchesDesil &&
        matchesStatus &&
        matchesSurvey
      );
    });
  }, [
    rankedParticipants,
    searchTerm,
    facultyFilter,
    firstChoiceProdiFilter,
    secondChoiceProdiFilter,
    desilFilter,
    statusFilter,
    surveyFilterState,
    prodiLookup
  ]);

  // Quota allocation summary per study program
  const quotaSummary = useMemo(() => {
    return studyPrograms.map((prodi) => {
      const prodiApplicants = rankedParticipants.filter(
        (p) =>
          p.firstChoiceProdiId === prodi.id ||
          p.firstChoiceProdiName.toLowerCase().trim() === prodi.name.toLowerCase().trim()
      );
      const passedCount = prodiApplicants.filter((p) => p.selectionStatus === 'Lulus').length;
      const reservedCount = prodiApplicants.filter((p) => p.selectionStatus === 'Cadangan').length;
      const failedCount = prodiApplicants.filter((p) => p.selectionStatus === 'Tidak Lulus').length;
      const unassessedCount = prodiApplicants.filter((p) => p.selectionStatus === 'Belum Diproses').length;
      const remainingQuota = Math.max(0, prodi.quota - passedCount);

      return {
        prodi,
        totalApplicants: prodiApplicants.length,
        quota: prodi.quota,
        passedCount,
        reservedCount,
        failedCount,
        unassessedCount,
        remainingQuota
      };
    });
  }, [studyPrograms, rankedParticipants]);

  // Filtered Quota Summary according to selected faculty and prodi
  const filteredQuotaSummary = useMemo(() => {
    return quotaSummary.filter((q) => {
      const matchFaculty =
        facultyFilter === 'ALL' ||
        String(q.prodi.facultyId) === facultyFilter ||
        q.prodi.facultyName === facultyFilter;
      const matchProdi =
        firstChoiceProdiFilter === 'ALL' ||
        String(q.prodi.id) === firstChoiceProdiFilter ||
        q.prodi.name === firstChoiceProdiFilter;
      return matchFaculty && matchProdi;
    });
  }, [quotaSummary, facultyFilter, firstChoiceProdiFilter]);

  // Aggregate stats for the current view/filter for monitoring graduation
  const monitoringStats = useMemo(() => {
    const totalApplicants = filteredParticipants.length;
    const passedCount = filteredParticipants.filter((p) => p.selectionStatus === 'Lulus').length;
    const reservedCount = filteredParticipants.filter((p) => p.selectionStatus === 'Cadangan').length;
    const failedCount = filteredParticipants.filter((p) => p.selectionStatus === 'Tidak Lulus').length;
    const unassessedCount = filteredParticipants.filter((p) => p.selectionStatus === 'Belum Diproses').length;

    const totalQuota = filteredQuotaSummary.reduce((acc, q) => acc + q.quota, 0);
    const fillRate = totalQuota > 0 ? Math.round((passedCount / totalQuota) * 100) : 0;
    const remainingQuota = Math.max(0, totalQuota - passedCount);

    const activeFacultyName =
      facultyFilter === 'ALL'
        ? 'Semua Fakultas'
        : facultyList.find((f) => String(f.id) === facultyFilter || f.name === facultyFilter)?.name ||
          'Fakultas Terpilih';

    const activeProdi1Name =
      firstChoiceProdiFilter === 'ALL'
        ? 'Semua Pilihan 1'
        : studyPrograms.find((sp) => String(sp.id) === firstChoiceProdiFilter || sp.name === firstChoiceProdiFilter)?.name ||
          firstChoiceProdiFilter;

    const activeProdi2Name =
      secondChoiceProdiFilter === 'ALL'
        ? 'Semua Pilihan 2'
        : studyPrograms.find((sp) => String(sp.id) === secondChoiceProdiFilter || sp.name === secondChoiceProdiFilter)?.name ||
          secondChoiceProdiFilter;

    return {
      totalApplicants,
      totalQuota,
      passedCount,
      reservedCount,
      failedCount,
      unassessedCount,
      fillRate,
      remainingQuota,
      activeFacultyName,
      activeProdi1Name,
      activeProdi2Name
    };
  }, [
    filteredParticipants,
    filteredQuotaSummary,
    facultyFilter,
    firstChoiceProdiFilter,
    secondChoiceProdiFilter,
    facultyList,
    studyPrograms
  ]);

  // Handle Save Weights
  const handleSaveWeights = () => {
    if (totalWeight !== 100) return;
    onUpdateWeights(tempWeights);
    setIsWeightsOpen(false);
  };

  // Auto-Assign results based on Study Program Quotas
  const handleAutoAssignResults = () => {
    const updatedList: Participant[] = [];

    studyPrograms.forEach((prodi) => {
      // Get all applicants whose 1st choice is this prodi
      const prodiApplicants = rankedParticipants.filter(
        (p) =>
          p.firstChoiceProdiId === prodi.id ||
          p.firstChoiceProdiName.toLowerCase().trim() === prodi.name.toLowerCase().trim()
      );

      // Sort by finalScore desc
      prodiApplicants.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

      const quota = prodi.quota;
      const reserveQuota = Math.max(2, Math.round(quota * 0.25)); // 25% reserve pool

      prodiApplicants.forEach((applicant, idx) => {
        let newStatus: Participant['selectionStatus'] = 'Tidak Lulus';

        if (idx < quota && (applicant.finalScore || 0) >= 60) {
          newStatus = 'Lulus';
        } else if (idx < quota + reserveQuota && (applicant.finalScore || 0) >= 50) {
          newStatus = 'Cadangan';
        } else {
          newStatus = 'Tidak Lulus';
        }

        updatedList.push({
          ...applicant,
          selectionStatus: newStatus,
          updatedAt: new Date().toISOString()
        });
      });
    });

    // Also include any applicants whose prodi wasn't found
    const updatedIds = new Set(updatedList.map((p) => p.id));
    rankedParticipants.forEach((p) => {
      if (!updatedIds.has(p.id)) {
        updatedList.push(p);
      }
    });

    onBatchUpdateParticipants(updatedList);
  };

  // Manual status change
  const handleSetIndividualStatus = (p: Participant, newStatus: Participant['selectionStatus']) => {
    const updated: Participant = {
      ...p,
      selectionStatus: newStatus,
      updatedAt: new Date().toISOString()
    };
    onUpdateParticipant(updated);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFacultyFilter('ALL');
    setFirstChoiceProdiFilter('ALL');
    setSecondChoiceProdiFilter('ALL');
    setDesilFilter('ALL');
    setStatusFilter('ALL');
    setSurveyFilterState('ALL');
  };

  const isFilterActive =
    searchTerm !== '' ||
    facultyFilter !== 'ALL' ||
    firstChoiceProdiFilter !== 'ALL' ||
    secondChoiceProdiFilter !== 'ALL' ||
    desilFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    surveyFilterState !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-yellow-100 text-yellow-900 rounded-lg">
            <Trophy className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Keluaran Hasil Final: Ranking Seleksi KIP-Kuliah
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-900 border border-yellow-300">
                Penetapan Hasil Akhir
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Hasil akumulasi lengkap dari Pemberkasan (Tahap 1), Seleksi Tahap Pertama (Nilai UTBK & Wawancara), Penilaian Survey Lapangan Dinamis (Tahap Akhir), serta Afirmasi Desil P3KE.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-weights-panel-btn"
            onClick={() => setIsWeightsOpen(!isWeightsOpen)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            Konfigurasi Bobot ({weights.utbkWeight}% / {weights.interviewWeight}% / {weights.surveyWeight}% / {weights.affirmationWeight}%)
          </button>

          <button
            id="auto-assign-quota-btn"
            onClick={handleAutoAssignResults}
            className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Tetapkan Otomatis Berdasarkan Kuota
          </button>
        </div>
      </div>

      {/* Mode Seleksi & Penjelasan Survey Dinamis */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-950 text-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-blue-950 uppercase tracking-wider">
              Alur Penilaian Dinamis
            </span>
            <h2 className="text-sm font-bold text-slate-100">
              {rankingMode === 'FINAL'
                ? 'Peringkat Final Terpadu (Akumulasi Lengkap Tahap 1 s/d Survey Dinamis)'
                : 'Peringkat Seleksi Tahap 1 (Akademik UTBK & Wawancara)'}
            </h2>
          </div>
          <p className="text-xs text-blue-100/80 leading-relaxed max-w-3xl">
            {rankingMode === 'FINAL'
              ? 'Keluaran hasil final ini menggabungkan seluruh komponen: nilai seleksi tahap pertama (UTBK & Wawancara), afirmasi desil, serta survey lapangan faktual yang ditambahkan secara dinamis sebagai tahap akhir.'
              : 'Menampilkan ranking berdasarkan nilai seleksi tahap pertama (UTBK & Wawancara) sebelum penilaian survey lapangan dinamis ditambahkan.'}
          </p>
        </div>

        {/* Ranking Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg shrink-0 border border-white/15">
          <button
            type="button"
            onClick={() => setRankingMode('FINAL')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              rankingMode === 'FINAL'
                ? 'bg-yellow-400 text-blue-950 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Peringkat Final (Lengkap)
          </button>
          <button
            type="button"
            onClick={() => setRankingMode('STAGE1')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              rankingMode === 'STAGE1'
                ? 'bg-yellow-400 text-blue-950 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Seleksi Tahap 1 (UTBK & Wwn)
          </button>
        </div>
      </div>

      {/* Weight Configuration Collapsible Panel */}
      {isWeightsOpen && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 shadow-xs transition-all space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-900" />
              <h3 className="font-bold text-sm text-blue-950">
                Pengaturan Formula Pembobotan Seleksi KIP-Kuliah UNIHAZ
              </h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                totalWeight === 100
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              Total Bobot: {totalWeight}% {totalWeight !== 100 && '(Wajib 100%)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* UTBK Weight */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-700">1. Bobot UTBK / TPA</span>
                <span className="font-bold text-indigo-900 text-sm">{tempWeights.utbkWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={tempWeights.utbkWeight}
                onChange={(e) =>
                  setTempWeights({ ...tempWeights, utbkWeight: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-700"
              />
              <p className="text-[10px] text-slate-500 mt-1">Evaluasi kemampuan akademik dasar.</p>
            </div>

            {/* Interview Weight */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-700">2. Bobot Wawancara</span>
                <span className="font-bold text-amber-900 text-sm">{tempWeights.interviewWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={tempWeights.interviewWeight}
                onChange={(e) =>
                  setTempWeights({ ...tempWeights, interviewWeight: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
              />
              <p className="text-[10px] text-slate-500 mt-1">Motivasi & komitmen studi calon mhs.</p>
            </div>

            {/* Survey Weight */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-700">3. Bobot Survey Lapangan</span>
                <span className="font-bold text-cyan-900 text-sm">{tempWeights.surveyWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={tempWeights.surveyWeight}
                onChange={(e) =>
                  setTempWeights({ ...tempWeights, surveyWeight: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-700"
              />
              <p className="text-[10px] text-slate-500 mt-1">Verifikasi fakta fisik tempat tinggal.</p>
            </div>

            {/* Affirmation / Desil Weight */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-700">4. Afirmasi Desil P3KE</span>
                <span className="font-bold text-emerald-900 text-sm">{tempWeights.affirmationWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={tempWeights.affirmationWeight}
                onChange={(e) =>
                  setTempWeights({ ...tempWeights, affirmationWeight: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
              />
              <p className="text-[10px] text-slate-500 mt-1">Prioritas kemiskinan ekstrem Desil 1-2.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-blue-200">
            <button
              type="button"
              onClick={() => {
                setTempWeights(DEFAULT_SELECTION_WEIGHTS);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
            >
              Reset Default
            </button>
            <button
              type="button"
              disabled={totalWeight !== 100}
              onClick={handleSaveWeights}
              className={`px-4 py-1.5 text-xs font-bold text-white rounded-md flex items-center gap-1 cursor-pointer transition-all ${
                totalWeight === 100 ? 'bg-blue-900 hover:bg-blue-800' : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              Terapkan & Hitung Ulang Ranking
            </button>
          </div>
        </div>
      )}

      {/* Monitoring Kelulusan per Prodi & Fakultas: Header & Key Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-400 text-blue-950 uppercase tracking-wide">
                Live Monitoring
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Pemantauan Kelulusan & Keterisian Kuota KIP-K
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-bold text-white">
              <Building className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>{monitoringStats.activeFacultyName}</span>
              <span className="text-slate-500">&bull;</span>
              <GraduationCap className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-sky-200">{monitoringStats.activeProdiName}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Menampilkan data kuota dan status kelulusan peserta berdasarkan filter aktif.
            </p>
          </div>

          {/* Key Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-lg border border-white/10">
              <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Total Pelamar</div>
              <div className="text-base sm:text-lg font-black text-white">{monitoringStats.totalApplicants}</div>
              <div className="text-[9px] text-slate-400">Pilihan Ke-1</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-lg border border-white/10">
              <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Alokasi Kuota</div>
              <div className="text-base sm:text-lg font-black text-yellow-300">{monitoringStats.totalQuota}</div>
              <div className="text-[9px] text-slate-400">Kursi Beasiswa</div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-xs px-3 py-2 rounded-lg border border-emerald-400/30">
              <div className="text-[10px] text-emerald-300 font-medium uppercase tracking-wider">Lulus Seleksi</div>
              <div className="text-base sm:text-lg font-black text-emerald-300">{monitoringStats.passedCount}</div>
              <div className="text-[9px] text-emerald-400 font-semibold">{monitoringStats.fillRate}% Terisi</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-lg border border-white/10">
              <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Sisa / Cadangan</div>
              <div className="text-base sm:text-lg font-black text-white">
                <span className="text-sky-300">{monitoringStats.remainingQuota}</span>
                <span className="text-slate-400 text-xs font-normal"> / </span>
                <span className="text-amber-300">{monitoringStats.reservedCount}</span>
              </div>
              <div className="text-[9px] text-slate-400">Sisa Kuota / Cadangan</div>
            </div>
          </div>
        </div>

        {/* Quota Progress Bar for Filtered Selection */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="w-full sm:w-2/3 flex items-center gap-3">
            <span className="text-[11px] text-slate-300 font-medium whitespace-nowrap">Progress Kuota:</span>
            <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  monitoringStats.fillRate >= 100
                    ? 'bg-emerald-400'
                    : monitoringStats.fillRate >= 75
                    ? 'bg-sky-400'
                    : 'bg-yellow-400'
                }`}
                style={{ width: `${Math.min(100, monitoringStats.fillRate)}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold text-yellow-300 whitespace-nowrap">
              {monitoringStats.passedCount} / {monitoringStats.totalQuota} ({monitoringStats.fillRate}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center gap-2">
            <span>Cadangan: <strong className="text-amber-300">{monitoringStats.reservedCount}</strong></span>
            <span>&bull;</span>
            <span>Tidak Lulus: <strong className="text-rose-300">{monitoringStats.failedCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Quota Overview Interactive Cards per Program Studi */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-blue-900" />
            <span>Kartu Keterisian Kuota per Program Studi</span>
            <span className="text-slate-400 font-normal">({filteredQuotaSummary.length} prodi)</span>
          </h3>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Klik kartu prodi untuk memfilter daftar peringkat secara instan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {filteredQuotaSummary.map((q) => {
            const isSelected = firstChoiceProdiFilter === q.prodi.name || firstChoiceProdiFilter === String(q.prodi.id);
            const fillPct = q.quota > 0 ? Math.min(100, Math.round((q.passedCount / q.quota) * 100)) : 0;
            return (
              <button
                key={q.prodi.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setFirstChoiceProdiFilter('ALL');
                  } else {
                    setFirstChoiceProdiFilter(q.prodi.name);
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
                title={`Klik untuk memfilter peringkat ${q.prodi.name}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold text-blue-900 bg-blue-100/70 px-1.5 py-0.2 rounded border border-blue-200/60 truncate">
                    {q.prodi.facultyName ? q.prodi.facultyName.replace('Fakultas ', '') : 'Prodi'}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-800">
                      <Check className="w-2.5 h-2.5" /> Aktif
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-bold text-slate-800 truncate" title={q.prodi.name}>
                  {q.prodi.name}
                </div>

                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-slate-500 text-[10px]">Kuota: <strong>{q.quota}</strong></span>
                  <span className="font-bold text-emerald-700 text-[10px]">Lulus: {q.passedCount}</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      fillPct >= 100 ? 'bg-emerald-600' : 'bg-blue-900'
                    }`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                  <span>Pelamar: {q.totalApplicants}</span>
                  <span>Sisa: {q.remainingQuota}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar: Dedicated Faculty & Prodi Dropdowns */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Search Box */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="filter-ranking-search"
            type="text"
            placeholder="Cari nama, no. reg, NIK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
          <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          {/* 1. Dropdown Filter Fakultas */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-md px-2 py-1">
            <Building className="w-3.5 h-3.5 text-blue-900 shrink-0" />
            <select
              id="filter-ranking-faculty"
              value={facultyFilter}
              onChange={(e) => handleFacultyFilterChange(e.target.value)}
              className="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[170px] truncate"
              title="Filter Peringkat Berdasarkan Fakultas"
            >
              <option value="ALL">Semua Fakultas ({facultyList.length})</option>
              {facultyList.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.name} {f.code ? `(${f.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Dropdown Filter Program Studi Pilihan 1 */}
          <div className="flex items-center gap-1.5 bg-indigo-50/50 border border-indigo-300 rounded-md px-2 py-1" title="Filter Berdasarkan Program Studi Pilihan 1">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-900 shrink-0" />
            <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-1 py-0.2 rounded border border-indigo-200 shrink-0">
              Pil 1
            </span>
            <select
              id="filter-ranking-prodi1"
              value={firstChoiceProdiFilter}
              onChange={(e) => setFirstChoiceProdiFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[170px] truncate"
              title="Filter Peringkat Berdasarkan Program Studi Pilihan 1"
            >
              <option value="ALL">Semua Pilihan 1 ({availableStudyPrograms.length})</option>
              {availableStudyPrograms.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} (Kuota: {p.quota})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Dropdown Filter Program Studi Pilihan 2 */}
          <div className="flex items-center gap-1.5 bg-purple-50/50 border border-purple-300 rounded-md px-2 py-1" title="Filter Berdasarkan Program Studi Pilihan 2">
            <GraduationCap className="w-3.5 h-3.5 text-purple-900 shrink-0" />
            <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-1 py-0.2 rounded border border-purple-200 shrink-0">
              Pil 2
            </span>
            <select
              id="filter-ranking-prodi2"
              value={secondChoiceProdiFilter}
              onChange={(e) => setSecondChoiceProdiFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[160px] truncate"
              title="Filter Peringkat Berdasarkan Program Studi Pilihan 2"
            >
              <option value="ALL">Semua Pilihan 2 ({studyPrograms.length})</option>
              {studyPrograms.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Dropdown Filter Desil P3KE */}
          <div className="flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-300 rounded-md px-2 py-1" title="Filter Berdasarkan Kategori Desil P3KE">
            <Tag className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
            <select
              id="filter-ranking-desil"
              value={desilFilter}
              onChange={(e) => setDesilFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
              title="Filter Peringkat Berdasarkan Kategori Desil P3KE"
            >
              <option value="ALL">Semua Desil</option>
              <option value="Desil 1">Desil 1 (Ekstrem)</option>
              <option value="Desil 2">Desil 2 (Sangat Miskin)</option>
              <option value="Desil 3">Desil 3 (Hampir Miskin)</option>
              <option value="Desil 4">Desil 4 (Rentan)</option>
              <option value="Desil 5">Desil 5 (Menengah Bawah)</option>
              <option value="Desil 6-10">Desil 6-10 (Menengah ke Atas)</option>
              <option value="Non-Desil">Non-Desil</option>
            </select>
          </div>

          {/* 5. Dropdown Filter Status Kelulusan */}
          <select
            id="filter-ranking-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            title="Filter Berdasarkan Status Kelulusan"
          >
            <option value="ALL">Semua Status</option>
            <option value="Lulus">Lulus</option>
            <option value="Cadangan">Cadangan</option>
            <option value="Tidak Lulus">Tidak Lulus</option>
            <option value="Belum Diproses">Belum Diproses</option>
          </select>

          {/* 6. Dropdown Filter Survey Lapangan Dinamis */}
          <select
            id="filter-ranking-survey"
            value={surveyFilterState}
            onChange={(e) => setSurveyFilterState(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            title="Filter Status Survey Lapangan Dinamis"
          >
            <option value="ALL">Semua Survey</option>
            <option value="SURVEYED">Sudah Disurvey</option>
            <option value="UNSURVEYED">Belum Disurvey (Dinamis)</option>
          </select>

          {/* Reset Filter Button */}
          {isFilterActive && (
            <button
              id="reset-ranking-filter-btn"
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Reset semua filter ke default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips & Participant Count Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            Menampilkan <span className="text-blue-900 font-bold">{filteredParticipants.length}</span> dari {rankedParticipants.length} calon mahasiswa
          </span>
          {isFilterActive && (
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
              Filter Aktif
            </span>
          )}
          <span className="text-[11px] text-slate-400">
            (Mode: <strong className="text-slate-700">{rankingMode === 'FINAL' ? 'Peringkat Final Terpadu' : 'Seleksi Tahap 1 UTBK & Wawancara'}</strong>)
          </span>
        </div>

        {isFilterActive && (
          <div className="flex flex-wrap items-center gap-1.5">
            {facultyFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                Fakultas: {monitoringStats.activeFacultyName}
                <button
                  onClick={() => handleFacultyFilterChange('ALL')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Hapus filter fakultas"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {firstChoiceProdiFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
                Pil 1: {monitoringStats.activeProdi1Name}
                <button
                  onClick={() => setFirstChoiceProdiFilter('ALL')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Hapus filter pilihan 1"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {secondChoiceProdiFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-900 border border-purple-200">
                Pil 2: {monitoringStats.activeProdi2Name}
                <button
                  onClick={() => setSecondChoiceProdiFilter('ALL')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Hapus filter pilihan 2"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {desilFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                Desil: {desilFilter}
                <button
                  onClick={() => setDesilFilter('ALL')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Hapus filter desil"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Hapus filter status"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {surveyFilterState !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-900 border border-cyan-200">
                Survey: {surveyFilterState === 'SURVEYED' ? 'Sudah Disurvey' : 'Belum Disurvey'}
                <button
                  onClick={() => setSurveyFilterState('ALL')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Hapus filter survey"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                Pencarian: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Hapus kata kunci pencarian"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ranking Results Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-4">Calon Mahasiswa</th>
                <th className="py-3 px-4">Program Studi & Fakultas</th>
                <th className="py-3 px-2 text-center" title="Nilai UTBK">UTBK ({weights.utbkWeight}%)</th>
                <th className="py-3 px-2 text-center" title="Nilai Wawancara">Wwn ({weights.interviewWeight}%)</th>
                <th className="py-3 px-3 text-center bg-indigo-50/70 text-indigo-950 border-x border-indigo-100" title="Akumulasi Seleksi Tahap Pertama">
                  Skor Tahap 1 (UTBK+Wwn)
                </th>
                <th className="py-3 px-3 text-center bg-cyan-50/70 text-cyan-950 border-r border-cyan-100" title="Penilaian Survey Lapangan Faktual Dinamis">
                  Survey ({weights.surveyWeight}%)
                </th>
                <th className="py-3 px-2 text-center" title="Afirmasi Desil">Afirmasi ({weights.affirmationWeight}%)</th>
                <th className="py-3 px-4 text-center">Nilai Akhir</th>
                <th className="py-3 px-4 text-center">Status Kelulusan</th>
                <th className="py-3 px-3 text-center">Penetapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">
                      Tidak ada data peserta yang memenuhi kriteria filter.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba ganti pilihan fakultas, program studi, atau klik tombol Reset Filter.
                    </p>
                    {isFilterActive && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const isTop3 = (p.rank || 999) <= 3;
                  const prodiObj =
                    prodiLookup.byId.get(p.firstChoiceProdiId) ||
                    prodiLookup.byName.get(p.firstChoiceProdiName.toLowerCase().trim());

                  return (
                    <tr
                      key={`rank-row-${p.id}-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        p.selectionStatus === 'Lulus'
                          ? 'bg-emerald-50/20'
                          : p.selectionStatus === 'Cadangan'
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-bold">
                        {isTop3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-blue-900 text-xs font-black shadow-xs">
                            {p.rank}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">#{p.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="font-mono text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {p.regNumber}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <Tag className="w-2.5 h-2.5" />
                            {p.desil}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.2 rounded border border-indigo-200">
                            Pil 1
                          </span>
                          <span className="font-semibold text-slate-800">{p.firstChoiceProdiName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1 flex-wrap">
                          {prodiObj?.facultyName && (
                            <span className="font-medium text-blue-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {prodiObj.facultyName}
                            </span>
                          )}
                          {p.secondChoiceProdiName && (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <span className="text-[9px] font-bold text-purple-800 bg-purple-100 px-1 py-0.2 rounded border border-purple-200">
                                Pil 2
                              </span>
                              <span className="truncate max-w-[150px]" title={`Pilihan 2: ${p.secondChoiceProdiName}`}>
                                {p.secondChoiceProdiName}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-medium">
                        {p.utbkScore ? p.utbkScore.toFixed(1) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-medium">
                        {p.interviewScore ? p.interviewScore.toFixed(1) : <span className="text-slate-300">-</span>}
                      </td>
                      {/* Skor Seleksi Tahap 1 */}
                      <td className="py-3 px-3 text-center font-mono bg-indigo-50/40 border-x border-indigo-100">
                        <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-indigo-100/80 text-indigo-950 border border-indigo-200">
                          {p.stage1Score ? p.stage1Score.toFixed(1) : '0.0'}
                        </span>
                      </td>
                      {/* Survey Lapangan Dinamis */}
                      <td className="py-3 px-3 text-center font-mono bg-cyan-50/40 border-r border-cyan-100">
                        {p.isSurveyed ? (
                          <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-cyan-100 text-cyan-900 border border-cyan-300">
                            {p.surveyScore?.toFixed(1)}
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] text-slate-400 italic bg-slate-100 border border-slate-200" title="Survey dinamis belum dinilai">
                            Belum Disurvey
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-medium text-emerald-800">
                        {p.affirmationScore || 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded bg-blue-900 text-yellow-300 font-black text-xs font-mono shadow-2xs">
                          {p.finalScore?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.selectionStatus === 'Lulus' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Lulus
                          </span>
                        )}
                        {p.selectionStatus === 'Cadangan' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertCircle className="w-3 h-3" /> Cadangan
                          </span>
                        )}
                        {p.selectionStatus === 'Tidak Lulus' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3" /> Tidak Lulus
                          </span>
                        )}
                        {p.selectionStatus === 'Belum Diproses' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            Belum Diproses
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          value={p.selectionStatus}
                          onChange={(e) =>
                            handleSetIndividualStatus(
                              p,
                              e.target.value as Participant['selectionStatus']
                            )
                          }
                          className="text-[11px] font-bold border border-slate-300 rounded px-1.5 py-1 bg-white text-slate-700 cursor-pointer focus:ring-1 focus:ring-blue-600"
                        >
                          <option value="Lulus">Lulus</option>
                          <option value="Cadangan">Cadangan</option>
                          <option value="Tidak Lulus">Tidak Lulus</option>
                          <option value="Belum Diproses">Belum Diproses</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
