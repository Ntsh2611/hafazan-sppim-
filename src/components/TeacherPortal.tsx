import React, { useState, useEffect } from 'react';
import {
  Users,
  BarChart3,
  Award,
  Search,
  Layers,
  Flame,
  RotateCcw,
  RefreshCw,
  Link2,
  Download,
} from 'lucide-react';
import {
  calculateComprehensiveAnalytics,
  detectGender,
} from '../services/studentStatsService';
import { SURAH_LIST, YEAR_COLORS } from '../data/surahData';
import {
  getLocalMarks,
  getSyncedStudents,
  generateUpdatedCSV,
  clearAllLocalMarks,
  syncAllStudentsFromGoogleSheet,
} from '../services/appsScriptService';
import { StudentRecord } from '../types/hafazan';

interface TeacherPortalProps {
  onLogout: () => void;
  onOpenAppsScript: () => void;
  appsScriptConfigured: boolean;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  onLogout,
  onOpenAppsScript,
  appsScriptConfigured,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'students'>('analytics');
  const [surahYearFilter, setSurahYearFilter] = useState<number | 'all'>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('all');
  const [, setRefreshKey] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [marksMap, setMarksMap] = useState<Record<string, Record<number, number>>>(() => getLocalMarks());
  const [studentsList, setStudentsList] = useState<StudentRecord[]>(() => getSyncedStudents());

  // Auto-sync in background on mount if Apps Script is configured
  useEffect(() => {
    if (appsScriptConfigured) {
      syncAllStudentsFromGoogleSheet().then((res) => {
        if (res.success) {
          setMarksMap(getLocalMarks());
          setStudentsList(getSyncedStudents());
          setRefreshKey((prev) => prev + 1);
        }
      });
    }
  }, [appsScriptConfigured]);

