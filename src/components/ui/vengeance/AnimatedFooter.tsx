import React from 'react';
import { NavTab } from './SpotlightNavbar';
import { creator } from '../../../config/creator';
import { BookOpen, Mail, ExternalLink, Lock } from 'lucide-react';

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export interface AnimatedFooterProps {
  onSelectTab?: (tab: NavTab) => void;
  onOpenTerms?: () => void;
  onScrollToFaq?: () => void;
  onScrollToCreator?: () => void;
}

export const AnimatedFooter: React.FC<AnimatedFooterProps> = ({
  onSelectTab,
  onOpenTerms,
  onScrollToFaq,
  onScrollToCreator,
}) => {
  return (
    <footer className="border-t border-border bg-surface-canvas transition-colors mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-content-primary">
                PRESTIGE
              </span>
              <span className="text-xs text-content-tertiary">
                Interactive Cryptography Platform
              </span>
            </div>
            <p className="text-xs text-content-secondary max-w-sm leading-relaxed">
              A hands-on computational learning workbench. Explore cipher mathematics, frequency heuristics, and cryptanalysis through interactive experiments and progressive practice.
            </p>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-content-primary mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-content-secondary">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('decode')}
                  className="hover:text-content-primary transition-colors text-left"
                >
                  Decode Workspace
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('challenges')}
                  className="hover:text-content-primary transition-colors text-left"
                >
                  Challenges
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('reports')}
                  className="hover:text-content-primary transition-colors text-left"
                >
                  Reports
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('archive')}
                  className="hover:text-content-primary transition-colors text-left"
                >
                  Saved History
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab && onSelectTab('admin')}
                  className="hover:text-amber-500 transition-colors text-left inline-flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3 text-content-tertiary" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Resources & Contact */}
          <div>
            <h4 className="text-xs font-semibold text-content-primary mb-3">Resources & Contact</h4>
            <ul className="space-y-2 text-xs text-content-secondary">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTab) onSelectTab('faq');
                    else if (onScrollToFaq) onScrollToFaq();
                  }}
                  className="hover:text-content-primary transition-colors text-left"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onScrollToCreator) onScrollToCreator();
                    else if (onSelectTab) onSelectTab('dashboard');
                  }}
                  className="hover:text-content-primary transition-colors text-left"
                >
                  Contact & Creator
                </button>
              </li>
              {creator.linkedin && (
                <li>
                  <a
                    href={creator.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-content-primary transition-colors inline-flex items-center gap-1.5"
                  >
                    <LinkedInIcon className="w-3 h-3 text-content-tertiary" />
                    <span>LinkedIn</span>
                  </a>
                </li>
              )}
              {creator.github && (
                <li>
                  <a
                    href={creator.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-content-primary transition-colors inline-flex items-center gap-1.5"
                  >
                    <GitHubIcon className="w-3 h-3 text-content-tertiary" />
                    <span>GitHub</span>
                  </a>
                </li>
              )}
              {onOpenTerms && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="hover:text-content-primary transition-colors text-left"
                  >
                    Terms & Policies
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-content-tertiary">
          <div>
            &copy; 2026 PRESTIGE. Interactive Cryptography Learning Platform.
          </div>
          <div className="flex items-center gap-4">
            <span>Learn</span>
            <span>&bull;</span>
            <span>Experiment</span>
            <span>&bull;</span>
            <span>Analyze</span>
            <span>&bull;</span>
            <span>Practice</span>
            <span>&bull;</span>
            <span>Track</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
