import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { DashboardStats, ParticipantScoreItem, User } from '../types';
import {
  Users,
  Clock,
  CheckCircle,
  FileCheck,
  Award,
  XCircle,
  Bookmark,
  TrendingUp,
  Filter,
  RefreshCw,
  Search,
  ChevronRight,
  Calculator,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats;
  rankings: ParticipantScoreItem[];
  currentUser: User;
  onNavigate: (route: string) => void;
  onRunRecalculate: () => void;
  isRecalculating: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  rankings,
  currentUser,
  onNavigate,
  onRunRecalculate,
  isRecalculating
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  // Chart canvas refs
  const prodiChartRef = useRef<HTMLCanvasElement | null>(null);
  const berkasChartRef = useRef<HTMLCanvasElement | null>(null);
  const seleksiChartRef = useRef<HTMLCanvasElement | null>(null);
  const distribusiChartRef = useRef<HTMLCanvasElement | null>(null);

  // Chart instances refs for cleanup
  const prodiInstance = useRef<Chart | null>(null);
  const berkasInstance = useRef<Chart | null>(null);
  const seleksiInstance = useRef<Chart | null>(null);
  const distribusiInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // 1. Chart Peserta per Program Studi
    if (prodiChartRef.current) {
      if (prodiInstance.current) prodiInstance.current.destroy();
      prodiInstance.current = new Chart(prodiChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Ilmu Hukum', 'Manajemen', 'Akuntansi', 'Informatika', 'Teknik Sipil', 'Agrotek', 'Ilmu Kom.', 'Adm. Publik'],
          datasets: [{
            label: 'Jumlah Calon Mahasiswa',
            data: [88, 74, 62, 59, 45, 38, 34, 28],
            backgroundColor: '#1e3a8a',
            hoverBackgroundColor: '#eab308',
            borderRadius: 4,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e3a8a',
              titleColor: '#facc15',
              padding: 8,
              displayColors: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
              ticks: { font: { size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 } }
            }
          }
        }
      });
    }

    // 2. Status Pemberkasan Doughnut
    if (berkasChartRef.current) {
      if (berkasInstance.current) berkasInstance.current.destroy();
      berkasInstance.current = new Chart(berkasChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Berkas Lengkap', 'Perlu Perbaikan', 'Tidak Lengkap', 'Belum Diperiksa'],
          datasets: [{
            data: [310, 48, 28, 42],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
            borderWidth: 2,
            borderColor: '#ffffff',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, font: { size: 10 }, padding: 8 }
            }
          }
        }
      });
    }

    // 3. Status Seleksi Kelulusan Doughnut
    if (seleksiChartRef.current) {
      if (seleksiInstance.current) seleksiInstance.current.destroy();
      seleksiInstance.current = new Chart(seleksiChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Lulus (Kuota KIP)', 'Cadangan', 'Tidak Lulus', 'Proses Penilaian'],
          datasets: [{
            data: [120, 35, 195, 78],
            backgroundColor: ['#059669', '#d97706', '#dc2626', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#ffffff',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, font: { size: 10 }, padding: 8 }
            }
          }
        }
      });
    }

    // 4. Distribusi Nilai Akhir Line Chart
    if (distribusiChartRef.current) {
      if (distribusiInstance.current) distribusiInstance.current.destroy();
      distribusiInstance.current = new Chart(distribusiChartRef.current, {
        type: 'line',
        data: {
          labels: ['< 50', '50-59', '60-69', '70-79', '80-89', '90-100'],
          datasets: [{
            label: 'Frekuensi Peserta',
            data: [12, 38, 86, 142, 118, 32],
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#d4a017',
            pointRadius: 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
              ticks: { font: { size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 } }
            }
          }
        }
      });
    }

    return () => {
      prodiInstance.current?.destroy();
      berkasInstance.current?.destroy();
      seleksiInstance.current?.destroy();
      distribusiInstance.current?.destroy();
    };
  }, []);

  const filteredRankings = rankings.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.firstChoice.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Institutional Banner */}
      <div className="rounded-xl bg-[#1e3a8a] p-5 text-white shadow-sm border border-blue-900 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
              <span>Sistem Seleksi Resmi Universitas Prof. Dr. Hazairin, SH</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Pusat Pengelolaan & Perankingan KIP-Kuliah 2026
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Selamat datang, <strong className="text-yellow-300">{currentUser.name}</strong>. Hak akses aktif:{' '}
              <span className="font-semibold text-white underline decoration-yellow-400 underline-offset-2">{currentUser.role}</span>.
              Formula Seleksi: <strong>UTBK (30%) + Wawancara (40%) + Survey (30%)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="dashboard-recalc-btn"
              onClick={onRunRecalculate}
              disabled={isRecalculating}
              className="px-3.5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span>{isRecalculating ? 'Menghitung Nilai...' : 'Hitung Ulang Nilai & Ranking'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7 STATISTIC CARDS (High Density Aesthetic) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Statistik Seleksi Peserta</h2>
          <span className="text-[10px] text-slate-400 font-mono">Sinkronisasi Database MySQL</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {/* Total Peserta */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Peserta</span>
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-slate-900">{stats.totalParticipants}</div>
              <div className="text-[10px] text-slate-500 font-medium">Pendaftar KIP-K</div>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-full rounded-full" />
            </div>
          </div>

          {/* Belum Dinilai */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Belum Dinilai</span>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-amber-600">{stats.unassessed}</div>
              <div className="text-[10px] text-slate-500 font-medium">Perlu tindakan</div>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-[18%] rounded-full" />
            </div>
          </div>

          {/* Pemberkasan */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pemberkasan</span>
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-700">{stats.documentVerificationDone}</div>
              <div className="text-[10px] text-slate-500 font-medium">Berkas diterima</div>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full w-[80%] rounded-full" />
            </div>
          </div>

          {/* Sudah Dinilai */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Sudah Dinilai</span>
                <CheckCircle className="w-3.5 h-3.5 text-cyan-600" />
              </div>
              <div className="text-xl font-bold text-cyan-700">{stats.fullyAssessed}</div>
              <div className="text-[10px] text-slate-500 font-medium">3 Komponen tuntas</div>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-cyan-600 h-full w-[82%] rounded-full" />
            </div>
          </div>

          {/* Lulus Seleksi */}
          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Lulus Seleksi</span>
                <Award className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-700">{stats.passed}</div>
              <div className="text-[10px] text-emerald-600 font-medium">Penerima Kuota</div>
            </div>
            <div className="w-full bg-emerald-100 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full w-[28%] rounded-full" />
            </div>
          </div>

          {/* Tidak Lulus */}
          <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-rose-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Tidak Lulus</span>
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-xl font-bold text-rose-700">{stats.failed}</div>
              <div className="text-[10px] text-rose-600 font-medium">Di bawah cutoff</div>
            </div>
            <div className="w-full bg-rose-100 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full w-[45%] rounded-full" />
            </div>
          </div>

          {/* Cadangan */}
          <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-amber-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Cadangan</span>
                <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-amber-700">{stats.reserved}</div>
              <div className="text-[10px] text-amber-600 font-medium">Menunggu sisa</div>
            </div>
            <div className="w-full bg-amber-100 h-1 mt-2.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-[8%] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 GRAFIK UTAMA CHART.JS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Chart 1: Peserta per Prodi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800">Peserta per Program Studi</h3>
            <span className="text-[10px] text-slate-400">Pilihan 1</span>
          </div>
          <div className="relative h-44 w-full">
            <canvas ref={prodiChartRef} id="chart-peserta-prodi" />
          </div>
        </div>

        {/* Chart 2: Status Pemberkasan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800">Status Pemberkasan</h3>
            <span className="text-[10px] text-emerald-600 font-semibold">80.5% Lengkap</span>
          </div>
          <div className="relative h-44 w-full">
            <canvas ref={berkasChartRef} id="chart-status-pemberkasan" />
          </div>
        </div>

        {/* Chart 3: Status Seleksi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800">Status Hasil Seleksi</h3>
            <span className="text-[10px] text-blue-700 font-semibold">Kuota 120 Orang</span>
          </div>
          <div className="relative h-44 w-full">
            <canvas ref={seleksiChartRef} id="chart-status-seleksi" />
          </div>
        </div>

        {/* Chart 4: Distribusi Nilai Akhir */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800">Distribusi Nilai Akhir</h3>
            <span className="text-[10px] text-amber-600 font-semibold">Mean: 76.4</span>
          </div>
          <div className="relative h-44 w-full">
            <canvas ref={distribusiChartRef} id="chart-distribusi-nilai" />
          </div>
        </div>
      </div>

      {/* TABEL TOP 10 RANKING PESERTA (High Density Styling) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-800" />
              <h3 className="text-sm font-bold text-slate-900">Top 10 Ranking Sementara Seleksi KIP-Kuliah</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutan berdasarkan Formula Nilai Akhir: (UTBK × 30%) + (Wawancara × 40%) + (Survey × 30%)
            </p>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-ranking-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama / nomor..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-800 w-44 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
            >
              <option value="ALL">Semua Status</option>
              <option value="Lulus">Lulus</option>
              <option value="Cadangan">Cadangan</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
            </select>
          </div>
        </div>

        {/* Responsive Table with horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-center w-12">Rank</th>
                <th className="py-2.5 px-4">Nama Peserta</th>
                <th className="py-2.5 px-3">No Pendaftaran</th>
                <th className="py-2.5 px-3">Pilihan 1</th>
                <th className="py-2.5 px-3">Pilihan 2</th>
                <th className="py-2.5 px-3 text-right">UTBK (30%)</th>
                <th className="py-2.5 px-3 text-right">Wawancara (40%)</th>
                <th className="py-2.5 px-3 text-right">Survey (30%)</th>
                <th className="py-2.5 px-3 text-right font-bold text-blue-900">Nilai Akhir</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRankings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada peserta yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRankings.map((item) => (
                  <tr
                    key={item.regNumber}
                    className="hover:bg-slate-50 border-b border-slate-100 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-[11px] ${
                          item.rank === 1
                            ? 'bg-yellow-400 text-blue-950 shadow-2xs'
                            : item.rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : item.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold whitespace-nowrap">
                      {item.regNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {item.firstChoice}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {item.secondChoice}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {item.utbkScore.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {item.interviewScore.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {item.surveyScore.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900 bg-blue-50/50">
                      {item.finalScore.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Lulus'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'Cadangan'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* High Density Calculation Legend Status Bar */}
        <div className="p-3.5 mx-4 my-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row items-center justify-between border border-dashed border-slate-300 text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 text-[11px]">Bobot Penilaian:</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span>UTBK: <strong>30%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Wawancara: <strong>40%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span>Survey: <strong>30%</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
            <Calculator className="w-3.5 h-3.5 text-blue-800" />
            <span>SelectionCalculationService (Laravel 12)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
