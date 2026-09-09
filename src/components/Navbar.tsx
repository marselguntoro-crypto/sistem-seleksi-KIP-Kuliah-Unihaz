import React, { useEffect, useRef } from 'react';
import { User } from '../types';
import { Menu, LogOut, Code, ShieldCheck, CheckCircle2, ChevronDown, User as UserIcon, Shield, Check } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenCodeExplorer: () => void;
  onOpenTestRunner: () => void;
  onSwitchRole?: (user: User) => void;
  availableUsers: User[];
  onToggleSidebar: () => void;
  activeTab: 'dashboard' | 'tests' | 'code';
  setActiveTab: (tab: 'dashboard' | 'tests' | 'code') => void;
}

const ROLE_DETAILS: Record<string, { description: string; responsibilities: string[]; permissions: string[]; badgeColor: string }> = {
  'Super Admin': {
    description: 'Administrator Tertinggi dengan wewenang penuh atas konfigurasi dan seluruh alur seleksi KIP-Kuliah UNIHAZ.',
    responsibilities: [
      'Manajemen data master (tahun akademik, fakultas, prodi, dan kuota penerimaan).',
      'Pengelolaan akun operator dan penugasan hak akses role (Spatie RBAC).',
      'Pengaturan bobot seleksi (berkas, survey, UTBK, wawancara).',
      'Pemantauan audit log dan backup/restore database.'
    ],
    permissions: ['Semua Modul & Fitur Terbuka Penuh (Full Access)'],
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
  },
  'Operator Pemberkasan': {
    description: 'Petugas Verifikator Berkas Pendaftaran KIP-Kuliah (Tahap 1 Seleksi Administrasi).',
    responsibilities: [
      'Pencatatan dan penerimaan berkas fisik pendaftaran dari calon mahasiswa.',
      'Pemeriksaan kelengkapan dokumen wajib (KTP, KK, KIP/KKS, Slip Gaji, Foto Rumah, dll).',
      'Penginputan tanggal pemeriksaan dan penugasan verifikator/pengecek berkas.',
      'Import data verifikasi berkas secara massal via format Excel.'
    ],
    permissions: ['Verifikasi Berkas Pendaftaran', 'Import Verifikasi Berkas', 'Data Calon Peserta'],
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  'Operator SPMB': {
    description: 'Petugas Seleksi Penerimaan Mahasiswa Baru & Penguji Akademik UNIHAZ.',
    responsibilities: [
      'Penginputan dan validasi nilai UTBK / Tes Potensi Akademik.',
      'Penilaian wawancara motivasi, komitmen, dan wawasan akademik.',
      'Penyusunan rekapitulasi nilai seleksi akademik pendaftar.'
    ],
    permissions: ['Penilaian UTBK / Tes Tertulis', 'Penilaian Wawancara', 'Data Calon Peserta'],
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  'Operator Survey': {
    description: 'Petugas Verifikasi Faktual & Validasi Lapangan Kondisi Ekonomi Calon Mahasiswa.',
    responsibilities: [
      'Kunjungan dan validasi faktual ke rumah pendaftar KIP-Kuliah.',
      'Pemeriksaan kondisi fisik rumah, daya listrik, dan aset keluarga.',
      'Validasi data desil kemiskinan (P3KE / DTKS Kemensos).',
      'Pemberian rekomendasi kelayakan penerima beasiswa.'
    ],
    permissions: ['Survey & Validasi Lapangan', 'Penilaian Kondisi Ekonomi', 'Data Calon Peserta'],
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  }
};

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenCodeExplorer,
  onOpenTestRunner,
  onSwitchRole,
  availableUsers,
  onToggleSidebar,
  activeTab,
  setActiveTab
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleInfo = currentUser ? ROLE_DETAILS[currentUser.role] || {
    description: `Pengguna sistem dengan peran ${currentUser.role}.`,
    responsibilities: ['Mengelola modul sesuai kewenangan role yang diberikan.'],
    permissions: [currentUser.role],
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
  } : null;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-sidebar-toggle-btn"
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 lg:hidden rounded-lg hover:bg-slate-100 focus:outline-none"
            title="Buka Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-yellow-400 flex items-center justify-center text-blue-950 font-black text-base shadow-xs">
              U
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 tracking-tight">KIP-KULIAH UNIHAZ</span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300/60 uppercase">
                  T.A 2026/2027
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300" title="Cloud Firestore Real-time Multi-User Sync Active">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud Firestore Realtime Sync
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-medium">Universitas Prof. Dr. Hazairin, SH &bull; Sinkronisasi Tim Real-Time &bull; Multi-User Aktif</p>
            </div>
          </div>
        </div>

        {/* Center: Quick Tab Switcher */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Dashboard
          </button>
          <button
            id="nav-tab-tests"
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'tests'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700" />
            <span>Unit/Feature Tests</span>
          </button>
          <button
            id="nav-tab-code"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kode Laravel 12</span>
          </button>
        </div>

        {/* Right: User Profile & Role Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <div className="relative" ref={dropdownRef}>
              <button
                id="role-profile-dropdown-btn"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                title="Informasi Profil & Penjelasan Hak Akses Role"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-300 text-blue-900 flex items-center justify-center text-xs font-bold">
                  {currentUser.role[0]}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-bold text-slate-800">{currentUser.name.split(' ')[0]}</div>
                  <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile & Role Explanation Dropdown */}
              {roleDropdownOpen && roleInfo && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl py-3 px-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-3"
                >
                  {/* Account Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-blue-900 text-yellow-300 flex items-center justify-center font-bold text-sm shadow-xs">
                        {currentUser.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm leading-snug">{currentUser.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">@{currentUser.username} &bull; {currentUser.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Active Role Badge & Description */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Peran Aktif Akun (Role)
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.badgeColor}`}>
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {roleInfo.description}
                    </p>
                  </div>

                  {/* Responsibilities */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-800" />
                      <span>Tugas & Tanggung Jawab Role</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-600 pl-1">
                      {roleInfo.responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="leading-snug">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Module Permissions */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hak Akses Modul Resmi</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {roleInfo.permissions.map((perm, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-medium">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Session Footer & Switch Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="text-slate-400 font-mono text-[10px]">
                      Sesi: Spatie RBAC Aktif
                    </div>
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        onLogout();
                      }}
                      className="inline-flex items-center gap-1 font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Ganti Akun / Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Code & Tests buttons on small screens */}
          <button
            id="header-code-btn"
            onClick={onOpenCodeExplorer}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg md:hidden border border-slate-200"
            title="Lihat Kode Laravel 12"
          >
            <Code className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          {currentUser && (
            <button
              id="header-logout-btn"
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer"
              title="Logout dari Sistem"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
