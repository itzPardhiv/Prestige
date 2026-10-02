import React from 'react';
import { BookOpen, Sliders, BarChart3, Target, Award } from 'lucide-react';

const PILLARS = [
  {
    step: '01',
    title: 'LEARN',
    desc: 'Understand how cipher systems work from mathematical and historical foundations.',
    icon: BookOpen,
  },
  {
    step: '02',
    title: 'EXPERIMENT',
    desc: 'Interact with encryption parameters, rotational shift dials, and key schedules.',
    icon: Sliders,
  },
  {
    step: '03',
    title: 'ANALYZE',
    desc: 'Study ciphertext patterns, letter frequencies, and statistical Index of Coincidence.',
    icon: BarChart3,
  },
  {
    step: '04',
    title: 'PRACTICE',
    desc: 'Solve progressively harder challenges with progressive hints and verification.',
    icon: Target,
  },
  {
    step: '05',
    title: 'TRACK',
    desc: 'Review solved ciphers, analysis accuracy, saved investigations, and reports.',
    icon: Award,
  },
];

export const LearningPillars: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label-eyebrow">
          The PRESTIGE Learning Method
        </span>
        <span className="text-[11px] font-mono text-content-tertiary">
          Curriculum Structure
        </span>
      </div>

      {/* Unified Curriculum Pathway */}
      <div className="surface-card divide-y sm:divide-y-0 sm:divide-x divide-border-subtle grid grid-cols-1 sm:grid-cols-5 rounded-lg border border-border overflow-hidden">
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="p-4 sm:p-5 flex flex-col justify-between hover:bg-surface-secondary/40 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-technical font-semibold text-content-tertiary group-hover:text-brand-500 transition-colors">
                  STEP {pillar.step}
                </span>
                <Icon className="w-4 h-4 text-content-tertiary group-hover:text-brand-500 transition-colors" />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-content-primary tracking-wide">
                  {pillar.title}
                </h4>
                <p className="text-[11px] text-content-secondary leading-relaxed mt-1">
                  {pillar.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
