import { Participant, SelectionWeights, DesilCategory, DocumentRequirement } from '../types';

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
  weights: SelectionWeights = DEFAULT_SELECTION_WEIGHTS
): number => {
  const affirmationScore = getDesilAffirmationScore(desil);
  const total =
    (utbkScore * weights.utbkWeight) / 100 +
    (interviewScore * weights.interviewWeight) / 100 +
    (surveyScore * weights.surveyWeight) / 100 +
    (affirmationScore * weights.affirmationWeight) / 100;

  return Math.round(total * 100) / 100;
};
