import { SurahDef, RankInfo } from '../types/hafazan';

export const SURAH_LIST: SurahDef[] = [
  // Tahun 1 (17 surah, 19 markah)
  { n: 'FATIHAH', y: 1, max: 1 },
  { n: 'AN-NAS', y: 1, max: 1 },
  { n: 'AL-FALAQ', y: 1, max: 1 },
  { n: 'AL-IKHLAS', y: 1, max: 1 },
  { n: 'AL-MASAD', y: 1, max: 1 },
  { n: 'AN-NASR', y: 1, max: 1 },
  { n: 'AL-KAFIRUN', y: 1, max: 1 },
  { n: 'AL-KAUTHAR', y: 1, max: 1 },
  { n: 'AL-MAUN', y: 1, max: 1 },
  { n: 'QURAISY', y: 1, max: 1 },
  { n: 'AL-FIL', y: 1, max: 1 },
  { n: 'AL-HUMAZAH', y: 1, max: 1 },
  { n: 'AL-ASR', y: 1, max: 1 },
  { n: 'AT-TAKASUR', y: 1, max: 1 },
  { n: 'AL-QARIAH', y: 1, max: 2 },
  { n: 'AL-ADIYAT', y: 1, max: 2 },
  { n: 'AL-ZALZALAH', y: 1, max: 1 },

  // Tahun 2 (7 surah, 12 markah)
  { n: 'AL-BAYYINAH', y: 2, max: 1 },
  { n: 'AL-QADR', y: 2, max: 1 },
  { n: 'AL-ALAQ', y: 2, max: 3 },
  { n: 'AT-TIN', y: 2, max: 1 },
  { n: 'ASY-SYARAH', y: 2, max: 1 },
  { n: 'ADH-DHUHA', y: 2, max: 2 },
  { n: 'AL-LAIL', y: 2, max: 3 },

  // Tahun 3 (7 surah, 21 markah)
  { n: 'ASY-SYAMS', y: 3, max: 2 },
  { n: 'AL-BALAD', y: 3, max: 3 },
  { n: 'AL-FAJR', y: 3, max: 4 },
  { n: 'AL-GHASYIAH', y: 3, max: 3 },
  { n: "AL-A'LAA", y: 3, max: 3 },
  { n: 'AT-TORIQ', y: 3, max: 3 },
  { n: 'AL-BURUJ', y: 3, max: 3 },

  // Tahun 4 (4 surah, 13 markah)
  { n: 'AL-INSYIQAQ', y: 4, max: 3 },
  { n: 'AL-MUTOFFIFIN', y: 4, max: 4 },
  { n: 'AL-INFITOR', y: 4, max: 3 },
  { n: 'AT-TAKWIR', y: 4, max: 3 },

  // Tahun 5 (3 surah, 12 markah)
  { n: 'ABASA', y: 5, max: 4 },
  { n: "AN-NAZI'AT", y: 5, max: 4 },
  { n: "AN-NABA'", y: 5, max: 4 },

  // Tahun 6 (3 surah, 23 markah)
  { n: 'AS-SAJADAH', y: 6, max: 6 },
  { n: 'AL-INSAN', y: 6, max: 6 },
  { n: 'YAASIN', y: 6, max: 11 },
];

export const TOTAL_MARKS_ALL = SURAH_LIST.reduce((sum, s) => sum + s.max, 0); // 100

export const RANKS: RankInfo[] = [
  { n: 'Perintis', c: 'var(--t0)', desc: 'Tahap permulaan hafazan SPPIM' },
  { n: 'Perunggu', c: 'var(--t1)', desc: 'Lencana Tahun 1 dicapai' },
  { n: 'Perak', c: 'var(--t2)', desc: 'Lencana Tahun 2 dicapai' },
  { n: 'Emas', c: 'var(--t3)', desc: 'Lencana Tahun 3 dicapai' },
  { n: 'Platinum', c: 'var(--t4)', desc: 'Lencana Tahun 4 dicapai' },
  { n: 'Berlian', c: 'var(--t5)', desc: 'Lencana Tahun 5 dicapai' },
  { n: 'Penghafaz Agung', c: 'var(--t6)', desc: 'Khatam semua surah Tahun 1 hingga 6' },
];

export const YEAR_COLORS = [
  'var(--t1)',
  'var(--t2)',
  'var(--t3)',
  'var(--t4)',
  'var(--t5)',
  'var(--t6)',
];
