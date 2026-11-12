import { SemakKemajuanResult, StudentRecord } from '../types/hafazan';
import { SURAH_LIST } from '../data/surahData';
import { cleanIC, findLocalStudent, INITIAL_STUDENTS } from '../data/studentsData';

const APPS_SCRIPT_URL_KEY = 'hafazan_appscript_url';
const LOCAL_MARKS_KEY = 'hafazan_local_student_marks';
const SYNCED_STUDENTS_KEY = 'hafazan_synced_students';

export interface SyncProgress {
  phase: 'bulk' | 'roster' | 'individual';
  completed: number;
  total: number;
  updated: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  count?: number;
  usedFallback?: boolean;
}

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

function buildAppsScriptUrl(baseUrl: string, params: Record<string, string>): string {
  const sep = baseUrl.includes('?') ? '&' : '?';
  const qs = Object.entries({ ...params, _t: String(Date.now()) })
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${baseUrl}${sep}${qs}`;
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Pelayan Google membalas status HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function persistBulkStudents(
  studentsPayload: Array<{
    bil?: number | string;
    name?: string;
    klass?: string;
    ic: string;
    marks?: Record<string | number, number>;
  }>
): number {
  const newMarksMap: Record<string, Record<number, number>> = {};
  const syncedRoster: StudentRecord[] = [];

  studentsPayload.forEach((st, idx) => {
    const clean = cleanIC(st.ic);
    if (!clean) return;

    if (st.marks && typeof st.marks === 'object') {
      const normalizedMarks: Record<number, number> = {};
      Object.entries(st.marks).forEach(([k, v]) => {
        const sIdx = Number(k);
        const val = Number(v);
        if (!Number.isNaN(sIdx) && !Number.isNaN(val) && val > 0) {
          normalizedMarks[sIdx] = val;
        }
      });
      newMarksMap[clean] = normalizedMarks;
    }

    if (st.name) {
      syncedRoster.push({
        bil: Number(st.bil) || idx + 1,
        name: String(st.name).trim(),
        klass: String(st.klass || '').trim(),
        ic: clean,
      });
    }
  });

  localStorage.setItem(LOCAL_MARKS_KEY, JSON.stringify(newMarksMap));
  if (syncedRoster.length > 0) {
    localStorage.setItem(SYNCED_STUDENTS_KEY, JSON.stringify(syncedRoster));
  }
  return syncedRoster.length || Object.keys(newMarksMap).length;
}

export async function testAppsScriptConnection(url: string): Promise<{ success: boolean; message: string }> {
  const trimmed = url.trim();
  if (!trimmed || !trimmed.startsWith('http')) {
    return { success: false, message: 'URL mestilah bermula dengan http:// atau https://' };
  }

  try {
    const testUrl = buildAppsScriptUrl(trimmed, {
      action: 'semakKemajuan',
      ic: INITIAL_STUDENTS[0].ic,
    });
    const data = await fetchJsonWithTimeout(testUrl, 12000);
    if (data && (data.ok !== undefined || data.name !== undefined || data.error !== undefined)) {
      return { success: true, message: 'Sambungan ke Google Apps Script berjaya!' };
    }
    return { success: true, message: 'Respons diterima daripada Apps Script!' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal berhubung: ${errorMsg}. Pastikan Apps Script telah di-deploy dengan akses 'Anyone'.`,
    };
  }
}

export async function syncAllStudentsFromGoogleSheet(
  onProgress?: (progress: SyncProgress) => void
): Promise<SyncResult> {
  const url = getSavedAppsScriptUrl();
  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script belum ditetapkan. Klik "Sambung Google Sheet" untuk menetapkan URL.',
    };
  }

  // 1. Cuba tarik semua murid & markah sekaligus (action=segerakSemua)
  try {
    onProgress?.({ phase: 'bulk', completed: 0, total: 1, updated: 0 });
    const fetchUrl = buildAppsScriptUrl(url, { action: 'segerakSemua' });
    const data = await fetchJsonWithTimeout(fetchUrl, 20000);

    if (data && data.ok && Array.isArray(data.students) && data.students.length > 0) {
      const hasMarksData = data.students.some(
        (s: { marks?: unknown }) => s && s.marks && typeof s.marks === 'object'
      );
      if (hasMarksData) {
        const count = persistBulkStudents(data.students);
        return {
          success: true,
          message: `Berjaya menyegerakkan data ${count} murid secara langsung dari Google Sheet!`,
          count,
          usedFallback: false,
        };
      }
    }
  } catch (err) {
    console.warn('segerakSemua tidak disokong atau gagal, mencuba senaraiMurid / semakKemajuan:', err);
  }

  // 2. Cuba semak jika action=senaraiMurid memulangkan senarai terkini (atau markah penuh)
  let rosterToSync = getSyncedStudents();
  try {
    onProgress?.({ phase: 'roster', completed: 0, total: 1, updated: 0 });
    const rosterUrl = buildAppsScriptUrl(url, { action: 'senaraiMurid' });
    const rosterData = await fetchJsonWithTimeout(rosterUrl, 15000);
    if (rosterData && rosterData.ok && Array.isArray(rosterData.students) && rosterData.students.length > 0) {
      const hasMarksData = rosterData.students.some(
        (s: { marks?: unknown }) => s && s.marks && typeof s.marks === 'object'
      );
      if (hasMarksData) {
        const count = persistBulkStudents(rosterData.students);
        return {
          success: true,
          message: `Berjaya menyegerakkan data ${count} murid secara langsung dari Google Sheet!`,
          count,
          usedFallback: false,
        };
      }

      // Simpan senarai nama/kelas/IC terkini dari Google Sheet
      const updatedRoster: StudentRecord[] = rosterData.students
        .filter((s: { name?: string; ic?: string }) => s && s.name && s.ic)
        .map((s: { bil?: number | string; name: string; klass?: string; ic: string }, idx: number) => ({
          bil: Number(s.bil) || idx + 1,
          name: String(s.name).trim(),
          klass: String(s.klass || '').trim(),
          ic: cleanIC(s.ic),
        }));

      if (updatedRoster.length > 0) {
        rosterToSync = updatedRoster;
        localStorage.setItem(SYNCED_STUDENTS_KEY, JSON.stringify(updatedRoster));
      }
    }
  } catch (err) {
    console.warn('senaraiMurid tidak tersedia, menggunakan senarai murid sedia ada:', err);
  }

  // 3. Fallback pintar & boleh dipercayai: tarik markah setiap murid menggunakan ?action=semakKemajuan&ic=...
  //    dalam kumpulan kecil (4 serentak) dengan tempoh tamat 18s & cubaan semula automatik supaya Google Sheet tidak terbeban.
  return await syncViaIndividualStudentQueries(url, rosterToSync, onProgress);
}

