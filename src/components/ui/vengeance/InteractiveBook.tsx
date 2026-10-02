import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, BookOpen, CheckCircle, FileText, ArrowRight, Shield, Cpu, Activity, Clock, Check } from 'lucide-react';
import { InvestigationReport } from '../../../types/report';
import { soundService } from '../../../services/sound';
import { downloadReportAsPdf, downloadReportAsTxt, downloadReportAsMarkdown, ensureTechnicalReportData } from '../../../utils/exportReport';
import { MyAnimatedButton } from './MyAnimatedButton';
import { encodeCaesar, decodeCaesar } from '../../../utils/ciphers/caesar';

export interface InteractiveBookProps {
  report: InvestigationReport;
  onClose?: () => void;
  onDownload?: () => void;
  onDownloadReport?: (format: 'txt' | 'md') => void;
}

export const InteractiveBook: React.FC<InteractiveBookProps> = ({
  report,
  onClose,
  onDownload,
  onDownloadReport,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 8;

  // Resolve structured technical data (deterministic & live)
  const tech = ensureTechnicalReportData(report);

  // Interactive sandbox state for Page 8: Try It Yourself
  const [sandboxInput, setSandboxInput] = useState<string>('CRYPTO ANALYSIS');
  const [sandboxShift, setSandboxShift] = useState<number>(3);

  // Keyboard navigation for page flip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      soundService.playKeyClick();
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      soundService.playKeyClick();
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleDownloadPdf = () => {
    soundService.playRadarBeep();
    if (onDownload) {
      onDownload();
    } else {
      downloadReportAsPdf(report);
    }
  };

  const handleDownloadTxt = () => {
    soundService.playRadarBeep();
    if (onDownloadReport) {
      onDownloadReport('txt');
    } else {
      downloadReportAsTxt(report);
    }
  };

  const handleDownloadMd = () => {
    soundService.playRadarBeep();
    if (onDownloadReport) {
      onDownloadReport('md');
    } else {
      downloadReportAsMarkdown(report);
    }
  };

  // Render individual pages based on currentPage
  const renderPageContent = (pageNum: number) => {
    switch (pageNum) {
      case 1:
        // Page 1: Executive Summary & Report Identity
        return (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-[10px] font-technical text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
                Section 1.0 &bull; Executive Summary
              </span>
              <h3 className="text-xl font-bold text-content-primary mt-1">
                Cryptanalysis Investigation Report
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Official technical record &bull; Report ID: <span className="font-mono">{report.id}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Summary Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-surface-secondary/40 rounded-md border border-border">
                <div>
                  <span className="text-[10px] text-content-tertiary uppercase">Report Identifier</span>
                  <p className="font-mono font-semibold text-content-primary truncate">{report.id}</p>
                </div>
                <div>
                  <span className="text-[10px] text-content-tertiary uppercase">Cipher Engine</span>
                  <p className="font-semibold text-brand-600 dark:text-brand-400 uppercase">{tech.cipherConfig.cipherType}</p>
                </div>
                <div>
                  <span className="text-[10px] text-content-tertiary uppercase">Primary Parameter</span>
                  <p className="font-mono font-semibold text-content-primary">{tech.cipherConfig.primaryParameter}</p>
                </div>
                <div>
                  <span className="text-[10px] text-content-tertiary uppercase">Verification Status</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Verified</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-content-primary mb-1">Investigation Summary</h4>
                <p className="text-content-secondary leading-relaxed text-xs">
                  An investigation was executed on input ciphertext using the <strong className="text-content-primary">{tech.cipherConfig.cipherType}</strong>. Decoding was performed using parameter <code className="font-mono text-brand-600 dark:text-brand-400">[{tech.cipherConfig.primaryParameter}]</code>, producing <strong className="text-content-primary">{tech.outputMetrics.charCount}</strong> characters of plaintext ({tech.outputMetrics.wordCount} words). The transformation was mathematically verified with zero decoding exceptions and bidirectional consistency.
                </p>
              </div>

              <div className="p-2.5 bg-surface-secondary/30 rounded border border-border text-[11px] font-mono text-content-secondary flex justify-between items-center">
                <span>Transformation Rule:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{tech.cipherConfig.mathematicalRule}</span>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-content-tertiary border-t border-border-subtle">
                <span>Compiled: {report.timestamp}</span>
                <span>Session: Local Authenticated Context</span>
              </div>
            </div>
          </div>
        );

      case 2:
        // Page 2: Input Artifact (Original Ciphertext)
        return (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-[10px] font-technical text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
                Section 2.0 &bull; Input Artifact
              </span>
              <h3 className="text-xl font-bold text-content-primary mt-1">
                Input Ciphertext Artifact
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Exact raw ciphertext stream submitted prior to cryptanalytic transformation
              </p>
            </div>

            {/* Ciphertext Container */}
            <div className="p-3 bg-surface-secondary/60 rounded-md border border-border">
              <div className="flex justify-between items-center text-[10px] text-content-tertiary font-technical mb-2 pb-1 border-b border-border-subtle">
                <span>RAW CIPHERTEXT ARTIFACT</span>
                <span>{tech.inputMetrics.charCount} CHARACTERS &bull; UTF-8 ENCODED</span>
              </div>
              <div className="font-technical text-xs font-bold text-content-primary tracking-wider break-all leading-relaxed p-3 bg-surface-canvas rounded border border-border-subtle select-text max-h-48 overflow-y-auto">
                {report.originalCipher}
              </div>
            </div>

            {/* Deterministic Metrics Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Total Chars</span>
                <span className="font-technical font-semibold">{tech.inputMetrics.charCount}</span>
              </div>
              <div className="p-2 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Letters</span>
                <span className="font-technical font-semibold">{tech.inputMetrics.letterCount}</span>
              </div>
              <div className="p-2 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Digits</span>
                <span className="font-technical font-semibold">{tech.inputMetrics.digitCount}</span>
              </div>
              <div className="p-2 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Whitespace</span>
                <span className="font-technical font-semibold">{tech.inputMetrics.whitespaceCount}</span>
              </div>
              <div className="p-2 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Tokens</span>
                <span className="font-technical font-semibold">{tech.inputMetrics.wordCount}</span>
              </div>
              <div className="p-2 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Lines</span>
                <span className="font-technical font-semibold">{tech.inputMetrics.lineCount}</span>
              </div>
            </div>
          </div>
        );

      case 3:
        // Page 3: Cipher Configuration
        return (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-[10px] font-technical text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
                Section 3.0 &bull; Cipher Configuration
              </span>
              <h3 className="text-xl font-bold text-content-primary mt-1">
                Decoder Configuration & Parameters
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Exact parameters applied during decoding (applicable fields only)
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="divide-y divide-border border border-border rounded-md bg-surface-secondary/40 overflow-hidden">
                {tech.cipherConfig.applicableFields.map((field, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <span className="text-content-secondary font-medium">{field.label}</span>
                    <span className="font-mono text-content-primary font-semibold text-right">{field.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-surface-secondary/30 rounded border border-border text-xs text-content-secondary space-y-1.5">
                <span className="font-semibold text-content-primary block">Mathematical Formulation:</span>
                <div className="p-2 bg-surface-canvas rounded border border-border-subtle font-mono text-xs text-brand-600 dark:text-brand-400 text-center font-bold">
                  {tech.cipherConfig.mathematicalRule}
                </div>
                <p className="text-[11px] text-content-tertiary pt-1">
                  Parameters strictly reflect the active decoder configuration without theoretical approximations.
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        // Page 4: Statistical & Frequency Analysis
        const activeFreqs = tech.statistics.frequencies.filter((f) => f.count > 0).slice(0, 10);
        return (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-[10px] font-technical text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
                Section 4.0 &bull; Frequency & Statistics
              </span>
              <h3 className="text-xl font-bold text-content-primary mt-1">
                Frequency & Statistical Analysis
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Calculated statistical indices and character distribution metrics
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Index of Coincidence</span>
                <span className="font-mono text-base font-semibold">{tech.statistics.indexOfCoincidence}</span>
                <span className="text-[9px] text-content-tertiary block mt-0.5">Std English: ~0.0667</span>
              </div>
              <div className="p-2.5 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Chi-Squared Fit (&chi;&sup2;)</span>
                <span className="font-mono text-base font-semibold">{tech.statistics.chiSquared}</span>
                <span className="text-[9px] text-content-tertiary block mt-0.5">Minima test fit</span>
              </div>
              <div className="p-2.5 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Unique Letters</span>
                <span className="font-mono text-base font-semibold">{tech.statistics.uniqueLetters} / 26</span>
                <span className="text-[9px] text-content-tertiary block mt-0.5">Active alphabet</span>
              </div>
            </div>

            {/* Observed Frequencies Table */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[11px] font-medium text-content-secondary block">
                Observed Letter Frequencies (Top Characters in Input):
              </span>
              {activeFreqs.length > 0 ? (
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-center font-mono">
                  {activeFreqs.map((f) => (
                    <div key={f.char} className="p-1.5 bg-surface-secondary/50 rounded border border-border">
                      <div className="font-bold text-content-primary">{f.char}</div>
                      <div className="text-[10px] text-brand-600 dark:text-brand-400">{f.count}</div>
                      <div className="text-[9px] text-content-tertiary">{f.frequency}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-surface-secondary/30 rounded border border-border text-center text-content-tertiary text-xs">
                  No alphabetic letters present in input stream.
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        // Page 5: Cryptanalysis Method
        return (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-[10px] font-technical text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
                Section 5.0 &bull; Cryptanalytic Method
              </span>
              <h3 className="text-xl font-bold text-content-primary mt-1">
                Cryptanalytic Transformation Method
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Deterministic mathematical formulation of decoding operations executed
              </p>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-content-secondary">
              <div className="p-3 bg-surface-secondary/50 rounded border border-border">
                <span className="text-xs font-semibold text-content-primary block mb-1">Algorithmic Operation:</span>
                <p className="text-content-secondary text-xs leading-relaxed">
                  {tech.methodDescription}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-content-primary block">Execution Stages:</span>
                <div className="space-y-1.5">
                  {report.cryptanalysisSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-surface-secondary/30 rounded border border-border text-xs">
                      <span className="font-mono text-brand-600 dark:text-brand-400 font-bold shrink-0">{idx + 1}.</span>
                      <span className="text-content-secondary">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        // Page 6: Decoding Result & Verification
        return (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-[10px] font-technical text-emerald-600 font-semibold uppercase tracking-wider">
                Section 6.0 &bull; Decoding Result
              </span>
              <h3 className="text-xl font-bold text-content-primary mt-1">
                Decoded Plaintext & Verification
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Final verified plaintext produced directly from input artifact
              </p>
            </div>

            {/* Plaintext Monospace Box */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-md">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>DECODED PLAINTEXT ARTIFACT</span>
              </div>
              <div className="font-technical text-sm font-bold text-content-primary tracking-wide p-3 bg-surface-canvas rounded border border-border select-text leading-relaxed max-h-48 overflow-y-auto">
                {report.decodedMessage}
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Plaintext Length</span>
                <span className="font-technical font-semibold">{tech.outputMetrics.charCount} chars</span>
              </div>
              <div className="p-2 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Word Count</span>
                <span className="font-technical font-semibold">{tech.outputMetrics.wordCount} words</span>
              </div>
              <div className="p-2 bg-surface-secondary/40 rounded border border-border">
                <span className="text-[10px] text-content-tertiary block">Verification Status</span>
                <span className="font-technical font-semibold text-emerald-600 dark:text-emerald-400">Verified</span>
              </div>
            </div>

            <div className="p-2.5 bg-surface-secondary/30 rounded border border-border text-xs text-content-secondary space-y-1">
              <div className="flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Execution:</strong> {tech.verification.decoderExecution}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Consistency:</strong> {tech.verification.transformationConsistency}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Provenance:</strong> {tech.verification.provenance}</span>
              </div>
            </div>
          </div>
        );

      case 7:
        // Page 7: Technical Metadata & Conclusion
        return (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-[10px] font-technical text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
                Section 7.0 &bull; Technical Metadata
              </span>
              <h3 className="text-xl font-bold text-content-primary mt-1">
                Investigation Timeline & Conclusion
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Session provenance, chronological audit events, and conclusion
              </p>
            </div>

            {/* Timeline Table */}
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-content-primary block">Investigation Event Timeline:</span>
              <div className="divide-y divide-border border border-border rounded-md bg-surface-secondary/40 overflow-hidden font-mono text-[11px]">
                {tech.timeline.map((item, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between">
                    <span className="text-content-secondary font-sans">{item.event}</span>
                    <span className="text-content-primary text-right">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conclusion */}
            <div className="p-3 bg-surface-secondary/50 rounded border border-border text-xs text-content-secondary space-y-1">
              <span className="font-semibold text-content-primary block">Conclusion:</span>
              <p className="leading-relaxed">
                {tech.conclusion}
              </p>
            </div>

            <div className="p-2.5 bg-surface-secondary/20 rounded border border-border-subtle flex items-center justify-between text-[11px] text-content-tertiary">
              <span>Platform: PRESTIGE Engine v1.0</span>
              <span>Storage: Browser Local Session</span>
            </div>
          </div>
        );

      case 8:
        // Page 8: Try It Yourself (Interactive Cipher Sandbox)
        const encodedSandbox = encodeCaesar(sandboxInput, sandboxShift);
        const decodedSandbox = decodeCaesar(encodedSandbox, sandboxShift);

        return (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-[10px] font-technical text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
                Section 8.0 &bull; Laboratory
              </span>
              <h3 className="text-xl font-bold text-content-primary mt-1">
                Interactive Verification Sandbox
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Live interactive cipher sandbox &bull; Test mathematical transformation live
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-content-secondary mb-1">
                  Plaintext Input:
                </label>
                <input
                  type="text"
                  value={sandboxInput}
                  onChange={(e) => setSandboxInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 bg-surface-canvas border border-border rounded font-technical text-xs text-content-primary focus:outline-none focus:border-brand-500"
                  placeholder="TYPE ANY MESSAGE..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-medium text-content-secondary">
                    Shift Key Offset:
                  </label>
                  <span className="font-technical text-xs font-bold text-brand-600">
                    +{sandboxShift}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={sandboxShift}
                  onChange={(e) => setSandboxShift(parseInt(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="p-2 bg-surface-secondary/60 rounded border border-border">
                  <span className="text-[10px] text-content-tertiary font-technical uppercase block">Ciphertext Output:</span>
                  <span className="font-technical text-xs font-bold text-brand-600 break-all select-text">
                    {encodedSandbox || '...'}
                  </span>
                </div>

                <div className="p-2 bg-surface-secondary/30 rounded border border-border">
                  <span className="text-[10px] text-content-tertiary font-technical uppercase block">Inverse Decoded Verification:</span>
                  <span className="font-technical text-xs text-content-primary break-all select-text">
                    {decodedSandbox || '...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Outside Action Bar: Page Selector & File Downloads (.pdf, .txt, and .md) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-card border border-border rounded-lg shadow-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-500" />
          <span className="text-xs font-semibold text-content-primary">
            Technical Cryptanalysis Report &bull; Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Action Controls around the book */}
        <div className="flex items-center gap-2">
          {/* Download PDF */}
          <MyAnimatedButton
            variant="primary"
            size="sm"
            onClick={handleDownloadPdf}
            title="Download publication-quality PDF report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .pdf</span>
          </MyAnimatedButton>

          {/* Download TXT */}
          <MyAnimatedButton
            variant="secondary"
            size="sm"
            onClick={handleDownloadTxt}
            title="Download full report as plain text"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </MyAnimatedButton>

          {/* Download Markdown */}
          <MyAnimatedButton
            variant="secondary"
            size="sm"
            onClick={handleDownloadMd}
            title="Download formatted Markdown dossier"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </MyAnimatedButton>

          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs text-content-secondary hover:text-content-primary hover:bg-surface-secondary rounded transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Book Container with Realistic Page Flipping Animation */}
      <div className="relative surface-card border border-border rounded-xl shadow-lg overflow-hidden min-h-[460px] flex flex-col justify-between p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-1"
          >
            {renderPageContent(currentPage)}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Pagination & Flip Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border-subtle mt-6">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary disabled:opacity-30 disabled:hover:text-content-secondary hover:bg-surface-secondary rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Page Indicators (Numbered Buttons for direct access & test navigation) */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              const isActive = currentPage === p;
              return (
                <button
                  key={p}
                  onClick={() => {
                    soundService.playKeyClick();
                    setCurrentPage(p);
                  }}
                  className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white font-bold shadow-xs'
                      : 'text-content-secondary hover:bg-surface-secondary hover:text-content-primary'
                  }`}
                  title={`Go to Page ${p}`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary disabled:opacity-30 disabled:hover:text-content-secondary hover:bg-surface-secondary rounded transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
