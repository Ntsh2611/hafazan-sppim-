import { SemakKemajuanResult, StudentRecord } from '../types/hafazan';
import { SURAH_LIST } from '../data/surahData';
import { cleanIC, findLocalStudent, INITIAL_STUDENTS } from '../data/studentsData';

const APPS_SCRIPT_URL_KEY = 'hafazan_appscript_url';
const LOCAL_MARKS_KEY = 'hafazan_local_student_marks';
const SYNCED_STUDENTS_KEY = 'hafazan_synced_students';

export function getSavedAppsScriptUrl(): string {
  try {
    const envUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
      return envUrl.trim();
    }
    return localStorage.getItem(APPS_SCRIPT_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function saveAppsScriptUrl(url: string): void {
  try {
    localStorage.setItem(APPS_SCRIPT_URL_KEY, url.trim());
  } catch (e) {
    console.error('Failed to save Apps Script URL:', e);
  }
}

// Senarai murid yang disegerak dari Google Sheet (atau senarai lalai jika belum disegerak)
export function getSyncedStudents(): StudentRecord[] {
  try {
    const raw = localStorage.getItem(SYNCED_STUDENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_STUDENTS;
}

// Stored local progress/marks per IC (follows authentic Google Sheet data: starts clean at 0)
export function getLocalMarks(): Record<string, Record<number, number>> {
  try {
    const raw = localStorage.getItem(LOCAL_MARKS_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function clearAllLocalMarks(): void {
  try {
    localStorage.removeItem(LOCAL_MARKS_KEY);
    localStorage.removeItem(SYNCED_STUDENTS_KEY);
  } catch {}
}

export function saveLocalStudentMark(ic: string, surahIdx: number, mark: number): void {
  try {
    const current = getLocalMarks();
    const clean = cleanIC(ic);
    if (!current[clean]) {
      current[clean] = {};
    }
    current[clean][surahIdx] = mark;
    localStorage.setItem(LOCAL_MARKS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save local mark:', e);
  }
}

export async function testAppsScriptConnection(url: string): Promise<{ success: boolean; message: string }> {
  if (!url || !url.startsWith('http')) {
    return { success: false, message: 'URL mestilah bermula dengan http:// atau https://' };
  }

  try {
    const testUrl = `${url}${url.includes('?') ? '&' : '?'}action=semakKemajuan&ic=${INITIAL_STUDENTS[0].ic}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, message: `Pelayan membalas status HTTP ${response.status}` };
    }

    const data = await response.json();
    if (data && (data.ok !== undefined || data.name !== undefined || data.error !== undefined)) {
      return { success: true, message: 'Sambungan ke Google Apps Script berjaya!' };
    }

    return { success: true, message: 'Respons diterima daripada Apps Script!' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal berhubung: ${errorMsg}. Pastikan Apps Script telah di-deploy dengan akses 'Anyone'.` };
  }
}

export async function syncAllStudentsFromGoogleSheet(): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  const url = getSavedAppsScriptUrl();
  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      message: 'Sila masukkan URL Google Apps Script terlebih dahulu.',
    };
  }

  try {
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=segerakSemua`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        message: `Pelayan Google membalas status HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    if (!data.ok || !Array.isArray(data.students)) {
      return {
        success: false,
        message: data.error || 'Format data Google Sheet tidak sah.',
      };
    }

    // Save all marks and student roster into local storage
    const newMarksMap: Record<string, Record<number, number>> = {};
    const syncedRoster: StudentRecord[] = [];

    data.students.forEach((st: { bil?: number; name?: string; klass?: string; ic: string; marks?: Record<number, number> }, idx: number) => {
      const clean = cleanIC(st.ic);
      if (clean) {
        if (st.marks) {
          newMarksMap[clean] = st.marks;
        }
        if (st.name) {
          syncedRoster.push({
            bil: Number(st.bil) || (idx + 1),
            name: String(st.name).trim(),
            klass: String(st.klass || '').trim(),
            ic: clean,
          });
        }
      }
    });

    localStorage.setItem(LOCAL_MARKS_KEY, JSON.stringify(newMarksMap));
    if (syncedRoster.length > 0) {
      localStorage.setItem(SYNCED_STUDENTS_KEY, JSON.stringify(syncedRoster));
    }

    return {
      success: true,
      message: `Berjaya menyegerakkan data ${data.students.length} murid secara langsung dari Google Sheet!`,
      count: data.students.length,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menyegerakkan data: ${errorMsg}. Pastikan Apps Script aktif dengan akses 'Anyone'.`,
    };
  }
}

export async function saveStudentMarksToGoogleSheet(
  ic: string,
  marks: Record<number, number>
): Promise<boolean> {
  const url = getSavedAppsScriptUrl();
  if (!url || !url.startsWith('http')) return false;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'simpanMarkahMurid',
        ic: cleanIC(ic),
        marks: marks,
      }),
      mode: 'no-cors',
    });
    return true;
  } catch (e) {
    console.error('Failed saving to Google Sheet via Apps Script:', e);
    return false;
  }
}

export async function fetchKemajuanMurid(ic: string): Promise<SemakKemajuanResult> {
  const targetIc = cleanIC(ic);
  const appScriptUrl = getSavedAppsScriptUrl();

  // Try Apps Script if configured
  if (appScriptUrl) {
    try {
      const fetchUrl = `${appScriptUrl}${appScriptUrl.includes('?') ? '&' : '?'}action=semakKemajuan&ic=${encodeURIComponent(targetIc)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        if (json && json.ok && json.surahs) {
          return {
            ok: true,
            name: json.name || 'Murid',
            klass: json.klass || '',
            ic: targetIc,
            surahs: json.surahs,
            source: 'appscript',
          };
        } else if (json && json.error) {
          return {
            ok: false,
            name: '',
            klass: '',
            ic: targetIc,
            surahs: [],
            error: json.error,
            source: 'appscript',
          };
        }
      }
    } catch (e) {
      console.warn('Apps Script fetch failed, falling back to local dataset:', e);
      // Fallback continues below
    }
  }

  // Fallback to local roster from Google Sheet CSV or synced data
  const allStudents = getSyncedStudents();
  const localStudent = allStudents.find((s) => cleanIC(s.ic) === targetIc) || findLocalStudent(targetIc);
  if (!localStudent) {
    return {
      ok: false,
      name: '',
      klass: '',
      ic: targetIc,
      surahs: [],
      error: `No. IC ${ic} tidak dijumpai dalam rekod murid. Sila semak semula nombor IC.`,
      source: 'local',
    };
  }

  // Retrieve marks for this student
  const allMarks = getLocalMarks();
  const studentMarks = allMarks[targetIc] || {};

  const surahs = SURAH_LIST.map((def, idx) => {
    const got = studentMarks[idx] !== undefined ? studentMarks[idx] : null;
    return {
      n: def.n,
      y: def.y,
      max: def.max,
      got: got,
    };
  });

  return {
    ok: true,
    name: localStudent.name,
    klass: localStudent.klass,
    ic: targetIc,
    surahs: surahs,
    source: 'local',
  };
}

export function generateUpdatedCSV(): string {
  const marks = getLocalMarks();
  const lines: string[] = [];

  // Line 1: Header
  lines.push(',,,,,,,,,,,,,,,,,,,REKOD HAFAZAN TAHUN 6 2027,,,,,,,,,,,,,,,,,,,,,,,,,,');
  
  // Line 2: Surah Names
  const surahNames = SURAH_LIST.map(s => s.n).join(',');
  lines.push(`NAMA SURAH,,,,${surahNames},JUMLAH`);

  // Line 3: Max marks
  const maxMarks = SURAH_LIST.map(s => s.max).join(',');
  lines.push(`MARKAH PER SURAH,,,,${maxMarks},100`);

  // Line 4: Columns
  lines.push('BIL,NAMA MURID,KELAS,NO IC,REKOD MARKAH MURID,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');

  // Line 5+: Students
  INITIAL_STUDENTS.forEach(student => {
    const studentIc = cleanIC(student.ic);
    const m = marks[studentIc] || {};
    const surahValues = SURAH_LIST.map((s, idx) => (m[idx] !== undefined ? m[idx] : ''));
    const total = SURAH_LIST.reduce((sum, _, idx) => sum + (m[idx] || 0), 0);
    lines.push(`${student.bil},"${student.name}",${student.klass},${student.ic},${surahValues.join(',')},${total}`);
  });

  return lines.join('\n');
}
