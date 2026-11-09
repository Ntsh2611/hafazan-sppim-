import React, { useState } from 'react';
import { X, Check, Download, Save, Award, RefreshCw, Star } from 'lucide-react';
import { SemakKemajuanResult } from '../types/hafazan';
import { SURAH_LIST } from '../data/surahData';
import {
  saveLocalStudentMark,
  generateUpdatedCSV,
  saveStudentMarksToGoogleSheet,
} from '../services/appsScriptService';

interface TeacherRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SemakKemajuanResult;
  onDataUpdated: () => void;
}

export const TeacherRecordModal: React.FC<TeacherRecordModalProps> = ({
  isOpen,
  onClose,
  data,
  onDataUpdated,
}) => {
  const [localMarks, setLocalMarks] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    data.surahs.forEach((s, idx) => {
      if (s.got !== null) {
        map[idx] = s.got;
      }
    });
    return map;
  });

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleToggleSurah = (idx: number, max: number) => {
    setLocalMarks((prev) => {
      const next = { ...prev };
      if (next[idx] !== undefined && next[idx] > 0) {
        delete next[idx];
      } else {
        next[idx] = max;
      }
      return next;
    });
  };

  const handleMarkYear = (year: number) => {
    setLocalMarks((prev) => {
      const next = { ...prev };
      SURAH_LIST.forEach((s, idx) => {
        if (s.y === year) {
          next[idx] = s.max;
        }
      });
      return next;
    });
  };

  const handleResetYear = (year: number) => {
    setLocalMarks((prev) => {
      const next = { ...prev };
      SURAH_LIST.forEach((s, idx) => {
        if (s.y === year) {
          delete next[idx];
        }
      });
      return next;
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    // 1. Save to local storage for this student
    SURAH_LIST.forEach((s, idx) => {
      const val = localMarks[idx];
      saveLocalStudentMark(data.ic, idx, val !== undefined ? val : 0);
    });

    // 2. Push to Google Sheet via Apps Script in background
    saveStudentMarksToGoogleSheet(data.ic, localMarks).catch(() => {});

    setTimeout(() => {
      setSaving(false);
      onDataUpdated();
      onClose();
    }, 400);
  };

  const handleExportCSV = () => {
    const csvContent = generateUpdatedCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `REKOD_HAFAZAN_SPPIM_KEMASKINI_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSelectedMarks = Object.values(localMarks).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--line)] bg-[var(--panel-2)]/60">
          <div>
            <h3 className="font-display text-lg text-[var(--ink)]">
              Kemas Kini Markah: {data.name}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {data.klass} · No. IC: <span className="font-mono text-[var(--gold)]">{data.ic}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Batch by Year Bar */}
        <div className="p-4 border-b border-[var(--line)] bg-[var(--night)]/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--muted)] font-semibold">Tanda Pukal Tahun:</span>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => handleMarkYear(y)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--panel-2)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--ink)] transition-colors cursor-pointer"
              >
                +T{y}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">
              Jumlah Terpilih: <b className="text-[var(--gold)] text-sm">{totalSelectedMarks} / 100</b>
            </span>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--muted)] text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              title="Muat turun fail CSV terkini untuk diimport ke Google Sheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksport CSV</span>
            </button>
          </div>
        </div>

        {/* Surahs Checklist */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {[1, 2, 3, 4, 5, 6].map((year) => {
            const yearSurahs = SURAH_LIST.filter((s) => s.y === year);

            return (
              <div key={year} className="space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--line)]">
                  <span className="font-display text-sm font-bold text-[var(--gold)]">
                    Tahun {year} ({yearSurahs.length} surah)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkYear(year)}
                      className="text-[11px] text-[var(--mint)] hover:underline font-semibold"
                    >
                      Pilih Semua
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => handleResetYear(year)}
                      className="text-[11px] text-[var(--rose)] hover:underline font-semibold"
                    >
                      Padam
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {yearSurahs.map((s) => {
                    const idx = SURAH_LIST.findIndex((item) => item.n === s.n);
                    const isDone = localMarks[idx] !== undefined && localMarks[idx] > 0;

                    return (
                      <button
                        key={s.n}
                        type="button"
                        onClick={() => handleToggleSurah(idx, s.max)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                          isDone
                            ? 'bg-[var(--mint)]/20 border-[var(--mint)] text-[#b9f3dc]'
                            : 'bg-[var(--panel-2)]/40 border-[var(--line)] text-[var(--muted)] hover:border-[var(--muted)]'
                        }`}
                      >
                        <span className="truncate">{s.n}</span>
                        <span className="font-mono text-[10px] opacity-80 shrink-0 ml-1">
                          {isDone ? `${s.max}/${s.max}` : `0/${s.max}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--panel-2)]/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--line)] hover:bg-[var(--panel-2)] text-xs font-bold text-[var(--ink)] transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[var(--gold)] hover:bg-[#ffc65c] text-[#241800] text-xs font-display font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Rekod Markah</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
