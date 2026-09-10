import React, { useState, useMemo } from 'react';
import { Participant, StudyProgram, User } from '../../types';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Save,
  X,
  UserCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Sliders,
  Edit3
} from 'lucide-react';

interface InterviewScoreViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  currentUser: User;
  onUpdateParticipant: (participant: Participant) => void;
}

export const InterviewScoreView: React.FC<InterviewScoreViewProps> = ({
  participants,
  studyPrograms,
  currentUser,
  onUpdateParticipant
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [prodiFilter, setProdiFilter] = useState<string>('ALL');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState<'ALL' | 'INTERVIEWED' | 'PENDING'>('ALL');

  // Modal State
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [interviewScore, setInterviewScore] = useState<number>(0);
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Rubric helpers
  const [motivationScore, setMotivationScore] = useState<number>(85);
  const [academicCommitmentScore, setAcademicCommitmentScore] = useState<number>(85);
  const [integrityScore, setIntegrityScore] = useState<number>(90);

  // Quick stats
  const stats = useMemo(() => {
    const total = participants.length;
    const interviewed = participants.filter((p) => (p.interviewScore || 0) > 0);
    const count = interviewed.length;
    const scores = interviewed.map((p) => p.interviewScore || 0);
    const avg = count > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
    return { total, count, avg, pending: total - count };
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nisn.includes(searchTerm);

      const matchesProdi =
        prodiFilter === 'ALL' ||
        String(p.firstChoiceProdiId) === prodiFilter ||
        p.firstChoiceProdiName.toLowerCase().includes(prodiFilter.toLowerCase());

      const matchesStatus =
        interviewStatusFilter === 'ALL' ||
        (interviewStatusFilter === 'INTERVIEWED' && (p.interviewScore || 0) > 0) ||
        (interviewStatusFilter === 'PENDING' && (!p.interviewScore || p.interviewScore === 0));

      return matchesSearch && matchesProdi && matchesStatus;
    });
  }, [participants, searchTerm, prodiFilter, interviewStatusFilter]);

  const handleOpenInterviewModal = (p: Participant) => {
    setSelectedParticipant(p);
    const existing = p.interviewScore || 0;
    setInterviewScore(existing);
    setInterviewerName(p.interviewerName || currentUser.name);
    setInterviewDate(p.interviewDate || new Date().toISOString().split('T')[0]);
    setInterviewNotes(
      p.interviewNotes ||
        `Motivasi kuliah: sangat tinggi, komitmen menyelesaikan studi tepat waktu, siap mempertahankan IPK minimal 3.25.`
    );

    if (existing > 0) {
      setMotivationScore(existing);
      setAcademicCommitmentScore(existing);
      setIntegrityScore(existing);
    } else {
      setMotivationScore(85);
      setAcademicCommitmentScore(85);
      setIntegrityScore(90);
      setInterviewScore(87);
    }
  };

  const handleCalculateRubric = () => {
    // 35% Motivasi, 35% Komitmen Akademik, 30% Karakter & Integritas
    const calc = Math.round(motivationScore * 0.35 + academicCommitmentScore * 0.35 + integrityScore * 0.3);
    setInterviewScore(calc);
  };

  const handleSaveInterview = () => {
    if (!selectedParticipant) return;

    const validated = Math.min(100, Math.max(0, Number(interviewScore) || 0));

    const updated: Participant = {
      ...selectedParticipant,
      interviewScore: validated,
      interviewerName,
      interviewDate,
      interviewNotes,
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
          <span className="p-2 bg-yellow-100 text-yellow-900 rounded-lg">
            <MessageSquare className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Tahap 3: Penilaian Wawancara Calon Mahasiswa
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                Seleksi Tahap Pertama
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Evaluasi komitmen akademik, motivasi studi, integritas, dan klarifikasi data sosial-ekonomi bersama nilai UTBK pada seleksi tahap pertama.
            </p>
          </div>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md font-semibold border border-slate-200">
            Total Pendaftar: {stats.total}
          </span>
          <span className="px-3 py-1.5 bg-yellow-50 text-yellow-800 rounded-md font-semibold border border-yellow-200">
            Sudah Diwawancara: {stats.count}
          </span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-md font-semibold border border-amber-200">
            Belum Diwawancara: {stats.pending}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-md font-semibold border border-emerald-200">
            Rata-rata Skor: {stats.avg}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, no. reg, prodi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status Wawancara:</span>
          </div>
          <select
            value={interviewStatusFilter}
            onChange={(e) => setInterviewStatusFilter(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Semua Peserta</option>
            <option value="INTERVIEWED">Sudah Diwawancara</option>
            <option value="PENDING">Belum Diwawancara</option>
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

      {/* Interview Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Peserta & Registrasi</th>
                <th className="py-3 px-4">Pilihan Prodi</th>
                <th className="py-3 px-4">Pewawancara</th>
                <th className="py-3 px-4">Tanggal Wawancara</th>
                <th className="py-3 px-4">Catatan Wawancara</th>
                <th className="py-3 px-4 text-center">Nilai Wawancara (0–100)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada data pendaftar yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const hasInterview = (p.interviewScore || 0) > 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-blue-50 text-blue-800 px-1 py-0.2 rounded text-[10px]">
                            {p.regNumber}
                          </span>
                          <span>{p.schoolOrigin}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {p.firstChoiceProdiName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.interviewerName || 'Belum Ditentukan'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.interviewDate || '-'}
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        <p className="text-slate-600 truncate text-[11px]" title={p.interviewNotes || '-'}>
                          {p.interviewNotes || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasInterview ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-md font-bold text-xs ${
                              (p.interviewScore || 0) >= 85
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : (p.interviewScore || 0) >= 70
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {p.interviewScore?.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs font-mono">0.0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenInterviewModal(p)}
                          className="px-3 py-1 bg-yellow-600 text-white hover:bg-yellow-700 rounded font-semibold text-xs flex items-center gap-1 mx-auto cursor-pointer transition-colors shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3" />
                          {hasInterview ? 'Ubah' : 'Nilai'}
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

      {/* Modal Input Nilai Wawancara */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-700 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-lg text-yellow-300">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base leading-tight">Penilaian Wawancara Calon Mahasiswa</h3>
                  <p className="text-xs text-yellow-200 mt-0.5">
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
              {/* Pewawancara & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Dosen / Pewawancara
                  </label>
                  <input
                    type="text"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    placeholder="Nama Pewawancara"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tanggal Wawancara
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rubrik Penilaian Wawancara */}
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-700" /> Rubrik Evaluasi Komprehensif
                  </span>
                  <button
                    type="button"
                    onClick={handleCalculateRubric}
                    className="text-[10px] text-amber-800 hover:underline font-bold"
                  >
                    Hitung Nilai Otomatis
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>1. Motivasi & Alasan Mengambil Program Studi:</span>
                    <span className="font-bold text-slate-800">{motivationScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={motivationScore}
                    onChange={(e) => {
                      setMotivationScore(Number(e.target.value));
                      handleCalculateRubric();
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>2. Komitmen Akademik (Lulus Tepat Waktu & Target IPK):</span>
                    <span className="font-bold text-slate-800">{academicCommitmentScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={academicCommitmentScore}
                    onChange={(e) => {
                      setAcademicCommitmentScore(Number(e.target.value));
                      handleCalculateRubric();
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>3. Integritas, Etika & Kejujuran Data Finansial:</span>
                    <span className="font-bold text-slate-800">{integrityScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={integrityScore}
                    onChange={(e) => {
                      setIntegrityScore(Number(e.target.value));
                      handleCalculateRubric();
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                  />
                </div>
              </div>

              {/* Nilai Akhir Wawancara */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nilai Akhir Wawancara (0 – 100)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={interviewScore}
                    onChange={(e) => setInterviewScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-32 px-3 py-2 text-sm font-bold border border-slate-300 rounded text-amber-900 bg-white focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-500">
                    Nilai wawancara memiliki bobot menentukan dalam seleksi akhir.
                  </div>
                </div>
              </div>

              {/* Catatan Wawancara */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan Evaluasi / Kesimpulan Wawancara
                </label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="Catat potensi calon mahasiswa, rekomendasi pewawancara..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-amber-600 focus:outline-none"
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
                onClick={handleSaveInterview}
                className="px-5 py-2 bg-amber-800 text-white rounded-md font-semibold text-xs hover:bg-amber-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Nilai Wawancara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
