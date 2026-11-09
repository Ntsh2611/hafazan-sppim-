import React, { useState, useMemo } from 'react';
import { X, Search, Users, Copy, Check, ArrowRight } from 'lucide-react';
import { INITIAL_STUDENTS } from '../data/studentsData';
import { StudentRecord } from '../types/hafazan';

interface StudentDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (ic: string) => void;
}

export const StudentDirectoryModal: React.FC<StudentDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [copiedIc, setCopiedIc] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    return INITIAL_STUDENTS.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass =
        selectedClass === 'all' || s.klass.toLowerCase().includes(selectedClass.toLowerCase());
      return matchSearch && matchClass;
    });
  }, [searchTerm, selectedClass]);

  if (!isOpen) return null;

  const handleCopy = (ic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ic);
    setCopiedIc(ic);
    setTimeout(() => setCopiedIc(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--line)] bg-[var(--panel-2)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 text-[var(--gold)] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg text-[var(--ink)]">
                Direktori 68 Murid SPPIM 2027
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Pilih mana-mana murid untuk terus menyemak atau menyalin nombor IC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-[var(--line)] bg-[var(--night)]/60 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Cari nama murid atau nombor IC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--panel)] border border-[var(--line)] focus:border-[var(--gold)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--ink)] placeholder:text-slate-600 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {['all', '5 Al-Lail', '5 As-Syam'].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-[var(--gold)] text-[#241800]'
                    : 'bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]'
                }`}
              >
                {cls === 'all' ? 'Semua (68)' : cls}
              </button>
            ))}
          </div>
        </div>

        {/* Student list */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)] text-sm">
              Tiada murid dijumpai untuk carian &quot;{searchTerm}&quot;.
            </div>
          ) : (
            filteredStudents.map((s: StudentRecord) => (
              <div
                key={s.ic}
                onClick={() => {
                  onSelectStudent(s.ic);
                  onClose();
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--panel-2)]/40 hover:bg-[var(--panel-2)] border border-[var(--line)] hover:border-[var(--gold)]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-[var(--night)] border border-[var(--line)] flex items-center justify-center text-xs font-mono font-bold text-[var(--muted)] shrink-0">
                    {s.bil}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--gold)] transition-colors truncate">
                      {s.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
                      <span>{s.klass}</span>
                      <span>·</span>
                      <span className="text-[var(--gold)]">{s.ic}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(s.ic, e)}
                    className="p-1.5 rounded-lg bg-[var(--night)] border border-[var(--line)] hover:border-[var(--gold)] text-[var(--muted)] hover:text-[var(--ink)] text-xs transition-colors"
                    title="Salin Nombor IC"
                  >
                    {copiedIc === s.ic ? (
                      <Check className="w-3.5 h-3.5 text-[var(--mint)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-[var(--gold)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Semak</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--panel-2)]/40 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>Menunjukkan {filteredStudents.length} daripada 68 murid berdaftar.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--line)] hover:bg-[var(--panel-2)] font-bold text-[var(--ink)] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
