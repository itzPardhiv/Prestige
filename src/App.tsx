import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AnimatedPage } from './lib/motion';
import { TerminalDemo } from './components/terminal-demo';
import { SpotlightNavbar, NavTab } from './components/layout/SpotlightNavbar';
import { AnimatedFooter } from './components/layout/AnimatedFooter';
import { DashboardPage } from './pages/DashboardPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { ReportsPage } from './pages/ReportsPage';
import { ArchivePage } from './pages/ArchivePage';
import { ProfilePage } from './pages/ProfilePage';
import { FAQPage } from './pages/FAQPage';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DecodingWorkspace } from './components/features/decoder/DecodingWorkspace';
import { SaveInvestigationModal } from './components/features/archive/SaveInvestigationModal';
import { SettingsModal } from './components/features/settings/SettingsModal';
import { TermsPoliciesModal } from './components/features/legal/TermsPoliciesModal';
import { TypingKeyboardLoader } from './components/ui/TypingKeyboardLoader';
import { useUserStore } from './hooks/useUserStore';
import { useArchive } from './hooks/useArchive';
import { useDecoder } from './hooks/useDecoder';
import { INITIAL_CHALLENGES } from './data/mockChallenges';
import { Challenge } from './types/challenge';
import { SavedInvestigation } from './types/investigation';
import { InvestigationReport } from './types/report';
import { generateInvestigationReport } from './utils/exportReport';
import { storageService } from './services/storage';
import { soundService } from './services/sound';
import { supabaseReportService } from './services/supabaseReports';
import { supabaseAuthService } from './services/supabaseAuth';

