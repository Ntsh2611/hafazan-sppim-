/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { LoginSection } from './components/LoginSection';
import { Dashboard } from './components/Dashboard';
import { TeacherPortal } from './components/TeacherPortal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { TeacherRecordModal } from './components/TeacherRecordModal';
import { SemakKemajuanResult, StudentRecord } from './types/hafazan';
import { fetchKemajuanMurid, getSavedAppsScriptUrl } from './services/appsScriptService';
import { recordStudentLogin } from './services/studentStatsService';
import { cleanIC } from './data/studentsData';

const TEACHER_IC = '971126';
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minit auto-logout

export default function App() {
  const [activeStudent, setActiveStudent] = useState<SemakKemajuanResult | null>(null);
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => getSavedAppsScriptUrl());
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState<boolean>(false);
  const [studentToGrade, setStudentToGrade] = useState<SemakKemajuanResult | null>(null);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Search / Login
  const handleSearch = async (rawIc: string) => {
    const ic = cleanIC(rawIc);
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(result.error || `No. IC ${ic} tidak dijumpai dalam rekod murid.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Ralat: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    setActiveStudent(null);
    setIsTeacherMode(false);
    setErrorMessage(null);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // When teacher clicks "Kemas Kini" on a student in the directory table
  const handleSelectStudentToGrade = async (student: StudentRecord) => {
    const res = await fetchKemajuanMurid(student.ic);
    if (res.ok) {
      setStudentToGrade(res);
    }
  };

  // Reset idle timer whenever user interacts with page
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (activeStudent) {
      idleTimerRef.current = setTimeout(() => {
        handleLogout();
      }, IDLE_TIMEOUT_MS);
    }
  }, [activeStudent, handleLogout]);

  useEffect(() => {
    const events = ['click', 'keydown', 'touchstart', 'scroll'];
    const listener = () => resetIdleTimer();

    events.forEach((ev) => window.addEventListener(ev, listener, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, listener));
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetIdleTimer]);

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-4">
      {/* Top Header / Navigation */}
      <div>
        <Navbar
          isTeacherMode={isTeacherMode}
          hasActiveStudent={!!activeStudent}
          onLogout={handleLogout}
          onTeacherLogin={() => handleSearch(TEACHER_IC)}
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
            <Dashboard data={activeStudent} />
          ) : (
            <LoginSection
              onSearch={handleSearch}
              isLoading={isLoading}
              errorMessage={errorMessage}
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

      {/* Modals for Teacher */}
      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        onUrlUpdated={(url) => setAppsScriptUrl(url)}
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