async function fetchSingleStudentWithRetry(
  url: string,
  ic: string
): Promise<Record<number, number> | null> {
  const fetchUrl = buildAppsScriptUrl(url, { action: 'semakKemajuan', ic });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const json = await fetchJsonWithTimeout(fetchUrl, 18000);
      if (json && json.ok && Array.isArray(json.surahs)) {
        const studentMarks: Record<number, number> = {};
        json.surahs.forEach((s: { got?: number | null }, idx: number) => {
          if (s.got !== null && s.got !== undefined && Number(s.got) > 0) {
            studentMarks[idx] = Number(s.got);
          }
        });
        return studentMarks;
      }
      // Jika murid tiada dalam sheet (ok: false), jangan cuba semula
      if (json && json.ok === false) {
        return null;
      }
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  return null;
}

async function syncViaIndividualStudentQueries(
  url: string,
  students: StudentRecord[],
  onProgress?: (progress: SyncProgress) => void
): Promise<SyncResult> {
  try {
    const newMarksMap: Record<string, Record<number, number>> = getLocalMarks();
    let updatedCount = 0;
    let completedCount = 0;
    const total = students.length;

    onProgress?.({ phase: 'individual', completed: 0, total, updated: 0 });

    // Konkurensi 4 serentak sesuai dengan had Google Apps Script supaya stabil dan tidak timeout
    const chunkSize = 4;
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (student) => {
          const clean = cleanIC(student.ic);
          const marks = await fetchSingleStudentWithRetry(url, clean);
          completedCount++;
          if (marks !== null) {
            newMarksMap[clean] = marks;
            updatedCount++;
          }
        })
      );

      // Simpan dan kemas kini paparan guru secara langsung selepas setiap kumpulan
      localStorage.setItem(LOCAL_MARKS_KEY, JSON.stringify(newMarksMap));
      onProgress?.({
        phase: 'individual',
        completed: completedCount,
        total,
        updated: updatedCount,
      });
    }

    if (updatedCount === 0) {
      return {
        success: false,
        message:
          'Gagal menarik rekod murid daripada Google Apps Script. Sila semak URL Apps Script atau pastikan akses ditetapkan kepada "Anyone".',
        count: 0,
        usedFallback: true,
      };
    }

    return {
      success: true,
      message: `Berjaya menyegerakkan data ${updatedCount} daripada ${total} murid terus dari Google Sheet!`,
      count: updatedCount,
      usedFallback: true,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menyegerakkan data: ${errorMsg}`,
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
      const fetchUrl = buildAppsScriptUrl(appScriptUrl, {
        action: 'semakKemajuan',
        ic: targetIc,
      });
      const json = await fetchJsonWithTimeout(fetchUrl, 12000);
      if (json && json.ok && json.surahs) {
        // Cache markah terkini murid ke storan tempatan
        const currentMarks = getLocalMarks();
        const studentMarks: Record<number, number> = {};
        json.surahs.forEach((s: { got?: number | null }, idx: number) => {
          if (s.got !== null && s.got !== undefined && Number(s.got) > 0) {
            studentMarks[idx] = Number(s.got);
          }
        });
        currentMarks[targetIc] = studentMarks;
        try {
          localStorage.setItem(LOCAL_MARKS_KEY, JSON.stringify(currentMarks));
        } catch {}

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
  const students = getSyncedStudents();
  const lines: string[] = [];

  // Line 1: Header
  lines.push(',,,,,,,,,,,,,,,,,,,REKOD HAFAZAN TAHUN 6 2027,,,,,,,,,,,,,,,,,,,,,,,,,,');

  // Line 2: Surah Names
  const surahNames = SURAH_LIST.map((s) => s.n).join(',');
  lines.push(`NAMA SURAH,,,,${surahNames},JUMLAH`);

  // Line 3: Max marks
  const maxMarks = SURAH_LIST.map((s) => s.max).join(',');
  lines.push(`MARKAH PER SURAH,,,,${maxMarks},100`);

  // Line 4: Columns
  lines.push('BIL,NAMA MURID,KELAS,NO IC,REKOD MARKAH MURID,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');

  // Line 5+: Students
  students.forEach((student) => {
    const studentIc = cleanIC(student.ic);
    const m = marks[studentIc] || {};
    const surahValues = SURAH_LIST.map((_, idx) => (m[idx] !== undefined ? m[idx] : ''));
    const total = SURAH_LIST.reduce((sum, _, idx) => sum + (m[idx] || 0), 0);
    lines.push(`${student.bil},"${student.name}",${student.klass},${student.ic},${surahValues.join(',')},${total}`);
  });

  return lines.join('\n');
}
