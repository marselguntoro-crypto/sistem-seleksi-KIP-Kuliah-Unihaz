import React from 'react';
import { User } from '../types';
import { Menu, LogOut, Code, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenCodeExplorer: () => void;
  onOpenTestRunner: () => void;
  onSwitchRole: (user: User) => void;
  availableUsers: User[];
  onToggleSidebar: () => void;
  activeTab: 'dashboard' | 'tests' | 'code';
  setActiveTab: (tab: 'dashboard' | 'tests' | 'code') => void;
}

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

        {/* Right: Role Switcher & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <div className="relative">
              <button
                id="role-switcher-dropdown-btn"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                title="Ganti Role Cepat untuk Simulasi"
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

              {/* Role Dropdown Menu */}
              {roleDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs"
                  onMouseLeave={() => setRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Simulasi Akses Akun & Role
                  </div>
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      id={`switch-user-${user.username}`}
                      onClick={() => {
                        onSwitchRole(user);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        user.id === currentUser.id ? 'bg-blue-50/80 text-blue-900 font-bold border-l-2 border-blue-800' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">@{user.username} &bull; {user.role}</div>
                      </div>
                      {user.id === currentUser.id && (
                        <ShieldCheck className="w-4 h-4 text-blue-800 shrink-0" />
                      )}
                    </button>
                  ))}
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
