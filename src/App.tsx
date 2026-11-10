/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LoginSection } from './components/LoginSection';
import { Dashboard } from './components/Dashboard';
import { TeacherPortal } from './components/TeacherPortal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { TeacherRecordModal } from './components/TeacherRecordModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { SemakKemajuanResult, StudentRecord } from './types/hafazan';
import { fetchKemajuanMurid, getSavedAppsScriptUrl } from './services/appsScriptService';
import { recordStudentLogin } from './services/studentStatsService';
import { cleanIC } from './data/studentsData';
import { scheduleDaily815PMReminder } from './services/notificationService';

const TEACHER_IC = '971126';
const SAVED_STUDENT_IC_KEY = 'hafazan_saved_student_ic';

export default function App() {
  const [activeStudent, setActiveStudent] = useState<SemakKemajuanResult | null>(null);
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => getSavedAppsScriptUrl());
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [studentToGrade, setStudentToGrade] = useState<SemakKemajuanResult | null>(null);

  // Handle Search / Login
  const handleSearch = useCallback(async (rawIc: string, isAutoRestore: boolean = false) => {
    const ic = cleanIC(rawIc);
    if (!ic) return;

    setIsLoading(true);
    setErrorMessage(null);

    // 1. Check if Teacher IC is entered
    if (ic === TEACHER_IC) {
      setIsTeacherMode(true);
      setActiveStudent(null);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Otherwise process Student IC
    try {
      const result = await fetchKemajuanMurid(ic);
      if (result.ok) {
        // Record login count for this student
        recordStudentLogin(ic);
        setActiveStudent(result);
        setIsTeacherMode(false);

        // KEKAL LOG MASUK: Simpan nombor IC dalam storan peranti telefon
        try {
          localStorage.setItem(SAVED_STUDENT_IC_KEY, ic);
        } catch {}

        // Jadualkan peringatan harian jam 8.15 malam
        scheduleDaily815PMReminder(result);

        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        if (!isAutoRestore) {
          setErrorMessage(result.error || `No. IC ${ic} tidak dijumpai dalam rekod murid.`);
        } else {
          try {
            localStorage.removeItem(SAVED_STUDENT_IC_KEY);
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (!isAutoRestore) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Ralat: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-restore student session from home screen / phone local storage on mount
  useEffect(() => {
    try {
      const savedIc = localStorage.getItem(SAVED_STUDENT_IC_KEY);
      if (savedIc) {
        handleSearch(savedIc, true);
      }
    } catch (e) {
      console.warn('Failed restoring saved student IC:', e);
    }
  }, [handleSearch]);

  // Pantau jadual notifikasi jam 8.15 malam secara berterusan semasa sesi aktif
  useEffect(() => {
    if (!activeStudent) return;
    const cleanup = scheduleDaily815PMReminder(activeStudent);
    return cleanup;
  }, [activeStudent]);

  const handleLogout = useCallback(() => {
    // Pengguna memilih untuk Log Keluar secara manual
    try {
      localStorage.removeItem(SAVED_STUDENT_IC_KEY);
    } catch {}
    setActiveStudent(null);
    setIsTeacherMode(false);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // When teacher clicks "Kemas Kini" on a student in the directory table
  const handleSelectStudentToGrade = async (student: StudentRecord) => {
    const res = await fetchKemajuanMurid(student.ic);
    if (res.ok) {
      setStudentToGrade(res);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-4">
      {/* Top Header / Navigation */}
      <div>
        <Navbar
          isTeacherMode={isTeacherMode}
          hasActiveStudent={!!activeStudent}
          onLogout={handleLogout}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onTeacherLogin={() => handleSearch(TEACHER_IC)}
          onOpenAppsScript={() => setIsAppsScriptModalOpen(true)}
        />

        {/* Main Content Area */}
        <main>
          {isTeacherMode ? (
            <TeacherPortal
              onLogout={handleLogout}
              onOpenAppsScript={() => setIsAppsScriptModalOpen(true)}
              onSelectStudentToGrade={handleSelectStudentToGrade}
              appsScriptConfigured={!!appsScriptUrl}
            />
          ) : activeStudent ? (
            <Dashboard
              data={activeStudent}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
            />
          ) : (
            <LoginSection
              onSearch={handleSearch}
              isLoading={isLoading}
              errorMessage={errorMessage}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[var(--muted)] border-t border-[var(--line)]/50 mt-10">
        <p className="font-semibold text-[var(--ink)] tracking-wide">
          Sistem Hafazan SPPIM 2027 · Sekolah Rendah Islam Al-Musleh
        </p>
        <p className="mt-1 text-[11px] opacity-60">
          Melahirkan Generasi Huffaz Rabbani yang Berakhlak Mulia
        </p>
      </footer>

      {/* Modals */}
      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        onUrlUpdated={(url) => setAppsScriptUrl(url)}
      />

      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {studentToGrade && (
        <TeacherRecordModal
          isOpen={!!studentToGrade}
          onClose={() => setStudentToGrade(null)}
          data={studentToGrade}
          onDataUpdated={async () => {
            const refreshed = await fetchKemajuanMurid(studentToGrade.ic);
            if (refreshed.ok) {
              setStudentToGrade(refreshed);
            }
          }}
        />
      )}
    </div>
  );
}
