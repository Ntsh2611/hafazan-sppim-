import React from 'react';
import { SemakKemajuanResult, StudentSurahProgress } from '../types/hafazan';
import { RANKS } from '../data/surahData';
import { PodiumSection } from './PodiumSection';
import { SurahRoute } from './SurahRoute';
import { Sparkles, Trophy, ArrowRight, Star } from 'lucide-react';

interface DashboardProps {
  data: SemakKemajuanResult;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // Calculate stats
  const list: StudentSurahProgress[] = data.surahs.map((s) => ({
    ...s,
    done: s.got !== null && s.got > 0,
  }));

  let totalScore = 0;
  let maxTotal = 0;
  let doneCount = 0;
  const byYearSurahs: Record<number, StudentSurahProgress[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  list.forEach((s) => {
    maxTotal += s.max;
    if (s.done) {
      totalScore += s.got || 0;
      doneCount++;
    }
    if (byYearSurahs[s.y]) {
      byYearSurahs[s.y].push(s);
    }
  });

  const lastCompleted: StudentSurahProgress | null = list.filter((s) => s.done).slice(-1)[0] || null;
  const nextTodo: StudentSurahProgress | null = list.find((s) => !s.done) || null;

  const earnedYears: boolean[] = [];
  let badgeCount = 0;
  for (let y = 1; y <= 6; y++) {
    const arr = byYearSurahs[y] || [];
    const isOk = arr.length > 0 && arr.every((s) => s.done);
    earnedYears[y] = isOk;
    if (isOk) badgeCount++;
  }

  const currentRank = RANKS[badgeCount] || RANKS[0];
  const progressPercent = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

  // Highest unlocked stage on podium (0 to 6)
  let topRank = 0;
  for (let y = 1; y <= 6; y++) {
    if (earnedYears[y]) topRank = y;
  }

  const formatName = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col gap-6 my-6">
      {/* Top Banner: Student Identity Card */}
      <section
        className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
        style={{ '--rank-col': currentRank.c } as React.CSSProperties}
      >
        {/* Glow backdrop */}
        <div
          className="absolute -top-16 -left-16 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: currentRank.c }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-display font-extrabold uppercase px-3.5 py-1 rounded-full bg-[var(--panel-2)] border inline-flex items-center gap-1.5 shadow-sm"
                style={{ color: currentRank.c, borderColor: currentRank.c }}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Tahap {badgeCount} · {currentRank.n}</span>
              </span>

              <span className="text-xs font-bold text-[var(--gold)] bg-[var(--gold)]/10 px-3 py-1 rounded-full border border-[var(--gold)]/30">
                Kelas {data.klass || 'SPPIM'}
              </span>

              <span className="text-xs font-mono text-[var(--muted)] bg-[var(--night)] px-2.5 py-1 rounded-md border border-[var(--line)]">
                IC: {data.ic}
              </span>
            </div>

            <h2
              className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight truncate pt-1"
              style={{ color: currentRank.c }}
            >
              {formatName(data.name)}
            </h2>

            <p className="text-xs sm:text-sm text-[var(--muted)]">
              {currentRank.desc} · Pencapaian Semasa:{' '}
              <b className="text-[var(--ink)] font-bold">{doneCount} / {list.length} surah selesai</b>
            </p>
          </div>

          {/* Score Badge */}
          <div className="text-left sm:text-right shrink-0 bg-[var(--panel-2)]/80 px-6 py-4 rounded-2xl border border-[var(--line)] shadow-inner">
            <span className="text-[11px] text-[var(--muted)] block font-semibold uppercase tracking-wider">
              Markah Terkumpul
            </span>
            <div className="flex items-baseline sm:justify-end gap-1 mt-0.5">
              <b className="text-3xl sm:text-4xl font-display" style={{ color: currentRank.c }}>
                {totalScore}
              </b>
              <span className="text-xs text-[var(--muted)] font-mono">/ 100</span>
            </div>
            <span className="text-xs text-[var(--mint)] block mt-0.5 font-bold">
              {progressPercent}% Penguasaan
            </span>
          </div>
        </div>
      </section>

      {/* Grid: XP Progress & Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* XP Card */}
        <section className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1 font-semibold uppercase tracking-wider">
              <span>Kemajuan Keseluruhan</span>
              <span className="text-[var(--ink)] text-sm font-mono font-bold">
                {totalScore} / {maxTotal}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-4 rounded-full bg-[var(--night)] border-2 border-[var(--line)] overflow-hidden relative p-0.5">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: currentRank.c,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--muted)] mt-2">
              <span>Peratus Pencapaian: <b className="text-[var(--ink)]">{progressPercent}%</b></span>
              <span>Baki Markah: <b className="text-[var(--gold)]">{maxTotal - totalScore}</b></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--line)]">
            <div className="bg-[var(--panel-2)]/60 rounded-xl p-3 border border-[var(--line)]">
              <span className="text-xs text-[var(--muted)] block">Lencana Terkumpul</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <b className="text-xl font-display text-[var(--ink)]">{badgeCount}</b>
                <span className="text-xs text-[var(--muted)]">/ 6 Tahun</span>
              </div>
            </div>
            <div className="bg-[var(--panel-2)]/60 rounded-xl p-3 border border-[var(--line)]">
              <span className="text-xs text-[var(--muted)] block">Surah Selesai</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <b className="text-xl font-display text-[var(--mint)]">{doneCount}</b>
                <span className="text-xs text-[var(--muted)]">/ {list.length} Surah</span>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Card */}
        <section className="bg-[var(--panel-2)] border-2 border-[var(--gold)] rounded-3xl p-5 sm:p-6 shadow-md flex flex-col justify-between gap-3 relative overflow-hidden">
          {nextTodo ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--gold)]">
                    <Sparkles className="w-4 h-4" />
                    <span>Misi Seterusnya</span>
                  </div>

                  <span className="text-xs font-bold text-[var(--gold)] bg-[var(--gold)]/10 px-2.5 py-0.5 rounded-full border border-[var(--gold)]/30">
                    Tahun {nextTodo.y}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-display text-[var(--gold)] mt-2">
                  {nextTodo.n}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--ink)] mt-1 leading-relaxed">
                  Nilai: <b>{nextTodo.max} markah</b>. Baki{' '}
                  <b className="text-[var(--gold)]">
                    {byYearSurahs[nextTodo.y].filter((s) => !s.done).length} surah
                  </b>{' '}
                  lagi untuk melengkapkan lencana Tahun {nextTodo.y}!
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--line)] text-xs text-[var(--muted)] flex items-center justify-between">
                <span>
                  {lastCompleted ? (
                    <>
                      Terkini dihafal:{' '}
                      <b className="text-[var(--mint)]">{lastCompleted.n}</b>
                    </>
                  ) : (
                    'Sedia untuk memulakan surah pertama.'
                  )}
                </span>
                <span className="inline-flex items-center gap-1 text-[var(--gold)] font-bold">
                  <span>Teruskan Usaha</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[var(--mint)]/20 border-2 border-[var(--mint)] flex items-center justify-center text-[var(--mint)] mb-2">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display text-[var(--mint)]">
                Tahniah! Semua Surah Telah Siap
              </h3>
              <p className="text-sm text-[var(--ink)] max-w-sm mt-1">
                Murid ini telah berjaya menghafal kesemua 41 surah dan mengumpul kesemua 6 lencana Tahun 1 hingga 6 dengan cemerlang!
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Podium Section */}
      <PodiumSection
        earnedYears={earnedYears}
        byYearSurahs={byYearSurahs}
        currentTopRank={topRank}
      />

      {/* Surah Route Roadmap (Read-only for student) */}
      <SurahRoute
        surahs={list}
        byYearSurahs={byYearSurahs}
        earnedYears={earnedYears}
        lastCompleted={lastCompleted}
        nextTodo={nextTodo}
      />
    </div>
  );
};
