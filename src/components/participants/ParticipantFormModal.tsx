import React, { useState, useEffect } from 'react';
import { Participant, StudyProgram, AcademicYear } from '../../types';
import { 
  X, 
  User, 
  GraduationCap, 
  School, 
  DollarSign, 
  MapPin, 
  AlertCircle, 
  Check, 
  FileText,
  HelpCircle
} from 'lucide-react';

interface ParticipantFormModalProps {
  initialData?: Participant | null;
  studyPrograms: StudyProgram[];
  academicYears: AcademicYear[];
  existingParticipants: Participant[];
  onClose: () => void;
  onSubmit: (participantData: any) => void;
}

export const ParticipantFormModal: React.FC<ParticipantFormModalProps> = ({
  initialData,
  studyPrograms,
  academicYears,
  existingParticipants,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!initialData;
  const activeYear = academicYears.find((y) => y.isActive) || academicYears[0];
  const activeProdis = studyPrograms.filter((p) => p.isActive);

  // Form tab state for clean navigation
  const [activeTab, setActiveTab] = useState<'IDENTITAS' | 'PENDIDIKAN' | 'EKONOMI' | 'STATUS'>('IDENTITAS');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    regNumber: '',
    nisn: '',
    nik: '',
    academicYearId: activeYear?.id || 1,
    academicYearCode: activeYear?.code || '2026/2027',
    firstChoiceProdiId: activeProdis[0]?.id || 1,
    secondChoiceProdiId: activeProdis[1]?.id || (activeProdis[0]?.id || 1),
    schoolOrigin: '',
    schoolType: 'SMA' as 'SMA' | 'SMK' | 'MA',
    schoolMajor: 'MIPA',
    graduationYear: 2026,
    phone: '',
    email: '',
    address: '',
    city: 'Kota Bengkulu',
    province: 'Bengkulu',
    desil: 'Desil 1' as 'Desil 1' | 'Desil 2' | 'Desil 3' | 'Desil 4' | 'P3KE',
    parentName: '',
    parentJob: '',
    parentIncome: 1000000,
    familyDependents: 4,
    documentStatus: 'Belum Diverifikasi' as 'Belum Diverifikasi' | 'Lengkap' | 'Perlu Perbaikan' | 'Ditolak',
    selectionStatus: 'Belum Diproses' as 'Belum Diproses' | 'Lulus' | 'Cadangan' | 'Tidak Lulus',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        regNumber: initialData.regNumber,
        nisn: initialData.nisn,
        nik: initialData.nik,
        academicYearId: initialData.academicYearId,
        academicYearCode: initialData.academicYearCode,
        firstChoiceProdiId: initialData.firstChoiceProdiId,
        secondChoiceProdiId: initialData.secondChoiceProdiId,
        schoolOrigin: initialData.schoolOrigin,
        schoolType: initialData.schoolType || 'SMA',
        schoolMajor: initialData.schoolMajor || 'MIPA',
        graduationYear: initialData.graduationYear,
        phone: initialData.phone,
        email: initialData.email,
        address: initialData.address,
        city: initialData.city,
        province: initialData.province,
        desil: initialData.desil,
        parentName: initialData.parentName,
        parentJob: initialData.parentJob,
        parentIncome: initialData.parentIncome,
        familyDependents: initialData.familyDependents,
        documentStatus: initialData.documentStatus,
        selectionStatus: initialData.selectionStatus,
        notes: initialData.notes || ''
      });
    } else {
      // Auto generate registration number
      const nextNum = String(existingParticipants.length + 1).padStart(4, '0');
      setFormData((prev) => ({
        ...prev,
        regNumber: `KIPK-2026-${nextNum}`
      }));
    }
  }, [initialData, existingParticipants.length]);

  const handleYearChange = (yearId: number) => {
    const selectedYear = academicYears.find((y) => y.id === yearId);
    setFormData((prev) => ({
      ...prev,
      academicYearId: yearId,
      academicYearCode: selectedYear?.code || prev.academicYearCode
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Required fields
    if (!formData.name.trim() || !formData.regNumber.trim() || !formData.schoolOrigin.trim()) {
      setErrorMessage('Nama, No Pendaftaran, dan Asal Sekolah wajib diisi');
      return;
    }

    // Validation 2: NIK 16 digits
    const cleanNik = formData.nik.replace(/[^0-9]/g, '');
    if (cleanNik.length !== 16) {
      setErrorMessage(`NIK harus berupa 16 digit angka (saat ini ${cleanNik.length} digit)`);
      setActiveTab('IDENTITAS');
      return;
    }

    // Validation 3: NISN 10 digits
    const cleanNisn = formData.nisn.replace(/[^0-9]/g, '');
    if (cleanNisn.length !== 10) {
      setErrorMessage(`NISN harus berupa 10 digit angka (saat ini ${cleanNisn.length} digit)`);
      setActiveTab('IDENTITAS');
      return;
    }

    // Validation 4: Prodi Choice 1 !== Choice 2
    if (formData.firstChoiceProdiId === formData.secondChoiceProdiId) {
      setErrorMessage('Pilihan Program Studi 1 dan Pilihan 2 tidak boleh sama');
      setActiveTab('IDENTITAS');
      return;
    }

    // Validation 5: Duplicate NIK check
    const duplicateNik = existingParticipants.find(
      (p) => p.nik === cleanNik && p.id !== initialData?.id
    );
    if (duplicateNik) {
      setErrorMessage(`NIK ${cleanNik} sudah terdaftar atas nama ${duplicateNik.name}`);
      setActiveTab('IDENTITAS');
      return;
    }

    // Validation 6: Duplicate Reg Number check
    const duplicateReg = existingParticipants.find(
      (p) => p.regNumber.toLowerCase() === formData.regNumber.trim().toLowerCase() && p.id !== initialData?.id
    );
    if (duplicateReg) {
      setErrorMessage(`Nomor Pendaftaran ${formData.regNumber} sudah terdaftar`);
      setActiveTab('IDENTITAS');
      return;
    }

    // Resolve prodi names
    const prodi1 = studyPrograms.find((p) => p.id === Number(formData.firstChoiceProdiId));
    const prodi2 = studyPrograms.find((p) => p.id === Number(formData.secondChoiceProdiId));

    const finalPayload = {
      ...formData,
      nik: cleanNik,
      nisn: cleanNisn,
      name: formData.name.trim(),
      regNumber: formData.regNumber.trim(),
      firstChoiceProdiId: Number(formData.firstChoiceProdiId),
      firstChoiceProdiName: prodi1?.name || 'Program Studi 1',
      secondChoiceProdiId: Number(formData.secondChoiceProdiId),
      secondChoiceProdiName: prodi2?.name || 'Program Studi 2',
      parentIncome: Number(formData.parentIncome),
      familyDependents: Number(formData.familyDependents),
      graduationYear: Number(formData.graduationYear),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    onSubmit(finalPayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1e3a8a] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className="font-bold text-sm">
                {isEdit ? `Edit Data Calon Peserta (${initialData?.regNumber})` : 'Formulir Pendaftaran Calon Mahasiswa KIP-K'}
              </h3>
              <p className="text-[11px] text-blue-200">
                Sistem Pengelolaan & Seleksi KIP-Kuliah Universitas Hazairin (UNIHAZ)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white text-xl font-bold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('IDENTITAS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'IDENTITAS'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Identitas & Pilihan Prodi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PENDIDIKAN')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PENDIDIKAN'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>2. Asal Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EKONOMI')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'EKONOMI'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Sosial Ekonomi & Desil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STATUS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'STATUS'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Status Berkas & Kontak</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: IDENTITAS & PRODI */}
            {activeTab === 'IDENTITAS' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap Peserta <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Fauzan Pratama"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor Pendaftaran <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="KIPK-2026-0001"
                      value={formData.regNumber}
                      onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      NIK (Nomor Induk Kependudukan) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="16 digit angka (contoh: 1771011204060001)"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                    />
                    <span className="text-[10px] text-slate-400">
                      Jumlah digit: {formData.nik.length}/16
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      NISN (Nomor Induk Siswa Nasional) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="10 digit angka (contoh: 0065412891)"
                      value={formData.nisn}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                    />
                    <span className="text-[10px] text-slate-400">
                      Jumlah digit: {formData.nisn.length}/10
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tahun Akademik Pendaftaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.academicYearId}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  >
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.code} (Semester {y.semester}) {y.isActive ? '- [AKTIF]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                      Pilihan Program Studi 1 (Prioritas Utama) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.firstChoiceProdiId}
                      onChange={(e) => setFormData({ ...formData, firstChoiceProdiId: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-blue-300 bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-800 font-bold"
                    >
                      {activeProdis.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.facultyName}) - Kuota {p.quota}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Pilihan Program Studi 2 (Alternatif) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.secondChoiceProdiId}
                      onChange={(e) => setFormData({ ...formData, secondChoiceProdiId: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                    >
                      {activeProdis.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.facultyName})
                        </option>
                      ))}
                    </select>
                    {formData.firstChoiceProdiId === formData.secondChoiceProdiId && (
                      <span className="text-[10px] text-rose-600 font-bold">
                        Pilihan 1 dan Pilihan 2 tidak boleh sama!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PENDIDIKAN ASAL */}
            {activeTab === 'PENDIDIKAN' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Asal Sekolah <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SMAN 1 Kota Bengkulu"
                      value={formData.schoolOrigin}
                      onChange={(e) => setFormData({ ...formData, schoolOrigin: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Jenis Sekolah <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.schoolType}
                      onChange={(e) => setFormData({ ...formData, schoolType: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                    >
                      <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                      <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                      <option value="MA">MA (Madrasah Aliyah)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Jurusan Sekolah <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MIPA / IPS / Rekayasa Perangkat Lunak"
                      value={formData.schoolMajor}
                      onChange={(e) => setFormData({ ...formData, schoolMajor: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tahun Kelulusan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={2022}
                      max={2026}
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) || 2026 })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                    <span className="text-[10px] text-slate-400">Aturan KIP-K: lulusan tahun berjalan atau maksimal 2 tahun sebelumnya</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kabupaten / Kota Asal <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SOSIAL EKONOMI & DESIL */}
            {activeTab === 'EKONOMI' && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 leading-relaxed">
                  <strong>Indikator Prioritas KIP-Kuliah:</strong> Calon mahasiswa dari keluarga Desil 1 & Desil 2 (P3KE Kemendikbudristek) mendapatkan bobot tertinggi dalam scoring afirmasi kemiskinan.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tingkat Desil Kemiskinan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.desil}
                      onChange={(e) => setFormData({ ...formData, desil: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-bold text-rose-600"
                    >
                      <option value="Desil 1">Desil 1 (Sangat Miskin / Desil Ekstrem)</option>
                      <option value="Desil 2">Desil 2 (Miskin)</option>
                      <option value="Desil 3">Desil 3 (Hampir Miskin)</option>
                      <option value="Desil 4">Desil 4 (Rentan Miskin)</option>
                      <option value="P3KE">Non-Desil / SKTM Mandiri</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Ayah/Ibu/Wali"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Pekerjaan Orang Tua <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Petani / Buruh Harian / Nelayan"
                      value={formData.parentJob}
                      onChange={(e) => setFormData({ ...formData, parentJob: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Penghasilan Bulanan (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={50000}
                      value={formData.parentIncome}
                      onChange={(e) => setFormData({ ...formData, parentIncome: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                    />
                    <span className="text-[10px] text-slate-400">Maksimal syarat KIP-K: Rp 4.000.000 atau Rp 750.000/jiwa</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Jumlah Tanggungan Keluarga (Jiwa) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={15}
                      value={formData.familyDependents}
                      onChange={(e) => setFormData({ ...formData, familyDependents: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Provinsi Domisili <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STATUS BERKAS, KONTAK & CATATAN */}
            {activeTab === 'STATUS' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="081273849102"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                    />
                    <span className="text-[10px] text-slate-400">Digunakan untuk kirim link notifikasi WhatsApp</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Alamat Email Aktif <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ahmad.fauzan@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alamat Lengkap Tempat Tinggal <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Nama jalan, RT/RW, Dusun, Desa/Kelurahan, Kecamatan..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Status Verifikasi Berkas
                    </label>
                    <select
                      value={formData.documentStatus}
                      onChange={(e) => setFormData({ ...formData, documentStatus: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-semibold"
                    >
                      <option value="Belum Diverifikasi">Belum Diverifikasi</option>
                      <option value="Lengkap">Lengkap</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Status Seleksi
                    </label>
                    <select
                      value={formData.selectionStatus}
                      onChange={(e) => setFormData({ ...formData, selectionStatus: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-semibold"
                    >
                      <option value="Belum Diproses">Belum Diproses</option>
                      <option value="Lulus">Lulus</option>
                      <option value="Cadangan">Cadangan</option>
                      <option value="Tidak Lulus">Tidak Lulus</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Catatan Khusus / Hasil Observasi
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan kondisi rumah, keabsahan dokumen, dll..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {activeTab !== 'IDENTITAS' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'PENDIDIKAN') setActiveTab('IDENTITAS');
                    if (activeTab === 'EKONOMI') setActiveTab('PENDIDIKAN');
                    if (activeTab === 'STATUS') setActiveTab('EKONOMI');
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  &larr; Sebelumnya
                </button>
              )}
              {activeTab !== 'STATUS' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'IDENTITAS') setActiveTab('PENDIDIKAN');
                    if (activeTab === 'PENDIDIKAN') setActiveTab('EKONOMI');
                    if (activeTab === 'EKONOMI') setActiveTab('STATUS');
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold cursor-pointer"
                >
                  Lanjut &rarr;
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs rounded-lg bg-blue-900 text-white hover:bg-blue-800 font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isEdit ? 'Simpan Perubahan Peserta' : 'Simpan Data Pendaftaran'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