export function App() {
  // Check URL pathname for /faq, /admin, and /reset-password routing support and 404 detection
  const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const initialIsFaq = initialPath === '/faq';
  const initialIsAdmin = initialPath === '/admin';
  const initialIsResetPassword = initialPath === '/reset-password';
  const isKnownPath = (p: string) =>
    p === '/' ||
    p === '' ||
    p === '/login' ||
    p === '/student' ||
    p === '/faq' ||
    p === '/admin' ||
    p === '/reset-password';
  const [isNotFound, setIsNotFound] = useState<boolean>(() => !isKnownPath(initialPath));

  const [activeTab, setActiveTab] = useState<NavTab>(() => (initialIsFaq ? 'faq' : initialIsAdmin ? 'admin' : 'dashboard'));
  const [publicFaqView, setPublicFaqView] = useState<boolean>(() => initialIsFaq);
  const [isResetPasswordView, setIsResetPasswordView] = useState<boolean>(() => initialIsResetPassword);
  const [activeChallenge, setActiveChallenge] = useState<Challenge>(INITIAL_CHALLENGES[1]); // Default Challenge 07
  const [isCompilingReport, setIsCompilingReport] = useState<boolean>(false);
  const [compilingMessage, setCompilingMessage] = useState<string>('Generating cryptanalysis report...');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<InvestigationReport | null>(null);
  const [reportsRefreshTrigger, setReportsRefreshTrigger] = useState<number>(0);

  // Session-based Terminal Boot Sequence (runs once per browser session)
  const [bootCompleted, setBootCompleted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('prestige_boot_completed') === 'true';
  });

  const handleBootComplete = () => {
    sessionStorage.setItem('prestige_boot_completed', 'true');
    setBootCompleted(true);
  };

  const handleReplayBoot = () => {
    sessionStorage.removeItem('prestige_boot_completed');
    setBootCompleted(false);
  };

  // Theme control: Light & Dark modes
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('prestige_theme');
    if (saved) return saved === 'dark';
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('prestige_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('prestige_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // User state and real authentication store
  const {
    user,
    isAuthenticated,
    login,
    signup,
    demoLogin,
    logout,
    addXp,
    recordReportGenerated,
    updateUsername,
  } = useUserStore();

  // Synchronize browser history for /faq and /admin routes
  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'faq') {
      if (window.location.pathname !== '/faq') {
        window.history.pushState({}, '', '/faq');
      }
    } else if (tab === 'admin') {
      if (window.location.pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      }
    } else {
      if (window.location.pathname === '/faq' || window.location.pathname === '/admin') {
        window.history.pushState({}, '', '/');
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (!isKnownPath(currentPath)) {
        setIsNotFound(true);
        return;
      }
      setIsNotFound(false);
      const isFaq = currentPath === '/faq';
      const isAdminRoute = currentPath === '/admin';

      if (isFaq) {
        if (isAuthenticated) {
          setActiveTab('faq');
        } else {
          setPublicFaqView(true);
        }
      } else if (isAdminRoute) {
        setPublicFaqView(false);
        setActiveTab('admin');
      } else {
        setPublicFaqView(false);
        if (activeTab === 'faq' || activeTab === 'admin') {
          setActiveTab('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, activeTab]);

  const {
    folders,
    investigations,
    selectedFolderId,
    setSelectedFolderId,
    createFolder,
    renameFolder,
    deleteFolder,
    saveInvestigation,
    deleteInvestigation,
  } = useArchive();

  // Cryptanalysis Decoder controller
  const {
    investigation,
    activeDecodedText,
    glitchActive,
    errorMsg,
    loadChallenge,
    startAnalysis,
    requestHint,
    setShift,
    setVigenereKey,
    setSubstitutionChar,
    setUserInput,
    verifyDecode,
    setCipherType,
  } = useDecoder(activeChallenge.id);

  // Handle challenge selection from Dashboard or Challenges tab
  const handleSelectChallenge = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    loadChallenge(challenge);
    handleSelectTab('decode');
  };

  // Handle report generation with contextual Typing Keyboard loading transition
  const handleGenerateReport = (customData?: import('./utils/exportReport').GenerateReportOptions) => {
    soundService.playRadarBeep();
    setCompilingMessage('Synthesizing cryptanalysis report...');
    setIsCompilingReport(true);

    setTimeout(() => {
      const report = generateInvestigationReport(investigation, customData);
      storageService.saveReport(report);
      recordReportGenerated();
      setActiveReport(report);
      setReportsRefreshTrigger((prev) => prev + 1);
      setIsCompilingReport(false);
      handleSelectTab('reports');

      // Non-blocking operational tracking to Supabase (only metadata, never plaintext/ciphertext)
      supabaseReportService.trackReportGeneration({
        userId: user.id,
        reportId: report.id,
        cipherType: investigation.cipherType,
        characterCount: report.statistics?.charactersAnalyzed || investigation.interceptedMessage?.length || 0,
        verified: report.status === 'VERIFIED',
      }).catch((err) => console.warn('Non-blocking report tracking notice:', err));
    }, 1100);
  };

  // Handle report deletion
  const handleDeleteReport = (id: string) => {
    storageService.deleteReport(id);
    if (activeReport?.id === id) {
      setActiveReport(null);
    }
    setReportsRefreshTrigger((prev) => prev + 1);
  };

  // Handle saving investigation
  const handleSaveInvestigation = (name: string, folderId: string) => {
    saveInvestigation({
      name,
      folderId,
      challengeId: investigation.challengeId,
      missionNumber: investigation.missionNumber,
      cipherType: investigation.cipherType,
      originalCipher: investigation.interceptedMessage,
      decodedText: investigation.decodedResult?.plaintext || investigation.userInput || activeDecodedText,
      keyUsed: investigation.decodedResult?.keyUsed || `Shift +${investigation.currentShift}`,
      difficulty: investigation.difficulty,
      score: investigation.decodedResult?.score || 100,
      timeTakenSeconds: investigation.decodedResult?.timeTakenSeconds || investigation.elapsedSeconds || 45,
      hasReport: true,
      reportId: activeReport?.id,
    });

    addXp(investigation.decodedResult?.score || 150, investigation.challengeId, investigation.elapsedSeconds);
  };

  // Reopen saved investigation from personal archive
  const handleOpenSavedInvestigation = (inv: SavedInvestigation) => {
    const ch = INITIAL_CHALLENGES.find((c) => c.id === inv.challengeId);
    if (ch) {
      handleSelectChallenge(ch);
    } else {
      handleSelectTab('decode');
    }
  };

  // Reports list compiled (sorted newest first)
  const allReportsList: InvestigationReport[] = useMemo(() => {
    const savedReportsMap = storageService.getReports();
    const list = Object.values(savedReportsMap);
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });
    if (activeReport && !list.some((r) => r.id === activeReport.id)) {
      list.unshift(activeReport);
    }
    return list;
  }, [activeReport, reportsRefreshTrigger]);

  // 0. NOT FOUND / 404 ROUTE EXPERIENCE
  if (isNotFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-canvas text-content-primary p-6 text-center antialiased">
        <div className="surface-card max-w-md w-full p-8 rounded-xl border border-border shadow-md space-y-5">
          <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center mx-auto">
            <span className="font-technical font-bold text-lg">404</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-content-primary">
              Signal Not Found
            </h1>
            <p className="text-xs text-content-secondary leading-relaxed">
              The cryptographic route or sector does not exist or has been relocated.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/');
              setIsNotFound(false);
              setPublicFaqView(false);
              setActiveTab('dashboard');
            }}
            className="w-full py-2.5 px-4 rounded-md bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            Return to Headquarters
          </button>
        </div>
      </div>
    );
  }

  // 1. PUBLIC EXPERIENCE
  if (!isAuthenticated) {
    if (publicFaqView) {
      return (
        <div className="min-h-screen flex flex-col bg-surface-canvas text-content-primary antialiased transition-colors">
          {!bootCompleted && <TerminalDemo onComplete={handleBootComplete} />}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <FAQPage
              isAuthenticated={false}
              onBack={() => {
                setPublicFaqView(false);
                window.history.pushState({}, '', '/');
              }}
            />
          </main>
          <AnimatedFooter
            onSelectTab={() => {}}
            onOpenTerms={() => setIsTermsOpen(true)}
            onScrollToFaq={() => {}}
            onScrollToCreator={() => {}}
          />
          <TermsPoliciesModal
            isOpen={isTermsOpen}
            onClose={() => setIsTermsOpen(false)}
          />
        </div>
      );
    }

    return (
      <>
        {!bootCompleted && <TerminalDemo onComplete={handleBootComplete} />}
        <AuthPage
          onLogin={login}
          onSignup={signup}
          onDemoLogin={demoLogin}
          onOpenFaq={() => {
            setPublicFaqView(true);
            window.history.pushState({}, '', '/faq');
          }}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </>
    );
  }

  // 2. AUTHENTICATED EXPERIENCE
  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas text-content-primary antialiased selection:bg-brand-500/20 selection:text-brand-500 transition-colors">
      {/* Terminal Boot Sequence (runs once per session or on manual replay) */}
      {!bootCompleted && <TerminalDemo onComplete={handleBootComplete} />}

      {/* Spotlight Navigation Bar with Integrated Profile Dropdown */}
      <SpotlightNavbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        onSignOut={logout}
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        {/* Contextual Typing Keyboard Loading State */}
        {isCompilingReport ? (
          <div className="py-24 max-w-lg mx-auto">
            <TypingKeyboardLoader
              message={compilingMessage}
              subMessage="Synthesizing cryptographic structure, letter frequencies, and mathematical notes"
            />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <AnimatedPage key="dashboard">
                <DashboardPage
                  user={user}
                  activeChallenge={activeChallenge}
                  onSelectChallenge={handleSelectChallenge}
                  onNavigateToTab={(tab) => handleSelectTab(tab as NavTab)}
                  darkMode={darkMode}
                />
              </AnimatedPage>
            )}

            {activeTab === 'decode' && (
              <AnimatedPage key="decode">
                <DecodingWorkspace
                  investigation={investigation}
                  activeDecodedText={activeDecodedText}
                  glitchActive={glitchActive}
                  errorMsg={errorMsg}
                  onStartAnalysis={startAnalysis}
                  onRequestHint={requestHint}
                  onSetShift={setShift}
                  onSetVigenereKey={setVigenereKey}
                  onSetSubstitutionChar={setSubstitutionChar}
                  onSetUserManualInput={setUserInput}
                  onVerifyDecode={(text) => {
                    const success = verifyDecode(text);
                    if (success && investigation.challengeId) {
                      addXp(
                        investigation.decodedResult?.score || 150,
                        investigation.challengeId,
                        investigation.elapsedSeconds
                      );
                    }
                    return success;
                  }}
                  onSetCipherType={setCipherType}
                  onGenerateReport={handleGenerateReport}
                  onSaveInvestigation={() => setIsSaveModalOpen(true)}
                  onContinueNext={() => {
                    const nextIndex = (INITIAL_CHALLENGES.findIndex((c) => c.id === activeChallenge.id) + 1) % INITIAL_CHALLENGES.length;
                    handleSelectChallenge(INITIAL_CHALLENGES[nextIndex]);
                  }}
                />
              </AnimatedPage>
            )}

            {activeTab === 'challenges' && (
              <AnimatedPage key="challenges">
                <ChallengesPage
                  completedIds={user.completedChallengeIds}
                  onSelectChallenge={handleSelectChallenge}
                />
              </AnimatedPage>
            )}

            {activeTab === 'reports' && (
              <AnimatedPage key="reports">
                <ReportsPage
                  reports={allReportsList}
                  activeReport={activeReport}
                  onOpenReport={setActiveReport}
                  onDeleteReport={handleDeleteReport}
                />
              </AnimatedPage>
            )}

            {activeTab === 'archive' && (
              <AnimatedPage key="archive">
                <ArchivePage
                  folders={folders}
                  investigations={investigations}
                  activeFolderId={selectedFolderId}
                  onSelectFolder={setSelectedFolderId}
                  onCreateFolder={createFolder}
                  onRenameFolder={renameFolder}
                  onDeleteFolder={deleteFolder}
                  onOpenInvestigation={handleOpenSavedInvestigation}
                  onDeleteInvestigation={deleteInvestigation}
                />
              </AnimatedPage>
            )}

            {activeTab === 'profile' && (
              <AnimatedPage key="profile">
                <ProfilePage
                  user={user}
                  onUpdateUsername={updateUsername}
                />
              </AnimatedPage>
            )}

            {activeTab === 'faq' && (
              <AnimatedPage key="faq">
                <FAQPage
                  isAuthenticated={true}
                  onBack={() => handleSelectTab('dashboard')}
                />
              </AnimatedPage>
            )}

            {activeTab === 'admin' && (
              <AnimatedPage key="admin">
                <AdminDashboardPage
                  user={user}
                  darkMode={darkMode}
                  onNavigateHome={() => handleSelectTab('dashboard')}
                />
              </AnimatedPage>
            )}
          {isResetPasswordView && (
            <AnimatedPage key="reset-password">
              <ResetPasswordPage
                onUpdatePassword={async (newPassword) => {
                  const res = await supabaseAuthService.updatePassword(newPassword);
                  return res;
                }}
                onNavigateHome={() => {
                  setIsResetPasswordView(false);
                  window.history.pushState({}, '', '/login');
                }}
              />
            </AnimatedPage>
          )}
          </AnimatePresence>
        )}
      </main>

      {/* Save Investigation Modal */}
      <SaveInvestigationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        folders={folders}
        defaultName={`${investigation.title} Decoded`}
        onSave={handleSaveInvestigation}
        onCreateFolder={createFolder}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onUpdateProfile={updateUsername}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onReplayBoot={handleReplayBoot}
      />

      {/* Terms & Policies Modal */}
      <TermsPoliciesModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Educational SaaS Footer */}
      <AnimatedFooter
        onSelectTab={handleSelectTab}
        onOpenTerms={() => setIsTermsOpen(true)}
        onScrollToFaq={() => handleSelectTab('faq')}
        onScrollToCreator={() => {
          handleSelectTab('dashboard');
          setTimeout(() => {
            document.getElementById('creator-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />
    </div>
  );
}

export default App;
