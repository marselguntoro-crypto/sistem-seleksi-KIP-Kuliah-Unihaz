import React, { useState, useMemo } from 'react';
import { SelectionAuditLog, User } from '../../types';
import {
  History,
  Search,
  Filter,
  Calendar,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  Eye,
  X,
  Printer,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Activity,
  ChevronDown
} from 'lucide-react';

interface AuditLogsViewProps {
  auditLogs: SelectionAuditLog[];
  currentUser: User;
  onClearLogs?: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  auditLogs,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<SelectionAuditLog | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        searchTerm === '' ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.changedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.participantName && log.participantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
      const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

      let matchesTime = true;
      if (timeFilter === 'TODAY') {
        matchesTime = log.timestamp.startsWith('2026-09-07');
      } else if (timeFilter === 'LAST_7') {
        matchesTime = log.timestamp >= '2026-09-01';
      }

      return matchesSearch && matchesModule && matchesSeverity && matchesTime;
    });
  }, [auditLogs, searchTerm, moduleFilter, severityFilter, timeFilter]);

  // Statistics
  const totalLogs = auditLogs.length;
  const todayLogs = auditLogs.filter((l) => l.timestamp.startsWith('2026-09-07')).length;
  const criticalLogs = auditLogs.filter((l) => l.severity === 'danger' || l.module === 'KELULUSAN' || l.module === 'BOBOT_SELEKSI').length;
  
  // Most active operator
  const operatorCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    auditLogs.forEach((l) => {
      counts[l.changedBy] = (counts[l.changedBy] || 0) + 1;
    });
    return counts;
  }, [auditLogs]);

  const topOperator = useMemo(() => {
    const entries = Object.entries(operatorCounts);
    if (entries.length === 0) return { name: '-', count: 0 };
    entries.sort((a, b) => Number(b[1]) - Number(a[1]));
    return { name: entries[0][0], count: entries[0][1] };
  }, [operatorCounts]);

  const getModuleBadge = (module: SelectionAuditLog['module']) => {
    switch (module) {
      case 'PEMBERKASAN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">Pemberkasan</span>;
      case 'SURVEY':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">Survey Lapangan</span>;
      case 'UTBK':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">Nilai UTBK</span>;
      case 'WAWANCARA':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">Wawancara</span>;
      case 'KELULUSAN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Penetapan SK</span>;
      case 'BOBOT_SELEKSI':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">Bobot Seleksi</span>;
      case 'OPERATOR':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">Operator RBAC</span>;
      case 'MASTER_DATA':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">Master Data</span>;
      case 'BACKUP':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">Backup DB</span>;
      case 'AUTH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">Autentikasi</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">Sistem</span>;
    }
  };

  const getSeverityIcon = (severity?: SelectionAuditLog['severity']) => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'danger':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Waktu', 'Modul', 'Aksi', 'Operator', 'Peran', 'Peserta', 'Status Lama', 'Status Baru', 'IP Address', 'Keterangan'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.module}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.changedBy.replace(/"/g, '""')}"`,
      `"${l.role || ''}"`,
      `"${l.participantName || '-'}"`,
      `"${l.oldStatus || '-'}"`,
      `"${l.newStatus || '-'}"`,
      `"${l.ipAddress || '-'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Log_UNIHAZ_KIPK_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Log & Jejak Aktivitas Sistem</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                  <ShieldCheck className="w-3 h-3" /> Audit Trail
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Perekaman otomatis setiap interaksi mutasi data peserta, verifikasi dokumen, skor seleksi, penetapan kelulusan, konfigurasi bobot, dan aktivitas operasional akun sesuai kepatuhan tata kelola UNIHAZ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              id="btn-export-audit-csv"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Ekspor CSV
            </button>
            <button
              onClick={handlePrint}
              id="btn-print-audit-log"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-900 border border-blue-950 text-white hover:bg-blue-800 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              Cetak Rekap
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-[11px] font-medium text-slate-500">Total Log Tercatat</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-slate-800">{totalLogs}</span>
              <span className="text-[11px] text-slate-500">Entri</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/60">
            <p className="text-[11px] font-medium text-blue-700">Aktivitas Hari Ini</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-blue-900">{todayLogs}</span>
              <span className="text-[11px] text-blue-600 font-semibold">Mutasi</span>
            </div>
          </div>
          <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200/60">
            <p className="text-[11px] font-medium text-purple-700">Operator Paling Aktif</p>
            <div className="mt-1">
              <p className="text-xs font-bold text-purple-950 truncate" title={topOperator.name}>{topOperator.name}</p>
              <p className="text-[10px] text-purple-600 font-semibold">{topOperator.count} aktivitas</p>
            </div>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/60">
            <p className="text-[11px] font-medium text-amber-700">Aksi Krusial / Kunci</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold text-amber-900">{criticalLogs}</span>
              <span className="text-[11px] text-amber-600 font-semibold">SK & Bobot</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-audit-log"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari aksi, nama peserta, operator, atau keterangan..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Module Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="filter-audit-module"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="ALL">Semua Modul</option>
                <option value="PEMBERKASAN">Pemberkasan</option>
                <option value="SURVEY">Survey Lapangan</option>
                <option value="UTBK">Nilai UTBK</option>
                <option value="WAWANCARA">Wawancara</option>
                <option value="KELULUSAN">Penetapan SK</option>
                <option value="BOBOT_SELEKSI">Bobot Seleksi</option>
                <option value="OPERATOR">Operator RBAC</option>
                <option value="MASTER_DATA">Master Data</option>
                <option value="BACKUP">Backup Database</option>
                <option value="AUTH">Autentikasi</option>
              </select>
            </div>

            {/* Severity Filter */}
            <select
              id="filter-audit-severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="info">Info</option>
              <option value="success">Sukses</option>
              <option value="warning">Peringatan</option>
              <option value="danger">Krusial / Ditolak</option>
            </select>

            {/* Time Filter */}
            <select
              id="filter-audit-time"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="LAST_7">7 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-40">Waktu & Tanggal</th>
                <th className="py-3 px-4 w-32">Modul</th>
                <th className="py-3 px-4">Aksi & Deskripsi</th>
                <th className="py-3 px-4 w-48">Operator</th>
                <th className="py-3 px-4 w-44">Status Mutasi</th>
                <th className="py-3 px-4 w-20 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada audit log yang sesuai dengan filter.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau reset filter dropdown.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{log.timestamp}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono pl-5">
                        IP: {log.ipAddress || '10.14.20.101'}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getModuleBadge(log.module)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getSeverityIcon(log.severity)}
                        <span className="font-semibold text-slate-900">{log.action}</span>
                      </div>
                      {log.participantName && (
                        <div className="text-[11px] text-blue-800 font-medium mt-0.5">
                          Peserta: <span className="font-bold">{log.participantName}</span>
                        </div>
                      )}
                      {log.details && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {log.details}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 truncate max-w-[170px]">{log.changedBy}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>{log.role || 'Operator'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.oldStatus || log.newStatus ? (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {log.oldStatus && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] truncate max-w-[80px]" title={log.oldStatus}>
                              {log.oldStatus}
                            </span>
                          )}
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10px] font-bold truncate max-w-[90px]" title={log.newStatus}>
                            {log.newStatus}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
                        title="Lihat Detail Log Lengkap"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>Menampilkan {filteredLogs.length} dari total {auditLogs.length} jejak audit sistem.</span>
          <span className="text-slate-400">Penyimpanan log diamankan dengan timestamp berurutan tak terhapus (Append-Only).</span>
        </div>
      </div>

      {/* Modal Detail Audit Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Detail Rekam Audit #{selectedLog.id}</h3>
                  <p className="text-[11px] text-slate-500">{selectedLog.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Modul Terkait</span>
                  <div className="mt-1">{getModuleBadge(selectedLog.module)}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Tingkat / Severity</span>
                  <div className="mt-1 flex items-center gap-1 font-semibold text-slate-800">
                    {getSeverityIcon(selectedLog.severity)}
                    <span className="capitalize">{selectedLog.severity || 'info'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Operator Pelaksana</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedLog.changedBy}</p>
                  <p className="text-[10px] text-slate-500">{selectedLog.role || 'Operator'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Alamat IP & Jaringan</span>
                  <p className="font-mono text-slate-800 mt-0.5">{selectedLog.ipAddress || '10.14.20.101'}</p>
                  <p className="text-[10px] text-slate-500">Subnet Biro Administrasi UNIHAZ</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold">Aksi yang Dijalankan:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedLog.action}</p>
              </div>

              {selectedLog.participantName && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/60">
                  <span className="text-blue-800 font-semibold">Target Peserta KIP-Kuliah:</span>
                  <p className="text-sm font-bold text-blue-950 mt-0.5">
                    {selectedLog.participantName} {selectedLog.participantId ? `(ID: #${selectedLog.participantId})` : ''}
                  </p>
                </div>
              )}

              {(selectedLog.oldStatus || selectedLog.newStatus) && (
                <div>
                  <span className="text-slate-500 font-semibold">Perubahan Status / Nilai:</span>
                  <div className="mt-1.5 flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-400 font-medium">Status Semula:</div>
                      <div className="font-mono font-bold text-slate-700 mt-0.5 break-all">
                        {selectedLog.oldStatus || '(Kosong / Awal)'}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] text-blue-600 font-medium">Status Diperbarui:</div>
                      <div className="font-mono font-bold text-blue-800 mt-0.5 break-all">
                        {selectedLog.newStatus || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <span className="text-slate-500 font-semibold">Keterangan Catatan Sistem:</span>
                  <p className="mt-1 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {selectedLog.details}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
