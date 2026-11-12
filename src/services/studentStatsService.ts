import { INITIAL_STUDENTS, cleanIC } from '../data/studentsData';
import { SURAH_LIST } from '../data/surahData';
import { StudentRecord } from '../types/hafazan';
import { getLocalMarks, getSyncedStudents } from './appsScriptService';

const LOGIN_STATS_KEY = 'hafazan_student_logins';

export interface StudentLoginStat {
  ic: string;
  name: string;
  klass: string;
  gender: 'Lelaki' | 'Perempuan';
  count: number;
}

export function detectGender(name: string): 'Lelaki' | 'Perempuan' {
  const n = ` ${name.toUpperCase().replace(/[.,]/g, ' ')} `;
  if (/ (BINTI|BT|BTE|BINTE) /.test(n)) return 'Perempuan';
  if (/ (BIN|B|BN) /.test(n)) return 'Lelaki';
  if (/^ (NUR|NURUL|SITI|PUTRI|AYRA|AMMARA|ARISSA|FAUZANA|DHIA|AMNI|AISYAH|ADYAN|SUMAYYAH|RAUDHAH|RAISYA) /.test(n)) return 'Perempuan';
  return 'Lelaki';
}

// Authentic student login counter (increments only when actual student searches their IC)
export function getStudentLogins(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOGIN_STATS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading login stats:', e);
  }
  return {};
}

export function clearStudentLogins(): void {
  try {
    localStorage.removeItem(LOGIN_STATS_KEY);
  } catch {}
}

