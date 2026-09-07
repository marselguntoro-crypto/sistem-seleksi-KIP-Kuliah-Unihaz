import React, { useState } from 'react';
import { AcademicYear } from '../../types';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Users, 
  AlertCircle,
  Clock,
  ShieldAlert,
  Info
} from 'lucide-react';

interface AcademicYearsViewProps {
  academicYears: AcademicYear[];
  onAdd?: (academicYear: Omit<AcademicYear, 'id'>) => void;
  onUpdate?: (academicYear: AcademicYear) => void;
  onDelete?: (id: number) => { success: boolean; message: string } | void;
  onSetActive?: (id: number) => void;
  // Aliases for compatibility
  onAddYear?: (academicYear: Omit<AcademicYear, 'id'>) => void;
  onUpdateYear?: (academicYear: AcademicYear) => void;
  onDeleteYear?: (id: number) => { success: boolean; message: string } | void;
  onToggleActive?: (id: number) => void;
}

export const AcademicYearsView: React.FC<AcademicYearsViewProps> = ({
  academicYears = [],
  onAdd,
  onUpdate,
  onDelete,
  onSetActive,
  onAddYear,
  onUpdateYear,
  onDeleteYear,
  onToggleActive,
}) => {
  const handleAddAction = onAdd || onAddYear;
  const handleUpdateAction = onUpdate || onUpdateYear;
  const handleDeleteAction = onDelete || onDeleteYear;
  const handleSetActiveAction = onSetActive || onToggleActive;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYear | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AcademicYear | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '2027/2028',
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    quota: 120,
    startDate: '2027-05-01',
    endDate: '2027-08-31',
    isActive: false,
    description: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: '2027/2028',
      semester: 'Ganjil',
      quota: 120,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      isActive: false,
      description: 'Penerimaan Mahasiswa Baru KIP-Kuliah Periode 2027/2028'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AcademicYear) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      semester: item.semester,
      quota: item.quota,
      startDate: item.startDate,
      endDate: item.endDate,
      isActive: item.isActive,
      description: item.description || ''
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    const codeRegex = /^\d{4}\/\d{4}$/;
    if (!codeRegex.test(formData.code.trim())) {
      setErrorMessage('Format Tahun Akademik harus YYYY/YYYY (contoh: 2026/2027)');
      return;
    }
    if (formData.quota <= 0) {
      setErrorMessage('Kuota KIP-K harus lebih besar dari 0');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setErrorMessage('Tanggal Selesai tidak boleh mendahului Tanggal Mulai');
      return;
    }

    if (editingItem) {
      if (handleUpdateAction) {
        handleUpdateAction({
          ...editingItem,
          code: formData.code.trim(),
          semester: formData.semester,
          quota: Number(formData.quota),
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          description: formData.description.trim()
        });
      }
    } else {
      if (handleAddAction) {
        handleAddAction({
          code: formData.code.trim(),
          semester: formData.semester,
          quota: Number(formData.quota),
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
          description: formData.description.trim(),
          participantsCount: 0
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

  // Filtered academic years
  const filteredYears = academicYears.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'ACTIVE') return matchesSearch && item.isActive;
    if (statusFilter === 'INACTIVE') return matchesSearch && !item.isActive;
    return matchesSearch;
  });

  // Calculate summary metrics
  const totalYears = academicYears.length;
  const activeYear = academicYears.find((y) => y.isActive);
  const totalQuota = academicYears.reduce((sum, y) => sum + y.quota, 0);
  const totalParticipants = academicYears.reduce((sum, y) => sum + (y.participantsCount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#1e3a8a] p-5 text-white shadow-sm border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 text-yellow-400" />
            <span>Master Data Periode & Kuota</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Kelola Tahun Akademik KIP-Kuliah
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Pengaturan periode seleksi KIP-Kuliah UNIHAZ. Menentukan tahun akademik aktif, semester pendaftaran, serta kuota beasiswa pemerintah.
          </p>
        </div>

        <button
          id="btn-tambah-tahun-akademik"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tahun Akademik</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tahun Aktif</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700">
            {activeYear ? activeYear.code : 'Belum Ada'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Semester {activeYear?.semester || '-'}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Kuota KIP-K Aktif</span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-900">
            {activeYear ? activeYear.quota : 0} Mahasiswa
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Alokasi Kemendikbudristek</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Periode</span>
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{totalYears} Periode</div>
          <div className="text-[10px] text-slate-500 font-medium">Termasuk riwayat arsip</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Pendaftar</span>
            <Users className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-purple-900">{totalParticipants} Peserta</div>
          <div className="text-[10px] text-slate-500 font-medium">Akumulasi seluruh tahun</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daftar Master Tahun Akademik</h3>
            <p className="text-xs text-slate-500 mt-0.5">Satu tahun akademik aktif menjadi rujukan validasi pendaftar baru</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-tahun-akademik"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari tahun / ket..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-800 w-44 bg-slate-50 focus:bg-white"
              />
            </div>

            <select
              id="filter-status-tahun"
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-12">No</th>
                <th className="py-2.5 px-4">Tahun Akademik</th>
                <th className="py-2.5 px-3">Semester</th>
                <th className="py-2.5 px-3 text-right">Kuota KIP-K</th>
                <th className="py-2.5 px-4">Periode Pendaftaran</th>
                <th className="py-2.5 px-3 text-center">Jumlah Pendaftar</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredYears.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data tahun akademik yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredYears.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <span>{item.code}</span>
                        {item.isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                            AKTIF
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                      Semester {item.semester}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 whitespace-nowrap">
                      {item.quota} Orang
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.startDate} s/d {item.endDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {item.participantsCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleSetActiveAction && handleSetActiveAction(item.id)}
                        disabled={item.isActive}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                            : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
                        }`}
                        title={item.isActive ? 'Tahun Akademik Sedang Aktif' : 'Klik untuk Jadikan Aktif'}
                      >
                        {item.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Set Aktif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Tahun Akademik"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(item)}
                          disabled={item.isActive || (item.participantsCount && item.participantsCount > 0) ? true : false}
                          className={`p-1.5 rounded-lg border transition ${
                            item.isActive || (item.participantsCount && item.participantsCount > 0)
                              ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                              : 'border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                          }`}
                          title={
                            item.isActive
                              ? 'Tidak dapat menghapus tahun akademik aktif'
                              : item.participantsCount && item.participantsCount > 0
                              ? 'Tidak dapat menghapus tahun akademik yang memiliki data peserta'
                              : 'Hapus Tahun Akademik'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>Hanya satu tahun akademik yang dapat berstatus <strong>Aktif</strong>. Mengaktifkan tahun baru akan otomatis menonaktifkan tahun sebelumnya.</span>
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1e3a8a] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <h3 className="font-bold text-sm">
                  {editingItem ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik Baru'}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Tahun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2026/2027"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                  <span className="text-[10px] text-slate-400">Format: YYYY/YYYY</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kuota KIP-Kuliah (Mahasiswa) <span className="text-rose-500">*</span>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan alokasi atau catatan surat keputusan rektor..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-800"
                />
                <label htmlFor="isActiveCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Jadikan Tahun Akademik Aktif Sekarang
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
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Tahun Akademik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Safeguard Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hapus Tahun Akademik?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus data Tahun Akademik <strong>{deleteCandidate.code}</strong> (Semester {deleteCandidate.semester})?
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
