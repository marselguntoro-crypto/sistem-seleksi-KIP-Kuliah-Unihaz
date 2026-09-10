import React from 'react';
import { User, RoleName } from '../types';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  GraduationCap,
  ClipboardCheck,
  MapPin,
  FileText,
  MessageSquare,
  Trophy,
  Award,
  BarChart3,
  UserCheck,
  History,
  Sliders,
  Shield,
  Database,
  Lock
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  activeRoute: string;
  onNavigate: (route: string) => void;
  onRestrictedAttempt: (moduleName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  isOpen,
  onClose,
  activeRoute,
  onNavigate,
  onRestrictedAttempt
}) => {
  // Check permission according to Spatie specification
  const hasPermission = (permission: string): boolean => {
    if (currentUser.role === 'Super Admin') return true;

    if (currentUser.role === 'Operator Pemberkasan') {
      return [
        'view-dashboard',
        'view-participants',
        'manage-document-verification'
      ].includes(permission);
    }

    if (currentUser.role === 'Operator SPMB') {
      return [
        'view-dashboard',
        'view-participants',
        'manage-utbk-scores',
        'manage-interview-scores',
        'view-rankings'
      ].includes(permission);
    }

    if (currentUser.role === 'Operator Survey') {
      return [
        'view-dashboard',
        'view-participants',
        'manage-survey-scores'
      ].includes(permission);
    }

    return false;
  };

  const handleLinkClick = (route: string, permission?: string, label?: string) => {
    if (permission && !hasPermission(permission)) {
      onRestrictedAttempt(label || route);
      return;
    }
    onNavigate(route);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e3a8a] text-white transition-transform duration-200 ease-in-out flex flex-col shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-5 border-b border-blue-800 bg-[#172554]/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center text-blue-900 font-bold text-base shadow-xs">
              U
            </div>
            <span className="font-bold text-base tracking-tight text-white">SISTEM KIP-K</span>
          </div>
          <p className="text-[10px] text-blue-300 mt-1 uppercase tracking-widest font-medium">
            Universitas Hazairin
          </p>
        </div>

        {/* Current Active Role Badge */}
        <div className="px-4 py-2 bg-blue-950/70 border-b border-blue-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">Akses:</span>
          </div>
          <span className="text-[10px] font-bold text-yellow-300 bg-yellow-400/15 px-2 py-0.5 rounded border border-yellow-400/30 truncate max-w-[130px]">
            {currentUser.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-3 text-xs">
          {/* Main Dashboard */}
          <div className="mb-3">
            <button
              id="sidebar-link-dashboard"
              onClick={() => handleLinkClick('dashboard', 'view-dashboard', 'Dashboard')}
              className={`w-full flex items-center px-4 py-2 transition-all cursor-pointer ${
                activeRoute === 'dashboard'
                  ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold'
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3 shrink-0" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* DATA PESERTA */}
          <div className="mb-3">
            <div className="px-4 py-1 text-blue-300 uppercase text-[10px] font-bold tracking-wider">
              DATA PESERTA
            </div>
            <div className="space-y-0.5">
              <button
                id="sidebar-link-participants"
                onClick={() => handleLinkClick('participants', 'view-participants', 'Semua Peserta')}
                className={`w-full flex items-center px-4 py-2 transition-colors cursor-pointer ${
                  activeRoute === 'participants'
                    ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                <span>Semua Peserta</span>
              </button>

              <button
                id="sidebar-link-import"
                onClick={() => handleLinkClick('import', 'import-participants', 'Import Data Excel')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('import-participants')
                    ? activeRoute === 'import'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Import Data</span>
                </div>
                {!hasPermission('import-participants') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              <button
                id="sidebar-link-export"
                onClick={() => handleLinkClick('export', 'export-participants', 'Export Data')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('export-participants')
                    ? activeRoute === 'export'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <Download className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Export Data</span>
                </div>
                {!hasPermission('export-participants') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>
            </div>
          </div>

          {/* MASTER DATA */}
          <div className="mb-3">
            <div className="px-4 py-1 text-blue-300 uppercase text-[10px] font-bold tracking-wider flex items-center justify-between">
              <span>MASTER DATA</span>
              {!hasPermission('manage-master-academic-years') && <span className="text-[9px] text-blue-400/70 font-normal">Super Admin</span>}
            </div>
            <div className="space-y-0.5">
              <button
                id="sidebar-link-academic-years"
                onClick={() => handleLinkClick('academic-years', 'manage-master-academic-years', 'Tahun Akademik')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-master-academic-years')
                    ? activeRoute === 'academic-years'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Tahun Akademik</span>
                </div>
                {!hasPermission('manage-master-academic-years') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              <button
                id="sidebar-link-faculties"
                onClick={() => handleLinkClick('faculties', 'manage-master-faculties', 'Fakultas')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-master-faculties')
                    ? activeRoute === 'faculties'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Fakultas</span>
                </div>
                {!hasPermission('manage-master-faculties') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              <button
                id="sidebar-link-study-programs"
                onClick={() => handleLinkClick('study-programs', 'manage-master-study-programs', 'Program Studi')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-master-study-programs')
                    ? activeRoute === 'study-programs'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Program Studi</span>
                </div>
                {!hasPermission('manage-master-study-programs') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>
            </div>
          </div>

          {/* TAHAP SELEKSI */}
          <div className="mb-3">
            <div className="px-4 py-1 text-blue-300 uppercase text-[10px] font-bold tracking-wider flex items-center justify-between">
              <span>ALUR SELEKSI</span>
              <span className="text-[9px] text-yellow-400 font-semibold">5 TAHAP</span>
            </div>
            <div className="space-y-0.5">
              {/* 1. Pemberkasan */}
              <button
                id="sidebar-link-documents"
                onClick={() => handleLinkClick('documents', 'manage-document-verification', 'Pemberkasan Berkas')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-document-verification')
                    ? activeRoute === 'documents'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <ClipboardCheck className="w-4 h-4 mr-3 text-teal-300 shrink-0" />
                  <span>1. Pemberkasan</span>
                </div>
                {!hasPermission('manage-document-verification') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              {/* 2. Nilai UTBK (Seleksi Tahap Pertama) */}
              <button
                id="sidebar-link-utbk"
                onClick={() => handleLinkClick('utbk', 'manage-utbk-scores', 'Nilai UTBK')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-utbk-scores')
                    ? activeRoute === 'utbk'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-3 text-indigo-300 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span>2. Nilai UTBK</span>
                    <span className="text-[9px] font-semibold px-1 rounded bg-indigo-950/60 text-indigo-200 border border-indigo-500/30">
                      Tahap 1
                    </span>
                  </div>
                </div>
                {!hasPermission('manage-utbk-scores') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              {/* 3. Wawancara (Seleksi Tahap Pertama) */}
              <button
                id="sidebar-link-interview"
                onClick={() => handleLinkClick('interview', 'manage-interview-scores', 'Nilai Wawancara')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-interview-scores')
                    ? activeRoute === 'interview'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-3 text-yellow-300 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span>3. Wawancara</span>
                    <span className="text-[9px] font-semibold px-1 rounded bg-yellow-950/60 text-yellow-200 border border-yellow-500/30">
                      Tahap 1
                    </span>
                  </div>
                </div>
                {!hasPermission('manage-interview-scores') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              {/* 4. Survey Lapangan (Dinamis / Tahap Akhir) */}
              <button
                id="sidebar-link-survey"
                onClick={() => handleLinkClick('survey', 'manage-survey-scores', 'Survey Lapangan')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-survey-scores')
                    ? activeRoute === 'survey'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3 text-cyan-300 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span>4. Survey Lapangan</span>
                    <span className="text-[9px] font-bold px-1 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-400/40">
                      Dinamis
                    </span>
                  </div>
                </div>
                {!hasPermission('manage-survey-scores') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              {/* 5. Ranking Seleksi (Keluaran Hasil Final) */}
              <button
                id="sidebar-link-ranking"
                onClick={() => handleLinkClick('ranking', 'view-rankings', 'Ranking Seleksi (Hasil Final)')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('view-rankings') || hasPermission('determine-selection-results')
                    ? activeRoute === 'ranking' || activeRoute === 'results'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <Trophy className="w-4 h-4 mr-3 text-yellow-300 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span>5. Ranking Seleksi</span>
                    <span className="text-[9px] text-yellow-300 font-normal">Keluaran Hasil Final</span>
                  </div>
                </div>
                {!(hasPermission('view-rankings') || hasPermission('determine-selection-results')) && (
                  <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* LAPORAN */}
          <div className="mb-3">
            <div className="px-4 py-1 text-blue-300 uppercase text-[10px] font-bold tracking-wider">
              LAPORAN
            </div>
            <div className="space-y-0.5">
              <button
                id="sidebar-link-reports"
                onClick={() => handleLinkClick('reports', 'view-reports', 'Laporan Hasil Seleksi')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('view-reports')
                    ? activeRoute === 'reports'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Laporan Seleksi</span>
                </div>
                {!hasPermission('view-reports') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>
            </div>
          </div>

          {/* ADMINISTRASI & PENGATURAN */}
          <div className="mb-3">
            <div className="px-4 py-1 text-blue-300 uppercase text-[10px] font-bold tracking-wider flex items-center justify-between">
              <span>ADMINISTRASI</span>
              {!hasPermission('manage-operators') && <span className="text-[9px] text-blue-400/70 font-normal">Super Admin</span>}
            </div>
            <div className="space-y-0.5">
              <button
                id="sidebar-link-operators"
                onClick={() => handleLinkClick('operators', 'manage-operators', 'Manajemen Operator')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-operators')
                    ? activeRoute === 'operators'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <UserCheck className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Operator</span>
                </div>
                {!hasPermission('manage-operators') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              <button
                id="sidebar-link-audit"
                onClick={() => handleLinkClick('audit', 'view-audit-logs', 'Audit Log Aktivitas')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('view-audit-logs')
                    ? activeRoute === 'audit'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <History className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Audit Log</span>
                </div>
                {!hasPermission('view-audit-logs') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              <button
                id="sidebar-link-weights"
                onClick={() => handleLinkClick('weights', 'manage-selection-weights', 'Pengaturan Bobot Seleksi')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-selection-weights')
                    ? activeRoute === 'weights'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <Sliders className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Bobot Seleksi</span>
                </div>
                {!hasPermission('manage-selection-weights') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>

              <button
                id="sidebar-link-backup"
                onClick={() => handleLinkClick('backup', 'manage-backup-restore', 'Backup & Restore Database')}
                className={`w-full flex items-center justify-between px-4 py-2 transition-colors ${
                  hasPermission('manage-backup-restore')
                    ? activeRoute === 'backup'
                      ? 'bg-blue-900 border-l-4 border-yellow-400 text-white font-semibold cursor-pointer'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white cursor-pointer'
                    : 'text-blue-400/40 hover:bg-blue-950/20 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <Database className="w-4 h-4 mr-3 text-blue-300 shrink-0" />
                  <span>Backup & Restore</span>
                </div>
                {!hasPermission('manage-backup-restore') && <Lock className="w-3 h-3 text-blue-400/50 shrink-0" />}
              </button>
            </div>
          </div>
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 bg-blue-900/50 border-t border-blue-800 text-[11px] text-blue-300 flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-800 border border-blue-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="ml-2.5 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-blue-300 font-mono truncate">@{currentUser.username}</p>
            </div>
          </div>
          <div className="text-[9px] text-blue-400 font-mono text-right">
            v1.0.2
          </div>
        </div>
      </aside>
    </>
  );
};
