import { Participant, SelectionWeights, DesilCategory, DocumentRequirement, StudyProgram } from '../types';

export const STANDARD_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: 'kip_kks_sktm',
    title: 'Kartu KIP / KKS / SKTM Kelurahan',
    description: 'Bukti kepemilikan program bantuan pemerintah atau SKTM resmi bermaterai',
    isRequired: true
  },
  {
    id: 'kipk_card',
    title: 'Kartu Pendaftaran KIP-Kuliah',
    description: 'Cetak kartu tanda peserta KIP-K dari portal Kemdikbudristek',
    isRequired: true
  },
  {
    id: 'identity_docs',
    title: 'KTP & Kartu Keluarga (KK)',
    description: 'Salinan identitas kependudukan calon mahasiswa dan orang tua/wali',
    isRequired: true
  },
  {
    id: 'academic_certificate',
    title: 'Ijazah / SKL & Legalisir Rapor',
    description: 'Surat Keterangan Lulus dan fotokopi rapor semester 1-5 terlegalisir',
    isRequired: true
  },
  {
    id: 'income_slip',
    title: 'Surat Keterangan Penghasilan Ortu',
    description: 'Slip gaji resmi atau surat keterangan penghasilan dari Kepala Desa/Lurah',
    isRequired: true
  },
  {
    id: 'house_photos',
    title: 'Foto Rumah Lengkap',
    description: 'Foto berwarna tampak depan, ruang tamu, dapur, dan kamar tidur',
    isRequired: true
  },
  {
    id: 'utility_bill',
    title: 'Rekening Listrik / PBB',
    description: 'Bukti pembayaran rekening listrik PLN atau PBB 2 bulan terakhir',
    isRequired: false
  }
];

export const DEFAULT_SELECTION_WEIGHTS: SelectionWeights = {
  utbkWeight: 35,
  interviewWeight: 25,
  surveyWeight: 25,
  affirmationWeight: 15
};

export const getDesilAffirmationScore = (desil: DesilCategory | string): number => {
  switch (desil) {
    case 'Desil 1':
      return 100;
    case 'Desil 2':
      return 90;
    case 'Desil 3':
      return 80;
    case 'Desil 4':
      return 70;
    case 'Desil 5':
      return 60;
    case 'Desil 6-10':
      return 45;
    case 'Non-Desil':
    case 'Non Desil':
    case 'P3KE':
    case 'Non-Desil (P3KE)':
    default:
      return 35;
  }
};

export const calculateParticipantFinalScore = (
  utbkScore: number = 0,
  interviewScore: number = 0,
  surveyScore: number = 0,
  desil: DesilCategory | string = 'Desil 3',
  weights: SelectionWeights = DEFAULT_SELECTION_WEIGHTS,
  normalizeIfNoSurvey: boolean = false
): number => {
  const affirmationScore = getDesilAffirmationScore(desil);

  // Jika survey bersifat dinamis dan belum dilakukan (surveyScore 0) serta dinormalisasi
  if (normalizeIfNoSurvey && (!surveyScore || surveyScore === 0)) {
    const effectiveWeightsSum =
      (weights.utbkWeight || 0) +
      (weights.interviewWeight || 0) +
      (weights.affirmationWeight || 0);

    if (effectiveWeightsSum > 0) {
      const normalizedScore =
        (utbkScore * (weights.utbkWeight || 0) +
          interviewScore * (weights.interviewWeight || 0) +
          affirmationScore * (weights.affirmationWeight || 0)) /
        effectiveWeightsSum;
      return Math.round(normalizedScore * 100) / 100;
    }
  }

  const total =
    (utbkScore * weights.utbkWeight) / 100 +
    (interviewScore * weights.interviewWeight) / 100 +
    (surveyScore * weights.surveyWeight) / 100 +
    (affirmationScore * weights.affirmationWeight) / 100;

  return Math.round(total * 100) / 100;
};

/**
 * Perhitungan Skor Seleksi Tahap Pertama (Akademik UTBK & Wawancara).
 * Tahap pertama menyaring pendaftar berdasarkan kemampuan akademik dan komitmen
 * sebelum survey lapangan ditambahkan di tahap akhir secara dinamis.
 */
export const calculateStage1Score = (
  utbkScore: number = 0,
  interviewScore: number = 0,
  weights: SelectionWeights = DEFAULT_SELECTION_WEIGHTS
): number => {
  const combinedWeight = (weights.utbkWeight || 35) + (weights.interviewWeight || 25);
  if (combinedWeight === 0) return 0;

  const score =
    (utbkScore * (weights.utbkWeight || 35) +
      interviewScore * (weights.interviewWeight || 25)) /
    combinedWeight;

  return Math.round(score * 100) / 100;
};

