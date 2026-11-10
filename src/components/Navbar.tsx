import React from 'react';
import { BookOpen, LogOut } from 'lucide-react';

interface NavbarProps {
  isTeacherMode: boolean;
  hasActiveStudent: boolean;
  onLogout: () => void;
  onTeacherLogin?: () => void;
  onOpenAppsScript?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isTeacherMode,
  hasActiveStudent,
  onLogout,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 py-3 border-b border-[var(--line)]">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--gold)]/40 shadow-sm shrink-0 bg-[var(--night)]">
          <img
            src="/icons/icon-192.png"
            alt="Hafazan SPPIM Icon"
            className="w-full h-full object-cover"
          />
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
