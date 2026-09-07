import React, { useState, useMemo } from 'react';
import { Participant, StudyProgram, User } from '../../types';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Save,
  X,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Award,
  Edit3
} from 'lucide-react';

interface UtbkScoreViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  currentUser: User;
  onUpdateParticipant: (participant: Participant) => void;
}

export const UtbkScoreView: React.FC<UtbkScoreViewProps> = ({
  participants,
  studyPrograms,
  currentUser,
  onUpdateParticipant
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [prodiFilter, setProdiFilter] = useState<string>('ALL');
  const [scoreStatusFilter, setScoreStatusFilter] = useState<'ALL' | 'INPUTTED' | 'EMPTY'>('ALL');

  // Modal State
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [utbkScoreInput, setUtbkScoreInput] = useState<string>('');
  const [operatorName, setOperatorName] = useState('');
  const [utbkDate, setUtbkDate] = useState('');
  const [utbkNotes, setUtbkNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick stats
  const stats = useMemo(() => {
    const total = participants.length;
    const inputted = participants.filter((p) => (p.utbkScore || 0) > 0);
    const count = inputted.length;
    const scores = inputted.map((p) => p.utbkScore || 0);
    const avg = count > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
    const max = count > 0 ? Math.max(...scores) : 0;
    const min = count > 0 ? Math.min(...scores) : 0;
    return { total, count, avg, max, min, pending: total - count };
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
        scoreStatusFilter === 'ALL' ||
        (scoreStatusFilter === 'INPUTTED' && (p.utbkScore || 0) > 0) ||
        (scoreStatusFilter === 'EMPTY' && (!p.utbkScore || p.utbkScore === 0));

      return matchesSearch && matchesProdi && matchesStatus;
    });
  }, [participants, searchTerm, prodiFilter, scoreStatusFilter]);

  const handleOpenScoreModal = (p: Participant) => {
    setSelectedParticipant(p);
    setUtbkScoreInput(p.utbkScore ? String(p.utbkScore) : '');
    setOperatorName(p.utbkOperator || currentUser.name);
    setUtbkDate(p.utbkDate || new Date().toISOString().split('T')[0]);
    setUtbkNotes(p.utbkNotes || `Skor UTBK/TPA resmi Kemdikbud.`);
    setValidationError(null);
  };

  const handleSaveScore = () => {
    if (!selectedParticipant) return;

    const num = parseFloat(utbkScoreInput);
    if (isNaN(num)) {
      setValidationError('Nilai UTBK harus berupa angka valid.');
      return;
    }

    if (num < 0 || num > 100) {
      setValidationError('Validasi gagal: Nilai UTBK wajib berada dalam rentang 0 – 100.');
      return;
    }

    const updated: Participant = {
      ...selectedParticipant,
      utbkScore: Math.round(num * 100) / 100,
      utbkOperator: operatorName,
      utbkDate,
      utbkNotes,
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
          <span className="p-2 bg-indigo-100 text-indigo-900 rounded-lg">
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Tahap 3: Input & Validasi Nilai UTBK / TPA
            </h1>
            <p className="text-xs text-slate-500">
              Pencatatan skor Tes Potensi Akademik / UTBK SNBT dengan validasi ketat rentang nilai 0 s/d 100 dan audit operator.
            </p>
          </div>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md font-semibold border border-slate-200">
            Total: {stats.total}
          </span>
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-md font-semibold border border-indigo-200">
            Terisi: {stats.count}
          </span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-md font-semibold border border-amber-200">
            Kosong: {stats.pending}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-md font-semibold border border-emerald-200">
            Rata-rata: {stats.avg}
          </span>
          <span className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-md font-semibold border border-blue-200">
            Tertinggi: {stats.max}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, no. reg, NISN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Status:</span>
          </div>
          <select
            value={scoreStatusFilter}
            onChange={(e) => setScoreStatusFilter(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Semua Nilai</option>
            <option value="INPUTTED">Sudah Diinput</option>
            <option value="EMPTY">Belum Diinput (0.0)</option>
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

      {/* UTBK Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Peserta & NISN</th>
                <th className="py-3 px-4">Pilihan Prodi</th>
                <th className="py-3 px-4">Asal Sekolah</th>
                <th className="py-3 px-4">Operator Pencatat</th>
                <th className="py-3 px-4">Tanggal Input</th>
                <th className="py-3 px-4 text-center">Nilai UTBK (0–100)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada calon mahasiswa yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const hasScore = (p.utbkScore || 0) > 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-blue-50 text-blue-800 px-1 py-0.2 rounded text-[10px]">
                            {p.regNumber}
                          </span>
                          <span>NISN: {p.nisn}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {p.firstChoiceProdiName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{p.schoolOrigin}</div>
                        <div className="text-[11px] text-slate-400">{p.schoolMajor || 'Umum'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.utbkOperator || 'Petugas SPMB'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.utbkDate || (hasScore ? p.createdAt.split(' ')[0] : '-')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasScore ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-md font-bold text-xs ${
                              (p.utbkScore || 0) >= 85
                                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                : (p.utbkScore || 0) >= 70
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {p.utbkScore?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs font-mono">0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenScoreModal(p)}
                          className="px-3 py-1 bg-indigo-800 text-white hover:bg-indigo-900 rounded font-semibold text-xs flex items-center gap-1 mx-auto cursor-pointer transition-colors shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3" />
                          {hasScore ? 'Ubah' : 'Input Nilai'}
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

      {/* Modal Input Nilai UTBK */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-lg text-indigo-300">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base leading-tight">Input Nilai UTBK / TPA</h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
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
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Score Input with Strict Validation (0-100) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nilai UTBK / Skor TPA (0.00 – 100.00) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Contoh: 85.50"
                  value={utbkScoreInput}
                  onChange={(e) => {
                    setUtbkScoreInput(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full px-3 py-2 text-base font-bold border border-slate-300 rounded text-indigo-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Validasi ketat sistem Laravel: Nilai harus berupa numerik antara 0 sampai 100.
                </p>
              </div>

              {/* Operator Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Operator Input / Petugas SPMB
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tanggal Penginputan
                </label>
                <input
                  type="date"
                  value={utbkDate}
                  onChange={(e) => setUtbkDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Nilai
                </label>
                <textarea
                  rows={2}
                  value={utbkNotes}
                  onChange={(e) => setUtbkNotes(e.target.value)}
                  placeholder="Catatan sertifikat UTBK atau hasil ujian CBT SPMB..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
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
                onClick={handleSaveScore}
                className="px-5 py-2 bg-indigo-900 text-white rounded-md font-semibold text-xs hover:bg-indigo-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Nilai UTBK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
