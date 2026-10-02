import React from 'react';
import { ArrowLeft, HelpCircle, BookOpen } from 'lucide-react';
import { FAQSection } from '../components/features/about/FAQSection';

interface FAQPageProps {
  onBack?: () => void;
  isAuthenticated?: boolean;
}

export const FAQPage: React.FC<FAQPageProps> = ({ onBack, isAuthenticated = true }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans py-6">
      {/* Header / Breadcrumb navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary bg-surface-secondary border border-border rounded-md hover:bg-surface-elevated transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'Back to Dashboard' : 'Back to Sign In'}</span>
            </button>
          )}
        </div>
        <div className="label-eyebrow text-content-tertiary">
          Interactive Platform Documentation
        </div>
      </div>

      {/* Main Title Section */}
      <div className="space-y-2">
        <div className="label-eyebrow text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
          <HelpCircle className="w-3 h-3" />
          <span>Knowledge Base</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-content-primary tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-content-secondary max-w-2xl leading-relaxed">
          Common inquiries about learning workflows, cipher cryptanalysis, accounts, data persistence, and security.
        </p>
      </div>

      {/* Dedicated FAQ Accordion */}
      <div className="pt-2">
        <FAQSection />
      </div>
    </div>
  );
};