export function recordStudentLogin(ic: string): void {
  const clean = cleanIC(ic);
  const current = getStudentLogins();
  current[clean] = (current[clean] || 0) + 1;
  try {
    localStorage.setItem(LOGIN_STATS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed recording login:', e);
  }
}

export interface ClassAnalytics {
  className: string;
  totalStudents: number;
  avgMarks: number;
  totalCompletedSurahs: number;
  year1CompleteCount: number;
  year2CompleteCount: number;
  year3CompleteCount: number;
  khatamCount: number;
}

export interface GenderAnalytics {
  gender: 'Lelaki' | 'Perempuan';
  totalStudents: number;
  avgMarks: number;
  totalCompletedSurahs: number;
  year1CompleteCount: number;
  khatamCount: number;
}

export interface SurahMasteryStat {
  surahIndex: number;
  name: string;
  year: number;
  maxMarks: number;
  completedCount: number;
  percentage: number;
}

export interface YearCompletionStat {
  year: number;
  totalSurahsInYear: number;
  completedCount: number;
  percentage: number;
}

export function calculateComprehensiveAnalytics(
  studentsOverride?: StudentRecord[],
  marksMapOverride?: Record<string, Record<number, number>>
) {
  const marksMap = marksMapOverride ?? getLocalMarks();
  const loginsMap = getStudentLogins();
  const students = studentsOverride ?? getSyncedStudents();

  // Helper to inspect a student's marks
  const getStudentMarks = (ic: string) => marksMap[cleanIC(ic)] || {};

  // 1. By Class (discover dynamically from sheet roster, fallback to 5 Al-Lail / 5 As-Syam)
  const discoveredClasses = Array.from(
    new Set(students.map((s) => String(s.klass || '').trim()).filter(Boolean))
  );
  const classes = discoveredClasses.length > 0 ? discoveredClasses : ['5 Al-Lail', '5 As-Syam'];

  const classStats: ClassAnalytics[] = classes.map((cls) => {
    const studentsInClass = students.filter(
      (s) => String(s.klass || '').trim().toLowerCase() === cls.toLowerCase()
    );
    let totalMarks = 0;
    let totalSurahs = 0;
    let y1Count = 0;
    let y2Count = 0;
    let y3Count = 0;
    let khatam = 0;

    studentsInClass.forEach((s) => {
      const m = getStudentMarks(s.ic);
      let sMarks = 0;
      let sSurahs = 0;
      let isY1Done = true;
      let isY2Done = true;
      let isY3Done = true;
      let isAllDone = true;

      SURAH_LIST.forEach((surah, idx) => {
        const val = m[idx] || 0;
        sMarks += val;
        if (val > 0) sSurahs++;
        else {
          if (surah.y === 1) isY1Done = false;
          if (surah.y === 2) isY2Done = false;
          if (surah.y === 3) isY3Done = false;
          isAllDone = false;
        }
      });

      totalMarks += sMarks;
      totalSurahs += sSurahs;
      if (isY1Done) y1Count++;
      if (isY2Done) y2Count++;
      if (isY3Done) y3Count++;
      if (isAllDone && sSurahs === SURAH_LIST.length) khatam++;
    });

    const count = studentsInClass.length;
    return {
      className: cls,
      totalStudents: count,
      avgMarks: count > 0 ? Math.round(totalMarks / count) : 0,
      totalCompletedSurahs: totalSurahs,
      year1CompleteCount: y1Count,
      year2CompleteCount: y2Count,
      year3CompleteCount: y3Count,
      khatamCount: khatam,
    };
  });

  // 2. By Gender
  const genders: ('Lelaki' | 'Perempuan')[] = ['Lelaki', 'Perempuan'];
  const genderStats: GenderAnalytics[] = genders.map((gen) => {
    const studentsInGender = students.filter((s) => detectGender(s.name) === gen);
    let totalMarks = 0;
    let totalSurahs = 0;
    let y1Count = 0;
    let khatam = 0;

    studentsInGender.forEach((s) => {
      const m = getStudentMarks(s.ic);
      let sMarks = 0;
      let sSurahs = 0;
      let isY1Done = true;
      let isAllDone = true;

      SURAH_LIST.forEach((surah, idx) => {
        const val = m[idx] || 0;
        sMarks += val;
        if (val > 0) sSurahs++;
        else {
          if (surah.y === 1) isY1Done = false;
          isAllDone = false;
        }
      });

      totalMarks += sMarks;
      totalSurahs += sSurahs;
      if (isY1Done) y1Count++;
      if (isAllDone && sSurahs === SURAH_LIST.length) khatam++;
    });

    const count = studentsInGender.length;
    return {
      gender: gen,
      totalStudents: count,
      avgMarks: count > 0 ? Math.round(totalMarks / count) : 0,
      totalCompletedSurahs: totalSurahs,
      year1CompleteCount: y1Count,
      khatamCount: khatam,
    };
  });

  // 3. By Surah (all 41 surahs)
  const totalStudents = students.length;
  const surahStats: SurahMasteryStat[] = SURAH_LIST.map((surah, idx) => {
    let completedCount = 0;
    students.forEach((s) => {
      const m = getStudentMarks(s.ic);
      if (m[idx] && m[idx] > 0) {
        completedCount++;
      }
    });

    const percentage = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;

    return {
      surahIndex: idx,
      name: surah.n,
      year: surah.y,
      maxMarks: surah.max,
      completedCount,
      percentage,
    };
  });

  // 4. By Year Completed (Tahun 1 hingga 6)
  const yearCompletionStats: YearCompletionStat[] = [1, 2, 3, 4, 5, 6].map((yr) => {
    const surahsInYear = SURAH_LIST.filter((s) => s.y === yr);
    let fullCompletedStudents = 0;

    students.forEach((s) => {
      const m = getStudentMarks(s.ic);
      const isYearDone = surahsInYear.every((surah) => {
        const idx = SURAH_LIST.findIndex((item) => item.n === surah.n);
        return m[idx] !== undefined && m[idx] > 0;
      });
      if (isYearDone) fullCompletedStudents++;
    });

    const percentage = totalStudents > 0 ? Math.round((fullCompletedStudents / totalStudents) * 100) : 0;

    return {
      year: yr,
      totalSurahsInYear: surahsInYear.length,
      completedCount: fullCompletedStudents,
      percentage,
    };
  });

  // 5. Murid Log In Terbanyak
  const topLogins: StudentLoginStat[] = students
    .map((s) => ({
      ic: s.ic,
      name: s.name,
      klass: s.klass,
      gender: detectGender(s.name),
      count: loginsMap[cleanIC(s.ic)] || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    classStats,
    genderStats,
    surahStats,
    yearCompletionStats,
    topLogins,
    totalStudents,
  };
}
