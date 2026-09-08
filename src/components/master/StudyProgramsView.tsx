import React, { useState } from 'react';
import { StudyProgram, Faculty, Participant } from '../../types';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  AlertCircle,
  ShieldAlert,
  Award,
  Users,
  Info
} from 'lucide-react';

interface StudyProgramsViewProps {
  studyPrograms: StudyProgram[];
  faculties: Faculty[];
  participants?: Participant[];
  onAdd?: (prodi: Omit<StudyProgram, 'id'>) => void;
  onUpdate?: (prodi: StudyProgram) => void;
  onDelete?: (id: number) => { success: boolean; message: string } | void;
  onToggleStatus?: (id: number) => void;
  // Aliases for compatibility
  onAddProgram?: (prodi: Omit<StudyProgram, 'id'>) => void;
  onUpdateProgram?: (prodi: StudyProgram) => void;
  onDeleteProgram?: (id: number) => { success: boolean; message: string } | void;
  onToggleActive?: (id: number) => void;
}

export const StudyProgramsView: React.FC<StudyProgramsViewProps> = ({
  studyPrograms = [],
  faculties = [],
  participants = [],
  onAdd,
  onUpdate,
  onDelete,
  onToggleStatus,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
  onToggleActive,
}) => {
  const handleAddAction = onAdd || onAddProgram;
  const handleUpdateAction = onUpdate || onUpdateProgram;
  const handleDeleteAction = onDelete || onDeleteProgram;
  const handleToggleStatusAction = onToggleStatus || onToggleActive;

  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState<string>('ALL');
  const [degreeFilter, setDegreeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudyProgram | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<StudyProgram | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    degree: 'S1' as 'S1' | 'D3' | 'S2',
    facultyId: faculties[0]?.id || 1,
    quota: 15,
    accreditation: 'Baik Sekali' as 'Unggul' | 'A' | 'Baik Sekali' | 'B' | 'Baik',
    title: 'S.Kom.',
    isActive: true
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      degree: 'S1',
      facultyId: faculties[0]?.id || 1,
      quota: 15,
      accreditation: 'Baik Sekali',
      title: 'S.Kom.',
      isActive: true
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StudyProgram) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      degree: item.degree,
      facultyId: item.facultyId,
      quota: item.quota,
      accreditation: item.accreditation,
      title: item.title,
      isActive: item.isActive
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || !formData.title.trim()) {
      setErrorMessage('Semua field bertanda bintang (*) wajib diisi');
      return;
    }
    if (formData.quota <= 0) {
      setErrorMessage('Kuota beasiswa KIP-K harus lebih besar dari 0');
      return;
    }

    const selectedFaculty = faculties.find((f) => f.id === Number(formData.facultyId));
    if (!selectedFaculty) {
      setErrorMessage('Fakultas yang dipilih tidak valid');
      return;
    }

    // Check duplicate code
    const duplicate = studyPrograms.find(
      (p) => p.code.toLowerCase() === formData.code.trim().toLowerCase() && p.id !== editingItem?.id
    );
    if (duplicate) {
      setErrorMessage(`Kode Prodi '${formData.code.trim()}' sudah terdaftar pada ${duplicate.name}`);
      return;
    }

    if (editingItem) {
      if (handleUpdateAction) {
        handleUpdateAction({
          ...editingItem,
          code: formData.code.trim(),
          name: formData.name.trim(),
          degree: formData.degree,
          facultyId: selectedFaculty.id,
          facultyName: selectedFaculty.name,
          quota: Number(formData.quota),
          accreditation: formData.accreditation,
          title: formData.title.trim(),
          isActive: formData.isActive
        });
      }
    } else {
      if (handleAddAction) {
        handleAddAction({
          code: formData.code.trim(),
          name: formData.name.trim(),
          degree: formData.degree,
          facultyId: selectedFaculty.id,
          facultyName: selectedFaculty.name,
          quota: Number(formData.quota),
          accreditation: formData.accreditation,
          title: formData.title.trim(),
          isActive: formData.isActive
        });
      }
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) return;
    if (handleDeleteAction) {
      const result = handleDeleteAction(deleteCandidate.id);
      if (result && typeof result === 'object' && result.success === false) {
        alert(result.message);
      }
    }
    setDeleteCandidate(null);
  };

  // Participant counts per prodi
  const getParticipantCount = (prodiId: number) => {
    if (!participants || !Array.isArray(participants)) return 0;
    return participants.filter(
      (p) => p && (p.firstChoiceProdiId === prodiId || p.secondChoiceProdiId === prodiId)
    ).length;
  };

  // Filter study programs
  const filteredProdis = studyPrograms.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFaculty = facultyFilter === 'ALL' || item.facultyId.toString() === facultyFilter;
    const matchesDegree = degreeFilter === 'ALL' || item.degree === degreeFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') matchesStatus = item.isActive;
    if (statusFilter === 'INACTIVE') matchesStatus = !item.isActive;

    return matchesSearch && matchesFaculty && matchesDegree && matchesStatus;
  });

  const totalQuota = (studyPrograms || []).reduce((sum, p) => sum + (p.quota || 0), 0);

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="rounded-xl bg-[#1e3a8a] p-5 text-white shadow-sm border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Master Data Program Studi & Kuota Beasiswa</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Kelola Program Studi UNIHAZ
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Data Program Studi pilihan calon penerima KIP-Kuliah (Pilihan 1 & Pilihan 2) terhubung langsung dengan Fakultas induk, akreditasi BAN-PT/LAM, dan alokasi kuota beasiswa.
          </p>
        </div>

        <button
          id="btn-tambah-prodi"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Program Studi</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Prodi</span>
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{studyPrograms.length} Jurusan</div>
          <div className="text-[10px] text-slate-500 font-medium">Bernaung di {faculties.length} Fakultas</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Kuota Beasiswa</span>
            <Users className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700">{totalQuota} Kursi</div>
          <div className="text-[10px] text-slate-500 font-medium">Alokasi resmi per prodi</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Akreditasi Unggul/A</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-700">
            {studyPrograms.filter((p) => p.accreditation === 'Unggul' || p.accreditation === 'A').length} Prodi
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Prioritas seleksi nasional</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Prodi Aktif</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-purple-900">
            {studyPrograms.filter((p) => p.isActive).length} Aktif
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Dapat dipilih pada formulir</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Master Program Studi & Relasi Fakultas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Filter berdasarkan Fakultas induk, jenjang, atau status keaktifan</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-prodi"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari prodi / kode..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-800 w-36 sm:w-44 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Filter Fakultas */}
            <select
              id="filter-prodi-fakultas"
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 max-w-[150px]"
            >
              <option value="ALL">Semua Fakultas</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id.toString()}>
                  {f.code} - {f.name}
                </option>
              ))}
            </select>

            {/* Filter Jenjang */}
            <select
              id="filter-prodi-jenjang"
              value={degreeFilter}
              onChange={(e) => setDegreeFilter(e.target.value)}
              className="text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="S1">S1</option>
              <option value="D3">D3</option>
            </select>

            {/* Filter Status */}
            <select
              id="filter-prodi-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-12">No</th>
                <th className="py-2.5 px-3 text-center w-20">Kode</th>
                <th className="py-2.5 px-4">Program Studi</th>
                <th className="py-2.5 px-3 text-center">Jenjang</th>
                <th className="py-2.5 px-4">Fakultas Induk</th>
                <th className="py-2.5 px-3 text-center">Akreditasi</th>
                <th className="py-2.5 px-3 text-right">Kuota KIP-K</th>
                <th className="py-2.5 px-3 text-center">Pendaftar</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProdis.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data Program Studi yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredProdis.map((item, idx) => {
                  const pCount = getParticipantCount(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                        <div className="text-[10px] text-slate-400">Gelar: {item.title}</div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {item.degree}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span className="font-medium text-xs">{item.facultyName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.accreditation === 'Unggul' || item.accreditation === 'A'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : item.accreditation === 'Baik Sekali'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          <Award className="w-3 h-3" />
                          <span>{item.accreditation}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 whitespace-nowrap">
                        {item.quota} Kursi
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                          {pCount} Orang
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatusAction && handleToggleStatusAction(item.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                            item.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {item.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit Program Studi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                            title="Hapus Program Studi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>Program Studi yang telah dipilih oleh pendaftar tidak dapat dihapus demi menjamin integritas data calon mahasiswa.</span>
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1e3a8a] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-yellow-400" />
                <h3 className="font-bold text-sm">
                  {editingItem ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Dikti <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="55201"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                  <span className="text-[10px] text-slate-400">Kode PDDIKTI</span>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Program Studi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="S1 Informatika"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fakultas Induk <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.facultyId}
                    onChange={(e) => setFormData({ ...formData, facultyId: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  >
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenjang <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  >
                    <option value="S1">Strata 1 (S1)</option>
                    <option value="D3">Diploma 3 (D3)</option>
                    <option value="S2">Magister (S2)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Akreditasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.accreditation}
                    onChange={(e) => setFormData({ ...formData, accreditation: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  >
                    <option value="Unggul">Unggul</option>
                    <option value="Baik Sekali">Baik Sekali</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="Baik">Baik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kuota KIP-K <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gelar Lulusan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="S.Kom."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prodiActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-800"
                />
                <label htmlFor="prodiActiveCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Status Aktif (Tampil pada Pilihan 1 & 2 pendaftaran KIP-K)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-lg bg-blue-900 text-white hover:bg-blue-800 font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Program Studi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hapus Program Studi?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus data prodi <strong>{deleteCandidate.name} ({deleteCandidate.code})</strong>?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-rose-600 text-white hover:bg-rose-500 font-bold shadow-xs cursor-pointer"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
