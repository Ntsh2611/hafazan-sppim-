import React from 'react';
import { YEAR_COLORS } from '../data/surahData';
import { StudentSurahProgress } from '../types/hafazan';
import { Check, Star, Lock } from 'lucide-react';

interface SurahRouteProps {
  surahs: StudentSurahProgress[];
  byYearSurahs: Record<number, StudentSurahProgress[]>;
  earnedYears: boolean[];
  lastCompleted: StudentSurahProgress | null;
  nextTodo: StudentSurahProgress | null;
  onSelectSurah?: (surah: StudentSurahProgress, index: number) => void;
}

export const SurahRoute: React.FC<SurahRouteProps> = ({
  surahs,
  byYearSurahs,
  earnedYears,
  lastCompleted,
  nextTodo,
  onSelectSurah,
}) => {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-display text-[var(--ink)]">Laluan Surah Mengikut Tahun</h2>
          <p className="text-xs text-[var(--muted)]">Status hafazan bagi 41 surah (100 markah penuh).</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] bg-[var(--panel)] px-3 py-1.5 rounded-full border border-[var(--line)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#ff6b7d]/30 border border-[#ff6b7d]" />
            <span>Belum</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[rgba(150,162,185,0.25)] border border-[#6c7a97]" />
            <span>Selesai</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--mint)]/40 border border-[var(--mint)]" />
            <span className="text-[var(--mint)] font-semibold">Terkini</span>
          </div>
        </div>
      </div>

      {/* Year Sections */}
      {[1, 2, 3, 4, 5, 6].map((year) => {
        const yearSurahs = byYearSurahs[year] || [];
        if (yearSurahs.length === 0) return null;

        const isEarned = !!earnedYears[year];
        const doneCount = yearSurahs.filter((s) => s.done).length;
        const color = YEAR_COLORS[year - 1];

        return (
          <div
            key={year}
            className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-2xl p-4 sm:p-5 transition-all"
            style={{ '--col': color } as React.CSSProperties}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h3 className="text-lg font-display" style={{ color }}>
                  Tahun {year}
                </h3>
                <span className="text-xs font-mono text-[var(--muted)] bg-[var(--night)] px-2 py-0.5 rounded-md border border-[var(--line)]">
                  {doneCount} / {yearSurahs.length} surah
                </span>
              </div>

              {isEarned ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--mint)] bg-[var(--mint)]/10 px-2.5 py-1 rounded-full border border-[var(--mint)]/40">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Lencana Diperoleh</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                  <Lock className="w-3 h-3" />
                  <span>{yearSurahs.length - doneCount} surah berbaki</span>
                </span>
              )}
            </div>

            {/* Grid of Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {yearSurahs.map((s) => {
                const globalIndex = surahs.findIndex((item) => item.n === s.n);
                const isLatest = lastCompleted?.n === s.n;
                const isNext = nextTodo?.n === s.n;

                let chipStyle = 'border-[#ff6b7d] bg-[#ff6b7d]/10 text-[#ffc0c8]'; // todo
                let tagText = `Belum · ${s.max}m`;
                let icon = null;

                if (isLatest) {
                  chipStyle = 'border-[var(--mint)] bg-[var(--mint)]/20 text-[#b9f3dc] shadow-[0_0_12px_-2px_var(--mint)]';
                  tagText = `Terkini · ${s.got}/${s.max}m`;
                  icon = <Check className="w-3 h-3 text-[var(--mint)]" />;
                } else if (s.done) {
                  chipStyle = 'border-[#6c7a97] bg-[#96a2b9]/15 text-[#c8d2e8]';
                  tagText = `Selesai · ${s.got}/${s.max}m`;
                  icon = <Check className="w-3 h-3 text-[var(--mint)]" />;
                } else if (isNext) {
                  chipStyle = 'border-[var(--gold)] bg-[var(--gold)]/20 text-[#ffe5a3] ring-2 ring-[var(--gold)] shadow-[0_0_15px_-3px_var(--gold)]';
                  tagText = `Seterusnya · ${s.max}m`;
                }

                return (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => onSelectSurah && onSelectSurah(s, globalIndex)}
                    className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border-2 text-left transition-transform active:scale-95 cursor-pointer ${chipStyle}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-sm leading-tight truncate">
                        {s.n}
                      </span>
                      {icon}
                    </div>
                    <span className="text-[11px] font-mono tracking-tight opacity-90">
                      {tagText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
};
