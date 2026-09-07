import React, { useState, useMemo } from 'react';
import { User, RoleName } from '../../types';
import { 
  UserCheck, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  User as UserIcon,
  RefreshCw,
  Mail,
  Lock,
  Calendar,
  X,
  Check
} from 'lucide-react';

interface OperatorsViewProps {
  users: User[];
  currentUser: User;
  onAddUser: (newUser: Omit<User, 'id'>) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: number) => void;
  onToggleUserActive: (userId: number) => void;
}

const ROLE_OPTIONS: { role: RoleName; label: string; desc: string; color: string; permissions: string[] }[] = [
  {
    role: 'Super Admin',
    label: 'Super Admin',
    desc: 'Hak akses penuh ke seluruh modul sistem: Master Data, Peserta, Import, Seleksi, Bobot, Laporan, dan Manajemen Operator.',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    permissions: ['all-permissions', 'manage-operators', 'manage-master-data', 'manage-selection-weights', 'determine-selection-results']
  },
  {
    role: 'Operator Pemberkasan',
    label: 'Operator Pemberkasan',
    desc: 'Verifikasi berkas fisik calon mahasiswa KIP-Kuliah, kelengkapan berkas, dan catatan kekurangan dokumen.',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    permissions: ['view-dashboard', 'view-participants', 'manage-document-verification']
  },
  {
    role: 'Operator SPMB',
    label: 'Operator SPMB',
    desc: 'Input dan validasi skor UTBK/TPA, penilaian wawancara pendaftar, dan pantauan ranking hasil seleksi.',
    color: 'bg-violet-100 text-violet-900 border-violet-300',
    permissions: ['view-dashboard', 'view-participants', 'manage-utbk-scores', 'manage-interview-scores', 'view-rankings']
  },
  {
    role: 'Operator Survey',
    label: 'Operator Survey',
    desc: 'Visitasi lapangan, penilaian kondisi ekonomi tempat tinggal pendaftar, dan dokumentasi survey faktual.',
    color: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    permissions: ['view-dashboard', 'view-participants', 'manage-survey-scores']
  }
];

