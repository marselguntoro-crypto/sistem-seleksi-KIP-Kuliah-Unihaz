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
  FileSpreadsheet
} from 'lucide-react';

interface ReportsViewProps {
  participants: Participant[];
  studyPrograms: StudyProgram[];
  academicYears: AcademicYear[];
  currentUser: User;
}

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
  const [selectedStatus, setSelectedStatus] = useState<string>('Lulus'); // Default: Laporan Kelulusan
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Academic Year Object
  const currentAcademicYear = useMemo(() => {
    return academicYears.find((y) => String(y.id) === selectedAcademicYearId) || academicYears[0];
  }, [academicYears, selectedAcademicYearId]);

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
          selectedStatus === 'ALL' || p.selectionStatus === selectedStatus;

        const matchesSearch =
          searchTerm === '' ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nik.includes(searchTerm);

        return matchesYear && matchesProdi && matchesStatus && matchesSearch;
      })
      .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  }, [participants, selectedAcademicYearId, selectedProdiId, selectedStatus, searchTerm]);

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
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-900 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Laporan & Berita Acara Seleksi KIP-Kuliah
              </h1>
              <p className="text-xs text-slate-500">
                Penerbitan Surat Keputusan (SK) Rektor, Berita Acara Penetapan Hasil Seleksi KIP-Kuliah UNIHAZ, Cetak PDF dan Export Excel.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel (.csv)
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-yellow-300" />
              Cetak Dokumen Resmi / PDF
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
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">Semua Program Studi</option>
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
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">Semua Status</option>
              <option value="Lulus">Status: Lulus (Penerima KIP-K)</option>
              <option value="Cadangan">Status: Cadangan</option>
              <option value="Tidak Lulus">Status: Tidak Lulus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Official Document Preview */}
      <div className="bg-white p-8 md:p-12 rounded-lg border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 max-w-5xl mx-auto text-slate-900">
        {/* Kop Surat Resmi Universitas Hazairin Bengkulu */}
        <div className="border-b-4 border-double border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-blue-900 text-yellow-400 rounded-full flex items-center justify-center font-black text-2xl shrink-0 border-2 border-yellow-400 shadow-sm print:shadow-none">
              UH
            </div>
            <div className="text-center flex-1">
              <h4 className="text-xs tracking-widest font-semibold uppercase text-slate-700">
                YAYASAN SEMARAK BENGKULU
              </h4>
              <h2 className="text-lg md:text-xl font-black uppercase text-blue-950 tracking-tight mt-0.5">
                UNIVERSITAS PROF. DR. HAZAIRIN, SH
              </h2>
              <p className="text-[11px] text-slate-600 font-medium">
                Jl. Jenderal Ahmad Yani No. 1, Pintu Batu, Kec. Teluk Segara, Kota Bengkulu 38117
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Telepon: (0736) 21764, 21876 | Email: spmb@unihaz.ac.id | Laman: www.unihaz.ac.id
              </p>
            </div>
          </div>
        </div>

        {/* Judul Keputusan / Laporan */}
        <div className="text-center mb-6">
          <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wide underline text-slate-900">
            SURAT KEPUTUSAN REKTOR UNIVERSITAS PROF. DR. HAZAIRIN, SH
          </h3>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            NOMOR: B/142/UN43/KM.01.00/2026
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-900 mt-2">
            TENTANG PENETAPAN KELULUSAN SELEKSI PENERIMA PROGRAM KARTU INDONESIA PINTAR (KIP) KULIAH
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
            <span className="font-bold text-blue-900">{selectedStatus.toUpperCase()}</span>
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
                <th className="py-2 px-2.5 border border-slate-300 text-center">Status</th>
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
                filteredParticipants.map((p, index) => (
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
                      {p.desil}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">
                      {p.utbkScore?.toFixed(1) || '0.0'}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">
                      {p.interviewScore?.toFixed(1) || '0.0'}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">
                      {p.surveyScore?.toFixed(1) || '0.0'}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-bold font-mono text-blue-900">
                      {p.finalScore?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-1.5 px-2.5 border border-slate-300 text-center font-bold text-[10px]">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded ${
                          p.selectionStatus === 'Lulus'
                            ? 'bg-emerald-100 text-emerald-900'
                            : p.selectionStatus === 'Cadangan'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {p.selectionStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Resmi Pengesahan */}
        <div className="grid grid-cols-2 gap-8 text-xs pt-6 mt-8 break-inside-avoid">
          <div className="text-center">
            <p className="text-slate-500 mb-1">Mengetahui,</p>
            <p className="font-bold text-slate-800">Ketua Panitia Seleksi KIP-Kuliah</p>
            <div className="h-20 flex items-center justify-center">
              <span className="text-slate-300 italic text-[10px]">[Tanda Tangan & Cap Panitia]</span>
            </div>
            <p className="font-bold underline text-slate-900">Dr. H. Ramli Ahmad, M.Si</p>
            <p className="text-[11px] text-slate-600">NIP. 197103141998031002</p>
          </div>

          <div className="text-center">
            <p className="text-slate-500 mb-1">Ditetapkan di Kota Bengkulu,</p>
            <p className="font-bold text-slate-800">
              Rektor Universitas Prof. Dr. Hazairin, SH
            </p>
            <div className="h-20 flex items-center justify-center">
              <span className="text-slate-300 italic text-[10px]">[Tanda Tangan & Cap Rektor]</span>
            </div>
            <p className="font-bold underline text-slate-900">Prof. Dr. H. Herman Suwardi, M.M</p>
            <p className="text-[11px] text-slate-600">NIP. 196508201990031001</p>
          </div>
        </div>
      </div>
    </div>
  );
};
