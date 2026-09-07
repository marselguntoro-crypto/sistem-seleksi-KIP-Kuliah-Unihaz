import React, { useState, useMemo } from 'react';
import { Participant, StudyProgram, AcademicYear, User, SelectionWeights } from '../../types';
import {
  calculateParticipantFinalScore,
  getDesilAffirmationScore,
  DEFAULT_SELECTION_WEIGHTS
} from '../../utils/selectionUtils';
import {
  Trophy,
  Award,
  Sliders,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Save,
  Check,
  Building,
  GraduationCap,
  Users,
  ChevronDown,
  Info
} from 'lucide-react';

interface RankingResultsViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  academicYears: AcademicYear[];
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
  currentUser,
  onUpdateParticipant,
  onBatchUpdateParticipants,
  weights,
  onUpdateWeights
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [prodiFilter, setProdiFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Weight configuration panel open/close
  const [isWeightsOpen, setIsWeightsOpen] = useState(false);
  const [tempWeights, setTempWeights] = useState<SelectionWeights>(weights);

  // Status edit modal / quick popover
  const [selectedForStatus, setSelectedForStatus] = useState<Participant | null>(null);

  // Total weight check
  const totalWeight =
    tempWeights.utbkWeight +
    tempWeights.interviewWeight +
    tempWeights.surveyWeight +
    tempWeights.affirmationWeight;

  // Calculate live ranking
  const rankedParticipants = useMemo(() => {
    // 1. Calculate each participant's finalScore using current weights
    const scoredList = participants.map((p) => {
      const finalScore = calculateParticipantFinalScore(
        p.utbkScore || 0,
        p.interviewScore || 0,
        p.surveyScore || 0,
        p.desil,
        weights
      );
      const affirmationScore = getDesilAffirmationScore(p.desil);
      return {
        ...p,
        finalScore,
        affirmationScore
      };
    });

    // 2. Sort by final score descending
    scoredList.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    // 3. Assign overall rank
    return scoredList.map((p, index) => ({
      ...p,
      rank: index + 1
    }));
  }, [participants, weights]);

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    return rankedParticipants.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nik.includes(searchTerm);

      const matchesProdi =
        prodiFilter === 'ALL' ||
        String(p.firstChoiceProdiId) === prodiFilter ||
        p.firstChoiceProdiName.toLowerCase().includes(prodiFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || p.selectionStatus === statusFilter;

      return matchesSearch && matchesProdi && matchesStatus;
    });
  }, [rankedParticipants, searchTerm, prodiFilter, statusFilter]);

  // Quota allocation summary per study program
  const quotaSummary = useMemo(() => {
    return studyPrograms.map((prodi) => {
      const prodiApplicants = rankedParticipants.filter(
        (p) => p.firstChoiceProdiId === prodi.id
      );
      const passedCount = prodiApplicants.filter((p) => p.selectionStatus === 'Lulus').length;
      const reservedCount = prodiApplicants.filter((p) => p.selectionStatus === 'Cadangan').length;
      const failedCount = prodiApplicants.filter((p) => p.selectionStatus === 'Tidak Lulus').length;
      const remainingQuota = Math.max(0, prodi.quota - passedCount);

      return {
        prodi,
        totalApplicants: prodiApplicants.length,
        quota: prodi.quota,
        passedCount,
        reservedCount,
        failedCount,
        remainingQuota
      };
    });
  }, [studyPrograms, rankedParticipants]);

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
        (p) => p.firstChoiceProdiId === prodi.id
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
    setSelectedForStatus(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-yellow-100 text-yellow-900 rounded-lg">
            <Trophy className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Tahap 5: Ranking Seleksi & Penetapan Hasil Akhir
            </h1>
            <p className="text-xs text-slate-500">
              Perhitungan nilai akhir terbobot multi-kriteria, penetapan kelulusan sesuai kuota prodi, dan peringkat peserta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWeightsOpen(!isWeightsOpen)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            Konfigurasi Bobot ({weights.utbkWeight}% / {weights.interviewWeight}% / {weights.surveyWeight}% / {weights.affirmationWeight}%)
          </button>

          <button
            onClick={handleAutoAssignResults}
            className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Tetapkan Otomatis Berdasarkan Kuota
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

      {/* Quota Overview Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {quotaSummary.slice(0, 6).map((q) => (
          <div key={q.prodi.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-800 truncate" title={q.prodi.name}>
              {q.prodi.name}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className="text-slate-500 text-[10px]">Kuota: {q.quota}</span>
              <span className="font-bold text-emerald-700 text-[10px]">Lulus: {q.passedCount}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-blue-900 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (q.passedCount / (q.quota || 1)) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, no. reg, NIK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Semua Status Kelulusan</option>
            <option value="Lulus">Lulus</option>
            <option value="Cadangan">Cadangan</option>
            <option value="Tidak Lulus">Tidak Lulus</option>
            <option value="Belum Diproses">Belum Diproses</option>
          </select>

          <select
            value={prodiFilter}
            onChange={(e) => setProdiFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Semua Program Studi</option>
            {studyPrograms.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ranking Results Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-4">Calon Mahasiswa</th>
                <th className="py-3 px-4">Program Studi</th>
                <th className="py-3 px-3 text-center">UTBK ({weights.utbkWeight}%)</th>
                <th className="py-3 px-3 text-center">Wawancara ({weights.interviewWeight}%)</th>
                <th className="py-3 px-3 text-center">Survey ({weights.surveyWeight}%)</th>
                <th className="py-3 px-3 text-center">Afirmasi ({weights.affirmationWeight}%)</th>
                <th className="py-3 px-4 text-center">Nilai Akhir</th>
                <th className="py-3 px-4 text-center">Status Kelulusan</th>
                <th className="py-3 px-3 text-center">Penetapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada data peserta yang memenuhi filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const isTop3 = (p.rank || 999) <= 3;
                  return (
                    <tr
                      key={p.id}
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
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-blue-800 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                            {p.regNumber}
                          </span>
                          <span className="text-emerald-700 font-semibold">{p.desil}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{p.firstChoiceProdiName}</div>
                        <div className="text-[10px] text-slate-400">Pil 2: {p.secondChoiceProdiName}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium">
                        {p.utbkScore ? p.utbkScore.toFixed(1) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium">
                        {p.interviewScore ? p.interviewScore.toFixed(1) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium">
                        {p.surveyScore ? p.surveyScore.toFixed(1) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-emerald-800">
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
