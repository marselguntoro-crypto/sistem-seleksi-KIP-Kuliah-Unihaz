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

export const normalizeDesil = (desil?: string | null): string => {
  if (!desil) return 'Non-Desil';
  const clean = desil.trim();
  if (/^desil\s*1$/i.test(clean) || clean === '1') return 'Desil 1';
  if (/^desil\s*2$/i.test(clean) || clean === '2') return 'Desil 2';
  if (/^desil\s*3$/i.test(clean) || clean === '3') return 'Desil 3';
  if (/^desil\s*4$/i.test(clean) || clean === '4') return 'Desil 4';
  if (/^desil\s*5$/i.test(clean) || clean === '5') return 'Desil 5';
  if (/^desil\s*(6|7|8|9|10)/i.test(clean) || clean.includes('6-10')) return 'Desil 6-10';
  return 'Non-Desil';
};

/**
 * Tingkat prioritas desil dalam KIP Kuliah:
 * 1: Desil 1 (Sangat Miskin / Prioritas 1)
 * 2: Desil 2 (Miskin / Prioritas 2)
 * 3: Desil 3 (Hampir Miskin / Prioritas 3)
 * 4: Desil 4 (Rentan Miskin / Prioritas 4)
 * 5: Desil 5
 * 6: Desil 6-10
 * 7: Non-Desil
 */
export const getDesilPriorityLevel = (desil?: string | null): number => {
  const norm = normalizeDesil(desil);
  switch (norm) {
    case 'Desil 1': return 1;
    case 'Desil 2': return 2;
    case 'Desil 3': return 3;
    case 'Desil 4': return 4;
    case 'Desil 5': return 5;
    case 'Desil 6-10': return 6;
    default: return 7;
  }
};

/**
 * Mencocokkan nilai desil dengan filter pencarian / cakupan kuota desil
 */
export const matchesDesilScope = (desil: string | undefined | null, filter: string): boolean => {
  if (!filter || filter === 'ALL') return true;
  const norm = normalizeDesil(desil);
  if (filter === 'PRIORITAS_1_4') {
    return norm === 'Desil 1' || norm === 'Desil 2' || norm === 'Desil 3' || norm === 'Desil 4';
  }
  return norm.toLowerCase() === filter.toLowerCase();
};

export const getDesilAffirmationScore = (desil: DesilCategory | string): number => {
  const norm = normalizeDesil(desil);
  switch (norm) {
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
 * Perhitungan Skor Seleksi Tahap Pertama (Akademik UTBK, Wawancara, & Afirmasi Desil).
 * Menggabungkan nilai UTBK dan Wawancara serta bobot afirmasi Desil kemiskinan
 * sebelum survey lapangan ditambahkan di tahap akhir secara dinamis.
 */
export const calculateStage1Score = (
  utbkScore: number = 0,
  interviewScore: number = 0,
  weights: SelectionWeights = DEFAULT_SELECTION_WEIGHTS,
  desil?: string
): number => {
  const utbkWeight = weights.utbkWeight || 0;
  const intWeight = weights.interviewWeight || 0;
  const affWeight = weights.affirmationWeight || 0;

  // Jika desil disertakan dan ada bobot afirmasi desil
  if (desil && affWeight > 0) {
    const affirmationScore = getDesilAffirmationScore(desil);
    const combinedWeight = utbkWeight + intWeight + affWeight;
    if (combinedWeight === 0) return 0;

    const score =
      (utbkScore * utbkWeight +
        interviewScore * intWeight +
        affirmationScore * affWeight) /
      combinedWeight;

    return Math.round(score * 100) / 100;
  }

  // Jika tanpa desil atau bobot afirmasi 0
  const combinedWeight = utbkWeight + intWeight;
  if (combinedWeight === 0) return 0;

  const score =
    (utbkScore * utbkWeight + interviewScore * intWeight) / combinedWeight;

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
