import React from 'react';
import { YEAR_COLORS } from '../data/surahData';
import { Star } from 'lucide-react';

interface PodiumSectionProps {
  earnedYears: boolean[]; // earnedYears[1..6]
  byYearSurahs: Record<number, { done: boolean }[]>;
  currentTopRank: number; // 0 to 6
}

export const PodiumSection: React.FC<PodiumSectionProps> = ({
  earnedYears,
  byYearSurahs,
  currentTopRank,
}) => {
  // Hexagon SVG badge renderer
  const renderHexBadge = (num: number, earned: boolean, color: string) => {
    return (
      <svg
        className={`w-9 h-10 transition-all ${earned ? 'opacity-100' : 'opacity-40 grayscale'}`}
        style={{ color }}
        viewBox="0 0 100 112"
        aria-hidden="true"
      >
        <polygon fill="currentColor" points="50,4 94,28 94,84 50,108 6,84 6,28" />
        <polygon fill="var(--panel-2)" stroke="currentColor" strokeWidth="3" points="50,16 83,35 83,77 50,96 17,77 17,35" />
        {earned ? (
          <>
            <polygon fill="currentColor" points="50,26 52.5,32.6 59.5,32.9 54,37.3 55.9,44.1 50,40.2 44.1,44.1 46,37.3 40.5,32.9 47.5,32.6" />
            <text fill="currentColor" x="50" y="80" textAnchor="middle" className="font-display font-extrabold text-[34px]">
              {num}
            </text>
          </>
        ) : (
          <>
            <path fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" d="M42 52v-6a8 8 0 0 1 16 0v6" />
            <rect fill="currentColor" x="37" y="52" width="26" height="20" rx="4" />
          </>
        )}
      </svg>
    );
  };

  return (
    <section className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-5 sm:p-7 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-display text-[var(--ink)]">Podium Pangkat & Lencana</h2>
          <p className="text-xs text-[var(--muted)]">Pentas menyala apabila semua surah bagi tahun tersebut selesai dihafal.</p>
        </div>

        <div className="text-xs font-bold text-[var(--gold)] bg-[var(--gold)]/10 px-3 py-1 rounded-full border border-[var(--gold)]/30">
          Kedudukan Semasa: Tahap {currentTopRank}
        </div>
      </div>

      {/* Podium Display */}
      <div className="flex items-end gap-1.5 sm:gap-3 pt-8 px-1 sm:px-4 bg-[var(--night)]/50 border border-[var(--line)] rounded-2xl overflow-x-auto min-h-[220px] pb-0">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const isTop = i === currentTopRank;
          const isEarned = i === 0 ? true : !!earnedYears[i];
          const yearColor = i > 0 ? YEAR_COLORS[i - 1] : 'var(--t0)';
          const surahsInYear = i > 0 ? byYearSurahs[i] || [] : [];
          const doneCount = surahsInYear.filter((s) => s.done).length;
          const standHeight = i === 0 ? 38 : 55 + i * 24;

          return (
            <div key={i} className="flex-1 min-w-[50px] sm:min-w-[70px] flex flex-col justify-end items-center relative">
              {/* Top indicator marker */}
              {isTop && (
                <div className="relative z-10 -mb-2.5 flex flex-col items-center animate-bounce">
                  <div className="px-2.5 py-1 rounded-full bg-[var(--gold)] text-[#241800] text-[10px] sm:text-xs font-display font-extrabold shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Tahap {i}</span>
                  </div>
                </div>
              )}

              {/* Stand Column */}
              <div
                className={`w-full rounded-t-xl flex flex-col items-center justify-between py-2 border-t-8 transition-all ${
                  i === 0
                    ? 'bg-[var(--panel-2)] border-[var(--t0)] text-[var(--muted)]'
                    : isEarned
                    ? 'bg-gradient-to-b from-white/10 to-[var(--panel-2)] border-[var(--col)] shadow-[0_0_20px_-5px_var(--col)] text-[var(--ink)]'
                    : 'bg-[var(--panel-2)]/60 border-[var(--line)] text-[var(--muted)] opacity-70'
                }`}
                style={
                  {
                    height: `${standHeight}px`,
                    '--col': yearColor,
                  } as React.CSSProperties
                }
              >
                {i === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <b className="text-xs font-display">Mula</b>
                  </div>
                ) : (
                  <>
                    <div className="scale-75 sm:scale-90 transform -mt-1">
                      {renderHexBadge(i, isEarned, yearColor)}
                    </div>
                    <div className="text-center leading-tight">
                      <b className="text-xs sm:text-sm font-display block">T{i}</b>
                      <span className="text-[10px] font-mono text-[var(--muted)]">
                        {doneCount}/{surahsInYear.length}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)] px-1">
        <span>T1 hingga T6 ialah Tahun 1 hingga Tahun 6.</span>
        <span>Markah dikira berdasarkan sukatan hafazan SPPIM.</span>
      </div>
    </section>
  );
};
