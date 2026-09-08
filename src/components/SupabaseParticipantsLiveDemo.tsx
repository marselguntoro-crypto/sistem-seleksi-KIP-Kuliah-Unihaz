import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Participant, SupabaseParticipantRow } from '../types';
import { toAppParticipant } from '../mappers';
import { RefreshCw, AlertCircle, CheckCircle, Users } from 'lucide-react';

/**
 * Contoh Komponen React yang mendemonstrasikan integrasi langsung
 * query Supabase `supabase.from('participants').select('*')` ke state React.
 */
export const SupabaseParticipantsLiveDemo: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Eksekusi query langsung ke tabel 'participants' di Supabase
      const { data, error: supabaseError } = await supabase
        .from('participants')
        .select('*')
        .order('id', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (data) {
        // 2. Mapping data dari snake_case (Supabase) ke domain camelCase aplikasi (type-safe)
        const mappedList: Participant[] = (data as SupabaseParticipantRow[]).map(toAppParticipant);
        setParticipants(mappedList);
      }
    } catch (err: any) {
      console.error('Gagal mengambil data dari Supabase:', err);
      setError(err?.message || 'Terjadi kesalahan saat memuat data Supabase');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Data Peserta Langsung (Supabase Client Query)</h3>
        </div>
        <button
          onClick={fetchParticipants}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Catatan Koneksi Supabase:</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Memuat data dari Supabase...
        </div>
      ) : participants.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Tidak ada peserta ditemukan di tabel Supabase.
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">No. Pendaftaran</th>
                <th className="py-2 px-3">Nama</th>
                <th className="py-2 px-3">Pilihan Prodi 1</th>
                <th className="py-2 px-3">Status Dokumen</th>
                <th className="py-2 px-3">Status Seleksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono font-medium text-blue-900">{p.regNumber}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="py-2 px-3 text-slate-600">{p.firstChoiceProdiName}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700">
                      {p.documentStatus}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      p.selectionStatus === 'Lulus'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.selectionStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-slate-400 text-right">
            Menampilkan {Math.min(5, participants.length)} dari {participants.length} data peserta
          </p>
        </div>
      )}
    </div>
  );
};
