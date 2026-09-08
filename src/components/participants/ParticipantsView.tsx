import React, { useState, useMemo } from 'react';
import { Participant, StudyProgram, AcademicYear } from '../../types';
import { ParticipantDetailModal } from './ParticipantDetailModal';
import { ParticipantFormModal } from './ParticipantFormModal';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Phone, 
  Mail, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  GraduationCap,
  Calendar,
  FileSpreadsheet,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ParticipantsViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  academicYears: AcademicYear[];
  onAdd: (participant: Omit<Participant, 'id'>) => void;
  onUpdate: (participant: Participant) => void;
  onDelete: (id: number) => void;
  onBatchDelete?: (ids: number[]) => void;
  onNavigateToImport: () => void;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  participants,
  studyPrograms,
  academicYears,
  onAdd,
  onUpdate,
  onDelete,
  onBatchDelete,
  onNavigateToImport,
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedProdi1, setSelectedProdi1] = useState<string>('ALL');
  const [selectedProdi2, setSelectedProdi2] = useState<string>('ALL');
  const [selectedDesil, setSelectedDesil] = useState<string>('ALL');
  const [selectedDocStatus, setSelectedDocStatus] = useState<string>('ALL');
  const [selectedSelectionStatus, setSelectedSelectionStatus] = useState<string>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'regNumber' | 'finalScore' | 'desil' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [detailModalParticipant, setDetailModalParticipant] = useState<Participant | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Participant | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  // Selected checkbox IDs for bulk operations
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter & Search Logic
  const filteredParticipants = useMemo(() => {
    return participants.filter((item) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(searchLower) ||
        item.regNumber.toLowerCase().includes(searchLower) ||
        item.nik.includes(searchLower) ||
        item.nisn.includes(searchLower) ||
        item.schoolOrigin.toLowerCase().includes(searchLower) ||
        item.city.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Year Filter
      if (selectedYear !== 'ALL' && item.academicYearId.toString() !== selectedYear) {
        return false;
      }

      // Prodi 1 Filter
      if (selectedProdi1 !== 'ALL' && item.firstChoiceProdiId.toString() !== selectedProdi1) {
        return false;
      }

      // Prodi 2 Filter
      if (selectedProdi2 !== 'ALL' && item.secondChoiceProdiId.toString() !== selectedProdi2) {
        return false;
      }

      // Desil Filter
      if (selectedDesil !== 'ALL' && item.desil !== selectedDesil) {
        return false;
      }

      // Doc Status Filter
      if (selectedDocStatus !== 'ALL' && item.documentStatus !== selectedDocStatus) {
        return false;
      }

      // Selection Status Filter
      if (selectedSelectionStatus !== 'ALL' && item.selectionStatus !== selectedSelectionStatus) {
        return false;
      }

      return true;
    });
  }, [
    participants,
    searchTerm,
    selectedYear,
    selectedProdi1,
    selectedProdi2,
    selectedDesil,
    selectedDocStatus,
    selectedSelectionStatus,
  ]);

  // Sorting Logic
  const sortedParticipants = useMemo(() => {
    return [...filteredParticipants].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'regNumber') {
        comparison = a.regNumber.localeCompare(b.regNumber);
      } else if (sortField === 'finalScore') {
        comparison = (a.finalScore || 0) - (b.finalScore || 0);
      } else if (sortField === 'desil') {
        comparison = a.desil.localeCompare(b.desil);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredParticipants, sortField, sortDirection]);

  // Pagination Slice
  const totalPages = Math.ceil(sortedParticipants.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedParticipants.slice(startIndex, startIndex + pageSize);
  }, [sortedParticipants, currentPage, pageSize]);

  // Handle Sort Change
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedYear('ALL');
    setSelectedProdi1('ALL');
    setSelectedProdi2('ALL');
    setSelectedDesil('ALL');
    setSelectedDocStatus('ALL');
    setSelectedSelectionStatus('ALL');
    setCurrentPage(1);
  };

  // WhatsApp helper
  const handleOpenWhatsApp = (p: Participant, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      alert(`Nomor WhatsApp untuk ${p.name} belum tersedia atau kosong.`);
      return;
    }
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const msg = encodeURIComponent(
      `Halo Sdr/i ${p.name}, Panitia Seleksi KIP-Kuliah UNIHAZ 2026 mengonfirmasi berkas Anda (No: ${p.regNumber}). Mohon siapkan kelengkapan berkas untuk tahap berikutnya.`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const exportData = sortedParticipants.map((p, idx) => ({
      'No': idx + 1,
      'No Registrasi': p.regNumber,
      'Nama Peserta': p.name,
      'NIK': p.nik,
      'NISN': p.nisn,
      'Tahun Akademik': p.academicYearCode,
      'Pilihan Prodi 1': p.firstChoiceProdiName,
      'Pilihan Prodi 2': p.secondChoiceProdiName,
      'Asal Sekolah': p.schoolOrigin,
      'Jurusan': p.schoolMajor || '-',
      'Tahun Lulus': p.graduationYear,
      'No WhatsApp': p.phone,
      'Email': p.email,
      'Desil P3KE': p.desil,
      'Nama Orang Tua': p.parentName,
      'Pekerjaan Ortu': p.parentJob,
      'Penghasilan Ortu': p.parentIncome,
      'Tanggungan': p.familyDependents,
      'Status Berkas': p.documentStatus,
      'Skor UTBK': p.utbkScore || 0,
      'Skor Wawancara': p.interviewScore || 0,
      'Skor Survey': p.surveyScore || 0,
      'Nilai Akhir': p.finalScore || 0,
      'Status Kelulusan': p.selectionStatus,
      'Peringkat': p.rank || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Peserta KIP-K');
    XLSX.writeFile(wb, `Data_Peserta_KIPK_UNIHAZ_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Bulk selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const set = new Set(selectedIds);
      paginatedData.forEach((p) => set.add(p.id));
      setSelectedIds(Array.from(set));
    } else {
      const pageSet = new Set(paginatedData.map((p) => p.id));
      setSelectedIds(selectedIds.filter((id) => !pageSet.has(id)));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Controls */}
      <div className="rounded-xl bg-[#1e3a8a] p-5 text-white shadow-sm border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-yellow-400" />
            <span>Pangkalan Data Calon Mahasiswa</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Kelola Data Peserta KIP-Kuliah UNIHAZ
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Data lengkap pendaftar beasiswa KIP-Kuliah, verifikasi berkas, desil P3KE, scoring tes UTBK, wawancara, survey lapangan, dan pengumuman hasil seleksi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-import-peserta"
            onClick={onNavigateToImport}
            className="px-3.5 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer border border-blue-700"
          >
            <Upload className="w-3.5 h-3.5 text-yellow-400" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            id="btn-export-peserta"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Download file Excel data peserta yang terfilter"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            id="btn-tambah-peserta"
            onClick={() => {
              setEditingParticipant(null);
              setFormModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Peserta</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Pendaftar</span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900">{participants.length} Orang</div>
          <div className="text-[10px] text-slate-500 font-medium">{filteredParticipants.length} sesuai filter saat ini</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Berkas Lengkap</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700">
            {participants.filter((p) => p.documentStatus === 'Lengkap').length} Peserta
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Lolos verifikasi administrasi</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Desil 1 & 2 Prioritas</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-700">
            {participants.filter((p) => p.desil === 'Desil 1' || p.desil === 'Desil 2').length} Peserta
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Afirmasi kemiskinan ekstrem</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Lulus Seleksi Akhir</span>
            <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700">
            {participants.filter((p) => p.selectionStatus === 'Lulus').length} Peserta
          </div>
          <div className="text-[10px] text-slate-500 font-medium">Memperoleh SK Rektor KIP-K</div>
        </div>
      </div>

      {/* Filter & Search Bar Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-peserta"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Nama Peserta, No Pendaftaran, NIK (16 digit), NISN, Asal Sekolah, Kota..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-800 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap"
              title="Reset semua filter"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* Multi-Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {/* 1. Tahun Akademik */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tahun Akademik
            </label>
            <select
              id="filter-peserta-tahun"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
            >
              <option value="ALL">Semua Periode</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id.toString()}>
                  {y.code} {y.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Pilihan Prodi 1 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pilihan Prodi 1
            </label>
            <select
              id="filter-peserta-prodi1"
              value={selectedProdi1}
              onChange={(e) => {
                setSelectedProdi1(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800 truncate"
            >
              <option value="ALL">Semua Prodi 1</option>
              {studyPrograms.map((p) => (
                <option key={p.id} value={p.id.toString()}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Pilihan Prodi 2 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pilihan Prodi 2
            </label>
            <select
              id="filter-peserta-prodi2"
              value={selectedProdi2}
              onChange={(e) => {
                setSelectedProdi2(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800 truncate"
            >
              <option value="ALL">Semua Prodi 2</option>
              {studyPrograms.map((p) => (
                <option key={p.id} value={p.id.toString()}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Desil Kemiskinan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Desil P3KE
            </label>
            <select
              id="filter-peserta-desil"
              value={selectedDesil}
              onChange={(e) => {
                setSelectedDesil(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
            >
              <option value="ALL">Semua Desil</option>
              <option value="Non-Desil">Non-Desil</option>
              <option value="Desil 1">Desil 1 (Ekstrem)</option>
              <option value="Desil 2">Desil 2 (Sangat Miskin)</option>
              <option value="Desil 3">Desil 3 (Hampir Miskin)</option>
              <option value="Desil 4">Desil 4 (Rentan)</option>
              <option value="Desil 5">Desil 5 (Menengah Bawah)</option>
              <option value="Desil 6-10">Desil 6-10 (Menengah ke Atas)</option>
            </select>
          </div>

          {/* 5. Status Verifikasi Berkas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status Berkas
            </label>
            <select
              id="filter-peserta-berkas"
              value={selectedDocStatus}
              onChange={(e) => {
                setSelectedDocStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
            >
              <option value="ALL">Semua Berkas</option>
              <option value="Belum Diverifikasi">Belum Diverifikasi</option>
              <option value="Lengkap">Lengkap</option>
              <option value="Perlu Perbaikan">Perlu Perbaikan</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          {/* 6. Status Seleksi Kelulusan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status Kelulusan
            </label>
            <select
              id="filter-peserta-seleksi"
              value={selectedSelectionStatus}
              onChange={(e) => {
                setSelectedSelectionStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
            >
              <option value="ALL">Semua Status</option>
              <option value="Lulus">Lulus</option>
              <option value="Cadangan">Cadangan</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
              <option value="Belum Diproses">Belum Diproses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main High Density Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Subheader */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Menampilkan <strong>{paginatedData.length}</strong> dari <strong>{sortedParticipants.length}</strong> data peserta</span>
            {selectedIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px]">
                {selectedIds.length} baris terpilih
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px]">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
            >
              <option value={10}>10 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar when rows are selected */}
        {selectedIds.length > 0 && (
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-950">
                {selectedIds.length} peserta terpilih
              </span>
              {selectedIds.length < filteredParticipants.length && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(filteredParticipants.map((p) => p.id))}
                  className="text-blue-700 hover:text-blue-900 underline font-medium cursor-pointer"
                >
                  Pilih semua {filteredParticipants.length} data hasil filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded font-medium cursor-pointer"
              >
                Batal Pilih
              </button>
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginatedData.length > 0 && paginatedData.every((p) => selectedIds.includes(p.id))}
                    className="rounded text-blue-900 focus:ring-blue-800 cursor-pointer"
                    title={paginatedData.every((p) => selectedIds.includes(p.id)) ? 'Batal Pilih Semua' : 'Pilih Semua di Halaman Ini'}
                  />
                </th>
                <th className="py-2.5 px-2 text-center w-10">No</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-3 cursor-pointer hover:text-blue-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Identitas Calon Mahasiswa</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">Pilihan Program Studi</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Asal Sekolah</th>
                <th
                  onClick={() => handleSort('desil')}
                  className="py-2.5 px-3 cursor-pointer hover:text-blue-900 text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Desil</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Status Berkas</th>
                <th
                  onClick={() => handleSort('finalScore')}
                  className="py-2.5 px-3 cursor-pointer hover:text-blue-900 text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Nilai & Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Kontak WA</th>
                <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-xs">Tidak ada data peserta yang cocok dengan filter pencarian.</p>
                      <button
                        onClick={handleResetFilters}
                        className="text-blue-700 underline text-xs cursor-pointer mt-1"
                      >
                        Reset semua filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
                  const formattedPhone = cleanPhone ? (cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone) : '';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/40 border-b border-slate-100 transition-colors ${
                        isSelected ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(item.id)}
                          className="rounded text-blue-900 focus:ring-blue-800"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px]">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs hover:text-blue-900 cursor-pointer" onClick={() => setDetailModalParticipant(item)}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span className="text-blue-900 font-semibold">{item.regNumber}</span>
                          <span>&bull;</span>
                          <span>NIK: {item.nik}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[9px] font-bold shrink-0">1</span>
                          <span className="truncate max-w-[140px]" title={item.firstChoiceProdiName}>{item.firstChoiceProdiName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0">2</span>
                          <span className="truncate max-w-[140px]" title={item.secondChoiceProdiName || 'Tidak Memilih'}>
                            {item.secondChoiceProdiName || <span className="italic text-slate-400 font-normal">Tidak Memilih</span>}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-xs text-slate-800 font-medium truncate max-w-[130px]" title={item.schoolOrigin}>
                          {item.schoolOrigin}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.city}, {item.graduationYear}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.desil ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.desil === 'Desil 1'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : item.desil === 'Desil 2'
                                ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                : item.desil === 'Desil 3'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : item.desil === 'Desil 4'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                : item.desil === 'Desil 5'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : item.desil === 'Desil 6-10'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {item.desil}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            -
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.documentStatus === 'Lengkap'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.documentStatus === 'Perlu Perbaikan'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : item.documentStatus === 'Ditolak'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.documentStatus}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.finalScore ? (
                          <div>
                            <span className="font-mono font-bold text-xs text-blue-900">{item.finalScore}</span>
                            <div className="mt-0.5">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  item.selectionStatus === 'Lulus'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.selectionStatus === 'Cadangan'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.selectionStatus}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum dinilai</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.phone ? (
                          <button
                            onClick={(e) => handleOpenWhatsApp(item, e)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold transition cursor-pointer"
                            title={`Kirim pesan WhatsApp ke ${item.name} (${item.phone})`}
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Tanpa WA</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setDetailModalParticipant(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                            title="Detail Lengkap Peserta"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingParticipant(item);
                              setFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit Data Peserta"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Peserta"
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

        {/* Pagination Controls */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total <strong>{sortedParticipants.length}</strong> peserta)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-blue-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModalParticipant && (
        <ParticipantDetailModal
          participant={detailModalParticipant}
          onClose={() => setDetailModalParticipant(null)}
          onEdit={(p) => {
            setDetailModalParticipant(null);
            setEditingParticipant(p);
            setFormModalOpen(true);
          }}
        />
      )}

      {/* Form Modal (Add / Edit) */}
      {formModalOpen && (
        <ParticipantFormModal
          initialData={editingParticipant}
          studyPrograms={studyPrograms}
          academicYears={academicYears}
          existingParticipants={participants}
          onClose={() => {
            setFormModalOpen(false);
            setEditingParticipant(null);
          }}
          onSubmit={(data) => {
            if (editingParticipant) {
              onUpdate({
                ...editingParticipant,
                ...data
              });
            } else {
              onAdd({
                ...data,
                documentStatus: 'Belum Diverifikasi',
                selectionStatus: 'Belum Diproses',
                utbkScore: 0,
                interviewScore: 0,
                surveyScore: 0,
                finalScore: 0,
                createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
              });
            }
            setFormModalOpen(false);
            setEditingParticipant(null);
          }}
        />
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
                <h3 className="font-bold text-sm text-slate-900">Hapus Peserta Seleksi?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus data peserta <strong>{deleteCandidate.name}</strong> ({deleteCandidate.regNumber})?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDelete(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-rose-600 text-white hover:bg-rose-500 font-bold shadow-xs cursor-pointer"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hapus Semua Terpilih?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus sebanyak <strong>{selectedIds.length} data peserta</strong> terpilih secara permanen dari sistem?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (onBatchDelete) {
                    onBatchDelete(selectedIds);
                  } else {
                    selectedIds.forEach((id) => onDelete(id));
                  }
                  setSelectedIds([]);
                  setIsBatchDeleteModalOpen(false);
                }}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-rose-600 text-white hover:bg-rose-500 font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus {selectedIds.length} Peserta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