export interface AcceptedProdiInfo {
  id: number | null; // null: Auto/System, -1: Cadangan, >0: StudyProgram ID
  name: string | null;
  isManual: boolean;
}

/**
 * Ekstraksi informasi prodi diterima dari participant, baik dari properti langsung
 * maupun dari catatan (notes) terformat [Prodi Diterima: ...].
 */
export const extractAcceptedProdi = (
  p: Participant,
  studyPrograms: StudyProgram[] = []
): AcceptedProdiInfo => {
  // 1. Direct property check on Participant
  if (p.acceptedProdiId !== undefined && p.acceptedProdiId !== null) {
    if (p.acceptedProdiId === -1) {
      return { id: -1, name: 'Cadangan (Tidak Lolos Kuota)', isManual: true };
    }
    const found = studyPrograms.find((sp) => sp.id === p.acceptedProdiId);
    return {
      id: p.acceptedProdiId,
      name: p.acceptedProdiName || found?.name || `Prodi ID #${p.acceptedProdiId}`,
      isManual: true
    };
  }

  // 2. Fallback: Parse from notes string tag [Prodi Diterima: ...]
  if (p.notes) {
    const cadanganMatch = p.notes.match(/\[Prodi Diterima:\s*(CADANGAN|TIDAK[_\s]LOLOS)\]/i);
    if (cadanganMatch) {
      return { id: -1, name: 'Cadangan (Tidak Lolos Kuota)', isManual: true };
    }

    const idNameMatch = p.notes.match(/\[Prodi Diterima:\s*(\d+)\s*\|\s*([^\]]+)\]/i);
    if (idNameMatch) {
      const id = parseInt(idNameMatch[1], 10);
      const name = idNameMatch[2].trim();
      return { id, name, isManual: true };
    }

    const nameMatch = p.notes.match(/\[Prodi Diterima:\s*([^\]]+)\]/i);
    if (nameMatch) {
      const raw = nameMatch[1].trim();
      if (raw.toUpperCase() === 'CADANGAN' || raw.toUpperCase() === 'TIDAK LOLOS') {
        return { id: -1, name: 'Cadangan (Tidak Lolos Kuota)', isManual: true };
      }
      const clean = raw.toLowerCase();
      const stripped = clean.replace(/^(s1|d3|s2)\s+/, '').trim();
      const found = studyPrograms.find((sp) => {
        const spClean = sp.name.toLowerCase();
        const spStripped = spClean.replace(/^(s1|d3|s2)\s+/, '').trim();
        return spClean === clean || spStripped === stripped;
      });
      return {
        id: found ? found.id : 0,
        name: found ? found.name : raw,
        isManual: true
      };
    }
  }

  return { id: null, name: null, isManual: false };
};

/**
 * Terapkan penetapan/override prodi diterima ke objek Participant.
 * Menyimpan status ke properti dan menanamkan tag aman ke notes.
 */
export const applyAcceptedProdiToParticipant = (
  p: Participant,
  prodi: StudyProgram | null | 'CADANGAN' | 'AUTO',
  customReason?: string
): Participant => {
  let acceptedProdiId: number | null = null;
  let acceptedProdiName: string | null = null;
  let tag = '';

  if (prodi === 'AUTO') {
    acceptedProdiId = null;
    acceptedProdiName = null;
    tag = '';
  } else if (prodi === 'CADANGAN') {
    acceptedProdiId = -1;
    acceptedProdiName = 'Cadangan (Tidak Lolos Kuota)';
    tag = '[Prodi Diterima: CADANGAN]';
  } else if (prodi) {
    acceptedProdiId = prodi.id;
    acceptedProdiName = prodi.name;
    tag = `[Prodi Diterima: ${prodi.id}|${prodi.name}]`;
  }

  // Bersihkan tag lama dari notes
  const cleanNotes = (p.notes || '').replace(/\[Prodi Diterima:[^\]]+\]\s*/gi, '').trim();

  let finalNotes = cleanNotes;
  if (tag) {
    const reasonText = customReason ? ` (${customReason.trim()})` : '';
    finalNotes = `${tag}${reasonText} ${cleanNotes}`.trim();
  }

  return {
    ...p,
    acceptedProdiId,
    acceptedProdiName,
    notes: finalNotes || undefined,
    updatedAt: new Date().toISOString()
  };
};
