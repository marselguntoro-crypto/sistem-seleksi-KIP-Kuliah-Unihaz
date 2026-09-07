import React, { useState, useMemo } from 'react';
import { Participant, StudyProgram, User } from '../../types';
import {
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Save,
  X,
  Home,
  UserCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface SurveyEvaluationViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  currentUser: User;
  onUpdateParticipant: (participant: Participant) => void;
}

export const SurveyEvaluationView: React.FC<SurveyEvaluationViewProps> = ({
  participants,
  studyPrograms,
  currentUser,
  onUpdateParticipant
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [surveyFilter, setSurveyFilter] = useState<'ALL' | 'SURVEYED' | 'PENDING'>('ALL');
  const [prodiFilter, setProdiFilter] = useState<string>('ALL');

  // Modal State
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [surveyScore, setSurveyScore] = useState<number>(0);
  const [surveyorName, setSurveyorName] = useState('');
  const [surveyDate, setSurveyDate] = useState('');
  const [surveyNotes, setSurveyNotes] = useState('');
  const [houseCondition, setHouseCondition] = useState<Participant['houseCondition']>('Sederhana');

  // Scoring rubric helpers
  const [buildingScore, setBuildingScore] = useState<number>(80);
  const [economicScore, setEconomicScore] = useState<number>(85);
  const [environmentScore, setEnvironmentScore] = useState<number>(85);

  // Quick stats
  const stats = useMemo(() => {
    const total = participants.length;
    const surveyed = participants.filter((p) => (p.surveyScore || 0) > 0).length;
    const pending = total - surveyed;
    const avgScore =
      surveyed > 0
        ? Math.round(
            (participants.reduce((sum, p) => sum + (p.surveyScore || 0), 0) / surveyed) * 10
          ) / 10
        : 0;
    return { total, surveyed, pending, avgScore };
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSurvey =
        surveyFilter === 'ALL' ||
        (surveyFilter === 'SURVEYED' && (p.surveyScore || 0) > 0) ||
        (surveyFilter === 'PENDING' && (!p.surveyScore || p.surveyScore === 0));

      const matchesProdi =
        prodiFilter === 'ALL' ||
        String(p.firstChoiceProdiId) === prodiFilter ||
        p.firstChoiceProdiName.toLowerCase().includes(prodiFilter.toLowerCase());

      return matchesSearch && matchesSurvey && matchesProdi;
    });
  }, [participants, searchTerm, surveyFilter, prodiFilter]);

  const handleOpenSurveyModal = (p: Participant) => {
    setSelectedParticipant(p);
    const existingScore = p.surveyScore || 0;
    setSurveyScore(existingScore);
    setSurveyorName(p.surveyorName || currentUser.name);
    setSurveyDate(p.surveyDate || new Date().toISOString().split('T')[0]);
    setSurveyNotes(
      p.surveyNotes ||
        `Kondisi rumah: ${p.address}, pekerjaan ortu: ${p.parentJob}, penghasilan: Rp ${p.parentIncome.toLocaleString(
          'id-ID'
        )}. Keluarga tanggungan: ${p.familyDependents} orang.`
    );
    setHouseCondition(p.houseCondition || 'Sederhana');

    if (existingScore > 0) {
      setBuildingScore(existingScore);
      setEconomicScore(existingScore);
      setEnvironmentScore(existingScore);
    } else {
      // Default estimate based on desil
      const defaultScore = p.desil === 'Desil 1' ? 92 : p.desil === 'Desil 2' ? 88 : 82;
      setBuildingScore(defaultScore);
      setEconomicScore(defaultScore);
      setEnvironmentScore(defaultScore);
      setSurveyScore(defaultScore);
    }
  };

  const handleCalculateFromRubric = () => {
    // 40% Building condition, 40% economic facts, 20% environment
    const calculated = Math.round(buildingScore * 0.4 + economicScore * 0.4 + environmentScore * 0.2);
    setSurveyScore(calculated);
  };

  const handleSaveSurvey = () => {
    if (!selectedParticipant) return;

    const validatedScore = Math.max(0, Math.min(100, Number(surveyScore) || 0));

    const updated: Participant = {
      ...selectedParticipant,
      surveyScore: validatedScore,
      surveyorName,
      surveyDate,
      surveyNotes,
      houseCondition,
      updatedAt: new Date().toISOString()
    };

    onUpdateParticipant(updated);
    setSelectedParticipant(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-cyan-100 text-cyan-900 rounded-lg">
            <MapPin className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Tahap 2: Evaluasi & Penilaian Survey Lapangan
            </h1>
            <p className="text-xs text-slate-500">
              Pencatatan verifikasi faktual lapangan kondisi rumah calon penerima KIP-Kuliah, verifikasi sosial-ekonomi, dan skor kelayakan.
            </p>
          </div>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md font-semibold border border-slate-200">
            Total Target: {stats.total}
          </span>
          <span className="px-3 py-1.5 bg-cyan-50 text-cyan-800 rounded-md font-semibold border border-cyan-200">
            Sudah Disurvey: {stats.surveyed}
          </span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-md font-semibold border border-amber-200">
            Belum Dinilai: {stats.pending}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-md font-semibold border border-emerald-200">
            Rata-rata Skor: {stats.avgScore}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, kota, alamat, no. reg..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Survey:</span>
          </div>
          <select
            value={surveyFilter}
            onChange={(e) => setSurveyFilter(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Semua Peserta</option>
            <option value="SURVEYED">Sudah Disurvey (Ada Nilai)</option>
            <option value="PENDING">Belum Disurvey</option>
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

      {/* Survey Evaluation Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Calon Mahasiswa</th>
                <th className="py-3 px-4">Lokasi / Alamat Domisili</th>
                <th className="py-3 px-4">Desil & Ekonomi</th>
                <th className="py-3 px-4">Kondisi Rumah</th>
                <th className="py-3 px-4">Petugas & Tanggal Survey</th>
                <th className="py-3 px-4 text-center">Nilai Survey (0-100)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada data peserta yang memenuhi filter survey.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const hasSurvey = (p.surveyScore || 0) > 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-blue-50 text-blue-800 px-1 py-0.2 rounded text-[10px]">
                            {p.regNumber}
                          </span>
                          <span>{p.firstChoiceProdiName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        <div className="font-medium text-slate-800 truncate" title={p.address}>
                          {p.address}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.city}, {p.province}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {p.desil}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Rp {p.parentIncome.toLocaleString('id-ID')} / {p.familyDependents} org
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
                          <Home className="w-3.5 h-3.5 text-slate-400" />
                          {p.houseCondition || 'Belum Dinilai'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.surveyDate ? (
                          <div>
                            <div className="flex items-center gap-1 text-slate-700">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{p.surveyDate}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Oleh: {p.surveyorName || '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum dijadwalkan</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasSurvey ? (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${
                              (p.surveyScore || 0) >= 85
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : (p.surveyScore || 0) >= 70
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {p.surveyScore?.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">0.0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenSurveyModal(p)}
                          className="px-3 py-1 bg-cyan-700 text-white hover:bg-cyan-800 rounded font-semibold text-xs flex items-center gap-1 mx-auto cursor-pointer transition-colors shadow-2xs"
                        >
                          <MapPin className="w-3 h-3" />
                          {hasSurvey ? 'Ubah Nilai' : 'Input Nilai'}
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

      {/* Modal Input Nilai Survey */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-cyan-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-lg text-cyan-300">
                  <MapPin className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base leading-tight">Penilaian Verifikasi Survey Lapangan</h3>
                  <p className="text-xs text-cyan-200 mt-0.5">
                    {selectedParticipant.name} ({selectedParticipant.regNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Participant Summary Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Alamat Rumah</span>
                  <p className="font-medium text-slate-800">{selectedParticipant.address}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Desil P3KE / Pekerjaan</span>
                  <p className="font-medium text-slate-800">{selectedParticipant.desil} — {selectedParticipant.parentJob}</p>
                </div>
              </div>

              {/* Surveyor Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Petugas Surveyor
                  </label>
                  <input
                    type="text"
                    value={surveyorName}
                    onChange={(e) => setSurveyorName(e.target.value)}
                    placeholder="Nama Surveyor Lapangan"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tanggal Survey
                  </label>
                  <input
                    type="date"
                    value={surveyDate}
                    onChange={(e) => setSurveyDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* House Condition Categorization */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Kategori Fisik Tempat Tinggal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Sangat Sederhana', 'Sederhana', 'Menengah', 'Layak'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setHouseCondition(cat)}
                      className={`py-1.5 px-2 rounded border text-center font-bold text-xs transition-all cursor-pointer ${
                        houseCondition === cat
                          ? 'bg-cyan-100 text-cyan-900 border-cyan-400 ring-1 ring-cyan-400'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rubric Assistant Slider */}
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-cyan-700" /> Rubrik Penilaian Lapangan
                  </span>
                  <button
                    type="button"
                    onClick={handleCalculateFromRubric}
                    className="text-[10px] text-cyan-700 hover:underline font-bold"
                  >
                    Terapkan Skor Otomatis
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>1. Kondisi Fisik Rumah (Dinding, Lantai, Atap):</span>
                    <span className="font-bold text-slate-800">{buildingScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={buildingScore}
                    onChange={(e) => {
                      setBuildingScore(Number(e.target.value));
                      handleCalculateFromRubric();
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>2. Kondisi Ekonomi Rill & Aset Keluarga:</span>
                    <span className="font-bold text-slate-800">{economicScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={economicScore}
                    onChange={(e) => {
                      setEconomicScore(Number(e.target.value));
                      handleCalculateFromRubric();
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>3. Konfirmasi Lingkungan / Tokoh Masyarakat:</span>
                    <span className="font-bold text-slate-800">{environmentScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={environmentScore}
                    onChange={(e) => {
                      setEnvironmentScore(Number(e.target.value));
                      handleCalculateFromRubric();
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-700"
                  />
                </div>
              </div>

              {/* Nilai Akhir Survey (0-100) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nilai Akhir Survey Lapangan (Skala 0 - 100)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={surveyScore}
                    onChange={(e) => setSurveyScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-32 px-3 py-2 text-sm font-bold border border-slate-300 rounded text-cyan-900 bg-white focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-500">
                    Nilai &gt;= 85: Sangat Layak Menerima KIP-K.
                  </div>
                </div>
              </div>

              {/* Catatan Lapangan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan Observasi & Kesimpulan Surveyor
                </label>
                <textarea
                  rows={3}
                  value={surveyNotes}
                  onChange={(e) => setSurveyNotes(e.target.value)}
                  placeholder="Catat rincian kondisi riil, kesaksian tetangga/RT, kendala geografis..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-cyan-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-semibold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveSurvey}
                className="px-5 py-2 bg-cyan-800 text-white rounded-md font-semibold text-xs hover:bg-cyan-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Nilai Survey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
