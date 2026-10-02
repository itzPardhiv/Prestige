import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Challenge } from '../types/challenge';
import { INITIAL_CHALLENGES } from '../data/mockChallenges';
import { soundService } from '../services/sound';

interface ChallengesPageProps {
  completedIds: string[];
  onSelectChallenge: (challenge: Challenge) => void;
}

export const ChallengesPage: React.FC<ChallengesPageProps> = ({
  completedIds,
  onSelectChallenge,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  const filtered = selectedDifficulty === 'All'
    ? INITIAL_CHALLENGES
    : INITIAL_CHALLENGES.filter((c) => c.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-content-primary tracking-tight">
            Challenges
          </h1>
          <p className="text-sm text-content-secondary">
            Select a cryptographic challenge to analyze, decode, and understand.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {['All', 'Easy', 'Intermediate', 'Advanced', 'Expert'].map((diff) => (
            <button
              key={diff}
              onClick={() => {
                soundService.playKeyClick();
                setSelectedDifficulty(diff);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedDifficulty === diff
                  ? 'bg-surface-secondary text-content-primary font-semibold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Table / List Presentation (Linear style) */}
      <div className="surface-card divide-y divide-border-subtle">
        {filtered.map((challenge) => {
          const isCompleted = completedIds.includes(challenge.id);

          return (
            <div
              key={challenge.id}
              onClick={() => {
                soundService.playKeyClick();
                onSelectChallenge(challenge);
              }}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-secondary/40 cursor-pointer transition-colors group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-content-primary group-hover:text-brand-500 transition-colors">
                    {challenge.title}
                  </span>
                  <span className="text-content-tertiary">·</span>
                  <span className="text-xs text-content-secondary">
                    {challenge.difficulty}
                  </span>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                    </span>
                  )}
                </div>

                <p className="text-xs text-content-secondary leading-relaxed">
                  {challenge.explanation}
                </p>

                <div className="font-technical text-xs text-content-tertiary pt-1">
                  Ciphertext: {challenge.interceptedMessage}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 text-xs font-medium text-brand-500 group-hover:text-brand-600">
                <span>{isCompleted ? 'Replay' : 'Start'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
