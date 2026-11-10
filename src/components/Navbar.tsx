import React from 'react';
import { BookOpen, LogOut, Smartphone } from 'lucide-react';

interface NavbarProps {
  isTeacherMode: boolean;
  hasActiveStudent: boolean;
  onLogout: () => void;
  onOpenInstallModal: () => void;
  onTeacherLogin?: () => void;
  onOpenAppsScript?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isTeacherMode,
  hasActiveStudent,
  onLogout,
  onOpenInstallModal,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 py-3 border-b border-[var(--line)]">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[var(--panel-2)] border border-[var(--gold)] flex items-center justify-center text-[var(--gold)] shadow-sm">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <span className="text-lg md:text-xl font-display text-[var(--ink)] tracking-tight">
            Hafazan Tracker <span className="text-[var(--gold)]">SPPIM</span>
          </span>
          {isTeacherMode ? (
            <span className="ml-2 text-xs font-bold text-[var(--gold)] bg-[var(--gold)]/15 px-2 py-0.5 rounded-full border border-[var(--gold)]/40">
              Mod Guru
            </span>
          ) : (
            <span className="hidden sm:inline-block ml-2 text-xs text-[var(--muted)] border-l border-[var(--line)] pl-2">
              Tahun 6 2027
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Pasang ke Telefon / Simpan PWA */}
        <button
          type="button"
          onClick={onOpenInstallModal}
          title="Simpan ke Skrin Telefon (Kekal Log Masuk)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 hover:text-white transition-all cursor-pointer shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden xs:inline">Pasang di Telefon</span>
          <span className="xs:hidden">Pasang</span>
        </button>

        {/* If logged in (either teacher or student) -> Logout button */}
        {(isTeacherMode || hasActiveStudent) && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[var(--line)] hover:border-[var(--rose)] text-[var(--muted)] hover:text-[var(--rose)] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
};
