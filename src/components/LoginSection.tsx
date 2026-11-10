import React, { useState } from 'react';
import { Search, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginSectionProps {
  onSearch: (ic: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LoginSection: React.FC<LoginSectionProps> = ({
  onSearch,
  isLoading,
  errorMessage,
}) => {
  const [icInput, setIcInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = icInput.replace(/[^0-9A-Za-z]/g, '').trim();
    if (!clean) return;
    onSearch(clean);
  };

  return (
    <section className="my-8 max-w-2xl mx-auto">
      {/* Main Search Card */}
      <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--gold)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[var(--gold)]/40 shadow-md shrink-0 bg-[var(--night)]">
            <img
              src="/icons/icon-192.png"
              alt="Hafazan SPPIM Icon"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--panel-2)] border border-[var(--line)] text-[var(--gold)] w-fit mb-1">
              <span>Sistem Rekod Hafazan SPPIM 2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display text-[var(--ink)] leading-tight">
              Semak Kemajuan <span className="text-[var(--gold)]">Hafazan</span>
            </h1>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="icInput"
              className="text-sm font-bold text-[var(--ink)] flex items-center justify-between"
            >
              <span>No. Kad Pengenalan (IC)</span>
              <span className="text-xs font-normal text-[var(--muted)]">12 Digit (Tanpa sengkang)</span>
            </label>

            <div className="relative group">
              <input
                id="icInput"
                type="text"
                inputMode="numeric"
                value={icInput}
                onChange={(e) => setIcInput(e.target.value)}
                placeholder="Masukkan No. IC"
                className="w-full bg-[var(--night)] border-2 border-[var(--line)] group-hover:border-[var(--line-bright)] focus:border-[var(--gold)] rounded-2xl px-5 py-4 text-xl sm:text-2xl font-bold tracking-wider text-[var(--ink)] placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
                disabled={isLoading}
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--gold)] transition-colors">
                <Search className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              Masukkan nombor kad pengenalan murid untuk melihat senarai surah dan markah hafazan.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-[var(--rose)]/15 border border-[var(--rose)] text-[var(--rose)] text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading || !icInput.trim()}
            className="flex items-center justify-center gap-2 bg-[var(--gold)] hover:bg-[#ffc65c] active:translate-y-0.5 text-[#241800] text-lg font-display font-bold py-4 px-8 rounded-2xl shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 w-full sm:w-auto self-start"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#241800] border-t-transparent rounded-full animate-spin" />
                <span>Memeriksa Rekod...</span>
              </>
            ) : (
              <>
                <span>Semak Kemajuan</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
};
