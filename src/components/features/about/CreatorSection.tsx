import React, { useState } from 'react';
import { Mail, Sparkles, Code2, Globe } from 'lucide-react';
import { creator } from '../../../config/creator';

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

export const CreatorSection: React.FC = () => {
  const [imageError, setImageError] = useState(false);

  // Compute initials for polished placeholder
  const initials = creator.name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CR';

  const hasValidImage = Boolean(creator.image && creator.image.trim().length > 0 && !imageError);

  return (
    <div className="surface-card p-6 sm:p-7 border border-border rounded-xl transition-colors space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-brand-500" />
          Created by
        </h3>
        <span className="text-[11px] text-content-tertiary">
          Platform Architecture & Design
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Creator Image Container with fixed dimensions & graceful fallback */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-border shadow-sm bg-gradient-to-br from-brand-500/20 via-surface-secondary to-surface-canvas flex items-center justify-center">
          {hasValidImage ? (
            <img
              src={creator.image}
              alt={`Portrait of ${creator.name}`}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-top rounded-2xl transition-opacity duration-300"
              loading="lazy"
            />
          ) : (
            /* Polished, accessible image container placeholder ready for real photo */
            <div
              className="w-full h-full flex flex-col items-center justify-center text-center p-2 select-none"
              title={`${creator.name} — Image placeholder ready for real photograph`}
              aria-label={`Photo placeholder for ${creator.name}`}
            >
              <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 font-semibold text-xs flex items-center justify-center ring-1 ring-brand-500/30">
                {initials}
              </div>
              <span className="text-[9px] text-content-tertiary mt-1 font-technical tracking-wide">
                AUTHOR
              </span>
            </div>
          )}
        </div>

        {/* Creator Information & Bio */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-content-primary">
              {creator.name}
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              {creator.role}
            </span>
            {creator.tagline && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-secondary text-content-secondary border border-border">
                {creator.tagline}
              </span>
            )}
          </div>

          <p className="text-xs text-content-secondary leading-relaxed max-w-xl">
            {creator.bio}
          </p>

          {/* Social & Contact Links */}
          {(creator.linkedin || creator.github || creator.email) ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {creator.linkedin && (
                <a
                  href={creator.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Connect with ${creator.name} on LinkedIn`}
                  className="inline-flex items-center gap-1.5 text-xs text-content-secondary hover:text-brand-500 transition-colors"
                >
                  <LinkedInIcon className="w-3.5 h-3.5 text-content-tertiary" />
                  <span>LinkedIn</span>
                </a>
              )}

              {creator.github && (
                <a
                  href={creator.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${creator.name}'s GitHub profile`}
                  className="inline-flex items-center gap-1.5 text-xs text-content-secondary hover:text-content-primary transition-colors"
                >
                  <GitHubIcon className="w-3.5 h-3.5 text-content-tertiary" />
                  <span>GitHub</span>
                </a>
              )}

              {creator.email && (
                <a
                  href={`mailto:${creator.email}`}
                  aria-label={`Send an email to ${creator.name}`}
                  className="inline-flex items-center gap-1.5 text-xs text-content-secondary hover:text-content-primary transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-content-tertiary" />
                  <span>{creator.email}</span>
                </a>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
