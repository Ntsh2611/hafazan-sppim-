export interface SurahDef {
  n: string;
  y: number; // 1 to 6
  max: number;
}

export interface StudentSurahProgress extends SurahDef {
  got: number | null;
  done: boolean;
}

export interface StudentRecord {
  bil: number;
  name: string;
  klass: string;
  ic: string;
  marks?: Record<number, number>; // index 0..40 -> marks got
}

export interface SemakKemajuanResult {
  ok: boolean;
  name: string;
  klass: string;
  ic: string;
  surahs: {
    n: string;
    y: number;
    max: number;
    got: number | null;
  }[];
  error?: string;
  source?: 'appscript' | 'local' | 'demo';
}

export interface RankInfo {
  n: string;
  c: string;
  desc: string;
}
