import React, { useState, useMemo } from 'react';
import { Participant, StudyProgram, AcademicYear, User } from '../../types';
import {
  FileText,
  Printer,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  Award,
  Eye,
  FileSpreadsheet,
  Image as ImageIcon,
  Upload,
  Edit3,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Layers,
  Sliders,
  Trash2,
  UserCheck
} from 'lucide-react';

interface ReportsViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  academicYears: AcademicYear[];
  currentUser: User;
}

interface KopConfig {
  type: 'default' | 'custom_image';
  customImageUrl: string | null;
  imageMaxHeight: number;
  yayasanText: string;
  kampusText: string;
  alamatText: string;
  kontakText: string;
  logoText: string;
}

interface SignatureConfig {
  nomorSK: string;
  judulSK: string;
  perihalSK: string;
  pihak1Label: string;
  pihak1Jabatan: string;
  pihak1Nama: string;
  pihak1Nip: string;
  pihak1TtdImage: string | null;
  pihak2KotaTanggal: string;
  pihak2Jabatan: string;
  pihak2Nama: string;
  pihak2Nip: string;
  pihak2TtdImage: string | null;
}

const DEFAULT_KOP_CONFIG: KopConfig = {
  type: 'default',
  customImageUrl: null,
  imageMaxHeight: 110,
  yayasanText: 'YAYASAN SEMARAK BENGKULU',
  kampusText: 'UNIVERSITAS PROF. DR. HAZAIRIN, SH',
  alamatText: 'Jl. Jenderal Ahmad Yani No. 1, Pintu Batu, Kec. Teluk Segara, Kota Bengkulu 38117',
  kontakText: 'Telepon: (0736) 21764, 21876 | Email: spmb@unihaz.ac.id | Laman: www.unihaz.ac.id',
  logoText: 'UH'
};