export const OperatorsView: React.FC<OperatorsViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserActive
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states for Add Operator
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: 'Operator Pemberkasan' as RoleName,
    password: '',
    passwordConfirmation: '',
    isActive: true
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states for Edit Operator
  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: 'Operator Pemberkasan' as RoleName,
    newPassword: '',
    isActive: true
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Filtered operators
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && u.isActive) || 
        (statusFilter === 'inactive' && !u.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      superAdmin: users.filter((u) => u.role === 'Super Admin').length,
      pemberkasan: users.filter((u) => u.role === 'Operator Pemberkasan').length,
      spmb: users.filter((u) => u.role === 'Operator SPMB').length,
      survey: users.filter((u) => u.role === 'Operator Survey').length
    };
  }, [users]);

  // Generate random strong password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      role: 'Operator Pemberkasan',
      password: 'Operator@12345',
      passwordConfirmation: 'Operator@12345',
      isActive: true
    });
    setFormError(null);
    setShowPassword(false);
    setIsAddModalOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = formData.username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setFormError('Username minimal 3 karakter tanpa spasi.');
      return;
    }

    if (/\s/.test(cleanUsername)) {
      setFormError('Username tidak boleh mengandung spasi.');
      return;
    }

    // Check duplicate username
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setFormError(`Username "${cleanUsername}" sudah digunakan oleh operator lain.`);
      return;
    }

    // Check duplicate email
    if (users.some((u) => u.email.toLowerCase() === formData.email.trim().toLowerCase())) {
      setFormError(`Email "${formData.email.trim()}" sudah terdaftar.`);
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Kata sandi minimal 6 karakter.');
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setFormError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    onAddUser({
      name: formData.name.trim(),
      username: cleanUsername,
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      isActive: formData.isActive,
      password: formData.password,
      lastLoginAt: null
    });

    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      newPassword: '',
      isActive: user.isActive
    });
    setEditFormError(null);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditFormError(null);

    const cleanUsername = editFormData.username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setEditFormError('Username minimal 3 karakter.');
      return;
    }

    // Check duplicate username with other users
    if (users.some((u) => u.id !== editingUser.id && u.username.toLowerCase() === cleanUsername)) {
      setEditFormError(`Username "${cleanUsername}" sudah digunakan.`);
      return;
    }

    // Check duplicate email with other users
    if (users.some((u) => u.id !== editingUser.id && u.email.toLowerCase() === editFormData.email.trim().toLowerCase())) {
      setEditFormError(`Email "${editFormData.email.trim()}" sudah terdaftar.`);
      return;
    }

    const updated: User = {
      ...editingUser,
      name: editFormData.name.trim(),
      username: cleanUsername,
      email: editFormData.email.trim().toLowerCase(),
      role: editFormData.role,
      isActive: editFormData.isActive,
      password: editFormData.newPassword ? editFormData.newPassword : editingUser.password
    };

    onUpdateUser(updated);
    setEditingUser(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;

    if (deletingUser.id === 1) {
      alert('Akun Super Admin Utama (ID 1) tidak dapat dihapus.');
      setDeletingUser(null);
      return;
    }

    if (deletingUser.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif login.');
      setDeletingUser(null);
      return;
    }

    onDeleteUser(deletingUser.id);
    setDeletingUser(null);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  Manajemen Operator & Pengguna Sistem
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengelolaan hak akses akun seleksi KIP-Kuliah UNIHAZ dengan Spatie Role-Based Access Control (RBAC).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-operator"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Operator Baru</span>
            </button>
          </div>
        </div>

        {/* Statistical Mini Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Akun</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">{stats.total}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Akun Aktif</span>
            <span className="text-lg font-black text-emerald-900 mt-0.5 block">{stats.active}</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Super Admin</span>
            <span className="text-lg font-black text-amber-900 mt-0.5 block">{stats.superAdmin}</span>
          </div>
          <div className="p-3 bg-teal-50 rounded-lg border border-teal-200/80">
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Op. Pemberkasan</span>
            <span className="text-lg font-black text-teal-900 mt-0.5 block">{stats.pemberkasan}</span>
          </div>
          <div className="p-3 bg-violet-50 rounded-lg border border-violet-200/80">
            <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider block">Op. SPMB</span>
            <span className="text-lg font-black text-violet-900 mt-0.5 block">{stats.spmb}</span>
          </div>
          <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200/80">
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">Op. Survey</span>
            <span className="text-lg font-black text-cyan-900 mt-0.5 block">{stats.survey}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="search-operator-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama, username, atau email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Role */}
          <div className="relative">
            <select
              id="filter-operator-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800 font-medium bg-white"
            >
              <option value="all">Semua Peran / Role</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Operator Pemberkasan">Operator Pemberkasan</option>
              <option value="Operator SPMB">Operator SPMB</option>
              <option value="Operator Survey">Operator Survey</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="relative">
            <select
              id="filter-operator-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800 font-medium bg-white"
            >
              <option value="all">Semua Status Akun</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operators Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">
            Daftar Operator Terdaftar ({filteredUsers.length} dari {users.length})
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Tersimpan di tabel database: <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">users</code> &amp; <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">model_has_roles</code>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Operator &amp; Identitas</th>
                <th className="py-3 px-4">Username Akun</th>
                <th className="py-3 px-4">Role Spatie (Hak Akses)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Terakhir Login</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <UserIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-xs text-slate-600">Tidak ada operator ditemukan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter peran.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isCurrent = user.id === currentUser.id;
                  const isPrimaryAdmin = user.id === 1;
                  const roleMeta = ROLE_OPTIONS.find((r) => r.role === user.role);

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${!user.isActive ? 'bg-slate-50/40 opacity-75' : ''}`}
                    >
                      {/* # ID & Avatar */}
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            user.role === 'Super Admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : user.role === 'Operator Pemberkasan'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : user.role === 'Operator SPMB'
                              ? 'bg-violet-100 text-violet-900 border border-violet-300'
                              : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                          @{user.username}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta?.color || 'bg-slate-100 text-slate-700'}`}>
                          <Shield className="w-3 h-3" />
                          <span>{user.role}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 max-w-xs truncate" title={roleMeta?.desc}>
                          {roleMeta?.desc}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPrimaryAdmin) {
                              alert('Status Super Admin Utama tidak dapat dinonaktifkan.');
                              return;
                            }
                            onToggleUserActive(user.id);
                          }}
                          disabled={isPrimaryAdmin}
                          title={isPrimaryAdmin ? 'Super Admin Utama selalu aktif' : 'Klik untuk mengubah status'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 cursor-pointer'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300 cursor-pointer'
                          } ${isPrimaryAdmin ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-500" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4">
                        <div className="text-slate-600 text-[11px] font-mono">
                          {user.lastLoginAt ? user.lastLoginAt : (
                            <span className="text-slate-400 italic">Belum pernah login</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit / Reset Password Button */}
                          <button
                            id={`btn-edit-operator-${user.id}`}
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                            title="Edit Data / Reset Password"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            id={`btn-delete-operator-${user.id}`}
                            onClick={() => setDeletingUser(user)}
                            disabled={isPrimaryAdmin || isCurrent}
                            className={`p-1.5 rounded-lg transition-colors border ${
                              isPrimaryAdmin || isCurrent
                                ? 'text-slate-300 border-transparent cursor-not-allowed'
                                : 'text-rose-600 hover:text-rose-800 hover:bg-rose-50 border-transparent hover:border-rose-200 cursor-pointer'
                            }`}
                            title={
                              isPrimaryAdmin
                                ? 'Akun Super Admin Utama (ID 1) dilindungi dari penghapusan'
                                : isCurrent
                                ? 'Anda tidak dapat menghapus akun Anda sendiri'
                                : 'Hapus Operator'
                            }
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

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
          <span>
            Menampilkan <strong>{filteredUsers.length}</strong> operator
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            Spatie Permission v6.0 &bull; Laravel Sanctum Session Guard
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH OPERATOR BARU */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-[#1e3a8a] text-white p-4 flex items-center justify-between border-b-4 border-yellow-400">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-bold text-sm">Tambah Operator Baru</h3>
                  <p className="text-[11px] text-blue-200">Buat kredensial akun operator seleksi KIP-Kuliah UNIHAZ</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitAdd} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Operator <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="input-operator-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Dr. Irfan Pratama, M.Kom"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800"
                  />
                </div>
              </div>

              {/* Username & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                      @
                    </div>
                    <input
                      id="input-operator-username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      placeholder="irfan.kipk"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Resmi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="input-operator-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="irfan@unihaz.ac.id"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Peran / Role Spatie <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.role}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        formData.role === opt.role
                          ? 'bg-blue-50/80 border-blue-600 ring-1 ring-blue-600'
                          : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="operator-role"
                        value={opt.role}
                        checked={formData.role === opt.role}
                        onChange={() => setFormData({ ...formData, role: opt.role })}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{opt.label}</span>
                          <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${opt.color}`}>
                            {opt.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Kata Sandi <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const rnd = generateRandomPassword();
                        setFormData({
                          ...formData,
                          password: rnd,
                          passwordConfirmation: rnd
                        });
                        setShowPassword(true);
                      }}
                      className="text-[10px] text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Acak</span>
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="input-operator-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min. 6 karakter"
                      className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Konfirmasi Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="input-operator-password-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.passwordConfirmation}
                      onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status Akun */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Aktifkan akun segera (dapat langsung digunakan untuk login)
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-new-operator"
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#1e3a8a] hover:bg-blue-900 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Operator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT OPERATOR & RESET PASSWORD */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="bg-slate-800 text-white p-4 flex items-center justify-between border-b-4 border-yellow-400">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-bold text-sm">Edit Operator / Reset Sandi</h3>
                  <p className="text-[11px] text-slate-300">ID: #{editingUser.id} &bull; @{editingUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-5 space-y-4">
              {editFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Operator
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingUser.id === 1}
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 font-mono disabled:bg-slate-100"
                  />
                  {editingUser.id === 1 && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block italic">Username admin utama dikunci</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Peran / Role Spatie
                </label>
                <select
                  value={editFormData.role}
                  disabled={editingUser.id === 1}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as RoleName })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 font-medium bg-white disabled:bg-slate-100"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Operator Pemberkasan">Operator Pemberkasan</option>
                  <option value="Operator SPMB">Operator SPMB</option>
                  <option value="Operator Survey">Operator Survey</option>
                </select>
              </div>

              {/* Reset Password Optional */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reset Kata Sandi (Opsional)</span>
                </label>
                <p className="text-[11px] text-amber-800 mb-2 leading-relaxed">
                  Kosongkan jika tidak ingin mengubah password akun operator ini.
                </p>
                <input
                  type="text"
                  value={editFormData.newPassword}
                  onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                  placeholder="Masukkan password baru jika ingin mereset..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white text-slate-800 font-mono"
                />
              </div>

              {/* Active Toggle */}
              {editingUser.id !== 1 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Status Akun Aktif
                  </span>
                </label>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-edit-operator"
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#1e3a8a] hover:bg-blue-900 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS OPERATOR */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="bg-rose-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Konfirmasi Hapus Operator</h3>
              </div>
              <button
                onClick={() => setDeletingUser(null)}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun operator berikut dari database sistem?
              </p>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Operator:</span>
                  <strong className="text-slate-900">{deletingUser.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-mono font-semibold text-blue-900">@{deletingUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold text-amber-800">{deletingUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-700">{deletingUser.email}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Tindakan ini permanen. Akun ini tidak akan dapat digunakan untuk masuk ke dalam sistem seleksi KIP-Kuliah UNIHAZ lagi.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-confirm-delete-operator"
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Operator Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