  const handleSyncGoogleSheet = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const result = await syncAllStudentsFromGoogleSheet();
    setIsSyncing(false);
    setSyncFeedback(result);
    if (result.success) {
      setMarksMap(getLocalMarks());
      setStudentsList(getSyncedStudents());
      setRefreshKey((prev) => prev + 1);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const analytics = calculateComprehensiveAnalytics();

  // Filtered surah list for mastery inspection
  const filteredSurahs = analytics.surahStats.filter(
    (s) => surahYearFilter === 'all' || s.year === surahYearFilter
  );

  // Filtered 68 students from synced Google Sheet roster
  const filteredStudents = studentsList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.ic.toLowerCase().includes(studentSearch.toLowerCase());
    const matchClass =
      studentClassFilter === 'all' || s.klass.toLowerCase().includes(studentClassFilter.toLowerCase());
    return matchSearch && matchClass;
  });

  const handleExportCSV = () => {
    const csvContent = generateUpdatedCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `REKOD_HAFAZAN_SPPIM_ANALISA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetToOriginalData = () => {
    clearAllLocalMarks();
    setMarksMap({});
    setStudentsList(getSyncedStudents());
    setRefreshKey((prev) => prev + 1);
    setSyncFeedback({ success: true, message: 'Data tempatan diset semula. Sila tekan Segerak untuk memuat data Google Sheet.' });
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6 my-4">
      {/* Teacher Portal Header */}
      <section className="bg-gradient-to-r from-[var(--panel)] via-[var(--panel-2)] to-[var(--panel)] border-2 border-[var(--gold)]/60 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[var(--gold)]/20 border border-[var(--gold)] text-[var(--gold)] mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Akses Pendidik Rasmi SPPIM</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display text-[var(--ink)] leading-tight">
              Portal Analisa & Pengurusan Guru
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              Markah dikemas kini terus di Google Sheet. Tekan &quot;Segerak Dari Google Sheet&quot; untuk mengemas kini semua analisa secara langsung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Sync from Google Sheet Button (UTAMA) */}
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncGoogleSheet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--gold)] hover:bg-[#ffc65c] text-[#241800] text-xs font-bold transition-all shadow-lg cursor-pointer disabled:opacity-50 active:scale-95"
              title="Segerak semua markah murid terus dari fail Google Sheet"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyegerakkan...' : 'Segerak Dari Google Sheet'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAppsScript}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                appsScriptConfigured
                  ? 'bg-[var(--mint)]/15 border-[var(--mint)] text-[var(--mint)]'
                  : 'bg-[var(--night)] border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)]/10'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{appsScriptConfigured ? 'Apps Script Bersambung' : 'Sambung Google Sheet'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToOriginalData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] hover:border-[var(--rose)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--rose)] transition-colors cursor-pointer"
              title="Kosongkan memori sementara pelayar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Set Semula Cache</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] hover:border-[var(--muted)] text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksport CSV</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Toast Banner */}
        {syncFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              syncFeedback.success
                ? 'bg-[var(--mint)]/15 border-[var(--mint)] text-[var(--mint)]'
                : 'bg-[var(--rose)]/15 border-[var(--rose)] text-[var(--rose)]'
            }`}
          >
            <span>{syncFeedback.message}</span>
            <button
              type="button"
              onClick={() => setSyncFeedback(null)}
              className="text-[10px] underline ml-2 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[var(--line)]/60">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[var(--gold)] text-[#241800] shadow-md'
                : 'bg-[var(--night)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Paparan Analisa Lengkap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-[var(--gold)] text-[#241800] shadow-md'
                : 'bg-[var(--night)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Senarai Rekod 68 Murid (Google Sheet)</span>
          </button>
        </div>
      </section>

      {/* TAB 1: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-6">
          {/* SECTION 1: IKUT KELAS & IKUT JANTINA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Analisa Ikut Kelas */}
            <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-5 sm:p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 text-[var(--gold)] flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-[var(--ink)]">Analisa Ikut Kelas</h3>
                    <p className="text-xs text-[var(--muted)]">Perbandingan pencapaian 5 Al-Lail & 5 As-Syam</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {analytics.classStats.map((cls) => (
                  <div
                    key={cls.className}
                    className="bg-[var(--panel-2)]/60 border border-[var(--line)] rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display text-base text-[var(--ink)]">{cls.className}</h4>
                        <span className="text-xs text-[var(--muted)] font-mono">
                          {cls.totalStudents} orang murid berdaftar
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[var(--muted)] block">Purata Markah</span>
                        <b className="text-xl font-display text-[var(--gold)]">{cls.avgMarks} / 100</b>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-[var(--line)]/60">
                      <div className="bg-[var(--night)]/60 rounded-xl p-2">
                        <span className="text-[10px] text-[var(--muted)] block">Lengkap T1</span>
                        <b className="text-xs font-mono text-[var(--mint)]">{cls.year1CompleteCount} murid</b>
                      </div>
                      <div className="bg-[var(--night)]/60 rounded-xl p-2">
                        <span className="text-[10px] text-[var(--muted)] block">Lengkap T2</span>
                        <b className="text-xs font-mono text-[var(--mint)]">{cls.year2CompleteCount} murid</b>
                      </div>
                      <div className="bg-[var(--night)]/60 rounded-xl p-2">
                        <span className="text-[10px] text-[var(--muted)] block">Khatam Semua</span>
                        <b className="text-xs font-mono text-[var(--gold)]">{cls.khatamCount} murid</b>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analisa Ikut Jantina */}
            <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-5 sm:p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--mint)]/20 text-[var(--mint)] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-[var(--ink)]">Analisa Ikut Jantina</h3>
                    <p className="text-xs text-[var(--muted)]">Statistik murid Lelaki berbanding Perempuan</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {analytics.genderStats.map((gen) => (
                  <div
                    key={gen.gender}
                    className="bg-[var(--panel-2)]/60 border border-[var(--line)] rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            gen.gender === 'Lelaki'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                          }`}
                        >
                          {gen.gender === 'Lelaki' ? 'L' : 'P'}
                        </div>
                        <div>
                          <h4 className="font-display text-base text-[var(--ink)]">
                            Murid {gen.gender}
                          </h4>
                          <span className="text-xs text-[var(--muted)] font-mono">
                            {gen.totalStudents} orang ({Math.round((gen.totalStudents / (analytics.totalStudents || 68)) * 100)}%)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[var(--muted)] block">Purata Markah</span>
                        <b className="text-xl font-display text-[var(--ink)]">{gen.avgMarks} / 100</b>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-[var(--line)]/60">
                      <div className="bg-[var(--night)]/60 rounded-xl p-2">
                        <span className="text-[10px] text-[var(--muted)] block">Lulus Tahun 1 Penuh</span>
                        <b className="text-xs font-mono text-[var(--mint)]">{gen.year1CompleteCount} murid</b>
                      </div>
                      <div className="bg-[var(--night)]/60 rounded-xl p-2">
                        <span className="text-[10px] text-[var(--muted)] block">Khatam 41 Surah</span>
                        <b className="text-xs font-mono text-[var(--gold)]">{gen.khatamCount} murid</b>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: IKUT TAHUN SURAH SELESAI */}
          <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-5 sm:p-6 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-display text-lg sm:text-xl text-[var(--ink)]">
                  Analisa Ikut Tahun Surah Selesai (Lencana Tahun 1 - 6)
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Bilangan murid yang telah melengkapkan kesemua surah mengikut silibus tahun berkenaan (berdasarkan Google Sheet).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {analytics.yearCompletionStats.map((y) => {
                const color = YEAR_COLORS[y.year - 1];
                return (
                  <div
                    key={y.year}
                    className="bg-[var(--panel-2)]/70 border-2 rounded-2xl p-3.5 flex flex-col justify-between text-center relative overflow-hidden"
                    style={{ borderColor: color }}
                  >
                    <div>
                      <span className="text-xs font-bold font-display uppercase tracking-wider block" style={{ color }}>
                        Tahun {y.year}
                      </span>
                      <span className="text-[11px] text-[var(--muted)] block font-mono">
                        {y.totalSurahsInYear} surah
                      </span>
                    </div>

                    <div className="my-3">
                      <b className="text-2xl font-display text-[var(--ink)] block">
                        {y.completedCount}
                      </b>
                      <span className="text-[10px] text-[var(--muted)]">/ {analytics.totalStudents} murid</span>
                    </div>

                    <div className="w-full bg-[var(--night)] rounded-full h-2 overflow-hidden border border-[var(--line)]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${y.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[var(--muted)] mt-1 block">
                      {y.percentage}% siap
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: MURID LOG IN TERBANYAK */}
          <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-5 sm:p-6 shadow-md">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--rose)]/20 text-[var(--rose)] flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl text-[var(--ink)]">
                    Murid Log In Terbanyak (Paling Rajin Semak)
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Senarai 10 murid dengan kekerapan semakan hafazan tertinggi dalam sistem.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analytics.topLogins.map((student, rankIdx) => {
                let badgeCol = 'bg-[var(--panel-2)] text-[var(--muted)]';
                if (rankIdx === 0) badgeCol = 'bg-[var(--gold)] text-[#241800] ring-2 ring-[var(--gold)]';
                if (rankIdx === 1) badgeCol = 'bg-slate-300 text-slate-900';
                if (rankIdx === 2) badgeCol = 'bg-amber-600 text-white';

                return (
                  <div
                    key={student.ic}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--panel-2)]/50 border border-[var(--line)] hover:border-[var(--gold)]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-extrabold shrink-0 ${badgeCol}`}>
                        #{rankIdx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[var(--ink)] truncate">
                          {student.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
                          <span>{student.klass}</span>
                          <span>·</span>
                          <span>IC: {student.ic}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <b className="text-base font-display text-[var(--gold)] block">
                        {student.count} kali
                      </b>
                      <span className="text-[10px] text-[var(--muted)]">semakan</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: ANALISA IKUT SURAH */}
          <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-5 sm:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-display text-lg sm:text-xl text-[var(--ink)]">
                  Analisa Ikut Surah (Kadar Penguasaan 41 Surah)
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Kadar lulus murid bagi setiap surah mengikut turutan kurikulum dari Google Sheet.
                </p>
              </div>

              {/* Filter by Year */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[var(--muted)] font-semibold mr-1">Tapis Tahun:</span>
                <button
                  type="button"
                  onClick={() => setSurahYearFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    surahYearFilter === 'all'
                      ? 'bg-[var(--gold)] text-[#241800]'
                      : 'bg-[var(--panel-2)] text-[var(--muted)] border border-[var(--line)]'
                  }`}
                >
                  Semua
                </button>
                {[1, 2, 3, 4, 5, 6].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSurahYearFilter(yr)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      surahYearFilter === yr
                        ? 'bg-[var(--gold)] text-[#241800]'
                        : 'bg-[var(--panel-2)] text-[var(--muted)] border border-[var(--line)]'
                    }`}
                  >
                    T{yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Surahs with Progress */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {filteredSurahs.map((s) => {
                const yearColor = YEAR_COLORS[s.year - 1];
                return (
                  <div
                    key={s.name}
                    className="p-2.5 rounded-xl bg-[var(--panel-2)]/60 border border-[var(--line)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--muted)] mb-1">
                        <span style={{ color: yearColor }} className="font-bold">
                          T{s.year}
                        </span>
                        <span>{s.maxMarks}m</span>
                      </div>
                      <h5 className="font-bold text-xs text-[var(--ink)] truncate" title={s.name}>
                        {s.name}
                      </h5>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex items-baseline justify-between text-[11px] mb-1 font-mono">
                        <b className="text-[var(--ink)]">{s.completedCount} murid</b>
                        <span className="text-[var(--gold)]">{s.percentage}%</span>
                      </div>
                      <div className="w-full bg-[var(--night)] h-1.5 rounded-full overflow-hidden border border-[var(--line)]/50">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.percentage}%`,
                            backgroundColor: yearColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SENARAI 68 MURID (DATA GOOGLE SHEET) */}
      {activeTab === 'students' && (
        <section className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="font-display text-lg sm:text-xl text-[var(--ink)]">
                Senarai Rekod 68 Murid (Google Sheet)
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Markah murid dikemas kini oleh guru di dalam Google Sheet. Tekan butang &quot;Segerak Dari Google Sheet&quot; untuk memuatkan data terkini.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--gold)] hover:bg-[#ffc65c] text-[#241800] text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Muat Turun Fail CSV</span>
            </button>
          </div>

          {/* Search & Class Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Cari murid mengikut nama atau nombor IC..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-[var(--night)] border border-[var(--line)] focus:border-[var(--gold)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--ink)] placeholder:text-slate-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {['all', '5 Al-Lail', '5 As-Syam'].map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setStudentClassFilter(cls)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    studentClassFilter === cls
                      ? 'bg-[var(--gold)] text-[#241800]'
                      : 'bg-[var(--panel-2)] text-[var(--muted)] border border-[var(--line)]'
                  }`}
                >
                  {cls === 'all' ? `Semua (${studentsList.length})` : cls}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-[var(--line)] rounded-2xl overflow-hidden bg-[var(--night)]/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--panel-2)] text-[var(--muted)] font-display uppercase tracking-wider text-[11px] border-b border-[var(--line)]">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">BIL</th>
                    <th className="py-3 px-4">NAMA MURID</th>
                    <th className="py-3 px-3">KELAS</th>
                    <th className="py-3 px-3">NO. IC</th>
                    <th className="py-3 px-3">JANTINA</th>
                    <th className="py-3 px-3 text-center">MARKAH (SHEET)</th>
                    <th className="py-3 px-4 text-right">STATUS SURAH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]/50 font-mono">
                  {filteredStudents.map((s) => {
                    const m = marksMap[s.ic] || {};
                    const totalMarks = SURAH_LIST.reduce((sum, _, idx) => sum + (m[idx] || 0), 0);
                    const completedSurahsCount = SURAH_LIST.filter((_, idx) => m[idx] && m[idx] > 0).length;
                    const gender = detectGender(s.name);

                    return (
                      <tr key={s.ic} className="hover:bg-[var(--panel-2)]/40 transition-colors">
                        <td className="py-3 px-3 text-center text-[var(--muted)]">{s.bil}</td>
                        <td className="py-3 px-4 font-sans font-bold text-[var(--ink)]">
                          {s.name}
                        </td>
                        <td className="py-3 px-3 text-[var(--muted)] font-sans">{s.klass}</td>
                        <td className="py-3 px-3 text-[var(--gold)]">{s.ic}</td>
                        <td className="py-3 px-3 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              gender === 'Lelaki'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-pink-500/20 text-pink-400'
                            }`}
                          >
                            {gender}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <b className="text-[var(--mint)] font-display text-sm">{totalMarks}</b>
                          <span className="text-[10px] text-[var(--muted)]">/100</span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            completedSurahsCount === 41
                              ? 'bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/40'
                              : completedSurahsCount > 0
                              ? 'bg-[var(--mint)]/15 text-[var(--mint)] border border-[var(--mint)]/30'
                              : 'bg-[var(--panel-2)] text-[var(--muted)]'
                          }`}>
                            {completedSurahsCount} / 41 Surah
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
