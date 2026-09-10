import React, { useState } from 'react';
import { User } from '../types';
import { SEEDED_USERS } from '../data/mockData';
import { ShieldCheck, Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  availableUsers?: User[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, availableUsers = SEEDED_USERS }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsSubmitting(false);

      if (attemptCount >= 5) {
        setErrorMessage('Terlalu banyak percobaan login. Silakan coba lagi dalam 60 detik (Rate limiting aktif).');
        return;
      }

      const inputIdentity = username.trim().toLowerCase();
      // Match against availableUsers by username or email
      const matchedUser = availableUsers.find(
        (u) => u.username.toLowerCase() === inputIdentity || u.email.toLowerCase() === inputIdentity
      );

      if (!matchedUser) {
        setAttemptCount((prev) => prev + 1);
        setErrorMessage('Kredensial yang dimasukkan tidak terdaftar dalam sistem.');
        return;
      }

      if (!matchedUser.isActive) {
        setErrorMessage('Akun operator ini telah dinonaktifkan oleh Super Admin. Hubungi Biro Administrasi UNIHAZ.');
        return;
      }

      const expectedPassword = matchedUser.password || (matchedUser.role === 'Super Admin' ? 'Admin@12345' : 'Operator@12345');

      if (password === expectedPassword) {
        onLoginSuccess(matchedUser);
      } else {
        setAttemptCount((prev) => prev + 1);
        setErrorMessage('Kata sandi yang Anda masukkan salah. Periksa kembali huruf besar/kecil.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative">
      {/* Subtle Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 relative z-10">
        {/* Institutional Card Header */}
        <div className="bg-[#1e3a8a] p-6 text-center text-white border-b-4 border-yellow-400">
          <div className="w-12 h-12 rounded-xl bg-yellow-400 text-blue-950 font-black text-2xl flex items-center justify-center mx-auto mb-2.5 shadow-sm">
            U
          </div>
          <h2 className="text-base font-bold tracking-tight text-white uppercase">
            Sistem Seleksi KIP-Kuliah
          </h2>
          <p className="text-xs text-yellow-300 font-semibold tracking-wider mt-0.5">
            UNIVERSITAS PROF. DR. HAZAIRIN, SH (UNIHAZ)
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/60 text-blue-200 border border-blue-800">
            <span>Tahun Akademik 2026/2027</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 shadow-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username atau Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email resmi"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium text-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <span className="text-[11px] text-blue-700 font-semibold hover:underline cursor-pointer">
                  Lupa Sandi?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium text-slate-900 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600">Ingat Saya (Remember Me)</span>
              </label>

              <span className="text-[10px] text-slate-400 font-mono">
                CSRF: Valid
              </span>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke Sistem Seleksi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure Institutional Access Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2.5 text-slate-500 text-[11px] bg-slate-50 p-3 rounded-lg border">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
            <p className="leading-tight">
              Akses terbatas untuk panitia seleksi dan operator resmi Biro Administrasi UNIHAZ.
            </p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400">
          Dilindungi Autentikasi Laravel 12 & Spatie Permission
        </div>
      </div>
    </div>
  );
};
