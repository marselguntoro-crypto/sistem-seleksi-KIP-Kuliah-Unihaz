import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { Menu, LogOut, Code, CheckCircle2, ChevronDown, User as UserIcon, Mail, Shield } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenCodeExplorer: () => void;
  onOpenTestRunner: () => void;
  onToggleSidebar: () => void;
  activeTab: 'dashboard' | 'tests' | 'code';
  setActiveTab: (tab: 'dashboard' | 'tests' | 'code') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenCodeExplorer,
  onOpenTestRunner,
  onToggleSidebar,
  activeTab,
  setActiveTab
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-profile-dropdown-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                title="Profil Pengguna"
              >
                <div className="w-7 h-7 rounded-full bg-blue-900 text-yellow-300 flex items-center justify-center text-xs font-bold shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-bold text-slate-800">{currentUser.name.split(' ')[0]}</div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Profile Dropdown */}
              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl py-3 px-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-3"
                >
                  {/* Account Identity */}
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900 text-yellow-300 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm leading-snug truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        @{currentUser.username}
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        Peran:
                      </span>
                      <span className="font-semibold text-blue-950 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-full text-[10px]">
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Email:
                      </span>
                      <span className="font-mono text-slate-700 text-[11px] truncate max-w-[130px]" title={currentUser.email}>
                        {currentUser.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        Status:
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Aktif
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      id="profile-logout-btn"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
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
