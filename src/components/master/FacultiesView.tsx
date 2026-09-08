import React, { useState } from 'react';
import { Faculty, StudyProgram } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  GraduationCap, 
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  BookOpen,
  Info
} from 'lucide-react';

interface FacultiesViewProps {
  faculties: Faculty[];
  studyPrograms?: StudyProgram[];
  onAdd?: (faculty: Omit<Faculty, 'id'>) => void;
  onUpdate?: (faculty: Faculty) => void;
  onDelete?: (id: number) => { success: boolean; message: string } | void;
  onToggleStatus?: (id: number) => void;
  // Aliases for compatibility
  onAddFaculty?: (faculty: Omit<Faculty, 'id'>) => void;
  onUpdateFaculty?: (faculty: Faculty) => void;
  onDeleteFaculty?: (id: number) => { success: boolean; message: string } | void;
  onToggleActive?: (id: number) => void;
}

export const FacultiesView: React.FC<FacultiesViewProps> = ({
  faculties = [],
  studyPrograms = [],
  onAdd,
  onUpdate,
  onDelete,
  onToggleStatus,
  onAddFaculty,
  onUpdateFaculty,
  onDeleteFaculty,
  onToggleActive,
}) => {
  const handleAddAction = onAdd || onAddFaculty;
  const handleUpdateAction = onUpdate || onUpdateFaculty;
  const handleDeleteAction = onDelete || onDeleteFaculty;
  const handleToggleAction = onToggleStatus || onToggleActive;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Faculty | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Faculty | null>(null);
  const [viewingProdiFaculty, setViewingProdiFaculty] = useState<Faculty | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    dean: '',
    building: '',
    isActive: true
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      dean: '',
      building: 'Kampus Utama UNIHAZ Bengkulu',
      isActive: true
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Faculty) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      dean: item.dean,
      building: item.building || '',
      isActive: item.isActive
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || !formData.dean.trim()) {
      setErrorMessage('Semua field bertanda bintang (*) wajib diisi');
      return;
    }

    // Check code duplication
    const duplicateCode = faculties.find(
      (f) => f.code.toLowerCase() === formData.code.trim().toLowerCase() && f.id !== editingItem?.id
    );
    if (duplicateCode) {
      setErrorMessage(`Kode Fakultas '${formData.code.trim()}' sudah digunakan oleh fakultas lain`);
      return;
    }

    if (editingItem) {
      if (handleUpdateAction) {
        handleUpdateAction({
          ...editingItem,
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          dean: formData.dean.trim(),
          building: formData.building.trim(),
          isActive: formData.isActive
        });
      }
    } else {
      if (handleAddAction) {
        handleAddAction({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          dean: formData.dean.trim(),
          building: formData.building.trim(),
          isActive: formData.isActive,
          studyProgramsCount: 0
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

  // Helper to count study programs per faculty
  const getProdiCount = (facultyId: number) => {
    return studyPrograms.filter((p) => p.facultyId === facultyId).length;
  };

  // Filter faculties
  const filteredFaculties = faculties.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dean.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ACTIVE') return matchesSearch && item.isActive;
    if (statusFilter === 'INACTIVE') return matchesSearch && !item.isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Institutional Banner */}
      <div className="rounded-xl bg-[#1e3a8a] p-5 text-white shadow-sm border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5 text-yellow-400" />
            <span>Master Data Struktur Universitas</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Kelola Master Fakultas UNIHAZ
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Data fakultas induk di lingkungan Universitas Prof. Dr. Hazairin, SH yang menaungi seluruh Program Studi pilihan calon penerima beasiswa KIP-Kuliah.
          </p>
        </div>

        <button
          id="btn-tambah-fakultas"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Fakultas</span>
        </button>
      </div>

      {/* Summary Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Fakultas</span>
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{faculties.length} Fakultas</div>
          <div className="text-[10px] text-slate-500 font-medium">Universitas Hazairin</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Fakultas Aktif</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700">
            {faculties.filter((f) => f.isActive).length} Aktif
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Menerima Pendaftar</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Program Studi</span>
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-purple-900">{studyPrograms.length} Prodi</div>
          <div className="text-[10px] text-slate-500 font-medium">Jenjang S1 & D3</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Kuota Prodi</span>
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700">
            {studyPrograms.reduce((sum, p) => sum + p.quota, 0)} Kursi KIP-K
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Alokasi se-universitas</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daftar Fakultas Resmi UNIHAZ</h3>
            <p className="text-xs text-slate-500 mt-0.5">Relasi 1 Fakultas dapat menaungi beberapa Program Studi</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-fakultas"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari fakultas / dekan..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-800 w-44 bg-slate-50 focus:bg-white"
              />
            </div>

            <select
              id="filter-status-fakultas"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Aktif</option>
              <option value="INACTIVE">Hanya Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-12">No</th>
                <th className="py-2.5 px-3 text-center w-20">Kode</th>
                <th className="py-2.5 px-4">Nama Fakultas</th>
                <th className="py-2.5 px-4">Dekan / Pimpinan</th>
                <th className="py-2.5 px-4">Gedung / Lokasi</th>
                <th className="py-2.5 px-3 text-center">Relasi Prodi</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFaculties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data fakultas yang cocok.
                  </td>
                </tr>
              ) : (
                filteredFaculties.map((item, idx) => {
                  const prodiCount = getProdiCount(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-900 border border-blue-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {item.dean}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {item.building || 'Kampus Utama UNIHAZ'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setViewingProdiFaculty(item)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-100 text-slate-800 hover:text-blue-950 transition cursor-pointer"
                          title="Lihat daftar Program Studi di bawah fakultas ini"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                          <span>{prodiCount} Prodi</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAction && handleToggleAction(item.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
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
                            title="Edit Fakultas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                            title="Hapus Fakultas"
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

        {/* Footer info note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>Fakultas yang menaungi Program Studi aktif tidak dapat dihapus demi menjaga integritas relasi foreign key database.</span>
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1e3a8a] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-yellow-400" />
                <h3 className="font-bold text-sm">
                  {editingItem ? 'Edit Data Fakultas' : 'Tambah Fakultas Baru'}
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
                    Kode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FH"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 uppercase"
                  />
                  <span className="text-[10px] text-slate-400">Contoh: FH</span>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Fakultas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Fakultas Hukum"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Dekan / Pimpinan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Helmi, SH, M.Hum"
                  value={formData.dean}
                  onChange={(e) => setFormData({ ...formData, dean: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gedung / Lokasi Kampus
                </label>
                <input
                  type="text"
                  placeholder="Gedung A Kampus UNIHAZ"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="facultyActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-800"
                />
                <label htmlFor="facultyActiveCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Status Aktif (Dapat dipilih calon mahasiswa)
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
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Fakultas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relasi Fakultas → Program Studi Modal */}
      {viewingProdiFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1e3a8a] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-bold text-sm">Program Studi di {viewingProdiFaculty.name}</h3>
                  <p className="text-[11px] text-blue-200">Dekan: {viewingProdiFaculty.dean}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingProdiFaculty(null)}
                className="text-blue-200 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                <span>Relasi Database: <strong>faculties</strong> (id: {viewingProdiFaculty.id}) &rarr; <strong>study_programs</strong> (faculty_id)</span>
                <span className="font-bold text-blue-900">{getProdiCount(viewingProdiFaculty.id)} Program Studi</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {studyPrograms.filter((p) => p.facultyId === viewingProdiFaculty.id).length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                    Belum ada program studi yang terdaftar di bawah fakultas ini.
                  </div>
                ) : (
                  studyPrograms
                    .filter((p) => p.facultyId === viewingProdiFaculty.id)
                    .map((prodi) => (
                      <div
                        key={prodi.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-500">[{prodi.code}]</span>
                            <span className="font-bold text-slate-900 text-xs">{prodi.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                              {prodi.degree}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Akreditasi: <strong>{prodi.accreditation}</strong> &bull; Kuota: <strong>{prodi.quota} Kursi</strong> &bull; Gelar: {prodi.title}
                          </div>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prodi.isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {prodi.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setViewingProdiFaculty(null)}
                  className="px-4 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
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
                <h3 className="font-bold text-sm text-slate-900">Hapus Fakultas?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus data fakultas <strong>{deleteCandidate.name} ({deleteCandidate.code})</strong>?
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
