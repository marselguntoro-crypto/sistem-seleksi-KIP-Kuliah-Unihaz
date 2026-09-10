import React, { useState, useMemo } from 'react';
import { Participant, StudyProgram, User } from '../../types';
import { STANDARD_DOCUMENT_REQUIREMENTS } from '../../utils/selectionUtils';
import { ImportVerificationModal } from './ImportVerificationModal';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  UserCheck,
  FileText,
  MessageCircle,
  CheckSquare,
  Square,
  AlertCircle,
  Calendar,
  Save,
  Upload,
  X
} from 'lucide-react';

interface DocumentVerificationViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  currentUser: User;
  onUpdateParticipant: (participant: Participant) => void;
  onBatchUpdateParticipants?: (updatedParticipants: Participant[]) => void;
}

export const DocumentVerificationView: React.FC<DocumentVerificationViewProps> = ({
  participants,
  studyPrograms,
  currentUser,
  onUpdateParticipant,
  onBatchUpdateParticipants
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [prodiFilter, setProdiFilter] = useState<string>('ALL');

  // Verification modal state
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [receiver, setReceiver] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [checker, setChecker] = useState('');
  const [checkedDate, setCheckedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [docStatus, setDocStatus] = useState<Participant['documentStatus']>('Belum Diverifikasi');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Quick stats
  const stats = useMemo(() => {
    const total = participants.length;
    const pending = participants.filter((p) => p.documentStatus === 'Belum Diverifikasi').length;
    const complete = participants.filter((p) => p.documentStatus === 'Lengkap').length;
    const revision = participants.filter((p) => p.documentStatus === 'Perlu Perbaikan').length;
    const rejected = participants.filter((p) => p.documentStatus === 'Ditolak').length;
    return { total, pending, complete, revision, rejected };
  }, [participants]);

  // Filtered list
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nik.includes(searchTerm) ||
        p.nisn.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'ALL' || p.documentStatus === statusFilter;

      const matchesProdi =
        prodiFilter === 'ALL' ||
        String(p.firstChoiceProdiId) === prodiFilter ||
        p.firstChoiceProdiName.toLowerCase().includes(prodiFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesProdi;
    });
  }, [participants, searchTerm, statusFilter, prodiFilter]);

  // Open modal handler
  const handleOpenVerificationModal = (p: Participant) => {
    setSelectedParticipant(p);
    setReceiver(p.documentReceiver || currentUser.name);
    setReceivedDate(p.documentReceivedDate || new Date().toISOString().split('T')[0]);
    setChecker(p.documentChecker || currentUser.name);
    setCheckedDate(p.documentCheckedDate || p.documentReceivedDate || new Date().toISOString().split('T')[0]);
    setNotes(p.documentNotes || p.notes || '');
    setDocStatus(p.documentStatus);

    // Initial checklist
    const initialCheck: Record<string, boolean> = {};
    STANDARD_DOCUMENT_REQUIREMENTS.forEach((req) => {
      if (p.documentChecklist && p.documentChecklist[req.id] !== undefined) {
        initialCheck[req.id] = p.documentChecklist[req.id];
      } else {
        // If complete, default to true, else default required to true if already verified
        initialCheck[req.id] = p.documentStatus === 'Lengkap';
      }
    });
    setChecklist(initialCheck);
  };

  const handleToggleChecklist = (reqId: string) => {
    setChecklist((prev) => {
      const updated = { ...prev, [reqId]: !prev[reqId] };
      // Check if all required are checked
      const allRequiredChecked = STANDARD_DOCUMENT_REQUIREMENTS.filter((r) => r.isRequired).every(
        (r) => updated[r.id]
      );
      if (allRequiredChecked && docStatus === 'Belum Diverifikasi') {
        setDocStatus('Lengkap');
      }
      return updated;
    });
  };

  const handleSaveVerification = (newStatus?: Participant['documentStatus']) => {
    if (!selectedParticipant) return;
    const finalStatus = newStatus || docStatus;

    const updated: Participant = {
      ...selectedParticipant,
      documentStatus: finalStatus,
      documentReceiver: receiver,
      documentReceivedDate: receivedDate,
      documentChecker: checker,
      documentCheckedDate: checkedDate,
      documentNotes: notes,
      documentChecklist: checklist,
      updatedAt: new Date().toISOString()
    };

    onUpdateParticipant(updated);
    setSelectedParticipant(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-900 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Tahap 1: Pemberkasan & Verifikasi Dokumen
              </h1>
              <p className="text-xs text-slate-500">
                Pencatatan penerimaan fisik berkas, verifikasi kelengkapan dokumen KIP-Kuliah, dan penugasan operator verifikator.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stat Badges & Import Button */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs hover:shadow-sm transition cursor-pointer"
            title="Import data verifikasi berkas via Excel (.xlsx / .xls / .csv)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Verifikasi Berkas</span>
          </button>
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md font-semibold border border-slate-200">
            Total: {stats.total}
          </span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md font-semibold border border-amber-200">
            Belum Verif: {stats.pending}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold border border-emerald-200">
            Lengkap: {stats.complete}
          </span>
          <span className="px-3 py-1.5 bg-yellow-50 text-yellow-800 rounded-md font-semibold border border-yellow-200">
            Perbaikan: {stats.revision}
          </span>
          <span className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-md font-semibold border border-rose-200">
            Ditolak: {stats.rejected}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, no. reg, NIK, NISN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Semua Status Berkas</option>
            <option value="Belum Diverifikasi">Belum Diverifikasi</option>
            <option value="Lengkap">Lengkap</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
            <option value="Ditolak">Ditolak</option>
          </select>

          <select
            value={prodiFilter}
            onChange={(e) => setProdiFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Semua Program Studi</option>
            {studyPrograms.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} ({p.degree})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Peserta & Registrasi</th>
                <th className="py-3 px-4">Program Studi</th>
                <th className="py-3 px-4">Penerimaan Berkas</th>
                <th className="py-3 px-4">Petugas Pemeriksa</th>
                <th className="py-3 px-4 text-center">Status Berkas</th>
                <th className="py-3 px-4">Catatan Verifikator</th>
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
                filteredParticipants.map((p, idx) => (
                  <tr key={`doc-row-${p.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                          {p.regNumber}
                        </span>
                        <span>NIK: {p.nik}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700">{p.firstChoiceProdiName}</div>
                      <div className="text-[11px] text-slate-400">Pil 2: {p.secondChoiceProdiName}</div>
                    </td>
                    <td className="py-3 px-4">
                      {p.documentReceivedDate ? (
                        <div>
                          <div className="flex items-center gap-1 text-slate-700">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{p.documentReceivedDate}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Oleh: {p.documentReceiver || '-'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum diterima</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">
                          {p.documentChecker || 'Belum ditugaskan'}
                        </span>
                      </div>
                      {p.documentCheckedDate ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-medium">
                          <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Tgl Cek: {p.documentCheckedDate}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 mt-0.5">Tgl Cek: -</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.documentStatus === 'Lengkap' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Lengkap
                        </span>
                      )}
                      {p.documentStatus === 'Belum Diverifikasi' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3" /> Belum Verif
                        </span>
                      )}
                      {p.documentStatus === 'Perlu Perbaikan' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                          <AlertTriangle className="w-3 h-3" /> Perlu Perbaikan
                        </span>
                      )}
                      {p.documentStatus === 'Ditolak' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle className="w-3 h-3" /> Ditolak
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <p className="text-slate-600 truncate text-[11px]" title={p.documentNotes || p.notes || '-'}>
                        {p.documentNotes || p.notes || '-'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenVerificationModal(p)}
                          className="px-2.5 py-1 bg-blue-900 text-white hover:bg-blue-800 rounded font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <FileText className="w-3 h-3" /> Verifikasi
                        </button>
                        {p.phone && (
                          <a
                            href={`https://wa.me/62${p.phone.replace(/^0/, '')}?text=${encodeURIComponent(
                              `Halo ${p.name}, kami dari Panitia KIP-Kuliah UNIHAZ menginformasikan perihal berkas pendaftaran Anda (${p.regNumber}): Status Berkas: ${p.documentStatus}. Catatan: ${p.documentNotes || p.notes || 'Terima kasih.'}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors"
                            title="Kirim Pesan WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Verifikasi Berkas */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-lg text-yellow-300">
                  <ClipboardCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base leading-tight">Formulir Verifikasi Berkas Fisik KIP-K</h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {selectedParticipant.name} — {selectedParticipant.regNumber}
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
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Profile Box */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Nama Lengkap</span>
                  <p className="font-bold text-slate-800">{selectedParticipant.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Pilihan Prodi 1</span>
                  <p className="font-semibold text-blue-900">{selectedParticipant.firstChoiceProdiName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">NIK & NISN</span>
                  <p className="font-mono text-slate-700">{selectedParticipant.nik} / {selectedParticipant.nisn}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Kategori Desil P3KE</span>
                  <p className="font-semibold text-emerald-800">{selectedParticipant.desil}</p>
                </div>
              </div>

              {/* Administrative Officers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Petugas Penerima
                  </label>
                  <input
                    type="text"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    placeholder="Nama Petugas Penerima"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tanggal Penerimaan
                  </label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Petugas Verifikator / Pengecek
                  </label>
                  <input
                    type="text"
                    value={checker}
                    onChange={(e) => setChecker(e.target.value)}
                    placeholder="Nama Petugas Pemeriksa"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tanggal Petugas Verifikator / Pengecek
                  </label>
                  <input
                    type="date"
                    value={checkedDate}
                    onChange={(e) => setCheckedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Document Checklist Items */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Daftar Kelengkapan Berkas Fisik & Digital</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    (Centang dokumen yang telah divalidasi)
                  </span>
                </label>

                <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  {STANDARD_DOCUMENT_REQUIREMENTS.map((req) => {
                    const isChecked = !!checklist[req.id];
                    return (
                      <div
                        key={req.id}
                        onClick={() => handleToggleChecklist(req.id)}
                        className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-all border ${
                          isChecked
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 text-slate-400 focus:outline-none"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold ${isChecked ? 'text-emerald-900' : 'text-slate-800'}`}>
                              {req.title}
                            </span>
                            {req.isRequired && (
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Wajib
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{req.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Status Hasil Pemberkasan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocStatus('Belum Diverifikasi')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                      docStatus === 'Belum Diverifikasi'
                        ? 'bg-amber-100 text-amber-800 border-amber-400 ring-2 ring-amber-300'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Belum Diverifikasi
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocStatus('Lengkap')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                      docStatus === 'Lengkap'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-400 ring-2 ring-emerald-300'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Lengkap (Memenuhi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocStatus('Perlu Perbaikan')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                      docStatus === 'Perlu Perbaikan'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-400 ring-2 ring-yellow-300'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Perlu Perbaikan
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocStatus('Ditolak')}
                    className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                      docStatus === 'Ditolak'
                        ? 'bg-rose-100 text-rose-800 border-rose-400 ring-2 ring-rose-300'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Ditolak (Gugur)
                  </button>
                </div>
              </div>

              {/* Catatan Kekurangan Berkas */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan Kekurangan Berkas / Instruksi Perbaikan ke Calon Mahasiswa
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: SKTM belum dilegalisir kelurahan, foto rumah tampak depan buram..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveVerification('Perlu Perbaikan')}
                  className="px-3 py-2 bg-yellow-50 text-yellow-800 border border-yellow-300 rounded-md font-semibold text-xs hover:bg-yellow-100 cursor-pointer"
                >
                  Minta Perbaikan
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVerification('Lengkap')}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-md font-semibold text-xs hover:bg-emerald-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan & Tandai Lengkap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Verification Modal */}
      <ImportVerificationModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        participants={participants}
        onBatchUpdate={(updatedList) => {
          if (onBatchUpdateParticipants) {
            onBatchUpdateParticipants(updatedList);
          } else {
            updatedList.forEach(onUpdateParticipant);
          }
        }}
        currentUserName={currentUser.name}
      />
    </div>
  );
};
