import React, { useState, useMemo } from 'react';
import { SelectionWeights, Participant, User } from '../../types';
import { calculateParticipantFinalScore, DEFAULT_SELECTION_WEIGHTS } from '../../utils/selectionUtils';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Info,
  GraduationCap,
  Sparkles,
  Users,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Calculator,
  ArrowRight
} from 'lucide-react';

interface SelectionWeightsViewProps {
  weights: SelectionWeights;
  onUpdateWeights: (weights: SelectionWeights) => void;
  participants: Participant[];
  currentUser: User;
}

export const SelectionWeightsView: React.FC<SelectionWeightsViewProps> = ({
  weights,
  onUpdateWeights,
  participants,
  currentUser,
}) => {
  const [formWeights, setFormWeights] = useState<SelectionWeights>(weights);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Handle individual weight change
  const handleChange = (key: keyof SelectionWeights, val: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    setFormWeights((prev) => {
      const next = { ...prev, [key]: clamped };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Total sum
  const currentSum =
    formWeights.utbkWeight +
    formWeights.interviewWeight +
    formWeights.surveyWeight +
    formWeights.affirmationWeight;

  const isValidSum = currentSum === 100;
  const delta = 100 - currentSum;

  // Preset Configurations
  const applyPreset = (preset: { name: string; weights: SelectionWeights }) => {
    setFormWeights(preset.weights);
    setHasUnsavedChanges(true);
  };

  const PRESETS = [
    {
      name: 'Standar UNIHAZ KIP-K',
      description: 'Proporsi seimbang rekomendasi BAAK UNIHAZ untuk KIP-K Reguler.',
      weights: { utbkWeight: 30, interviewWeight: 30, surveyWeight: 25, affirmationWeight: 15 },
    },
    {
      name: 'Fokus Kemampuan Akademik',
      description: 'Menitikberatkan pada kemampuan tes skolastik dan literasi SNBT.',
      weights: { utbkWeight: 45, interviewWeight: 25, surveyWeight: 20, affirmationWeight: 10 },
    },
    {
      name: 'Fokus Kondisi Ekonomi & Afirmasi',
      description: 'Memprioritaskan siswa Desil 1-2 dan visitasi tempat tinggal.',
      weights: { utbkWeight: 20, interviewWeight: 25, surveyWeight: 35, affirmationWeight: 20 },
    },
    {
      name: 'Fokus Integritas & Wawancara',
      description: 'Menekankan komitmen belajar dan wawasan kebangsaan mahasiswa.',
      weights: { utbkWeight: 25, interviewWeight: 40, surveyWeight: 25, affirmationWeight: 10 },
    },
  ];

  // Live simulation comparing current weights vs new form weights
  const simulationList = useMemo(() => {
    // 1. Calculate with saved weights
    const listOld = participants.map((p) => {
      const oldScore = calculateParticipantFinalScore(
        p.utbkScore || 0,
        p.interviewScore || 0,
        p.surveyScore || 0,
        p.desil || 'Desil 3',
        weights
      );
      return { id: p.id, oldScore };
    });
    listOld.sort((a, b) => b.oldScore - a.oldScore);
    const oldRankMap: Record<number, number> = {};
    listOld.forEach((item, index) => {
      oldRankMap[item.id] = index + 1;
    });

    // 2. Calculate with new form weights
    const listNew = participants.map((p) => {
      const oldScore = oldRankMap[p.id] ? listOld.find((i) => i.id === p.id)?.oldScore || 0 : 0;
      const newScore = calculateParticipantFinalScore(
        p.utbkScore || 0,
        p.interviewScore || 0,
        p.surveyScore || 0,
        p.desil || 'Desil 3',
        formWeights
      );
      return {
        ...p,
        oldScore,
        newScore,
        oldRank: oldRankMap[p.id] || 0,
      };
    });

    listNew.sort((a, b) => b.newScore - a.newScore);
    return listNew.map((item, index) => ({
      ...item,
      newRank: index + 1,
      rankDiff: item.oldRank - (index + 1), // positive means rank improved
    }));
  }, [participants, weights, formWeights]);

  const handleSave = () => {
    if (!isValidSum) return;
    onUpdateWeights(formWeights);
    setHasUnsavedChanges(false);
    setSaveSuccessMsg('Konfigurasi bobot seleksi berhasil disimpan dan disinkronkan ke seluruh sistem pemeringkatan!');
    setTimeout(() => {
      setSaveSuccessMsg('');
    }, 4000);
  };

  const handleReset = () => {
    setFormWeights(weights);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-800 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Bobot Seleksi KIP-Kuliah</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                  Formula Seleksi
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Tentukan proporsi persentase penentu skor akhir beasiswa KIP-Kuliah UNIHAZ. Algoritma perankingan otomatis akan mengkalkulasi ulang seluruh urutan peserta secara real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
              id="btn-reset-weights"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition ${
                hasUnsavedChanges
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Batal Perubahan
            </button>
            <button
              onClick={handleSave}
              disabled={!isValidSum || !hasUnsavedChanges}
              id="btn-save-weights"
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition shadow-2xs ${
                isValidSum && hasUnsavedChanges
                  ? 'bg-blue-900 border border-blue-950 text-white hover:bg-blue-800 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Simpan Konfigurasi
            </button>
          </div>
        </div>

        {/* Total Sum & Formula Indicator */}
        <div className="mt-5 p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-200 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base transition-colors shrink-0 ${
                isValidSum
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
              }`}
            >
              {currentSum}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {isValidSum ? 'Proporsi Bobot Valid (Tepat 100%)' : `Total Bobot Tidak Valid: ${currentSum}%`}
                </h4>
                {isValidSum ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sesuai Syarat Regulasi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5" /> {delta > 0 ? `Kurang ${delta}%` : `Kelebihan ${Math.abs(delta)}%`}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Skor Akhir = ({formWeights.utbkWeight}% × UTBK) + ({formWeights.interviewWeight}% × Wawancara) + ({formWeights.surveyWeight}% × Survey) + ({formWeights.affirmationWeight}% × Afirmasi)
              </p>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="w-full md:w-64 bg-slate-200 h-2.5 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${formWeights.utbkWeight}%` }} className="bg-blue-600 h-full" title={`UTBK: ${formWeights.utbkWeight}%`} />
            <div style={{ width: `${formWeights.interviewWeight}%` }} className="bg-indigo-600 h-full" title={`Wawancara: ${formWeights.interviewWeight}%`} />
            <div style={{ width: `${formWeights.surveyWeight}%` }} className="bg-teal-600 h-full" title={`Survey: ${formWeights.surveyWeight}%`} />
            <div style={{ width: `${formWeights.affirmationWeight}%` }} className="bg-amber-500 h-full" title={`Afirmasi: ${formWeights.affirmationWeight}%`} />
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Preset Templates */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Preset Bobot Rekomendasi</h3>
          </div>
          <span className="text-[11px] text-slate-400">Klik kartu untuk menerapkan template bobot</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset, idx) => {
            const isMatch =
              formWeights.utbkWeight === preset.weights.utbkWeight &&
              formWeights.interviewWeight === preset.weights.interviewWeight &&
              formWeights.surveyWeight === preset.weights.surveyWeight &&
              formWeights.affirmationWeight === preset.weights.affirmationWeight;

            return (
              <button
                key={idx}
                onClick={() => applyPreset(preset)}
                className={`p-3.5 text-left rounded-xl border transition-all cursor-pointer ${
                  isMatch
                    ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-600/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{preset.name}</span>
                  {isMatch && <span className="w-2 h-2 rounded-full bg-purple-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">{preset.description}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono font-semibold text-slate-700">
                  <span>U: {preset.weights.utbkWeight}%</span>
                  <span>W: {preset.weights.interviewWeight}%</span>
                  <span>S: {preset.weights.surveyWeight}%</span>
                  <span>A: {preset.weights.affirmationWeight}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Weights Adjustment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Component 1: UTBK */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-800 font-bold text-xs">
                U
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Nilai UTBK / Tes Potensi Akademik</h3>
                <p className="text-[11px] text-slate-500">Skor SNBT / TPA Skolastik & Literasi</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              <input
                type="number"
                min="0"
                max="100"
                value={formWeights.utbkWeight}
                onChange={(e) => handleChange('utbkWeight', parseInt(e.target.value))}
                className="w-10 text-right font-bold text-sm text-blue-900 bg-transparent focus:outline-none"
              />
              <span className="text-xs font-bold text-blue-700">%</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={formWeights.utbkWeight}
            onChange={(e) => handleChange('utbkWeight', parseInt(e.target.value))}
            className="w-full accent-blue-700 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Minimal: 0%</span>
            <span className="text-slate-600 font-medium">Rekomendasi BAAK: 25% - 40%</span>
            <span>Maksimal: 100%</span>
          </div>
        </div>

        {/* Component 2: Wawancara */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-xs">
                W
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Wawancara Komitmen & Wawasan</h3>
                <p className="text-[11px] text-slate-500">Integritas studi, kepribadian & nasionalisme</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
              <input
                type="number"
                min="0"
                max="100"
                value={formWeights.interviewWeight}
                onChange={(e) => handleChange('interviewWeight', parseInt(e.target.value))}
                className="w-10 text-right font-bold text-sm text-indigo-900 bg-transparent focus:outline-none"
              />
              <span className="text-xs font-bold text-indigo-700">%</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={formWeights.interviewWeight}
            onChange={(e) => handleChange('interviewWeight', parseInt(e.target.value))}
            className="w-full accent-indigo-700 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Minimal: 0%</span>
            <span className="text-slate-600 font-medium">Rekomendasi BAAK: 25% - 40%</span>
            <span>Maksimal: 100%</span>
          </div>
        </div>

        {/* Component 3: Survey */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-xs">
                S
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Survey Lapangan & Kondisi Ekonomi</h3>
                <p className="text-[11px] text-slate-500">Visitasi fisik tempat tinggal & aset orang tua</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
              <input
                type="number"
                min="0"
                max="100"
                value={formWeights.surveyWeight}
                onChange={(e) => handleChange('surveyWeight', parseInt(e.target.value))}
                className="w-10 text-right font-bold text-sm text-teal-900 bg-transparent focus:outline-none"
              />
              <span className="text-xs font-bold text-teal-700">%</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={formWeights.surveyWeight}
            onChange={(e) => handleChange('surveyWeight', parseInt(e.target.value))}
            className="w-full accent-teal-700 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Minimal: 0%</span>
            <span className="text-slate-600 font-medium">Rekomendasi BAAK: 20% - 35%</span>
            <span>Maksimal: 100%</span>
          </div>
        </div>

        {/* Component 4: Afirmasi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs">
                A
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Afirmasi & Kriteria Khusus</h3>
                <p className="text-[11px] text-slate-500">KIP SMA, DTKS Desil 1-2, yatim piatu, 3T</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              <input
                type="number"
                min="0"
                max="100"
                value={formWeights.affirmationWeight}
                onChange={(e) => handleChange('affirmationWeight', parseInt(e.target.value))}
                className="w-10 text-right font-bold text-sm text-amber-900 bg-transparent focus:outline-none"
              />
              <span className="text-xs font-bold text-amber-700">%</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={formWeights.affirmationWeight}
            onChange={(e) => handleChange('affirmationWeight', parseInt(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Minimal: 0%</span>
            <span className="text-slate-600 font-medium">Rekomendasi BAAK: 10% - 20%</span>
            <span>Maksimal: 100%</span>
          </div>
        </div>
      </div>

      {/* Live Impact Simulation Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">Simulasi Dampak Ranking Real-Time</h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Menampilkan pergeseran ranking {Math.min(10, simulationList.length)} besar peserta berdasarkan formula baru
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center w-16">Rank Baru</th>
                <th className="py-3 px-4 w-28 text-center">Pergeseran</th>
                <th className="py-3 px-4">Nama Peserta KIP-K</th>
                <th className="py-3 px-3 text-center">UTBK (Raw)</th>
                <th className="py-3 px-3 text-center">Wawancara</th>
                <th className="py-3 px-3 text-center">Survey</th>
                <th className="py-3 px-3 text-center">Desil</th>
                <th className="py-3 px-4 text-center">Skor Lama</th>
                <th className="py-3 px-4 text-center">Skor Baru (Simulasi)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {simulationList.slice(0, 10).map((item) => {
                const isRankUp = item.rankDiff > 0;
                const isRankDown = item.rankDiff < 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-sm">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        item.newRank <= 3
                          ? 'bg-amber-100 text-amber-800 font-extrabold border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.newRank}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isRankUp ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          ▲ +{item.rankDiff} (Naik)
                        </span>
                      ) : isRankDown ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                          ▼ {item.rankDiff} (Turun)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">= Tetap</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.regNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {item.utbkScore?.toFixed(1) || '0.0'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {item.interviewScore?.toFixed(1) || '0.0'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {item.surveyScore?.toFixed(1) || '0.0'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {item.desil}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {item.oldScore.toFixed(2)} (Rank #{item.oldRank})
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-900 bg-blue-50/40">
                      {item.newScore.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
