import React, { useState } from 'react';
import { Participant } from '../../types';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  School, 
  GraduationCap, 
  Award, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Send,
  Printer,
  Calendar,
  DollarSign,
  User,
  HeartHandshake
} from 'lucide-react';

interface ParticipantDetailModalProps {
  participant: Participant;
  onClose: () => void;
  onEdit: (participant: Participant) => void;
}

export const ParticipantDetailModal: React.FC<ParticipantDetailModalProps> = ({
  participant,
  onClose,
  onEdit,
}) => {
  const [waTemplate, setWaTemplate] = useState<'BERKAS' | 'WAWANCARA' | 'PENGUMUMAN'>('BERKAS');

  // Format WhatsApp Link
  const cleanPhone = participant.phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  const getWaMessage = () => {
    if (waTemplate === 'BERKAS') {
      return `Yth. Sdr/i ${participant.name} (${participant.regNumber}), Panitia Seleksi KIP-Kuliah Universitas Hazairin (UNIHAZ) menginformasikan perihal status verifikasi berkas pendaftaran Anda. Mohon konfirmasi kelengkapan dokumen asli melalui nomor ini. Terima kasih.`;
    }
    if (waTemplate === 'WAWANCARA') {
      return `Yth. Sdr/i ${participant.name} (${participant.regNumber}), Anda dijadwalkan mengikuti sesi Wawancara & Survey Faktual KIP-Kuliah UNIHAZ pada pilihan prodi ${participant.firstChoiceProdiName}. Mohon persiapkan dokumen kartu keluarga dan rekening listrik. Terima kasih.`;
    }
    return `Yth. Sdr/i ${participant.name} (${participant.regNumber}), Panitia Seleksi KIP-Kuliah UNIHAZ mengumumkan status seleksi akhir Anda: ${participant.selectionStatus.toUpperCase()} (Peringkat ${participant.rank || '-'}). Silakan pantau portal resmi seleksi KIP-K UNIHAZ.`;
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(getWaMessage());
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1e3a8a] px-6 py-4 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-400 text-blue-950 flex items-center justify-center font-bold text-lg shadow-sm">
              {participant.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight">{participant.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900 text-blue-100 border border-blue-700 font-mono">
                  {participant.regNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    participant.desil === 'Desil 1'
                      ? 'bg-rose-500 text-white'
                      : participant.desil === 'Desil 2'
                      ? 'bg-amber-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {participant.desil}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Tahun Akademik: <strong>{participant.academicYearCode}</strong> &bull; Terdaftar: {participant.createdAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(participant)}
              className="px-2.5 py-1 text-xs rounded-lg bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold transition cursor-pointer"
            >
              Edit Data
            </button>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white text-xl font-bold p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Status & Scores Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Status Seleksi</span>
              <div className="mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    participant.selectionStatus === 'Lulus'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : participant.selectionStatus === 'Cadangan'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : participant.selectionStatus === 'Tidak Lulus'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {participant.selectionStatus}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Peringkat & Nilai</span>
              <div className="mt-0.5 font-bold text-slate-900 text-xs">
                {participant.rank ? `Rank #${participant.rank}` : '-'} &bull;{' '}
                <span className="text-blue-900 font-mono text-sm">{participant.finalScore || 0}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Verifikasi Berkas</span>
              <div className="mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                    participant.documentStatus === 'Lengkap'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : participant.documentStatus === 'Perlu Perbaikan'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>{participant.documentStatus}</span>
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pilihan Prioritas</span>
              <div className="mt-0.5 font-bold text-blue-900 text-xs truncate" title={participant.firstChoiceProdiName}>
                {participant.firstChoiceProdiName}
              </div>
            </div>
          </div>

          {/* Tabbed / Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section 1: Identitas & Pilihan Prodi */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-blue-700" />
                <span>Identitas Peserta & Pilihan Prodi</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Nomor Registrasi:</span>
                  <span className="font-mono font-bold text-slate-800">{participant.regNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Nomor Induk Kependudukan (NIK):</span>
                  <span className="font-mono font-bold text-slate-800">{participant.nik}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Nomor Induk Siswa Nasional (NISN):</span>
                  <span className="font-mono font-bold text-slate-800">{participant.nisn}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Pilihan 1 (Utama):</span>
                  <span className="font-bold text-blue-900">{participant.firstChoiceProdiName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Pilihan 2 (Alternatif):</span>
                  <span className="font-medium text-slate-800">{participant.secondChoiceProdiName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tahun Akademik:</span>
                  <span className="font-bold text-slate-800">{participant.academicYearCode}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Riwayat Pendidikan Asal */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <School className="w-4 h-4 text-blue-700" />
                <span>Asal Sekolah & Pendidikan</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Asal Sekolah:</span>
                  <span className="font-bold text-slate-800">{participant.schoolOrigin}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Jenis Sekolah:</span>
                  <span className="font-medium text-slate-800">{participant.schoolType || 'SMA/SMK'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Jurusan Sekolah:</span>
                  <span className="font-medium text-slate-800">{participant.schoolMajor || 'MIPA'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tahun Kelulusan:</span>
                  <span className="font-bold text-slate-800">{participant.graduationYear}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Kabupaten/Kota:</span>
                  <span className="font-medium text-slate-800">{participant.city}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Provinsi:</span>
                  <span className="font-medium text-slate-800">{participant.province}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Sosial Ekonomi & Desil Kemiskinan */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-blue-700" />
                <span>Kondisi Sosial Ekonomi & Desil</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tingkat Desil P3KE/BDT:</span>
                  <span className="font-bold text-rose-600">{participant.desil}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Nama Orang Tua / Wali:</span>
                  <span className="font-bold text-slate-800">{participant.parentName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Pekerjaan Orang Tua:</span>
                  <span className="font-medium text-slate-800">{participant.parentJob}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Penghasilan Bulanan:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {formatCurrency(participant.parentIncome)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Jumlah Tanggungan Keluarga:</span>
                  <span className="font-bold text-slate-800">{participant.familyDependents} Orang</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Alamat Tempat Tinggal:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px] truncate" title={participant.address}>
                    {participant.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Riwayat Komponen Penilaian */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Award className="w-4 h-4 text-blue-700" />
                <span>Komponen Penilaian Seleksi</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Skor UTBK / Tes Tertulis:</span>
                  <span className="font-mono font-bold text-slate-800">{participant.utbkScore || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Skor Wawancara:</span>
                  <span className="font-mono font-bold text-slate-800">{participant.interviewScore || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Skor Survey Lapangan:</span>
                  <span className="font-mono font-bold text-slate-800">{participant.surveyScore || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Nilai Akhir Terbobot:</span>
                  <span className="font-mono font-bold text-blue-900 text-sm">{participant.finalScore || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Catatan Surveyor/Verifikator:</span>
                  <span className="italic text-slate-600 text-right max-w-[220px] text-[11px]">
                    {participant.notes || 'Tidak ada catatan tambahan'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Direct WhatsApp Notification Center */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-emerald-950">WhatsApp Direct Action Hub</h4>
                  <p className="text-[11px] text-emerald-700">Hubungi calon mahasiswa langsung via WhatsApp resmi</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWaTemplate('BERKAS')}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                    waTemplate === 'BERKAS'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-emerald-800 border border-emerald-300'
                  }`}
                >
                  Verifikasi Berkas
                </button>
                <button
                  type="button"
                  onClick={() => setWaTemplate('WAWANCARA')}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                    waTemplate === 'WAWANCARA'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-emerald-800 border border-emerald-300'
                  }`}
                >
                  Jadwal Wawancara
                </button>
                <button
                  type="button"
                  onClick={() => setWaTemplate('PENGUMUMAN')}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                    waTemplate === 'PENGUMUMAN'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-emerald-800 border border-emerald-300'
                  }`}
                >
                  Pengumuman
                </button>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs text-slate-700 leading-relaxed font-sans">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Isi Pesan Otomatis (Terkirim ke +{formattedPhone}):
              </div>
              {getWaMessage()}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {participant.phone}
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  {participant.email}
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Buka WhatsApp Web / App</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Terakhir diperbarui: <strong>{participant.updatedAt}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