const DEFAULT_SIGNATURE_CONFIG: SignatureConfig = {
  nomorSK: 'NOMOR: B/142/UN43/KM.01.00/2026',
  judulSK: 'SURAT KEPUTUSAN REKTOR UNIVERSITAS PROF. DR. HAZAIRIN, SH',
  perihalSK: 'TENTANG PENETAPAN KELULUSAN SELEKSI PENERIMA PROGRAM KARTU INDONESIA PINTAR (KIP) KULIAH',
  pihak1Label: 'Mengetahui,',
  pihak1Jabatan: 'Ketua Panitia Seleksi KIP-Kuliah',
  pihak1Nama: 'Dr. H. Ramli Ahmad, M.Si',
  pihak1Nip: 'NIP. 197103141998031002',
  pihak1TtdImage: null,
  pihak2KotaTanggal: 'Ditetapkan di Kota Bengkulu, 30 September 2026',
  pihak2Jabatan: 'Rektor Universitas Prof. Dr. Hazairin, SH',
  pihak2Nama: 'Prof. Dr. H. Herman Suwardi, M.M',
  pihak2Nip: 'NIP. 196508201990031001',
  pihak2TtdImage: null
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  participants,
  studyPrograms,
  academicYears,
  currentUser
}) => {
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(
    String(academicYears.find((y) => y.isActive)?.id || academicYears[0]?.id || '1')
  );
  const [selectedProdiId, setSelectedProdiId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL_PASSED'); // Default: Semua yang lulus KIP
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state for customization
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Persistent Kop Configuration
  const [kopConfig, setKopConfig] = useState<KopConfig>(() => {
    try {
      const saved = localStorage.getItem('unihaz_report_kop_config');
      return saved ? { ...DEFAULT_KOP_CONFIG, ...JSON.parse(saved) } : DEFAULT_KOP_CONFIG;
    } catch {
      return DEFAULT_KOP_CONFIG;
    }
  });
  const [tempKopConfig, setTempKopConfig] = useState<KopConfig>(kopConfig);

  // Persistent Signature & Leadership Configuration
  const [signatureConfig, setSignatureConfig] = useState<SignatureConfig>(() => {
    try {
      const saved = localStorage.getItem('unihaz_report_sign_config');
      return saved ? { ...DEFAULT_SIGNATURE_CONFIG, ...JSON.parse(saved) } : DEFAULT_SIGNATURE_CONFIG;
    } catch {
      return DEFAULT_SIGNATURE_CONFIG;
    }
  });
  const [tempSignatureConfig, setTempSignatureConfig] = useState<SignatureConfig>(signatureConfig);

  // Selected Academic Year Object
  const currentAcademicYear = useMemo(() => {
    return academicYears.find((y) => String(y.id) === selectedAcademicYearId) || academicYears[0];
  }, [academicYears, selectedAcademicYearId]);

  const isPassedStatus = (status?: string) =>
    status === 'Lulus' ||
    status === 'Lulus KIP DIKTI' ||
    status === 'Lulus KIP Aspirasi' ||
    status === 'Lulus KIP Jalur Lainnya';

  // Filtered Participants
  const filteredParticipants = useMemo(() => {
    return participants
      .filter((p) => {
        const matchesYear =
          selectedAcademicYearId === 'ALL' ||
          String(p.academicYearId) === selectedAcademicYearId;

        const matchesProdi =
          selectedProdiId === 'ALL' ||
          String(p.firstChoiceProdiId) === selectedProdiId;

        const matchesStatus =
          selectedStatus === 'ALL' ||
          (selectedStatus === 'ALL_PASSED' && isPassedStatus(p.selectionStatus)) ||
          p.selectionStatus === selectedStatus;

        const matchesSearch =
          searchTerm === '' ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nik.includes(searchTerm);

        return matchesYear && matchesProdi && matchesStatus && matchesSearch;
      })
      .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  }, [participants, selectedAcademicYearId, selectedProdiId, selectedStatus, searchTerm]);

  // Save Kop Handler
  const handleSaveKopConfig = () => {
    setKopConfig(tempKopConfig);
    try {
      localStorage.setItem('unihaz_report_kop_config', JSON.stringify(tempKopConfig));
    } catch (e) {
      console.error(e);
    }
    setIsKopModalOpen(false);
  };

  const handleResetKopConfig = () => {
    setTempKopConfig(DEFAULT_KOP_CONFIG);
    setKopConfig(DEFAULT_KOP_CONFIG);
    try {
      localStorage.removeItem('unihaz_report_kop_config');
    } catch (e) {
      console.error(e);
    }
    setIsKopModalOpen(false);
  };

  // Upload Kop Image Handler
  const handleUploadKopImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Ukuran berkas gambar kop surat maksimal 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setTempKopConfig((prev) => ({
        ...prev,
        type: 'custom_image',
        customImageUrl: dataUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  // Save Signature Handler
  const handleSaveSignatureConfig = () => {
    setSignatureConfig(tempSignatureConfig);
    try {
      localStorage.setItem('unihaz_report_sign_config', JSON.stringify(tempSignatureConfig));
    } catch (e) {
      console.error(e);
    }
    setIsSignatureModalOpen(false);
  };

  const handleResetSignatureConfig = () => {
    setTempSignatureConfig(DEFAULT_SIGNATURE_CONFIG);
    setSignatureConfig(DEFAULT_SIGNATURE_CONFIG);
    try {
      localStorage.removeItem('unihaz_report_sign_config');
    } catch (e) {
      console.error(e);
    }
    setIsSignatureModalOpen(false);
  };

  // Upload Signature Image Handlers
  const handleUploadTtdPihak1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setTempSignatureConfig((prev) => ({
        ...prev,
        pihak1TtdImage: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadTtdPihak2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setTempSignatureConfig((prev) => ({
        ...prev,
        pihak2TtdImage: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Print Document Handler
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel / CSV Handler
  const handleExportExcel = () => {
    const headers = [
      'No',
      'No Registrasi',
      'Nama Lengkap',
      'NIK',
      'NISN',
      'Program Studi Pilihan 1',
      'Program Studi Pilihan 2',
      'Asal Sekolah',
      'Kategori Desil',
      'Status Berkas',
      'Nilai UTBK',
      'Nilai Wawancara',
      'Nilai Survey',
      'Nilai Akhir',
      'Status Seleksi'
    ];

    const rows = filteredParticipants.map((p, idx) => [
      idx + 1,
      `"${p.regNumber}"`,
      `"${p.name}"`,
      `'${p.nik}`,
      `'${p.nisn}`,
      `"${p.firstChoiceProdiName}"`,
      `"${p.secondChoiceProdiName}"`,
      `"${p.schoolOrigin}"`,
      `"${p.desil}"`,
      `"${p.documentStatus}"`,
      p.utbkScore ? p.utbkScore.toFixed(2) : '0.00',
      p.interviewScore ? p.interviewScore.toFixed(2) : '0.00',
      p.surveyScore ? p.surveyScore.toFixed(2) : '0.00',
      p.finalScore ? p.finalScore.toFixed(2) : '0.00',
      `"${p.selectionStatus}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Seleksi_KIPK_UNIHAZ_${currentAcademicYear?.code.replace('/', '-')}_${selectedStatus}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Toolbar (Hidden when printing) */}
      <div className="print:hidden space-y-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-900 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Laporan & Berita Acara Seleksi KIP-Kuliah</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                  Resmi & Terstandar
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Penerbitan Surat Keputusan (SK) Rektor, Berita Acara Penetapan Hasil Seleksi KIP-Kuliah UNIHAZ, Kustomisasi Kop Surat & Tanda Tangan Pimpinan, Cetak Dokumen / PDF.
              </p>
            </div>
          </div>

          {/* Action Buttons: Kop Surat, Tanda Tangan, Export, Cetak */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTempKopConfig(kopConfig);
                setIsKopModalOpen(true);
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 shadow-2xs"
              title="Kustomisasi Kop Surat atau Upload Gambar Kop"
            >
              <ImageIcon className="w-4 h-4 text-blue-900" />
              <span>Atur Kop Surat {kopConfig.type === 'custom_image' ? '(Kustom)' : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTempSignatureConfig(signatureConfig);
                setIsSignatureModalOpen(true);
              }}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200 shadow-2xs"
              title="Edit Nama Pimpinan, Pejabat Penandatangan, dan Nomor SK"
            >
              <UserCheck className="w-4 h-4 text-indigo-700" />
              <span>Edit Tanda Tangan Pimpinan</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-yellow-300" />
              <span>Cetak Dokumen / PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari peserta dalam laporan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter Laporan:</span>
            </div>

            {/* Tahun Akademik */}
            <select
              value={selectedAcademicYearId}
              onChange={(e) => setSelectedAcademicYearId(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  T.A {y.code} ({y.semester})
                </option>
              ))}
            </select>

            {/* Program Studi */}
            <select
              value={selectedProdiId}
              onChange={(e) => setSelectedProdiId(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer max-w-[200px] truncate"
            >
              <option value="ALL">Semua Program Studi ({studyPrograms.length})</option>
              {studyPrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Seleksi */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="ALL_PASSED">Semua Lulus (DIKTI, Aspirasi, Lainnya)</option>
              <option value="Lulus KIP DIKTI">Lulus KIP DIKTI</option>
              <option value="Lulus KIP Aspirasi">Lulus KIP Aspirasi</option>
              <option value="Lulus KIP Jalur Lainnya">Lulus KIP Jalur Lainnya</option>
              <option value="Cadangan">Cadangan</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
              <option value="Belum Diproses">Belum Diproses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Official Document Preview */}
      <div className="bg-white p-6 sm:p-10 md:p-12 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 max-w-5xl mx-auto text-slate-900 relative">
        
        {/* KOP SURAT AREA */}
        <div className="relative group">
          {/* Quick Edit Kop Badge for Non-Print */}
          <div className="absolute right-0 -top-3 print:hidden opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                setTempKopConfig(kopConfig);
                setIsKopModalOpen(true);
              }}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 text-[10px] font-bold rounded border border-blue-200 flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3 h-3 text-blue-700" />
              <span>Ubah Kop Surat</span>
            </button>
          </div>

          {kopConfig.type === 'custom_image' && kopConfig.customImageUrl ? (
            /* Mode 1: Custom Uploaded Letterhead Image */
            <div className="w-full flex flex-col items-center justify-center mb-6 border-b-4 border-double border-slate-900 pb-3">
              <img
                src={kopConfig.customImageUrl}
                alt="Kop Surat Resmi Universitas Hazairin"
                style={{ maxHeight: `${kopConfig.imageMaxHeight}px` }}
                className="w-full object-contain"
              />
            </div>
          ) : (
            /* Mode 2: Default Typography Official Header */
            <div className="border-b-4 border-double border-slate-900 pb-4 mb-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 bg-blue-900 text-yellow-400 rounded-full flex items-center justify-center font-black text-2xl shrink-0 border-2 border-yellow-400 shadow-sm print:shadow-none">
                  {kopConfig.logoText || 'UH'}
                </div>
                <div className="text-center flex-1">
                  <h4 className="text-xs tracking-widest font-semibold uppercase text-slate-700">
                    {kopConfig.yayasanText}
                  </h4>
                  <h2 className="text-lg md:text-xl font-black uppercase text-blue-950 tracking-tight mt-0.5">
                    {kopConfig.kampusText}
                  </h2>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {kopConfig.alamatText}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {kopConfig.kontakText}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Judul Keputusan / Laporan */}
        <div className="text-center mb-6">
          <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wide underline text-slate-900">
            {signatureConfig.judulSK}
          </h3>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            {signatureConfig.nomorSK}
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-900 mt-2">
            {signatureConfig.perihalSK}
            <br />
            TAHUN AKADEMIK {currentAcademicYear?.code}
          </p>
        </div>

        {/* Ringkasan Parameter Laporan */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4 p-3 bg-slate-50 rounded border border-slate-200 print:bg-transparent print:border-none print:p-0">
          <div>
            <span className="font-semibold text-slate-600">Tahun Akademik: </span>
            <span className="font-bold text-slate-800">{currentAcademicYear?.code} ({currentAcademicYear?.semester})</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Filter Program Studi: </span>
            <span className="font-bold text-slate-800">
              {selectedProdiId === 'ALL'
                ? 'Semua Program Studi'
                : studyPrograms.find((p) => String(p.id) === selectedProdiId)?.name}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Kategori Penetapan: </span>
            <span className="font-bold text-blue-900">
              {selectedStatus === 'ALL_PASSED'
                ? 'SEMUA LULUS (DIKTI, ASPIRASI, LAINNYA)'
                : selectedStatus.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Jumlah Mahasiswa: </span>
            <span className="font-bold text-emerald-800">{filteredParticipants.length} Orang</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="py-2 px-2.5 border border-slate-300 text-center w-8">No</th>
                <th className="py-2 px-3 border border-slate-300">No. Registrasi</th>
                <th className="py-2 px-3 border border-slate-300">Nama Calon Mahasiswa</th>
                <th className="py-2 px-3 border border-slate-300">NIK / Asal Sekolah</th>
                <th className="py-2 px-3 border border-slate-300">Program Studi</th>
                <th className="py-2 px-2 border border-slate-300 text-center">Desil</th>
                <th className="py-2 px-2 border border-slate-300 text-center">UTBK</th>
                <th className="py-2 px-2 border border-slate-300 text-center">Wwncr</th>
                <th className="py-2 px-2 border border-slate-300 text-center">Survey</th>
                <th className="py-2 px-2 border border-slate-300 text-center">Skor Akhir</th>
                <th className="py-2 px-2.5 border border-slate-300 text-center">Status Penetapan</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-slate-500 italic">
                    Tidak ada calon mahasiswa yang ditemukan dengan parameter filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, index) => {
                  const isPassed = isPassedStatus(p.selectionStatus);
                  return (
                    <tr key={`report-row-${p.id}-${index}`} className="border-b border-slate-200">
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-medium">
                        {index + 1}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-[10px]">
                        {p.regNumber}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-bold text-slate-800">
                        {p.name}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300">
                        <div>{p.schoolOrigin}</div>
                        <div className="text-[10px] text-slate-500 font-mono">NIK: {p.nik}</div>
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-medium">
                        {p.firstChoiceProdiName}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-semibold">
                        {p.desil || '-'}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">
                        {p.utbkScore ? p.utbkScore.toFixed(1) : '-'}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">
                        {p.interviewScore ? p.interviewScore.toFixed(1) : '-'}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">
                        {p.surveyScore ? p.surveyScore.toFixed(1) : '-'}
                      </td>
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-bold font-mono text-blue-900">
                        {p.finalScore ? p.finalScore.toFixed(2) : '0.00'}
                      </td>
                      <td className="py-1.5 px-2.5 border border-slate-300 text-center font-bold text-[10px] whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded ${
                            p.selectionStatus === 'Lulus KIP DIKTI'
                              ? 'bg-emerald-100 text-emerald-900'
                              : p.selectionStatus === 'Lulus KIP Aspirasi'
                              ? 'bg-indigo-100 text-indigo-900'
                              : p.selectionStatus === 'Lulus KIP Jalur Lainnya'
                              ? 'bg-teal-100 text-teal-900'
                              : p.selectionStatus === 'Lulus'
                              ? 'bg-emerald-100 text-emerald-900'
                              : p.selectionStatus === 'Cadangan'
                              ? 'bg-amber-100 text-amber-900'
                              : p.selectionStatus === 'Tidak Lulus'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.selectionStatus || 'Belum Diproses'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Resmi Pengesahan */}
        <div className="relative group pt-4 mt-8 break-inside-avoid">
          {/* Quick Edit Signature Button for Non-Print */}
          <div className="absolute right-0 -top-1 print:hidden opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                setTempSignatureConfig(signatureConfig);
                setIsSignatureModalOpen(true);
              }}
              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-[10px] font-bold rounded border border-indigo-200 flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3 h-3 text-indigo-700" />
              <span>Edit Pejabat Penandatangan</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs">
            {/* Pihak 1 (Kiri - Panitia / Pelaksana) */}
            <div className="text-center">
              <p className="text-slate-500 mb-1">{signatureConfig.pihak1Label}</p>
              <p className="font-bold text-slate-800">{signatureConfig.pihak1Jabatan}</p>
              
              <div className="h-20 flex items-center justify-center my-1">
                {signatureConfig.pihak1TtdImage ? (
                  <img
                    src={signatureConfig.pihak1TtdImage}
                    alt="Tanda Tangan Panitia"
                    className="max-h-20 max-w-[160px] object-contain"
                  />
                ) : (
                  <span className="text-slate-300 italic text-[10px]">
                    [Tanda Tangan & Cap Panitia]
                  </span>
                )}
              </div>

              <p className="font-bold underline text-slate-900">{signatureConfig.pihak1Nama}</p>
              <p className="text-[11px] text-slate-600">{signatureConfig.pihak1Nip}</p>
            </div>

            {/* Pihak 2 (Kanan - Pimpinan Universitas / Rektor) */}
            <div className="text-center">
              <p className="text-slate-500 mb-1">{signatureConfig.pihak2KotaTanggal}</p>
              <p className="font-bold text-slate-800">{signatureConfig.pihak2Jabatan}</p>

              <div className="h-20 flex items-center justify-center my-1">
                {signatureConfig.pihak2TtdImage ? (
                  <img
                    src={signatureConfig.pihak2TtdImage}
                    alt="Tanda Tangan Pimpinan"
                    className="max-h-20 max-w-[160px] object-contain"
                  />
                ) : (
                  <span className="text-slate-300 italic text-[10px]">
                    [Tanda Tangan & Cap Rektor]
                  </span>
                )}
              </div>

              <p className="font-bold underline text-slate-900">{signatureConfig.pihak2Nama}</p>
              <p className="text-[11px] text-slate-600">{signatureConfig.pihak2Nip}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: PENGATURAN & CUSTOM UPLOAD KOP SURAT             */}
      {/* ========================================================= */}
      {isKopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#1e3a8a] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-bold text-sm">Pengaturan Kop Surat & Custom Upload</h3>
                  <p className="text-[11px] text-blue-200">
                    Kustomisasi kop surat resmi atau unggah gambar kop instansi Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKopModalOpen(false)}
                className="text-blue-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
              {/* Type Switcher */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tipe Kop Surat:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTempKopConfig({ ...tempKopConfig, type: 'default' })}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                      tempKopConfig.type === 'default'
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                      <FileText className="w-4 h-4 text-blue-800" />
                      <span>Kop Standar Teks</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Teks resmi Yayasan Semarak & Universitas Hazairin
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTempKopConfig({ ...tempKopConfig, type: 'custom_image' })}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                      tempKopConfig.type === 'custom_image'
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                      <Upload className="w-4 h-4 text-indigo-700" />
                      <span>Upload Gambar Kop</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Gunakan gambar kop surat kustom (PNG / JPG)
                    </p>
                  </button>
                </div>
              </div>

              {/* Upload Section if type === custom_image */}
              {tempKopConfig.type === 'custom_image' && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Unggah Berkas Gambar Kop Surat</span>
                    <span className="text-[10px] text-slate-400">PNG / JPG / WEBP (Maks 4MB)</span>
                  </div>

                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-5 bg-white hover:bg-blue-50/40 cursor-pointer transition">
                    <Upload className="w-8 h-8 text-blue-700 mb-1" />
                    <span className="font-semibold text-blue-900">Pilih Berkas Kop dari Komputer</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Rekomendasi rasio lebar penuh (misal: 1200x200 px)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadKopImage}
                      className="hidden"
                    />
                  </label>

                  {tempKopConfig.customImageUrl && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Preview Kop Kustom:</span>
                        <button
                          type="button"
                          onClick={() => setTempKopConfig({ ...tempKopConfig, customImageUrl: null })}
                          className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus Gambar
                        </button>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200 flex justify-center">
                        <img
                          src={tempKopConfig.customImageUrl}
                          alt="Pratinjau Kop"
                          style={{ maxHeight: `${tempKopConfig.imageMaxHeight}px` }}
                          className="w-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Tinggi Maksimal Kop:</span>
                          <span className="font-bold text-blue-900">{tempKopConfig.imageMaxHeight} px</span>
                        </div>
                        <input
                          type="range"
                          min={70}
                          max={220}
                          value={tempKopConfig.imageMaxHeight}
                          onChange={(e) =>
                            setTempKopConfig({
                              ...tempKopConfig,
                              imageMaxHeight: Number(e.target.value)
                            })
                          }
                          className="w-full accent-blue-900 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text Fields if type === default */}
              {tempKopConfig.type === 'default' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Yayasan / Badan Penyelenggara
                    </label>
                    <input
                      type="text"
                      value={tempKopConfig.yayasanText}
                      onChange={(e) =>
                        setTempKopConfig({ ...tempKopConfig, yayasanText: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Universitas / Perguruan Tinggi
                    </label>
                    <input
                      type="text"
                      value={tempKopConfig.kampusText}
                      onChange={(e) =>
                        setTempKopConfig({ ...tempKopConfig, kampusText: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Alamat Kampus
                    </label>
                    <input
                      type="text"
                      value={tempKopConfig.alamatText}
                      onChange={(e) =>
                        setTempKopConfig({ ...tempKopConfig, alamatText: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kontak Telepon, Email, dan Website
                    </label>
                    <input
                      type="text"
                      value={tempKopConfig.kontakText}
                      onChange={(e) =>
                        setTempKopConfig({ ...tempKopConfig, kontakText: e.target.value })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetKopConfig}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar UNIHAZ</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsKopModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveKopConfig}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Terapkan Kop Surat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT TANDA TANGAN & PIMPINAN (PEJABAT PENANDATANGAN) */}
      {/* ========================================================= */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#1e3a8a] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-bold text-sm">Sesuaikan Pejabat Penandatangan & SK</h3>
                  <p className="text-[11px] text-blue-200">
                    Ubah nama pimpinan, jabatan, NIP, serta tanggal pengesahan SK
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="text-blue-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
              {/* Bagian 1: Header SK & Surat */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-900" />
                  <span>1. Identitas Surat Keputusan (SK)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Judul Keputusan
                    </label>
                    <input
                      type="text"
                      value={tempSignatureConfig.judulSK}
                      onChange={(e) =>
                        setTempSignatureConfig({ ...tempSignatureConfig, judulSK: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Nomor SK Rektor
                    </label>
                    <input
                      type="text"
                      value={tempSignatureConfig.nomorSK}
                      onChange={(e) =>
                        setTempSignatureConfig({ ...tempSignatureConfig, nomorSK: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Perihal / Tentang SK
                  </label>
                  <input
                    type="text"
                    value={tempSignatureConfig.perihalSK}
                    onChange={(e) =>
                      setTempSignatureConfig({ ...tempSignatureConfig, perihalSK: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800"
                  />
                </div>
              </div>

              {/* Bagian 2: Pihak 1 (Kiri - Panitia / Pelaksana) */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>2. Pihak Penandatangan Pertama (Kiri - Panitia / Pelaksana)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Label Pembuka (Kiri)
                    </label>
                    <input
                      type="text"
                      placeholder="Mengetahui,"
                      value={tempSignatureConfig.pihak1Label}
                      onChange={(e) =>
                        setTempSignatureConfig({ ...tempSignatureConfig, pihak1Label: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      placeholder="Ketua Panitia Seleksi KIP-Kuliah"
                      value={tempSignatureConfig.pihak1Jabatan}
                      onChange={(e) =>
                        setTempSignatureConfig({ ...tempSignatureConfig, pihak1Jabatan: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Nama Lengkap & Gelar
                    </label>
                    <input
                      type="text"
                      value={tempSignatureConfig.pihak1Nama}
                      onChange={(e) =>
                        setTempSignatureConfig({ ...tempSignatureConfig, pihak1Nama: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      NIP / NIDN
                    </label>
                    <input
                      type="text"
                      value={tempSignatureConfig.pihak1Nip}
                      onChange={(e) =>
                        setTempSignatureConfig({ ...tempSignatureConfig, pihak1Nip: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800 font-mono"
                    />
                  </div>
                </div>

                {/* Scan TTD Pihak 1 Opsional */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Scan TTD Digital / Cap (Opsional)
                    </label>
                    {tempSignatureConfig.pihak1TtdImage && (
                      <button
                        type="button"
                        onClick={() => setTempSignatureConfig({ ...tempSignatureConfig, pihak1TtdImage: null })}
                        className="text-rose-600 text-[10px] hover:underline cursor-pointer"
                      >
                        Hapus Gambar TTD
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadTtdPihak1}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Bagian 3: Pihak 2 (Kanan - Pimpinan Utama / Rektor) */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-900" />
                  <span>3. Pihak Penandatangan Utama (Kanan - Pimpinan Universitas / Rektor)</span>
                </span>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Tempat & Tanggal Pengesahan
                  </label>
                  <input
                    type="text"
                    value={tempSignatureConfig.pihak2KotaTanggal}
                    onChange={(e) =>
                      setTempSignatureConfig({ ...tempSignatureConfig, pihak2KotaTanggal: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Jabatan Pimpinan
                  </label>
                  <input
                    type="text"
                    value={tempSignatureConfig.pihak2Jabatan}
                    onChange={(e) =>
                      setTempSignatureConfig({ ...tempSignatureConfig, pihak2Jabatan: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Nama Lengkap Pimpinan & Gelar
                    </label>
                    <input
                      type="text"
                      value={tempSignatureConfig.pihak2Nama}
                      onChange={(e) =>
                        setTempSignatureConfig({ ...tempSignatureConfig, pihak2Nama: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      NIP / NIDN Pimpinan
                    </label>
                    <input
                      type="text"
                      value={tempSignatureConfig.pihak2Nip}
                      onChange={(e) =>
                        setTempSignatureConfig({ ...tempSignatureConfig, pihak2Nip: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-800 font-mono"
                    />
                  </div>
                </div>

                {/* Scan TTD Pihak 2 Opsional */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Scan TTD Digital / Cap Pimpinan (Opsional)
                    </label>
                    {tempSignatureConfig.pihak2TtdImage && (
                      <button
                        type="button"
                        onClick={() => setTempSignatureConfig({ ...tempSignatureConfig, pihak2TtdImage: null })}
                        className="text-rose-600 text-[10px] hover:underline cursor-pointer"
                      >
                        Hapus Gambar TTD
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadTtdPihak2}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetSignatureConfig}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default Pimpinan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignatureConfig}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Tanda Tangan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
