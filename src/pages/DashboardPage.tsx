import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, BookOpen, Layers, Award, Sparkles, Folder } from 'lucide-react';
import { UserProfile } from '../types/user';
import { Challenge } from '../types/challenge';
import { INITIAL_CHALLENGES } from '../data/mockChallenges';
import { MyAnimatedButton } from '../components/ui/MyAnimatedButton';
import { soundService } from '../services/sound';
import { LearningPillars } from '../components/features/about/LearningPillars';
import { CreatorSection } from '../components/features/about/CreatorSection';
import { AnimatedCounter, staggerContainerVariants, staggerItemVariants } from '../lib/motion';
import FaultyTerminal from '../components/ui/FaultyTerminal';
import { computeCurriculumMastery } from '../utils/curriculum';

interface DashboardPageProps {
  user: UserProfile;
  activeChallenge: Challenge;
  onSelectChallenge: (challenge: Challenge) => void;
  onNavigateToTab: (tab: string) => void;
  darkMode?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  activeChallenge,
  onSelectChallenge,
  onNavigateToTab,
  darkMode,
}) => {
  const stats = user.stats;
  const curriculumMastery = user.curriculumMastery || computeCurriculumMastery(user);
  const displayName = (!user.name || user.name === 'Alex Morgan' || user.username === 'Alex Morgan')
    ? (user.role === 'ADMIN' ? (user.name || 'Pardhiv') : 'User / Learner')
    : user.name || user.username || 'User / Learner';

  // Determine dark mode with fallback to document root class
  const isDark = typeof darkMode === 'boolean'
    ? darkMode
    : typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true;

  // Determine greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -my-8 px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-5rem)] overflow-hidden">
      {/* Ambient Computational Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <FaultyTerminal
          scale={2.2}
          gridMul={[2, 1]}
          digitSize={2.3}
          timeScale={0.35}
          pause={false}
          scanlineIntensity={0.55}
          glitchAmount={1}
          flickerAmount={0.45}
          noiseAmp={0.7}
          chromaticAberration={0}
          dither={0}
          curvature={0.12}
          tint="#252ad0"
          mouseReact={true}
          mouseStrength={0.45}
          pageLoadAnimation={false}
          brightness={isDark ? 0.28 : 0.22}
          lightMode={!isDark}
        />
        {/* Subtle readability overlay ensuring Apple-grade contrast for foreground cards and typography */}
        <div className="absolute inset-0 bg-surface-canvas/80 dark:bg-surface-canvas/85 backdrop-blur-[0.5px] pointer-events-none" />
      </div>

      {/* Foreground Content */}
      <motion.div
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 max-w-4xl mx-auto space-y-8 font-sans py-4"
      >
      {/* Top Greeting Header */}
      <motion.div variants={staggerItemVariants} className="space-y-1.5 pb-2">
        <div className="label-eyebrow flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Sparkles className="w-3 h-3" />
          <span>Cryptography Workspace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-content-primary tracking-tight">
          {getGreeting()}, {displayName}.
        </h1>
        <p className="text-sm text-content-secondary">
          Welcome back. Continue where you left off or select a new challenge to practice.
        </p>
      </motion.div>

      {/* Focus Learning Panel */}
      <motion.div
        variants={staggerItemVariants}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="surface-card p-6 rounded-lg border border-border shadow-xs hover:border-border-strong transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-5 border-b border-border-subtle">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="label-eyebrow text-brand-600 dark:text-brand-400">
                Classical Cryptography
              </span>
              <span className="text-content-tertiary">/</span>
              <span className="text-[11px] font-mono text-content-secondary font-medium">
                Difficulty: {activeChallenge.difficulty}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-content-primary tracking-tight">
              {activeChallenge.title}
            </h2>
            <p className="text-xs text-content-secondary leading-relaxed max-w-xl">
              {activeChallenge.explanation}
            </p>
          </div>

          <MyAnimatedButton
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => {
              onSelectChallenge(activeChallenge);
              onNavigateToTab('decode');
            }}
          >
            Open Workspace
          </MyAnimatedButton>
        </div>

        {/* Card Body: Ciphertext preview */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2 space-y-1.5">
            <span className="label-eyebrow">Study Ciphertext</span>
            <div className="font-technical text-sm text-content-primary bg-surface-secondary px-3.5 py-2.5 rounded-md border border-border-subtle truncate select-all">
              {activeChallenge.interceptedMessage}
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <div className="flex justify-between sm:justify-end gap-3 text-xs text-content-secondary font-mono">
              <span className="text-content-tertiary">Cipher Type</span>
              <span className="font-semibold text-content-primary capitalize">{activeChallenge.cipherType}</span>
            </div>
            <div className="flex justify-between sm:justify-end gap-3 text-xs text-content-secondary font-mono">
              <span className="text-content-tertiary">Target Length</span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">{activeChallenge.interceptedMessage.length} chars</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* The 5 Pillars of Learning (Learn, Experiment, Analyze, Practice, Track) */}
      <motion.div variants={staggerItemVariants}>
        <LearningPillars />
      </motion.div>

      {/* Activity & Performance Metrics */}
      <motion.div
        variants={staggerItemVariants}
        className="space-y-3"
      >
        <span className="label-eyebrow">
          Your Learning Statistics
        </span>

        <div className="surface-card divide-y sm:divide-y-0 sm:divide-x divide-border-subtle grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-border">
          <div className="p-5 space-y-1">
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-content-primary tracking-tight">
              <AnimatedCounter value={stats.codesDecoded} />
            </div>
            <div className="text-xs text-content-secondary">Ciphers solved</div>
          </div>

          <div className="p-5 space-y-1">
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-content-primary tracking-tight">
              <AnimatedCounter value={stats.accuracy} suffix="%" />
            </div>
            <div className="text-xs text-content-secondary">Analysis accuracy</div>
          </div>

          <div className="p-5 space-y-1">
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-content-primary tracking-tight">
              <AnimatedCounter value={stats.reportsGenerated ?? 0} />
            </div>
            <div className="text-xs text-content-secondary">Reports generated</div>
          </div>

          <div className="p-5 space-y-1">
            <div className="text-2xl sm:text-3xl font-semibold font-mono text-content-primary tracking-tight">
              <AnimatedCounter value={stats.savedInvestigationsCount ?? 0} />
            </div>
            <div className="text-xs text-content-secondary">Saved investigations</div>
          </div>
        </div>
      </motion.div>

      {/* Cipher Curriculum Mastery */}
      <motion.div variants={staggerItemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="label-eyebrow">
            Cipher Curriculum Mastery
          </span>
          <span className="text-[11px] font-mono text-content-tertiary">
            Personal Progress
          </span>
        </div>

        <div className="surface-card p-5 rounded-lg border border-border grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
          {curriculumMastery.map((item) => (
            <div key={item.id || item.name} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-content-primary truncate mr-2">{item.name}</span>
                <span className="font-technical text-content-secondary font-medium">{item.percent}%</span>
              </div>
              <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Links: Saved Work & History */}
      <motion.div variants={staggerItemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.18 } }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigateToTab('archive')}
          className="surface-card p-5 rounded-lg border border-border hover:border-border-strong cursor-pointer transition-colors space-y-2.5 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Folder className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-content-tertiary group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-content-primary">Saved Work & History</h4>
            <p className="text-xs text-content-secondary mt-0.5 leading-relaxed">
              Organize solved ciphers into custom folders and reopen them anytime in the workspace.
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.18 } }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigateToTab('reports')}
          className="surface-card p-5 rounded-lg border border-border hover:border-border-strong cursor-pointer transition-colors space-y-2.5 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-content-tertiary group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-content-primary">Cryptanalytic Reports</h4>
            <p className="text-xs text-content-secondary mt-0.5 leading-relaxed">
              Generate and export structured mathematical analyses, frequency tables, and learning reports.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Creator Section */}
      <motion.div variants={staggerItemVariants} id="creator-section">
        <CreatorSection />
      </motion.div>
    </motion.div>
    </div>
  );
};
